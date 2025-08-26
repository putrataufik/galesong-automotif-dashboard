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
import { ChartData } from '../../../types/sales.model';

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
  implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title = 'Bar Chart';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() height = 300;
  @Input() showLegend = false;
  @Input() backgroundColor?: string | string[]; // Allow single color or array
  @Input() borderColor?: string | string[];
  @Input() label = 'Data';
  @Input() horizontal = true; // ← Default horizontal
  @Input() chartType: 'sales' | 'currency' | 'unit' = 'unit';
  // Tambahkan setelah existing @Input properties
  @Input() datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth?: number;
  }>; // ← Untuk multi-dataset
  @Input() isMultiDataset = false; // ← Flag untuk multi-dataset mode
  @Input() chartData?: ChartData;

  // Chart color palette - Blue gradient
  private readonly CHART_COLORS = [
    '#001244ff', // Biru Tua - 100%
    '#30529bff', // Biru - 85%
    '#60A5FA', // Biru Muda - 70%
    '#B08D57', // Biru Sangat Muda - 55%
    '#E6BE8A', // Abu-abu Muda - 40%
    '#D4AF37', // Abu-abu Sangat Muda - 25%
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

  const needsRebuild =
    changes['datasets'] ||
    changes['chartData'] ||
    changes['isMultiDataset'] ||
    changes['horizontal'] ||
    changes['title'];

  const simpleUpdate =
    !needsRebuild && (changes['labels'] || changes['data'] || changes['backgroundColor']);

  if (this.chart && simpleUpdate) {
    // mode single dataset
    if (!this.isMultiDataset && !this.chartData?.datasets) {
      this.chart.data.labels = this.labels;
      this.chart.data.datasets[0].data = this.data;
      this.chart.data.datasets[0].backgroundColor = this.getBackgroundColors();
      this.chart.update();
      return;
    }
  }

  // untuk multi-dataset / perubahan besar → rebuild
  if (needsRebuild) {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
    this.buildChart();
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
  
    // Determine chart data structure based on available inputs
    let chartData: any;
  
    if (this.chartData?.datasets) {
      // Use ChartData with datasets
      chartData = {
        labels: this.chartData.labels,
        datasets: this.chartData.datasets
      };
    } else if (this.isMultiDataset && this.datasets) {
      // Use standalone datasets input
      chartData = {
        labels: this.labels,
        datasets: this.datasets
      };
    } else {
      // Use single dataset mode
      chartData = {
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
        ]
      };
    }
  
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.horizontal ? 'bar' : 'bar',
      data: chartData,
      options: {
        // ... rest of your existing options
        indexAxis: this.horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.isMultiDataset || this.chartData?.datasets ? true : this.showLegend,
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
                
                let value: number;
                if (this.horizontal) {
                  value = context.parsed.x;
                } else {
                  value = context.parsed.y;
                }
                
                // Fix: Gunakan chartType untuk menentukan format
                if (this.chartType === 'currency' || this.isMultiDataset || this.chartData?.datasets) {
                  const formattedValue = new Intl.NumberFormat('id-ID').format(value);
                  return `${label}: Rp ${formattedValue}`;
                } else {
                  return `${label}: ${value} unit`;
                }
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
  
    // Debounce resize untuk menghindari ResizeObserver loop
    let resizeTimeout: any;
    
    this.ro = new ResizeObserver((entries) => {
      // Clear previous timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // Debounce resize operation
      resizeTimeout = setTimeout(() => {
        if (this.chart && !this.chart.canvas?.isConnected === false) {
          try {
            this.chart.resize();
          } catch (error) {
            // Silently handle resize errors
            console.debug('Chart resize warning (safe to ignore):', error);
          }
        }
      }, 50); // 50ms debounce
    });
  
    this.ro.observe(this.canvasRef.nativeElement.parentElement);
  }
}
