import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductCardComponent } from '../components/product-card.component';
import { Product, ProductService, ProductsResponse } from '../services/product.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CoinService } from '../services/coin.service';
import { AuthService } from '../services/auth.service';
import { LowBalanceModalComponent } from '../components/low-balance-modal.component';
import { CoinPurchaseModalComponent } from '../components/coin-purchase-modal.component';

interface FilterState {
  category: string;
  condition: string[];
  priceMin: number | null;
  priceMax: number | null;
  location: string;
  search: string;
  sortBy: string;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

interface RecentlyViewedProduct {
  productId: string;
  viewedAt: string;
  product: Product;
}

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, LowBalanceModalComponent, CoinPurchaseModalComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-dark-50 dark:via-dark-100 dark:to-dark-50 transition-colors duration-300">
      <!-- Mobile-Optimized Search Header -->
      <div class="sticky top-0 z-40 bg-white/95 dark:bg-dark-100/95 backdrop-blur-xl shadow-soft dark:shadow-strong border-b border-neutral-200/60 dark:border-dark-200/60 safe-top">
        <div class="max-w-7xl mx-auto px-4 py-2 md:py-4 safe-left safe-right">
          <div class="flex flex-col sm:flex-row gap-2 md:gap-4 items-center justify-between">
            <!-- Compact Search Bar -->
            <div class="relative flex-none w-full max-w-xs sm:max-w-sm md:max-w-md">
              <input 
                type="text" 
                [(ngModel)]="filters().search"
                (input)="onSearchChange()"
                placeholder="Search gear..." 
                class="form-input block w-full pl-3 md:pl-4 pr-16 md:pr-20 py-2.5 md:py-4 text-sm md:text-lg placeholder:text-neutral-400 dark:placeholder:text-dark-500 shadow-soft hover:shadow-medium focus:shadow-medium transition-all duration-200">
              
              <!-- Search Icon (Right Side) -->
              <div class="absolute inset-y-0 right-10 md:right-14 flex items-center pointer-events-none">
                <svg class="h-4 w-4 md:h-5 md:w-5 text-neutral-400 dark:text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              
              <!-- Compact Clear Search Button -->
              <button 
                *ngIf="filters().search"
                (click)="clearSearch()"
                class="absolute inset-y-0 right-0 pr-2 md:pr-3 flex items-center text-neutral-400 dark:text-dark-500 hover:text-red-500 transition-all duration-200 hover:scale-110"
                title="Clear search">
                <div class="p-0.5 md:p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200">
                  <svg class="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
              </button>
            </div>
            
            <!-- Compact Mobile Filter Toggle -->
            <button 
              class="lg:hidden flex items-center gap-2 md:gap-3 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-3 py-2.5 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-200 hover:bg-primary-100 dark:hover:bg-primary-800/40 hover:scale-105 shadow-soft hover:shadow-medium text-sm md:text-base"
              (click)="toggleMobileFilters()">
              <svg class="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
              </svg>
              <span class="hidden xs:inline">Filters</span>
              <span *ngIf="getActiveFiltersCount() > 0" class="bg-primary-500 dark:bg-primary-600 text-white text-xs rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-bold animate-bounce-gentle shadow-soft">{{ getActiveFiltersCount() }}</span>
            </button>
            
            <!-- Enhanced Sort Dropdown -->
            <div class="hidden lg:flex items-center gap-4">
              <label class="text-sm font-semibold text-neutral-700 dark:text-dark-800">Sort by:</label>
              <div class="relative">
                <select 
                  [(ngModel)]="filters().sortBy"
                  (change)="onFiltersChange()"
                  class="form-input py-3 pr-10 font-medium shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer appearance-none">
                  <option value="newest">🆕 Newest First</option>
                  <option value="price-low">📈 Price: Low to High</option>
                  <option value="price-high">📉 Price: High to Low</option>
                  <option value="popular">🔥 Most Popular</option>
                  <option value="boosted">⭐ Boosted First</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="h-4 w-4 text-neutral-400 dark:text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile-Optimized Quick Filters Section -->
      <div class="bg-white/90 dark:bg-dark-100/90 backdrop-blur-sm border-b border-neutral-100 dark:border-dark-200">
        <div class="max-w-7xl mx-auto px-4 py-3 md:py-6 safe-left safe-right">
          <div class="space-y-3 md:space-y-5">
            <!-- Compact Quick Filter Chips for Mobile -->
            <div class="animate-fade-in-up">
              <div class="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 md:gap-3">
                <span class="text-xs md:text-sm font-bold text-neutral-700 dark:text-dark-800 flex items-center gap-1.5 md:gap-2 mb-1 sm:mb-0">
                  <svg class="w-3 h-3 md:w-4 md:h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span class="hidden sm:inline">Quick filters:</span>
                  <span class="sm:hidden">Filters:</span>
                </span>
                <div class="flex flex-wrap items-center gap-1.5 md:gap-3 w-full sm:w-auto">
                  <button 
                    *ngFor="let quickFilter of quickFilters; trackBy: trackByQuickFilter"
                    (click)="applyQuickFilter(quickFilter)"
                    class="group inline-flex items-center px-2.5 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm font-bold bg-gradient-to-r from-primary-50 to-green-50 dark:from-primary-900/30 dark:to-green-900/30 text-primary-700 dark:text-primary-400 rounded-xl md:rounded-2xl hover:from-primary-100 hover:to-green-100 dark:hover:from-primary-800/40 dark:hover:to-green-800/40 transition-all duration-300 border border-primary-200/50 dark:border-primary-700/50 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-soft hover:scale-105">
                    {{ quickFilter.label }}
                  </button>
                  <button 
                    (click)="toggleSaveSearchModal()"
                    class="group inline-flex items-center px-2.5 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm font-bold bg-gradient-to-r from-accent-blue/10 to-purple-500/10 dark:from-accent-blue/20 dark:to-purple-500/20 text-accent-blue dark:text-blue-400 rounded-xl md:rounded-2xl hover:from-accent-blue/20 hover:to-purple-500/20 dark:hover:from-accent-blue/30 dark:hover:to-purple-500/30 transition-all duration-300 border border-accent-blue/20 dark:border-blue-700/50 hover:border-accent-blue/30 dark:hover:border-blue-600 hover:shadow-soft hover:scale-105">
                    <svg class="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                    </svg>
                    <span class="hidden sm:inline">Save Search</span>
                    <span class="sm:hidden">Save</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Enhanced Saved Searches -->
            <div *ngIf="savedSearches().length > 0" class="animate-fade-in-up" style="animation-delay: 0.1s">
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-sm font-bold text-neutral-700 dark:text-dark-800 flex items-center gap-2">
                  <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                  Saved searches:
                </span>
                <button 
                  *ngFor="let search of savedSearches(); trackBy: trackBySavedSearch"
                  (click)="applySavedSearch(search)"
                  class="group inline-flex items-center px-4 py-2 text-sm font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-all duration-200 border border-purple-200 dark:border-purple-700/50 hover:scale-105 shadow-soft">
                  <span class="text-base mr-2 group-hover:scale-110 transition-transform duration-200">🔍</span>
                  <span class="group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">{{ search.name }}</span>
                  <button 
                    (click)="deleteSavedSearch(search.id, $event)"
                    class="ml-2 text-purple-400 dark:text-purple-500 hover:text-red-500 dark:hover:text-red-400 hover:scale-125 transition-all duration-200 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </button>
              </div>
            </div>

