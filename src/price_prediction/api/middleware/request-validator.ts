import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export class RequestValidator {
  public validatePredictionRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      const { token_id } = req.params;
      const { timeframe, confidence_level, model_type } = req.query;

      if (!token_id) {
        throw new ValidationError('Token ID is required');
      }

      // Validate timeframe if provided
      if (timeframe && !['7d', '30d', '90d'].includes(timeframe as string)) {
        throw new ValidationError('Invalid timeframe. Allowed values: 7d, 30d, 90d');
      }

      // Validate confidence level if provided
      if (confidence_level && !['high', 'medium', 'low'].includes(confidence_level as string)) {
        throw new ValidationError('Invalid confidence level. Allowed values: high, medium, low');
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal validation error' });
      }
    }
  }

  public validateHistoryRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      const { token_id } = req.params;
      const { start_date, end_date } = req.query;

      if (!token_id) {
        throw new ValidationError('Token ID is required');
      }

      // Validate date format if provided
      if (start_date && !this.isValidDate(start_date as string)) {
        throw new ValidationError('Invalid start date format');
      }

      if (end_date && !this.isValidDate(end_date as string)) {
        throw new ValidationError('Invalid end date format');
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal validation error' });
      }
    }
  }

  public validateComparableRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      const { token_id } = req.params;
      const { limit, similarity_threshold } = req.query;

      if (!token_id) {
        throw new ValidationError('Token ID is required');
      }

      // Validate limit if provided
      if (limit && (isNaN(Number(limit)) || Number(limit) <= 0)) {
        throw new ValidationError('Invalid limit. Must be a positive number');
      }

      // Validate similarity threshold if provided
      if (similarity_threshold && (isNaN(Number(similarity_threshold)) || Number(similarity_threshold) < 0 || Number(similarity_threshold) > 1)) {
        throw new ValidationError('Invalid similarity threshold. Must be between 0 and 1');
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal validation error' });
      }
    }
  }

  public validateCollectionRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      const { collection_id } = req.params;
      const { metric_types } = req.query;

      if (!collection_id) {
        throw new ValidationError('Collection ID is required');
      }

      // Validate metric types if provided
      if (metric_types) {
        const validMetrics = ['floor_price', 'volume', 'sales_count', 'unique_holders'];
        const requestedMetrics = (metric_types as string).split(',');
        const invalidMetrics = requestedMetrics.filter(metric => !validMetrics.includes(metric));

        if (invalidMetrics.length > 0) {
          throw new ValidationError(`Invalid metric types: ${invalidMetrics.join(', ')}`);
        }
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal validation error' });
      }
    }
  }

  public validateBatchRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      const { token_ids } = req.body;

      if (!Array.isArray(token_ids) || token_ids.length === 0) {
        throw new ValidationError('Token IDs array is required and must not be empty');
      }

      if (token_ids.length > 100) {
        throw new ValidationError('Batch size cannot exceed 100 tokens');
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal validation error' });
      }
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}