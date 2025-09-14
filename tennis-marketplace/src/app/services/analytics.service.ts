import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface AnalyticsEvent {
  eventType: string;
  path: string;
  referrer?: string;
  fingerprint?: string;
  sessionId?: string;
  data?: {
    productId?: string;
    searchQuery?: string;
    filterData?: any;
    custom?: any;
    screenSize?: { width: number; height: number };
  };
  performance?: {
    loadTime?: number;
    timeOnPage?: number;
  };
}

export interface AnalyticsStats {
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    uniqueUsers: number;
    topPages: Array<{
      path: string;
      views: number;
    }>;
  };
  trends: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
  devices: {
    devices: Array<{ 
      type: string; 
      count: number; 
    }>;
    browsers: Array<{
      browser: string;
      count: number;
    }>;
  };
  popularProducts: Array<{
    productId: string;
    title: string;
    price: number;
    views: number;
  }>;
  searchStats: Array<{
    query: string;
    count: number;
  }>;
}

export interface RealtimeData {
  activeUsers: number;
  activeAnonymous: number;
  activeRegistered: number;
  recentActivity: Array<{
    eventType: string;
    path: string;
    user: { name: string; email: string } | null;
    timestamp: string;
    device: string;
    browser: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = 'http://localhost:5000/api/analytics';
  private sessionId: string;
  private fingerprint: string;
  private pageLoadTime: number = Date.now();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.fingerprint = this.generateFingerprint();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private generateFingerprint(): string {
    // Simple browser fingerprinting
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Analytics fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return this.hashCode(fingerprint).toString();
  }

  private hashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const token = this.authService.getToken();
      const headers: any = {
        'Content-Type': 'application/json',
        'X-Fingerprint': this.fingerprint,
        'X-Session-ID': this.sessionId
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const eventData: AnalyticsEvent = {
        ...event,
        fingerprint: this.fingerprint,
        sessionId: this.sessionId,
        referrer: document.referrer || undefined,
        data: {
          ...event.data,
          screenSize: {
            width: screen.width,
            height: screen.height
          }
        }
      };

      await firstValueFrom(
        this.http.post(`${this.apiUrl}/track`, eventData, { headers })
      );
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  async trackPageView(path: string, additionalData?: any): Promise<void> {
    const loadTime = Date.now() - this.pageLoadTime;
    this.pageLoadTime = Date.now(); // Reset for next page
    
    await this.trackEvent({
      eventType: 'page_view',
      path,
      data: {
        custom: additionalData
      },
      performance: {
        loadTime
      }
    });
  }

  async trackProductView(productId: string): Promise<void> {
    await this.trackEvent({
      eventType: 'product_view',
      path: window.location.pathname,
      data: {
        productId
      }
    });
  }

  async trackSearch(query: string): Promise<void> {
    await this.trackEvent({
      eventType: 'search',
      path: window.location.pathname,
      data: {
        searchQuery: query
      }
    });
  }

  async trackProductInteraction(action: string, productId?: string): Promise<void> {
    await this.trackEvent({
      eventType: action,
      path: window.location.pathname,
      data: {
        productId
      }
    });
  }

  trackTimeOnPage(startTime: number): void {
    const timeOnPage = Date.now() - startTime;
    // We'll send this with the next page view or before unload
    this.trackEvent({
      eventType: 'page_view_end',
      path: window.location.pathname,
      performance: {
        timeOnPage
      }
    }).catch(err => console.error('Failed to track time on page:', err));
  }

  getAnalyticsStats(startDate?: string, endDate?: string, excludeAdmin: boolean = true): any {
    const headers: any = {
      'Content-Type': 'application/json'
    };

    const token = this.authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('excludeAdmin', excludeAdmin.toString());

    return this.http.get<{ success: boolean; data: AnalyticsStats }>(`${this.apiUrl}/stats?${params.toString()}`, { headers });
  }

  getRealtimeData(excludeAdmin: boolean = true): any {
    const headers: any = {
      'Content-Type': 'application/json'
    };

    const token = this.authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    params.append('excludeAdmin', excludeAdmin.toString());

    return this.http.get<{ success: boolean; data: RealtimeData }>(`${this.apiUrl}/realtime?${params.toString()}`, { headers });
  }

  exportAnalyticsData(startDate?: string, endDate?: string, format: string = 'json', excludeAdmin: boolean = true): any {
    const headers: any = {
      'Content-Type': 'application/json'
    };

    const token = this.authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('format', format);
    params.append('excludeAdmin', excludeAdmin.toString());

    return this.http.get(`${this.apiUrl}/export?${params.toString()}`, { headers });
  }

  cleanupOldData(daysToKeep: number = 365): any {
    const headers: any = {
      'Content-Type': 'application/json'
    };

    const token = this.authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.http.post(`${this.apiUrl}/cleanup`, { daysToKeep }, { headers });
  }
}