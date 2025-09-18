import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LookingForCardComponent } from '../components/looking-for-card.component';
import { LookingForPost, LookingForService, LookingForFilters, LookingForListResponse } from '../services/looking-for.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from '../services/auth.service';

interface FilterState {
  category: string;
  condition: string[];
  budgetMin: number | undefined;
  budgetMax: number | undefined;
  city: string;
  urgency: string;
  search: string;
  sortBy: string;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-looking-for',
  standalone: true,
  imports: [CommonModule, FormsModule, LookingForCardComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-background-main via-white to-primary-50/20 dark:from-dark-50 dark:via-dark-100 dark:to-dark-200/50 transition-colors duration-300">

      <!-- Modern Hero Header -->
      <div class="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-green-600 dark:from-primary-700 dark:via-primary-800 dark:to-green-700">
        <!-- Background Pattern -->
        <div class="absolute inset-0 bg-mesh-gradient opacity-20"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>

        <div class="relative max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div class="text-center mb-8">
            <div class="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in-up">
              <span class="text-2xl">👀</span>
              <span class="text-white/90 font-medium">Looking For Requests</span>
            </div>

            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in-up" style="animation-delay: 0.1s">
              Find Exactly What You Need
            </h1>
            <p class="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 animate-fade-in-up" style="animation-delay: 0.2s">
              Browse requests from players looking for specific gear, or post your own request to find that perfect racquet, paddle, or accessory.
            </p>

            <!-- Search Bar -->
            <div class="relative max-w-2xl mx-auto mb-6 animate-fade-in-up" style="animation-delay: 0.3s">
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="filters().search"
                  (input)="onSearchChange()"
                  placeholder="Search for specific gear requests..."
                  class="w-full pl-6 pr-16 py-4 text-lg bg-white/95 dark:bg-dark-100/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg focus:ring-2 focus:ring-white/50 focus:shadow-xl transition-all duration-300 placeholder:text-neutral-500 dark:placeholder:text-dark-500">

                <div class="absolute inset-y-0 right-12 flex items-center pointer-events-none">
                  <svg class="h-6 w-6 text-neutral-400 dark:text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>

                <button
                  *ngIf="filters().search"
                  (click)="clearSearch()"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 dark:text-dark-500 hover:text-red-500 transition-all duration-200">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style="animation-delay: 0.4s">
              <button
                *ngIf="authService.isAuthenticated()"
                (click)="navigateToCreate()"
                class="group bg-white hover:bg-green-50 text-primary-700 px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3">
                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </div>
                Post Your Request
              </button>

              <button
                (click)="scrollToFilters()"
                class="border-2 border-white/30 hover:border-white/50 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold backdrop-blur-sm transition-all duration-300 flex items-center gap-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                </svg>
                Browse & Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Modern Filter and Sort Controls -->
        <div id="filters-section" class="bg-white/90 dark:bg-dark-100/90 backdrop-blur-xl rounded-3xl shadow-xl border border-neutral-200/50 dark:border-dark-200/50 p-6 mb-8 animate-slide-in-up">

          <!-- Filter Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-neutral-900 dark:text-dark-900">Smart Filters</h2>
                <p class="text-sm text-neutral-600 dark:text-dark-600">Find exactly what you're looking for</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <!-- Active Filter Count -->
              <div *ngIf="getActiveFiltersCount() > 0"
                   class="bg-gradient-to-r from-primary-500 to-green-500 text-white text-sm px-3 py-1 rounded-full font-bold shadow-lg animate-pulse">
                {{ getActiveFiltersCount() }} active
              </div>

              <!-- Mobile Filter Toggle -->
              <button
                class="lg:hidden bg-neutral-100 dark:bg-dark-200 hover:bg-neutral-200 dark:hover:bg-dark-300 p-3 rounded-xl transition-all duration-200"
                (click)="toggleMobileFilters()">
                <svg class="w-5 h-5 text-neutral-700 dark:text-dark-700" [class.rotate-180]="showMobileFilters()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Filters Panel -->
          <div [class.hidden]="!showMobileFilters()" class="lg:block space-y-6">
            <!-- Primary Filters Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <!-- Category Filter -->
              <div class="group">
                <label class="block text-sm font-bold text-neutral-800 dark:text-dark-800 mb-3 flex items-center gap-2">
                  <span class="text-lg">🏸</span>
                  Category
                </label>
                <select [(ngModel)]="filters().category" (change)="onFiltersChange()"
                        class="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-200 border-2 border-neutral-200 dark:border-dark-300 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200 hover:border-primary-300 font-medium">
                  <option value="">All Categories</option>
                  <option value="Racquets">🎾 Racquets</option>
                  <option value="Pickleball Paddles">🏓 Pickleball Paddles</option>
                  <option value="Strings">🧵 Strings</option>
                  <option value="Bags">🧳 Bags</option>
                  <option value="Balls">⚽ Balls</option>
                  <option value="Pickleball Balls">🏓 Pickleball Balls</option>
                  <option value="Shoes">👟 Shoes</option>
                  <option value="Apparel">👕 Apparel</option>
                  <option value="Accessories">⚡ Accessories</option>
                </select>
              </div>

              <!-- Urgency Filter -->
              <div class="group">
                <label class="block text-sm font-bold text-neutral-800 dark:text-dark-800 mb-3 flex items-center gap-2">
                  <span class="text-lg">🚨</span>
                  Urgency
                </label>
                <select [(ngModel)]="filters().urgency" (change)="onFiltersChange()"
                        class="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-200 border-2 border-neutral-200 dark:border-dark-300 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200 hover:border-primary-300 font-medium">
                  <option value="">All Urgency</option>
                  <option value="asap">🔥 ASAP</option>
                  <option value="within_week">📅 Within a week</option>
                  <option value="within_month">🗓️ Within a month</option>
                  <option value="flexible">⏰ Flexible</option>
                </select>
              </div>

              <!-- City Filter -->
              <div class="group">
                <label class="block text-sm font-bold text-neutral-800 dark:text-dark-800 mb-3 flex items-center gap-2">
                  <span class="text-lg">📍</span>
                  Location
                </label>
                <input
                  type="text"
                  [(ngModel)]="filters().city"
                  (input)="onFiltersChange()"
                  placeholder="Enter city or area"
                  class="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-200 border-2 border-neutral-200 dark:border-dark-300 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200 hover:border-primary-300 font-medium placeholder:text-neutral-500 dark:placeholder:text-dark-500">
              </div>

              <!-- Sort -->
              <div class="group">
                <label class="block text-sm font-bold text-neutral-800 dark:text-dark-800 mb-3 flex items-center gap-2">
                  <span class="text-lg">🔢</span>
                  Sort by
                </label>
                <select [(ngModel)]="filters().sortBy" (change)="onFiltersChange()"
                        class="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-200 border-2 border-neutral-200 dark:border-dark-300 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200 hover:border-primary-300 font-medium">
                  <option value="newest">🆕 Newest</option>
                  <option value="urgent">🚨 Most Urgent</option>
                  <option value="budget-high">💰 Highest Budget</option>
                  <option value="budget-low">💸 Lowest Budget</option>
                  <option value="responses">💬 Most Responses</option>
                </select>
              </div>
            </div>

            <!-- Secondary Filters Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Budget Range -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-bold text-neutral-800 dark:text-dark-800 mb-3 flex items-center gap-2">
                    <span class="text-lg">💰</span>
                    Min Budget
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 font-bold">₱</span>
                    <input
                      type="number"
                      [(ngModel)]="filters().budgetMin"
                      (input)="onFiltersChange()"
                      placeholder="0"
                      class="w-full pl-8 pr-4 py-3 bg-neutral-50 dark:bg-dark-200 border-2 border-neutral-200 dark:border-dark-300 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200 hover:border-primary-300 font-medium placeholder:text-neutral-500 dark:placeholder:text-dark-500">
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-bold text-neutral-800 dark:text-dark-800 mb-3 flex items-center gap-2">
                    <span class="text-lg">💎</span>
                    Max Budget
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 font-bold">₱</span>
                    <input
                      type="number"
                      [(ngModel)]="filters().budgetMax"
                      (input)="onFiltersChange()"
                      placeholder="No limit"
                      class="w-full pl-8 pr-4 py-3 bg-neutral-50 dark:bg-dark-200 border-2 border-neutral-200 dark:border-dark-300 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200 hover:border-primary-300 font-medium placeholder:text-neutral-500 dark:placeholder:text-dark-500">
                  </div>
                </div>
              </div>

              <!-- Condition Filter -->
              <div>
                <label class="block text-sm font-bold text-neutral-800 dark:text-dark-800 mb-3 flex items-center gap-2">
                  <span class="text-lg">⭐</span>
                  Acceptable Conditions
                </label>
                <div class="flex flex-wrap gap-2">
                  <label *ngFor="let condition of conditions"
                         class="group flex items-center gap-2 bg-neutral-50 dark:bg-dark-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-2 rounded-xl border-2 border-neutral-200 dark:border-dark-300 hover:border-primary-300 transition-all duration-200 cursor-pointer"
                         [class.bg-primary-100]="isConditionSelected(condition)"
                         [class.border-primary-400]="isConditionSelected(condition)"
                         [class.dark:bg-primary-900/30]="isConditionSelected(condition)">
                    <input
                      type="checkbox"
                      [value]="condition"
                      [checked]="isConditionSelected(condition)"
                      (change)="toggleCondition(condition)"
                      class="hidden">
                    <span class="text-sm font-medium text-neutral-700 dark:text-dark-700 group-hover:text-primary-700 transition-colors"
                          [class.text-primary-700]="isConditionSelected(condition)"
                          [class.dark:text-primary-400]="isConditionSelected(condition)">{{ condition }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Actions Row -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-dark-200">
              <div class="text-sm text-neutral-600 dark:text-dark-600">
                <span *ngIf="getActiveFiltersCount() > 0" class="font-medium">
                  {{ getActiveFiltersCount() }} filter{{ getActiveFiltersCount() === 1 ? '' : 's' }} applied
                </span>
                <span *ngIf="getActiveFiltersCount() === 0">
                  No filters applied
                </span>
              </div>

              <button
                (click)="clearAllFilters()"
                class="group flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-red-500 transition-all duration-200 hover:scale-105">
                <svg class="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Clear all filters
              </button>
            </div>
          </div>
        </div>

        <!-- Modern Stats and Results Header -->
        <div class="bg-white/60 dark:bg-dark-100/60 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-dark-200/50 p-6 mb-8 animate-fade-in-up">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-neutral-900 dark:text-dark-900">Request Results</h3>
                <div class="text-sm text-neutral-600 dark:text-dark-600">
                  <span *ngIf="!isLoading() && pagination().totalItems > 0">
                    Showing {{ (pagination().currentPage - 1) * pagination().itemsPerPage + 1 }}-{{
                      Math.min(pagination().currentPage * pagination().itemsPerPage, pagination().totalItems)
                    }} of {{ pagination().totalItems }} active requests
                  </span>
                  <span *ngIf="!isLoading() && pagination().totalItems === 0">
                    No requests match your criteria
                  </span>
                  <span *ngIf="isLoading()" class="flex items-center gap-2">
                    <svg class="animate-spin h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching for requests...
                  </span>
                </div>
              </div>
            </div>

            <!-- Quick Stats -->
            <div *ngIf="!isLoading() && lookingForPosts().length > 0" class="flex items-center gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-primary-600">{{ pagination().totalItems }}</div>
                <div class="text-xs text-neutral-500 dark:text-dark-500 font-medium">Total</div>
              </div>
              <div class="w-px h-8 bg-neutral-200 dark:bg-dark-200"></div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ pagination().totalPages }}</div>
                <div class="text-xs text-neutral-500 dark:text-dark-500 font-medium">Pages</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Looking For Posts Grid -->
        <div *ngIf="!isLoading() && lookingForPosts().length > 0">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <app-looking-for-card
              *ngFor="let post of lookingForPosts(); trackBy: trackByPostId"
              [post]="post"
              (postClick)="onPostClick($event)"
              (respondClick)="onRespondClick($event)"
              class="animate-fade-in-up hover:scale-105 transition-all duration-300 hover:shadow-xl">
            </app-looking-for-card>
          </div>
        </div>

