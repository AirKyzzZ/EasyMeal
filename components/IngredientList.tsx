'use client';

import { Plus, X, Search, Apple } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { mealApiService } from '@/lib/api';
import { IngredientImage } from '@/lib/ingredientImages';
import { cn } from '@/lib/utils';
import { Ingredient } from '@/types/meal';

interface IngredientListProps {
  onIngredientsChange: (ingredients: string[]) => void;
  className?: string;
}

export function IngredientList({
  onIngredientsChange,
  className,
}: IngredientListProps): React.JSX.Element {
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadIngredients = async (): Promise<void> => {
      try {
        const ingredients = await mealApiService.getIngredients();
        setAvailableIngredients(ingredients);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadIngredients();
  }, []);

  useEffect(() => {
    onIngredientsChange(selectedIngredients);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIngredients]); // onIngredientsChange intentionally excluded to prevent infinite loops

  const filteredIngredients = availableIngredients.filter(
    ingredient =>
      ingredient.strIngredient
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      !selectedIngredients.includes(ingredient.strIngredient)
  );

  const addIngredient = (ingredient: string): void => {
    if (!selectedIngredients.includes(ingredient)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  const removeIngredient = (ingredient: string): void => {
    setSelectedIngredients(
      selectedIngredients.filter(ing => ing !== ingredient)
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="h-10 w-full animate-pulse rounded-lg bg-secondary" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 animate-pulse rounded-full bg-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          What ingredients do you have?
        </label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for ingredients..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(searchQuery.length > 0)}
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm transition-colors focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring text-foreground"
            />
          </div>

          {showDropdown && filteredIngredients.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
              <div className="max-h-60 overflow-y-auto">
                {filteredIngredients.slice(0, 20).map(ingredient => (
                  <button
                    key={ingredient.strIngredient}
                    onClick={() => addIngredient(ingredient.strIngredient)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-hover"
                  >
                    <IngredientImage
                      ingredient={ingredient.strIngredient}
                      size="small"
                    />
                    <span className="flex-1">{ingredient.strIngredient}</span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedIngredients.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Apple className="h-4 w-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">
              Your Ingredients ({selectedIngredients.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIngredients.map(ingredient => (
              <div
                key={ingredient}
                className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
              >
                <IngredientImage ingredient={ingredient} size="small" />
                <span>{ingredient}</span>
                <button
                  onClick={() => removeIngredient(ingredient)}
                  className="ml-1 rounded-full p-0.5 hover:bg-active"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedIngredients.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-[#e5e5e5] p-6 text-center dark:border-[#4a4a4a]">
          <Apple className="mx-auto h-8 w-8 text-[#6b6b6b] dark:text-[#a0a0a0]" />
          <p className="mt-2 text-sm text-[#6b6b6b] dark:text-[#a0a0a0]">
            Add ingredients you have to find matching recipes
          </p>
        </div>
      )}
    </div>
  );
}
