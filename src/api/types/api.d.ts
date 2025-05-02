/**
 * API Type Definitions
 * 
 * Type definitions for the NFT TrustScore API responses and requests.
 */

declare namespace API {
  /**
   * Standard API response format
   */
  interface ApiResponse<T> {
    data: T;
    meta: {
      timestamp: string;
      [key: string]: any;
    };
    links: {
      self: string;
      [key: string]: string;
    };
  }

  /**
   * Standard API error response format
   */
  interface ApiErrorResponse {
    error: {
      code: string;
      message: string;
      details?: any;
    };
  }

  /**
   * Trust Score related types
   */
  namespace TrustScore {
    interface Score {
      token_id: string;
      score: number;
      confidence: number;
      timestamp: string;
      factors: {
        authenticity: number;
        market_performance: number;
        creator_reputation: number;
        liquidity: number;
        community_engagement: number;
      };
      risk_level: 'low' | 'medium' | 'high';
    }

    interface ScoreHistory {
      token_id: string;
      period: string;
      data_points: Array<{
        timestamp: string;
        score: number;
      }>;
    }

    interface FactorAnalysis {
      token_id: string;
      timestamp: string;
      factors: Array<{
        name: string;
        score: number;
        weight: number;
        components: Array<{
          name: string;
          value: number;
          contribution: number;
        }>;
      }>;
    }
  }

  /**
   * Price Intelligence related types
   */
  namespace Price {
    interface Prediction {
      token_id: string;
      current_price: number;
      currency: string;
      prediction: {
        horizon: string;
        expected_price: number;
        upper_bound: number;
        lower_bound: number;
        confidence: number;
      };
      factors: {
        market_trend: string;
        collection_momentum: string;
        liquidity: string;
        volatility: string;
      };
      timestamp: string;
    }

    interface History {
      token_id: string;
      currency: string;
      period: string;
      data_points: Array<{
        timestamp: string;
        price: number;
        volume: number;
      }>;
      statistics: {
        min: number;
        max: number;
        avg: number;
        volatility: number;
        trend: string;
      };
    }

    interface Comparable {
      token_id: string;
      current_price: number;
      comparables: Array<{
        token_id: string;
        collection_id: string;
        price: number;
        similarity_score: number;
        image_url: string;
      }>;
    }
  }

  /**
   * Risk Assessment related types
   */
  namespace Risk {
    interface Profile {
      token_id: string;
      overall_risk_score: number;
      risk_category: 'low' | 'medium' | 'high';
      confidence: number;
      timestamp: string;
      risk_factors: {
        market_risk: number;
        liquidity_risk: number;
        volatility_risk: number;
        fraud_risk: number;
        smart_contract_risk: number;
      };
      recommendations: Array<{
        type: string;
        recommendation: string;
        confidence: number;
        reasoning: string;
      }>;
    }

    interface Factors {
      token_id: string;
      timestamp: string;
      factors: Array<{
        name: string;
        score: number;
        weight: number;
        components: Array<{
          name: string;
          value: number;
          contribution: number;
        }>;
      }>;
      overall_risk_score: number;
    }
  }

  /**
   * Blockchain Data related types
   */
  namespace Blockchain {
    interface NFT {
      token_id: string;
      contract_address: string;
      token_standard: string;
      blockchain: string;
      owner: string;
      creator: string;
      creation_date: string;
      metadata: {
        name: string;
        description: string;
        image: string;
        external_url?: string;
        attributes: Array<{
          trait_type: string;
          value: string | number;
        }>;
      };
      last_transfer: {
        timestamp: string;
        from: string;
        to: string;
        transaction_hash: string;
      };
    }

    interface Collection {
      collection_id: string;
      name: string;
      description: string;
      creator: string;
      creation_date: string;
      token_standard: string;
      blockchain: string;
      total_supply: number;
      owner_count: number;
      floor_price: number;
      volume_traded: number;
      website?: string;
      social_links?: {
        [platform: string]: string;
      };
      verified: boolean;
      traits: Array<{
        name: string;
        values: string[];
        rarity: number[];
      }>;
    }

    interface Creator {
      address: string;
      name?: string;
      bio?: string;
      verified: boolean;
      first_mint_date: string;
      collections_created: number;
      total_nfts_created: number;
      total_volume: number;
      highest_sale: number;
      social_links?: {
        [platform: string]: string;
      };
    }
  }

