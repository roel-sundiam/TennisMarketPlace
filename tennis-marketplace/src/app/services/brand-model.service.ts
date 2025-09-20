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

export interface PickleballSpecifications {
  paddleTypes: string[];
  weights: string[];
  surfaces: string[];
  gripSizes: string[];
  coreTypes: string[];
  shapes: string[];
}

export interface PickleballSearchFilters {
  paddleType?: string;
  weight?: string;
  surface?: string;
  gripSize?: string;
  coreType?: string;
  usapaApproved?: boolean;
}

export interface PickleballSearchResult {
  brand: string;
  logo?: string;
  models: Array<{
    name: string;
    isPopular: boolean;
    year?: string;
    specifications?: {
      weight?: string;
      gripSize?: string;
      paddleType?: string;
      surface?: string;
      coreType?: string;
      shape?: string;
      usapaApproved?: boolean;
      indoorOutdoor?: string;
    };
  }>;
}

export interface TennisRacketSpecifications {
  headSizes: string[];
  racketWeights: string[];
  stringPatterns: string[];
  balances: string[];
  stiffnesses: string[];
  swingWeights: string[];
  playerLevels: string[];
  playStyles: string[];
}

export interface TennisRacketSearchFilters {
  headSize?: string;
  racketWeight?: string;
  stringPattern?: string;
  balance?: string;
  stiffness?: string;
  swingWeight?: string;
  playerLevel?: string;
  playStyle?: string;
}

export interface TennisRacketSearchResult {
  brand: string;
  logo?: string;
  models: Array<{
    name: string;
    isPopular: boolean;
    year?: string;
    specifications?: {
      headSize?: string;
      racketWeight?: string;
      stringPattern?: string;
      balance?: string;
      stiffness?: string;
      swingWeight?: string;
      playerLevel?: string;
      playStyle?: string;
    };
  }>;
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

  /**
   * Search pickleball paddles with advanced filters
   */
  searchPickleballPaddles(filters: PickleballSearchFilters): Observable<PickleballSearchResult[]> {
    const params = new URLSearchParams();

    if (filters.paddleType) params.set('paddleType', filters.paddleType);
    if (filters.weight) params.set('weight', filters.weight);
    if (filters.surface) params.set('surface', filters.surface);
    if (filters.gripSize) params.set('gripSize', filters.gripSize);
    if (filters.coreType) params.set('coreType', filters.coreType);
    if (filters.usapaApproved !== undefined) params.set('usapaApproved', filters.usapaApproved.toString());

    const queryString = params.toString();
    const url = `${this.apiUrl}/pickleball/search${queryString ? '?' + queryString : ''}`;

    return this.http.get<{ results: PickleballSearchResult[] }>(url).pipe(
      map(response => response.results),
      catchError(error => {
        console.error('Error searching pickleball paddles:', error);
        return of([]);
      })
    );
  }

  /**
   * Get available pickleball specifications for filtering
   */
  getPickleballSpecifications(): Observable<PickleballSpecifications> {
    return this.http.get<{ specifications: PickleballSpecifications }>(`${this.apiUrl}/pickleball/specifications`).pipe(
      map(response => response.specifications),
      catchError(error => {
        console.error('Error fetching pickleball specifications:', error);
        return of({
          paddleTypes: [],
          weights: [],
          surfaces: [],
          gripSizes: [],
          coreTypes: [],
          shapes: []
        });
      })
    );
  }

  /**
   * Search tennis rackets with advanced filters
   */
  searchTennisRackets(filters: TennisRacketSearchFilters): Observable<TennisRacketSearchResult[]> {
    const params = new URLSearchParams();

    if (filters.headSize) params.set('headSize', filters.headSize);
    if (filters.racketWeight) params.set('racketWeight', filters.racketWeight);
    if (filters.stringPattern) params.set('stringPattern', filters.stringPattern);
    if (filters.balance) params.set('balance', filters.balance);
    if (filters.stiffness) params.set('stiffness', filters.stiffness);
    if (filters.swingWeight) params.set('swingWeight', filters.swingWeight);
    if (filters.playerLevel) params.set('playerLevel', filters.playerLevel);
    if (filters.playStyle) params.set('playStyle', filters.playStyle);

    const queryString = params.toString();
    const url = `${this.apiUrl}/tennis/search${queryString ? '?' + queryString : ''}`;

    return this.http.get<{ results: TennisRacketSearchResult[] }>(url).pipe(
      map(response => response.results),
      catchError(error => {
        console.error('Error searching tennis rackets:', error);
        return of([]);
      })
    );
  }

  /**
   * Get available tennis racket specifications for filtering
   */
  getTennisRacketSpecifications(): Observable<TennisRacketSpecifications> {
    return this.http.get<{ specifications: TennisRacketSpecifications }>(`${this.apiUrl}/tennis/specifications`).pipe(
      map(response => response.specifications),
      catchError(error => {
        console.error('Error fetching tennis racket specifications:', error);
        return of({
          headSizes: [],
          racketWeights: [],
          stringPatterns: [],
          balances: [],
          stiffnesses: [],
          swingWeights: [],
          playerLevels: [],
          playStyles: []
        });
      })
    );
  }

  /**
   * Check if category is pickleball-related
   */
  isPickleballCategory(category: string): boolean {
    return category === 'Pickleball Paddles';
  }

  /**
   * Check if category is tennis-related
   */
  isTennisCategory(category: string): boolean {
    return category === 'Racquets';
  }
}