# Trust Score Engine Implementation Prompt

## Overview

You are tasked with building a comprehensive Trust Score Engine for NFTs. This system will analyze multiple data points to calculate trust scores for NFTs, creators, and collections, helping users make informed decisions about potential purchases and investments.

## Key Components to Implement

### 1. Dynamic Trust Score Calculation System

**Objective**: Create a multi-dimensional scoring system that evaluates NFT trustworthiness across multiple factors.

**Requirements**:

1. **Input Data Processing**:
   - Process blockchain data including transaction history and metadata
   - Incorporate image analysis results from fraud detection systems 
   - Integrate social validation signals and marketplace verification status
   - Use creator history and collection performance metrics
   - Handle missing or incomplete data with appropriate confidence adjustments

2. **Factor Calculation Architecture**:
   - Implement separate calculation modules for each trust factor
   - Design a weighted scoring system with configurable weights
   - Create confidence calculation for each factor and overall score
   - Build comprehensive explanation generation for all scores
   - Develop a historical tracking system for score evolution

3. **Specific Factor Implementation**:
   - **Originality Factor (20%)**:
     - Convert image similarity detection results to originality scores
     - Weight by confidence of the image analysis
     - Consider temporal aspects (which image appeared first)
     - Generate explanations for any detected similarities
     - Provide confidence based on analysis coverage

   - **Transaction Legitimacy Factor (20%)**:
     - Analyze patterns indicating potential wash trading
     - Evaluate wallet relationships to identify connected parties
     - Detect suspicious price manipulation patterns
     - Calculate confidence based on transaction volume and history
     - Generate detailed explanations of any suspicious patterns

   - **Creator Reputation Factor (15%)**:
     - Incorporate creator's historical NFT quality
     - Evaluate project delivery history and consistency
     - Consider verification status across platforms
     - Calculate confidence based on history length
     - Generate explanation of key reputation drivers

   - **Collection Performance Factor (15%)**:
     - Analyze floor price stability and trends
     - Evaluate trading volume consistency
     - Consider holder distribution metrics
     - Calculate confidence based on collection size and age
     - Generate explanation of collection health indicators

   - **Metadata Consistency Factor (10%)**:
     - Validate properties format and completeness
     - Check external reference integrity
     - Compare consistency across collection
     - Calculate confidence based on metadata complexity
     - Generate explanation of metadata quality

   - **Marketplace Verification Factor (10%)**:
     - Incorporate verification status across platforms
     - Weight by marketplace reputation
     - Consider listing consistency across marketplaces
     - Calculate confidence based on marketplace data completeness
     - Generate explanation of verification status

   - **Social Validation Factor (10%)**:
     - Analyze mention frequency and sentiment
     - Evaluate engagement metrics quality
     - Detect artificial engagement patterns
     - Calculate confidence based on data volume and diversity
     - Generate explanation of social perception

4. **Score Aggregation System**:
   - Implement weighted combination of all factors
   - Adjust weights based on data completeness and confidence
   - Normalize final scores to 0-100% scale
   - Calculate overall confidence intervals
   - Generate comprehensive score explanations
   - Create visualization-ready data structures

5. **Score Update Mechanism**:
   - Design event-based triggers for score recalculation
   - Implement incremental updates when possible
   - Track significant changes for notifications
   - Maintain score history with timestamps
   - Generate change explanations

### 2. Trust Factor Analysis System

**Objective**: Create detailed analysis of each trust factor with rich explanations and visualization data.

**Requirements**:

1. **Factor Detail Generation**:
   - Implement explanatory text generation for each factor
   - Create highlight extraction for exceptional factors (positive or negative)
   - Generate comparative analysis against collection average
   - Build historical trend data for each factor
   - Design visualization-ready data structures

2. **Red Flag Detection**:
   - Implement specific detection for common warning signs
   - Create severity classification for detected issues
   - Generate plain language explanations of concerns
   - Build evidence linking for all flagged items
   - Design priority ordering for multiple flags

3. **Strength Identification**:
   - Implement detection of exceptional positive signals
   - Create significance classification for strengths
   - Generate explanations of trust advantages
   - Build evidence supporting identified strengths
   - Design priority ordering for multiple strengths

