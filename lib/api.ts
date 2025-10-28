import { Meal, Category, Area, Ingredient, ApiResponse, SearchFilters } from '@/types/meal';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

class MealApiService {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 200; // 200ms between requests (5 requests per second max)

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
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

  private async fetchData<T>(endpoint: string, retries: number = 3): Promise<T> {
    return new Promise((resolve, reject) => {
      const makeRequest = async () => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${BASE_URL}${endpoint}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);
            
            if (!response.ok) {
              // Handle rate limiting specifically
              if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : 10000; // Default 10 seconds
                console.warn(`Rate limited. Waiting ${delay}ms before retry...`);
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
              if (error instanceof TypeError && error.message === 'Failed to fetch') {
                reject(new Error('Network error: Unable to connect to the meal database. Please check your internet connection.'));
                return;
              }
              
              if (error instanceof Error && error.name === 'AbortError') {
                reject(new Error('Request timeout: The server took too long to respond. Please try again.'));
                return;
              }
              
              reject(error);
              return;
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
        
        reject(new Error('All retry attempts failed'));
      };

      this.requestQueue.push(makeRequest);
      this.processQueue();
    });
  }

  // Search meals by name
  async searchMeals(query: string): Promise<Meal[]> {
    const data = await this.fetchData<ApiResponse<Meal>>(`/search.php?s=${encodeURIComponent(query)}`);
    return data.meals || [];
  }

  // Search meals by first letter
  async searchMealsByLetter(letter: string): Promise<Meal[]> {
    const data = await this.fetchData<ApiResponse<Meal>>(`/search.php?f=${letter}`);
    return data.meals || [];
  }

  // Get meal details by ID
  async getMealById(id: string): Promise<Meal | null> {
    const data = await this.fetchData<ApiResponse<Meal>>(`/lookup.php?i=${id}`);
    return data.meals?.[0] || null;
  }

  // Get random meal
  async getRandomMeal(): Promise<Meal | null> {
    try {
      const data = await this.fetchData<ApiResponse<Meal>>('/random.php');
      return data.meals?.[0] || null;
    } catch (error) {
      console.warn('API unavailable, using fallback data');
      const fallbackMeals = this.getFallbackMeals();
      return fallbackMeals[Math.floor(Math.random() * fallbackMeals.length)];
    }
  }

  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      const data = await this.fetchData<ApiResponse<Category>>('/categories.php');
      return data.categories || [];
    } catch (error) {
      console.warn('API unavailable, using fallback categories');
      return this.getFallbackCategories();
    }
  }

  // Get all areas
  async getAreas(): Promise<Area[]> {
    try {
      const data = await this.fetchData<ApiResponse<Area>>('/list.php?a=list');
      return data.meals || [];
    } catch (error) {
      console.warn('API unavailable, using fallback areas');
      return this.getFallbackAreas();
    }
  }

  // Get all ingredients
  async getIngredients(): Promise<Ingredient[]> {
    try {
      const data = await this.fetchData<ApiResponse<Ingredient>>('/list.php?i=list');
      return data.meals || [];
    } catch (error) {
      console.warn('API unavailable, using fallback ingredients');
      return this.getFallbackIngredients();
    }
  }

  // Filter meals by category
  async filterByCategory(category: string): Promise<Meal[]> {
    const data = await this.fetchData<ApiResponse<Meal>>(`/filter.php?c=${encodeURIComponent(category)}`);
    return data.meals || [];
  }

  // Filter meals by area
  async filterByArea(area: string): Promise<Meal[]> {
    const data = await this.fetchData<ApiResponse<Meal>>(`/filter.php?a=${encodeURIComponent(area)}`);
    return data.meals || [];
  }

  // Filter meals by ingredient
  async filterByIngredient(ingredient: string): Promise<Meal[]> {
    const data = await this.fetchData<ApiResponse<Meal>>(`/filter.php?i=${encodeURIComponent(ingredient)}`);
    return data.meals || [];
  }

  // Filter meals by multiple ingredients (find meals that contain any of the provided ingredients)
  async filterByMultipleIngredients(ingredients: string[]): Promise<Meal[]> {
    if (ingredients.length === 0) return [];
    
    // Get meals for each ingredient
    const mealPromises = ingredients.map(ingredient => this.filterByIngredient(ingredient));
    const mealArrays = await Promise.all(mealPromises);
    
    // Flatten and deduplicate meals
    const allMeals = mealArrays.flat();
    const uniqueMeals = allMeals.filter((meal, index, self) => 
      index === self.findIndex(m => m.idMeal === meal.idMeal)
    );
    
    return uniqueMeals;
  }

  // Find meals that can be made with available ingredients (meals where all required ingredients are available)
  async findMealsWithAvailableIngredients(availableIngredients: string[]): Promise<Meal[]> {
    if (availableIngredients.length === 0) return [];
    
    // Get all meals that contain any of the available ingredients
    const candidateMeals = await this.filterByMultipleIngredients(availableIngredients);
    
    // Filter to only include meals where ALL required ingredients are available
    const compatibleMeals = candidateMeals.filter(meal => {
      const requiredIngredients = this.getMealIngredients(meal).map(item => item.ingredient.toLowerCase());
      return requiredIngredients.every(ingredient => 
        availableIngredients.some(available => 
          available.toLowerCase().includes(ingredient) || 
          ingredient.includes(available.toLowerCase())
        )
      );
    });
    
    return compatibleMeals;
  }

  // Get ingredient details with thumbnail
  async getIngredientDetails(ingredient: string): Promise<{ name: string; thumbnail: string; description?: string }> {
    return {
      name: ingredient,
      thumbnail: this.getIngredientThumbnailUrl(ingredient),
      description: `Fresh ${ingredient.toLowerCase()}`
    };
  }

  // Fallback data for when API is unavailable
  private getFallbackMeals(): Meal[] {
    return [
      {
        idMeal: "fallback-1",
        strMeal: "Classic Spaghetti Carbonara",
        strCategory: "Pasta",
        strArea: "Italian",
        strInstructions: "Cook pasta according to package directions. In a bowl, whisk eggs and cheese. Cook bacon until crispy. Toss hot pasta with bacon, then with egg mixture. Serve immediately.",
        strMealThumb: "https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg",
        strTags: "Pasta,Italian,Comfort Food",
        strIngredient1: "Spaghetti",
        strIngredient2: "Eggs",
        strIngredient3: "Parmesan Cheese",
        strIngredient4: "Bacon",
        strIngredient5: "Black Pepper",
        strMeasure1: "400g",
        strMeasure2: "4 large",
        strMeasure3: "100g grated",
        strMeasure4: "200g diced",
        strMeasure5: "To taste"
      },
      {
        idMeal: "fallback-2",
        strMeal: "Grilled Chicken Salad",
        strCategory: "Chicken",
        strArea: "American",
        strInstructions: "Season chicken breast with salt and pepper. Grill for 6-7 minutes per side. Let rest, then slice. Toss mixed greens with your favorite dressing. Top with sliced chicken, cherry tomatoes, and avocado.",
        strMealThumb: "https://www.themealdb.com/images/media/meals/1543774956.jpg",
        strTags: "Healthy,Salad,Grilled",
        strIngredient1: "Chicken Breast",
        strIngredient2: "Mixed Greens",
        strIngredient3: "Cherry Tomatoes",
        strIngredient4: "Avocado",
        strIngredient5: "Olive Oil",
        strMeasure1: "2 pieces",
        strMeasure2: "4 cups",
        strMeasure3: "1 cup",
        strMeasure4: "1 medium",
        strMeasure5: "2 tbsp"
      },
      {
        idMeal: "fallback-3",
        strMeal: "Vegetable Stir Fry",
        strCategory: "Vegetarian",
        strArea: "Chinese",
        strInstructions: "Heat oil in a wok or large pan. Add garlic and ginger, stir for 30 seconds. Add vegetables in order of cooking time (hardest first). Stir fry for 3-4 minutes. Add sauce and toss to combine.",
        strMealThumb: "https://www.themealdb.com/images/media/meals/1525873040.jpg",
        strTags: "Vegetarian,Healthy,Quick",
        strIngredient1: "Broccoli",
        strIngredient2: "Carrots",
        strIngredient3: "Bell Peppers",
        strIngredient4: "Soy Sauce",
        strIngredient5: "Garlic",
        strMeasure1: "2 cups",
        strMeasure2: "1 cup sliced",
        strMeasure3: "1 large",
        strMeasure4: "3 tbsp",
        strMeasure5: "3 cloves"
      },
      {
        idMeal: "fallback-4",
        strMeal: "Simple Beef Stir Fry",
        strCategory: "Beef",
        strArea: "Chinese",
        strInstructions: "Slice beef thinly. Heat oil in a pan, cook beef until browned. Add vegetables and stir fry for 3-4 minutes. Add sauce and cook for 1 more minute.",
        strMealThumb: "https://www.themealdb.com/images/media/meals/1525873040.jpg",
        strTags: "Beef,Quick,Easy",
        strIngredient1: "Beef",
        strIngredient2: "Onion",
        strIngredient3: "Bell Peppers",
        strIngredient4: "Soy Sauce",
        strIngredient5: "Garlic",
        strMeasure1: "300g",
        strMeasure2: "1 medium",
        strMeasure3: "1 large",
        strMeasure4: "3 tbsp",
        strMeasure5: "2 cloves"
      },
      {
        idMeal: "fallback-5",
        strMeal: "Creamy Tomato Pasta",
        strCategory: "Pasta",
        strArea: "Italian",
        strInstructions: "Cook pasta according to package directions. In a pan, sauté garlic and tomatoes. Add cream and simmer. Toss with pasta and serve.",
        strMealThumb: "https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg",
        strTags: "Pasta,Vegetarian,Creamy",
        strIngredient1: "Pasta",
        strIngredient2: "Tomatoes",
        strIngredient3: "Cream",
        strIngredient4: "Garlic",
        strIngredient5: "Basil",
        strMeasure1: "400g",
        strMeasure2: "4 large",
        strMeasure3: "200ml",
        strMeasure4: "3 cloves",
        strMeasure5: "Handful"
      },
      {
        idMeal: "fallback-6",
        strMeal: "Fish Tacos",
        strCategory: "Seafood",
        strArea: "Mexican",
        strInstructions: "Season fish with spices. Cook until flaky. Warm tortillas. Serve fish in tortillas with cabbage slaw and sauce.",
        strMealThumb: "https://www.themealdb.com/images/media/meals/1543774956.jpg",
        strTags: "Fish,Mexican,Healthy",
        strIngredient1: "White Fish",
        strIngredient2: "Tortillas",
        strIngredient3: "Cabbage",
        strIngredient4: "Lime",
        strIngredient5: "Cilantro",
        strMeasure1: "500g",
        strMeasure2: "8 pieces",
        strMeasure3: "2 cups",
        strMeasure4: "2 pieces",
        strMeasure5: "Handful"
      }
    ];
  }

  private getFallbackCategories(): Category[] {
    return [
      { idCategory: "1", strCategory: "Beef", strCategoryThumb: "", strCategoryDescription: "Delicious beef recipes" },
      { idCategory: "2", strCategory: "Chicken", strCategoryThumb: "", strCategoryDescription: "Tasty chicken dishes" },
      { idCategory: "3", strCategory: "Dessert", strCategoryThumb: "", strCategoryDescription: "Sweet treats and desserts" },
      { idCategory: "4", strCategory: "Pasta", strCategoryThumb: "", strCategoryDescription: "Italian pasta recipes" },
      { idCategory: "5", strCategory: "Vegetarian", strCategoryThumb: "", strCategoryDescription: "Plant-based meals" }
    ];
  }

  private getFallbackAreas(): Area[] {
    return [
      { strArea: "American" },
      { strArea: "Italian" },
      { strArea: "Chinese" },
      { strArea: "Mexican" },
      { strArea: "Indian" },
      { strArea: "French" },
      { strArea: "Japanese" },
      { strArea: "Thai" }
    ];
  }

  private getFallbackIngredients(): Ingredient[] {
    return [
      { strIngredient: "Chicken" },
      { strIngredient: "Beef" },
      { strIngredient: "Pork" },
      { strIngredient: "Fish" },
      { strIngredient: "Eggs" },
      { strIngredient: "Milk" },
      { strIngredient: "Cheese" },
      { strIngredient: "Butter" },
      { strIngredient: "Onion" },
      { strIngredient: "Garlic" },
      { strIngredient: "Tomato" },
      { strIngredient: "Potato" },
      { strIngredient: "Rice" },
      { strIngredient: "Pasta" },
      { strIngredient: "Bread" },
      { strIngredient: "Olive Oil" },
      { strIngredient: "Salt" },
      { strIngredient: "Pepper" },
      { strIngredient: "Sugar" },
      { strIngredient: "Flour" }
    ];
  }

  // Get meal thumbnail URL
  getMealThumbnailUrl(meal: Meal, size: 'small' | 'medium' | 'large' = 'medium'): string {
    // TheMealDB returns full URLs like https://www.themealdb.com/images/media/meals/...
    // For now, just return the original URL as is
    // The API already provides good quality images
    return meal.strMealThumb;
  }

  // Get ingredient thumbnail URL
  getIngredientThumbnailUrl(ingredient: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const formattedIngredient = ingredient.toLowerCase().replace(/\s+/g, '_');
    return `https://www.themealdb.com/images/ingredients/${formattedIngredient}-${size}.png`;
  }

  // Extract ingredients and measures from meal
  getMealIngredients(meal: Meal): Array<{ ingredient: string; measure: string }> {
    const ingredients: Array<{ ingredient: string; measure: string }> = [];
    
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}` as keyof Meal] as string;
      const measure = meal[`strMeasure${i}` as keyof Meal] as string;
      
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          ingredient: ingredient.trim(),
          measure: measure?.trim() || ''
        });
      }
    }
    
    return ingredients;
  }

  // Debug method to test API connectivity
  async testApiConnection(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Testing API connection...');
      const data = await this.fetchData<ApiResponse<Meal>>('/random.php');
      console.log('API test successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('API test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const mealApiService = new MealApiService();
