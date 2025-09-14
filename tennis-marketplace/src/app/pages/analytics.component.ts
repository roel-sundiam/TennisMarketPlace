import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { PriceComponent } from '../components/price.component';
import { AnalyticsService, AnalyticsStats, RealtimeData } from '../services/analytics.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PriceComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Analytics Header -->
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
              <a routerLink="/admin" class="text-gray-600 hover:text-gray-900 transition-colors">Admin</a>
              <span class="text-gray-400">›</span>
              <h2 class="text-lg font-semibold text-gray-700">Site Analytics</h2>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <label class="text-sm text-gray-600">
                  <input
                    type="checkbox"
                    [checked]="excludeAdmin()"
                    (change)="toggleExcludeAdmin()"
                    class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  >
                  Exclude Admin Activity
                </label>
              </div>
              <button
                (click)="refreshData()"
                [disabled]="loading()"
                class="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {{ loading() ? '⟳' : '↻' }} Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Loading State -->
        <div *ngIf="loading()" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span class="ml-2 text-gray-600">Loading analytics...</span>
        </div>

        <div *ngIf="!loading()" class="space-y-8">
          <!-- Real-time Stats -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Real-time Activity</h3>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-sm text-gray-600">Live</span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-green-600">{{ realtimeData()?.activeUsers || 0 }}</div>
                <div class="text-sm text-gray-600">Active Users Now</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-blue-600">{{ realtimeData()?.activeAnonymous || 0 }}</div>
                <div class="text-sm text-gray-600">Anonymous Visitors</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-purple-600">{{ realtimeData()?.activeRegistered || 0 }}</div>
                <div class="text-sm text-gray-600">Registered Users</div>
              </div>
            </div>
          </div>

          <!-- Overview Stats -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Page Views</p>
                  <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analyticsData()?.overview?.totalViews || 0) }}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 text-xl">👁️</span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Unique Visitors</p>
                  <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analyticsData()?.overview?.uniqueVisitors || 0) }}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span class="text-green-600 text-xl">👥</span>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">Including anonymous users</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Registered Users</p>
                  <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analyticsData()?.overview?.uniqueUsers || 0) }}</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span class="text-purple-600 text-xl">✅</span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Anonymous Rate</p>
                  <p class="text-2xl font-bold text-gray-900">{{ getAnonymousRate() }}%</p>
                </div>
                <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span class="text-yellow-600 text-xl">🎭</span>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">Anonymous vs registered</p>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Daily Trends Chart -->
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Traffic Trends</h3>
              <div class="space-y-3">
                <div *ngFor="let day of getLastWeekTrends()" class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-600 w-16">{{ day.date }}</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                      <div 
                        class="bg-green-500 h-2 rounded-full transition-all duration-500"
                        [style.width.%]="day.percentage"
                      ></div>
                    </div>
                  </div>
                  <div class="text-sm font-medium text-gray-900 w-16 text-right">{{ day.views }}</div>
                </div>
              </div>
            </div>

            <!-- Device Breakdown -->
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
              <div class="space-y-3">
                <div *ngFor="let device of analyticsData()?.devices?.devices || []" class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ getDeviceIcon(device.type) }}</span>
                    <span class="text-sm text-gray-600 capitalize">{{ device.type }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="text-sm font-medium text-gray-900">{{ device.count }}</div>
                    <div class="text-xs text-gray-500">({{ getDevicePercentage(device.count) }}%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Pages and Popular Products -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Top Pages -->
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Most Visited Pages</h3>
              <div class="space-y-3">
                <div *ngFor="let page of analyticsData()?.overview?.topPages || []; let i = index" 
                     class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-gray-400 w-4">{{ i + 1 }}</span>
                    <span class="text-sm text-gray-900 font-mono">{{ page.path }}</span>
                  </div>
                  <div class="text-sm font-medium text-green-600">{{ page.views }}</div>
                </div>
              </div>
            </div>

            <!-- Popular Products -->
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Popular Products</h3>
              <div class="space-y-3">
                <div *ngFor="let product of analyticsData()?.popularProducts || []; let i = index" 
                     class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-bold text-gray-400 w-4">{{ i + 1 }}</span>
                      <span class="text-sm font-medium text-gray-900 truncate">{{ product.title }}</span>
                    </div>
                    <div class="text-xs text-green-600 ml-6">
                      <app-price [amount]="product.price" size="sm"></app-price>
                    </div>
                  </div>
                  <div class="text-sm font-medium text-blue-600">{{ product.views }} views</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Search Terms and Recent Activity -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Popular Search Terms -->
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Popular Search Terms</h3>
              <div class="space-y-2">
                <div *ngFor="let search of analyticsData()?.searchStats || []; let i = index" 
                     class="flex items-center justify-between py-2">
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-gray-400 w-4">{{ i + 1 }}</span>
                    <span class="text-sm text-gray-900 font-medium">{{ search.query }}</span>
                  </div>
                  <div class="text-sm font-medium text-purple-600">{{ search.count }}</div>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                <div *ngFor="let activity of realtimeData()?.recentActivity || []" 
                     class="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0">
                  <div class="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-gray-900">
                      <span class="font-medium capitalize">{{ activity.eventType.replace('_', ' ') }}</span>
                      on {{ activity.path }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ activity.user ? activity.user.name : 'Anonymous user' }} • 
                      {{ activity.device }} • {{ formatTime(activity.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Export and Cleanup Actions -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
            <div class="flex flex-wrap gap-4">
              <button
                (click)="exportData('json')"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📊 Export JSON
              </button>
              <button
                (click)="exportData('csv')"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📋 Export CSV
              </button>
              <button
                (click)="cleanupOldData()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Cleanup Old Data (365+ days)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private analyticsService = inject(AnalyticsService);
  private notificationService = inject(NotificationService);

  analyticsData = signal<AnalyticsStats | null>(null);
  realtimeData = signal<RealtimeData | null>(null);
  loading = signal<boolean>(true);
  excludeAdmin = signal<boolean>(true);

  private refreshSubscription?: Subscription;

  ngOnInit() {
    this.loadAnalyticsData();
    
    // Set up auto-refresh every 30 seconds for real-time data
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadRealtimeData();
    });
  }

  ngOnDestroy() {
    this.refreshSubscription?.unsubscribe();
  }

  loadAnalyticsData() {
    this.loading.set(true);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    this.analyticsService.getAnalyticsStats(startDate.toISOString(), new Date().toISOString(), this.excludeAdmin()).subscribe({
      next: (response: { success: boolean; data: AnalyticsStats }) => {
        this.analyticsData.set(response.data);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load analytics data:', error);
        this.notificationService.error('Failed to load analytics data');
        this.loading.set(false);
      }
    });

    this.loadRealtimeData();
  }

  loadRealtimeData() {
    this.analyticsService.getRealtimeData(this.excludeAdmin()).subscribe({
      next: (response: { success: boolean; data: RealtimeData }) => {
        this.realtimeData.set(response.data);
      },
      error: (error: any) => {
        console.error('Failed to load real-time data:', error);
      }
    });
  }

  refreshData() {
    this.loadAnalyticsData();
  }

  toggleExcludeAdmin() {
    this.excludeAdmin.set(!this.excludeAdmin());
    this.loadAnalyticsData();
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getAnonymousRate(): string {
    const data = this.analyticsData();
    if (!data?.overview) return '0';
    
    const total = data.overview.uniqueVisitors;
    const registered = data.overview.uniqueUsers;
    const anonymous = total - registered;
    
    if (total === 0) return '0';
    return ((anonymous / total) * 100).toFixed(0);
  }

  getDeviceIcon(deviceType: string): string {
    const icons: { [key: string]: string } = {
      'desktop': '💻',
      'mobile': '📱',
      'tablet': '📱',
      'unknown': '❓'
    };
    return icons[deviceType] || '❓';
  }

  getDevicePercentage(count: number): string {
    const data = this.analyticsData();
    if (!data?.devices?.devices) return '0';
    
    const total = data.devices.devices.reduce((sum: number, device: any) => sum + device.count, 0);
    if (total === 0) return '0';
    
    return ((count / total) * 100).toFixed(0);
  }

  getLastWeekTrends() {
    const data = this.analyticsData();
    if (!data?.trends) return [];
    
    // Get last 7 days from trends
    const lastWeek = data.trends.slice(-7);
    const maxViews = Math.max(...lastWeek.map((day: any) => day.views));
    
    return lastWeek.map((day: any) => ({
      date: new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      views: day.views,
      percentage: maxViews > 0 ? (day.views / maxViews) * 100 : 0
    }));
  }

  formatTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return time.toLocaleDateString();
  }

  exportData(format: 'json' | 'csv') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.analyticsService.exportAnalyticsData(startDate.toISOString(), new Date().toISOString(), format, this.excludeAdmin())
      .subscribe({
        next: (data: any) => {
          const blob = new Blob(
            [format === 'csv' ? data : JSON.stringify(data, null, 2)],
            { type: format === 'csv' ? 'text/csv' : 'application/json' }
          );
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.notificationService.success(`Analytics data exported as ${format.toUpperCase()}`);
        },
        error: (error: any) => {
          console.error('Export failed:', error);
          this.notificationService.error('Failed to export data');
        }
      });
  }

  cleanupOldData() {
    if (!confirm('This will permanently delete analytics data older than 365 days. Continue?')) {
      return;
    }
    
    this.analyticsService.cleanupOldData(365).subscribe({
      next: (response: any) => {
        this.notificationService.success('Old analytics data cleaned up successfully');
        this.loadAnalyticsData(); // Refresh data
      },
      error: (error: any) => {
        console.error('Cleanup failed:', error);
        this.notificationService.error('Failed to cleanup old data');
      }
    });
  }
}