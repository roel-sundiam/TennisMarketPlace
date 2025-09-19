import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'browse',
    loadComponent: () => import('./pages/browse.component').then(m => m.BrowseComponent)
  },
  {
    path: 'sell',
    loadComponent: () => import('./pages/sell.component').then(m => m.SellComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin.component').then(m => m.AdminComponent),
    canActivate: [AdminGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./pages/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [AdminGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'looking-for',
    loadComponent: () => import('./pages/looking-for.component').then(m => m.LookingForComponent)
  },
  {
    path: 'looking-for/create',
    loadComponent: () => import('./pages/create-looking-for.component').then(m => m.CreateLookingForComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'looking-for/:id/edit',
    loadComponent: () => import('./pages/create-looking-for.component').then(m => m.CreateLookingForComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'looking-for/:id',
    loadComponent: () => import('./pages/looking-for-detail.component').then(m => m.LookingForDetailComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
