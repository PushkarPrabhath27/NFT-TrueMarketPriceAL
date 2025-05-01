import { PredictionResult, ActualPrice, TimeHorizon, Category, PriceRange } from '../types';

interface ErrorMetrics {
  mae: number;  // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  mape: number; // Mean Absolute Percentage Error
}

interface TimeHorizonEvaluation {
  horizon: TimeHorizon;
  metrics: ErrorMetrics;
  sampleSize: number;
}

interface CategoryPerformance {
  category: Category;
  metrics: ErrorMetrics;
  sampleSize: number;
}

interface PriceRangeAccuracy {
  range: PriceRange;
  metrics: ErrorMetrics;
  sampleSize: number;
}

interface ErrorDistribution {
  bins: number[];
  frequencies: number[];
  mean: number;
  standardDeviation: number;
}

export class EvaluationFramework {
  private predictions: PredictionResult[];
  private actuals: ActualPrice[];

  constructor(predictions: PredictionResult[], actuals: ActualPrice[]) {
    this.predictions = predictions;
    this.actuals = actuals;
  }

  /**
   * Calculate basic error metrics (MAE, RMSE, MAPE)
   */
  private calculateErrorMetrics(predicted: number[], actual: number[]): ErrorMetrics {
    if (predicted.length !== actual.length || predicted.length === 0) {
      throw new Error('Invalid input arrays for error calculation');
    }

    const errors = predicted.map((pred, i) => pred - actual[i]);
    const absErrors = errors.map(Math.abs);
    const squaredErrors = errors.map(err => err * err);
    
    const mae = absErrors.reduce((sum, err) => sum + err, 0) / absErrors.length;
    const rmse = Math.sqrt(squaredErrors.reduce((sum, err) => sum + err, 0) / squaredErrors.length);
    const mape = (absErrors.reduce((sum, err, i) => sum + (err / Math.abs(actual[i])), 0) / absErrors.length) * 100;

    return { mae, rmse, mape };
  }

  /**
   * Evaluate performance across different time horizons
   */
  public evaluateTimeHorizons(): TimeHorizonEvaluation[] {
    const horizonGroups = new Map<TimeHorizon, { predicted: number[]; actual: number[] }>();

    this.predictions.forEach((pred, i) => {
      const actual = this.actuals[i];
      if (!horizonGroups.has(pred.timeHorizon)) {
        horizonGroups.set(pred.timeHorizon, { predicted: [], actual: [] });
      }
      const group = horizonGroups.get(pred.timeHorizon)!;
      group.predicted.push(pred.predictedPrice);
      group.actual.push(actual.price);
    });

    return Array.from(horizonGroups.entries()).map(([horizon, data]) => ({
      horizon,
      metrics: this.calculateErrorMetrics(data.predicted, data.actual),
      sampleSize: data.predicted.length
    }));
  }

  /**
   * Analyze performance by category
   */
  public analyzeCategoryPerformance(): CategoryPerformance[] {
    const categoryGroups = new Map<Category, { predicted: number[]; actual: number[] }>();

    this.predictions.forEach((pred, i) => {
      const actual = this.actuals[i];
      if (!categoryGroups.has(pred.category)) {
        categoryGroups.set(pred.category, { predicted: [], actual: [] });
      }
      const group = categoryGroups.get(pred.category)!;
      group.predicted.push(pred.predictedPrice);
      group.actual.push(actual.price);
    });

    return Array.from(categoryGroups.entries()).map(([category, data]) => ({
      category,
      metrics: this.calculateErrorMetrics(data.predicted, data.actual),
      sampleSize: data.predicted.length
    }));
  }

  /**
   * Assess accuracy within specific price ranges
   */
  public assessPriceRangeAccuracy(): PriceRangeAccuracy[] {
    const rangeGroups = new Map<PriceRange, { predicted: number[]; actual: number[] }>();

    this.predictions.forEach((pred, i) => {
      const actual = this.actuals[i];
      const range = this.determinePriceRange(actual.price);
      
      if (!rangeGroups.has(range)) {
        rangeGroups.set(range, { predicted: [], actual: [] });
      }
      const group = rangeGroups.get(range)!;
      group.predicted.push(pred.predictedPrice);
      group.actual.push(actual.price);
    });

    return Array.from(rangeGroups.entries()).map(([range, data]) => ({
      range,
      metrics: this.calculateErrorMetrics(data.predicted, data.actual),
      sampleSize: data.predicted.length
    }));
  }

  /**
   * Generate error distribution visualization data
   */
  public calculateErrorDistribution(binCount: number = 20): ErrorDistribution {
    const errors = this.predictions.map((pred, i) => 
      pred.predictedPrice - this.actuals[i].price
    );

    const mean = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const variance = errors.reduce((sum, err) => sum + Math.pow(err - mean, 2), 0) / errors.length;
    const standardDeviation = Math.sqrt(variance);

    // Create histogram bins
    const minError = Math.min(...errors);
    const maxError = Math.max(...errors);
    const binWidth = (maxError - minError) / binCount;
    
    const bins = Array.from({ length: binCount }, (_, i) => 
      minError + i * binWidth
    );
    
    const frequencies = new Array(binCount).fill(0);
    errors.forEach(error => {
      const binIndex = Math.min(
        Math.floor((error - minError) / binWidth),
        binCount - 1
      );
      frequencies[binIndex]++;
    });

    return {
      bins,
      frequencies,
      mean,
      standardDeviation
    };
  }

  /**
   * Helper method to determine price range category
   */
  private determinePriceRange(price: number): PriceRange {
    // Implement logic to categorize price into ranges
    // This should be aligned with your PriceRange enum definition
    if (price < 0.1) return PriceRange.VERY_LOW;
    if (price < 1) return PriceRange.LOW;
    if (price < 10) return PriceRange.MEDIUM;
    if (price < 100) return PriceRange.HIGH;
    return PriceRange.VERY_HIGH;
  }
}