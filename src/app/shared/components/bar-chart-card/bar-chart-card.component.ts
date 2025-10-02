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

// Chart.js imports
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// PASTIKAN path tipe ini sesuai file kamu: src/app/types/chart.model.ts
import { ChartData } from '../../../types/charts.model';

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
    <div class="card border-0 shadow-sm">
      <div class="card-body p-2">
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
  /** Mode single */
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() label = 'Data';
  @Input() backgroundColor?: string | string[];
  @Input() borderColor?: string | string[];

  /** Mode multi (opsional legacy) */
  @Input() datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth?: number;
  }>;
  @Input() isMultiDataset = false;

  /** Rekomendasi: kirim ini saja dari parent */
  @Input() chartData?: ChartData;

  @Input() height = 300;
  @Input() showLegend = false;
  @Input() xTitle?: string;
  @Input() horizontal = true;
  @Input() chartType: 'sales' | 'currency' | 'unit' = 'unit';

  private readonly CHART_COLORS = [
    '#001244ff',
    '#30529bff',
    '#60A5FA',
    '#B08D57',
    '#E6BE8A',
    '#D4AF37',
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
      changes['chartData'] ||
      changes['datasets'] ||
      changes['isMultiDataset'] ||
      changes['horizontal'] ||
      changes['title'];

    const simpleUpdate =
      !needsRebuild &&
      (changes['labels'] || changes['data'] || changes['backgroundColor']);

    if (this.chart && simpleUpdate) {
      // Single dataset live update
      if (!this.hasMultiChartData()) {
        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = this.data;
        this.chart.data.datasets[0].backgroundColor = this.getBackgroundColors();
        this.chart.update();
        return;
      }
    }

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

  /** Deteksi apakah input efektifnya multi-dataset */
  private hasMultiChartData(): boolean {
    // chartData union: SingleChartData | MultiChartData
    if (this.chartData && 'datasets' in this.chartData) return true;
    if (this.isMultiDataset && this.datasets?.length) return true;
    return false;
  }

  private getBackgroundColors(): string[] {
    if (Array.isArray(this.backgroundColor)) {
      return this.backgroundColor;
    }
    if (this.backgroundColor) {
      return Array(this.data.length).fill(this.backgroundColor);
    }
    return this.data.map(
      (_, index) => this.CHART_COLORS[index % this.CHART_COLORS.length]
    );
  }

  private buildChart(): void {
    if (!this.canvasRef?.nativeElement) return;

    // Susun data Chart.js berdasarkan prioritas input
    let built: { labels: string[]; datasets: any[] } | null = null;

    if (this.chartData) {
      if ('datasets' in this.chartData) {
        // MultiChartData langsung
        built = {
          labels: this.chartData.labels,
          datasets: this.chartData.datasets,
        };
      } else {
        // SingleChartData → bungkus jadi satu dataset
        built = {
          labels: this.chartData.labels,
          datasets: [
            {
              label: this.label,
              data: this.chartData.data,
              backgroundColor: this.getBackgroundColorsForArray(this.chartData.data.length),
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false,
            },
          ],
        };
      }
    } else if (this.isMultiDataset && this.datasets) {
      built = { labels: this.labels, datasets: this.datasets };
    } else {
      // Fallback: single input labels+data
      built = {
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
      };
    }

    const isMulti = built.datasets.length > 1;

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: built,
      options: {
        indexAxis: this.horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            // Tampilkan legend otomatis bila multi; kalau single, pakai showLegend
            display: isMulti ? true : this.showLegend,
            position: 'top',
          },
          title: {
            display: !!this.title,
            text: this.title,
            font: { size: 13, weight: 'normal' },
            padding: { bottom: 20 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = this.horizontal
                  ? context.parsed.x
                  : context.parsed.y;

                if (this.chartType === 'currency') {
                  const formatted = new Intl.NumberFormat('id-ID').format(value);
                  return `${label}: Rp ${formatted}`;
                }
                // default unit/sales
                return `${label}: ${value}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: !!this.xTitle, text: this.xTitle || '' },
            beginAtZero: this.horizontal ? true : false,
            grid: {
              display: this.horizontal ? true : false,
              color: 'rgba(0,0,0,0.05)',
            },
            ticks: { precision: 0 },
          },
          y: {
            beginAtZero: this.horizontal ? false : true,
            grid: {
              display: this.horizontal ? false : true,
              color: 'rgba(0,0,0,0.05)',
            },
            ticks: this.horizontal
              ? { maxRotation: 0, minRotation: 0 }
              : { precision: 0 },
          },
        },
        elements: {
          bar: { borderWidth: 1 },
        },
      },
    });
  }

  private getBackgroundColorsForArray(length: number): string[] {
    if (Array.isArray(this.backgroundColor)) {
      // Jika parent memberi array warna, pakai sesuai panjang
      if (this.backgroundColor.length >= length) return this.backgroundColor as string[];
      // Kalau kurang panjang, ulangi
      return Array.from({ length }, (_, i) =>
        (this.backgroundColor as string[])[i % (this.backgroundColor as string[]).length]
      );
    }
    if (typeof this.backgroundColor === 'string' && this.backgroundColor) {
      return Array(length).fill(this.backgroundColor);
    }
    // default palette
    return Array.from({ length }, (_, i) => this.CHART_COLORS[i % this.CHART_COLORS.length]);
  }

  private setupResizeObserver(): void {
    if (!this.canvasRef?.nativeElement?.parentElement) return;

    let resizeTimeout: any;

    this.ro = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.chart && this.chart.canvas?.isConnected !== false) {
          try {
            this.chart.resize();
          } catch (e) {
            console.debug('Chart resize warning (safe to ignore):', e);
          }
        }
      }, 50);
    });

    this.ro.observe(this.canvasRef.nativeElement.parentElement);
  }
}
