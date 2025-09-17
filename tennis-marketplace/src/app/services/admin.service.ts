import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface AdminProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  brand: string;
  images: Array<{url: string; alt: string; isMain: boolean}>;
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    rating: {
      average: number;
      totalReviews: number;
    };
    isVerified: boolean;
  };
  location: {
    city: string;
    region: string;
  };
  availability: 'available' | 'pending' | 'sold' | 'reserved';
  views: number;
  favorites: number;
  isBoosted: boolean;
  boostExpiresAt?: string;
  isApproved: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingApproval: number;
  totalTransactions: number;
  monthlyRevenue: number;
  boostedListings: number;
  subscriptions: {
    free: number;
    basic: number;
    pro: number;
  };
}

export interface CoinStats {
  summary: {
    totalUsers: number;
    totalCoinsInCirculation: number;
    totalTransactions: number;
    totalEarned: number;
    totalSpent: number;
    totalPurchased: number;
  };
  recentTransactions: CoinTransaction[];
  topUsers: any[];
  dailyActivity: any[];
}

export interface CoinTransaction {
  _id: string;
  user: string;
  type: 'earn' | 'spend' | 'purchase' | 'refund';
  amount: number;
  reason: string;
  description: string;
  balanceAfter: number;
  metadata?: any;
  createdAt: string;
}

