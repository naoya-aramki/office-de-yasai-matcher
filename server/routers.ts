import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getAllCases } from "./db";
import { z } from "zod";

// マッチングロジック
function calculateMatchScore(
  prospectIndustry: string,
  prospectEmployeeCount: number | null,
  prospectChallenges: string,
  caseIndustry: string | null,
  caseEmployeeCount: number | null,
  caseChallenges: string[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 業界マッチング（30点）
  if (caseIndustry && prospectIndustry === caseIndustry) {
    score += 30;
    reasons.push(`同じ業界（${prospectIndustry}）の導入実績があります`);
  } else if (caseIndustry) {
    // 部分一致
    if (caseIndustry.includes(prospectIndustry) || prospectIndustry.includes(caseIndustry)) {
      score += 15;
      reasons.push(`類似業界（${caseIndustry}）の導入実績があります`);
    }
  }

  // 従業員数マッチング（40点）
  if (prospectEmployeeCount !== null && caseEmployeeCount !== null) {
    const diff = Math.abs(prospectEmployeeCount - caseEmployeeCount);
    const ratio = diff / Math.max(prospectEmployeeCount, caseEmployeeCount);
    
    if (ratio < 0.2) {
      // 20%以内の差
      score += 40;
      reasons.push(`従業員数が近い規模（${caseEmployeeCount}名）の企業です`);
    } else if (ratio < 0.5) {
      // 50%以内の差
      score += 27;
      reasons.push(`従業員数が比較的近い規模（${caseEmployeeCount}名）の企業です`);
    } else if (ratio < 1.0) {
      // 100%以内の差
      score += 13;
      reasons.push(`従業員数は${caseEmployeeCount}名の企業です`);
    }
  }

  // 課題マッチング（30点）
  const prospectChallengesLower = prospectChallenges.toLowerCase();
  let challengeMatchCount = 0;
  const matchedChallenges: string[] = [];

  for (const challenge of caseChallenges) {
    const challengeLower = challenge.toLowerCase();
    
    // キーワードベースのマッチング
    const keywords = [
      '健康', '食事', '野菜', '栄養', '食生活', '福利厚生',
      'コミュニケーション', '満足度', '採用', 'エンゲージメント',
      '食環境', '健康経営'
    ];

    for (const keyword of keywords) {
      if (prospectChallengesLower.includes(keyword) && challengeLower.includes(keyword)) {
        challengeMatchCount++;
        matchedChallenges.push(challenge);
        break;
      }
    }
  }

  if (challengeMatchCount > 0) {
    score += Math.min(30, challengeMatchCount * 10);
    reasons.push(`類似の課題（${matchedChallenges.slice(0, 2).join('、')}）を抱えていました`);
  }

  return { score, reasons };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  cases: router({
    // 全事例を取得（認証なし）
    getAll: publicProcedure.query(async () => {
      try {
        const allCases = await getAllCases();
        return allCases.map(c => {
          try {
            return {
              ...c,
              challenges: c.challenges ? JSON.parse(c.challenges) : [],
              reasons: c.reasons ? JSON.parse(c.reasons) : [],
              effects: c.effects ? JSON.parse(c.effects) : [],
            };
          } catch (parseError) {
            console.error("[Cases] Failed to parse JSON for case:", c.id, parseError);
            return {
              ...c,
              challenges: [],
              reasons: [],
              effects: [],
            };
          }
        });
      } catch (error) {
        console.error("[Cases] Failed to get all cases:", error);
        throw new Error(`データの取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

    // マッチング実行（認証なし）
    match: publicProcedure
      .input(z.object({
        industry: z.string(),
        employeeCount: z.number().nullable(),
        challenges: z.string(),
        excludeIds: z.array(z.number()).optional(), // 除外するID
      }))
      .mutation(async ({ input }) => {
        try {
          const allCases = await getAllCases();
          
          if (allCases.length === 0) {
            throw new Error('導入事例データが見つかりません。データベース接続を確認してください。');
          }

        // 除外IDを考慮
        const excludeIds = input.excludeIds || [];
        const filteredCases = allCases.filter(c => !excludeIds.includes(c.id));

        if (filteredCases.length === 0) {
          throw new Error('これ以上のマッチング候補がありません');
        }

        // 各事例とのマッチングスコアを計算
        const scoredCases = filteredCases.map(c => {
          try {
            const caseChallenges = c.challenges ? JSON.parse(c.challenges) : [];
            const { score, reasons } = calculateMatchScore(
              input.industry,
              input.employeeCount,
              input.challenges,
              c.industry,
              c.employeeCount,
              caseChallenges
            );

            return {
              case: {
                ...c,
                challenges: caseChallenges,
                reasons: c.reasons ? JSON.parse(c.reasons) : [],
                effects: c.effects ? JSON.parse(c.effects) : [],
              },
              score,
              matchReasons: reasons,
            };
          } catch (parseError) {
            console.error("[Cases] Failed to parse JSON for case:", c.id, parseError);
            // パースエラーが発生した場合でもスコア0で処理を続行
            return {
              case: {
                ...c,
                challenges: [],
                reasons: [],
                effects: [],
              },
              score: 0,
              matchReasons: [],
            };
          }
        });

        // スコアでソートして最高スコアの事例を返す
        scoredCases.sort((a, b) => b.score - a.score);
        const bestMatch = scoredCases[0];

        return {
          matchedCase: bestMatch.case,
          matchScore: bestMatch.score,
          matchReasons: bestMatch.matchReasons,
        };
      } catch (error) {
        console.error("[Cases] Match error:", error);
        throw new Error(`マッチング処理に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      }),
  }),
});

export type AppRouter = typeof appRouter;
