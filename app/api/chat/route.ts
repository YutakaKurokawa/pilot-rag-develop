import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// RAGシステムのためのコンテキスト取得関数
async function getRelevantDocuments(query: string) {
  // 実際の実装では、Supabaseのpgvectorなどを使用して
  // エンベディング検索を行います

  // サンプルの関連ドキュメント
  return [
    {
      title: "よくある質問",
      content: "製品の使い方については、ユーザーマニュアルをご参照ください。",
      url: "/docs/faq",
    },
    {
      title: "料金プラン",
      content: "基本プランは月額8,000円から、プレミアムプランは月額15,000円からご利用いただけます。",
      url: "/docs/pricing",
    },
  ]
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  // ユーザーの最新のメッセージを取得
  const userMessage = messages.filter((m) => m.role === "user").pop()?.content || ""

  // 関連ドキュメントを取得
  const relevantDocs = await getRelevantDocuments(userMessage)

  // コンテキスト情報を作成
  const context = relevantDocs.map((doc) => `${doc.title}:\n${doc.content}\n(出典: ${doc.url})`).join("\n\n")

  // システムプロンプトを作成
  const systemPrompt = `
あなたは企業のAIサポートアシスタントです。
以下のコンテキスト情報を参考に、ユーザーの質問に丁寧に回答してください。

コンテキスト情報:
${context}

回答の際の注意点:
1. コンテキスト情報に含まれる内容のみを使用して回答してください。
2. 情報がない場合は、「その情報は現在持ち合わせていません」と正直に伝えてください。
3. 回答は簡潔かつ丁寧な日本語で行ってください。
4. 必要に応じて、参照元のドキュメントURLを案内してください。
`

  // OpenAIのモデルを使用してテキスト生成
  const result = streamText({
    model: openai("gpt-4o"),
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  })

  return result.toDataStreamResponse()
}
