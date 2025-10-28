'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Search, Apple, CheckCircle, Circle } from 'lucide-react';
import { mealApiService } from '@/lib/api';
import { Ingredient } from '@/types/meal';
import { cn } from '@/lib/utils';

interface IngredientListProps {
  onIngredientsChange: (ingredients: string[]) => void;
  className?: string;
}

// Apple emojis for different ingredient categories
const getIngredientEmoji = (ingredient: string): string => {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Fruits
  if (lowerIngredient.includes('apple') || lowerIngredient.includes('fruit')) return '🍎';
  if (lowerIngredient.includes('banana')) return '🍌';
  if (lowerIngredient.includes('orange') || lowerIngredient.includes('citrus')) return '🍊';
  if (lowerIngredient.includes('lemon') || lowerIngredient.includes('lime')) return '🍋';
  if (lowerIngredient.includes('grape')) return '🍇';
  if (lowerIngredient.includes('strawberry') || lowerIngredient.includes('berry')) return '🍓';
  if (lowerIngredient.includes('cherry')) return '🍒';
  if (lowerIngredient.includes('peach')) return '🍑';
  if (lowerIngredient.includes('pineapple')) return '🍍';
  if (lowerIngredient.includes('watermelon')) return '🍉';
  if (lowerIngredient.includes('melon')) return '🍈';
  
  // Vegetables
  if (lowerIngredient.includes('carrot')) return '🥕';
  if (lowerIngredient.includes('broccoli')) return '🥦';
  if (lowerIngredient.includes('corn')) return '🌽';
  if (lowerIngredient.includes('mushroom')) return '🍄';
  if (lowerIngredient.includes('tomato')) return '🍅';
  if (lowerIngredient.includes('potato') || lowerIngredient.includes('sweet potato')) return '🥔';
  if (lowerIngredient.includes('onion')) return '🧅';
  if (lowerIngredient.includes('garlic')) return '🧄';
  if (lowerIngredient.includes('pepper') || lowerIngredient.includes('bell pepper')) return '🫑';
  if (lowerIngredient.includes('cucumber')) return '🥒';
  if (lowerIngredient.includes('lettuce') || lowerIngredient.includes('salad')) return '🥬';
  if (lowerIngredient.includes('spinach')) return '🥬';
  if (lowerIngredient.includes('cabbage')) return '🥬';
  
  // Proteins
  if (lowerIngredient.includes('chicken') || lowerIngredient.includes('poultry')) return '🐔';
  if (lowerIngredient.includes('beef') || lowerIngredient.includes('steak')) return '🥩';
  if (lowerIngredient.includes('pork')) return '🐷';
  if (lowerIngredient.includes('fish') || lowerIngredient.includes('salmon') || lowerIngredient.includes('tuna')) return '🐟';
  if (lowerIngredient.includes('shrimp') || lowerIngredient.includes('prawn')) return '🦐';
  if (lowerIngredient.includes('crab')) return '🦀';
  if (lowerIngredient.includes('lobster')) return '🦞';
  if (lowerIngredient.includes('egg')) return '🥚';
  if (lowerIngredient.includes('bacon')) return '🥓';
  if (lowerIngredient.includes('ham')) return '🍖';
  if (lowerIngredient.includes('sausage')) return '🌭';
  
  // Dairy
  if (lowerIngredient.includes('milk')) return '🥛';
  if (lowerIngredient.includes('cheese')) return '🧀';
  if (lowerIngredient.includes('butter')) return '🧈';
  if (lowerIngredient.includes('cream')) return '🥛';
  if (lowerIngredient.includes('yogurt')) return '🥛';
  
  // Grains & Bread
  if (lowerIngredient.includes('bread') || lowerIngredient.includes('toast')) return '🍞';
  if (lowerIngredient.includes('rice')) return '🍚';
  if (lowerIngredient.includes('pasta') || lowerIngredient.includes('noodle')) return '🍝';
  if (lowerIngredient.includes('pizza')) return '🍕';
  if (lowerIngredient.includes('sandwich')) return '🥪';
  if (lowerIngredient.includes('bagel')) return '🥯';
  if (lowerIngredient.includes('croissant')) return '🥐';
  
  // Nuts & Seeds
  if (lowerIngredient.includes('nut') || lowerIngredient.includes('almond') || lowerIngredient.includes('walnut')) return '🥜';
  if (lowerIngredient.includes('seed') || lowerIngredient.includes('sesame')) return '🌰';
  
  // Herbs & Spices
  if (lowerIngredient.includes('herb') || lowerIngredient.includes('basil') || lowerIngredient.includes('oregano')) return '🌿';
  if (lowerIngredient.includes('spice') || lowerIngredient.includes('pepper') || lowerIngredient.includes('salt')) return '🧂';
  if (lowerIngredient.includes('ginger')) return '🫚';
  if (lowerIngredient.includes('cinnamon')) return '🍯';
  
  // Oils & Condiments
  if (lowerIngredient.includes('oil') || lowerIngredient.includes('olive')) return '🫒';
  if (lowerIngredient.includes('vinegar')) return '🍶';
  if (lowerIngredient.includes('soy') || lowerIngredient.includes('sauce')) return '🍶';
  if (lowerIngredient.includes('ketchup')) return '🍅';
  if (lowerIngredient.includes('mustard')) return '🟡';
  if (lowerIngredient.includes('mayonnaise') || lowerIngredient.includes('mayo')) return '🥄';
  
  // Sweet & Desserts
  if (lowerIngredient.includes('sugar') || lowerIngredient.includes('sweet')) return '🍯';
  if (lowerIngredient.includes('chocolate') || lowerIngredient.includes('cocoa')) return '🍫';
  if (lowerIngredient.includes('vanilla')) return '🍦';
  if (lowerIngredient.includes('honey')) return '🍯';
  if (lowerIngredient.includes('maple')) return '🍁';
  
  // Beverages
  if (lowerIngredient.includes('coffee')) return '☕';
  if (lowerIngredient.includes('tea')) return '🍵';
  if (lowerIngredient.includes('juice')) return '🧃';
  if (lowerIngredient.includes('wine')) return '🍷';
  if (lowerIngredient.includes('beer')) return '🍺';
  
  // Default apple emoji for unmatched ingredients
  return '🍎';
};

