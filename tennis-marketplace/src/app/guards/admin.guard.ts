import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUser();
    
    if (this.authService.isAuthenticated() && currentUser?.role === 'admin') {
      return true;
    } else {
      console.log('❌ Admin access denied. User:', currentUser?.email, 'Role:', currentUser?.role);
      // Redirect to login page with return URL
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url, error: 'admin-required' }
      });
      return false;
    }
  }
}