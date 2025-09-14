import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<ToastNotification[]>([]);

  // Public getter for notifications
  getNotifications = this.notifications.asReadonly();

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private showNotification(notification: Omit<ToastNotification, 'id'>): void {
    const id = this.generateId();
    const fullNotification: ToastNotification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification
    };

    // Add notification to the list
    this.notifications.update(notifications => [...notifications, fullNotification]);

    // Auto-remove after duration
    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, fullNotification.duration);
    }
  }

  success(title: string, message?: string, duration?: number): void {
    this.showNotification({
      type: 'success',
      title,
      message,
      duration,
      icon: '🎾'
    });
  }

  error(title: string, message?: string, duration?: number): void {
    this.showNotification({
      type: 'error',
      title,
      message,
      duration: duration || 7000, // Longer duration for errors
      icon: '❌'
    });
  }

  warning(title: string, message?: string, duration?: number): void {
    this.showNotification({
      type: 'warning',
      title,
      message,
      duration,
      icon: '⚠️'
    });
  }

  info(title: string, message?: string, duration?: number): void {
    this.showNotification({
      type: 'info',
      title,
      message,
      duration,
      icon: 'ℹ️'
    });
  }

  dismiss(id: string): void {
    this.notifications.update(notifications => 
      notifications.filter(notification => notification.id !== id)
    );
  }

  dismissAll(): void {
    this.notifications.set([]);
  }
}