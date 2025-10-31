import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, Building2, Users, Target, ExternalLink, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Home() {
  // Require authentication - redirect to login if not authenticated
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show login prompt if not authenticated (fallback, should redirect automatically)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>認証が必要です</CardTitle>
            <CardDescription>
              @officedeyasai.jpのメールアドレスでログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                const loginUrl = getLoginUrl();
                if (loginUrl && loginUrl !== "#") {
                  window.location.href = loginUrl;
                } else {
                  toast.error("ログインURLが設定されていません。環境変数を確認してください。");
                }
              }}
              className="w-full"
            >
              ログイン
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [challenges, setChallenges] = useState("");
  const [matchResult, setMatchResult] = useState<any>(null);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);

  const matchMutation = trpc.cases.match.useMutation({
    onSuccess: (data) => {
      setMatchResult(data);
      toast.success("マッチングが完了しました");
    },
    onError: (error) => {
      toast.error(`エラーが発生しました: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!industry || !challenges) {
      toast.error("業界と課題は必須項目です");
      return;
    }

    setExcludedIds([]);
    matchMutation.mutate({
      industry,
      employeeCount: employeeCount ? parseInt(employeeCount) : null,
      challenges,
      excludeIds: [],
    });
  };

  const handleReset = () => {
    setIndustry("");
    setEmployeeCount("");
    setChallenges("");
    setMatchResult(null);
    setExcludedIds([]);
  };

  const handleNextMatch = () => {
    if (!matchResult) return;
    
    // 現在の結果を除外リストに追加
    const newExcludedIds = [...excludedIds, matchResult.matchedCase.id];
    setExcludedIds(newExcludedIds);
    
    // 次の候補を検索
    matchMutation.mutate({
      industry,
      employeeCount: employeeCount ? parseInt(employeeCount) : null,
      challenges,
      excludeIds: newExcludedIds,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* ヘッダー */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="OFFICE DE YASAI" className="h-12" />
            <div className="border-l pl-3 ml-2">
              <p className="text-sm text-muted-foreground">導入事例マッチングツール</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* 入力フォーム */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                見込み顧客の状況を入力
              </CardTitle>
              <CardDescription>
                業界、従業員数、課題を入力してください。より詳細に入力いただくと、精度の高いマッチングが可能です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 業界選択 */}
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      業界 <span className="text-destructive">*</span>
                    </Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="業界を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="医療・ヘルスケア">医療・ヘルスケア</SelectItem>
                        <SelectItem value="IT・テクノロジー">IT・テクノロジー</SelectItem>
                        <SelectItem value="製造・建設">製造・建設</SelectItem>
                        <SelectItem value="不動産">不動産</SelectItem>
                        <SelectItem value="金融">金融</SelectItem>
                        <SelectItem value="小売・流通">小売・流通</SelectItem>
                        <SelectItem value="飲食・食品">飲食・食品</SelectItem>
                        <SelectItem value="ホテル・観光">ホテル・観光</SelectItem>
                        <SelectItem value="広告・マーケティング">広告・マーケティング</SelectItem>
                        <SelectItem value="人材サービス">人材サービス</SelectItem>
                        <SelectItem value="教育">教育</SelectItem>
                        <SelectItem value="その他">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 従業員数 */}
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      従業員数（名）
                    </Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      placeholder="例: 50"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                {/* 課題 */}
                <div className="space-y-2">
                  <Label htmlFor="challenges">
                    課題・ニーズ <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="challenges"
                    placeholder="例: 従業員の健康的な食事を支援したい、社内コミュニケーションを活性化したい、福利厚生を充実させたい"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* ボタン */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={matchMutation.isPending}
                  >
                    {matchMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        マッチング中...
                      </>
                    ) : (
                      "最適な事例を探す"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={matchMutation.isPending}
                  >
                    リセット
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* マッチング結果 */}
          {matchResult && (
            <Card className="shadow-lg border-2 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="w-6 h-6" />
                  マッチング結果
                </CardTitle>
                <CardDescription>
                  あなたの状況に最も近い導入事例が見つかりました
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* 企業情報 */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {matchResult.matchedCase.companyName}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {matchResult.matchedCase.industry && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                        <Building2 className="w-3 h-3 mr-1" />
                        {matchResult.matchedCase.industry}
                      </span>
                    )}
                    {matchResult.matchedCase.employeeCount && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground">
                        <Users className="w-3 h-3 mr-1" />
                        従業員数: {matchResult.matchedCase.employeeCount}名
                      </span>
                    )}
                    {matchResult.matchedCase.usageScale && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        利用規模: {matchResult.matchedCase.usageScale}
                      </span>
                    )}
                  </div>
                  {matchResult.matchedCase.url && (
                    <a
                      href={matchResult.matchedCase.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      詳細を見る
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* マッチング理由 */}
                <div className="bg-green-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    この事例がマッチした理由
                  </h4>
                  <ul className="space-y-2">
                    {matchResult.matchReasons.map((reason: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-sm text-muted-foreground">
                      マッチングスコア: <span className="font-bold text-primary">{matchResult.matchScore}</span> / 100
                    </p>
                  </div>
                </div>

                {/* 導入の課題 */}
                {matchResult.matchedCase.challenges.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">導入前の課題</h4>
                    <ul className="space-y-1">
                      {matchResult.matchedCase.challenges.map((challenge: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0">
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 導入の決め手 */}
                {matchResult.matchedCase.reasons.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">導入の決め手</h4>
                    <ul className="space-y-1">
                      {matchResult.matchedCase.reasons.map((reason: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 導入効果 */}
                {matchResult.matchedCase.effects.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">導入効果</h4>
                    <ul className="space-y-1">
                      {matchResult.matchedCase.effects.map((effect: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0">
                          {effect}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 他のマッチング事例を見るボタン */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleNextMatch}
                    disabled={matchMutation.isPending}
                  >
                    {matchMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        検索中...
                      </>
                    ) : (
                      <>
                        他のマッチング事例を見る
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>[KOMPEITO]</p>
        </div>
      </footer>
    </div>
  );
}
