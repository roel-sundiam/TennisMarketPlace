import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, fromEvent, timer } from 'rxjs';
import { filter, debounceTime, takeUntil, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FingerprintService } from './fingerprint.service';
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
    errorCode?: number;
    screenSize?: { width: number; height: number };
    custom?: any;
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
    topPages: Array<{ path: string; views: number }>;
  };
  trends: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
  devices: {
    devices: Array<{ type: string; count: number }>;
    browsers: Array<{ browser: string; count: number }>;
  };
  popularProducts: Array<{
    productId: string;
    views: number;
    title: string;
    price: number;
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
    user?: { name: string; email: string };
    fingerprint?: string;
    product?: { title: string; price: number };
    timestamp: string;
    device: string;
    browser?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;
  private sessionId: string = '';
  private fingerprint: string = '';
  private pageStartTime: number = Date.now();
  private isTracking: boolean = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private fingerprintService: FingerprintService,
    private authService: AuthService
  ) {
    this.initializeAnalytics();
  }

  private async initializeAnalytics() {
    try {
      // Generate session ID
      this.sessionId = this.generateSessionId();
      
      // Get fingerprint for anonymous tracking
      this.fingerprint = await this.fingerprintService.getFingerprint();
      
      // Track route changes
      this.trackRouteChanges();
      
      // Track page unload for time-on-page calculation
      this.trackPageUnload();
      
      console.log('Analytics service initialized', { sessionId: this.sessionId });
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Fingerprint': this.fingerprint,
      'X-Session-ID': this.sessionId
    });

    // Add auth token if user is logged in
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private trackRouteChanges() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Calculate time spent on previous page
        const timeOnPage = Date.now() - this.pageStartTime;
        
        // Track the page view
        this.trackPageView(event.urlAfterRedirects, {
          performance: {
            timeOnPage: timeOnPage > 100 ? timeOnPage : undefined
          }
        });
        
        // Reset page start time
        this.pageStartTime = Date.now();
      });
  }

  private trackPageUnload() {
    // Track time on page when user leaves
    fromEvent(window, 'beforeunload').subscribe(() => {
      const timeOnPage = Date.now() - this.pageStartTime;
      
      // Use navigator.sendBeacon for reliable tracking during page unload
      if (navigator.sendBeacon && timeOnPage > 1000) {
        const data = JSON.stringify({
          eventType: 'session_end',
          path: this.router.url,
          fingerprint: this.fingerprint,
          sessionId: this.sessionId,
          performance: { timeOnPage }
        });
        
        navigator.sendBeacon(`${this.apiUrl}/track`, data);
      }
    });
  }

  // Track a page view
  trackPageView(path: string, additionalData: Partial<AnalyticsEvent> = {}) {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType: 'page_view',
      path,
      referrer: document.referrer,
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      data: {
        screenSize: {
          width: window.screen.width,
          height: window.screen.height
        },
        ...additionalData.data
      },
      performance: {
        loadTime: performance.now(),
        ...additionalData.performance
      }
    };

    this.sendEvent(event);
  }

  // Track product view
  trackProductView(productId: string, productTitle?: string) {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType: 'product_view',
      path: this.router.url,
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      data: {
        productId,
        custom: { productTitle }
      }
    };

    this.sendEvent(event);
  }

  // Track search
  trackSearch(query: string, filters?: any) {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType: 'search',
      path: this.router.url,
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      data: {
        searchQuery: query,
        filterData: filters
      }
    };

    this.sendEvent(event);
  }

  // Track product favorite/unfavorite
  trackProductFavorite(productId: string, action: 'add' | 'remove') {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType: action === 'add' ? 'product_favorite' : 'product_unfavorite',
      path: this.router.url,
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      data: {
        productId
      }
    };

    this.sendEvent(event);
  }

  // Track product contact
  trackProductContact(productId: string, contactMethod: string) {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType: 'product_contact',
      path: this.router.url,
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      data: {
        productId,
        custom: { contactMethod }
      }
    };

    this.sendEvent(event);
  }

  // Track filter usage
  trackFilterUse(filters: any) {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType: 'filter_use',
      path: this.router.url,
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      data: {
        filterData: filters
      }
    };

    this.sendEvent(event);
  }

  // Track custom events
  trackCustomEvent(eventType: string, data?: any) {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType,
      path: this.router.url,
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      data: {
        custom: data
      }
    };

    this.sendEvent(event);
  }

  // Track errors
  trackError(errorCode: number, errorMessage?: string) {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType: 'error',
      path: this.router.url,
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      data: {
        errorCode,
        custom: { errorMessage }
      }
    };

    this.sendEvent(event);
  }

  private sendEvent(event: AnalyticsEvent): void {
    this.http.post(`${this.apiUrl}/track`, event, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          // Event tracked successfully (silent)
        },
        error: (error) => {
          console.warn('Failed to track analytics event:', error);
        }
      });
  }

  // Admin methods for retrieving analytics data

  getAnalyticsStats(startDate?: Date, endDate?: Date, excludeAdmin: boolean = true): Observable<AnalyticsStats> {
    const params: any = { excludeAdmin: excludeAdmin.toString() };
    
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    if (endDate) {
      params.endDate = endDate.toISOString();
    }

    return this.http.get<{ success: boolean; data: AnalyticsStats }>(`${this.apiUrl}/stats`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      filter((response: any) => response.success),
      map((response: any) => response.data)
    );
  }

  getRealtimeData(excludeAdmin: boolean = true): Observable<RealtimeData> {
    const params = { excludeAdmin: excludeAdmin.toString() };

    return this.http.get<{ success: boolean; data: RealtimeData }>(`${this.apiUrl}/realtime`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      filter((response: any) => response.success),
      map((response: any) => response.data)
    );
  }

  exportAnalyticsData(startDate?: Date, endDate?: Date, format: 'json' | 'csv' = 'json', excludeAdmin: boolean = true): Observable<any> {
    const params: any = {
      format,
      excludeAdmin: excludeAdmin.toString()
    };
    
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    if (endDate) {
      params.endDate = endDate.toISOString();
    }

    const headers = this.getHeaders();
    
    if (format === 'csv') {
      // For CSV, we expect a text response
      return this.http.get(`${this.apiUrl}/export`, {
        headers,
        params,
        responseType: 'text'
      });
    } else {
      // For JSON, normal response
      return this.http.get<any>(`${this.apiUrl}/export`, {
        headers,
        params
      });
    }
  }

  cleanupOldData(daysToKeep: number = 365): Observable<any> {
    return this.http.post(`${this.apiUrl}/cleanup`, 
      { daysToKeep },
      { headers: this.getHeaders() }
    );
  }

  // Enable/disable tracking
  enableTracking() {
    this.isTracking = true;
  }

  disableTracking() {
    this.isTracking = false;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getFingerprint(): string {
    return this.fingerprint;
  }
}