        <!-- Modern Loading State -->
        <div *ngIf="isLoading()" class="space-y-6">
          <!-- Loading Header -->
          <div class="text-center py-8">
            <div class="inline-flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 px-6 py-3 rounded-full">
              <svg class="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-primary-700 dark:text-primary-400 font-medium">Finding perfect requests...</span>
            </div>
          </div>

          <!-- Loading Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div *ngFor="let i of [1,2,3,4,5,6]; trackBy: trackByIndex"
                 class="bg-white/80 dark:bg-dark-100/80 backdrop-blur-sm rounded-3xl shadow-lg border border-neutral-200/50 dark:border-dark-200/50 p-6 animate-pulse"
                 [style.animation-delay]="i * 100 + 'ms'">
              <!-- Header skeleton -->
              <div class="flex items-center gap-4 mb-6">
                <div class="w-14 h-14 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-dark-200 dark:to-dark-300 rounded-2xl"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-dark-200 dark:to-dark-300 rounded-full mb-2"></div>
                  <div class="h-3 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-dark-200 dark:to-dark-300 rounded-full w-2/3"></div>
                </div>
              </div>

              <!-- Content skeleton -->
              <div class="space-y-3 mb-6">
                <div class="h-5 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-dark-200 dark:to-dark-300 rounded-full"></div>
                <div class="h-4 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-dark-200 dark:to-dark-300 rounded-full w-4/5"></div>
                <div class="h-4 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-dark-200 dark:to-dark-300 rounded-full w-3/5"></div>
              </div>

