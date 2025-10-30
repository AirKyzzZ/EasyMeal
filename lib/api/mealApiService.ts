import { Meal, Category, Area, Ingredient, ApiResponse } from '@/types/meal';

import {
  BASE_URL,
  RATE_LIMIT_DELAY as CONFIG_RATE_LIMIT_DELAY,
  REQUEST_DEDUP_TTL as CONFIG_REQUEST_DEDUP_TTL,
  CACHE_TTL as CACHE_TTL_CONFIG,
} from './config';
import {
  filterByArea as filterByAreaHelper,
  filterByCategory as filterByCategoryHelper,
  filterByIngredient as filterByIngredientHelper,
  filterByMultipleIngredients as filterByMultipleIngredientsHelper,
  findMealsWithAvailableIngredients as findMealsWithAvailableIngredientsHelper,
} from './endpoints/filters';
import {
  getMealById as getMealByIdHelper,
  getRandomMeal as getRandomMealHelper,
  getRandomMeals as getRandomMealsHelper,
  getMealThumbnailUrl as getMealThumbnailUrlHelper,
  getIngredientThumbnailUrl as getIngredientThumbnailUrlHelper,
  getMealIngredients as getMealIngredientsHelper,
  getIngredientDetails as getIngredientDetailsHelper,
} from './endpoints/meals';
import { getAreas as getAreasHelper, getCategories as getCategoriesHelper, getIngredients as getIngredientsHelper } from './endpoints/metadata';
import { searchMeals as searchMealsHelper, searchMealsByLetter as searchMealsByLetterHelper } from './endpoints/search';
import { getFallbackAreas, getFallbackCategories, getFallbackIngredients, getFallbackMeals } from './fallbacks';
import { enrichMealsWithDetails as enrichMealsWithDetailsHelper, isMealComplete as isMealCompleteHelper } from './internals/enrichment';
import { CacheEntry, PendingRequest } from './types';

export class MealApiService {
  private requestQueue: Array<() => Promise<unknown>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = CONFIG_RATE_LIMIT_DELAY; // 200ms between requests (5 requests per second max)

  // Caching for frequently accessed data
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly CACHE_TTL = CACHE_TTL_CONFIG;

  // Request deduplication - prevent duplicate concurrent requests
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly REQUEST_DEDUP_TTL = CONFIG_REQUEST_DEDUP_TTL; // 5 seconds to consider request as same

  // Helper to check if meal data is complete (has instructions)
  private isMealComplete(meal: Meal): boolean {
    return isMealCompleteHelper(this, meal);
  }

  // Cache getter with TTL check
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Cache setter
  private setCached<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Clean up expired cache entries periodically
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Request deduplication - check if same request is already pending
  private getDeduplicatedRequest<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const pending = this.pendingRequests.get(key);
    const now = Date.now();

    // If there's a pending request that's still fresh, return it
    if (pending && now - pending.timestamp < this.REQUEST_DEDUP_TTL) {
      return pending.promise as Promise<T>;
    }

    // Create new request
    const promise = fetcher().finally(() => {
      // Remove from pending requests after completion
      const currentPending = this.pendingRequests.get(key);
      if (currentPending?.promise === promise) {
        this.pendingRequests.delete(key);
      }
    });

