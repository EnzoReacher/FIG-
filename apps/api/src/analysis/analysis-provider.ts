import { z } from 'zod';

export const providerInputSchema = z
  .object({
    mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    bytesBase64: z.string().min(1),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
  })
  .strict()
  .superRefine((input, context) => {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input.bytesBase64)) {
      context.addIssue({
        code: 'custom',
        message: 'Invalid base64 image data',
      });
      return;
    }
    if (Buffer.byteLength(input.bytesBase64, 'base64') !== input.sizeBytes)
      context.addIssue({
        code: 'custom',
        message: 'Image size does not match encoded data',
      });
  });
export const detectedItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  portionDescription: z.string().trim().min(1).max(240),
  confidence: z.number().min(0).max(1),
});
export const analysisResultSchema = z.object({
  schemaVersion: z.literal('1'),
  providerName: z.string().min(1),
  modelName: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  portionDescription: z.string().trim().min(1).max(240),
  detectedItems: z.array(detectedItemSchema).min(1).max(20),
  calories: z.number().finite().min(0).max(100000),
  proteinGrams: z.number().finite().min(0).max(100000),
  carbohydrateGrams: z.number().finite().min(0).max(100000),
  fatGrams: z.number().finite().min(0).max(100000),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string().trim().min(1).max(500)).max(20),
});
export type ProviderInput = z.infer<typeof providerInputSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export interface FoodAnalysisProvider {
  readonly name: string;
  readonly model: string;
  analyze(input: ProviderInput): Promise<AnalysisResult>;
}
export class MockFoodAnalysisProvider implements FoodAnalysisProvider {
  readonly name = 'deterministic-mock';
  readonly model = 'fixture-v1';
  async analyze(input: ProviderInput) {
    providerInputSchema.parse(input);
    return analysisResultSchema.parse({
      schemaVersion: '1',
      providerName: this.name,
      modelName: this.model,
      name: 'Garden salad',
      portionDescription: 'One medium bowl, estimated from the image',
      detectedItems: [
        {
          name: 'Mixed salad',
          portionDescription: 'One medium bowl',
          confidence: 0.72,
        },
      ],
      calories: 320,
      proteinGrams: 12,
      carbohydrateGrams: 34,
      fatGrams: 14,
      confidence: 0.72,
      assumptions: ['Portion size was estimated from the image.'],
    });
  }
}
