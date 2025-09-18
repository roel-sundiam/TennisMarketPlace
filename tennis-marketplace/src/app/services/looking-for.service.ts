import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface LookingForPost {
  _id: string;
  title: string;
  description: string;
  category: 'Racquets' | 'Pickleball Paddles' | 'Strings' | 'Bags' | 'Balls' | 'Pickleball Balls' | 'Shoes' | 'Apparel' | 'Accessories';
  subcategory?: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  condition: Array<'New' | 'Like New' | 'Excellent' | 'Good' | 'Fair'>;
  preferredBrands?: string[];
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
  location: {
    city: string;
    region: string;
    meetupLocations?: string[];
    willingToTravel: boolean;
    maxTravelDistance: number;
  };
  urgency: 'asap' | 'within_week' | 'within_month' | 'flexible';
  buyer: {
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
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
  expiresAt: string;
  responses: LookingForResponse[];
  views: number;
  favorites: number;
  tags?: string[];
  shippingPreferences: {
    meetup: boolean;
    delivery: boolean;
    shipping: boolean;
  };
  additionalNotes?: string;
  isUrgent: boolean;
  isPriority: boolean;
  createdAt: string;
  updatedAt: string;
  responseCount: number;
  isExpired: boolean;
  daysLeft: number;
}

export interface LookingForResponse {
  _id: string;
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
  };
  message: string;
  product?: {
    _id: string;
    title: string;
    price: number;
    images: Array<{ url: string; alt?: string; isMain?: boolean }>;
    condition: string;
    brand: string;
    model?: string;
    location: { city: string; region: string };
  };
  contactInfo: {
    phone?: string;
    whatsapp?: string;
    preferredContact: 'phone' | 'whatsapp' | 'both';
  };
  price?: number;
  negotiable: boolean;
  status: 'active' | 'contacted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateLookingForRequest {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budget: {
    min: number;
    max: number;
  };
  condition: string[];
  preferredBrands?: string[];
  specifications?: any;
  location: {
    city: string;
    region: string;
    meetupLocations?: string[];
    willingToTravel?: boolean;
    maxTravelDistance?: number;
  };
  urgency: string;
  tags?: string[];
  shippingPreferences?: {
    meetup?: boolean;
    delivery?: boolean;
    shipping?: boolean;
  };
  additionalNotes?: string;
  isUrgent?: boolean;
}

export interface RespondToLookingForRequest {
  message: string;
  productId?: string;
  contactInfo: {
    phone?: string;
    whatsapp?: string;
    preferredContact: 'phone' | 'whatsapp' | 'both';
  };
  price?: number;
  negotiable?: boolean;
}

