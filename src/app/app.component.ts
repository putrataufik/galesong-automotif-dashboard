import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'galesong-automotif-dashboard';
  
  // Angular 19 signals untuk state management
  private readonly _isSidebarCollapsed = signal(true); // Default collapsed di mobile
  private readonly _isMobile = signal(false);
  private readonly _currentPageTitle = signal('Dashboard');

  constructor(private router: Router) {
    this.checkIfMobile();
    
    // Listen untuk window resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkIfMobile());
    }

    // ✅ FIX: Listen untuk route changes untuk update page title
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.url);
    });
  }

  // Readonly signals
  isSidebarCollapsed = this._isSidebarCollapsed.asReadonly();
  isMobile = this._isMobile.asReadonly();
  currentPageTitle = this._currentPageTitle.asReadonly();

  toggleSidebar(): void {
    // Hanya untuk mobile
    if (this.isMobile()) {
      this._isSidebarCollapsed.update(collapsed => !collapsed);
    }
  }

  closeSidebar(): void {
    if (this.isMobile()) {
      this._isSidebarCollapsed.set(true);
    }
  }

  private checkIfMobile(): void {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      this._isMobile.set(isMobile);
      
      // Set sidebar state berdasarkan device
      if (isMobile) {
        this._isSidebarCollapsed.set(true); // Collapsed di mobile
      } else {
        this._isSidebarCollapsed.set(false); // Always visible di desktop
      }
    }
  }

  private updatePageTitle(url: string): void {
    switch (url) {
      case '/dashboard':
        this._currentPageTitle.set('Dashboard');
        break;
      case '/after-sales-dashboard':
        this._currentPageTitle.set('After Sales Dashboard');
        break;
      default:
        this._currentPageTitle.set('Dashboard');
    }
  }
}