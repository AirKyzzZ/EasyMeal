import { ApiResponse, Meal } from '@/types/meal';

import type { InternalMealApi } from '../internalTypes';
import type { MealApiService } from '../mealApiService';

export async function getMealById(
  service: MealApiService,
  id: string
): Promise<Meal | null> {
  const svc = service as unknown as InternalMealApi;
  const cacheKey = `meal:${id}`;
  const cached = svc.getCached<Meal>(cacheKey);
  if (cached) return cached;

  const meal = await svc.getDeduplicatedRequest(
    `getMealById:${id}`,
    async () => {
      const data = await svc.fetchData<ApiResponse<Meal>>(
        `/lookup.php?i=${id}`
      );
      return data.meals?.[0] || null;
    }
  );

  if (meal) {
    svc.setCached(cacheKey, meal, svc.CACHE_TTL.meal);
  }
  return meal;
}

export async function getRandomMeal(
  service: MealApiService
): Promise<Meal | null> {
  const svc = service as unknown as InternalMealApi;
  try {
    const data = await svc.fetchData<ApiResponse<Meal>>('/random.php');
    return data.meals?.[0] || null;
  } catch {
    const fallbackMeals = svc.getFallbackMeals();
    return fallbackMeals[Math.floor(Math.random() * fallbackMeals.length)];
  }
}

export async function getRandomMeals(
  service: MealApiService,
  _page: number = 0,
  pageSize: number = 6
): Promise<Meal[]> {
  const randomMeals: (Meal | null)[] = [];
  const batchSize = 3;

  for (let i = 0; i < pageSize; i += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, pageSize - i) },
      () => getRandomMeal(service)
    );
    const batchResults = await Promise.all(batch);
    randomMeals.push(...batchResults);
    if (i + batchSize < pageSize) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  return randomMeals.filter((m): m is Meal => m !== null);
}

export function getMealThumbnailUrl(
  _service: MealApiService,
  meal: Meal,
  _size: 'small' | 'medium' | 'large' = 'medium'
): string {
  return meal.strMealThumb;
}

export function getIngredientThumbnailUrl(
  _service: MealApiService,
  ingredient: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  const formattedIngredient = ingredient.toLowerCase().replace(/\s+/g, '_');
  return `https://www.themealdb.com/images/ingredients/${formattedIngredient}-${size}.png`;
}

export function getMealIngredients(
  _service: MealApiService,
  meal: Meal
): Array<{ ingredient: string; measure: string }> {
  const ingredients: Array<{ ingredient: string; measure: string }> = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = (meal as unknown as Record<string, string>)[
      `strIngredient${i}`
    ];
    const measure = (meal as unknown as Record<string, string>)[
      `strMeasure${i}`
    ];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure?.trim() || '',
      });
    }
  }
  return ingredients;
}

export function getIngredientDetails(
  service: MealApiService,
  ingredient: string
): { name: string; thumbnail: string; description?: string } {
  return {
    name: ingredient,
    thumbnail: getIngredientThumbnailUrl(service, ingredient),
    description: `Fresh ${ingredient.toLowerCase()}`,
  };
}
