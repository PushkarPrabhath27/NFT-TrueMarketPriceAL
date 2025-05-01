import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export class BatchProcessor {
  private readonly MAX_BATCH_SIZE = 100;
  private readonly PROCESSING_TIMEOUT = 30000; // 30 seconds

  public processBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token_ids } = req.body;

      if (!this.isValidBatchSize(token_ids)) {
        throw new ValidationError(`Batch size must be between 1 and ${this.MAX_BATCH_SIZE}`);
      }

      // Group tokens for efficient processing
      const batchGroups = this.createBatchGroups(token_ids);

      // Attach batch processing info to request
      req.locals = {
        ...req.locals,
        batchGroups,
        processingStart: Date.now()
      };

      // Set processing timeout
      this.setProcessingTimeout(res);

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Batch processing error' });
      }
    }
  };

  private isValidBatchSize(token_ids: string[]): boolean {
    return Array.isArray(token_ids) &&
           token_ids.length > 0 &&
           token_ids.length <= this.MAX_BATCH_SIZE;
  }

  private createBatchGroups(token_ids: string[]): string[][] {
    const optimalGroupSize = 10; // Process 10 tokens at a time
    const groups: string[][] = [];
    
    for (let i = 0; i < token_ids.length; i += optimalGroupSize) {
      groups.push(token_ids.slice(i, i + optimalGroupSize));
    }

    return groups;
  }

  private setProcessingTimeout(res: Response): void {
    setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          message: 'Batch processing exceeded time limit'
        });
      }
    }, this.PROCESSING_TIMEOUT);
  }

  public getProcessingStats(req: Request): object {
    const processingTime = Date.now() - (req.locals?.processingStart || Date.now());
    return {
      batchSize: req.body.token_ids.length,
      processingTime,
      groupCount: req.locals?.batchGroups?.length || 0
    };
  }
}