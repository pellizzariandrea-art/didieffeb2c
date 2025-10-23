// stores/analyticsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Event types
export interface ProductViewEvent {
  type: 'product_view';
  productCode: string;
  productName: string;
  timestamp: number;
}

export interface SearchEvent {
  type: 'search';
  query: string;
  resultsCount: number;
  timestamp: number;
}

export interface FilterEvent {
  type: 'filter';
  filterKey: string;
  filterValue: string;
  timestamp: number;
}

export interface AddToCartEvent {
  type: 'add_to_cart';
  productCode: string;
  productName: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export type AnalyticsEvent = ProductViewEvent | SearchEvent | FilterEvent | AddToCartEvent;

// Aggregated statistics
export interface ProductStats {
  code: string;
  name: string;
  viewCount: number;
  addToCartCount: number;
  conversionRate: number; // addToCartCount / viewCount
  lastViewed: number;
}

export interface SearchStats {
  query: string;
  count: number;
  avgResultsCount: number;
  lastSearched: number;
}

export interface FilterStats {
  key: string;
  value: string;
  count: number;
  lastUsed: number;
}

interface AnalyticsStore {
  events: AnalyticsEvent[];
  retentionDays: number; // How many days to keep events

  // Actions
  trackProductView: (productCode: string, productName: string) => void;
  trackSearch: (query: string, resultsCount: number) => void;
  trackFilter: (filterKey: string, filterValue: string) => void;
  trackAddToCart: (productCode: string, productName: string, price: number, quantity: number) => void;

  // Data management
  clearOldEvents: () => void;
  clearAllEvents: () => void;
  exportEvents: () => string; // Export as JSON string

  // Statistics (computed)
  getTopProducts: (limit?: number) => ProductStats[];
  getTopSearches: (limit?: number) => SearchStats[];
  getTopFilters: (limit?: number) => FilterStats[];
  getRelatedProducts: (productCode: string, limit?: number) => string[]; // Co-viewed products
  getTotalViews: () => number;
  getTotalSearches: () => number;
  getTotalAddToCarts: () => number;
  getConversionRate: () => number; // Overall conversion rate
  getEventsByDateRange: (startDate: number, endDate: number) => AnalyticsEvent[];
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      events: [],
      retentionDays: 90, // Keep 90 days of data

      trackProductView: (productCode, productName) => {
        set({
          events: [
            ...get().events,
            {
              type: 'product_view',
              productCode,
              productName,
              timestamp: Date.now(),
            },
          ],
        });
        // Auto-cleanup old events
        get().clearOldEvents();
      },

      trackSearch: (query, resultsCount) => {
        set({
          events: [
            ...get().events,
            {
              type: 'search',
              query: query.trim(),
              resultsCount,
              timestamp: Date.now(),
            },
          ],
        });
        get().clearOldEvents();
      },

      trackFilter: (filterKey, filterValue) => {
        set({
          events: [
            ...get().events,
            {
              type: 'filter',
              filterKey,
              filterValue,
              timestamp: Date.now(),
            },
          ],
        });
        get().clearOldEvents();
      },

      trackAddToCart: (productCode, productName, price, quantity) => {
        set({
          events: [
            ...get().events,
            {
              type: 'add_to_cart',
              productCode,
              productName,
              price,
              quantity,
              timestamp: Date.now(),
            },
          ],
        });
        get().clearOldEvents();
      },

      clearOldEvents: () => {
        const cutoffDate = Date.now() - (get().retentionDays * 24 * 60 * 60 * 1000);
        const filteredEvents = get().events.filter(event => event.timestamp > cutoffDate);

        // Only update if we actually removed events
        if (filteredEvents.length < get().events.length) {
          set({ events: filteredEvents });
        }
      },

      clearAllEvents: () => {
        set({ events: [] });
      },

      exportEvents: () => {
        return JSON.stringify(get().events, null, 2);
      },

      getTopProducts: (limit = 10) => {
        const events = get().events;
        const productMap = new Map<string, ProductStats>();

        events.forEach(event => {
          if (event.type === 'product_view') {
            const existing = productMap.get(event.productCode);
            if (existing) {
              existing.viewCount++;
              existing.lastViewed = Math.max(existing.lastViewed, event.timestamp);
            } else {
              productMap.set(event.productCode, {
                code: event.productCode,
                name: event.productName,
                viewCount: 1,
                addToCartCount: 0,
                conversionRate: 0,
                lastViewed: event.timestamp,
              });
            }
          } else if (event.type === 'add_to_cart') {
            const existing = productMap.get(event.productCode);
            if (existing) {
              existing.addToCartCount += event.quantity;
            } else {
              // Product added to cart without view (shouldn't happen, but handle it)
              productMap.set(event.productCode, {
                code: event.productCode,
                name: event.productName,
                viewCount: 0,
                addToCartCount: event.quantity,
                conversionRate: 0,
                lastViewed: event.timestamp,
              });
            }
          }
        });

        // Calculate conversion rates
        productMap.forEach(product => {
          product.conversionRate = product.viewCount > 0
            ? (product.addToCartCount / product.viewCount) * 100
            : 0;
        });

        // Sort by view count and return top N
        return Array.from(productMap.values())
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, limit);
      },

