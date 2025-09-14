import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PWAService } from '../services/pwa.service';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="pwaService.isInstallable() && !dismissed" 
         class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white dark:bg-dark-100 rounded-3xl shadow-strong border border-primary-200 dark:border-primary-700 p-6 z-50 animate-slide-up-fade">
      
      <!-- Background Gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-green-50/50 dark:from-primary-900/20 dark:to-green-900/20 rounded-3xl"></div>
      
      <div class="relative z-10">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span class="text-white text-2xl animate-bounce-gentle">🎾</span>
            </div>
            <div>
              <h3 class="font-bold text-neutral-900 dark:text-dark-900 text-lg">Install App</h3>
              <p class="text-sm text-neutral-600 dark:text-dark-700">Get the full experience</p>
            </div>
          </div>
          <button 
            (click)="dismiss()"
            class="text-neutral-400 dark:text-dark-500 hover:text-neutral-600 dark:hover:text-dark-700 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-dark-200/50 transition-all duration-200"
            aria-label="Dismiss install prompt">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- Benefits -->
        <div class="space-y-3 mb-5">
          <div class="flex items-center gap-3 text-sm">
            <div class="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-neutral-700 dark:text-dark-800 font-medium">⚡ Lightning fast loading</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <div class="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-neutral-700 dark:text-dark-800 font-medium">📱 Native app experience</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <div class="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-neutral-700 dark:text-dark-800 font-medium">🔔 Push notifications</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <div class="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-neutral-700 dark:text-dark-800 font-medium">📶 Works offline</span>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-3">
          <button 
            (click)="install()"
            [disabled]="installing"
            class="flex-1 bg-gradient-to-r from-primary-600 to-green-600 hover:from-primary-700 hover:to-green-700 disabled:from-neutral-400 disabled:to-neutral-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2">
            <span *ngIf="!installing">Add to Home Screen</span>
            <span *ngIf="installing" class="flex items-center gap-2">
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Installing...
            </span>
          </button>
          <button 
            (click)="dismiss()"
            class="px-4 py-3 border-2 border-neutral-200 dark:border-dark-300 text-neutral-700 dark:text-dark-800 hover:bg-neutral-50 dark:hover:bg-dark-200/50 font-medium rounded-2xl transition-all duration-200 hover:scale-105">
            Later
          </button>
        </div>
        
        <!-- Fine Print -->
        <p class="text-xs text-neutral-500 dark:text-dark-600 mt-3 text-center">
          Install takes ~2MB. Works on iOS, Android & Desktop.
        </p>
      </div>
    </div>
    
    <!-- Success Toast -->
    <div *ngIf="showSuccessToast" 
         class="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-strong z-50 animate-slide-down flex items-center gap-3">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      <span class="font-medium">App installed successfully! 🎉</span>
    </div>
  `
})
export class PWAInstallPromptComponent implements OnInit {
  pwaService = inject(PWAService);
  
  dismissed = false;
  installing = false;
  showSuccessToast = false;
  
  async install() {
    if (this.installing) return;
    
    this.installing = true;
    
    try {
      const success = await this.pwaService.installPWA();
      
      if (success) {
        this.dismissed = true;
        this.showSuccessToast = true;
        
        // Hide success toast after 3 seconds
        setTimeout(() => {
          this.showSuccessToast = false;
        }, 3000);
        
        // Track installation
        this.trackInstallation('success');
      } else {
        // Track dismissal
        this.trackInstallation('dismissed');
      }
    } catch (error) {
      console.error('PWA installation error:', error);
      this.trackInstallation('error');
    } finally {
      this.installing = false;
    }
  }
  
  dismiss() {
    this.dismissed = true;
    this.trackInstallation('dismissed_manual');
    
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  }
  
  private trackInstallation(outcome: string) {
    // Track PWA installation attempts
    console.log('PWA Install Outcome:', outcome);
    
    // You could send this to analytics
    // gtag('event', 'pwa_install_prompt', { outcome });
  }
  
  ngOnInit() {
    // Check if user previously dismissed for this session
    if (sessionStorage.getItem('pwa-install-dismissed')) {
      this.dismissed = true;
    }
  }
}