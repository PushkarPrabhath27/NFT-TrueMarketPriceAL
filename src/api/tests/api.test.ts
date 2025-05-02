/**
 * API Integration Tests
 * 
 * Tests for the NFT TrustScore API endpoints and middleware.
 */

import request from 'supertest';
import { ApiGateway } from '../index';
import { config } from '../config';

describe('NFT TrustScore API', () => {
  let apiGateway: ApiGateway;
  let app: any;

  beforeAll(() => {
    // Create a test instance of the API Gateway
    apiGateway = new ApiGateway(config.port);
    app = apiGateway.getApp();
  });

  describe('Health Check', () => {
    it('should return 200 OK with status information', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Trust Score Endpoints', () => {
    it('should return NFT trust score data', async () => {
      // Mock authentication for testing
      const response = await request(app)
        .get('/api/v1/scores/nft/token-123')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token_id');
      expect(response.body.data).toHaveProperty('score');
    });
  });

  describe('Price Intelligence Endpoints', () => {
    it('should return price prediction data', async () => {
      const response = await request(app)
        .get('/api/v1/price/prediction/token-123')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token_id');
      expect(response.body.data).toHaveProperty('prediction');
    });
  });

  describe('Risk Assessment Endpoints', () => {
    it('should return risk profile data', async () => {
      const response = await request(app)
        .get('/api/v1/risk/profile/token-123')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token_id');
      expect(response.body.data).toHaveProperty('overall_risk_score');
    });
  });

  describe('Blockchain Data Endpoints', () => {
    it('should return NFT metadata', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/nft/token-123')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token_id');
      expect(response.body.data).toHaveProperty('metadata');
    });
  });

  describe('Fraud Detection Endpoints', () => {
    it('should return image similarity analysis', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/image/token-123')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token_id');
      expect(response.body.data).toHaveProperty('originality_score');
    });

    it('should submit a fraud report', async () => {
      const reportData = {
        entity_id: 'token-123',
        entity_type: 'nft',
        report_type: 'fake_nft',
        description: 'This appears to be a copy of a known artwork',
        evidence: {
          original_url: 'https://example.com/original-artwork',
          similarity_points: ['identical background', 'same signature style']
        }
      };

      const response = await request(app)
        .post('/api/v1/fraud/report')
        .set('Authorization', 'Bearer test-api-key')
        .send(reportData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('report_id');
      expect(response.body.data).toHaveProperty('entity_id', 'token-123');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-route')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/v1/scores/nft/token-123');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return 400 for invalid request parameters', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/alerts/token-123')
        .set('Authorization', 'Bearer test-api-key');
      // Missing required query parameter 'entity_type'
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'BAD_REQUEST');
    });
  });
});