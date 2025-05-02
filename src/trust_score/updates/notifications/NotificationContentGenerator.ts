/**
 * NotificationContentGenerator.ts
 * 
 * Implements the notification content generation component of the Notification Generation System.
 * Responsible for creating personalized, context-aware notification content with
 * appropriate messaging based on the type and severity of changes.
 */

import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the notification content generator
 */
export interface NotificationContentConfig {
  // Whether to enable natural language generation
  enableNaturalLanguage: boolean;
  
  // Whether to include technical details in notifications
  includeTechnicalDetails: boolean;
  
  // Whether to include action recommendations
  includeActionRecommendations: boolean;
  
  // Whether to include evidence and reasoning
  includeEvidenceAndReasoning: boolean;
  
  // Maximum length for notification titles
  maxTitleLength: number;
  
  // Maximum length for notification messages
  maxMessageLength: number;
  
  // Localization settings
  localization: {
    defaultLanguage: string;
    supportedLanguages: string[];
  };
}

/**
 * Template for notification content
 */
export interface NotificationTemplate {
  titleTemplate: string;
  messageTemplate: string;
  actionRecommendations?: string[];
  evidenceDescriptions?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Generated notification content
 */
export interface NotificationContent {
  title: string;
  message: string;
  actionRecommendations?: string[];
  evidenceItems?: {
    description: string;
    data: any;
  }[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  technicalDetails?: Record<string, any>;
}

/**
 * Generates notification content based on event type and data
 */
export class NotificationContentGenerator {
  private config: NotificationContentConfig;
  private templates: Map<string, NotificationTemplate> = new Map();
  private localizedTemplates: Map<string, Map<string, NotificationTemplate>> = new Map();
  
  /**
   * Initialize the Notification Content Generator
   * 
   * @param config Configuration for the content generator
   */
  constructor(config: Partial<NotificationContentConfig> = {}) {
    this.config = this.getDefaultConfig(config);
    this.initializeDefaultTemplates();
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<NotificationContentConfig>): NotificationContentConfig {
    return {
      enableNaturalLanguage: true,
      includeTechnicalDetails: true,
      includeActionRecommendations: true,
      includeEvidenceAndReasoning: true,
      maxTitleLength: 100,
      maxMessageLength: 500,
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        ...config.localization
      },
      ...config
    };
  }
  
