import { describe, expect, it } from 'vitest';
import { createInMemoryNutritionRepository } from './nutrition-repository.js';

describe('nutrition repository', () => {
  it('creates and lists foods only for their owner', async () => {
    const repository = createInMemoryNutritionRepository();
    const food = await repository.createFood('user-a', {
      name: 'Oats',
      calories: 123.45,
      proteinGrams: 4.56,
      carbohydrateGrams: 20.01,
      fatGrams: 1.23,
    });
    await repository.createFood('user-b', {
      name: 'Rice',
      calories: 100,
      proteinGrams: 2,
      carbohydrateGrams: 20,
      fatGrams: 0,
    });
    expect((await repository.listFoods('user-a')).map((x) => x.name)).toEqual([
      'Oats',
    ]);
    expect(food.caloriesHundredths).toBe(12345);
  });

  it('keeps hundredths precision and calculates totals', async () => {
    const repository = createInMemoryNutritionRepository();
    const food = await repository.createFood('user', {
      name: 'Oats',
      calories: 123.45,
      proteinGrams: 4.56,
      carbohydrateGrams: 20.01,
      fatGrams: 1.23,
    });
    const meal = await repository.createMeal('user', {
      name: 'Breakfast',
      eatenAt: '2026-01-01T08:00:00.000Z',
      items: [{ foodId: food.id, quantity: 1.5 }],
    });
    expect(repository.totals([meal])).toEqual({
      calories: 185.18,
      proteinGrams: 6.84,
      carbohydrateGrams: 30.02,
      fatGrams: 1.85,
    });
  });

  it('lists only meals in the requested profile-local day and supports lifecycle operations', async () => {
    const repository = createInMemoryNutritionRepository();
    const food = await repository.createFood('user', {
      name: 'Apple',
      calories: 50,
      proteinGrams: 0,
      carbohydrateGrams: 12,
      fatGrams: 0,
    });
    await repository.createMeal('user', {
      name: 'Before',
      eatenAt: '2026-01-01T04:59:59.000Z',
      items: [{ foodId: food.id, quantity: 1 }],
    });
    const inside = await repository.createMeal('user', {
      name: 'Inside',
      eatenAt: '2026-01-01T05:00:00.000Z',
      items: [{ foodId: food.id, quantity: 1 }],
    });
    expect(
      (
        await repository.listMeals(
          'user',
          new Date('2026-01-01T05:00:00Z'),
          new Date('2026-01-02T05:00:00Z'),
        )
      ).map((x) => x.meal.name),
    ).toEqual(['Inside']);
    await repository.updateMeal('user', inside.meal.id, { name: 'Updated' });
    expect(
      (
        await repository.listMeals(
          'user',
          new Date('2026-01-01T05:00:00Z'),
          new Date('2026-01-02T00:00:00Z'),
        )
      )[0].meal.name,
    ).toBe('Updated');
    expect(await repository.deleteMeal('user', inside.meal.id)).toBe(true);
    expect(
      (
        await repository.listMeals(
          'user',
          new Date('2026-01-01T05:00:00Z'),
          new Date('2026-01-02T00:00:00Z'),
        )
      ).length,
    ).toBe(0);
  });

  it('replaces meal items and enforces ownership/not-found behavior', async () => {
    const repository = createInMemoryNutritionRepository();
    const firstFood = await repository.createFood('user', {
      name: 'Apple',
      calories: 50,
      proteinGrams: 0,
      carbohydrateGrams: 12,
      fatGrams: 0,
    });
    const secondFood = await repository.createFood('user', {
      name: 'Pear',
      calories: 60,
      proteinGrams: 0,
      carbohydrateGrams: 15,
      fatGrams: 0,
    });
    const meal = await repository.createMeal('user', {
      name: 'Snack',
      eatenAt: '2026-01-01T08:00:00.000Z',
      items: [{ foodId: firstFood.id, quantity: 1 }],
    });
    const replaced = await repository.updateMeal('user', meal.meal.id, {
      items: [{ foodId: secondFood.id, quantity: 2 }],
    });
    expect(replaced?.items.map((x) => x.food.name)).toEqual(['Pear']);
    expect(replaced?.items[0].quantityHundredths).toBe(200);
    expect(await repository.updateMeal('other-user', meal.meal.id, {})).toBe(
      null,
    );
    await expect(
      repository.updateMeal('user', meal.meal.id, {
        items: [{ foodId: crypto.randomUUID(), quantity: 1 }],
      }),
    ).rejects.toThrow('food_not_found');
  });
});
