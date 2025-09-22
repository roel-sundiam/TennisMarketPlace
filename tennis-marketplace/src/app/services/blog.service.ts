import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ContentItem, ApiResponse } from './content.service';

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  metaDescription: string;
  tags: string[];
  wordCount: number;
  readingTime: number;
  publishedAt: Date;
  author: string;
  featured: boolean;
  url: string;
  featuredImage?: string;
  updatedAt?: Date;
}

export interface BlogCategory {
  id: string;
  name: string;
  description: string;
  postCount: number;
  slug: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = `${environment.apiUrl}/content`;

  constructor(private http: HttpClient) {}

  // Get all published blog posts (public endpoint)
  getBlogPosts(filters?: {
    category?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<{
    posts: BlogPost[];
    pagination: any;
    categories: BlogCategory[];
  }> {
    let params = new HttpParams();
    params = params.set('status', 'published'); // Only published content

    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.featured !== undefined) params = params.set('featured', filters.featured.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<ApiResponse<ContentItem[]>>(`${this.apiUrl}`, { params }).pipe(
      map(response => ({
        posts: response.data.map(item => this.mapContentItemToBlogPost(item)),
        pagination: response.pagination,
        categories: this.getCategories()
      }))
    );
  }

  // Get single blog post by slug (public endpoint)
  getBlogPost(slug: string): Observable<BlogPost> {
    return this.http.get<ApiResponse<ContentItem>>(`${this.apiUrl}/slug/${slug}`).pipe(
      map(response => this.mapContentItemToBlogPost(response.data))
    );
  }

  // Get featured posts for homepage
  getFeaturedPosts(limit: number = 3): Observable<BlogPost[]> {
    const params = new HttpParams()
      .set('status', 'published')
      .set('featured', 'true')
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<ContentItem[]>>(`${this.apiUrl}`, { params }).pipe(
      map(response => response.data.map(item => this.mapContentItemToBlogPost(item)))
    );
  }

  // Get related posts
  getRelatedPosts(category: string, currentSlug: string, limit: number = 3): Observable<BlogPost[]> {
    const params = new HttpParams()
      .set('status', 'published')
      .set('category', category)
      .set('limit', (limit + 1).toString()); // Get one extra to filter out current post

    return this.http.get<ApiResponse<ContentItem[]>>(`${this.apiUrl}`, { params }).pipe(
      map(response => 
        response.data
          .filter(item => item.slug !== currentSlug)
          .slice(0, limit)
          .map(item => this.mapContentItemToBlogPost(item))
      )
    );
  }

  // Search posts
  searchPosts(query: string, limit: number = 10): Observable<BlogPost[]> {
    const params = new HttpParams()
      .set('status', 'published')
      .set('search', query)
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<ContentItem[]>>(`${this.apiUrl}`, { params }).pipe(
      map(response => response.data.map(item => this.mapContentItemToBlogPost(item)))
    );
  }

  private mapContentItemToBlogPost(item: ContentItem): BlogPost {
    return {
      _id: item._id || '',
      title: item.title,
      slug: item.slug,
      category: item.category,
      content: item.content,
      metaDescription: item.metaDescription,
      tags: item.tags,
      wordCount: item.wordCount,
      readingTime: item.readingTime,
      publishedAt: item.publishedAt,
      author: item.author,
      featured: item.featured,
      url: `/blog/${item.category}/${item.slug}`,
      featuredImage: item.featuredImage,
      updatedAt: item.updatedAt
    };
  }

  private getCategories(): BlogCategory[] {
    return [
      {
        id: 'reviews',
        name: 'Product Reviews',
        description: 'In-depth reviews of tennis equipment and gear',
        postCount: 0,
        slug: 'reviews'
      },
      {
        id: 'guides',
        name: 'How-To Guides',
        description: 'Practical guides for improving your tennis game',
        postCount: 0,
        slug: 'guides'
      },
      {
        id: 'philippines',
        name: 'Philippines Tennis',
        description: 'Tennis content specific to Filipino players',
        postCount: 0,
        slug: 'philippines'
      },
      {
        id: 'advanced',
        name: 'Advanced Tennis',
        description: 'Advanced techniques and equipment analysis',
        postCount: 0,
        slug: 'advanced'
      },
      {
        id: 'seasonal',
        name: 'Seasonal & Trending',
        description: 'Latest trends and seasonal tennis content',
        postCount: 0,
        slug: 'seasonal'
      }
    ];
  }

  // Utility methods for templates
  getCategoryDisplayName(categoryId: string): string {
    const category = this.getCategories().find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  }

  getCategoryDescription(categoryId: string): string {
    const category = this.getCategories().find(cat => cat.id === categoryId);
    return category?.description || '';
  }

  formatReadingTime(minutes: number): string {
    if (minutes < 1) return 'Less than 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }

  formatPublishDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  generateBreadcrumbs(category?: string, postTitle?: string): Array<{name: string, url: string}> {
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' }
    ];

    if (category) {
      breadcrumbs.push({
        name: this.getCategoryDisplayName(category),
        url: `/blog/category/${category}`
      });
    }

    if (postTitle) {
      breadcrumbs.push({
        name: postTitle,
        url: '#'
      });
    }

    return breadcrumbs;
  }
}