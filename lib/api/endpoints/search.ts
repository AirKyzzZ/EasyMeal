import { ApiResponse, Meal } from '@/types/meal';

import type { InternalMealApi } from '../internalTypes';
import type { MealApiService } from '../mealApiService';

export async function searchMeals(
  service: MealApiService,
  query: string
): Promise<Meal[]> {
  const svc = service as unknown as InternalMealApi;
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `search:${normalizedQuery}`;

  const cached = svc.getCached<Meal[]>(cacheKey);
  if (cached) return cached;

  const data = await svc.fetchData<ApiResponse<Meal>>(
    `/search.php?s=${encodeURIComponent(query)}`
  );
  const basicMeals = data.meals || [];

  const needsEnrichment = basicMeals.some(
    (meal: Meal) => !svc.isMealComplete(meal)
  );
  const enrichedMeals = needsEnrichment
    ? await svc.enrichMealsWithDetails(basicMeals)
    : basicMeals;

  svc.setCached(cacheKey, enrichedMeals, svc.CACHE_TTL.search);
  return enrichedMeals;
}

export async function searchMealsByLetter(
  service: MealApiService,
  letter: string
): Promise<Meal[]> {
  const svc = service as unknown as InternalMealApi;
  const data = await svc.fetchData<ApiResponse<Meal>>(
    `/search.php?f=${letter}`
  );
  const basicMeals = data.meals || [];
  return svc.enrichMealsWithDetails(basicMeals);
}
