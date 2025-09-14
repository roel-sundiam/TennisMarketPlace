import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Desktop Theme Toggle -->
      <button
        (click)="toggleTheme()"
        class="hidden md:flex items-center justify-center w-10 h-10 rounded-2xl bg-white/80 dark:bg-dark-100/80 backdrop-blur-sm border border-neutral-200/60 dark:border-dark-200/60 hover:bg-white dark:hover:bg-dark-100 transition-all duration-200 shadow-soft hover:shadow-medium group"
        [title]="themeService.getThemeLabel()"
        type="button">
        <span class="text-lg group-hover:scale-110 transition-transform duration-200">
          {{ themeService.getThemeIcon() }}
        </span>
      </button>

      <!-- Mobile Theme Toggle (Dropdown) -->
      <div class="md:hidden">
        <button
          (click)="showDropdown = !showDropdown"
          class="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 dark:bg-dark-100/80 backdrop-blur-sm border border-neutral-200/60 dark:border-dark-200/60 hover:bg-white dark:hover:bg-dark-100 transition-all duration-200 shadow-soft text-sm font-medium text-neutral-700 dark:text-dark-800"
          type="button">
          <span class="text-base">{{ themeService.getThemeIcon() }}</span>
          <span class="hidden sm:inline">{{ getShortThemeLabel() }}</span>
          <svg class="w-4 h-4 transform transition-transform" 
               [class.rotate-180]="showDropdown" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div 
          *ngIf="showDropdown"
          class="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-100 rounded-2xl shadow-strong border border-neutral-200/60 dark:border-dark-200/60 backdrop-blur-xl z-50 overflow-hidden animate-scale-in-content">
          <div class="p-2 space-y-1">
            <button
              *ngFor="let option of themeOptions"
              (click)="setTheme(option.value)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-neutral-50 dark:hover:bg-dark-200/50 transition-colors text-sm font-medium text-neutral-700 dark:text-dark-800"
              [class.bg-primary-50]="themeService.theme() === option.value"
              [class.text-primary-700]="themeService.theme() === option.value"
              [class.dark:bg-primary-900/20]="themeService.theme() === option.value"
              [class.dark:text-primary-300]="themeService.theme() === option.value">
              <span class="text-lg">{{ option.icon }}</span>
              <div class="flex-1 min-w-0">
                <div class="font-medium">{{ option.label }}</div>
                <div class="text-xs text-neutral-500 dark:text-dark-600 mt-0.5">{{ option.description }}</div>
              </div>
              <div *ngIf="themeService.theme() === option.value" class="text-primary-600 dark:text-primary-400">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Backdrop for mobile dropdown -->
      <div 
        *ngIf="showDropdown"
        class="fixed inset-0 z-40 md:hidden" 
        (click)="showDropdown = false">
      </div>
    </div>
  `
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
  
  showDropdown = false;
  
  themeOptions = [
    {
      value: 'light' as const,
      label: 'Light Mode',
      description: 'Bright and clean interface',
      icon: '☀️'
    },
    {
      value: 'dark' as const,
      label: 'Dark Mode', 
      description: 'Easy on the eyes',
      icon: '🌙'
    },
    {
      value: 'system' as const,
      label: 'System',
      description: 'Match your device settings',
      icon: '💻'
    }
  ];

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.themeService.setTheme(theme);
    this.showDropdown = false;
  }

  getShortThemeLabel(): string {
    const theme = this.themeService.theme();
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'Auto';
      default: return 'Auto';
    }
  }
}