'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { mealApiService } from '@/lib/api';
import { Meal } from '@/types/meal';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onMealSelect?: (meal: Meal) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ onSearch, onMealSelect, placeholder = "Search for meals...", className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await mealApiService.searchMeals(query);
        setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleMealSelect(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleMealSelect = (meal: Meal) => {
    setQuery(meal.strMeal);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (onMealSelect) {
      onMealSelect(meal);
    } else {
      onSearch(meal.strMeal);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b] dark:text-[#a0a0a0]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#e5e5e5] bg-white px-10 py-3 text-sm shadow-sm transition-colors focus:border-[#262523] focus:outline-none focus:ring-2 focus:ring-[#262523]/20 dark:border-[#4a4a4a] dark:bg-[#262523] dark:text-white dark:focus:border-white"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#262523] dark:text-[#a0a0a0] dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#262523] dark:border-[#4a4a4a] dark:border-t-white"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[#e5e5e5] bg-white shadow-lg dark:border-[#4a4a4a] dark:bg-[#262523]">
          {suggestions.map((meal, index) => (
            <button
              key={meal.idMeal}
              onClick={() => handleMealSelect(meal)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[#f8f8f8] dark:hover:bg-[#3a3a3a]",
                index === selectedIndex && "bg-[#f8f8f8] dark:bg-[#3a3a3a]"
              )}
            >
              <img
                src={mealApiService.getMealThumbnailUrl(meal, 'small')}
                alt={meal.strMeal}
                className="h-8 w-8 rounded object-cover"
              />
              <div className="flex-1">
                <div className="font-medium text-[#262523] dark:text-white">
                  {meal.strMeal}
                </div>
                <div className="text-xs text-[#6b6b6b] dark:text-[#a0a0a0]">
                  {meal.strCategory} • {meal.strArea}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
