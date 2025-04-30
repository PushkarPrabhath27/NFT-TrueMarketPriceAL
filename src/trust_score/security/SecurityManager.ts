/**
 * SecurityManager.ts
 * 
 * Implements security measures for the Trust Score Engine as specified in the
 * technical considerations. This includes API authentication, rate limiting,
 * data access controls, audit logging, and protection against common attacks.
 */

import { TrustScoreTypes } from '../types';

/**
 * Configuration options for security features
 */
export interface SecurityConfig {
  // Authentication configuration
  authentication: {
    // Whether to enable authentication
    enabled: boolean;
    // Authentication methods to support
    methods: ('api_key' | 'jwt' | 'oauth2')[];
    // Token expiration time in seconds
    tokenExpirationSeconds: number;
    // Whether to use refresh tokens
    useRefreshTokens: boolean;
  };
  // Rate limiting configuration
  rateLimiting: {
    // Whether to enable rate limiting
    enabled: boolean;
    // Default requests per minute allowed
    defaultRequestsPerMinute: number;
    // Rate limits by endpoint or user tier
    limits: Map<string, number>;
    // Whether to use sliding window rate limiting
    useSlidingWindow: boolean;
  };
  // Data access control configuration
  accessControl: {
    // Whether to enable access control
    enabled: boolean;
    // Default access level
    defaultAccessLevel: 'read' | 'write' | 'admin';
    // Whether to enforce entity-level permissions
    enforceEntityPermissions: boolean;
  };
  // Audit logging configuration
  auditLogging: {
    // Whether to enable audit logging
    enabled: boolean;
    // Events to log
    logEvents: ('authentication' | 'access' | 'modification' | 'error')[];
    // Whether to include user information
    includeUserInfo: boolean;
    // Whether to include request details
    includeRequestDetails: boolean;
  };
  // Protection against common attacks
  attackProtection: {
    // Whether to enable protection against common attacks
    enabled: boolean;
    // Whether to enable CSRF protection
    enableCSRF: boolean;
    // Whether to enable XSS protection
    enableXSS: boolean;
    // Whether to enable SQL injection protection
    enableSQLInjection: boolean;
    // Whether to enable request validation
    enableRequestValidation: boolean;
  };
}

/**
 * User information for authentication and authorization
 */
export interface UserInfo {
  userId: string;
  username: string;
  accessLevel: 'read' | 'write' | 'admin';
  tier: string;
  permissions: string[];
}

/**
 * Request context for security checks
 */
export interface RequestContext {
  requestId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  user?: UserInfo;
}

/**
 * Security manager for implementing security measures
 */
export class SecurityManager {
  private config: SecurityConfig;
  private rateLimitCounters: Map<string, { count: number; resetTime: number }>;
  private auditLog: any[];
  
  /**
   * Initialize the security manager with configuration
   * 
   * @param config Configuration options for security
   */
  constructor(config?: Partial<SecurityConfig>) {
    // Default configuration
    this.config = {
      authentication: {
        enabled: true,
        methods: ['api_key', 'jwt'],
        tokenExpirationSeconds: 3600, // 1 hour
        useRefreshTokens: true
      },
      rateLimiting: {
        enabled: true,
        defaultRequestsPerMinute: 60,
        limits: new Map<string, number>([
          ['basic_tier', 60],
          ['premium_tier', 300],
          ['enterprise_tier', 1000],
          ['/scores/nft', 100],
          ['/scores/creator', 50],
          ['/scores/collection', 30]
        ]),
        useSlidingWindow: true
      },
      accessControl: {
        enabled: true,
        defaultAccessLevel: 'read',
        enforceEntityPermissions: true
      },
      auditLogging: {
        enabled: true,
        logEvents: ['authentication', 'access', 'modification', 'error'],
        includeUserInfo: true,
        includeRequestDetails: true
      },
      attackProtection: {
        enabled: true,
        enableCSRF: true,
        enableXSS: true,
        enableSQLInjection: true,
        enableRequestValidation: true
      },
      ...config
    };
    
    this.rateLimitCounters = new Map();
    this.auditLog = [];
  }
  