4. **Confidence Calculation**:
   - Implement data completeness assessment
   - Create statistical confidence interval generation
   - Build explanation of confidence limitations
   - Generate recommendations for improving confidence
   - Design visual indicators for confidence levels

### 3. Multi-Factor Risk Assessment

**Objective**: Develop a comprehensive risk evaluation system based on trust factors and additional risk dimensions.

**Requirements**:

1. **Risk Dimension Implementation**:
   - Convert trust factors to specific risk indicators
   - Implement additional risk dimensions:
     - Liquidity risk (based on trading frequency)
     - Volatility risk (based on price stability)
     - Creator abandonment risk (based on activity patterns)
     - Collection sustainability risk (based on community trends)
     - Market timing risk (based on cycle analysis)
   - Calculate confidence for each risk dimension
   - Generate detailed risk explanations
   - Create visualization-ready risk data

2. **Risk Profile Generation**:
   - Implement overall risk assessment (Low/Medium/High)
   - Create dimension-specific risk ratings
   - Generate comprehensive risk explanation
   - Build comparative risk analysis
   - Design personalized risk highlighting based on preferences

3. **Risk Mitigation Recommendations**:
   - Implement conditional suggestion logic
   - Create personalized recommendation system
   - Generate actionable mitigation strategies
   - Build explanation of recommendation benefits
   - Design priority ordering for multiple recommendations

### 4. Real-Time Update System

**Objective**: Create an event-driven system that maintains score freshness and notifies of significant changes.

**Requirements**:

1. **Event Processing Implementation**:
   - Create listeners for blockchain events (transfers, sales)
   - Implement webhooks for fraud detection updates
   - Build integration with social monitoring systems
   - Design market condition change detection
   - Develop event prioritization and routing

2. **Incremental Update Logic**:
   - Implement efficient recalculation strategies
   - Create dependency tracking between factors
   - Build change significance evaluation
   - Design cache invalidation logic
   - Develop update propagation across related entities

3. **Notification Generation**:
   - Implement significant change detection
   - Create personalized notification thresholds
   - Build natural language change descriptions
   - Design notification priority classification
   - Develop delivery channel determination

### 5. API Development

**Objective**: Create comprehensive API endpoints that expose trust scores and related analytics.

**Requirements**:

1. **Core Endpoints Implementation**:
   - `/scores/nft/{token_id}` for NFT trust scores
   - `/scores/creator/{address}` for creator reputation
   - `/scores/collection/{collection_id}` for collection trust
   - `/risk/profile/{token_id}` for risk assessment
   - Additional endpoints for detailed factor analysis

2. **Query Capabilities**:
   - Implement filtering options for collections
   - Create field selection parameters
   - Build sorting options for results
   - Design pagination for large result sets
   - Develop advanced search functionality

3. **Response Formatting**:
   - Create consistent JSON structure
   - Implement versioning strategy
   - Build error handling standardization
   - Design metadata inclusion (timestamps, confidence)
   - Develop explanation formatting options

4. **Performance Optimization**:
   - Implement response caching with appropriate TTL
   - Create database query optimization
   - Build response compression
   - Design batch processing for high-volume requests
   - Develop asynchronous processing for complex operations

## Technical Considerations

1. **Data Storage**:
   - Use time-series database for score history
   - Implement document storage for rich factor data
   - Create efficient indexing for common queries
   - Design appropriate data retention policies
   - Develop backup and recovery procedures

2. **Processing Architecture**:
   - Implement event-driven architecture
   - Create scalable processing pipelines
   - Build asynchronous processing for intensive operations
   - Design appropriate threading and concurrency
   - Develop error handling and retry logic

3. **Performance Requirements**:
   - Score update latency under 30 seconds for new events
   - API response time under 200ms for score retrieval
   - Support for high-volume concurrent requests
   - Efficient handling of large collections
   - Graceful degradation under load

4. **Security Considerations**:
   - Implement API authentication
   - Create rate limiting mechanisms
   - Build data access controls
   - Design audit logging for sensitive operations
   - Develop protection against common attacks

## Success Metrics

- Trust score accuracy validated against expert assessments (>90% agreement)
- Score update latency under 30 seconds for new events
- API response time under 200ms for score retrieval
- User-reported trust score usefulness rating >4.5/5
- Successful identification of problematic NFTs before issues become widely known