      getTopSearches: (limit = 10) => {
        const events = get().events;
        const searchMap = new Map<string, SearchStats>();

        events.forEach(event => {
          if (event.type === 'search' && event.query) {
            const query = event.query.toLowerCase();
            const existing = searchMap.get(query);

            if (existing) {
              existing.count++;
              existing.avgResultsCount =
                (existing.avgResultsCount * (existing.count - 1) + event.resultsCount) / existing.count;
              existing.lastSearched = Math.max(existing.lastSearched, event.timestamp);
            } else {
              searchMap.set(query, {
                query: event.query, // Keep original case
                count: 1,
                avgResultsCount: event.resultsCount,
                lastSearched: event.timestamp,
              });
            }
          }
        });

        return Array.from(searchMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
      },

      getTopFilters: (limit = 10) => {
        const events = get().events;
        const filterMap = new Map<string, FilterStats>();

        events.forEach(event => {
          if (event.type === 'filter') {
            const key = `${event.filterKey}:${event.filterValue}`;
            const existing = filterMap.get(key);

            if (existing) {
              existing.count++;
              existing.lastUsed = Math.max(existing.lastUsed, event.timestamp);
            } else {
              filterMap.set(key, {
                key: event.filterKey,
                value: event.filterValue,
                count: 1,
                lastUsed: event.timestamp,
              });
            }
          }
        });

        return Array.from(filterMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
      },

      getRelatedProducts: (productCode, limit = 6) => {
        const events = get().events;
        const productViews = events.filter(
          e => e.type === 'product_view' && e.productCode === productCode
        ) as ProductViewEvent[];

        if (productViews.length === 0) {
          return []; // No data for this product
        }

        // Time window for co-viewing: 30 minutes (1800000 ms)
        const TIME_WINDOW = 30 * 60 * 1000;
        const relatedProductScores = new Map<string, number>();

        // For each view of the target product, find other products viewed nearby
        productViews.forEach(targetView => {
          const windowStart = targetView.timestamp - TIME_WINDOW;
          const windowEnd = targetView.timestamp + TIME_WINDOW;

          // Find all product views in this time window
          const nearbyViews = events.filter(
            e =>
              e.type === 'product_view' &&
              e.timestamp >= windowStart &&
              e.timestamp <= windowEnd &&
              (e as ProductViewEvent).productCode !== productCode // Exclude the target product itself
          ) as ProductViewEvent[];

          // Score each co-viewed product (closer in time = higher score)
          nearbyViews.forEach(nearbyView => {
            const timeDiff = Math.abs(nearbyView.timestamp - targetView.timestamp);
            // Score: inverse of time difference, normalized (closer = higher score)
            const score = 1 - (timeDiff / TIME_WINDOW);

            const existing = relatedProductScores.get(nearbyView.productCode) || 0;
            relatedProductScores.set(nearbyView.productCode, existing + score);
          });
        });

        // Sort by score and return top N product codes
        return Array.from(relatedProductScores.entries())
          .sort((a, b) => b[1] - a[1]) // Sort by score descending
          .slice(0, limit)
          .map(entry => entry[0]); // Return only product codes
      },

      getTotalViews: () => {
        return get().events.filter(e => e.type === 'product_view').length;
      },

      getTotalSearches: () => {
        return get().events.filter(e => e.type === 'search').length;
      },

      getTotalAddToCarts: () => {
        return get().events.filter(e => e.type === 'add_to_cart').length;
      },

      getConversionRate: () => {
        const totalViews = get().getTotalViews();
        const totalAddToCarts = get().getTotalAddToCarts();
        return totalViews > 0 ? (totalAddToCarts / totalViews) * 100 : 0;
      },

      getEventsByDateRange: (startDate, endDate) => {
        return get().events.filter(
          event => event.timestamp >= startDate && event.timestamp <= endDate
        );
      },
    }),
    {
      name: 'analytics-storage', // localStorage key
      skipHydration: false,
    }
  )
);
