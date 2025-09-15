import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdminService, AdminProduct, AdminStats, CoinStats, UserCoinDetails, SuspiciousActivities } from '../services/admin.service';
import { ModalService } from '../services/modal.service';
import { environment } from '../../environments/environment';

// Using AdminProduct and AdminStats from AdminService
export interface AdminListing {
  id: string;
  title: string;
  seller: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'sold';
  boosted: boolean;
  createdAt: string;
  category: string;
  flagged: boolean;
  views: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  subscription: 'free' | 'basic' | 'pro';
  joinDate: string;
  listingsCount: number;
  rating: number;
  status: 'active' | 'suspended' | 'banned';
  lastActive: string;
}

export interface UserActivityStats {
  overview: {
    totalPageViews: number;
    uniqueVisitors: number;
    totalSessions: number;
    avgSessionDuration: number;
  };
  trends: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
  }>;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  popularProducts: Array<{
    productId: string;
    title: string;
    views: number;
  }>;
  searchStats: Array<{
    query: string;
    count: number;
  }>;
  recentActivity: Array<{
    eventType: string;
    path: string;
    user: { name: string; email: string } | null;
    timestamp: string;
    device: string;
    browser: string;
  }>;
}

export interface UserVisit {
  _id: string;
  username: string;
  email: string;
  userRole: string;
  subscription?: {
    plan: string;
    remainingListings: number;
    remainingBoosts: number;
    expiresAt?: string;
  };
  isVerified: boolean;
  firstVisit: string;
  lastVisit: string;
  totalPageViews: number;
  sessionCount: number;
  avgPagesPerSession: number;
  uniquePathsCount: number;
  eventTypes: string[];
  devices: string[];
  browsers: string[];
}

