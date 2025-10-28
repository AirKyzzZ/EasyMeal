'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Clock, Users, ChefHat, ExternalLink, Youtube } from 'lucide-react';
import { Meal } from '@/types/meal';
import { mealApiService } from '@/lib/api';
import { cn } from '@/lib/utils';

// Apple emojis for different ingredients (same as MealCard)
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
  
  // Nuts & Seeds
  if (lowerIngredient.includes('nut') || lowerIngredient.includes('almond') || lowerIngredient.includes('walnut')) return '🥜';
  if (lowerIngredient.includes('peanut')) return '🥜';
  
  // Spices & Herbs
  if (lowerIngredient.includes('salt')) return '🧂';
  if (lowerIngredient.includes('pepper')) return '🌶️';
  if (lowerIngredient.includes('herb') || lowerIngredient.includes('basil') || lowerIngredient.includes('oregano')) return '🌿';
  if (lowerIngredient.includes('ginger')) return '🫚';
  if (lowerIngredient.includes('cinnamon')) return '🫘';
  
  // Sweeteners
  if (lowerIngredient.includes('sugar') || lowerIngredient.includes('sweet')) return '🍯';
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

interface MealDetailModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MealDetailModal({ meal, isOpen, onClose }: MealDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [fullMeal, setFullMeal] = useState<Meal | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch full meal details when modal opens
  useEffect(() => {
    if (meal && isOpen) {
      setIsLoadingDetails(true);
      mealApiService.getMealById(meal.idMeal)
        .then(fullMealData => {
          setFullMeal(fullMealData);
        })
        .catch(error => {
          console.error('Failed to fetch full meal details:', error);
          // Fallback to the original meal data
          setFullMeal(meal);
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    }
  }, [meal, isOpen]);

  // Use full meal data if available, otherwise fallback to original meal
  const displayMeal = fullMeal || meal;

  if (!meal || !isOpen || !displayMeal) return null;

  const ingredients = mealApiService.getMealIngredients(displayMeal);
  const tags = displayMeal.strTags ? displayMeal.strTags.split(',').map(tag => tag.trim()) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="relative h-64 overflow-hidden">
          <Image
            src={mealApiService.getMealThumbnailUrl(meal, 'large')}
            alt={displayMeal.strMeal}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Title and Meta */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="mb-2 text-2xl font-bold text-white">
              {displayMeal.strMeal}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/90">
              <div className="flex items-center gap-1">
                <ChefHat className="h-4 w-4" />
                <span>{displayMeal.strCategory}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{displayMeal.strArea}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Serves 4-6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Loading full recipe details...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'ingredients'
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              Ingredients
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'instructions'
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              Instructions
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'ingredients' && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ingredients
                </h3>
                <div className="grid gap-3">
                  {ingredients.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                    >
                      <img
                        src={mealApiService.getIngredientThumbnailUrl(item.ingredient, 'small')}
                        alt={item.ingredient}
                        className="h-8 w-8 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.ingredient}
                        </span>
                        {item.measure && (
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {item.measure}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'instructions' && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Instructions
                </h3>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {displayMeal.strInstructions}
                  </p>
                </div>
              </div>
            )}
          </div>
            </>
          )}

          {/* External Links */}
          <div className="mt-6 flex gap-3">
            {displayMeal.strYoutube && (
              <a
                href={displayMeal.strYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                <Youtube className="h-4 w-4" />
                Watch on YouTube
              </a>
            )}
            {displayMeal.strSource && (
              <a
                href={displayMeal.strSource}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <ExternalLink className="h-4 w-4" />
                View Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
