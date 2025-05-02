# NFT TrustScore API

A comprehensive API system for the NFT TrustScore platform that provides trust scores, price intelligence, risk assessments, blockchain data, and fraud detection for NFTs.

## Features

- **Trust Score Analysis**: Get comprehensive trust scores for NFTs based on multiple factors
- **Price Intelligence**: Access price predictions and historical data for NFTs
- **Risk Assessment**: Evaluate risk profiles for NFT investments
- **Blockchain Data**: Retrieve NFT metadata and blockchain information
- **Fraud Detection**: Identify potential fraud through image similarity, wash trading detection, and more

## API Documentation

The API is fully documented using Swagger. When running the server, you can access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/nft-trustscore.git
   cd nft-trustscore
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. For production use
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

The API is organized into the following main categories:

### Trust Score Endpoints

- `GET /api/v1/scores/nft/{token_id}` - Get trust score for an individual NFT
- `GET /api/v1/scores/nft/{token_id}/history` - Get historical trust scores for an NFT
- `GET /api/v1/scores/nft/{token_id}/factors` - Get detailed factor analysis for an NFT

### Price Intelligence Endpoints

- `GET /api/v1/price/prediction/{token_id}` - Get price forecast for an NFT
- `GET /api/v1/price/history/{token_id}` - Get historical price data for an NFT
- `GET /api/v1/price/comparable/{token_id}` - Get comparable NFTs with similar price characteristics

### Risk Assessment Endpoints

- `GET /api/v1/risk/profile/{token_id}` - Get comprehensive risk assessment for an NFT
- `GET /api/v1/risk/factors/{token_id}` - Get detailed risk factor breakdown for an NFT

### Blockchain Data Endpoints

- `GET /api/v1/blockchain/nft/{token_id}` - Get NFT metadata and details
- `GET /api/v1/blockchain/collection/{collection_id}` - Get collection information
- `GET /api/v1/blockchain/creator/{address}` - Get creator profile

### Fraud Detection Endpoints

- `GET /api/v1/fraud/image/{token_id}` - Get image similarity findings for an NFT
- `GET /api/v1/fraud/transaction/{token_id}` - Get wash trading detection for an NFT
- `GET /api/v1/fraud/metadata/{token_id}` - Get metadata validation for an NFT
- `GET /api/v1/fraud/contract/{collection_id}` - Get smart contract analysis for a collection
- `GET /api/v1/fraud/alerts/{entity_id}` - Get active fraud alerts for an entity
- `POST /api/v1/fraud/report` - Submit a suspicious activity report

## Authentication

The API uses API key authentication. Include your API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- Free tier: 100 requests per hour
- Basic tier: 1,000 requests per hour
- Premium tier: 10,000 requests per hour
- Enterprise tier: Custom limits

## Error Handling

The API returns standard HTTP status codes and a consistent error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* Additional error details */ }
  }
}
```

## Development

### Project Structure

```
src/
├── api/
│   ├── middleware/      # API middleware (auth, validation, etc.)
│   ├── routes/          # API route definitions
│   ├── config.ts        # API configuration
│   ├── index.ts         # API gateway entry point
│   └── server.ts        # Server initialization
├── blockchain/          # Blockchain data services
├── fraud/               # Fraud detection services
├── price_prediction/    # Price intelligence services
├── trust_score/         # Trust score calculation services
└── risk/                # Risk assessment services
```

### Running Tests

```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please contact api@nfttrustscoreplatform.com