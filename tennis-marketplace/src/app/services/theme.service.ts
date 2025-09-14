import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'tennis-marketplace-theme';
  
  // Current theme setting (what user selected)
  private _theme = signal<Theme>('system');
  
  // Actual applied theme (resolved from system if needed)
  private _resolvedTheme = signal<'light' | 'dark'>('light');
  
  // System preference
  private _systemTheme = signal<'light' | 'dark'>('light');
  
  // Public readonly signals
  readonly theme = this._theme.asReadonly();
  readonly resolvedTheme = this._resolvedTheme.asReadonly();
  readonly systemTheme = this._systemTheme.asReadonly();
  
  // Derived computed properties
  readonly isDarkMode = () => this._resolvedTheme() === 'dark';
  readonly isLightMode = () => this._resolvedTheme() === 'light';
  
  constructor() {
    this.initializeTheme();
    this.setupSystemThemeListener();
    
    // Effect to apply theme changes
    effect(() => {
      this.applyTheme();
    });
  }
  
  private initializeTheme() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this._theme.set(savedTheme);
    }
    
    // Detect initial system theme
    this.updateSystemTheme();
    
    // Set initial resolved theme
    this.updateResolvedTheme();
  }
  
  private setupSystemThemeListener() {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => {
      this._systemTheme.set(e.matches ? 'dark' : 'light');
      this.updateResolvedTheme();
    });
  }
  
  private updateSystemTheme() {
    if (typeof window === 'undefined') return;
    
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this._systemTheme.set(isDark ? 'dark' : 'light');
  }
  
  private updateResolvedTheme() {
    const currentTheme = this._theme();
    
    if (currentTheme === 'system') {
      this._resolvedTheme.set(this._systemTheme());
    } else {
      this._resolvedTheme.set(currentTheme);
    }
  }
  
  private applyTheme() {
    if (typeof document === 'undefined') return;
    
    const resolvedTheme = this._resolvedTheme();
    const htmlElement = document.documentElement;
    
    // Remove existing theme classes
    htmlElement.classList.remove('light', 'dark');
    
    // Add current theme class
    htmlElement.classList.add(resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(resolvedTheme);
    
    // Emit custom event for other components that might need to know
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: resolvedTheme }
    }));
  }
  
  private updateMetaThemeColor(theme: 'light' | 'dark') {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      // Use tennis green for light mode, dark green for dark mode
      metaThemeColor.setAttribute('content', 
        theme === 'dark' ? '#065f46' : '#16a34a'
      );
    }
  }
  
  // Public methods
  setTheme(theme: Theme) {
    this._theme.set(theme);
    this.updateResolvedTheme();
    
    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
  
  toggleTheme() {
    const current = this._theme();
    
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('system');
    } else {
      this.setTheme('light');
    }
  }
  
  // Utility methods for components
  getThemeIcon(): string {
    const theme = this._theme();
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
      default: return '💻';
    }
  }
  
  getThemeLabel(): string {
    const theme = this._theme();
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'system': return 'System';
      default: return 'System';
    }
  }
  
  // Get theme-aware colors for dynamic styling
  getThemeColors() {
    const isDark = this.isDarkMode();
    
    return {
      background: isDark ? '#1a1a1a' : '#ffffff',
      surface: isDark ? '#2d2d2d' : '#f8fafc',
      primary: isDark ? '#22c55e' : '#16a34a',
      text: isDark ? '#e6e6e6' : '#1a1a1a',
      textSecondary: isDark ? '#b3b3b3' : '#6b7280',
      border: isDark ? '#404040' : '#e5e7eb',
    };
  }
}