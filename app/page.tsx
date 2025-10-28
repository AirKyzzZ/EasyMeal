'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { MealCard } from '@/components/MealCard';
import { MealDetailModal } from '@/components/MealDetailModal';
import { Filters } from '@/components/Filters';
import { mealApiService } from '@/lib/api';
import { Meal } from '@/types/meal';
import { ChefHat, Sparkles } from 'lucide-react';

export default function Home() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', area: '', ingredient: '' });

  // Load random meals on initial load
  useEffect(() => {
    loadRandomMeals();
  }, []);

  const loadRandomMeals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const randomMeals = await Promise.all(
        Array.from({ length: 12 }, () => mealApiService.getRandomMeal())
      );
      setMeals(randomMeals.filter(meal => meal !== null) as Meal[]);
    } catch (err) {
      setError('Failed to load meals. Please try again.');
      console.error('Error loading random meals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadRandomMeals();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const results = await mealApiService.searchMeals(query);
      setMeals(results);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = async (newFilters: { category: string; area: string; ingredient: string }) => {
    setFilters(newFilters);
    
    // If no filters are active, show random meals
    if (!newFilters.category && !newFilters.area && !newFilters.ingredient) {
      if (!searchQuery) {
        loadRandomMeals();
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

      setMeals(results);
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
                </p>
              </div>
            </div>
            
            <button
              onClick={loadRandomMeals}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <Sparkles className="h-4 w-4" />
              Random Meals
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Section */}
        <div className="mb-8">
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
        </div>

        {/* Results Section */}
        <div className="mb-6">
          {searchQuery && (
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search results for "{searchQuery}"
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {meals.length} meal{meals.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
          
          {Object.values(filters).some(filter => filter) && (
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
              <span className="text-gray-600 dark:text-gray-400">Loading meals...</span>
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
            {meals.map((meal) => (
              <MealCard
                key={meal.idMeal}
                meal={meal}
                onClick={handleMealSelect}
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
