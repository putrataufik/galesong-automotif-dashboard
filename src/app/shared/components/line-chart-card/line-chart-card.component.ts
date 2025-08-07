import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler  // ✅ TAMBAHKAN INI - penting untuk area chart
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler  // ✅ REGISTER FILLER - wajib untuk area chart
);

@Component({
  selector: 'app-line-chart-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart-card.component.html',
  styleUrl: './line-chart-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartCardComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() title = 'Trend Penjualan per Bulan';
  @Input() labels: string[] = []; // contoh: ["01","02","03",...,"12"]
  @Input() data: number[] = []; // contoh: [19,18,22,...]
  @Input() height = 280; // tinggi canvas px
  @Input() showLegend = false;
  @Input() borderColor?: string;
  @Input() backgroundColor?: string;
  @Input() pointBackgroundColor?: string;
  @Input() pointBorderColor?: string;
  @Input() fill = true; // ✅ Default true untuk area chart
  @Input() label = '';

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

  private buildChart(): void {
    if (!this.canvasRef?.nativeElement) return;

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: this.label,
            data: this.data,
            tension: 0.4,
            fill: this.fill, // Ini akan bekerja setelah Filler diregister
            borderColor: this.borderColor || '#3b82f6', // Default blue
            backgroundColor: this.backgroundColor || 'rgba(59, 130, 246, 0.1)', // Default light blue
            pointBackgroundColor: this.pointBackgroundColor || this.borderColor || '#3b82f6',
            pointBorderColor: this.pointBorderColor || '#000',
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: this.showLegend },
          title: { display: !!this.title, text: this.title },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
          filler: {
            propagate: false
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { autoSkip: true, maxRotation: 0 },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          },
        },
        elements: {
          point: {
            hoverRadius: 6,
            hoverBorderWidth: 2
          }
        }
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