export function IngredientList({ onIngredientsChange, className }: IngredientListProps) {
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const ingredients = await mealApiService.getIngredients();
        setAvailableIngredients(ingredients);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadIngredients();
  }, []);

  useEffect(() => {
    onIngredientsChange(selectedIngredients);
  }, [selectedIngredients, onIngredientsChange]);

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.strIngredient.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedIngredients.includes(ingredient.strIngredient)
  );

  const addIngredient = (ingredient: string) => {
    if (!selectedIngredients.includes(ingredient)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients(selectedIngredients.filter(ing => ing !== ingredient));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          🍎 What ingredients do you have?
        </label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for ingredients..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(searchQuery.length > 0)}
              className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {showDropdown && filteredIngredients.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="max-h-60 overflow-y-auto">
                {filteredIngredients.slice(0, 20).map((ingredient) => (
                  <button
                    key={ingredient.strIngredient}
                    onClick={() => addIngredient(ingredient.strIngredient)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <span className="text-lg">{getIngredientEmoji(ingredient.strIngredient)}</span>
                    <span className="flex-1">{ingredient.strIngredient}</span>
                    <Plus className="h-4 w-4 text-gray-400" />
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
            <Apple className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Ingredients ({selectedIngredients.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIngredients.map((ingredient) => (
              <div
                key={ingredient}
                className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                <span className="text-base">{getIngredientEmoji(ingredient)}</span>
                <span>{ingredient}</span>
                <button
                  onClick={() => removeIngredient(ingredient)}
                  className="ml-1 rounded-full p-0.5 hover:bg-green-200 dark:hover:bg-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedIngredients.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
          <Apple className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Add ingredients you have to find matching recipes
          </p>
        </div>
      )}
    </div>
  );
}