              <!-- Footer skeleton -->
              <div class="flex items-center justify-between">
                <div class="h-8 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-dark-200 dark:to-dark-300 rounded-xl w-20"></div>
                <div class="h-10 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-dark-200 dark:to-dark-300 rounded-xl w-24"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Empty State -->
        <div *ngIf="!isLoading() && lookingForPosts().length === 0"
             class="text-center py-16 animate-fade-in-up">

          <!-- Illustration -->
          <div class="relative mb-8">
            <div class="w-32 h-32 mx-auto bg-gradient-to-br from-primary-100 to-green-100 dark:from-primary-900/30 dark:to-green-900/30 rounded-full flex items-center justify-center shadow-xl">
              <svg class="w-16 h-16 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <!-- Floating elements -->
            <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="absolute top-4 right-8 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 0.5s"></div>
            <div class="absolute bottom-4 left-8 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 1s"></div>
          </div>

          <!-- Content -->
          <div class="max-w-md mx-auto">
            <h3 class="text-2xl font-bold text-neutral-900 dark:text-dark-900 mb-4">
              No requests found
            </h3>
            <p class="text-lg text-neutral-600 dark:text-dark-600 mb-8 leading-relaxed">
              <span *ngIf="getActiveFiltersCount() > 0">
                Try adjusting your filters or search terms to find more requests.
              </span>
              <span *ngIf="getActiveFiltersCount() === 0">
                Be the first to post a request! Let others know what gear you're looking for.
              </span>
            </p>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                *ngIf="authService.isAuthenticated()"
                (click)="navigateToCreate()"
                class="group bg-gradient-to-r from-primary-600 to-green-600 hover:from-primary-700 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3">
                <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                Post Your First Request
              </button>

