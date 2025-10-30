import { ApiResponse, Area, Category, Ingredient } from '@/types/meal';
import type { MealApiService } from '../mealApiService';

export async function getCategories(service: MealApiService): Promise<Category[]> {
  const cacheKey = 'categories';
  const cached = (service as any)['getCached']?.<Category[]>(cacheKey) ?? (service as any)['getCached'](cacheKey);
  if (cached) return cached as Category[];

  const categories = await (service as any)['getDeduplicatedRequest']('getCategories', async () => {
    try {
      const data = await (service as any)['fetchData']<ApiResponse<Category>>('/categories.php');
      return (data as ApiResponse<Category>).categories || [];
    } catch {
      return (service as any)['getFallbackCategories']();
    }
  });
  (service as any)['setCached'](cacheKey, categories, (service as any)['CACHE_TTL'].categories);
  return categories as Category[];
}

export async function getAreas(service: MealApiService): Promise<Area[]> {
  const cacheKey = 'areas';
  const cached = (service as any)['getCached']?.<Area[]>(cacheKey) ?? (service as any)['getCached'](cacheKey);
  if (cached) return cached as Area[];

  const areas = await (service as any)['getDeduplicatedRequest']('getAreas', async () => {
    try {
      const data = await (service as any)['fetchData']<ApiResponse<Area>>('/list.php?a=list');
      return (data as ApiResponse<Area>).meals || [];
    } catch {
      return (service as any)['getFallbackAreas']();
    }
  });
  (service as any)['setCached'](cacheKey, areas, (service as any)['CACHE_TTL'].areas);
  return areas as Area[];
}

export async function getIngredients(service: MealApiService): Promise<Ingredient[]> {
  const cacheKey = 'ingredients';
  const cached = (service as any)['getCached']?.<Ingredient[]>(cacheKey) ?? (service as any)['getCached'](cacheKey);
  if (cached) return cached as Ingredient[];

  const ingredients = await (service as any)['getDeduplicatedRequest']('getIngredients', async () => {
    try {
      const data = await (service as any)['fetchData']<ApiResponse<Ingredient>>('/list.php?i=list');
      return (data as ApiResponse<Ingredient>).meals || [];
    } catch {
      return (service as any)['getFallbackIngredients']();
    }
  });
  (service as any)['setCached'](cacheKey, ingredients, (service as any)['CACHE_TTL'].ingredients);
  return ingredients as Ingredient[];
}


