import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"
import { generateEmbedding } from "ai"

// 実際の実装では環境変数から取得します
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// テキストからエンベディングを生成する関数
export async function getEmbedding(text: string) {
  try {
    const { embedding } = await generateEmbedding({
      model: openai("text-embedding-3-small"),
      input: text,
    })

    return embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

// クエリに関連するドキュメントを取得する関数
export async function getRelevantDocuments(query: string, limit = 5) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // クエリのエンベディングを生成
    const embedding = await getEmbedding(query)

    // ベクトル検索を実行
    // 注: 実際の実装ではSupabaseのpgvectorを使用します
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    })

    if (error) {
      console.error("Error fetching relevant documents:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in getRelevantDocuments:", error)
    throw error
  }
}

// ドキュメントをナレッジベースに追加する関数
export async function addDocumentToKnowledgeBase(document: {
  title: string
  content: string
  type: string
  metadata?: any
}) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // ドキュメントのエンベディングを生成
    const embedding = await getEmbedding(document.title + " " + document.content)

    // ドキュメントとそのエンベディングを保存
    const { data, error } = await supabase
      .from("knowledge_base")
      .insert([
        {
          title: document.title,
          content: document.content,
          type: document.type,
          embedding,
          metadata: document.metadata || {},
          status: "有効",
        },
      ])
      .select()

    if (error) {
      console.error("Error adding document to knowledge base:", error)
      throw error
    }

    return data[0]
  } catch (error) {
    console.error("Error in addDocumentToKnowledgeBase:", error)
    throw error
  }
}

// 回答の整合性をチェックする関数
export function checkAnswerConsistency(answer: string, documents: any[]) {
  // 実際の実装では、回答が関連ドキュメントの内容と整合しているかを
  // より高度なアルゴリズムでチェックします

  // 簡易的な実装例
  const documentContents = documents.map((doc) => doc.content).join(" ")
  const keyPhrases = answer.split(". ")

  let consistencyScore = 0
  for (const phrase of keyPhrases) {
    if (phrase.length > 10 && documentContents.includes(phrase.substring(0, 10))) {
      consistencyScore++
    }
  }

  return {
    isConsistent: consistencyScore / keyPhrases.length > 0.5,
    score: consistencyScore / keyPhrases.length,
  }
}
