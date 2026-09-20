import { z } from 'zod';
export const analysisResultSchema = z.object({
  name: z.string().min(1),
  calories: z.number().finite().min(0),
  proteinGrams: z.number().finite().min(0),
  carbohydrateGrams: z.number().finite().min(0),
  fatGrams: z.number().finite().min(0),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string()),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export interface FoodAnalysisProvider {
  analyze(imageUrl: string): Promise<AnalysisResult>;
}
export class MockFoodAnalysisProvider implements FoodAnalysisProvider {
  async analyze(imageUrl: string) {
    return analysisResultSchema.parse({
      name: imageUrl.includes('salad') ? 'Garden salad' : 'Analyzed food',
      calories: 320,
      proteinGrams: 12,
      carbohydrateGrams: 34,
      fatGrams: 14,
      confidence: 0.72,
      assumptions: ['Portion size was estimated from the image.'],
    });
  }
}
