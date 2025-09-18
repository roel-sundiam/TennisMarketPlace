import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductCardComponent } from '../components/product-card.component';
import { Product, ProductService } from '../services/product.service';
import { PriceComponent } from '../components/price.component';
import { ModalService } from '../services/modal.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

interface ProductDetail extends Product {
  model?: string;
  specifications: {
    [key: string]: string;
  };
  reasonForSelling?: string;
  shippingOptions: {
    meetup: boolean;
    delivery: boolean;
    shipping: boolean;
  };
}

interface Seller {
  id: string;
  name: string;
  rating: number;
  totalReviews: number;
  responseTime: string;
  isVerified: boolean;
  memberSince: string;
  location: string;
  phone: string;
  activeListings: number;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductCardComponent, PriceComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Breadcrumb Navigation -->
      <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <nav class="flex text-sm text-gray-600">
            <a routerLink="/" class="hover:text-green-600">Home</a>
            <span class="mx-2">/</span>
            <a routerLink="/browse" class="hover:text-green-600">Browse</a>
            <span class="mx-2">/</span>
            <span class="text-gray-900 font-medium line-clamp-1">{{ product()?.title }}</span>
          </nav>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-8">
        <div *ngIf="product(); else productNotFound" class="lg:grid lg:grid-cols-12 lg:gap-8">
          <!-- Product Images -->
          <div class="lg:col-span-7">
            <div class="space-y-4">
              <!-- Main Image -->
              <div class="relative">
                <img 
                  [src]="selectedImage()" 
                  [alt]="product()!.title"
                  (click)="openImageZoom(selectedImage())"
                  class="w-full h-96 lg:h-[500px] object-cover rounded-2xl bg-gray-100 cursor-zoom-in">
                
                <!-- Boosted Badge -->
                <div *ngIf="product()!.isBoosted" class="absolute top-4 left-4">
                  <span class="bg-green-600 text-white px-3 py-1 text-sm rounded-full font-semibold">
                    ⭐ Boosted Listing
                  </span>
                </div>

                <!-- Image Counter -->
                <div class="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {{ currentImageIndex() + 1 }} / {{ product()!.images.length }}
                </div>

                <!-- Navigation Arrows -->
                <button 
                  *ngIf="product()!.images.length > 1"
                  (click)="previousImage()"
                  class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button 
                  *ngIf="product()!.images.length > 1"
                  (click)="nextImage()"
                  class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              <!-- Image Thumbnails -->
              <div *ngIf="product()!.images.length > 1" class="flex gap-2 overflow-x-auto pb-2">
                <button 
                  *ngFor="let image of product()!.images; let i = index"
                  (click)="selectImage(i)"
                  [class]="i === currentImageIndex() ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-300'"
                  class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all">
                  <img [src]="getImageUrl(i)" [alt]="'Image ' + (i + 1)" class="w-full h-full object-cover">
                </button>
              </div>
            </div>
          </div>

          <!-- Product Information -->
          <div class="lg:col-span-5 mt-8 lg:mt-0">
            <div class="bg-white rounded-2xl p-6 space-y-6 shadow-sm border">
              <!-- Product Title & Price -->
              <div>
                <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{{ product()!.title }}</h1>
                <div class="flex items-center justify-between">
                  <app-price [amount]="product()!.price" size="xl" color="primary"></app-price>
                  <div class="flex items-center gap-2">
                    <button 
                      (click)="toggleFavorite()"
                      [class]="isFavorited() ? 'text-red-500' : 'text-gray-400'"
                      class="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                    <button class="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                      </svg>
                    </button>
                    <button 
                      (click)="addToComparison()"
                      class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Add to comparison">
                      <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Product Details -->
              <div class="space-y-4">
                <div class="flex items-center gap-4">
                  <span class="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">{{ product()!.condition }}</span>
                  <span class="text-sm text-gray-600">{{ product()!.views || 0 }} views</span>
                  <span class="text-sm text-gray-600">{{ product()!.favorites || 0 }} favorites</span>
                </div>

