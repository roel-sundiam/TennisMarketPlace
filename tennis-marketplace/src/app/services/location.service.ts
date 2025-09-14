import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface LocationApiResponse {
  success: boolean;
  data: string[] | { city: string; region: string };
  count?: number;
  message?: string;
}

export interface LocationData {
  city: string;
  region: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = 'http://localhost:5000/api/locations';
  
  // Cache for better performance
  private citiesCache = signal<string[]>([]);
  private regionsCache = signal<string[]>([]);
  private cityRegionCache = signal<Map<string, string>>(new Map());

  constructor(private http: HttpClient) {}

  /**
   * Get all cities in the Philippines
   */
  getCities(): Observable<string[]> {
    // Return cached data if available
    const cachedCities = this.citiesCache();
    if (cachedCities.length > 0) {
      return of(cachedCities);
    }

    return this.http.get<LocationApiResponse>(`${this.apiUrl}/cities`).pipe(
      map(response => {
        if (response.success && Array.isArray(response.data)) {
          // Cache the cities
          this.citiesCache.set(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch cities');
      }),
      catchError(error => {
        console.error('Error fetching cities:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all regions in the Philippines
   */
  getRegions(): Observable<string[]> {
    // Return cached data if available
    const cachedRegions = this.regionsCache();
    if (cachedRegions.length > 0) {
      return of(cachedRegions);
    }

    return this.http.get<LocationApiResponse>(`${this.apiUrl}/regions`).pipe(
      map(response => {
        if (response.success && Array.isArray(response.data)) {
          // Cache the regions
          this.regionsCache.set(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch regions');
      }),
      catchError(error => {
        console.error('Error fetching regions:', error);
        return of([]);
      })
    );
  }

  /**
   * Get region by city name
   */
  getRegionByCity(cityName: string): Observable<string | null> {
    if (!cityName || cityName.trim() === '') {
      return of(null);
    }

    const trimmedCity = cityName.trim();
    
    // Check cache first
    const cachedRegion = this.cityRegionCache().get(trimmedCity.toLowerCase());
    if (cachedRegion) {
      return of(cachedRegion);
    }

    return this.http.get<LocationApiResponse>(`${this.apiUrl}/region/${encodeURIComponent(trimmedCity)}`).pipe(
      map(response => {
        if (response.success && typeof response.data === 'object' && 'region' in response.data) {
          const locationData = response.data as LocationData;
          // Cache the result
          this.cityRegionCache().set(trimmedCity.toLowerCase(), locationData.region);
          return locationData.region;
        }
        throw new Error(response.message || 'Failed to fetch region');
      }),
      catchError(error => {
        console.error('Error fetching region for city:', trimmedCity, error);
        return of(null);
      })
    );
  }

  /**
   * Search cities with optional filtering
   */
  searchCities(query: string = '', region: string = '', limit: number = 50): Observable<string[]> {
    const params: string[] = [];
    
    if (query.trim()) {
      params.push(`q=${encodeURIComponent(query.trim())}`);
    }
    if (region.trim()) {
      params.push(`region=${encodeURIComponent(region.trim())}`);
    }
    if (limit > 0) {
      params.push(`limit=${limit}`);
    }

    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    
    return this.http.get<LocationApiResponse>(`${this.apiUrl}/search${queryString}`).pipe(
      map(response => {
        if (response.success && Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to search cities');
      }),
      catchError(error => {
        console.error('Error searching cities:', error);
        return of([]);
      })
    );
  }

  /**
   * Get cities by region
   */
  getCitiesByRegion(regionName: string): Observable<string[]> {
    if (!regionName || regionName.trim() === '') {
      return of([]);
    }

    return this.http.get<LocationApiResponse>(`${this.apiUrl}/cities/${encodeURIComponent(regionName.trim())}`).pipe(
      map(response => {
        if (response.success && Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch cities for region');
      }),
      catchError(error => {
        console.error('Error fetching cities for region:', regionName, error);
        return of([]);
      })
    );
  }

  /**
   * Preload cities for better performance
   * Call this on app initialization or when entering the sell page
   */
  preloadCities(): Observable<string[]> {
    return this.getCities();
  }

  /**
   * Clear cache (useful for testing or if data needs to be refreshed)
   */
  clearCache(): void {
    this.citiesCache.set([]);
    this.regionsCache.set([]);
    this.cityRegionCache.set(new Map());
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): {
    cities: number;
    regions: number;
    cityRegionMappings: number;
  } {
    return {
      cities: this.citiesCache().length,
      regions: this.regionsCache().length,
      cityRegionMappings: this.cityRegionCache().size
    };
  }
}