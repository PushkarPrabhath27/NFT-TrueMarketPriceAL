// MetadataValidationFramework.ts
// Comprehensive NFT Metadata Validation Framework

import Ajv, {ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import axios from "axios";

export type MetadataValidationIssue = {
  field: string;
  message: string;
  severity: "low" | "medium" | "high";
  confidence: number;
};

export type MetadataValidationResult = {
  isValid: boolean;
  issues: MetadataValidationIssue[];
  overallScore: number;
  comparativeScore?: number;
  recommendations?: string[];
};

export interface MetadataValidationOptions {
  schema: object;
  referenceFields?: string[];
  descriptorFields?: string[];
  historicalData?: object[];
  collectionData?: object[];
}

export class MetadataValidationFramework {
  private ajv: Ajv;
  private validateFn: ValidateFunction;
  private options: MetadataValidationOptions;

  constructor(options: MetadataValidationOptions) {
    this.ajv = new Ajv({allErrors: true, strict: false});
    addFormats(this.ajv);
    this.options = options;
    this.validateFn = this.ajv.compile(options.schema);
  }

  async validate(metadata: object): Promise<MetadataValidationResult> {
    const issues: MetadataValidationIssue[] = [];
    let isValid = true;
    // 1. Schema compliance and completeness
    if (!this.validateFn(metadata)) {
      isValid = false;
      for (const err of this.validateFn.errors || []) {
        issues.push({
          field: err.instancePath || err.schemaPath,
          message: err.message || "Schema validation error",
          severity: "high",
          confidence: 1.0
        });
      }
    }
    // 2. External reference integrity (URLs, links)
    if (this.options.referenceFields) {
      for (const field of this.options.referenceFields) {
        const url = (metadata as any)[field];
        if (url && typeof url === "string") {
          try {
            const resp = await axios.head(url, {timeout: 5000});
            if (resp.status < 200 || resp.status >= 400) {
              issues.push({
                field,
                message: `URL ${url} returned status ${resp.status}`,
                severity: "medium",
                confidence: 0.8
              });
            }
          } catch (e) {
            issues.push({
              field,
              message: `URL ${url} is unreachable or invalid`,
              severity: "high",
              confidence: 0.9
            });
          }
        }
      }
    }
    // 3. Content consistency across platforms (requires collectionData)
    if (this.options.collectionData) {
      for (const peer of this.options.collectionData) {
        for (const key in metadata) {
          if (peer[key] !== undefined && peer[key] !== (metadata as any)[key]) {
            issues.push({
              field: key,
              message: `Inconsistent value across collection: ${peer[key]} vs ${(metadata as any)[key]}`,
              severity: "medium",
              confidence: 0.7
            });
          }
        }
      }
    }
    // 4. Historical consistency and unauthorized changes
    if (this.options.historicalData) {
      for (const snapshot of this.options.historicalData) {
        for (const key in metadata) {
          if (snapshot[key] !== undefined && snapshot[key] !== (metadata as any)[key]) {
            issues.push({
              field: key,
              message: `Historical inconsistency detected: ${snapshot[key]} vs ${(metadata as any)[key]}`,
              severity: "high",
              confidence: 0.85
            });
          }
        }
      }
    }
    // 5. Appropriate content descriptors
    if (this.options.descriptorFields) {
      for (const field of this.options.descriptorFields) {
        if (!(metadata as any)[field] || typeof (metadata as any)[field] !== "string" || (metadata as any)[field].trim() === "") {
          issues.push({
            field,
            message: `Missing or invalid descriptor for ${field}`,
            severity: "medium",
            confidence: 0.8
          });
        }
      }
    }
    // Scoring system
    const severityWeights = {low: 1, medium: 3, high: 5};
    let score = 100;
    for (const issue of issues) {
      score -= severityWeights[issue.severity] * issue.confidence * 10;
    }
    score = Math.max(0, Math.round(score));
    // Comparative analysis within collections
    let comparativeScore: number | undefined = undefined;
    if (this.options.collectionData) {
      const scores = this.options.collectionData.map((peer: any) => {
        let peerScore = 100;
        for (const key in metadata) {
          if (peer[key] !== undefined && peer[key] !== (metadata as any)[key]) {
            peerScore -= 5;
          }
        }
        return peerScore;
      });
      comparativeScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    // Recommendations
    const recommendations: string[] = [];
    if (score < 80) recommendations.push("Review metadata for schema and reference issues.");
    if (issues.some(i => i.severity === "high")) recommendations.push("Resolve high severity issues immediately.");
    if (comparativeScore !== undefined && comparativeScore < 80) recommendations.push("Align metadata with collection standards.");
    return {
      isValid: score >= 80 && (!issues.some(i => i.severity === "high")),
      issues,
      overallScore: score,
      comparativeScore,
      recommendations
    };
  }
}