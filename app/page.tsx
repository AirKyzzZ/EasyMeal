'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { MealCard } from '@/components/MealCard';
import { MealDetailModal } from '@/components/MealDetailModal';
import { Filters } from '@/components/Filters';
import { IngredientList } from '@/components/IngredientList';
import { MealGridSkeleton } from '@/components/ui/Skeleton';
import { mealApiService } from '@/lib/api';
import { Meal } from '@/types/meal';
import { ChefHat, Sparkles, Apple } from 'lucide-react';
import Image from 'next/image';
import { usePagination } from '@/lib/hooks/usePagination';

// Extend Window interface to include our timeout property
declare global {
  interface Window {
    ingredientSearchTimeout?: NodeJS.Timeout;
  }
}

export default function Home() {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', area: '', ingredient: '' });
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'search' | 'ingredients'>('search');
  const [isOnline, setIsOnline] = useState(true);
  
  // Use pagination hook for meal management
  const pagination = usePagination({
    initialPageSize: 6,  // Load 6 items initially for fast first paint
    loadMoreSize: 6,     // Load 6 more items on scroll
    maxItems: 50         // Maximum items to prevent memory issues
  });
  
  // Track current search to prevent duplicates
  const currentSearchRef = useRef<string>('');
  const currentSearchTypeRef = useRef<'random' | 'search' | 'filter' | 'ingredients'>('random');

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
        loadRandomMeals(true);
      }
    } else if (searchMode === 'ingredients') {
      // When switching to ingredient mode, clear meals if no ingredients selected
      if (availableIngredients.length === 0) {
        pagination.reset();
      }
    }
  }, [searchMode, searchQuery, filters, availableIngredients]);

  // Load initial meals on component mount
  useEffect(() => {
    if (searchMode === 'search' && !searchQuery && !Object.values(filters).some(filter => filter)) {
      loadRandomMeals(true);
    }
  }, []);

  // Handle infinite scroll for random meals
  useEffect(() => {
    if (pagination.isLoading && pagination.hasMore && currentSearchTypeRef.current === 'random') {
      loadRandomMeals(false);
    }
  }, [pagination.isLoading, pagination.hasMore]);

  const loadRandomMeals = async (isInitialLoad: boolean = false) => {
    if (isInitialLoad) {
      pagination.setLoading(true);
      pagination.setError(null);
      currentSearchTypeRef.current = 'random';
    }

    try {
      const pageSize = isInitialLoad ? pagination.initialPageSize : pagination.loadMoreSize;
      const results = await mealApiService.getRandomMeals(pagination.page, pageSize);
      
      if (isInitialLoad) {
        pagination.setItems(results);
      } else {
        pagination.appendItems(results);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load meals. Please try again.';
      pagination.setError(errorMessage);
      console.error('Error loading random meals:', err);
    } finally {
      if (isInitialLoad) {
        pagination.setLoading(false);
      } else {
        pagination.markLoadComplete();
      }
    }
  };


  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // Only load random meals if we're in search mode, not ingredient mode
      if (searchMode === 'search') {
        loadRandomMeals(true);
      } else {
        pagination.reset();
      }
      return;
    }

    pagination.setLoading(true);
    pagination.setError(null);
    setSearchQuery(query);
    currentSearchTypeRef.current = 'search';

    try {
      const results = await mealApiService.searchMeals(query);
      pagination.setItems(results);
    } catch (err) {
      pagination.setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      pagination.setLoading(false);
    }
  };

  const handleFiltersChange = async (newFilters: { category: string; area: string; ingredient: string }) => {
    setFilters(newFilters);
    
    // If no filters are active, show random meals only in search mode
    if (!newFilters.category && !newFilters.area && !newFilters.ingredient) {
      if (!searchQuery && searchMode === 'search') {
        loadRandomMeals(true);
      } else if (searchMode === 'ingredients') {
        pagination.reset();
      }
      return;
    }

    pagination.setLoading(true);
    pagination.setError(null);
    currentSearchTypeRef.current = 'filter';

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

      pagination.setItems(results);
    } catch (err) {
      pagination.setError('Failed to apply filters. Please try again.');
      console.error('Filter error:', err);
    } finally {
      pagination.setLoading(false);
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
      pagination.reset();
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
      pagination.setLoading(true);
      pagination.setError(null);
      currentSearchTypeRef.current = 'ingredients';

      try {
        const results = await mealApiService.findMealsWithAvailableIngredients(ingredients);
        pagination.setItems(results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to find meals with available ingredients.';
        
        // If it's a rate limiting error, show a more helpful message
        if (errorMessage.includes('Rate Limit') || errorMessage.includes('429')) {
          pagination.setError('The recipe database is currently busy. Please wait a moment and try again.');
        } else {
          pagination.setError(errorMessage);
        }
        
        console.error('Ingredient search error:', err);
        
        // Fallback to showing some random meals if ingredient search fails
        try {
          console.log('Falling back to random meals due to ingredient search failure');
          await loadRandomMeals(true);
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      } finally {
        pagination.setLoading(false);
      }
    }, 500); // 500ms debounce delay
  }, [searchQuery, filters]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#262523]">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] bg-white dark:border-[#4a4a4a] dark:bg-[#262523]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                <Image
                  src="/logo.png"
                  alt="EasyMeal Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              </div>
            <div>
              <h1 className="text-2xl font-bold text-[#262523] dark:text-white">
                EasyMeal
              </h1>
              <p className="text-sm text-[#6b6b6b] dark:text-[#a0a0a0]">
                Discover amazing recipes
                {!isOnline && (
                  <span className="ml-2 text-[#262523] dark:text-white">
                    (Offline Mode)
                  </span>
                )}
              </p>
            </div>
            </div>
            
            <div className="flex gap-2">
              <a
                href="https://www.themealdb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-4 py-2 text-sm font-medium text-[#262523] transition-colors hover:bg-[#e5e5e5] dark:bg-[#3a3a3a] dark:text-white dark:hover:bg-[#4a4a4a]"
              >
                TheMealDB
              </a>
              <button
                onClick={() => loadRandomMeals(true)}
                className="flex items-center gap-2 rounded-lg bg-[#262523] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a] dark:bg-white dark:text-[#262523] dark:hover:bg-[#f5f5f5]"
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
            <div className="flex rounded-lg bg-[#f5f5f5] p-1 dark:bg-[#3a3a3a]">
              <button
                onClick={() => setSearchMode('search')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  searchMode === 'search'
                    ? 'bg-white text-[#262523] shadow-sm dark:bg-[#262523] dark:text-white'
                    : 'text-[#6b6b6b] hover:text-[#262523] dark:text-[#a0a0a0] dark:hover:text-white'
                }`}
              >
                <ChefHat className="h-4 w-4" />
                Search Recipes
              </button>
              <button
                onClick={() => setSearchMode('ingredients')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  searchMode === 'ingredients'
                    ? 'bg-white text-[#262523] shadow-sm dark:bg-[#262523] dark:text-white'
                    : 'text-[#6b6b6b] hover:text-[#262523] dark:text-[#a0a0a0] dark:hover:text-white'
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
              
              <div className="flex justify-center px-4">
                <Filters onFiltersChange={handleFiltersChange} className="w-full" />
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
              <h2 className="text-lg font-semibold text-[#262523] dark:text-white">
                Recipes containing your ingredients
              </h2>
              <p className="text-sm text-[#6b6b6b] dark:text-[#a0a0a0]">
                {pagination.items.length} recipe{pagination.items.length !== 1 ? 's' : ''} found containing your {availableIngredients.length} ingredient{availableIngredients.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          
          {searchMode === 'search' && searchQuery && (
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-[#262523] dark:text-white">
                Search results for "{searchQuery}"
              </h2>
              <p className="text-sm text-[#6b6b6b] dark:text-[#a0a0a0]">
                {pagination.items.length} meal{pagination.items.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
          
          {searchMode === 'search' && Object.values(filters).some(filter => filter) && (
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-[#262523] dark:text-white">
                Filtered Results
              </h2>
              <p className="text-sm text-[#6b6b6b] dark:text-[#a0a0a0]">
                {pagination.items.length} meal{pagination.items.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {pagination.isLoading && pagination.items.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#262523] dark:border-[#4a4a4a] dark:border-t-white"></div>
              <span className="text-[#6b6b6b] dark:text-[#a0a0a0]">
                {searchMode === 'ingredients' ? 'Finding recipes with your ingredients...' : 'Loading meals...'}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {pagination.error && (
          <div className="flex justify-center py-12">
            <div className="rounded-lg bg-[#f8f8f8] p-4 text-center dark:bg-[#404040]">
              <p className="text-[#262523] dark:text-white">{pagination.error}</p>
              <button
                onClick={() => {
                  if (searchQuery) {
                    handleSearch(searchQuery);
                  } else {
                    loadRandomMeals(true);
                  }
                }}
                className="mt-2 text-sm text-[#262523] underline hover:text-[#3a3a3a] dark:text-white dark:hover:text-[#a0a0a0]"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* No Results - Only show when a search has been performed */}
        {!pagination.isLoading && !pagination.error && pagination.items.length === 0 && (
          (searchMode === 'search' && (searchQuery || Object.values(filters).some(filter => filter))) ||
          (searchMode === 'ingredients' && availableIngredients.length > 0)
        ) && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <ChefHat className="mx-auto h-12 w-12 text-[#6b6b6b] dark:text-[#a0a0a0]" />
              <h3 className="mt-4 text-lg font-semibold text-[#262523] dark:text-white">
                No meals found
              </h3>
              <p className="mt-2 text-[#6b6b6b] dark:text-[#a0a0a0]">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        )}

        {/* Meals Grid - Always show when we have items */}
        {pagination.items.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pagination.items.map((meal, index) => (
                <MealCard
                  key={`${meal.idMeal}-${index}`}
                  meal={meal}
                  onClick={handleMealSelect}
                  availableIngredients={availableIngredients}
                  showMatchPercentage={searchMode === 'ingredients'}
                  isFirstImage={index === 0}
                />
              ))}
            </div>
            
            {/* Infinite scroll trigger */}
            {pagination.hasMore && currentSearchTypeRef.current === 'random' && (
              <div ref={pagination.lastItemElementRef} className="h-1" />
            )}
          </>
        )}
        
        {/* Loading more indicator - show below existing items */}
        {pagination.isLoading && pagination.items.length > 0 && (
          <div className="mt-8 flex justify-center" style={{ minHeight: '200px' }}>
            <MealGridSkeleton count={3} />
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
