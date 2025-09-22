import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { BlogService, BlogPost, BlogCategory } from '../services/blog.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- SEO optimized header -->
      <div class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">
              {{ pageTitle }}
            </h1>
            <p class="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              {{ pageDescription }}
            </p>
          </div>

          <!-- Breadcrumbs -->
          <nav class="flex mt-6" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-3">
              <li *ngFor="let crumb of breadcrumbs; let last = last" class="inline-flex items-center">
                <a *ngIf="!last" [routerLink]="crumb.url" 
                   class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-green-600">
                  {{ crumb.name }}
                </a>
                <span *ngIf="last" class="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  {{ crumb.name }}
                </span>
                <svg *ngIf="!last" class="w-6 h-6 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                </svg>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Categories Filter -->
        <div class="mb-8">
          <div class="flex flex-wrap gap-3">
            <button 
              (click)="filterByCategory('')"
              [class]="selectedCategory === '' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-green-50'"
              class="px-4 py-2 rounded-lg border border-gray-300 transition-colors">
              All Posts
            </button>
            <button 
              *ngFor="let category of categories"
              (click)="filterByCategory(category.id)"
              [class]="selectedCategory === category.id ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-green-50'"
              class="px-4 py-2 rounded-lg border border-gray-300 transition-colors">
              {{ category.name }}
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="mb-8">
          <div class="max-w-md">
            <label for="search" class="sr-only">Search posts</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                id="search"
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
                placeholder="Search posts..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500">
            </div>
          </div>
        </div>

        <!-- Featured Posts (only on main blog page) -->
        <div *ngIf="selectedCategory === '' && !searchQuery && featuredPosts.length > 0" class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Featured Posts</h2>
          <div class="grid gap-6 lg:grid-cols-3">
            <article *ngFor="let post of featuredPosts" 
                     class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div class="p-6">
                <div class="flex items-center mb-3">
                  <span class="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {{ getCategoryName(post.category) }}
                  </span>
                  <span class="ml-2 text-sm text-gray-500">{{ formatDate(post.publishedAt) }}</span>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">
                  <a [routerLink]="['/blog', post.category, post.slug]" 
                     class="hover:text-green-600 transition-colors">
                    {{ post.title }}
                  </a>
                </h3>
                <p class="text-gray-600 mb-4 line-clamp-3">{{ post.metaDescription }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">{{ formatReadingTime(post.readingTime) }}</span>
                  <a [routerLink]="['/blog', post.category, post.slug]" 
                     class="text-green-600 hover:text-green-700 font-medium text-sm">
                    Read more →
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- All Posts -->
        <div>
          <h2 *ngIf="selectedCategory === '' && !searchQuery" class="text-2xl font-bold text-gray-900 mb-6">All Posts</h2>
          <h2 *ngIf="selectedCategory && !searchQuery" class="text-2xl font-bold text-gray-900 mb-6">
            {{ getCategoryName(selectedCategory) }}
          </h2>
          <h2 *ngIf="searchQuery" class="text-2xl font-bold text-gray-900 mb-6">
            Search Results for "{{ searchQuery }}"
          </h2>

          <!-- Loading State -->
          <div *ngIf="loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>

          <!-- Posts Grid -->
          <div *ngIf="!loading && posts.length > 0" class="grid gap-8 lg:grid-cols-2">
            <article *ngFor="let post of posts" 
                     class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div class="p-6">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center">
                    <span class="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {{ getCategoryName(post.category) }}
                    </span>
                    <span *ngIf="post.featured" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  </div>
                  <time [dateTime]="post.publishedAt" class="text-sm text-gray-500">
                    {{ formatDate(post.publishedAt) }}
                  </time>
                </div>
                
                <h3 class="text-xl font-semibold text-gray-900 mb-3">
                  <a [routerLink]="['/blog', post.category, post.slug]" 
                     class="hover:text-green-600 transition-colors">
                    {{ post.title }}
                  </a>
                </h3>
                
                <p class="text-gray-600 mb-4 line-clamp-3">{{ post.metaDescription }}</p>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center text-sm text-gray-500">
                    <span>{{ post.author }}</span>
                    <span class="mx-2">•</span>
                    <span>{{ formatReadingTime(post.readingTime) }}</span>
                    <span class="mx-2">•</span>
                    <span>{{ post.wordCount.toLocaleString() }} words</span>
                  </div>
                  <a [routerLink]="['/blog', post.category, post.slug]" 
                     class="text-green-600 hover:text-green-700 font-medium text-sm inline-flex items-center">
                    Read more
                    <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          </div>

          <!-- No Results -->
          <div *ngIf="!loading && posts.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ searchQuery ? 'Try adjusting your search terms.' : 'Check back later for new content.' }}
            </p>
          </div>

          <!-- Pagination -->
          <div *ngIf="pagination && pagination.totalPages > 1" class="mt-12 flex justify-center">
            <nav class="inline-flex rounded-md shadow-sm -space-x-px">
              <button 
                (click)="goToPage(pagination.currentPage - 1)"
                [disabled]="!pagination.hasPrev"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              
              <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
              </span>
              
              <button 
                (click)="goToPage(pagination.currentPage + 1)"
                [disabled]="!pagination.hasNext"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class BlogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private blogService = inject(BlogService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  posts: BlogPost[] = [];
  featuredPosts: BlogPost[] = [];
  categories: BlogCategory[] = [];
  selectedCategory = '';
  searchQuery = '';
  loading = false;
  pagination: any = null;
  breadcrumbs: Array<{name: string, url: string}> = [];

  // SEO properties
  pageTitle = 'Tennis Blog - Reviews, Guides & Tips';
  pageDescription = 'Expert tennis content including equipment reviews, playing guides, and tips specifically for Filipino tennis players. Improve your game with our comprehensive tennis resources.';

  ngOnInit(): void {
    this.setupSEO();
    this.loadInitialData();
    this.watchRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSEO(): void {
    // Set page title
    this.titleService.setTitle(this.pageTitle);

    // Set meta tags
    this.metaService.updateTag({ name: 'description', content: this.pageDescription });
    this.metaService.updateTag({ name: 'keywords', content: 'tennis, equipment reviews, tennis guides, Philippines tennis, tennis tips, tennis gear' });
    this.metaService.updateTag({ property: 'og:title', content: this.pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: this.pageDescription });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });

    // Structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Tennis Marketplace Blog",
      "description": this.pageDescription,
      "url": "https://tennis-marketplace.com/blog",
      "author": {
        "@type": "Organization",
        "name": "Tennis Marketplace"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  private loadInitialData(): void {
    // Load featured posts
    this.blogService.getFeaturedPosts(3)
      .pipe(takeUntil(this.destroy$))
      .subscribe(posts => {
        this.featuredPosts = posts;
      });

    // Load initial posts
    this.loadPosts();
  }

  private watchRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.selectedCategory = params['category'] || '';
        this.searchQuery = params['search'] || '';
        this.loadPosts();
        this.updateBreadcrumbs();
      });
  }

  private loadPosts(): void {
    this.loading = true;
    
    const filters: any = {};
    if (this.selectedCategory) filters.category = this.selectedCategory;
    if (this.searchQuery) filters.search = this.searchQuery;

    this.blogService.getBlogPosts(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.posts = response.posts;
          this.pagination = response.pagination;
          this.categories = response.categories;
          this.loading = false;
          this.updatePageTitle();
        },
        error: (error) => {
          console.error('Error loading posts:', error);
          this.loading = false;
        }
      });
  }

  private updatePageTitle(): void {
    if (this.searchQuery) {
      this.pageTitle = `Search Results for "${this.searchQuery}" - Tennis Blog`;
      this.pageDescription = `Search results for "${this.searchQuery}" in our tennis blog. Find equipment reviews, guides, and tips.`;
    } else if (this.selectedCategory) {
      const categoryName = this.getCategoryName(this.selectedCategory);
      this.pageTitle = `${categoryName} - Tennis Blog`;
      this.pageDescription = `${categoryName} for tennis players. Expert content and advice for improving your tennis game.`;
    } else {
      this.pageTitle = 'Tennis Blog - Reviews, Guides & Tips';
      this.pageDescription = 'Expert tennis content including equipment reviews, playing guides, and tips specifically for Filipino tennis players.';
    }

    this.titleService.setTitle(this.pageTitle);
    this.metaService.updateTag({ name: 'description', content: this.pageDescription });
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = this.blogService.generateBreadcrumbs(this.selectedCategory);
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.router.navigate(['/blog'], { 
      queryParams: category ? { category } : {},
      queryParamsHandling: 'merge'
    });
  }

  onSearchChange(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/blog'], { 
        queryParams: { search: this.searchQuery.trim() },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate(['/blog'], { 
        queryParams: { search: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  goToPage(page: number): void {
    this.router.navigate(['/blog'], { 
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  getCategoryName(categoryId: string): string {
    return this.blogService.getCategoryDisplayName(categoryId);
  }

  formatDate(date: Date | string): string {
    return this.blogService.formatPublishDate(date);
  }

  formatReadingTime(minutes: number): string {
    return this.blogService.formatReadingTime(minutes);
  }
}