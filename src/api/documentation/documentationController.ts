/**
 * Documentation Controller
 * 
 * Implements API documentation endpoints and integrates Swagger UI.
 */

import { Router, Request, Response } from 'express';
import { swaggerSpec, getSwaggerUI } from './swaggerConfig';
import { formatErrorResponse, getErrorGuidance, ERROR_CODES } from './errorCodes';

/**
 * Documentation controller that provides API documentation endpoints
 */
export class DocumentationController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  /**
   * Initialize documentation routes
   */
  private initializeRoutes(): void {
    // Swagger JSON endpoint
    this.router.get('/swagger.json', this.getSwaggerJson);
    
    // Swagger UI endpoint
    this.router.get('/', this.getSwaggerUI);
    
    // Error codes documentation
    this.router.get('/error-codes', this.getErrorCodes);
    
    // Code examples endpoint
    this.router.get('/examples/:language', this.getCodeExamples);
    
    // Authentication documentation
    this.router.get('/authentication', this.getAuthenticationDocs);
    
    // SDK documentation
    this.router.get('/sdk', this.getSDKDocs);
    
    // API playground
    this.router.get('/playground', this.getApiPlayground);
    
    // Rate limiting documentation
    this.router.get('/rate-limits', this.getRateLimitDocs);
  }

  /**
   * Get Swagger JSON specification
   */
  private getSwaggerJson = (req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  };

  /**
   * Get Swagger UI HTML
   */
  private getSwaggerUI = (req: Request, res: Response): void => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.setHeader('Content-Type', 'text/html');
    res.send(getSwaggerUI(baseUrl));
  };

  /**
   * Get error codes documentation
   */
  private getErrorCodes = (req: Request, res: Response): void => {
    const errorCodes = Object.entries(ERROR_CODES).map(([key, error]) => ({
      code: error.code,
      httpStatus: error.httpStatus,
      message: error.message,
      category: error.category,
      guidance: getErrorGuidance(key)
    }));
    
    res.json({
      status: 'success',
      data: {
        errorCodes
      }
    });
  };

  /**
   * Get code examples for different programming languages
   */
  private getCodeExamples = (req: Request, res: Response): void => {
    const language = req.params.language;
    const endpoint = req.query.endpoint as string || 'scores/nft/{token_id}';
    
    // In a real implementation, this would retrieve examples from a database or file system
    // For demonstration, we'll return hardcoded examples for a few languages
    
    let example = '';
    let contentType = 'text/plain';
    
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        example = this.getJavaScriptExample(endpoint);
        contentType = 'application/javascript';
        break;
      
      case 'python':
      case 'py':
        example = this.getPythonExample(endpoint);
        contentType = 'text/x-python';
        break;
      
      case 'curl':
        example = this.getCurlExample(endpoint);
        contentType = 'text/plain';
        break;
      
      default:
        return res.status(404).json(formatErrorResponse(
          'NOT_FOUND',
          `Code examples for language '${language}' not found`
        ));
    }
    
    res.setHeader('Content-Type', contentType);
    res.send(example);
  };

  /**
   * Get JavaScript code example
   */
  private getJavaScriptExample(endpoint: string): string {
    return `// Example using fetch API
const apiKey = 'YOUR_API_KEY';
const baseUrl = 'https://api.nfttrustscoreplatform.com/api/v1';

async function fetchData() {
  try {
    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.message}`);
    }
    
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Call the function
fetchData();
`;
  }

  /**
   * Get Python code example
   */
  private getPythonExample(endpoint: string): string {
    return `# Example using requests library
import requests

api_key = 'YOUR_API_KEY'
base_url = 'https://api.nfttrustscoreplatform.com/api/v1'

def fetch_data():
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(f'{base_url}/{endpoint}', headers=headers)
    
    if response.status_code != 200:
        error_data = response.json()
        raise Exception(f"API Error: {error_data['message']}")
    
    data = response.json()
    print('Success:', data)
    return data

# Call the function
try:
    result = fetch_data()
except Exception as e:
    print('Error:', e)
`;
  }

  /**
   * Get cURL code example
   */
  private getCurlExample(endpoint: string): string {
    return `# Example using cURL
curl -X GET \
  "https://api.nfttrustscoreplatform.com/api/v1/${endpoint}" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
