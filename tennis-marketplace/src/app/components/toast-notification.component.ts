import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-toast-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Toast Container - Fixed position at top right -->
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      @for (notification of notifications(); track notification.id) {
        <div 
          class="transform transition-all duration-300 ease-in-out animate-slide-in-right bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          [class]="getNotificationClasses(notification.type)"
          role="alert"
          aria-live="polite"
        >
          <!-- Progress bar for duration -->
          <div 
            class="absolute top-0 left-0 h-1 bg-current opacity-30 transition-all ease-linear"
            [class]="getProgressBarClasses(notification.type)"
            [style.width.%]="getProgressWidth(notification)"
            [style.animation-duration.ms]="notification.duration"
          ></div>
          
          <div class="p-4">
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div class="flex-shrink-0 mt-0.5">
                <span class="text-lg">{{ notification.icon }}</span>
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 text-sm leading-5">
                  {{ notification.title }}
                </h4>
                @if (notification.message) {
                  <p class="mt-1 text-sm text-gray-600 leading-4">
                    {{ notification.message }}
                  </p>
                }
              </div>
              
              <!-- Close button -->
              <button 
                (click)="dismiss(notification.id)"
                class="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
                aria-label="Dismiss notification"
              >
                <svg class="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes progress-bar {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
    
    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
    
    .progress-animation {
      animation: progress-bar linear forwards;
    }
  `]
})
export class ToastNotificationComponent {
  private notificationService = inject(NotificationService);
  
  notifications = this.notificationService.getNotifications;

  getNotificationClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500';
      case 'error':
        return 'border-l-4 border-l-red-500';
      case 'warning':
        return 'border-l-4 border-l-yellow-500';
      case 'info':
        return 'border-l-4 border-l-blue-500';
      default:
        return 'border-l-4 border-l-gray-500';
    }
  }

  getProgressBarClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }

  getProgressWidth(notification: any): number {
    // This is a simple implementation - in a real app you'd track elapsed time
    return 100;
  }

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}