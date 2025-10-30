import { Area, Category, Ingredient, Meal } from '@/types/meal';

export interface InternalMealApi {
  // cache
  getCached<T>(key: string): T | null;
  setCached<T>(key: string, data: T, ttl: number): void;
  readonly CACHE_TTL: {
    categories: number;
    areas: number;
    ingredients: number;
    meal: number;
    search: number;
  };

  // request utils
  fetchData<T>(endpoint: string, retries?: number): Promise<T>;
  getDeduplicatedRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T>;

  // enrichment
  isMealComplete(meal: Meal): boolean;
  enrichMealsWithDetails(basicMeals: Meal[]): Promise<Meal[]>;

  // fallbacks
  getFallbackMeals(): Meal[];
  getFallbackCategories(): Category[];
  getFallbackAreas(): Area[];
  getFallbackIngredients(): Ingredient[];

  // public helpers referenced by internals
  getMealById(id: string): Promise<Meal | null>;
}
