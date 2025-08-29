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
  Filler,
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
  Filler
);

type LineDs = {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | CanvasGradient;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  fill?: boolean;
  tension?: number;
  borderWidth?: number;
};

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
  @Input() labels: string[] = [];

  // ==== (BARU) MULTI DATASET ====
  @Input() datasets?: LineDs[];

  // ==== (LEGACY) Single dataset - tetap didukung ====
  @Input() data: number[] = [];
  @Input() label = '';
  @Input() fill = true;
  @Input() borderColor?: string;
  @Input() backgroundColor?: string;
  @Input() pointBackgroundColor?: string;
  @Input() pointBorderColor?: string;

  @Input() height = 280;
  @Input() showLegend = false;
  @Input() xtitle = '';
  @Input() ytitle = '';

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
    if (changes['labels'] || changes['data'] || changes['datasets']) {
      if (this.chart) {
        this.chart.data.labels = this.labels;
        this.chart.data.datasets = this.resolveDatasets();
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
        datasets: this.resolveDatasets(),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: this.showLegend },
          title: {
            display: !!this.title,
            text: this.title,
            color: '#000000',
            font: { size: 14, weight: 'bold' },
          },
          tooltip: { mode: 'index', intersect: false },
          filler: { propagate: false },
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { title: { display: true, text: this.xtitle }, grid: { display: false }, ticks: { autoSkip: true, maxRotation: 0 } },
          y: { title: { display: true, text: this.ytitle },
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
        },
        elements: {
          point: { hoverRadius: 6, hoverBorderWidth: 2 },
        },
      },
    });
  }

  /** Bangun array datasets. Jika @Input() datasets ada, pakai itu; jika tidak, gunakan properti single dataset lama. */
  private resolveDatasets(): any[] {
    if (this.datasets && this.datasets.length) {
      // Pastikan ada default style minimal
      return this.datasets.map((ds, idx) => ({
        label: ds.label,
        data: ds.data,
        tension: ds.tension ?? 0.4,
        fill: ds.fill ?? false,
        borderWidth: ds.borderWidth ?? 3,
        borderColor: ds.borderColor ?? (idx === 0 ? '#3b82f6' : '#ef4444'),
        backgroundColor:
          ds.backgroundColor ??
          (idx === 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)'),
        pointBackgroundColor:
          ds.pointBackgroundColor ??
          (ds.borderColor ?? (idx === 0 ? '#3b82f6' : '#ef4444')),
        pointBorderColor: ds.pointBorderColor ?? '#000000',
      }));
    }

    // Fallback: single dataset (kompatibel ke belakang)
    return [
      {
        label: this.label || 'Series',
        data: this.data || [],
        tension: 0.4,
        fill: this.fill,
        borderWidth: 3,
        borderColor: this.borderColor || '#3b82f6',
        backgroundColor: this.backgroundColor || 'rgba(59,130,246,0.1)',
        pointBackgroundColor:
          this.pointBackgroundColor || this.borderColor || '#0047aaff',
        pointBorderColor: this.pointBorderColor || '#000000ff',
      },
    ];
  }

  private setupResizeObserver(): void {
    if (!this.canvasRef?.nativeElement?.parentElement) return;

    let resizeTimeout: any;

    this.ro = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.chart && !this.chart.canvas?.isConnected === false) {
          try {
            this.chart.resize();
          } catch (error) {
            console.debug('Chart resize warning (safe to ignore):', error);
          }
        }
      }, 50);
    });

    this.ro.observe(this.canvasRef.nativeElement.parentElement);
  }
}
