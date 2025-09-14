import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface ReportType {
  value: string;
  label: string;
  description: string;
  category: 'fraud' | 'behavior' | 'content' | 'technical';
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePicture?: string;
  role: string;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  images?: Array<{
    url: string;
    alt?: string;
    isMain?: boolean;
  }>;
}

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         (click)="onBackdropClick($event)" *ngIf="isVisible()">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
           (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">
              Report {{ getReportTargetType() }}
            </h3>
            <button (click)="close()"
                    class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    type="button">
              &times;
            </button>
          </div>

          <!-- Target Information -->
          <div class="mt-3 p-3 bg-gray-50 rounded-lg">
            <!-- User Being Reported -->
            @if (reportedUser) {
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  @if (reportedUser?.profilePicture) {
                    <img [src]="reportedUser?.profilePicture"
                         alt="Profile"
                         class="w-10 h-10 rounded-full object-cover">
                  } @else {
                    <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span class="text-gray-600 font-medium text-sm">
                        {{ getInitials(reportedUser?.firstName, reportedUser?.lastName) }}
                      </span>
                    </div>
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">
                    {{ reportedUser?.firstName }} {{ reportedUser?.lastName }}
                  </p>
                  <p class="text-xs text-gray-500 capitalize">{{ reportedUser?.role }}</p>
                </div>
              </div>
            }

            <!-- Product Being Reported -->
            @if (reportedProduct) {
              <div class="flex items-center space-x-3 mt-2 pt-2 border-t border-gray-200">
                <div class="flex-shrink-0">
                  @if (reportedProduct?.images?.[0]) {
                    <img [src]="reportedProduct?.images?.[0]?.url"
                         alt="Product"
                         class="w-10 h-10 rounded object-cover">
                  } @else {
                    <div class="w-10 h-10 bg-gray-300 rounded flex items-center justify-center">
                      <span class="text-gray-600 text-xs">📦</span>
                    </div>
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ reportedProduct?.title }}
                  </p>
                  <p class="text-xs text-gray-500">
                    ₱{{ reportedProduct?.price?.toLocaleString() }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Form Content -->
        <form #reportForm="ngForm" (ngSubmit)="onSubmit(reportForm)" class="px-6 py-4">
          <!-- Report Type Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              What type of issue are you reporting?
            </label>

            <!-- Category Tabs -->
            <div class="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
              <button type="button"
                      *ngFor="let category of reportCategories"
                      (click)="selectedCategory.set(category.key)"
                      [class]="getCategoryButtonClass(category.key)"
                      class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors">
                {{ category.label }}
              </button>
            </div>

            <!-- Report Types for Selected Category -->
            <div class="space-y-2">
              <div *ngFor="let type of filteredReportTypes()" class="flex items-start">
                <input type="radio"
                       [id]="'type-' + type.value"
                       name="reportType"
                       [value]="type.value"
                       [(ngModel)]="reportData.type"
                       required
                       class="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300">
                <label [for]="'type-' + type.value"
                       class="ml-3 block text-sm cursor-pointer">
                  <span class="font-medium text-gray-900">{{ type.label }}</span>
                  <span class="block text-gray-500">{{ type.description }}</span>
                </label>
              </div>
            </div>

            <div *ngIf="reportForm.submitted && reportData.type === ''"
                 class="mt-2 text-sm text-red-600">
              Please select a report type
            </div>
          </div>

          <!-- Reason -->
          <div class="mb-6">
            <label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
              Brief reason (required)
            </label>
            <input type="text"
                   id="reason"
                   name="reason"
                   [(ngModel)]="reportData.reason"
                   required
                   maxlength="100"
                   placeholder="Brief summary of the issue"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
            <div class="mt-1 flex justify-between">
              <div *ngIf="reportForm.submitted && reportData.reason.trim() === ''"
                   class="text-sm text-red-600">
                Reason is required
              </div>
              <span class="text-xs text-gray-500">
                {{ reportData.reason.length }}/100 characters
              </span>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-6">
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Detailed description (required)
            </label>
            <textarea id="description"
                     name="description"
                     [(ngModel)]="reportData.description"
                     required
                     rows="4"
                     maxlength="1000"
                     placeholder="Please provide specific details about this issue. Include what happened, when it happened, and any other relevant information."
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"></textarea>
            <div class="mt-1 flex justify-between">
              <div *ngIf="reportForm.submitted && reportData.description.trim() === ''"
                   class="text-sm text-red-600">
                Description is required
              </div>
              <span class="text-xs text-gray-500">
                {{ reportData.description.length }}/1000 characters
              </span>
            </div>
          </div>

          <!-- Evidence Upload (Future Enhancement) -->
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <span class="text-blue-500">ℹ️</span>
              </div>
              <div class="ml-3">
                <h4 class="text-sm font-medium text-blue-900">Evidence</h4>
                <p class="mt-1 text-sm text-blue-700">
                  If you have screenshots or other evidence, you can add them after submitting this report
                  by contacting our support team or responding to the confirmation email.
                </p>
              </div>
            </div>
          </div>

          <!-- Warning Message -->
          <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <span class="text-amber-500">⚠️</span>
              </div>
              <div class="ml-3">
                <h4 class="text-sm font-medium text-amber-900">Important</h4>
                <p class="mt-1 text-sm text-amber-700">
                  False reports may result in action against your account. Please ensure your report is accurate and made in good faith.
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button"
                    (click)="close()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Cancel
            </button>
            <button type="submit"
                    [disabled]="isSubmitting() || !reportForm.valid"
                    class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSubmitting() ? 'Submitting...' : 'Submit Report' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class ReportModalComponent implements OnInit {
  @Input() reportedUser: User | null = null;
  @Input() reportedProduct: Product | null = null;
  @Input() reportSource: string = 'other';
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<any>();

  isVisible = signal(false);
  isSubmitting = signal(false);
  selectedCategory = signal<string>('fraud');

  reportData = {
    type: '',
    reason: '',
    description: ''
  };

  reportTypes: ReportType[] = [
    // Fraud Category
    { value: 'fraud', label: 'Fraudulent Activity', description: 'Scam, fake payment, or fraudulent business practices', category: 'fraud' },
    { value: 'scam', label: 'Scam', description: 'Attempt to deceive or defraud users', category: 'fraud' },
    { value: 'fake_listing', label: 'Fake Listing', description: 'Product doesn\'t exist or misleading information', category: 'fraud' },
    { value: 'payment_issues', label: 'Payment Issues', description: 'Problems with payment or refunds', category: 'fraud' },
    { value: 'no_show', label: 'No Show', description: 'User didn\'t show up for agreed meetup', category: 'fraud' },

    // Behavior Category
    { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or abusive behavior', category: 'behavior' },
    { value: 'inappropriate_behavior', label: 'Inappropriate Behavior', description: 'Unprofessional or offensive conduct', category: 'behavior' },
    { value: 'spam', label: 'Spam', description: 'Excessive messaging or unwanted communications', category: 'behavior' },

    // Content Category
    { value: 'fake_products', label: 'Counterfeit Products', description: 'Selling fake or counterfeit items', category: 'content' },
    { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'Offensive or inappropriate images or text', category: 'content' },
    { value: 'misleading_description', label: 'Misleading Description', description: 'Product description doesn\'t match reality', category: 'content' },

    // Technical Category
    { value: 'other', label: 'Other', description: 'Issue not covered by other categories', category: 'technical' }
  ];

  reportCategories = [
    { key: 'fraud', label: '💰 Fraud' },
    { key: 'behavior', label: '👥 Behavior' },
    { key: 'content', label: '📄 Content' },
    { key: 'technical', label: '🔧 Other' }
  ];

  filteredReportTypes = computed(() => {
    return this.reportTypes.filter(type => type.category === this.selectedCategory());
  });

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Reset form when component initializes
    this.resetForm();
  }

  show() {
    this.isVisible.set(true);
    this.resetForm();
    // Focus management could be added here
  }

  close() {
    this.isVisible.set(false);
    this.isSubmitting.set(false);
    this.resetForm();
    this.closed.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  resetForm() {
    this.reportData = {
      type: '',
      reason: '',
      description: ''
    };
    this.selectedCategory.set('fraud');
  }

  getReportTargetType(): string {
    if (this.reportedProduct) return 'Product';
    if (this.reportedUser) return 'User';
    return 'Issue';
  }

  getInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return '?';
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  }

  getCategoryButtonClass(category: string): string {
    const base = 'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors';
    const active = 'bg-white text-gray-900 shadow';
    const inactive = 'text-gray-600 hover:text-gray-900';

    return this.selectedCategory() === category ? `${base} ${active}` : `${base} ${inactive}`;
  }

  async onSubmit(form: NgForm) {
    if (!form.valid) return;

    if (!this.reportedUser) {
      console.error('No user to report');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const payload = {
        reportedUser: this.reportedUser?._id,
        reportedProduct: this.reportedProduct?._id || null,
        type: this.reportData.type,
        reason: this.reportData.reason.trim(),
        description: this.reportData.description.trim(),
        reportSource: this.reportSource
      };

      const response = await firstValueFrom(
        this.http.post<any>('/api/reports', payload, { headers })
      );

      console.log('Report submitted successfully:', response);

      // Emit success event
      this.submitted.emit({
        success: true,
        report: response.report,
        message: response.message
      });

      // Show success message (you might want to use a toast service)
      alert('Report submitted successfully. We will review it and take appropriate action.');

      this.close();
    } catch (error: any) {
      console.error('Error submitting report:', error);

      let errorMessage = 'Failed to submit report. Please try again.';

      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Emit error event
      this.submitted.emit({
        success: false,
        error: errorMessage
      });

      alert(errorMessage);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}