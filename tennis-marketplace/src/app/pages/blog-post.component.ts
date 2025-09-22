import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { BlogService, BlogPost } from '../services/blog.service';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>

      <!-- Blog Post Content -->
      <div *ngIf="!loading && post" class="max-w-4xl mx-auto">
        <!-- Breadcrumbs -->
        <nav class="flex py-4 px-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
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

        <!-- Article Header -->
        <header class="bg-white shadow-sm px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex items-center justify-between mb-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {{ getCategoryName(post.category) }}
            </span>
            <span *ngIf="post.featured" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Featured
            </span>
          </div>
          
          <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl leading-tight mb-4">
            {{ post.title }}
          </h1>
          
          <p class="text-xl text-gray-600 mb-6 leading-relaxed">
            {{ post.metaDescription }}
          </p>
          
          <div class="flex items-center text-sm text-gray-500 space-x-4">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>{{ post.author }}</span>
            </div>
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <time [dateTime]="post.publishedAt">{{ formatDate(post.publishedAt) }}</time>
            </div>
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{{ formatReadingTime(post.readingTime) }}</span>
            </div>
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>{{ post.wordCount.toLocaleString() }} words</span>
            </div>
          </div>
        </header>

        <!-- Article Content -->
        <main class="bg-white px-4 sm:px-6 lg:px-8 py-8">
          <div class="prose prose-lg max-w-none" [innerHTML]="post.content"></div>
          
          <!-- Tags -->
          <div *ngIf="post.tags.length > 0" class="mt-8 pt-8 border-t border-gray-200">
            <h3 class="text-sm font-medium text-gray-500 mb-3">Tags</h3>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let tag of post.tags" 
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {{ tag }}
              </span>
            </div>
          </div>
        </main>

        <!-- Related Posts -->
        <section *ngIf="relatedPosts.length > 0" class="bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">Related Posts</h2>
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <article *ngFor="let relatedPost of relatedPosts" 
                     class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div class="p-6">
                <div class="flex items-center mb-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {{ getCategoryName(relatedPost.category) }}
                  </span>
                  <span class="ml-2 text-xs text-gray-500">{{ formatDate(relatedPost.publishedAt) }}</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                  <a [routerLink]="['/blog', relatedPost.category, relatedPost.slug]" 
                     class="hover:text-green-600 transition-colors">
                    {{ relatedPost.title }}
                  </a>
                </h3>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ relatedPost.metaDescription }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">{{ formatReadingTime(relatedPost.readingTime) }}</span>
                  <a [routerLink]="['/blog', relatedPost.category, relatedPost.slug]" 
                     class="text-green-600 hover:text-green-700 font-medium text-xs">
                    Read more →
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Back to Blog -->
        <div class="px-4 sm:px-6 lg:px-8 py-8">
          <a [routerLink]="['/blog']" 
             class="inline-flex items-center text-green-600 hover:text-green-700 font-medium">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Blog
          </a>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && !post" class="flex flex-col items-center justify-center min-h-screen px-4">
        <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
        <p class="text-gray-600 mb-6 text-center max-w-md">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <a [routerLink]="['/blog']" 
           class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
          Browse All Posts
        </a>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .prose {
      color: #374151;
      line-height: 1.75;
    }
    
    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
      color: #111827;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    .prose h1 { font-size: 2.25rem; }
    .prose h2 { font-size: 1.875rem; }
    .prose h3 { font-size: 1.5rem; }
    
    .prose p {
      margin: 1.25rem 0;
    }
    
    .prose ul, .prose ol {
      margin: 1.25rem 0;
      padding-left: 1.5rem;
    }
    
    .prose li {
      margin: 0.5rem 0;
    }
    
    .prose strong {
      font-weight: 600;
      color: #111827;
    }
    
    .prose em {
      font-style: italic;
    }
    
    .prose blockquote {
      border-left: 4px solid #16a34a;
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      background-color: #f0fdf4;
      padding: 1rem;
      border-radius: 0.375rem;
    }
    
    .prose code {
      background-color: #f3f4f6;
      padding: 0.25rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-family: 'Courier New', monospace;
    }
    
    .prose pre {
      background-color: #1f2937;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    
    .prose a {
      color: #16a34a;
      text-decoration: underline;
    }
    
    .prose a:hover {
      color: #15803d;
    }
  `]
})
export class BlogPostComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private blogService = inject(BlogService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  post: BlogPost | null = null;
  relatedPosts: BlogPost[] = [];
  loading = true;
  breadcrumbs: Array<{name: string, url: string}> = [];

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const slug = params['slug'];
        if (slug) {
          this.loadPost(slug);
        } else {
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPost(slug: string): void {
    this.loading = true;
    
    this.blogService.getBlogPost(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (post) => {
          this.post = post;
          this.loading = false;
          this.setupSEO();
          this.updateBreadcrumbs();
          this.loadRelatedPosts();
        },
        error: (error) => {
          console.error('Error loading post:', error);
          this.loading = false;
          this.post = null;
        }
      });
  }

  private loadRelatedPosts(): void {
    if (!this.post) return;

    this.blogService.getRelatedPosts(this.post.category, this.post.slug, 3)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          this.relatedPosts = posts;
        },
        error: (error) => {
          console.error('Error loading related posts:', error);
        }
      });
  }

  private setupSEO(): void {
    if (!this.post) return;

    // Set page title
    this.titleService.setTitle(`${this.post.title} | Tennis Marketplace Blog`);

    // Set meta tags
    this.metaService.updateTag({ name: 'description', content: this.post.metaDescription });
    this.metaService.updateTag({ name: 'keywords', content: this.post.tags.join(', ') });
    this.metaService.updateTag({ property: 'og:title', content: this.post.title });
    this.metaService.updateTag({ property: 'og:description', content: this.post.metaDescription });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'article:author', content: this.post.author });
    this.metaService.updateTag({ property: 'article:published_time', content: this.post.publishedAt.toString() });
    this.metaService.updateTag({ property: 'article:section', content: this.getCategoryName(this.post.category) });
    this.metaService.updateTag({ property: 'article:tag', content: this.post.tags.join(', ') });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });

    // Structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": this.post.title,
      "description": this.post.metaDescription,
      "author": {
        "@type": "Organization",
        "name": this.post.author
      },
      "datePublished": this.post.publishedAt,
      "wordCount": this.post.wordCount,
      "keywords": this.post.tags,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://tennis-marketplace.com${this.post.url}`
      },
      "publisher": {
        "@type": "Organization",
        "name": "Tennis Marketplace",
        "url": "https://tennis-marketplace.com"
      }
    };

    // Remove any existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  private updateBreadcrumbs(): void {
    if (!this.post) return;
    
    this.breadcrumbs = this.blogService.generateBreadcrumbs(
      this.post.category, 
      this.post.title
    );
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