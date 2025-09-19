import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Product {
  _id: string;
  title: string;
  price: number;
  originalPrice?: number;
  sport: 'Tennis' | 'Pickleball';
  condition: 'New' | 'Like New' | 'Excellent' | 'Good' | 'Fair';
  category: 'Racquets' | 'Strings' | 'Bags' | 'Balls' | 'Shoes' | 'Apparel' | 'Accessories';
  subcategory?: string;
  brand: string;
  model?: string;
  description: string;
  specifications?: {
    weight?: string;
    headSize?: string;
    stringPattern?: string;
    gripSize?: string;
    gauge?: string;
    length?: string;
    material?: string;
    size?: string;
    width?: string;
    clothingSize?: string;
    color?: string;
    year?: string;
  };
  images: Array<{
    url: string;
    alt?: string;
    isMain?: boolean;
  }>;
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    rating: { average: number; totalReviews: number };
    profilePicture?: string;
    location: { city: string; region: string };
    isVerified: boolean;
    phoneNumber?: string;
    email?: string;
  } | string;
  location: {
    city: string;
    region: string;
    meetupLocations?: string[];
  };
  availability: 'available' | 'pending' | 'sold' | 'reserved';
  tags: string[];
  views: number;
  favorites: number;
  isBoosted: boolean;
  boostExpiresAt?: string;
  isApproved: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalNotes?: string;
  negotiable: boolean;
  shippingOptions: {
    meetup: boolean;
    delivery: boolean;
    shipping: boolean;
  };
  reasonForSelling?: string;
  createdAt: string;
  updatedAt: string;
  mainImage?: { url: string; alt?: string; isMain?: boolean };
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProductFilters {
  sport?: string;
  category?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  sport: string;
  category: string;
  subcategory?: string;
  condition: string;
  brand: string;
  model?: string;
  specifications?: {
    weight?: string;
    headSize?: string;
    stringPattern?: string;
    gripSize?: string;
    gauge?: string;
    length?: string;
    material?: string;
    size?: string;
    width?: string;
    clothingSize?: string;
    color?: string;
    year?: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
    isMain?: boolean;
  }>;
  location: {
    city: string;
    region: string;
    meetupLocations?: string[];
  };
  tags?: string[];
  negotiable?: boolean;
  shippingOptions?: {
    meetup?: boolean;
    delivery?: boolean;
    shipping?: boolean;
  };
  reasonForSelling?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_BASE = `${environment.apiUrl}/products`;
  
  // Signals for state management
  isLoading = signal<boolean>(false);
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getProducts(filters: ProductFilters = {}): Observable<ProductsResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.append(key, value.toString());
      }
    });

    return this.http.get<ProductsResponse>(this.API_BASE, { params });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_BASE}/${id}`);
  }

  createProduct(productData: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(
      this.API_BASE,
      productData,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  updateProduct(id: string, productData: Partial<CreateProductRequest>): Observable<Product> {
    console.log('🌐 ProductService.updateProduct called with:');
    console.log('   - ID:', id);
    console.log('   - URL:', `${this.API_BASE}/${id}`);
    console.log('   - Data:', productData);
    console.log('   - Headers:', this.authService.getAuthHeaders());

    const request = this.http.put<Product>(
      `${this.API_BASE}/${id}`,
      productData,
      { headers: this.authService.getAuthHeaders() }
    );

    console.log('📡 HTTP PUT request created, subscribing...');
    return request;
  }

  deleteProduct(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_BASE}/${id}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  // Note: Product boosting is now handled by CoinService.boostListing()
  // This method was removed as it was calling a non-existent endpoint

  toggleFavorite(id: string): Observable<{ success: boolean; message: string; isFavorited: boolean }> {
    return this.http.patch<{ success: boolean; message: string; isFavorited: boolean }>(
      `${this.API_BASE}/${id}/favorite`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  getUserProducts(status: string = 'all'): Observable<ProductsResponse> {
    let params = new HttpParams();
    if (status !== 'all') {
      params = params.append('status', status);
    }
    
    return this.http.get<ProductsResponse>(`${environment.apiUrl}/users/me/products`, {
      headers: this.authService.getAuthHeaders(),
      params
    });
  }

  // Get user's favorite products
  getUserFavorites(): Observable<{
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalProducts: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    return this.http.get<any>(`${environment.apiUrl}/users/me/favorites`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Add product to favorites
  addToFavorites(productId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/favorites/${productId}`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Remove product from favorites
  removeFromFavorites(productId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/users/favorites/${productId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getCategories(): Observable<Array<{name: string; count: number}>> {
    return this.http.get<Array<{name: string; count: number}>>(`${this.API_BASE}/categories`);
  }

  markAsSold(productId: string): Observable<{ 
    message: string; 
    product: Product; 
    transactionFee: number; 
    feePercentage: number; 
    newCoinBalance: number;
  }> {
    return this.http.post<{ 
      message: string; 
      product: Product; 
      transactionFee: number; 
      feePercentage: number; 
      newCoinBalance: number;
    }>(`${this.API_BASE}/${productId}/mark-sold`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

}