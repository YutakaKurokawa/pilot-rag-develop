import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { securityHeaders } from './src/middleware/securityHeaders';

/**
 * Next.js middleware function that runs before any route is processed
 * Used to set up Sentry tracing and error handling
 */
export function middleware(request: NextRequest) {
  // Set request information as context for Sentry
  Sentry.setContext('request', {
    url: request.url,
    method: request.method,
    path: request.nextUrl.pathname,
    query: request.nextUrl.search,
  });

  // Set tags for better filtering in Sentry
  Sentry.setTag('route', request.nextUrl.pathname);

  // Apply security headers
  const response = securityHeaders(request);
  
  return response;
}

/**
 * Configure which paths the middleware should run on
 * We're applying it to all API routes
 */
export const config = {
  matcher: '/api/:path*',
};

/**
 * Utility function to tag a traceId on a Sentry exception
 * This should be called when capturing exceptions to link them to our internal tracing
 * 
 * @param exception The exception to capture
 * @param traceId The trace ID to tag on the exception
 */
export function captureExceptionWithTraceId(exception: any, traceId: string) {
  // Set the traceId as a tag
  Sentry.setTag('traceId', traceId);
  
  // Capture the exception
  Sentry.captureException(exception);
}
