// src/app/app.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { SplashScreenComponent } from './pages/splash-screen/splash-screen.component';
import { filter } from 'rxjs';

// Services preload
import { SalesApiService } from './core/services/sales-api.service';
import { AfterSalesApiService } from './core/services/after-sales-api.service';

// === STATE: Main (khusus halaman Main) ===
import {
  MainDashboardStateService,
  MainSalesSnapshot,
  MainAfterSalesSnapshot,
} from './core/state/main-state.service';

// STATE: Sales (halaman Sales terpisah tetap dibiarkan, jika kamu mau preload juga)
import { SalesStateService } from './core/state/sales-state.service';

import { SalesFilter } from './core/models/sales.models';

// Auth
import { AuthService } from './core/services/auth.service';
import { AfterSalesDashboardStateService } from './core/state/after-sales-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    SplashScreenComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'galesong-automotif-dashboard';

  // ===== Signals state utama =====
  private readonly _isSidebarCollapsed = signal(false);
  private readonly _isMobile = signal(false);
  private readonly _currentPageTitle = signal('Dashboard');

  // Splash/init
  private readonly _isAppReady = signal(false);
  private readonly _splashProgress = signal(0);
  private readonly _splashMessage = signal('Memulai aplikasi...');
  private readonly _hasError = signal(false);

  // ===== Inject services =====
  private readonly router = inject(Router);
  private readonly salesApi = inject(SalesApiService);
  private readonly afterSalesApi = inject(AfterSalesApiService);
  private readonly asState = inject(AfterSalesDashboardStateService);
  private readonly mainState = inject(MainDashboardStateService);
  private readonly salesState = inject(SalesStateService);
  private readonly auth = inject(AuthService);

  // ===== Expose as readonly =====
  isSidebarCollapsed = this._isSidebarCollapsed.asReadonly();
  isMobile = this._isMobile.asReadonly();
  currentPageTitle = this._currentPageTitle.asReadonly();
  isAppReady = this._isAppReady.asReadonly();
  splashProgress = this._splashProgress.asReadonly();
  splashMessage = this._splashMessage.asReadonly();
  hasError = this._hasError.asReadonly();

  // ===== Lifecycle =====
  ngOnInit(): void {
    this.initializeApp();
    this.setupRouterEvents();
    this.checkIfMobile();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkIfMobile());
      this.disableTooltips();
    }
  }

  // ===== Ambil token dari URL =====
  private getTokenFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);

    // Prioritas query param ?t=xxxx
    const qToken = url.searchParams.get('t');
    if (qToken) return qToken;

    // Fallback path /t=xxxx
    const m = url.pathname.match(/(?:^|\/)t=([^/?#]+)/i);
    return m ? m[1] : null;
  }

  private async autoLoginIfToken(): Promise<'ok' | 'redirect' | 'skip'> {
    const t = this.getTokenFromUrl();
    return t ? await this.performTokenLogin(t) : 'skip';
  }

  private async performTokenLogin(t: string): Promise<'ok' | 'redirect'> {
    this._splashMessage.set('Memverifikasi sesi...');
    this._splashProgress.set(10);
    console.log(`[AUTO-LOGIN] Token ditemukan: ${t}, memverifikasi...`);
    try {
      const loginResp: any = await this.auth.loginWithToken(t).toPromise();
      const row = loginResp?.data?.[0];
      console.log('[AUTO-LOGIN] Raw login response:', loginResp);

      if (!row) {
        console.warn(
          '[AUTO-LOGIN] Response tidak berisi data[0]. (DEV: tidak redirect)'
        );
        return 'redirect';
      }

      const status = String(row.status);

      if (status === '1') {
        if (!row.user_id) {
          console.warn(
            '[AUTO-LOGIN] status=1 tapi user_id kosong. (DEV: tidak redirect)'
          );
          return 'redirect';
        }

        const userResp: any = await this.auth
          .fetchUser(String(row.user_id))
          .toPromise();

        console.group('[AUTO-LOGIN] User Data');
        console.log('Raw user response:', userResp);
        const userPayload = userResp?.data ?? userResp;
        console.log('User payload:', userPayload);
        try {
          const keys = userPayload ? Object.keys(userPayload) : [];
          console.log('Available keys:', keys);
        } catch (e) {
          console.warn('Tidak bisa membaca keys user payload:', e);
        }
        console.groupEnd();

        sessionStorage.setItem('auth.user', JSON.stringify(userResp));

        history.replaceState(
          {},
          '',
          window.location.origin + window.location.pathname
        );
        return 'ok';
      }

      if (status === '0') {
        console.warn(
          '[AUTO-LOGIN] Status 0 / token invalid. (DEV: tidak redirect)'
        );
        return 'redirect';
      }

      console.warn(
        `[AUTO-LOGIN] Status tidak dikenal: ${status}. (DEV: tidak redirect)`
      );
      return 'redirect';
    } catch (err) {
      console.error('[AUTO-LOGIN] error:', err);
      console.warn(
        '[AUTO-LOGIN] Gagal verifikasi token. (DEV: tidak redirect)'
      );
      return 'redirect';
    }
  }

  // ===== Init App (splash + preload data) =====
  private async initializeApp(): Promise<void> {
    try {
      await this.delay(100);

      // Jika ingin aktifkan auto-login, buka komentar ini:
      // const loginResult = await this.autoLoginIfToken();
      // if (loginResult === 'redirect') return;

      this._splashMessage.set('Memuat semua data...');
      this._splashProgress.set(30);
      console.log('Starting data preload...');

      // Jalankan preload: Main (isi state khusus Main) + Sales (isi state halaman Sales)
      await Promise.all([
        this.preloadMainDashboardData(), // → state Main
        this.preloadSalesDashboardData(), // → state Sales (terpisah)
        this.preloadAfterSalesDashboardData(),
      ]);

      console.log('Data preload completed');

      this._splashMessage.set('Selesai!');
      this._splashProgress.set(100);
      await this.delay(300);

      this._isAppReady.set(true);
      console.log('App is ready!');
    } catch (error) {
      console.error('App initialization failed:', error);
      this._hasError.set(true);
      this._splashMessage.set(
        'Gagal memuat data. Aplikasi akan tetap berjalan...'
      );
      await this.delay(500);
      this._isAppReady.set(true);
    }
  }

  // ===== Preload main dashboard (ISI STATE MAIN: Sales + After Sales) =====
  private async preloadMainDashboardData(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const mainFilter: SalesFilter = {
    companyId: 'sinar-galesong-mobilindo',
    branchId: 'all-branch',
    useCustomDate: false,
    compare: true,
    year: String(currentYear),
    month: currentMonth,
    selectedDate: null,
  };

  // Selalu resolve agar splash tidak nyangkut meski sebagian gagal.
  return new Promise((resolve) => {
    // Simpan filter utk Main sekali di awal
    this.mainState.saveFilter(mainFilter);

    // ====== Sumber data ======
    const sales$ = this.salesApi.getSalesKpiView(mainFilter);
    const after$ = this.afterSalesApi.getAfterSalesView(mainFilter);

    const trend$ = this.salesApi.getSalesTrendMonthlyRaw(
      mainFilter.companyId,
      mainFilter.year!,               // "YYYY"
      !!mainFilter.compare
    );

    const dovs$ = this.salesApi.getDoVsSpkMonthlyRaw(
      mainFilter.companyId,
      mainFilter.year!                // "YYYY"
    );

    const mdist$ = this.salesApi.getModelDistributionMonthlyRaw(
      mainFilter.companyId,
      mainFilter.year!,               // "YYYY"
      mainFilter.month!,              // "MM"
      !!mainFilter.compare
    );

    // ====== Flags selesai ======
    let doneSales = false;
    let doneAfter = false;
    let doneTrend = false;
    let doneDovs  = false;
    let doneMdist = false;

    const tryFinish = () => {
      if (doneSales && doneAfter && doneTrend && doneDovs && doneMdist) {
        resolve();
      }
    };

    // ====== SALES KPI ======
    sales$.subscribe({
      next: (salesResp) => {
        const salesSnap: MainSalesSnapshot = {
          request: salesResp.data.request,
          kpis: salesResp.data.kpis,
          timestamp: Date.now(),
        };
        this.mainState.saveSalesSnapshot(salesSnap);
        console.log('[Preload Main] Sales KPI OK');
        doneSales = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Main] Sales KPI FAIL:', err);
        doneSales = true;
        tryFinish();
      },
    });

    // ====== AFTER-SALES KPI ======
    after$.subscribe({
      next: (asResp) => {
        const afterSnap: MainAfterSalesSnapshot = {
          request: asResp.data.request,
          selected: asResp.data.kpi_data.selected,
          prevDate: asResp.data.kpi_data.comparisons?.prevDate,
          prevMonth: asResp.data.kpi_data.comparisons?.prevMonth,
          prevYear: asResp.data.kpi_data.comparisons?.prevYear,
          proporsi: asResp.data.proporsi_after_sales?.data.items ?? [],
          timestamp: Date.now(),
        };
        this.mainState.saveAfterSnapshot(afterSnap);
        console.log('[Preload Main] After-Sales KPI OK');
        doneAfter = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Main] After-Sales KPI FAIL:', err);
        doneAfter = true;
        tryFinish();
      },
    });

    // ====== GRAFIK: TREND (Unit Terjual bulanan) ======
    trend$.subscribe({
      next: (tResp) => {
        const datasets = tResp?.data?.salesMontlyTrend?.datasets ?? [];
        this.mainState.saveTrendSnapshot({
          companyId: mainFilter.companyId,
          year: mainFilter.year!,
          compare: !!mainFilter.compare,
          datasets,
        });
        console.log('[Preload Main] Trend Monthly OK');
        doneTrend = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Main] Trend Monthly FAIL:', err);
        doneTrend = true;
        tryFinish();
      },
    });

    // ====== GRAFIK: DO vs SPK ======
    dovs$.subscribe({
      next: (dResp) => {
        const datasets = dResp?.data?.DOvsSPKMontlyTrend?.datasets ?? [];
        this.mainState.saveDoVsSpkSnapshot({
          companyId: mainFilter.companyId,
          year: mainFilter.year!,
          datasets,
        });
        console.log('[Preload Main] DOvsSPK Monthly OK');
        doneDovs = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Main] DOvsSPK Monthly FAIL:', err);
        doneDovs = true;
        tryFinish();
      },
    });

    // ====== GRAFIK: Distribusi Model (current / prevM / prevY) ======
    mdist$.subscribe({
      next: (mResp) => {
        this.mainState.saveModelDistSnapshot({
          companyId: mainFilter.companyId,
          year: mainFilter.year!,
          month: mainFilter.month!,
          compare: !!mainFilter.compare,
          current: mResp?.data?.current,
          prevMonth: mResp?.data?.prevMonth,
          prevYear: mResp?.data?.prevYear,
        });
        console.log('[Preload Main] Model Distribution Monthly OK');
        doneMdist = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Main] Model Distribution Monthly FAIL:', err);
        doneMdist = true;
        tryFinish();
      },
    });
  });
}


  private async preloadSalesDashboardData(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const salesFilter: SalesFilter = {
    companyId: 'sinar-galesong-mobilindo',
    branchId: 'all-branch',
    useCustomDate: true,
    compare: true,
    year: null,
    month: null,
    selectedDate: today,
  };

  // derive year & month dari selectedDate (karena useCustomDate = true)
  const year = today.slice(0, 4);
  const month = today.slice(5, 7);

  return new Promise<void>((resolve) => {
    // simpan filter ke state Sales sekali di awal
    this.salesState.saveFilter(salesFilter);

    // ===== sumber data =====
    const kpi$   = this.salesApi.getSalesKpiView(salesFilter);
    const trend$ = this.salesApi.getSalesTrendMonthlyRaw(
      salesFilter.companyId,
      year,
      !!salesFilter.compare
    );
    const dovs$  = this.salesApi.getDoVsSpkMonthlyRaw(
      salesFilter.companyId,
      year
    );
    const mdist$ = this.salesApi.getModelDistributionMonthlyRaw(
      salesFilter.companyId,
      year,
      month,
      !!salesFilter.compare
    );

    // ===== flags selesai =====
    let doneKpi = false;
    let doneTrend = false;
    let doneDovs = false;
    let doneMdist = false;

    const tryFinish = () => {
      if (doneKpi && doneTrend && doneDovs && doneMdist) resolve();
    };

    // ===== KPI (UI-ready) =====
    kpi$.subscribe({
      next: (response) => {
        const snapshot = {
          request: response.data.request,
          kpis: response.data.kpis,
          timestamp: Date.now(),
        };
        this.salesState.saveKpiData(snapshot);
        console.log('[Preload Sales] KPI OK');
        doneKpi = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Sales] KPI FAIL:', err);
        doneKpi = true;
        tryFinish();
      },
    });

    // ===== Grafik: Trend Monthly =====
    trend$.subscribe({
      next: (tResp) => {
        const datasets = tResp?.data?.salesMontlyTrend?.datasets ?? [];
        this.salesState.saveTrendMonthly({
          companyId: salesFilter.companyId,
          year,
          compare: !!salesFilter.compare,
          datasets,
        });
        console.log('[Preload Sales] Trend Monthly OK');
        doneTrend = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Sales] Trend Monthly FAIL:', err);
        doneTrend = true;
        tryFinish();
      },
    });

    // ===== Grafik: DO vs SPK Monthly =====
    dovs$.subscribe({
      next: (dResp) => {
        const datasets = dResp?.data?.DOvsSPKMontlyTrend?.datasets ?? [];
        this.salesState.saveDoVsSpkMonthly({
          companyId: salesFilter.companyId,
          year,
          datasets,
        });
        console.log('[Preload Sales] DOvsSPK Monthly OK');
        doneDovs = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Sales] DOvsSPK Monthly FAIL:', err);
        doneDovs = true;
        tryFinish();
      },
    });

    // ===== Grafik: Model Distribution Monthly =====
    mdist$.subscribe({
      next: (mResp) => {
        this.salesState.saveModelDistributionMonthly({
          companyId: salesFilter.companyId,
          year,
          month,                      // "MM"
          compare: !!salesFilter.compare,
          current:  mResp?.data?.current,
          prevMonth: mResp?.data?.prevMonth,
          prevYear:  mResp?.data?.prevYear,
        });
        console.log('[Preload Sales] Model Distribution Monthly OK');
        doneMdist = true;
        tryFinish();
      },
      error: (err) => {
        console.error('[Preload Sales] Model Distribution Monthly FAIL:', err);
        doneMdist = true;
        tryFinish();
      },
    });
  });
}

