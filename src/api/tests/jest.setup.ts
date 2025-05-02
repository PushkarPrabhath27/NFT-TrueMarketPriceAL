/**
 * Jest Setup File
 * 
 * This file contains setup code that runs before Jest tests.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock authentication for testing
jest.mock('../middleware/authMiddleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    // Add mock user to request for testing
    req.user = {
      id: 'test-user-id',
      tier: 'premium',
      name: 'Test User'
    };
    next();
  }
}));

// Mock rate limiting for testing
jest.mock('../middleware/rateLimitMiddleware', () => ({
  rateLimitMiddleware: (req: any, res: any, next: any) => next()
}));

// Global test setup
beforeAll(() => {
  console.log('Starting API tests...');
});

// Global test teardown
afterAll(() => {
  console.log('API tests completed');
});