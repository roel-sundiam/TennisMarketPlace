import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-price',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="price-container" [ngClass]="containerClass">
      <span class="currency">₱</span>
      <span class="amount">{{ formattedAmount }}</span>
      <span *ngIf="showDecimals && hasDecimals" class="decimals">.{{ decimalPart }}</span>
    </div>
  `,
  styles: [`
    .price-container {
      @apply flex items-baseline font-bold;
    }
    
    .price-container.size-sm {
      @apply text-sm;
    }
    
    .price-container.size-md {
      @apply text-lg;
    }
    
    .price-container.size-lg {
      @apply text-xl;
    }
    
    .price-container.size-xl {
      @apply text-2xl;
    }
    
    .currency {
      @apply mr-0.5;
    }
    
    .amount {
      @apply font-bold;
    }
    
    .decimals {
      @apply text-sm opacity-75 ml-0.5;
    }
    
    /* Color variants */
    .price-container.color-primary {
      @apply text-green-600;
    }
    
    .price-container.color-secondary {
      @apply text-gray-600;
    }
    
    .price-container.color-dark {
      @apply text-gray-900;
    }
    
    .price-container.color-light {
      @apply text-gray-500;
    }
  `]
})
export class PriceComponent {
  @Input() amount!: number;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() color: 'primary' | 'secondary' | 'dark' | 'light' = 'dark';
  @Input() showDecimals = false;
  @Input() className = '';

  get containerClass(): string {
    return `size-${this.size} color-${this.color} ${this.className}`;
  }

  get formattedAmount(): string {
    if (this.showDecimals) {
      return Math.floor(this.amount).toLocaleString('en-PH');
    }
    return this.amount.toLocaleString('en-PH');
  }

  get hasDecimals(): boolean {
    return this.amount % 1 !== 0;
  }

  get decimalPart(): string {
    const decimal = this.amount % 1;
    return decimal.toFixed(2).substring(2);
  }
}