import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService, ModalConfig } from '../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Overlay -->
    <div *ngIf="modalService.isVisible()" 
         class="fixed inset-0 z-50 overflow-y-auto"
         (click)="onOverlayClick($event)">
      
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"></div>
      
      <!-- Modal Container -->
      <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all duration-300 sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
             (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="sm:flex sm:items-start">
            
            <!-- Icon -->
            <div [class]="getIconClasses()" class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10">
              <span class="text-2xl">{{ currentModal()?.icon }}</span>
            </div>
            
            <!-- Content -->
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 class="text-lg font-semibold leading-6 text-gray-900 mb-2">
                {{ currentModal()?.title }}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-600 leading-relaxed" [innerHTML]="currentModal()?.message"></p>
                
                <!-- Input Field for Prompt Modal -->
                <div *ngIf="currentModal()?.type === 'prompt'" class="mt-4">
                  <textarea 
                    [placeholder]="currentModal()?.inputPlaceholder || 'Enter your response...'"
                    [(ngModel)]="inputValue"
                    (ngModelChange)="modalService.updateInputValue($event)"
                    class="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm"
                    rows="4"
                    [required]="currentModal()?.inputRequired || false"
                    #inputField></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Modal Actions -->
          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

            <!-- Cancel Button -->
            <button *ngIf="currentModal()?.showCancel"
                    type="button"
                    (click)="modalService.onCancel()"
                    class="inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors order-2 sm:order-1">
              {{ currentModal()?.cancelText || 'Cancel' }}
            </button>

            <!-- Confirm Button -->
            <button type="button"
                    (click)="modalService.onConfirm()"
                    [class]="getConfirmButtonClasses()"
                    [disabled]="isPromptInvalid()"
                    class="inline-flex w-full justify-center rounded-lg px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2">
              {{ currentModal()?.confirmText || 'OK' }}
            </button>

          </div>
          
          <!-- Close Button -->
          <button type="button"
                  (click)="modalService.onDismiss()"
                  class="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full p-1 transition-colors">
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
          
        </div>
      </div>
    </div>
  `
})
export class ModalComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscription?: Subscription;
  @ViewChild('inputField') inputField?: ElementRef<HTMLTextAreaElement>;

  constructor(public modalService: ModalService) {}

  get inputValue(): string {
    return this.modalService.inputValue();
  }

  set inputValue(value: string) {
    this.modalService.updateInputValue(value);
  }

  ngOnInit(): void {
    // Handle escape key
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  ngAfterViewInit(): void {
    // Auto-focus the input field for prompt modals
    if (this.currentModal()?.type === 'prompt' && this.inputField) {
      setTimeout(() => {
        this.inputField?.nativeElement.focus();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  currentModal() {
    return this.modalService.currentModal();
  }

  getIconClasses(): string {
    const type = this.currentModal()?.type;
    const baseClasses = '';
    
    switch (type) {
      case 'success':
        return baseClasses + 'bg-green-100';
      case 'error':
        return baseClasses + 'bg-red-100';
      case 'warning':
        return baseClasses + 'bg-yellow-100';
      case 'info':
        return baseClasses + 'bg-blue-100';
      case 'confirm':
        return baseClasses + 'bg-yellow-100';
      case 'prompt':
        return baseClasses + 'bg-green-100';
      default:
        return baseClasses + 'bg-gray-100';
    }
  }

  getConfirmButtonClasses(): string {
    const type = this.currentModal()?.type;
    const baseClasses = 'hover:opacity-90 focus:ring-2 focus:ring-offset-2';
    
    switch (type) {
      case 'success':
        return baseClasses + ' bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'error':
        return baseClasses + ' bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return baseClasses + ' bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
        return baseClasses + ' bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      case 'confirm':
        return baseClasses + ' bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'prompt':
        return baseClasses + ' bg-green-600 hover:bg-green-700 focus:ring-green-500';
      default:
        return baseClasses + ' bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
    }
  }

  isPromptInvalid(): boolean {
    const modal = this.currentModal();
    if (modal?.type === 'prompt' && modal.inputRequired) {
      return !this.inputValue || this.inputValue.trim().length === 0;
    }
    return false;
  }

  onOverlayClick(event: MouseEvent): void {
    // Only close if clicking the overlay, not the modal content
    if (event.target === event.currentTarget) {
      this.modalService.onDismiss();
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.modalService.isVisible()) {
      this.modalService.onDismiss();
    }
  }
}