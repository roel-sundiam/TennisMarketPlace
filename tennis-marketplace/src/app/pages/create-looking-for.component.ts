import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LookingForService, CreateLookingForRequest } from '../services/looking-for.service';
import { AuthService, User } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-create-looking-for',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-green-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <a routerLink="/" class="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0">
                <img src="/assets/logo.png" alt="Baseline Gearhub Logo" class="w-8 h-8 object-contain">
                <h1 class="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">Baseline Gearhub</h1>
                <h1 class="text-lg font-bold text-gray-900 sm:hidden">BG</h1>
              </a>
              <span class="text-gray-400 hidden sm:inline">›</span>
              <h2 class="text-sm sm:text-lg font-semibold text-gray-700 truncate">
                <span class="hidden sm:inline">Looking For</span>
                <span class="sm:hidden">LF</span>
              </h2>
            </div>

            <!-- User Info -->
            <div *ngIf="currentUser()" class="flex items-center gap-2 text-xs sm:text-sm text-gray-600 flex-shrink-0">
              <span class="hidden sm:inline">Welcome,</span>
              <span class="font-medium">{{ currentUser()?.firstName }}!</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Form -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <form [formGroup]="lookingForForm" (ngSubmit)="onSubmit()" class="space-y-6 sm:space-y-8">

          <!-- Basic Information -->
          <div class="bg-white rounded-xl sm:rounded-2xl border border-green-200 p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🔍 What are you looking for?</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  formControlName="title"
                  placeholder="e.g., Wilson Pro Staff 97 v14 or any quality racquet"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <div *ngIf="lookingForForm.get('title')?.errors?.['required'] && lookingForForm.get('title')?.touched"
                     class="mt-1 text-sm text-red-600">Title is required</div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select formControlName="category"
                          class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select Category</option>
                    <option value="Racquets">Racquets</option>
                    <option value="Pickleball Paddles">Pickleball Paddles</option>
                    <option value="Strings">Strings</option>
                    <option value="Bags">Bags</option>
                    <option value="Balls">Balls</option>
                    <option value="Pickleball Balls">Pickleball Balls</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                  <div *ngIf="lookingForForm.get('category')?.errors?.['required'] && lookingForForm.get('category')?.touched"
                       class="mt-1 text-sm text-red-600">Category is required</div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Urgency</label>
                  <select formControlName="urgency"
                          class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="flexible">Flexible timing</option>
                    <option value="within_month">Within a month</option>
                    <option value="within_week">Within a week</option>
                    <option value="asap">ASAP</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                  <span class="text-xs text-gray-500 font-normal ml-1">(Be specific about what you need)</span>
                </label>
                <textarea
                  formControlName="description"
                  rows="4"
                  placeholder="Describe what you're looking for in detail. Include brand preferences, specific models, condition requirements, intended use, etc."
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"></textarea>
                <div *ngIf="lookingForForm.get('description')?.errors?.['required'] && lookingForForm.get('description')?.touched"
                     class="mt-1 text-sm text-red-600">Description is required</div>
              </div>
            </div>
          </div>

          <!-- Budget -->
          <div class="bg-white rounded-xl sm:rounded-2xl border border-green-200 p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">💰 Budget Range</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Minimum Budget (₱) *</label>
                <input
                  type="number"
                  formControlName="budgetMin"
                  placeholder="e.g., 5000"
                  min="0"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <div *ngIf="lookingForForm.get('budgetMin')?.errors?.['required'] && lookingForForm.get('budgetMin')?.touched"
                     class="mt-1 text-sm text-red-600">Minimum budget is required</div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Maximum Budget (₱) *</label>
                <input
                  type="number"
                  formControlName="budgetMax"
                  placeholder="e.g., 15000"
                  min="0"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <div *ngIf="lookingForForm.get('budgetMax')?.errors?.['required'] && lookingForForm.get('budgetMax')?.touched"
                     class="mt-1 text-sm text-red-600">Maximum budget is required</div>
                <div *ngIf="lookingForForm.errors?.['budgetRange']"
                     class="mt-1 text-sm text-red-600">Maximum budget must be greater than minimum budget</div>
              </div>
            </div>
          </div>

          <!-- Preferences -->
          <div class="bg-white rounded-xl sm:rounded-2xl border border-green-200 p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">⚙️ Preferences</h3>

            <div class="space-y-4">
              <!-- Acceptable Conditions -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Acceptable Conditions</label>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <label *ngFor="let condition of conditions" class="flex items-center">
                    <input
                      type="checkbox"
                      [value]="condition"
                      (change)="onConditionChange($event)"
                      class="form-checkbox h-4 w-4 text-green-600 rounded">
                    <span class="ml-2 text-sm text-gray-700">{{ condition }}</span>
                  </label>
                </div>
              </div>

              <!-- Preferred Brands -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Preferred Brands (Optional)</label>
                <div class="space-y-2">
                  <div formArrayName="preferredBrands">
                    <div *ngFor="let brand of preferredBrandsArray.controls; let i = index"
                         class="flex items-center gap-2">
                      <input
                        type="text"
                        [formControlName]="i"
                        placeholder="e.g., Wilson, Babolat, Head"
                        class="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <button
                        type="button"
                        (click)="removePreferredBrand(i)"
                        class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="addPreferredBrand()"
                    class="text-green-600 hover:text-green-700 text-sm font-medium">
                    + Add Brand
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Location -->
          <div class="bg-white rounded-xl sm:rounded-2xl border border-green-200 p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">📍 Location & Meetup</h3>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                  <select formControlName="city"
                          class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select City</option>
                    <option *ngFor="let city of cities" [value]="city.name">{{ city.name }}</option>
                  </select>
                  <div *ngIf="lookingForForm.get('city')?.errors?.['required'] && lookingForForm.get('city')?.touched"
                       class="mt-1 text-sm text-red-600">City is required</div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Region *</label>
                  <select formControlName="region"
                          class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select Region</option>
                    <option *ngFor="let region of regions" [value]="region">{{ region }}</option>
                  </select>
                  <div *ngIf="lookingForForm.get('region')?.errors?.['required'] && lookingForForm.get('region')?.touched"
                       class="mt-1 text-sm text-red-600">Region is required</div>
                </div>
              </div>

              <!-- Shipping Preferences -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">How would you like to receive the item?</label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      formControlName="meetup"
                      class="form-checkbox h-4 w-4 text-green-600 rounded">
                    <span class="ml-2 text-sm text-gray-700">Meetup in person</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      formControlName="delivery"
                      class="form-checkbox h-4 w-4 text-green-600 rounded">
                    <span class="ml-2 text-sm text-gray-700">Local delivery</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      formControlName="shipping"
                      class="form-checkbox h-4 w-4 text-green-600 rounded">
                    <span class="ml-2 text-sm text-gray-700">Shipping nationwide</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Options -->
          <div class="bg-white rounded-xl sm:rounded-2xl border border-green-200 p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🎯 Additional Options</h3>

            <div class="space-y-4">
              <div>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    formControlName="isUrgent"
                    class="form-checkbox h-4 w-4 text-green-600 rounded">
                  <span class="ml-2 text-sm font-semibold text-gray-700">Mark as urgent (helps sellers prioritize)</span>
                </label>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
                <textarea
                  formControlName="additionalNotes"
                  rows="3"
                  placeholder="Any additional information, specific requirements, or notes for potential sellers..."
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"></textarea>
              </div>

              <!-- Tags -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Tags (Optional)</label>
                <div class="space-y-2">
                  <div formArrayName="tags">
                    <div *ngFor="let tag of tagsArray.controls; let i = index"
                         class="flex items-center gap-2">
                      <input
                        type="text"
                        [formControlName]="i"
                        placeholder="e.g., beginner, professional, tournament"
                        class="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <button
                        type="button"
                        (click)="removeTag(i)"
                        class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="addTag()"
                    class="text-green-600 hover:text-green-700 text-sm font-medium">
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <button
              type="button"
              routerLink="/looking-for"
              class="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200">
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="lookingForForm.invalid || isSubmitting()"
              class="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2">
              <svg *ngIf="isSubmitting()" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{{ isSubmitting() ? 'Posting...' : 'Post Looking For Request' }}</span>
            </button>
          </div>

          <!-- Subscription Notice -->
          <div *ngIf="subscriptionLimits()" class="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
              </svg>
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">Subscription Limits</p>
                <p>{{ subscriptionLimits() }}</p>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  `
})
export class CreateLookingForComponent implements OnInit {
  lookingForForm: FormGroup;
  currentUser = signal<User | null>(null);
  isSubmitting = signal(false);
  subscriptionLimits = signal<string>('');

  conditions = ['New', 'Like New', 'Excellent', 'Good', 'Fair'];
  cities: any[] = [];
  regions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private lookingForService: LookingForService,
    private authService: AuthService,
    private locationService: LocationService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.lookingForForm = this.createForm();
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadLocationData();
    this.loadSubscriptionLimits();
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      category: ['', [Validators.required]],
      urgency: ['flexible'],
      budgetMin: [null, [Validators.required, Validators.min(0)]],
      budgetMax: [null, [Validators.required, Validators.min(0)]],
      condition: this.fb.array([]),
      preferredBrands: this.fb.array([]),
      city: ['', [Validators.required]],
      region: ['', [Validators.required]],
      meetup: [true],
      delivery: [false],
      shipping: [false],
      isUrgent: [false],
      additionalNotes: [''],
      tags: this.fb.array([])
    }, { validators: this.budgetRangeValidator });
  }

  budgetRangeValidator(form: FormGroup) {
    const min = form.get('budgetMin')?.value;
    const max = form.get('budgetMax')?.value;

    if (min !== null && max !== null && min >= max) {
      return { budgetRange: true };
    }
    return null;
  }

  get preferredBrandsArray() {
    return this.lookingForForm.get('preferredBrands') as FormArray;
  }

  get tagsArray() {
    return this.lookingForForm.get('tags') as FormArray;
  }

  get conditionArray() {
    return this.lookingForForm.get('condition') as FormArray;
  }

  addPreferredBrand() {
    this.preferredBrandsArray.push(this.fb.control(''));
  }

  removePreferredBrand(index: number) {
    this.preferredBrandsArray.removeAt(index);
  }

  addTag() {
    this.tagsArray.push(this.fb.control(''));
  }

  removeTag(index: number) {
    this.tagsArray.removeAt(index);
  }

  onConditionChange(event: any) {
    const condition = event.target.value;
    const checked = event.target.checked;

    if (checked) {
      this.conditionArray.push(this.fb.control(condition));
    } else {
      const index = this.conditionArray.controls.findIndex(
        control => control.value === condition
      );
      if (index >= 0) {
        this.conditionArray.removeAt(index);
      }
    }
  }

  loadLocationData() {
    this.locationService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
      },
      error: (error) => {
        console.error('Error loading cities:', error);
      }
    });

    this.locationService.getRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
      },
      error: (error) => {
        console.error('Error loading regions:', error);
      }
    });
  }

  loadSubscriptionLimits() {
    const user = this.currentUser();
    if (!user) return;

    const plan = user.subscription?.plan || 'free';
    let limits = '';

    switch (plan) {
      case 'free':
        limits = 'Free Plan: 2 active Looking For posts allowed. Upgrade for more!';
        break;
      case 'basic':
        limits = 'Basic Plan: 5 active Looking For posts allowed.';
        break;
      case 'pro':
        limits = 'Pro Plan: Unlimited Looking For posts.';
        break;
      default:
        limits = 'Free Plan: 2 active Looking For posts allowed.';
    }

    this.subscriptionLimits.set(limits);
  }

  onSubmit() {
    if (this.lookingForForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const formValue = this.lookingForForm.value;

    const requestData: CreateLookingForRequest = {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      urgency: formValue.urgency,
      budget: {
        min: formValue.budgetMin,
        max: formValue.budgetMax
      },
      condition: formValue.condition,
      preferredBrands: formValue.preferredBrands.filter((brand: string) => brand.trim()),
      location: {
        city: formValue.city,
        region: formValue.region,
        willingToTravel: false,
        maxTravelDistance: 0
      },
      shippingPreferences: {
        meetup: formValue.meetup,
        delivery: formValue.delivery,
        shipping: formValue.shipping
      },
      tags: formValue.tags.filter((tag: string) => tag.trim()),
      additionalNotes: formValue.additionalNotes,
      isUrgent: formValue.isUrgent
    };

    this.lookingForService.createLookingForPost(requestData).subscribe({
      next: (response) => {
        this.notificationService.success('Looking For request posted successfully!');
        this.router.navigate(['/looking-for', response._id]);
      },
      error: (error) => {
        console.error('Error creating Looking For post:', error);
        this.notificationService.error(
          error.error?.error || 'Failed to create Looking For request. Please try again.'
        );
        this.isSubmitting.set(false);
      }
    });
  }
}