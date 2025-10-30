export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}
