// src/app/shared/components/charts/target-realization-barchart/target-realization-barchart.component.ts
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

interface MonthlyTargetData {
  month: string;
  target: number;
  realization: number;
}

@Component({
  selector: 'app-target-realization-barchart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './target-realization-barchart.component.html',
  styleUrl: './target-realization-barchart.component.css',
})
export class TargetRealizationBarChartComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('chartCanvas', { static: true })
  chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() data: MonthlyTargetData[] = [];
  @Input() title: string = 'Target vs Realisasi After Sales';

  private chart: Chart | null = null;

  ngOnInit() {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateChart();
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: this.data.map((d) => d.month),
        datasets: [
          {
            label: 'Target',
            data: this.data.map((d) => d.target),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Realisasi',
            data: this.data.map((d) => d.realization),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.title,
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${value.toLocaleString(
                  'id-ID'
                )} unit`;
              },
              afterBody: function (tooltipItems) {
                if (tooltipItems.length >= 2) {
                  const target =
                    tooltipItems.find((item) => item.dataset.label === 'Target')
                      ?.parsed.y || 0;
                  const realization =
                    tooltipItems.find(
                      (item) => item.dataset.label === 'Realisasi'
                    )?.parsed.y || 0;
                  const percentage =
                    target > 0
                      ? ((realization / target) * 100).toFixed(1)
                      : '0';
                  return [`Pencapaian: ${percentage}%`];
                }
                return [];
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              font: {
                size: 11,
              },
              callback: function (value) {
                if (typeof value === 'number') {
                  return value.toLocaleString('id-ID') + ' unit';
                }
                return value;
              },
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart() {
    if (!this.chart) return;

    this.chart.data.labels = this.data.map((d) => d.month);
    this.chart.data.datasets[0].data = this.data.map((d) => d.target);
    this.chart.data.datasets[1].data = this.data.map((d) => d.realization);
    this.chart.update('active');
  }
}