              <button
                *ngIf="getActiveFiltersCount() > 0"
                (click)="clearAllFilters()"
                class="group border-2 border-neutral-300 dark:border-dark-300 hover:border-primary-400 dark:hover:border-primary-500 text-neutral-700 dark:text-dark-700 hover:text-primary-700 dark:hover:text-primary-400 px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2">
                <svg class="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Modern Pagination -->
        <div *ngIf="!isLoading() && lookingForPosts().length > 0 && pagination().totalPages > 1"
             class="flex justify-center mb-8">
          <nav class="bg-white/80 dark:bg-dark-100/80 backdrop-blur-xl rounded-2xl shadow-lg border border-neutral-200/50 dark:border-dark-200/50 p-2">
            <div class="flex items-center gap-2">
              <!-- Previous Button -->
              <button
                [disabled]="pagination().currentPage === 1"
                (click)="goToPage(pagination().currentPage - 1)"
                class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-600 dark:text-dark-600 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Previous
              </button>

              <!-- Page Numbers -->
              <div class="flex items-center gap-1">
                <button
                  *ngFor="let page of getVisiblePages(); trackBy: trackByIndex"
                  [class.bg-gradient-to-r]="page === pagination().currentPage"
                  [class.from-primary-500]="page === pagination().currentPage"
                  [class.to-green-500]="page === pagination().currentPage"
                  [class.text-white]="page === pagination().currentPage"
                  [class.shadow-lg]="page === pagination().currentPage"
                  [class.text-neutral-700]="page !== pagination().currentPage"
                  [class.dark:text-dark-700]="page !== pagination().currentPage"
                  [class.hover:bg-primary-50]="page !== pagination().currentPage"
                  [class.dark:hover:bg-primary-900/20]="page !== pagination().currentPage"
                  (click)="goToPage(page)"
                  class="w-10 h-10 flex items-center justify-center text-sm font-bold rounded-xl transition-all duration-200 hover:scale-105">
                  {{ page }}
                </button>
              </div>

              <!-- Next Button -->
              <button
                [disabled]="pagination().currentPage === pagination().totalPages"
                (click)="goToPage(pagination().currentPage + 1)"
                class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-600 dark:text-dark-600 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                Next
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </div>

