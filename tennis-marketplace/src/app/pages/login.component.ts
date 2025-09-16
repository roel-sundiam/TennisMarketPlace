import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-background-main dark:bg-dark-50 transition-colors duration-300 flex items-center justify-center py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-4 sm:space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="flex items-center justify-center gap-4 mb-6">
            <img src="/assets/logo.png" alt="Baseline Gearhub" class="w-20 h-20 md:w-28 md:h-28 object-contain">
            <div class="flex flex-col">
              <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 via-green-600 to-primary-700 dark:from-primary-400 dark:via-green-400 dark:to-primary-500 bg-clip-text text-transparent leading-tight">Baseline Gearhub</h1>
              <span class="text-sm text-gray-600 dark:text-dark-600">Your hub for tennis & pickleball gear</span>
            </div>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p class="mt-2 text-sm text-gray-600">
            Sign in to your account to start trading tennis & pickleball gear
          </p>
        </div>

        <!-- Login Form -->
        <div class="bg-white rounded-2xl shadow-xl p-4 sm:p-8 border border-green-200">
          @if (errorMessage()) {
            <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex">
                <span class="text-red-400 mr-2">⚠️</span>
                <span class="text-sm text-red-700">{{ errorMessage() }}</span>
              </div>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="Enter your email"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
              @if (loginForm.get('email')?.errors?.['required'] && loginForm.get('email')?.touched) {
                <p class="mt-1 text-sm text-red-600">Email is required</p>
              }
              @if (loginForm.get('email')?.errors?.['email'] && loginForm.get('email')?.touched) {
                <p class="mt-1 text-sm text-red-600">Please enter a valid email</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Enter your password"
                  class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (loginForm.get('password')?.errors?.['required'] && loginForm.get('password')?.touched) {
                <p class="mt-1 text-sm text-red-600">Password is required</p>
              }
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  formControlName="rememberMe"
                  class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500">
                <span class="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" class="text-sm text-green-600 hover:text-green-500">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              [disabled]="loginForm.invalid || authService.isLoading()"
              class="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              @if (authService.isLoading()) {
                <span class="flex items-center justify-center gap-2">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              } @else {
                Sign In
              }
            </button>
          </form>

        </div>

        <!-- Register Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <a routerLink="/register" class="text-green-600 hover:text-green-500 font-semibold">
              Create one now
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.errorMessage.set('');

      // Use real API only
      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          if (response.token && response.user) {
            console.log('Login successful:', response.user);
            // Navigate to return URL or home
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            this.router.navigate([returnUrl]);
          } else {
            this.errorMessage.set(response.message || 'Login failed');
          }
        },
        error: (error) => {
          if (error.status === 403 && error.error?.requiresApproval) {
            this.errorMessage.set(error.error.error || 'Your account is pending admin approval.');
          } else if (error.status === 401) {
            this.errorMessage.set('Invalid email or password. Please try again.');
          } else if (error.status === 0) {
            this.errorMessage.set('Unable to connect to server. Please ensure the backend is running.');
          } else {
            console.error('Login failed:', error);
            this.errorMessage.set(error.error?.error || 'An error occurred. Please try again.');
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
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
}