import { Meal, Category, Area, Ingredient, ApiResponse } from '@/types/meal';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Cache interface with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Request deduplication - track ongoing requests
interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

class MealApiService {
  private requestQueue: Array<() => Promise<unknown>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 200; // 200ms between requests (5 requests per second max)

  // Caching for frequently accessed data
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly CACHE_TTL = {
    categories: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
    areas: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
    ingredients: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
    meal: 5 * 60 * 1000, // 5 minutes (meal details)
    search: 2 * 60 * 1000, // 2 minutes (search results)
  };

  // Request deduplication - prevent duplicate concurrent requests
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly REQUEST_DEDUP_TTL = 5000; // 5 seconds to consider request as same

  // Helper to check if meal data is complete (has instructions)
  private isMealComplete(meal: Meal): boolean {
    return !!(meal.strInstructions && meal.strInstructions.trim());
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

  private async processQueue() {
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
          console.error('Queue request failed:', error);
        }
        this.lastRequestTime = Date.now();
      }
    }

    this.isProcessingQueue = false;
  }

  private fetchData<T>(endpoint: string, retries: number = 3): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const makeRequest = async () => {
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
                console.warn(
                  `Rate limited. Waiting ${delay}ms before retry...`
                );
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Retry the same attempt
              }
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            resolve(data);
            return;
          } catch (error) {
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
  async searchMeals(query: string): Promise<Meal[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `search:${normalizedQuery}`;

    // Check cache first
    const cached = this.getCached<Meal[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.fetchData<ApiResponse<Meal>>(
      `/search.php?s=${encodeURIComponent(query)}`
    );
    const basicMeals = data.meals || [];

    // Only enrich if needed (check if meals are incomplete)
    const needsEnrichment = basicMeals.some(meal => !this.isMealComplete(meal));
    const enrichedMeals = needsEnrichment
      ? await this.enrichMealsWithDetails(basicMeals)
      : basicMeals;

    // Cache the results
    this.setCached(cacheKey, enrichedMeals, this.CACHE_TTL.search);

    return enrichedMeals;
  }

  // Search meals by first letter
  async searchMealsByLetter(letter: string): Promise<Meal[]> {
    const data = await this.fetchData<ApiResponse<Meal>>(
      `/search.php?f=${letter}`
    );
    const basicMeals = data.meals || [];

    // Enrich basic meals with full details (tags, ingredients, etc.)
    return this.enrichMealsWithDetails(basicMeals);
  }

  // Get meal details by ID
  async getMealById(id: string): Promise<Meal | null> {
    const cacheKey = `meal:${id}`;

    // Check cache first
    const cached = this.getCached<Meal>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use deduplication for concurrent requests
    const meal = await this.getDeduplicatedRequest(
      `getMealById:${id}`,
      async () => {
        const data = await this.fetchData<ApiResponse<Meal>>(
          `/lookup.php?i=${id}`
        );
        return data.meals?.[0] || null;
      }
    );

    // Cache the result if found
    if (meal) {
      this.setCached(cacheKey, meal, this.CACHE_TTL.meal);
    }

    return meal;
  }

  // Helper method to enrich basic meal data with full details
  // Only enriches meals that need enrichment (incomplete data)
  private async enrichMealsWithDetails(basicMeals: Meal[]): Promise<Meal[]> {
    if (basicMeals.length === 0) return [];

    // Separate complete and incomplete meals
    const completeMeals: Meal[] = [];
    const incompleteMeals: Meal[] = [];

    basicMeals.forEach(meal => {
      if (this.isMealComplete(meal)) {
        completeMeals.push(meal);
      } else {
        incompleteMeals.push(meal);
      }
    });

    // Only fetch details for incomplete meals
    const enrichedIncomplete =
      incompleteMeals.length > 0
        ? await Promise.all(
            incompleteMeals.map(async meal => {
              try {
                // Check cache first
                const cacheKey = `meal:${meal.idMeal}`;
                const cached = this.getCached<Meal>(cacheKey);
                if (cached) {
                  return cached;
                }

                // Fetch if not cached
                const fullMeal = await this.getMealById(meal.idMeal);
                return fullMeal || meal; // Fallback to basic meal if full details fail
              } catch (err) {
                console.warn(`Failed to enrich meal ${meal.idMeal}:`, err);
                return meal; // Fallback to basic meal
              }
            })
          )
        : [];

    // Combine complete meals with enriched incomplete meals
    return [...completeMeals, ...enrichedIncomplete];
  }

  // Get random meals with pagination support
  async getRandomMeals(
    _page: number = 0,
    pageSize: number = 6
  ): Promise<Meal[]> {
    const randomMeals: (Meal | null)[] = [];
    const batchSize = 3; // Process 3 meals at a time

    for (let i = 0; i < pageSize; i += batchSize) {
      const batch = Array.from(
        { length: Math.min(batchSize, pageSize - i) },
        () => this.getRandomMeal()
      );
      const batchResults = await Promise.all(batch);
      randomMeals.push(...batchResults);

      // Small delay between batches to be respectful to the API
      if (i + batchSize < pageSize) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const validMeals = randomMeals.filter(meal => meal !== null);
    return validMeals;
  }

  // Get random meal
  async getRandomMeal(): Promise<Meal | null> {
    try {
      const data = await this.fetchData<ApiResponse<Meal>>('/random.php');
      return data.meals?.[0] || null;
    } catch {
      console.warn('API unavailable, using fallback data');
      const fallbackMeals = this.getFallbackMeals();
      return fallbackMeals[Math.floor(Math.random() * fallbackMeals.length)];
    }
  }

  // Get all categories
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories';

    // Check cache first
    const cached = this.getCached<Category[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use deduplication
    const categories = await this.getDeduplicatedRequest(
      'getCategories',
      async () => {
        try {
          const data =
            await this.fetchData<ApiResponse<Category>>('/categories.php');
          return data.categories || [];
        } catch {
          console.warn('API unavailable, using fallback categories');
          return this.getFallbackCategories();
        }
      }
    );

    // Cache the result
    this.setCached(cacheKey, categories, this.CACHE_TTL.categories);

    return categories;
  }

  // Get all areas
  async getAreas(): Promise<Area[]> {
    const cacheKey = 'areas';

    // Check cache first
    const cached = this.getCached<Area[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use deduplication
    const areas = await this.getDeduplicatedRequest('getAreas', async () => {
      try {
        const data =
          await this.fetchData<ApiResponse<Area>>('/list.php?a=list');
        return data.meals || [];
      } catch {
        console.warn('API unavailable, using fallback areas');
        return this.getFallbackAreas();
      }
    });

    // Cache the result
    this.setCached(cacheKey, areas, this.CACHE_TTL.areas);

    return areas;
  }

  // Get all ingredients
  async getIngredients(): Promise<Ingredient[]> {
    const cacheKey = 'ingredients';

    // Check cache first
    const cached = this.getCached<Ingredient[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use deduplication
    const ingredients = await this.getDeduplicatedRequest(
      'getIngredients',
      async () => {
        try {
          const data =
            await this.fetchData<ApiResponse<Ingredient>>('/list.php?i=list');
          return data.meals || [];
        } catch {
          console.warn('API unavailable, using fallback ingredients');
          return this.getFallbackIngredients();
        }
      }
    );

    // Cache the result
    this.setCached(cacheKey, ingredients, this.CACHE_TTL.ingredients);

    return ingredients;
  }

  // Filter meals by category
  async filterByCategory(category: string): Promise<Meal[]> {
    const cacheKey = `filter:category:${category.toLowerCase()}`;

    // Check cache first
    const cached = this.getCached<Meal[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.fetchData<ApiResponse<Meal>>(
      `/filter.php?c=${encodeURIComponent(category)}`
    );
    const basicMeals = data.meals || [];

    // Only enrich if needed
    const needsEnrichment = basicMeals.some(meal => !this.isMealComplete(meal));
    const enrichedMeals = needsEnrichment
      ? await this.enrichMealsWithDetails(basicMeals)
      : basicMeals;

    // Cache the results
    this.setCached(cacheKey, enrichedMeals, this.CACHE_TTL.search);

    return enrichedMeals;
  }

  // Filter meals by area
  async filterByArea(area: string): Promise<Meal[]> {
    const cacheKey = `filter:area:${area.toLowerCase()}`;

    // Check cache first
    const cached = this.getCached<Meal[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.fetchData<ApiResponse<Meal>>(
      `/filter.php?a=${encodeURIComponent(area)}`
    );
    const basicMeals = data.meals || [];

    // Only enrich if needed
    const needsEnrichment = basicMeals.some(meal => !this.isMealComplete(meal));
    const enrichedMeals = needsEnrichment
      ? await this.enrichMealsWithDetails(basicMeals)
      : basicMeals;

    // Cache the results
    this.setCached(cacheKey, enrichedMeals, this.CACHE_TTL.search);

    return enrichedMeals;
  }

  // Filter meals by ingredient
  async filterByIngredient(ingredient: string): Promise<Meal[]> {
    // Convert spaces to underscores as required by the API
    const formattedIngredient = ingredient.toLowerCase().replace(/\s+/g, '_');
    const cacheKey = `filter:ingredient:${formattedIngredient}`;

    // Check cache first
    const cached = this.getCached<Meal[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.fetchData<ApiResponse<Meal>>(
      `/filter.php?i=${encodeURIComponent(formattedIngredient)}`
    );
    const basicMeals = data.meals || [];

    // Only enrich if needed
    const needsEnrichment = basicMeals.some(meal => !this.isMealComplete(meal));
    const enrichedMeals = needsEnrichment
      ? await this.enrichMealsWithDetails(basicMeals)
      : basicMeals;

    // Cache the results
    this.setCached(cacheKey, enrichedMeals, this.CACHE_TTL.search);

    return enrichedMeals;
  }

  // Filter meals by multiple ingredients (find meals that contain any of the provided ingredients)
  async filterByMultipleIngredients(ingredients: string[]): Promise<Meal[]> {
    if (ingredients.length === 0) return [];

    // Create cache key from sorted ingredients
    const sortedIngredients = [...ingredients].sort();
    const cacheKey = `filter:ingredients:${sortedIngredients.join(',')}`;

    // Check cache first
    const cached = this.getCached<Meal[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get meals for each ingredient (these calls are already cached/optimized)
    const mealPromises = ingredients.map(ingredient =>
      this.filterByIngredient(ingredient)
    );
    const mealArrays = await Promise.all(mealPromises);

    // Flatten and deduplicate meals
    const allMeals = mealArrays.flat();
    const uniqueMeals = allMeals.filter(
      (meal, index, self) =>
        index === self.findIndex(m => m.idMeal === meal.idMeal)
    );

    // Cache the combined results
    this.setCached(cacheKey, uniqueMeals, this.CACHE_TTL.search);

    return uniqueMeals;
  }

  // Find meals that can be made with available ingredients (meals that contain any of the available ingredients)
  async findMealsWithAvailableIngredients(
    availableIngredients: string[]
  ): Promise<Meal[]> {
    if (availableIngredients.length === 0) return [];

    // Get all meals that contain any of the available ingredients
    const candidateMeals =
      await this.filterByMultipleIngredients(availableIngredients);

    // Return all candidate meals (meals that contain ANY of the available ingredients)
    // This provides a more useful result than requiring ALL ingredients to be available
    return candidateMeals;
  }

  // Get ingredient details with thumbnail
  getIngredientDetails(ingredient: string): {
    name: string;
    thumbnail: string;
    description?: string;
  } {
    return {
      name: ingredient,
      thumbnail: this.getIngredientThumbnailUrl(ingredient),
      description: `Fresh ${ingredient.toLowerCase()}`,
    };
  }

  // Fallback data for when API is unavailable
  private getFallbackMeals(): Meal[] {
    return [
      {
        idMeal: 'fallback-1',
        strMeal: 'Classic Spaghetti Carbonara',
        strCategory: 'Pasta',
        strArea: 'Italian',
        strInstructions:
          'Cook pasta according to package directions. In a bowl, whisk eggs and cheese. Cook bacon until crispy. Toss hot pasta with bacon, then with egg mixture. Serve immediately.',
        strMealThumb:
          'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
        strTags: 'Pasta,Italian,Comfort Food',
        strIngredient1: 'Spaghetti',
        strIngredient2: 'Eggs',
        strIngredient3: 'Parmesan Cheese',
        strIngredient4: 'Bacon',
        strIngredient5: 'Black Pepper',
        strMeasure1: '400g',
        strMeasure2: '4 large',
        strMeasure3: '100g grated',
        strMeasure4: '200g diced',
        strMeasure5: 'To taste',
      },
      {
        idMeal: 'fallback-2',
        strMeal: 'Grilled Chicken Salad',
        strCategory: 'Chicken',
        strArea: 'American',
        strInstructions:
          'Season chicken breast with salt and pepper. Grill for 6-7 minutes per side. Let rest, then slice. Toss mixed greens with your favorite dressing. Top with sliced chicken, cherry tomatoes, and avocado.',
        strMealThumb:
          'https://www.themealdb.com/images/media/meals/1543774956.jpg',
        strTags: 'Healthy,Salad,Grilled',
        strIngredient1: 'Chicken Breast',
        strIngredient2: 'Mixed Greens',
        strIngredient3: 'Cherry Tomatoes',
        strIngredient4: 'Avocado',
        strIngredient5: 'Olive Oil',
        strMeasure1: '2 pieces',
        strMeasure2: '4 cups',
        strMeasure3: '1 cup',
        strMeasure4: '1 medium',
        strMeasure5: '2 tbsp',
      },
      {
        idMeal: 'fallback-3',
        strMeal: 'Vegetable Stir Fry',
        strCategory: 'Vegetarian',
        strArea: 'Chinese',
        strInstructions:
          'Heat oil in a wok or large pan. Add garlic and ginger, stir for 30 seconds. Add vegetables in order of cooking time (hardest first). Stir fry for 3-4 minutes. Add sauce and toss to combine.',
        strMealThumb:
          'https://www.themealdb.com/images/media/meals/1525873040.jpg',
        strTags: 'Vegetarian,Healthy,Quick',
        strIngredient1: 'Broccoli',
        strIngredient2: 'Carrots',
        strIngredient3: 'Bell Peppers',
        strIngredient4: 'Soy Sauce',
        strIngredient5: 'Garlic',
        strMeasure1: '2 cups',
        strMeasure2: '1 cup sliced',
        strMeasure3: '1 large',
        strMeasure4: '3 tbsp',
        strMeasure5: '3 cloves',
      },
      {
        idMeal: 'fallback-4',
        strMeal: 'Simple Beef Stir Fry',
        strCategory: 'Beef',
        strArea: 'Chinese',
        strInstructions:
          'Slice beef thinly. Heat oil in a pan, cook beef until browned. Add vegetables and stir fry for 3-4 minutes. Add sauce and cook for 1 more minute.',
        strMealThumb:
          'https://www.themealdb.com/images/media/meals/1525873040.jpg',
        strTags: 'Beef,Quick,Easy',
        strIngredient1: 'Beef',
        strIngredient2: 'Onion',
        strIngredient3: 'Bell Peppers',
        strIngredient4: 'Soy Sauce',
        strIngredient5: 'Garlic',
        strMeasure1: '300g',
        strMeasure2: '1 medium',
        strMeasure3: '1 large',
        strMeasure4: '3 tbsp',
        strMeasure5: '2 cloves',
      },
      {
        idMeal: 'fallback-5',
        strMeal: 'Creamy Tomato Pasta',
        strCategory: 'Pasta',
        strArea: 'Italian',
        strInstructions:
          'Cook pasta according to package directions. In a pan, sauté garlic and tomatoes. Add cream and simmer. Toss with pasta and serve.',
        strMealThumb:
          'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
        strTags: 'Pasta,Vegetarian,Creamy',
        strIngredient1: 'Pasta',
        strIngredient2: 'Tomatoes',
        strIngredient3: 'Cream',
        strIngredient4: 'Garlic',
        strIngredient5: 'Basil',
        strMeasure1: '400g',
        strMeasure2: '4 large',
        strMeasure3: '200ml',
        strMeasure4: '3 cloves',
        strMeasure5: 'Handful',
      },
      {
        idMeal: 'fallback-6',
        strMeal: 'Fish Tacos',
        strCategory: 'Seafood',
        strArea: 'Mexican',
        strInstructions:
          'Season fish with spices. Cook until flaky. Warm tortillas. Serve fish in tortillas with cabbage slaw and sauce.',
        strMealThumb:
          'https://www.themealdb.com/images/media/meals/1543774956.jpg',
        strTags: 'Fish,Mexican,Healthy',
        strIngredient1: 'White Fish',
        strIngredient2: 'Tortillas',
        strIngredient3: 'Cabbage',
        strIngredient4: 'Lime',
        strIngredient5: 'Cilantro',
        strMeasure1: '500g',
        strMeasure2: '8 pieces',
        strMeasure3: '2 cups',
        strMeasure4: '2 pieces',
        strMeasure5: 'Handful',
      },
    ];
  }

  private getFallbackCategories(): Category[] {
    return [
      {
        idCategory: '1',
        strCategory: 'Beef',
        strCategoryThumb: '',
        strCategoryDescription: 'Delicious beef recipes',
      },
      {
        idCategory: '2',
        strCategory: 'Chicken',
        strCategoryThumb: '',
        strCategoryDescription: 'Tasty chicken dishes',
      },
      {
        idCategory: '3',
        strCategory: 'Dessert',
        strCategoryThumb: '',
        strCategoryDescription: 'Sweet treats and desserts',
      },
      {
        idCategory: '4',
        strCategory: 'Pasta',
        strCategoryThumb: '',
        strCategoryDescription: 'Italian pasta recipes',
      },
      {
        idCategory: '5',
        strCategory: 'Vegetarian',
        strCategoryThumb: '',
        strCategoryDescription: 'Plant-based meals',
      },
    ];
  }

  private getFallbackAreas(): Area[] {
    return [
      { strArea: 'American' },
      { strArea: 'Italian' },
      { strArea: 'Chinese' },
      { strArea: 'Mexican' },
      { strArea: 'Indian' },
      { strArea: 'French' },
      { strArea: 'Japanese' },
      { strArea: 'Thai' },
    ];
  }

  private getFallbackIngredients(): Ingredient[] {
    return [
      { strIngredient: 'Chicken' },
      { strIngredient: 'Beef' },
      { strIngredient: 'Pork' },
      { strIngredient: 'Fish' },
      { strIngredient: 'Eggs' },
      { strIngredient: 'Milk' },
      { strIngredient: 'Cheese' },
      { strIngredient: 'Butter' },
      { strIngredient: 'Onion' },
      { strIngredient: 'Garlic' },
      { strIngredient: 'Tomato' },
      { strIngredient: 'Potato' },
      { strIngredient: 'Rice' },
      { strIngredient: 'Pasta' },
      { strIngredient: 'Bread' },
      { strIngredient: 'Olive Oil' },
      { strIngredient: 'Salt' },
      { strIngredient: 'Pepper' },
      { strIngredient: 'Sugar' },
      { strIngredient: 'Flour' },
    ];
  }

  // Get meal thumbnail URL
  getMealThumbnailUrl(
    meal: Meal,
    _size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    // TheMealDB returns full URLs like https://www.themealdb.com/images/media/meals/...
    // For now, just return the original URL as is
    // The API already provides good quality images
    return meal.strMealThumb;
  }

  // Get ingredient thumbnail URL
  getIngredientThumbnailUrl(
    ingredient: string,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    const formattedIngredient = ingredient.toLowerCase().replace(/\s+/g, '_');
    return `https://www.themealdb.com/images/ingredients/${formattedIngredient}-${size}.png`;
  }

  // Extract ingredients and measures from meal
  getMealIngredients(
    meal: Meal
  ): Array<{ ingredient: string; measure: string }> {
    const ingredients: Array<{ ingredient: string; measure: string }> = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}` as keyof Meal] as string;
      const measure = meal[`strMeasure${i}` as keyof Meal] as string;

      if (ingredient && ingredient.trim()) {
        ingredients.push({
          ingredient: ingredient.trim(),
          measure: measure?.trim() || '',
        });
      }
    }

    return ingredients;
  }

  // Debug method to test API connectivity
  async testApiConnection(): Promise<{
    success: boolean;
    error?: string;
    data?: ApiResponse<Meal>;
  }> {
    try {
      console.log('Testing API connection...');
      const data = await this.fetchData<ApiResponse<Meal>>('/random.php');
      console.log('API test successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('API test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const mealApiService = new MealApiService();
