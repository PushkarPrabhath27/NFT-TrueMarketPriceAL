import { PricePrediction, PriceTrend, NFTComparable, CollectionMetrics } from '../../types';

export class ResponseFormatter {
  public formatPredictionResponse(data: {
    prediction: PricePrediction;
    trends: PriceTrend[];
    confidence: number;
    metadata: any;
  }): object {
    return {
      status: 'success',
      data: {
        current_value: {
          estimate: data.prediction.estimatedPrice,
          currency: 'ETH',
          confidence_score: data.confidence,
          value_drivers: data.prediction.valueDrivers
        },
        price_trends: data.trends.map(trend => ({
          timeframe: trend.timeframe,
          direction: trend.direction,
          magnitude: trend.magnitude,
          probability: trend.probability
        })),
        visualization_data: {
          historical_prices: data.prediction.historicalPrices,
          predicted_ranges: data.prediction.predictedRanges,
          confidence_intervals: data.prediction.confidenceIntervals
        },
        metadata: {
          timestamp: new Date().toISOString(),
          model_version: data.metadata.modelVersion,
          data_freshness: data.metadata.dataFreshness
        }
      }
    };
  }

  public formatHistoryResponse(history: any[]): object {
    return {
      status: 'success',
      data: {
        price_history: history.map(record => ({
          timestamp: record.timestamp,
          price: record.price,
          currency: 'ETH',
          transaction_hash: record.transactionHash
        })),
        visualization_data: {
          price_timeline: this.generatePriceTimeline(history),
          volume_data: this.generateVolumeData(history)
        },
        metadata: {
          first_sale_date: history[0]?.timestamp,
          last_sale_date: history[history.length - 1]?.timestamp,
          total_transactions: history.length
        }
      }
    };
  }

  public formatComparableResponse(comparables: NFTComparable[]): object {
    return {
      status: 'success',
      data: {
        comparables: comparables.map(comparable => ({
          token_id: comparable.tokenId,
          similarity_score: comparable.similarityScore,
          last_sale_price: comparable.lastSalePrice,
          attributes_match: comparable.attributesMatch
        })),
        visualization_data: {
          similarity_distribution: this.generateSimilarityDistribution(comparables),
          price_comparison: this.generatePriceComparison(comparables)
        },
        metadata: {
          comparison_timestamp: new Date().toISOString(),
          total_comparables: comparables.length
        }
      }
    };
  }

  public formatCollectionResponse(metrics: CollectionMetrics): object {
    return {
      status: 'success',
      data: {
        collection_metrics: {
          floor_price: metrics.floorPrice,
          volume_24h: metrics.volume24h,
          sales_count: metrics.salesCount,
          unique_holders: metrics.uniqueHolders
        },
        trends: {
          floor_price_trend: metrics.floorPriceTrend,
          volume_trend: metrics.volumeTrend,
          liquidity_trend: metrics.liquidityTrend
        },
        visualization_data: {
          price_distribution: metrics.priceDistribution,
          volume_timeline: metrics.volumeTimeline,
          holder_distribution: metrics.holderDistribution
        },
        metadata: {
          last_updated: new Date().toISOString(),
          data_period: metrics.dataPeriod
        }
      }
    };
  }

  public formatBatchResponse(predictions: PricePrediction[]): object {
    return {
      status: 'success',
      data: {
        predictions: predictions.map(prediction => ({
          token_id: prediction.tokenId,
          estimated_price: prediction.estimatedPrice,
          confidence_score: prediction.confidence,
          prediction_timestamp: new Date().toISOString()
        })),
        metadata: {
          batch_size: predictions.length,
          processing_timestamp: new Date().toISOString()
        }
      }
    };
  }

  private generatePriceTimeline(history: any[]): object {
    return {
      labels: history.map(record => record.timestamp),
      values: history.map(record => record.price)
    };
  }

  private generateVolumeData(history: any[]): object {
    const volumeByDate = history.reduce((acc: any, record: any) => {
      const date = record.timestamp.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(volumeByDate),
      values: Object.values(volumeByDate)
    };
  }

  private generateSimilarityDistribution(comparables: NFTComparable[]): object {
    const distribution = comparables.reduce((acc: any, comparable: any) => {
      const range = Math.floor(comparable.similarityScore * 10) / 10;
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    return {
      ranges: Object.keys(distribution),
      counts: Object.values(distribution)
    };
  }

  private generatePriceComparison(comparables: NFTComparable[]): object {
    return {
      token_ids: comparables.map(c => c.tokenId),
      prices: comparables.map(c => c.lastSalePrice),
      similarity_scores: comparables.map(c => c.similarityScore)
    };
  }
}