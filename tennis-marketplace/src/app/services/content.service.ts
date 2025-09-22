import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ContentItem {
  _id?: string;
  title: string;
  slug: string;
  category: 'reviews' | 'guides' | 'philippines' | 'advanced' | 'seasonal';
  subcategory?: string;
  content: string;
  metaDescription: string;
  tags: string[];
  wordCount: number;
  status: 'draft' | 'published' | 'archived';
  affiliateLinks?: Array<{
    text: string;
    url: string;
    product: string;
  }>;
  targetKeywords: string[];
  readingTime: number;
  publishedAt: Date;
  lastModified: Date;
  author: string;
  featured: boolean;
  priority: 'high' | 'medium' | 'low';
  url?: string;
  featuredImage?: string;
  updatedAt?: Date;
}

export interface ContentStats {
  overview: {
    total: number;
    published: number;
    draft: number;
    totalWords: number;
  };
  byCategory: Array<{
    _id: string;
    count: number;
  }>;
  byPriority: Array<{
    _id: string;
    count: number;
  }>;
  recent: ContentItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LoadFromFilesResponse {
  success: boolean;
  message: string;
  loadedCount: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = `${environment.apiUrl}/content`;
  private contentSubject = new BehaviorSubject<ContentItem[]>([]);
  private statsSubject = new BehaviorSubject<ContentStats | null>(null);
  private authService = inject(AuthService);
  
  public content$ = this.contentSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Load content from markdown files (admin only)
  loadFromFiles(): Observable<LoadFromFilesResponse> {
    return this.http.get<LoadFromFilesResponse>(`${this.apiUrl}/load-from-files`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get content statistics
  getStats(): Observable<ApiResponse<ContentStats>> {
    return this.http.get<ApiResponse<ContentStats>>(`${this.apiUrl}/stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get all content (admin)
  getAllContent(filters?: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<ContentItem[]>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ApiResponse<ContentItem[]>>(`${this.apiUrl}/admin/all`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get single content item
  getContent(id: string): Observable<ApiResponse<ContentItem>> {
    return this.http.get<ApiResponse<ContentItem>>(`${this.apiUrl}/admin/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get content by slug (public)
  getContentBySlug(slug: string): Observable<ApiResponse<ContentItem>> {
    return this.http.get<ApiResponse<ContentItem>>(`${this.apiUrl}/slug/${slug}`);
  }

  // Create new content
  createContent(content: Partial<ContentItem>): Observable<ApiResponse<ContentItem>> {
    return this.http.post<ApiResponse<ContentItem>>(`${this.apiUrl}/admin`, content, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Update content
  updateContent(id: string, content: Partial<ContentItem>): Observable<ApiResponse<ContentItem>> {
    return this.http.put<ApiResponse<ContentItem>>(`${this.apiUrl}/admin/${id}`, content, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Delete content
  deleteContent(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/admin/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get public content (for frontend display)
  getPublicContent(filters?: {
    category?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<ApiResponse<ContentItem[]>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.featured !== undefined) params = params.set('featured', filters.featured.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<ApiResponse<ContentItem[]>>(`${this.apiUrl}`, { params });
  }

  // Update local state
  updateContentList(content: ContentItem[]): void {
    this.contentSubject.next(content);
  }

  updateStats(stats: ContentStats): void {
    this.statsSubject.next(stats);
  }

  // Helper methods
  getCategoryDisplayName(category: string): string {
    const categoryNames: { [key: string]: string } = {
      'reviews': 'Product Reviews',
      'guides': 'How-To Guides',
      'philippines': 'Philippines-Specific',
      'advanced': 'Advanced Tennis',
      'seasonal': 'Seasonal & Trending'
    };
    return categoryNames[category] || category;
  }

  getStatusDisplayName(status: string): string {
    const statusNames: { [key: string]: string } = {
      'draft': 'Draft',
      'published': 'Published',
      'archived': 'Archived'
    };
    return statusNames[status] || status;
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'high': 'text-red-600',
      'medium': 'text-yellow-600',
      'low': 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'reviews': 'bg-blue-100 text-blue-800',
      'guides': 'bg-green-100 text-green-800',
      'philippines': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-purple-100 text-purple-800',
      'seasonal': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  }

  formatReadingTime(minutes: number): string {
    if (minutes < 1) return '< 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }

  formatWordCount(count: number): string {
    if (count < 1000) return `${count} words`;
    return `${(count / 1000).toFixed(1)}k words`;
  }
}