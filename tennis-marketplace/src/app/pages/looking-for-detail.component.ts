import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { LookingForPost, LookingForResponse, LookingForService, RespondToLookingForRequest } from '../services/looking-for.service';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { NotificationService } from '../services/notification.service';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-looking-for-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Breadcrumb Navigation -->
      <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <nav class="flex text-sm text-gray-600">
            <a routerLink="/" class="hover:text-green-600">Home</a>
            <span class="mx-2">/</span>
            <a routerLink="/looking-for" class="hover:text-green-600">Looking For</a>
            <span class="mx-2">/</span>
            <span class="text-gray-900 font-medium line-clamp-1">{{ post()?.title }}</span>
          </nav>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-8">
        <div *ngIf="post(); else postNotFound" class="lg:grid lg:grid-cols-12 lg:gap-8">

          <!-- Main Content -->
          <div class="lg:col-span-8">
            <!-- Post Header -->
            <div class="bg-white rounded-2xl shadow-soft p-6 mb-6">
              <!-- Badges -->
              <div class="flex flex-wrap gap-2 mb-4">
                <span *ngIf="post()!.isPriority"
                      class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-sm rounded-full font-semibold">
                  🌟 Priority
                </span>
                <span *ngIf="post()!.isUrgent || post()!.urgency === 'asap'"
                      class="bg-red-500 text-white px-3 py-1 text-sm rounded-full font-semibold">
                  🚨 Urgent
                </span>
                <span class="bg-primary-100 text-primary-800 px-3 py-1 text-sm rounded-full font-medium">
                  {{ post()!.category }}
                </span>
                <span [class]="getUrgencyClass()" class="px-3 py-1 text-sm rounded-full font-medium">
                  {{ getUrgencyLabel() }}
                </span>
              </div>

              <!-- Title and Budget -->
              <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{{ post()!.title }}</h1>

              <div class="flex items-center justify-between mb-6">
                <div>
                  <span class="text-3xl font-bold text-primary-600">{{ formatBudget() }}</span>
                  <span class="text-gray-500 ml-2">Budget Range</span>
                </div>
                <div class="text-right">
                  <div [class]="getDaysLeftClass()" class="text-lg font-semibold">
                    {{ getDaysLeftText() }}
                  </div>
                  <div class="text-sm text-gray-500">{{ getTimeAgo() }}</div>
                </div>
              </div>

              <!-- Description -->
              <div class="prose max-w-none">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">What I'm looking for:</h3>
                <p class="text-gray-700 whitespace-pre-wrap">{{ post()!.description }}</p>
              </div>

              <!-- Additional Notes -->
              <div *ngIf="post()!.additionalNotes" class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 class="font-semibold text-blue-900 mb-2">Additional Notes:</h4>
                <p class="text-blue-800 whitespace-pre-wrap">{{ post()!.additionalNotes }}</p>
              </div>
            </div>

            <!-- Requirements -->
            <div class="bg-white rounded-2xl shadow-soft p-6 mb-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4">Requirements</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Acceptable Conditions -->
                <div *ngIf="post()!.condition && post()!.condition.length > 0">
                  <h3 class="font-semibold text-gray-900 mb-2">Acceptable Conditions</h3>
                  <div class="flex flex-wrap gap-2">
                    <span *ngFor="let condition of post()!.condition"
                          class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {{ condition }}
                    </span>
                  </div>
                </div>

                <!-- Preferred Brands -->
                <div *ngIf="post()!.preferredBrands && post()!.preferredBrands!.length > 0">
                  <h3 class="font-semibold text-gray-900 mb-2">Preferred Brands</h3>
                  <div class="flex flex-wrap gap-2">
                    <span *ngFor="let brand of post()!.preferredBrands"
                          class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {{ brand }}
                    </span>
                  </div>
                </div>

                <!-- Shipping Preferences -->
                <div>
                  <h3 class="font-semibold text-gray-900 mb-2">Preferred Delivery Method</h3>
                  <div class="space-y-1">
                    <div *ngIf="post()!.shippingPreferences.meetup" class="flex items-center text-sm text-gray-600">
                      <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      Meetup in person
                    </div>
                    <div *ngIf="post()!.shippingPreferences.delivery" class="flex items-center text-sm text-gray-600">
                      <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      Local delivery
                    </div>
                    <div *ngIf="post()!.shippingPreferences.shipping" class="flex items-center text-sm text-gray-600">
                      <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      Shipping nationwide
                    </div>
                  </div>
                </div>

                <!-- Tags -->
                <div *ngIf="post()!.tags && post()!.tags!.length > 0">
                  <h3 class="font-semibold text-gray-900 mb-2">Tags</h3>
                  <div class="flex flex-wrap gap-2">
                    <span *ngFor="let tag of post()!.tags"
                          class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      #{{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Responses -->
            <div class="bg-white rounded-2xl shadow-soft p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                  Responses ({{ responses().length }})
                </h2>
                <div class="text-sm text-gray-500">
                  {{ post()!.views || 0 }} views
                </div>
              </div>

              <!-- Response Form for non-owners -->
              <div *ngIf="authService.isAuthenticated() && !isOwner() && post()!.status === 'active'"
                   class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 class="font-semibold text-green-900 mb-3">Respond to this request</h3>

                <form [formGroup]="responseForm" (ngSubmit)="submitResponse()">
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Your response message *</label>
                      <textarea
                        formControlName="message"
                        rows="3"
                        placeholder="Describe what you have available that matches their request..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Your asking price (₱)</label>
                        <input
                          type="number"
                          formControlName="price"
                          placeholder="e.g., 12000"
                          min="0"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Contact method</label>
                        <select formControlName="preferredContact"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                          <option value="phone">Phone</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
                        <input
                          type="tel"
                          formControlName="phone"
                          placeholder="Your phone number"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp number</label>
                        <input
                          type="tel"
                          formControlName="whatsapp"
                          placeholder="Your WhatsApp number"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      </div>
                    </div>

                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        formControlName="negotiable"
                        class="h-4 w-4 text-green-600 rounded">
                      <label class="ml-2 text-sm text-gray-700">Price is negotiable</label>
                    </div>

                    <div class="flex justify-end">
                      <button
                        type="submit"
                        [disabled]="responseForm.invalid || isSubmittingResponse()"
                        class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                        {{ isSubmittingResponse() ? 'Sending...' : 'Send Response' }}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Login prompt -->
              <div *ngIf="!authService.isAuthenticated()"
                   class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <p class="text-blue-800 mb-3">Want to respond to this request?</p>
                <a routerLink="/login"
                   class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Login to Respond
                </a>
              </div>

              <!-- Owner Response Form (for replying to responses) -->
              <div *ngIf="authService.isAuthenticated() && isOwner() && responses().length > 0 && post()!.status === 'active'"
                   class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 class="font-semibold text-blue-900 mb-3">Reply to responses</h3>
                <form [formGroup]="responseForm" (ngSubmit)="submitResponse()">
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Your reply message *</label>
                      <textarea
                        formControlName="message"
                        rows="3"
                        placeholder="Reply to the responses you received..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Your budget (optional)</label>
                        <input
                          type="number"
                          formControlName="price"
                          placeholder="Enter amount"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      </div>
                      <div class="flex items-center pt-8">
                        <input
                          type="checkbox"
                          formControlName="negotiable"
                          id="owner-negotiable"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                        <label for="owner-negotiable" class="ml-2 text-sm text-gray-700">Price is negotiable</label>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Preferred contact method</label>
                        <select
                          formControlName="preferredContact"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="phone">Phone</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Contact number *</label>
                        <input
                          type="tel"
                          formControlName="contactNumber"
                          placeholder="+63 9XX XXX XXXX"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      </div>
                    </div>

                    <button
                      type="submit"
                      [disabled]="responseForm.invalid || isSubmittingResponse()"
                      class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      {{ isSubmittingResponse() ? 'Sending...' : 'Send Reply' }}
                    </button>
                  </div>
                </form>
              </div>

              <!-- Responses List -->
              <div *ngIf="responses().length > 0" class="space-y-4">
                <div *ngFor="let response of responses()"
                     class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">

                  <!-- Response Header -->
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-900">{{ getSellerName(response) }}</h4>
                        <svg *ngIf="response.seller.isVerified"
                             class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                      </div>
                      <div class="flex items-center gap-4 text-sm text-gray-500">
                        <div class="flex items-center">
                          <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          {{ response.seller.rating.average.toFixed(1) }}
                        </div>
                        <span>{{ response.seller.location.city }}, {{ response.seller.location.region }}</span>
                        <span>{{ getResponseTimeAgo(response) }}</span>
                      </div>
                    </div>

                    <div class="text-right">
                      <div *ngIf="response.price" class="text-lg font-bold text-green-600">
                        ₱{{ response.price.toLocaleString() }}
                        <span *ngIf="response.negotiable" class="text-sm text-gray-500 font-normal">negotiable</span>
                      </div>
                    </div>
                  </div>

                  <!-- Response Message -->
                  <p class="text-gray-700 mb-3 whitespace-pre-wrap">{{ response.message }}</p>

                  <!-- Contact Info (only show to post owner) -->
                  <div *ngIf="isOwner()" class="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h5 class="font-medium text-green-900 mb-2">Contact Information:</h5>
                    <div class="flex gap-4 text-sm">
                      <span *ngIf="response.contactInfo.phone" class="flex items-center">
                        <svg class="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        Phone: {{ response.contactInfo.phone }}
                      </span>
                      <span *ngIf="response.contactInfo.whatsapp" class="flex items-center">
                        <svg class="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.487"/>
                        </svg>
                        WhatsApp: {{ response.contactInfo.whatsapp }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No responses -->
              <div *ngIf="responses().length === 0" class="text-center py-8 text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l2.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
                </svg>
                <p>No responses yet. Be the first to respond!</p>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-4 mt-8 lg:mt-0">
            <!-- Buyer Info -->
            <div class="bg-white rounded-2xl shadow-soft p-6 mb-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Buyer Information</h3>

              <div class="mb-4">
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold text-gray-900">{{ getBuyerName() }}</h4>
                  <svg *ngIf="getBuyerVerified()"
                       class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="flex items-center text-sm text-gray-500">
                  <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  {{ getBuyerRating() }} rating
                </div>
              </div>

              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center">
                  <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {{ getBuyerLocation() }}
                </div>
              </div>

              <!-- Owner Actions -->
              <div *ngIf="isOwner()" class="mt-6 space-y-3">
                <button
                  *ngIf="post()!.status === 'active'"
                  (click)="markAsFulfilled()"
                  class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Mark as Fulfilled
                </button>

                <button
                  *ngIf="post()!.status === 'active'"
                  (click)="extendExpiry()"
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Extend by 30 days
                </button>

                <button
                  (click)="editPost()"
                  class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Edit Request
                </button>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="bg-white rounded-2xl shadow-soft p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Request Stats</h3>

              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Posted</span>
                  <span class="font-medium">{{ getTimeAgo() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Views</span>
                  <span class="font-medium">{{ post()!.views || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Responses</span>
                  <span class="font-medium">{{ responses().length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Status</span>
                  <span [class]="getStatusClass()" class="px-2 py-1 rounded-full text-xs font-medium capitalize">
                    {{ post()!.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Not Found Template -->
        <ng-template #postNotFound>
          <div class="text-center py-12">
            <svg class="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.464-.881-6.08-2.33M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Looking For request not found</h3>
            <p class="text-gray-600 mb-6">The request you're looking for doesn't exist or has been removed.</p>
            <a routerLink="/looking-for"
               class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Browse All Requests
            </a>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class LookingForDetailComponent implements OnInit {
  post = signal<LookingForPost | null>(null);
  responses = signal<LookingForResponse[]>([]);
  isSubmittingResponse = signal(false);
  responseForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lookingForService: LookingForService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.responseForm = this.createResponseForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadPost(id);
        this.loadResponses(id);
      }
    });
  }

  createResponseForm(): FormGroup {
    return this.fb.group({
      message: ['', [Validators.required]],
      price: [null],
      phone: [''],
      whatsapp: [''],
      contactNumber: ['', [Validators.required]],
      preferredContact: ['phone'],
      negotiable: [true]
    });
  }

  loadPost(id: string) {
    this.lookingForService.getLookingForPost(id).subscribe({
      next: (post) => {
        this.post.set(post);
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.notificationService.error('Failed to load Looking For request');
      }
    });
  }

  loadResponses(id: string) {
    this.lookingForService.getResponses(id).subscribe({
      next: (response) => {
        this.responses.set(response.responses);
      },
      error: (error) => {
        console.error('Error loading responses:', error);
      }
    });
  }

  submitResponse() {
    if (this.responseForm.invalid || this.isSubmittingResponse() || !this.post()) return;

    this.isSubmittingResponse.set(true);

    const formValue = this.responseForm.value;
    const responseData: RespondToLookingForRequest = {
      message: formValue.message,
      contactInfo: {
        phone: formValue.preferredContact === 'phone' || formValue.preferredContact === 'both' ? formValue.contactNumber : formValue.phone,
        whatsapp: formValue.preferredContact === 'whatsapp' || formValue.preferredContact === 'both' ? formValue.contactNumber : formValue.whatsapp,
        preferredContact: formValue.preferredContact
      },
      price: formValue.price,
      negotiable: formValue.negotiable
    };

    this.lookingForService.respondToLookingFor(this.post()!._id, responseData).subscribe({
      next: (response) => {
        this.notificationService.success('Response sent successfully!');
        this.responses.update(responses => [...responses, response.response]);
        this.responseForm.reset({
          preferredContact: 'phone',
          negotiable: true
        });
        this.isSubmittingResponse.set(false);
      },
      error: (error) => {
        console.error('Error sending response:', error);
        this.notificationService.error(
          error.error?.error || 'Failed to send response. Please try again.'
        );
        this.isSubmittingResponse.set(false);
      }
    });
  }

  markAsFulfilled() {
    if (!this.post()) return;

    if (confirm('Are you sure you want to mark this request as fulfilled? This action cannot be undone.')) {
      this.lookingForService.markAsFulfilled(this.post()!._id).subscribe({
        next: (response) => {
          this.post.set(response.lookingForPost);
          this.notificationService.success('Request marked as fulfilled');
        },
        error: (error) => {
          console.error('Error marking as fulfilled:', error);
          this.notificationService.error('Failed to mark as fulfilled');
        }
      });
    }
  }

  extendExpiry() {
    if (!this.post()) return;

    this.lookingForService.extendExpiry(this.post()!._id, 30).subscribe({
      next: (response) => {
        this.post.set(response.lookingForPost);
        this.notificationService.success('Request extended by 30 days');
      },
      error: (error) => {
        console.error('Error extending expiry:', error);
        this.notificationService.error('Failed to extend request');
      }
    });
  }

  editPost() {
    if (!this.post()) return;
    this.router.navigate(['/looking-for', this.post()!._id, 'edit']);
  }

  isOwner(): boolean {
    if (!this.post() || !this.authService.currentUser()) return false;
    const user = this.authService.currentUser();
    const buyer = this.post()!.buyer;
    return typeof buyer === 'object'
      ? buyer._id === user?._id
      : buyer === user?._id;
  }

  // Helper methods for display
  getBuyerName(): string {
    if (!this.post()) return '';
    const buyer = this.post()!.buyer;
    if (typeof buyer === 'string') return 'Anonymous';
    return `${buyer.firstName} ${buyer.lastName}`;
  }

  getBuyerAvatar(): string {
    if (!this.post()) return '/assets/default-avatar.jpg';
    const buyer = this.post()!.buyer;
    if (typeof buyer === 'string') return '/assets/default-avatar.jpg';
    return buyer.profilePicture || '/assets/default-avatar.jpg';
  }

  getBuyerVerified(): boolean {
    if (!this.post()) return false;
    const buyer = this.post()!.buyer;
    if (typeof buyer === 'string') return false;
    return buyer.isVerified;
  }

  getBuyerRating(): string {
    if (!this.post()) return '0.0';
    const buyer = this.post()!.buyer;
    if (typeof buyer === 'string') return '0.0';
    return buyer.rating.average.toFixed(1);
  }

  getBuyerLocation(): string {
    if (!this.post()) return '';
    const buyer = this.post()!.buyer;
    if (typeof buyer === 'string') return '';
    return `${buyer.location.city}, ${buyer.location.region}`;
  }

  getSellerName(response: LookingForResponse): string {
    return `${response.seller.firstName} ${response.seller.lastName}`;
  }

  getSellerAvatar(response: LookingForResponse): string {
    return response.seller.profilePicture || '/assets/default-avatar.jpg';
  }

  formatBudget(): string {
    if (!this.post()) return '';
    return this.lookingForService.formatBudgetRange(this.post()!.budget);
  }

  getUrgencyLabel(): string {
    if (!this.post()) return '';
    return this.lookingForService.getUrgencyLabel(this.post()!.urgency);
  }

  getUrgencyClass(): string {
    if (!this.post()) return '';
    return this.lookingForService.getUrgencyColor(this.post()!.urgency);
  }

  getDaysLeftText(): string {
    if (!this.post()) return '';
    if (this.post()!.isExpired) return 'Expired';

    const daysLeft = this.post()!.daysLeft;
    if (daysLeft <= 0) return 'Expires today';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  }

  getDaysLeftClass(): string {
    if (!this.post()) return '';
    if (this.post()!.isExpired) return 'text-red-600';
    return this.lookingForService.getDaysLeftColor(this.post()!.daysLeft);
  }

  getStatusClass(): string {
    if (!this.post()) return '';

    switch (this.post()!.status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTimeAgo(): string {
    if (!this.post()) return '';

    const createdAt = new Date(this.post()!.createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  }

  getResponseTimeAgo(response: LookingForResponse): string {
    const createdAt = new Date(response.createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return createdAt.toLocaleDateString();
  }
}