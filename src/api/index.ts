/**
 * NFT TrustScore API Gateway
 * 
 * This module serves as the central entry point for the NFT TrustScore platform's API system.
 * It implements a robust, scalable API architecture that handles high volumes of requests with low latency.
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

// Import service routes
import trustScoreRoutes from './routes/trustScoreRoutes';
import priceIntelligenceRoutes from './routes/priceIntelligenceRoutes';
import riskAssessmentRoutes from './routes/riskAssessmentRoutes';
import blockchainDataRoutes from './routes/blockchainDataRoutes';
import fraudDetectionRoutes from './routes/fraudDetectionRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/authMiddleware';
import { cacheMiddleware } from './middleware/cacheMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';

// Configuration
import { config } from './config';

/**
 * API Gateway class that implements the centralized entry point for all API requests
 */
export class ApiGateway {
  private app: express.Application;
  private port: number;

  /**
   * Initialize the API Gateway
   * 
   * @param port The port to listen on
   */
  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
    this.configureSwagger();
  }

  /**
   * Configure middleware for the API Gateway
   */
  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      methods: config.cors.allowedMethods,
      allowedHeaders: config.cors.allowedHeaders,
      maxAge: config.cors.maxAge
    }));
    
    // Request parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Compression
    this.app.use(compression());
    
    // Logging
    this.app.use(requestLogger);
    
    // Rate limiting with tier-based approach
    this.app.use(rateLimitMiddleware);

  }

  /**
   * Configure routes for the API Gateway
   */
  private configureRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', version: config.version });
    });

    // API version prefix
    const apiPrefix = `/api/v${config.version}`;

    // Trust Score endpoints
    this.app.use(`${apiPrefix}/scores`, authMiddleware, cacheMiddleware(300), trustScoreRoutes);
    
    // Price Intelligence endpoints
    this.app.use(`${apiPrefix}/price`, authMiddleware, cacheMiddleware(300), priceIntelligenceRoutes);
    
    // Risk Assessment endpoints
    this.app.use(`${apiPrefix}/risk`, authMiddleware, cacheMiddleware(300), riskAssessmentRoutes);
    
    // Blockchain Data endpoints
    this.app.use(`${apiPrefix}/blockchain`, authMiddleware, cacheMiddleware(300), blockchainDataRoutes);
    
    // Fraud Detection endpoints
    this.app.use(`${apiPrefix}/fraud`, authMiddleware, cacheMiddleware(300), fraudDetectionRoutes);

    // Service discovery endpoint
    this.app.get(`${apiPrefix}/services`, authMiddleware, (req: Request, res: Response) => {
      res.status(200).json({
        services: [
          { name: 'trust-score', status: 'active', url: `${apiPrefix}/scores` },
          { name: 'price-intelligence', status: 'active', url: `${apiPrefix}/price` },
          { name: 'risk-assessment', status: 'active', url: `${apiPrefix}/risk` },
          { name: 'blockchain-data', status: 'active', url: `${apiPrefix}/blockchain` },
          { name: 'fraud-detection', status: 'active', url: `${apiPrefix}/fraud` }
        ]
      });
    });

    // Fallback route
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found'
        }
      });
    });
  }

  /**
   * Configure error handling for the API Gateway
   */
  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Configure Swagger documentation
   */
  private configureSwagger(): void {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'NFT TrustScore API',
          version: config.version.toString(),
          description: 'API for the NFT TrustScore platform',
          contact: {
            name: 'API Support',
            email: 'support@nfttrustscore.com'
          }
        },
        servers: [
          {
            url: `http://localhost:${this.port}/api/v${config.version}`,
            description: 'Development server'
          }
        ],
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'Authorization'
            }
          }
        },
        security: [
          { ApiKeyAuth: [] }
        ]
      },
      apis: ['./src/api/routes/*.ts', './src/api/models/*.ts']
    };

    const swaggerSpec = swaggerJSDoc(swaggerOptions);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    
    // Endpoint to get the Swagger JSON
    this.app.get('/api-docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  /**
   * Start the API Gateway server
   * 
   * @returns Express application instance
   */
  public start(): express.Application {
    this.app.listen(this.port, () => {
      console.log(`NFT TrustScore API Gateway running on port ${this.port}`);
      console.log(`API Documentation available at http://localhost:${this.port}/api-docs`);
    });

    return this.app;
  }

  /**
   * Get the Express application instance
   * 
   * @returns Express application instance
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// Create and export default instance
const apiGateway = new ApiGateway(config.port);
export default apiGateway;