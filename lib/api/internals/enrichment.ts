import { Meal } from '@/types/meal';

import type { InternalMealApi } from '../internalTypes';
import type { MealApiService } from '../mealApiService';

export function isMealComplete(_service: MealApiService, meal: Meal): boolean {
  return !!(meal.strInstructions && meal.strInstructions.trim());
}

export async function enrichMealsWithDetails(
  service: MealApiService,
  basicMeals: Meal[]
): Promise<Meal[]> {
  const svc = service as unknown as InternalMealApi;
  if (basicMeals.length === 0) return [];

  const completeMeals: Meal[] = [];
  const incompleteMeals: Meal[] = [];

  basicMeals.forEach(meal => {
    if (isMealComplete(service, meal)) {
      completeMeals.push(meal);
    } else {
      incompleteMeals.push(meal);
    }
  });

  const enrichedIncomplete =
    incompleteMeals.length > 0
      ? await Promise.all(
          incompleteMeals.map(async meal => {
            try {
              const cacheKey = `meal:${meal.idMeal}`;
              const cached = svc.getCached<Meal>(cacheKey);
              if (cached) return cached;
              const fullMeal = await svc.getMealById(meal.idMeal);
              return fullMeal || meal;
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn(`Failed to enrich meal ${meal.idMeal}:`, err);
              return meal;
            }
          })
        )
      : [];

  return [...completeMeals, ...enrichedIncomplete];
}
