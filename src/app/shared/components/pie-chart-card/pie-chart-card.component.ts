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
  PieController,
  ArcElement,
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
    '#001244ff', // Biru Tua - 100%
    '#30529bff', // Biru - 85%
    '#60A5FA', // Biru Muda - 70%
    '#93C5FD', // Biru Sangat Muda - 55%
    '#CBD5E1', // Abu-abu Muda - 40%
    '#E5E7EB', // Abu-abu Sangat Muda - 25%
    '#F9FAFB', // Hampir putih - 15%
  ];

  /** 'sales' dipetakan sama seperti 'currency' */
  @Input() chartType: 'sales' | 'currency' | 'unit' = 'unit';

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
    if (!this.chart) {
      // Jika chart belum terbentuk, biarkan AfterViewInit membuatnya
      return;
    }

    let needUpdate = false;

    if (changes['labels']) {
      this.chart.data.labels = this.labels;
      needUpdate = true;
    }
    if (changes['data']) {
      this.chart.data.datasets[0].data = this.data;
      // Sesuaikan jumlah warna dengan jumlah data
      (this.chart.data.datasets[0] as any).backgroundColor = this.colors.slice(
        0,
        this.data.length
      );
      needUpdate = true;
    }
    if (changes['colors']) {
      (this.chart.data.datasets[0] as any).backgroundColor = this.colors.slice(
        0,
        this.data.length
      );
      needUpdate = true;
    }
    if (changes['showLegend']) {
      if (this.chart.options?.plugins?.legend) {
        this.chart.options.plugins!.legend!.display = this.showLegend;
        needUpdate = true;
      }
    }
    if (changes['chartType']) {
      // Tooltip pakai this.chartType → perlu update options
      this.applyTooltipFormatter();
      needUpdate = true;
    }

    if (needUpdate) {
      this.chart.update();
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

  // ===== Helpers =====
  private formatIDR(val: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val ?? 0);
  }

  /** Pasang tooltip callback sesuai chartType */
  private applyTooltipFormatter(): void {
    if (!this.chart?.options?.plugins) return;

    const that = this; // amankan konteks untuk dipakai di callback

    this.chart.options.plugins.tooltip = {
      ...this.chart.options.plugins.tooltip,
      callbacks: {
        label: (context: any) => {
          const chartTypeCfg = context.chart?.config?.type; // 'pie' | 'doughnut' | 'bar' | 'line' | ...
          const isPieLike =
            chartTypeCfg === 'pie' || chartTypeCfg === 'doughnut';
          const indexAxis = context.chart?.options?.indexAxis ?? 'x'; // 'x' (vertikal) | 'y' (horizontal)

          // Tentukan label dasar (dataset.label > label point > label dari labels[dataIndex])
          const baseLabel =
            context.dataset?.label ??
            context.label ??
            (typeof context.dataIndex === 'number'
              ? context.chart.data.labels?.[context.dataIndex]
              : '') ??
            '';

          // Ambil nilai sesuai jenis chart
          let value: number;
          if (typeof context.parsed === 'number') {
            // pie/doughnut → number langsung
            value = Number(context.parsed) || 0;
          } else {
            // bar/line: {x, y}
            value =
              indexAxis === 'y'
                ? Number(context.parsed?.x) || 0 // horizontal bar
                : Number(context.parsed?.y) || 0; // vertical bar/line
          }

          // Hitung persen hanya jika pie/doughnut
          let percentPart = '';
          if (isPieLike && Array.isArray(context.dataset?.data)) {
            const dataset = context.dataset.data as Array<number | string>;
            const total = dataset.reduce<number>(
              (sum, curr) => sum + (Number(curr) || 0),
              0
            );
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            percentPart = ` (${pct}%)`;
          }

          // 'sales' dipetakan ke format currency juga
          if (that.chartType === 'currency' || that.chartType === 'sales') {
            return `${baseLabel}: ${that.formatIDR(value)}${percentPart}`;
          } else {
            return `${baseLabel}: ${value} unit${percentPart}`;
          }
        },
      },
    };
  }

  private buildChart(): void {
    if (!this.canvasRef?.nativeElement) return;

    // Hancurkan chart lama jika ada (hindari leak saat hot reload)
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }

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
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.showLegend,
            position: 'top',
            labels: {
              padding: 6,
              usePointStyle: true,
              font: {
                size: 12,
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
            color: '#000000',
          },
          tooltip: {
            enabled: true,
            // callback diset via applyTooltipFormatter()
          },
        },
        layout: {
          padding: { y: 0 },
        },
        // 'cutout' hanya berpengaruh pada doughnut; aman diabaikan untuk pie
        cutout: '0%',
      },
    });

    // Pasang tooltip formatter sesuai chartType
    this.applyTooltipFormatter();
    this.chart.update();
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
          } catch (error) {
            // eslint-disable-next-line no-console
            console.debug('Chart resize warning (safe to ignore):', error);
          }
        }
      }, 50);
    });

    this.ro.observe(this.canvasRef.nativeElement.parentElement);
  }
}
