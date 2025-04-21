import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquare, Database, Shield, BarChart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Support Platform</h1>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="font-medium">
              ホーム
            </Link>
            <Link href="/chat" className="font-medium">
              チャットボット
            </Link>
            <Link href="/admin" className="font-medium">
              管理画面
            </Link>
          </nav>
          <Button>ログイン</Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto max-w-5xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">AI を活用した 24 時間対応の問い合わせ自動化</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              RAG チャットボットで顧客満足度の向上と運用コスト削減を実現
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                チャットボットを試す <ArrowRight size={16} />
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                詳細を見る
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-16">主要な機能</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10 text-blue-500" />}
                title="RAG チャットボット"
                description="エンベディング検索と整合性チェックで正確な回答を提供。24時間いつでも対応可能。"
              />
              <FeatureCard
                icon={<Database className="h-10 w-10 text-green-500" />}
                title="ナレッジ管理"
                description="API連携とスクレイピングで最新ドキュメントを自動取得。手動アップロードも可能。"
              />
              <FeatureCard
                icon={<Shield className="h-10 w-10 text-red-500" />}
                title="セキュリティ対策"
                description="プロンプトインジェクション対策と危険メッセージ検知で安全な運用を実現。"
              />
              <FeatureCard
                icon={<BarChart className="h-10 w-10 text-purple-500" />}
                title="管理ダッシュボード"
                description="問い合わせログの分析と FAQ の即時更新が可能な直感的な管理画面。"
              />
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gray-50">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-16">導入メリット</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <BenefitCard
                number="01"
                title="対応時間の削減"
                description="問い合わせ対応を90%自動化し、オペレーターの工数を大幅に削減します。"
              />
              <BenefitCard
                number="02"
                title="24時間対応"
                description="夜間や休日でも待ち時間ゼロで顧客からの問い合わせに対応できます。"
              />
              <BenefitCard
                number="03"
                title="常に最新の情報"
                description="ナレッジベースが自動的に更新され、常に最新の情報を提供します。"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">AI Support Platform</h3>
              <p className="text-gray-400">AI を活用した 24 時間対応の問い合わせ自動化プラットフォーム</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">リンク</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white">
                    ホーム
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="text-gray-400 hover:text-white">
                    チャットボット
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="text-gray-400 hover:text-white">
                    管理画面
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">お問い合わせ</h4>
              <p className="text-gray-400">ご質問やお問い合わせは下記までお願いします。</p>
              <p className="text-gray-400 mt-2">support@ai-platform.example.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 AI Support Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function BenefitCard({ number, title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="text-3xl font-bold text-blue-500 mb-4">{number}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
