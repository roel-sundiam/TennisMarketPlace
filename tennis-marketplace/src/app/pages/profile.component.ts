import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../services/auth.service';
import { PriceComponent } from '../components/price.component';
import { ProductCardComponent } from '../components/product-card.component';
import { EditProductModalComponent } from '../components/edit-product-modal.component';
import { Product, ProductService } from '../services/product.service';
import { CoinService } from '../services/coin.service';
import { ModalService } from '../services/modal.service';
import { environment } from '../../environments/environment';

interface RecentActivity {
  id: number;
  icon: string;
  description: string;
  timestamp: string;
}

interface PurchaseHistory {
  id: string;
  productTitle: string;
  productId: string;
  sellerName: string;
  price: number;
  status: 'completed' | 'pending' | 'cancelled';
  purchaseDate: string;
  imageUrl: string;
}

interface InquiryMessage {
  id: string;
  sender: 'buyer' | 'seller';
  senderName: string;
  message: string;
  timestamp: string;
}

interface Inquiry {
  id: string;
  productTitle: string;
  productId: string;
  sellerName: string;
  buyerName?: string;
  buyerId?: string;
  sellerId?: string;
  message: string;
  response?: string;
  messages?: InquiryMessage[];
  status: 'pending' | 'responded' | 'closed';
  createdAt: string;
  imageUrl: string;
  contactMethod?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, PriceComponent, ProductCardComponent, EditProductModalComponent],
  styles: [`
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div class="flex items-center justify-between h-14 sm:h-16">
            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
              <a routerLink="/" class="flex items-center gap-1 sm:gap-2 hover:opacity-90 transition-opacity">
                <div class="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold text-xs sm:text-sm">🎾</span>
                </div>
                <h1 class="text-lg sm:text-xl font-bold text-gray-900">TennisMarket</h1>
              </a>
              <span class="text-gray-400 hidden sm:inline">›</span>
              <h2 class="text-base sm:text-lg font-semibold text-gray-700 truncate">My Profile</h2>
            </div>
            <button 
              (click)="logout()"
              class="text-gray-600 hover:text-gray-800 font-medium">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        @if (user()) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            <!-- Profile Info -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-2xl border border-gray-200 p-6">
                <!-- Avatar & Basic Info -->
                <div class="text-center mb-6">
                  <div class="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-white font-bold text-2xl">
                      {{ getUserInitials() }}
                    </span>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900">{{ getFullName() }}</h3>
                  <p class="text-gray-600">{{ user()!.email }}</p>
                  @if (user()!.role !== 'buyer') {
                    <span class="inline-flex items-center gap-1 mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      <span>✓</span> {{ user()!.role | titlecase }}
                    </span>
                  }
                </div>

                <!-- Stats -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Member Since</span>
                    <span class="text-sm font-medium">{{ formatDate(user()!.createdAt) }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Location</span>
                    <span class="text-sm font-medium">{{ getLocationString() }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Phone</span>
                    <span class="text-sm font-medium">{{ user()!.phoneNumber || 'Not set' }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Rating</span>
                    <div class="flex items-center gap-1">
                      <span class="text-yellow-400">★</span>
                      <span class="text-sm font-medium">{{ getRatingDisplay() }}</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-600">Subscription</span>
                    <span [class]="getSubscriptionBadgeClass(user()!.subscription?.plan || 'free')">
                      {{ user()!.subscription?.plan || 'free' | titlecase }}
                    </span>
                  </div>
                </div>

                <!-- Verification Status -->
                <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                  @if (verificationStatus() === 'verified') {
                    <div class="flex items-center gap-2 text-green-700">
                      <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <span class="text-sm font-medium">Account Verified</span>
                    </div>
                  } @else if (verificationStatus() === 'pending') {
                    <div class="flex items-center gap-2 text-yellow-700 mb-2">
                      <div class="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span class="text-white text-xs">⏳</span>
                      </div>
                      <span class="text-sm font-medium">Verification Pending</span>
                    </div>
                    <p class="text-xs text-yellow-600">Your verification is being reviewed</p>
                  } @else if (verificationStatus() === 'rejected') {
                    <div class="flex items-center gap-2 text-red-700 mb-2">
                      <div class="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span class="text-white text-xs">❌</span>
                      </div>
                      <span class="text-sm font-medium">Verification Rejected</span>
                    </div>
                    <p class="text-xs text-red-600 mb-2">{{ rejectionReason() }}</p>
                    <button 
                      (click)="requestVerification()"
                      class="text-xs text-red-600 hover:text-red-800 underline">
                      Request Again
                    </button>
                  } @else {
                    <div class="flex items-center gap-2 text-gray-700 mb-2">
                      <div class="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                        <span class="text-white text-xs">?</span>
                      </div>
                      <span class="text-sm font-medium">Unverified Account</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-3">Get verified to build trust with buyers</p>
                    <button 
                      (click)="requestVerification()"
                      class="w-full bg-blue-600 text-white py-2 px-3 rounded text-xs hover:bg-blue-700 transition-colors">
                      Get Verified
                    </button>
                  }
                </div>

                <!-- Actions -->
                <div class="mt-6 space-y-3">
                  <button class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    Edit Profile
                  </button>
                  @if (user()!.subscription?.plan === 'free') {
                    <button class="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors">
                      Upgrade to Pro
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Dashboard Content -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Quick Stats -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div class="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Purchases</p>
                      <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ purchaseHistory().length }}</p>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-purple-600 text-lg sm:text-xl">🛒</span>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Inquiries</p>
                      <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ inquiries().length }}</p>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-blue-600 text-lg sm:text-xl">💬</span>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Favorites</p>
                      <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ favoriteProducts().length }}</p>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-red-600 text-lg sm:text-xl">❤️</span>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Searches</p>
                      <p class="text-xl sm:text-2xl font-bold text-gray-900">{{ savedSearchCount() }}</p>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-green-600 text-lg sm:text-xl">🔍</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dashboard Tabs -->
              <div class="bg-white rounded-2xl border border-gray-200">
                <!-- Tab Navigation -->
                <div class="border-b border-gray-200">
                  <!-- Mobile Tab Navigation (Horizontal Scroll) -->
                  <nav class="flex overflow-x-auto scrollbar-hide px-4 py-3 sm:px-6 sm:py-4 gap-1 sm:gap-4">
                    <button 
                      *ngFor="let tab of dashboardTabs"
                      (click)="setActiveTab(tab.id)"
                      [class]="tab.id === activeTab() ? 
                        'bg-green-50 border-green-500 text-green-700 shadow-sm' : 
                        'bg-white border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'"
                      class="flex-shrink-0 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-2 font-medium text-xs sm:text-sm transition-all duration-200 min-w-max">
                      
                      <!-- Icon -->
                      <span class="text-base sm:text-lg">{{ tab.icon }}</span>
                      
                      <!-- Label (hidden on mobile, visible on sm+) -->
                      <span class="hidden sm:inline">{{ tab.label }}</span>
                      
                      <!-- Count Badge -->
                      <span *ngIf="tab.count > 0" 
                            [class]="tab.id === activeTab() ? 
                              'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-600'"
                            class="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-semibold">
                        {{ tab.count > 99 ? '99+' : tab.count }}
                      </span>
                    </button>
                  </nav>
                  
                  <!-- Tab Label for Mobile (Shows active tab name when labels are hidden) -->
                  <div class="sm:hidden px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <p class="text-sm font-medium text-gray-800 text-center">
                      {{ getActiveTabLabel() }}
                    </p>
                  </div>
                </div>

                <!-- Tab Content -->
                <div class="p-4 sm:p-6">
                  <!-- My Listings Tab -->
                  <div *ngIf="activeTab() === 'listings'">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <h3 class="text-lg font-semibold text-gray-900">My Listings</h3>
                      <a routerLink="/sell" class="w-full sm:w-auto bg-green-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium text-center">
                        <span class="sm:hidden">+ Add New Listing</span>
                        <span class="hidden sm:inline">+ Add New</span>
                      </a>
                    </div>
                    
                    <div *ngIf="userProducts().length > 0; else noListings" class="space-y-4">
                      <div 
                        *ngFor="let product of userProducts()" 
                        class="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-green-200 transition-colors">
                        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <!-- Product Image -->
                          <div class="flex-shrink-0">
                            <img 
                              [src]="product.images?.[0]?.url || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop'" 
                              [alt]="product.title"
                              class="w-full h-48 sm:w-20 sm:h-20 object-cover rounded-lg">
                          </div>
                          
                          <!-- Product Details -->
                          <div class="flex-1 min-w-0">
                            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                              <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-gray-900 mb-1 truncate">{{ product.title }}</h4>
                                <div class="flex items-center gap-1 mb-2 flex-wrap">
                                  <span class="text-lg font-bold text-green-600">₱{{ product.price.toLocaleString() }}</span>
                                  <span 
                                    [class]="getStatusBadgeClass(product)"
                                    class="px-2 py-1 text-xs rounded-full">
                                    {{ product.isApproved | titlecase }}
                                  </span>
                                  <span 
                                    [class]="getAvailabilityBadgeClass(product.availability)"
                                    class="px-2 py-1 text-xs rounded-full">
                                    {{ product.availability | titlecase }}
                                  </span>
                                  <span *ngIf="product.isBoosted" class="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-full">
                                    🚀 Boosted
                                  </span>
                                </div>
                                <div class="flex items-center gap-3 text-xs sm:text-sm text-gray-600 flex-wrap">
                                  <span>👁️ {{ product.views }}</span>
                                  <span>❤️ {{ product.favorites }}</span>
                                  <span class="hidden sm:inline">📅 {{ formatDate(product.createdAt) }}</span>
                                </div>
                              </div>
                              
                              <!-- Action Buttons -->
                              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                <button 
                                  (click)="onEditProduct(product)"
                                  class="flex-1 sm:flex-none text-blue-600 hover:text-blue-800 text-sm px-3 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                                  <span class="sm:hidden">✏️ Edit Listing</span>
                                  <span class="hidden sm:inline">Edit</span>
                                </button>
                                <button 
                                  *ngIf="product.isApproved === 'approved' && !product.isBoosted"
                                  (click)="onBoostProduct(product)"
                                  class="flex-1 sm:flex-none text-yellow-600 hover:text-yellow-800 text-sm px-3 py-2 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors font-medium">
                                  <span class="sm:hidden">🚀 Boost Product</span>
                                  <span class="hidden sm:inline">Boost</span>
                                </button>
                                <button 
                                  *ngIf="product.availability !== 'sold'"
                                  (click)="onMarkAsSold(product)"
                                  class="flex-1 sm:flex-none text-green-600 hover:text-green-800 text-sm px-3 py-2 border border-green-200 rounded-lg hover:bg-green-50 transition-colors font-medium">
                                  <span class="sm:hidden">✅ Mark as Sold</span>
                                  <span class="hidden sm:inline">Mark Sold</span>
                                </button>
                                <button 
                                  (click)="onDeleteProduct(product)"
                                  class="flex-1 sm:flex-none text-red-600 hover:text-red-800 text-sm px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium">
                                  <span class="sm:hidden">🗑️ Delete Listing</span>
                                  <span class="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <ng-template #noListings>
                      <div class="text-center py-12">
                        <span class="text-6xl mb-4 block">📦</span>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
                        <p class="text-gray-600 mb-6">Start selling your tennis equipment to reach thousands of players</p>
                        <a routerLink="/sell" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                          Create Your First Listing
                        </a>
                      </div>
                    </ng-template>
                  </div>

                  <!-- Favorites Tab -->
                  <div *ngIf="activeTab() === 'favorites'">
                    <div *ngIf="favoriteProducts().length > 0; else noFavorites" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <app-product-card 
                        *ngFor="let product of favoriteProducts()" 
                        [product]="product"
                        [isFavorited]="true"
                        (productClick)="onProductClick($event)"
                        (favoriteClick)="onFavoriteClick($event)">
                      </app-product-card>
                    </div>
                    <ng-template #noFavorites>
                      <div class="text-center py-12">
                        <span class="text-6xl mb-4 block">❤️</span>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
                        <p class="text-gray-600 mb-6">Save products you're interested in to see them here</p>
                        <a routerLink="/browse" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                          Browse Products
                        </a>
                      </div>
                    </ng-template>
                  </div>

                  <!-- Purchase History Tab -->
                  <div *ngIf="activeTab() === 'purchases'">
                    <div *ngIf="purchaseHistory().length > 0; else noPurchases" class="space-y-4">
                      <div 
                        *ngFor="let purchase of purchaseHistory()" 
                        class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-200 transition-colors">
                        <img 
                          [src]="purchase.imageUrl" 
                          class="w-16 h-16 object-cover rounded-lg">
                        <div class="flex-1">
                          <h4 class="font-semibold text-gray-900">{{ purchase.productTitle }}</h4>
                          <p class="text-sm text-gray-600">Seller: {{ purchase.sellerName }}</p>
                          <p class="text-sm text-gray-500">{{ formatDate(purchase.purchaseDate) }}</p>
                        </div>
                        <div class="text-right">
                          <div class="text-lg font-bold text-gray-900">₱{{ purchase.price.toLocaleString() }}</div>
                          <span 
                            [class]="getPurchaseStatusClass(purchase.status)"
                            class="inline-block px-2 py-1 text-xs rounded-full">
                            {{ purchase.status | titlecase }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ng-template #noPurchases>
                      <div class="text-center py-12">
                        <span class="text-6xl mb-4 block">🛒</span>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">No purchases yet</h3>
                        <p class="text-gray-600 mb-6">Your purchase history will appear here</p>
                        <a routerLink="/browse" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                          Start Shopping
                        </a>
                      </div>
                    </ng-template>
                  </div>

                  <!-- Inquiries Tab -->
                  <div *ngIf="activeTab() === 'inquiries'">
                    <div class="space-y-6">
                      
                      <!-- Seller Inquiries Section (Inquiries received about your products) -->
                      <div *ngIf="receivedInquiries().length > 0" class="bg-white border border-gray-200 rounded-lg">
                        <div class="bg-green-50 px-4 py-3 border-b border-gray-200">
                          <h3 class="text-sm font-semibold text-green-800 flex items-center gap-2">
                            <span>🛍️</span>
                            Inquiries About Your Products ({{ receivedInquiries().length }})
                          </h3>
                        </div>
                        <div class="p-4 space-y-4">
                          <div 
                            *ngFor="let inquiry of receivedInquiries()" 
                            class="border border-gray-100 rounded-lg p-4 hover:border-green-200 transition-colors">
                            <div class="flex items-start gap-4">
                              <img 
                                [src]="inquiry.imageUrl" 
                                class="w-12 h-12 object-cover rounded-lg">
                              <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                  <h4 class="font-semibold text-gray-900">{{ inquiry.productTitle }}</h4>
                                  <span 
                                    [class]="getInquiryStatusClass(inquiry.status)"
                                    class="px-2 py-1 text-xs rounded-full">
                                    {{ inquiry.status | titlecase }}
                                  </span>
                                </div>
                                <p class="text-sm text-blue-600 mb-3 font-medium">From: {{ inquiry.buyerName || 'Buyer' }}</p>

                                <!-- Conversation Thread (if messages exist) -->
                                <div *ngIf="inquiry.messages && inquiry.messages.length > 0; else sellerLegacyView" class="space-y-3 mb-3">
                                  <div *ngFor="let message of inquiry.messages" 
                                       [class]="message.sender === 'seller' ? 'flex justify-end' : 'flex justify-start'">
                                    <div [class]="message.sender === 'seller' ? 'bg-green-50 border-l-4 border-green-400 max-w-[80%]' : 'bg-blue-50 border-l-4 border-blue-400 max-w-[80%]'" 
                                         class="p-3 rounded-lg">
                                      <div class="flex items-center gap-2 mb-1">
                                        <span [class]="message.sender === 'seller' ? 'text-green-700' : 'text-blue-700'" 
                                              class="text-xs font-semibold">
                                          {{ message.senderName }}
                                        </span>
                                        <span class="text-xs text-gray-500">{{ formatDate(message.timestamp) }}</span>
                                      </div>
                                      <p [class]="message.sender === 'seller' ? 'text-green-900' : 'text-blue-900'" 
                                         class="text-sm">{{ message.message }}</p>
                                    </div>
                                  </div>
                                </div>

                                <!-- Legacy View (for backward compatibility) -->
                                <ng-template #sellerLegacyView>
                                  <div class="bg-blue-50 p-3 rounded-lg mb-3">
                                    <p class="text-sm text-gray-900">{{ inquiry.message }}</p>
                                  </div>
                                  <div *ngIf="inquiry.response" class="bg-green-50 p-3 rounded-lg mb-2">
                                    <p class="text-sm font-medium text-green-800 mb-1">Your Response:</p>
                                    <p class="text-sm text-green-700">{{ inquiry.response }}</p>
                                  </div>
                                </ng-template>
                                <div class="flex items-center justify-between">
                                  <p class="text-xs text-gray-500">{{ formatDate(inquiry.createdAt) }}</p>
                                  <div class="flex gap-2">
                                    <!-- Reply button for active conversations with messages -->
                                    <button
                                      *ngIf="inquiry.messages && inquiry.messages.length > 0"
                                      class="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                                      (click)="replyToInquiry(inquiry)">
                                      Reply
                                    </button>
                                    <!-- Respond button for initial response (legacy format) -->
                                    <button
                                      *ngIf="(!inquiry.messages || inquiry.messages.length === 0) && !inquiry.response"
                                      class="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                                      (click)="respondToInquiry(inquiry)">
                                      Respond
                                    </button>
                                    <button
                                      *ngIf="inquiry.contactMethod"
                                      class="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                                      (click)="contactBuyer(inquiry)">
                                      Contact
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Buyer Inquiries Section (Inquiries you sent to sellers) - Only show if user is buyer or has sent inquiries -->
                      <div *ngIf="inquiries().length > 0 && (user()?.role === 'buyer' || user()?.role === 'admin')" class="bg-white border border-gray-200 rounded-lg">
                        <div class="bg-blue-50 px-4 py-3 border-b border-gray-200">
                          <h3 class="text-sm font-semibold text-blue-800 flex items-center gap-2">
                            <span>💬</span>
                            Your Inquiries to Sellers ({{ inquiries().length }})
                          </h3>
                        </div>
                        <div class="p-4 space-y-4">
                          <div 
                            *ngFor="let inquiry of inquiries()" 
                            class="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                            <div class="flex items-start gap-4">
                              <img 
                                [src]="inquiry.imageUrl" 
                                class="w-12 h-12 object-cover rounded-lg">
                              <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                  <h4 class="font-semibold text-gray-900">{{ inquiry.productTitle }}</h4>
                                  <span 
                                    [class]="getInquiryStatusClass(inquiry.status)"
                                    class="px-2 py-1 text-xs rounded-full">
                                    {{ inquiry.status | titlecase }}
                                  </span>
                                </div>
                                <p class="text-sm text-green-600 mb-3 font-medium">To: {{ inquiry.sellerName }}</p>

                                <!-- Conversation Thread (if messages exist) -->
                                <div *ngIf="inquiry.messages && inquiry.messages.length > 0; else legacyView" class="space-y-3 mb-3">
                                  <div *ngFor="let message of inquiry.messages" 
                                       [class]="message.sender === 'buyer' ? 'flex justify-end' : 'flex justify-start'">
                                    <div [class]="message.sender === 'buyer' ? 'bg-blue-50 border-l-4 border-blue-400 max-w-[80%]' : 'bg-green-50 border-l-4 border-green-400 max-w-[80%]'" 
                                         class="p-3 rounded-lg">
                                      <div class="flex items-center gap-2 mb-1">
                                        <span [class]="message.sender === 'buyer' ? 'text-blue-700' : 'text-green-700'" 
                                              class="text-xs font-semibold">
                                          {{ message.senderName }}
                                        </span>
                                        <span class="text-xs text-gray-500">{{ formatDate(message.timestamp) }}</span>
                                      </div>
                                      <p [class]="message.sender === 'buyer' ? 'text-blue-900' : 'text-green-900'" 
                                         class="text-sm">{{ message.message }}</p>
                                    </div>
                                  </div>
                                </div>

                                <!-- Legacy View (for backward compatibility) -->
                                <ng-template #legacyView>
                                  <div class="bg-gray-50 p-3 rounded-lg mb-3">
                                    <p class="text-sm text-gray-900">{{ inquiry.message }}</p>
                                  </div>
                                  <div *ngIf="inquiry.response" class="bg-green-50 p-3 rounded-lg mb-3">
                                    <p class="text-sm font-medium text-green-800 mb-1">Seller Response:</p>
                                    <p class="text-sm text-green-700">{{ inquiry.response }}</p>
                                  </div>
                                </ng-template>

                                <!-- Action Buttons -->
                                <div class="flex items-center justify-between">
                                  <p class="text-xs text-gray-500">{{ formatDate(inquiry.createdAt) }}</p>
                                  <div class="flex gap-2">
                                    <!-- Reply button if there are messages (ongoing conversation) -->
                                    <button
                                      *ngIf="inquiry.messages && inquiry.messages.length > 0"
                                      (click)="replyToSeller(inquiry)"
                                      class="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                                      Reply
                                    </button>
                                    <!-- Reply button for legacy response format -->
                                    <button
                                      *ngIf="inquiry.response && (!inquiry.messages || inquiry.messages.length === 0)"
                                      (click)="replyToSeller(inquiry)"
                                      class="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- No Inquiries State -->
                      <div *ngIf="inquiries().length === 0 && receivedInquiries().length === 0" class="text-center py-12">
                        <span class="text-6xl mb-4 block">💬</span>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">No inquiries yet</h3>
                        <p *ngIf="user()?.role === 'seller'" class="text-gray-600 mb-6">
                          Buyer inquiries about your products will appear here
                        </p>
                        <p *ngIf="user()?.role === 'buyer'" class="text-gray-600 mb-6">
                          Your messages to sellers will appear here
                        </p>
                        <p *ngIf="user()?.role === 'admin'" class="text-gray-600 mb-6">
                          Your messages to sellers and buyer inquiries about your products will appear here
                        </p>
                        <a routerLink="/browse" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                          Browse Products
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- Activity Tab -->
                  <div *ngIf="activeTab() === 'activity'">
                    <div *ngIf="recentActivity.length > 0; else noActivity" class="space-y-4">
                      <div 
                        *ngFor="let activity of recentActivity" 
                        class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <span class="text-lg mt-0.5">{{ activity.icon }}</span>
                        <div class="flex-1">
                          <p class="text-sm text-gray-900">{{ activity.description }}</p>
                          <p class="text-xs text-gray-500 mt-1">{{ activity.timestamp }}</p>
                        </div>
                      </div>
                    </div>
                    <ng-template #noActivity>
                      <div class="text-center py-12">
                        <span class="text-6xl mb-4 block">📋</span>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
                        <p class="text-gray-600 mb-6">Start buying or selling to see your activity here</p>
                        <a routerLink="/browse" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                          Browse Items
                        </a>
                      </div>
                    </ng-template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
    
    <!-- Edit Product Modal -->
    <app-edit-product-modal 
      *ngIf="editingProduct()"
      [product]="editingProduct()"
      (close)="onEditModalClosed()"
      (productUpdated)="onProductUpdated($event)">
    </app-edit-product-modal>
  `
})
export class ProfileComponent implements OnInit {
  user = signal<User | null>(null);
  activeTab = signal<string>('favorites');