  /**
   * Initialize default notification templates
   */
  private initializeDefaultTemplates(): void {
    // Trust score decrease template
    this.registerTemplate('trust_score_decrease', {
      titleTemplate: 'Trust Score Decreased for {entityType} {entityId}',
      messageTemplate: 'The trust score for {entityType} {entityId} has decreased from {previousScore} to {currentScore}. {reasonText}',
      actionRecommendations: [
        'Review recent activity for suspicious behavior',
        'Check for changes in ownership or creator information',
        'Monitor for further decreases in trust score'
      ],
      evidenceDescriptions: [
        'Significant decrease in trust score',
        'Changes in risk factors',
        'Unusual activity patterns'
      ],
      severity: 'medium'
    });
    
    // Trust score increase template
    this.registerTemplate('trust_score_increase', {
      titleTemplate: 'Trust Score Improved for {entityType} {entityId}',
      messageTemplate: 'Good news! The trust score for {entityType} {entityId} has increased from {previousScore} to {currentScore}. {reasonText}',
      actionRecommendations: [
        'Consider this {entityType} for your portfolio',
        'Review the factors that contributed to the improvement'
      ],
      evidenceDescriptions: [
        'Significant increase in trust score',
        'Improvements in key trust factors',
        'Positive market signals'
      ],
      severity: 'low'
    });
    
    // Price decrease template
    this.registerTemplate('price_decrease', {
      titleTemplate: 'Price Drop Alert for {entityType} {entityId}',
      messageTemplate: 'The price of {entityType} {entityId} has decreased by {changePercentage}% from {previousPrice} to {currentPrice} {currency}. {reasonText}',
      actionRecommendations: [
        'Consider if this presents a buying opportunity',
        'Check if this price change aligns with market trends',
        'Monitor for further price movements'
      ],
      evidenceDescriptions: [
        'Significant price decrease',
        'Market volatility indicators',
        'Trading volume changes'
      ],
      severity: 'medium'
    });
    
    // Price increase template
    this.registerTemplate('price_increase', {
      titleTemplate: 'Price Increase Alert for {entityType} {entityId}',
      messageTemplate: 'The price of {entityType} {entityId} has increased by {changePercentage}% from {previousPrice} to {currentPrice} {currency}. {reasonText}',
      actionRecommendations: [
        'Consider if this presents a selling opportunity',
        'Check if this price change is sustainable',
        'Monitor for further price movements'
      ],
      evidenceDescriptions: [
        'Significant price increase',
        'Market demand indicators',
        'Trading volume changes'
      ],
      severity: 'low'
    });
    
    // Risk level increase template
    this.registerTemplate('risk_level_increase', {
      titleTemplate: 'Risk Level Increased for {entityType} {entityId}',
      messageTemplate: 'The risk level for {entityType} {entityId} has increased from {previousRisk} to {currentRisk}. {reasonText}',
      actionRecommendations: [
        'Review your exposure to this {entityType}',
        'Consider reducing your position if you own this {entityType}',
        'Monitor for further risk increases'
      ],
      evidenceDescriptions: [
        'Significant risk level increase',
        'New risk factors identified',
        'Market warning signals'
      ],
      severity: 'high'
    });
    
    // Risk level decrease template
    this.registerTemplate('risk_level_decrease', {
      titleTemplate: 'Risk Level Decreased for {entityType} {entityId}',
      messageTemplate: 'The risk level for {entityType} {entityId} has decreased from {previousRisk} to {currentRisk}. {reasonText}',
      actionRecommendations: [
        'Review if this {entityType} now meets your risk tolerance',
        'Consider if this presents a new opportunity'
      ],
      evidenceDescriptions: [
        'Significant risk level decrease',
        'Improved risk factors',
        'Positive market signals'
      ],
      severity: 'low'
    });
    
    // Fraud detection template
    this.registerTemplate('fraud_detection', {
      titleTemplate: 'Fraud Alert for {entityType} {entityId}',
      messageTemplate: 'Potential fraud detected for {entityType} {entityId}. {fraudType} has been identified with {confidenceLevel}% confidence. {reasonText}',
      actionRecommendations: [
        'Avoid interacting with this {entityType}',
        'Report this {entityType} to the marketplace',
        'If you own this {entityType}, consider seeking advice'
      ],
      evidenceDescriptions: [
        'Fraud detection algorithm findings',
        'Suspicious activity patterns',
        'Similarity to known fraud cases'
      ],
      severity: 'critical'
    });
    
    // Social sentiment shift template
    this.registerTemplate('social_sentiment_shift', {
      titleTemplate: 'Social Sentiment Shift for {entityType} {entityId}',
      messageTemplate: 'Social sentiment for {entityType} {entityId} has shifted {direction} by {magnitude}. {reasonText}',
      actionRecommendations: [
        'Review recent social media activity',
        'Check for news or events that might have caused this shift',
        'Consider how this might impact market perception'
      ],
      evidenceDescriptions: [
        'Significant sentiment shift',
        'Social media activity changes',
        'Community engagement metrics'
      ],
      severity: 'medium'
    });
    
    // Market floor price change template
    this.registerTemplate('market_floor_price_change', {
      titleTemplate: 'Floor Price {direction} for Collection {collectionId}',
      messageTemplate: 'The floor price for collection {collectionId} has {direction} by {changePercentage}% from {previousPrice} to {currentPrice} {currency}. {reasonText}',
      actionRecommendations: [
        'Consider how this affects your collection valuation',
        'Monitor for further floor price movements',
        'Check if this aligns with broader market trends'
      ],
      evidenceDescriptions: [
        'Significant floor price change',
        'Collection trading volume changes',
        'Market liquidity indicators'
      ],
      severity: 'medium'
    });
    
    // New listing template
    this.registerTemplate('new_listing', {
      titleTemplate: 'New Listing for {entityType} {entityId}',
      messageTemplate: '{entityType} {entityId} has been listed for sale at {price} {currency} on {marketplace}. {additionalInfo}',
      actionRecommendations: [
        'Check if this listing price is competitive',
        'Review the trust score and risk assessment',
        'Consider if this matches your collection interests'
      ],
      evidenceDescriptions: [
        'Listing details',
        'Price comparison with similar items',
        'Seller reputation information'
      ],
      severity: 'low'
    });
  }
  
