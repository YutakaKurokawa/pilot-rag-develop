import { describe, it, expect } from 'vitest';
import request from 'supertest';

/**
 * Smoke Test for FAQ API
 * 
 * This is a basic smoke test that verifies the FAQ API endpoint is responding with a 200 status code.
 * It doesn't validate the response body structure as that may vary depending on whether an FAQ match is found.
 */
describe('FAQ API Smoke Test', () => {
  it('should return 200 status code for FAQ API', async () => {
    // Use supertest to make a real HTTP request to the running dev server
    const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    const testQuery = 'test question';
    
    // Make the request to the FAQ API
    const response = await request(baseUrl)
      .get(`/api/faq?query=${encodeURIComponent(testQuery)}`)
      .set('Accept', 'application/json');
    
    // For a smoke test, we just verify the API is responding with a 200 status
    expect(response.status).toBe(200);
    
    // Log the response for debugging
    console.log('FAQ API Response Status:', response.status);
    console.log('FAQ API Response Type:', response.type);
    console.log('FAQ API Response Headers:', response.headers);
  });
});
