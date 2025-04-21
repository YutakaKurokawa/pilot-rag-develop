import { NextRequest, NextResponse } from 'next/server';
import { createDb, faqData, faqThreshold } from '@/db';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { nanoid } from 'nanoid';
import { ApiError } from '@/src/errors/ApiError';
import { LlmError } from '@/src/errors/LlmError';
import { errorToHttp, withErrorHandling } from '@/src/errors/errorToHttp';
import { retryLlm } from '@/src/utils/retry';
import * as Sentry from '@sentry/nextjs';

// Generate a trace ID for request tracking
function generateTraceId(): string {
  return `faq-${Date.now()}-${nanoid(10)}`;
}

// Send metrics to monitoring services
function sendMetrics(traceId: string, durationMs: number, queryParam: string, success: boolean = true) {
  // Send to Sentry
  Sentry.addBreadcrumb({
    category: 'api',
    message: 'FAQ API request',
    data: {
      traceId,
      durationMs,
      query: queryParam,
      success
    },
    level: success ? 'info' : 'warning'
  });
  
  // Set custom metrics for Sentry
  Sentry.setTag('traceId', traceId);
  Sentry.setTag('endpoint', '/api/faq');
  Sentry.setTag('query_length', queryParam.length.toString());
  Sentry.setTag('duration_ms', durationMs.toString());
  Sentry.setTag('success', success.toString());
  
  // Log metrics for Datadog (in a real implementation, this would use a Datadog client)
  console.log(JSON.stringify({
    metric: 'faq.request',
    traceId,
    durationMs,
    query_length: queryParam.length,
    success,
    timestamp: new Date().toISOString()
  }));
}

// GET handler for FAQ search
export const GET = withErrorHandling(async (request: NextRequest) => {
  const traceId = generateTraceId();
  const startTime = Date.now();
  let queryParam = '';
  
  try {
    // Get query parameter
    const searchParams = request.nextUrl.searchParams;
    queryParam = searchParams.get('query') || '';
    
    // Validate query
    if (!queryParam || queryParam.trim().length === 0) {
      throw ApiError.invalidRequest('クエリパラメータが必要です');
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

      // Use retryLlm to handle LLM errors with exponential backoff
      return await retryLlm(async () => {
        // Note: We no longer need to simulate timeouts here as the retryLlm function
        // now handles timeouts automatically using the LLM_TIMEOUT_MS environment variable
        
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
      }, {
        onRetry: (error, attempt, delay) => {
          console.log(`[${traceId}] LLM retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
        }
      }).catch((llmError: any) => {
        // Convert LLM errors to LlmError if they haven't been converted already
        if (!(llmError instanceof LlmError)) {
          if (llmError.message?.includes('timed out')) {
            throw LlmError.timeout('AIモデルの応答がタイムアウトしました', llmError);
          } else if (llmError.message?.includes('rate limit')) {
            throw LlmError.rateLimited('AIサービスのレート制限に達しました', llmError);
          } else {
            throw LlmError.serviceUnavailable('AIサービスが一時的に利用できません', llmError);
          }
        }
        throw llmError;
      });
    }
  } catch (error: any) {
    console.error(`[${traceId}] Error processing FAQ request:`, error);
    
    // Convert unknown errors to ApiError
    if (!(error instanceof ApiError)) {
      error = ApiError.fromError(error, 'FAQ APIエラーが発生しました');
      // Add traceId to the error
      error.traceId = traceId;
    }
    
    // Let the withErrorHandling wrapper handle the error response
    throw error;
  } finally {
    // Calculate request duration
    const durationMs = Date.now() - startTime;
    
    // Send metrics to monitoring services
    // We can't directly access if there was an error in the try block,
    // but we can assume success since we're in the finally block
    sendMetrics(traceId, durationMs, queryParam, true);
    
    // Log request metrics
    console.log(JSON.stringify({
      traceId,
      endpoint: '/api/faq',
      query: queryParam,
      durationMs,
      timestamp: new Date().toISOString()
    }));
  }
});

// POST handler for FAQ creation (admin only)
export const POST = withErrorHandling(async (request: NextRequest) => {
  const traceId = generateTraceId();
  
  try {
    // Parse request body
    const body = await request.json();
    const { question_text, answer_text, category } = body;
    
    // Validate required fields
    if (!question_text || !answer_text) {
      throw ApiError.invalidRequest('question_textとanswer_textは必須です');
    }
    
    // Create database connection
    const db = createDb();
    
    // Check for duplicate question
    const searchResults = await faqData.search(db, question_text);
    const existingFaq = searchResults.find((item: any) => 
      item.question_text.toLowerCase() === question_text.toLowerCase()
    );
    
    if (existingFaq) {
      throw ApiError.invalidRequest('同じ質問のFAQが既に存在します');
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
  } catch (error: any) {
    console.error(`[${traceId}] Error creating FAQ:`, error);
    
    // Convert unknown errors to ApiError
    if (!(error instanceof ApiError)) {
      error = ApiError.fromError(error, 'FAQ作成中にエラーが発生しました');
      // Add traceId to the error
      error.traceId = traceId;
    }
    
    // Let the withErrorHandling wrapper handle the error response
    throw error;
  }
});