`;
  }

  /**
   * Get authentication documentation
   */
  private getAuthenticationDocs = (req: Request, res: Response): void => {
    const authDocs = {
      status: 'success',
      data: {
        authentication_methods: [
          {
            type: 'API Key',
            description: 'Simple authentication using an API key in the Authorization header',
            usage: 'Include your API key in the Authorization header as a Bearer token',
            example: 'Authorization: Bearer YOUR_API_KEY',
            security_recommendations: [
              'Keep your API key secure and never share it',
              'Rotate your API key periodically',
              'Use environment variables to store API keys'
            ]
          },
          {
            type: 'OAuth2',
            description: 'Secure delegated access using OAuth 2.0 protocol',
            flows: {
              authorization_code: {
                description: 'For web applications with server-side component',
                steps: [
                  'Redirect user to authorization endpoint',
                  'User approves access',
                  'Exchange authorization code for access token',
                  'Use access token for API requests'
                ],
                endpoints: {
                  authorization: '/oauth2/authorize',
                  token: '/oauth2/token'
                }
              },
              client_credentials: {
                description: 'For secure server-to-server authentication',
                steps: [
                  'Exchange client credentials for access token',
                  'Use access token for API requests'
                ],
                endpoints: {
                  token: '/oauth2/token'
                }
              }
            },
            scopes: [
              'read:scores',
              'write:scores',
              'read:analytics',
              'admin'
            ]
          },
          {
            type: 'JWT',
            description: 'JSON Web Token based authentication',
            usage: 'Include a signed JWT in the Authorization header',
            token_format: {
              header: 'Contains token type and signing algorithm',
              payload: 'Contains claims about the user/client',
              signature: 'Ensures token integrity'
            },
            claims: {
              required: ['sub', 'iat', 'exp'],
              optional: ['scope', 'client_id']
            },
            example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        ],
        best_practices: [
          'Always use HTTPS for API requests',
          'Implement rate limiting on token endpoints',
          'Use short-lived access tokens',
          'Implement token refresh mechanism',
          'Monitor for suspicious authentication patterns'
        ]
      }
    };
    
    res.json(authDocs);
  };

  /**
   * Get SDK documentation
   */
  private getSDKDocs = (req: Request, res: Response): void => {
    const sdkDocs = {
      status: 'success',
      data: {
        sdks: [
          {
            language: 'JavaScript/TypeScript',
            package_name: '@nft-trustscore/sdk',
            installation: {
              npm: 'npm install @nft-trustscore/sdk',
              yarn: 'yarn add @nft-trustscore/sdk'
            },
            configuration: {
              example: `
import { NFTTrustScore } from '@nft-trustscore/sdk';

const client = new NFTTrustScore({
  apiKey: 'YOUR_API_KEY',
  environment: 'production' // or 'sandbox' for testing
});
`,
              options: {
                apiKey: 'Your API key (required)',
                environment: 'production or sandbox (optional)',
                timeout: 'Request timeout in ms (optional)',
                retries: 'Number of retry attempts (optional)'
              }
            },
            usage_examples: [
              {
                title: 'Get NFT Trust Score',
                code: `
const score = await client.scores.getNFTScore({
  tokenId: '123',
  blockchain: 'ethereum'
});

console.log(score.trustScore);
`
              },
              {
                title: 'Get Price Intelligence',
                code: `
const priceData = await client.price.getIntelligence({
  tokenId: '123',
  blockchain: 'ethereum'
});

console.log(priceData.estimatedValue);
`
              }
            ]
          },
          {
            language: 'Python',
            package_name: 'nft-trustscore',
            installation: {
              pip: 'pip install nft-trustscore',
              poetry: 'poetry add nft-trustscore'
            },
            configuration: {
              example: `
from nft_trustscore import NFTTrustScore

client = NFTTrustScore(
    api_key='YOUR_API_KEY',
    environment='production'  # or 'sandbox' for testing
)
`,
              options: {
                api_key: 'Your API key (required)',
                environment: 'production or sandbox (optional)',
                timeout: 'Request timeout in seconds (optional)',
                retries: 'Number of retry attempts (optional)'
              }
            },
            usage_examples: [
              {
                title: 'Get NFT Trust Score',
                code: `
score = client.scores.get_nft_score(
    token_id='123',
    blockchain='ethereum'
)

print(score.trust_score)
`
              },
              {
                title: 'Get Price Intelligence',
                code: `
