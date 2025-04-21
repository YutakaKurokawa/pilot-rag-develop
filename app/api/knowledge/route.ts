import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 実際の実装では環境変数から取得します
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// ナレッジベースの取得API
export async function GET(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const type = searchParams.get("type") || ""

    // Supabaseからデータを取得するクエリを構築
    let dbQuery = supabase.from("knowledge_base").select("*")

    if (query) {
      dbQuery = dbQuery.ilike("title", `%${query}%`)
    }

    if (type) {
      dbQuery = dbQuery.eq("type", type)
    }

    const { data, error } = await dbQuery.order("updated_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: data })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// ナレッジベースへのドキュメント追加API
export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await request.json()

    // 必須フィールドの検証
    if (!body.title || !body.content || !body.type) {
      return NextResponse.json({ error: "Title, content, and type are required" }, { status: 400 })
    }

    // ドキュメントをデータベースに挿入
    const { data, error } = await supabase
      .from("knowledge_base")
      .insert([
        {
          title: body.title,
          content: body.content,
          type: body.type,
          status: body.status || "有効",
          metadata: body.metadata || {},
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ドキュメントのエンベディングを生成して保存する処理
    // 実際の実装では、OpenAIなどのAPIを使用してエンベディングを生成し、
    // pgvectorなどを使用して保存します

    return NextResponse.json({ success: true, document: data[0] })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
