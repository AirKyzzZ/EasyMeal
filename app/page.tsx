'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { MealCard } from '@/components/MealCard';
import { MealDetailModal } from '@/components/MealDetailModal';
import { Filters } from '@/components/Filters';
import { IngredientList } from '@/components/IngredientList';
import { mealApiService } from '@/lib/api';
import { Meal } from '@/types/meal';
import { ChefHat, Sparkles, Apple } from 'lucide-react';

// Extend Window interface to include our timeout property
declare global {
  interface Window {
    ingredientSearchTimeout?: NodeJS.Timeout;
  }
}

export default function Home() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', area: '', ingredient: '' });
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'search' | 'ingredients'>('search');
  const [isOnline, setIsOnline] = useState(true);
  
  // Track current search to prevent duplicates
  const currentSearchRef = useRef<string>('');

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Clean up ingredient search timeout
      if (window.ingredientSearchTimeout) {
        clearTimeout(window.ingredientSearchTimeout);
      }
    };
  }, []);

  // Utility function to deduplicate meals by idMeal
  const deduplicateMeals = (meals: Meal[]): Meal[] => {
    return meals.filter((meal, index, self) => 
      index === self.findIndex(m => m.idMeal === meal.idMeal)
    );
  };

  // Handle search mode changes
  useEffect(() => {
    if (searchMode === 'search') {
      // When switching to search mode, load random meals if no search query
      if (!searchQuery && !Object.values(filters).some(filter => filter)) {
        loadRandomMeals();
      }
    } else if (searchMode === 'ingredients') {
      // When switching to ingredient mode, clear meals if no ingredients selected
      if (availableIngredients.length === 0) {
        setMeals([]);
        setError(null);
      }
    }
  }, [searchMode, searchQuery, filters, availableIngredients]);

  const loadRandomMeals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Reduce concurrent requests to avoid rate limiting
      const randomMeals: (Meal | null)[] = [];
      const batchSize = 3; // Process 3 meals at a time
      
      for (let i = 0; i < 12; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, 12 - i) }, () => 
          mealApiService.getRandomMeal()
        );
        const batchResults = await Promise.all(batch);
        randomMeals.push(...batchResults);
        
        // Small delay between batches to be respectful to the API
        if (i + batchSize < 12) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const validMeals = randomMeals.filter(meal => meal !== null) as Meal[];
      setMeals(deduplicateMeals(validMeals));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load meals. Please try again.';
      setError(errorMessage);
      console.error('Error loading random meals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const testApiConnection = async () => {
    console.log('Testing API connection...');
    const result = await mealApiService.testApiConnection();
    if (result.success) {
      console.log('✅ API connection successful!');
      alert('✅ API connection successful! Check console for details.');
    } else {
      console.error('❌ API connection failed:', result.error);
      alert(`❌ API connection failed: ${result.error}`);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // Only load random meals if we're in search mode, not ingredient mode
      if (searchMode === 'search') {
        loadRandomMeals();
      } else {
        setMeals([]);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const results = await mealApiService.searchMeals(query);
      setMeals(deduplicateMeals(results));
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = async (newFilters: { category: string; area: string; ingredient: string }) => {
    setFilters(newFilters);
    
    // If no filters are active, show random meals only in search mode
    if (!newFilters.category && !newFilters.area && !newFilters.ingredient) {
      if (!searchQuery && searchMode === 'search') {
        loadRandomMeals();
      } else if (searchMode === 'ingredients') {
        setMeals([]);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let results: Meal[] = [];

      // Apply filters in order of specificity
      if (newFilters.category) {
        results = await mealApiService.filterByCategory(newFilters.category);
      } else if (newFilters.area) {
        results = await mealApiService.filterByArea(newFilters.area);
      } else if (newFilters.ingredient) {
        results = await mealApiService.filterByIngredient(newFilters.ingredient);
      }

      setMeals(deduplicateMeals(results));
    } catch (err) {
      setError('Failed to apply filters. Please try again.');
      console.error('Filter error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealSelect = (meal: Meal) => {
    setSelectedMeal(meal);
  };

  const handleCloseModal = () => {
    setSelectedMeal(null);
  };

  const handleIngredientsChange = useCallback(async (ingredients: string[]) => {
    setAvailableIngredients(ingredients);
    
    if (ingredients.length === 0) {
      // Clear meals when no ingredients are selected
      setMeals([]);
      setError(null);
      currentSearchRef.current = '';
      return;
    }

    // Create a unique search key to prevent duplicate searches
    const searchKey = ingredients.sort().join(',');
    
    // If this is the same search as the current one, don't search again
    if (currentSearchRef.current === searchKey) {
      return;
    }

    // Clear any existing timeout
    if (window.ingredientSearchTimeout) {
      clearTimeout(window.ingredientSearchTimeout);
    }

    // Debounce the search by 500ms to prevent flooding the API
    window.ingredientSearchTimeout = setTimeout(async () => {
      // Double-check that this is still the current search
      if (currentSearchRef.current === searchKey) {
        return;
      }
      
      currentSearchRef.current = searchKey;
      setIsLoading(true);
      setError(null);

      try {
        const results = await mealApiService.findMealsWithAvailableIngredients(ingredients);
        setMeals(deduplicateMeals(results));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to find meals with available ingredients.';
        
        // If it's a rate limiting error, show a more helpful message
        if (errorMessage.includes('Rate Limit') || errorMessage.includes('429')) {
          setError('The recipe database is currently busy. Please wait a moment and try again.');
        } else {
          setError(errorMessage);
        }
        
        console.error('Ingredient search error:', err);
        
        // Fallback to showing some random meals if ingredient search fails
        try {
          console.log('Falling back to random meals due to ingredient search failure');
          await loadRandomMeals();
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce delay
  }, [searchQuery, filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                EasyMeal
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Discover amazing recipes
                {!isOnline && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                    (Offline Mode)
                  </span>
                )}
              </p>
            </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={testApiConnection}
                className="flex items-center gap-2 rounded-lg bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30"
              >
                Test API
              </button>
              <button
                onClick={loadRandomMeals}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Sparkles className="h-4 w-4" />
                Random Meals
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
              <button
                onClick={() => setSearchMode('search')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  searchMode === 'search'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <ChefHat className="h-4 w-4" />
                Search Recipes
              </button>
              <button
                onClick={() => setSearchMode('ingredients')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  searchMode === 'ingredients'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Apple className="h-4 w-4" />
                Find by Ingredients
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          {searchMode === 'search' ? (
            <>
              <div className="mb-6 flex justify-center">
                <SearchBar
                  onSearch={handleSearch}
                  onMealSelect={handleMealSelect}
                  placeholder="Search for meals, ingredients, or cuisines..."
                  className="w-full max-w-2xl"
                />
              </div>
              
              <div className="flex justify-center">
                <Filters onFiltersChange={handleFiltersChange} />
              </div>
            </>
          ) : (
            <div className="mb-6">
              <div className="mx-auto max-w-2xl">
                <IngredientList onIngredientsChange={handleIngredientsChange} />
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="mb-6">
          {searchMode === 'ingredients' && availableIngredients.length > 0 && (
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recipes containing your ingredients
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {meals.length} recipe{meals.length !== 1 ? 's' : ''} found containing your {availableIngredients.length} ingredient{availableIngredients.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          
          {searchMode === 'search' && searchQuery && (
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search results for "{searchQuery}"
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {meals.length} meal{meals.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
          
          {searchMode === 'search' && Object.values(filters).some(filter => filter) && (
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtered Results
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {meals.length} meal{meals.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {searchMode === 'ingredients' ? 'Finding recipes with your ingredients...' : 'Loading meals...'}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex justify-center py-12">
            <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => {
                  if (searchQuery) {
                    handleSearch(searchQuery);
                  } else {
                    loadRandomMeals();
                  }
                }}
                className="mt-2 text-sm text-red-600 underline hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && meals.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No meals found
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        )}

        {/* Meals Grid */}
        {!isLoading && !error && meals.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {meals.map((meal, index) => (
              <MealCard
                key={`${meal.idMeal}-${index}`}
                meal={meal}
                onClick={handleMealSelect}
                availableIngredients={availableIngredients}
                showMatchPercentage={searchMode === 'ingredients'}
              />
            ))}
          </div>
        )}
      </main>

      {/* Meal Detail Modal */}
      <MealDetailModal
        meal={selectedMeal}
        isOpen={!!selectedMeal}
        onClose={handleCloseModal}
      />
    </div>
  );
}
