import { ApiResponse, Meal } from '@/types/meal';
import type { MealApiService } from '../mealApiService';

export async function searchMeals(service: MealApiService, query: string): Promise<Meal[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `search:${normalizedQuery}`;

  const cached = (service as any).getCached?.<Meal[]>(cacheKey) ?? (service as any)['getCached'](cacheKey);
  if (cached) return cached as Meal[];

  const data = await (service as any)['fetchData']<ApiResponse<Meal>>(
    `/search.php?s=${encodeURIComponent(query)}`
  );
  const basicMeals = (data as ApiResponse<Meal>).meals || [];

  const needsEnrichment = basicMeals.some((meal: Meal) => (service as any)['isMealComplete'](meal));
  const enrichedMeals = needsEnrichment
    ? await (service as any)['enrichMealsWithDetails'](basicMeals)
    : basicMeals;

  (service as any)['setCached'](cacheKey, enrichedMeals, (service as any)['CACHE_TTL'].search);
  return enrichedMeals;
}

export async function searchMealsByLetter(service: MealApiService, letter: string): Promise<Meal[]> {
  const data = await (service as any)['fetchData']<ApiResponse<Meal>>(`/search.php?f=${letter}`);
  const basicMeals = (data as ApiResponse<Meal>).meals || [];
  return (service as any)['enrichMealsWithDetails'](basicMeals);
}


