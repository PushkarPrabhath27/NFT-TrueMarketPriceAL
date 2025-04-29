# Blockchain Data Extraction & Processing System Implementation Prompt

## Overview

You are tasked with building a comprehensive Blockchain Data Extraction & Processing System for NFTs. This system will connect to multiple blockchains, extract relevant NFT data, process and normalize it, and make it available to other components of the platform. This foundational layer will provide the raw data needed for trust scoring, price prediction, and fraud detection.

## Core Functionalities to Implement

### 1. Multi-Chain Connection Framework

**Objective**: Create a resilient system that can connect to and extract data from multiple blockchain networks.

**Implementation Requirements**:

1. **Node Connection Management**:
   - Implement connection handlers for the following blockchains:
     - Ethereum (mainnet and testnets)
     - Polygon
     - Solana
     - Flow
     - Other EVM-compatible chains (BSC, Avalanche, etc.)
   - Design a provider management system with:
     - Multiple provider fallback mechanism
     - Automatic health checking and rotation
     - Rate limit awareness and throttling
     - Connection pooling for efficiency
     - Credentials management and security

2. **Blockchain Interaction Standardization**:
   - Create a unified interface for cross-chain operations:
     - Standardized query methods
     - Chain-specific adapter implementations
     - Common response format normalization
     - Error handling and retry policies
     - Transaction confirmation strategies
   - Implement blockchain-specific optimizations:
     - Ethereum: Multicall for batched read operations
     - Solana: getProgramAccounts optimization
     - Flow: Cadence script optimization
     - Custom RPC method utilization where beneficial
     - Caching strategies appropriate to each chain

3. **Network Monitoring and Reliability**:
   - Develop comprehensive monitoring systems:
     - Connection status tracking
     - Response time measurement
     - Error rate monitoring
     - Chain reorganization detection
     - Network congestion awareness
   - Implement reliability enhancements:
     - Exponential backoff for retries
     - Circuit breakers for failing endpoints
     - Graceful degradation strategies
     - Alert mechanisms for persistent issues
     - Recovery procedures for interrupted operations

### 2. NFT Data Extraction Pipeline

**Objective**: Build a comprehensive system to extract all relevant NFT data from supported blockchains.

**Implementation Requirements**:

1. **Contract Discovery and Monitoring**:
   - Implement NFT contract discovery mechanisms:
     - Standard interface detection (ERC-721, ERC-1155, etc.)
     - Marketplace integration for popular collections
     - On-chain registry monitoring
     - New deployment detection
     - Verification status tracking
   - Create contract monitoring systems:
     - Event subscription management
     - Block-by-block scanning where needed
     - Contract update detection
     - Proxy implementation tracking
     - Gas optimization for monitoring operations

2. **Historical Data Extraction**:
   - Design efficient historical data retrieval:
     - Block range chunking strategies
     - Parallel processing of independent chunks
     - Progress tracking and resumability
     - Prioritization based on relevance and demand
     - Completeness verification
   - Implement specialized extraction for:
     - Transfer events across all supported standards
     - Minting events and initial distributions
     - Marketplace transactions (bids, listings, sales)
     - Metadata updates and reveals
     - Collection-wide events (airdrops, burns)

3. **Real-time Event Capture**:
   - Create real-time event listeners for:
     - Transfer events (ERC-721/ERC-1155 Transfer, etc.)
     - Sale events across major marketplaces
     - Minting and burning events
     - Metadata updates
     - Collection-level changes
   - Implement event processing with:
     - Deduplication mechanisms
     - Ordering guarantees
     - Confirmation policies
     - Reorg handling
     - Backfilling for missed events

### 3. Metadata Processing System

**Objective**: Develop a robust system to retrieve, parse, and normalize NFT metadata from various sources.

**Implementation Requirements**:

1. **Metadata Retrieval Framework**:
   - Implement retrieval from diverse sources:
     - IPFS (with multiple gateway support)
     - Arweave
     - HTTP/HTTPS endpoints
     - On-chain storage
     - Decentralized storage networks
   - Design a resilient fetching system:
     - Timeout handling and retry logic
     - Caching with appropriate invalidation
     - Rate limiting for external APIs
     - Prioritization for high-demand items
     - Failure logging and alerting

2. **Metadata Parsing and Normalization**:
   - Create parsers for common metadata standards:
     - OpenSea metadata standard
     - Rarible metadata format
     - Foundation format
     - Solana Metaplex standard
     - Custom collection-specific formats
   - Implement normalization pipeline:
     - Schema validation and error handling
     - Field extraction and mapping
     - Type conversion and validation
     - Missing field handling
     - Versioning for schema changes

