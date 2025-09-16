// splash-screen.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css'],
})
export class SplashScreenComponent implements OnInit {
  @Input() progress: number = 10;
  @Input() message: string = 'Memulai aplikasi...';
  @Input() hasError: boolean = false;

  @Output() retry = new EventEmitter<void>();

  // Internal properties to track current state
  currentProgress: number = 10;
  currentMessage: string = 'Memulai aplikasi...';

  ngOnInit(): void {
    // Initialize with default values
    this.currentProgress = this.progress || 10;
    this.currentMessage = this.message || 'Memulai aplikasi...';

    console.log('Splash screen initialized:', {
      progress: this.currentProgress,
      message: this.currentMessage,
      hasError: this.hasError,
    });
  }

  ngOnChanges(): void {
    // Update current values when inputs change
    this.currentProgress = this.progress || 10;
    this.currentMessage = this.message || 'Memulai aplikasi...';

    console.log('Splash screen updated:', {
      progress: this.currentProgress,
      message: this.currentMessage,
      hasError: this.hasError,
    });
  }

  onRetry(): void {
    this.retry.emit();
  }
}