                <!-- Tags -->
                <div *ngIf="product()!.tags.length > 0" class="flex flex-wrap gap-2">
                  <span *ngFor="let tag of product()!.tags" 
                        class="bg-green-50 text-green-600 px-3 py-1 text-sm rounded-full">
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- Contact Seller -->
              <div class="border-t pt-6">
                <h3 class="font-semibold text-gray-900 mb-4">Contact Seller</h3>
                <div class="space-y-4">
                  <!-- Seller Info -->
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span class="font-bold text-green-600">{{ getSellerName().charAt(0) }}</span>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <h4 class="font-medium text-gray-900">{{ getSellerName() }}</h4>
                        <span *ngIf="seller()!.isVerified" class="text-green-500" title="Verified Seller">
                          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                          </svg>
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-gray-600">
                        <div class="flex items-center gap-1">
                          <span class="text-yellow-400">★</span>
                          <span>{{ getSellerRating() }}</span>
                          <span>({{ seller()!.totalReviews }} reviews)</span>
                        </div>
                        <span>•</span>
                        <span>{{ seller()!.responseTime }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Contact Buttons -->
                  <div class="space-y-3">
                    <button 
                      (click)="openInquiryModal()"
                      class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      Ask a Question
                    </button>
                    <a 
                      [href]="'tel:' + seller()!.phone"
                      class="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                      Call {{ seller()!.phone }}
                    </a>
                    <a 
                      [href]="getWhatsAppUrl()"
                      target="_blank"
                      class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      Message on WhatsApp
                    </a>
                  </div>

                  <!-- Seller Stats -->
                  <div class="pt-4 border-t text-sm text-gray-600 space-y-2">
                    <div class="flex justify-between">
                      <span>Member since:</span>
                      <span>{{ seller()!.memberSince }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Active listings:</span>
                      <span>{{ seller()!.activeListings }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Location:</span>
                      <span>{{ seller()!.location }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Shipping Options -->
              <div class="border-t pt-6">
                <h3 class="font-semibold text-gray-900 mb-4">Delivery Options</h3>
                <div class="space-y-3">
                  <div *ngIf="productDetail()!.shippingOptions.meetup" class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium">Meet-up</div>
                      <div class="text-sm text-gray-600">Arrange a convenient meeting location</div>
                    </div>
                  </div>
                  <div *ngIf="productDetail()!.shippingOptions.delivery" class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium">Personal Delivery</div>
                      <div class="text-sm text-gray-600">Seller can deliver within Metro Manila</div>
                    </div>
                  </div>
                  <div *ngIf="productDetail()!.shippingOptions.shipping" class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg class="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium">Shipping via Courier</div>
                      <div class="text-sm text-gray-600">J&T Express, LBC, 2GO (buyer pays shipping)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Description & Specifications -->
        <div *ngIf="product()" class="mt-8 bg-white rounded-2xl p-6 shadow-sm border">
          <div class="lg:grid lg:grid-cols-2 lg:gap-8">
            <!-- Description -->
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-4">Description</h2>
              <div class="prose max-w-none text-gray-700">
                <p class="whitespace-pre-line">{{ productDetail()!.description }}</p>
                <div *ngIf="productDetail()!.reasonForSelling" class="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">Reason for Selling</h4>
                  <p class="text-gray-700">{{ productDetail()!.reasonForSelling }}</p>
                </div>
              </div>
            </div>

            <!-- Specifications -->
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
              <div class="space-y-3">
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="font-medium text-gray-900">Brand</span>
                  <span class="text-gray-700">{{ productDetail()!.brand }}</span>
                </div>
                <div *ngIf="productDetail()!.model" class="flex justify-between py-2 border-b border-gray-100">
                  <span class="font-medium text-gray-900">Model</span>
                  <span class="text-gray-700">{{ productDetail()!.model }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="font-medium text-gray-900">Condition</span>
                  <span class="text-gray-700">{{ product()!.condition }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="font-medium text-gray-900">Location</span>
                  <span class="text-gray-700">{{ getLocationString() }}</span>
                </div>
                <div *ngFor="let spec of specificationEntries()" class="flex justify-between py-2 border-b border-gray-100">
                  <span class="font-medium text-gray-900">{{ spec.key }}</span>
                  <span class="text-gray-700">{{ spec.value }}</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="font-medium text-gray-900">Listed</span>
                  <span class="text-gray-700">{{ productDetail()!.createdAt | date:'medium' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Related Products -->
        <div class="mt-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <app-product-card 
              *ngFor="let relatedProduct of relatedProducts()" 
              [product]="relatedProduct"
              [isFavorited]="isFavoritedProduct(relatedProduct._id)"
              (productClick)="onRelatedProductClick($event)"
              (favoriteClick)="onFavoriteClick($event)">
            </app-product-card>
          </div>
        </div>
      </div>

      <!-- Product Not Found -->
      <ng-template #productNotFound>
        <div class="max-w-2xl mx-auto text-center py-16">
          <div class="mb-8">
            <svg class="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.291-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p class="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <a routerLink="/browse" class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
            Browse All Products
          </a>
        </div>
      </ng-template>

      <!-- Floating Comparison Tray -->
      <div *ngIf="comparisonProducts().length > 0" class="fixed bottom-6 right-6 z-40">
        <div class="bg-white rounded-lg shadow-lg p-4 border-2 border-green-200 max-w-sm">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900">Compare Products</h3>
            <button 
              (click)="clearComparison()"
              class="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div 
              *ngFor="let product of comparisonProducts()" 
              class="flex items-center gap-2 text-sm">
              <img 
                [src]="getComparisonImageUrl(product)" 
                class="w-8 h-8 rounded object-cover">
              <span class="flex-1 truncate">{{ product.title }}</span>
              <button 
                (click)="removeFromComparison(product._id)"
                class="text-red-400 hover:text-red-600 text-xs">
                ×
              </button>
            </div>
          </div>
          <button 
            *ngIf="comparisonProducts().length >= 2"
            (click)="openComparison()"
            class="w-full mt-3 bg-green-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-700 transition-colors">
            Compare {{ comparisonProducts().length }} Products
          </button>
        </div>
      </div>

      <!-- Image Zoom Modal -->
      <div *ngIf="showImageZoom()" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div class="relative max-w-full max-h-full p-4">
          <img 
            [src]="zoomImageUrl()" 
            class="max-w-full max-h-full object-contain rounded-lg">
          <button 
            (click)="closeImageZoom()"
            class="absolute top-2 right-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors">
            ×
          </button>
        </div>
      </div>

      <!-- Comparison Modal -->
      <div *ngIf="showComparison()" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">Product Comparison</h2>
            <button 
              (click)="closeComparison()"
              class="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let product of comparisonProducts()" class="space-y-4">
                <!-- Product Image & Title -->
                <div class="text-center">
                  <img 
                    [src]="getComparisonImageUrl(product)" 
                    class="w-full h-48 object-cover rounded-lg mb-3">
                  <h3 class="font-semibold text-gray-900">{{ product.title }}</h3>
                  <div class="text-xl font-bold text-green-600 mt-1">
                    ₱{{ product.price.toLocaleString() }}
                  </div>
                </div>
                
                <!-- Comparison Details -->
                <div class="space-y-3">
                  <div class="border-t pt-3">
                    <div class="text-sm space-y-2">
                      <div class="flex justify-between">
                        <span class="text-gray-600">Condition:</span>
                        <span class="font-medium">{{ product.condition }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Brand:</span>
                        <span class="font-medium">{{ product?.brand || 'N/A' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Category:</span>
                        <span class="font-medium">{{ product.category }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Seller Rating:</span>
                        <span class="font-medium">★ {{ getComparisonSellerRating(product) }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Location:</span>
                        <span class="font-medium">{{ getComparisonLocationString(product) }}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    (click)="goToProduct(product._id)"
                    class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Inquiry Modal -->
    <div *ngIf="showInquiryModal()" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b">
          <h3 class="text-lg font-semibold">Ask a Question</h3>
          <button (click)="closeInquiryModal()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="p-6">
          <!-- Product Summary -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <div class="flex items-center gap-3">
              <img [src]="product()?.images?.[0]?.url" 
                   [alt]="product()?.title" 
                   class="w-16 h-16 object-cover rounded-lg">
              <div>
                <h4 class="font-semibold text-gray-900">{{ product()?.title }}</h4>
                <p class="text-green-600 font-semibold">{{ formatPrice(product()?.price || 0) }}</p>
                <p class="text-sm text-gray-600">{{ getSellerName() }}</p>
              </div>
            </div>
          </div>

          <!-- Quick Templates -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">Quick Questions:</label>
            <div class="grid grid-cols-1 gap-2">
              <button *ngFor="let template of inquiryTemplates"
                      (click)="selectTemplate(template.template)"
                      class="text-left p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors">
                <span class="text-sm text-gray-700">{{ template.title }}</span>
              </button>
            </div>
          </div>

          <!-- Custom Message -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Message:</label>
            <textarea 
              [(ngModel)]="customMessage"
              placeholder="Type your question or message..."
              rows="4"
              class="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
          </div>

          <!-- Contact Method -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">How would you like to be contacted?</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="radio" name="contactMethod" value="phone" class="text-green-600">
                <span class="ml-2 text-sm text-gray-700">Phone Call</span>
              </label>
              <label class="flex items-center">
                <input type="radio" name="contactMethod" value="whatsapp" class="text-green-600" checked>
                <span class="ml-2 text-sm text-gray-700">WhatsApp</span>
              </label>
              <label class="flex items-center">
                <input type="radio" name="contactMethod" value="viber" class="text-green-600">
                <span class="ml-2 text-sm text-gray-700">Viber</span>
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button (click)="closeInquiryModal()" 
                    class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button (click)="sendInquiry()" 
                    [disabled]="!customMessage().trim()"
                    class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Send Message
            </button>
          </div>
        </div>
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
    
    .prose p {
      margin-bottom: 1rem;
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  currentImageIndex = signal(0);
  favoriteProducts = new Set<string>();
  currentProductId = signal<string | null>(null);
  currentProduct = signal<ProductDetail | null>(null);
  currentSeller = signal<Seller | null>(null);

  // Image zoom and comparison features
  showImageZoom = signal<boolean>(false);
  zoomImageUrl = signal<string>('');
  comparisonProducts = signal<Product[]>([]);
  showComparison = signal<boolean>(false);

  // Contact flow features
  showInquiryModal = signal<boolean>(false);
  selectedTemplate = signal<string>('');
  customMessage = signal<string>('');

  // Product data will be loaded from API
  sampleProducts: ProductDetail[] = [
    {
      _id: 'wilson-pro-staff-97',
      title: 'Wilson Pro Staff 97 v14',
      price: 14500,
      condition: 'New',
      seller: {
        _id: 'seller1',
        firstName: 'Juan',
        lastName: 'Cruz',
        rating: { average: 4.8, totalReviews: 125 },
        location: { city: 'Makati', region: 'Metro Manila' },
        isVerified: true
      },
      location: { city: 'Makati', region: 'Metro Manila' },
      images: [
        { url: 'https://images.unsplash.com/photo-1544966503-7a5e6b2c1c3d?w=500&h=500&fit=crop', isMain: true },
        { url: 'https://images.unsplash.com/photo-1543327386-9c4e0c6c0a8c?w=500&h=500&fit=crop' }
      ],
      tags: ['Professional', 'Wilson', '97sq'],
      category: 'Racquets',
      brand: 'Wilson',
      model: 'Pro Staff 97 v14',
      description: 'Brand new Wilson Pro Staff 97 v14. Never used, still in original packaging. This is the same racquet used by Roger Federer. Perfect weight distribution and amazing feel.',
      availability: 'available',
      negotiable: true,
      isBoosted: true,
      isApproved: 'approved',
      views: 245,
      favorites: 18,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      specifications: {
        'Head Size': '97 sq in',
        'Length': '27 inches',
        'Weight': '315g (unstrung)',
        'Balance': '315mm',
        'String Pattern': '16x19'
      },
      reasonForSelling: 'Bought two by mistake, selling the extra one.',
      shippingOptions: {
        meetup: true,
        delivery: true,
        shipping: true
      }
    },
    {
      _id: 'babolat-pure-drive',
      title: 'Babolat Pure Drive 2023',
      price: 12000,
      condition: 'Excellent',
      seller: {
        _id: 'seller2',
        firstName: 'Maria',
        lastName: 'Santos',
        rating: { average: 4.6, totalReviews: 89 },
        location: { city: 'Quezon City', region: 'Metro Manila' },
        isVerified: true
      },
      location: { city: 'Quezon City', region: 'Metro Manila' },
      images: [
        { url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop', isMain: true }
      ],
      tags: ['Power', 'Babolat', 'Intermediate'],
      category: 'Racquets',
      brand: 'Babolat',
      model: 'Pure Drive 2023',
      description: 'Excellent condition Babolat Pure Drive. Used for about 6 months. Great power and spin. Perfect for intermediate to advanced players.',
      availability: 'available',
      negotiable: true,
      isBoosted: false,
      isApproved: 'approved',
      views: 156,
      favorites: 12,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
      specifications: {
        'Head Size': '100 sq in',
        'Length': '27 inches',
        'Weight': '300g (unstrung)',
        'Balance': '320mm',
        'String Pattern': '16x19'
      },
      reasonForSelling: 'Upgrading to a new racquet.',
      shippingOptions: {
        meetup: true,
        delivery: false,
        shipping: true
      }
    },
    {
      _id: 'yonex-poly-tour-pro',
      title: 'Yonex Poly Tour Pro String',
      price: 6800,
      condition: 'New',
      category: 'Strings',
      brand: 'Yonex',
      model: 'Poly Tour Pro',
      description: 'Brand new Yonex Poly Tour Pro string set. Perfect for power players seeking control and spin.',
      images: [{ url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop', isMain: true }],
      seller: {
        _id: 'seller3',
        firstName: 'Tennis',
        lastName: 'Shop',
        rating: { average: 4.9, totalReviews: 200 },
        location: { city: 'BGC', region: 'Metro Manila' },
        isVerified: true
      },
      location: { city: 'BGC', region: 'Metro Manila' },
      availability: 'available',
      tags: ['Professional', 'Strings', 'Power'],
      negotiable: false,
      isBoosted: false,
      isApproved: 'approved',
      views: 89,
      favorites: 5,
      createdAt: '2024-01-08T00:00:00Z',
      updatedAt: '2024-01-08T00:00:00Z',
      specifications: {
        'Gauge': '1.25mm',
        'Length': '12m set',
        'Material': 'Polyester',
        'Color': 'Natural',
        'Tension Range': '23-27kg'
      },
      reasonForSelling: 'Overstocked inventory.',
      shippingOptions: {
        meetup: true,
        delivery: true,
        shipping: true
      }
    },
    {
      _id: 'nike-court-zoom',
      title: 'Nike Court Air Zoom GP Turbo',
      price: 5200,
      condition: 'Like New',
      category: 'Shoes',
      brand: 'Nike',
      model: 'Court Air Zoom GP Turbo',
      description: 'Like new Nike tennis shoes. Worn only a few times. Great for hard courts.',
      images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', isMain: true }],
      seller: {
        _id: 'seller4',
        firstName: 'Sports',
        lastName: 'Fan',
        rating: { average: 4.7, totalReviews: 45 },
        location: { city: 'Pasig', region: 'Metro Manila' },
        isVerified: false
      },
      location: { city: 'Pasig', region: 'Metro Manila' },
      availability: 'available',
      tags: ['Nike', 'Size 9', 'Performance'],
      negotiable: true,
      isBoosted: true,
      isApproved: 'approved',
      views: 134,
      favorites: 8,
      createdAt: '2024-01-12T00:00:00Z',
      updatedAt: '2024-01-12T00:00:00Z',
      specifications: {
        'Size': 'US 9 / EU 42.5',
        'Width': 'Medium',
        'Surface': 'Hard Court',
        'Color': 'White/Navy',
        'Weight': '320g'
      },
      reasonForSelling: 'Wrong size, bought online.',
      shippingOptions: {
        meetup: true,
        delivery: false,
        shipping: true
      }
    }
  ];

  // Seller data will be loaded from API
  sampleSellers: Seller[] = [
    {
      id: 'seller1',
      name: 'Juan Cruz',
      rating: 4.8,
      totalReviews: 125,
      responseTime: '~1 hour',
      isVerified: true,
      memberSince: 'March 2022',
      location: 'Makati, Metro Manila',
      phone: '09178529463',
      activeListings: 12
    },
    {
      id: 'seller2',
      name: 'Maria Santos',
      rating: 4.6,
      totalReviews: 89,
      responseTime: '~30 minutes',
      isVerified: true,
      memberSince: 'July 2023',
      location: 'Quezon City, Metro Manila',
      phone: '09186742195',
      activeListings: 8
    },
    {
      id: 'seller3',
      name: 'Tennis Shop',
      rating: 4.9,
      totalReviews: 200,
      responseTime: '~15 minutes',
      isVerified: true,
      memberSince: 'January 2022',
      location: 'BGC, Metro Manila',
      phone: '09159384672',
      activeListings: 25
    },
    {
      id: 'seller4',
      name: 'Sports Fan',
      rating: 4.7,
      totalReviews: 45,
      responseTime: '~2 hours',
      isVerified: false,
      memberSince: 'October 2023',
      location: 'Pasig, Metro Manila',
      phone: '09285967341',
      activeListings: 3
    }
  ];

  // Related products will be loaded from API
  relatedProductsData: Product[] = [];

  // Inquiry templates for better contact flow
  inquiryTemplates = [
    { 
      id: 'condition',
      title: 'Ask about condition',
      template: 'Hi! I\'m interested in your ${title}. Can you tell me more about its current condition? Are there any signs of wear or damage I should know about?' 
    },
    { 
      id: 'negotiation',
      title: 'Negotiate price',
      template: 'Hello! I\'m very interested in your ${title}. Would you be open to negotiating the price? I was thinking around ₱${suggestedPrice}.' 
    },
    { 
      id: 'meetup',
      title: 'Ask about meetup',
      template: 'Hi! I\'d like to buy your ${title}. When would be a good time to meet up for viewing and purchase? I\'m available in ${location} area.' 
    },
    { 
      id: 'shipping',
      title: 'Ask about shipping',
      template: 'Hello! I\'m interested in purchasing your ${title}. Do you offer shipping to my location? What would be the shipping cost and timeframe?' 
    },
    { 
      id: 'bundle',
      title: 'Ask about bundle deals',
      template: 'Hi! I noticed you have several tennis items listed. Would you consider a bundle deal if I purchase multiple items including this ${title}?' 
    },
    { 
      id: 'custom',
      title: 'Custom message',
      template: '' 
    }
  ];

  // Computed properties
  productDetail = computed(() => this.currentProduct());
  product = computed(() => this.productDetail());
  seller = computed(() => this.currentSeller());
  selectedImage = computed(() => this.getImageUrl(this.currentImageIndex()));
  specificationEntries = computed(() => 
    Object.entries(this.productDetail()?.specifications || {}).map(([key, value]) => ({ key, value }))
  );
  relatedProducts = computed(() => this.relatedProductsData.slice(0, 4));

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private modalService = inject(ModalService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);


  private loadProduct(productId: string) {
    console.log('Loading product with ID:', productId);
    console.log('Available sample product IDs:', this.sampleProducts.map(p => p._id));
    
    // First try to find product in sample data by ID
    const sampleProduct = this.sampleProducts.find(p => p._id === productId);
    console.log('Found in sample data:', sampleProduct ? 'YES' : 'NO');
    
    if (sampleProduct) {
      console.log('Using sample product:', sampleProduct.title);
      
      const seller = this.sampleSellers.find(s => {
        if (typeof sampleProduct?.seller === 'object') {
          return s.id === sampleProduct.seller._id;
        }
        return s.name === sampleProduct?.seller;
      });
      console.log('Found seller:', seller ? 'YES' : 'NO');
      
      // Use first seller as fallback if seller not found
      const finalSeller = seller || this.sampleSellers[0];
      console.log('Using seller:', finalSeller.name);
      
      // Update signals with found data
      this.currentProductId.set(productId);
      this.currentProduct.set(sampleProduct);
      this.currentSeller.set(finalSeller);
      
      // Reset image index when switching products
      this.currentImageIndex.set(0);
      
      console.log('Sample product loaded successfully');
      return;
    }
    
    // If not found in sample data, try to fetch from API (for real products from backend)
    console.log('Product not found in sample data, trying to fetch from API...');
    
    // For now, create a basic product structure from the ID to prevent "Product Not Found"
    // In a real app, you would fetch this from your ProductService
    const basicProduct: ProductDetail = {
      _id: productId,
      title: 'Loading Product...',
      price: 0,
      condition: 'New',
      category: 'Racquets',
      brand: 'Loading',
      description: 'Loading product details...',
      images: [{ url: 'https://images.unsplash.com/photo-1544966503-7a5e6b2c1c3d?w=500&h=500&fit=crop', isMain: true }],
      seller: {
        _id: 'unknown',
        firstName: 'Loading',
        lastName: 'User',
        rating: { average: 0, totalReviews: 0 },
        location: { city: 'Unknown', region: 'Unknown' },
        isVerified: false
      },
      location: { city: 'Unknown', region: 'Unknown' },
      availability: 'available',
      tags: [],
      negotiable: false,
      isBoosted: false,
      isApproved: 'approved',
      views: 0,
      favorites: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      specifications: {},
      shippingOptions: {
        meetup: true,
        delivery: false,
        shipping: true
      }
    };
    
    // Use first seller as fallback
    const fallbackSeller = this.sampleSellers[0];
    
    // Update signals with basic product data
    this.currentProductId.set(productId);
    this.currentProduct.set(basicProduct);
    this.currentSeller.set(fallbackSeller);
    
    // Reset image index when switching products
    this.currentImageIndex.set(0);
    
    console.log('Basic product placeholder loaded, now fetching real data from API');
    
    // Actually fetch the product from the API
    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        console.log('Real product loaded from API:', product);
        // Convert the API product to ProductDetail format
        const detailProduct: ProductDetail = {
          ...product,
          specifications: product.specifications || {},
          reasonForSelling: product.reasonForSelling,
          shippingOptions: product.shippingOptions || {
            meetup: true,
            delivery: false,
            shipping: true
          }
        };
        this.currentProduct.set(detailProduct);
        
        // Create seller object from API data instead of using static sample data
        if (typeof product.seller === 'object') {
          const apiSeller: Seller = {
            id: product.seller._id,
            name: `${product.seller.firstName} ${product.seller.lastName}`,
            rating: product.seller.rating?.average || 0,
            totalReviews: product.seller.rating?.totalReviews || 0,
            responseTime: '~1 hour', // Default response time
            isVerified: product.seller.isVerified || false,
            memberSince: 'Member since 2023', // Default membership
            location: `${product.seller.location?.city || 'Unknown'}, ${product.seller.location?.region || 'Unknown'}`,
            phone: product.seller.phoneNumber || '09178529463', // Use actual phone number from API, fallback to realistic number
            activeListings: 5 // Default active listings count
          };
          this.currentSeller.set(apiSeller);
        } else {
          // Fallback to sample seller if seller data is incomplete
          this.currentSeller.set(this.sampleSellers[0]);
        }
        console.log('Product detail page updated with real data');
      },
      error: (error) => {
        console.error('Failed to load product from API:', error);
        console.log('Keeping placeholder product data');
        // Keep the placeholder product so user doesn't see "Product Not Found"
      }
    });
  }

  selectImage(index: number) {
    this.currentImageIndex.set(index);
  }

  nextImage() {
    const current = this.currentImageIndex();
    const maxIndex = (this.product()?.images?.length || 1) - 1;
    this.currentImageIndex.set(current >= maxIndex ? 0 : current + 1);
  }

  previousImage() {
    const current = this.currentImageIndex();
    const maxIndex = (this.product()?.images?.length || 1) - 1;
    this.currentImageIndex.set(current <= 0 ? maxIndex : current - 1);
  }

  toggleFavorite() {
    const productId = this.product()!._id;
    if (this.favoriteProducts.has(productId)) {
      this.favoriteProducts.delete(productId);
    } else {
      this.favoriteProducts.add(productId);
    }
  }

  isFavorited() {
    return this.favoriteProducts.has(this.product()!._id);
  }

  isFavoritedProduct(productId: string): boolean {
    return this.favoriteProducts.has(productId);
  }

  onRelatedProductClick(product: Product) {
    // In real app, navigate to product detail page
    console.log('Navigate to related product:', product);
  }

  getWhatsAppUrl(): string {
    const phone = this.seller()!.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? phone.substring(1) : phone;
    const title = encodeURIComponent(this.product()!.title);
    return `https://wa.me/63${cleanPhone}?text=Hi! I'm interested in your ${title}`;
  }

  onFavoriteClick(event: { product: Product, isFavorited: boolean }) {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('User must be logged in to use favorites');
      return;
    }

    console.log('💝 Favorite click:', event);
    
    if (event.isFavorited) {
      // Add to favorites
      this.productService.addToFavorites(event.product._id).subscribe({
        next: (response) => {
          console.log('✅ Added to favorites:', response);
          this.favoriteProducts.add(event.product._id);
        },
        error: (error) => {
          console.error('❌ Failed to add to favorites:', error);
        }
      });
    } else {
      // Remove from favorites
      this.productService.removeFromFavorites(event.product._id).subscribe({
        next: (response) => {
          console.log('✅ Removed from favorites:', response);
          this.favoriteProducts.delete(event.product._id);
        },
        error: (error) => {
          console.error('❌ Failed to remove from favorites:', error);
        }
      });
    }
  }

  // Helper methods for template
  getSellerName(): string {
    const seller = this.product()?.seller;
    if (typeof seller === 'object') {
      return `${seller.firstName} ${seller.lastName}`;
    }
    return seller || 'Unknown';
  }

  getSellerRating(): number {
    const seller = this.product()?.seller;
    if (typeof seller === 'object') {
      return seller.rating?.average || 0;
    }
    return 0;
  }

  getLocationString(): string {
    const location = this.product()?.location;
    if (typeof location === 'object') {
      return `${location.city}, ${location.region}`;
    }
    return location || 'Unknown';
  }

  getImageUrl(index: number): string {
    const product = this.product();
    if (!product?.images?.[index]) return '';
    const image = product.images[index];
    return typeof image === 'string' ? image : image.url;
  }

  // Image Zoom Methods
  openImageZoom(imageUrl: string) {
    this.zoomImageUrl.set(imageUrl);
    this.showImageZoom.set(true);
  }

  closeImageZoom() {
    this.showImageZoom.set(false);
    this.zoomImageUrl.set('');
  }

  // Comparison Methods
  addToComparison() {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const comparisonList = this.comparisonProducts();
    const isAlreadyInComparison = comparisonList.some(p => p._id === currentProduct._id);
    
    if (isAlreadyInComparison) {
      console.log('Product already in comparison');
      return;
    }

    // Limit to 3 products max for better comparison UX
    if (comparisonList.length >= 3) {
      console.log('Maximum comparison limit reached');
      return;
    }

    const updatedList = [...comparisonList, currentProduct];
    this.comparisonProducts.set(updatedList);
    
    // Save to localStorage
    localStorage.setItem('tennis-comparison', JSON.stringify(updatedList));
  }

  removeFromComparison(productId: string) {
    const filtered = this.comparisonProducts().filter(p => p._id !== productId);
    this.comparisonProducts.set(filtered);
    localStorage.setItem('tennis-comparison', JSON.stringify(filtered));
  }

  clearComparison() {
    this.comparisonProducts.set([]);
    localStorage.removeItem('tennis-comparison');
  }

  openComparison() {
    this.showComparison.set(true);
  }

  closeComparison() {
    this.showComparison.set(false);
  }

  goToProduct(productId: string) {
    this.closeComparison();
    // Navigate to different product (in real app, would use router)
    window.location.href = `/product/${productId}`;
  }

  getComparisonImageUrl(product: Product): string {
    if (product.images && product.images.length > 0) {
      return typeof product.images[0] === 'string' 
        ? product.images[0] 
        : product.images[0].url;
    }
    return 'https://images.unsplash.com/photo-1542144612-1c93f9eac579?w=400&h=300&fit=crop';
  }

  getComparisonSellerRating(product: Product): number {
    if (typeof product.seller === 'object') {
      return product.seller.rating?.average || 0;
    }
    return 0;
  }

  getComparisonLocationString(product: Product): string {
    if (typeof product.location === 'object') {
      return `${product.location.city}, ${product.location.region}`;
    }
    return product.location || 'Unknown';
  }

  ngOnInit() {
    // Initialize with empty state
    this.currentProduct.set(null);
    this.currentSeller.set(null);
    this.currentProductId.set(null);
    
    // Load comparison from localStorage
    this.loadComparison();
    
    // Listen to route parameter changes to support navigation between products
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      console.log('Route parameter productId:', productId);
      if (productId) {
        // Add small delay to ensure DOM is ready
        setTimeout(() => this.loadProduct(productId), 0);
      } else {
        console.log('No product ID found in route');
        this.currentProduct.set(null);
      }
    });
  }

  private loadComparison() {
    const saved = localStorage.getItem('tennis-comparison');
    if (saved) {
      try {
        const comparison = JSON.parse(saved);
        this.comparisonProducts.set(comparison);
      } catch (e) {
        console.error('Error loading comparison:', e);
      }
    }
  }

  // Inquiry Modal Methods
  openInquiryModal(): void {
    this.showInquiryModal.set(true);
  }

  closeInquiryModal(): void {
    this.showInquiryModal.set(false);
    this.customMessage.set('');
  }

  selectTemplate(message: string): void {
    const product = this.product();
    if (!product) {
      this.customMessage.set(message);
      return;
    }

    // Interpolate variables in the template
    let interpolatedMessage = message;
    
    // Replace ${title} with actual product title
    interpolatedMessage = interpolatedMessage.replace(/\$\{title\}/g, product.title);
    
    // Replace ${suggestedPrice} with a suggested price (80% of actual price)
    const suggestedPrice = Math.floor(product.price * 0.8).toLocaleString();
    interpolatedMessage = interpolatedMessage.replace(/\$\{suggestedPrice\}/g, suggestedPrice);
    
    // Replace ${location} with product location (city)
    const location = product.location?.city || 'your area';
    interpolatedMessage = interpolatedMessage.replace(/\$\{location\}/g, location);
    
    this.customMessage.set(interpolatedMessage);
  }

  sendInquiry(): void {
    const message = this.customMessage().trim();
    const product = this.product();
    
    if (!message || !product) return;

    // Get selected contact method
    const contactMethodInputs = document.querySelectorAll('input[name="contactMethod"]:checked') as NodeListOf<HTMLInputElement>;
    const selectedMethod = contactMethodInputs.length > 0 ? contactMethodInputs[0].value : 'whatsapp';

    // Prepare the seller contact
    const seller = this.seller();
    const sellerPhone = seller?.phone || '09123456789';
    const encodedMessage = encodeURIComponent(`Hi! I'm interested in your ${product.title} for ₱${product.price.toLocaleString('en-PH')}. ${message}`);

    console.log('📞 Seller phone:', sellerPhone);
    console.log('💬 Encoded message:', encodedMessage);

    if (selectedMethod === 'whatsapp') {
      // Clean phone number for WhatsApp (remove non-digits, handle Philippine format)
      const cleanPhone = sellerPhone.replace(/\D/g, '');
      const whatsappPhone = cleanPhone.startsWith('0') ? '63' + cleanPhone.substring(1) : cleanPhone;
      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
      
      console.log('🌐 Opening WhatsApp URL:', whatsappUrl);
      window.open(whatsappUrl, '_blank');
    } else {
      // For other methods, just show the message and phone number
      this.modalService.info('Contact Information', `<p><strong>Contact Method:</strong> ${selectedMethod}</p><p><strong>Phone:</strong> ${sellerPhone}</p><p><strong>Your Message:</strong></p><p class="mt-2 p-3 bg-gray-50 rounded border">${message}</p>`);
    }

    // Track the inquiry
    this.trackInquiry(product, message, selectedMethod);

    // Close modal
    this.closeInquiryModal();
  }

  formatPrice(amount: number): string {
    return `₱${amount.toLocaleString('en-PH')}`;
  }

  private trackInquiry(product: any, message: string, contactMethod: string): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      console.log('👤 No current user, cannot save inquiry');
      return;
    }

    // Extract phone number from the inquiry form
    const phoneInput = document.querySelector('input[placeholder="Your phone number"]') as HTMLInputElement;
    const buyerPhone = phoneInput?.value || currentUser.phoneNumber || '';

    if (!buyerPhone) {
      console.error('❌ Phone number is required for inquiry');
      this.modalService.error('Error', 'Phone number is required to send inquiry');
      return;
    }

    const inquiryData = {
      productId: product._id,
      message: message,
      buyerPhone: buyerPhone
    };

    console.log('💾 Saving inquiry to backend for user:', currentUser.email, inquiryData);

    // Send inquiry to backend API
    this.http.post(`${environment.apiUrl}/inquiries`, inquiryData, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Inquiry saved to backend successfully:', response);
        this.modalService.success('Success', 'Your inquiry has been sent to the seller!');
      },
      error: (error) => {
        console.error('❌ Error saving inquiry to backend:', error);

        // Fallback to localStorage for backward compatibility
        this.saveInquiryToLocalStorage(product, message, contactMethod, currentUser);

        if (error.status === 400 && error.error?.error) {
          this.modalService.error('Error', error.error.error);
        } else {
          this.modalService.error('Error', 'Failed to send inquiry. Please try again.');
        }
      }
    });
  }

  private saveInquiryToLocalStorage(product: any, message: string, contactMethod: string, currentUser: any): void {
    const seller = typeof product.seller === 'string' ? { _id: product.seller, firstName: 'Seller', lastName: '' } : product.seller;

    const inquiry = {
      productId: product._id,
      productTitle: product.title,
      sellerId: seller._id,
      sellerName: seller.firstName + (seller.lastName ? ' ' + seller.lastName : ''),
      message,
      contactMethod,
      timestamp: new Date().toISOString(),
      status: 'sent',
      imageUrl: product.images?.[0]?.url || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
      buyerId: currentUser._id
    };

    try {
      const userSpecificKey = `tennis_buyer_inquiries_${currentUser._id}`;
      const existingInquiries = JSON.parse(localStorage.getItem(userSpecificKey) || '[]');
      existingInquiries.unshift(inquiry);
      localStorage.setItem(userSpecificKey, JSON.stringify(existingInquiries));
      console.log('✅ Inquiry saved to localStorage as fallback');
    } catch (e) {
      console.error('❌ Error saving inquiry to localStorage:', e);
    }
  }
}