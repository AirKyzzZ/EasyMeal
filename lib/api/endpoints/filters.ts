import { ApiResponse, Meal } from '@/types/meal';
import type { MealApiService } from '../mealApiService';

export async function filterByCategory(service: MealApiService, category: string): Promise<Meal[]> {
  const cacheKey = `filter:category:${category.toLowerCase()}`;
  const cached = (service as any)['getCached']?.<Meal[]>(cacheKey) ?? (service as any)['getCached'](cacheKey);
  if (cached) return cached as Meal[];

  const data = await (service as any)['fetchData']<ApiResponse<Meal>>(`/filter.php?c=${encodeURIComponent(category)}`);
  const basicMeals = (data as ApiResponse<Meal>).meals || [];
  const needsEnrichment = basicMeals.some((meal: Meal) => !(service as any)['isMealComplete'](meal));
  const enrichedMeals = needsEnrichment ? await (service as any)['enrichMealsWithDetails'](basicMeals) : basicMeals;
  (service as any)['setCached'](cacheKey, enrichedMeals, (service as any)['CACHE_TTL'].search);
  return enrichedMeals;
}

export async function filterByArea(service: MealApiService, area: string): Promise<Meal[]> {
  const cacheKey = `filter:area:${area.toLowerCase()}`;
  const cached = (service as any)['getCached']?.<Meal[]>(cacheKey) ?? (service as any)['getCached'](cacheKey);
  if (cached) return cached as Meal[];

  const data = await (service as any)['fetchData']<ApiResponse<Meal>>(`/filter.php?a=${encodeURIComponent(area)}`);
  const basicMeals = (data as ApiResponse<Meal>).meals || [];
  const needsEnrichment = basicMeals.some((meal: Meal) => !(service as any)['isMealComplete'](meal));
  const enrichedMeals = needsEnrichment ? await (service as any)['enrichMealsWithDetails'](basicMeals) : basicMeals;
  (service as any)['setCached'](cacheKey, enrichedMeals, (service as any)['CACHE_TTL'].search);
  return enrichedMeals;
}

export async function filterByIngredient(service: MealApiService, ingredient: string): Promise<Meal[]> {
  const formattedIngredient = ingredient.toLowerCase().replace(/\s+/g, '_');
  const cacheKey = `filter:ingredient:${formattedIngredient}`;
  const cached = (service as any)['getCached']?.<Meal[]>(cacheKey) ?? (service as any)['getCached'](cacheKey);
  if (cached) return cached as Meal[];

  const data = await (service as any)['fetchData']<ApiResponse<Meal>>(`/filter.php?i=${encodeURIComponent(formattedIngredient)}`);
  const basicMeals = (data as ApiResponse<Meal>).meals || [];
  const needsEnrichment = basicMeals.some((meal: Meal) => !(service as any)['isMealComplete'](meal));
  const enrichedMeals = needsEnrichment ? await (service as any)['enrichMealsWithDetails'](basicMeals) : basicMeals;
  (service as any)['setCached'](cacheKey, enrichedMeals, (service as any)['CACHE_TTL'].search);
  return enrichedMeals;
}

export async function filterByMultipleIngredients(service: MealApiService, ingredients: string[]): Promise<Meal[]> {
  if (ingredients.length === 0) return [];
  const sortedIngredients = [...ingredients].sort();
  const cacheKey = `filter:ingredients:${sortedIngredients.join(',')}`;
  const cached = (service as any)['getCached']?.<Meal[]>(cacheKey) ?? (service as any)['getCached'](cacheKey);
  if (cached) return cached as Meal[];

  const mealPromises = ingredients.map(ing => filterByIngredient(service, ing));
  const mealArrays = await Promise.all(mealPromises);
  const allMeals = mealArrays.flat();
  const uniqueMeals = allMeals.filter((meal, index, self) => index === self.findIndex(m => m.idMeal === meal.idMeal));
  (service as any)['setCached'](cacheKey, uniqueMeals, (service as any)['CACHE_TTL'].search);
  return uniqueMeals;
}

export async function findMealsWithAvailableIngredients(service: MealApiService, availableIngredients: string[]): Promise<Meal[]> {
  if (availableIngredients.length === 0) return [];
  return filterByMultipleIngredients(service, availableIngredients);
}


