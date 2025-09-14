import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <a routerLink="/" class="inline-flex items-center gap-2 mb-6">
            <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-lg">🎾</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">TennisMarket</h1>
          </a>
          <h2 class="text-3xl font-bold text-gray-900">Join TennisMarket</h2>
          <p class="mt-2 text-sm text-gray-600">
            Create your account to buy and sell tennis gear
          </p>
        </div>

        <!-- Register Form -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-green-200">
          @if (errorMessage()) {
            <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex">
                <span class="text-red-400 mr-2">⚠️</span>
                <span class="text-sm text-red-700">{{ errorMessage() }}</span>
              </div>
            </div>
          }

          @if (successMessage()) {
            <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex">
                <span class="text-green-400 mr-2">✅</span>
                <span class="text-sm text-green-700">{{ successMessage() }}</span>
              </div>
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  placeholder="First name"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
                @if (registerForm.get('firstName')?.errors?.['required'] && registerForm.get('firstName')?.touched) {
                  <p class="mt-1 text-sm text-red-600">First name is required</p>
                }
              </div>
              <div>
                <label for="lastName" class="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  placeholder="Last name"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
                @if (registerForm.get('lastName')?.errors?.['required'] && registerForm.get('lastName')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Last name is required</p>
                }
              </div>
            </div>

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
              @if (registerForm.get('email')?.errors?.['required'] && registerForm.get('email')?.touched) {
                <p class="mt-1 text-sm text-red-600">Email is required</p>
              }
              @if (registerForm.get('email')?.errors?.['email'] && registerForm.get('email')?.touched) {
                <p class="mt-1 text-sm text-red-600">Please enter a valid email</p>
              }
            </div>

            <div>
              <label for="phoneNumber" class="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                type="tel"
                formControlName="phoneNumber"
                placeholder="09171234567"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
              @if (registerForm.get('phoneNumber')?.errors?.['required'] && registerForm.get('phoneNumber')?.touched) {
                <p class="mt-1 text-sm text-red-600">Phone number is required</p>
              }
              @if (registerForm.get('phoneNumber')?.errors?.['pattern'] && registerForm.get('phoneNumber')?.touched) {
                <p class="mt-1 text-sm text-red-600">Please enter a valid Philippine phone number (09XXXXXXXXX)</p>
              }
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="city" class="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <select
                  id="city"
                  formControlName="city"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
                  <option value="">Select city</option>
                  
                  <!-- Metro Manila -->
                  <optgroup label="Metro Manila">
                    <option value="Manila">Manila</option>
                    <option value="Quezon City">Quezon City</option>
                    <option value="Makati">Makati</option>
                    <option value="Pasig">Pasig</option>
                    <option value="Taguig">Taguig</option>
                    <option value="Mandaluyong">Mandaluyong</option>
                    <option value="San Juan">San Juan</option>
                    <option value="Caloocan">Caloocan</option>
                    <option value="Malabon">Malabon</option>
                    <option value="Navotas">Navotas</option>
                    <option value="Valenzuela">Valenzuela</option>
                    <option value="Marikina">Marikina</option>
                    <option value="Parañaque">Parañaque</option>
                    <option value="Las Piñas">Las Piñas</option>
                    <option value="Muntinlupa">Muntinlupa</option>
                    <option value="Pateros">Pateros</option>
                  </optgroup>

                  <!-- Luzon Major Cities -->
                  <optgroup label="Central Luzon">
                    <option value="Angeles">Angeles</option>
                    <option value="San Fernando (Pampanga)">San Fernando (Pampanga)</option>
                    <option value="Malolos">Malolos</option>
                    <option value="Meycauayan">Meycauayan</option>
                    <option value="San Jose del Monte">San Jose del Monte</option>
                    <option value="Olongapo">Olongapo</option>
                    <option value="Cabanatuan">Cabanatuan</option>
                    <option value="Tarlac City">Tarlac City</option>
                    <option value="Balanga">Balanga</option>
                  </optgroup>

                  <optgroup label="CALABARZON">
                    <option value="Antipolo">Antipolo</option>
                    <option value="Calamba">Calamba</option>
                    <option value="Santa Rosa">Santa Rosa</option>
                    <option value="Biñan">Biñan</option>
                    <option value="San Pedro">San Pedro</option>
                    <option value="Bacoor">Bacoor</option>
                    <option value="Imus">Imus</option>
                    <option value="Dasmariñas">Dasmariñas</option>
                    <option value="General Trias">General Trias</option>
                    <option value="Trece Martires">Trece Martires</option>
                    <option value="Tagaytay">Tagaytay</option>
                    <option value="Batangas City">Batangas City</option>
                    <option value="Lipa">Lipa</option>
                    <option value="Tanauan">Tanauan</option>
                    <option value="Lucena">Lucena</option>
                  </optgroup>

                  <optgroup label="Ilocos Region">
                    <option value="Laoag">Laoag</option>
                    <option value="Vigan">Vigan</option>
                    <option value="San Fernando (La Union)">San Fernando (La Union)</option>
                    <option value="Dagupan">Dagupan</option>
                    <option value="Alaminos">Alaminos</option>
                    <option value="Urdaneta">Urdaneta</option>
                  </optgroup>

                  <optgroup label="Cagayan Valley">
                    <option value="Tuguegarao">Tuguegarao</option>
                    <option value="Cauayan">Cauayan</option>
                    <option value="Ilagan">Ilagan</option>
                    <option value="Santiago">Santiago</option>
                  </optgroup>

                  <optgroup label="Cordillera">
                    <option value="Baguio">Baguio</option>
                    <option value="Tabuk">Tabuk</option>
                    <option value="La Trinidad">La Trinidad</option>
                  </optgroup>

                  <optgroup label="Bicol Region">
                    <option value="Legazpi">Legazpi</option>
                    <option value="Naga">Naga</option>
                    <option value="Iriga">Iriga</option>
                    <option value="Sorsogon City">Sorsogon City</option>
                    <option value="Masbate City">Masbate City</option>
                  </optgroup>

                  <!-- Visayas -->
                  <optgroup label="Western Visayas">
                    <option value="Iloilo City">Iloilo City</option>
                    <option value="Bacolod">Bacolod</option>
                    <option value="Roxas">Roxas</option>
                    <option value="Silay">Silay</option>
                    <option value="Talisay (Negros Occidental)">Talisay (Negros Occidental)</option>
                    <option value="Kabankalan">Kabankalan</option>
                    <option value="Sagay">Sagay</option>
                    <option value="Cadiz">Cadiz</option>
                    <option value="Victorias">Victorias</option>
                    <option value="San Carlos (Negros Occidental)">San Carlos (Negros Occidental)</option>
                    <option value="Himamaylan">Himamaylan</option>
                    <option value="La Carlota">La Carlota</option>
                  </optgroup>

                  <optgroup label="Central Visayas">
                    <option value="Cebu City">Cebu City</option>
                    <option value="Mandaue">Mandaue</option>
                    <option value="Lapu-Lapu">Lapu-Lapu</option>
                    <option value="Talisay (Cebu)">Talisay (Cebu)</option>
                    <option value="Toledo">Toledo</option>
                    <option value="Danao">Danao</option>
                    <option value="Carcar">Carcar</option>
                    <option value="Naga (Cebu)">Naga (Cebu)</option>
                    <option value="Tagbilaran">Tagbilaran</option>
                    <option value="Dumaguete">Dumaguete</option>
                    <option value="Bayawan">Bayawan</option>
                    <option value="Canlaon">Canlaon</option>
                    <option value="Guihulngan">Guihulngan</option>
                    <option value="Bais">Bais</option>
                    <option value="Tanjay">Tanjay</option>
                  </optgroup>

                  <optgroup label="Eastern Visayas">
                    <option value="Tacloban">Tacloban</option>
                    <option value="Ormoc">Ormoc</option>
                    <option value="Maasin">Maasin</option>
                    <option value="Baybay">Baybay</option>
                    <option value="Calbayog">Calbayog</option>
                    <option value="Catbalogan">Catbalogan</option>
                    <option value="Borongan">Borongan</option>
                  </optgroup>

                  <!-- Mindanao -->
                  <optgroup label="Northern Mindanao">
                    <option value="Cagayan de Oro">Cagayan de Oro</option>
                    <option value="Iligan">Iligan</option>
                    <option value="Butuan">Butuan</option>
                    <option value="Malaybalay">Malaybalay</option>
                    <option value="Valencia (Bukidnon)">Valencia (Bukidnon)</option>
                    <option value="Ozamiz">Ozamiz</option>
                    <option value="Tangub">Tangub</option>
                    <option value="Oroquieta">Oroquieta</option>
                    <option value="Gingoog">Gingoog</option>
                    <option value="Balingoan">Balingoan</option>
                    <option value="El Salvador">El Salvador</option>
                  </optgroup>

                  <optgroup label="Davao Region">
                    <option value="Davao City">Davao City</option>
                    <option value="Tagum">Tagum</option>
                    <option value="Panabo">Panabo</option>
                    <option value="Island Garden City of Samal">Island Garden City of Samal</option>
                    <option value="Digos">Digos</option>
                    <option value="Mati">Mati</option>
                  </optgroup>

                  <optgroup label="SOCCSKSARGEN">
                    <option value="General Santos">General Santos</option>
                    <option value="Koronadal">Koronadal</option>
                    <option value="Tacurong">Tacurong</option>
                    <option value="Kidapawan">Kidapawan</option>
                    <option value="Cotabato City">Cotabato City</option>
                  </optgroup>

                  <optgroup label="Zamboanga Peninsula">
                    <option value="Zamboanga City">Zamboanga City</option>
                    <option value="Pagadian">Pagadian</option>
                    <option value="Dipolog">Dipolog</option>
                    <option value="Dapitan">Dapitan</option>
                  </optgroup>

                  <optgroup label="CARAGA">
                    <option value="Surigao City">Surigao City</option>
                    <option value="Tandag">Tandag</option>
                    <option value="Bislig">Bislig</option>
                    <option value="Bayugan">Bayugan</option>
                    <option value="Cabadbaran">Cabadbaran</option>
                  </optgroup>

                  <optgroup label="BARMM">
                    <option value="Marawi">Marawi</option>
                    <option value="Lamitan">Lamitan</option>
                    <option value="Jolo">Jolo</option>
                    <option value="Bongao">Bongao</option>
                  </optgroup>
                </select>
                @if (registerForm.get('city')?.errors?.['required'] && registerForm.get('city')?.touched) {
                  <p class="mt-1 text-sm text-red-600">City is required</p>
                }
              </div>
              <div>
                <label for="region" class="block text-sm font-semibold text-gray-700 mb-2">
                  Region *
                </label>
                <input
                  id="region"
                  type="text"
                  formControlName="region"
                  [value]="getRegionForCity(registerForm.get('city')?.value)"
                  readonly
                  placeholder="Region will be auto-filled based on city"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed">
                @if (registerForm.get('region')?.errors?.['required'] && registerForm.get('region')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Region is required</p>
                }
              </div>
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
                  placeholder="Create a strong password"
                  class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (registerForm.get('password')?.errors?.['required'] && registerForm.get('password')?.touched) {
                <p class="mt-1 text-sm text-red-600">Password is required</p>
              }
              @if (registerForm.get('password')?.errors?.['minlength'] && registerForm.get('password')?.touched) {
                <p class="mt-1 text-sm text-red-600">Password must be at least 8 characters</p>
              }
              @if (registerForm.get('password')?.errors?.['pattern'] && registerForm.get('password')?.touched) {
                <p class="mt-1 text-sm text-red-600">Password must contain letters, numbers, and special characters</p>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                placeholder="Confirm your password"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
              @if (registerForm.get('confirmPassword')?.errors?.['required'] && registerForm.get('confirmPassword')?.touched) {
                <p class="mt-1 text-sm text-red-600">Please confirm your password</p>
              }
              @if (registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched) {
                <p class="mt-1 text-sm text-red-600">Passwords do not match</p>
              }
            </div>

            <div class="flex items-start">
              <input
                id="terms"
                type="checkbox"
                formControlName="acceptTerms"
                class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1">
              <label for="terms" class="ml-3 text-sm text-gray-600">
                I agree to the 
                <a href="#" class="text-green-600 hover:text-green-500">Terms of Service</a> 
                and 
                <a href="#" class="text-green-600 hover:text-green-500">Privacy Policy</a>
              </label>
            </div>
            @if (registerForm.get('acceptTerms')?.errors?.['required'] && registerForm.get('acceptTerms')?.touched) {
              <p class="text-sm text-red-600">You must accept the terms and conditions</p>
            }

            <button
              type="submit"
              [disabled]="registerForm.invalid || authService.isLoading()"
              class="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              @if (authService.isLoading()) {
                <span class="flex items-center justify-center gap-2">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              } @else {
                Create Account
              }
            </button>
          </form>
        </div>

        <!-- Login Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <a routerLink="/login" class="text-green-600 hover:text-green-500 font-semibold">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  showPassword = signal<boolean>(false);

  // City to Region mapping
  private cityToRegionMap: { [key: string]: string } = {
    // Metro Manila
    'Manila': 'Metro Manila',
    'Quezon City': 'Metro Manila',
    'Makati': 'Metro Manila',
    'Pasig': 'Metro Manila',
    'Taguig': 'Metro Manila',
    'Mandaluyong': 'Metro Manila',
    'San Juan': 'Metro Manila',
    'Caloocan': 'Metro Manila',
    'Malabon': 'Metro Manila',
    'Navotas': 'Metro Manila',
    'Valenzuela': 'Metro Manila',
    'Marikina': 'Metro Manila',
    'Parañaque': 'Metro Manila',
    'Las Piñas': 'Metro Manila',
    'Muntinlupa': 'Metro Manila',
    'Pateros': 'Metro Manila',

    // Central Luzon
    'Angeles': 'Central Luzon',
    'San Fernando (Pampanga)': 'Central Luzon',
    'Malolos': 'Central Luzon',
    'Meycauayan': 'Central Luzon',
    'San Jose del Monte': 'Central Luzon',
    'Olongapo': 'Central Luzon',
    'Cabanatuan': 'Central Luzon',
    'Tarlac City': 'Central Luzon',
    'Balanga': 'Central Luzon',

    // CALABARZON
    'Antipolo': 'CALABARZON',
    'Calamba': 'CALABARZON',
    'Santa Rosa': 'CALABARZON',
    'Biñan': 'CALABARZON',
    'San Pedro': 'CALABARZON',
    'Bacoor': 'CALABARZON',
    'Imus': 'CALABARZON',
    'Dasmariñas': 'CALABARZON',
    'General Trias': 'CALABARZON',
    'Trece Martires': 'CALABARZON',
    'Tagaytay': 'CALABARZON',
    'Batangas City': 'CALABARZON',
    'Lipa': 'CALABARZON',
    'Tanauan': 'CALABARZON',
    'Lucena': 'CALABARZON',

    // Ilocos Region
    'Laoag': 'Ilocos Region',
    'Vigan': 'Ilocos Region',
    'San Fernando (La Union)': 'Ilocos Region',
    'Dagupan': 'Ilocos Region',
    'Alaminos': 'Ilocos Region',
    'Urdaneta': 'Ilocos Region',

    // Cagayan Valley
    'Tuguegarao': 'Cagayan Valley',
    'Cauayan': 'Cagayan Valley',
    'Ilagan': 'Cagayan Valley',
    'Santiago': 'Cagayan Valley',

    // Cordillera Administrative Region
    'Baguio': 'Cordillera Administrative Region',
    'Tabuk': 'Cordillera Administrative Region',
    'La Trinidad': 'Cordillera Administrative Region',

    // Bicol Region
    'Legazpi': 'Bicol Region',
    'Naga': 'Bicol Region',
    'Iriga': 'Bicol Region',
    'Sorsogon City': 'Bicol Region',
    'Masbate City': 'Bicol Region',

    // Western Visayas
    'Iloilo City': 'Western Visayas',
    'Bacolod': 'Western Visayas',
    'Roxas': 'Western Visayas',
    'Silay': 'Western Visayas',
    'Talisay (Negros Occidental)': 'Western Visayas',
    'Kabankalan': 'Western Visayas',
    'Sagay': 'Western Visayas',
    'Cadiz': 'Western Visayas',
    'Victorias': 'Western Visayas',
    'San Carlos (Negros Occidental)': 'Western Visayas',
    'Himamaylan': 'Western Visayas',
    'La Carlota': 'Western Visayas',

    // Central Visayas
    'Cebu City': 'Central Visayas',
    'Mandaue': 'Central Visayas',
    'Lapu-Lapu': 'Central Visayas',
    'Talisay (Cebu)': 'Central Visayas',
    'Toledo': 'Central Visayas',
    'Danao': 'Central Visayas',
    'Carcar': 'Central Visayas',
    'Naga (Cebu)': 'Central Visayas',
    'Tagbilaran': 'Central Visayas',
    'Dumaguete': 'Central Visayas',
    'Bayawan': 'Central Visayas',
    'Canlaon': 'Central Visayas',
    'Guihulngan': 'Central Visayas',
    'Bais': 'Central Visayas',
    'Tanjay': 'Central Visayas',

    // Eastern Visayas
    'Tacloban': 'Eastern Visayas',
    'Ormoc': 'Eastern Visayas',
    'Maasin': 'Eastern Visayas',
    'Baybay': 'Eastern Visayas',
    'Calbayog': 'Eastern Visayas',
    'Catbalogan': 'Eastern Visayas',
    'Borongan': 'Eastern Visayas',

    // Northern Mindanao
    'Cagayan de Oro': 'Northern Mindanao',
    'Iligan': 'Northern Mindanao',
    'Butuan': 'Northern Mindanao',
    'Malaybalay': 'Northern Mindanao',
    'Valencia (Bukidnon)': 'Northern Mindanao',
    'Ozamiz': 'Northern Mindanao',
    'Tangub': 'Northern Mindanao',
    'Oroquieta': 'Northern Mindanao',
    'Gingoog': 'Northern Mindanao',
    'Balingoan': 'Northern Mindanao',
    'El Salvador': 'Northern Mindanao',

    // Davao Region
    'Davao City': 'Davao Region',
    'Tagum': 'Davao Region',
    'Panabo': 'Davao Region',
    'Island Garden City of Samal': 'Davao Region',
    'Digos': 'Davao Region',
    'Mati': 'Davao Region',

    // SOCCSKSARGEN
    'General Santos': 'SOCCSKSARGEN',
    'Koronadal': 'SOCCSKSARGEN',
    'Tacurong': 'SOCCSKSARGEN',
    'Kidapawan': 'SOCCSKSARGEN',
    'Cotabato City': 'SOCCSKSARGEN',

    // Zamboanga Peninsula
    'Zamboanga City': 'Zamboanga Peninsula',
    'Pagadian': 'Zamboanga Peninsula',
    'Dipolog': 'Zamboanga Peninsula',
    'Dapitan': 'Zamboanga Peninsula',

    // CARAGA
    'Surigao City': 'CARAGA',
    'Tandag': 'CARAGA',
    'Bislig': 'CARAGA',
    'Bayugan': 'CARAGA',
    'Cabadbaran': 'CARAGA',

    // BARMM
    'Marawi': 'Bangsamoro Autonomous Region in Muslim Mindanao',
    'Lamitan': 'Bangsamoro Autonomous Region in Muslim Mindanao',
    'Jolo': 'Bangsamoro Autonomous Region in Muslim Mindanao',
    'Bongao': 'Bangsamoro Autonomous Region in Muslim Mindanao'
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public authService: AuthService
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    // Subscribe to city changes to automatically update region
    this.registerForm.get('city')?.valueChanges.subscribe(city => {
      if (city) {
        const region = this.getRegionForCity(city);
        this.registerForm.get('region')?.setValue(region);
      } else {
        this.registerForm.get('region')?.setValue('');
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [
        Validators.required, 
        Validators.pattern('^(\\+639|09)\\d{9}$')
      ]],
      city: ['', Validators.required],
      region: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  getRegionForCity(city: string): string {
    return this.cityToRegionMap[city] || '';
  }

  onSubmit(): void {
    // Clear any previous messages
    this.errorMessage.set('');
    this.successMessage.set('');
    
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;

      // Remove confirmPassword and acceptTerms from API request and structure location
      const { confirmPassword, acceptTerms, city, region, ...restData } = formData;
      
      const userData = {
        ...restData,
        location: {
          city,
          region
        }
      };

      // Use real API only - no mock fallback for registration
      this.authService.register(userData).subscribe({
        next: (response) => {
          if (response.requiresApproval) {
            // User registered but needs approval
            this.successMessage.set(response.message || 'Registration successful! Your account is pending admin approval.');
            this.errorMessage.set('');
            // Don't navigate, let user know to wait for approval
          } else if (response.token && response.user) {
            console.log('Registration successful:', response.user);
            // Navigate to welcome page or home
            this.router.navigate(['/']);
          } else {
            this.errorMessage.set(response.message || 'Registration failed');
          }
        },
        error: (error) => {
          console.error('Registration failed:', error);
          const errorMessage = error.error?.error || error.message || 'Registration failed. Please try again.';
          this.errorMessage.set(errorMessage);
        }
      });
    } else {
      // Form is invalid - reset loading state and show validation errors
      this.authService.isLoading.set(false);
      this.markFormGroupTouched(this.registerForm);
      
      // Find and display first validation error
      const firstErrorField = this.getFirstInvalidFieldError();
      if (firstErrorField) {
        this.errorMessage.set(firstErrorField);
      }
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

  private getFirstInvalidFieldError(): string | null {
    const controls = this.registerForm.controls;
    
    // Check each field in order and return the first error found
    if (controls['firstName']?.invalid && controls['firstName']?.errors) {
      return 'Please enter your first name.';
    }
    if (controls['lastName']?.invalid && controls['lastName']?.errors) {
      return 'Please enter your last name.';
    }
    if (controls['email']?.invalid && controls['email']?.errors) {
      const emailErrors = controls['email'].errors;
      if (emailErrors['required']) return 'Please enter your email address.';
      if (emailErrors['email']) return 'Please enter a valid email address.';
    }
    if (controls['phoneNumber']?.invalid && controls['phoneNumber']?.errors) {
      const phoneErrors = controls['phoneNumber'].errors;
      if (phoneErrors['required']) return 'Please enter your phone number.';
      if (phoneErrors['pattern']) return 'Please enter a valid Philippine phone number (e.g., +639123456789 or 09123456789).';
    }
    if (controls['city']?.invalid && controls['city']?.errors) {
      return 'Please select your city.';
    }
    if (controls['region']?.invalid && controls['region']?.errors) {
      return 'Please select your region.';
    }
    if (controls['password']?.invalid && controls['password']?.errors) {
      const passwordErrors = controls['password'].errors;
      if (passwordErrors['required']) return 'Please enter a password.';
      if (passwordErrors['minlength']) return 'Password must be at least 6 characters long.';
    }
    if (controls['confirmPassword']?.invalid && controls['confirmPassword']?.errors) {
      const confirmPasswordErrors = controls['confirmPassword'].errors;
      if (confirmPasswordErrors['required']) return 'Please confirm your password.';
      if (confirmPasswordErrors['passwordMismatch']) return 'Passwords do not match.';
    }
    if (controls['acceptTerms']?.invalid && controls['acceptTerms']?.errors) {
      return 'Please accept the Terms of Service and Privacy Policy.';
    }
    
    return 'Please fill in all required fields correctly.';
  }
}