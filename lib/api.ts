import { Meal, Category, Area, Ingredient, ApiResponse, SearchFilters } from '@/types/meal';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

class MealApiService {
  private async fetchData<T>(endpoint: string, retries: number = 3): Promise<T> {
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`API Error (attempt ${attempt}/${retries}):`, error);
        
        // If this is the last attempt, throw the error
        if (attempt === retries) {
          // Provide more specific error messages
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Network error: Unable to connect to the meal database. Please check your internet connection.');
          }
          
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout: The server took too long to respond. Please try again.');
          }
          
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('All retry attempts failed');
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
