import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getAllCases, insertProspect } from "./db";
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
      score += 20; // 15→20に増加
      reasons.push(`類似業界（${caseIndustry}）の導入実績があります`);
    } else {
      // 業界が異なってもベース点を付与
      score += 5;
      reasons.push(`導入実績があります`);
    }
  } else {
    // 業界情報がなくてもベース点を付与
    score += 5;
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
      score += 30; // 27→30に増加
      reasons.push(`従業員数が比較的近い規模（${caseEmployeeCount}名）の企業です`);
    } else if (ratio < 1.0) {
      // 100%以内の差
      score += 20; // 13→20に増加
      reasons.push(`従業員数は${caseEmployeeCount}名の企業です`);
    } else if (ratio < 2.0) {
      // 200%以内の差
      score += 10; // 5→10に増加
      reasons.push(`従業員数は${caseEmployeeCount}名の企業です`);
    } else if (ratio < 5.0) {
      // 500%以内の差でも点数を付与
      score += 5;
      reasons.push(`従業員数は${caseEmployeeCount}名の企業です`);
    } else {
      // それ以上でも最低限の点数を付与
      score += 3;
    }
  } else {
    // 従業員数情報がなくてもベース点を付与
    score += 5;
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

    let matched = false;
    for (const keyword of keywords) {
      if (prospectChallengesLower.includes(keyword) && challengeLower.includes(keyword)) {
        challengeMatchCount++;
        matchedChallenges.push(challenge);
        matched = true;
        break;
      }
    }
    
    // 改善：キーワードが一致しない場合でも、文字列の類似度をチェック
    if (!matched && prospectChallenges.length > 0 && challenge.length > 0) {
      // 簡単な文字列類似度チェック（共通文字の割合）
      const prospectWords = prospectChallengesLower.split(/[\s、。、,\.]+/).filter(w => w.length > 1);
      const challengeWords = challengeLower.split(/[\s、。、,\.]+/).filter(w => w.length > 1);
      const commonWords = prospectWords.filter(w => challengeWords.includes(w));
      
      // 共通単語の閾値を下げて、より多くのケースで点数を付与（0.3→0.2）
      if (commonWords.length > 0 && commonWords.length >= Math.min(prospectWords.length, challengeWords.length) * 0.2) {
        challengeMatchCount += 0.7; // 0.5→0.7に増加（10点の70%）
        if (matchedChallenges.length < 2) {
          matchedChallenges.push(challenge);
        }
      } else if (commonWords.length > 0) {
        // 共通単語が1つでもあれば部分点を付与
        challengeMatchCount += 0.3; // 最低限の点数
        if (matchedChallenges.length < 2) {
          matchedChallenges.push(challenge);
        }
      }
    }
  }

  if (challengeMatchCount > 0) {
    // 改善：小数点も考慮してスコア計算、より多くの点数を付与
    const baseScore = Math.floor(challengeMatchCount) * 10;
    const decimalPart = challengeMatchCount % 1;
    let bonusScore = 0;
    if (decimalPart >= 0.7) {
      bonusScore = 7; // 0.7以上で7点
    } else if (decimalPart >= 0.5) {
      bonusScore = 5; // 0.5以上で5点
    } else if (decimalPart >= 0.3) {
      bonusScore = 3; // 0.3以上で3点
    }
    score += Math.min(30, baseScore + bonusScore);
    reasons.push(`類似の課題（${matchedChallenges.slice(0, 2).join('、')}）を抱えていました`);
  } else {
    // 課題が一致しなくてもベース点を付与
    score += 5;
  }

  // ベーススコアを追加（最低でも10点は保証）
  if (score < 10) {
    score = 10;
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
        console.log("[Cases] Match request received:", {
          industry: input.industry,
          employeeCount: input.employeeCount,
          challenges: input.challenges?.substring(0, 50) + "...",
          excludeIds: input.excludeIds,
        });
        
        try {
          console.log("[Cases] Fetching all cases from database...");
          const allCases = await getAllCases();
          console.log(`[Cases] Retrieved ${allCases.length} cases from database`);
          
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

        // 見込み顧客の入力内容をデータベースに保存
        try {
          await insertProspect({
            industry: input.industry,
            employeeCount: input.employeeCount,
            challenges: input.challenges,
            matchedCaseId: bestMatch.case.id,
            matchScore: bestMatch.score,
          });
          console.log("[Cases] Prospect data saved successfully");
        } catch (saveError) {
          // 保存に失敗してもマッチング結果は返す（ログのみ出力）
          console.error("[Cases] Failed to save prospect data:", saveError);
        }

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
