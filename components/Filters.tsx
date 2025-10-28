'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Beef, RotateCcw, Cake, Apple, Fish, Salad, Soup, Leaf, Carrot, Utensils, Globe } from 'lucide-react';
import { mealApiService } from '@/lib/api';
import { Category, Area, Ingredient } from '@/types/meal';
import { cn } from '@/lib/utils';
import { IngredientImage } from '@/lib/ingredientImages';

// Icons for different categories
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('beef')) return Beef;
  if (lowerCategory.includes('chicken')) return RotateCcw; // Using a generic icon
  if (lowerCategory.includes('dessert')) return Cake;
  if (lowerCategory.includes('lamb')) return RotateCcw; // Using a generic icon
  if (lowerCategory.includes('miscellaneous')) return Apple;
  if (lowerCategory.includes('pasta')) return Utensils; // Using utensils for pasta
  if (lowerCategory.includes('pork')) return RotateCcw; // Using a generic icon
  if (lowerCategory.includes('seafood')) return Fish;
  if (lowerCategory.includes('side')) return Salad;
  if (lowerCategory.includes('starter')) return Soup;
  if (lowerCategory.includes('vegan')) return Leaf;
  if (lowerCategory.includes('vegetarian')) return Carrot;
  if (lowerCategory.includes('breakfast')) return Utensils; // Using utensils for breakfast
  if (lowerCategory.includes('goat')) return RotateCcw; // Using a generic icon
  
  return Utensils; // Default icon
};

// Country flag emojis for different cuisines
const getAreaEmoji = (area: string): string => {
  const lowerArea = area.toLowerCase();
  
  if (lowerArea.includes('american')) return '🇺🇸';
  if (lowerArea.includes('british')) return '🇬🇧';
  if (lowerArea.includes('canadian')) return '🇨🇦';
  if (lowerArea.includes('chinese')) return '🇨🇳';
  if (lowerArea.includes('croatian')) return '🇭🇷';
  if (lowerArea.includes('dutch')) return '🇳🇱';
  if (lowerArea.includes('egyptian')) return '🇪🇬';
  if (lowerArea.includes('filipino')) return '🇵🇭';
  if (lowerArea.includes('french')) return '🇫🇷';
  if (lowerArea.includes('greek')) return '🇬🇷';
  if (lowerArea.includes('indian')) return '🇮🇳';
  if (lowerArea.includes('irish')) return '🇮🇪';
  if (lowerArea.includes('italian')) return '🇮🇹';
  if (lowerArea.includes('jamaican')) return '🇯🇲';
  if (lowerArea.includes('japanese')) return '🇯🇵';
  if (lowerArea.includes('kenyan')) return '🇰🇪';
  if (lowerArea.includes('malaysian')) return '🇲🇾';
  if (lowerArea.includes('mexican')) return '🇲🇽';
  if (lowerArea.includes('moroccan')) return '🇲🇦';
  if (lowerArea.includes('polish')) return '🇵🇱';
  if (lowerArea.includes('portuguese')) return '🇵🇹';
  if (lowerArea.includes('russian')) return '🇷🇺';
  if (lowerArea.includes('spanish')) return '🇪🇸';
  if (lowerArea.includes('thai')) return '🇹🇭';
  if (lowerArea.includes('tunisian')) return '🇹🇳';
  if (lowerArea.includes('turkish')) return '🇹🇷';
  if (lowerArea.includes('vietnamese')) return '🇻🇳';
  
  return '🌍'; // Default globe emoji
};

interface FilterDropdownProps {
  label: string;
  options: Array<{ value: string; label: string; emoji?: string; description?: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function FilterDropdown({ label, options, value, onChange, className }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (optionValue: string) => {
    if (label.toLowerCase() === 'category') return getCategoryIcon(optionValue);
    return Apple; // Default for ingredients
  };

  // Get the display element for the selected value
  const getSelectedDisplay = () => {
    if (!value) return label;
    
    // For area: show flag emoji
    if (label.toLowerCase() === 'area') {
      return (
        <>
          <span className="mr-2">{getAreaEmoji(value)}</span>
          {options.find(opt => opt.value === value)?.label || label}
        </>
      );
    }
    
    // For ingredient: show ingredient image
    if (label.toLowerCase() === 'ingredient') {
      const selectedOption = options.find(opt => opt.value === value);
      return (
        <>
          <IngredientImage ingredient={value} size="small" className="mr-2" />
          {selectedOption?.label || label}
        </>
      );
    }
    
    // For category: show icon
    if (label.toLowerCase() === 'category') {
      return (
        <>
          {React.createElement(getIcon(value), { className: "h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" })}
          {options.find(opt => opt.value === value)?.label || label}
        </>
      );
    }
    
    return options.find(opt => opt.value === value)?.label || label;
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          {value ? (
            getSelectedDisplay()
          ) : (
            <span className="text-gray-700 dark:text-gray-300">{label}</span>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="max-h-60 overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Apple className="h-4 w-4 text-gray-400" />
              <span>All {label}s</span>
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {label.toLowerCase() === 'ingredient' ? (
                  <IngredientImage ingredient={option.value} size="small" />
                ) : label.toLowerCase() === 'area' ? (
                  <span className="text-base">{getAreaEmoji(option.value)}</span>
                ) : (
                  React.createElement(getIcon(option.value), { className: "h-4 w-4 text-gray-600 dark:text-gray-400" })
                )}
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  {option.description && label.toLowerCase() !== 'category' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FiltersProps {
  onFiltersChange: (filters: { category: string; area: string; ingredient: string }) => void;
  className?: string;
}

export function Filters({ onFiltersChange, className }: FiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    area: '',
    ingredient: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoriesData, areasData, ingredientsData] = await Promise.all([
          mealApiService.getCategories(),
          mealApiService.getAreas(),
          mealApiService.getIngredients()
        ]);

        setCategories(categoriesData);
        setAreas(areasData);
        setIngredients(ingredientsData.slice(0, 50)); // Limit ingredients for performance
      } catch (error) {
        console.error('Error loading filters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilters();
  }, []);

  const handleFilterChange = (type: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = { category: '', area: '', ingredient: '' };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = filters.category || filters.area || filters.ingredient;

  if (isLoading) {
    return (
      <div className={cn("flex gap-3", className)}>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <FilterDropdown
        label="Category"
        options={categories.map(cat => ({ 
          value: cat.strCategory, 
          label: cat.strCategory,
          description: cat.strCategoryDescription || `Delicious ${cat.strCategory.toLowerCase()} recipes`
        }))}
        value={filters.category}
        onChange={(value) => handleFilterChange('category', value)}
      />
      
      <FilterDropdown
        label="Area"
        options={areas.map(area => ({ 
          value: area.strArea, 
          label: area.strArea,
          description: `Traditional ${area.strArea} cuisine`
        }))}
        value={filters.area}
        onChange={(value) => handleFilterChange('area', value)}
      />
      
      <FilterDropdown
        label="Ingredient"
        options={ingredients.map(ing => ({ 
          value: ing.strIngredient, 
          label: ing.strIngredient,
          description: `Recipes featuring ${ing.strIngredient.toLowerCase()}`
        }))}
        value={filters.ingredient}
        onChange={(value) => handleFilterChange('ingredient', value)}
      />

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
          Clear All
        </button>
      )}
    </div>
  );
}
