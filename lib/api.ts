import { Meal, Category, Area, Ingredient, ApiResponse, SearchFilters } from '@/types/meal';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

class MealApiService {
  private async fetchData<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
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
    const data = await this.fetchData<ApiResponse<Meal>>('/random.php');
    return data.meals?.[0] || null;
  }

  // Get all categories
  async getCategories(): Promise<Category[]> {
    const data = await this.fetchData<ApiResponse<Category>>('/categories.php');
    return data.categories || [];
  }

  // Get all areas
  async getAreas(): Promise<Area[]> {
    const data = await this.fetchData<ApiResponse<Area>>('/list.php?a=list');
    return data.meals || [];
  }

  // Get all ingredients
  async getIngredients(): Promise<Ingredient[]> {
    const data = await this.fetchData<ApiResponse<Ingredient>>('/list.php?i=list');
    return data.meals || [];
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
}

export const mealApiService = new MealApiService();
