import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../services/product.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group relative bg-white/90 dark:bg-dark-100/90 backdrop-blur-sm border border-neutral-200/60 dark:border-dark-200/60 overflow-hidden shadow-card hover:shadow-card-hover dark:hover:shadow-strong transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] animate-fade-in-up"
         (click)="onProductClick()">
         
      <!-- Gradient Overlay on Hover -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-green-500/5 dark:from-primary-400/10 dark:to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <!-- Enhanced Product Image Container -->
      <div class="relative aspect-square overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-dark-200/50 dark:to-dark-300/50">
        <!-- Shimmer Loading Effect -->
        <div class="absolute inset-0 bg-shimmer-gradient animate-shimmer opacity-30 dark:opacity-20" *ngIf="!imageLoaded"></div>
        <!-- Enhanced Image with Parallax Effect -->
        <img 
          [src]="getMainImage()" 
          [alt]="product.title" 
          class="w-full h-full object-cover group-hover:scale-125 transition-all duration-700 ease-out filter group-hover:brightness-110 dark:group-hover:brightness-125"
          loading="lazy"
          [class.opacity-0]="!imageLoaded"
          [class.opacity-100]="imageLoaded"
          (load)="imageLoaded = true"
          (error)="onImageError()">
          
        <!-- Image Loading Skeleton -->
        <div *ngIf="!imageLoaded" class="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-dark-300 dark:to-dark-400 animate-pulse"></div>
        
        <!-- Enhanced Image Overlay with Color Shift -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-primary-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        
        <!-- Shine Effect -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
        
        <!-- Enhanced Boosted Badge with Glow Effect -->
        <div *ngIf="product.isBoosted" 
             class="absolute top-4 left-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 text-xs font-bold rounded-2xl shadow-strong backdrop-blur-sm border border-white/30 animate-bounce-gentle z-10">
          <div class="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl animate-glow opacity-50"></div>
          <span class="relative flex items-center gap-2">
            <svg class="w-4 h-4 animate-wiggle" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span class="text-shadow">Boosted</span>
          </span>
        </div>
        
        
        <!-- Heart Favorite Button -->
        <button 
          (click)="onFavoriteClick($event)"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-dark-100/90 backdrop-blur-sm shadow-lg border border-white/30 dark:border-dark-300/30 z-20 transform hover:scale-110 transition-all duration-300 flex items-center justify-center group/heart hover:bg-white dark:hover:bg-dark-100"
          [attr.aria-label]="isFavorited ? 'Remove from favorites' : 'Add to favorites'">
          <svg 
            class="w-5 h-5 transition-all duration-300"
            [class.text-red-500]="isFavorited"
            [class.text-gray-400]="!isFavorited"
            [class.fill-current]="isFavorited"
            [class.scale-125]="isFavorited"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24">
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <!-- Favorite count badge -->
          <div *ngIf="product.favorites && product.favorites > 0" 
               class="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
            {{ formatNumber(product.favorites) }}
          </div>
        </button>

        <!-- Enhanced Quick View Overlay with More Info -->
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-out">
          <div class="space-y-3">
            <!-- Stats Row -->
            <div class="flex items-center justify-between text-white/90 text-sm font-medium">
              <span class="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/20">
                <svg class="w-4 h-4 text-primary-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                </svg>
                {{ formatNumber(product.views || 0) }}
              </span>
              <span class="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/20">
                <svg class="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                </svg>
                {{ formatNumber(product.favorites || 0) }}
              </span>
            </div>
            
          </div>
        </div>
      </div>
      
      <!-- Enhanced Product Info with Better Typography -->
      <div class="relative p-6 space-y-4 bg-white/50 dark:bg-dark-100/50 backdrop-blur-sm">
        <!-- Enhanced Title with Gradient Effect -->
        <h4 class="text-neutral-900 dark:text-dark-900 line-clamp-1 text-xs leading-tight group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-green-600 dark:group-hover:from-primary-400 dark:group-hover:to-green-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300" [title]="product.title">
          {{ product.title }}
        </h4>
        
        <!-- Enhanced Price Display with Animation -->
        <div class="flex items-baseline gap-3">
          <span class="text-sm font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-dark-900 dark:to-dark-800 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:to-green-600 dark:group-hover:from-primary-400 dark:group-hover:to-green-400 transition-all duration-300">{{ formatPrice(product.price) }}</span>
        </div>
        
        <!-- Premium Seller Info Section -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- Seller Icon -->
            <svg class="w-5 h-5 text-neutral-600 dark:text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            
            <div class="min-w-0 flex-1">
              <p class="font-bold text-neutral-800 dark:text-dark-800 text-xs truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors duration-200">{{ getSellerName() }}</p>
            </div>
          </div>
        </div>
        
        <!-- Premium Tags with Hover Effects -->
        <div *ngIf="product.tags && product.tags.length > 0" class="flex flex-wrap gap-2">
          <span *ngFor="let tag of product.tags.slice(0, 3); trackBy: trackByTag" 
                class="group/tag inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-primary-50 to-green-50 dark:from-primary-900/20 dark:to-green-900/20 text-primary-700 dark:text-primary-400 rounded-2xl border border-primary-200/50 dark:border-primary-700/50 hover:from-primary-100 hover:to-green-100 dark:hover:from-primary-800/30 dark:hover:to-green-800/30 hover:scale-105 hover:shadow-soft transition-all duration-200 cursor-pointer">
            <span class="mr-1">{{ getTagIcon(tag) }}</span>
            <span class="group-hover/tag:text-primary-800 dark:group-hover/tag:text-primary-300 transition-colors duration-200">{{ tag }}</span>
          </span>
          <span *ngIf="product.tags.length > 3" 
                class="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-dark-200/50 dark:to-dark-300/50 text-neutral-600 dark:text-dark-700 rounded-2xl border border-neutral-300/50 dark:border-dark-400/50 hover:scale-105 transition-all duration-200 cursor-pointer">
            +{{ product.tags.length - 3 }} more
          </span>
        </div>

        <!-- Location Section -->
        <div class="flex items-center justify-center py-3 bg-neutral-50 dark:bg-dark-200/30 border border-neutral-200/50 dark:border-dark-300/50">
          <span class="text-xs text-neutral-600 dark:text-dark-700 flex items-center gap-2 max-w-full overflow-hidden">
            <svg class="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <span class="truncate">{{ getLocationString() }}</span>
          </span>
        </div>

      </div>

      <!-- Enhanced Card Decorations -->
      <div class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary-500/5 dark:to-primary-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <!-- Premium Sale Badge for Discounted Items -->
      <div *ngIf="product.originalPrice && product.originalPrice > product.price" class="absolute bottom-4 left-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 text-xs font-bold shadow-strong animate-bounce-gentle z-10">
        <span class="flex items-center gap-1">
          <span>🔥</span>
          <span>{{ getDiscountPercentage() }}% OFF</span>
        </span>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-1 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
    }
    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    @media (prefers-reduced-motion: no-preference) {
      .animate-on-hover:hover {
        animation: gentle-bounce 0.6s ease-in-out;
      }
    }
    @keyframes gentle-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() isFavorited = false;
  
  @Output() productClick = new EventEmitter<Product>();
  @Output() favoriteClick = new EventEmitter<{ product: Product, isFavorited: boolean }>();

  imageLoaded = false;

  formatPrice(amount: number): string {
    return `₱${amount.toLocaleString('en-PH')}`;
  }

  getMainImage(): string {
    if (this.product.images && this.product.images.length > 0) {
      return typeof this.product.images[0] === 'string' 
        ? this.product.images[0] 
        : this.product.images[0].url || '';
    }
    return 'https://images.unsplash.com/photo-1542144612-1c93f9eac579?w=400&h=300&fit=crop';
  }

  getSellerName(): string {
    if (!this.product.seller) {
      return 'Unknown Seller';
    }
    if (typeof this.product.seller === 'string') {
      return this.product.seller;
    }
    return `${this.product.seller.firstName || ''} ${this.product.seller.lastName || ''}`.trim() || 'Unknown Seller';
  }

  getSellerRating(): number {
    if (!this.product.seller || typeof this.product.seller === 'string') {
      return 0;
    }
    return this.product.seller.rating?.average || 0;
  }

  getLocationString(): string {
    if (!this.product.location) {
      return 'Location not specified';
    }
    if (typeof this.product.location === 'string') {
      return this.product.location;
    }
    return `${this.product.location.city || ''}, ${this.product.location.region || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') || 'Location not specified';
  }

  getSellerInitial(): string {
    const name = this.getSellerName();
    return name.charAt(0).toUpperCase();
  }

  isSellerVerified(): boolean {
    if (!this.product.seller || typeof this.product.seller === 'string') {
      return false;
    }
    return this.product.seller?.isVerified || false;
  }

  onProductClick(): void {
    this.productClick.emit(this.product);
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation(); // Prevent card click
    
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    this.favoriteClick.emit({ 
      product: this.product, 
      isFavorited: !this.isFavorited 
    });
  }
  
  // New methods for enhanced functionality
  quickView(event: Event): void {
    event.stopPropagation();
    // Emit a custom event for quick view
    console.log('Quick view for product:', this.product.title);
  }
  
  quickContact(event: Event): void {
    event.stopPropagation();
    // Open contact modal or navigate to contact
    console.log('Quick contact for product:', this.product.title);
  }
  
  onImageError(): void {
    // Handle image loading errors with fallback
    console.log('Image failed to load for product:', this.product.title);
  }
  
  // Utility methods for enhanced styling
  getConditionBadgeClass(): string {
    const condition = this.product.condition.toLowerCase();
    switch (condition) {
      case 'new':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'like new':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'excellent':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'good':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
      case 'fair':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700';
      default:
        return 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600';
    }
  }
  
  getConditionDotClass(): string {
    const condition = this.product.condition.toLowerCase();
    switch (condition) {
      case 'new':
        return 'bg-green-500 animate-pulse-soft';
      case 'like new':
        return 'bg-blue-500';
      case 'excellent':
        return 'bg-purple-500';
      case 'good':
        return 'bg-amber-500';
      case 'fair':
        return 'bg-orange-500';
      default:
        return 'bg-neutral-500';
    }
  }
  
  getTagIcon(tag: string): string {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('professional') || tagLower.includes('pro')) return '🏆';
    if (tagLower.includes('power')) return '⚡';
    if (tagLower.includes('control')) return '🎯';
    if (tagLower.includes('spin')) return '🌀';
    if (tagLower.includes('comfort')) return '☁️';
    if (tagLower.includes('wilson')) return '🎾';
    if (tagLower.includes('babolat')) return '🔥';
    if (tagLower.includes('head')) return '💪';
    if (tagLower.includes('yonex')) return '⭐';
    if (tagLower.includes('nike')) return '👟';
    if (tagLower.includes('adidas')) return '🏃';
    return '🏷️';
  }
  
  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  getDiscountPercentage(): number {
    if (!this.product.originalPrice || this.product.originalPrice <= this.product.price) {
      return 0;
    }
    return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
  }
  
  // Performance optimization
  trackByTag(index: number, tag: string): string {
    return tag;
  }
}