export interface LookingForFilters {
  category?: string;
  condition?: string;
  budgetMin?: number;
  budgetMax?: number;
  city?: string;
  urgency?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export interface LookingForListResponse {
  lookingForPosts: LookingForPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LookingForService {
  private apiUrl = `${environment.apiUrl}/lookingfor`;

  lookingForPosts = signal<LookingForPost[]>([]);
  currentPost = signal<LookingForPost | null>(null);
  isLoading = signal(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const headers = new HttpHeaders();
    return token ? headers.set('Authorization', `Bearer ${token}`) : headers;
  }

  // Get all Looking For posts with filters
  getLookingForPosts(filters: LookingForFilters = {}): Observable<LookingForListResponse> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<LookingForListResponse>(this.apiUrl, { params });
  }

  // Get single Looking For post
  getLookingForPost(id: string): Observable<LookingForPost> {
    return this.http.get<LookingForPost>(`${this.apiUrl}/${id}`);
  }

  // Create new Looking For post
  createLookingForPost(postData: CreateLookingForRequest): Observable<LookingForPost> {
    return this.http.post<LookingForPost>(this.apiUrl, postData, {
      headers: this.getHeaders()
    });
  }

  // Update Looking For post
  updateLookingForPost(id: string, postData: Partial<CreateLookingForRequest>): Observable<LookingForPost> {
    return this.http.put<LookingForPost>(`${this.apiUrl}/${id}`, postData, {
      headers: this.getHeaders()
    });
  }

  // Delete Looking For post
  deleteLookingForPost(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Respond to a Looking For post
  respondToLookingFor(id: string, response: RespondToLookingForRequest): Observable<{
    message: string;
    lookingForPost: LookingForPost;
    response: LookingForResponse;
  }> {
    return this.http.post<{
      message: string;
      lookingForPost: LookingForPost;
      response: LookingForResponse;
    }>(`${this.apiUrl}/${id}/respond`, response, {
      headers: this.getHeaders()
    });
  }

  // Get responses for a Looking For post
  getResponses(id: string): Observable<{
    responses: LookingForResponse[];
    responseCount: number;
  }> {
    return this.http.get<{
      responses: LookingForResponse[];
      responseCount: number;
    }>(`${this.apiUrl}/${id}/responses`);
  }

  // Mark Looking For post as fulfilled
  markAsFulfilled(id: string): Observable<{ message: string; lookingForPost: LookingForPost }> {
    return this.http.post<{ message: string; lookingForPost: LookingForPost }>(
      `${this.apiUrl}/${id}/mark-fulfilled`, {}, {
        headers: this.getHeaders()
      }
    );
  }

  // Extend expiry of Looking For post
  extendExpiry(id: string, days: number = 30): Observable<{
    message: string;
    lookingForPost: LookingForPost;
    newExpiryDate: string;
  }> {
    return this.http.post<{
      message: string;
      lookingForPost: LookingForPost;
      newExpiryDate: string;
    }>(`${this.apiUrl}/${id}/extend`, { days }, {
      headers: this.getHeaders()
    });
  }

  // Get categories with counts
  getCategories(): Observable<Array<{ name: string; count: number }>> {
    return this.http.get<Array<{ name: string; count: number }>>(`${this.apiUrl}/categories`);
  }

  // Get urgent Looking For posts
  getUrgentPosts(limit: number = 8): Observable<LookingForPost[]> {
    return this.http.get<LookingForPost[]>(`${this.apiUrl}/urgent`, {
      params: { limit: limit.toString() }
    });
  }

  // Admin methods
  getAllPostsAdmin(filters: LookingForFilters = {}): Observable<LookingForListResponse> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<LookingForListResponse>(`${this.apiUrl}/admin/all`, {
      params,
      headers: this.getHeaders()
    });
  }

  // Expire old posts (admin)
  expireOldPosts(): Observable<{ message: string; modifiedCount: number }> {
    return this.http.post<{ message: string; modifiedCount: number }>(
      `${this.apiUrl}/admin/expire-old`, {}, {
        headers: this.getHeaders()
      }
    );
  }

  // Get Looking For statistics (admin)
  getStats(): Observable<{
    totalPosts: number;
    activePosts: number;
    fulfilledPosts: number;
    expiredPosts: number;
    totalResponses: number;
    fulfillmentRate: string;
  }> {
    return this.http.get<{
      totalPosts: number;
      activePosts: number;
      fulfilledPosts: number;
      expiredPosts: number;
      totalResponses: number;
      fulfillmentRate: string;
    }>(`${this.apiUrl}/admin/stats`, {
      headers: this.getHeaders()
    });
  }

  // Utility methods
  formatBudgetRange(budget: { min: number; max: number; currency?: string }): string {
    const currency = budget.currency || 'PHP';
    const symbol = currency === 'PHP' ? '₱' : currency;

    if (budget.min === budget.max) {
      return `${symbol}${budget.min.toLocaleString()}`;
    }

    return `${symbol}${budget.min.toLocaleString()} - ${symbol}${budget.max.toLocaleString()}`;
  }

  getUrgencyLabel(urgency: string): string {
    const labels: { [key: string]: string } = {
      'asap': 'ASAP',
      'within_week': 'Within a week',
      'within_month': 'Within a month',
      'flexible': 'Flexible'
    };
    return labels[urgency] || urgency;
  }

  getUrgencyColor(urgency: string): string {
    const colors: { [key: string]: string } = {
      'asap': 'bg-red-100 text-red-800',
      'within_week': 'bg-orange-100 text-orange-800',
      'within_month': 'bg-yellow-100 text-yellow-800',
      'flexible': 'bg-green-100 text-green-800'
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800';
  }

  getDaysLeftColor(daysLeft: number): string {
    if (daysLeft <= 3) return 'text-red-600';
    if (daysLeft <= 7) return 'text-orange-600';
    if (daysLeft <= 14) return 'text-yellow-600';
    return 'text-green-600';
  }
}