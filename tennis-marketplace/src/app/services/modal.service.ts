import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ModalConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  icon?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  inputRequired?: boolean;
}

export interface ModalResult {
  confirmed: boolean;
  dismissed: boolean;
  value?: string; // For prompt responses
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new Subject<ModalConfig>();
  private resultSubject = new Subject<ModalResult>();

  // Signals for modal state
  isVisible = signal<boolean>(false);
  currentModal = signal<ModalConfig | null>(null);
  inputValue = signal<string>('');

  constructor() {}

  // Show success modal
  success(title: string, message: string): Observable<ModalResult> {
    return this.showModal({
      title,
      message,
      type: 'success',
      icon: '✅',
      confirmText: 'OK',
      showCancel: false
    });
  }

  // Show error modal
  error(title: string, message: string): Observable<ModalResult> {
    return this.showModal({
      title,
      message,
      type: 'error',
      icon: '❌',
      confirmText: 'OK',
      showCancel: false
    });
  }

  // Show warning modal
  warning(title: string, message: string): Observable<ModalResult> {
    return this.showModal({
      title,
      message,
      type: 'warning',
      icon: '⚠️',
      confirmText: 'OK',
      showCancel: false
    });
  }

  // Show info modal
  info(title: string, message: string): Observable<ModalResult> {
    return this.showModal({
      title,
      message,
      type: 'info',
      icon: 'ℹ️',
      confirmText: 'OK',
      showCancel: false
    });
  }

  // Show confirmation modal
  confirm(title: string, message: string, confirmText: string = 'Confirm', cancelText: string = 'Cancel'): Observable<ModalResult> {
    return this.showModal({
      title,
      message,
      type: 'confirm',
      icon: '❓',
      confirmText,
      cancelText,
      showCancel: true
    });
  }

  // Show prompt modal (returns Promise for easier async/await usage)
  prompt(title: string, message: string, placeholder: string = '', initialValue: string = ''): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const modalConfig: ModalConfig = {
        title,
        message,
        type: 'prompt',
        icon: '💬',
        confirmText: 'Send',
        cancelText: 'Cancel',
        showCancel: true,
        inputPlaceholder: placeholder,
        inputValue: initialValue,
        inputRequired: true
      };

      this.currentModal.set(modalConfig);
      this.isVisible.set(true);
      
      const subscription = this.resultSubject.subscribe(result => {
        if (result.confirmed && result.value && result.value.trim()) {
          resolve(result.value.trim());
        } else {
          reject('User cancelled or empty input');
        }
        subscription.unsubscribe();
      });
    });
  }

  // Convenience methods that return promises instead of observables
  showSuccess(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      this.success(title, message).subscribe(() => resolve());
    });
  }

  showError(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      this.error(title, message).subscribe(() => resolve());
    });
  }

  showInfo(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      this.info(title, message).subscribe(() => resolve());
    });
  }

  // Generic modal method
  private showModal(config: ModalConfig): Observable<ModalResult> {
    this.currentModal.set(config);
    this.isVisible.set(true);
    this.inputValue.set(config.inputValue || '');
    
    return new Observable<ModalResult>(observer => {
      const subscription = this.resultSubject.subscribe(result => {
        observer.next(result);
        observer.complete();
        subscription.unsubscribe();
      });
    });
  }

  // Handle modal actions
  onConfirm(): void {
    const modal = this.currentModal();
    if (modal?.type === 'prompt') {
      this.resultSubject.next({ 
        confirmed: true, 
        dismissed: false, 
        value: this.inputValue() 
      });
    } else {
      this.resultSubject.next({ confirmed: true, dismissed: false });
    }
    this.closeModal();
  }

  onCancel(): void {
    this.resultSubject.next({ confirmed: false, dismissed: false });
    this.closeModal();
  }

  onDismiss(): void {
    this.resultSubject.next({ confirmed: false, dismissed: true });
    this.closeModal();
  }

  // Update input value
  updateInputValue(value: string): void {
    this.inputValue.set(value);
  }

  private closeModal(): void {
    this.isVisible.set(false);
    this.currentModal.set(null);
    this.inputValue.set('');
  }
}