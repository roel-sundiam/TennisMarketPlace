import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BrandResponse {
  category: string;
  brands: string[];
}

export interface ModelResponse {
  category: string;
  brand: string;
  models: string[];
}

export interface BrandModelCache {
  [category: string]: {
    brands: string[];
    models: { [brand: string]: string[] };
  };
}

@Injectable({
  providedIn: 'root'
})
export class BrandModelService {
  private readonly apiUrl = `${environment.apiUrl}/brands`;
  
  // Cache to avoid repeated API calls
  private cache = signal<BrandModelCache>({});
  
  // Loading states
  private loadingBrands = signal<Set<string>>(new Set());
  private loadingModels = signal<Set<string>>(new Set());

  constructor(private http: HttpClient) {}

  /**
   * Get brands for a specific category
   */
  getBrandsByCategory(category: string): Observable<string[]> {
    // Check cache first
    const cached = this.cache()[category]?.brands;
    if (cached) {
      return of(cached);
    }

    // Set loading state
    this.setLoadingBrands(category, true);

    return this.http.get<BrandResponse>(`${this.apiUrl}/${category}`).pipe(
      map(response => response.brands),
      tap(brands => {
        // Update cache
        this.updateBrandCache(category, brands);
        this.setLoadingBrands(category, false);
      }),
      catchError(error => {
        console.error(`Error fetching brands for ${category}:`, error);
        this.setLoadingBrands(category, false);
        return of([]);
      })
    );
  }

  /**
   * Get models for a specific brand and category
   */
  getModelsByBrand(category: string, brand: string): Observable<string[]> {
    // Check cache first
    const cached = this.cache()[category]?.models?.[brand];
    if (cached) {
      return of(cached);
    }

    // Set loading state
    this.setLoadingModels(`${category}:${brand}`, true);

    return this.http.get<ModelResponse>(`${this.apiUrl}/${category}/${brand}/models`).pipe(
      map(response => response.models),
      tap(models => {
        // Update cache
        this.updateModelCache(category, brand, models);
        this.setLoadingModels(`${category}:${brand}`, false);
      }),
      catchError(error => {
        console.error(`Error fetching models for ${category}/${brand}:`, error);
        this.setLoadingModels(`${category}:${brand}`, false);
        return of([]);
      })
    );
  }

  /**
   * Get all brands grouped by category (for preloading)
   */
  getAllBrandsGrouped(): Observable<{ [category: string]: string[] }> {
    return this.http.get<{ [category: string]: string[] }>(this.apiUrl).pipe(
      tap(groupedBrands => {
        // Update cache with all brand data
        Object.entries(groupedBrands).forEach(([category, brands]) => {
          this.updateBrandCache(category, brands);
        });
      }),
      catchError(error => {
        console.error('Error fetching all brands:', error);
        return of({});
      })
    );
  }

  /**
   * Check if brands are loading for a category
   */
  isBrandsLoading(category: string): boolean {
    return this.loadingBrands().has(category);
  }

  /**
   * Check if models are loading for a category/brand combination
   */
  isModelsLoading(category: string, brand: string): boolean {
    return this.loadingModels().has(`${category}:${brand}`);
  }

  /**
   * Get cached brands for a category (synchronous)
   */
  getCachedBrands(category: string): string[] {
    return this.cache()[category]?.brands || [];
  }

  /**
   * Get cached models for a category/brand (synchronous)
   */
  getCachedModels(category: string, brand: string): string[] {
    return this.cache()[category]?.models?.[brand] || [];
  }

  /**
   * Clear cache (useful for testing or when data needs refresh)
   */
  clearCache(): void {
    this.cache.set({});
  }

  /**
   * Preload brands for all categories
   */
  preloadAllBrands(): Observable<{ [category: string]: string[] }> {
    return this.getAllBrandsGrouped();
  }

  // Private helper methods
  private updateBrandCache(category: string, brands: string[]): void {
    this.cache.update(cache => {
      if (!cache[category]) {
        cache[category] = { brands: [], models: {} };
      }
      cache[category].brands = brands;
      return { ...cache };
    });
  }

  private updateModelCache(category: string, brand: string, models: string[]): void {
    this.cache.update(cache => {
      if (!cache[category]) {
        cache[category] = { brands: [], models: {} };
      }
      if (!cache[category].models) {
        cache[category].models = {};
      }
      cache[category].models[brand] = models;
      return { ...cache };
    });
  }

  private setLoadingBrands(category: string, isLoading: boolean): void {
    this.loadingBrands.update(loading => {
      const newSet = new Set(loading);
      if (isLoading) {
        newSet.add(category);
      } else {
        newSet.delete(category);
      }
      return newSet;
    });
  }

  private setLoadingModels(key: string, isLoading: boolean): void {
    this.loadingModels.update(loading => {
      const newSet = new Set(loading);
      if (isLoading) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  }
}