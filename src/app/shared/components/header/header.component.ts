import { Component, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  // Input untuk menerima title page
  pageTitle = input<string>('Dashboard');
  
  // Output untuk emit menu toggle
  menuToggle = output<void>();

  onMenuToggle(): void {
    this.menuToggle.emit();
  }
}