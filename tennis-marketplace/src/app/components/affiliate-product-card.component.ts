import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

declare let gtag: Function;

export interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  localBuyUrl?: string;
  affiliateUrl: string;
  affiliateLabel: string;
  category: string;
  tags: string[];
  featured?: boolean;
}

@Component({
  selector: 'app-affiliate-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
      <div class="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
        <div class="flex-shrink-0">
          <img [src]="product.imageUrl" [alt]="product.name" 
               class="w-24 h-24 object-cover rounded-lg bg-gray-100"
               (error)="onImageError($event)">
        </div>
        
        <div class="flex-grow">
          <div class="flex items-center gap-2 mb-2">
            <h4 class="text-lg font-semibold text-gray-900">{{ product.name }}</h4>
            <span *ngIf="product.featured" 
                  class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
              ⭐ Top Pick
            </span>
          </div>
          
          <p class="text-gray-600 text-sm mb-3">{{ product.description }}</p>
          
          <div class="flex items-center space-x-4 mb-3">
            <span class="text-2xl font-bold text-green-600">
              {{ product.currency }}{{ product.price | number:'1.0-0' }}
            </span>
            <div class="flex items-center" *ngIf="product.rating > 0">
              <div class="flex text-yellow-400">
                <svg *ngFor="let star of getStarArray()" 
                     class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
              </div>
              <span class="ml-1 text-sm text-gray-600">({{ product.rating }}/5)</span>
              <span class="ml-2 text-xs text-gray-500" *ngIf="product.reviewCount > 0">
                {{ product.reviewCount }} reviews
              </span>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2 mb-4">
            <span *ngFor="let tag of product.tags.slice(0, 3)" 
                  class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {{ tag }}
            </span>
          </div>
          
          <div class="flex flex-wrap gap-2">
            <a *ngIf="product.localBuyUrl" 
               [href]="product.localBuyUrl" 
               class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              Buy Local
            </a>
            
            <a [href]="product.affiliateUrl" 
               target="_blank" 
               rel="noopener noreferrer nofollow"
               (click)="trackAffiliateClick()"
               class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              {{ product.affiliateLabel }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AffiliateProductCardComponent {
  @Input() product!: AffiliateProduct;

  getStarArray(): number[] {
    return Array(Math.floor(this.product.rating)).fill(0);
  }

  onImageError(event: any): void {
    event.target.style.backgroundColor = '#f3f4f6';
    event.target.style.display = 'flex';
    event.target.style.alignItems = 'center';
    event.target.style.justifyContent = 'center';
    event.target.innerHTML = '<span class="text-gray-500 text-xs">Image</span>';
  }

  trackAffiliateClick(): void {
    // Track affiliate link clicks for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'affiliate_click', {
        'product_name': this.product.name,
        'product_category': this.product.category,
        'affiliate_partner': this.product.affiliateLabel,
        'product_price': this.product.price
      });
    }
    
    console.log('Affiliate click tracked:', {
      product: this.product.name,
      partner: this.product.affiliateLabel,
      price: this.product.price
    });
  }
}