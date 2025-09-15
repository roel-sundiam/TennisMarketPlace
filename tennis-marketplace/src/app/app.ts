import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ProductCardComponent } from './components/product-card.component';
import { Product, ProductService, ProductsResponse } from './services/product.service';
import { PriceComponent } from './components/price.component';
import { AuthService } from './services/auth.service';
import { CoinBalanceComponent } from './components/coin-balance.component';
import { CoinService } from './services/coin.service';
import { ThemeToggleComponent } from './components/theme-toggle.component';
import { ThemeService } from './services/theme.service';
import { PWAInstallPromptComponent } from './components/pwa-install-prompt.component';
import { PWAService } from './services/pwa.service';
import { ToastNotificationComponent } from './components/toast-notification.component';
import { ModalComponent } from './components/modal.component';
import { LowBalanceModalComponent } from './components/low-balance-modal.component';
import { CoinPurchaseModalComponent } from './components/coin-purchase-modal.component';
import { ReportModalComponent } from './components/report-modal.component';
import { AnalyticsService } from './services/analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, ProductCardComponent, PriceComponent, CoinBalanceComponent, ThemeToggleComponent, PWAInstallPromptComponent, ToastNotificationComponent, ModalComponent, LowBalanceModalComponent, CoinPurchaseModalComponent, ReportModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Baseline Gearhub');
  isHomePage = signal(true);
  showMobileMenu = signal(false);
  
  private router = inject(Router);
  public authService = inject(AuthService);
  private productService = inject(ProductService);
  private coinService = inject(CoinService);
  private themeService = inject(ThemeService);
  private pwaService = inject(PWAService);
  private analyticsService = inject(AnalyticsService);
  private destroy$ = new Subject<void>();
  
  // Dynamic product data from API
  products = signal<Product[]>([]);
  isLoadingProducts = signal<boolean>(false);
  categories = signal<Array<{name: string, icon: string, count: string}>>([]);

  // Modal state for coin balance restrictions
  showLowBalanceModal = signal<boolean>(false);
  showCoinPurchaseModal = signal<boolean>(false);

  // Report modal state
  showReportModal = signal<boolean>(false);
  reportingProduct = signal<Product | null>(null);

  constructor() {}

  ngOnInit() {
    // Track route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      console.log('Route changed to:', event.url);
      this.isHomePage.set(this.isHomeRoute(event.url));
      console.log('Is home page:', this.isHomePage());
      
      // Track page view analytics
      this.analyticsService.trackPageView(event.url, {
        isHomePage: this.isHomeRoute(event.url),
        isAuthenticated: this.authService.isAuthenticated(),
        userRole: this.authService.currentUser()?.role
      }).catch(error => {
        console.error('Failed to track page view:', error);
      });
    });

    // Set initial value
    const initialUrl = this.router.url;
    console.log('Initial URL:', initialUrl);
    this.isHomePage.set(this.isHomeRoute(initialUrl));
    console.log('Initial is home page:', this.isHomePage());
    
    // Track initial page view
    this.analyticsService.trackPageView(initialUrl, {
      isHomePage: this.isHomeRoute(initialUrl),
      isAuthenticated: this.authService.isAuthenticated(),
      userRole: this.authService.currentUser()?.role,
      isInitialLoad: true
    }).catch(error => {
      console.error('Failed to track initial page view:', error);
    });
    
    // Load featured products for home page
    this.loadFeaturedProducts();
    
    // Load categories
    this.loadCategories();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isHomeRoute(url: string): boolean {
    // Only show home page content for exact root route
    return url === '/' || url === '' || url === '/home';
  }
  
  isAuthPage(): boolean {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }
  
  // Load featured/boosted products for home page
  private loadFeaturedProducts(): void {
    this.isLoadingProducts.set(true);
    console.log('🏠 Loading featured products for home page...');
    
    // First try to load boosted/featured products
    this.productService.getProducts({ 
      limit: 8,  // Load more to have better selection
      sortBy: 'boosted'  // Prioritize boosted products
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProductsResponse) => {
          console.log('✅ API Products loaded:', response);
          
          if (response.products && response.products.length > 0) {
            // Prioritize boosted products, then take the newest ones
            const boostedProducts = response.products.filter(p => p.isBoosted);
            const regularProducts = response.products.filter(p => !p.isBoosted);

            // Take up to 4 products: boosted first, then regular
            const featuredProducts = [
              ...boostedProducts.slice(0, 4),
              ...regularProducts.slice(0, Math.max(0, 4 - boostedProducts.length))
            ].slice(0, 4);

            console.log(`📦 Displaying ${featuredProducts.length} featured products (${boostedProducts.length} boosted)`);
            this.products.set(featuredProducts);
          } else {
            console.log('📭 No products found in database - loading sample products as fallback');
            this.loadSampleProducts();
            return; // Exit early since loadSampleProducts handles loading state
          }
          
          this.isLoadingProducts.set(false);
        },
        error: (error) => {
          console.error('❌ Failed to load products from API:', error);
          console.log('📋 Error details:', error.error);
          console.log('🔄 Loading sample products as fallback');

          // Load sample products as fallback when API fails
          this.loadSampleProducts();
        }
      });
  }

  // Load sample products as fallback when API fails
  private loadSampleProducts(): void {
    console.log('📋 Loading sample products as fallback');

    const sampleProducts: Product[] = [
      {
        _id: 'wilson-pro-staff-97',
        title: 'Wilson Pro Staff 97 v14',
        price: 14500,
        condition: 'New',
        category: 'Racquets',
        brand: 'Wilson',
        model: 'Pro Staff 97 v14',
        description: 'Brand new Wilson Pro Staff 97 v14. Never used, still in original packaging.',
        images: [{ url: 'https://images.unsplash.com/photo-1544966503-7a5e6b2c1c3d?w=500&h=500&fit=crop', isMain: true }],
        seller: {
          _id: 'seller1',
          firstName: 'Tennis',
          lastName: 'Store',
          rating: { average: 4.8, totalReviews: 125 },
          location: { city: 'Makati', region: 'Metro Manila' },
          isVerified: true
        },
        location: { city: 'Makati', region: 'Metro Manila' },
        availability: 'available',
        tags: ['Professional', 'Wilson', '97sq'],
        views: 245,
        favorites: 18,
        isBoosted: true,
        isApproved: 'approved',
        negotiable: true,
        shippingOptions: { meetup: true, delivery: true, shipping: true },
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        _id: 'babolat-pure-drive',
        title: 'Babolat Pure Drive 2023',
        price: 12000,
        condition: 'Excellent',
        category: 'Racquets',
        brand: 'Babolat',
        model: 'Pure Drive 2023',
        description: 'Excellent condition Babolat Pure Drive. Used for about 6 months.',
        images: [{ url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop', isMain: true }],
        seller: {
          _id: 'seller2',
          firstName: 'Maria',
          lastName: 'Santos',
          rating: { average: 4.6, totalReviews: 89 },
          location: { city: 'Quezon City', region: 'Metro Manila' },
          isVerified: true
        },
        location: { city: 'Quezon City', region: 'Metro Manila' },
        availability: 'available',
        tags: ['Power', 'Babolat', 'Intermediate'],
        views: 156,
        favorites: 12,
        isBoosted: false,
        isApproved: 'approved',
        negotiable: true,
        shippingOptions: { meetup: true, delivery: false, shipping: true },
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z'
      },
      {
        _id: 'nike-court-zoom',
        title: 'Nike Court Air Zoom GP Turbo',
        price: 5200,
        condition: 'Like New',
        category: 'Shoes',
        brand: 'Nike',
        model: 'Court Air Zoom GP Turbo',
        description: 'Like new Nike tennis shoes. Worn only a few times.',
        images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', isMain: true }],
        seller: {
          _id: 'seller3',
          firstName: 'SportsFan',
          lastName: 'Pro',
          rating: { average: 4.9, totalReviews: 67 },
          location: { city: 'Pasig', region: 'Metro Manila' },
          isVerified: true
        },
        location: { city: 'Pasig', region: 'Metro Manila' },
        availability: 'available',
        tags: ['Nike', 'Size 9', 'Performance'],
        views: 134,
        favorites: 8,
        isBoosted: true,
        isApproved: 'approved',
        negotiable: true,
        shippingOptions: { meetup: true, delivery: false, shipping: true },
        createdAt: '2024-01-12T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z'
      },
      {
        _id: 'yonex-poly-tour',
        title: 'Yonex Poly Tour Pro String',
        price: 1200,
        condition: 'New',
        category: 'Strings',
        brand: 'Yonex',
        model: 'Poly Tour Pro',
        description: 'Brand new Yonex Poly Tour Pro string set.',
        images: [{ url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop', isMain: true }],
        seller: {
          _id: 'seller4',
          firstName: 'String',
          lastName: 'Expert',
          rating: { average: 4.7, totalReviews: 43 },
          location: { city: 'BGC', region: 'Metro Manila' },
          isVerified: true
        },
        location: { city: 'BGC', region: 'Metro Manila' },
        availability: 'available',
        tags: ['Professional', 'Strings', 'Power'],
        views: 89,
        favorites: 5,
        isBoosted: false,
        isApproved: 'approved',
        negotiable: false,
        shippingOptions: { meetup: true, delivery: true, shipping: true },
        createdAt: '2024-01-08T00:00:00Z',
        updatedAt: '2024-01-08T00:00:00Z'
      }
    ];

    this.products.set(sampleProducts);
    this.isLoadingProducts.set(false);
    console.log('✅ Sample products loaded as fallback');
  }
  
  // Load categories with counts
  private loadCategories(): void {
    console.log('📂 Loading categories with real product counts...');
    
    // Try to load real category counts from API
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          console.log('✅ Category counts loaded:', categories);
          
          // Map categories to include icons
          const categoryIcons: {[key: string]: string} = {
            'Racquets': '🏸',
            'Strings': '🧵',
            'Shoes': '👟',
            'Bags': '🧳',
            'Balls': '🎾',
            'Apparel': '🏃',
            'Accessories': '⚡'
          };
          
          const categoriesWithIcons = categories.map((cat: any) => ({
            name: cat.name,
            icon: categoryIcons[cat.name] || '📦',
            count: cat.count.toString()
          }));
          
          this.categories.set(categoriesWithIcons);
        },
        error: (error) => {
          console.error('❌ Failed to load categories:', error);
          // Fallback to base categories without counts
          this.loadBasicCategories();
        }
      });
  }

  private loadBasicCategories(): void {
    console.log('📋 Loading basic categories with zero counts');
    this.categories.set([
      { name: 'Racquets', icon: '🏸', count: '0' },
      { name: 'Strings', icon: '🧵', count: '0' },
      { name: 'Shoes', icon: '👟', count: '0' },
      { name: 'Bags', icon: '🧳', count: '0' },
      { name: 'Balls', icon: '🎾', count: '0' },
      { name: 'Apparel', icon: '🏃', count: '0' },
      { name: 'Accessories', icon: '⚡', count: '0' }
    ]);
  }

  favoriteProducts = new Set<string>();

  onProductClick(product: Product): void {
    console.log('Product clicked:', product);

    // Check coin balance for authenticated users - block if negative (except for admin users)
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.currentUser();

      // Admin users have unlimited access, skip balance check
      if (currentUser?.role === 'admin') {
        console.log('Admin user detected, bypassing balance check');
        console.log('Navigating to product ID:', product._id);
        this.router.navigate(['/product', product._id]).then(success => {
          console.log('Navigation result:', success ? 'SUCCESS' : 'FAILED');
        });
        return;
      }

      this.coinService.loadCoinBalance().subscribe({
        next: (balance) => {
          if (balance.balance < 0) {
            this.showLowBalanceModal.set(true);
            return;
          }
          // Balance is positive, proceed with navigation
          console.log('Navigating to product ID:', product._id);
          this.router.navigate(['/product', product._id]).then(success => {
            console.log('Navigation result:', success ? 'SUCCESS' : 'FAILED');
          });
        },
        error: (error) => {
          console.error('Failed to load coin balance:', error);
          // If balance check fails, still allow navigation
          console.log('Navigating to product ID:', product._id);
          this.router.navigate(['/product', product._id]).then(success => {
            console.log('Navigation result:', success ? 'SUCCESS' : 'FAILED');
          });
        }
      });
    } else {
      // Guest users can view products without coin balance restrictions
      console.log('Navigating to product ID:', product._id);
      this.router.navigate(['/product', product._id]).then(success => {
        console.log('Navigation result:', success ? 'SUCCESS' : 'FAILED');
      });
    }
  }

  onFavoriteClick(event: { product: Product, isFavorited: boolean }): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('User must be logged in to use favorites');
      return;
    }

    console.log('💝 Favorite click:', event);
    
    if (event.isFavorited) {
      // Add to favorites
      this.productService.addToFavorites(event.product._id).subscribe({
        next: (response) => {
          console.log('✅ Added to favorites:', response);
          this.favoriteProducts.add(event.product._id);
        },
        error: (error) => {
          console.error('❌ Failed to add to favorites:', error);
        }
      });
    } else {
      // Remove from favorites
      this.productService.removeFromFavorites(event.product._id).subscribe({
        next: (response) => {
          console.log('✅ Removed from favorites:', response);
          this.favoriteProducts.delete(event.product._id);
        },
        error: (error) => {
          console.error('❌ Failed to remove from favorites:', error);
        }
      });
    }
  }

  isFavorited(productId: string): boolean {
    return this.favoriteProducts.has(productId);
  }

  onCategoryClick(category: any): void {
    console.log('Category clicked:', category);
    this.router.navigate(['/browse'], { 
      queryParams: { category: category.name.toLowerCase() }
    });
  }
  
  // Mobile menu methods
  toggleMobileMenu(): void {
    this.showMobileMenu.update(show => !show);
    if (this.showMobileMenu()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
    document.body.style.overflow = '';
  }

  // Modal handlers for coin balance restrictions
  closeLowBalanceModal(): void {
    this.showLowBalanceModal.set(false);
  }

  openCoinPurchaseFromLowBalance(): void {
    this.showLowBalanceModal.set(false);
    this.showCoinPurchaseModal.set(true);
  }

  closeCoinPurchaseModal(): void {
    this.showCoinPurchaseModal.set(false);
  }

  onCoinPurchaseComplete(result: any): void {
    if (result.transaction.status === 'pending') {
      console.log('Purchase request submitted! Coins pending admin approval.');
    } else {
      console.log('Coins purchased successfully! You can now view products.');
    }
  }

  // Report modal handlers
  onReportClick(product: Product): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('User must be logged in to report products');
      // You could show a login prompt here
      return;
    }

    console.log('🚨 Report click for product:', product.title);
    this.reportingProduct.set(product);
    this.showReportModal.set(true);
  }

  closeReportModal(): void {
    this.showReportModal.set(false);
    this.reportingProduct.set(null);
  }

  onReportSubmitted(event: any): void {
    console.log('Report submitted:', event);
    this.closeReportModal();

    if (event.success) {
      // Show success message - you could use a toast notification here
      console.log('✅ Report submitted successfully');
    } else {
      // Show error message
      console.error('❌ Report submission failed:', event.error);
    }
  }

  getProductSeller(product: Product): any {
    // Extract seller information from product data
    if (typeof product.seller === 'object' && product.seller !== null) {
      return {
        _id: product.seller._id,
        firstName: product.seller.firstName,
        lastName: product.seller.lastName,
        email: '',
        profilePicture: product.seller.profilePicture || '',
        role: 'seller'
      };
    } else {
      // Fallback for string seller ID
      return {
        _id: product.seller || 'unknown',
        firstName: 'Unknown',
        lastName: 'Seller',
        email: '',
        profilePicture: '',
        role: 'seller'
      };
    }
  }
}
