'use client';

import Image from 'next/image';
import { Clock, Users, ChefHat, CheckCircle, Apple } from 'lucide-react';
import { Meal } from '@/types/meal';
import { mealApiService } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MealCardProps {
  meal: Meal;
  onClick?: (meal: Meal) => void;
  className?: string;
  availableIngredients?: string[];
}

// Apple emojis for different ingredients (same as IngredientList)
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

export function MealCard({ meal, onClick, className, availableIngredients = [] }: MealCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(meal);
    }
  };

  const ingredients = mealApiService.getMealIngredients(meal);
  const tags = meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : [];
  
  // Calculate ingredient matches
  const matchedIngredients = ingredients.filter(ingredient => 
    availableIngredients.some(available => 
      available.toLowerCase().includes(ingredient.ingredient.toLowerCase()) ||
      ingredient.ingredient.toLowerCase().includes(available.toLowerCase())
    )
  );
  
  const matchPercentage = ingredients.length > 0 ? Math.round((matchedIngredients.length / ingredients.length) * 100) : 0;
  const hasAvailableIngredients = availableIngredients.length > 0;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
        <Image
          src={mealApiService.getMealThumbnailUrl(meal, 'medium')}
          alt={meal.strMeal}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
            {meal.strCategory}
          </span>
        </div>

        {/* Area Badge */}
        <div className="absolute top-3 right-3">
          <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
            {meal.strArea}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
          {meal.strMeal}
        </h3>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Ingredients Preview */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <ChefHat className="h-4 w-4" />
              <span className="font-medium">Ingredients:</span>
            </div>
            {hasAvailableIngredients && (
              <div className="flex items-center gap-1 text-xs">
                <Apple className="h-3 w-3 text-green-600" />
                <span className="font-medium text-green-600">{matchPercentage}% match</span>
              </div>
            )}
          </div>
          
          {/* Ingredient List with Visual Indicators */}
          <div className="space-y-1">
            {ingredients.slice(0, 4).map((ingredient, index) => {
              const isMatched = matchedIngredients.some(matched => 
                matched.ingredient.toLowerCase() === ingredient.ingredient.toLowerCase()
              );
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-base">{getIngredientEmoji(ingredient.ingredient)}</span>
                  <span className={cn(
                    "flex-1",
                    isMatched && hasAvailableIngredients 
                      ? "text-green-700 dark:text-green-300 font-medium" 
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {ingredient.ingredient}
                    {ingredient.measure && ` (${ingredient.measure})`}
                  </span>
                  {isMatched && hasAvailableIngredients && (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                </div>
              );
            })}
            {ingredients.length > 4 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{ingredients.length - 4} more ingredients
              </div>
            )}
          </div>
        </div>

        {/* Instructions Preview */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {meal.strInstructions}
        </p>

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Recipe</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Serves 4-6</span>
            </div>
          </div>
          
          <button className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600">
            View Recipe
          </button>
        </div>
      </div>
    </div>
  );
}
