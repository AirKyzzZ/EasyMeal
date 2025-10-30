import { Meal } from '@/types/meal';
import type { MealApiService } from '../mealApiService';

export function isMealComplete(_service: MealApiService, meal: Meal): boolean {
  return !!(meal.strInstructions && meal.strInstructions.trim());
}

export async function enrichMealsWithDetails(service: MealApiService, basicMeals: Meal[]): Promise<Meal[]> {
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
              const cached = (service as any)['getCached']?.<Meal>(cacheKey) ?? (service as any)['getCached'](cacheKey);
              if (cached) return cached as Meal;
              const fullMeal = await (service as any)['getMealById'](meal.idMeal);
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


