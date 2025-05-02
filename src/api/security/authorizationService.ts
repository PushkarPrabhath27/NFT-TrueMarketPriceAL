/**
 * Authorization Service
 * 
 * Implements role-based access control (RBAC) for the NFT TrustScore API.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';

// Permission types
export type ResourceType = 'nft' | 'collection' | 'creator' | 'transaction' | 'score' | 'price' | 'risk' | 'fraud';
export type ActionType = 'read' | 'write' | 'delete' | 'admin';

// Role definitions with inheritance
export interface Role {
  name: string;
  description: string;
  inherits?: string[];
  permissions: Permission[];
}

// Permission definition
export interface Permission {
  resource: ResourceType;
  actions: ActionType[];
  conditions?: Record<string, any>;
}

/**
 * Authorization Service class that implements role-based access control
 */
export class AuthorizationService {
  // Role definitions
  private roles: Map<string, Role> = new Map();

  constructor() {
    this.initializeRoles();
  }

  /**
   * Initialize default roles and permissions
   */
  private initializeRoles(): void {
    // Define base roles
    this.addRole({
      name: 'public',
      description: 'Public access with minimal permissions',
      permissions: [
        { resource: 'nft', actions: ['read'] },
        { resource: 'collection', actions: ['read'] },
        { resource: 'creator', actions: ['read'] }
      ]
    });

    this.addRole({
      name: 'user',
      description: 'Authenticated user with basic permissions',
      inherits: ['public'],
      permissions: [
        { resource: 'score', actions: ['read'] },
        { resource: 'price', actions: ['read'] },
        { resource: 'risk', actions: ['read'] },
        { resource: 'fraud', actions: ['read'] }
      ]
    });

    this.addRole({
      name: 'premium',
      description: 'Premium user with enhanced permissions',
      inherits: ['user'],
      permissions: [
        { resource: 'score', actions: ['read'], conditions: { detailed: true } },
        { resource: 'price', actions: ['read'], conditions: { detailed: true } },
        { resource: 'risk', actions: ['read'], conditions: { detailed: true } },
        { resource: 'fraud', actions: ['read'], conditions: { detailed: true } }
      ]
    });

    this.addRole({
      name: 'developer',
      description: 'API developer with extended permissions',
      inherits: ['premium'],
      permissions: [
        { resource: 'nft', actions: ['read', 'write'] },
        { resource: 'collection', actions: ['read', 'write'] },
        { resource: 'transaction', actions: ['read'] }
      ]
    });

    this.addRole({
      name: 'admin',
      description: 'Administrator with full access',
      permissions: [
        { resource: 'nft', actions: ['read', 'write', 'delete', 'admin'] },
        { resource: 'collection', actions: ['read', 'write', 'delete', 'admin'] },
        { resource: 'creator', actions: ['read', 'write', 'delete', 'admin'] },
        { resource: 'transaction', actions: ['read', 'write', 'delete', 'admin'] },
        { resource: 'score', actions: ['read', 'write', 'delete', 'admin'] },
        { resource: 'price', actions: ['read', 'write', 'delete', 'admin'] },
        { resource: 'risk', actions: ['read', 'write', 'delete', 'admin'] },
        { resource: 'fraud', actions: ['read', 'write', 'delete', 'admin'] }
      ]
    });
  }

  /**
   * Add a new role
   * 
   * @param role Role definition
   */
  public addRole(role: Role): void {
    this.roles.set(role.name, role);
  }

  /**
   * Check if a user has permission to perform an action on a resource
   * 
   * @param userRole User's role
   * @param resource Resource type
   * @param action Action type
   * @param context Additional context for conditional permissions
   * @returns True if permitted, false otherwise
   */
  public hasPermission(
    userRole: string,
    resource: ResourceType,
    action: ActionType,
    context: Record<string, any> = {}
  ): boolean {
    // Get the role definition
    const role = this.roles.get(userRole);
    
    if (!role) {
      return false;
    }
    
    // Check direct permissions
    if (this.checkRolePermission(role, resource, action, context)) {
      return true;
    }
    
    // Check inherited permissions
    if (role.inherits) {
      for (const inheritedRole of role.inherits) {
        if (this.hasPermission(inheritedRole, resource, action, context)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a role has a specific permission
   * 
   * @param role Role definition
   * @param resource Resource type
   * @param action Action type
   * @param context Additional context for conditional permissions
   * @returns True if permitted, false otherwise
   */
  private checkRolePermission(
    role: Role,
    resource: ResourceType,
    action: ActionType,
    context: Record<string, any>
  ): boolean {
    for (const permission of role.permissions) {
      if (permission.resource === resource && permission.actions.includes(action)) {
        // Check conditions if present
        if (permission.conditions) {
          let conditionsMet = true;
          
          for (const [key, value] of Object.entries(permission.conditions)) {
            if (context[key] !== value) {
              conditionsMet = false;
              break;
            }
          }
          
          if (!conditionsMet) {
            continue;
          }
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Create middleware to check permission for a specific resource and action
   * 
   * @param resource Resource type
   * @param action Action type
   * @param contextExtractor Function to extract context from request
   * @returns Express middleware
   */
  public requirePermission(
    resource: ResourceType,
    action: ActionType,
    contextExtractor?: (req: Request) => Record<string, any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
      }
      
      const userRole = req.user.role || 'user';
      const context = contextExtractor ? contextExtractor(req) : {};
      
      if (this.hasPermission(userRole, resource, action, context)) {
        next();
      } else {
        next(ApiError.forbidden('Insufficient permissions'));
      }
    };
  }

  /**
   * Log authorization decision for audit purposes
   * 
   * @param userId User ID
   * @param userRole User role
   * @param resource Resource type
   * @param action Action type
   * @param allowed Whether access was allowed
   * @param context Additional context
   */
  public logAuthorizationDecision(
    userId: string,
    userRole: string,
    resource: ResourceType,
    action: ActionType,
    allowed: boolean,
    context: Record<string, any> = {}
  ): void {
    // In a real implementation, this would log to a secure audit log
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'authorization_decision',
      userId,
      userRole,
      resource,
      action,
      allowed,
      context
    }));
  }
}

// Export singleton instance
export const authorizationService = new AuthorizationService();