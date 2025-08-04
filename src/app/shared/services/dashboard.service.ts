import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private kpiCache: any[] | null = null;
  private chartCache: any[] | null = null;

  constructor(private http: HttpClient) {}

  // Ambil data KPI
getKpiData(filters: any, forceRefresh = false): Observable<any[]> {
  if (this.kpiCache && !forceRefresh) {
    return of(this.kpiCache); // Ambil dari cache
  }

  return new Observable((observer) => {
    this.http.get<any[]>('api/kpi', { params: filters }).subscribe({
      next: (data) => {
        this.kpiCache = data; // Simpan ke cache
        observer.next(data);
        observer.complete();
      },
      error: (err) => observer.error(err)
    });
  });
}


  // Ambil data Chart
  getChartData(filters: any, forceRefresh = false): Observable<any[]> {
    // if (this.chartCache && !forceRefresh) {
    //   return of(this.chartCache);
    // }

    // return new Observable((observer) => {
    //   this.http.get<any[]>('api/charts').subscribe({
    //     next: (data) => {
    //       this.chartCache = data;
    //       observer.next(data);
    //       observer.complete();
    //     },
    //     error: (err) => observer.error(err)
    //   });
    // });
     return of([]);
  }
}
