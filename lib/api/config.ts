export const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export const RATE_LIMIT_DELAY = 200; // 200ms between requests (5 requests per second max)

export const CACHE_TTL = {
  categories: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
  areas: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
  ingredients: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
  meal: 5 * 60 * 1000, // 5 minutes (meal details)
  search: 2 * 60 * 1000, // 2 minutes (search results)
};

export const REQUEST_DEDUP_TTL = 5000; // 5 seconds to consider request as same
