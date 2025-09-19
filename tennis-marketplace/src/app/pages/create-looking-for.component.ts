import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { LookingForService, CreateLookingForRequest, LookingForCreateResponse, LookingForPost } from '../services/looking-for.service';
import { AuthService, User } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { CoinService } from '../services/coin.service';
import { ModalService } from '../services/modal.service';

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
                <span class="hidden sm:inline">{{ isEditMode() ? 'Edit Request' : 'Looking For' }}</span>
                <span class="sm:hidden">{{ isEditMode() ? 'Edit' : 'LF' }}</span>
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

      <!-- Coin Info Banner - only show in create mode -->
      <div *ngIf="!isEditMode()" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-yellow-400 rounded-full p-2">
                <svg class="w-5 h-5 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div>
                <h4 class="font-semibold text-yellow-800">💰 Looking For Request Cost</h4>
                <p class="text-sm text-yellow-700">Creating a Looking For request costs <strong>10 coins</strong></p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-yellow-700">Your balance:</p>
              <p class="text-xl font-bold text-yellow-800">{{ coinService.coinBalance().balance }} coins</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-8">
        <div class="bg-white rounded-xl border border-green-200 p-8 text-center">
          <div class="flex items-center justify-center space-x-2">
            <svg class="w-6 h-6 animate-spin text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span class="text-gray-600">Loading Looking For request...</span>
          </div>
        </div>
      </div>

      <!-- Main Form -->
      <div *ngIf="!isLoading()" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-8">
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
                      [checked]="isConditionSelected(condition)"
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
              [disabled]="lookingForForm.invalid || isSubmitting() || (!isEditMode() && coinService.coinBalance().balance < 10)"
              class="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2">
              <svg *ngIf="isSubmitting()" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{{
                isSubmitting() ? (isEditMode() ? 'Updating...' : 'Posting...') :
                (!isEditMode() && coinService.coinBalance().balance < 10) ? 'Insufficient Coins (Need 10)' :
                isEditMode() ? 'Update Request' : 'Post Looking For Request'
              }}</span>
            </button>
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
  isEditMode = signal(false);
  isLoading = signal(false);
  postId = signal<string | null>(null);

  conditions = ['New', 'Like New', 'Excellent', 'Good', 'Fair'];

  constructor(
    private fb: FormBuilder,
    private lookingForService: LookingForService,
    private authService: AuthService,
    private notificationService: NotificationService,
    public coinService: CoinService,
    private modalService: ModalService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.lookingForForm = this.createForm();
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    // Load coin balance
    this.coinService.loadCoinBalance().subscribe();

    // Check if we're in edit mode by looking for an ID parameter
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.postId.set(id);
      this.isEditMode.set(true);
      this.loadLookingForPost(id);
    }
  }

  loadLookingForPost(id: string) {
    this.isLoading.set(true);
    this.lookingForService.getLookingForPost(id).subscribe({
      next: (post) => {
        this.populateForm(post);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading Looking For post:', error);
        this.notificationService.error('Failed to load Looking For post');
        this.router.navigate(['/looking-for']);
        this.isLoading.set(false);
      }
    });
  }

  populateForm(post: LookingForPost) {
    // Update form values
    this.lookingForForm.patchValue({
      title: post.title,
      description: post.description,
      category: post.category,
      urgency: post.urgency,
      budgetMin: post.budget.min,
      budgetMax: post.budget.max,
      isUrgent: post.isUrgent,
      additionalNotes: post.additionalNotes || ''
    });

    // Handle condition array
    const conditionArray = this.conditionArray;
    conditionArray.clear();
    if (post.condition && post.condition.length > 0) {
      post.condition.forEach(condition => {
        conditionArray.push(this.fb.control(condition));
      });
    }

    // Handle preferred brands array
    const brandsArray = this.preferredBrandsArray;
    brandsArray.clear();
    if (post.preferredBrands && post.preferredBrands.length > 0) {
      post.preferredBrands.forEach(brand => {
        brandsArray.push(this.fb.control(brand));
      });
    }

    // Handle tags array
    const tagsArray = this.tagsArray;
    tagsArray.clear();
    if (post.tags && post.tags.length > 0) {
      post.tags.forEach(tag => {
        tagsArray.push(this.fb.control(tag));
      });
    }

    // Update condition checkboxes to reflect loaded data
    this.updateConditionCheckboxes(post.condition || []);
  }

  updateConditionCheckboxes(selectedConditions: string[]) {
    // This will be used to update the UI state of checkboxes
    // The actual checkbox state is managed by checking if the condition exists in the FormArray
  }

  isConditionSelected(condition: string): boolean {
    return this.conditionArray.controls.some(control => control.value === condition);
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



  onSubmit() {
    if (this.lookingForForm.invalid || this.isSubmitting()) return;

    // Check coin balance before proceeding (only for create mode)
    if (!this.isEditMode()) {
      const LOOKING_FOR_COST = 10;
      const currentBalance = this.coinService.coinBalance().balance;

      if (currentBalance < LOOKING_FOR_COST) {
        this.modalService.error(
          'Insufficient Coins',
          `You need ${LOOKING_FOR_COST} coins to create a Looking For request. Your current balance is ${currentBalance} coins. Please purchase more coins to continue.`
        );
        return;
      }
    }

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
      tags: formValue.tags.filter((tag: string) => tag.trim()),
      additionalNotes: formValue.additionalNotes,
      isUrgent: formValue.isUrgent
    };

    if (this.isEditMode()) {
      // Update existing post
      const postId = this.postId();
      if (!postId) {
        this.notificationService.error('Post ID not found');
        this.isSubmitting.set(false);
        return;
      }

      this.lookingForService.updateLookingForPost(postId, requestData).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.notificationService.success('Looking For request updated successfully!');
          this.router.navigate(['/looking-for', postId]);
        },
        error: (error) => {
          console.error('Error updating Looking For post:', error);
          this.notificationService.error(
            error.error?.error || 'Failed to update Looking For request. Please try again.'
          );
          this.isSubmitting.set(false);
        }
      });
    } else {
      // Create new post
      this.lookingForService.createLookingForPost(requestData).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);

          // Refresh coin balance after successful creation
          this.coinService.loadCoinBalance().subscribe();

          if (response.coinCost) {
            this.notificationService.success(
              `Looking For request posted successfully! ${response.coinCost} coins deducted. New balance: ${response.newBalance} coins.`
            );
          } else {
            this.notificationService.success('Looking For request posted successfully!');
          }
          this.router.navigate(['/looking-for', response._id]);
        },
        error: (error) => {
          console.error('Error creating Looking For post:', error);

          // Handle specific coin-related errors
          if (error.error?.code === 'INSUFFICIENT_COINS') {
            this.modalService.error(
              'Insufficient Coins',
              `You need ${error.error.required} coins to create a Looking For request. Your current balance is ${error.error.current} coins. Please purchase more coins to continue.`
            );
          } else {
            this.notificationService.error(
              error.error?.error || 'Failed to create Looking For request. Please try again.'
            );
          }
          this.isSubmitting.set(false);
        }
      });
    }
  }
}