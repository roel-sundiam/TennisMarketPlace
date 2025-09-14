import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface CoinBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CoinTransaction {
  _id: string;
  type: 'earn' | 'spend' | 'purchase' | 'refund';
  amount: number;
  reason: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
  relatedProduct?: {
    _id: string;
    title: string;
  };
  relatedUser?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  metadata?: any;
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  currency: string;
  popular: boolean;
  bonus?: number;
  originalCoins?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  logo: string;
  fees: string;
  processingTime: string;
  popular: boolean;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  transaction: {
    coinsReceived: number;
    baseCoins: number;
    bonusCoins: number;
    amountPaid: number;
    currency: string;
    paymentMethod: string;
    paymentId: string;
  };
  newBalance: number;
  receipt: {
    date: string;
    packageName: string;
    description: string;
    amount: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CoinService {
  private baseUrl = 'http://localhost:5000/api';
  private coinBalanceSubject = new BehaviorSubject<CoinBalance>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0
  });

  // Public observable for components to subscribe to
  public coinBalance$ = this.coinBalanceSubject.asObservable();
  
  // Signal for reactive updates
  public coinBalance = signal<CoinBalance>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0
  });

  constructor(private http: HttpClient, private authService: AuthService) {
    // Load initial balance if user is logged in
    this.loadCoinBalance();
  }


  // Load user's current coin balance
  loadCoinBalance(): Observable<CoinBalance> {
    return this.http.get<CoinBalance>(`${this.baseUrl}/coins/balance`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(balance => {
        this.coinBalance.set(balance);
        this.coinBalanceSubject.next(balance);
      })
    );
  }


  // Get transaction history
  getTransactionHistory(page: number = 1, limit: number = 20, type?: string): Observable<{
    transactions: CoinTransaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    let params = `page=${page}&limit=${limit}`;
    if (type) params += `&type=${type}`;

    return this.http.get<any>(`${this.baseUrl}/coins/history?${params}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Spend coins for listing creation
  spendCoinsForListing(productId: string): Observable<{
    message: string;
    coinsSpent: number;
    newBalance: number;
    productTitle: string;
  }> {
    return this.http.post<any>(`${this.baseUrl}/coins/spend/listing`, {
      productId
    }, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Reload balance after spending
        this.loadCoinBalance().subscribe();
      })
    );
  }

  // Spend coins to boost listing
  boostListing(productId: string, boostType: 'basic' | 'premium' = 'basic'): Observable<{
    message: string;
    coinsSpent: number;
    newBalance: number;
    boostType: string;
    duration: number;
    expiresAt: string;
  }> {
    return this.http.post<any>(`${this.baseUrl}/coins/spend/boost`, {
      productId,
      boostType
    }, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Reload balance after spending
        this.loadCoinBalance().subscribe();
      })
    );
  }

  // Initiate sale and earn coins
  initiateSale(productId: string, buyerId: string): Observable<{
    message: string;
    coinsEarned: number;
    remainingCoins: number;
    productTitle: string;
    buyerName: string;
    confirmationRequired: boolean;
  }> {
    return this.http.post<any>(`${this.baseUrl}/coins/earn/sale`, {
      productId,
      buyerId
    }, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Reload balance after earning
        this.loadCoinBalance().subscribe();
      })
    );
  }

  // Confirm sale as buyer
  confirmSale(productId: string): Observable<{
    message: string;
    coinsEarned: number;
    productTitle: string;
    saleCompleted: boolean;
  }> {
    return this.http.post<any>(`${this.baseUrl}/coins/earn/sale/confirm`, {
      productId
    }, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Reload balance after earning
        this.loadCoinBalance().subscribe();
      })
    );
  }

  // Get available coin packages
  getCoinPackages(): Observable<{ packages: CoinPackage[] }> {
    return this.http.get<{ packages: CoinPackage[] }>(`${this.baseUrl}/coins/packages`);
  }

  // Get available payment methods
  getPaymentMethods(): Observable<{ paymentMethods: PaymentMethod[] }> {
    return this.http.get<{ paymentMethods: PaymentMethod[] }>(`${this.baseUrl}/payments/payment-methods`);
  }

  // Purchase coins
  purchaseCoins(packageId: string, paymentMethod: string, paymentDetails: any): Observable<PurchaseResult> {
    return this.http.post<PurchaseResult>(`${this.baseUrl}/payments/purchase-coins`, {
      packageId,
      paymentMethod,
      paymentDetails
    }, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Reload balance after purchase
        this.loadCoinBalance().subscribe();
      })
    );
  }

  // Get purchase history
  getPurchaseHistory(page: number = 1, limit: number = 10): Observable<{
    transactions: CoinTransaction[];
    pagination: any;
  }> {
    return this.http.get<any>(`${this.baseUrl}/payments/purchase-history?page=${page}&limit=${limit}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Helper methods for coin costs
  getListingCost(): number {
    return 10;
  }

  getBoostCost(type: 'basic' | 'premium' = 'basic'): number {
    return type === 'basic' ? 25 : 50;
  }

  // Check if user has enough coins for action
  canAfford(cost: number): boolean {
    return this.coinBalance().balance >= cost;
  }

  // Format coin amount with proper pluralization
  formatCoins(amount: number): string {
    return `${amount} ${amount === 1 ? 'coin' : 'coins'}`;
  }

  // Get coin color class for UI
  getCoinColorClass(balance: number): string {
    if (balance >= 100) return 'text-green-600';
    if (balance >= 50) return 'text-yellow-600';
    if (balance >= 25) return 'text-orange-600';
    return 'text-red-600';
  }
}