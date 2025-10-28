'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { mealApiService } from '@/lib/api';
import { Category, Area, Ingredient } from '@/types/meal';
import { cn } from '@/lib/utils';

interface FilterDropdownProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function FilterDropdown({ label, options, value, onChange, className }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <span className="text-gray-700 dark:text-gray-300">
          {value ? options.find(opt => opt.value === value)?.label || label : label}
        </span>
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
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              All {label}s
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {option.label}
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
        options={categories.map(cat => ({ value: cat.strCategory, label: cat.strCategory }))}
        value={filters.category}
        onChange={(value) => handleFilterChange('category', value)}
      />
      
      <FilterDropdown
        label="Area"
        options={areas.map(area => ({ value: area.strArea, label: area.strArea }))}
        value={filters.area}
        onChange={(value) => handleFilterChange('area', value)}
      />
      
      <FilterDropdown
        label="Ingredient"
        options={ingredients.map(ing => ({ value: ing.strIngredient, label: ing.strIngredient }))}
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