  /**
   * Register a notification template
   * 
   * @param eventType The event type for this template
   * @param template The notification template
   * @param language Optional language code (defaults to default language)
   */
  public registerTemplate(eventType: string, template: NotificationTemplate, language?: string): void {
    if (!language) {
      // Register in default language
      this.templates.set(eventType, template);
    } else {
      // Register in specified language
      if (!this.localizedTemplates.has(language)) {
        this.localizedTemplates.set(language, new Map());
      }
      
      this.localizedTemplates.get(language)!.set(eventType, template);
    }
  }
  
  /**
   * Generate notification content for an event
   * 
   * @param event The event to generate content for
   * @param previousValue Optional previous value for comparison
   * @param currentValue Optional current value for comparison
   * @param language Optional language code (defaults to default language)
   * @returns The generated notification content
   */
  public generateContent(
    event: TrustScoreTypes.UpdateEvent,
    previousValue?: any,
    currentValue?: any,
    language?: string
  ): NotificationContent {
    // Determine the event subtype based on the change direction
    const eventSubtype = this.determineEventSubtype(event, previousValue, currentValue);
    
    // Get the appropriate template
    const template = this.getTemplate(eventSubtype, language);
    
    // If no template is found, use a generic one
    if (!template) {
      return this.generateGenericContent(event, previousValue, currentValue);
    }
    
    // Prepare template variables
    const variables = this.prepareTemplateVariables(event, previousValue, currentValue);
    
    // Generate title and message using template
    const title = this.formatTemplate(template.titleTemplate, variables);
    const message = this.formatTemplate(template.messageTemplate, variables);
    
    // Generate action recommendations if enabled
    let actionRecommendations: string[] | undefined;
    if (this.config.includeActionRecommendations && template.actionRecommendations) {
      actionRecommendations = template.actionRecommendations.map(rec => 
        this.formatTemplate(rec, variables)
      );
    }
    
    // Generate evidence items if enabled
    let evidenceItems: { description: string; data: any }[] | undefined;
    if (this.config.includeEvidenceAndReasoning && template.evidenceDescriptions) {
      evidenceItems = template.evidenceDescriptions.map((desc, index) => ({
        description: this.formatTemplate(desc, variables),
        data: this.extractEvidenceData(event, index)
      }));
    }
    
    // Generate technical details if enabled
    let technicalDetails: Record<string, any> | undefined;
    if (this.config.includeTechnicalDetails) {
      technicalDetails = {
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        timestamp: event.timestamp,
        previousValue,
        currentValue,
        change: currentValue !== undefined && previousValue !== undefined 
          ? currentValue - previousValue 
          : undefined,
        percentageChange: currentValue !== undefined && previousValue !== undefined && previousValue !== 0
          ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100
          : undefined
      };
    }
    
    // Create the notification content
    const content: NotificationContent = {
      title: this.truncateText(title, this.config.maxTitleLength),
      message: this.truncateText(message, this.config.maxMessageLength),
      severity: template.severity,
      actionRecommendations,
      evidenceItems,
      technicalDetails
    };
    
    return content;
  }
  
