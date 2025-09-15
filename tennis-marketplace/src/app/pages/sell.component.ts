import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { AuthService, User } from '../services/auth.service';
import { UploadService } from '../services/upload.service';
import { BrandModelService } from '../services/brand-model.service';
import { LocationService } from '../services/location.service';
import { NotificationService } from '../services/notification.service';
import { CoinService } from '../services/coin.service';
import { LowBalanceModalComponent } from '../components/low-balance-modal.component';
import { CoinPurchaseModalComponent } from '../components/coin-purchase-modal.component';

interface SelectedImage {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-sell',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LowBalanceModalComponent, CoinPurchaseModalComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-green-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <a routerLink="/" class="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold text-sm">🎾</span>
                </div>
                <h1 class="text-xl font-bold text-gray-900">TennisMarket</h1>
              </a>
              <span class="text-gray-400">›</span>
              <h2 class="text-lg font-semibold text-gray-700">Sell Your Gear</h2>
            </div>
            
            <!-- User Info -->
            <div *ngIf="currentUser()" class="flex items-center gap-3 text-sm text-gray-600">
              <span>Welcome, {{ currentUser()?.firstName }}!</span>
            </div>
          </div>
        </div>
      </header>



      <!-- Main Form -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form [formGroup]="listingForm" (ngSubmit)="onSubmit()" class="space-y-8">
          
          <!-- Basic Information -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">📝 Basic Information</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                  <span class="text-xs text-gray-500 font-normal ml-1">(Auto-generated from details below)</span>
                </label>
                <input 
                  type="text" 
                  formControlName="title"
                  placeholder="Title will be auto-generated as you fill in details"
                  readonly
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                @if (listingForm.get('title')?.errors?.['required'] && listingForm.get('title')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Title is required</p>
                }
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select 
                    formControlName="category"
                    (change)="onCategoryChange($event)"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select category</option>
                    <option value="Racquets">Tennis Racquets</option>
                    <option value="Pickleball Paddles">Pickleball Paddles</option>
                    <option value="Strings">Strings</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Bags">Bags</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Balls">Tennis Balls</option>
                    <option value="Pickleball Balls">Pickleball Balls</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Condition *</label>
                  <select 
                    formControlName="condition"
                    (change)="onConditionChange($event)"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select condition</option>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Brand *</label>
                  <select 
                    formControlName="brand"
                    (change)="onBrandChange($event)"
                    [disabled]="!selectedCategory() || isBrandsLoading()"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <option value="">
                      @if (isBrandsLoading()) {
                        Loading brands...
                      } @else if (!selectedCategory()) {
                        Select category first
                      } @else {
                        Select brand
                      }
                    </option>
                    @for (brand of availableBrands(); track brand) {
                      <option [value]="brand">{{ brand }}</option>
                    }
                  </select>
                  @if (listingForm.get('brand')?.errors?.['required'] && listingForm.get('brand')?.touched) {
                    <p class="mt-1 text-sm text-red-600">Brand is required</p>
                  }
                  <!-- Add "Other" option with text input -->
                  <div class="mt-2">
                    <label class="flex items-center text-sm text-gray-600">
                      <input type="checkbox" class="mr-2" (change)="toggleCustomBrand($event)">
                      Brand not listed? Enter custom brand
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                  <select 
                    formControlName="model"
                    (change)="onModelChange($event)"
                    [disabled]="!selectedBrand() || isModelsLoading()"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <option value="">
                      @if (isModelsLoading()) {
                        Loading models...
                      } @else if (!selectedBrand()) {
                        Select brand first
                      } @else {
                        Select model (optional)
                      }
                    </option>
                    @for (model of availableModels(); track model) {
                      <option [value]="model">{{ model }}</option>
                    }
                  </select>
                  <!-- Add "Other" option with text input -->
                  <div class="mt-2">
                    <label class="flex items-center text-sm text-gray-600">
                      <input type="checkbox" class="mr-2" (change)="toggleCustomModel($event)">
                      Model not listed? Enter custom model
                    </label>
                  </div>
                </div>
              </div>

              <!-- Custom brand input (hidden by default) -->
              <div id="customBrandDiv" class="hidden">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Custom Brand *</label>
                <input 
                  type="text" 
                  id="customBrandInput"
                  placeholder="Enter brand name"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              </div>

