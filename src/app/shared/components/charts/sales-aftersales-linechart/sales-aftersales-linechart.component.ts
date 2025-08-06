import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

interface MonthlySalesData {
  month: string;
  salesOmzet: number;
  afterSalesOmzet: number;
}

@Component({
  selector: 'app-sales-aftersales-linechart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-aftersales-linechart.component.html',
  styleUrl: './sales-aftersales-linechart.component.css'
})
export class SalesAftersalesLinechartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() data: MonthlySalesData[] = [];
  @Input() title: string = 'Omzet Sales vs Omzet After Sales';
  
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
      type: 'line' as ChartType,
      data: {
        labels: this.data.map(d => d.month),
        datasets: [
          {
            label: 'Omzet Sales',
            data: this.data.map(d => d.salesOmzet),
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
          },
          {
            label: 'Omzet After Sales',
            data: this.data.map(d => d.afterSalesOmzet),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.title,
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, padding: 20, font: { size: 12 } }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                const formattedValue = new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
                return `${context.dataset.label}: ${formattedValue}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.1)' },
            ticks: {
              font: { size: 11 },
              callback: function(value) {
                if (typeof value === 'number') {
                  return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    notation: 'compact',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1
                  }).format(value);
                }
                return value;
              }
            }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart() {
    if (!this.chart) return;

    this.chart.data.labels = this.data.map(d => d.month);
    this.chart.data.datasets[0].data = this.data.map(d => d.salesOmzet);
    this.chart.data.datasets[1].data = this.data.map(d => d.afterSalesOmzet);
    this.chart.update('active');
  }
}