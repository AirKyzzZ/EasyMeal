'use client';

import { ChefHat, Sparkles, Apple } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import dynamic from 'next/dynamic';

import { Filters } from '@/components/Filters';
import { IngredientList } from '@/components/IngredientList';
import { MealCard } from '@/components/MealCard';
import { SearchBar } from '@/components/SearchBar';

// Dynamically import modal since it's only shown on user interaction
const MealDetailModal = dynamic(() => import('@/components/MealDetailModal').then(mod => ({ default: mod.MealDetailModal })), {
  ssr: false, // Modal doesn't need SSR
});
import { MealGridSkeleton } from '@/components/ui/Skeleton';
import { mealApiService } from '@/lib/api';
import { usePagination } from '@/lib/hooks/usePagination';
import { Meal } from '@/types/meal';

// Extend Window interface to include our timeout property
declare global {
  interface Window {
    ingredientSearchTimeout?: NodeJS.Timeout;
  }
}

export default function Home(): React.JSX.Element {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    area: '',
    ingredient: '',
  });
  const [availableIngredients, setAvailableIngredients] = useState<string[]>(
    []
  );
  const [searchMode, setSearchMode] = useState<'search' | 'ingredients'>(
    'search'
  );
  const [isOnline, setIsOnline] = useState(true);

  // Use pagination hook for meal management
  const pagination = usePagination({
    initialPageSize: 3, // Load 3 items initially to reduce DOM complexity and page weight
    loadMoreSize: 6, // Load 6 more items on scroll
    maxItems: 30, // Reduced from 50 to limit DOM elements (target: < 600)
  });

  // Extract stable pagination functions and values to avoid recreating loadRandomMeals on every state change
  const {
    setLoading,
    setError,
    setItems,
    appendItems,
    markLoadComplete,
    reset,
    initialPageSize,
    loadMoreSize,
  } = pagination;

  // Use refs to access current pagination values without causing dependency issues
  const paginationPageRef = useRef(pagination.page);
  useEffect(() => {
    paginationPageRef.current = pagination.page;
  }, [pagination.page]);

  // Track current search to prevent duplicates
  const currentSearchRef = useRef<string>('');
  const currentSearchTypeRef = useRef<
    'random' | 'search' | 'filter' | 'ingredients'
  >('random');

  // Define loadRandomMeals before it's used in useEffect hooks
  // Only depend on stable functions, not the entire pagination object
  const loadRandomMeals = useCallback(
    async (isInitialLoad: boolean = false): Promise<void> => {
      if (isInitialLoad) {
        setLoading(true);
        setError(null);
        currentSearchTypeRef.current = 'random';
      }

      try {
        const pageSize = isInitialLoad ? initialPageSize : loadMoreSize;
        const results = await mealApiService.getRandomMeals(
          paginationPageRef.current,
          pageSize
        );

        if (isInitialLoad) {
          setItems(results);
        } else {
          appendItems(results);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to load meals. Please try again.';
        setError(errorMessage);
        // eslint-disable-next-line no-console
        console.error('Error loading random meals:', err);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        } else {
          markLoadComplete();
        }
      }
    },
    [
      setLoading,
      setError,
      setItems,
      appendItems,
      markLoadComplete,
      initialPageSize,
      loadMoreSize,
    ]
  );

  // Monitor network status
  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return (): void => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      // Clean up ingredient search timeout
      if (window.ingredientSearchTimeout) {
        clearTimeout(window.ingredientSearchTimeout);
      }
    };
  }, []);

  // Handle search mode changes
  useEffect(() => {
    if (searchMode === 'search') {
      // When switching to search mode, load random meals if no search query
      if (!searchQuery && !Object.values(filters).some(filter => filter)) {
        void loadRandomMeals(true);
      }
    } else if (searchMode === 'ingredients') {
      // When switching to ingredient mode, clear meals if no ingredients selected
      if (availableIngredients.length === 0) {
        reset();
      }
    }
  }, [
    searchMode,
    searchQuery,
    filters,
    availableIngredients,
    loadRandomMeals,
    reset,
  ]);

  // Load initial meals on component mount
  useEffect(() => {
    if (
      searchMode === 'search' &&
      !searchQuery &&
      !Object.values(filters).some(filter => filter)
    ) {
      void loadRandomMeals(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle infinite scroll for random meals
  useEffect(() => {
    if (
      pagination.isLoading &&
      pagination.hasMore &&
      currentSearchTypeRef.current === 'random'
    ) {
      void loadRandomMeals(false);
    }
  }, [pagination.isLoading, pagination.hasMore, loadRandomMeals]);

  const loadRandomMeal = async (): Promise<void> => {
    try {
      const randomMeal = await mealApiService.getRandomMeal();
      if (randomMeal) {
        setSelectedMeal(randomMeal);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading random meal:', err);
    }
  };

  const handleSearch = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        // Only load random meals if we're in search mode, not ingredient mode
        if (searchMode === 'search') {
          void loadRandomMeals(true);
        } else {
          reset();
        }
        return;
      }

      setLoading(true);
      setError(null);
      setSearchQuery(query);
      currentSearchTypeRef.current = 'search';

      try {
        // This is now cached, so repeated searches are instant
        const results = await mealApiService.searchMeals(query);
        setItems(results);
      } catch (err) {
        setError('Search failed. Please try again.');
        // eslint-disable-next-line no-console
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [searchMode, setLoading, setError, setItems, loadRandomMeals, reset]
  );

  const handleFiltersChange = useCallback(
    async (newFilters: {
      category: string;
      area: string;
      ingredient: string;
    }): Promise<void> => {
      setFilters(newFilters);

      // If no filters are active, show random meals only in search mode
      if (!newFilters.category && !newFilters.area && !newFilters.ingredient) {
        if (!searchQuery && searchMode === 'search') {
          void loadRandomMeals(true);
        } else if (searchMode === 'ingredients') {
          reset();
        }
        return;
      }

      setLoading(true);
      setError(null);
      currentSearchTypeRef.current = 'filter';

      try {
        let results: Meal[] = [];

        // Apply filters in order of specificity (these are now cached)
        if (newFilters.category) {
          results = await mealApiService.filterByCategory(newFilters.category);
        } else if (newFilters.area) {
          results = await mealApiService.filterByArea(newFilters.area);
        } else if (newFilters.ingredient) {
          results = await mealApiService.filterByIngredient(
            newFilters.ingredient
          );
        }

        setItems(results);
      } catch (err) {
        setError('Failed to apply filters. Please try again.');
        // eslint-disable-next-line no-console
        console.error('Filter error:', err);
      } finally {
        setLoading(false);
      }
    },
    [
      searchQuery,
      searchMode,
      setLoading,
      setError,
      setItems,
      loadRandomMeals,
      reset,
    ]
  );

  const handleMealSelect = useCallback((meal: Meal) => {
    setSelectedMeal(meal);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMeal(null);
  }, []);

  const handleIngredientsChange = useCallback(
    (ingredients: string[]): void => {
      setAvailableIngredients(ingredients);

      if (ingredients.length === 0) {
        // Clear meals when no ingredients are selected
        reset();
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
      window.ingredientSearchTimeout = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        (async (): Promise<void> => {
          // Double-check that this is still the current search
          if (currentSearchRef.current === searchKey) {
            return;
          }

          currentSearchRef.current = searchKey;
          setLoading(true);
          setError(null);
          currentSearchTypeRef.current = 'ingredients';

          try {
            const results =
              await mealApiService.findMealsWithAvailableIngredients(
                ingredients
              );
            setItems(results);
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : 'Failed to find meals with available ingredients.';

            // If it's a rate limiting error, show a more helpful message
            if (
              errorMessage.includes('Rate Limit') ||
              errorMessage.includes('429')
            ) {
              setError(
                'The recipe database is currently busy. Please wait a moment and try again.'
              );
            } else {
              setError(errorMessage);
            }

            // eslint-disable-next-line no-console
            console.error('Ingredient search error:', err);

            // Fallback to showing some random meals if ingredient search fails
            try {
              // eslint-disable-next-line no-console
              console.log(
                'Falling back to random meals due to ingredient search failure'
              );
              await loadRandomMeals(true);
            } catch (fallbackErr) {
              // eslint-disable-next-line no-console
              console.error('Fallback also failed:', fallbackErr);
            }
          } finally {
            setLoading(false);
          }
        })();
      }, 500); // 500ms debounce delay
    },
    [setLoading, setError, setItems, loadRandomMeals, reset]
  );

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
                  quality={75}
                  placeholder="blur"
                  fetchPriority="high"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  EasyMeal
                  <span className="hidden sm:inline"> - Discover Amazing Recipes</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Search thousands of free recipes from around the world
                  {!isOnline && (
                    <span className="ml-2 text-foreground">(Offline Mode)</span>
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
                onClick={() => {
                  void loadRandomMeal();
                }}
                className="flex items-center gap-1 sm:gap-2 rounded-lg bg-primary px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
        <section className="mb-12" aria-label="Recipe search">
          {searchMode === 'search' ? (
            <>
              <div className="mb-3 sm:mb-8 flex justify-center px-4">
                <div className="w-full max-w-5xl mx-auto">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                      Find Your Perfect Recipe
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                      Search from thousands of delicious recipes
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <SearchBar
                      onSearch={(query: string) => {
                        void handleSearch(query);
                      }}
                      onMealSelect={handleMealSelect}
                      placeholder="Search for meals, ingredients, or cuisines..."
                      className="w-full max-w-4xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center px-4">
                <Filters
                  onFiltersChange={filters => {
                    void handleFiltersChange(filters);
                  }}
                  className="w-full max-w-4xl"
                />
              </div>
            </>
          ) : (
            <div className="mb-8 px-4">
              <div className="mx-auto max-w-5xl">
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    Find Recipes by Ingredients
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                    Tell us what ingredients you have available and we&apos;ll
                    find the perfect recipes you can make right now. No more
                    wasted groceries!
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <IngredientList
                      onIngredientsChange={ingredients => {
                        void handleIngredientsChange(ingredients);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Results Section */}
        <section className="mb-6" aria-label="Search results">
          {searchMode === 'ingredients' && availableIngredients.length > 0 && (
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Recipes containing your ingredients
              </h3>
              <p className="text-sm text-muted-foreground">
                {pagination.items.length} recipe
                {pagination.items.length !== 1 ? 's' : ''} found containing your{' '}
                {availableIngredients.length} ingredient
                {availableIngredients.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {searchMode === 'search' && searchQuery && (
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Search results for &quot;{searchQuery}&quot;
              </h3>
              <p className="text-sm text-muted-foreground">
                {pagination.items.length} meal
                {pagination.items.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}

          {searchMode === 'search' &&
            Object.values(filters).some(filter => filter) && (
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-foreground">
                  Filtered Results
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pagination.items.length} meal
                  {pagination.items.length !== 1 ? 's' : ''} found
                </p>
              </div>
            )}
        </section>

        {/* Loading State */}
        {pagination.isLoading && pagination.items.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-spinner-border border-t-spinner-border-active"></div>
              <span className="text-muted-foreground">
                {searchMode === 'ingredients'
                  ? 'Finding recipes with your ingredients...'
                  : 'Loading meals...'}
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
                    void handleSearch(searchQuery);
                  } else {
                    void loadRandomMeals(true);
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
        {!pagination.isLoading &&
          !pagination.error &&
          pagination.items.length === 0 &&
          ((searchMode === 'search' &&
            (searchQuery || Object.values(filters).some(filter => filter))) ||
            (searchMode === 'ingredients' &&
              availableIngredients.length > 0)) && (
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
            <section
              className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3"
              aria-label="Recipe cards"
            >
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
            </section>

            {/* Infinite scroll trigger */}
            {pagination.hasMore &&
              currentSearchTypeRef.current === 'random' && (
                <div ref={pagination.lastItemElementRef} className="h-1" />
              )}
          </>
        )}

        {/* Loading more indicator - show below existing items */}
        {pagination.isLoading && pagination.items.length > 0 && (
          <div
            className="mt-8 flex justify-center"
            style={{ minHeight: '200px' }}
          >
            <MealGridSkeleton count={2} />
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
