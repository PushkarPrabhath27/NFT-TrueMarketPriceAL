/**
 * API Module for NFT Trust Score Engine
 * 
 * This module provides RESTful API endpoints for accessing trust scores
 * for NFTs, creators, and collections, along with risk assessments and
 * detailed factor analysis.
 */

import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { cacheMiddleware } from './middleware/cacheMiddleware';
import { nftRoutes } from './routes/nftRoutes';
import { creatorRoutes } from './routes/creatorRoutes';
import { collectionRoutes } from './routes/collectionRoutes';
import { riskRoutes } from './routes/riskRoutes';
import { factorRoutes } from './routes/factorRoutes';

// Create Express application
const app = express();

// Apply global middleware
app.use(helmet()); // Security headers
app.use(json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS
app.use(compression()); // Response compression
app.use(requestLogger); // Log all requests

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// Register routes
app.use('/scores/nft', cacheMiddleware(300), nftRoutes); // 5 min cache
app.use('/scores/creator', cacheMiddleware(600), creatorRoutes); // 10 min cache
app.use('/scores/collection', cacheMiddleware(600), collectionRoutes); // 10 min cache
app.use('/risk/profile', cacheMiddleware(300), riskRoutes); // 5 min cache
app.use('/factors', cacheMiddleware(300), factorRoutes); // 5 min cache

// Apply error handling middleware last
app.use(errorHandler);

/**
 * Start the API server
 * @param port - The port to listen on
 * @returns The Express application instance
 */
export function startApiServer(port: number = 3000): express.Application {
  app.listen(port, () => {
    console.log(`NFT Trust Score API running on port ${port}`);
  });
  return app;
}

export default app;