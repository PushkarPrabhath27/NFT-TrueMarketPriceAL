# Hathor Network Nano Contracts API

## Overview

This section documents the API endpoints specific to Hathor Network nano contracts integration. These endpoints allow you to retrieve trust scores and detailed analysis for NFTs associated with Hathor nano contracts.

## Endpoints

### Get Nano Contract Trust Score

```
GET /hathor/contracts/{contractId}/trust-score
```

Returns a comprehensive trust score for a Hathor nano contract.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| contractId | string | The unique identifier of the Hathor nano contract |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| include_transactions | boolean | Whether to include transaction data in the response (default: false) |
| include_blueprint | boolean | Whether to include blueprint details in the response (default: true) |

#### Response

```json
{
  "success": true,
  "data": {
    "contractId": "example-contract-id",
    "trustScore": {
      "score": 0.85,
      "confidence": 0.92,
      "explanation": "This Hathor nano contract shows excellent trust characteristics...",
      "lastUpdated": "2023-06-15T14:30:00Z"
    },
    "trustFactors": {
      "blueprintQuality": 0.9,
      "stateConsistency": 0.8,
      "transactionLegitimacy": 0.85,
      "balanceLegitimacy": 0.82
    },
    "blueprint": {
      "id": "example-blueprint-id",
      "name": "NFT Marketplace",
      "type": "built-in",
      "securityScore": 0.95
    },
    "redFlags": [],
    "strengths": [
      "Uses official built-in blueprint",
      "Active contract with substantial transaction history",
      "Consistent state structure"
    ]
  }
}
```

### Get Nano Contract Details

```
GET /hathor/contracts/{contractId}
```

Returns detailed information about a Hathor nano contract.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| contractId | string | The unique identifier of the Hathor nano contract |

#### Response

```json
{
  "success": true,
  "data": {
    "contractId": "example-contract-id",
    "blueprintId": "example-blueprint-id",
    "blueprintName": "NFT Marketplace",
    "blueprintType": "built-in",
    "state": {
      "owner": "hathor-address-123",
      "feePercentage": 2.5,
      "isActive": true
    },
    "balance": {
      "HTR": "10.5",
      "tokens": {
        "token-id-1": "5.0",
        "token-id-2": "2.0"
      }
    },
    "creationDate": "2023-01-15T12:00:00Z",
    "lastActivityDate": "2023-06-10T09:45:00Z",
    "transactionCount": 156
  }
}
```

### Get Blueprint Analysis

```
GET /hathor/blueprints/{blueprintId}/analysis
```

Returns a detailed analysis of a Hathor nano contract blueprint.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| blueprintId | string | The unique identifier of the blueprint |

#### Response

```json
{
  "success": true,
  "data": {
    "blueprintId": "example-blueprint-id",
    "name": "NFT Marketplace",
    "type": "built-in",
    "analysis": {
      "securityScore": 0.95,
      "codeQuality": 0.9,
      "documentation": 0.85,
      "communityAdoption": 0.8
    },
    "methods": [
      {
        "name": "createListing",
        "type": "public",
        "securityRisk": "low"
      },
      {
        "name": "purchaseNFT",
        "type": "public",
        "securityRisk": "low"
      }
    ],
    "strengths": [
      "Well-documented code",
      "Proper input validation",
      "Secure token handling"
    ],
    "concerns": []
  }
}
```

### Get NFT Trust Score with Hathor Data

```
GET /nfts/{nftId}/trust-score?include_hathor=true
```

Returns a trust score for an NFT, including Hathor nano contract data if available.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| nftId | string | The unique identifier of the NFT |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| include_hathor | boolean | Whether to include Hathor nano contract data (default: false) |
| hathor_contract_id | string | Optional Hathor contract ID to associate with this NFT |

#### Response

```json
{
  "success": true,
  "data": {
    "nftId": "example-nft-id",
    "trustScore": {
      "score": 0.88,
      "confidence": 0.9,
      "explanation": "This NFT shows excellent trust characteristics...",
      "lastUpdated": "2023-06-15T14:30:00Z"
    },
    "trustFactors": {
      "originality": 0.9,
      "transactionLegitimacy": 0.85,
      "creatorReputation": 0.92,
      "collectionPerformance": 0.88,
      "metadataConsistency": 0.95,
      "marketplaceVerification": 1.0,
      "socialValidation": 0.8,
      "hathorNanoContract": 0.85
    },
    "hathorData": {
      "contractId": "example-contract-id",
      "blueprintName": "NFT Marketplace",
      "blueprintType": "built-in",
      "trustMetrics": {
        "blueprintQuality": 0.9,
        "stateConsistency": 0.8,
        "transactionLegitimacy": 0.85,
        "balanceLegitimacy": 0.82
      }
    },
    "redFlags": [],
    "strengths": [
      "Verified on major marketplaces",
      "Strong creator history",
      "Uses trusted Hathor nano contract blueprint"
    ]
  }
}
```

## WebSocket Events

### Nano Contract Trust Score Updates

Subscribe to real-time updates for Hathor nano contract trust scores.

```
wss://api.nfttrustscoreplatform.com/ws/hathor/contracts/{contractId}/trust-score
```

#### Event Data

```json
{
  "event": "hathor_contract_trust_update",
  "contractId": "example-contract-id",
  "trustScore": {
    "score": 0.85,
    "confidence": 0.92,
    "lastUpdated": "2023-06-15T14:30:00Z"
  },
  "changes": {
    "previousScore": 0.82,
    "factorChanges": {
      "transactionLegitimacy": "+0.05",
      "stateConsistency": "-0.02"
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 4001 | Invalid Hathor contract ID |
| 4002 | Blueprint not found |
| 4003 | Contract state unavailable |
| 4004 | Transaction history unavailable |
| 5001 | Hathor Network connection error |

## Examples

### cURL

```bash
curl -X GET "https://api.nfttrustscoreplatform.com/api/v1/hathor/contracts/example-contract-id/trust-score" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### JavaScript

```javascript
const response = await fetch(
  'https://api.nfttrustscoreplatform.com/api/v1/hathor/contracts/example-contract-id/trust-score',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);
const data = await response.json();
console.log(data);
```

### Python

```python
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY'
}

response = requests.get(
    'https://api.nfttrustscoreplatform.com/api/v1/hathor/contracts/example-contract-id/trust-score',
    headers=headers
)

data = response.json()
print(data)
```