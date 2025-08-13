// src/app/shared/components/filter-after-sales/filter-after-sales.component.ts
import {
  Component,
  EventEmitter,
  Output,
  Input,
  SimpleChanges,
  OnInit,
  OnChanges,
  OnDestroy,
  signal,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AfterSalesFilter } from '../../../types/filter.model';


interface Option {
  value: string;
  name: string;
}

@Component({
  selector: 'app-filter-after-sales',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './filter-after-sales.component.html',
  styleUrl: './filter-after-sales.component.css'
})
export class FilterAfterSalesComponent implements OnInit, OnChanges, OnDestroy {
  private dashboardService = inject(DashboardService);

  @Input() initialFilter: AfterSalesFilter | null = null;
  @Input() loading = false;
  @Output() search = new EventEmitter<AfterSalesFilter>();

  // Static data perusahaan
  companies: Option[] = [
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
  ];

  // Dynamic signals untuk cabang
  branches = signal<Option[]>([]);
  loadingBranches = signal(false);

  // Periode tahun dan bulan
  periods: Option[] = this.generateYearPeriods();
  months: Option[] = this.generateMonths();

  // Form state (default aman saat refresh)
  company = '';
  branch = '';
  period = String(new Date().getFullYear()); // default: tahun ini
  month = 'all-month';                       // default: semua bulan

  // Alert state
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  private alertTimeoutId: any;

  ngOnInit() {
    if (this.initialFilter) this.applyInitialFilter(this.initialFilter);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialFilter']) {
      this.applyInitialFilter(changes['initialFilter'].currentValue);
    }
  }

  ngOnDestroy() {
    clearTimeout(this.alertTimeoutId);
  }

  onCompanyChange() {
    // reset branch saat ganti company
    this.branch = '';
    this.branches.set([]);

    if (!this.company) {
      this.onFilterChange();
      return;
    }

    this.loadingBranches.set(true);

    this.loadBranchesForCompany(this.company)
      .then((branchOptions) => {
        this.branches.set(branchOptions);
        this.loadingBranches.set(false);
      })
      .catch((error) => {
        console.error('Error loading branches:', error);
        this.loadingBranches.set(false);
        this.show('Gagal memuat data cabang', 'danger');
      });

    this.onFilterChange();
  }

  private async loadBranchesForCompany(company: string): Promise<Option[]> {
    const cabangMap = this.dashboardService.getCabangNameMap();
    const branchOptions: Option[] = Object.entries(cabangMap).map(([code, name]) => ({
      value: code,
      name,
    }));

    // Simulasi delay (opsional)
    await new Promise((resolve) => setTimeout(resolve, 250));

    return branchOptions;
  }

  /**
   * Apply nilai awal dari parent dengan fallback aman ke default.
   * - Jika parent kirim month 'all' → dipetakan ke 'all-month'
   * - Jika period tidak ada di list, sisipkan agar option terlihat
   */
  private applyInitialFilter(filter: AfterSalesFilter | null) {
    if (!filter) return;

    // 1) company & period & month (with fallback)
    this.company = filter.company ?? this.company;
    this.period = filter.period ?? this.period;

    // Normalisasi month: parent wajib pakai 'all-month'
    const normalizedMonth =
      !filter.month || filter.month === 'all' ? 'all-month' : filter.month;
    this.month = normalizedMonth;

    // 2) pastikan period ada di dropdown (jaga kasus 2026 dst)
    if (this.period && !this.periods.find((p) => p.value === this.period)) {
      this.periods = [{ value: this.period, name: this.period }, ...this.periods];
    }

    // 3) company → load branches, lalu set branch jika exist
    const incomingBranch = filter.branch ?? '';
    if (this.company) {
      this.loadingBranches.set(true);
      this.loadBranchesForCompany(this.company)
        .then((branchOptions) => {
          this.branches.set(branchOptions);
          // set branch kalau ada di options, kalau tidak kosongkan
          if (incomingBranch && branchOptions.some((b) => b.value === incomingBranch)) {
            this.branch = incomingBranch;
          } else {
            this.branch = '';
          }
        })
        .catch((e) => {
          console.error('Error loading branches:', e);
          this.branch = '';
          this.show('Gagal memuat data cabang', 'danger');
        })
        .finally(() => this.loadingBranches.set(false));
    } else {
      // tanpa company: kosongkan branch list
      this.branches.set([]);
      this.branch = '';
    }
  }

  private generateYearPeriods(): Option[] {
    const currentYear = new Date().getFullYear();
    const list: Option[] = [{ value: String(currentYear), name: `Tahun Ini (${currentYear})` }];

    for (let y = currentYear - 1; y >= 2022; y--) {
      list.push({ value: String(y), name: String(y) });
    }
    return list;
  }

  private generateMonths(): Option[] {
    const names = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const opts: Option[] = [{ value: 'all-month', name: 'Semua Bulan' }]; // konsisten
    for (let i = 0; i < 12; i++) {
      const v = String(i + 1).padStart(2, '0');
      opts.push({ value: v, name: names[i] });
    }
    return opts;
  }

  onFilterChange() {
    if (this.showAlert) this.hideAlert();
  }

  onSearchClick() {
    const empty: string[] = [];
    if (!this.company) empty.push('Perusahaan');
    if (!this.period) empty.push('Tahun');

    if (empty.length) {
      this.show('Mohon lengkapi: ' + empty.join(', '), 'danger');
      return;
    }

    this.search.emit({
      company: this.company,
      branch: this.branch,
      period: this.period,
      month: this.month, // <- akan 'all-month' kalau semua bulan
    });

    this.show('Pencarian After Sales berhasil! Data sedang dimuat…', 'success');
  }

  hideAlert() {
    this.showAlert = false;
  }

  private show(msg: string, type: 'success' | 'danger') {
    this.alertMessage = msg;
    this.alertType = type;
    this.showAlert = true;

    clearTimeout(this.alertTimeoutId);
    this.alertTimeoutId = setTimeout(() => this.hideAlert(), 4000);
  }
}