export interface UserCoinDetails {
  user: {
    id: string;
    name: string;
    email: string;
    coins: {
      balance: number;
      totalEarned: number;
      totalSpent: number;
      lastDailyBonus: string | null;
    };
    isActive: boolean;
    joinedAt: string;
  };
  transactions: {
    transactions: CoinTransaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface SuspiciousActivities {
  highEarners: any[];
  rapidSpenders: any[];
  unusualPatterns: any[];
  failedTransactions: any[];
}

export interface ProductsResponse {
  products: AdminProduct[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_BASE = environment.apiUrl;
  
  isLoading = signal<boolean>(false);

  constructor() {}

  private getAuthHeaders() {
    return this.authService.getAuthHeaders();
  }

  // Get all products (including pending ones) - admin only
  getAllProducts(params: {
    page?: number;
    limit?: number;
    status?: 'all' | 'pending' | 'approved' | 'rejected';
    search?: string;
  } = {}): Observable<ProductsResponse> {
    this.isLoading.set(true);
    
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    
    // Use the new admin endpoint we created
    const url = `${this.API_BASE}/products/admin/all?${searchParams.toString()}`;
    
    return this.http.get<ProductsResponse>(url, {
      headers: this.getAuthHeaders()
    });
  }

  // Get pending products specifically
  getPendingProducts(): Observable<AdminProduct[]> {
    this.isLoading.set(true);
    
    return this.http.get<AdminProduct[]>(`${this.API_BASE}/products/admin/pending`, {
      headers: this.getAuthHeaders()
    });
  }

  // Approve a product
  approveProduct(productId: string, notes?: string): Observable<{message: string; product: AdminProduct}> {
    return this.http.put<{message: string; product: AdminProduct}>(
      `${this.API_BASE}/products/${productId}/approve`,
      { status: 'approved', notes: notes || '' },
      { headers: this.getAuthHeaders() }
    );
  }

  // Reject a product
  rejectProduct(productId: string, notes?: string): Observable<{message: string; product: AdminProduct}> {
    return this.http.put<{message: string; product: AdminProduct}>(
      `${this.API_BASE}/products/${productId}/approve`,
      { status: 'rejected', notes: notes || '' },
      { headers: this.getAuthHeaders() }
    );
  }

  // Get admin statistics
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.API_BASE}/products/admin/stats`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all users - admin only
  getAllUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  } = {}): Observable<any> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.role) searchParams.append('role', params.role);
    if (params.status) searchParams.append('status', params.status);

    return this.http.get(`${this.API_BASE}/users?${searchParams.toString()}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get user approval statistics - admin only
  getUserApprovalStats(): Observable<{
    pendingUsers: number;
    activeUsers: number;
    totalUsers: number;
    approvalRate: number;
  }> {
    return this.http.get<{
      pendingUsers: number;
      activeUsers: number;
      totalUsers: number;
      approvalRate: number;
    }>(`${this.API_BASE}/users/approval-stats`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get pending users for approval - admin only
  getPendingUsers(params: {
    page?: number;
    limit?: number;
  } = {}): Observable<{
    users: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.http.get<{
      users: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalUsers: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`${this.API_BASE}/users/pending-approval?${searchParams.toString()}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Temporary method to get all products by making direct API call that bypasses the approved filter
  getProductsDirectFromMongo(includeAll: boolean = false): Observable<AdminProduct[]> {
    // We'll use the regular products API but we need to modify the backend to support admin access
    // For now, let's try to get all products by making a direct call
    const url = includeAll 
      ? `${this.API_BASE}/products/admin/all`  // New endpoint we'll create
      : `${this.API_BASE}/products?limit=100`; // Get many products

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    });
  }

  // Coin Management Methods
  
  // Get coin system statistics
  getCoinStats(): Observable<CoinStats> {
    return this.http.get<CoinStats>(`${this.API_BASE}/admin/coins/stats`, {
      headers: this.getAuthHeaders()
    });
  }

  // Award coins to a user
  awardCoins(userId: string, amount: number, reason: string, description: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/admin/coins/award`, {
      userId,
      amount,
      reason,
      description
    }, {
      headers: this.getAuthHeaders()
    });
  }

  // Deduct coins from a user
  deductCoins(userId: string, amount: number, reason: string, description: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/admin/coins/deduct`, {
      userId,
      amount,
      reason,
      description
    }, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all users' coin balances
  getCoinBalances(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    role?: string;
    search?: string;
  } = {}): Observable<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.API_BASE}/admin/coins/balances?${queryString}` : `${this.API_BASE}/admin/coins/balances`;
    
    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }

  // Get user coin details
  getUserCoinDetails(userId: string, page: number = 1, limit: number = 20): Observable<UserCoinDetails> {
    return this.http.get<UserCoinDetails>(`${this.API_BASE}/admin/coins/user/${userId}?page=${page}&limit=${limit}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Refund a transaction
  refundTransaction(transactionId: string, reason?: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/admin/coins/refund`, {
      transactionId,
      reason
    }, {
      headers: this.getAuthHeaders()
    });
  }

  // Get suspicious activities
  getSuspiciousActivities(): Observable<SuspiciousActivities> {
    return this.http.get<SuspiciousActivities>(`${this.API_BASE}/admin/coins/suspicious`, {
      headers: this.getAuthHeaders()
    });
  }

  // User approval methods
  
  // Approve a user account
  approveUser(userId: string, notes?: string): Observable<{message: string; user: any}> {
    return this.http.post<{message: string; user: any}>(
      `${this.API_BASE}/users/${userId}/approve`,
      { notes: notes || '' },
      { headers: this.getAuthHeaders() }
    );
  }

  // Reject/suspend a user account
  rejectUser(userId: string, reason?: string): Observable<{message: string; user: any}> {
    return this.http.put<{message: string; user: any}>(
      `${this.API_BASE}/users/${userId}/status`,
      { isActive: false, reason: reason || '' },
      { headers: this.getAuthHeaders() }
    );
  }

  // Approve all pending users
  approveAllUsers(): Observable<{message: string; approvedCount: number}> {
    return this.http.post<{message: string; approvedCount: number}>(
      `${this.API_BASE}/users/approve-all`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Delete a product (admin)
  deleteProduct(productId: string): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.API_BASE}/products/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Update a product (admin)
  updateProduct(productId: string, productData: Partial<AdminProduct>): Observable<AdminProduct> {
    return this.http.put<AdminProduct>(
      `${this.API_BASE}/products/${productId}`,
      productData,
      { headers: this.getAuthHeaders() }
    );
  }
}