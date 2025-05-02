/**
 * Security Monitoring Service
 * 
 * Implements comprehensive security monitoring and protection for the NFT TrustScore API.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';

// Security event types
type SecurityEventType = 
  | 'authentication_failure'
  | 'authorization_failure'
  | 'rate_limit_exceeded'
  | 'suspicious_pattern'
  | 'brute_force_attempt'
  | 'data_exfiltration'
  | 'geographic_anomaly';

// Security event interface
interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  ip: string;
  userId?: string;
  requestPath: string;
  requestMethod: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Security Monitoring Service class that implements detection and protection
 */
export class SecurityMonitoringService {
  // Store security events (in a real implementation, this would use a database)
  private events: SecurityEvent[] = [];
  
  // Track authentication failures by IP
  private authFailures: Map<string, { count: number, lastAttempt: Date }> = new Map();
  
  // Track suspicious IPs
  private suspiciousIps: Set<string> = new Set();
  
  // Geographic anomaly detection
  private userLocations: Map<string, Set<string>> = new Map();

  /**
   * Record a security event
   * 
   * @param event Security event to record
   */
  public recordEvent(event: SecurityEvent): void {
    this.events.push(event);
    
    // Process event based on type
    switch (event.type) {
      case 'authentication_failure':
        this.processAuthFailure(event);
        break;
      case 'geographic_anomaly':
        this.processGeographicAnomaly(event);
        break;
      case 'suspicious_pattern':
        this.processSuspiciousPattern(event);
        break;
      // Add handlers for other event types as needed
    }
    
    // In a real implementation, this would also send alerts for critical events
  }

  /**
   * Process authentication failure events
   * 
   * @param event Authentication failure event
   */
  private processAuthFailure(event: SecurityEvent): void {
    const ip = event.ip;
    const current = this.authFailures.get(ip) || { count: 0, lastAttempt: new Date(0) };
    
    // Reset count if last attempt was more than 30 minutes ago
    if (Date.now() - current.lastAttempt.getTime() > 30 * 60 * 1000) {
      current.count = 0;
    }
    
    current.count++;
    current.lastAttempt = new Date();
    
    this.authFailures.set(ip, current);
    
    // Mark IP as suspicious after 5 failures
    if (current.count >= 5) {
      this.suspiciousIps.add(ip);
      console.log(`IP ${ip} marked as suspicious due to multiple authentication failures`);
    }
  }

  /**
   * Process geographic anomaly events
   * 
   * @param event Geographic anomaly event
   */
  private processGeographicAnomaly(event: SecurityEvent): void {
    if (!event.userId || !event.details?.region) {
      return;
    }
    
    const userId = event.userId;
    const region = event.details.region;
    
    // Get user's known locations
    if (!this.userLocations.has(userId)) {
      this.userLocations.set(userId, new Set());
    }
    
    const knownLocations = this.userLocations.get(userId)!;
    
    // If this is a new location for this user, record it and flag as potential anomaly
    if (!knownLocations.has(region)) {
      knownLocations.add(region);
      
      // If user already has known locations and this is a new one, log as potential anomaly
      if (knownLocations.size > 1) {
        console.log(`Geographic anomaly detected for user ${userId}: new region ${region}`);
      }
    }
  }

  /**
   * Process suspicious pattern events
   * 
   * @param event Suspicious pattern event
   */
  private processSuspiciousPattern(event: SecurityEvent): void {
    // Mark IP as suspicious
    this.suspiciousIps.add(event.ip);
    console.log(`IP ${event.ip} marked as suspicious due to suspicious request pattern`);
  }

  /**
   * Check if an IP is suspicious
   * 
   * @param ip IP address to check
   * @returns True if suspicious, false otherwise
   */
  public isSuspiciousIp(ip: string): boolean {
    return this.suspiciousIps.has(ip);
  }

  /**
   * Get recent security events
   * 
   * @param limit Maximum number of events to return
   * @returns Recent security events
   */
  public getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get security events for a specific user
   * 
   * @param userId User ID
   * @param limit Maximum number of events to return
   * @returns User's security events
   */
  public getUserEvents(userId: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Create middleware to detect suspicious patterns
   * 
   * @returns Express middleware
   */
  public createDetectionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      
      // Check if IP is already marked as suspicious
      if (this.isSuspiciousIp(ip)) {
        // In a real implementation, this might implement progressive security measures
        // such as CAPTCHA challenges or temporary blocks
        console.log(`Request from suspicious IP ${ip} detected`);
      }
      
      // Implement pattern detection logic here
      // This is a simplified example - real implementations would use more sophisticated detection
      const path = req.path;
      const method = req.method;
      const userAgent = req.headers['user-agent'];
      
      // Example: Detect rapid sequential requests to sensitive endpoints
      if (path.includes('/admin') || path.includes('/security')) {
        this.recordEvent({
          type: 'suspicious_pattern',
          timestamp: new Date(),
          ip,
          userId: req.user?.id,
          requestPath: path,
          requestMethod: method,
          userAgent,
          details: { reason: 'Access to sensitive endpoint' }
        });
      }
      
      next();
    };
  }

  /**
   * Create middleware to block suspicious IPs
   * 
   * @returns Express middleware
   */
  public createProtectionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      
      // Block suspicious IPs
      if (this.isSuspiciousIp(ip)) {
        return next(ApiError.forbidden('Access denied due to suspicious activity'));
      }
      
      next();
    };
  }
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringService();