import { NextRequest, NextResponse } from 'next/server';
import { createDb, faqData, faqThreshold } from '@/db';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Generate a trace ID for request tracking
function generateTraceId(): string {
  return `faq-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

// GET handler for FAQ search
export async function GET(request: NextRequest) {
  const traceId = generateTraceId();
  const startTime = Date.now();
  let queryParam = '';
  
  try {
    // Get query parameter
    const searchParams = request.nextUrl.searchParams;
    queryParam = searchParams.get('query') || '';
    
    // Validate query
    if (!queryParam || queryParam.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required', traceId },
        { status: 400 }
      );
    }
    
    // Create database connection
    const db = createDb();
    
    // Get current threshold
    const thresholdResult = await faqThreshold.getThreshold(db);
    const threshold = thresholdResult ? thresholdResult.threshold_value : 0.4;
    
    // Search FAQs using text search
    const searchResults = await faqData.search(db, queryParam);
    
    if (!searchResults || searchResults.length === 0) {
      console.log(`[${traceId}] No FAQ results found for query: ${queryParam}`);
    }
    
    // Calculate simple similarity score (placeholder for actual ranking)
    const scoredResults = (searchResults || []).map((result: any) => {
      // This is a simplified scoring mechanism - in production use proper text similarity
      const combinedText = `${result.question_text} ${result.answer_text}`.toLowerCase();
      const queryTerms = queryParam.toLowerCase().split(/\s+/);
      
      // Count term occurrences
      let matches = 0;
      for (const term of queryTerms) {
        if (term.length > 2 && combinedText.includes(term)) {
          matches++;
        }
      }
      
      // Calculate score (0-1)
      const score = queryTerms.length > 0 ? matches / queryTerms.length : 0;
      
      return {
        ...result,
        score
      };
    }).sort((a: any, b: any) => b.score - a.score);
    
    // Check if top result exceeds threshold
    if (scoredResults.length > 0 && scoredResults[0].score >= threshold) {
      // Direct FAQ hit
      return NextResponse.json({
        answer: scoredResults[0].answer_text,
        source: 'FAQ',
        score: scoredResults[0].score,
        traceId
      });
    } else {
      // Fallback to LLM
      // Prepare context from search results
      let context = '';
      if (scoredResults.length > 0) {
        // Limit context to 400 characters as specified in the design
        const contextItems = scoredResults.map((r: any) => 
          `Q: ${r.question_text}\nA: ${r.answer_text}`
        ).join('\n\n');
        
        context = contextItems.length > 400 
          ? contextItems.substring(0, 397) + '...' 
          : contextItems;
      }
      
      // Generate LLM response using the same approach as in chat API
      const systemPrompt = `
あなたは企業のAIサポートアシスタントです。
以下のコンテキスト情報を参考に、ユーザーの質問に丁寧に回答してください。

コンテキスト情報:
${context}

回答の際の注意点:
1. コンテキスト情報に含まれる内容のみを使用して回答してください。
2. 情報がない場合は、「その情報は現在持ち合わせていません」と正直に伝えてください。
3. 回答は簡潔かつ丁寧な日本語で行ってください。
`;

      // Use the streamText function to get a response
      const result = streamText({
        model: openai("gpt-4o"),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: queryParam }
        ],
      });
      
      // Return the response directly
      return result.toDataStreamResponse();
    }
  } catch (error) {
    console.error(`[${traceId}] Error processing FAQ request:`, error);
    
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  } finally {
    // Log request metrics
    const latency = Date.now() - startTime;
    console.log(JSON.stringify({
      traceId,
      endpoint: '/api/faq',
      query: queryParam,
      latency,
      timestamp: new Date().toISOString()
    }));
  }
}

// POST handler for FAQ creation (admin only)
export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  
  try {
    // Parse request body
    const body = await request.json();
    const { question_text, answer_text, category } = body;
    
    // Validate required fields
    if (!question_text || !answer_text) {
      return NextResponse.json(
        { error: 'question_text and answer_text are required', traceId },
        { status: 400 }
      );
    }
    
    // Create database connection
    const db = createDb();
    
    // Check for duplicate question
    const searchResults = await faqData.search(db, question_text);
    const existingFaq = searchResults.find((item: any) => 
      item.question_text.toLowerCase() === question_text.toLowerCase()
    );
    
    if (existingFaq) {
      return NextResponse.json(
        { error: 'A FAQ with this question already exists', traceId },
        { status: 409 }
      );
    }
    
    // Insert new FAQ
    const result = await faqData.insert(db, {
      question_text,
      answer_text,
      category
    });
    
    return NextResponse.json(
      { id: result.id, traceId },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${traceId}] Error creating FAQ:`, error);
    
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
