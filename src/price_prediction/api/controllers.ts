import { Request, Response } from 'express';
import { FairValueEstimator } from '../intelligence/fair_value_estimation';
import { PriceTrendPredictor } from '../intelligence/price_trend_prediction';
import { ComparableSalesAnalyzer } from '../models/comparable_sales';
import { CollectionMetricsAnalyzer } from '../data_processing/collection_features';
import { ResponseFormatter } from './utils/response-formatter';
import { PredictionRequest, HistoryRequest, ComparableRequest, CollectionRequest, BatchPredictionRequest } from './types';

export class PricePredictionController {
  private fairValueEstimator: FairValueEstimator;
  private trendPredictor: PriceTrendPredictor;
  private comparableAnalyzer: ComparableSalesAnalyzer;
  private collectionAnalyzer: CollectionMetricsAnalyzer;
  private responseFormatter: ResponseFormatter;

  constructor() {
    this.fairValueEstimator = new FairValueEstimator();
    this.trendPredictor = new PriceTrendPredictor();
    this.comparableAnalyzer = new ComparableSalesAnalyzer();
    this.collectionAnalyzer = new CollectionMetricsAnalyzer();
    this.responseFormatter = new ResponseFormatter();
  }

  public async getPricePrediction(req: Request, res: Response): Promise<void> {
    try {
      const request = req.params as PredictionRequest;
      const prediction = await this.fairValueEstimator.estimateValue(request.token_id);
      const trends = await this.trendPredictor.predictTrends(request.token_id);
      
      const response = this.responseFormatter.formatPredictionResponse({
        prediction,
        trends,
        confidence: prediction.confidence,
        metadata: prediction.metadata
      });

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate price prediction' });
    }
  }

  public async getPriceHistory(req: Request, res: Response): Promise<void> {
    try {
      const request = req.params as HistoryRequest;
      const history = await this.fairValueEstimator.getHistoricalPrices(request.token_id);
      
      const response = this.responseFormatter.formatHistoryResponse(history);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve price history' });
    }
  }

  public async getComparableNFTs(req: Request, res: Response): Promise<void> {
    try {
      const request = req.params as ComparableRequest;
      const comparables = await this.comparableAnalyzer.findComparables(request.token_id);
      
      const response = this.responseFormatter.formatComparableResponse(comparables);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to find comparable NFTs' });
    }
  }

  public async getCollectionMetrics(req: Request, res: Response): Promise<void> {
    try {
      const request = req.params as CollectionRequest;
      const metrics = await this.collectionAnalyzer.analyzeCollection(request.collection_id);
      
      const response = this.responseFormatter.formatCollectionResponse(metrics);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve collection metrics' });
    }
  }

  public async getBatchPredictions(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as BatchPredictionRequest;
      const predictions = await Promise.all(
        request.token_ids.map(id => this.fairValueEstimator.estimateValue(id))
      );
      
      const response = this.responseFormatter.formatBatchResponse(predictions);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process batch predictions' });
    }
  }
}