  /**
   * Authenticate a request
   * 
   * @param context Request context
   * @param credentials Authentication credentials
   * @returns User information if authenticated, null otherwise
   */
  public async authenticate(context: RequestContext, credentials: any): Promise<UserInfo | null> {
    if (!this.config.authentication.enabled) {
      return null;
    }
    
    // Log authentication attempt
    this.logAuditEvent('authentication', context, 'Authentication attempt', { success: false });
    
    // Implementation would verify credentials against a database
    // This is a placeholder implementation
    const user: UserInfo = {
      userId: 'user123',
      username: 'example_user',
      accessLevel: 'read',
      tier: 'basic_tier',
      permissions: ['read:nft', 'read:creator', 'read:collection']
    };
    
    // Log successful authentication
    this.logAuditEvent('authentication', context, 'Authentication successful', { 
      success: true,
      userId: user.userId,
      accessLevel: user.accessLevel
    });
    
    return user;
  }
  
  /**
   * Check if a request is within rate limits
   * 
   * @param context Request context
   * @returns Whether the request is allowed
   */
  public checkRateLimit(context: RequestContext): boolean {
    if (!this.config.rateLimiting.enabled) {
      return true;
    }
    
    // Determine rate limit key and limit
    const key = context.user ? `${context.user.tier}:${context.user.userId}` : `ip:${context.ipAddress}`;
    const endpoint = context.endpoint;
    
    // Get applicable limit
    let limit = this.config.rateLimiting.defaultRequestsPerMinute;
    if (context.user && this.config.rateLimiting.limits.has(context.user.tier)) {
      limit = this.config.rateLimiting.limits.get(context.user.tier) || limit;
    } else if (this.config.rateLimiting.limits.has(endpoint)) {
      limit = this.config.rateLimiting.limits.get(endpoint) || limit;
    }
    
    // Check current count
    const now = Date.now();
    const counter = this.rateLimitCounters.get(key) || { count: 0, resetTime: now + 60000 };
    
    // Reset counter if expired
    if (now > counter.resetTime) {
      counter.count = 0;
      counter.resetTime = now + 60000;
    }
    
    // Check if limit exceeded
    if (counter.count >= limit) {
      // Log rate limit exceeded
      this.logAuditEvent('access', context, 'Rate limit exceeded', { 
        limit,
        counter: counter.count
      });
      
      return false;
    }
    
    // Increment counter
    counter.count++;
    this.rateLimitCounters.set(key, counter);
    
    return true;
  }
  
  /**
   * Check if a user has access to a resource
   * 
   * @param context Request context
   * @param resource Resource being accessed
   * @param action Action being performed
   * @returns Whether access is allowed
   */
  public checkAccess(context: RequestContext, resource: string, action: 'read' | 'write' | 'delete'): boolean {
    if (!this.config.accessControl.enabled || !context.user) {
      return false;
    }
    
    // Check access level
    if (action === 'read' && context.user.accessLevel === 'read') {
      // Read access is allowed for all users
      return true;
    } else if ((action === 'read' || action === 'write') && 
               (context.user.accessLevel === 'write' || context.user.accessLevel === 'admin')) {
      // Write access is allowed for write and admin users
      return true;
    } else if (context.user.accessLevel === 'admin') {
      // Admin users have full access
      return true;
    }
    
    // Check specific permissions
    const requiredPermission = `${action}:${resource}`;
    if (context.user.permissions.includes(requiredPermission)) {
      return true;
    }
    
    // Log access denied
    this.logAuditEvent('access', context, 'Access denied', { 
      resource,
      action,
      requiredPermission
    });
    
    return false;
  }
  
