import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PriceComponent } from '../components/price.component';
import { AdminService, AdminProduct, AdminStats, CoinStats, UserCoinDetails, SuspiciousActivities } from '../services/admin.service';
import { ModalService } from '../services/modal.service';

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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PriceComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Admin Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <a routerLink="/" class="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold text-sm">🎾</span>
                </div>
                <h1 class="text-xl font-bold text-gray-900">TennisMarket</h1>
              </a>
              <span class="text-gray-400">›</span>
              <h2 class="text-lg font-semibold text-gray-700">Admin Dashboard</h2>
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/analytics" 
                 class="px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2">
                📊 Site Analytics
              </a>
              <span class="text-sm text-gray-600">Admin</span>
              <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span class="text-white text-sm">👤</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Users</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats().totalUsers }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-blue-600 text-xl">👥</span>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">+12% from last month</p>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Active Listings</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats().activeListings }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span class="text-green-600 text-xl">📦</span>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ stats().pendingApproval }} pending approval</p>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p class="text-2xl font-bold text-gray-900">
                  <app-price [amount]="stats().monthlyRevenue" size="lg"></app-price>
                </p>
              </div>
              <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span class="text-yellow-600 text-xl">💰</span>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ stats().boostedListings }} boosted listings</p>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Subscriptions</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats().subscriptions.basic + stats().subscriptions.pro }}</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span class="text-purple-600 text-xl">⭐</span>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ stats().subscriptions.free }} free users</p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="bg-white rounded-2xl border border-gray-200 mb-6">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8 px-6">
              @for (tab of tabs(); track tab.id) {
                <button
                  (click)="setActiveTab(tab.id)"
                  [class]="activeTab() === tab.id 
                    ? 'border-green-500 text-green-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'">
                  {{ tab.label }}
                  @if (tab.badge) {
                    <span class="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {{ tab.badge }}
                    </span>
                  }
                </button>
              }
            </nav>
          </div>

          <div class="p-6">
            <!-- Pending Listings Tab -->
            @if (activeTab() === 'pending') {
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">Pending Approval</h3>
                  <div class="flex gap-2">
                    <button 
                      (click)="approveAll()"
                      class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                      Approve All
                    </button>
                  </div>
                </div>

                @for (listing of pendingListings(); track listing._id) {
                  <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h4 class="font-semibold text-gray-900">{{ listing.title }}</h4>
                          @if (listing.isBoosted) {
                            <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Boosted</span>
                          }
                        </div>
                        <div class="text-sm text-gray-600 space-y-1">
                          <p><span class="font-medium">Seller:</span> {{ listing.seller?.firstName || 'Unknown' }} {{ listing.seller?.lastName || '' }}</p>
                          <p><span class="font-medium">Price:</span> <app-price [amount]="listing.price"></app-price></p>
                          <p><span class="font-medium">Category:</span> {{ listing.category }}</p>
                          <p><span class="font-medium">Created:</span> {{ listing.createdAt | date }}</p>
                        </div>
                      </div>
                      <div class="flex gap-2 ml-4">
                        <button 
                          (click)="approveListing(listing._id)"
                          class="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                          Approve
                        </button>
                        <button 
                          (click)="rejectListing(listing._id)"
                          class="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                          Reject
                        </button>
                        <button class="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                }

                @if (pendingListings().length === 0) {
                  <div class="text-center py-8">
                    <div class="text-4xl mb-4">✅</div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                    <p class="text-gray-600">No listings pending approval.</p>
                  </div>
                }
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
                            <app-price [amount]="listing.price"></app-price>
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

                <!-- Coin Management Actions -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Award Coins -->
                  <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Award Coins</h4>
                    <form (ngSubmit)="awardCoins()" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                        <input 
                          [(ngModel)]="awardForm.userId" 
                          name="awardUserId"
                          type="text" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter user ID"
                          required>
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                        <input 
                          [(ngModel)]="deductForm.userId" 
                          name="deductUserId"
                          type="text" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter user ID"
                          required>
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
                          <app-price [amount]="stats().subscriptions.basic * 299"></app-price>
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Pro Subscriptions</span>
                        <span class="text-sm font-medium">
                          <app-price [amount]="stats().subscriptions.pro * 999"></app-price>
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">Listing Boosts</span>
                        <span class="text-sm font-medium">
                          <app-price [amount]="stats().boostedListings * 50"></app-price>
                        </span>
                      </div>
                      <div class="border-t pt-2 mt-2">
                        <div class="flex items-center justify-between font-semibold">
                          <span class="text-sm text-gray-900">Total Monthly</span>
                          <span class="text-sm">
                            <app-price [amount]="stats().monthlyRevenue"></app-price>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
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
  private modalService = inject(ModalService);
  
  activeTab = signal<string>('pending');
  
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
      { id: 'coins', label: 'Coin Management', badge: null },
      { id: 'reports', label: 'Reports', badge: null }
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
  isLoading = signal<boolean>(false);

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

  // User approval management data
  pendingUsersData = signal<any[]>([]);
  userApprovalStats = signal<any>({
    pendingUsers: 0,
    activeUsers: 0,
    totalUsers: 0,
    approvalRate: 0
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

  setActiveTab(tabId: string): void {
    console.log('🎯 Setting active tab to:', tabId);
    this.activeTab.set(tabId);
    
    if (tabId === 'inquiries') {
      console.log('💬 Inquiries tab selected, current inquiries:', this.allInquiries().length);
    }
  }

  // Data loading methods
  private loadAdminData(): void {
    this.loadAllProducts();
    this.loadAllUsers();
    this.loadAdminStats();
    this.loadCoinStats();
    this.loadVerificationData();
    this.loadUserApprovalData();
    this.loadAllInquiries();
  }

  private loadAllProducts(): void {
    console.log('🔍 Loading admin products...');
    this.isLoading.set(true);
    this.adminService.getAllProducts({ limit: 100 }).subscribe({
      next: (response) => {
        console.log('✅ Admin products loaded:', response);
        this.allProducts.set(response.products);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load admin products:', error);
        console.log('📝 Response status:', error.status);
        console.log('📝 Response message:', error.error);
        this.isLoading.set(false);
        // Fallback to pending products only
        this.loadPendingProducts();
      }
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

  awardCoins(): void {
    if (!this.awardForm.userId || !this.awardForm.amount || !this.awardForm.description) {
      this.modalService.warning('Missing Information', 'Please fill in all required fields before awarding coins.');
      return;
    }

    this.adminService.awardCoins(
      this.awardForm.userId,
      this.awardForm.amount,
      this.awardForm.reason,
      this.awardForm.description
    ).subscribe({
      next: (response) => {
        this.modalService.success('Coins Awarded', `Successfully awarded ${this.awardForm.amount} coins to user ${this.awardForm.userId}!`);
        this.resetAwardForm();
        this.loadCoinStats(); // Refresh stats
      },
      error: (error) => {
        console.error('Failed to award coins:', error);
        this.modalService.error('Award Failed', `Failed to award coins: ${error.error?.error || 'Unknown error'}`);
      }
    });
  }

  deductCoins(): void {
    if (!this.deductForm.userId || !this.deductForm.amount || !this.deductForm.description) {
      this.modalService.warning('Missing Information', 'Please fill in all required fields before deducting coins.');
      return;
    }

    this.adminService.deductCoins(
      this.deductForm.userId,
      this.deductForm.amount,
      this.deductForm.reason,
      this.deductForm.description
    ).subscribe({
      next: (response) => {
        this.modalService.success('Coins Deducted', `Successfully deducted ${this.deductForm.amount} coins from user ${this.deductForm.userId}!`);
        this.resetDeductForm();
        this.loadCoinStats(); // Refresh stats
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
  }

  private resetDeductForm(): void {
    this.deductForm = {
      userId: '',
      amount: 0,
      reason: 'admin_deduct',
      description: ''
    };
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
}