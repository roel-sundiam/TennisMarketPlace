import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoinService } from '../services/coin.service';

@Component({
  selector: 'app-low-balance-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-4 pt-16 md:pt-4" (click)="closeModal()">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-auto my-8 md:my-auto overflow-hidden relative" (click)="$event.stopPropagation()">
        
        <!-- Modal Header -->
        <div class="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-200 dark:border-red-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-100 dark:bg-red-800/50 rounded-full flex items-center justify-center">
                <span class="text-red-600 dark:text-red-400 text-xl">⚠️</span>
              </div>
              <h2 class="text-xl font-bold text-red-800 dark:text-red-300">Insufficient Coins</h2>
            </div>
            <button 
              (click)="closeModal()"
              class="text-red-400 hover:text-red-600 dark:hover:text-red-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="p-6">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">💸</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Your coin balance is negative!
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              You currently have <span class="font-bold text-red-600">{{ currentBalance() }} coins</span>. 
              You need to purchase more coins to continue using TennisMarket.
            </p>
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div class="flex items-start gap-3">
                <span class="text-yellow-600 dark:text-yellow-400 text-xl">💡</span>
                <div class="text-left">
                  <h4 class="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Why do I need coins?</h4>
                  <ul class="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    <li>• Viewing products helps maintain our marketplace</li>
                    <li>• Selling products requires a 10% transaction fee</li>
                    <li>• Coins support our tennis community platform</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button 
              (click)="openCoinPurchase()"
              class="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px] touch-manipulation">
              <span class="flex items-center justify-center gap-2">
                💰 Buy Coins Now
              </span>
            </button>
            <button 
              (click)="closeModal()"
              class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Enhanced mobile styling */
    @media (max-width: 768px) {
      .fixed.inset-0 {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 9999 !important;
      }

      button {
        min-height: 44px;
        touch-action: manipulation;
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
export class LowBalanceModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() openPurchase = new EventEmitter<void>();

  private coinService = inject(CoinService);
  protected currentBalance = signal<number>(0);

  ngOnInit() {
    // Get current balance from coin service
    this.coinService.coinBalance$.subscribe(balance => {
      this.currentBalance.set(balance.balance);
    });
  }

  protected closeModal() {
    this.close.emit();
  }

  protected openCoinPurchase() {
    this.openPurchase.emit();
    this.closeModal();
  }
}