              <!-- Custom model input (hidden by default) -->
              <div id="customModelDiv" class="hidden">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Custom Model</label>
                <input 
                  type="text" 
                  id="customModelInput"
                  placeholder="Enter model name"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea 
                  formControlName="description"
                  rows="4"
                  placeholder="Describe your item in detail..."
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"></textarea>
                @if (listingForm.get('description')?.errors?.['required'] && listingForm.get('description')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Description is required</p>
                }
              </div>
            </div>
          </div>

          <!-- Images -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">📸 Photos</h3>
            <p class="text-sm text-gray-600 mb-4">Add up to 8 photos. The first photo will be your main image.</p>
            
            <!-- Image Upload Area -->
            <div class="space-y-4">
              <!-- File Input -->
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                <input 
                  type="file" 
                  #fileInput
                  (change)="onImageSelect($event)"
                  multiple 
                  accept="image/*"
                  class="hidden">
                
                <div class="space-y-4">
                  <div class="text-gray-400">
                    <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                  </div>
                  
                  <div>
                    <button 
                      type="button"
                      (click)="fileInput.click()"
                      class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Choose Photos
                    </button>
                    <p class="text-sm text-gray-500 mt-2">or drag and drop images here</p>
                  </div>
                  
                  <div class="text-xs text-gray-500">
                    Supported: JPG, PNG, WebP • Max 5MB per image • Up to 8 images
                  </div>
                </div>
              </div>

