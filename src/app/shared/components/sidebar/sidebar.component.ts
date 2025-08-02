import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  path: string;
  label: string;
  icon: string; 
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // Angular 19 input/output (hanya untuk mobile)
  isCollapsed = input<boolean>(false);
  toggleSidebar = output<void>();

  menuItems: MenuItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard Utama',
      icon: 'dashboard' // akan menjadi assets/icons/home.png
    },
    {
      path: '/financial-tracking',
      label: 'Financial Tracker',
      icon: 'expense' // akan menjadi assets/icons/chart-line.png
    }
  ];

  onMenuClick(): void {
    // Close sidebar on mobile after menu click
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.toggleSidebar.emit();
    }
  }

  onMobileClose(): void {
    this.toggleSidebar.emit();
  }
}