import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    SidebarComponent,
    // HeaderComponent removed - no longer needed
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'galesong-automotif-dashboard';
  
  // Simplified - no need for sidebar collapsed state on mobile
  private readonly _isSidebarCollapsed = signal(false);
  private readonly _isMobile = signal(false);
  private readonly _currentPageTitle = signal('Dashboard');

  constructor(private router: Router) {
    this.checkIfMobile();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkIfMobile());
      
      // Fix tooltip issue
      this.disableTooltips();
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.url);
      // Re-disable tooltips after route change
      setTimeout(() => this.disableTooltips(), 100);
    });
  }

   private disableTooltips(): void {
    // Remove all title attributes that cause native tooltips
    const elementsWithTitle = document.querySelectorAll('[title]');
    elementsWithTitle.forEach(element => {
      element.removeAttribute('title');
    });

    // Disable Bootstrap tooltips if present
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(element => {
      element.removeAttribute('data-bs-toggle');
    });
  }

  // Readonly signals
  isSidebarCollapsed = this._isSidebarCollapsed.asReadonly();
  isMobile = this._isMobile.asReadonly();
  currentPageTitle = this._currentPageTitle.asReadonly();

  // Simplified toggle - no longer needed for mobile top nav
  toggleSidebar(): void {
    // No action needed since mobile uses top navigation
    // Desktop sidebar is always visible
  }

  // No longer needed
  closeSidebar(): void {
    // No action needed
  }

  private checkIfMobile(): void {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      this._isMobile.set(isMobile);
      
      // Desktop sidebar is always visible, mobile uses top nav
      this._isSidebarCollapsed.set(false);
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
      case '/finance-dashboard':
        this._currentPageTitle.set('Finance Dashboard');
        break;
      default:
        this._currentPageTitle.set('Dashboard');
    }
  }
}