  /**
   * Determine the specific event subtype based on the change direction
   * 
   * @param event The event
   * @param previousValue The previous value
   * @param currentValue The current value
   * @returns The event subtype
   */
  private determineEventSubtype(
    event: TrustScoreTypes.UpdateEvent,
    previousValue?: any,
    currentValue?: any
  ): string {
    // For events without previous/current values, use the event type directly
    if (previousValue === undefined || currentValue === undefined) {
      return event.eventType;
    }
    
    // Determine direction based on numeric comparison
    if (typeof previousValue === 'number' && typeof currentValue === 'number') {
      const isIncrease = currentValue > previousValue;
      
      // Handle different event types
      if (event.eventType.includes('trust_score')) {
        return isIncrease ? 'trust_score_increase' : 'trust_score_decrease';
      }
      
      if (event.eventType.includes('price')) {
        return isIncrease ? 'price_increase' : 'price_decrease';
      }
      
      if (event.eventType.includes('risk')) {
        return isIncrease ? 'risk_level_increase' : 'risk_level_decrease';
      }
      
      if (event.eventType.includes('floor_price')) {
        return 'market_floor_price_change';
      }
    }
    
    // Default to the original event type
    return event.eventType;
  }
  
  /**
   * Get the appropriate template for an event type
   * 
   * @param eventType The event type
   * @param language Optional language code
   * @returns The template, or undefined if not found
   */
  private getTemplate(eventType: string, language?: string): NotificationTemplate | undefined {
    // Try to get a localized template first
    if (language && this.localizedTemplates.has(language)) {
      const localizedTemplate = this.localizedTemplates.get(language)!.get(eventType);
      if (localizedTemplate) {
        return localizedTemplate;
      }
    }
    
    // Fall back to default language template
    return this.templates.get(eventType);
  }
  
  /**
   * Generate generic content for an event without a specific template
   * 
   * @param event The event
   * @param previousValue The previous value
   * @param currentValue The current value
   * @returns Generic notification content
   */
  private generateGenericContent(
    event: TrustScoreTypes.UpdateEvent,
    previousValue?: any,
    currentValue?: any
  ): NotificationContent {
    const entityTypeDisplay = this.capitalizeFirstLetter(event.entityType);
    const eventTypeDisplay = event.eventType
      .split('_')
      .map(word => this.capitalizeFirstLetter(word))
      .join(' ');
    
    let title = `${eventTypeDisplay} for ${entityTypeDisplay} ${event.entityId}`;
    let message = `There has been an update to ${entityTypeDisplay} ${event.entityId}.`;
    
    // Add value change information if available
    if (previousValue !== undefined && currentValue !== undefined) {
      if (typeof previousValue === 'number' && typeof currentValue === 'number') {
        const change = currentValue - previousValue;
        const direction = change > 0 ? 'increased' : 'decreased';
        const percentChange = previousValue !== 0 
          ? Math.abs((change / previousValue) * 100).toFixed(2) 
          : 'infinite';
        
        message += ` The value has ${direction} from ${previousValue} to ${currentValue} (${percentChange}% change).`;
      } else {
        message += ` The value has changed from ${previousValue} to ${currentValue}.`;
      }
    }
    
    // Determine severity based on event type
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (event.eventType.includes('fraud')) {
      severity = 'critical';
    } else if (event.eventType.includes('risk')) {
      severity = 'high';
    } else if (event.eventType.includes('price') || event.eventType.includes('trust_score')) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
    
    return {
      title: this.truncateText(title, this.config.maxTitleLength),
      message: this.truncateText(message, this.config.maxMessageLength),
      severity
    };
  }
  
  /**
   * Prepare variables for template formatting
   * 
   * @param event The event
   * @param previousValue The previous value
   * @param currentValue The current value
   * @returns Template variables
   */
  private prepareTemplateVariables(
    event: TrustScoreTypes.UpdateEvent,
    previousValue?: any,
    currentValue?: any
  ): Record<string, string> {
    const variables: Record<string, string> = {
      entityId: event.entityId,
      entityType: this.getEntityTypeDisplay(event.entityType),
      eventType: this.getEventTypeDisplay(event.eventType)
    };
    
    // Add data from the event
    if (event.data) {
      for (const [key, value] of Object.entries(event.data)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          variables[key] = String(value);
        }
      }
    }
    
