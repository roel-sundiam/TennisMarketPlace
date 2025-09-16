import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductService, CreateProductRequest } from '../services/product.service';
import { ModalService } from '../services/modal.service';
import { UploadService } from '../services/upload.service';

@Component({
  selector: 'app-edit-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen()" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Edit Product</h2>
          <button 
            (click)="closeModal()" 
            class="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              [(ngModel)]="editForm.title"
              name="title"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              [(ngModel)]="editForm.description"
              name="description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required></textarea>
          </div>

          <!-- Price -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
            <input
              type="number"
              [(ngModel)]="editForm.price"
              name="price"
              min="0"
              step="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required>
          </div>

          <!-- Condition -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Condition</label>
            <select
              [(ngModel)]="editForm.condition"
              name="condition"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          <!-- Location -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                [ngModel]="editForm.location.city"
                (ngModelChange)="updateLocationCity($event)"
                name="city"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <input
                type="text"
                [ngModel]="editForm.location.region"
                (ngModelChange)="updateLocationRegion($event)"
                name="region"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required>
            </div>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              [(ngModel)]="tagsString"
              name="tags"
              placeholder="e.g., Wilson, Pro Staff, Advanced"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
          </div>

          <!-- Negotiable -->
          <div class="flex items-center">
            <input
              type="checkbox"
              [(ngModel)]="editForm.negotiable"
              name="negotiable"
              id="negotiable"
              class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
            <label for="negotiable" class="ml-2 block text-sm text-gray-900">
              Price is negotiable
            </label>
          </div>

          <!-- Shipping Options -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Shipping Options</label>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  [ngModel]="editForm.shippingOptions?.meetup || false"
                  (ngModelChange)="updateShippingMeetup($event)"
                  name="meetup"
                  id="meetup"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                <label for="meetup" class="ml-2 block text-sm text-gray-900">
                  Meetup available
                </label>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  [ngModel]="editForm.shippingOptions?.delivery || false"
                  (ngModelChange)="updateShippingDelivery($event)"
                  name="delivery"
                  id="delivery"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                <label for="delivery" class="ml-2 block text-sm text-gray-900">
                  Delivery available
                </label>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  [ngModel]="editForm.shippingOptions?.shipping || false"
                  (ngModelChange)="updateShippingShipping($event)"
                  name="shipping"
                  id="shipping"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                <label for="shipping" class="ml-2 block text-sm text-gray-900">
                  Nationwide shipping
                </label>
              </div>
            </div>
          </div>

          <!-- Reason for Selling -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reason for Selling (Optional)</label>
            <textarea
              [(ngModel)]="editForm.reasonForSelling"
              name="reasonForSelling"
              rows="2"
              placeholder="e.g., Upgrading to new model, no longer playing..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"></textarea>
          </div>

          <!-- Image Management -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Images</label>

            <!-- Current Images -->
            <div *ngIf="currentImages().length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-gray-600 mb-2">Current Images ({{ currentImages().length }}/8)</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div *ngFor="let image of currentImages(); let i = index" class="relative group">
                  <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      [src]="image.url"
                      [alt]="image.alt || 'Product image'"
                      class="w-full h-full object-cover">
                  </div>

                  <!-- Main Image Badge -->
                  <div *ngIf="image.isMain" class="absolute top-1 left-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                    Main
                  </div>

                  <!-- Delete Button -->
                  <button
                    type="button"
                    (click)="removeCurrentImage(i)"
                    class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    ×
                  </button>

                  <!-- Set as Main Button -->
                  <button
                    *ngIf="!image.isMain"
                    type="button"
                    (click)="setCurrentImageAsMain(i)"
                    class="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white px-1.5 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Set Main
                  </button>
                </div>
              </div>
            </div>

            <!-- Upload New Images -->
            <div class="space-y-3">
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                <input
                  type="file"
                  #fileInput
                  (change)="onImageSelect($event)"
                  multiple
                  accept="image/*"
                  class="hidden">

                <div class="space-y-2">
                  <div class="text-gray-400">
                    <svg class="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                  </div>

                  <button
                    type="button"
                    (click)="fileInput.click()"
                    [disabled]="totalImageCount() >= 8"
                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    {{ totalImageCount() >= 8 ? 'Max Images Reached' : 'Add Images' }}
                  </button>

                  <p class="text-xs text-gray-500">
                    {{ totalImageCount() }}/8 images • JPG, PNG, WebP • Max 5MB each
                  </p>
                </div>
              </div>

              <!-- New Image Previews -->
              <div *ngIf="newImages().length > 0" class="space-y-2">
                <h4 class="text-sm font-medium text-gray-600">New Images to Upload ({{ newImages().length }})</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <div *ngFor="let image of newImages(); let i = index" class="relative group">
                    <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        [src]="image.preview"
                        [alt]="'New image ' + (i + 1)"
                        class="w-full h-full object-cover">
                    </div>

                    <!-- Remove Button -->
                    <button
                      type="button"
                      (click)="removeNewImage(i)"
                      class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <!-- Upload Progress -->
              <div *ngIf="uploadProgress() > 0 && uploadProgress() < 100" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-blue-900">Uploading images...</span>
                  <span class="text-sm text-blue-700">{{ uploadProgress() }}%</span>
                </div>
                <div class="w-full bg-blue-200 rounded-full h-1.5">
                  <div class="bg-blue-600 h-1.5 rounded-full transition-all duration-300" [style.width.%]="uploadProgress()"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              (click)="closeModal()"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="isLoading()"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
              {{ isLoading() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class EditProductModalComponent implements OnInit {
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() productUpdated = new EventEmitter<Product>();

  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  tagsString = '';

  // Image management state
  currentImages = signal<Array<{url: string; alt?: string; isMain?: boolean}>>([]);
  newImages = signal<Array<{file: File; preview: string}>>([]);
  imagesToDelete = signal<number[]>([]);
  maxImages = 8;
  maxFileSize = 5 * 1024 * 1024; // 5MB

  editForm: CreateProductRequest = {
    title: '',
    description: '',
    price: 0,
    condition: 'Excellent',
    category: 'Racquets',
    brand: '',
    location: { city: '', region: '' },
    tags: [],
    negotiable: false,
    shippingOptions: {
      meetup: false,
      delivery: false,
      shipping: false
    },
    reasonForSelling: ''
  };

  constructor(
    private productService: ProductService,
    private modalService: ModalService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    if (this.product) {
      this.populateForm();
      this.isOpen.set(true);
    }
  }

  populateForm(): void {
    if (!this.product) return;

    this.editForm = {
      title: this.product.title,
      description: this.product.description,
      price: this.product.price,
      condition: this.product.condition,
      category: this.product.category,
      brand: this.product.brand,
      location: {
        city: this.product.location.city,
        region: this.product.location.region
      },
      tags: this.product.tags || [],
      negotiable: this.product.negotiable,
      shippingOptions: {
        meetup: this.product.shippingOptions?.meetup || false,
        delivery: this.product.shippingOptions?.delivery || false,
        shipping: this.product.shippingOptions?.shipping || false
      },
      reasonForSelling: this.product.reasonForSelling || ''
    };

    this.tagsString = this.product.tags?.join(', ') || '';

    // Initialize current images
    this.currentImages.set(this.product.images || []);

    // Reset new images and deletion tracking
    this.newImages.set([]);
    this.imagesToDelete.set([]);
    this.uploadProgress.set(0);
  }

  async onSubmit(): Promise<void> {
    if (!this.product || !this.editForm.title || !this.editForm.description || !this.editForm.price) {
      return;
    }

    this.isLoading.set(true);

    try {
      // Parse tags from string
      this.editForm.tags = this.tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Upload new images if any
      let newImageUrls: string[] = [];
      if (this.newImages().length > 0) {
        newImageUrls = await this.uploadNewImagesIfAny();
      }

      // Update images array with current + new images
      const updatedImages = this.updateProductImages(newImageUrls);

      // Create update payload with only the fields that can be updated
      const updatePayload: Partial<CreateProductRequest> & { images?: Array<{url: string; alt?: string; isMain?: boolean}> } = {
        title: this.editForm.title,
        description: this.editForm.description,
        price: this.editForm.price,
        condition: this.editForm.condition,
        location: this.editForm.location,
        tags: this.editForm.tags,
        negotiable: this.editForm.negotiable,
        shippingOptions: this.editForm.shippingOptions,
        reasonForSelling: this.editForm.reasonForSelling,
        images: updatedImages
      };

      this.uploadProgress.set(90);

      console.log('🔄 Sending product update request:', updatePayload);
      console.log('📸 Images in update payload:', updatePayload.images);
      console.log('🎯 Product ID for update:', this.product._id);

      console.log('📞 About to call productService.updateProduct...');
      const updateObservable = this.productService.updateProduct(this.product._id, updatePayload);
      console.log('📞 Observable created:', updateObservable);

      updateObservable.subscribe({
        next: (updatedProduct) => {
          console.log('✅ Product update response received:', updatedProduct);
          console.log('📸 Response images:', updatedProduct.images);
          console.log('📅 Response updatedAt:', updatedProduct.updatedAt);
          this.uploadProgress.set(100);

          setTimeout(() => {
            this.isLoading.set(false);
            this.uploadProgress.set(0);
            this.productUpdated.emit(updatedProduct);
            this.closeModal();
            this.modalService.success('Product Updated', 'Your product has been updated successfully!');

            // Clean up new image previews
            this.newImages().forEach(img => URL.revokeObjectURL(img.preview));
            this.newImages.set([]);
          }, 500);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.uploadProgress.set(0);
          console.error('❌ Product update failed:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          this.modalService.error('Update Failed', 'Failed to update the product. Please try again.');

          // Clean up new image previews on error
          this.newImages().forEach(img => URL.revokeObjectURL(img.preview));
          this.newImages.set([]);
        }
      });

    } catch (error) {
      this.isLoading.set(false);
      this.uploadProgress.set(0);
      console.error('Error during product update:', error);
      this.modalService.error('Update Failed', 'Failed to upload images. Please try again.');

      // Clean up new image previews on error
      this.newImages().forEach(img => URL.revokeObjectURL(img.preview));
      this.newImages.set([]);
    }
  }

  closeModal(): void {
    // Clean up new image previews
    this.newImages().forEach(img => URL.revokeObjectURL(img.preview));
    this.newImages.set([]);
    this.uploadProgress.set(0);

    this.isOpen.set(false);
    this.close.emit();
  }

  open(product: Product): void {
    this.product = product;
    this.populateForm();
    this.isOpen.set(true);
  }

  // Update methods for template binding
  updateLocationCity(city: string): void {
    this.editForm.location.city = city;
  }

  updateLocationRegion(region: string): void {
    this.editForm.location.region = region;
  }

  updateShippingMeetup(meetup: boolean): void {
    if (!this.editForm.shippingOptions) {
      this.editForm.shippingOptions = { meetup: false, delivery: false, shipping: false };
    }
    this.editForm.shippingOptions.meetup = meetup;
  }

  updateShippingDelivery(delivery: boolean): void {
    if (!this.editForm.shippingOptions) {
      this.editForm.shippingOptions = { meetup: false, delivery: false, shipping: false };
    }
    this.editForm.shippingOptions.delivery = delivery;
  }

  updateShippingShipping(shipping: boolean): void {
    if (!this.editForm.shippingOptions) {
      this.editForm.shippingOptions = { meetup: false, delivery: false, shipping: false };
    }
    this.editForm.shippingOptions.shipping = shipping;
  }

  // Image management methods
  totalImageCount(): number {
    return this.currentImages().length + this.newImages().length;
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.processSelectedFiles(files);

    // Clear the input so the same file can be selected again
    input.value = '';
  }

  private processSelectedFiles(files: File[]): void {
    const remainingSlots = this.maxImages - this.totalImageCount();

    if (remainingSlots <= 0) {
      this.modalService.warning('Image Limit', `You can only have up to ${this.maxImages} images total`);
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
        this.newImages.update(images => [...images, { file, preview }]);
      };
      reader.readAsDataURL(file);
    });
  }

  private validateFile(file: File): boolean {
    // Check file type
    if (!file.type.startsWith('image/')) {
      this.modalService.warning('Invalid File', `"${file.name}" is not a valid image file`);
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      this.modalService.warning('File Too Large', `"${file.name}" is too large. Maximum size is 5MB`);
      return false;
    }

    return true;
  }

  removeCurrentImage(index: number): void {
    this.currentImages.update(images => {
      const newImages = [...images];
      newImages.splice(index, 1);

      // If we removed the main image, set the first remaining image as main
      if (newImages.length > 0 && !newImages.some(img => img.isMain)) {
        newImages[0].isMain = true;
      }

      return newImages;
    });
  }

  setCurrentImageAsMain(index: number): void {
    this.currentImages.update(images => {
      const newImages = [...images];
      // Remove main flag from all images
      newImages.forEach(img => img.isMain = false);
      // Set selected image as main
      newImages[index].isMain = true;
      return newImages;
    });
  }

  removeNewImage(index: number): void {
    this.newImages.update(images => {
      const newImages = [...images];
      // Clean up the preview URL
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }

  private uploadNewImagesIfAny(): Promise<string[]> {
    const newImagesArray = this.newImages();
    if (newImagesArray.length === 0) {
      return Promise.resolve([]);
    }

    this.uploadProgress.set(10);

    const imageFiles = newImagesArray.map(img => img.file);

    return new Promise((resolve, reject) => {
      this.uploadService.uploadImages(imageFiles).subscribe({
        next: (uploadResponse) => {
          this.uploadProgress.set(70);

          if (uploadResponse?.success) {
            resolve(uploadResponse.urls);
          } else {
            reject(new Error(uploadResponse?.message || 'Upload failed'));
          }
        },
        error: (error) => {
          this.uploadProgress.set(0);
          reject(error);
        }
      });
    });
  }

  private updateProductImages(newImageUrls: string[]): Array<{url: string; alt?: string; isMain?: boolean}> {
    const currentImagesArray = this.currentImages();

    // Create new image objects from uploaded URLs
    const newImageObjects = newImageUrls.map((url, index) => ({
      url,
      alt: `${this.editForm.title} - Image ${currentImagesArray.length + index + 1}`,
      isMain: false
    }));

    // Combine current and new images
    const allImages = [...currentImagesArray, ...newImageObjects];

    // Ensure we have a main image
    if (allImages.length > 0 && !allImages.some(img => img.isMain)) {
      allImages[0].isMain = true;
    }

    return allImages;
  }
}