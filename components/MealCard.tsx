'use client';

import Image from 'next/image';
import { Clock, Users, ChefHat, CheckCircle, Apple } from 'lucide-react';
import { Meal } from '@/types/meal';
import { mealApiService } from '@/lib/api';
import { cn } from '@/lib/utils';
import { IngredientImage } from '@/lib/ingredientImages';

interface MealCardProps {
  meal: Meal;
  onClick?: (meal: Meal) => void;
  className?: string;
  availableIngredients?: string[];
  showMatchPercentage?: boolean;
  isFirstImage?: boolean;
}


export function MealCard({ meal, onClick, className, availableIngredients = [], showMatchPercentage = false, isFirstImage = false }: MealCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(meal);
    }
  };

  const ingredients = mealApiService.getMealIngredients(meal);
  const tags = meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : [];
  
  // Calculate ingredient matches for visual indicators (if in ingredient search mode)
  const matchedIngredients = showMatchPercentage ? ingredients.filter(ingredient => 
    availableIngredients.some(available => 
      available.toLowerCase().includes(ingredient.ingredient.toLowerCase()) ||
      ingredient.ingredient.toLowerCase().includes(available.toLowerCase())
    )
  ) : [];

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group cursor-pointer rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
        <Image
          src={mealApiService.getMealThumbnailUrl(meal, 'medium')}
          alt={meal.strMeal}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          loading={isFirstImage ? "eager" : "lazy"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-card-foreground backdrop-blur-sm">
            {meal.strCategory}
          </span>
        </div>

        {/* Area Badge */}
        <div className="absolute top-3 right-3">
          <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-card-foreground backdrop-blur-sm">
            {meal.strArea}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-card-foreground line-clamp-2">
          {meal.strMeal}
        </h3>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Ingredients Preview */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ChefHat className="h-4 w-4" />
              <span className="font-medium">Ingredients:</span>
            </div>
          </div>
          
          {/* Ingredient List with Visual Indicators */}
          <div className="space-y-1">
            {ingredients.slice(0, 4).map((ingredient, index) => {
              const isMatched = matchedIngredients.some(matched => 
                matched.ingredient.toLowerCase() === ingredient.ingredient.toLowerCase()
              );
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <IngredientImage ingredient={ingredient.ingredient} size="small" />
                  <span className={cn(
                    "flex-1",
                    isMatched && showMatchPercentage 
                      ? "text-card-foreground font-medium" 
                      : "text-muted-foreground"
                  )}>
                    {ingredient.ingredient}
                    {ingredient.measure && ` (${ingredient.measure})`}
                  </span>
                  {isMatched && showMatchPercentage && (
                    <CheckCircle className="h-3 w-3 text-card-foreground" />
                  )}
                </div>
              );
            })}
            {ingredients.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{ingredients.length - 4} more ingredients
              </div>
            )}
          </div>
        </div>

        {/* Instructions Preview */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {meal.strInstructions}
        </p>

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Recipe</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Serves 4-6</span>
            </div>
          </div>
          
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-hover">
            View Recipe
          </button>
        </div>
      </div>
    </div>
  );
}
