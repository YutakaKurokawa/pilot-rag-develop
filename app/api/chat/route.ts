import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// FAQ APIを使用して関連情報を取得する関数
async function getFAQResponse(query: string) {
  try {
    // FAQ APIを呼び出し
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/faq?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`FAQ API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      answer: data.answer,
      source: data.source, // 'FAQ' or 'AI'
      score: data.score,
      traceId: data.traceId
    };
  } catch (error) {
    console.error('Error fetching from FAQ API:', error);
    return null;
  }
}

// RAGシステムのためのコンテキスト取得関数
async function getRelevantDocuments(query: string) {
  // FAQ APIからの応答を試みる
  const faqResponse = await getFAQResponse(query);
  
  // FAQ APIから有効な応答があれば、それを使用
  if (faqResponse) {
    return [
      {
        title: "FAQ回答",
        content: faqResponse.answer,
        url: "/faq",
        source: faqResponse.source,
        score: faqResponse.score,
        traceId: faqResponse.traceId
      }
    ];
  }
  
  // FAQ APIからの応答がない場合は、従来のRAG検索を使用
  return [
    {
      title: "よくある質問",
      content: "製品の使い方については、ユーザーマニュアルをご参照ください。",
      url: "/docs/faq",
      source: "RAG"
    },
    {
      title: "料金プラン",
      content: "基本プランは月額8,000円から、プレミアムプランは月額15,000円からご利用いただけます。",
      url: "/docs/pricing",
      source: "RAG"
    },
  ];
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  // ユーザーの最新のメッセージを取得
  const userMessage = messages.filter((m: { role: string; content: string }) => m.role === "user").pop()?.content || ""

  // 関連ドキュメントを取得
  const relevantDocs = await getRelevantDocuments(userMessage)
  
  // FAQ APIから直接回答が得られた場合
  const faqDoc = relevantDocs.find(doc => doc.source === 'FAQ');
  if (faqDoc) {
    // FAQ APIからの直接回答をストリーミング形式で返す
    // 回答の前に「FAQ回答:」を追加して、UIでFAQバッジを表示できるようにする
    const faqContent = `FAQ回答:\n\n${faqDoc.content}`;
    const result = streamText({
      model: openai("gpt-4o"),
      messages: [{ role: "assistant", content: faqContent }],
    });
    
    return result.toDataStreamResponse();
  }
  
  // FAQ APIからAI生成回答が得られた場合、またはRAGシステムからの回答の場合
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
5. FAQからの情報がある場合は、それを優先して回答に使用してください。
`

  // OpenAIのモデルを使用してテキスト生成
  const result = streamText({
    model: openai("gpt-4o"),
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  })

  return result.toDataStreamResponse()
}
