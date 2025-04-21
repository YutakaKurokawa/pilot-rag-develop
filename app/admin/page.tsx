"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, FileText, Upload, Trash2, Edit, Plus, Search, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">管理ダッシュボード</h1>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 border-r bg-gray-50 p-4 hidden md:block">
          <nav className="space-y-2">
            <NavItem
              icon={<BarChart className="h-5 w-5" />}
              label="ダッシュボード"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <NavItem
              icon={<FileText className="h-5 w-5" />}
              label="ナレッジ管理"
              active={activeTab === "knowledge"}
              onClick={() => setActiveTab("knowledge")}
            />
            <NavItem
              icon={<AlertTriangle className="h-5 w-5" />}
              label="セキュリティ"
              active={activeTab === "security"}
              onClick={() => setActiveTab("security")}
            />
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="md:hidden mb-4 grid grid-cols-3">
              <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
              <TabsTrigger value="knowledge">ナレッジ管理</TabsTrigger>
              <TabsTrigger value="security">セキュリティ</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <MetricCard title="総問い合わせ数" value="1,248" change="+12%" period="先月比" />
                <MetricCard title="自動回答率" value="92%" change="+5%" period="先月比" />
                <MetricCard title="平均応答時間" value="1.2秒" change="-0.3秒" period="先月比" />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>最近の問い合わせ</CardTitle>
                  <CardDescription>過去24時間の問い合わせ履歴</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>時間</TableHead>
                        <TableHead>質問</TableHead>
                        <TableHead>回答状態</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentQueries.map((query, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{query.time}</TableCell>
                          <TableCell>{query.question}</TableCell>
                          <TableCell>
                            <Badge variant={query.status === "自動回答" ? "success" : "warning"}>{query.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">ナレッジベース管理</h2>
                <div className="flex gap-2">
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" /> ドキュメントをアップロード
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> FAQ追加
                  </Button>
                </div>
              </div>

              <div className="flex mb-4">
                <Input placeholder="ドキュメントを検索..." className="max-w-sm mr-2" />
                <Button variant="ghost">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>ナレッジベース</CardTitle>
                  <CardDescription>登録されているドキュメント一覧</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>タイトル</TableHead>
                        <TableHead>タイプ</TableHead>
                        <TableHead>更新日</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {knowledgeDocuments.map((doc, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{doc.title}</TableCell>
                          <TableCell>{doc.type}</TableCell>
                          <TableCell>{doc.updated}</TableCell>
                          <TableCell>
                            <Badge variant={doc.status === "有効" ? "success" : "default"}>{doc.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>セキュリティアラート</CardTitle>
                  <CardDescription>検出された潜在的なセキュリティリスク</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>時間</TableHead>
                        <TableHead>タイプ</TableHead>
                        <TableHead>内容</TableHead>
                        <TableHead>リスクレベル</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityAlerts.map((alert, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{alert.time}</TableCell>
                          <TableCell>{alert.type}</TableCell>
                          <TableCell>{alert.content}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                alert.risk === "高" ? "destructive" : alert.risk === "中" ? "warning" : "default"
                              }
                            >
                              {alert.risk}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>セキュリティ設定</CardTitle>
                  <CardDescription>プロンプトインジェクション対策と監視設定</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <SecuritySetting
                      title="プロンプトインジェクション検出"
                      description="不正なプロンプト操作を検出して防止します"
                      enabled={true}
                    />
                    <SecuritySetting
                      title="危険キーワードフィルタリング"
                      description="特定のキーワードを含むメッセージをブロックします"
                      enabled={true}
                    />
                    <SecuritySetting
                      title="セキュリティログ記録"
                      description="すべてのセキュリティイベントを記録します"
                      enabled={true}
                    />
                    <SecuritySetting
                      title="自動エスカレーション"
                      description="高リスクの問い合わせを自動的にエスカレーションします"
                      enabled={false}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      className={`flex items-center space-x-2 w-full p-2 rounded-md transition-colors ${
        active ? "bg-blue-100 text-blue-700" : "hover:bg-gray-200"
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function MetricCard({ title, value, change, period }) {
  const isPositive = change.startsWith("+")

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <div className="flex items-center mt-1">
          <span className={isPositive ? "text-green-500" : "text-red-500"}>{change}</span>
          <span className="text-gray-500 text-sm ml-1">{period}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function SecuritySetting({ title, description, enabled }) {
  return (
    <div className="flex justify-between items-start p-4 border rounded-lg">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex items-center h-6">
        <input
          type="checkbox"
          checked={enabled}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          readOnly
        />
      </div>
    </div>
  )
}

// サンプルデータ
const recentQueries = [
  { time: "14:25", question: "料金プランについて教えてください", status: "自動回答" },
  { time: "13:10", question: "アカウントの削除方法を教えてください", status: "自動回答" },
  { time: "12:45", question: "支払い方法を変更したいです", status: "自動回答" },
  { time: "11:30", question: "システムエラーが発生しています", status: "エスカレーション" },
  { time: "10:15", question: "製品の使い方がわかりません", status: "自動回答" },
]

const knowledgeDocuments = [
  { title: "製品マニュアル", type: "PDF", updated: "2025/04/15", status: "有効" },
  { title: "よくある質問", type: "FAQ", updated: "2025/04/18", status: "有効" },
  { title: "料金プラン", type: "ウェブページ", updated: "2025/04/10", status: "有効" },
  { title: "API ドキュメント", type: "マークダウン", updated: "2025/04/05", status: "有効" },
  { title: "旧バージョンマニュアル", type: "PDF", updated: "2025/03/20", status: "無効" },
]

const securityAlerts = [
  {
    time: "2025/04/20 09:15",
    type: "プロンプトインジェクション",
    content: "システムプロンプトの取得を試みる質問",
    risk: "高",
  },
  { time: "2025/04/19 16:30", type: "危険キーワード", content: "禁止されたコンテンツに関する質問", risk: "中" },
  { time: "2025/04/18 11:45", type: "異常なリクエスト頻度", content: "短時間での大量リクエスト", risk: "中" },
  { time: "2025/04/17 14:20", type: "不審なパターン", content: "システム情報を探るような質問パターン", risk: "低" },
]
