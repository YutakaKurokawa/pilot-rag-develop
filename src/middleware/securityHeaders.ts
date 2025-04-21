import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware function to add security headers to all responses
 * This helps improve the security posture of the application
 * 
 * @param request The incoming request
 * @returns The response with added security headers
 */
export function securityHeaders(request: NextRequest) {
  // Get the incoming response
  const response = NextResponse.next();
  
  // Add security headers
  
  // HTTP Strict Transport Security
  // Ensures the browser only connects to the server via HTTPS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  
  // X-Content-Type-Options
  // Prevents browsers from MIME-sniffing a response away from the declared content-type
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  // Prevents the page from being displayed in an iframe
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  // Enables the Cross-site scripting (XSS) filter in browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  // Controls how much referrer information should be included with requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content-Security-Policy
  // Helps prevent XSS, clickjacking, and other code injection attacks
  // This is a basic policy - it should be customized based on your application's needs
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self'; " +
    "connect-src 'self' *.sentry.io; " + // Allow connections to Sentry
    "frame-ancestors 'none';"
  );
  
  // Permissions-Policy (formerly Feature-Policy)
  // Allows you to control which features and APIs can be used in the browser
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  return response;
}
