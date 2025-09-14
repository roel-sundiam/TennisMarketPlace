import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  location?: {
    city: string;
    region: string;
  };
  role: 'buyer' | 'seller' | 'admin';
  coins: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    lastDailyBonus?: string;
  };
  subscription?: {
    plan: 'free' | 'basic' | 'pro';
    remainingListings: number;
    remainingBoosts: number;
    expiresAt?: string;
  };
  profilePicture?: string;
  isVerified: boolean;
  rating: {
    average: number;
    totalReviews: number;
  };
  favorites?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  location: {
    city: string;
    region: string;
  };
  role?: 'buyer' | 'seller';
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
  requiresApproval?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static instanceCount = 0;
  private readonly API_BASE = 'http://localhost:5000/api';
  private readonly TOKEN_KEY = 'tennis-marketplace-token';
  
  // Signals for reactive state management
  currentUser = signal<User | null>(null);
  isAuthenticatedSignal = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  
  // BehaviorSubject for backwards compatibility
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    AuthService.instanceCount++;
    console.log(`🏗️ AuthService constructor called - Instance #${AuthService.instanceCount}`);
    console.trace('AuthService constructor called from:');
    
    try {
      this.initializeAuth();
    } catch (error) {
      console.error('❌ Error in initializeAuth:', error);
    }
  }

  private initializeAuth(): void {
    console.log('🚀 initializeAuth() called');
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('🎫 Token found in localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (token) {
      console.log('🔍 Token analysis:');
      console.log('  - Starts with "mock.":', token.startsWith('mock.'));
      console.log('  - Starts with "eyJ":', token.startsWith('eyJ'));
      console.log('  - Length:', token.length);
    }
    
    // Clear old non-mock tokens to force re-login with proper mock tokens
    if (token && !token.startsWith('mock.') && !token.startsWith('eyJ')) {
      console.log('🔄 Clearing old token format, forcing logout');
      console.trace('initializeAuth logout called from:');
      this.logout();
      return;
    }
    
    if (token && !this.isTokenExpired(token)) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          console.log('✅ User profile loaded successfully:', user.email);
          this.currentUser.set(user);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSignal.set(true);
        },
        error: (error) => {
          console.log('❌ Failed to load user profile:', error);
          console.log('🔄 Token exists but API call failed. This might be a network issue.');
          
          // For mock tokens, don't force logout on API failure
          if (token.startsWith('mock.')) {
            console.log('🧪 Mock token detected, keeping user logged in despite API failure');
            
            // Try to restore user from token payload
            try {
              const parts = token.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[2]));
                console.log('🔄 Restoring user from mock token payload:', payload);
                
                // Create a mock user object based on token
                const mockUser: User = this.createMockUserFromPayload(payload);
                this.currentUser.set(mockUser);
                this.currentUserSubject.next(mockUser);
                this.isAuthenticatedSignal.set(true);
                console.log('✅ Mock user restored from token');
                return;
              }
            } catch (tokenError) {
              console.error('❌ Failed to parse mock token payload:', tokenError);
            }
            
            // Don't logout for mock tokens - the backend might not be running
            return;
          }
          
          // Only logout for real JWT tokens that fail authentication
          console.log('🔑 Real token failed authentication, logging out');
          this.logout();
        }
      });
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.isLoading.set(false);
          if (response.token && response.user) {
            localStorage.setItem(this.TOKEN_KEY, response.token);
            this.currentUser.set(response.user);
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSignal.set(true);
          }
        }),
        catchError(error => {
          this.isLoading.set(false);
          console.error('Real API login failed:', error);
          throw error; // Let the component handle the error and fallback
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE}/auth/register`, userData)
      .pipe(
        tap(response => {
          this.isLoading.set(false);
          // Only auto-login if registration is successful AND doesn't require approval
          if (response.token && response.user && !response.requiresApproval) {
            localStorage.setItem(this.TOKEN_KEY, response.token);
            this.currentUser.set(response.user);
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSignal.set(true);
          }
          // If requiresApproval is true, don't auto-login even if token is present
        }),
        catchError(error => {
          // Ensure loading state is reset even on error
          this.isLoading.set(false);
          throw error;
        })
      );
  }

  logout(): void {
    console.log('🚪 LOGOUT CALLED - Stack trace:');
    console.trace('Logout called from:');
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/']);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_BASE}/auth/me`, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfile(userData: Partial<User>): Observable<AuthResponse> {
    this.isLoading.set(true);
    
    return this.http.put<User>(`${this.API_BASE}/auth/me`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(user => {
        this.isLoading.set(false);
        this.currentUser.set(user);
        this.currentUserSubject.next(user);
      }),
      map(user => ({ message: 'Profile updated successfully', user }))
    );
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal() && !!this.currentUser();
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('🎫 getToken() called, found token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    // If we have an old token format, clear it and return null
    if (token && !token.startsWith('mock.') && !token.startsWith('eyJ')) {
      console.log('🔄 Found old token format, clearing and forcing re-auth');
      console.trace('Old token format clearing called from:');
      localStorage.removeItem(this.TOKEN_KEY);
      this.currentUser.set(null);
      this.currentUserSubject.next(null);
      this.isAuthenticatedSignal.set(false);
      return null;
    }
    
    return token;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  // Mock authentication for development (when backend is not available)
  mockLogin(email: string, password: string): Observable<AuthResponse> {
    this.isLoading.set(true);
    
    return new Observable(observer => {
      setTimeout(() => {
        this.isLoading.set(false);
        
        if (email === 'admin@tennis.com' && password === 'admin123') {
          const mockUser: User = {
            _id: '68c177e06ecda66656bf1e36',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@tennis.com',
            phoneNumber: '+63 917 123 4567',
            role: 'admin',
            coins: {
              balance: 100,
              totalEarned: 100,
              totalSpent: 0,
              lastDailyBonus: new Date().toISOString()
            },
            subscription: {
              plan: 'pro',
              remainingListings: -1,
              remainingBoosts: 5
            },
            location: {
              city: 'Manila',
              region: 'Metro Manila'
            },
            isVerified: true,
            rating: {
              average: 5.0,
              totalReviews: 0
            },
            isActive: true,
            createdAt: '2023-01-15',
            updatedAt: '2023-01-15'
          };
          
          const mockToken = this.generateMockToken(mockUser);
          localStorage.setItem(this.TOKEN_KEY, mockToken);
          this.currentUser.set(mockUser);
          this.currentUserSubject.next(mockUser);
          this.isAuthenticatedSignal.set(true);
          
          observer.next({
            message: 'Login successful',
            token: mockToken,
            user: mockUser
          });
        } else if (email === 'user@tennis.com' && password === 'user123') {
          const mockUser: User = {
            _id: '507f1f77bcf86cd799439012',
            firstName: 'Tennis',
            lastName: 'Player',
            email: 'user@tennis.com',
            phoneNumber: '+63 918 765 4321',
            role: 'seller',
            coins: {
              balance: 50,
              totalEarned: 75,
              totalSpent: 25,
              lastDailyBonus: '2024-01-10'
            },
            subscription: {
              plan: 'basic',
              remainingListings: 15,
              remainingBoosts: 1
            },
            location: {
              city: 'Quezon City',
              region: 'Metro Manila'
            },
            isVerified: false,
            rating: {
              average: 4.5,
              totalReviews: 10
            },
            isActive: true,
            createdAt: '2024-03-20',
            updatedAt: '2024-03-20'
          };
          
          const mockToken = this.generateMockToken(mockUser);
          localStorage.setItem(this.TOKEN_KEY, mockToken);
          this.currentUser.set(mockUser);
          this.currentUserSubject.next(mockUser);
          this.isAuthenticatedSignal.set(true);
          
          observer.next({
            message: 'Login successful',
            token: mockToken,
            user: mockUser
          });
        } else {
          observer.next({
            message: 'Invalid email or password'
          });
        }
        observer.complete();
      }, 1000); // Simulate network delay
    });
  }

  mockRegister(userData: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    
    return new Observable(observer => {
      setTimeout(() => {
        this.isLoading.set(false);
        
        const mockUser: User = {
          _id: `user_${Date.now()}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          role: userData.role || 'buyer',
          coins: {
            balance: 20,
            totalEarned: 20,
            totalSpent: 0
          },
          subscription: {
            plan: 'free',
            remainingListings: 3,
            remainingBoosts: 0
          },
          location: userData.location,
          isVerified: false,
          rating: {
            average: 0,
            totalReviews: 0
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const mockToken = this.generateMockToken(mockUser);
        localStorage.setItem(this.TOKEN_KEY, mockToken);
        this.currentUser.set(mockUser);
        this.isAuthenticatedSignal.set(true);
        
        observer.next({
          message: 'Registration successful',
          token: mockToken,
          user: mockUser
        });
        observer.complete();
      }, 1500);
    });
  }

  private generateMockToken(user: User): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      userId: user._id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days (longer for development)
    };
    
    // This is a mock token - in production, this would be generated by the backend
    return `mock.${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}`;
  }

  private createMockUserFromPayload(payload: any): User {
    // Create mock user based on token payload
    if (payload.email === 'admin@tennis.com') {
      return {
        _id: payload.userId,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@tennis.com',
        phoneNumber: '+63 917 123 4567',
        role: 'admin',
        coins: {
          balance: 100,
          totalEarned: 100,
          totalSpent: 0,
          lastDailyBonus: new Date().toISOString()
        },
        subscription: {
          plan: 'pro',
          remainingListings: -1,
          remainingBoosts: 5
        },
        location: {
          city: 'Manila',
          region: 'Metro Manila'
        },
        isVerified: true,
        rating: {
          average: 5.0,
          totalReviews: 0
        },
        isActive: true,
        createdAt: '2023-01-15',
        updatedAt: '2023-01-15'
      };
    } else if (payload.email === 'user@tennis.com') {
      return {
        _id: payload.userId,
        firstName: 'Tennis',
        lastName: 'Player',
        email: 'user@tennis.com',
        phoneNumber: '+63 918 765 4321',
        role: 'seller',
        coins: {
          balance: 50,
          totalEarned: 75,
          totalSpent: 25,
          lastDailyBonus: '2024-01-10'
        },
        subscription: {
          plan: 'basic',
          remainingListings: 15,
          remainingBoosts: 1
        },
        location: {
          city: 'Quezon City',
          region: 'Metro Manila'
        },
        isVerified: false,
        rating: {
          average: 4.5,
          totalReviews: 10
        },
        isActive: true,
        createdAt: '2024-03-20',
        updatedAt: '2024-03-20'
      };
    } else {
      // Generic mock user for unknown emails
      return {
        _id: payload.userId,
        firstName: 'Unknown',
        lastName: 'User',
        email: payload.email,
        role: 'buyer',
        coins: {
          balance: 20,
          totalEarned: 20,
          totalSpent: 0
        },
        subscription: {
          plan: 'free',
          remainingListings: 3,
          remainingBoosts: 0
        },
        location: {
          city: 'Manila',
          region: 'Metro Manila'
        },
        isVerified: false,
        rating: {
          average: 0,
          totalReviews: 0
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }
}