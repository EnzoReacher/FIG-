import { describe, expect, it } from 'vitest';
import {
  MockFoodAnalysisProvider,
  analysisResultSchema,
  providerInputSchema,
} from './analysis-provider.js';
import {
  emptyProviderOutput,
  imageFixtures,
  malformedProviderOutput,
} from './analysis-fixtures.js';

describe('food analysis provider contract', () => {
  it('rejects malformed and empty provider output', () => {
    expect(() => analysisResultSchema.parse(malformedProviderOutput)).toThrow();
    expect(() => analysisResultSchema.parse(emptyProviderOutput)).toThrow();
  });

  it('returns an editable deterministic result', async () => {
    const result = await new MockFoodAnalysisProvider().analyze(
      imageFixtures.singleFood,
    );
    expect(result.name).toBe('Garden salad');
    expect(result.confidence).toBeLessThan(1);
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.schemaVersion).toBe('1');
    expect(result.detectedItems).toHaveLength(1);
  });

  it('returns deterministic mixed and low-confidence fixtures', async () => {
    const provider = new MockFoodAnalysisProvider();
    expect(
      (await provider.analyze(imageFixtures.mixedMeal)).detectedItems,
    ).toHaveLength(2);
    const lowConfidence = await provider.analyze(imageFixtures.lowConfidence);
    expect(lowConfidence.confidence).toBe(0.2);
    expect(lowConfidence.name).toBeTruthy();
  });

  it('rejects oversized, mismatched, and unsupported image metadata', () => {
    expect(() =>
      providerInputSchema.parse({
        mediaType: 'image/jpeg',
        bytesBase64: 'c21hbGw=',
        sizeBytes: 6 * 1024 * 1024,
      }),
    ).toThrow();
    expect(() =>
      providerInputSchema.parse({
        mediaType: 'image/jpeg',
        bytesBase64: 'c21hbGw=',
        sizeBytes: 999,
      }),
    ).toThrow();
    expect(() =>
      providerInputSchema.parse({
        mediaType: 'image/gif',
        bytesBase64: 'c21hbGw=',
        sizeBytes: 5,
      }),
    ).toThrow();
  });
});
