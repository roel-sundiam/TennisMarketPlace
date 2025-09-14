import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoinService, CoinBalance } from '../services/coin.service';
import { AuthService } from '../services/auth.service';
import { CoinPurchaseModalComponent } from './coin-purchase-modal.component';

@Component({
  selector: 'app-coin-balance',
  standalone: true,
  imports: [CommonModule, CoinPurchaseModalComponent],
  template: `
    <div class="coin-balance-container">
      @if (authService.isAuthenticated()) {
        <!-- Mobile Header Layout (Compact for header) -->
        <div class="sm:hidden">
          <!-- Compact mobile header version -->
          <div class="flex items-center gap-1">
            <!-- Coin Balance Display -->
            <div class="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/30">
              <div class="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <span class="text-xs font-bold text-white">₱</span>
              </div>
              <span class="font-bold text-sm" [class]="coinBalance().balance < 0 ? 'text-red-200' : 'text-white'">{{ coinBalance().balance }}</span>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-1">
              <!-- Buy Coins Button -->
              <button 
                (click)="openCoinPurchase()"
                class="px-2 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg backdrop-blur-sm border border-blue-400/50 transition-colors min-h-[32px]"
                title="Buy coins">
                +
              </button>
            </div>
          </div>
          
          <!-- Low Balance Banner (appears below header when balance is low) -->
          @if (coinBalance().balance < 25) {
            <div class="fixed top-16 left-0 right-0 z-30 bg-orange-500 text-white px-4 py-2 shadow-lg animate-slide-down">
              <div class="max-w-7xl mx-auto flex items-center justify-between">
                <span class="text-sm font-medium">⚠️ Low coin balance: {{ coinBalance().balance }} coins</span>
                <button 
                  (click)="openCoinPurchase()" 
                  class="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors backdrop-blur-sm">
                  Buy More
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Desktop Layout -->
        <div class="hidden sm:flex items-center space-x-3">
          <!-- Coin Balance Display -->
          <div class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
            <div class="flex items-center space-x-1">
              <div class="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <span class="text-xs font-bold text-white">₱</span>
              </div>
              <span class="font-semibold" [class]="coinBalance().balance < 0 ? 'text-red-600' : 'text-green-800'">{{ coinBalance().balance }}</span>
              <span class="text-sm text-green-600">coins</span>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex space-x-1">
              <!-- Buy Coins Button -->
              <button 
                (click)="openCoinPurchase()"
                class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Purchase more coins">
                +
              </button>
            </div>
          </div>

          <!-- Low Balance Warning for Desktop -->
          @if (coinBalance().balance < 25) {
            <div class="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Low balance! <button (click)="openCoinPurchase()" class="underline">Buy more</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Success Message -->
    @if (successMessage()) {
      <div class="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm">{{ successMessage() }}</span>
          <button (click)="clearSuccessMessage()" class="ml-2 text-green-700 hover:text-green-900">
            ×
          </button>
        </div>
      </div>
    }

    <!-- Error Message -->
    @if (errorMessage()) {
      <div class="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm">{{ errorMessage() }}</span>
          <button (click)="clearErrorMessage()" class="ml-2 text-red-700 hover:text-red-900">
            ×
          </button>
        </div>
      </div>
    }

    <!-- Coin Purchase Modal -->
    @if (showPurchaseModal()) {
      <app-coin-purchase-modal
        (close)="closePurchaseModal()"
        (purchaseComplete)="onPurchaseComplete($event)">
      </app-coin-purchase-modal>
    }
  `,
  styles: [`
    .coin-balance-container {
      position: relative;
      width: 100%;
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Mobile-specific styling */
    @media (max-width: 640px) {
      .coin-balance-container {
        padding: 0.5rem;
      }
      
      /* Ensure buttons are touch-friendly */
      button {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Better visibility for mobile */
      .coin-balance-container > div {
        width: 100%;
      }
    }

    /* Desktop optimization */
    @media (min-width: 641px) {
      .coin-balance-container {
        width: auto;
      }
    }
  `]
})
export class CoinBalanceComponent implements OnInit, OnDestroy {
  private coinService = inject(CoinService);
  protected authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  protected coinBalance = signal<CoinBalance>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0
  });

  protected successMessage = signal<string>('');
  protected errorMessage = signal<string>('');
  protected showPurchaseModal = signal<boolean>(false);

  ngOnInit() {
    // Subscribe to coin balance updates
    this.coinService.coinBalance$
      .pipe(takeUntil(this.destroy$))
      .subscribe(balance => {
        this.coinBalance.set(balance);
      });

    // Load initial balance if user is logged in
    if (this.authService.isAuthenticated()) {
      this.loadBalance();
    }

    // Subscribe to auth state changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        if (user) {
          this.loadBalance();
        } else {
          this.coinBalance.set({
            balance: 0,
            totalEarned: 0,
            totalSpent: 0
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBalance() {
    this.coinService.loadCoinBalance()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (balance) => {
          this.coinBalance.set(balance);
        },
        error: (error) => {
          console.error('Failed to load coin balance:', error);
        }
      });
  }


  protected openCoinPurchase() {
    this.showPurchaseModal.set(true);
  }

  protected closePurchaseModal() {
    this.showPurchaseModal.set(false);
  }

  protected onPurchaseComplete(result: any) {
    if (result.transaction.status === 'pending') {
      this.successMessage.set(
        `📝 Purchase request submitted! ${result.transaction.coinsPending} coins pending approval. Contact 09175105185 to confirm payment.`
      );
    } else {
      this.successMessage.set(
        `🎉 Purchase successful! You received ${result.transaction.coinsReceived || result.transaction.coinsPending} coins. New balance: ${result.newBalance}`
      );
    }
    this.autoHideMessage();
    // Balance will be updated automatically via the subscription (or stay same if pending)
  }

  protected clearSuccessMessage() {
    this.successMessage.set('');
  }

  protected clearErrorMessage() {
    this.errorMessage.set('');
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  private autoHideMessage() {
    setTimeout(() => {
      this.clearMessages();
    }, 3000);
  }
}