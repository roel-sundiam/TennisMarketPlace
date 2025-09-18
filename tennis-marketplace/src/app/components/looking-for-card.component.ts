import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LookingForPost, LookingForService } from '../services/looking-for.service';

@Component({
  selector: 'app-looking-for-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group relative bg-white/90 dark:bg-dark-100/90 backdrop-blur-sm border border-neutral-200/60 dark:border-dark-200/60 overflow-hidden shadow-card hover:shadow-card-hover dark:hover:shadow-strong transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] animate-fade-in-up rounded-2xl"
         (click)="onPostClick()">

      <!-- Gradient Overlay on Hover -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-green-500/5 dark:from-primary-400/10 dark:to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <!-- Header with Avatar and Urgency -->
      <div class="relative p-6 pb-4">
        <!-- Priority Badge -->
        <div *ngIf="post.isPriority"
             class="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-strong backdrop-blur-sm border border-white/30 animate-pulse z-10">
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Priority
          </span>
        </div>

        <!-- Urgent Badge -->
        <div *ngIf="post.isUrgent || post.urgency === 'asap'"
             class="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 text-xs font-bold rounded-full shadow-strong backdrop-blur-sm border border-white/30 animate-bounce-gentle z-10">
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L3 7v11a1 1 0 001 1h3v-8h6v8h3a1 1 0 001-1V7l-7-5z"/>
            </svg>
            URGENT
          </span>
        </div>

        <!-- User Info (No Avatar) -->
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ getBuyerName() }}</h4>
            <div *ngIf="getBuyerVerified()" class="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="flex items-center">
              <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span class="text-sm text-gray-600 dark:text-gray-400 ml-1">{{ getBuyerRating() }}</span>
            </div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ getBuyerLocation() }}</p>
        </div>

        <!-- Category and Time Info -->
        <div class="flex items-center justify-between mb-3">
          <span class="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1 rounded-full text-xs font-medium">
            {{ post.category }}
          </span>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ getTimeAgo() }}
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 pb-4">
        <!-- Title -->
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {{ post.title }}
        </h3>

        <!-- Description -->
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {{ post.description }}
        </p>

        <!-- Budget -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
              {{ formatBudget() }}
            </span>
            <span *ngIf="post.budget.min !== post.budget.max" class="text-xs text-gray-500 dark:text-gray-400">
              Budget Range
            </span>
          </div>

          <!-- Urgency Badge -->
          <span [class]="getUrgencyClass()" class="px-2 py-1 rounded-full text-xs font-medium">
            {{ getUrgencyLabel() }}
          </span>
        </div>

        <!-- Preferred Brands -->
        <div *ngIf="post.preferredBrands && post.preferredBrands.length > 0" class="mb-4">
          <div class="flex flex-wrap gap-1">
            <span *ngFor="let brand of post.preferredBrands.slice(0, 3)"
                  class="inline-block bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
              {{ brand }}
            </span>
            <span *ngIf="post.preferredBrands.length > 3"
                  class="inline-block text-gray-500 dark:text-gray-400 px-2 py-1 text-xs">
              +{{ post.preferredBrands.length - 3 }} more
            </span>
          </div>
        </div>

        <!-- Condition Tags -->
        <div *ngIf="post.condition && post.condition.length > 0" class="mb-4">
          <div class="flex flex-wrap gap-1">
            <span *ngFor="let cond of post.condition.slice(0, 3)"
                  class="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs">
              {{ cond }}
            </span>
            <span *ngIf="post.condition.length > 3"
                  class="inline-block text-gray-500 dark:text-gray-400 px-2 py-1 text-xs">
              +{{ post.condition.length - 3 }} more
            </span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 dark:bg-dark-200/50 border-t border-gray-200 dark:border-dark-300/50">
        <!-- First Row: Stats -->
        <div class="flex items-center justify-between mb-3">
          <!-- Response Count -->
          <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l2.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
              </svg>
              <span>{{ post.responseCount || 0 }} {{ (post.responseCount || 0) === 1 ? 'response' : 'responses' }}</span>
            </div>

            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              <span>{{ post.views || 0 }} views</span>
            </div>
          </div>

          <!-- Days Left -->
          <div [class]="getDaysLeftClass()" class="text-sm font-medium">
            {{ getDaysLeftText() }}
          </div>
        </div>

        <!-- Second Row: Respond Button -->
        <div class="flex justify-end">
          <button
            (click)="onRespondClick($event)"
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transform hover:scale-105 transition-all duration-300"
            [attr.aria-label]="'Respond to this request'">
            Respond
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    @keyframes bounce-gentle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .animate-bounce-gentle {
      animation: bounce-gentle 2s ease-in-out infinite;
    }
  `]
})
export class LookingForCardComponent {
  @Input() post!: LookingForPost;
  @Output() postClick = new EventEmitter<LookingForPost>();
  @Output() respondClick = new EventEmitter<LookingForPost>();

  constructor(private lookingForService: LookingForService) {}

  onPostClick() {
    this.postClick.emit(this.post);
  }

  onRespondClick(event: Event) {
    event.stopPropagation();
    this.respondClick.emit(this.post);
  }

  getBuyerName(): string {
    if (typeof this.post.buyer === 'string') return 'Anonymous';
    return `${this.post.buyer.firstName} ${this.post.buyer.lastName}`;
  }

  getBuyerAvatar(): string {
    if (typeof this.post.buyer === 'string') return '/assets/default-avatar.jpg';
    return this.post.buyer.profilePicture || '/assets/default-avatar.jpg';
  }

  getBuyerVerified(): boolean {
    if (typeof this.post.buyer === 'string') return false;
    return this.post.buyer.isVerified;
  }

  getBuyerRating(): string {
    if (typeof this.post.buyer === 'string') return '0.0';
    return this.post.buyer.rating.average.toFixed(1);
  }

  getBuyerLocation(): string {
    if (typeof this.post.buyer === 'string') return '';
    return `${this.post.buyer.location.city}, ${this.post.buyer.location.region}`;
  }

  formatBudget(): string {
    return this.lookingForService.formatBudgetRange(this.post.budget);
  }

  getUrgencyLabel(): string {
    return this.lookingForService.getUrgencyLabel(this.post.urgency);
  }

  getUrgencyClass(): string {
    return this.lookingForService.getUrgencyColor(this.post.urgency);
  }

  getDaysLeftText(): string {
    if (this.post.isExpired) return 'Expired';

    const daysLeft = this.post.daysLeft;
    if (daysLeft <= 0) return 'Expires today';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  }

  getDaysLeftClass(): string {
    if (this.post.isExpired) return 'text-red-600 dark:text-red-400';
    return this.lookingForService.getDaysLeftColor(this.post.daysLeft);
  }

  getTimeAgo(): string {
    const createdAt = new Date(this.post.createdAt);
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
}