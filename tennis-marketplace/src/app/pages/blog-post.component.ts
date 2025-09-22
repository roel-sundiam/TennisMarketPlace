import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { BlogService, BlogPost } from '../services/blog.service';
import { AffiliateService } from '../services/affiliate.service';

declare let gtag: Function;

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
          <!-- Top of Content Ad (High Performance) -->
          <div class="mb-8 text-center">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-1039076031231406"
                 data-ad-slot="1234567890"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>

          <div class="prose prose-lg max-w-none" [innerHTML]="getContentWithMidAds()"></div>
          
          <!-- Social Share Section -->
          <div class="border-t border-gray-200 pt-8 mt-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
            <div class="flex flex-wrap gap-3">
              <button (click)="shareOnFacebook()" 
                      class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              
              <button (click)="shareOnTwitter()" 
                      class="flex items-center px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </button>
              
              <button (click)="shareOnLinkedIn()" 
                      class="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </button>
              
              <button (click)="copyLink()" 
                      class="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copy Link
              </button>
              
              <button (click)="shareOnWhatsApp()" 
                      class="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp
              </button>
            </div>
          </div>
          
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

        <!-- Affiliate Product Recommendations -->
        <section class="bg-gradient-to-r from-green-50 to-blue-50 px-4 sm:px-6 lg:px-8 py-8">
          <div class="max-w-3xl mx-auto">
            <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg class="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
              </svg>
              {{ getRecommendationTitle() }}
            </h3>
            
            <!-- Dynamic affiliate product recommendations -->
            <div *ngFor="let link of getAffiliateRecommendations()" class="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-4">
              <div class="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div class="flex-shrink-0">
                  <div class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span class="text-gray-500 text-xs">{{ getCategoryIcon(link.category) }}</span>
                  </div>
                </div>
                <div class="flex-grow">
                  <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ link.name }}</h4>
                  <p class="text-gray-600 text-sm mb-3">{{ link.description }}</p>
                  <div class="flex items-center space-x-4 mb-3">
                    <span class="text-lg font-bold text-green-600">View Product</span>
                    <span class="text-sm text-gray-500">{{ link.commissionRate }}% commission</span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <a [href]="getTrackedAffiliateLink(link.id)" 
                       target="_blank"
                       rel="noopener noreferrer nofollow"
                       (click)="trackAffiliateClick(link.id)"
                       class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                      Check Price
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="text-xs text-gray-500 text-center" [innerHTML]="getAffiliateDisclosure()">
            </div>
          </div>
        </section>

        <!-- Newsletter Signup -->
        <section class="bg-white border-t border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-12">
          <div class="max-w-2xl mx-auto text-center">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Get More Tennis Tips</h3>
            <p class="text-gray-600 mb-6">Join our newsletter for weekly tennis equipment reviews, playing tips, and exclusive deals for Filipino players.</p>
            <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" 
                     placeholder="Enter your email" 
                     class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
              <button class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                Subscribe
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </section>

        <!-- Bottom Content Ad -->
        <section class="bg-white px-4 sm:px-6 lg:px-8 py-8">
          <div class="max-w-3xl mx-auto text-center">
            <p class="text-xs text-gray-500 mb-2">Advertisement</p>
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-1039076031231406"
                 data-ad-slot="2345678901"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>
        </section>

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
  private affiliateService = inject(AffiliateService);

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
          this.initializeAds();
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

    // Enhanced structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": this.post.title,
      "description": this.post.metaDescription,
      "image": this.post.featuredImage || "https://tennis-marketplace.netlify.app/assets/default-blog-image.jpg",
      "author": {
        "@type": "Person",
        "name": this.post.author,
        "url": "https://tennis-marketplace.netlify.app/about"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Tennis Marketplace Philippines",
        "logo": {
          "@type": "ImageObject",
          "url": "https://tennis-marketplace.netlify.app/assets/logo.png",
          "width": 200,
          "height": 200
        },
        "url": "https://tennis-marketplace.netlify.app"
      },
      "datePublished": this.post.publishedAt,
      "dateModified": this.post.updatedAt || this.post.publishedAt,
      "wordCount": this.post.wordCount,
      "timeRequired": `PT${this.post.readingTime}M`,
      "keywords": this.post.tags.join(", "),
      "articleSection": this.getCategoryName(this.post.category),
      "inLanguage": "en-PH",
      "audience": {
        "@type": "Audience",
        "audienceType": "Tennis Players",
        "geographicArea": "Philippines"
      },
      "about": [
        {
          "@type": "Thing",
          "name": "Tennis Equipment",
          "sameAs": "https://en.wikipedia.org/wiki/Tennis_equipment"
        },
        {
          "@type": "Thing", 
          "name": "Tennis",
          "sameAs": "https://en.wikipedia.org/wiki/Tennis"
        }
      ],
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      },
      "url": window.location.href,
      "isPartOf": {
        "@type": "Blog",
        "name": "Tennis Marketplace Blog",
        "url": "https://tennis-marketplace.netlify.app/blog"
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

  // Affiliate integration methods
  getAffiliateRecommendations() {
    if (!this.post) return [];
    
    // Map blog categories to affiliate product categories
    const categoryMap: {[key: string]: string} = {
      'reviews': 'rackets',
      'guides': 'accessories',
      'philippines': 'shoes',
      'advanced': 'strings',
      'seasonal': 'apparel'
    };
    
    const affiliateCategory = categoryMap[this.post.category] || 'rackets';
    return this.affiliateService.getAffiliateLinks(affiliateCategory).slice(0, 2);
  }

  getRecommendationTitle(): string {
    if (!this.post) return 'Our Recommendations';
    
    const categoryTitles: {[key: string]: string} = {
      'reviews': 'Featured Products',
      'guides': 'Essential Gear',
      'philippines': 'Local Favorites',
      'advanced': 'Pro Equipment',
      'seasonal': 'Trending Now'
    };
    
    return categoryTitles[this.post.category] || 'Our Recommendations';
  }

  getCategoryIcon(category: string): string {
    const icons: {[key: string]: string} = {
      'rackets': '🏸',
      'shoes': '👟',
      'strings': '🧵',
      'accessories': '⚡',
      'apparel': '👕',
      'bags': '🎒',
      'training': '🏃',
      'education': '📚'
    };
    
    return icons[category] || '🎾';
  }

  getTrackedAffiliateLink(linkId: string): string {
    return this.affiliateService.getTrackedAffiliateLink(linkId, `blog-post-${this.post?.category}`);
  }

  trackAffiliateClick(linkId: string): void {
    this.affiliateService.trackAffiliateClick(linkId, `blog-post-${this.post?.category}`);
  }

  getAffiliateDisclosure(): string {
    return this.affiliateService.getAffiliateDisclosure();
  }

  // AdSense optimization methods
  getContentWithMidAds(): string {
    if (!this.post?.content) return '';
    
    const content = this.post.content;
    const paragraphs = content.split('</p>');
    
    // Insert ad after every 3-4 paragraphs in long articles
    if (paragraphs.length > 6) {
      const midPoint = Math.floor(paragraphs.length / 2);
      
      const adHtml = `
        <div class="my-8 text-center">
          <p class="text-xs text-gray-500 mb-2">Advertisement</p>
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="ca-pub-1039076031231406"
               data-ad-slot="3456789012"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </div>
      `;
      
      paragraphs.splice(midPoint, 0, adHtml);
    }
    
    return paragraphs.join('</p>');
  }

  private initializeAds(): void {
    try {
      // Initialize AdSense ads after content loads
      setTimeout(() => {
        if (typeof (window as any).adsbygoogle !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        }
      }, 100);
    } catch (error) {
      console.error('AdSense initialization error:', error);
    }
  }

  // Social sharing methods
  shareOnFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  shareOnTwitter(): void {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.post?.title || '');
    const hashtags = 'tennis,philippines,tennismarketplace';
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}&hashtags=${hashtags}`, '_blank');
  }

  shareOnLinkedIn(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }

  shareOnWhatsApp(): void {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.post?.title || '');
    window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Show success notification - you can replace this with a proper toast notification
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  }
}