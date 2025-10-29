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

  const loadRandomMeal = async () => {
    try {
      const randomMeal = await mealApiService.getRandomMeal();
      if (randomMeal) {
        setSelectedMeal(randomMeal);
      }
    } catch (err) {
      console.error('Error loading random meal:', err);
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg flex-shrink-0">
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
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                EasyMeal
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Discover amazing recipes
                {!isOnline && (
                  <span className="ml-2 text-foreground">
                    (Offline Mode)
                  </span>
                )}
              </p>
            </div>
            </div>
            
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <a
                href="https://www.themealdb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-secondary-foreground transition-colors hover:bg-active"
              >
                TheMealDB
              </a>
              <button
                onClick={() => loadRandomMeal()}
                className="flex items-center gap-1 sm:gap-2 rounded-lg bg-primary px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-colors hover:bg-hover"
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Random Meal</span>
                <span className="sm:hidden">Random</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex rounded-lg bg-secondary p-1 w-full max-w-md">
              <button
                onClick={() => setSearchMode('search')}
                className={`flex items-center justify-center gap-1 sm:gap-2 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex-1 ${
                  searchMode === 'search'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ChefHat className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Search Recipes</span>
                <span className="sm:hidden">Search</span>
              </button>
              <button
                onClick={() => setSearchMode('ingredients')}
                className={`flex items-center justify-center gap-1 sm:gap-2 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex-1 ${
                  searchMode === 'ingredients'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Apple className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Find by Ingredients</span>
                <span className="sm:hidden">Ingredients</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          {searchMode === 'search' ? (
            <>
              <div className="mb-6 flex justify-center px-2">
                <SearchBar
                  onSearch={handleSearch}
                  onMealSelect={handleMealSelect}
                  placeholder="Search for meals, ingredients, or cuisines..."
                  className="w-full max-w-2xl"
                />
              </div>
              
              <div className="flex justify-center px-2">
                <Filters onFiltersChange={handleFiltersChange} className="w-full max-w-4xl" />
              </div>
            </>
          ) : (
            <div className="mb-6 px-2">
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
              <h2 className="text-lg font-semibold text-foreground">
                Recipes containing your ingredients
              </h2>
              <p className="text-sm text-muted-foreground">
                {pagination.items.length} recipe{pagination.items.length !== 1 ? 's' : ''} found containing your {availableIngredients.length} ingredient{availableIngredients.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          
          {searchMode === 'search' && searchQuery && (
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Search results for "{searchQuery}"
              </h2>
              <p className="text-sm text-muted-foreground">
                {pagination.items.length} meal{pagination.items.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
          
          {searchMode === 'search' && Object.values(filters).some(filter => filter) && (
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Filtered Results
              </h2>
              <p className="text-sm text-muted-foreground">
                {pagination.items.length} meal{pagination.items.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {pagination.isLoading && pagination.items.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-spinner-border border-t-spinner-border-active"></div>
              <span className="text-muted-foreground">
                {searchMode === 'ingredients' ? 'Finding recipes with your ingredients...' : 'Loading meals...'}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {pagination.error && (
          <div className="flex justify-center py-12">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-foreground">{pagination.error}</p>
              <button
                onClick={() => {
                  if (searchQuery) {
                    handleSearch(searchQuery);
                  } else {
                    loadRandomMeals(true);
                  }
                }}
                className="mt-2 text-sm text-foreground underline hover:text-hover"
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
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                No meals found
              </h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        )}

        {/* Meals Grid - Always show when we have items */}
        {pagination.items.length > 0 && (
          <>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
