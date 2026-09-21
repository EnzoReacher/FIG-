import type { AnalysisResult, ProviderInput } from './analysis-provider.js';

export const imageFixtures = {
  singleFood: {
    mediaType: 'image/jpeg',
    bytesBase64: 'c2luZ2xl',
    sizeBytes: 6,
  },
  mixedMeal: { mediaType: 'image/jpeg', bytesBase64: 'bWl4ZWQ=', sizeBytes: 5 },
  lowConfidence: { mediaType: 'image/png', bytesBase64: 'bG93', sizeBytes: 3 },
} satisfies Record<string, ProviderInput>;

export const resultFixtures = {
  singleFood: {
    schemaVersion: '1',
    providerName: 'deterministic-mock',
    modelName: 'fixture-v1',
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
  },
  mixedMeal: {
    schemaVersion: '1',
    providerName: 'deterministic-mock',
    modelName: 'fixture-v1',
    name: 'Rice and beans',
    portionDescription: 'One dinner plate',
    detectedItems: [
      { name: 'Rice', portionDescription: 'About one cup', confidence: 0.8 },
      {
        name: 'Beans',
        portionDescription: 'About three quarters cup',
        confidence: 0.75,
      },
    ],
    calories: 540,
    proteinGrams: 20,
    carbohydrateGrams: 96,
    fatGrams: 8,
    confidence: 0.7,
    assumptions: ['No added oil was visible.'],
  },
  lowConfidence: {
    schemaVersion: '1',
    providerName: 'deterministic-mock',
    modelName: 'fixture-v1',
    name: 'Uncertain mixed food',
    portionDescription: 'Portion unclear',
    detectedItems: [
      {
        name: 'Unknown food',
        portionDescription: 'Portion unclear',
        confidence: 0.2,
      },
    ],
    calories: 250,
    proteinGrams: 8,
    carbohydrateGrams: 30,
    fatGrams: 10,
    confidence: 0.2,
    assumptions: ['Image angle obscured the food and portion size.'],
  },
} satisfies Record<string, AnalysisResult>;

export const malformedProviderOutput = {
  schemaVersion: '0',
  name: '',
  confidence: 2,
};
export const emptyProviderOutput = {
  ...resultFixtures.singleFood,
  detectedItems: [],
};
