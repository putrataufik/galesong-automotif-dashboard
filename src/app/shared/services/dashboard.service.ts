// src/app/shared/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  
  // -- Config
  private readonly DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 menit
  private cacheDuration = this.DEFAULT_CACHE_DURATION;

  // -- Stores
  private kpiCache: any[] | null = null;
  private kpiCacheTimestamp: number | null = null;

  private cacheData: Map<string, any[]> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(private http: HttpClient) {}

  /** Opsional: ubah durasi cache di runtime (ms) */
  setCacheDuration(ms: number) {
    this.cacheDuration = Math.max(0, ms);
    this.pruneExpiredCache();
  }

  // ---------- Helpers ----------
  private getCacheKey(filters: any): string {
    return `${filters.company}_${filters.branch}_${filters.category}`;
  }

  private isExpired(timestamp: number | null | undefined): boolean {
    if (timestamp == null) return true;
    return Date.now() - timestamp >= this.cacheDuration;
  }

  /** Hapus semua entry cache yang sudah kedaluwarsa (dipanggil otomatis) */
  private pruneExpiredCache(): void {
    // KPI
    if (this.isExpired(this.kpiCacheTimestamp)) {
      this.kpiCache = null;
      this.kpiCacheTimestamp = null;
    }

    // Data per-key
    for (const [key, ts] of this.cacheTimestamps.entries()) {
      if (this.isExpired(ts)) {
        this.cacheTimestamps.delete(key);
        this.cacheData.delete(key);
      }
    }
  }

  private setCache(key: string, data: any[]): void {
    this.cacheData.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  private fetchWithCache(
    endpoint: string,
    filters: any,
    keyPrefix: string,
    forceRefresh = false
  ): Observable<any[]> {
    this.pruneExpiredCache(); // auto-clear sebelum akses

    const cacheKey = `${keyPrefix}_${this.getCacheKey(filters)}`;

    if (!forceRefresh && this.cacheData.has(cacheKey) && !this.isExpired(this.cacheTimestamps.get(cacheKey))) {
      return of(this.cacheData.get(cacheKey)!);
    }

    return this.http.get<any[]>(endpoint, { params: filters }).pipe(
      tap((data) => this.setCache(cacheKey, data)),
      catchError(() => of([]))
    );
  }

  // ---------- Public APIs ----------
  // KPI khusus (global, bukan per-combo filter)
  getKpiData(filters: any, forceRefresh = false): Observable<any[]> {
    this.pruneExpiredCache(); // auto-clear sebelum akses

    if (!forceRefresh && this.kpiCache && !this.isExpired(this.kpiCacheTimestamp)) {
      return of(this.kpiCache);
    }

    return this.http.get<any[]>('api/kpi', { params: filters }).pipe(
      tap((data) => {
        this.kpiCache = data;
        this.kpiCacheTimestamp = Date.now();
      }),
      catchError(() => of([]))
    );
  }

  getRevenueExpenseChartData(filters: any, forceRefresh = false) {
    return this.fetchWithCache('api/revenueExpense', filters, 'revenue', forceRefresh);
  }

  getTargetRealizationChartData(filters: any, forceRefresh = false) {
    return this.fetchWithCache('api/targetRealization', filters, 'target', forceRefresh);
  }

  getSalesAfterSalesChartData(filters: any, forceRefresh = false) {
    return this.fetchWithCache('api/salesAfterSales', filters, 'sales', forceRefresh);
  }

  getBranchPerformanceChartData(filters: any, forceRefresh = false) {
    return this.fetchWithCache('api/branchPerformance', filters, 'branch', forceRefresh);
  }

  /** Clear semua cache secara manual */
  clearAllCache(): void {
    this.kpiCache = null;
    this.kpiCacheTimestamp = null;
    this.cacheData.clear();
    this.cacheTimestamps.clear();
  }

  /** Inspect status cache (akan prune dulu sebelum lapor) */
  getCacheStatus(): any {
    this.pruneExpiredCache();
    return {
      kpiCacheItems: this.kpiCache ? this.kpiCache.length : 0,
      keyedEntries: this.cacheData.size,
      totalKeysTracked: this.cacheTimestamps.size,
      cacheDurationMs: this.cacheDuration,
    };
  }

  // Legacy
  getChartData(filters: any, forceRefresh = false): Observable<any[]> {
    return of([]);
  }
}