  // Data signals
  favoriteProducts = signal<Product[]>([]);
  userProducts = signal<Product[]>([]);
  purchaseHistory = signal<PurchaseHistory[]>([]);
  inquiries = signal<Inquiry[]>([]); // Inquiries sent by this user (as buyer)
  receivedInquiries = signal<Inquiry[]>([]); // Inquiries received about this user's products (as seller)
  savedSearchCount = signal<number>(0);
  
  // Modal state
  editingProduct = signal<Product | null>(null);
  
  // Verification signals
  verificationStatus = signal<string>('none'); // 'none', 'pending', 'verified', 'rejected'
  rejectionReason = signal<string>('');

  // Recent activity will be loaded from API
  recentActivity: RecentActivity[] = [];

  // Cache for user names to avoid repeated API calls
  private userNameCache = new Map<string, string>();

  dashboardTabs = [
    { id: 'listings', label: 'My Listings', icon: '📦', count: 0 },
    { id: 'favorites', label: 'Favorites', icon: '❤️', count: 0 },
    { id: 'purchases', label: 'Purchases', icon: '🛒', count: 0 },
    { id: 'inquiries', label: 'Inquiries', icon: '💬', count: 0 },
    { id: 'activity', label: 'Activity', icon: '📋', count: 0 }
  ];