  /**
   * Fraud Detection related types
   */
  namespace Fraud {
    interface ImageSimilarity {
      token_id: string;
      image_url: string;
      analysis_timestamp: string;
      originality_score: number;
      potential_copies: Array<{
        token_id: string;
        collection_id: string;
        similarity_score: number;
        creation_date: string;
        image_url: string;
        relationship: string;
      }>;
      known_art_similarities: Array<{
        source: string;
        artist?: string;
        title?: string;
        year?: number;
        similarity_score: number;
        image_url?: string;
      }>;
      ai_generated_probability: number;
      conclusion: string;
    }

    interface WashTrading {
      token_id: string;
      analysis_timestamp: string;
      wash_trading_probability: number;
      suspicious_transactions: Array<{
        transaction_hash: string;
        timestamp: string;
        from: string;
        to: string;
        price: number;
        suspicion_score: number;
        suspicion_reasons: string[];
      }>;
      wallet_clusters: Array<{
        addresses: string[];
        transaction_count: number;
        average_holding_time: string;
        suspicion_score: number;
      }>;
      price_manipulation_indicators: {
        artificial_price_inflation: number;
        abnormal_price_movements: number;
        outlier_transactions: number;
      };
      conclusion: string;
    }

    interface MetadataValidation {
      token_id: string;
      analysis_timestamp: string;
      metadata_integrity_score: number;
      validation_results: {
        schema_compliance: boolean;
        image_availability: boolean;
        metadata_availability: boolean;
        attribute_consistency: boolean;
        external_link_validity: boolean;
      };
      historical_changes: Array<{
        timestamp: string;
        field: string;
        old_value: string;
        new_value: string;
        change_type: string;
      }>;
      centralization_risk: {
        storage_type: string;
        centralization_score: number;
        single_point_of_failure: boolean;
        recommendations: string[];
      };
      conclusion: string;
    }

    interface ContractAnalysis {
      collection_id: string;
      analysis_timestamp: string;
      contract_security_score: number;
      contract_standard: string;
      verified_source_code: boolean;
      audit_status: {
        audited: boolean;
        audit_date?: string;
        auditor?: string;
        audit_report_url?: string;
      };
      security_analysis: {
        vulnerabilities: Array<{
          severity: 'critical' | 'high' | 'medium' | 'low';
          type: string;
          description: string;
          affected_functions?: string[];
        }>;
        suspicious_patterns: any[];
        permissions: Array<{
          type: string;
          restricted_to_owner: boolean;
          risk_assessment: string;
        }>;
      };
      ownership_analysis: {
        owner_address: string;
        ownership_changes: number;
        multi_sig_wallet: boolean;
        time_lock: boolean;
      };
      conclusion: string;
    }

    interface FraudAlerts {
      entity_id: string;
      entity_type: 'nft' | 'collection' | 'address';
      analysis_timestamp: string;
      active_alerts: Array<{
        alert_id: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        category: string;
        description: string;
        detection_time: string;
        status: 'active' | 'resolved' | 'investigating';
        evidence: {
          transaction_hashes?: string[];
          detection_method?: string;
          confidence: number;
        };
        recommended_actions?: string[];
      }>;
      historical_alerts: Array<{
        alert_id: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        category: string;
        description: string;
        detection_time: string;
        resolution_time?: string;
        status: 'active' | 'resolved' | 'investigating';
        resolution?: string;
      }>;
      risk_assessment: {
        current_risk_level: 'high' | 'medium' | 'low';
        trend: 'increasing' | 'stable' | 'decreasing';
        monitoring_status: 'active' | 'paused';
      };
    }

    interface FraudReport {
      entity_id: string;
      entity_type: 'nft' | 'collection' | 'address';
      report_type: 'wash_trading' | 'fake_nft' | 'stolen_artwork' | 'impersonation' | 'other';
      description: string;
      evidence?: any;
    }

    interface FraudReportResponse {
      report_id: string;
      entity_id: string;
      entity_type: 'nft' | 'collection' | 'address';
      report_type: 'wash_trading' | 'fake_nft' | 'stolen_artwork' | 'impersonation' | 'other';
      description: string;
      evidence?: any;
      status: 'submitted' | 'under_review' | 'resolved' | 'rejected';
      submission_time: string;
      reporter_id: string;
    }
  }
}

export = API;