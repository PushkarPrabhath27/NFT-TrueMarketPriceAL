# Price Intelligence Features

This module implements the Price Intelligence Features component of the NFT Price Prediction Engine. It translates model outputs into actionable price intelligence for users, helping them make informed investment decisions.

## Overview

The Price Intelligence Features module consists of five main components:

1. **Current Fair Value Estimation**: Provides ensemble prediction aggregation, confidence interval calculation, comparative valuation to listed price, value driver identification, and natural language explanation generation.

2. **Price Trend Prediction**: Implements forecasting for multiple time horizons (7d, 30d, 90d), trend strength and direction indicators, conditional forecasts based on market scenarios, milestone prediction, and visualization data for trend projection.

3. **Undervalued/Overvalued Assessment**: Calculates percentage difference from fair value, classification thresholds for significant deviations, comparative analysis within collections, opportunity scoring, and explanation generation for valuation gaps.

4. **Price Volatility Metrics**: Implements historical volatility calculation, future volatility prediction, relative volatility comparison to collection and market, risk-adjusted valuation incorporating volatility, and visualization data for price movement bands.

5. **Confidence Metrics**: Provides model uncertainty quantification, robust prediction interval calculation, confidence level indicators (High/Medium/Low), detailed confidence factors with impact scores, and targeted recommendations for improving confidence.

## Module Structure

- `fair_value_estimation.ts`: Implements fair value estimation functionality
- `price_trend_prediction.ts`: Implements price trend prediction functionality
- `valuation_assessment.ts`: Implements undervalued/overvalued assessment
- `price_volatility_metrics.ts`: Implements price volatility metrics functionality
- `confidence_metrics.ts`: Implements confidence metrics calculation and explanation
- `types.ts`: Defines types and interfaces for the intelligence features
- `test_price_intelligence.ts`: Demonstrates usage of the core intelligence features
- `test_volatility_confidence.ts`: Demonstrates usage of volatility and confidence metrics

## Usage

The Price Intelligence Features module integrates with the existing model implementations to provide actionable insights. Here's how to use the main components:

### Fair Value Estimation

```typescript
import { calculateFairValueEstimation } from '../intelligence';
import { NFT, Collection, EnsemblePrediction } from '../types';

// Get NFT, collection, and prediction from your data source
const fairValueEstimation = calculateFairValueEstimation(
  nft,
  collection,
  ensemblePrediction,
  currentListedPrice // optional
);

// fairValueEstimation contains:
// - estimatedValue: The fair value estimate
// - confidenceInterval: Lower and upper bounds
// - valueDrivers: Factors influencing the valuation
// - explanation: Natural language explanation
// - confidenceLevel: HIGH, MEDIUM, or LOW
```

### Price Trend Prediction

```typescript
import { generatePriceTrendPrediction } from '../intelligence';

const priceTrendPrediction = generatePriceTrendPrediction(
  nft,
  collection,
  ensemblePrediction,
  historicalPredictions // optional
);

// priceTrendPrediction contains:
// - forecasts: Predictions for 7d, 30d, and 90d horizons
// - trendStrength: Strength of the trend (0-1)
// - trendDirection: 'up', 'down', or 'stable'
// - conditionalForecasts: Predictions for different market scenarios
// - milestones: Time to reach price targets
// - visualizationData: Data for trend visualization
```

### Valuation Assessment

```typescript
import { assessValuation } from '../intelligence';

const valuationAssessment = assessValuation(
  nft,
  collection,
  ensemblePrediction,
  currentPrice
);

// valuationAssessment contains:
// - valuationStatus: UNDERVALUED, FAIR_VALUED, or OVERVALUED
// - percentageDifference: Difference from fair value
// - comparisonMetrics: Comparison with collection averages
// - opportunityScore: Score on a 0-100 scale
// - valuationGapExplanation: Explanation of the valuation gap
```

### Confidence Metrics

```typescript
import { calculateConfidenceMetrics, generateConfidenceExplanation } from '../intelligence';

const confidenceMetrics = calculateConfidenceMetrics(
  ensemblePrediction,
  nft,
  collection
);

// confidenceMetrics contains:
// - modelUncertainty: Quantification of model prediction variance
// - predictionInterval: Lower and upper bounds with confidence percentage
// - confidenceLevel: HIGH, MEDIUM, or LOW
// - confidenceFactors: Factors affecting confidence with impact scores
// - improvementSuggestions: Recommendations to improve prediction confidence

// explanation provides a natural language summary of confidence metrics
```

### Price Volatility Metrics

```typescript
import { 
  calculatePriceVolatilityMetrics,
  calculateHistoricalVolatility,
  predictFutureVolatility,
  calculateRelativeVolatility,
  calculateRiskAdjustedValuation,
  generatePriceMovementBands
} from '../intelligence';

// Calculate comprehensive volatility metrics
const volatilityMetrics = calculatePriceVolatilityMetrics(
  nft,
  collection,
  ensemblePrediction,
  marketVolatility // optional
);

// volatilityMetrics contains:
// - historicalVolatility: Calculated from past price data
// - predictedVolatility: Future volatility for different time horizons
// - relativeVolatility: Comparison to collection and market
// - riskAdjustedValuation: Price adjusted for volatility risk
// - priceMovementBands: Price ranges with probability for visualization

// You can also use individual functions:
const historicalVolatility = calculateHistoricalVolatility(collection.sales, 30); // 30-day window
const riskAdjustedValue = calculateRiskAdjustedValuation(fairValue, historicalVolatility);
```

const explanation = generateConfidenceExplanation(confidenceMetrics);
```

## Integration with API

These intelligence features can be exposed through API endpoints as specified in the requirements:

- `/price/prediction/{token_id}` for price intelligence
- `/price/history/{token_id}` for historical prices
- `/price/comparable/{token_id}` for similar NFTs
- `/price/collection/{collection_id}` for collection-level metrics

## Testing

A test file `test_price_intelligence.ts` is provided to demonstrate the functionality of the price intelligence features. You can run it to see example outputs from each component.

```typescript
import { demonstratePriceIntelligence } from './intelligence/test_price_intelligence';

// Run the demonstration
const results = demonstratePriceIntelligence();
```

## Future Enhancements

1. Implement more sophisticated time series forecasting models
2. Add market sentiment analysis from social media data
3. Enhance visualization data with more detailed trend information
4. Implement user feedback integration to improve predictions
5. Add more detailed comparative analysis within collections