    this.pendingRequests.set(key, { promise, timestamp: now });
    return promise;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
        );
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Queue request failed:', error);
        }
        this.lastRequestTime = Date.now();
      }
    }

    this.isProcessingQueue = false;
  }

  private fetchData<T>(endpoint: string, retries: number = 3): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const makeRequest = async (): Promise<void> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${BASE_URL}${endpoint}`, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              // Handle rate limiting specifically
              if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : 10000; // Default 10 seconds
                // eslint-disable-next-line no-console
                console.warn(
                  `Rate limited. Waiting ${delay}ms before retry...`
                );
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Retry the same attempt
              }
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = (await response.json()) as T;
            resolve(data);
            return;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`API Error (attempt ${attempt}/${retries}):`, error);

            // If this is the last attempt, throw the error
            if (attempt === retries) {
              // Provide more specific error messages
              if (
                error instanceof TypeError &&
                error.message === 'Failed to fetch'
              ) {
                reject(
                  new Error(
                    'Network error: Unable to connect to the meal database. Please check your internet connection.'
                  )
                );
                return;
              }

              if (error instanceof Error && error.name === 'AbortError') {
                reject(
                  new Error(
                    'Request timeout: The server took too long to respond. Please try again.'
                  )
                );
                return;
              }

              reject(error);
              return;
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }

        reject(new Error('All retry attempts failed'));
      };

      this.requestQueue.push(makeRequest);
      void this.processQueue();
    });
  }

  // Search meals by name
  searchMeals(query: string): Promise<Meal[]> {
    return searchMealsHelper(this, query);
  }

  // Search meals by first letter
  searchMealsByLetter(letter: string): Promise<Meal[]> {
    return searchMealsByLetterHelper(this, letter);
  }

  // Get meal details by ID
  getMealById(id: string): Promise<Meal | null> {
    return getMealByIdHelper(this, id);
  }

  // Helper method to enrich basic meal data with full details
  // Only enriches meals that need enrichment (incomplete data)
  private enrichMealsWithDetails(basicMeals: Meal[]): Promise<Meal[]> {
    return enrichMealsWithDetailsHelper(this, basicMeals);
  }

  // Get random meals with pagination support
  getRandomMeals(_page: number = 0, pageSize: number = 6): Promise<Meal[]> {
    return getRandomMealsHelper(this, _page, pageSize);
  }

  // Get random meal
  getRandomMeal(): Promise<Meal | null> {
    return getRandomMealHelper(this);
  }

  // Get all categories
  getCategories(): Promise<Category[]> {
    return getCategoriesHelper(this);
  }

  // Get all areas
  getAreas(): Promise<Area[]> {
    return getAreasHelper(this);
  }

  // Get all ingredients
  getIngredients(): Promise<Ingredient[]> {
    return getIngredientsHelper(this);
  }

  // Filter meals by category
  filterByCategory(category: string): Promise<Meal[]> {
    return filterByCategoryHelper(this, category);
  }

  // Filter meals by area
  filterByArea(area: string): Promise<Meal[]> {
    return filterByAreaHelper(this, area);
  }

  // Filter meals by ingredient
  filterByIngredient(ingredient: string): Promise<Meal[]> {
    return filterByIngredientHelper(this, ingredient);
  }

  // Filter meals by multiple ingredients (find meals that contain any of the provided ingredients)
  filterByMultipleIngredients(ingredients: string[]): Promise<Meal[]> {
    return filterByMultipleIngredientsHelper(this, ingredients);
  }

  // Find meals that can be made with available ingredients (meals that contain any of the available ingredients)
  findMealsWithAvailableIngredients(availableIngredients: string[]): Promise<Meal[]> {
    return findMealsWithAvailableIngredientsHelper(this, availableIngredients);
  }

  // Get ingredient details with thumbnail
  getIngredientDetails(ingredient: string): { name: string; thumbnail: string; description?: string } {
    return getIngredientDetailsHelper(this, ingredient);
  }

  // Fallback data for when API is unavailable
  private getFallbackMeals(): Meal[] {
    return getFallbackMeals();
  }

  private getFallbackCategories(): Category[] {
    return getFallbackCategories();
  }

  private getFallbackAreas(): Area[] {
    return getFallbackAreas();
  }

  private getFallbackIngredients(): Ingredient[] {
    return getFallbackIngredients();
  }

  // Get meal thumbnail URL
  getMealThumbnailUrl(meal: Meal, _size: 'small' | 'medium' | 'large' = 'medium'): string {
    return getMealThumbnailUrlHelper(this, meal, _size);
  }

  // Get ingredient thumbnail URL
  getIngredientThumbnailUrl(ingredient: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    return getIngredientThumbnailUrlHelper(this, ingredient, size);
  }

  // Extract ingredients and measures from meal
  getMealIngredients(meal: Meal): Array<{ ingredient: string; measure: string }> {
    return getMealIngredientsHelper(this, meal);
  }

  // Debug method to test API connectivity
  async testApiConnection(): Promise<{
    success: boolean;
    error?: string;
    data?: ApiResponse<Meal>;
  }> {
    try {
      // eslint-disable-next-line no-console
      console.log('Testing API connection...');
      const data = await this.fetchData<ApiResponse<Meal>>('/random.php');
      // eslint-disable-next-line no-console
      console.log('API test successful:', data);
      return { success: true, data };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('API test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}


