import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

interface BranchPerformanceData {
  branchName: string;
  totalOmzet: number;
  rank: number;
}

@Component({
  selector: 'app-branch-performance-barchart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branch-performance-barchart.component.html',
  styleUrl: './branch-performance-barchart.component.css'
})
export class BranchPerformanceBarChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() data: BranchPerformanceData[] = [];
  @Input() title: string = 'Performa Cabang Berdasarkan Omzet';
  
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

    // Sort data by totalOmzet descending
    const sortedData = [...this.data].sort((a, b) => b.totalOmzet - a.totalOmzet);

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: sortedData.map(d => d.branchName),
        datasets: [{
          label: 'Total Omzet',
          data: sortedData.map(d => d.totalOmzet),
          backgroundColor: sortedData.map((_, index) => {
            // Gradient colors based on rank
            if (index === 0) return 'rgba(34, 197, 94, 0.8)'; // Top - Green
            if (index === 1) return 'rgba(59, 130, 246, 0.8)'; // Second - Blue
            if (index === 2) return 'rgba(245, 158, 11, 0.8)'; // Third - Orange
            if (index === 3) return 'rgba(245, 11, 120, 0.8)'; // Third - Orange
            if (index === 4) return 'rgba(73, 11, 245, 0.8)'; // Third - Orange
            if (index === 5) return 'rgba(241, 245, 11, 0.8)'; // Third - Orange
            return 'rgba(156, 163, 175, 0.8)'; // Others - Gray
          }),
          borderColor: sortedData.map((_, index) => {
            if (index === 0) return 'rgba(34, 197, 94, 1)';
            if (index === 1) return 'rgba(59, 130, 246, 1)';
            if (index === 2) return 'rgba(245, 158, 11, 1)';
            if (index === 3) return 'rgba(245, 11, 120, 0.8)'; // Third - Orange
            if (index === 4) return 'rgba(73, 11, 245, 0.8)'; // Third - Orange
            if (index === 5) return 'rgba(241, 245, 11, 0.8)'; // Third - Orange
            return 'rgba(156, 163, 175, 1)';
          }),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y', // ✅ Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.title,
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            callbacks: {
              label: function(context) {
                const value = context.parsed.x;
                const formattedValue = new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
                return `Total Omzet: ${formattedValue}`;
              }
            }
          }
        },
        scales: {
          x: {
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
          },
          y: {
            grid: { display: false },
            ticks: { 
              font: { size: 11 },
              maxRotation: 0 
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart() {
    if (!this.chart) return;

    const sortedData = [...this.data].sort((a, b) => b.totalOmzet - a.totalOmzet);
    
    this.chart.data.labels = sortedData.map(d => d.branchName);
    this.chart.data.datasets[0].data = sortedData.map(d => d.totalOmzet);
    this.chart.update('active');
  }
}