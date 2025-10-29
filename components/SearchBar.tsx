'use client';

import { Search, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { mealApiService } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Meal } from '@/types/meal';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onMealSelect?: (meal: Meal) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onSearch,
  onMealSelect,
  placeholder = 'Search for meals...',
  className,
}: SearchBarProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search for suggestions with request cancellation
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        try {
          const results = await mealApiService.searchMeals(query);
          // Check if request was cancelled before updating state
          if (!cancelled) {
            setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
          }
        } catch (error) {
          if (!cancelled) {
            console.error('Search error:', error);
            setSuggestions([]);
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
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
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
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

  const handleSearch = (): void => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleMealSelect = (meal: Meal): void => {
    setQuery(meal.strMeal);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    if (onMealSelect) {
      onMealSelect(meal);
    } else {
      onSearch(meal.strMeal);
    }
  };

  const clearSearch = (): void => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={cn('relative w-full max-w-4xl', className)}>
      <div className="relative">
        <Search className="absolute left-4 sm:left-6 top-1/2 h-5 w-5 sm:h-6 sm:w-6 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full rounded-xl sm:rounded-2xl border-2 border-border bg-background px-12 sm:px-16 py-4 sm:py-6 text-base sm:text-lg lg:text-xl shadow-lg transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground hover:border-primary/50"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-12 sm:right-16 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-2 border-spinner-border border-t-spinner-border-active"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl sm:rounded-2xl border-2 border-border bg-popover shadow-xl">
          {suggestions.map((meal, index) => (
            <button
              key={meal.idMeal}
              onClick={() => handleMealSelect(meal)}
              className={cn(
                'flex w-full items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base transition-colors hover:bg-hover first:rounded-t-xl sm:first:rounded-t-2xl last:rounded-b-xl sm:last:rounded-b-2xl',
                index === selectedIndex && 'bg-hover'
              )}
            >
              <img
                src={mealApiService.getMealThumbnailUrl(meal, 'small')}
                alt={meal.strMeal}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-popover-foreground truncate">
                  {meal.strMeal}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
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
