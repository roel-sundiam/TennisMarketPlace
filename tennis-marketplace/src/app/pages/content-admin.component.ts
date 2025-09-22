import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { ContentService, ContentItem, ContentStats, LoadFromFilesResponse } from '../services/content.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-content-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-4">
              <button 
                (click)="goBack()"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Admin
              </button>
              <h1 class="text-2xl font-bold text-gray-900">Content Management</h1>
            </div>
            <div class="flex items-center space-x-3">
              <button 
                (click)="loadFromFiles()"
                [disabled]="loading"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                {{ loading ? 'Loading...' : 'Load from Files' }}
              </button>
              <button 
                (click)="refreshStats()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Success/Error Messages -->
        <div *ngIf="successMessage" class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          <span class="block sm:inline">{{ successMessage }}</span>
          <button (click)="successMessage = ''" class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg class="fill-current h-6 w-6 text-green-500" role="button" viewBox="0 0 20 20">
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>

        <div *ngIf="errorMessage" class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span class="block sm:inline">{{ errorMessage }}</span>
          <button (click)="errorMessage = ''" class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg class="fill-current h-6 w-6 text-red-500" role="button" viewBox="0 0 20 20">
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>

        <!-- Statistics Dashboard -->
        <div *ngIf="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ stats.overview.total }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Published</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ stats.overview.published }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Draft</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ stats.overview.draft }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Total Words</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ formatNumber(stats.overview.totalWords) }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Categories Stats -->
        <div *ngIf="stats" class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Content by Category</h3>
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul class="divide-y divide-gray-200">
              <li *ngFor="let cat of stats.byCategory" class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <span [class]="getCategoryColor(cat._id)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ getCategoryDisplayName(cat._id) }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-900 font-medium">
                    {{ cat.count }} {{ cat.count === 1 ? 'post' : 'posts' }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white shadow sm:rounded-lg mb-6">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Filter Content</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label for="category-filter" class="block text-sm font-medium text-gray-700">Category</label>
                <select 
                  id="category-filter"
                  [(ngModel)]="filters.category" 
                  (ngModelChange)="applyFilters()"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md">
                  <option value="">All Categories</option>
                  <option value="reviews">Product Reviews</option>
                  <option value="guides">How-To Guides</option>
                  <option value="philippines">Philippines-Specific</option>
                  <option value="advanced">Advanced Tennis</option>
                  <option value="seasonal">Seasonal & Trending</option>
                </select>
              </div>
              <div>
                <label for="status-filter" class="block text-sm font-medium text-gray-700">Status</label>
                <select 
                  id="status-filter"
                  [(ngModel)]="filters.status" 
                  (ngModelChange)="applyFilters()"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md">
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label for="search-filter" class="block text-sm font-medium text-gray-700">Search</label>
                <input 
                  id="search-filter"
                  type="text" 
                  [(ngModel)]="filters.search" 
                  (ngModelChange)="applyFilters()"
                  placeholder="Search titles and content..."
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
            </div>
          </div>
        </div>

        <!-- Content List -->
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              Content Library 
              <span class="text-sm text-gray-500" *ngIf="pagination">
                ({{ pagination.totalItems }} total)
              </span>
            </h3>
          </div>
          
          <div *ngIf="loading" class="px-6 py-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p class="mt-2 text-sm text-gray-500">Loading content...</p>
          </div>

          <ul *ngIf="!loading && content.length > 0" class="divide-y divide-gray-200">
            <li *ngFor="let item of content" class="px-6 py-4 hover:bg-gray-50">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-3 mb-2">
                    <span [class]="getCategoryColor(item.category)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ getCategoryDisplayName(item.category) }}
                    </span>
                    <span [class]="getPriorityColor(item.priority)" class="text-xs font-medium">
                      {{ item.priority?.toUpperCase() }}
                    </span>
                    <span class="text-xs text-gray-500">{{ getStatusDisplayName(item.status) }}</span>
                    <span *ngIf="item.featured" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  </div>
                  <h4 class="text-lg font-medium text-gray-900 truncate">{{ item.title }}</h4>
                  <p class="text-sm text-gray-600 mt-1">{{ item.metaDescription }}</p>
                  <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{{ formatWordCount(item.wordCount) }}</span>
                    <span>{{ formatReadingTime(item.readingTime) }}</span>
                    <span>{{ formatDate(item.publishedAt) }}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2 ml-4">
                  <button 
                    (click)="viewContent(item)"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    View
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <div *ngIf="!loading && content.length === 0" class="px-6 py-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No content found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your filters or load content from files.</p>
          </div>

          <!-- Pagination -->
          <div *ngIf="pagination && pagination.totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button 
                (click)="previousPage()"
                [disabled]="!pagination.hasPrev"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                Previous
              </button>
              <button 
                (click)="nextPage()"
                [disabled]="!pagination.hasNext"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                Next
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing page {{ pagination.currentPage }} of {{ pagination.totalPages }} 
                  ({{ pagination.totalItems }} total items)
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button 
                    (click)="previousPage()"
                    [disabled]="!pagination.hasPrev"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    Previous
                  </button>
                  <button 
                    (click)="nextPage()"
                    [disabled]="!pagination.hasNext"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Content Preview -->
        <div *ngIf="stats && stats.recent.length > 0" class="mt-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Content</h3>
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul class="divide-y divide-gray-200">
              <li *ngFor="let item of stats.recent" class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ item.title }}</p>
                    <p class="text-sm text-gray-500">{{ getCategoryDisplayName(item.category) }} • {{ formatWordCount(item.wordCount) }}</p>
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatDate(item.publishedAt) }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Content Viewer Modal -->
      <div *ngIf="selectedContent" class="fixed inset-0 z-50 overflow-y-auto" (click)="closeModal($event)">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">{{ selectedContent.title }}</h3>
              <button (click)="selectedContent = null" class="text-gray-400 hover:text-gray-600">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="prose max-w-none max-h-96 overflow-y-auto">
              <pre class="whitespace-pre-wrap text-sm text-gray-700">{{ selectedContent.content }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prose pre {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      line-height: 1.5;
    }
  `]
})
export class ContentAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private contentService = inject(ContentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private metaService = inject(Meta);

  content: ContentItem[] = [];
  stats: ContentStats | null = null;
  selectedContent: ContentItem | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';

  filters = {
    category: '',
    status: '',
    search: '',
    page: 1,
    limit: 20
  };

  pagination: any = null;

  ngOnInit(): void {
    this.setupAdminSEO();
    this.checkAuth();
    this.loadStats();
    this.loadContent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAdminSEO(): void {
    // Add noindex meta tag to prevent admin pages from being indexed
    this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  private checkAuth(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }
  }

  loadFromFiles(): void {
    if (this.loading) return;
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.contentService.loadFromFiles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LoadFromFilesResponse) => {
          this.loading = false;
          if (response.success) {
            this.successMessage = `Successfully loaded ${response.loadedCount} content items from files.`;
            if (response.errors.length > 0) {
              this.successMessage += ` ${response.errors.length} errors occurred.`;
            }
            this.loadStats();
            this.loadContent();
          } else {
            this.errorMessage = 'Failed to load content from files.';
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error loading from files:', error);
          this.errorMessage = 'Error loading content from files. Please try again.';
        }
      });
  }

  loadStats(): void {
    this.contentService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.stats = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  loadContent(): void {
    this.loading = true;
    this.contentService.getAllContent(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.content = response.data;
            this.pagination = response.pagination;
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error loading content:', error);
          this.errorMessage = 'Error loading content. Please try again.';
        }
      });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadContent();
  }

  refreshStats(): void {
    this.loadStats();
    this.loadContent();
  }

  viewContent(item: ContentItem): void {
    this.selectedContent = item;
  }

  closeModal(event: Event): void {
    if (event.target === event.currentTarget) {
      this.selectedContent = null;
    }
  }

  nextPage(): void {
    if (this.pagination?.hasNext) {
      this.filters.page++;
      this.loadContent();
    }
  }

  previousPage(): void {
    if (this.pagination?.hasPrev) {
      this.filters.page--;
      this.loadContent();
    }
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  // Helper methods
  getCategoryDisplayName(category: string): string {
    return this.contentService.getCategoryDisplayName(category);
  }

  getStatusDisplayName(status: string): string {
    return this.contentService.getStatusDisplayName(status);
  }

  getPriorityColor(priority: string): string {
    return this.contentService.getPriorityColor(priority);
  }

  getCategoryColor(category: string): string {
    return this.contentService.getCategoryColor(category);
  }

  formatReadingTime(minutes: number): string {
    return this.contentService.formatReadingTime(minutes);
  }

  formatWordCount(count: number): string {
    return this.contentService.formatWordCount(count);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}