  /**
   * Validate a request to protect against common attacks
   * 
   * @param context Request context
   * @param requestData Request data
   * @returns Validation result
   */
  public validateRequest(context: RequestContext, requestData: any): { valid: boolean; errors?: string[] } {
    if (!this.config.attackProtection.enabled) {
      return { valid: true };
    }
    
    const errors: string[] = [];
    
    // CSRF protection
    if (this.config.attackProtection.enableCSRF) {
      // Implementation would check CSRF token
      // This is a placeholder implementation
    }
    
    // XSS protection
    if (this.config.attackProtection.enableXSS && requestData) {
      // Check for potential XSS in string values
      this.checkForXSS(requestData, errors);
    }
    
    // SQL injection protection
    if (this.config.attackProtection.enableSQLInjection && requestData) {
      // Check for potential SQL injection in string values
      this.checkForSQLInjection(requestData, errors);
    }
    
    // Request validation
    if (this.config.attackProtection.enableRequestValidation && requestData) {
      // Validate request structure and data types
      // This is a placeholder implementation
    }
    
    // Log validation errors
    if (errors.length > 0) {
      this.logAuditEvent('error', context, 'Request validation failed', { errors });
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Log an audit event
   * 
   * @param eventType Type of event
   * @param context Request context
   * @param message Event message
   * @param data Additional event data
   */
  public logAuditEvent(eventType: 'authentication' | 'access' | 'modification' | 'error', 
                      context: RequestContext, 
                      message: string, 
                      data?: any): void {
    if (!this.config.auditLogging.enabled || 
        !this.config.auditLogging.logEvents.includes(eventType)) {
      return;
    }
    
    const event = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType,
      message,
      requestId: context.requestId,
      endpoint: context.endpoint,
      method: context.method,
      ...data
    };
    
    // Include user information if configured
    if (this.config.auditLogging.includeUserInfo && context.user) {
      event['userId'] = context.user.userId;
      event['username'] = context.user.username;
      event['accessLevel'] = context.user.accessLevel;
    }
    
    // Include request details if configured
    if (this.config.auditLogging.includeRequestDetails) {
      event['ipAddress'] = context.ipAddress;
      event['userAgent'] = context.userAgent;
    }
    
    // Add to audit log
    this.auditLog.push(event);
    
    // In a real implementation, this would be persisted to a database or log file
    console.log(`AUDIT: ${JSON.stringify(event)}`);
  }
  
  /**
   * Generate a unique event ID
   * 
   * @returns Unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Check for potential XSS in string values
   * 
   * @param data Data to check
   * @param errors Array to add errors to
   */
  private checkForXSS(data: any, errors: string[]): void {
    if (typeof data === 'string') {
      // Check for common XSS patterns
      const xssPatterns = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, 
                          /javascript:/gi, 
                          /on\w+\s*=/gi];
      
      for (const pattern of xssPatterns) {
        if (pattern.test(data)) {
          errors.push(`Potential XSS detected: ${data.substr(0, 50)}...`);
          break;
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      // Recursively check object properties
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          this.checkForXSS(data[key], errors);
        }
      }
    }
  }
  
  /**
   * Check for potential SQL injection in string values
   * 
   * @param data Data to check
   * @param errors Array to add errors to
   */
  private checkForSQLInjection(data: any, errors: string[]): void {
    if (typeof data === 'string') {
      // Check for common SQL injection patterns
      const sqlPatterns = [/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b/gi, 
                          /\b(UNION|JOIN)\b.*\bSELECT\b/gi, 
                          /';\s*--/g];
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(data)) {
          errors.push(`Potential SQL injection detected: ${data.substr(0, 50)}...`);
          break;
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      // Recursively check object properties
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          this.checkForSQLInjection(data[key], errors);
        }
      }
    }
  }
  
  /**
   * Get recent audit log entries
   * 
   * @param limit Maximum number of entries to return
   * @param filter Optional filter for event types
   * @returns Recent audit log entries
   */
  public getRecentAuditLog(limit: number = 100, filter?: string[]): any[] {
    let filteredLog = this.auditLog;
    
    // Apply filter if provided
    if (filter && filter.length > 0) {
      filteredLog = filteredLog.filter(entry => filter.includes(entry.eventType));
    }
    
    // Return most recent entries
    return filteredLog.slice(-limit).reverse();
  }
  
  /**
   * Create a request context from request data
   * 
   * @param requestData Request data
   * @returns Request context
   */
  public createRequestContext(requestData: any): RequestContext {
    return {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ipAddress: requestData.ip || '0.0.0.0',
      userAgent: requestData.userAgent || 'Unknown',
      endpoint: requestData.path || '/',
      method: requestData.method || 'GET'
    };
  }
}