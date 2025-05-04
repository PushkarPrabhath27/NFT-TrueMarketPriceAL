# NFT TrustScore API Documentation

## Overview

The NFT TrustScore API provides comprehensive data and analysis for NFTs, including trust scores, price intelligence, risk assessments, blockchain data, and fraud detection. This document provides detailed information on how to use the API.

> **New:** For Hathor Network nano contracts integration, see [HATHOR_INTEGRATION.md](./docs/HATHOR_INTEGRATION.md) and [API_DOCUMENTATION_HATHOR.md](./API_DOCUMENTATION_HATHOR.md).

## Base URL

```
https://api.nfttrustscoreplatform.com/api/v1
```

For local development:

```
http://localhost:3000/api/v1
```

## Authentication

All API requests require authentication using an API key. Include your API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting

The API implements tier-based rate limiting:

| Tier | Requests per Hour |
|------|-------------------|
| Free | 100 |
| Basic | 1,000 |
| Premium | 10,000 |
| Enterprise | Custom |

You can specify your tier using the `X-User-Tier` header:

```
X-User-Tier: premium
```

If you exceed your rate limit, you'll receive a 429 Too Many Requests response.

## Response Format

All API responses follow a consistent format:

```json
{
  "data": { /* Response data */ },
  "meta": {
    "timestamp": "2023-05-15T10:30:00Z",
    /* Additional metadata */
  },
  "links": {
    "self": "/endpoint/path",
    /* Related resources */
  }
}
```

Error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* Additional error details */ }
  }
}
```

## API Endpoints

### Trust Score

#### Get NFT Trust Score

```
GET /scores/nft/{token_id}
```

Returns the trust score and related metrics for an NFT.

**Parameters:**
- `token_id` (path, required): The NFT token ID

**Response Example:**
```json
{
  "data": {
    "token_id": "token-123",
    "score": 85.7,
    "confidence": 0.92,
    "timestamp": "2023-05-15T10:30:00Z",
    "factors": {
      "authenticity": 90,
      "market_performance": 82,
      "creator_reputation": 88,
      "liquidity": 75,
      "community_engagement": 80
    },
    "risk_level": "low"
  },
  "meta": {
    "timestamp": "2023-05-15T10:30:00Z"
  },
  "links": {
    "self": "/scores/nft/token-123",
    "factors": "/scores/nft/token-123/factors",
    "history": "/scores/nft/token-123/history"
  }
}
```

#### Get Historical Trust Scores

```
GET /scores/nft/{token_id}/history
```

Returns historical trust scores for an NFT over time.

**Parameters:**
- `token_id` (path, required): The NFT token ID
- `period` (query, optional): Time period for history (day, week, month, year, all). Default: month

#### Get Detailed Factor Analysis

```
GET /scores/nft/{token_id}/factors
```

Returns detailed breakdown of factors contributing to an NFT's trust score.

**Parameters:**
- `token_id` (path, required): The NFT token ID

### Price Intelligence

#### Get Price Prediction

```
GET /price/prediction/{token_id}
```

Returns price forecast for an NFT.

**Parameters:**
- `token_id` (path, required): The NFT token ID
- `horizon` (query, optional): Time horizon for prediction (day, week, month, quarter, year). Default: month

#### Get Price History

```
GET /price/history/{token_id}
```

Returns historical price data for an NFT.

**Parameters:**
- `token_id` (path, required): The NFT token ID
- `period` (query, optional): Time period for history (day, week, month, quarter, year, all). Default: month

#### Get Comparable NFTs

```
GET /price/comparable/{token_id}
```

Returns NFTs with similar price characteristics.

**Parameters:**
- `token_id` (path, required): The NFT token ID
- `limit` (query, optional): Maximum number of comparable NFTs to return (1-50). Default: 10

### Risk Assessment

#### Get Risk Profile

```
GET /risk/profile/{token_id}
```

Returns comprehensive risk assessment for an NFT.

**Parameters:**
- `token_id` (path, required): The NFT token ID

#### Get Risk Factors

```
GET /risk/factors/{token_id}
```

Returns detailed risk factor breakdown for an NFT.

**Parameters:**
- `token_id` (path, required): The NFT token ID

### Blockchain Data

#### Get NFT Metadata

```
GET /blockchain/nft/{token_id}
```

Returns NFT metadata and details.

**Parameters:**
- `token_id` (path, required): The NFT token ID

#### Get Collection Information

```
GET /blockchain/collection/{collection_id}
```

Returns collection information.

**Parameters:**
- `collection_id` (path, required): The collection ID (contract address)

#### Get Creator Profile

```
GET /blockchain/creator/{address}
```

Returns creator profile information.

**Parameters:**
- `address` (path, required): The creator's blockchain address

### Fraud Detection

#### Get Image Similarity Analysis

```
GET /fraud/image/{token_id}
```

Returns image similarity findings for an NFT.

**Parameters:**
- `token_id` (path, required): The NFT token ID

#### Get Wash Trading Detection

```
GET /fraud/transaction/{token_id}
```

Returns wash trading detection for an NFT.

**Parameters:**
- `token_id` (path, required): The NFT token ID

#### Get Metadata Validation

```
GET /fraud/metadata/{token_id}
```

Returns metadata validation for an NFT.

**Parameters:**
- `token_id` (path, required): The NFT token ID

#### Get Smart Contract Analysis

```
GET /fraud/contract/{collection_id}
```

Returns smart contract analysis for a collection.

**Parameters:**
- `collection_id` (path, required): The collection ID (contract address)

#### Get Fraud Alerts

```
GET /fraud/alerts/{entity_id}
```

Returns active fraud alerts for an entity.

**Parameters:**
- `entity_id` (path, required): The entity ID (token, collection, or address)
- `entity_type` (query, required): Type of entity (nft, collection, address)

#### Submit Fraud Report

```
POST /fraud/report
```

Submits a suspicious activity report.

**Request Body:**
```json
{
  "entity_id": "token-123",
  "entity_type": "nft",
  "report_type": "fake_nft",
  "description": "This appears to be a copy of a known artwork",
  "evidence": {
    "original_url": "https://example.com/original-artwork",
    "similarity_points": ["identical background", "same signature style"]
  }
}
```

**Parameters:**
- `entity_id` (body, required): The entity ID (token, collection, or address)
- `entity_type` (body, required): Type of entity (nft, collection, address)
- `report_type` (body, required): Type of report (wash_trading, fake_nft, stolen_artwork, impersonation, other)
- `description` (body, required): Description of the suspicious activity
- `evidence` (body, optional): Evidence supporting the report

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - The request was successful |
| 201 | Created - The resource was successfully created |
| 400 | Bad Request - The request was invalid or cannot be served |
| 401 | Unauthorized - Authentication is required or failed |
| 403 | Forbidden - The request is not allowed |
| 404 | Not Found - The resource could not be found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Something went wrong on the server |
| 503 | Service Unavailable - The service is temporarily unavailable |

## Support

For API support, please contact api@nfttrustscoreplatform.com