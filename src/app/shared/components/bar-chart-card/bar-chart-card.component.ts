// src/app/shared/components/bar-chart-card/bar-chart-card.component.ts

import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// Chart.js imports untuk Bar Chart
import {
  Chart,
  BarController, // ← Bar chart controller
  BarElement, // ← Bar elements
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-bar-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card border-0 shadow-sm h-100">
      <div class="card-body p-3">
        <div class="chart-container" [style.height.px]="height">
          <canvas #canvasRef></canvas>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./bar-chart-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartCardComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() title = 'Bar Chart';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() height = 300;
  @Input() showLegend = false;
  @Input() backgroundColor?: string | string[]; // Allow single color or array
  @Input() borderColor?: string | string[];
  @Input() label = 'Data';
  @Input() horizontal = true; // ← Default horizontal

  // Chart color palette - Blue gradient
  private readonly CHART_COLORS = [
    'rgba(13, 110, 253, 1.0)', 
    'rgba(0, 23, 58, 1)',
    'rgba(0, 37, 92, 1)', 
    'rgba(0, 58, 146, 1)', 
    'rgba(0, 87, 218, 1)', 
    'rgba(65, 141, 255, 1)', 
    'rgba(161, 199, 255, 1)', 
  ] as const;

  @ViewChild('canvasRef', { static: false })
  canvasRef?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private ro?: ResizeObserver;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.buildChart();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;
    if (changes['labels'] || changes['data']) {
      if (this.chart) {
        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = this.data;
        this.chart.data.datasets[0].backgroundColor =
          this.getBackgroundColors();
        this.chart.update();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
    if (this.ro) {
      this.ro.disconnect();
      this.ro = undefined;
    }
  }

  private getBackgroundColors(): string[] {
    if (Array.isArray(this.backgroundColor)) {
      return this.backgroundColor;
    }
    if (this.backgroundColor) {
      return Array(this.data.length).fill(this.backgroundColor);
    }
    // Use chart colors cycling through the palette
    return this.data.map(
      (_, index) => this.CHART_COLORS[index % this.CHART_COLORS.length]
    );
  }

  private buildChart(): void {
    if (!this.canvasRef?.nativeElement) return;

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.horizontal ? 'bar' : 'bar', // Chart.js uses 'bar' with indexAxis for horizontal
      data: {
        labels: this.labels,
        datasets: [
          {
            label: this.label,
            data: this.data,
            backgroundColor: this.getBackgroundColors(),
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: this.horizontal ? 'y' : 'x', // ← This makes it horizontal
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.showLegend,
            position: 'top',
          },
          title: {
            display: !!this.title,
            text: this.title,
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: {
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.x || context.parsed.y; // Handle both orientations
                return `${label}: ${value} unit`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: this.horizontal ? true : false,
            grid: {
              display: this.horizontal ? true : false,
              color: 'rgba(0,0,0,0.05)',
            },
            ticks: {
              precision: 0,
            },
          },
          y: {
            beginAtZero: this.horizontal ? false : true,
            grid: {
              display: this.horizontal ? false : true,
              color: 'rgba(0,0,0,0.05)',
            },
            ticks: this.horizontal
              ? {
                  // For horizontal bars, y-axis shows labels
                  maxRotation: 0,
                  minRotation: 0,
                }
              : {
                  precision: 0,
                },
          },
        },
        elements: {
          bar: {
            borderWidth: 1,
          },
        },
      },
    });
  }

  private setupResizeObserver(): void {
    if (!this.canvasRef?.nativeElement?.parentElement) return;

    this.ro = new ResizeObserver(() => {
      this.chart?.resize();
    });

    this.ro.observe(this.canvasRef.nativeElement.parentElement);
  }
}
