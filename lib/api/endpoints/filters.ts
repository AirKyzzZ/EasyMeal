import { ApiResponse, Meal } from '@/types/meal';

import type { InternalMealApi } from '../internalTypes';
import type { MealApiService } from '../mealApiService';

export async function filterByCategory(
  service: MealApiService,
  category: string
): Promise<Meal[]> {
  const svc = service as unknown as InternalMealApi;
  const cacheKey = `filter:category:${category.toLowerCase()}`;
  const cached = svc.getCached<Meal[]>(cacheKey);
  if (cached) return cached;

  const data = await svc.fetchData<ApiResponse<Meal>>(
    `/filter.php?c=${encodeURIComponent(category)}`
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

export async function filterByArea(
  service: MealApiService,
  area: string
): Promise<Meal[]> {
  const svc = service as unknown as InternalMealApi;
  const cacheKey = `filter:area:${area.toLowerCase()}`;
  const cached = svc.getCached<Meal[]>(cacheKey);
  if (cached) return cached;

  const data = await svc.fetchData<ApiResponse<Meal>>(
    `/filter.php?a=${encodeURIComponent(area)}`
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

export async function filterByIngredient(
  service: MealApiService,
  ingredient: string
): Promise<Meal[]> {
  const svc = service as unknown as InternalMealApi;
  const formattedIngredient = ingredient.toLowerCase().replace(/\s+/g, '_');
  const cacheKey = `filter:ingredient:${formattedIngredient}`;
  const cached = svc.getCached<Meal[]>(cacheKey);
  if (cached) return cached;

  const data = await svc.fetchData<ApiResponse<Meal>>(
    `/filter.php?i=${encodeURIComponent(formattedIngredient)}`
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

export async function filterByMultipleIngredients(
  service: MealApiService,
  ingredients: string[]
): Promise<Meal[]> {
  const svc = service as unknown as InternalMealApi;
  if (ingredients.length === 0) return [];
  const sortedIngredients = [...ingredients].sort();
  const cacheKey = `filter:ingredients:${sortedIngredients.join(',')}`;
  const cached = svc.getCached<Meal[]>(cacheKey);
  if (cached) return cached;

  const mealPromises = ingredients.map(ing => filterByIngredient(service, ing));
  const mealArrays = await Promise.all(mealPromises);
  const allMeals = mealArrays.flat();
  const uniqueMeals = allMeals.filter(
    (meal, index, self) =>
      index === self.findIndex(m => m.idMeal === meal.idMeal)
  );
  svc.setCached(cacheKey, uniqueMeals, svc.CACHE_TTL.search);
  return uniqueMeals;
}

export function findMealsWithAvailableIngredients(
  service: MealApiService,
  availableIngredients: string[]
): Promise<Meal[]> {
  if (availableIngredients.length === 0) return Promise.resolve([]);
  return filterByMultipleIngredients(service, availableIngredients);
}
