/**
 * Swagger Documentation Configuration
 * 
 * Configures OpenAPI/Swagger documentation for the NFT TrustScore API.
 */

import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config';

/**
 * Swagger configuration options
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NFT TrustScore API',
      version: `v${config.version}`,
      description: 'API for NFT TrustScore platform providing trust scores, price predictions, risk assessments, and blockchain data',
      contact: {
        name: 'API Support',
        email: 'api@nfttrustscoreplatform.com',
        url: 'https://nfttrustscoreplatform.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `https://api.nfttrustscoreplatform.com/api/v${config.version}`,
        description: 'Production server'
      },
      {
        url: `https://staging-api.nfttrustscoreplatform.com/api/v${config.version}`,
        description: 'Staging server'
      },
      {
        url: `http://localhost:${config.port}/api/v${config.version}`,
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'API key authentication. Format: "Bearer YOUR_API_KEY"'
        },
        JwtAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token authentication. Format: "Bearer YOUR_JWT_TOKEN"'
        },
        OAuth2Auth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://api.nfttrustscoreplatform.com/oauth/authorize',
              tokenUrl: 'https://api.nfttrustscoreplatform.com/oauth/token',
              scopes: {
                'read:scores': 'Read trust scores',
                'read:prices': 'Read price predictions',
                'read:risks': 'Read risk assessments',
                'read:blockchain': 'Read blockchain data',
                'write:feedback': 'Submit feedback'
              }
            }
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            code: {
              type: 'string',
              example: 'UNAUTHORIZED'
            },
            message: {
              type: 'string',
              example: 'Authentication required'
            },
            details: {
              type: 'object',
              nullable: true
            }
          }
        },
        TrustScore: {
          type: 'object',
          properties: {
            tokenId: {
              type: 'string',
              example: '0x1234...5678'
            },
            score: {
              type: 'number',
              format: 'float',
              example: 85.7
            },
            confidence: {
              type: 'number',
              format: 'float',
              example: 0.92
            },
            factors: {
              type: 'object',
              properties: {
                authenticity: {
                  type: 'number',
                  format: 'float',
                  example: 90.2
                },
                market: {
                  type: 'number',
                  format: 'float',
                  example: 82.5
                },
                creator: {
                  type: 'number',
                  format: 'float',
                  example: 88.1
                },
                technical: {
                  type: 'number',
                  format: 'float',
                  example: 78.3
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        // Additional schema definitions would be added here
      },
      parameters: {
        TokenIdParam: {
          name: 'token_id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'NFT token identifier'
        },
        CollectionIdParam: {
          name: 'collection_id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'NFT collection identifier'
        },
        AddressParam: {
          name: 'address',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Blockchain address'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'The request parameters failed validation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      { ApiKeyAuth: [] }
    ],
    tags: [
      {
        name: 'Trust Scores',
        description: 'Trust score endpoints'
      },
      {
        name: 'Price Intelligence',
        description: 'Price prediction endpoints'
      },
      {
        name: 'Risk Assessment',
        description: 'Risk assessment endpoints'
      },
      {
        name: 'Blockchain Data',
        description: 'Blockchain data endpoints'
      },
      {
        name: 'Fraud Detection',
        description: 'Fraud detection endpoints'
      },
      {
        name: 'Authentication',
        description: 'Authentication endpoints'
      }
    ]
  },
  apis: [
    './src/api/routes/*.ts',
    './src/api/middleware/*.ts',
    './src/api/documentation/endpoints/*.ts'
  ]
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Get Swagger UI HTML
 * 
 * @param baseUrl Base URL for the API
 * @returns HTML for Swagger UI
 */
export const getSwaggerUI = (baseUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>NFT TrustScore API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
      <link rel="icon" type="image/png" href="https://nfttrustscoreplatform.com/favicon.ico" />
      <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .topbar { display: none; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: "${baseUrl}/api-docs/swagger.json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tagsSorter: 'alpha',
            operationsSorter: 'alpha'
          });
          window.ui = ui;
        };
      </script>
    </body>
    </html>
  `;
};