price_data = client.price.get_intelligence(
    token_id='123',
    blockchain='ethereum'
)

print(price_data.estimated_value)
`
              }
            ]
          }
        ],
        support: {
          documentation: 'https://docs.nfttrustscoreplatform.com',
          github: 'https://github.com/nft-trustscore',
          discord: 'https://discord.gg/nft-trustscore',
          email: 'sdk-support@nfttrustscore.com'
        },
        best_practices: [
          'Always handle API errors appropriately',
          'Use environment variables for API keys',
          'Implement proper rate limiting handling',
          'Cache responses when appropriate',
          'Keep SDK up to date with the latest version'
        ]
      }
    };
    
    res.json(sdkDocs);
  };

  /**
   * Get API playground interface
   */
  private getApiPlayground = (req: Request, res: Response): void => {
    const playgroundData = {
      status: 'success',
      data: {
        available_endpoints: [
          {
            path: '/api/v1/scores/nft/{token_id}',
            method: 'GET',
            description: 'Get trust score for an NFT',
            parameters: [
              {
                name: 'token_id',
                type: 'string',
                required: true,
                description: 'The NFT token ID'
              },
              {
                name: 'blockchain',
                type: 'string',
                required: true,
                description: 'Blockchain network (e.g., ethereum, solana)',
                location: 'query'
              }
            ],
            headers: [
              {
                name: 'Authorization',
                value: 'Bearer YOUR_API_KEY',
                required: true
              }
            ],
            example_response: {
              status: 'success',
              data: {
                token_id: '123',
                blockchain: 'ethereum',
                trust_score: 85.5,
                confidence: 'high',
                last_updated: '2023-01-01T00:00:00Z'
              }
            }
          },
          {
            path: '/api/v1/price/intelligence/{token_id}',
            method: 'GET',
            description: 'Get price intelligence for an NFT',
            parameters: [
              {
                name: 'token_id',
                type: 'string',
                required: true,
                description: 'The NFT token ID'
              },
              {
                name: 'blockchain',
                type: 'string',
                required: true,
                description: 'Blockchain network (e.g., ethereum, solana)',
                location: 'query'
              }
            ],
            headers: [
              {
                name: 'Authorization',
                value: 'Bearer YOUR_API_KEY',
                required: true
              }
            ],
            example_response: {
              status: 'success',
              data: {
                token_id: '123',
                blockchain: 'ethereum',
                estimated_value: 1.5,
                currency: 'ETH',
                confidence: 'high',
                last_updated: '2023-01-01T00:00:00Z'
              }
            }
          }
        ],
        testing_tools: {
          request_builder: {
            description: 'Interactive tool to build and test API requests',
            features: [
              'Dynamic parameter input',
              'Header management',
              'Request preview',
              'Response visualization'
            ]
          },
          environment_manager: {
            description: 'Manage different API environments',
            environments: [
              {
                name: 'sandbox',
                base_url: 'https://sandbox-api.nfttrustscoreplatform.com/api/v1'
              },
              {
                name: 'production',
                base_url: 'https://api.nfttrustscoreplatform.com/api/v1'
              }
            ]
          },
          response_inspector: {
            description: 'Tools for inspecting API responses',
            features: [
              'JSON formatting and syntax highlighting',
              'Response headers inspection',
              'Response time monitoring',
              'Error message parsing'
            ]
          }
        },
        tips: [
          'Use the sandbox environment for testing',
          'Check response headers for rate limit information',
          'Inspect error responses carefully for debugging',
          'Save commonly used requests as templates'
        ]
      }
    };
    
    res.json(playgroundData);
  };
    const sdkDocs = {
      status: 'success',
      data: {
        sdks: [
          {
            language: 'JavaScript/TypeScript',
            package_name: '@nft-trustscore/sdk',
            installation: {
              npm: 'npm install @nft-trustscore/sdk',
              yarn: 'yarn add @nft-trustscore/sdk'
            },
            configuration: {
              example: `
import { NFTTrustScore } from '@nft-trustscore/sdk';

const client = new NFTTrustScore({
  apiKey: 'YOUR_API_KEY',
  environment: 'production' // or 'sandbox' for testing
});
`,
              options: {
                apiKey: 'Your API key (required)',
                environment: 'production or sandbox (optional)',
                timeout: 'Request timeout in ms (optional)',
                retries: 'Number of retry attempts (optional)'
              }
            },
            usage_examples: [
              {
                title: 'Get NFT Trust Score',
                code: `
