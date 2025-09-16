// app.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { SplashScreenComponent } from './pages/splash-screen/splash-screen.component';
import { filter } from 'rxjs';

// Services untuk preload data dashboard
import { SalesApiService } from './core/services/sales-api.service';
import { MainStateService } from './core/state/main-state.service';
import { SalesStateService } from './core/state/sales-state.service';
import { SalesFilter } from './core/models/sales.models';

// Auth service (login via token & ambil user)
import { AuthService } from './core/services/auth.service';

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
  private readonly mainState = inject(MainStateService);
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

  /**
   * DEV behavior:
   * - Jika TIDAK ADA token → hanya console.warn dan return 'redirect' untuk menghentikan init.
   *   // TODO[PROD-REDIRECT]: ganti console.warn(...) jadi window.location.replace('https://sinargalesong.net/login')
   *
   * - Jika ADA token:
   *   - POST app_cookies_login
   *     - status '0' → console.warn dan return 'redirect'
   *       // TODO[PROD-REDIRECT]: ganti console.warn(...) jadi window.location.replace('https://sinargalesong.net')
   *     - status '1' → POST user(id), console user, simpan sessionStorage, bersihkan token dari URL
   *   - Error → console.error dan return 'redirect'
   *       // TODO[PROD-REDIRECT]: ganti console.warn(...) jadi window.location.replace('https://sinargalesong.net')
   */
  private async autoLoginIfToken(): Promise<'ok' | 'redirect' | 'skip'> {
    const t = this.getTokenFromUrl();
    // Tidak ada if(!t); kalau t falsy → langsung 'skip'
    return t ? await this.performTokenLogin(t) : 'skip';
  }

  // Jalankan flow login bila token ada
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
        // TODO[PROD-REDIRECT]: window.location.replace('https://sinargalesong.net');
        return 'redirect';
      }

      const status = String(row.status); // normalisasi ke string

      // === Sukses → status '1' ===
      if (status === '1') {
        if (!row.user_id) {
          console.warn(
            '[AUTO-LOGIN] status=1 tapi user_id kosong. (DEV: tidak redirect)'
          );
          // TODO[PROD-REDIRECT]: window.location.replace('https://sinargalesong.net');
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

        // simpan untuk role/guard nanti
        sessionStorage.setItem('auth.user', JSON.stringify(userResp));

        // bersihkan token dari URL
        history.replaceState(
          {},
          '',
          window.location.origin + window.location.pathname
        );

        return 'ok';
      }

      // === Token invalid → status '0' ===
      if (status === '0') {
        console.warn(
          '[AUTO-LOGIN] Status 0 / token invalid. (DEV: tidak redirect)'
        );
        // TODO[PROD-REDIRECT]: window.location.replace('https://sinargalesong.net');
        return 'redirect';
      }

      // === Status tak dikenal ===
      console.warn(
        `[AUTO-LOGIN] Status tidak dikenal: ${status}. (DEV: tidak redirect)`
      );
      // TODO[PROD-REDIRECT]: window.location.replace('https://sinargalesong.net');
      return 'redirect';
    } catch (err) {
      console.error('[AUTO-LOGIN] error:', err);
      console.warn(
        '[AUTO-LOGIN] Gagal verifikasi token. (DEV: tidak redirect)'
      );
      // TODO[PROD-REDIRECT]: window.location.replace('https://sinargalesong.net');
      return 'redirect';
    }
  }

  // ===== Init App (splash + preload data) =====
  private async initializeApp(): Promise<void> {
    try {
      // beri waktu splash render dulu
      await this.delay(100);

      // Jalankan auto-login sebelum preload data
      // const loginResult = await this.autoLoginIfToken();
      // if (loginResult === 'redirect') {
      //   return;
      // }

      // Preload data dashboard
      this._splashMessage.set('Memuat semua data...');
      this._splashProgress.set(30);
      console.log('Starting data preload...');

      await Promise.all([
        this.preloadMainDashboardData(),
        this.preloadSalesDashboardData(),
      ]);

      console.log('Data preload completed');

      // Selesai
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

  // ===== Preload main dashboard =====
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

    return new Promise((resolve, reject) => {
      this.salesApi.getSalesKpiView(mainFilter).subscribe({
        next: (response) => {
          const snapshot = {
            request: response.data.request,
            kpis: response.data.kpis,
            timestamp: Date.now(),
          };
          this.mainState.saveFilter(mainFilter);
          this.mainState.saveKpiData(snapshot);
          console.log('Main dashboard data preloaded successfully');
          resolve();
        },
        error: (err) => {
          console.error('Failed to preload main dashboard data:', err);
          reject(err);
        },
      });
    });
  }

  // ===== Preload sales dashboard =====
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

    return new Promise((resolve, reject) => {
      this.salesApi.getSalesKpiView(salesFilter).subscribe({
        next: (response) => {
          const snapshot = {
            request: response.data.request,
            kpis: response.data.kpis,
            timestamp: Date.now(),
          };
          this.salesState.saveFilter(salesFilter);
          this.salesState.saveKpiData(snapshot);
          console.log('Sales dashboard data preloaded successfully');
          resolve();
        },
        error: (err) => {
          console.error('Failed to preload sales dashboard data:', err);
          reject(err);
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