      <!-- Floating Action Button (Mobile) -->
      <div *ngIf="authService.isAuthenticated()" class="fixed bottom-6 right-6 z-50 md:hidden">
        <button
          (click)="navigateToCreate()"
          class="group w-16 h-16 bg-gradient-to-r from-primary-600 to-green-600 hover:from-primary-700 hover:to-green-700 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center animate-bounce">
          <svg class="w-8 h-8 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class LookingForComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose Math for template usage
  Math = Math;

  // Signals
  lookingForPosts = signal<LookingForPost[]>([]);
  isLoading = signal(false);
  showMobileFilters = signal(false);

  filters = signal<FilterState>({
    category: '',
    condition: [],
    budgetMin: undefined,
    budgetMax: undefined,
    city: '',
    urgency: '',
    search: '',
    sortBy: 'newest'
  });

  pagination = signal<PaginationState>({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0,
    totalPages: 0
  });

  conditions = ['New', 'Like New', 'Excellent', 'Good', 'Fair'];

  constructor(
    private lookingForService: LookingForService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLookingForPosts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLookingForPosts() {
    this.isLoading.set(true);

    const filterParams: LookingForFilters = {
      ...this.filters(),
      condition: this.filters().condition.join(','),
      page: this.pagination().currentPage,
      limit: this.pagination().itemsPerPage
    };

    // Remove empty/null values
    Object.keys(filterParams).forEach(key => {
      const value = filterParams[key as keyof LookingForFilters];
      if (value === null || value === undefined || value === '') {
        delete filterParams[key as keyof LookingForFilters];
      }
    });

    this.lookingForService.getLookingForPosts(filterParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LookingForListResponse) => {
          this.lookingForPosts.set(response.lookingForPosts);
          this.pagination.update(prev => ({
            ...prev,
            totalItems: response.pagination.totalPosts,
            totalPages: response.pagination.totalPages,
            currentPage: response.pagination.currentPage
          }));
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading Looking For posts:', error);
          this.isLoading.set(false);
        }
      });
  }

  onSearchChange() {
    this.pagination.update(prev => ({ ...prev, currentPage: 1 }));
    this.debounceSearch();
  }

  private searchTimeout: any;
  private debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadLookingForPosts();
    }, 300);
  }

  onFiltersChange() {
    this.pagination.update(prev => ({ ...prev, currentPage: 1 }));
    this.loadLookingForPosts();
  }

  clearSearch() {
    this.filters.update(prev => ({ ...prev, search: '' }));
    this.onFiltersChange();
  }

  toggleMobileFilters() {
    this.showMobileFilters.update(show => !show);
  }

  isConditionSelected(condition: string): boolean {
    return this.filters().condition.includes(condition);
  }

  toggleCondition(condition: string) {
    this.filters.update(prev => {
      const conditions = prev.condition.includes(condition)
        ? prev.condition.filter(c => c !== condition)
        : [...prev.condition, condition];
      return { ...prev, condition: conditions };
    });
    this.onFiltersChange();
  }

  getActiveFiltersCount(): number {
    const f = this.filters();
    let count = 0;
    if (f.category) count++;
    if (f.condition.length > 0) count++;
    if (f.budgetMin !== null) count++;
    if (f.budgetMax !== null) count++;
    if (f.city) count++;
    if (f.urgency) count++;
    return count;
  }

  clearAllFilters() {
    this.filters.set({
      category: '',
      condition: [],
      budgetMin: undefined,
      budgetMax: undefined,
      city: '',
      urgency: '',
      search: '',
      sortBy: 'newest'
    });
    this.onFiltersChange();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination().totalPages) {
      this.pagination.update(prev => ({ ...prev, currentPage: page }));
      this.loadLookingForPosts();
    }
  }

  getVisiblePages(): number[] {
    const current = this.pagination().currentPage;
    const total = this.pagination().totalPages;
    const delta = 2;

    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push('...', total);
    } else {
      rangeWithDots.push(total);
    }

    return rangeWithDots.filter((item, index) => rangeWithDots.indexOf(item) === index && typeof item === 'number') as number[];
  }

  onPostClick(post: LookingForPost) {
    this.router.navigate(['/looking-for', post._id]);
  }

  onRespondClick(post: LookingForPost) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    // Navigate to detail page where users can respond
    this.router.navigate(['/looking-for', post._id]);
  }

  navigateToCreate() {
    this.router.navigate(['/looking-for/create']);
  }

  // Scroll to filters section
  scrollToFilters() {
    const filtersElement = document.getElementById('filters-section');
    if (filtersElement) {
      filtersElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // TrackBy functions for performance
  trackByPostId(index: number, post: LookingForPost): string {
    return post._id;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}