// src/app/types/chart.model.ts

export interface SingleChartData {
  labels: string[];
  data: number[];
}

export interface MultiChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth?: number;
  }>;
}

export type ChartData = SingleChartData | MultiChartData;

export type ModelYoY = {
  name: string;
  curr: number;
  prevY: number | null;
  prevM: number | null;
};
