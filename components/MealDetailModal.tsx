'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Clock, Users, ChefHat, ExternalLink, Youtube } from 'lucide-react';
import { Meal } from '@/types/meal';
import { mealApiService } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MealDetailModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MealDetailModal({ meal, isOpen, onClose }: MealDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');

  if (!meal || !isOpen) return null;

  const ingredients = mealApiService.getMealIngredients(meal);
  const tags = meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : [];

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
            alt={meal.strMeal}
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
              {meal.strMeal}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/90">
              <div className="flex items-center gap-1">
                <ChefHat className="h-4 w-4" />
                <span>{meal.strCategory}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{meal.strArea}</span>
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
                    {meal.strInstructions}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* External Links */}
          <div className="mt-6 flex gap-3">
            {meal.strYoutube && (
              <a
                href={meal.strYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                <Youtube className="h-4 w-4" />
                Watch on YouTube
              </a>
            )}
            {meal.strSource && (
              <a
                href={meal.strSource}
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