              <!-- Image Previews -->
              <div *ngIf="selectedImages().length > 0" class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-gray-900">Selected Images ({{ selectedImages().length }}/8)</h4>
                  <button 
                    type="button"
                    (click)="clearAllImages()"
                    class="text-sm text-red-600 hover:text-red-700">
                    Clear All
                  </button>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  @for (image of selectedImages(); track image.file.name; let i = $index) {
                    <div class="relative group">
                      <div class="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          [src]="image.preview" 
                          [alt]="'Preview ' + (i + 1)"
                          class="w-full h-full object-cover">
                      </div>
                      
                      <!-- Main Image Badge -->
                      @if (i === 0) {
                        <div class="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Main
                        </div>
                      }
                      
                      <!-- Remove Button -->
                      <button 
                        type="button"
                        (click)="removeImage(i)"
                        class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                      
                      <!-- Set as Main Button -->
                      @if (i !== 0) {
                        <button 
                          type="button"
                          (click)="setAsMainImage(i)"
                          class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Set as Main
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
              
              <!-- Upload Progress -->
              @if (uploadProgress() > 0 && uploadProgress() < 100) {
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-blue-900">Uploading images...</span>
                    <span class="text-sm text-blue-700">{{ uploadProgress() }}%</span>
                  </div>
                  <div class="w-full bg-blue-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" [style.width.%]="uploadProgress()"></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Pricing -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">💰 Pricing</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                <div class="relative">
                  <span class="absolute left-3 top-3 text-gray-500">₱</span>
                  <input 
                    type="number" 
                    formControlName="price"
                    (input)="onPriceChange($event)"
                    placeholder="0"
                    min="0"
                    class="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
                @if (listingForm.get('price')?.errors?.['required'] && listingForm.get('price')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Price is required</p>
                }
              </div>

              <div class="space-y-3">
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="negotiable"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                  <span class="ml-2 text-sm text-gray-700">Price is negotiable</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Location & Shipping -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">📍 Location & Shipping</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                <select 
                  formControlName="city"
                  (change)="onCityChange($event)"
                  [disabled]="isCitiesLoading()"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <option value="">
                    @if (isCitiesLoading()) {
                      Loading cities...
                    } @else {
                      Select city
                    }
                  </option>
                  @for (city of availableCities(); track city) {
                    <option [value]="city">{{ city }}</option>
                  }
                </select>
                @if (listingForm.get('city')?.errors?.['required'] && listingForm.get('city')?.touched) {
                  <p class="mt-1 text-sm text-red-600">City is required</p>
                }
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Region *</label>
                <input 
                  type="text" 
                  formControlName="region"
                  placeholder="Region will be auto-filled when you select a city"
                  readonly
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                @if (listingForm.get('region')?.errors?.['required'] && listingForm.get('region')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Region is required</p>
                }
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">Shipping Options *</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="meetup"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                  <span class="ml-2 text-sm text-gray-700">Meetup (Face-to-face)</span>
                </label>
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="delivery"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                  <span class="ml-2 text-sm text-gray-700">Local Delivery</span>
                </label>
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="shipping"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                  <span class="ml-2 text-sm text-gray-700">Nationwide Shipping</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-end">
            <button 
              type="submit"
              [disabled]="listingForm.invalid || isSubmitting()"
              class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isSubmitting()) {
                <span class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publishing...
                </span>
              } @else {
                Publish Listing
              }
            </button>
          </div>

          <!-- Terms -->
          <div class="text-center text-sm text-gray-500 max-w-2xl mx-auto">
            By publishing your listing, you agree to our 
            <a href="#" class="text-green-600 hover:underline">Terms of Service</a> and 
            <a href="#" class="text-green-600 hover:underline">Marketplace Policies</a>.
          </div>
        </form>
      </div>
    </div>

    <!-- Low Balance Modal -->
    @if (showLowBalanceModal()) {
      <app-low-balance-modal
        (close)="closeLowBalanceModal()"
        (openPurchase)="openCoinPurchaseFromLowBalance()">
      </app-low-balance-modal>
    }

    <!-- Coin Purchase Modal -->
    @if (showCoinPurchaseModal()) {
      <app-coin-purchase-modal
        (close)="closeCoinPurchaseModal()"
        (purchaseComplete)="onCoinPurchaseComplete($event)">
      </app-coin-purchase-modal>
    }
  `,
  styleUrl: './sell.component.scss'
})
export class SellComponent implements OnInit {
  listingForm: FormGroup;
  isSubmitting = signal(false);
  
  // Use AuthService signals directly - initialized after authService
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  
  // Image upload state
  selectedImages = signal<SelectedImage[]>([]);
  uploadProgress = signal<number>(0);
  maxImages = 8;
  maxFileSize = 5 * 1024 * 1024; // 5MB

  // Brand/Model dropdown state
  availableBrands = signal<string[]>([]);
  availableModels = signal<string[]>([]);
  isBrandsLoading = signal<boolean>(false);
  isModelsLoading = signal<boolean>(false);
  selectedCategory = signal<string>('');
  selectedBrand = signal<string>('');

  // Location dropdown state
  availableCities = signal<string[]>([]);
  isCitiesLoading = signal<boolean>(false);
  selectedCity = signal<string>('');

  // Modal state
  showLowBalanceModal = signal<boolean>(false);
  showCoinPurchaseModal = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductService,
    private uploadService: UploadService,
    public authService: AuthService,
    private brandModelService: BrandModelService,
    private locationService: LocationService,
    private notificationService: NotificationService,
    private coinService: CoinService
  ) {
    this.listingForm = this.createForm();
    // Initialize signals after authService is available
    this.currentUser = this.authService.currentUser;
    this.isAuthenticated = this.authService.isAuthenticatedSignal;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      price: ['', [Validators.required, Validators.min(1)]],
      condition: ['', Validators.required],
      category: ['', Validators.required],
      brand: ['', Validators.required],
      model: [''],
      city: ['', Validators.required],
      region: ['', Validators.required],
      meetup: [true],
      delivery: [false],
      shipping: [false],
      negotiable: [false]
    });
  }

  ngOnInit(): void {
    // Double-check authentication (guard should already handle this)
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/sell' } });
      return;
    }

    // Check coin balance - block if negative (except for admin users)
    const currentUser = this.authService.currentUser();

    // Admin users have unlimited access, skip balance check
    if (currentUser?.role === 'admin') {
      console.log('Admin user detected, bypassing balance check for sell page');
      return;
    }

    this.coinService.loadCoinBalance().subscribe({
      next: (balance) => {
        if (balance.balance < 0) {
          this.showLowBalanceModal.set(true);
          return;
        }
      },
      error: (error) => {
        console.error('Failed to load coin balance:', error);
      }
    });

    // Check if user has remaining listings
    const user = this.currentUser();
    if (user && user.subscription?.remainingListings === 0) {
      console.warn('User has no remaining listings');
    }

    // Load cities for dropdown
    this.loadCities();
  }

  onSubmit(): void {
    // Additional authentication check before submitting
    if (!this.isAuthenticated()) {
      this.notificationService.warning('Authentication required', 'You must be logged in to create a listing.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/sell' } });
      return;
    }

    // Check if user has remaining listings
    const user = this.currentUser();
    if (user && user.subscription?.remainingListings === 0) {
      this.notificationService.warning('Listing limit reached', 'You have no remaining listings. Please upgrade your subscription.');
      return;
    }

    if (this.listingForm.valid) {
      this.isSubmitting.set(true);
      
      const formData = this.listingForm.value;
      
      // Handle custom brand/model inputs
      const finalBrand = this.getFinalBrandValue();
      const finalModel = this.getFinalModelValue();
      
      if (!finalBrand) {
        this.notificationService.warning('Brand required', 'Please select or enter a brand.');
        this.isSubmitting.set(false);
        return;
      }
      
      // Update form data with final values
      formData.brand = finalBrand;
      formData.model = finalModel;
      const images = this.selectedImages();

      // Upload images first if any are selected
      if (images.length > 0) {
        this.uploadProgress.set(10);
        const imageFiles = images.map(img => img.file);
        
        this.uploadService.uploadImages(imageFiles).subscribe({
          next: (uploadResponse) => {
            this.uploadProgress.set(70);
            
            if (uploadResponse.success) {
              // Create product with uploaded image URLs
              this.createProductWithImages(formData, uploadResponse.urls);
            } else {
              this.isSubmitting.set(false);
              this.uploadProgress.set(0);
              this.notificationService.error('Image upload failed', uploadResponse.message);
            }
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.uploadProgress.set(0);
            console.error('Error uploading images:', error);
            this.notificationService.error('Upload failed', 'Failed to upload images. Please try again.');
          }
        });
      } else {
        // Create product without images
        this.createProductWithImages(formData, []);
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.listingForm);
    }
  }

  private createProductWithImages(formData: any, imageUrls: string[]): void {
    // Transform form data to match backend API
    const productData = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      condition: formData.condition,
      brand: formData.brand,
      model: formData.model || '',
      location: {
        city: formData.city,
        region: formData.region
      },
      shippingOptions: {
        meetup: formData.meetup || false,
        delivery: formData.delivery || false,
        shipping: formData.shipping || false
      },
      negotiable: formData.negotiable || false,
      images: imageUrls.map((url, index) => ({
        url: url,
        alt: `${formData.title} - Image ${index + 1}`,
        isMain: index === 0 // First image is main
      })),
      tags: [] // TODO: Add tags functionality
    };
    
    this.uploadProgress.set(90);
    console.log('Creating listing:', productData);
    
    this.productService.createProduct(productData).subscribe({
      next: (product) => {
        this.uploadProgress.set(100);
        setTimeout(() => {
          this.isSubmitting.set(false);
          this.uploadProgress.set(0);
          console.log('Product created successfully:', product);
          this.notificationService.success(
            'Listing created successfully!', 
            'Your listing will be reviewed by our team before going live.',
            6000
          );
          this.router.navigate(['/browse']);
        }, 500);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.uploadProgress.set(0);
        console.error('Error creating product:', error);
        this.notificationService.error('Listing creation failed', 'Failed to create listing. Please try again.');
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Subscription limits removed - all users can create listings
  shouldShowForm(): boolean {
    return !!this.currentUser(); // Just check if user is logged in
  }

  shouldShowNoListingsWarning(): boolean {
    return false; // Never show warning
  }

  // Image handling methods
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.processSelectedFiles(files);
    
    // Clear the input so the same file can be selected again
    input.value = '';
  }

  private processSelectedFiles(files: File[]): void {
    const currentImages = this.selectedImages();
    const remainingSlots = this.maxImages - currentImages.length;
    
    if (remainingSlots <= 0) {
      this.notificationService.warning('Image limit exceeded', `You can only upload up to ${this.maxImages} images`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    
    filesToProcess.forEach(file => {
      // Validate file
      if (!this.validateFile(file)) return;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        this.selectedImages.update(images => [...images, { file, preview }]);
      };
      reader.readAsDataURL(file);
    });
  }

  private validateFile(file: File): boolean {
    // Check file type
    if (!file.type.startsWith('image/')) {
      this.notificationService.warning('Invalid file type', `"${file.name}" is not a valid image file`);
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      this.notificationService.warning('File too large', `"${file.name}" is too large. Maximum size is 5MB`);
      return false;
    }

    return true;
  }

  removeImage(index: number): void {
    this.selectedImages.update(images => {
      const newImages = [...images];
      // Clean up the preview URL
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }

  setAsMainImage(index: number): void {
    this.selectedImages.update(images => {
      const newImages = [...images];
      const mainImage = newImages.splice(index, 1)[0];
      newImages.unshift(mainImage);
      return newImages;
    });
  }

  clearAllImages(): void {
    // Clean up preview URLs
    this.selectedImages().forEach(image => {
      URL.revokeObjectURL(image.preview);
    });
    this.selectedImages.set([]);
  }

  // Brand/Model dropdown methods
  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const category = target?.value || '';
    
    this.selectedCategory.set(category);
    this.selectedBrand.set('');
    
    // Clear dependent form fields
    this.listingForm.patchValue({
      brand: '',
      model: ''
    });
    
    // Clear dependent dropdowns
    this.availableBrands.set([]);
    this.availableModels.set([]);
    
    if (category) {
      this.loadBrandsForCategory(category);
    }
    
    // Update title
    this.generateTitle();
  }

  onConditionChange(event: Event): void {
    // Update title when condition changes
    this.generateTitle();
  }

  onBrandChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const brand = target?.value || '';
    
    this.selectedBrand.set(brand);
    
    // Clear model field
    this.listingForm.patchValue({
      model: ''
    });
    
    // Clear models dropdown
    this.availableModels.set([]);
    
    if (brand && this.selectedCategory()) {
      this.loadModelsForBrand(this.selectedCategory(), brand);
    }
    
    // Update title
    this.generateTitle();
  }

  onModelChange(event: Event): void {
    // Update title when model changes
    this.generateTitle();
  }

  onPriceChange(event: Event): void {
    // Update title when price changes
    this.generateTitle();
  }

  private loadBrandsForCategory(category: string): void {
    this.isBrandsLoading.set(true);
    
    this.brandModelService.getBrandsByCategory(category).subscribe({
      next: (brands) => {
        this.availableBrands.set(brands);
        this.isBrandsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        this.availableBrands.set([]);
        this.isBrandsLoading.set(false);
      }
    });
  }

  private loadModelsForBrand(category: string, brand: string): void {
    this.isModelsLoading.set(true);
    
    this.brandModelService.getModelsByBrand(category, brand).subscribe({
      next: (models) => {
        this.availableModels.set(models);
        this.isModelsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading models:', error);
        this.availableModels.set([]);
        this.isModelsLoading.set(false);
      }
    });
  }

  // Title auto-generation method
  private generateTitle(): void {
    const formValue = this.listingForm.value;
    const category = formValue.category || '';
    const condition = formValue.condition || '';
    const brand = this.getFinalBrandValue() || formValue.brand || '';
    const model = this.getFinalModelValue() || formValue.model || '';
    const price = formValue.price ? `₱${Number(formValue.price).toLocaleString()}` : '';
    
    let titleParts: string[] = [];
    
    // Always start with condition if available
    if (condition) {
      titleParts.push(condition);
    }
    
    // Add brand if available  
    if (brand) {
      titleParts.push(brand);
    }
    
    // Add model if available
    if (model) {
      titleParts.push(model);
    }
    
    // Add category if no brand/model or as fallback
    if (category && (!brand || !model)) {
      titleParts.push(category);
    }
    
    // Add price if available
    if (price) {
      titleParts.push(`- ${price}`);
    }
    
    // Generate final title
    let generatedTitle = titleParts.join(' ');
    
    // Fallback if no parts available
    if (!generatedTitle.trim()) {
      generatedTitle = 'Sports Equipment for Sale';
    }
    
    // Update the form control
    this.listingForm.patchValue({ title: generatedTitle }, { emitEvent: false });
  }

  // Custom brand/model toggle methods
  toggleCustomBrand(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const customBrandDiv = document.querySelector('#customBrandDiv') as HTMLElement | null;
    const customBrandInput = document.querySelector('#customBrandInput') as HTMLInputElement | null;
    
    if (checkbox.checked) {
      customBrandDiv?.classList.remove('hidden');
      customBrandInput?.focus();
      // Clear dropdown selection
      this.listingForm.patchValue({ brand: '' });
      
      // Add event listener for custom input changes
      if (customBrandInput) {
        customBrandInput.addEventListener('input', () => {
          this.generateTitle();
        });
      }
    } else {
      customBrandDiv?.classList.add('hidden');
      if (customBrandInput) {
        customBrandInput.value = '';
      }
      // Update title when custom input is cleared
      this.generateTitle();
    }
  }

  toggleCustomModel(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const customModelDiv = document.querySelector('#customModelDiv') as HTMLElement | null;
    const customModelInput = document.querySelector('#customModelInput') as HTMLInputElement | null;
    
    if (checkbox.checked) {
      customModelDiv?.classList.remove('hidden');
      customModelInput?.focus();
      // Clear dropdown selection
      this.listingForm.patchValue({ model: '' });
      
      // Add event listener for custom input changes
      if (customModelInput) {
        customModelInput.addEventListener('input', () => {
          this.generateTitle();
        });
      }
    } else {
      customModelDiv?.classList.add('hidden');
      if (customModelInput) {
        customModelInput.value = '';
      }
      // Update title when custom input is cleared
      this.generateTitle();
    }
  }

  // Helper methods to get final brand/model values
  private getFinalBrandValue(): string {
    const customBrandInput = document.querySelector('#customBrandInput') as HTMLInputElement | null;
    const customBrandDiv = document.querySelector('#customBrandDiv') as HTMLElement | null;
    
    // If custom brand div is visible, use custom input value
    if (customBrandDiv && !customBrandDiv.classList.contains('hidden') && customBrandInput) {
      return customBrandInput.value.trim();
    }
    
    // Otherwise use dropdown value
    return this.listingForm.get('brand')?.value || '';
  }

  private getFinalModelValue(): string {
    const customModelInput = document.querySelector('#customModelInput') as HTMLInputElement | null;
    const customModelDiv = document.querySelector('#customModelDiv') as HTMLElement | null;
    
    // If custom model div is visible, use custom input value
    if (customModelDiv && !customModelDiv.classList.contains('hidden') && customModelInput) {
      return customModelInput.value.trim();
    }
    
    // Otherwise use dropdown value
    return this.listingForm.get('model')?.value || '';
  }

  // Location-related methods
  private loadCities(): void {
    this.isCitiesLoading.set(true);
    
    this.locationService.getCities().subscribe({
      next: (cities) => {
        this.availableCities.set(cities);
        this.isCitiesLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.availableCities.set([]);
        this.isCitiesLoading.set(false);
      }
    });
  }

  onCityChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const city = target?.value || '';
    
    this.selectedCity.set(city);
    
    if (city) {
      // Auto-populate region based on selected city
      this.locationService.getRegionByCity(city).subscribe({
        next: (region) => {
          if (region) {
            this.listingForm.patchValue({ region }, { emitEvent: false });
          }
        },
        error: (error) => {
          console.error('Error fetching region for city:', city, error);
        }
      });
    } else {
      // Clear region if no city is selected
      this.listingForm.patchValue({ region: '' }, { emitEvent: false });
    }
  }

  // Modal handlers
  closeLowBalanceModal(): void {
    this.showLowBalanceModal.set(false);
    // Redirect user away from sell page
    this.router.navigate(['/']);
  }

  openCoinPurchaseFromLowBalance(): void {
    this.showLowBalanceModal.set(false);
    this.showCoinPurchaseModal.set(true);
  }

  closeCoinPurchaseModal(): void {
    this.showCoinPurchaseModal.set(false);
    // After closing purchase modal, redirect home since they still can't sell
    this.router.navigate(['/']);
  }

  onCoinPurchaseComplete(result: any): void {
    if (result.transaction.status === 'pending') {
      // Purchase is pending approval, redirect user away from sell page
      this.notificationService.info('Purchase request submitted! You will receive your coins within 24 hours after payment verification. Contact 09175105185 to confirm payment.');
      this.router.navigate(['/']);
    } else {
      // Completed purchase, check balance again
      this.coinService.loadCoinBalance().subscribe({
        next: (balance) => {
          if (balance.balance >= 0) {
            // Balance is positive now, they can continue selling
            this.notificationService.success('Coins purchased successfully! You can now sell your products.');
          } else {
            // Still negative, redirect home
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Failed to reload balance:', error);
          this.router.navigate(['/']);
        }
      });
    }
  }
}