  constructor(
    public authService: AuthService,
    private productService: ProductService,
    private coinService: CoinService,
    private modalService: ModalService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.user.set(this.authService.currentUser());
    this.activeTab.set('listings'); // Set My Listings as default tab
    this.loadUserData();
    this.updateTabCounts();
    this.loadVerificationStatus();
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  getSubscriptionBadgeClass(subscription: string): string {
    const classes = {
      'free': 'text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800',
      'basic': 'text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800',
      'pro': 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-800'
    };
    return classes[subscription as keyof typeof classes] || classes.free;
  }

  // Helper methods for template
  getUserInitials(): string {
    const user = this.user();
    if (!user) return '';
    const firstInitial = user.firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial || 'U';
  }

  getFullName(): string {
    const user = this.user();
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  }

  getLocationString(): string {
    const user = this.user();
    if (!user?.location) return 'Not set';
    if (typeof user.location === 'object') {
      return `${user.location.city}, ${user.location.region}`;
    }
    return user.location || 'Not set';
  }

  getRatingDisplay(): string {
    const user = this.user();
    if (!user?.rating || typeof user.rating !== 'object') {
      return 'No ratings yet';
    }
    return user.rating.average?.toString() || 'No ratings yet';
  }

  getUserSalesCount(): number {
    // In real app, this would be fetched from backend
    return 0;
  }

  // Load user dashboard data
  loadUserData(): void {
    // Load user's own products first
    this.loadUserProducts();
    // TODO: Replace with real API calls
    this.loadUserFavorites();
    this.loadUserPurchaseHistory();
    this.loadUserInquiries();
    this.loadSellerInquiries(); // This is now async but we don't await to avoid blocking
    this.loadSavedSearches();
  }

  loadUserProducts(): void {
    this.productService.getUserProducts().subscribe({
      next: (response) => {
        this.userProducts.set(response.products);
        this.updateTabCounts();
      },
      error: (error) => {
        console.error('Error loading user products:', error);
        // Set empty array on error - no mock data
        this.userProducts.set([]);
        this.updateTabCounts();
      }
    });
  }

  loadUserFavorites(): void {
    console.log('🔄 Loading user favorites...');
    this.productService.getUserFavorites().subscribe({
      next: (response) => {
        console.log('✅ Favorites loaded:', response);
        this.favoriteProducts.set(response.products || []);
        
        // Update favorites tab count
        const currentTabs = this.dashboardTabs;
        const favoritesTabIndex = currentTabs.findIndex(tab => tab.id === 'favorites');
        if (favoritesTabIndex !== -1) {
          currentTabs[favoritesTabIndex].count = response.products?.length || 0;
        }
      },
      error: (error) => {
        console.error('❌ Failed to load favorites:', error);
        this.favoriteProducts.set([]);
      }
    });
  }

  loadUserPurchaseHistory(): void {
    // TODO: Implement real API call to get user purchase history
    // For now, set empty array until API is implemented
    this.purchaseHistory.set([]);
  }

  loadUserInquiries(): void {
    const currentUser = this.user();
    if (!currentUser) {
      console.log('👤 No current user, cannot load inquiries');
      this.inquiries.set([]);
      return;
    }

    console.log('🔑 Loading inquiries from backend for user:', currentUser.email);

    // Fetch sent inquiries (as buyer) from backend API
    this.http.get(`${environment.apiUrl}/inquiries/my-inquiries?type=sent&limit=50`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Loaded sent inquiries from backend:', response);

        // Transform backend data to component format
        const transformedInquiries = response.inquiries.map((inquiry: any) => ({
          id: inquiry._id,
          productTitle: inquiry.productTitle,
          productId: inquiry.productId?._id || inquiry.productId,
          sellerName: inquiry.sellerName,
          sellerId: inquiry.sellerId?._id || inquiry.sellerId,
          buyerName: inquiry.buyerName,
          buyerId: inquiry.buyerId?._id || inquiry.buyerId,
          message: inquiry.message,
          messages: inquiry.messages || [],
          status: inquiry.status,
          createdAt: inquiry.createdAt,
          imageUrl: inquiry.productId?.images?.[0]?.url || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
          response: inquiry.messages?.length > 1 ? inquiry.messages[inquiry.messages.length - 1].message : null,
          contactMethod: 'message'
        }));

        this.inquiries.set(transformedInquiries);
        console.log('✅ Set', transformedInquiries.length, 'sent inquiries');
      },
      error: (error) => {
        console.error('❌ Error loading inquiries from backend:', error);

        // Fallback to localStorage
        this.loadUserInquiriesFromLocalStorage();
      }
    });
  }

  private loadUserInquiriesFromLocalStorage(): void {
    try {
      const currentUser = this.user();
      if (!currentUser) {
        this.inquiries.set([]);
        return;
      }

      console.log('🔄 Falling back to localStorage for user inquiries');

      const userSpecificKey = `tennis_buyer_inquiries_${currentUser._id}`;
      this.migrateLegacyInquiries(currentUser._id);

      const savedInquiries = localStorage.getItem(userSpecificKey);
      if (savedInquiries) {
        const inquiries = JSON.parse(savedInquiries);

        const validInquiries = inquiries.filter((inquiry: any) =>
          inquiry.productId && inquiry.message && inquiry.timestamp
        );

        const formattedInquiries: Inquiry[] = validInquiries.map((inquiry: any) => ({
          id: inquiry.productId + '_' + inquiry.timestamp,
          productTitle: inquiry.productTitle,
          productId: inquiry.productId,
          sellerName: inquiry.sellerName || 'Seller',
          sellerId: inquiry.sellerId,
          message: inquiry.message,
          response: inquiry.response || null,
          messages: inquiry.messages || null,
          status: inquiry.status === 'sent' ? 'pending' : inquiry.status,
          createdAt: inquiry.timestamp,
          imageUrl: inquiry.imageUrl || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
          contactMethod: inquiry.contactMethod
        }));

        this.inquiries.set(formattedInquiries);
        console.log('✅ Loaded inquiries from localStorage fallback');
      } else {
        this.inquiries.set([]);
      }
    } catch (error) {
      console.error('❌ Error loading user inquiries from localStorage:', error);
      this.inquiries.set([]);
    }
  }

  private migrateLegacyInquiries(userId: string): void {
    try {
      const legacyInquiries = localStorage.getItem('tennis_buyer_inquiries');
      const userSpecificKey = `tennis_buyer_inquiries_${userId}`;
      
      if (legacyInquiries && !localStorage.getItem(userSpecificKey)) {
        console.log('🔄 Migrating legacy inquiries to user-specific storage');
        
        // Move legacy inquiries to user-specific key for current user
        localStorage.setItem(userSpecificKey, legacyInquiries);
        localStorage.removeItem('tennis_buyer_inquiries');
        
        console.log('✅ Legacy inquiries migrated for user:', userId);
      }
    } catch (error) {
      console.error('❌ Error migrating legacy inquiries:', error);
    }
  }

  async loadSellerInquiries(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) {
      console.log('👤 No current user, cannot load seller inquiries');
      this.receivedInquiries.set([]);
      return;
    }

    console.log('🛍️ Loading received inquiries from backend for seller:', currentUser.email);

    // Fetch received inquiries (as seller) from backend API
    this.http.get(`${environment.apiUrl}/inquiries/my-inquiries?type=received&limit=50`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Loaded received inquiries from backend:', response);

        // Transform backend data to component format
        const transformedInquiries = response.inquiries.map((inquiry: any) => ({
          id: inquiry._id,
          productTitle: inquiry.productTitle,
          productId: inquiry.productId?._id || inquiry.productId,
          sellerName: inquiry.sellerName,
          sellerId: inquiry.sellerId?._id || inquiry.sellerId,
          buyerName: inquiry.buyerName,
          buyerId: inquiry.buyerId?._id || inquiry.buyerId,
          message: inquiry.message,
          messages: inquiry.messages || [],
          status: inquiry.status,
          createdAt: inquiry.createdAt,
          imageUrl: inquiry.productId?.images?.[0]?.url || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
          response: inquiry.messages?.length > 1 ? inquiry.messages[inquiry.messages.length - 1].message : null,
          contactMethod: 'message'
        }));

        this.receivedInquiries.set(transformedInquiries);
        console.log('✅ Set', transformedInquiries.length, 'received inquiries');
      },
      error: (error) => {
        console.error('❌ Error loading received inquiries from backend:', error);

        // Fallback to localStorage
        this.loadSellerInquiriesFromLocalStorage();
      }
    });
  }

  private async loadSellerInquiriesFromLocalStorage(): Promise<void> {
    try {
      const currentUser = this.user();
      if (!currentUser) {
        this.receivedInquiries.set([]);
        return;
      }

      console.log('🔄 Falling back to localStorage for seller inquiries');

      const receivedInquiries: Inquiry[] = [];

      // Iterate through all localStorage keys to find all user inquiries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tennis_buyer_inquiries_')) {
          const userInquiries = localStorage.getItem(key);
          if (userInquiries) {
            try {
              const inquiries = JSON.parse(userInquiries);
              if (Array.isArray(inquiries)) {
                // Filter inquiries where the current user is the seller
                const inquiriesForThisSeller = inquiries.filter((inquiry: any) =>
                  inquiry.sellerId === currentUser._id
                );

                // Process each inquiry and fetch buyer name
                for (const inquiry of inquiriesForThisSeller) {
                  const buyerName = await this.getBuyerNameFromKey(key);

                  const formattedInquiry: Inquiry = {
                    id: inquiry.productId + '_' + inquiry.timestamp,
                    productTitle: inquiry.productTitle,
                    productId: inquiry.productId,
                    sellerName: inquiry.sellerName || 'You',
                    sellerId: inquiry.sellerId || currentUser._id,
                    buyerName: buyerName,
                    buyerId: key.replace('tennis_buyer_inquiries_', ''),
                    message: inquiry.message,
                    messages: inquiry.messages || null,
                    status: inquiry.status || 'pending',
                    createdAt: inquiry.timestamp,
                    imageUrl: inquiry.imageUrl || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
                    response: inquiry.response || null,
                    contactMethod: inquiry.contactMethod
                  };

                  receivedInquiries.push(formattedInquiry);
                }
              }
            } catch (e) {
              console.error('Error parsing inquiries for key:', key, e);
            }
          }
        }
      }

      // Sort by timestamp (newest first)
      receivedInquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      this.receivedInquiries.set(receivedInquiries);
      console.log('✅ Loaded inquiries from localStorage fallback');

    } catch (error) {
      console.error('❌ Error loading seller inquiries from localStorage:', error);
      this.receivedInquiries.set([]);
    }
  }

  private async getBuyerNameFromKey(key: string): Promise<string> {
    const userId = key.replace('tennis_buyer_inquiries_', '');
    
    // Check cache first
    if (this.userNameCache.has(userId)) {
      console.log('🎯 Found cached name for user:', userId, '→', this.userNameCache.get(userId));
      return this.userNameCache.get(userId)!;
    }
    
    console.log('🔍 Fetching user name for ID:', userId);
    
    try {
      // Try to fetch user data from API
      const response = await this.http.get<any>(`${environment.apiUrl}/users/${userId}`, {
        headers: this.authService.getAuthHeaders()
      }).toPromise();
      console.log('📡 API response for user', userId, ':', response);
      
      if (response && response.firstName && response.lastName) {
        const fullName = `${response.firstName} ${response.lastName}`;
        console.log('✅ Successfully resolved user name:', userId, '→', fullName);
        this.userNameCache.set(userId, fullName);
        return fullName;
      } else {
        console.warn('⚠️ API response missing name fields:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching user name for ID:', userId, error);
    }
    
    // Fallback to showing partial user ID
    const fallbackName = `Buyer (${userId.substring(0, 8)}...)`;
    console.log('🔄 Using fallback name:', userId, '→', fallbackName);
    this.userNameCache.set(userId, fallbackName);
    return fallbackName;
  }


  loadSavedSearches(): void {
    const saved = localStorage.getItem('tennis-saved-searches');
    if (saved) {
      try {
        const searches = JSON.parse(saved);
        this.savedSearchCount.set(searches.length);
      } catch (e) {
        console.error('Error loading saved searches:', e);
      }
    }
  }

  updateTabCounts(): void {
    // Update tab counts based on data
    this.dashboardTabs[0].count = this.userProducts().length; // My Listings
    this.dashboardTabs[1].count = this.favoriteProducts().length; // Favorites
    this.dashboardTabs[2].count = this.purchaseHistory().length; // Purchases  
    this.dashboardTabs[3].count = this.inquiries().length + this.receivedInquiries().length; // Inquiries (both sent and received)
    this.dashboardTabs[4].count = this.recentActivity.length; // Activity
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
    
    // Refresh inquiries when switching to inquiries tab to show latest responses
    if (tabId === 'inquiries') {
      console.log('🔄 Refreshing inquiries for latest updates...');
      this.loadUserInquiries();
      this.loadSellerInquiries();
      this.updateTabCounts();
    }
  }

  getActiveTabLabel(): string {
    const activeTab = this.dashboardTabs.find(tab => tab.id === this.activeTab());
    return activeTab?.label || '';
  }

  onProductClick(product: Product): void {
    console.log('Navigate to product:', product);
    // In real app, navigate to product detail
  }

  onFavoriteClick(event: { product: Product, isFavorited: boolean }): void {
    console.log('💝 Favorite click:', event);
    
    if (event.isFavorited) {
      // Add to favorites
      this.productService.addToFavorites(event.product._id).subscribe({
        next: (response) => {
          console.log('✅ Added to favorites:', response);
          // Add to local favorites list
          const currentFavorites = this.favoriteProducts();
          if (!currentFavorites.find(p => p._id === event.product._id)) {
            this.favoriteProducts.set([...currentFavorites, event.product]);
          }
          this.updateTabCounts();
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
          // Remove from local favorites list
          const currentFavorites = this.favoriteProducts();
          const filtered = currentFavorites.filter(p => p._id !== event.product._id);
          this.favoriteProducts.set(filtered);
          this.updateTabCounts();
        },
        error: (error) => {
          console.error('❌ Failed to remove from favorites:', error);
        }
      });
    }
  }

  // Product management methods
  onEditProduct(product: Product): void {
    this.editingProduct.set(product);
  }

  onProductUpdated(updatedProduct: Product): void {
    // Update product in the list
    const products = this.userProducts();
    const index = products.findIndex(p => p._id === updatedProduct._id);
    if (index !== -1) {
      products[index] = updatedProduct;
      this.userProducts.set([...products]);
    }
    this.editingProduct.set(null);
  }

  onEditModalClosed(): void {
    this.editingProduct.set(null);
  }

  onDeleteProduct(product: Product): void {
    this.modalService.confirm(
      'Delete Product',
      `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    ).subscribe(result => {
      if (result.confirmed) {
        this.productService.deleteProduct(product._id).subscribe({
          next: () => {
            // Remove from list
            const currentProducts = this.userProducts();
            const filtered = currentProducts.filter(p => p._id !== product._id);
            this.userProducts.set(filtered);
            this.updateTabCounts();
            this.modalService.success('Product Deleted', 'Your product has been deleted successfully.');
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.modalService.error('Delete Failed', 'Failed to delete the product. Please try again.');
          }
        });
      }
    });
  }

  onBoostProduct(product: Product): void {
    this.coinService.boostListing(product._id, 'basic').subscribe({
      next: (response) => {
        // Update product in list
        const products = this.userProducts();
        const index = products.findIndex(p => p._id === product._id);
        if (index !== -1) {
          products[index].isBoosted = true;
          this.userProducts.set([...products]);
        }
        this.modalService.success('Product Boosted', 
          `Your product has been boosted for ${response.duration} days! ${response.coinsSpent} coins spent. New balance: ${response.newBalance} coins.`);
      },
      error: (error) => {
        console.error('Error boosting product:', error);
        const errorMessage = error.error?.error || 'Failed to boost product. Please try again.';
        this.modalService.error('Boost Failed', errorMessage);
      }
    });
  }

  onMarkAsSold(product: Product): void {
    this.modalService.confirm(
      'Mark Product as Sold',
      `Are you sure you want to mark "${product.title}" as sold? This will deduct a 10% transaction fee (₱${Math.ceil(product.price * 0.10)}) from your coin balance.`,
      'Mark as Sold',
      'Cancel'
    ).subscribe(result => {
      if (result.confirmed) {
        this.productService.markAsSold(product._id).subscribe({
          next: (response) => {
            // Update product in list
            const products = this.userProducts();
            const index = products.findIndex(p => p._id === product._id);
            if (index !== -1) {
              products[index].availability = 'sold';
              this.userProducts.set([...products]);
            }
            this.updateTabCounts();
            this.modalService.success(
              'Product Marked as Sold', 
              `${response.message} Transaction fee of ${response.transactionFee} coins deducted. Your new coin balance is ${response.newCoinBalance}.`
            );
          },
          error: (error) => {
            console.error('Error marking product as sold:', error);
            const errorMsg = error.error?.error || 'Failed to mark product as sold. Please try again.';
            this.modalService.error('Failed to Mark as Sold', errorMsg);
          }
        });
      }
    });
  }

  getStatusBadgeClass(product: Product): string {
    if (product.isApproved === 'approved') {
      return 'bg-green-100 text-green-800';
    } else if (product.isApproved === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (product.isApproved === 'rejected') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  getAvailabilityBadgeClass(availability: string): string {
    const classes = {
      'available': 'bg-green-100 text-green-800',
      'sold': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'reserved': 'bg-blue-100 text-blue-800'
    };
    return classes[availability as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getPurchaseStatusClass(status: string): string {
    const classes = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status as keyof typeof classes] || classes.pending;
  }

  getInquiryStatusClass(status: string): string {
    const classes = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'responded': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return classes[status as keyof typeof classes] || classes.pending;
  }

  // Seller inquiry management methods
  respondToInquiry(inquiry: Inquiry): void {
    console.log('🔥 RESPOND BUTTON CLICKED! Function called with inquiry:', inquiry);
    this.modalService.prompt(
      'Respond to Inquiry',
      `<strong>Product:</strong> ${inquiry.productTitle}<br><strong>Buyer:</strong> ${inquiry.buyerName}<br><strong>Message:</strong> "${inquiry.message}"<br><br>Send your response to this inquiry:`,
      'Type your response here...'
    ).then((response: string) => {
      console.log('📝 Modal response received:', response);
      if (response && response.trim()) {
        console.log('✅ Response valid, calling saveInquiryResponse');
        this.saveInquiryResponse(inquiry, response.trim());
      } else {
        console.log('❌ Response empty or invalid');
      }
    }).catch((error) => {
      console.log('❌ Modal cancelled or error:', error);
    });
  }

  // Reply to existing conversation (for sellers)
  replyToInquiry(inquiry: Inquiry): void {
    console.log('🔥 REPLY BUTTON CLICKED! Function called with inquiry:', inquiry);
    const currentUser = this.user();
    if (!currentUser) {
      console.log('❌ No current user, returning');
      return;
    }

    console.log('💬 Seller replying to inquiry:', inquiry.id, 'User:', currentUser.email);

    // Show reply modal directly
    this.modalService.prompt(
      'Reply to Conversation',
      `<strong>Product:</strong> ${inquiry.productTitle}<br><strong>Buyer:</strong> ${inquiry.buyerName}<br><br>Continue the conversation:`,
      'Type your reply here...'
    ).then((reply: string) => {
      if (reply && reply.trim()) {
        this.sendSellerReply(inquiry, reply.trim());
      }
    }).catch(() => {
      // User cancelled
    });
  }

  private sendSellerReply(inquiry: Inquiry, reply: string): void {
    console.log('🚀 SEND SELLER REPLY CALLED!', { inquiry: inquiry.id, reply });
    const currentUser = this.user();
    if (!currentUser) {
      console.log('❌ No current user in sendSellerReply');
      return;
    }

    console.log('📤 Sending seller reply:', { inquiryId: inquiry.id, reply: reply.substring(0, 50) + '...' });

    // Send reply to backend API
    this.http.post(`${environment.apiUrl}/inquiries/${inquiry.id}/reply`, {
      message: reply
    }, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Seller reply sent successfully:', response);

        // Reload inquiries to show the updated conversation
        this.loadSellerInquiries();
        this.loadUserInquiries(); // Also reload in case buyer is viewing same profile
        this.updateTabCounts();

        this.modalService.showSuccess(
          'Reply Sent!',
          'Your reply has been sent to the buyer.'
        );
      },
      error: (error) => {
        console.error('❌ Error sending seller reply:', error);
        this.modalService.showError(
          'Error',
          'Failed to send reply. Please try again.'
        );
      }
    });
  }

  private saveInquiryResponse(inquiry: Inquiry, response: string): void {
    console.log('🚀 SAVE INQUIRY RESPONSE CALLED!', { inquiry: inquiry.id, response });
    const currentUser = this.user();
    if (!currentUser) {
      console.log('❌ No current user in saveInquiryResponse');
      return;
    }

    console.log('📤 Sending inquiry response to backend:', { inquiryId: inquiry.id, response: response.substring(0, 50) + '...' });

    // Send response to backend API (same as sendSellerReply)
    this.http.post(`${environment.apiUrl}/inquiries/${inquiry.id}/reply`, {
      message: response
    }, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).subscribe({
      next: (apiResponse: any) => {
        console.log('✅ Inquiry response sent successfully:', apiResponse);

        // Reload inquiries to show the updated conversation
        this.loadSellerInquiries();
        this.loadUserInquiries(); // Also reload in case buyer is viewing same profile
        this.updateTabCounts();

        this.modalService.showSuccess(
          'Response Sent!',
          'Your response has been sent to the buyer.'
        );
      },
      error: (error) => {
        console.error('❌ Error sending inquiry response:', error);
        this.modalService.showError(
          'Error',
          'Failed to send response. Please try again.'
        );
      }
    });
  }

  contactBuyer(inquiry: Inquiry): void {
    if (inquiry.contactMethod === 'whatsapp') {
      // Extract phone number from contact method or use a default approach
      const phoneNumber = '639123456789'; // This would come from buyer's profile in a real app
      const message = `Hi! Regarding your inquiry about ${inquiry.productTitle}: "${inquiry.message}"`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else if (inquiry.contactMethod === 'phone') {
      // In a real app, you'd get the buyer's phone number from their profile
      this.modalService.showInfo(
        'Contact Buyer',
        `Contact information would be displayed here for buyer: ${inquiry.buyerName}`
      );
    } else {
      this.modalService.showInfo(
        'Contact Buyer',
        `Buyer contact details would be available in the full version. Inquiry from: ${inquiry.buyerName}`
      );
    }
  }

  // Buyer reply methods
  replyToSeller(inquiry: Inquiry): void {
    const currentUser = this.user();
    if (!currentUser) return;

    // Get the latest message from the conversation
    let previousMessage = 'No previous messages';
    if (inquiry.messages && inquiry.messages.length > 0) {
      const lastMessage = inquiry.messages[inquiry.messages.length - 1];
      previousMessage = `"${lastMessage.message}" (from ${lastMessage.senderName})`;
    } else if (inquiry.response) {
      // Fallback to legacy response format
      previousMessage = `"${inquiry.response}"`;
    }

    this.modalService.prompt(
      'Reply to Seller',
      `<strong>Product:</strong> ${inquiry.productTitle}<br><strong>Seller:</strong> ${inquiry.sellerName}<br><strong>Previous Response:</strong> ${previousMessage}<br><br>Send your reply:`,
      'Type your reply here...'
    ).then((reply: string) => {
      if (reply && reply.trim()) {
        this.saveBuyerReply(inquiry, reply.trim());
      }
    }).catch(() => {
      // User cancelled
    });
  }

  private saveBuyerReply(inquiry: Inquiry, reply: string): void {
    console.log('🚀 SAVE BUYER REPLY CALLED!', { inquiry: inquiry.id, reply });
    const currentUser = this.user();
    if (!currentUser) {
      console.log('❌ No current user in saveBuyerReply');
      return;
    }

    console.log('📤 Sending buyer reply to backend:', { inquiryId: inquiry.id, reply: reply.substring(0, 50) + '...' });

    // Send reply to backend API (same endpoint as seller replies)
    this.http.post(`${environment.apiUrl}/inquiries/${inquiry.id}/reply`, {
      message: reply
    }, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).subscribe({
      next: (apiResponse: any) => {
        console.log('✅ Buyer reply sent successfully:', apiResponse);

        // Reload inquiries to show the updated conversation
        this.loadUserInquiries(); // Reload buyer inquiries
        this.loadSellerInquiries(); // Also reload in case seller is viewing same profile
        this.updateTabCounts();

        this.modalService.showSuccess(
          'Reply Sent!',
          'Your reply has been sent to the seller.'
        );
      },
      error: (error) => {
        console.error('❌ Error sending buyer reply:', error);
        this.modalService.showError(
          'Error',
          'Failed to send reply. Please try again.'
        );
      }
    });
  }

  // Verification methods
  loadVerificationStatus(): void {
    const user = this.user();
    if (!user) return;
    
    // Mock verification status based on user data
    // In real app, this would call the verification API
    if (user.isVerified) {
      this.verificationStatus.set('verified');
    } else {
      // For demo purposes, show different states
      // In real app, this would come from API call to /api/verification/status
      this.verificationStatus.set('none');
    }
    
    console.log('📋 Loading verification status...');
    // Example API call:
    // this.http.get('/api/verification/status').subscribe(...)
  }

  requestVerification(): void {
    const user = this.user();
    if (!user) return;

    // Show verification requirements modal
    this.modalService.confirm(
      'Verification Requirements',
      `Before we can verify your account, you'll need to provide:
      
      <ul class="list-disc list-inside mt-2 space-y-1">
        <li>Government-issued ID (Driver's License, Passport, or National ID)</li>
        <li>Proof of address (Utility bill or Bank statement, not older than 3 months)</li>
        <li>Business permit (if selling professionally)</li>
      </ul>
      
      <p class="mt-3 font-medium">Your documents will be reviewed within 2-3 business days.</p>`,
      'Proceed with Upload',
      'Cancel'
    ).subscribe(result => {
      if (!result.confirmed) return;

    // Mock document upload process
    // In real app, this would open a document upload modal
    const mockDocuments = [
      {
        type: 'government_id',
        url: 'https://example.com/mock-id-document.jpg'
      }
    ];

    console.log('📤 Requesting verification with documents:', mockDocuments);
    
    // Mock API call
    // this.http.post('/api/verification/request', { documents: mockDocuments }).subscribe(...)
    
      // Mock success response
      this.verificationStatus.set('pending');
      this.modalService.success('Verification Submitted', 'Your verification request has been submitted successfully! You will be notified via email once reviewed.');
    });
  }
}