3. **Media Asset Processing**:
   - Develop media retrieval and verification:
     - Image download and validation
     - Video and animation handling
     - 3D model processing
     - Audio file handling
     - Integrity verification
   - Implement media processing:
     - Thumbnail generation
     - Format conversion where needed
     - Metadata extraction (dimensions, duration, etc.)
     - Preview generation
     - Storage optimization

### 4. Data Storage and Access Layer

**Objective**: Create an efficient storage architecture and access layer for processed blockchain and NFT data.

**Implementation Requirements**:

1. **Database Schema Design**:
   - Design optimized schemas for:
     - NFT entities (tokens, collections, creators)
     - Transaction history
     - Ownership records
     - Metadata and attributes
     - Media references
   - Implement advanced indexing strategies:
     - Query pattern-based indexing
     - Composite indexes for common filters
     - Time-series optimization for historical data
     - Full-text search capabilities
     - Geospatial indexing where relevant

2. **Data Consistency and Integrity**:
   - Develop consistency mechanisms:
     - Transaction-based updates
     - Optimistic concurrency control
     - Idempotent processing
     - Conflict resolution strategies
     - Data validation rules
   - Implement integrity assurance:
     - Referential integrity enforcement
     - Constraint validation
     - Corruption detection
     - Automated reconciliation
     - Audit logging

3. **Query and Access Optimization**:
   - Create efficient data access patterns:
     - Prepared query templates
     - Connection pooling
     - Query result caching
     - Read/write splitting where appropriate
     - Pagination and cursor-based iteration
   - Implement specialized access methods:
     - Bulk operations for batch processing
     - Streaming for large result sets
     - Aggregation pipelines for analytics
     - Time-window queries for historical analysis
     - Complex filtering capabilities

### 5. Data Enrichment Pipeline

**Objective**: Enhance raw blockchain data with additional information to increase its utility for downstream systems.

**Implementation Requirements**:

1. **Rarity and Trait Analysis**:
   - Implement collection-wide analysis:
     - Trait distribution calculation
     - Rarity score computation
     - Statistical analysis of attributes
     - Trait correlation detection
     - Outlier identification
   - Create rarity ranking systems:
     - Multiple rarity calculation methodologies
     - Percentile and rank assignment
     - Comparative rarity across collections
     - Time-based rarity evolution
     - Trait combination analysis

2. **Ownership and Wallet Analysis**:
   - Develop wallet profiling:
     - Holding period analysis
     - Portfolio composition
     - Trading frequency patterns
     - Interaction with known entities
     - Historical behavior patterns
   - Implement relationship mapping:
     - Connected wallet detection
     - Common ownership patterns
     - Transfer relationship graphs
     - Marketplace interaction history
     - Creator-collector relationships

3. **Historical Price Analysis**:
   - Create price history tracking:
     - Sale price normalization across currencies
     - Time-series price data organization
     - Floor price calculation and tracking
     - Volume analysis by time period
     - Price trend identification
   - Implement comparative price analysis:
     - Similar NFT price comparison
     - Collection-wide price patterns
     - Market segment benchmarking
     - Volatility calculation
     - Liquidity assessment

## Technical Considerations

1. **Scalability Requirements**:
   - Design for horizontal scaling of processing components
   - Implement sharding strategies for large collections
   - Create efficient data partitioning schemes
   - Develop load balancing for processing tasks
   - Build capacity planning and auto-scaling capabilities

2. **Performance Optimization**:
   - Optimize for high throughput event processing
   - Implement batch processing where appropriate
   - Create efficient caching strategies at multiple levels
   - Design for minimal latency in real-time data access
   - Develop performance monitoring and bottleneck detection

3. **Reliability and Fault Tolerance**:
   - Implement comprehensive error handling
   - Create retry mechanisms with appropriate backoff
   - Design for graceful degradation
   - Develop data recovery procedures
   - Build redundancy into critical components

4. **Security Considerations**:
   - Implement secure credential management
   - Create access controls for sensitive data
   - Design audit logging for all operations
   - Develop input validation and sanitization
   - Build protection against common attack vectors

## Integration Points

1. **Upstream Integrations**:
   - Blockchain node providers
   - IPFS and decentralized storage gateways
   - Marketplace APIs for supplementary data
   - External metadata sources
   - Oracle services for price data

2. **Downstream Consumers**:
   - Trust Score Calculation Engine
   - Price Prediction Engine
   - Fraud Detection System
   - User Interface and Dashboard
   - Analytics and Reporting Systems

## Success Metrics

- Data completeness: >99% of relevant NFT data captured
- Real-time event processing latency: <30 seconds
- Historical data extraction throughput: >1000 NFTs per minute
- System uptime and reliability: >99.9%
- Query response time: <100ms for common queries
- Storage efficiency: Optimal balance of access speed and storage cost
- Data accuracy: >99.99% verified against blockchain sources