export interface UserVisitsData {
  users: UserVisit[];
  summary: {
    totalRegisteredVisitors: number;
    totalAnonymousVisitors: number;
    totalVisitors: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

export interface AnonymousVisitor {
  fingerprint: string;
  firstVisit: string;
  lastVisit: string;
  totalPageViews: number;
  sessionCount: number;
  deviceCount: number;
  uniquePathsCount: number;
  uniqueIPs: number;
  eventTypes: string[];
  devices: string[];
  browsers: string[];
  paths: string[];
  primaryDevice: string;
  primaryBrowser: string;
  avgPagesPerSession: number;
}

export interface AnonymousVisitsData {
  visitors: AnonymousVisitor[];
  summary: {
    totalPageViews: number;
    uniqueVisitors: number;
    totalSessions: number;
    uniqueIPs: number;
    deviceBreakdown: string[];
    browserBreakdown: string[];
    dateRange: {
      start: string;
      end: string;
    };
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <!-- Modern Admin Header -->
      <header class="bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            <!-- Left side - Brand & Title -->
            <div class="flex items-center gap-4">
              <a routerLink="/" class="group flex items-center gap-3 hover:opacity-90 transition-all duration-300">
                <div class="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span class="text-white font-bold text-lg">🎾</span>
                </div>
                <div class="hidden sm:block">
                  <h1 class="text-xl font-bold text-gray-900">TennisMarket</h1>
                  <p class="text-xs text-gray-500 -mt-1">Tennis Marketplace</p>
                </div>
              </a>
              <div class="hidden md:flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <span class="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-full shadow-md">
                  Admin Dashboard
                </span>
              </div>
            </div>

            <!-- Right side - Actions & Profile -->
            <div class="flex items-center gap-3">
              <!-- Quick Actions -->
              <div class="hidden lg:flex items-center gap-2">
                <a routerLink="/analytics"
                   class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group">
                  <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Analytics
                </a>

                <button class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                  <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5-5-5h5v-12h0z"></path>
                  </svg>
                  <span class="hidden xl:inline">Export</span>
                </button>
              </div>

              <!-- Mobile menu button -->
              <button (click)="toggleMobileMenu()" class="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>

              <!-- Admin Profile -->
              <div class="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div class="hidden sm:block text-right">
                  <p class="text-sm font-semibold text-gray-900">Admin User</p>
                  <p class="text-xs text-gray-500">Super Administrator</p>
                </div>
                <div class="relative">
                  <button class="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <svg class="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </button>
                  <!-- Status indicator -->
                  <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile Menu -->
          @if (showMobileMenu()) {
            <div class="md:hidden border-t border-gray-200 py-4 animate-in slide-in-from-top duration-200">
              <div class="flex flex-col space-y-2">
                <a routerLink="/analytics" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Site Analytics
                </a>
                <button class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors w-full text-left">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export Data
                </button>
              </div>
            </div>
          }
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Modern Stats Overview -->
        <div class="mb-10">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
            <p class="text-gray-600">Monitor your platform's key metrics and performance</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Users Card -->
            <div class="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
              <div class="relative p-6">
                <div class="flex items-center justify-between mb-4">
                  <div class="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                    <p class="text-3xl font-bold text-gray-900">{{ stats().totalUsers | number }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                    +12%
                  </span>
                  <span class="text-xs text-gray-500">vs last month</span>
                </div>
              </div>
            </div>

            <!-- Active Listings Card -->
            <div class="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
              <div class="relative p-6">
                <div class="flex items-center justify-between mb-4">
                  <div class="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-gray-600 mb-1">Active Listings</p>
                    <p class="text-3xl font-bold text-gray-900">{{ stats().activeListings | number }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ stats().pendingApproval }}
                  </span>
                  <span class="text-xs text-gray-500">pending approval</span>
                </div>
              </div>
            </div>

            <!-- Monthly Revenue Card -->
            <div class="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-orange-50/50"></div>
              <div class="relative p-6">
                <div class="flex items-center justify-between mb-4">
                  <div class="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</p>
                    <p class="text-3xl font-bold text-gray-900">
₱{{ stats().monthlyRevenue | number }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                    {{ stats().boostedListings }}
                  </span>
                  <span class="text-xs text-gray-500">boosted listings</span>
                </div>
              </div>
            </div>

            <!-- Subscriptions Card -->
            <div class="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50"></div>
              <div class="relative p-6">
                <div class="flex items-center justify-between mb-4">
                  <div class="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-gray-600 mb-1">Premium Users</p>
                    <p class="text-3xl font-bold text-gray-900">{{ (stats().subscriptions.basic + stats().subscriptions.pro) | number }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    {{ stats().subscriptions.free | number }}
                  </span>
                  <span class="text-xs text-gray-500">free users</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Navigation Tabs -->
        <div class="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg mb-8 overflow-hidden">
          <!-- Mobile Tab Selector -->
          <div class="sm:hidden border-b border-gray-200">
            <select (change)="onTabSelectChange($event)"
                    [value]="activeTab()"
                    class="block w-full px-6 py-4 text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none">
              @for (tab of tabs(); track tab.id) {
                <option [value]="tab.id">{{ tab.label }}</option>
              }
            </select>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden sm:block">
            <nav class="relative">
              <!-- Background Slider -->
              <div class="absolute bottom-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-in-out"
                   [style.width.%]="100 / tabs().length"
                   [style.left.%]="getSliderPosition()">
              </div>

              <div class="flex overflow-x-auto">
                @for (tab of tabs(); track tab.id) {
                  <button
                    (click)="setActiveTab(tab.id)"
                    class="relative flex-1 group px-6 py-5 text-center transition-all duration-200"
                    [class.text-blue-600]="activeTab() === tab.id"
                    [class.text-gray-600]="activeTab() !== tab.id"
                    [class.bg-blue-50/50]="activeTab() === tab.id">

                    <!-- Tab Content -->
                    <div class="flex flex-col items-center gap-2">
                      <!-- Tab Icon -->
                      <div class="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
                           [class.bg-blue-100]="activeTab() === tab.id"
                           [class.bg-gray-100]="activeTab() !== tab.id"
                           [class.group-hover:bg-blue-50]="activeTab() !== tab.id">
                        @switch (tab.id) {
                          @case ('pending') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          }
                          @case ('listings') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                          }
                          @case ('users') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                            </svg>
                          }
                          @case ('user-reports') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                          }
                          @case ('coins') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          }
                          @case ('activities') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                          }
                        }
                      </div>

                      <!-- Tab Label -->
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium whitespace-nowrap">{{ tab.label }}</span>
                        @if (tab.badge) {
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200"
                                [class.bg-blue-100]="activeTab() === tab.id"
                                [class.text-blue-700]="activeTab() === tab.id"
                                [class.bg-gray-100]="activeTab() !== tab.id"
                                [class.text-gray-600]="activeTab() !== tab.id">
                            {{ tab.badge }}
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Hover Effect -->
                    <div class="absolute inset-x-0 bottom-0 h-1 bg-gray-200 group-hover:bg-gray-300 transition-colors duration-200"
                         [class.opacity-0]="activeTab() === tab.id"
                         [class.opacity-100]="activeTab() !== tab.id">
                    </div>
                  </button>
                }
              </div>
            </nav>
          </div>
        </div>

        <!-- Modern Content Area -->
        <div class="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg overflow-hidden">
          <!-- Loading State -->
          @if (isLoading()) {
            <div class="flex items-center justify-center py-16 px-8">
              <div class="text-center space-y-4">
                <!-- Animated Loading Spinner -->
                <div class="relative w-16 h-16 mx-auto">
                  <div class="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div class="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
                </div>

                <!-- Loading Message -->
                <div class="space-y-2">
                  <h3 class="text-lg font-semibold text-gray-900">{{ loadingMessage() }}</h3>
                  <p class="text-gray-600">Please wait while we gather the latest information</p>
                </div>

                <!-- Loading Steps -->
                <div class="flex items-center justify-center gap-2 mt-6">
                  <div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style="animation-delay: 0s"></div>
                  <div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                  <div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                </div>
              </div>
            </div>
          } @else {
            <div class="p-6 sm:p-8">
            <!-- Pending Listings Tab -->
            @if (activeTab() === 'pending') {
              <div class="space-y-6">
                <!-- Section Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 class="text-2xl font-bold text-gray-900">Pending Approval</h3>
                    <p class="text-gray-600 mt-1">Review and approve new product listings</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                      <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                      {{ pendingListings().length }} pending
                    </div>
                    <button
                      (click)="approveAll()"
                      class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-green-500/25">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Approve All
                    </button>
                  </div>
                </div>

                <!-- Pending Listings Grid -->
                <div class="grid gap-4">
                  @for (listing of pendingListings(); track listing._id) {
                    <div class="group relative bg-gradient-to-r from-white to-gray-50/50 border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                      <!-- Status Indicator -->
                      <div class="absolute top-4 right-4">
                        <div class="flex items-center gap-2">
                          @if (listing.isBoosted) {
                            <span class="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-medium rounded-full shadow-lg">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                              </svg>
                              Boosted
                            </span>
                          }
                          <div class="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>

                      <div class="grid lg:grid-cols-3 gap-6">
                        <!-- Product Info -->
                        <div class="lg:col-span-2 space-y-4">
                          <div>
                            <h4 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {{ listing.title }}
                            </h4>
                            <div class="flex items-center gap-4 text-sm text-gray-600">
                              <span class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                </svg>
                                {{ listing.category }}
                              </span>
                              <span class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {{ listing.createdAt | date:'short' }}
                              </span>
                            </div>
                          </div>

                          <div class="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                            <div class="space-y-2">
                              <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <span class="text-sm font-medium text-gray-700">Seller</span>
                              </div>
                              <p class="text-sm text-gray-900 font-semibold">
                                {{ listing.seller?.firstName || 'Unknown' }} {{ listing.seller?.lastName || '' }}
                              </p>
                            </div>
                            <div class="space-y-2">
                              <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span class="text-sm font-medium text-gray-700">Price</span>
                              </div>
                              <p class="text-lg font-bold text-gray-900">
                                ₱{{ listing.price | number }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex lg:flex-col gap-3 lg:justify-center">
                          <button
                            (click)="approveListing(listing._id)"
                            class="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-green-500/25">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span class="hidden sm:inline">Approve</span>
                          </button>

                          <button
                            (click)="rejectListing(listing._id)"
                            class="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-red-500/25">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            <span class="hidden sm:inline">Reject</span>
                          </button>

                          <button class="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-500/25">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            <span class="hidden sm:inline">View</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Empty State -->
                  @if (pendingListings().length === 0) {
                    <div class="text-center py-12 px-6 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl border border-dashed border-gray-300">
                      <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                      <p class="text-gray-600">No listings pending approval at the moment.</p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- All Listings Tab -->
            @if (activeTab() === 'listings') {
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">All Listings</h3>
                  <div class="flex gap-3">
                    <select [(ngModel)]="listingFilter" class="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="sold">Sold</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <input 
                      [(ngModel)]="listingSearch"
                      type="text" 
                      placeholder="Search listings..."
                      class="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64">
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      @for (listing of filteredListings(); track listing._id) {
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                              <div>
                                <div class="text-sm font-medium text-gray-900">{{ listing.title }}</div>
                                <div class="text-sm text-gray-500">{{ listing.category }}</div>
                              </div>
                              @if (listing.isBoosted) {
                                <span class="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Boosted</span>
                              }
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ listing.seller?.firstName || 'Unknown' }} {{ listing.seller?.lastName || '' }}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{{ listing.price | number }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span [class]="getStatusColor(listing.isApproved)">
                              {{ listing.isApproved | titlecase }}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ listing.views }}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ listing.createdAt | date }}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button class="text-green-600 hover:text-green-900 mr-3">Edit</button>
                            <button class="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Users Tab -->
            @if (activeTab() === 'users') {
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">User Management</h3>
                  <div class="flex gap-3">
                    <select [(ngModel)]="userFilter" class="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="all">All Users</option>
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                    </select>
                    <input 
                      [(ngModel)]="userSearch"
                      type="text" 
                      placeholder="Search users..."
                      class="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64">
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listings</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      @for (user of filteredUsers(); track user._id) {
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                              <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                                <span class="text-white font-medium text-sm">
                                  {{ (user.firstName?.charAt(0) || '') }}{{ (user.lastName?.charAt(0) || '') }}
                                </span>
                              </div>
                              <div>
                                <div class="text-sm font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</div>
                                <div class="text-sm text-gray-500">{{ user.lastLogin ? (user.lastLogin | date:'short') : 'Never' }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{{ user.email }}</div>
                            <div class="text-sm text-gray-500">{{ user.phoneNumber }}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span [class]="getSubscriptionColor(user.subscription?.plan || 'free')">
                              {{ (user.subscription?.plan || 'free') | titlecase }}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.listingsCount || 0 }}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div class="flex items-center">
                              <span class="text-yellow-400 mr-1">★</span>
                              {{ user.rating?.average || 0 }}
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span [class]="getUserStatusColor(user.isActive ? 'active' : 'suspended')">
                              {{ user.isActive ? 'Active' : 'Suspended' }}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button class="text-green-600 hover:text-green-900 mr-3">View</button>
                            <button class="text-red-600 hover:text-red-900">Suspend</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Inquiries Tab -->
            @if (activeTab() === 'inquiries') {
              <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">All User Inquiries</h3>
                  <div class="text-sm text-gray-500">
                    {{ allInquiries().length }} total inquiries
                  </div>
                </div>

                @if (allInquiries().length > 0) {
                  <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                    @for (inquiry of allInquiries(); track inquiry.timestamp) {
                      <div class="p-6 hover:bg-gray-50">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <!-- Inquiry Header -->
                            <div class="flex items-center gap-3 mb-3">
                              <img 
                                [src]="inquiry.imageUrl" 
                                [alt]="inquiry.productTitle"
                                class="w-12 h-12 rounded-lg object-cover">
                              <div class="flex-1">
                                <h4 class="font-semibold text-gray-900">{{ inquiry.productTitle }}</h4>
                                <div class="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <span>From: <strong>{{ getUserNameById(inquiry.userId) }}</strong></span>
                                  <span>To: <strong>{{ inquiry.sellerName }}</strong></span>
                                  <span>{{ inquiry.timestamp | date:'short' }}</span>
                                </div>
                              </div>
                            </div>
                            
                            <!-- Inquiry Message -->
                            <div class="bg-gray-50 rounded-lg p-4">
                              <p class="text-sm text-gray-900">{{ inquiry.message }}</p>
                            </div>
                            
                            <!-- Inquiry Metadata -->
                            <div class="flex items-center gap-6 mt-3 text-xs text-gray-500">
                              <span>Method: <strong class="text-gray-700">{{ inquiry.contactMethod | titlecase }}</strong></span>
                              <span>Status: 
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {{ inquiry.status | titlecase }}
                                </span>
                              </span>
                              <span>Product ID: {{ inquiry.productId }}</span>
                            </div>
                          </div>
                          
                          <!-- Admin Actions -->
                          <div class="flex flex-col gap-2 ml-6">
                            <button 
                              class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              (click)="viewInquiryDetails(inquiry)">
                              View Details
                            </button>
                            <button 
                              class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              (click)="markInquiryResolved(inquiry)">
                              Mark Resolved
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center py-12">
                    <div class="text-6xl mb-4">💬</div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">No inquiries yet</h3>
                    <p class="text-gray-600">User inquiries will appear here when buyers contact sellers.</p>
                  </div>
                }
              </div>
            }

            <!-- User Approval Tab -->
            @if (activeTab() === 'user-approval') {
              <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">User Account Approval</h3>
                  <div class="text-sm text-gray-500">
                    {{ userApprovalStats().pendingUsers }} pending • {{ userApprovalStats().activeUsers }} active
                  </div>
                </div>

                <!-- User Approval Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span class="text-yellow-600">⏳</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Pending</div>
                        <div class="text-2xl font-bold text-gray-900">{{ userApprovalStats().pendingUsers }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span class="text-green-600">✅</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Active</div>
                        <div class="text-2xl font-bold text-gray-900">{{ userApprovalStats().activeUsers }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span class="text-blue-600">👥</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Total Users</div>
                        <div class="text-2xl font-bold text-gray-900">{{ userApprovalStats().totalUsers }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span class="text-purple-600">📊</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Approval Rate</div>
                        <div class="text-2xl font-bold text-gray-900">{{ userApprovalStats().approvalRate }}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Pending User Accounts -->
                <div class="bg-white rounded-lg border border-gray-200">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                      <h4 class="text-md font-semibold text-gray-900">Pending User Accounts</h4>
                      <button 
                        (click)="approveAllUsers()"
                        class="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                        Approve All
                      </button>
                    </div>
                  </div>
                  <div class="divide-y divide-gray-200">
                    @for (user of pendingUsers(); track user._id) {
                      <div class="p-6 hover:bg-gray-50">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                              <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                <span class="text-white font-medium text-sm">
                                  {{ user.firstName?.charAt(0) }}{{ user.lastName?.charAt(0) }}
                                </span>
                              </div>
                              <div>
                                <h5 class="font-semibold text-gray-900">
                                  {{ user.firstName }} {{ user.lastName }}
                                </h5>
                                <p class="text-sm text-gray-500">{{ user.email }}</p>
                              </div>
                              <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {{ user.role | titlecase }}
                              </span>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div class="text-sm text-gray-600">
                                <p><span class="font-medium">Phone:</span> {{ user.phoneNumber }}</p>
                                <p><span class="font-medium">Location:</span> 
                                  {{ user.location?.city }}, {{ user.location?.region }}</p>
                                <p><span class="font-medium">Registered:</span> 
                                  {{ user.createdAt | date:'medium' }}</p>
                              </div>
                              
                              <div class="text-sm text-gray-600">
                                <p><span class="font-medium">Subscription:</span> {{ user.subscription?.plan | titlecase }}</p>
                                <p><span class="font-medium">Verification Status:</span> 
                                  <span [class]="getVerificationStatusColor(user.verification?.status || 'none')">
                                    {{ user.verification?.status || 'none' | titlecase }}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div class="flex gap-2 ml-6">
                            <button 
                              (click)="approveUser(user._id, user.firstName + ' ' + user.lastName)"
                              class="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                              Approve
                            </button>
                            <button 
                              (click)="suspendUser(user._id, user.firstName + ' ' + user.lastName)"
                              class="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                    
                    @if (pendingUsers().length === 0) {
                      <div class="p-12 text-center">
                        <div class="text-4xl mb-4">✅</div>
                        <h4 class="text-lg font-semibold text-gray-900 mb-2">All caught up!</h4>
                        <p class="text-gray-600">No user accounts pending approval.</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- Verification Tab -->
            @if (activeTab() === 'verification') {
              <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">User Verification</h3>
                  <div class="text-sm text-gray-500">
                    {{ verificationStats().pending }} pending • {{ verificationStats().totalVerified }} verified
                  </div>
                </div>

                <!-- Verification Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span class="text-yellow-600">⏳</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Pending</div>
                        <div class="text-2xl font-bold text-gray-900">{{ verificationStats().pending }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span class="text-green-600">✅</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Approved</div>
                        <div class="text-2xl font-bold text-gray-900">{{ verificationStats().approved }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span class="text-red-600">❌</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Rejected</div>
                        <div class="text-2xl font-bold text-gray-900">{{ verificationStats().rejected }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span class="text-blue-600">🏅</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Total Verified</div>
                        <div class="text-2xl font-bold text-gray-900">{{ verificationStats().totalVerified }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Pending Verifications -->
                <div class="bg-white rounded-lg border border-gray-200">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h4 class="text-md font-semibold text-gray-900">Pending Verification Requests</h4>
                  </div>
                  <div class="divide-y divide-gray-200">
                    @for (request of pendingVerifications(); track request._id) {
                      <div class="p-6 hover:bg-gray-50">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                              <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                <span class="text-white font-medium text-sm">
                                  {{ request.firstName?.charAt(0) }}{{ request.lastName?.charAt(0) }}
                                </span>
                              </div>
                              <div>
                                <h5 class="font-semibold text-gray-900">
                                  {{ request.firstName }} {{ request.lastName }}
                                </h5>
                                <p class="text-sm text-gray-500">{{ request.email }}</p>
                              </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div class="text-sm text-gray-600">
                                <p><span class="font-medium">Phone:</span> {{ request.phoneNumber }}</p>
                                <p><span class="font-medium">Location:</span> 
                                  {{ request.location?.city }}, {{ request.location?.region }}</p>
                                <p><span class="font-medium">Requested:</span> 
                                  {{ request.verification?.requestedAt | date:'medium' }}</p>
                              </div>
                              
                              <div class="text-sm text-gray-600">
                                <p class="font-medium mb-2">Documents:</p>
                                <div class="space-y-1">
                                  @for (doc of request.verification?.documents; track doc.url) {
                                    <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                                      <span class="text-xs">{{ doc.type.replace('_', ' ') | titlecase }}</span>
                                      <a [href]="doc.url" target="_blank" 
                                         class="text-blue-600 hover:text-blue-800 text-xs">View</a>
                                    </div>
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div class="flex gap-2 ml-6">
                            <button 
                              (click)="approveVerification(request._id)"
                              class="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                              Approve
                            </button>
                            <button 
                              (click)="rejectVerification(request._id)"
                              class="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                    
                    @if (pendingVerifications().length === 0) {
                      <div class="p-12 text-center">
                        <div class="text-4xl mb-4">✅</div>
                        <h4 class="text-lg font-semibold text-gray-900 mb-2">All caught up!</h4>
                        <p class="text-gray-600">No verification requests pending review.</p>
                      </div>
                    }
                  </div>
                </div>

                <!-- Recent Verification History -->
                <div class="bg-white rounded-lg border border-gray-200">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h4 class="text-md font-semibold text-gray-900">Recent Verification History</h4>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed By</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        @for (history of verificationHistory(); track history._id) {
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="flex items-center">
                                <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                                  <span class="text-white font-medium text-sm">
                                    {{ history.firstName?.charAt(0) }}{{ history.lastName?.charAt(0) }}
                                  </span>
                                </div>
                                <div>
                                  <div class="text-sm font-medium text-gray-900">
                                    {{ history.firstName }} {{ history.lastName }}
                                  </div>
                                  <div class="text-sm text-gray-500">{{ history.email }}</div>
                                </div>
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <span [class]="getVerificationStatusColor(history.verification?.status)">
                                {{ history.verification?.status | titlecase }}
                              </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              @if (history.verification?.reviewedBy) {
                                {{ history.verification.reviewedBy?.firstName || 'Unknown' }} {{ history.verification.reviewedBy?.lastName || '' }}
                              } @else {
                                -
                              }
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {{ history.verification?.reviewedAt | date:'medium' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button class="text-green-600 hover:text-green-900">View Details</button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            }

            <!-- User Reports Tab -->
            @if (activeTab() === 'user-reports') {
              <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">User Reports Management</h3>
                  <div class="text-sm text-gray-500">
                    {{ reportStats().pendingReports }} pending • {{ reportStats().totalReports }} total
                  </div>
                </div>

                <!-- Report Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span class="text-yellow-600">⏳</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Pending</div>
                        <div class="text-2xl font-bold text-gray-900">{{ reportStats().pendingReports }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span class="text-green-600">✅</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Resolved</div>
                        <div class="text-2xl font-bold text-gray-900">{{ reportStats().resolvedReports }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span class="text-red-600">🚨</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Urgent</div>
                        <div class="text-2xl font-bold text-gray-900">{{ reportStats().urgentReports }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span class="text-blue-600">📊</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-500">Total Reports</div>
                        <div class="text-2xl font-bold text-gray-900">{{ reportStats().totalReports }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Report Filters -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center space-x-2">
                      <label for="report-status-filter" class="text-sm font-medium text-gray-700">Status:</label>
                      <select id="report-status-filter"
                              [(ngModel)]="reportFilters().status"
                              (ngModelChange)="updateReportFilters('status', $event)"
                              class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                        <option value="escalated">Escalated</option>
                      </select>
                    </div>

                    <div class="flex items-center space-x-2">
                      <label for="report-type-filter" class="text-sm font-medium text-gray-700">Type:</label>
                      <select id="report-type-filter"
                              [(ngModel)]="reportFilters().type"
                              (ngModelChange)="updateReportFilters('type', $event)"
                              class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="all">All Types</option>
                        <option value="fraud">Fraud</option>
                        <option value="harassment">Harassment</option>
                        <option value="fake_products">Fake Products</option>
                        <option value="spam">Spam</option>
                        <option value="inappropriate_behavior">Inappropriate Behavior</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div class="flex items-center space-x-2">
                      <label for="report-priority-filter" class="text-sm font-medium text-gray-700">Priority:</label>
                      <select id="report-priority-filter"
                              [(ngModel)]="reportFilters().priority"
                              (ngModelChange)="updateReportFilters('priority', $event)"
                              class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <button (click)="refreshReports()"
                            class="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                      Refresh
                    </button>
                  </div>
                </div>

                <!-- Reports List -->
                <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  @if (filteredReports().length > 0) {
                    <div class="divide-y divide-gray-200">
                      @for (report of filteredReports(); track report._id) {
                        <div class="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                             (click)="viewReportDetails(report)">
                          <div class="flex items-start justify-between">
                            <div class="flex-1">
                              <!-- Report Header -->
                              <div class="flex items-center space-x-3 mb-2">
                                <span [class]="getReportPriorityClass(report.priority)">
                                  {{ getReportPriorityIcon(report.priority) }}
                                </span>
                                <span class="text-sm font-medium text-gray-900">{{ getReportTypeLabel(report.type) }}</span>
                                <span [class]="getReportStatusClass(report.status)">
                                  {{ report.status.replace('_', ' ') | titlecase }}
                                </span>
                                <span class="text-xs text-gray-500">
                                  {{ formatTimeAgo(report.createdAt) }}
                                </span>
                              </div>

                              <!-- Report Content -->
                              <div class="mb-3">
                                <h4 class="text-sm font-medium text-gray-900 mb-1">{{ report.reason }}</h4>
                                <p class="text-sm text-gray-600 line-clamp-2">{{ report.description }}</p>
                              </div>

                              <!-- Reporter and Reported User -->
                              <div class="flex items-center space-x-6 text-xs text-gray-500">
                                <span>
                                  Reporter: <strong class="text-gray-700">{{ report.reporter.firstName }} {{ report.reporter.lastName }}</strong>
                                </span>
                                <span>
                                  Reported: <strong class="text-gray-700">{{ report.reportedUser.firstName }} {{ report.reportedUser.lastName }}</strong>
                                </span>
                                @if (report.reportedProduct) {
                                  <span>
                                    Product: <strong class="text-gray-700">{{ report.reportedProduct.title }}</strong>
                                  </span>
                                }
                              </div>
                            </div>

                            <!-- Quick Actions -->
                            <div class="flex flex-col gap-2 ml-6">
                              @if (report.status === 'pending' || report.status === 'under_review') {
                                <button
                                  (click)="quickResolveReport(report, $event)"
                                  class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                                  Quick Resolve
                                </button>
                                <button
                                  (click)="suspendUserFromReport(report, $event)"
                                  class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                                  Suspend User
                                </button>
                              }
                              <button
                                (click)="viewReportDetails(report, $event)"
                                class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="text-center py-12">
                      <div class="text-6xl mb-4">📋</div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                      <p class="text-gray-600">User reports will appear here when they are submitted.</p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Coin Management Tab -->
            @if (activeTab() === 'coins') {
              <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Coin System Management</h3>
                
                <!-- Coin Stats Overview -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-600">Total Coins</p>
                        <p class="text-2xl font-bold text-gray-900">{{ coinStats().summary.totalCoinsInCirculation }}</p>
                      </div>
                      <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span class="text-yellow-600 text-xl">🪙</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-600">Total Transactions</p>
                        <p class="text-2xl font-bold text-gray-900">{{ coinStats().summary.totalTransactions }}</p>
                      </div>
                      <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 text-xl">💳</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-600">Coins Earned</p>
                        <p class="text-2xl font-bold text-gray-900">{{ coinStats().summary.totalEarned }}</p>
                      </div>
                      <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span class="text-green-600 text-xl">📈</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-600">Coins Spent</p>
                        <p class="text-2xl font-bold text-gray-900">{{ coinStats().summary.totalSpent }}</p>
                      </div>
                      <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span class="text-red-600 text-xl">📉</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Coin Balance Report -->
                <div class="bg-white rounded-lg border border-gray-200 p-6">
                  <div class="flex items-center justify-between mb-6">
                    <h4 class="text-lg font-semibold text-gray-900">Coin Balance Report</h4>
                    <div class="flex items-center space-x-4">
                      <select 
                        (change)="filterCoinBalancesByRole($any($event.target).value)"
                        class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="">All Roles</option>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                      <input 
                        type="text"
                        placeholder="Search users..."
                        (input)="searchCoinBalances($any($event.target).value)"
                        class="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48">
                    </div>
                  </div>

                  <!-- Summary Statistics -->
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-blue-50 rounded-lg p-4">
                      <p class="text-sm font-medium text-blue-600">Total Balance</p>
                      <p class="text-2xl font-bold text-blue-900">{{ coinBalancesData().summary.totalBalance }}</p>
                    </div>
                    <div class="bg-green-50 rounded-lg p-4">
                      <p class="text-sm font-medium text-green-600">Total Earned</p>
                      <p class="text-2xl font-bold text-green-900">{{ coinBalancesData().summary.totalEarned }}</p>
                    </div>
                    <div class="bg-red-50 rounded-lg p-4">
                      <p class="text-sm font-medium text-red-600">Total Spent</p>
                      <p class="text-2xl font-bold text-red-900">{{ coinBalancesData().summary.totalSpent }}</p>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                      <p class="text-sm font-medium text-gray-600">Avg Balance</p>
                      <p class="text-2xl font-bold text-gray-900">{{ (coinBalancesData().summary.averageBalance || 0).toFixed(0) }}</p>
                    </div>
                  </div>

                  <!-- Users Table -->
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th (click)="sortCoinBalances('name')" 
                              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            Name
                            @if (coinBalanceFilters().sortBy === 'name') {
                              <span class="ml-1">{{ coinBalanceFilters().sortOrder === 'desc' ? '↓' : '↑' }}</span>
                            }
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th (click)="sortCoinBalances('balance')" 
                              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            Current Balance
                            @if (coinBalanceFilters().sortBy === 'balance') {
                              <span class="ml-1">{{ coinBalanceFilters().sortOrder === 'desc' ? '↓' : '↑' }}</span>
                            }
                          </th>
                          <th (click)="sortCoinBalances('totalEarned')" 
                              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            Total Earned
                            @if (coinBalanceFilters().sortBy === 'totalEarned') {
                              <span class="ml-1">{{ coinBalanceFilters().sortOrder === 'desc' ? '↓' : '↑' }}</span>
                            }
                          </th>
                          <th (click)="sortCoinBalances('totalSpent')" 
                              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            Total Spent
                            @if (coinBalanceFilters().sortBy === 'totalSpent') {
                              <span class="ml-1">{{ coinBalanceFilters().sortOrder === 'desc' ? '↓' : '↑' }}</span>
                            }
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        @for (user of coinBalancesData().users; track user.id) {
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="flex items-center">
                                <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.email }}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <span [class]="'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + (user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'seller' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')">
                                {{ user.role | titlecase }}
                              </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" 
                                [class]="user.coins.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                              {{ user.coins.balance }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.coins.totalEarned }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.coins.totalSpent }}</td>
                          </tr>
                        } @empty {
                          <tr>
                            <td colspan="6" class="px-6 py-4 text-center text-gray-500">No users found</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <!-- Pagination -->
                  @if (coinBalancesData().pagination.totalPages > 1) {
                    <div class="flex items-center justify-between mt-6">
                      <div class="text-sm text-gray-700">
                        Showing {{ coinBalancesData().users.length }} of {{ coinBalancesData().pagination.totalUsers }} users
                      </div>
                      <div class="flex items-center space-x-2">
                        <button 
                          (click)="prevCoinBalancePage()"
                          [disabled]="!coinBalancesData().pagination.hasPrev"
                          class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                          Previous
                        </button>
                        <span class="px-3 py-2 text-sm text-gray-700">
                          Page {{ coinBalancesData().pagination.currentPage }} of {{ coinBalancesData().pagination.totalPages }}
                        </span>
                        <button 
                          (click)="nextCoinBalancePage()"
                          [disabled]="!coinBalancesData().pagination.hasNext"
                          class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                          Next
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <!-- Coin Management Actions -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Award Coins -->
                  <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Award Coins</h4>
                    <form (ngSubmit)="awardCoins()" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                        <select 
                          [(ngModel)]="selectedAwardUser"
                          name="awardUser"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required>
                          <option [ngValue]="null">Choose a user...</option>
                          @for (user of allUsersForDropdown(); track user.id) {
                            <option [ngValue]="user">{{ user.name }} ({{ user.email }}) - {{ user.coins.balance }} coins</option>
                          }
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input 
                          [(ngModel)]="awardForm.amount" 
                          name="awardAmount"
                          type="number" 
                          min="1" 
                          max="1000"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter amount (max 1000)"
                          required>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input 
                          [(ngModel)]="awardForm.description" 
                          name="awardDescription"
                          type="text" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Reason for awarding coins"
                          required>
                      </div>
                      <button 
                        type="submit"
                        class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
                        Award Coins
                      </button>
                    </form>
                  </div>

                  <!-- Deduct Coins -->
                  <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Deduct Coins</h4>
                    <form (ngSubmit)="deductCoins()" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                        <select 
                          [(ngModel)]="selectedDeductUser"
                          name="deductUser"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required>
                          <option [ngValue]="null">Choose a user...</option>
                          @for (user of allUsersForDropdown(); track user.id) {
                            <option [ngValue]="user">{{ user.name }} ({{ user.email }}) - {{ user.coins.balance }} coins</option>
                          }
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input 
                          [(ngModel)]="deductForm.amount" 
                          name="deductAmount"
                          type="number" 
                          min="1"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter amount to deduct"
                          required>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input 
                          [(ngModel)]="deductForm.description" 
                          name="deductDescription"
                          type="text" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Reason for deducting coins"
                          required>
                      </div>
                      <button 
                        type="submit"
                        class="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                        Deduct Coins
                      </button>
                    </form>
                  </div>
                </div>

                <!-- Recent Transactions -->
                <div class="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 class="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h4>
                  @if (coinStats().recentTransactions.length > 0) {
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance After</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          @for (transaction of coinStats().recentTransactions; track transaction._id) {
                            <tr class="hover:bg-gray-50">
                              <td class="px-6 py-4 whitespace-nowrap">
                                <span [class]="getTransactionTypeColor(transaction.type)">
                                  {{ transaction.type | titlecase }}
                                </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {{ transaction.amount }} coins
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {{ transaction.reason }}
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {{ transaction.balanceAfter }}
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ transaction.createdAt | date:'medium' }}
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <div class="text-center py-8 text-gray-500">
                      No recent transactions found.
                    </div>
                  }
                </div>

                <!-- Top Users by Coin Balance -->
                <div class="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 class="text-lg font-semibold text-gray-900 mb-4">Top Users by Coin Balance</h4>
                  @if (coinStats().topUsers.length > 0) {
                    <div class="space-y-3">
                      @for (user of coinStats().topUsers; track user._id) {
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                              <span class="text-white text-sm font-medium">
                                {{ user.firstName?.charAt(0) }}{{ user.lastName?.charAt(0) }}
                              </span>
                            </div>
                            <div>
                              <p class="font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</p>
                              <p class="text-sm text-gray-500">{{ user.email }}</p>
                            </div>
                          </div>
                          <div class="text-right">
                            <p class="font-semibold text-gray-900">{{ user.coins.balance }} coins</p>
                            <p class="text-sm text-gray-500">Total earned: {{ user.coins.totalEarned }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="text-center py-8 text-gray-500">
                      No user data available.
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Reports Tab -->
            @if (activeTab() === 'reports') {
              <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Analytics & Reports</h3>
                
                <!-- User Activity Overview -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    User Activity Report
                  </h4>
                  
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-blue-600">Total Page Views</p>
                          <p class="text-2xl font-bold text-blue-900">{{ userActivityStats().overview.totalPageViews | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-green-600">Unique Visitors</p>
                          <p class="text-2xl font-bold text-green-900">{{ userActivityStats().overview.uniqueVisitors | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-purple-600">Total Sessions</p>
                          <p class="text-2xl font-bold text-purple-900">{{ userActivityStats().overview.totalSessions | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-orange-600">Avg Session (min)</p>
                          <p class="text-2xl font-bold text-orange-900">{{ (userActivityStats().overview.avgSessionDuration / 60) | number:'1.0-1' }}</p>
                        </div>
                        <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Device Breakdown -->
                  <div class="mb-6">
                    <h5 class="text-md font-semibold text-gray-900 mb-3">Device Breakdown</h5>
                    <div class="grid grid-cols-3 gap-4">
                      <div class="text-center">
                        <div class="text-2xl mb-2">🖥️</div>
                        <p class="text-sm text-gray-600">Desktop</p>
                        <p class="text-lg font-bold text-gray-900">{{ userActivityStats().devices.desktop | number }}</p>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl mb-2">📱</div>
                        <p class="text-sm text-gray-600">Mobile</p>
                        <p class="text-lg font-bold text-gray-900">{{ userActivityStats().devices.mobile | number }}</p>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl mb-2">📱</div>
                        <p class="text-sm text-gray-600">Tablet</p>
                        <p class="text-lg font-bold text-gray-900">{{ userActivityStats().devices.tablet | number }}</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Recent Activity -->
                  <div>
                    <h5 class="text-md font-semibold text-gray-900 mb-3">Recent Activity</h5>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                      @for (activity of userActivityStats().recentActivity; track activity.timestamp) {
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div class="flex items-center space-x-3">
                            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <p class="text-sm font-medium text-gray-900">{{ activity.eventType.replace('_', ' ') | titlecase }}</p>
                              <p class="text-xs text-gray-500">{{ activity.path }}</p>
                              @if (activity.user) {
                                <p class="text-xs text-blue-600">{{ activity.user.name }}</p>
                              }
                            </div>
                          </div>
                          <div class="text-right">
                            <p class="text-xs text-gray-500">{{ formatTimeAgo(activity.timestamp) }}</p>
                            <p class="text-xs text-gray-400">{{ activity.device }} • {{ activity.browser }}</p>
                          </div>
                        </div>
                      } @empty {
                        <div class="text-center py-8 text-gray-500">
                          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                          </svg>
                          <p>No recent activity data available</p>
                        </div>
                      }
                    </div>
                  </div>
                </div>
                
                <!-- User Visits Report -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div class="flex items-center justify-between mb-6">
                    <h4 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      User Visits Report
                    </h4>
                    
                    <!-- Filters -->
                    <div class="flex items-center gap-3">
                      <input 
                        type="date" 
                        [(ngModel)]="userVisitsFilters().startDate"
                        (ngModelChange)="updateUserVisitsFilters('startDate', $event)"
                        placeholder="Start Date"
                        class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <input 
                        type="date" 
                        [(ngModel)]="userVisitsFilters().endDate"
                        (ngModelChange)="updateUserVisitsFilters('endDate', $event)"
                        placeholder="End Date"
                        class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <select 
                        [(ngModel)]="userVisitsFilters().sortBy"
                        (ngModelChange)="updateUserVisitsFilters('sortBy', $event)"
                        class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="lastVisit">Latest Visit</option>
                        <option value="firstVisit">First Visit</option>
                        <option value="visitCount">Most Active</option>
                        <option value="username">Username A-Z</option>
                      </select>
                      <button 
                        (click)="loadUserVisitsData()"
                        class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
                        Refresh
                      </button>
                    </div>
                  </div>
                  
                  <!-- Summary Stats -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-purple-600">Registered Visitors</p>
                          <p class="text-2xl font-bold text-purple-900">{{ userVisitsData().summary.totalRegisteredVisitors | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-gray-600">Anonymous Visitors</p>
                          <p class="text-2xl font-bold text-gray-900">{{ userVisitsData().summary.totalAnonymousVisitors | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-indigo-600">Total Visitors</p>
                          <p class="text-2xl font-bold text-indigo-900">{{ userVisitsData().summary.totalVisitors | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <!-- User Visits Table -->
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Views</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Pages/Session</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Visit</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devices</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        @for (user of userVisitsData().users; track user._id) {
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10">
                                  <div class="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                                    <span class="text-white font-semibold text-sm">{{ getUserInitials(user.username) }}</span>
                                  </div>
                                </div>
                                <div class="ml-4">
                                  <div class="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {{ user.username }}
                                    @if (user.isVerified) {
                                      <span class="text-blue-500" title="Verified User">✓</span>
                                    }
                                  </div>
                                  <div class="text-sm text-gray-500">{{ user.email }}</div>
                                  <div class="text-xs text-purple-600 capitalize">{{ user.subscription?.plan || 'free' }} Plan</div>
                                </div>
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <span [class]="getRoleClass(user.userRole)">
                                {{ user.userRole | titlecase }}
                              </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div class="flex items-center">
                                <svg class="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                {{ user.totalPageViews | number }}
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div class="flex items-center">
                                <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {{ user.sessionCount | number }}
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {{ user.avgPagesPerSession | number:'1.1-1' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {{ formatDate(user.firstVisit) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {{ formatTimeAgo(user.lastVisit) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="flex flex-wrap gap-1">
                                @for (device of user.devices; track device) {
                                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    @if (device === 'mobile') { 📱 }
                                    @else if (device === 'tablet') { 📱 }
                                    @else { 🖥️ }
                                    {{ device }}
                                  </span>
                                }
                              </div>
                            </td>
                          </tr>
                        } @empty {
                          <tr>
                            <td colspan="8" class="px-6 py-12 text-center">
                              <div class="text-gray-500">
                                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <p>No user visits data available</p>
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  
                  <!-- Pagination -->
                  @if (userVisitsData().pagination.totalPages > 1) {
                    <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div class="text-sm text-gray-700">
                        Showing {{ ((userVisitsData().pagination.currentPage - 1) * userVisitsData().pagination.limit) + 1 }} 
                        to {{ min(userVisitsData().pagination.currentPage * userVisitsData().pagination.limit, userVisitsData().pagination.totalItems) }} 
                        of {{ userVisitsData().pagination.totalItems | number }} results
                      </div>
                      <div class="flex gap-2">
                        <button 
                          (click)="changeUserVisitsPage(userVisitsData().pagination.currentPage - 1)"
                          [disabled]="!userVisitsData().pagination.hasPrev"
                          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                          Previous
                        </button>
                        <span class="px-3 py-2 text-sm font-medium text-gray-900">
                          Page {{ userVisitsData().pagination.currentPage }} of {{ userVisitsData().pagination.totalPages }}
                        </span>
                        <button 
                          (click)="changeUserVisitsPage(userVisitsData().pagination.currentPage + 1)"
                          [disabled]="!userVisitsData().pagination.hasNext"
                          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                          Next
                        </button>
                      </div>
                    </div>
                  }
                </div>
                
                <!-- Anonymous Visitors Report -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div class="flex items-center justify-between mb-6">
                    <h4 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Anonymous Visitors Report
                    </h4>
                    
                    <!-- Filters -->
                    <div class="flex items-center gap-3">
                      <select 
                        [(ngModel)]="anonymousVisitsFilters().sortBy"
                        (ngModelChange)="updateAnonymousVisitsFilters('sortBy', $event)"
                        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <option value="lastVisit">Recent Activity</option>
                        <option value="firstVisit">First Visit</option>
                        <option value="visitCount">Most Active</option>
                      </select>
                      <button 
                        (click)="loadAnonymousVisitsData()"
                        class="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
                        Refresh
                      </button>
                    </div>
                  </div>
                  
                  <!-- Summary Stats -->
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-orange-600">Unique Visitors</p>
                          <p class="text-2xl font-bold text-orange-900">{{ anonymousVisitsData().summary.uniqueVisitors | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-blue-600">Page Views</p>
                          <p class="text-2xl font-bold text-blue-900">{{ anonymousVisitsData().summary.totalPageViews | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-green-600">Sessions</p>
                          <p class="text-2xl font-bold text-green-900">{{ anonymousVisitsData().summary.totalSessions | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm font-medium text-purple-600">Unique IPs</p>
                          <p class="text-2xl font-bold text-purple-900">{{ anonymousVisitsData().summary.uniqueIPs | number }}</p>
                        </div>
                        <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Anonymous Visitors Table -->
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Views</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Pages/Session</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Visit</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        @for (visitor of anonymousVisitsData().visitors; track visitor.fingerprint) {
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10">
                                  <div class="h-10 w-10 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                                    <span class="text-white font-semibold text-sm">👻</span>
                                  </div>
                                </div>
                                <div class="ml-4">
                                  <div class="text-sm font-medium text-gray-900">
                                    {{ visitor.fingerprint.substring(0, 8) }}...
                                  </div>
                                  <div class="text-xs text-gray-500">{{ visitor.uniqueIPs }} IP(s)</div>
                                </div>
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div class="flex items-center">
                                <svg class="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                {{ visitor.totalPageViews | number }}
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div class="flex items-center">
                                <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {{ visitor.sessionCount | number }}
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {{ visitor.avgPagesPerSession | number:'1.1-1' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {{ formatDate(visitor.firstVisit) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {{ formatTimeAgo(visitor.lastVisit) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="flex flex-wrap gap-1">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  @if (visitor.primaryDevice === 'mobile') { 📱 }
                                  @else if (visitor.primaryDevice === 'tablet') { 📱 }
                                  @else { 🖥️ }
                                  {{ visitor.primaryDevice }}
                                </span>
                                @if (visitor.primaryBrowser) {
                                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {{ visitor.primaryBrowser }}
                                  </span>
                                }
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  
                  <!-- Pagination -->
                  @if (anonymousVisitsData().pagination.totalPages > 1) {
                    <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div class="text-sm text-gray-700">
                        Showing {{ ((anonymousVisitsData().pagination.currentPage - 1) * anonymousVisitsData().pagination.limit) + 1 }} 
                        to {{ min(anonymousVisitsData().pagination.currentPage * anonymousVisitsData().pagination.limit, anonymousVisitsData().pagination.totalItems) }} 
                        of {{ anonymousVisitsData().pagination.totalItems | number }} results
                      </div>
                      <div class="flex gap-2">
                        <button 
                          (click)="changeAnonymousVisitsPage(anonymousVisitsData().pagination.currentPage - 1)"
                          [disabled]="!anonymousVisitsData().pagination.hasPrev"
                          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                          Previous
                        </button>
                        <span class="px-3 py-2 text-sm font-medium text-gray-900">
                          Page {{ anonymousVisitsData().pagination.currentPage }} of {{ anonymousVisitsData().pagination.totalPages }}
                        </span>
                        <button 
                          (click)="changeAnonymousVisitsPage(anonymousVisitsData().pagination.currentPage + 1)"
                          [disabled]="!anonymousVisitsData().pagination.hasNext"
                          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                          Next
                        </button>
                      </div>
                    </div>
                  }
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="text-md font-semibold text-gray-900 mb-4">Subscription Distribution</h4>
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Free</span>
                        <span class="text-sm font-medium">{{ stats().subscriptions.free }}</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gray-400 h-2 rounded-full" [style.width.%]="getFreePercentage()"></div>
                      </div>
                      
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Basic (₱299)</span>
                        <span class="text-sm font-medium">{{ stats().subscriptions.basic }}</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-500 h-2 rounded-full" [style.width.%]="getBasicPercentage()"></div>
                      </div>
                      
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Pro (₱999)</span>
                        <span class="text-sm font-medium">{{ stats().subscriptions.pro }}</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" [style.width.%]="getProPercentage()"></div>
                      </div>
                    </div>
                  </div>

                  <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="text-md font-semibold text-gray-900 mb-4">Revenue Breakdown</h4>
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Basic Subscriptions</span>
                        <span class="text-sm font-medium">
₱{{ (stats().subscriptions.basic * 299) | number }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Pro Subscriptions</span>
                        <span class="text-sm font-medium">
₱{{ (stats().subscriptions.pro * 999) | number }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Listing Boosts</span>
                        <span class="text-sm font-medium">
₱{{ (stats().boostedListings * 50) | number }}
                        </span>
                      </div>
                      <div class="border-t pt-2 mt-2">
                        <div class="flex items-center justify-between font-semibold">
                          <span class="text-sm text-gray-900">Total Monthly</span>
                          <span class="text-sm">
                            ₱{{ stats().monthlyRevenue | number }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
            </div>
          }
        </div>
      </div>

      <!-- Confirmation Modal -->
      @if (showConfirmModal()) {
        <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <!-- Backdrop -->
          <div 
            class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            (click)="closeModal()">
          </div>
          
          <!-- Modal -->
          <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <!-- Modal Header -->
              <div class="sm:flex sm:items-start">
                <div [class]="modalConfig().type === 'approve' || modalConfig().type === 'approve-all' 
                  ? 'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10'
                  : 'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'">
                  @if (modalConfig().type === 'approve' || modalConfig().type === 'approve-all') {
                    <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  } @else {
                    <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  }
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 class="text-base font-semibold leading-6 text-gray-900">
                    {{ modalConfig().title }}
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      {{ modalConfig().message }}
                    </p>
                    
                    <!-- Reason input for rejection -->
                    @if (modalConfig().showReasonInput) {
                      <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                          Reason for rejection (optional):
                        </label>
                        <textarea
                          [(ngModel)]="modalReason"
                          rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter reason for rejection..."></textarea>
                      </div>
                    }
                  </div>
                </div>
              </div>
              
              <!-- Modal Actions -->
              <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                <button 
                  type="button"
                  (click)="confirmModalAction()"
                  [class]="modalConfig().confirmColor + ' inline-flex w-full justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto transition-all duration-200'">
                  {{ modalConfig().confirmText }}
                </button>
                <button 
                  type="button"
                  (click)="closeModal()"
                  class="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all duration-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Success/Error Result Modal -->
      @if (showResultModal()) {
        <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <!-- Backdrop -->
          <div 
            class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            (click)="closeResultModal()">
          </div>
          
          <!-- Modal -->
          <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div class="relative transform overflow-hidden rounded-2xl bg-white px-6 pb-6 pt-8 text-center shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-8">
              <!-- Success/Error Icon -->
              <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6" [class]="resultModalConfig().iconColor">
                <div class="text-3xl" [innerHTML]="resultModalConfig().icon"></div>
              </div>
              
              <!-- Title and Message -->
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-900 mb-3">
                  {{ resultModalConfig().title }}
                </h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  {{ resultModalConfig().message }}
                </p>
              </div>
              
              <!-- Action Button -->
              <button 
                type="button"
                (click)="closeResultModal()"
                [class]="resultModalConfig().buttonColor + ' w-full inline-flex justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-200 transform hover:scale-105'">
                {{ resultModalConfig().buttonText }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private http = inject(HttpClient);
  private modalService = inject(ModalService);
  
  activeTab = signal<string>('pending');
  showMobileMenu = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  loadingMessage = signal<string>('Loading dashboard data...');

  // Filters
  listingFilter = 'all';
  listingSearch = '';
  userFilter = 'all';
  userSearch = '';

  // Dynamic tabs with computed badge counts
  tabs = computed(() => {
    const tabsArray = [
      { id: 'pending', label: 'Pending Approval', badge: this.pendingListings().length },
      { id: 'listings', label: 'All Listings', badge: null },
      { id: 'users', label: 'Users', badge: null },
      { id: 'inquiries', label: 'Inquiries', badge: this.allInquiries().length },
      { id: 'user-approval', label: 'User Approval', badge: this.pendingUsers().length },
      { id: 'verification', label: 'Verification', badge: this.pendingVerifications().length },
      { id: 'user-reports', label: 'User Reports', badge: this.pendingReports().length },
      { id: 'coins', label: 'Coin Management', badge: null },
      { id: 'reports', label: 'Analytics', badge: null }
    ];
    console.log('🏷️ Admin tabs computed:', tabsArray.map(t => `${t.label} (${t.badge || 'no badge'})`));
    return tabsArray;
  });

  // Real stats from API and computed data
  apiStats = signal<AdminStats>({
    totalUsers: 0,
    totalListings: 0,
    activeListings: 0,
    pendingApproval: 0,
    totalTransactions: 0,
    monthlyRevenue: 0,
    boostedListings: 0,
    subscriptions: { free: 0, basic: 0, pro: 0 }
  });

  stats = computed(() => ({
    ...this.apiStats(),
    totalListings: this.allProducts().length,
    activeListings: this.approvedListings().length,
    pendingApproval: this.pendingListings().length,
    boostedListings: this.allProducts().filter(p => p.isBoosted).length,
  }));

  // Real data from API
  allProducts = signal<AdminProduct[]>([]);

  // Real user data from API
  allUsers = signal<any[]>([]);

  // Verification management data
  pendingVerificationsData = signal<any[]>([]);
  verificationHistory = signal<any[]>([]);
  verificationStats = signal<any>({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalVerified: 0,
    totalRequests: 0
  });

  // Coin management data
  coinStats = signal<CoinStats>({
    summary: {
      totalUsers: 0,
      totalCoinsInCirculation: 0,
      totalTransactions: 0,
      totalEarned: 0,
      totalSpent: 0,
      totalPurchased: 0
    },
    recentTransactions: [],
    topUsers: [],
    dailyActivity: []
  });

  suspiciousActivities = signal<SuspiciousActivities>({
    highEarners: [],
    rapidSpenders: [],
    unusualPatterns: [],
    failedTransactions: []
  });

  selectedUser = signal<any>(null);
  userCoinDetails = signal<UserCoinDetails | null>(null);
  
  // New coin balance report data
  coinBalancesData = signal<any>({
    users: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalUsers: 0,
      hasNext: false,
      hasPrev: false
    },
    summary: {
      totalBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      averageBalance: 0,
      maxBalance: 0,
      minBalance: 0,
      userCount: 0
    }
  });
  
  // All users list for dropdown functionality
  allUsersForDropdown = signal<any[]>([]);
  selectedAwardUser = signal<any>(null);
  selectedDeductUser = signal<any>(null);
  
  // Filter and search for coin balances
  coinBalanceFilters = signal({
    page: 1,
    limit: 20,
    sortBy: 'balance',
    sortOrder: 'desc',
    role: '',
    search: ''
  });

  // User approval management data
  pendingUsersData = signal<any[]>([]);
  userApprovalStats = signal<any>({
    pendingUsers: 0,
    activeUsers: 0,
    totalUsers: 0,
    approvalRate: 0
  });

  // User reports management data
  allReportsData = signal<any[]>([]);
  reportStats = signal<any>({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    urgentReports: 0
  });
  selectedReport = signal<any | null>(null);
  // User activity analytics data
  userActivityStats = signal<UserActivityStats>({
    overview: {
      totalPageViews: 0,
      uniqueVisitors: 0,
      totalSessions: 0,
      avgSessionDuration: 0
    },
    trends: [],
    devices: {
      desktop: 0,
      mobile: 0,
      tablet: 0
    },
    popularProducts: [],
    searchStats: [],
    recentActivity: []
  });
  // User visits data
  userVisitsData = signal<UserVisitsData>({
    users: [],
    summary: {
      totalRegisteredVisitors: 0,
      totalAnonymousVisitors: 0,
      totalVisitors: 0,
      dateRange: {
        start: '',
        end: ''
      }
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false,
      limit: 50
    }
  });
  userVisitsFilters = signal<any>({
    startDate: '',
    endDate: '',
    sortBy: 'lastVisit',
    page: 1,
    limit: 50
  });

  // Anonymous visitors data
  anonymousVisitsData = signal<AnonymousVisitsData>({
    visitors: [],
    summary: {
      totalPageViews: 0,
      uniqueVisitors: 0,
      totalSessions: 0,
      uniqueIPs: 0,
      deviceBreakdown: [],
      browserBreakdown: [],
      dateRange: {
        start: '',
        end: ''
      }
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false,
      limit: 50
    }
  });
  anonymousVisitsFilters = signal<any>({
    startDate: '',
    endDate: '',
    sortBy: 'lastVisit',
    page: 1,
    limit: 50
  });
  reportFilters = signal<any>({
    status: 'all',
    type: 'all',
    priority: 'all'
  });

  // Inquiry management data
  allInquiries = signal<any[]>([]);

  // Modal state
  showConfirmModal = signal<boolean>(false);
  modalConfig = signal<{
    type: 'approve' | 'reject' | 'approve-all';
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    userId?: string;
    userName?: string;
    pendingCount?: number;
    showReasonInput?: boolean;
  }>({
    type: 'approve',
    title: '',
    message: '',
    confirmText: '',
    confirmColor: ''
  });
  modalReason = signal<string>('');

  // Success/Error modal state
  showResultModal = signal<boolean>(false);
  resultModalConfig = signal<{
    type: 'success' | 'error';
    title: string;
    message: string;
    icon: string;
    iconColor: string;
    buttonText: string;
    buttonColor: string;
  }>({
    type: 'success',
    title: '',
    message: '',
    icon: '',
    iconColor: '',
    buttonText: '',
    buttonColor: ''
  });
  
  // Coin action forms
  awardForm = {
    userId: '',
    amount: 0,
    reason: 'admin_award',
    description: ''
  };

  deductForm = {
    userId: '',
    amount: 0,
    reason: 'admin_deduct',
    description: ''
  };

  // Computed properties using real data
  pendingListings = computed(() => 
    this.allProducts().filter(p => p.isApproved === 'pending')
  );

  approvedListings = computed(() => 
    this.allProducts().filter(p => p.isApproved === 'approved')
  );

  pendingVerifications = computed(() => this.pendingVerificationsData());

  pendingUsers = computed(() => this.pendingUsersData());

  pendingReports = computed(() => this.allReportsData().filter(r => r.status === 'pending' || r.status === 'under_review'));

  filteredReports = computed(() => {
    let reports = [...this.allReportsData()];
    const filters = this.reportFilters();

    if (filters.status !== 'all') {
      reports = reports.filter(r => r.status === filters.status);
    }

    if (filters.type !== 'all') {
      reports = reports.filter(r => r.type === filters.type);
    }

    if (filters.priority !== 'all') {
      reports = reports.filter(r => r.priority === filters.priority);
    }

    return reports.sort((a: any, b: any) => {
      // Sort by priority first (urgent > high > medium > low)
      const priorityOrder: { [key: string]: number } = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  filteredListings = computed(() => {
    let products = [...this.allProducts()];
    
    if (this.listingFilter !== 'all') {
      if (this.listingFilter === 'active') {
        products = products.filter(p => p.isApproved === 'approved' && p.availability === 'available');
      } else {
        products = products.filter(p => p.isApproved === this.listingFilter);
      }
    }
    
    if (this.listingSearch) {
      const search = this.listingSearch.toLowerCase();
      products = products.filter(p => 
        p.title.toLowerCase().includes(search) ||
        (p.seller?.firstName?.toLowerCase().includes(search)) ||
        (p.seller?.lastName?.toLowerCase().includes(search))
      );
    }
    
    return products;
  });

  filteredUsers = computed(() => {
    let users = [...this.allUsers()];
    
    if (this.userFilter !== 'all') {
      users = users.filter(u => u.subscription?.plan === this.userFilter);
    }
    
    if (this.userSearch) {
      const search = this.userSearch.toLowerCase();
      users = users.filter(u => 
        (u.firstName?.toLowerCase().includes(search)) ||
        (u.lastName?.toLowerCase().includes(search)) ||
        (u.email?.toLowerCase().includes(search))
      );
    }
    
    return users;
  });

  // Helper methods
  getStatusColor(status: string): string {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full',
      'approved': 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full',
      'active': 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full',
      'rejected': 'bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full',
      'sold': 'bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  }

  getSubscriptionColor(subscription: string): string {
    const colors = {
      'free': 'bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full',
      'basic': 'bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full',
      'pro': 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full'
    };
    return colors[subscription as keyof typeof colors] || colors.free;
  }

  getUserStatusColor(status: string): string {
    const colors = {
      'active': 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full',
      'suspended': 'bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full',
      'banned': 'bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full'
    };
    return colors[status as keyof typeof colors] || colors.active;
  }

  getFreePercentage(): number {
    const total = this.stats().subscriptions.free + this.stats().subscriptions.basic + this.stats().subscriptions.pro;
    return (this.stats().subscriptions.free / total) * 100;
  }

  getBasicPercentage(): number {
    const total = this.stats().subscriptions.free + this.stats().subscriptions.basic + this.stats().subscriptions.pro;
    return (this.stats().subscriptions.basic / total) * 100;
  }

  getProPercentage(): number {
    const total = this.stats().subscriptions.free + this.stats().subscriptions.basic + this.stats().subscriptions.pro;
    return (this.stats().subscriptions.pro / total) * 100;
  }

  // Lifecycle
  ngOnInit(): void {
    this.loadAdminData();
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(show => !show);
  }

  setActiveTab(tabId: string): void {
    console.log('🎯 Setting active tab to:', tabId);
    this.activeTab.set(tabId);
    // Close mobile menu when tab is selected
    this.showMobileMenu.set(false);
    
    if (tabId === 'inquiries') {
      console.log('💬 Inquiries tab selected, current inquiries:', this.allInquiries().length);
    }
  }

  // Data loading methods
  private async loadAdminData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // Load data in sequence with loading messages
      this.loadingMessage.set('Loading products...');
      await this.loadAllProducts();

      this.loadingMessage.set('Loading users...');
      await this.loadAllUsers();

      this.loadingMessage.set('Loading statistics...');
      await this.loadAdminStats();

      this.loadingMessage.set('Loading coin data...');
      await this.loadCoinStats();
      this.loadingMessage.set('Loading coin balances...');
      await this.loadCoinBalances();
      this.loadingMessage.set('Loading users for dropdown...');
      await this.loadUsersForDropdown();
      this.loadingMessage.set('Loading user activity analytics...');
      await this.loadUserActivityStats();
      this.loadingMessage.set('Loading user visits data...');
      await this.loadUserVisitsData();
      this.loadingMessage.set('Loading anonymous visitors data...');
      await this.loadAnonymousVisitsData();

      this.loadingMessage.set('Loading verifications...');
      await this.loadVerificationData();

      this.loadingMessage.set('Loading approvals...');
      await this.loadUserApprovalData();

      this.loadingMessage.set('Loading inquiries...');
      await this.loadAllInquiries();

      this.loadingMessage.set('Loading reports...');
      await this.loadReports();

      // Add a small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error('Error loading admin data:', error);
      this.loadingMessage.set('Error loading data...');
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadAllProducts(): Promise<void> {
    console.log('🔍 Loading admin products...');
    return new Promise((resolve) => {
      this.adminService.getAllProducts({ limit: 100 }).subscribe({
        next: (response) => {
          console.log('✅ Admin products loaded:', response);
          this.allProducts.set(response.products);
          resolve();
        },
        error: (error) => {
          console.error('❌ Failed to load admin products:', error);
          console.log('📝 Response status:', error.status);
          console.log('📝 Response message:', error.error);
          // Fallback to pending products only
          this.loadPendingProducts();
          resolve(); // Still resolve to continue loading other data
        }
      });
    });
  }

  private loadPendingProducts(): void {
    console.log('🔄 Fallback: Loading pending products only...');
    this.adminService.getPendingProducts().subscribe({
      next: (products) => {
        console.log('✅ Pending products loaded:', products);
        this.allProducts.set(products);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load pending products:', error);
        console.log('📝 Response status:', error.status);
        console.log('📝 Response message:', error.error);
        this.isLoading.set(false);
      }
    });
  }

  private loadAllUsers(): void {
    console.log('👥 Loading all users...');
    this.adminService.getAllUsers({ limit: 100 }).subscribe({
      next: (response) => {
        console.log('✅ All users loaded:', response);
        this.allUsers.set(response.users || response);
      },
      error: (error) => {
        console.error('❌ Failed to load all users:', error);
        this.allUsers.set([]);
      }
    });
  }

  private loadAdminStats(): void {
    this.adminService.getAdminStats().subscribe({
      next: (stats) => {
        this.apiStats.set(stats);
      },
      error: (error) => {
        console.error('Failed to load admin stats:', error);
      }
    });
  }

  // Actions
  approveListing(productId: string): void {
    this.adminService.approveProduct(productId).subscribe({
      next: (response) => {
        // Update the product in the local array
        const products = this.allProducts();
        const index = products.findIndex(p => p._id === productId);
        if (index >= 0) {
          products[index] = { ...products[index], isApproved: 'approved' };
          this.allProducts.set([...products]);
        }
        this.modalService.success('Product Approved', 'The product has been approved and is now live on the marketplace!');
      },
      error: (error) => {
        console.error('Failed to approve product:', error);
        this.modalService.error('Approval Failed', 'Unable to approve the product. Please try again later.');
      }
    });
  }

  rejectListing(productId: string): void {
    this.adminService.rejectProduct(productId).subscribe({
      next: (response) => {
        // Update the product in the local array
        const products = this.allProducts();
        const index = products.findIndex(p => p._id === productId);
        if (index >= 0) {
          products[index] = { ...products[index], isApproved: 'rejected' };
          this.allProducts.set([...products]);
        }
        this.modalService.success('Product Rejected', 'The product has been rejected and the seller has been notified.');
      },
      error: (error) => {
        console.error('Failed to reject product:', error);
        this.modalService.error('Rejection Failed', 'Unable to reject the product. Please try again later.');
      }
    });
  }

  approveAll(): void {
    const pendingProducts = this.pendingListings();
    const approvalPromises = pendingProducts.map(product => 
      this.adminService.approveProduct(product._id).toPromise()
    );

    Promise.all(approvalPromises).then(() => {
      // Reload all products to get updated data
      this.loadAllProducts();
      this.modalService.success('Bulk Approval Complete', 'All pending products have been approved successfully!');
    }).catch((error) => {
      console.error('Failed to approve all products:', error);
      this.modalService.error('Bulk Approval Failed', 'Some products could not be approved. Please try again or approve them individually.');
    });
  }

  // Coin Management Methods

  private loadCoinStats(): void {
    this.adminService.getCoinStats().subscribe({
      next: (stats) => {
        this.coinStats.set(stats);
        console.log('✅ Coin stats loaded:', stats);
      },
      error: (error) => {
        console.error('❌ Failed to load coin stats:', error);
      }
    });
  }

  private loadCoinBalances(): void {
    const filters = this.coinBalanceFilters();
    this.adminService.getCoinBalances(filters).subscribe({
      next: (data) => {
        this.coinBalancesData.set(data);
        console.log('✅ Coin balances loaded:', data);
      },
      error: (error) => {
        console.error('❌ Failed to load coin balances:', error);
      }
    });
  }

  private loadUsersForDropdown(): void {
    this.adminService.getAllUsers({ limit: 1000 }).subscribe({
      next: (response) => {
        const users = response.users.map((user: any) => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          coins: user.coins || { balance: 0 }
        }));
        this.allUsersForDropdown.set(users);
        console.log('✅ Users for dropdown loaded:', users.length, 'users');
      },
      error: (error) => {
        console.error('❌ Failed to load users for dropdown:', error);
      }
    });
  }

  // Coin Balance Report Management Methods
  
  updateCoinBalanceFilters(updates: Partial<{
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
    role: string;
    search: string;
  }>): void {
    this.coinBalanceFilters.update(current => ({ ...current, ...updates }));
    this.loadCoinBalances();
  }

  sortCoinBalances(sortBy: string): void {
    const current = this.coinBalanceFilters();
    const newOrder = current.sortBy === sortBy && current.sortOrder === 'desc' ? 'asc' : 'desc';
    this.updateCoinBalanceFilters({ sortBy, sortOrder: newOrder });
  }

  filterCoinBalancesByRole(role: string): void {
    this.updateCoinBalanceFilters({ role, page: 1 });
  }

  searchCoinBalances(search: string): void {
    this.updateCoinBalanceFilters({ search, page: 1 });
  }

  goToCoinBalancePage(page: number): void {
    this.updateCoinBalanceFilters({ page });
  }

  nextCoinBalancePage(): void {
    const data = this.coinBalancesData();
    if (data.pagination.hasNext) {
      this.goToCoinBalancePage(data.pagination.currentPage + 1);
    }
  }

  prevCoinBalancePage(): void {
    const data = this.coinBalancesData();
    if (data.pagination.hasPrev) {
      this.goToCoinBalancePage(data.pagination.currentPage - 1);
    }
  }

  awardCoins(): void {
    const selectedUser = this.selectedAwardUser();
    if (!selectedUser || !this.awardForm.amount || !this.awardForm.description) {
      this.modalService.warning('Missing Information', 'Please select a user and fill in all required fields before awarding coins.');
      return;
    }

    this.adminService.awardCoins(
      selectedUser.id,
      this.awardForm.amount,
      this.awardForm.reason,
      this.awardForm.description
    ).subscribe({
      next: (response) => {
        this.modalService.success('Coins Awarded', `Successfully awarded ${this.awardForm.amount} coins to ${selectedUser.name}!`);
        this.resetAwardForm();
        this.loadCoinStats(); // Refresh stats
        this.loadCoinBalances(); // Refresh coin balances
      },
      error: (error) => {
        console.error('Failed to award coins:', error);
        this.modalService.error('Award Failed', `Failed to award coins: ${error.error?.error || 'Unknown error'}`);
      }
    });
  }

  deductCoins(): void {
    const selectedUser = this.selectedDeductUser();
    if (!selectedUser || !this.deductForm.amount || !this.deductForm.description) {
      this.modalService.warning('Missing Information', 'Please select a user and fill in all required fields before deducting coins.');
      return;
    }

    this.adminService.deductCoins(
      selectedUser.id,
      this.deductForm.amount,
      this.deductForm.reason,
      this.deductForm.description
    ).subscribe({
      next: (response) => {
        this.modalService.success('Coins Deducted', `Successfully deducted ${this.deductForm.amount} coins from ${selectedUser.name}!`);
        this.resetDeductForm();
        this.loadCoinStats(); // Refresh stats
        this.loadCoinBalances(); // Refresh coin balances
      },
      error: (error) => {
        console.error('Failed to deduct coins:', error);
        this.modalService.error('Deduction Failed', `Failed to deduct coins: ${error.error?.error || 'Unknown error'}`);
      }
    });
  }

  getTransactionTypeColor(type: string): string {
    const colors = {
      'earn': 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full',
      'spend': 'bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full',
      'purchase': 'bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full',
      'refund': 'bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full'
    };
    return colors[type as keyof typeof colors] || colors.earn;
  }

  private resetAwardForm(): void {
    this.awardForm = {
      userId: '',
      amount: 0,
      reason: 'admin_award',
      description: ''
    };
    this.selectedAwardUser.set(null);
  }

  private resetDeductForm(): void {
    this.deductForm = {
      userId: '',
      amount: 0,
      reason: 'admin_deduct',
      description: ''
    };
    this.selectedDeductUser.set(null);
  }

  // Verification Management Methods
  
  private loadVerificationData(): void {
    this.loadPendingVerifications();
    this.loadVerificationHistory();
    this.loadVerificationStats();
  }

  private loadPendingVerifications(): void {
    // This would call the verification API endpoint
    // For now, we'll use mock data
    // Replace with actual HTTP call when verification service is implemented
    console.log('📋 Loading pending verifications...');
    // Example: this.http.get<any>('/api/verification/pending').subscribe(...)
  }

  private loadVerificationHistory(): void {
    console.log('📜 Loading verification history...');
    // Example: this.http.get<any>('/api/verification/history').subscribe(...)
  }

  private loadVerificationStats(): void {
    console.log('📊 Loading verification stats...');
    // Example: this.http.get<any>('/api/verification/stats').subscribe(...)
  }

  approveVerification(userId: string): void {
    const notes = prompt('Add notes for this verification (optional):');
    
    // This would call the verification API endpoint
    console.log(`✅ Approving verification for user ${userId}`);
    // Example: this.http.post(`/api/verification/approve/${userId}`, { notes }).subscribe(...)
    
    // Mock success for now
    this.modalService.success('Verification Approved', 'User verification has been approved successfully!');
    this.loadVerificationData(); // Refresh data
  }

  rejectVerification(userId: string): void {
    const reason = prompt('Please provide a reason for rejection (required):');
    if (!reason || reason.trim() === '') {
      this.modalService.warning('Rejection Reason Required', 'Please provide a reason for rejecting the verification.');
      return;
    }
    
    const notes = prompt('Add additional notes (optional):');
    
    console.log(`❌ Rejecting verification for user ${userId}, reason: ${reason}`);
    // Example: this.http.post(`/api/verification/reject/${userId}`, { reason, notes }).subscribe(...)
    
    // Mock success for now
    this.modalService.success('Verification Rejected', 'User verification has been rejected and the user has been notified.');
    this.loadVerificationData(); // Refresh data
  }

  getVerificationStatusColor(status: string): string {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full',
      'approved': 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full',
      'rejected': 'bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full',
      'none': 'bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  }

  // User Approval Management Methods

  private loadUserApprovalData(): void {
    this.loadPendingUsers();
    this.loadUserApprovalStats();
  }

  private loadPendingUsers(): void {
    console.log('👥 Loading pending user accounts...');
    
    this.adminService.getPendingUsers({ limit: 50 }).subscribe({
      next: (response) => {
        console.log('✅ Pending users loaded:', response);
        this.pendingUsersData.set(response.users);
      },
      error: (error) => {
        console.error('❌ Failed to load pending users:', error);
        // Fallback to empty array if API fails
        this.pendingUsersData.set([]);
      }
    });
  }

  private loadUserApprovalStats(): void {
    console.log('📊 Loading user approval stats...');
    
    this.adminService.getUserApprovalStats().subscribe({
      next: (stats) => {
        console.log('✅ User approval stats loaded:', stats);
        this.userApprovalStats.set(stats);
      },
      error: (error) => {
        console.error('❌ Failed to load user approval stats:', error);
        // Fallback to default values
        this.userApprovalStats.set({
          pendingUsers: 0,
          activeUsers: 0,
          totalUsers: 0,
          approvalRate: 0
        });
      }
    });
  }

  approveUser(userId: string, userName: string = 'this user'): void {
    this.showApproveModal(userId, userName);
  }

  suspendUser(userId: string, userName: string = 'this user'): void {
    this.showRejectModal(userId, userName);
  }

  approveAllUsers(): void {
    const pendingUsersCount = this.pendingUsers().length;
    if (pendingUsersCount === 0) {
      this.showSuccessMessage('No pending users to approve.');
      return;
    }

    this.showApproveAllModal(pendingUsersCount);
  }

  // Modal methods
  
  showApproveModal(userId: string, userName: string): void {
    this.modalConfig.set({
      type: 'approve',
      title: 'Approve User Account',
      message: `Are you sure you want to approve ${userName}'s account? This will activate their account and allow them to use the platform.`,
      confirmText: 'Approve Account',
      confirmColor: 'bg-green-600 focus-visible:outline-green-600',
      userId,
      userName
    });
    this.modalReason.set('');
    this.showConfirmModal.set(true);
  }

  showRejectModal(userId: string, userName: string): void {
    this.modalConfig.set({
      type: 'reject',
      title: 'Reject User Account',
      message: `Are you sure you want to reject ${userName}'s account? This will prevent them from accessing the platform.`,
      confirmText: 'Reject Account',
      confirmColor: 'bg-red-600 focus-visible:outline-red-600',
      userId,
      userName,
      showReasonInput: true
    });
    this.modalReason.set('');
    this.showConfirmModal.set(true);
  }

  showApproveAllModal(pendingCount: number): void {
    this.modalConfig.set({
      type: 'approve-all',
      title: 'Approve All Users',
      message: `Are you sure you want to approve all ${pendingCount} pending user accounts? This will activate all their accounts simultaneously.`,
      confirmText: 'Approve All',
      confirmColor: 'bg-green-600 focus-visible:outline-green-600',
      pendingCount
    });
    this.modalReason.set('');
    this.showConfirmModal.set(true);
  }

  closeModal(): void {
    this.showConfirmModal.set(false);
    this.modalReason.set('');
  }

  confirmModalAction(): void {
    const config = this.modalConfig();
    
    switch (config.type) {
      case 'approve':
        if (config.userId) {
          this.executeApproveUser(config.userId);
        }
        break;
      case 'reject':
        if (config.userId) {
          this.executeRejectUser(config.userId, this.modalReason());
        }
        break;
      case 'approve-all':
        this.executeApproveAllUsers();
        break;
    }
    
    this.closeModal();
  }

  // Success/Error modal methods
  showSuccessMessage(message: string): void {
    console.log('✅ Success:', message);
    this.resultModalConfig.set({
      type: 'success',
      title: 'Success!',
      message: message,
      icon: '✅',
      iconColor: 'bg-green-100',
      buttonText: 'Continue',
      buttonColor: 'bg-green-600 focus-visible:outline-green-600'
    });
    this.showResultModal.set(true);
  }

  showErrorMessage(message: string): void {
    console.log('❌ Error:', message);
    this.resultModalConfig.set({
      type: 'error',
      title: 'Error',
      message: message,
      icon: '❌',
      iconColor: 'bg-red-100',
      buttonText: 'Try Again',
      buttonColor: 'bg-red-600 focus-visible:outline-red-600'
    });
    this.showResultModal.set(true);
  }

  closeResultModal(): void {
    this.showResultModal.set(false);
  }

  // Execution methods (separated from modal logic)
  
  private executeApproveUser(userId: string): void {
    console.log(`✅ Approving user account ${userId}`);
    
    this.adminService.approveUser(userId).subscribe({
      next: (response) => {
        console.log('User approved successfully:', response);
        
        // Remove user from pending list
        const users = this.pendingUsersData();
        const updatedUsers = users.filter(u => u._id !== userId);
        this.pendingUsersData.set(updatedUsers);
        
        // Update stats
        const stats = this.userApprovalStats();
        this.userApprovalStats.set({
          ...stats,
          pendingUsers: Math.max(0, stats.pendingUsers - 1),
          activeUsers: stats.activeUsers + 1
        });
        
        this.showSuccessMessage('User account approved successfully!');
      },
      error: (error) => {
        console.error('Failed to approve user:', error);
        this.showErrorMessage(`Failed to approve user: ${error.error?.error || 'Unknown error'}`);
      }
    });
  }

  private executeRejectUser(userId: string, reason: string): void {
    console.log(`❌ Rejecting user account ${userId}`);
    
    this.adminService.rejectUser(userId, reason).subscribe({
      next: (response) => {
        console.log('User rejected successfully:', response);
        
        // Remove user from pending list
        const users = this.pendingUsersData();
        const updatedUsers = users.filter(u => u._id !== userId);
        this.pendingUsersData.set(updatedUsers);
        
        // Update stats
        const stats = this.userApprovalStats();
        this.userApprovalStats.set({
          ...stats,
          pendingUsers: Math.max(0, stats.pendingUsers - 1)
        });
        
        this.showSuccessMessage('User account rejected successfully.');
      },
      error: (error) => {
        console.error('Failed to reject user:', error);
        this.showErrorMessage(`Failed to reject user: ${error.error?.error || 'Unknown error'}`);
      }
    });
  }

  private executeApproveAllUsers(): void {
    console.log('✅ Approving all pending user accounts');
    
    this.adminService.approveAllUsers().subscribe({
      next: (response) => {
        console.log('All users approved successfully:', response);
        
        // Clear pending users list
        this.pendingUsersData.set([]);
        
        // Update stats
        const stats = this.userApprovalStats();
        this.userApprovalStats.set({
          ...stats,
          pendingUsers: 0,
          activeUsers: stats.activeUsers + response.approvedCount
        });
        
        this.showSuccessMessage(response.message);
      },
      error: (error) => {
        console.error('Failed to approve all users:', error);
        this.showErrorMessage(`Failed to approve all users: ${error.error?.error || 'Unknown error'}`);
      }
    });
  }

  // Inquiry Management Methods
  
  private loadAllInquiries(): void {
    console.log('💬 Loading all user inquiries...');
    
    try {
      const allInquiries: any[] = [];
      
      // Iterate through all localStorage keys to find user-specific inquiry keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tennis_buyer_inquiries_')) {
          const userInquiries = localStorage.getItem(key);
          if (userInquiries) {
            try {
              const inquiries = JSON.parse(userInquiries);
              if (Array.isArray(inquiries)) {
                // Add user ID to each inquiry for admin tracking
                const inquiriesWithUserId = inquiries.map(inquiry => ({
                  ...inquiry,
                  storageKey: key,
                  userId: key.replace('tennis_buyer_inquiries_', '')
                }));
                allInquiries.push(...inquiriesWithUserId);
              }
            } catch (e) {
              console.error('Error parsing inquiries for key:', key, e);
            }
          }
        }
      }
      
      // Sort by timestamp (newest first)
      allInquiries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      this.allInquiries.set(allInquiries);
      console.log('✅ Loaded', allInquiries.length, 'total inquiries from all users');
      
    } catch (error) {
      console.error('❌ Error loading all inquiries:', error);
      this.allInquiries.set([]);
    }
  }

  viewInquiryDetails(inquiry: any): void {
    // Show detailed modal with full inquiry information
    const details = `
      <div class="space-y-4 text-left">
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">Product Information</h4>
          <p><strong>Title:</strong> ${inquiry.productTitle}</p>
          <p><strong>Product ID:</strong> ${inquiry.productId}</p>
          <p><strong>Seller:</strong> ${inquiry.sellerName}</p>
        </div>
        
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">Buyer Information</h4>
          <p><strong>Buyer Name:</strong> ${this.getUserNameById(inquiry.userId)}</p>
          <p><strong>User ID:</strong> ${inquiry.userId}</p>
          <p><strong>Contact Method:</strong> ${inquiry.contactMethod}</p>
          <p><strong>Inquiry Date:</strong> ${new Date(inquiry.timestamp).toLocaleString()}</p>
        </div>
        
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">Message</h4>
          <div class="bg-gray-50 p-3 rounded border">
            ${inquiry.message}
          </div>
        </div>
      </div>
    `;
    
    this.modalService.info('Inquiry Details', details);
  }

  markInquiryResolved(inquiry: any): void {
    try {
      // Update the inquiry status to resolved
      const updatedInquiry = { ...inquiry, status: 'resolved' };
      
      // Update in the specific user's localStorage
      const userInquiries = JSON.parse(localStorage.getItem(inquiry.storageKey) || '[]');
      const inquiryIndex = userInquiries.findIndex((inq: any) => 
        inq.timestamp === inquiry.timestamp && inq.productId === inquiry.productId
      );
      
      if (inquiryIndex !== -1) {
        userInquiries[inquiryIndex] = updatedInquiry;
        localStorage.setItem(inquiry.storageKey, JSON.stringify(userInquiries));
        
        // Reload all inquiries to reflect the change
        this.loadAllInquiries();
        
        this.modalService.success('Inquiry Updated', 'Inquiry has been marked as resolved.');
      } else {
        console.error('Could not find inquiry to update');
        this.modalService.error('Update Failed', 'Could not find the inquiry to update.');
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
      this.modalService.error('Update Failed', 'An error occurred while updating the inquiry.');
    }
  }

  getUserNameById(userId: string): string {
    const user = this.allUsers().find(u => u._id === userId);
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    // Fallback to partial user ID if user not found
    return `User ID ${userId.substring(0, 8)}...`;
  }

  // Report management methods
  async loadReports(): Promise<void> {
    try {
      const token = localStorage.getItem('tennis-marketplace-token');
      if (!token) return;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // Load all reports
      const reportsResponse = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/reports`, { headers })
      );

      this.allReportsData.set(reportsResponse.reports || []);

      // Update report stats
      const stats = {
        totalReports: reportsResponse.reports?.length || 0,
        pendingReports: reportsResponse.reports?.filter((r: any) => r.status === 'pending' || r.status === 'under_review')?.length || 0,
        resolvedReports: reportsResponse.reports?.filter((r: any) => r.status === 'resolved')?.length || 0,
        urgentReports: reportsResponse.reports?.filter((r: any) => r.priority === 'urgent')?.length || 0
      };

      this.reportStats.set(stats);

      console.log('📊 Loaded reports:', stats);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }

  async loadUserActivityStats(): Promise<void> {
    try {
      const token = localStorage.getItem('tennis-marketplace-token');
      if (!token) return;
      
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // Fetch analytics stats and real-time data
      const [statsResponse, realtimeResponse] = await Promise.all([
        firstValueFrom(this.http.get<any>(`${environment.apiUrl}/analytics/stats?excludeAdmin=true`, { headers })),
        firstValueFrom(this.http.get<any>(`${environment.apiUrl}/analytics/realtime?excludeAdmin=true`, { headers }))
      ]);

      if (statsResponse.success && realtimeResponse.success) {
        const stats = statsResponse.data;
        const realtime = realtimeResponse.data;

        this.userActivityStats.set({
          overview: {
            totalPageViews: stats.overview.totalPageViews || 0,
            uniqueVisitors: stats.overview.uniqueVisitors || 0,
            totalSessions: stats.overview.totalSessions || 0,
            avgSessionDuration: stats.overview.avgSessionDuration || 0
          },
          trends: stats.trends || [],
          devices: {
            desktop: stats.devices.desktop || 0,
            mobile: stats.devices.mobile || 0,
            tablet: stats.devices.tablet || 0
          },
          popularProducts: stats.popularProducts || [],
          searchStats: stats.searchStats || [],
          recentActivity: realtime.recentActivity || []
        });

        console.log('📈 Loaded user activity stats:', this.userActivityStats());
      }
    } catch (error) {
      console.error('Error loading user activity stats:', error);
    }
  }

  async loadUserVisitsData(): Promise<void> {
    try {
      const token = localStorage.getItem('tennis-marketplace-token');
      if (!token) {
        console.warn('No authentication token found for user visits data');
        return;
      }
      
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const filters = this.userVisitsFilters();
      const params = new URLSearchParams({
        excludeAdmin: 'true',
        sortBy: filters.sortBy,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      console.log('🔗 Making request to:', `http://localhost:5000/api/analytics/user-visits?${params.toString()}`);
      console.log('🎫 Using token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      const response = await firstValueFrom(
        this.http.get<any>(`http://localhost:5000/api/analytics/user-visits?${params.toString()}`, { headers })
      );

      console.log('📥 Raw response:', response);
      
      if (response.success) {
        this.userVisitsData.set(response.data);
        console.log('👥 Loaded user visits data:', response.data.summary);
        console.log('👥 Number of users found:', response.data.users.length);
      } else {
        console.warn('❌ Response not successful:', response);
      }
    } catch (error: any) {
      console.error('❌ Error loading user visits data:', error);
      if (error?.status === 401) {
        console.error('🔐 Authentication failed - check if admin is logged in');
      } else if (error?.status === 0) {
        console.error('🔗 Network error - check if backend is running');
      }
    }
  }

  async loadAnonymousVisitsData(): Promise<void> {
    try {
      const token = localStorage.getItem('tennis-marketplace-token');
      if (!token) {
        console.warn('No authentication token found for anonymous visits data');
        return;
      }
      
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const filters = this.anonymousVisitsFilters();
      const params = new URLSearchParams({
        sortBy: filters.sortBy,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      console.log('🔗 Making request to:', `http://localhost:5000/api/analytics/anonymous-visits?${params.toString()}`);
      console.log('🎫 Using token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      const response = await firstValueFrom(
        this.http.get<any>(`http://localhost:5000/api/analytics/anonymous-visits?${params.toString()}`, { headers })
      );

      console.log('📥 Raw anonymous response:', response);
      
      if (response.success) {
        this.anonymousVisitsData.set(response.data);
        console.log('👻 Loaded anonymous visits data:', response.data.summary);
        console.log('👻 Number of anonymous visitors found:', response.data.visitors.length);
        console.log('👻 First few visitors:', response.data.visitors.slice(0, 3));
        console.log('👻 Data structure check:', {
          hasVisitors: Array.isArray(response.data.visitors),
          visitorsLength: response.data.visitors.length,
          firstVisitor: response.data.visitors[0]
        });
      } else {
        console.warn('❌ Anonymous response not successful:', response);
      }
    } catch (error: any) {
      console.error('❌ Error loading anonymous visits data:', error);
      if (error?.status === 401) {
        console.error('🔐 Authentication failed - check if admin is logged in');
      } else if (error?.status === 0) {
        console.error('🔗 Network error - check if backend is running');
      }
    }
  }

  refreshReports(): void {
    this.loadReports();
  }

  // User visits management methods
  updateUserVisitsFilters(field: string, value: any): void {
    const currentFilters = this.userVisitsFilters();
    currentFilters[field] = value;
    if (field !== 'page') {
      currentFilters.page = 1; // Reset to first page when filter changes
    }
    this.userVisitsFilters.set({ ...currentFilters });
    this.loadUserVisitsData();
  }

  changeUserVisitsPage(page: number): void {
    if (page < 1 || page > this.userVisitsData().pagination.totalPages) {
      return;
    }
    this.updateUserVisitsFilters('page', page);
  }

  // Anonymous visits management methods
  updateAnonymousVisitsFilters(field: string, value: any): void {
    const currentFilters = this.anonymousVisitsFilters();
    currentFilters[field] = value;
    if (field !== 'page') {
      currentFilters.page = 1; // Reset to first page when filter changes
    }
    this.anonymousVisitsFilters.set({ ...currentFilters });
    this.loadAnonymousVisitsData();
  }

  changeAnonymousVisitsPage(page: number): void {
    if (page < 1 || page > this.anonymousVisitsData().pagination.totalPages) {
      return;
    }
    this.updateAnonymousVisitsFilters('page', page);
  }

  getRoleClass(role: string): string {
    const classes = {
      'admin': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
      'seller': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
      'buyer': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
    };
    return classes[role as keyof typeof classes] || classes['buyer'];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getUserInitials(username: string): string {
    if (!username) return '??';
    return username.split(' ')
      .map(name => name && name.length > 0 ? name[0] : '')
      .filter(initial => initial)
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  updateReportFilters(filterType: string, value: string): void {
    const currentFilters = this.reportFilters();
    this.reportFilters.set({
      ...currentFilters,
      [filterType]: value
    });
  }

  getReportTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      fraud: 'Fraud',
      harassment: 'Harassment',
      fake_products: 'Fake Products',
      inappropriate_behavior: 'Inappropriate Behavior',
      spam: 'Spam',
      scam: 'Scam',
      fake_listing: 'Fake Listing',
      no_show: 'No Show',
      payment_issues: 'Payment Issues',
      other: 'Other'
    };
    return typeLabels[type] || type;
  }

  getReportPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      low: 'text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full',
      medium: 'text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full',
      high: 'text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full',
      urgent: 'text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full'
    };
    return classes[priority] || classes['medium'];
  }

  getReportPriorityIcon(priority: string): string {
    const icons: { [key: string]: string } = {
      low: '⬇️',
      medium: '➡️',
      high: '⬆️',
      urgent: '🚨'
    };
    return icons[priority] || '➡️';
  }

  getReportStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full',
      under_review: 'text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full',
      resolved: 'text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full',
      dismissed: 'text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full',
      escalated: 'text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full'
    };
    return classes[status] || classes['pending'];
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }

  viewReportDetails(report: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.selectedReport.set(report);

    // Here you could open a detailed report modal
    // For now, we'll just show a basic alert with report info
    const reportInfo = `
Report Details:
- Type: ${this.getReportTypeLabel(report.type)}
- Status: ${report.status}
- Priority: ${report.priority}
- Reason: ${report.reason}
- Description: ${report.description}
- Reporter: ${report.reporter.firstName} ${report.reporter.lastName}
- Reported User: ${report.reportedUser.firstName} ${report.reportedUser.lastName}
- Created: ${new Date(report.createdAt).toLocaleString()}
    `;

    alert(reportInfo);
  }

  async quickResolveReport(report: any, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    const reason = prompt('Enter resolution reason:', 'Issue resolved - no action needed');
    if (!reason) return;

    try {
      const token = localStorage.getItem('tennis-marketplace-token');
      if (!token) return;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const payload = {
        action: 'no_action',
        reason: reason,
        adminNotes: `Quick resolved by admin at ${new Date().toLocaleString()}`
      };

      await firstValueFrom(
        this.http.put(`http://localhost:5000/api/reports/${report._id}/resolve`, payload, { headers })
      );

      this.modalService.success('Report Resolved', 'Report has been marked as resolved.');
      this.loadReports(); // Refresh the reports list
    } catch (error) {
      console.error('Error resolving report:', error);
      this.modalService.error('Resolution Failed', 'Failed to resolve report. Please try again.');
    }
  }

  async suspendUserFromReport(report: any, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    const reason = prompt('Enter suspension reason:', `Suspended due to ${report.type} report: ${report.reason}`);
    if (!reason) return;

    const durationStr = prompt('Enter suspension duration in hours (24 for 1 day, 168 for 1 week):', '24');
    const duration = parseInt(durationStr || '24', 10);

    if (isNaN(duration) || duration <= 0) {
      alert('Invalid duration. Please enter a positive number of hours.');
      return;
    }

    try {
      const token = localStorage.getItem('tennis-marketplace-token');
      if (!token) return;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // First suspend the user
      const suspensionPayload = {
        reason: reason,
        type: 'temporary',
        duration: duration,
        reportId: report._id,
        notes: `Suspended based on report: ${report.type} - ${report.reason}`
      };

      await firstValueFrom(
        this.http.put(`/api/users/${report.reportedUser._id}/suspend`, suspensionPayload, { headers })
      );

      // Then resolve the report
      const reportPayload = {
        action: 'user_suspended',
        reason: reason,
        adminNotes: `User suspended for ${duration} hours based on this report`,
        userAction: {
          suspensionType: 'temporary',
          duration: duration
        }
      };

      await firstValueFrom(
        this.http.put(`http://localhost:5000/api/reports/${report._id}/resolve`, reportPayload, { headers })
      );

      this.modalService.success('User Suspended', `User has been suspended for ${duration} hours and the report has been resolved.`);
      this.loadReports(); // Refresh the reports list
      this.loadAllUsers(); // Refresh the users list to show suspension status
    } catch (error) {
      console.error('Error suspending user:', error);
      this.modalService.error('Suspension Failed', 'Failed to suspend user. Please try again.');
    }
  }

  getSliderPosition(): number {
    const tabIndex = this.tabs().findIndex(t => t.id === this.activeTab());
    return (tabIndex * 100) / this.tabs().length;
  }

  onTabSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.setActiveTab(target.value);
    }
  }
}