            <!-- Enhanced Recently Viewed -->
            <div *ngIf="recentlyViewed().length > 0" class="animate-fade-in-up" style="animation-delay: 0.2s">
              <div class="flex items-center gap-4">
                <span class="text-sm font-bold text-neutral-700 dark:text-dark-800 flex items-center gap-2">
                  <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Recently viewed:
                </span>
                <div class="flex gap-3 overflow-x-auto scrollbar-hide custom-scrollbar pb-2">
                  <div 
                    *ngFor="let item of recentlyViewed().slice(0, 8); trackBy: trackByRecentlyViewed"
                    (click)="onProductClick(item.product)"
                    class="flex-shrink-0 cursor-pointer group animate-scale-in">
                    <div class="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-primary-300 dark:group-hover:border-primary-600 transition-all duration-300 group-hover:scale-110 shadow-soft group-hover:shadow-medium">
                      <img 
                        [src]="getMainImageUrl(item.product)" 
                        [alt]="item.product.title"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div class="absolute bottom-1 left-1 right-1 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div class="text-xs text-white font-bold text-center bg-black/60 backdrop-blur-sm rounded px-1 py-0.5">
                          ₱{{ formatCompactPrice(item.product.price) }}
                        </div>
                      </div>
                    </div>
                    <div class="text-xs text-neutral-600 dark:text-dark-700 mt-2 text-center truncate w-20 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200" 
                         [title]="item.product.title">
                      {{ item.product.title }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="lg:grid lg:grid-cols-4 lg:gap-8 relative">
          <!-- Enhanced Mobile Filter Overlay -->
          <div *ngIf="showMobileFilters()" class="fixed inset-0 z-50 lg:hidden">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md animate-fade-in" (click)="toggleMobileFilters()"></div>
            
            <!-- Filter Panel -->
            <div class="absolute right-0 top-0 h-full w-full max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl overflow-y-auto animate-slide-left border-l border-neutral-200/30">
              <!-- Header -->
              <div class="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-neutral-200/50 p-6">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-soft">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-neutral-900">Filters</h3>
                      <p class="text-sm text-neutral-600">Find your perfect gear</p>
                    </div>
                  </div>
                  <button 
                    (click)="toggleMobileFilters()" 
                    class="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105">
                    <svg class="h-5 w-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                
                <!-- Results and Clear All -->
                <div class="flex items-center justify-between bg-gradient-to-r from-primary-50/70 to-green-50/70 rounded-2xl p-4 border border-primary-200/30">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                      <span class="text-sm font-bold text-primary-700">{{ filteredProducts().length }}</span>
                    </div>
                    <span class="text-sm font-medium text-neutral-700">Results found</span>
                  </div>
                  <button 
                    (click)="clearAllFilters()" 
                    class="text-sm text-primary-600 hover:text-primary-700 font-semibold bg-white/80 px-3 py-2 rounded-xl hover:bg-white transition-all duration-200 border border-primary-200/50">
                    Clear All
                  </button>
                </div>
              </div>
                
              <!-- Filter Content -->
              <div class="p-6 space-y-8">
                <!-- Category Filter -->
                <div class="space-y-4">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                    </div>
                    <h4 class="text-lg font-bold text-neutral-900">Category</h4>
                  </div>
                  <div class="space-y-2">
                    <div *ngFor="let category of categories" 
                         class="group relative overflow-hidden rounded-2xl border border-neutral-200/60 hover:border-primary-300 transition-all duration-200">
                      <label class="flex items-center justify-between p-4 cursor-pointer hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                        <div class="flex items-center gap-3">
                          <div class="relative">
                            <input 
                              type="radio" 
                              [value]="category.value"
                              [(ngModel)]="filters().category"
                              (change)="onFiltersChange()"
                              class="w-5 h-5 text-primary-600 border-2 border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-full">
                            <div class="absolute inset-0 rounded-full bg-primary-100/50 scale-0 group-hover:scale-100 transition-transform duration-200 -z-10"></div>
                          </div>
                          <span class="font-medium text-neutral-800 group-hover:text-primary-700 transition-colors">{{ category.name }}</span>
                        </div>
                        <div class="bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-600 text-xs font-bold px-3 py-1.5 rounded-xl group-hover:from-primary-100 group-hover:to-primary-200 group-hover:text-primary-700 transition-all duration-200">
                          {{ category.count }}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Condition Filter -->
                <div class="space-y-4">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h4 class="text-lg font-bold text-neutral-900">Condition</h4>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <label *ngFor="let condition of conditions" 
                           class="group flex items-center gap-3 p-4 rounded-2xl border border-neutral-200/60 hover:border-green-300 hover:bg-gradient-to-r hover:from-green-50/30 hover:to-transparent cursor-pointer transition-all duration-200">
                      <div class="relative">
                        <input 
                          type="checkbox" 
                          [value]="condition"
                          [checked]="filters().condition.includes(condition)"
                          (change)="onConditionChange(condition, $event)"
                          class="w-5 h-5 text-green-600 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        <div class="absolute inset-0 rounded-lg bg-green-100/50 scale-0 group-hover:scale-100 transition-transform duration-200 -z-10"></div>
                      </div>
                      <span class="text-sm font-medium text-neutral-700 group-hover:text-green-700 transition-colors">{{ condition }}</span>
                    </label>
                  </div>
                </div>

                <!-- Price Range Filter -->
                <div class="space-y-4">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                      <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                      </svg>
                    </div>
                    <h4 class="text-lg font-bold text-neutral-900">Price Range</h4>
                  </div>
                  <div class="space-y-4">
                    <!-- Custom Range Inputs -->
                    <div class="bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-2xl p-4 border border-amber-200/30">
                      <div class="flex items-center gap-3 mb-3">
                        <span class="text-sm font-medium text-neutral-700">Custom Range</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="flex-1">
                          <input 
                            type="number" 
                            [(ngModel)]="filters().priceMin"
                            (input)="onFiltersChange()"
                            placeholder="Min ₱"
                            class="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80 placeholder-neutral-400">
                        </div>
                        <div class="w-8 h-0.5 bg-gradient-to-r from-neutral-300 to-neutral-400 rounded-full"></div>
                        <div class="flex-1">
                          <input 
                            type="number" 
                            [(ngModel)]="filters().priceMax"
                            (input)="onFiltersChange()"
                            placeholder="Max ₱"
                            class="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80 placeholder-neutral-400">
                        </div>
                      </div>
                    </div>
                    
                    <!-- Quick Price Ranges -->
                    <div class="grid grid-cols-2 gap-3">
                      <button 
                        *ngFor="let range of priceRanges"
                        (click)="setPriceRange(range.min, range.max)"
                        class="group p-4 border-2 border-neutral-200 rounded-xl hover:border-amber-300 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/50 transition-all duration-200 hover:scale-105 hover:shadow-soft">
                        <div class="text-xs font-bold text-neutral-700 group-hover:text-amber-700 transition-colors">{{ range.label }}</div>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Location Filter -->
                <div class="space-y-4">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                      <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <h4 class="text-lg font-bold text-neutral-900">Location</h4>
                  </div>
                  <div class="relative">
                    <select 
                      [(ngModel)]="filters().location"
                      (change)="onFiltersChange()"
                      class="w-full appearance-none border-2 border-neutral-200 rounded-xl px-4 py-4 pr-12 bg-gradient-to-r from-purple-50/50 to-pink-50/50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-neutral-800 font-medium transition-all duration-200">
                      <option value="">All Locations</option>
                      <option *ngFor="let location of locations" [value]="location">{{ location }}</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
                
              <!-- Apply Button -->
              <div class="sticky bottom-0 bg-white/90 backdrop-blur-xl border-t border-neutral-200/50 p-6">
                <button 
                  (click)="toggleMobileFilters()"
                  class="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-105 hover:shadow-strong flex items-center justify-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  Show {{ filteredProducts().length }} Results
                </button>
              </div>
            </div>
          </div>

          <!-- Enhanced Desktop Filters Sidebar -->
          <div class="hidden lg:block lg:col-span-1">
            <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-strong border border-neutral-200/40 overflow-hidden sticky top-24">
              <!-- Header -->
              <div class="bg-gradient-to-r from-primary-50/80 to-green-50/80 border-b border-neutral-200/50 p-6">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-soft">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-neutral-900">Filters</h3>
                      <p class="text-sm text-neutral-600">Refine your search</p>
                    </div>
                  </div>
                </div>
                
                <!-- Results Counter & Clear -->
                <div class="flex items-center justify-between bg-white/80 rounded-2xl p-3 border border-neutral-200/50">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                      <span class="text-sm font-bold text-primary-700">{{ filteredProducts().length }}</span>
                    </div>
                    <span class="text-sm font-medium text-neutral-700">Results</span>
                  </div>
                  <button 
                    (click)="clearAllFilters()" 
                    class="text-sm text-primary-600 hover:text-primary-700 font-semibold bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl transition-all duration-200 border border-primary-200/50">
                    Clear All
                  </button>
                </div>
              </div>

              <!-- Filter Content -->
              <div class="p-6 space-y-8">
                <!-- Category Filter -->
                <div class="space-y-4">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                    </div>
                    <h4 class="text-base font-bold text-neutral-900">Category</h4>
                  </div>
                  <div class="space-y-2">
                    <div *ngFor="let category of categories" 
                         class="group relative overflow-hidden rounded-xl border border-neutral-200/60 hover:border-primary-300 transition-all duration-200">
                      <label class="flex items-center justify-between p-3 cursor-pointer hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                        <div class="flex items-center gap-3">
                          <div class="relative">
                            <input 
                              type="radio" 
                              [value]="category.value"
                              [(ngModel)]="filters().category"
                              (change)="onFiltersChange()"
                              class="w-4 h-4 text-primary-600 border-2 border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-full">
                            <div class="absolute inset-0 rounded-full bg-primary-100/50 scale-0 group-hover:scale-100 transition-transform duration-200 -z-10"></div>
                          </div>
                          <span class="text-sm font-medium text-neutral-800 group-hover:text-primary-700 transition-colors">{{ category.name }}</span>
                        </div>
                        <div class="bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-600 text-xs font-bold px-2.5 py-1 rounded-lg group-hover:from-primary-100 group-hover:to-primary-200 group-hover:text-primary-700 transition-all duration-200">
                          {{ category.count }}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Condition Filter -->
                <div class="space-y-4">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h4 class="text-base font-bold text-neutral-900">Condition</h4>
                  </div>
                  <div class="space-y-2">
                    <label *ngFor="let condition of conditions" 
                           class="group flex items-center gap-3 p-3 rounded-xl border border-neutral-200/60 hover:border-green-300 hover:bg-gradient-to-r hover:from-green-50/30 hover:to-transparent cursor-pointer transition-all duration-200">
                      <div class="relative">
                        <input 
                          type="checkbox" 
                          [value]="condition"
                          [checked]="filters().condition.includes(condition)"
                          (change)="onConditionChange(condition, $event)"
                          class="w-4 h-4 text-green-600 border-2 border-neutral-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        <div class="absolute inset-0 rounded bg-green-100/50 scale-0 group-hover:scale-100 transition-transform duration-200 -z-10"></div>
                      </div>
                      <span class="text-sm font-medium text-neutral-700 group-hover:text-green-700 transition-colors">{{ condition }}</span>
                    </label>
                  </div>
                </div>

                <!-- Price Range Filter -->
                <div class="space-y-4">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                      <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                      </svg>
                    </div>
                    <h4 class="text-base font-bold text-neutral-900">Price Range</h4>
                  </div>
                  <div class="space-y-4">
                    <!-- Custom Range Inputs -->
                    <div class="bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-xl p-4 border border-amber-200/30">
                      <div class="flex items-center gap-3 mb-3">
                        <span class="text-sm font-medium text-neutral-700">Custom Range</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="flex-1">
                          <input 
                            type="number" 
                            [(ngModel)]="filters().priceMin"
                            (input)="onFiltersChange()"
                            placeholder="Min ₱"
                            class="w-full border-2 border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80 placeholder-neutral-400">
                        </div>
                        <div class="w-6 h-0.5 bg-gradient-to-r from-neutral-300 to-neutral-400 rounded-full"></div>
                        <div class="flex-1">
                          <input 
                            type="number" 
                            [(ngModel)]="filters().priceMax"
                            (input)="onFiltersChange()"
                            placeholder="Max ₱"
                            class="w-full border-2 border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80 placeholder-neutral-400">
                        </div>
                      </div>
                    </div>
                    
                    <!-- Quick Price Ranges -->
                    <div class="grid grid-cols-2 gap-2">
                      <button 
                        *ngFor="let range of priceRanges"
                        (click)="setPriceRange(range.min, range.max)"
                        class="group p-3 border-2 border-neutral-200 rounded-lg hover:border-amber-300 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/50 transition-all duration-200 hover:scale-105 hover:shadow-soft">
                        <div class="text-xs font-bold text-neutral-700 group-hover:text-amber-700 transition-colors">{{ range.label }}</div>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Location Filter -->
                <div class="space-y-4">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                      <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <h4 class="text-base font-bold text-neutral-900">Location</h4>
                  </div>
                  <div class="relative">
                    <select 
                      [(ngModel)]="filters().location"
                      (change)="onFiltersChange()"
                      class="w-full appearance-none border-2 border-neutral-200 rounded-xl px-4 py-3 pr-10 bg-gradient-to-r from-purple-50/50 to-pink-50/50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-neutral-800 font-medium transition-all duration-200">
                      <option value="">All Locations</option>
                      <option *ngFor="let location of locations" [value]="location">{{ location }}</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Active Filters Summary -->
                <div *ngIf="getActiveFiltersCount() > 0" class="pt-4 border-t border-neutral-200/50">
                  <div class="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-4 border border-primary-200/50">
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span class="text-sm font-bold text-primary-800">{{ getActiveFiltersCount() }} filter{{ getActiveFiltersCount() > 1 ? 's' : '' }} active</span>
                    </div>
                    <p class="text-xs text-primary-700">Showing {{ filteredProducts().length }} matching results</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Products Grid -->
          <div class="lg:col-span-3 mt-6 lg:mt-0">
            <!-- Enhanced Results Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div class="space-y-1">
                <div class="text-2xl font-bold text-neutral-900">
                  {{ pagination().totalItems }} 
                  <span class="text-lg font-medium text-neutral-600">
                    {{ pagination().totalItems === 1 ? 'result' : 'results' }}
                  </span>
                  <span *ngIf="filters().search" class="text-primary-600">for "{{ filters().search }}"</span>
                </div>
                <div class="text-sm text-neutral-500">
                  Showing {{ startItem() }} - {{ endItem() }} of {{ pagination().totalItems }}
                </div>
              </div>
              
              <!-- Enhanced View Toggle and Sort (Mobile) -->
              <div class="flex items-center gap-3">
                <!-- Mobile Sort -->
                <select 
                  [(ngModel)]="filters().sortBy"
                  (change)="onFiltersChange()"
                  class="lg:hidden border border-neutral-200 rounded-2xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price ↑</option>
                  <option value="price-high">Price ↓</option>
                  <option value="popular">Popular</option>
                  <option value="boosted">Boosted</option>
                </select>
                
                <!-- Enhanced View Toggle -->
                <div class="flex items-center bg-neutral-100 rounded-2xl p-1">
                  <button 
                    (click)="setViewMode('grid')"
                    [class]="viewMode() === 'grid' ? 'bg-white text-primary-600 shadow-soft' : 'text-neutral-500 hover:text-neutral-700'"
                    class="p-2.5 rounded-xl transition-all duration-200"
                    aria-label="Grid view">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  </button>
                  <button 
                    (click)="setViewMode('list')"
                    [class]="viewMode() === 'list' ? 'bg-white text-primary-600 shadow-soft' : 'text-neutral-500 hover:text-neutral-700'"
                    class="p-2.5 rounded-xl transition-all duration-200"
                    aria-label="List view">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Enhanced Loading State -->
            <div *ngIf="isLoading()" class="py-16">
              <div class="flex flex-col items-center justify-center space-y-6">
                <div class="relative">
                  <div class="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
                  <div class="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 opacity-20 animate-pulse"></div>
                </div>
                <div class="text-center space-y-2">
                  <p class="text-lg font-medium text-neutral-700">Finding amazing tennis gear...</p>
                  <p class="text-sm text-neutral-500">Please wait while we search our marketplace</p>
                </div>
              </div>
              
              <!-- Loading Skeleton -->
              <div class="mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let i of [1,2,3,4,5,6]" class="animate-pulse">
                  <div class="bg-white rounded-3xl shadow-card overflow-hidden">
                    <div class="h-64 bg-gradient-to-r from-neutral-200 to-neutral-300"></div>
                    <div class="p-5 space-y-3">
                      <div class="h-5 bg-neutral-200 rounded-2xl"></div>
                      <div class="h-4 bg-neutral-200 rounded-2xl w-3/4"></div>
                      <div class="flex items-center justify-between">
                        <div class="h-6 bg-neutral-200 rounded-2xl w-20"></div>
                        <div class="h-4 bg-neutral-200 rounded-full w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Enhanced Error State -->
            <div *ngIf="hasError() && !isLoading()" class="text-center py-16">
              <div class="max-w-md mx-auto">
                <div class="mb-6">
                  <div class="w-16 h-16 bg-gradient-to-r from-error/20 to-error/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-neutral-900 mb-2">Oops! Something went wrong</h3>
                  <p class="text-neutral-600 mb-6">We couldn't load the products right now. Please check your connection and try again.</p>
                  <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <button 
                      (click)="loadProducts()"
                      class="bg-primary-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-soft hover:shadow-medium">
                      Try Again
                    </button>
                    <button 
                      (click)="clearAllFilters()"
                      class="border border-neutral-200 text-neutral-700 px-6 py-3 rounded-2xl font-medium hover:bg-neutral-50 transition-colors">
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Enhanced Products Grid/List -->
            <div *ngIf="!isLoading() && !hasError() && filteredProducts().length > 0; else noResults">
              <!-- Grid View -->
              <div 
                *ngIf="viewMode() === 'grid'"
                class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <app-product-card 
                  *ngFor="let product of paginatedProducts(); trackBy: trackByProduct" 
                  [product]="product"
                  [isFavorited]="isFavorited(product._id)"
                  (productClick)="onProductClick($event)"
                  (favoriteClick)="onFavoriteClick($event)"
                  class="animate-fade-in">
                </app-product-card>
              </div>

              <!-- Enhanced List View -->
              <div 
                *ngIf="viewMode() === 'list'"
                class="space-y-4">
                <div 
                  *ngFor="let product of paginatedProducts(); trackBy: trackByProduct"
                  class="group bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-card border border-neutral-200/60 hover:shadow-card-hover transition-all duration-300 cursor-pointer animate-fade-in hover:-translate-y-0.5"
                  (click)="onProductClick(product)">
                  <div class="flex gap-6">
                    <div class="relative">
                      <img 
                        [src]="getMainImageUrl(product)" 
                        [alt]="product.title"
                        class="w-28 h-28 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300">
                      <div *ngIf="product.isBoosted" class="absolute -top-2 -left-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-1.5 rounded-full text-xs font-bold">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between">
                        <div class="min-w-0 flex-1">
                          <h3 class="font-bold text-neutral-900 text-lg line-clamp-1 group-hover:text-primary-700 transition-colors">{{ product.title }}</h3>
                          <div class="flex items-center gap-2 mt-2">
                            <div class="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {{ getSellerInitial(product) }}
                            </div>
                            <span class="text-sm font-medium text-neutral-700">{{ getSellerName(product) }}</span>
                            <span class="text-sm text-neutral-500">•</span>
                            <span class="text-sm text-neutral-600">{{ getLocationString(product) }}</span>
                          </div>
                          <div class="flex items-center gap-2 mt-3">
                            <span class="bg-neutral-100 text-neutral-700 px-3 py-1 text-xs font-medium rounded-2xl">{{ product.condition }}</span>
                            <div class="flex items-center gap-1 text-sm">
                              <svg class="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                              <span class="text-neutral-600">{{ getSellerRating(product) || 'New' }}</span>
                            </div>
                          </div>
                          <div *ngIf="product.tags && product.tags.length > 0" class="flex flex-wrap gap-1.5 mt-3">
                            <span *ngFor="let tag of product.tags.slice(0, 3)" 
                                  class="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-xl border border-primary-200/50">
                              {{ tag }}
                            </span>
                            <span *ngIf="product.tags.length > 3" 
                                  class="inline-flex items-center px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-xl">
                              +{{ product.tags.length - 3 }}
                            </span>
                          </div>
                        </div>
                        <div class="text-right ml-4">
                          <div class="text-2xl font-bold text-neutral-900">₱{{ product.price.toLocaleString() }}</div>
                          <div *ngIf="product.negotiable" class="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-full mt-1">
                            Negotiable
                          </div>
                          <button 
                            (click)="onFavoriteClick({product: product, isFavorited: !isFavorited(product._id)}); $event.stopPropagation()"
                            class="mt-3 w-10 h-10 bg-neutral-50 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-colors group">
                            <svg class="w-5 h-5 transition-colors" 
                                 [class.text-red-500]="isFavorited(product._id)" 
                                 [class.text-neutral-400]="!isFavorited(product._id)"
                                 fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Enhanced Pagination -->
              <div class="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="text-sm text-neutral-600 flex items-center gap-2">
                  <span class="font-medium">Page {{ pagination().currentPage }} of {{ pagination().totalPages }}</span>
                  <span class="hidden sm:inline text-neutral-400">•</span>
                  <span class="hidden sm:inline">{{ pagination().totalItems }} total results</span>
                </div>
                
                <div class="flex items-center gap-2">
                  <button 
                    (click)="goToPage(pagination().currentPage - 1)"
                    [disabled]="pagination().currentPage === 1"
                    [class]="pagination().currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-50 hover:border-neutral-300'"
                    class="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm font-medium transition-all duration-200 bg-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    <span class="hidden sm:inline">Previous</span>
                  </button>
                  
                  <div class="flex items-center gap-1">
                    <button 
                      *ngFor="let page of visiblePages()"
                      (click)="goToPage(page)"
                      [class]="page === pagination().currentPage ? 'bg-primary-600 text-white shadow-soft border-primary-600' : 'bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200'"
                      class="w-10 h-10 border rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center">
                      {{ page }}
                    </button>
                  </div>
                  
                  <button 
                    (click)="goToPage(pagination().currentPage + 1)"
                    [disabled]="pagination().currentPage === pagination().totalPages"
                    [class]="pagination().currentPage === pagination().totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-50 hover:border-neutral-300'"
                    class="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm font-medium transition-all duration-200 bg-white">
                    <span class="hidden sm:inline">Next</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Enhanced No Results -->
            <ng-template #noResults>
              <div *ngIf="!isLoading() && !hasError()" class="text-center py-16">
                <div class="max-w-md mx-auto">
                  <div class="w-20 h-20 bg-gradient-to-r from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <h3 class="text-2xl font-bold text-neutral-900 mb-2">No results found</h3>
                  <p class="text-neutral-600 mb-8">We couldn't find any tennis gear matching your criteria. Try adjusting your filters or search terms.</p>
                  
                  <div class="space-y-4">
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                      <button 
                        (click)="clearAllFilters()"
                        class="bg-primary-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-soft hover:shadow-medium">
                        Clear All Filters
                      </button>
                      <button 
                        (click)="clearSearch()"
                        class="border border-neutral-200 text-neutral-700 px-6 py-3 rounded-2xl font-medium hover:bg-neutral-50 transition-colors">
                        Clear Search
                      </button>
                    </div>
                    
                    <div class="text-sm text-neutral-500">
                      <p class="mb-3">Popular searches:</p>
                      <div class="flex flex-wrap justify-center gap-2">
                        <button *ngFor="let suggestion of ['Wilson', 'Babolat', 'Racquets', 'Shoes']" 
                                (click)="applySearchSuggestion(suggestion)"
                                class="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-600 rounded-2xl hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          {{ suggestion }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- Save Search Modal -->
      <div *ngIf="showSaveSearchModal()" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Save Current Search</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search Name</label>
              <input 
                type="text"
                [(ngModel)]="newSearchName"
                placeholder="e.g., Wilson Racquets under 10k"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500">
            </div>
            <div class="text-sm text-gray-600">
              <p class="font-medium mb-1">Current filters:</p>
              <div class="space-y-1">
                <div *ngIf="filters().category !== 'all'">Category: {{ filters().category }}</div>
                <div *ngIf="filters().condition.length > 0">Condition: {{ filters().condition.join(', ') }}</div>
                <div *ngIf="filters().priceMin || filters().priceMax">
                  Price: ₱{{ filters().priceMin || 0 }} - ₱{{ filters().priceMax || '∞' }}
                </div>
                <div *ngIf="filters().search">Search: "{{ filters().search }}"</div>
                <div *ngIf="filters().location">Location: {{ filters().location }}</div>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button 
                (click)="saveCurrentSearch()"
                [disabled]="!newSearchName().trim()"
                class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Save Search
              </button>
              <button 
                (click)="toggleSaveSearchModal()"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Balance Modal -->
    @if (showLowBalanceModal()) {
      <app-low-balance-modal
        (close)="closeLowBalanceModal()"
        (openPurchase)="openCoinPurchaseFromLowBalance()">
      </app-low-balance-modal>
    }

    <!-- Coin Purchase Modal -->
    @if (showCoinPurchaseModal()) {
      <app-coin-purchase-modal
        (close)="closeCoinPurchaseModal()"
        (purchaseComplete)="onCoinPurchaseComplete($event)">
      </app-coin-purchase-modal>
    }
  `,
  styles: [`
    .line-clamp-1 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
    }
  `]
})
export class BrowseComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private router = inject(Router);
  private coinService = inject(CoinService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Modal state
  showLowBalanceModal = signal<boolean>(false);
  showCoinPurchaseModal = signal<boolean>(false);

  // State management using Angular signals
  filters = signal<FilterState>({
    category: 'all',
    condition: [],
    priceMin: null,
    priceMax: null,
    location: '',
    search: '',
    sortBy: 'newest'
  });

  pagination = signal<PaginationState>({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0,
    totalPages: 0
  });

  viewMode = signal<'grid' | 'list'>('grid');
  favoriteProducts = new Set<string>();

  // Product data loaded from API
  allProducts = signal<Product[]>([]);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);

  // New UX features
  savedSearches = signal<SavedSearch[]>([]);
  recentlyViewed = signal<RecentlyViewedProduct[]>([]);
  showSaveSearchModal = signal<boolean>(false);
  showMobileFilters = signal<boolean>(false);
  newSearchName = signal<string>('');

  categories = [
    { name: 'All Categories', value: 'all', count: 0 },
    { name: 'Racquets', value: 'racquets', count: 0 },
    { name: 'Strings', value: 'strings', count: 0 },
    { name: 'Shoes', value: 'shoes', count: 0 },
    { name: 'Bags', value: 'bags', count: 0 },
    { name: 'Balls', value: 'balls', count: 0 },
    { name: 'Apparel', value: 'apparel', count: 0 }
  ];

  conditions = ['New', 'Like New', 'Excellent', 'Good', 'Fair'];

  locations = [
    'BGC, Taguig', 'Makati City', 'Quezon City', 'Manila City', 
    'Pasig City', 'Mandaluyong', 'Ortigas', 'Alabang'
  ];

  priceRanges = [
    { label: 'Under ₱5K', min: 0, max: 5000 },
    { label: '₱5K - ₱10K', min: 5000, max: 10000 },
    { label: '₱10K - ₱15K', min: 10000, max: 15000 },
    { label: '₱15K+', min: 15000, max: null }
  ];

  quickFilters = [
    { label: '🎾 Wilson Racquets', filters: { category: 'racquets', search: 'Wilson' } },
    { label: '🔥 Under ₱5K', filters: { priceMax: 5000 } },
    { label: '✨ Like New', filters: { condition: ['Like New'] } },
    { label: '🏆 Boosted', filters: { sortBy: 'boosted' } },
    { label: '👟 Tennis Shoes', filters: { category: 'shoes' } },
    { label: '📍 Makati', filters: { location: 'Makati City' } }
  ];

  // Since filtering/sorting is now done server-side via API, 
  // these computed properties simply return the API data
  filteredProducts = computed(() => {
    return this.allProducts();
  });

  paginatedProducts = computed(() => {
    // API already handles pagination, so return all products
    return this.allProducts();
  });

  startItem = computed(() => {
    const p = this.pagination();
    return (p.currentPage - 1) * p.itemsPerPage + 1;
  });

  endItem = computed(() => {
    const p = this.pagination();
    const totalFiltered = this.filteredProducts().length;
    return Math.min(p.currentPage * p.itemsPerPage, totalFiltered);
  });

  visiblePages = computed(() => {
    const p = this.pagination();
    const pages: number[] = [];
    const start = Math.max(1, p.currentPage - 2);
    const end = Math.min(p.totalPages, p.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit() {
    // Check coin balance for authenticated users - block if negative (except for admin users)
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.currentUser();

      // Admin users have unlimited access, skip balance check
      if (currentUser?.role === 'admin') {
        console.log('Admin user detected, bypassing balance check for browse page');
      } else {
        this.coinService.loadCoinBalance().subscribe({
          next: (balance) => {
            if (balance.balance < 0) {
              this.showLowBalanceModal.set(true);
              return;
            }
          },
          error: (error) => {
            console.error('Failed to load coin balance:', error);
          }
        });
      }
    }

    this.loadProducts();
    this.updatePagination();
    this.loadSavedSearches();
    this.loadRecentlyViewed();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Convert filters to API parameters
    const apiFilters = this.buildApiFilters();

    this.productService.getProducts(apiFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProductsResponse) => {
          this.allProducts.set(response.products);
          this.pagination.update(p => ({
            ...p,
            totalItems: response.pagination.totalProducts,
            totalPages: response.pagination.totalPages,
            currentPage: response.pagination.currentPage
          }));
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load products:', error);
          this.loadSampleProducts();
        }
      });
  }

  private buildApiFilters() {
    const f = this.filters();
    const apiFilters: any = {
      page: this.pagination().currentPage,
      limit: this.pagination().itemsPerPage,
      sortBy: f.sortBy
    };

    if (f.category !== 'all') {
      apiFilters.category = this.capitalizeCategory(f.category);
    }
    
    if (f.condition.length > 0) {
      apiFilters.condition = f.condition.join(',');
    }
    
    if (f.priceMin !== null) {
      apiFilters.priceMin = f.priceMin;
    }
    
    if (f.priceMax !== null) {
      apiFilters.priceMax = f.priceMax;
    }
    
    if (f.location) {
      apiFilters.city = f.location;
    }
    
    if (f.search) {
      apiFilters.search = f.search;
    }

    return apiFilters;
  }

  private loadSampleProducts(): void {
    // Fallback sample products when API fails
    const sampleProducts: Product[] = [
      {
        _id: 'wilson-pro-staff-97',
        title: 'Wilson Pro Staff 97 v14',
        price: 14500,
        condition: 'New',
        category: 'Racquets',
        brand: 'Wilson',
        model: 'Pro Staff 97 v14',
        description: 'Brand new Wilson Pro Staff 97 v14. Never used, still in original packaging.',
        images: [{ url: 'https://images.unsplash.com/photo-1544966503-7a5e6b2c1c3d?w=500&h=500&fit=crop', isMain: true }],
        seller: {
          _id: 'seller1',
          firstName: 'Juan',
          lastName: 'Cruz',
          rating: { average: 4.8, totalReviews: 125 },
          location: { city: 'Makati', region: 'Metro Manila' },
          isVerified: true
        },
        location: { city: 'Makati', region: 'Metro Manila' },
        availability: 'available',
        tags: ['Professional', 'Wilson', '97sq'],
        views: 245,
        favorites: 18,
        isBoosted: true,
        isApproved: 'approved',
        negotiable: true,
        shippingOptions: { meetup: true, delivery: true, shipping: true },
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        _id: 'babolat-pure-drive',
        title: 'Babolat Pure Drive 2023',
        price: 12000,
        condition: 'Excellent',
        category: 'Racquets',
        brand: 'Babolat',
        model: 'Pure Drive 2023',
        description: 'Excellent condition Babolat Pure Drive. Used for about 6 months.',
        images: [{ url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop', isMain: true }],
        seller: {
          _id: 'seller2',
          firstName: 'Maria',
          lastName: 'Santos',
          rating: { average: 4.6, totalReviews: 89 },
          location: { city: 'Quezon City', region: 'Metro Manila' },
          isVerified: true
        },
        location: { city: 'Quezon City', region: 'Metro Manila' },
        availability: 'available',
        tags: ['Power', 'Babolat', 'Intermediate'],
        views: 156,
        favorites: 12,
        isBoosted: false,
        isApproved: 'approved',
        negotiable: true,
        shippingOptions: { meetup: true, delivery: false, shipping: true },
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z'
      },
      {
        _id: 'yonex-poly-tour-pro',
        title: 'Yonex Poly Tour Pro String',
        price: 6800,
        condition: 'New',
        category: 'Strings',
        brand: 'Yonex',
        model: 'Poly Tour Pro',
        description: 'Brand new Yonex Poly Tour Pro string set.',
        images: [{ url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop', isMain: true }],
        seller: 'TennisShop PH',
        location: { city: 'BGC', region: 'Metro Manila' },
        availability: 'available',
        tags: ['Professional', 'Strings', 'Power'],
        views: 89,
        favorites: 5,
        isBoosted: false,
        isApproved: 'approved',
        negotiable: false,
        shippingOptions: { meetup: true, delivery: true, shipping: true },
        createdAt: '2024-01-08T00:00:00Z',
        updatedAt: '2024-01-08T00:00:00Z'
      },
      {
        _id: 'nike-court-zoom',
        title: 'Nike Court Air Zoom GP Turbo',
        price: 5200,
        condition: 'Like New',
        category: 'Shoes',
        brand: 'Nike',
        model: 'Court Air Zoom GP Turbo',
        description: 'Like new Nike tennis shoes. Worn only a few times.',
        images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', isMain: true }],
        seller: 'SportsFan23',
        location: { city: 'Pasig', region: 'Metro Manila' },
        availability: 'available',
        tags: ['Nike', 'Size 9', 'Performance'],
        views: 134,
        favorites: 8,
        isBoosted: true,
        isApproved: 'approved',
        negotiable: true,
        shippingOptions: { meetup: true, delivery: false, shipping: true },
        createdAt: '2024-01-12T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z'
      }
    ];

    this.allProducts.set(sampleProducts);
    this.pagination.update(p => ({
      ...p,
      totalItems: sampleProducts.length,
      totalPages: 1,
      currentPage: 1
    }));
    this.hasError.set(false);
    this.isLoading.set(false);
  }

  private capitalizeCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'racquets': 'Racquets',
      'strings': 'Strings',
      'shoes': 'Shoes',
      'bags': 'Bags',
      'balls': 'Balls',
      'apparel': 'Apparel',
      'accessories': 'Accessories'
    };
    return categoryMap[category] || category;
  }

  onFiltersChange() {
    // Reload products with new filters
    this.loadProducts();
  }

  onSearchChange() {
    // Debounce search in real app
    this.onFiltersChange();
  }

  onConditionChange(condition: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const currentConditions = [...this.filters().condition];
    
    if (target.checked) {
      currentConditions.push(condition);
    } else {
      const index = currentConditions.indexOf(condition);
      if (index > -1) currentConditions.splice(index, 1);
    }
    
    this.filters.update(f => ({ ...f, condition: currentConditions }));
    this.onFiltersChange();
  }

  setPriceRange(min: number, max: number | null) {
    this.filters.update(f => ({ ...f, priceMin: min, priceMax: max }));
    this.onFiltersChange();
  }

  clearSearch() {
    this.filters.update(f => ({ ...f, search: '' }));
    this.onFiltersChange();
  }

  clearAllFilters() {
    this.filters.set({
      category: 'all',
      condition: [],
      priceMin: null,
      priceMax: null,
      location: '',
      search: '',
      sortBy: 'newest'
    });
    this.pagination.update(p => ({ ...p, currentPage: 1 })); // Reset to page 1
    this.onFiltersChange();
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.pagination.update(p => ({ ...p, currentPage: page }));
    this.loadProducts(); // Reload products for new page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updatePagination() {
    // Pagination is now handled by API response, so this method is no longer needed
    // but kept for compatibility with existing calls
  }

  onProductClick(product: Product) {
    // Add to recently viewed
    this.addToRecentlyViewed(product);
    console.log('Navigate to product detail:', product);
    this.router.navigate(['/product', product._id]);
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

  isFavorited(productId: string): boolean {
    return this.favoriteProducts.has(productId);
  }

  getSellerName(product: Product): string {
    if (typeof product.seller === 'string') {
      return product.seller;
    }
    return `${product.seller.firstName} ${product.seller.lastName}`;
  }

  getSellerRating(product: Product): number {
    if (typeof product.seller === 'string') {
      return 0;
    }
    return product.seller.rating.average;
  }

  getLocationString(product: Product): string {
    if (typeof product.location === 'string') {
      return product.location;
    }
    return `${product.location.city}, ${product.location.region}`;
  }

  getMainImageUrl(product: Product): string {
    if (product.images && product.images.length > 0) {
      const imageUrl = typeof product.images[0] === 'string'
        ? product.images[0]
        : product.images[0].url || '';

      if (imageUrl) {
        return imageUrl;
      }
    }

    // Category-specific fallback images
    return this.getCategoryPlaceholder(product.category);
  }

  private getCategoryPlaceholder(category?: string): string {
    const categoryLower = category?.toLowerCase() || 'general';
    const placeholders: {[key: string]: string} = {
      'racquets': 'https://images.unsplash.com/photo-1544966503-7a5e6b2c1c3d?w=400&h=400&fit=crop',
      'strings': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
      'shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      'bags': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
      'balls': 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=400&fit=crop',
      'apparel': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=400&fit=crop',
      'accessories': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
    };

    return placeholders[categoryLower] || 'https://images.unsplash.com/photo-1542144612-1c93f9eac579?w=400&h=400&fit=crop';
  }

  // New UX Methods
  loadSavedSearches() {
    const saved = localStorage.getItem('tennis-saved-searches');
    if (saved) {
      try {
        const searches = JSON.parse(saved);
        this.savedSearches.set(searches);
      } catch (e) {
        console.error('Error loading saved searches:', e);
      }
    }
  }

  loadRecentlyViewed() {
    const recent = localStorage.getItem('tennis-recently-viewed');
    if (recent) {
      try {
        const items = JSON.parse(recent);
        this.recentlyViewed.set(items);
      } catch (e) {
        console.error('Error loading recently viewed:', e);
      }
    }
  }

  addToRecentlyViewed(product: Product) {
    const current = this.recentlyViewed();
    const existingIndex = current.findIndex(item => item.productId === product._id);
    
    // Remove existing entry if found
    if (existingIndex !== -1) {
      current.splice(existingIndex, 1);
    }
    
    // Add to beginning
    const newItem: RecentlyViewedProduct = {
      productId: product._id,
      viewedAt: new Date().toISOString(),
      product
    };
    
    current.unshift(newItem);
    
    // Keep only last 10 items
    if (current.length > 10) {
      current.splice(10);
    }
    
    this.recentlyViewed.set([...current]);
    localStorage.setItem('tennis-recently-viewed', JSON.stringify(current));
  }

  applyQuickFilter(quickFilter: any) {
    const currentFilters = this.filters();
    const newFilters = { ...currentFilters };
    
    // Apply the quick filter properties
    Object.keys(quickFilter.filters).forEach(key => {
      if (key === 'condition') {
        newFilters.condition = quickFilter.filters[key];
      } else {
        (newFilters as any)[key] = quickFilter.filters[key];
      }
    });
    
    this.filters.set(newFilters);
    this.pagination.update(p => ({ ...p, currentPage: 1 }));
    this.onFiltersChange();
  }

  toggleSaveSearchModal() {
    this.showSaveSearchModal.update(show => !show);
    this.newSearchName.set('');
  }

  saveCurrentSearch() {
    const name = this.newSearchName().trim();
    if (!name) return;
    
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: { ...this.filters() },
      createdAt: new Date().toISOString()
    };
    
    const current = this.savedSearches();
    current.push(newSearch);
    this.savedSearches.set([...current]);
    
    // Save to localStorage
    localStorage.setItem('tennis-saved-searches', JSON.stringify(current));
    
    this.toggleSaveSearchModal();
  }

  applySavedSearch(search: SavedSearch) {
    this.filters.set({ ...search.filters });
    this.pagination.update(p => ({ ...p, currentPage: 1 }));
    this.onFiltersChange();
  }

  deleteSavedSearch(searchId: string, event: Event) {
    event.stopPropagation();
    const current = this.savedSearches();
    const filtered = current.filter(s => s.id !== searchId);
    this.savedSearches.set(filtered);
    localStorage.setItem('tennis-saved-searches', JSON.stringify(filtered));
  }

  // Mobile filters methods
  toggleMobileFilters() {
    this.showMobileFilters.update(show => !show);
    if (this.showMobileFilters()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  getActiveFiltersCount(): number {
    const f = this.filters();
    let count = 0;
    
    if (f.category !== 'all') count++;
    if (f.condition.length > 0) count++;
    if (f.priceMin !== null || f.priceMax !== null) count++;
    if (f.location) count++;
    if (f.search) count++;
    
    return count;
  }

  // Performance optimization methods
  trackByProduct(index: number, product: Product): string {
    return product._id;
  }

  getSellerInitial(product: Product): string {
    const name = this.getSellerName(product);
    return name.charAt(0).toUpperCase();
  }

  // Search suggestion method
  applySearchSuggestion(suggestion: string) {
    this.filters.update(f => ({ ...f, search: suggestion }));
    this.pagination.update(p => ({ ...p, currentPage: 1 }));
    this.onFiltersChange();
  }
  
  // New utility methods for enhanced functionality
  formatCompactPrice(price: number): string {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'K';
    }
    return price.toLocaleString();
  }
  
  // Performance optimization methods for trackBy functions
  trackByQuickFilter(index: number, filter: any): string {
    return filter.label;
  }
  
  trackBySavedSearch(index: number, search: SavedSearch): string {
    return search.id;
  }
  
  trackByRecentlyViewed(index: number, item: RecentlyViewedProduct): string {
    return item.productId;
  }
  
  // Enhanced interaction methods
  onQuickFilterHover(filter: any): void {
    // Could add preview functionality or tooltip
  }
  
  // Accessibility helper
  announceFilterChange(): void {
    const activeCount = this.getActiveFiltersCount();
    const message = `${activeCount} filter${activeCount !== 1 ? 's' : ''} active. ${this.filteredProducts().length} results found.`;
    
    // Create announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  // Enhanced mobile interactions
  onTouchStart(event: TouchEvent): void {
    // Add haptic feedback for mobile interactions
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }

  // Modal handlers
  closeLowBalanceModal(): void {
    this.showLowBalanceModal.set(false);
    // Redirect user away from browse page
    this.router.navigate(['/']);
  }

  openCoinPurchaseFromLowBalance(): void {
    this.showLowBalanceModal.set(false);
    this.showCoinPurchaseModal.set(true);
  }

  closeCoinPurchaseModal(): void {
    this.showCoinPurchaseModal.set(false);
    // After closing purchase modal, redirect home since they still can't browse
    this.router.navigate(['/']);
  }

  onCoinPurchaseComplete(result: any): void {
    if (result.transaction.status === 'pending') {
      // Purchase is pending approval, redirect user away from browse page
      console.log('Purchase request submitted! You will receive your coins within 24 hours after payment verification. Contact 09175105185 to confirm payment.');
      this.router.navigate(['/']);
    } else {
      // Completed purchase, check balance again
      this.coinService.loadCoinBalance().subscribe({
        next: (balance) => {
          if (balance.balance >= 0) {
            // Balance is positive now, they can continue browsing
            console.log('Coins purchased successfully! You can now browse products.');
          } else {
            // Still negative, redirect home
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Failed to reload balance:', error);
          this.router.navigate(['/']);
        }
      });
    }
  }
}