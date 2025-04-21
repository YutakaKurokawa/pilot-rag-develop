import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { Socket } from 'net';
import { createDb } from '@/db';
import { LlmError } from '@/src/errors/LlmError';
import { InfraError } from '@/src/errors/InfraError';
import { UI_ERROR_CODES, LLM_ERROR_CODES, INFRA_ERROR_CODES } from '@/src/errors/errorCodes';

// Mock the database module
vi.mock('@/db', () => ({
  createDb: vi.fn(),
  faqData: {
    search: vi.fn(),
    insert: vi.fn(),
  },
  faqThreshold: {
    getThreshold: vi.fn(),
  },
}));

// Mock the AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

// Mock the retry utility
vi.mock('@/src/utils/retry', () => {
  const originalModule = vi.importActual('@/src/utils/retry');
  
  return {
    ...originalModule,
    retryLlm: vi.fn().mockImplementation(async (fn) => {
      return fn();
    }),
  };
});

/**
 * Check if a server is running on the specified port
 */
async function isServerRunning(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    
    // Set a timeout for the connection attempt
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 300);
    
    // Try to connect to the server
    socket.connect(port, 'localhost', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });
    
    // Handle connection errors
    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
  });
}

describe('FAQ API Error Handling Tests', () => {
  const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should return 400/U-1001 for empty query', async () => {
    // Skip the test if the server isn't running
    const serverRunning = await isServerRunning(3000);
    if (!serverRunning) {
      console.log('Server is not running on port 3000, skipping test');
      return;
    }
    
    try {
      // Make the request to the FAQ API with an empty query
      const response = await request(baseUrl)
        .get('/api/faq?query=')
        .set('Accept', 'application/json')
        .timeout(2000);
      
      // Verify the response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', UI_ERROR_CODES.VALIDATION_FAILED);
      expect(response.body).toHaveProperty('status', 'fail');
      expect(response.body.info).toHaveProperty('traceId');
      
      console.log('Empty query test passed with status:', response.status);
    } catch (error: any) {
      console.error('Error in empty query test:', error.message || String(error));
      throw error;
    }
  });
  
  it('should return 502/E-5001 with 3 retries for LLM timeout', async () => {
    // Skip the test if the server isn't running
    const serverRunning = await isServerRunning(3000);
    if (!serverRunning) {
      console.log('Server is not running on port 3000, skipping test');
      return;
    }
    
    // Mock the database to return empty results to force LLM fallback
    const mockDb = {};
    (createDb as any).mockReturnValue(mockDb);
    const { faqData, faqThreshold } = require('@/db');
    (faqData.search as any).mockResolvedValue([]);
    (faqThreshold.getThreshold as any).mockResolvedValue({ threshold_value: 0.4 });
    
    // Mock the retryLlm function to throw a timeout error after 3 retries
    const retryLlmMock = vi.spyOn(require('@/src/utils/retry'), 'retryLlm');
    let retryCount = 0;
    
    retryLlmMock.mockImplementation(async () => {
      retryCount++;
      if (retryCount <= 3) {
        throw new LlmError('LLM request timed out', {
          code: LLM_ERROR_CODES.TIMEOUT,
          retryable: true,
        });
      }
      throw new LlmError('Maximum retries exceeded', {
        code: LLM_ERROR_CODES.TIMEOUT,
        retryable: false,
      });
    });
    
    try {
      // Make the request to the FAQ API
      const response = await request(baseUrl)
        .get('/api/faq?query=test')
        .set('Accept', 'application/json')
        .timeout(5000);
      
      // Verify the response
      expect(response.status).toBe(502);
      expect(response.body).toHaveProperty('code', LLM_ERROR_CODES.TIMEOUT);
      expect(response.body).toHaveProperty('status', 'fail');
      expect(response.body.info).toHaveProperty('traceId');
      
      // Verify that retryLlm was called
      expect(retryLlmMock).toHaveBeenCalled();
      expect(retryCount).toBe(4); // Initial attempt + 3 retries
      
      console.log('LLM timeout test passed with status:', response.status);
    } catch (error: any) {
      console.error('Error in LLM timeout test:', error.message || String(error));
      throw error;
    }
  });
  
  it('should return 500/I-4001 for DB connection issues', async () => {
    // Skip the test if the server isn't running
    const serverRunning = await isServerRunning(3000);
    if (!serverRunning) {
      console.log('Server is not running on port 3000, skipping test');
      return;
    }
    
    // Mock the database to throw a connection error
    (createDb as any).mockImplementation(() => {
      throw new InfraError('Database connection pool exhausted', {
        code: INFRA_ERROR_CODES.DB_CONNECTION_EXHAUSTED,
        retryable: false,
      });
    });
    
    try {
      // Make the request to the FAQ API
      const response = await request(baseUrl)
        .get('/api/faq?query=test')
        .set('Accept', 'application/json')
        .timeout(2000);
      
      // Verify the response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', INFRA_ERROR_CODES.DB_CONNECTION_EXHAUSTED);
      expect(response.body).toHaveProperty('status', 'fail');
      expect(response.body.info).toHaveProperty('traceId');
      
      console.log('DB connection test passed with status:', response.status);
    } catch (error: any) {
      console.error('Error in DB connection test:', error.message || String(error));
      throw error;
    }
  });
});
