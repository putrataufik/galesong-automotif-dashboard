import { Injectable, computed, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { 
  DashboardApiResponse, 
  KpiCardData, 
  CacheEntry, 
  CacheStatus,
  LoadingState,
  FilterParams,
} from '../models/dashboard.model';
import { getMockData, FILTER_OPTIONS, generateCacheKey } from '../data/dashboard-mock.data';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  // ===== CONSTANTS =====
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private readonly API_DELAY_MS = 1000; // 1 second simulation
  
  // ===== PRIVATE SIGNALS =====
  private readonly _loadingState = signal<LoadingState>(LoadingState.IDLE);
  private readonly _kpiData = signal<KpiCardData[]>([]);
  private readonly _cacheEntry = signal<CacheEntry<KpiCardData[]> | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _currentFilter = signal<FilterParams>({
    companyId: 'COMP001',
    branchId: 'ALL',
    category: 'ALL',
    year: 2025
  });
  
  // ===== PUBLIC COMPUTED SIGNALS =====
  readonly isLoading = computed(() => this._loadingState() === LoadingState.LOADING);
  readonly kpiData = this._kpiData.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasData = computed(() => this._kpiData().length > 0);
  readonly currentFilter = this._currentFilter.asReadonly();
  readonly filterOptions = signal(FILTER_OPTIONS).asReadonly();
  
  readonly cacheStatus = computed<CacheStatus>(() => {
    const cache = this._cacheEntry();
    const now = Date.now();
    
    if (!cache) {
      return {
        hasData: false,
        lastFetch: null,
        isValid: false,
        expiresIn: null
      };
    }
    
    const isValid = now < cache.expiresAt;
    const expiresIn = isValid 
      ? this.formatTimeRemaining(cache.expiresAt - now)
      : 'Expired';
    
    return {
      hasData: cache.data.length > 0,
      lastFetch: new Date(cache.timestamp).toLocaleTimeString('id-ID'),
      isValid,
      expiresIn
    };
  });

  constructor() {
    console.log('🚀 DashboardService initialized');
  }

  // ===== PUBLIC METHODS =====
  
  /**
   * Get dashboard data dengan filter dan caching
   */
  getDashboardData(filter?: FilterParams, forceRefresh = false): Observable<KpiCardData[]> {
    // Update current filter jika ada
    if (filter) {
      this._currentFilter.set(filter);
    }

    const currentFilter = this._currentFilter();
    console.log('📊 getDashboardData called', { filter: currentFilter, forceRefresh });
    
    // Cek cache jika tidak force refresh
    if (!forceRefresh && this.isCacheValid(currentFilter)) {
      console.log('💾 Using cached data');
      return of(this._kpiData());
    }

    return this.fetchFreshData(currentFilter);
  }

  /**
   * Update filter dan load data baru
   */
  applyFilter(filter: FilterParams): Observable<KpiCardData[]> {
    console.log('🔍 Applying filter', filter);
    return this.getDashboardData(filter, true); // Force refresh dengan filter baru
  }

  /**
   * Force refresh data (bypass cache)
   */
  refreshData(): Observable<KpiCardData[]> {
    console.log('🔄 Force refreshing data');
    this.clearError();
    return this.fetchFreshData(this._currentFilter());
  }

  /**
   * Clear semua cache dan data
   */
  clearCache(): void {
    console.log('🗑️ Clearing cache');
    this._cacheEntry.set(null);
    this._kpiData.set([]);
    this._error.set(null);
    this._loadingState.set(LoadingState.IDLE);
  }

  // ===== PRIVATE METHODS =====
  
  private fetchFreshData(filter: FilterParams): Observable<KpiCardData[]> {
    this._loadingState.set(LoadingState.LOADING);
    this.clearError();
    
    return this.simulateApiCall(filter).pipe(
      map(response => this.transformApiResponse(response)),
      tap({
        next: (kpiData) => this.handleSuccess(kpiData, filter),
        error: (error) => this.handleError(error)
      })
    );
  }

  // Ambil Data
  private simulateApiCall(filter: FilterParams): Observable<DashboardApiResponse> {
    console.log('📡 Simulating API call with filter:', filter);
    
    // Get mock data berdasarkan filter
    const mockData = getMockData(filter);

    return of(mockData).pipe(
      delay(this.API_DELAY_MS),
      tap(() => console.log('📡 API response received for filter:', filter))
    );
  }

  private transformApiResponse(response: DashboardApiResponse): KpiCardData[] {
    const { kpi } = response.data;
    
    return [
      {
        id: 'total-sales',
        title: 'Total Sales',
        value: this.formatNumber(kpi.salesMetrics.totalUnitsSold),
        unit: 'unit',
        icon: 'car',
        iconColor: '#e3f2fd'
      },
      {
        id: 'after-sales',
        title: 'After Sales',
        value: this.formatNumber(kpi.afterSalesMetrics.totalTransactions),
        icon: 'wrench',
        iconColor: '#f3e5f5'
      },
      {
        id: 'total-revenue',
        title: 'Total Revenue',
        value: this.formatCurrency(kpi.financialMetrics.totalRevenue),
        icon: 'arrow-up',
        iconColor: '#e8f5e8',
        valueColor: '#28a745'
      },
      {
        id: 'net-profit',
        title: 'Net Profit',
        value: this.formatCurrency(kpi.financialMetrics.netProfitLoss),
        icon: 'chart-bar',
        iconColor: '#fff3cd',
        valueColor: '#fd7e14'
      }
    ];
  }

  private handleSuccess(kpiData: KpiCardData[], filter: FilterParams): void {
    const now = Date.now();
    const cacheKey = generateCacheKey(filter);
    const cacheEntry: CacheEntry<KpiCardData[]> = {
      data: kpiData,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION_MS
    };

    this._kpiData.set(kpiData);
    this._cacheEntry.set(cacheEntry);
    this._loadingState.set(LoadingState.SUCCESS);
    
    console.log('✅ Data loaded successfully', {
      filter,
      cacheKey,
      itemCount: kpiData.length,
      expiresAt: new Date(cacheEntry.expiresAt).toLocaleTimeString('id-ID')
    });
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    this._error.set(errorMessage);
    this._loadingState.set(LoadingState.ERROR);
    console.error('❌ Failed to load data:', errorMessage);
  }

  private isCacheValid(filter?: FilterParams): boolean {
    const cache = this._cacheEntry();
    if (!cache) return false;

    const isTimeValid = Date.now() < cache.expiresAt;
    
    // Jika ada filter baru, cek apakah sama dengan filter saat ini
    if (filter) {
      const currentKey = generateCacheKey(this._currentFilter());
      const newKey = generateCacheKey(filter);
      const isSameFilter = currentKey === newKey;
      return isTimeValid && isSameFilter;
    }

    return isTimeValid;
  }

  private clearError(): void {
    this._error.set(null);
  }

  // ===== UTILITY METHODS =====
  
  private formatNumber(value: number): string {
    return value.toLocaleString('id-ID');
  }

  private formatCurrency(value: number): string {
    if (value >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1)}M`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
  }

  private formatTimeRemaining(ms: number): string {
    const minutes = Math.floor(ms / 60_000);
    const seconds = Math.floor((ms % 60_000) / 1_000);
    return `${minutes}m ${seconds}s`;
  }
}