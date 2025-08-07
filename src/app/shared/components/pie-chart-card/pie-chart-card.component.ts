// src/app/shared/components/pie-chart-card/pie-chart-card.component.ts

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

// Chart.js imports untuk Pie Chart
import {
  Chart,
  PieController, // ← Pie chart controller
  ArcElement, // ← Arc elements untuk pie slices
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components yang dibutuhkan
Chart.register(
  PieController,
  ArcElement,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-pie-chart-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie-chart-card.component.html',
  styleUrl: './pie-chart-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartCardComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() title = 'Distribusi Penjualan';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() height = 300;
  @Input() showLegend = true;
  @Input() colors: string[] = [
  '#001244ff',  // Biru Tua - 100%
  '#30529bff',  // Biru - 85%
  '#60A5FA',  // Biru Muda - 70%
  '#93C5FD',  // Biru Sangat Muda - 55%
  '#CBD5E1',  // Abu-abu Muda - 40%
  '#E5E7EB',  // Abu-abu Sangat Muda - 25%
  '#F9FAFB',  // Hampir putih - 15%
];



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
      type: 'pie',
      data: {
        labels: this.labels,
        datasets: [
          {
            data: this.data,
            backgroundColor: this.colors.slice(0, this.data.length),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.showLegend,
            position: 'bottom',
            labels: {
              padding: 4,
              usePointStyle: true,
              font: {
                size: 8,
              },
            },
          },
          title: {
            display: !!this.title,
            text: this.title,
            font: {
              size: 14,
              weight: 'bold',
            },
            padding: {
              bottom: 10,
            },
            color: '000000',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const dataset = context.dataset.data as number[];
                const total = dataset.reduce(
                  (sum, current) => sum + current,
                  0
                );
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} unit (${percentage}%)`;
              },
            },
          },
        },
        layout: {
          padding: {
            y: 0,
          },
        },
        cutout: 60,
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
