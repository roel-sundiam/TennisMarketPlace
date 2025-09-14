import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { PriceComponent } from '../components/price.component';

export interface CreateListingForm {
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  brand: string;
  model: string;
  year: number;
  specifications: { [key: string]: string };
  location: string;
  meetupOptions: string[];
  shippingOptions: {
    meetup: boolean;
    delivery: boolean;
    shipping: boolean;
    shippingFee: number;
  };
  images: File[];
  contactPhone: string;
  contactWhatsApp?: string;
  negotiable: boolean;
  acceptOffers: boolean;
  boostListing: boolean;
}

@Component({
  selector: 'app-sell',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, PriceComponent],
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
            <button 
              type="button"
              (click)="saveDraft()"
              class="text-gray-600 hover:text-gray-800 font-medium"
              [disabled]="!listingForm.dirty">
              Save Draft
            </button>
          </div>
        </div>
      </header>

      <!-- Main Form -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form [formGroup]="listingForm" (ngSubmit)="onSubmit()" class="space-y-8">
          
          <!-- Images Section -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">📸 Product Images</h3>
            <p class="text-sm text-gray-600 mb-4">Add up to 10 high-quality photos. First image will be the main photo.</p>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              @for (preview of imagePreviews(); track $index) {
                <div class="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                  <img [src]="preview.url" [alt]="'Preview ' + ($index + 1)" class="w-full h-full object-cover">
                  <button 
                    type="button"
                    (click)="removeImage($index)"
                    class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                  @if ($index === 0) {
                    <div class="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 text-xs rounded">Main</div>
                  }
                </div>
              }
              
              @if (imagePreviews().length < 10) {
                <label class="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                  <div class="text-center">
                    <div class="text-2xl text-gray-400 mb-1">📷</div>
                    <div class="text-xs text-gray-500">Add Photo</div>
                  </div>
                  <input 
                    type="file" 
                    (change)="onImageSelect($event)"
                    accept="image/*"
                    multiple
                    class="hidden">
                </label>
              }
            </div>
          </div>

          <!-- Basic Information -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">📝 Basic Information</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input 
                  type="text" 
                  formControlName="title"
                  placeholder="e.g. Pro Staff 97 v14 (L3)"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                @if (listingForm.get('title')?.errors?.['required'] && listingForm.get('title')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Title is required</p>
                }
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select 
                  formControlName="category"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="">Select category</option>
                  <option value="racquets">Racquets</option>
                  <option value="strings">Strings</option>
                  <option value="shoes">Shoes</option>
                  <option value="bags">Bags</option>
                  <option value="apparel">Apparel</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Condition *</label>
                <select 
                  formControlName="condition"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                <input 
                  type="text" 
                  formControlName="brand"
                  placeholder="e.g. Brand name"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Model/Year</label>
                <input 
                  type="text" 
                  formControlName="model"
                  placeholder="e.g. Pro Staff 97 v14, 2023"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea 
                  formControlName="description"
                  rows="4"
                  placeholder="Describe your item in detail. Include any flaws, usage history, and why you're selling."
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"></textarea>
                @if (listingForm.get('description')?.errors?.['required'] && listingForm.get('description')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Description is required</p>
                }
              </div>
            </div>
          </div>

          <!-- Specifications -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">⚙️ Specifications</h3>
            <p class="text-sm text-gray-600 mb-4">Add relevant specifications for your item (e.g., grip size, string tension, size)</p>
            
            <div formArrayName="specifications">
              @for (spec of specificationsArray.controls; track $index) {
                <div [formGroupName]="$index" class="flex gap-3 mb-3">
                  <input 
                    type="text" 
                    formControlName="key"
                    placeholder="Specification (e.g. Grip Size)"
                    class="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <input 
                    type="text" 
                    formControlName="value"
                    placeholder="Value (e.g. L3 / 4 3/8)"
                    class="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <button 
                    type="button" 
                    (click)="removeSpecification($index)"
                    class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    ✕
                  </button>
                </div>
              }
            </div>
            
            <button 
              type="button" 
              (click)="addSpecification()"
              class="text-green-600 hover:text-green-700 font-medium text-sm">
              + Add Specification
            </button>
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
                
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="acceptOffers"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                  <span class="ml-2 text-sm text-gray-700">Accept offers</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Location & Delivery -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">📍 Location & Delivery</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                <select 
                  formControlName="location"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="">Select location</option>
                  <option value="Manila">Manila</option>
                  <option value="Quezon City">Quezon City</option>
                  <option value="Makati City">Makati City</option>
                  <option value="BGC, Taguig">BGC, Taguig</option>
                  <option value="Pasig City">Pasig City</option>
                  <option value="Mandaluyong">Mandaluyong</option>
                  <option value="Ortigas Center">Ortigas Center</option>
                  <option value="Alabang">Alabang</option>
                  <option value="Cebu City">Cebu City</option>
                  <option value="Davao City">Davao City</option>
                </select>
              </div>

              <div class="space-y-3">
                <p class="text-sm font-semibold text-gray-700">Delivery Options:</p>
                
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="meetup"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                  <span class="ml-2 text-sm text-gray-700">Meetup</span>
                </label>
                
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="delivery"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                  <span class="ml-2 text-sm text-gray-700">Local delivery</span>
                </label>
                
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    formControlName="shipping"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                  <span class="ml-2 text-sm text-gray-700">Nationwide shipping</span>
                </label>

                @if (listingForm.get('shipping')?.value) {
                  <div class="ml-6">
                    <label class="block text-xs text-gray-600 mb-1">Shipping Fee</label>
                    <div class="relative">
                      <span class="absolute left-2 top-2 text-gray-500 text-sm">₱</span>
                      <input 
                        type="number" 
                        formControlName="shippingFee"
                        placeholder="0"
                        min="0"
                        class="w-24 pl-6 pr-2 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-green-500">
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="bg-white rounded-2xl border border-green-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">📞 Contact Information</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input 
                  type="tel" 
                  formControlName="contactPhone"
                  placeholder="+63 9XX XXX XXXX"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                @if (listingForm.get('contactPhone')?.errors?.['required'] && listingForm.get('contactPhone')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Phone number is required</p>
                }
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">WhatsApp (Optional)</label>
                <input 
                  type="tel" 
                  formControlName="contactWhatsApp"
                  placeholder="+63 9XX XXX XXXX"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <p class="mt-1 text-xs text-gray-500">Leave blank to use phone number</p>
              </div>
            </div>
          </div>

          <!-- Boost Listing -->
          <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">🚀 Boost Your Listing</h3>
            
            <label class="flex items-start space-x-3">
              <input 
                type="checkbox" 
                formControlName="boostListing"
                class="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 mt-0.5">
              <div>
                <div class="font-semibold text-gray-900">Boost this listing (+₱50)</div>
                <p class="text-sm text-gray-600 mt-1">
                  Get 3x more visibility! Boosted listings appear at the top of search results and category pages.
                </p>
              </div>
            </label>
          </div>

          <!-- Submit Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-end">
            <button 
              type="button"
              (click)="saveDraft()"
              [disabled]="!listingForm.dirty"
              class="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Save as Draft
            </button>
            
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
            Your listing will be reviewed and published within 24 hours.
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './sell.component.scss'
})
export class SellComponent implements OnInit {
  listingForm: FormGroup;
  imagePreviews = signal<{file: File, url: string}[]>([]);
  isSubmitting = signal(false);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.listingForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      price: ['', [Validators.required, Validators.min(1)]],
      condition: ['', Validators.required],
      category: ['', Validators.required],
      brand: [''],
      model: [''],
      specifications: this.fb.array([]),
      location: ['', Validators.required],
      meetup: [false],
      delivery: [false],
      shipping: [false],
      shippingFee: [0],
      contactPhone: ['', Validators.required],
      contactWhatsApp: [''],
      negotiable: [false],
      acceptOffers: [false],
      boostListing: [false]
    });
  }

  get specificationsArray(): FormArray {
    return this.listingForm.get('specifications') as FormArray;
  }

  addSpecification(): void {
    const specGroup = this.fb.group({
      key: [''],
      value: ['']
    });
    this.specificationsArray.push(specGroup);
  }

  removeSpecification(index: number): void {
    this.specificationsArray.removeAt(index);
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const currentPreviews = this.imagePreviews();
      const remainingSlots = 10 - currentPreviews.length;
      const filesToAdd = Array.from(input.files).slice(0, remainingSlots);
      
      filesToAdd.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = {
              file,
              url: e.target?.result as string
            };
            this.imagePreviews.update(previews => [...previews, preview]);
          };
          reader.readAsDataURL(file);
        }
      });
      
      // Reset input
      input.value = '';
    }
  }

  removeImage(index: number): void {
    this.imagePreviews.update(previews => previews.filter((_, i) => i !== index));
  }

  saveDraft(): void {
    const formData = this.listingForm.value;
    localStorage.setItem('tennis-marketplace-draft', JSON.stringify({
      ...formData,
      savedAt: new Date().toISOString()
    }));
    alert('Draft saved successfully!');
  }

  onSubmit(): void {
    if (this.listingForm.valid) {
      this.isSubmitting.set(true);
      
      const formData = this.listingForm.value;
      const images = this.imagePreviews().map(p => p.file);
      
      // Create listing object
      const listing: CreateListingForm = {
        ...formData,
        images,
        specifications: this.specificationsArray.value.reduce((specs: any, spec: any) => {
          if (spec.key && spec.value) {
            specs[spec.key] = spec.value;
          }
          return specs;
        }, {}),
        shippingOptions: {
          meetup: formData.meetup,
          delivery: formData.delivery,
          shipping: formData.shipping,
          shippingFee: formData.shippingFee || 0
        }
      };
      
      console.log('Creating listing:', listing);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting.set(false);
        alert('🎾 Listing created successfully! Your item is now under review and will be published within 24 hours.');
        
        // Clear draft
        localStorage.removeItem('tennis-marketplace-draft');
        
        // Navigate to browse page
        this.router.navigate(['/browse']);
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.listingForm);
    }
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

  ngOnInit(): void {
    // Load draft if exists
    const draft = localStorage.getItem('tennis-marketplace-draft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        // Don't load images from draft for security reasons
        delete draftData.images;
        this.listingForm.patchValue(draftData);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
    
    // Add initial specification if none exist
    if (this.specificationsArray.length === 0) {
      this.addSpecification();
    }
  }
}