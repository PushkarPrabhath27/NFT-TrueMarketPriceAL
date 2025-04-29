import { MetadataValidationFramework, MetadataValidationOptions } from "./MetadataValidationFramework";

describe("MetadataValidationFramework", () => {
  const schema = {
    type: "object",
    properties: {
      name: { type: "string" },
      image: { type: "string", format: "uri" },
      description: { type: "string" }
    },
    required: ["name", "image", "description"]
  };

  const options: MetadataValidationOptions = {
    schema,
    referenceFields: ["image"],
    descriptorFields: ["description"],
    historicalData: [
      { name: "NFT #1", image: "https://example.com/1.png", description: "First NFT" }
    ],
    collectionData: [
      { name: "NFT #1", image: "https://example.com/1.png", description: "First NFT" },
      { name: "NFT #2", image: "https://example.com/2.png", description: "Second NFT" }
    ]
  };

  it("should validate correct metadata", async () => {
    const framework = new MetadataValidationFramework(options);
    const metadata = { name: "NFT #1", image: "https://example.com/1.png", description: "First NFT" };
    const result = await framework.validate(metadata);
    expect(result.isValid).toBe(true);
    expect(result.issues.length).toBe(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("should detect schema errors", async () => {
    const framework = new MetadataValidationFramework(options);
    const metadata = { name: "NFT #1", image: 123, description: "" };
    const result = await framework.validate(metadata);
    expect(result.isValid).toBe(false);
    expect(result.issues.some(i => i.severity === "high")).toBe(true);
  });

  it("should detect unreachable URLs", async () => {
    const framework = new MetadataValidationFramework(options);
    const metadata = { name: "NFT #1", image: "https://invalid-url", description: "First NFT" };
    const result = await framework.validate(metadata);
    expect(result.issues.some(i => i.field === "image" && i.severity === "high")).toBe(true);
  });

  it("should detect content inconsistency across collection", async () => {
    const framework = new MetadataValidationFramework(options);
    const metadata = { name: "NFT #1", image: "https://example.com/DIFFERENT.png", description: "First NFT" };
    const result = await framework.validate(metadata);
    expect(result.issues.some(i => i.message.includes("Inconsistent value"))).toBe(true);
  });

  it("should detect historical inconsistency", async () => {
    const framework = new MetadataValidationFramework(options);
    const metadata = { name: "NFT #1", image: "https://example.com/1.png", description: "Changed Description" };
    const result = await framework.validate(metadata);
    expect(result.issues.some(i => i.message.includes("Historical inconsistency"))).toBe(true);
  });

  it("should detect missing descriptors", async () => {
    const framework = new MetadataValidationFramework(options);
    const metadata = { name: "NFT #1", image: "https://example.com/1.png", description: "" };
    const result = await framework.validate(metadata);
    expect(result.issues.some(i => i.field === "description" && i.severity === "medium")).toBe(true);
  });
});