private async preloadAfterSalesDashboardData(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const year  = today.slice(0, 4);
  const month = today.slice(5, 7);

  // Filter untuk API After-Sales (SalesFilter)
  const apiFilter: SalesFilter = {
    companyId: 'sinar-galesong-mobilindo',
    branchId: 'all-branch',
    useCustomDate: true,
    compare: true,
    year: null,
    month: null,
    selectedDate: today,
  };

  // Filter UI untuk state After-Sales dashboard (UiFilter)
  const uiFilter = {
    company: 'sinar-galesong-mobilindo',
    cabang: 'all-branch',
    period: year,          // tahun aktif (string)
    month,                 // "MM"
    compare: true,
    useCustomDate: true,
    selectedDate: today,
  } as const;

  return new Promise<void>((resolve) => {
    // simpan filter UI lebih dulu agar konsisten saat snapshot masuk
    this.asState.saveFilter(uiFilter);

    this.afterSalesApi.getAfterSalesView(apiFilter).subscribe({
      next: (res) => {
        // langsung pakai util state agar format & field aman
        this.asState.saveFromView(res);

        // OPTIONAL: kalau mau clear snapshot saat kosong, bisa cek:
        // if (!res?.data?.kpi_data?.selected) this.asState.clearSnapshot();

        console.log('[Preload After-Sales] View OK');
        resolve();
      },
      error: (err) => {
        console.error('[Preload After-Sales] View FAIL:', err);
        // jangan blokir init
        resolve();
      },
    });
  });
}



  // ===== Router events (title + cleanup tooltip) =====
  private setupRouterEvents(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.url);
        setTimeout(() => this.disableTooltips(), 100);
      });
  }

  // ===== Utilities =====
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private disableTooltips(): void {
    const elementsWithTitle = document.querySelectorAll('[title]');
    elementsWithTitle.forEach((el) => el.removeAttribute('title'));

    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    tooltipTriggerList.forEach((el) => el.removeAttribute('data-bs-toggle'));
  }

  toggleSidebar(): void {
    // no-op (mobile pakai top nav)
  }

  closeSidebar(): void {
    // no-op
  }

  private checkIfMobile(): void {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      this._isMobile.set(isMobile);
      this._isSidebarCollapsed.set(false);
    }
  }

  private updatePageTitle(url: string): void {
    switch (url) {
      case '/dashboard':
        this._currentPageTitle.set('Dashboard');
        break;
      case '/after-sales-dashboard':
        this._currentPageTitle.set('After Sales Dashboard');
        break;
      case '/finance-dashboard':
        this._currentPageTitle.set('Finance Dashboard');
        break;
      default:
        this._currentPageTitle.set('Dashboard');
    }
  }

  // Retry init dari UI (mis. tombol Try Again di splash)
  retryInitialization(): void {
    this._hasError.set(false);
    this._isAppReady.set(false);
    this._splashProgress.set(0);
    this.initializeApp();
  }
}
