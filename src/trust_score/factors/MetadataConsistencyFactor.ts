/**
 * MetadataConsistencyFactor.ts
 * 
 * Implementation of the Metadata Consistency Factor calculator.
 * This factor evaluates the consistency and quality of an NFT's metadata,
 * including properties format, external reference integrity, and collection consistency.
 * It accounts for 10% of the overall trust score.
 */

import { FactorCalculator } from './FactorCalculator';
import { TrustScoreTypes } from '../types';

/**
 * Calculates the Metadata Consistency Factor score for NFTs based on metadata quality.
 */
export class MetadataConsistencyFactor implements FactorCalculator {
  /**
   * The weight of this factor in the overall trust score (10%)
   */
  public readonly weight: number;

  /**
   * Initialize the Metadata Consistency Factor calculator with its weight
   * 
   * @param weight The weight of this factor in the overall trust score
   */
  constructor(weight: number = 0.10) {
    this.weight = weight;
  }

  /**
   * Calculate the metadata consistency score based on metadata quality
   * 
   * @param inputData The NFT data including metadata
   * @returns A factor score with confidence metrics and explanations
   */
  public async calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values for when no metadata is available
    let score = 50; // Neutral score
    let confidence = 0.3; // Low confidence without data
    let explanation = "Limited metadata available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    // Process metadata if available
    if (inputData.metadata) {
      const metadata = inputData.metadata;
      
      // Calculate properties format score
      const propertiesFormatScore = this.calculatePropertiesFormatScore(metadata);
      details.propertiesFormatScore = propertiesFormatScore;
      details.attributeCount = metadata.attributes.length;
      
      // Calculate external reference integrity score
      const externalReferenceScore = this.calculateExternalReferenceScore(metadata);
      details.externalReferenceScore = externalReferenceScore;
      
      // Calculate collection consistency score if collection data is available
      let collectionConsistencyScore = 0.5; // Default neutral score
      if (inputData.collectionData && inputData.collectionInputData?.nfts.length > 0) {
        collectionConsistencyScore = this.calculateCollectionConsistencyScore(
          metadata, 
          inputData.collectionInputData.nfts.map(nft => nft.metadata)
        );
        details.collectionConsistencyScore = collectionConsistencyScore;
      }
      
      // Calculate overall metadata consistency score (higher is better)
      score = Math.round((
        propertiesFormatScore * 0.4 + 
        externalReferenceScore * 0.3 + 
        collectionConsistencyScore * 0.3
      ) * 100);
      
      // Calculate confidence based on metadata complexity
      confidence = this.calculateConfidence(inputData, {
        attributeCount: metadata.attributes.length,
        hasExternalReferences: !!metadata.externalUrl,
        hasAdditionalProperties: !!metadata.additionalProperties && Object.keys(metadata.additionalProperties).length > 0
      });
      
      // Generate explanation
      if (score >= 90) {
        explanation = `Metadata is highly consistent with well-formatted properties and valid external references.`;
      } else if (score >= 70) {
        explanation = `Metadata shows good consistency with properly formatted properties.`;
      } else if (score >= 50) {
        explanation = `Metadata shows moderate consistency with standard formatting.`;
      } else if (score >= 30) {
        explanation = `Metadata shows inconsistencies or formatting issues.`;
      } else {
        explanation = `Metadata has significant issues with formatting, references, or collection consistency.`;
      }
      
      // Add specific details to explanation
      if (propertiesFormatScore < 0.5) {
        explanation += ` Properties format has issues.`;
      }
      
      if (externalReferenceScore < 0.5 && metadata.externalUrl) {
        explanation += ` External references may have integrity issues.`;
      }
      
      if (collectionConsistencyScore < 0.5 && inputData.collectionData) {
        explanation += ` Metadata differs significantly from collection standards.`;
      }
    }
    
    // Identify red flags and strengths
    const redFlags = this.identifyRedFlags(inputData, score);
    const strengths = this.identifyStrengths(inputData, score);
    
