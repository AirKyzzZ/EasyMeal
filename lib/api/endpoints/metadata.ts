import { ApiResponse, Area, Category, Ingredient } from '@/types/meal';

import type { InternalMealApi } from '../internalTypes';
import type { MealApiService } from '../mealApiService';

export async function getCategories(service: MealApiService): Promise<Category[]> {
  const svc = service as unknown as InternalMealApi;
  const cacheKey = 'categories';
  const cached = svc.getCached<Category[]>(cacheKey);
  if (cached) return cached;

  const categories = await svc.getDeduplicatedRequest('getCategories', async () => {
    try {
      const data = await svc.fetchData<ApiResponse<Category>>('/categories.php');
      return data.categories || [];
    } catch {
      return svc.getFallbackCategories();
    }
  });
  svc.setCached(cacheKey, categories, svc.CACHE_TTL.categories);
  return categories;
}

export async function getAreas(service: MealApiService): Promise<Area[]> {
  const svc = service as unknown as InternalMealApi;
  const cacheKey = 'areas';
  const cached = svc.getCached<Area[]>(cacheKey);
  if (cached) return cached;

  const areas = await svc.getDeduplicatedRequest('getAreas', async () => {
    try {
      const data = await svc.fetchData<ApiResponse<Area>>('/list.php?a=list');
      return data.meals || [];
    } catch {
      return svc.getFallbackAreas();
    }
  });
  svc.setCached(cacheKey, areas, svc.CACHE_TTL.areas);
  return areas;
}

export async function getIngredients(service: MealApiService): Promise<Ingredient[]> {
  const svc = service as unknown as InternalMealApi;
  const cacheKey = 'ingredients';
  const cached = svc.getCached<Ingredient[]>(cacheKey);
  if (cached) return cached;

  const ingredients = await svc.getDeduplicatedRequest('getIngredients', async () => {
    try {
      const data = await svc.fetchData<ApiResponse<Ingredient>>('/list.php?i=list');
      return data.meals || [];
    } catch {
      return svc.getFallbackIngredients();
    }
  });
  svc.setCached(cacheKey, ingredients, svc.CACHE_TTL.ingredients);
  return ingredients;
}


