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
import { DataMasterService } from './core/services/data-master.service';

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
  private dm = inject(DataMasterService);

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

  // ===== Ambil token dari URL atau localStorage =====
  private getTokenFromUrl(): string | null {
    if (typeof window === 'undefined') return null;

    const url = new URL(window.location.href);

    // 1) Prioritas: query param ?t=xxxx
    const qToken = url.searchParams.get('t');
    if (qToken && qToken.trim()) return qToken.trim();

    // 2) Fallback: path /t=xxxx
    const m = url.pathname.match(/(?:^|\/)t=([^\/?#]+)/i);
    if (m && m[1] && m[1].trim()) return m[1].trim();

    // 3) Fallback terakhir: localStorage auth.token
    try {
      const lsToken = window.localStorage?.getItem('auth.token');
      const token = (lsToken ?? '').trim();
      return token || null;
    } catch {
      return null;
    }
  }

  private async autoLoginIfToken(): Promise<'ok' | 'redirect' | 'skip'> {
    const t = this.getTokenFromUrl();
    return t ? await this.performTokenLogin(t) : 'skip';
  }

  private redirectWithToken(token: string, reason?: string): void {
    if (typeof window !== 'undefined') {
      // window.location.href = `https://sinargalesong.net/${token}`;
      void reason; // no-op to avoid unused var when logs removed
    }
  }

  private async performTokenLogin(t: string): Promise<'ok' | 'redirect'> {
    this._splashMessage.set('Memverifikasi sesi...');
    this._splashProgress.set(10);

    try {
      const loginResp: any = await this.auth.loginWithToken(t).toPromise();
      const row = loginResp?.data?.[0];

      // row wajib ada
      if (!row) {
        this.redirectWithToken(t, 'Data Anda Tidak di Temukan');
        return 'redirect';
      }

      const status = String(row.status);
      if (status !== '1' || !row.user_id) {
        // token invalid atau user_id kosong → redirect
        this.redirectWithToken(row?.token || t, 'token invalid');
        return 'redirect';
      }

      // fetch user
      const userResp: any = await this.auth
        .fetchUser(String(row.user_id))
        .toPromise();

      // --- Parsing defensif dari berbagai bentuk payload ---
      const d = userResp?.data ?? userResp;

      // helper ambil field dari object/array
      const pick = (key: string) =>
        Array.isArray(d) ? d?.[0]?.[key] : d?.[key];

      // beberapa backend kadang typo "oraganization", fallback ke "organization"
      const qualificationRaw = pick('qualification');
      const organizationRaw = pick('organization') ?? pick('oraganization');

      // normalisasi ke string trimmed
      const q = String(qualificationRaw ?? '').trim();
      const org = String(organizationRaw ?? '').trim();

      // === Gate by qualification/organization (ALLOW if q==9 OR org==6) ===
      if (!(q === '9' || org === '6')) {
        this.redirectWithToken(row.token || t, `gate fail: q=${q}, org=${org}`);
        return 'redirect';
      }

      // Lolos gate (q==9 ATAU org==6) -> lanjut proses...

      // === SIMPAN sesi ===
      localStorage.setItem('auth.token', row.token);
      localStorage.setItem('auth.user', JSON.stringify(userResp));

      // bersihkan URL dari token agar tidak tertinggal
      history.replaceState(
        {},
        '',
        window.location.origin + window.location.pathname
      );

      return 'ok';
    } catch {
      this.redirectWithToken(t);
      return 'redirect';
    }
  }

  // ===== Init App (splash + preload data) =====
  private async initializeApp(): Promise<void> {
    try {
      // await this.delay(100);

      // // Ambil token dari URL—wajib ada
      // const urlToken = this.getTokenFromUrl();
      // if (!urlToken) {
      //   this.redirectWithToken('');
      //   return;
      // }

      // const loginResult = await this.autoLoginIfToken();

      // // Jika perlu redirect, sertakan token dari URL
      // if (loginResult === 'redirect') {
      //   this.redirectWithToken(urlToken);
      //   return;
      // }

      // // === 1) MASTER DATA DULU (sekuensial) ===
      // this._splashMessage.set('Memuat master data (branch, company, dll)...');
      // this._splashProgress.set(25);

      try {
        // TTL opsional: 30 hari (ganti sesuai kebutuhan)
        await this.dm.loadAllDataMaster(true);
      } catch {
        // fallback: jika belum ada cache sama sekali, biarkan lanjut; UI bisa handle kosong
      }

      // === 2) PRELOAD DASHBOARD (paralel) ===
      this._splashMessage.set('Memuat semua data...');
      this._splashProgress.set(45);

      await Promise.all([
        this.preloadMainDashboardData(), // isi state Main
        this.preloadSalesDashboardData(), // isi state Sales
        this.preloadAfterSalesDashboardData(),
      ]);

      this._splashMessage.set('Selesai!');
      this._splashProgress.set(100);
      await this.delay(300);

      this._isAppReady.set(true);
    } catch {
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
        mainFilter.year!, // "YYYY"
        !!mainFilter.compare
      );

      const dovs$ = this.salesApi.getDoVsSpkMonthlyRaw(
        mainFilter.companyId,
        mainFilter.year! // "YYYY"
      );

      const mdist$ = this.salesApi.getModelDistributionMonthlyRaw(
        mainFilter.companyId,
        mainFilter.year!, // "YYYY"
        mainFilter.month!, // "MM"
        !!mainFilter.compare
      );
      const stockunit$ = this.salesApi.getStockUnitRaw(mainFilter.companyId);

      // ====== Flags selesai ======
      let doneSales = false;
      let doneAfter = false;
      let doneTrend = false;
      let doneDovs = false;
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
          doneSales = true;
          tryFinish();
        },
        error: () => {
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
          doneAfter = true;
          tryFinish();
        },
        error: () => {
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
          doneTrend = true;
          tryFinish();
        },
        error: () => {
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
          doneDovs = true;
          tryFinish();
        },
        error: () => {
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
          doneMdist = true;
          tryFinish();
        },
        error: () => {
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
      const kpi$ = this.salesApi.getSalesKpiView(salesFilter);
      const trend$ = this.salesApi.getSalesTrendMonthlyRaw(
        salesFilter.companyId,
        year,
        !!salesFilter.compare
      );
      const dovs$ = this.salesApi.getDoVsSpkMonthlyRaw(
        salesFilter.companyId,
        year
      );
      const mdist$ = this.salesApi.getModelDistributionMonthlyRaw(
        salesFilter.companyId,
        year,
        month,
        !!salesFilter.compare
      );
      const stockunit$ = this.salesApi.getStockUnitRaw(salesFilter.companyId);

      // ✅ NEW: DO per Cabang (UI-ready: branchName sudah dipetakan di service)
      const doBranch$ = this.salesApi.getDoByBranchView(salesFilter);

      // ✅ NEW: DO per SPV (UI-ready)
      const doSpv$ = this.salesApi.getDoBySpvView(salesFilter);

      // ===== flags selesai =====
      let doneKpi = false;
      let doneTrend = false;
      let doneDovs = false;
      let doneMdist = false;
      let doneStockUnit = false;
      let doneDoBranch = false; // ✅ NEW
      let doneDoSpv = false; // ✅ NEW

      const tryFinish = () => {
        if (
          doneKpi &&
          doneTrend &&
          doneDovs &&
          doneMdist &&
          doneStockUnit &&
          doneDoBranch &&
          doneDoSpv
        ) {
          resolve();
        }
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
          doneKpi = true;
          tryFinish();
        },
        error: () => {
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
          doneTrend = true;
          tryFinish();
        },
        error: () => {
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
          doneDovs = true;
          tryFinish();
        },
        error: () => {
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
            month, // "MM"
            compare: !!salesFilter.compare,
            current: mResp?.data?.current,
            prevMonth: mResp?.data?.prevMonth,
            prevYear: mResp?.data?.prevYear,
          });
          doneMdist = true;
          tryFinish();
        },
        error: () => {
          doneMdist = true;
          tryFinish();
        },
      });

      // ===== Stock Unit RAW =====
      stockunit$.subscribe({
        next: (sResp) => {
          this.salesState.saveStockUnitRaw(sResp, salesFilter.companyId);
          doneStockUnit = true;
          tryFinish();
        },
        error: () => {
          doneStockUnit = true;
          tryFinish();
        },
      });

      // ===== ✅ NEW: DO per Cabang (cache snapshot) =====
      doBranch$.subscribe({
        next: (resp) => {
          const cur = resp?.data?.doByBranch?.current;
          const pm = resp?.data?.doByBranch?.prevMonth;
          const py = resp?.data?.doByBranch?.prevYear;

          this.salesState.saveDoByBranch({
            companyId: salesFilter.companyId,
            branchId: salesFilter.branchId,
            useCustomDate: salesFilter.useCustomDate,
            compare: !!salesFilter.compare,
            year: salesFilter.year,
            month:
              salesFilter.month == null
                ? null
                : String(salesFilter.month).padStart(2, '0'),
            selectedDate: salesFilter.selectedDate,
            current: cur,
            prevMonth: pm,
            prevYear: py,
          });

          doneDoBranch = true;
          tryFinish();
        },
        error: () => {
          doneDoBranch = true;
          tryFinish();
        },
      });

      // ===== ✅ NEW: DO per SPV (cache snapshot) =====
      doSpv$.subscribe({
        next: (resp) => {
          const cur = resp?.data?.doBySpv?.current;
          const pm = resp?.data?.doBySpv?.prevMonth;
          const py = resp?.data?.doBySpv?.prevYear;
          const pd = resp?.data?.doBySpv?.prevDate; // bisa ada saat useCustomDate=true

          this.salesState.saveDoBySpv({
            companyId: salesFilter.companyId,
            branchId: salesFilter.branchId,
            useCustomDate: salesFilter.useCustomDate,
            compare: !!salesFilter.compare,
            year: salesFilter.year,
            month:
              salesFilter.month == null
                ? null
                : String(salesFilter.month).padStart(2, '0'),
            selectedDate: salesFilter.selectedDate,
            current: cur,
            prevMonth: pm,
            prevYear: py,
            prevDate: pd,
            timestamp: Date.now(),
          });

          doneDoSpv = true;
          tryFinish();
        },
        error: () => {
          doneDoSpv = true;
          tryFinish();
        },
      });
    });
  }

  private async preloadAfterSalesDashboardData(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const year = today.slice(0, 4);
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
      period: year, // tahun aktif (string)
      month, // "MM"
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
          resolve();
        },
        error: () => {
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
