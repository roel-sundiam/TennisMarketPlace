import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductService, CreateProductRequest } from '../services/product.service';
import { ModalService } from '../services/modal.service';

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
  tagsString = '';

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
    private modalService: ModalService
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
  }

  onSubmit(): void {
    if (!this.product || !this.editForm.title || !this.editForm.description || !this.editForm.price) {
      return;
    }

    this.isLoading.set(true);

    // Parse tags from string
    this.editForm.tags = this.tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Create update payload with only the fields that can be updated
    const updatePayload: Partial<CreateProductRequest> = {
      title: this.editForm.title,
      description: this.editForm.description,
      price: this.editForm.price,
      condition: this.editForm.condition,
      location: this.editForm.location,
      tags: this.editForm.tags,
      negotiable: this.editForm.negotiable,
      shippingOptions: this.editForm.shippingOptions,
      reasonForSelling: this.editForm.reasonForSelling
    };

    this.productService.updateProduct(this.product._id, updatePayload).subscribe({
      next: (updatedProduct) => {
        this.isLoading.set(false);
        this.productUpdated.emit(updatedProduct);
        this.closeModal();
        this.modalService.success('Product Updated', 'Your product has been updated successfully!');
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error updating product:', error);
        this.modalService.error('Update Failed', 'Failed to update the product. Please try again.');
      }
    });
  }

  closeModal(): void {
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
}