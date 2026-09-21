import { describe, expect, it } from 'vitest';
import {
  MockFoodAnalysisProvider,
  analysisResultSchema,
} from './analysis-provider.js';
describe('food analysis foundation', () => {
  it('rejects malformed provider output', () => {
    expect(() =>
      analysisResultSchema.parse({ name: '', confidence: 2 }),
    ).toThrow();
  });
  it('returns an editable deterministic result', async () => {
    const result = await new MockFoodAnalysisProvider().analyze({
      mediaType: 'image/jpeg',
      bytesBase64: 'c2FsYWQ=',
      sizeBytes: 5,
    });
    expect(result.name).toBe('Garden salad');
    expect(result.confidence).toBeLessThan(1);
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.schemaVersion).toBe('1');
    expect(result.detectedItems).toHaveLength(1);
  });
});