const score = await client.scores.getNFTScore({
  tokenId: '123',
  blockchain: 'ethereum'
});

console.log(score.trustScore);
`
              },
              {
                title: 'Get Price Intelligence',
                code: `
const priceData = await client.price.getIntelligence({
  tokenId: '123',
  blockchain: 'ethereum'
});

console.log(priceData.estimatedValue);
`
              }
            ]
          },
          {
            language: 'Python',
            package_name: 'nft-trustscore',
            installation: {
              pip: 'pip install nft-trustscore',
              poetry: 'poetry add nft-trustscore'
            },
            configuration: {
              example: `
from nft_trustscore import NFTTrustScore

client = NFTTrustScore(
    api_key='YOUR_API_KEY',
    environment='production'  # or 'sandbox' for testing
)
`,
              options: {
                api_key: 'Your API key (required)',
                environment: 'production or sandbox (optional)',
                timeout: 'Request timeout in seconds (optional)',
                retries: 'Number of retry attempts (optional)'
              }
            },
            usage_examples: [
              {
                title: 'Get NFT Trust Score',
                code: `
score = client.scores.get_nft_score(
    token_id='123',
    blockchain='ethereum'
)

print(score.trust_score)
`
              },
              {
                title: 'Get Price Intelligence',
                code: `
price_data = client.price.get_intelligence(
    token_id='123',
    blockchain='ethereum'
)

print(price_data.estimated_value)
`
              }
            ]
          }
        ],
        support: {
          documentation: 'https://docs.nfttrustscoreplatform.com',
          github: 'https://github.com/nft-trustscore',
          discord: 'https://discord.gg/nft-trustscore',
          email: 'sdk-support@nfttrustscore.com'
        },
        best_practices: [
          'Always handle API errors appropriately',
          'Use environment variables for API keys',
          'Implement proper rate limiting handling',
          'Cache responses when appropriate',
          'Keep SDK up to date with the latest version'
        ]
      }
    };
    
    res.json(sdkDocs);
  };
    const authDocs = {
      status: 'success',
      data: {
        authentication_methods: [
          {
            type: 'API Key',
            description: 'Simple authentication using an API key in the Authorization header',
            usage: 'Include your API key in the Authorization header as a Bearer token',
            example: 'Authorization: Bearer YOUR_API_KEY',
            security_recommendations: [
              'Keep your API key secure and never share it',
              'Rotate your API key periodically',
              'Use environment variables to store API keys'
            ]
          },
          {
            type: 'OAuth2',
            description: 'Secure delegated access using OAuth 2.0 protocol',
            flows: {
              authorization_code: {
                description: 'For web applications with server-side component',
                steps: [
                  'Redirect user to authorization endpoint',
                  'User approves access',
                  'Exchange authorization code for access token',
                  'Use access token for API requests'
                ],
                endpoints: {
                  authorization: '/oauth2/authorize',
                  token: '/oauth2/token'
                }
              },
              client_credentials: {
                description: 'For secure server-to-server authentication',
                steps: [
                  'Exchange client credentials for access token',
                  'Use access token for API requests'
                ],
                endpoints: {
                  token: '/oauth2/token'
                }
              }
            },
            scopes: [
              'read:scores',
              'write:scores',
              'read:analytics',
              'admin'
            ]
          },
          {
            type: 'JWT',
            description: 'JSON Web Token based authentication',
            usage: 'Include a signed JWT in the Authorization header',
            token_format: {
              header: 'Contains token type and signing algorithm',
              payload: 'Contains claims about the user/client',
              signature: 'Ensures token integrity'
            },
            claims: {
              required: ['sub', 'iat', 'exp'],
              optional: ['scope', 'client_id']
            },
            example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        ],
        best_practices: [
          'Always use HTTPS for API requests',
          'Implement rate limiting on token endpoints',
          'Use short-lived access tokens',
          'Implement token refresh mechanism',
          'Monitor for suspicious authentication patterns'
        ]
      }
    };
    
    res.json(authDocs);
  };
  }

  /**
   * Get router
   */
  public getRouter(): Router {
    return this.router;
  }
}

// Export singleton instance
export const documentationController = new DocumentationController();
export const documentationRouter = documentationController.getRouter();