    return {
      score,
      confidence,
      explanation,
      details,
      redFlags,
      strengths
    };
  }

  /**
   * Calculate a score based on properties format quality
   * 
   * @param metadata The NFT metadata
   * @returns A score between 0-1 representing properties format quality
   */
  private calculatePropertiesFormatScore(metadata: TrustScoreTypes.NFTMetadata): number {
    if (!metadata.attributes || metadata.attributes.length === 0) {
      return 0.2; // Very low score for missing attributes
    }
    
    // Check for required basic fields
    const hasRequiredFields = !!metadata.name && !!metadata.description && !!metadata.image;
    
    // Calculate attribute quality score
    let validAttributes = 0;
    for (const attr of metadata.attributes) {
      if (attr.traitType && (attr.value !== undefined && attr.value !== null)) {
        validAttributes++;
      }
    }
    
    const attributeQualityScore = metadata.attributes.length > 0 ?
      validAttributes / metadata.attributes.length : 0;
    
    // Calculate overall properties format score
    return (
      (hasRequiredFields ? 0.5 : 0.2) + // 50% for having all required fields
      (attributeQualityScore * 0.5)      // 50% for attribute quality
    );
  }

  /**
   * Calculate a score based on external reference integrity
   * 
   * @param metadata The NFT metadata
   * @returns A score between 0-1 representing external reference integrity
   */
  private calculateExternalReferenceScore(metadata: TrustScoreTypes.NFTMetadata): number {
    // If no external URL, give neutral score
    if (!metadata.externalUrl) {
      return 0.5;
    }
    
    // Check if external URL is properly formatted
    let isValidUrl = false;
    try {
      new URL(metadata.externalUrl);
      isValidUrl = true;
    } catch (e) {
      isValidUrl = false;
    }
    
    // Check if image URL is properly formatted
    let isValidImageUrl = false;
    try {
      new URL(metadata.image);
      isValidImageUrl = true;
    } catch (e) {
      // Could be IPFS or other format, so not necessarily invalid
      isValidImageUrl = metadata.image.startsWith('ipfs://') || 
                        metadata.image.startsWith('ar://') ||
                        metadata.image.startsWith('data:image/');
    }
    
    // Calculate external reference score
    return (
      (isValidUrl ? 0.6 : 0.2) +       // 60% for valid external URL
      (isValidImageUrl ? 0.4 : 0.1)      // 40% for valid image URL
    );
  }

  /**
   * Calculate a score based on consistency with collection metadata
   * 
   * @param metadata The NFT metadata
   * @param collectionMetadata Array of metadata from other NFTs in the collection
   * @returns A score between 0-1 representing collection consistency
   */
  private calculateCollectionConsistencyScore(
    metadata: TrustScoreTypes.NFTMetadata, 
    collectionMetadata: TrustScoreTypes.NFTMetadata[]
  ): number {
    if (collectionMetadata.length === 0) {
      return 0.5; // Neutral score if no collection data
    }
    
    // Get attribute trait types from this NFT
    const traitTypes = metadata.attributes.map(attr => attr.traitType);
    
    // Count how many collection NFTs have each trait type
    const traitTypeCounts: Record<string, number> = {};
    for (const type of traitTypes) {
      traitTypeCounts[type] = 0;
    }
    
    // Analyze collection metadata for trait type consistency
    for (const nftMetadata of collectionMetadata) {
      for (const attr of nftMetadata.attributes) {
        if (traitTypeCounts[attr.traitType] !== undefined) {
          traitTypeCounts[attr.traitType]++;
        }
      }
    }
    
    // Calculate trait type consistency score
    let consistencyScore = 0;
    for (const type in traitTypeCounts) {
      const frequency = traitTypeCounts[type] / collectionMetadata.length;
      consistencyScore += frequency;
    }
    
    // Normalize by number of trait types
    consistencyScore = traitTypes.length > 0 ? 
      consistencyScore / traitTypes.length : 0.5;
    
    return consistencyScore;
  }

  /**
   * Calculate the confidence in the metadata consistency score
   * 
   * @param inputData The NFT input data
   * @param metrics Metrics about metadata complexity
   * @returns A confidence value between 0-1
   */
  public calculateConfidence(inputData: TrustScoreTypes.NFTInputData, metrics: any): number {
    // Base confidence starts at 0.5
    let confidence = 0.5;
    
    // Adjust based on attribute count (more attributes = higher confidence)
    if (metrics.attributeCount > 10) {
      confidence += 0.2;
    } else if (metrics.attributeCount > 5) {
      confidence += 0.1;
    } else if (metrics.attributeCount > 0) {
      confidence += 0.05;
    }
    
    // Adjust based on external references
    if (metrics.hasExternalReferences) {
      confidence += 0.1;
    }
    
    // Adjust based on additional properties
    if (metrics.hasAdditionalProperties) {
      confidence += 0.1;
    }
    
    // Cap confidence at 0.95 (never 100% confident)
    return Math.min(0.95, confidence);
  }

  /**
   * Identify red flags related to metadata consistency
   * 
   * @param inputData The NFT input data
   * @param score The calculated consistency score
   * @returns Array of red flags
   */
  public identifyRedFlags(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    if (!inputData.metadata) {
      redFlags.push({
        severity: 'high',
        description: 'Missing metadata',
        evidence: 'NFT has no associated metadata, which is highly unusual.'
      });
      return redFlags;
    }
    
    const metadata = inputData.metadata;
    
    // Check for missing required fields
    if (!metadata.name || !metadata.description || !metadata.image) {
      redFlags.push({
        severity: 'high',
        description: 'Missing required metadata fields',
        evidence: `NFT is missing one or more required fields: ${!metadata.name ? 'name' : ''} ${!metadata.description ? 'description' : ''} ${!metadata.image ? 'image' : ''}.`.trim()
      });
    }
    
    // Check for missing attributes
    if (!metadata.attributes || metadata.attributes.length === 0) {
      redFlags.push({
        severity: 'medium',
        description: 'No attributes defined',
        evidence: 'NFT has no attributes defined, which is unusual for most collections.'
      });
    }
    
    // Check for invalid attribute format
    if (metadata.attributes && metadata.attributes.length > 0) {
      const invalidAttributes = metadata.attributes.filter(attr => 
        !attr.traitType || (attr.value === undefined || attr.value === null)
      );
      
      if (invalidAttributes.length > 0) {
        redFlags.push({
          severity: 'medium',
          description: 'Invalid attribute format',
          evidence: `${invalidAttributes.length} attributes have invalid format (missing trait type or value).`
        });
      }
    }
    
    // Check for invalid external URL
    if (metadata.externalUrl) {
      try {
        new URL(metadata.externalUrl);
      } catch (e) {
        redFlags.push({
          severity: 'medium',
          description: 'Invalid external URL',
          evidence: `External URL "${metadata.externalUrl}" is not properly formatted.`
        });
      }
    }
    
    return redFlags;
  }

  /**
   * Identify strengths related to metadata consistency
   * 
   * @param inputData The NFT input data
   * @param score The calculated consistency score
   * @returns Array of strengths
   */
  public identifyStrengths(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.Strength[] {
    const strengths: TrustScoreTypes.Strength[] = [];
    
    if (!inputData.metadata) {
      return strengths;
    }
    
    const metadata = inputData.metadata;
    
    // Check for comprehensive attributes
    if (metadata.attributes && metadata.attributes.length > 5) {
      strengths.push({
        significance: 'medium',
        description: 'Comprehensive attributes',
        evidence: `NFT has ${metadata.attributes.length} well-defined attributes, providing detailed information.`
      });
    }
    
    // Check for valid external references
    if (metadata.externalUrl) {
      try {
        new URL(metadata.externalUrl);
        strengths.push({
          significance: 'medium',
          description: 'Valid external reference',
          evidence: 'NFT includes properly formatted external URL, enhancing metadata integrity.'
        });
      } catch (e) {
        // Not a strength if URL is invalid
      }
    }
    
    // Check for additional properties
    if (metadata.additionalProperties && Object.keys(metadata.additionalProperties).length > 0) {
      strengths.push({
        significance: 'low',
        description: 'Extended metadata',
        evidence: `NFT includes ${Object.keys(metadata.additionalProperties).length} additional metadata properties.`
      });
    }
    
    // Check for collection consistency if score is high
    if (score > 70 && inputData.collectionData) {
      strengths.push({
        significance: 'high',
        description: 'Strong collection consistency',
        evidence: 'NFT metadata follows collection standards consistently.'
      });
    }
    
    return strengths;
  }

  /**
   * Get a detailed explanation of how this factor is calculated
   * 
   * @returns A human-readable explanation of the factor calculation
   */
  public getExplanation(): string {
    return `The Metadata Consistency Factor evaluates the quality and consistency of the NFT's metadata. It considers:

1. Properties Format (40%): The completeness and proper formatting of metadata fields and attributes.
2. External Reference Integrity (30%): The validity of external URLs and image references.
3. Collection Consistency (30%): How well the metadata conforms to the collection's standards.

The confidence in this score increases with more complex metadata (more attributes, external references, etc.).`;
  }
}