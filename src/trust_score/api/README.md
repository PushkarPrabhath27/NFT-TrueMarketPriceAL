# NFT Trust Score API

## Overview

This API provides access to the NFT Trust Score Engine, allowing users to retrieve trust scores for NFTs, creators, and collections, along with detailed risk assessments and factor analysis.

## Core Endpoints

### NFT Trust Scores
- `GET /scores/nft/{token_id}` - Get trust score for a specific NFT
- `GET /scores/nft/{token_id}/history` - Get historical trust scores for an NFT
- `GET /scores/nft/{token_id}/factors` - Get detailed factor breakdown for an NFT

### Creator Reputation
- `GET /scores/creator/{address}` - Get reputation score for a creator
- `GET /scores/creator/{address}/history` - Get historical reputation data
- `GET /scores/creator/{address}/nfts` - Get trust scores for all NFTs by creator

### Collection Trust
- `GET /scores/collection/{collection_id}` - Get trust score for a collection
- `GET /scores/collection/{collection_id}/history` - Get historical collection scores
- `GET /scores/collection/{collection_id}/nfts` - Get trust scores for all NFTs in collection

### Risk Assessment
- `GET /risk/profile/{token_id}` - Get comprehensive risk assessment for an NFT
- `GET /risk/profile/{token_id}/dimensions` - Get detailed risk dimensions
- `GET /risk/profile/{token_id}/recommendations` - Get risk mitigation recommendations

### Factor Analysis
- `GET /factors/{factor_id}/details` - Get detailed information about a specific factor
- `GET /factors/list` - Get list of all available trust factors

## Query Capabilities

All endpoints support the following query parameters:

- `fields` - Comma-separated list of fields to include in response
- `sort` - Field to sort results by (prefix with `-` for descending order)
- `page` - Page number for paginated results
- `limit` - Number of results per page (max 100)
- `filter` - Filter results by specific criteria (format: `field:operator:value`)

## Response Format

All API responses follow a consistent JSON structure:

```json
{
  "meta": {
    "version": "1.0",
    "timestamp": "2023-06-15T12:34:56Z",
    "request_id": "abc123",
    "confidence": 0.95
  },
  "data": {
    // Response data varies by endpoint
  },
  "links": {
    "self": "/api/v1/scores/nft/123",
    "related": [
      "/api/v1/scores/nft/123/factors",
      "/api/v1/risk/profile/123"
    ]
  }
}
```

## Performance Optimization

The API implements several performance optimizations:

- Response caching with appropriate TTL values
- Database query optimization
- Response compression
- Batch processing for high-volume requests
- Asynchronous processing for complex operations

## Error Handling

Errors follow a standard format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "resource_type": "nft",
      "resource_id": "123"
    }
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Current limits:

- 100 requests per IP address per 15-minute window
- Higher limits available for authenticated clients

## Authentication

Some endpoints may require authentication. Use the `Authorization` header with a valid API key:

```
Authorization: Bearer your-api-key
```

## Versioning

API versioning is handled through the URL path. The current version is v1.