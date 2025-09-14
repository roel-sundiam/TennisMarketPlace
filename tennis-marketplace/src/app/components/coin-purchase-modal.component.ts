import { Component, signal, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoinService, CoinPackage, PaymentMethod } from '../services/coin.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-coin-purchase-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-4 pt-16 md:pt-4" (click)="closeModal()">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-auto my-8 md:my-auto max-h-[85vh] md:max-h-[80vh] overflow-y-auto relative" (click)="$event.stopPropagation()">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Purchase Coins</h2>
          <button 
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6">
          @if (step() === 'packages') {
            <!-- Package Selection -->
            <div class="space-y-4">
              <p class="text-gray-600 dark:text-gray-400">Choose a coin package:</p>
              
              @for (pkg of packages(); track pkg.id) {
                <div 
                  class="border-2 rounded-lg p-4 cursor-pointer transition-colors touch-manipulation"
                  [class]="selectedPackage() === pkg.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-300'"
                  (click)="selectPackage(pkg)">
                  
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="font-bold text-lg capitalize">{{ pkg.id }}</h3>
                      <div class="text-sm text-gray-600 dark:text-gray-400">
                        <span class="font-medium">{{ pkg.coins }}</span> coins
                        @if (pkg.bonus && pkg.bonus > 0) {
                          <span class="text-green-600 dark:text-green-400">+ {{ pkg.bonus }} bonus</span>
                        }
                      </div>
                      @if (pkg.popular) {
                        <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mt-1">Most Popular</span>
                      }
                    </div>
                    <div class="text-right">
                      <div class="text-xl font-bold text-green-600">₱{{ pkg.price }}</div>
                      @if (pkg.bonus && pkg.bonus > 0) {
                        <div class="text-xs text-gray-500">{{ pkg.originalCoins }} + {{ pkg.bonus }} bonus</div>
                      }
                    </div>
                  </div>
                </div>
              }
              
              <button 
                (click)="nextStep()"
                [disabled]="!selectedPackage()"
                class="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation">
                Continue to Payment
              </button>
            </div>
          }

          @else if (step() === 'payment') {
            <!-- Payment Method Selection -->
            <div class="space-y-4">
              <button 
                (click)="previousStep()"
                class="text-green-600 hover:text-green-700 text-sm flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Packages
              </button>
              
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h3 class="font-medium">Selected Package</h3>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {{ getSelectedPackageInfo()?.coins }} coins + {{ getSelectedPackageInfo()?.bonus || 0 }} bonus = 
                  <span class="font-medium">{{ getTotalCoins() }} coins</span> for 
                  <span class="font-bold text-green-600">₱{{ getSelectedPackageInfo()?.price }}</span>
                </div>
              </div>
              
              <p class="text-gray-600 dark:text-gray-400">Choose payment method:</p>
              
              @for (method of paymentMethods(); track method.id) {
                <div 
                  class="border-2 rounded-lg p-3 cursor-pointer transition-colors"
                  [class]="selectedPaymentMethod() === method.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-300'"
                  (click)="selectPaymentMethod(method.id)">
                  
                  <div class="flex items-center">
                    <div class="flex-1">
                      <h4 class="font-medium">{{ method.name }}</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ method.description }}</p>
                      <p class="text-xs text-gray-500">{{ method.fees }}</p>
                    </div>
                    @if (method.popular) {
                      <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Popular</span>
                    }
                  </div>
                </div>
              }

              @if (selectedPaymentMethod() === 'gcash') {
                <div class="space-y-3 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <label class="block text-sm font-medium">GCash Mobile Number</label>
                  <input 
                    [(ngModel)]="paymentDetails.mobileNumber"
                    type="tel" 
                    placeholder="09XXXXXXXXX"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
              }

              <!-- Payment Instructions -->
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                <div class="flex items-start gap-3">
                  <div class="text-blue-600 dark:text-blue-400 text-xl">💳</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-blue-800 dark:text-blue-300 mb-2">Payment Instructions</h4>
                    <p class="text-sm text-blue-700 dark:text-blue-400 mb-2">
                      Complete your payment via <strong>GCash</strong> or <strong>Bank Transfer</strong>:
                    </p>
                    <div class="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-3 mb-2">
                      <div class="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-medium">
                        <span>📱</span>
                        <span>Call/Text: <strong>09175105185</strong></span>
                      </div>
                    </div>
                    <p class="text-xs text-blue-600 dark:text-blue-400">
                      After payment, your coins will be credited within 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                (click)="processPurchase()"
                [disabled]="!selectedPaymentMethod() || isProcessing()"
                class="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation">
                @if (isProcessing()) {
                  <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Processing...
                } @else {
                  Confirm Order - ₱{{ getSelectedPackageInfo()?.price }}
                }
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Enhanced mobile styling */
    @media (max-width: 768px) {
      /* Ensure modal is visible on mobile */
      .fixed.inset-0 {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 9999 !important;
      }

      /* Make buttons more touch-friendly on mobile */
      button {
        min-height: 44px;
        touch-action: manipulation;
      }

      /* Better spacing for mobile */
      .modal-content {
        padding: 1rem;
      }
    }

    /* Desktop positioning */
    @media (min-width: 769px) {
      .fixed.inset-0 {
        padding-top: 2rem;
        padding-bottom: 2rem;
      }
    }
  `]
})
export class CoinPurchaseModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() purchaseComplete = new EventEmitter<any>();

  private coinService = inject(CoinService);
  private destroy$ = new Subject<void>();

  protected step = signal<'packages' | 'payment'>('packages');
  protected packages = signal<CoinPackage[]>([]);
  protected paymentMethods = signal<PaymentMethod[]>([]);
  protected selectedPackage = signal<string>('');
  protected selectedPaymentMethod = signal<string>('');
  protected isProcessing = signal<boolean>(false);
  
  protected paymentDetails: any = {
    mobileNumber: ''
  };

  ngOnInit() {
    this.loadPackages();
    this.loadPaymentMethods();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPackages() {
    this.coinService.getCoinPackages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.packages.set(response.packages);
        },
        error: (error) => {
          console.error('Failed to load packages:', error);
        }
      });
  }

  private loadPaymentMethods() {
    this.coinService.getPaymentMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.paymentMethods.set(response.paymentMethods);
        },
        error: (error) => {
          console.error('Failed to load payment methods:', error);
        }
      });
  }

  protected selectPackage(pkg: CoinPackage) {
    this.selectedPackage.set(pkg.id);
  }

  protected selectPaymentMethod(methodId: string) {
    this.selectedPaymentMethod.set(methodId);
  }

  protected nextStep() {
    if (this.selectedPackage()) {
      this.step.set('payment');
    }
  }

  protected previousStep() {
    this.step.set('packages');
  }

  protected getSelectedPackageInfo(): CoinPackage | undefined {
    return this.packages().find(pkg => pkg.id === this.selectedPackage());
  }

  protected getTotalCoins(): number {
    const pkg = this.getSelectedPackageInfo();
    return pkg ? pkg.coins + (pkg.bonus || 0) : 0;
  }

  protected processPurchase() {
    if (!this.selectedPackage() || !this.selectedPaymentMethod()) {
      return;
    }

    this.isProcessing.set(true);

    const paymentDetails = {
      ...this.paymentDetails,
      transactionRef: `${this.selectedPaymentMethod().toUpperCase()}-${Date.now()}`
    };

    this.coinService.purchaseCoins(
      this.selectedPackage(),
      this.selectedPaymentMethod(),
      paymentDetails
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        this.isProcessing.set(false);
        this.purchaseComplete.emit(result);
        this.closeModal();
      },
      error: (error) => {
        this.isProcessing.set(false);
        console.error('Purchase failed:', error);
        alert('Purchase failed: ' + (error.error?.error || error.message));
      }
    });
  }

  protected closeModal() {
    this.close.emit();
  }
}