import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class PWAService {
  private platformId = inject(PLATFORM_ID);
  
  // PWA state signals
  private _isOnline = signal(true);
  private _isInstalled = signal(false);
  private _isInstallable = signal(false);
  private _installPrompt = signal<PWAInstallPrompt | null>(null);
  private _isStandalone = signal(false);
  private _supportsPush = signal(false);
  private _pushSubscription = signal<PushSubscription | null>(null);
  
  // Public readonly signals
  readonly isOnline = this._isOnline.asReadonly();
  readonly isInstalled = this._isInstalled.asReadonly();
  readonly isInstallable = this._isInstallable.asReadonly();
  readonly isStandalone = this._isStandalone.asReadonly();
  readonly supportsPush = this._supportsPush.asReadonly();
  readonly pushSubscription = this._pushSubscription.asReadonly();
  
  // Service worker registration
  private swRegistration: ServiceWorkerRegistration | null = null;
  
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializePWA();
    }
  }
  
  private async initializePWA() {
    // Check initial online status
    this._isOnline.set(navigator.onLine);
    
    // Check if running in standalone mode
    this.checkStandaloneMode();
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check push notification support
    this.checkPushSupport();
    
    // Check for existing push subscription
    await this.checkPushSubscription();
    
    console.log('🎾 PWA Service initialized');
  }
  
  private checkStandaloneMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any)?.standalone ||
                        document.referrer.includes('android-app://');
    
    this._isStandalone.set(isStandalone);
    this._isInstalled.set(isStandalone);
  }
  
  private async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('🎾 PWA: Service Worker not supported');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      this.swRegistration = registration;
      
      console.log('🎾 PWA: Service Worker registered successfully');
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        console.log('🎾 PWA: New service worker version available');
        this.handleServiceWorkerUpdate(registration);
      });
      
      // Check for waiting service worker
      if (registration.waiting) {
        this.showUpdateAvailable();
      }
      
    } catch (error) {
      console.error('🎾 PWA: Service Worker registration failed:', error);
    }
  }
  
  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      console.log('🎾 PWA: Connection restored');
      this._isOnline.set(true);
      this.syncWhenOnline();
    });
    
    window.addEventListener('offline', () => {
      console.log('🎾 PWA: Connection lost');
      this._isOnline.set(false);
    });
    
    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🎾 PWA: Install prompt available');
      e.preventDefault();
      this._installPrompt.set(e as any);
      this._isInstallable.set(true);
    });
    
    // App installed detection
    window.addEventListener('appinstalled', () => {
      console.log('🎾 PWA: App was installed');
      this._isInstalled.set(true);
      this._isInstallable.set(false);
      this._installPrompt.set(null);
      
      // Track installation
      this.trackPWAInstall();
    });
    
    // Display mode changes
    window.matchMedia('(display-mode: standalone)').addListener((e) => {
      this._isStandalone.set(e.matches);
    });
  }
  
  // Public methods
  async installPWA(): Promise<boolean> {
    const prompt = this._installPrompt();
    
    if (!prompt) {
      console.log('🎾 PWA: No install prompt available');
      return false;
    }
    
    try {
      await prompt.prompt();
      const choiceResult = await prompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('🎾 PWA: User accepted the install prompt');
        this._installPrompt.set(null);
        this._isInstallable.set(false);
        return true;
      } else {
        console.log('🎾 PWA: User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('🎾 PWA: Install prompt failed:', error);
      return false;
    }
  }
  
  // Push notifications
  private checkPushSupport() {
    const supported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window;
    
    this._supportsPush.set(supported);
  }
  
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('🎾 PWA: Notifications not supported');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission === 'denied') {
      return 'denied';
    }
    
    const permission = await Notification.requestPermission();
    console.log('🎾 PWA: Notification permission:', permission);
    
    return permission;
  }
  
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.swRegistration || !this._supportsPush()) {
      console.log('🎾 PWA: Push notifications not available');
      return null;
    }
    
    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('🎾 PWA: Notification permission denied');
      return null;
    }
    
    try {
      // You would replace this with your actual VAPID public key
      const applicationServerKey = 'YOUR_VAPID_PUBLIC_KEY';
      
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(applicationServerKey) as BufferSource
      });
      
      this._pushSubscription.set(subscription);
      
      // Send subscription to your backend
      await this.sendSubscriptionToServer(subscription);
      
      console.log('🎾 PWA: Push subscription successful');
      return subscription;
      
    } catch (error) {
      console.error('🎾 PWA: Push subscription failed:', error);
      return null;
    }
  }
  
  async unsubscribeFromPush(): Promise<boolean> {
    const subscription = this._pushSubscription();
    
    if (!subscription) {
      return false;
    }
    
    try {
      await subscription.unsubscribe();
      this._pushSubscription.set(null);
      
      // Notify your backend
      await this.removeSubscriptionFromServer(subscription);
      
      console.log('🎾 PWA: Push unsubscription successful');
      return true;
      
    } catch (error) {
      console.error('🎾 PWA: Push unsubscription failed:', error);
      return false;
    }
  }
  
  // Background sync for offline actions
  async scheduleBackgroundSync(tag: string, data?: any): Promise<void> {
    if (!this.swRegistration || !('sync' in this.swRegistration)) {
      console.log('🎾 PWA: Background sync not supported');
      return;
    }
    
    try {
      // Store the data for sync (you'd use IndexedDB in a real app)
      if (data) {
        localStorage.setItem(`sync-${tag}`, JSON.stringify(data));
      }
      
      await (this.swRegistration as any).sync.register(tag);
      console.log('🎾 PWA: Background sync scheduled:', tag);
      
    } catch (error) {
      console.error('🎾 PWA: Background sync registration failed:', error);
    }
  }
  
  // App shortcuts (dynamic)
  async updateAppShortcuts(shortcuts: any[]): Promise<void> {
    if ('navigator' in window && 'setAppBadge' in navigator) {
      try {
        // This would update app shortcuts dynamically
        console.log('🎾 PWA: Updating app shortcuts', shortcuts);
        // Implementation depends on the final spec
      } catch (error) {
        console.error('🎾 PWA: Failed to update shortcuts:', error);
      }
    }
  }
  
  // App badge (for unread messages, etc.)
  async setAppBadge(count?: number): Promise<void> {
    if ('navigator' in window && 'setAppBadge' in (navigator as any)) {
      try {
        await (navigator as any).setAppBadge(count);
        console.log('🎾 PWA: App badge set:', count);
      } catch (error) {
        console.error('🎾 PWA: Failed to set app badge:', error);
      }
    }
  }
  
  async clearAppBadge(): Promise<void> {
    if ('navigator' in window && 'clearAppBadge' in (navigator as any)) {
      try {
        await (navigator as any).clearAppBadge();
        console.log('🎾 PWA: App badge cleared');
      } catch (error) {
        console.error('🎾 PWA: Failed to clear app badge:', error);
      }
    }
  }
  
  // Private helper methods
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
    const newWorker = registration.installing;
    
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.showUpdateAvailable();
        }
      });
    }
  }
  
  private showUpdateAvailable() {
    // You could show a toast/notification here
    console.log('🎾 PWA: App update available');
    
    // You could emit an event or use a toast service
    // this.toastService.show('New version available! Refresh to update.');
  }
  
  private async checkPushSubscription() {
    if (!this.swRegistration) return;
    
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this._pushSubscription.set(subscription);
    } catch (error) {
      console.error('🎾 PWA: Failed to check push subscription:', error);
    }
  }
  
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Send subscription to your backend API
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
      
      console.log('🎾 PWA: Subscription saved to server');
    } catch (error) {
      console.error('🎾 PWA: Failed to save subscription:', error);
    }
  }
  
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    // Remove subscription from your backend API
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscription })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove subscription');
      }
      
      console.log('🎾 PWA: Subscription removed from server');
    } catch (error) {
      console.error('🎾 PWA: Failed to remove subscription:', error);
    }
  }
  
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
  
  private syncWhenOnline() {
    // Trigger sync of any pending offline actions
    if (this.swRegistration) {
      this.scheduleBackgroundSync('product-sync');
    }
  }
  
  private trackPWAInstall() {
    // Track PWA installation in analytics
    console.log('🎾 PWA: Tracking installation');
    // gtag('event', 'pwa_install', { app_name: 'Tennis Marketplace' });
  }
  
  // Utility methods
  async shareContent(shareData: ShareData): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        console.error('🎾 PWA: Share failed:', error);
        return false;
      }
    }
    
    // Fallback to clipboard or other sharing methods
    return false;
  }
  
  async copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error('🎾 PWA: Clipboard write failed:', error);
        return false;
      }
    }
    
    return false;
  }
  
  // Get PWA stats for analytics
  getPWAStats() {
    return {
      isOnline: this._isOnline(),
      isInstalled: this._isInstalled(),
      isInstallable: this._isInstallable(),
      isStandalone: this._isStandalone(),
      supportsPush: this._supportsPush(),
      hasNotificationPermission: Notification?.permission === 'granted',
      hasPushSubscription: !!this._pushSubscription()
    };
  }
}