    // Add value comparison data
    if (previousValue !== undefined) {
      variables.previousValue = String(previousValue);
      
      if (typeof previousValue === 'number') {
        variables.previousScore = previousValue.toFixed(2);
        variables.previousPrice = previousValue.toFixed(2);
        variables.previousRisk = previousValue.toFixed(1);
      }
    }
    
    if (currentValue !== undefined) {
      variables.currentValue = String(currentValue);
      
      if (typeof currentValue === 'number') {
        variables.currentScore = currentValue.toFixed(2);
        variables.currentPrice = currentValue.toFixed(2);
        variables.currentRisk = currentValue.toFixed(1);
      }
    }
    
    // Calculate change data
    if (previousValue !== undefined && currentValue !== undefined) {
      if (typeof previousValue === 'number' && typeof currentValue === 'number') {
        const change = currentValue - previousValue;
        variables.change = change.toFixed(2);
        
        const percentChange = previousValue !== 0 
          ? (change / Math.abs(previousValue)) * 100 
          : change > 0 ? 100 : -100;
        
        variables.changePercentage = Math.abs(percentChange).toFixed(2);
        variables.direction = percentChange > 0 ? 'increased' : 'decreased';
        
        // Add magnitude description
        if (Math.abs(percentChange) > 50) {
          variables.magnitude = 'dramatically';
        } else if (Math.abs(percentChange) > 20) {
          variables.magnitude = 'significantly';
        } else if (Math.abs(percentChange) > 10) {
          variables.magnitude = 'notably';
        } else if (Math.abs(percentChange) > 5) {
          variables.magnitude = 'moderately';
        } else {
          variables.magnitude = 'slightly';
        }
      }
    }
    
    // Add default values for commonly used variables
    variables.currency = variables.currency || 'ETH';
    variables.marketplace = variables.marketplace || 'the marketplace';
    variables.confidenceLevel = variables.confidenceLevel || '85';
    variables.fraudType = variables.fraudType || 'Suspicious activity';
    variables.reasonText = variables.reasonText || '';
    variables.additionalInfo = variables.additionalInfo || '';
    
    // For collections, use a friendly name if available
    if (event.entityType === 'collection' && event.data?.collectionName) {
      variables.collectionId = event.data.collectionName;
    } else if (event.entityType === 'collection') {
      variables.collectionId = event.entityId;
    }
    
    return variables;
  }
  
  /**
   * Format a template string with variables
   * 
   * @param template The template string
   * @param variables The variables to insert
   * @returns The formatted string
   */
  private formatTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/{([^}]+)}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }
  
  /**
   * Extract evidence data from an event
   * 
   * @param event The event
   * @param index The evidence index
   * @returns The evidence data
   */
  private extractEvidenceData(event: TrustScoreTypes.UpdateEvent, index: number): any {
    // In a real implementation, this would extract specific data points
    // based on the event type and evidence index
    switch (index) {
      case 0:
        return event.data?.primaryEvidence || {};
      case 1:
        return event.data?.secondaryEvidence || {};
      case 2:
        return event.data?.tertiaryEvidence || {};
      default:
        return {};
    }
  }
  
  /**
   * Get a display-friendly version of an entity type
   * 
   * @param entityType The entity type
   * @returns A display-friendly version
   */
  private getEntityTypeDisplay(entityType: string): string {
    switch (entityType) {
      case 'nft':
        return 'NFT';
      case 'collection':
        return 'Collection';
      case 'creator':
        return 'Creator';
      case 'market':
        return 'Market';
      default:
        return this.capitalizeFirstLetter(entityType);
    }
  }
  
  /**
   * Get a display-friendly version of an event type
   * 
   * @param eventType The event type
   * @returns A display-friendly version
   */
  private getEventTypeDisplay(eventType: string): string {
    return eventType
      .split('_')
      .map(word => this.capitalizeFirstLetter(word))
      .join(' ');
  }
  
  /**
   * Capitalize the first letter of a string
   * 
   * @param str The string to capitalize
   * @returns The capitalized string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Truncate text to a maximum length
   * 
   * @param text The text to truncate
   * @param maxLength The maximum length
   * @returns The truncated text
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - 3) + '...';
  }
}