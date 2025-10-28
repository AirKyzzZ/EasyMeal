'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Clock, Users, ChefHat, ExternalLink, Youtube } from 'lucide-react';
import { Meal } from '@/types/meal';
import { mealApiService } from '@/lib/api';
import { IngredientImage } from '@/lib/ingredientImages';
import { cn } from '@/lib/utils';

// Removed emoji function - now using IngredientImage component

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
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-[#262523]">
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
                  className="rounded-full bg-[#f5f5f5] px-3 py-1 text-sm text-[#262523] dark:bg-[#3a3a3a] dark:text-white"
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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#262523] dark:border-[#4a4a4a] dark:border-t-white"></div>
                <span className="text-[#6b6b6b] dark:text-[#a0a0a0]">Loading full recipe details...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="mb-6 flex gap-1 rounded-lg bg-[#f5f5f5] p-1 dark:bg-[#3a3a3a]">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'ingredients'
                  ? "bg-white text-[#262523] shadow-sm dark:bg-[#262523] dark:text-white"
                  : "text-[#6b6b6b] hover:text-[#262523] dark:text-[#a0a0a0] dark:hover:text-white"
              )}
            >
              Ingredients
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'instructions'
                  ? "bg-white text-[#262523] shadow-sm dark:bg-[#262523] dark:text-white"
                  : "text-[#6b6b6b] hover:text-[#262523] dark:text-[#a0a0a0] dark:hover:text-white"
              )}
            >
              Instructions
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'ingredients' && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#262523] dark:text-white">
                  Ingredients
                </h3>
                <div className="grid gap-3">
                  {ingredients.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg bg-[#f8f8f8] p-3 dark:bg-[#404040]"
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
                        <span className="font-medium text-[#262523] dark:text-white">
                          {item.ingredient}
                        </span>
                        {item.measure && (
                          <span className="ml-2 text-sm text-[#6b6b6b] dark:text-[#a0a0a0]">
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
                <h3 className="text-lg font-semibold text-[#262523] dark:text-white">
                  Instructions
                </h3>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap text-[#262523] dark:text-white">
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
                className="flex items-center gap-2 rounded-lg bg-[#262523] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a] dark:bg-white dark:text-[#262523] dark:hover:bg-[#f5f5f5]"
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
                className="flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-4 py-2 text-sm font-medium text-[#262523] transition-colors hover:bg-[#e5e5e5] dark:bg-[#3a3a3a] dark:text-white dark:hover:bg-[#4a4a4a]"
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
