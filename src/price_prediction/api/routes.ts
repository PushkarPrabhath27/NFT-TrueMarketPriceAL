import express from 'express';
import { Router } from 'express';
import { PricePredictionController } from './controllers';
import { RequestValidator } from './middleware/request-validator';
import { CacheMiddleware } from './middleware/cache';
import { BatchProcessor } from './middleware/batch-processor';

const router: Router = express.Router();
const controller = new PricePredictionController();
const validator = new RequestValidator();
const cache = new CacheMiddleware();
const batchProcessor = new BatchProcessor();

// Price Intelligence Endpoints
router.get('/prediction/:token_id',
  validator.validatePredictionRequest,
  cache.checkCache,
  controller.getPricePrediction
);

router.get('/history/:token_id',
  validator.validateHistoryRequest,
  cache.checkCache,
  controller.getPriceHistory
);

router.get('/comparable/:token_id',
  validator.validateComparableRequest,
  cache.checkCache,
  controller.getComparableNFTs
);

router.get('/collection/:collection_id',
  validator.validateCollectionRequest,
  cache.checkCache,
  controller.getCollectionMetrics
);

// Batch Processing Endpoint
router.post('/batch/prediction',
  validator.validateBatchRequest,
  batchProcessor.processBatch,
  controller.getBatchPredictions
);

export default router;