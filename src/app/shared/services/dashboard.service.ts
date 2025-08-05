// src/app/shared/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private kpiCache: any[] | null = null;

  constructor(private http: HttpClient) {}

  // Ambil data KPI
  getKpiData(filters: any, forceRefresh = false): Observable<any[]> {
    if (this.kpiCache && !forceRefresh) {
      return of(this.kpiCache);
    }

    return this.http.get<any[]>('api/kpi', { params: filters }).pipe(
      catchError((error) => {
        console.error('Error fetching KPI data:', error);
        return of([]);
      })
    );
  }

  // Ambil data Chart Revenue vs Expense
  getRevenueExpenseChartData(filters: any): Observable<any[]> {
    console.log('Fetching revenue expense data with filters:', filters);

    return this.http.get<any[]>('api/revenueExpense', { params: filters }).pipe(
      catchError((error) => {
        console.error('Error fetching revenue expense data:', error);
        console.error('Error details:', error.error);
        return of([]);
      })
    );
  }

  // Ambil data Chart Target vs Realization (hanya untuk after-sales)
  getTargetRealizationChartData(filters: any): Observable<any[]> {
    console.log('Fetching target realization data with filters:', filters);

    return this.http
      .get<any[]>('api/targetRealization', { params: filters })
      .pipe(
        catchError((error) => {
          console.error('Error fetching target realization data:', error);
          console.error('Error details:', error.error);
          return of([]);
        })
      );
  }
  // Sales vs After Sales Chart (hanya untuk all-category)
  getSalesAfterSalesChartData(filters: any): Observable<any[]> {
    return this.http
      .get<any[]>('api/salesAfterSales', { params: filters })
      .pipe(
        catchError((error) => {
          console.error('Error fetching sales after sales data:', error);
          return of([]);
        })
      );
  }

  // Branch Performance Chart (hanya untuk all-branch)
  getBranchPerformanceChartData(filters: any): Observable<any[]> {
    return this.http
      .get<any[]>('api/branchPerformance', { params: filters })
      .pipe(
        catchError((error) => {
          console.error('Error fetching branch performance data:', error);
          return of([]);
        })
      );
  }

  // Ambil data Chart (legacy - akan dihapus nanti)
  getChartData(filters: any, forceRefresh = false): Observable<any[]> {
    return of([]);
  }
}
