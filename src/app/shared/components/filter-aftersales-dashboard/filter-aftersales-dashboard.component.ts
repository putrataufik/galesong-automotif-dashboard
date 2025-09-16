// src/app/shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component.ts
import {
  Component,
  EventEmitter,
  Output,
  Input,
  SimpleChanges,
  OnInit,
  OnChanges,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

// Filter yang dipakai parent/dashboard
export interface AfterSalesFilter {
  company: string;
  cabang: string;          // gunakan 'all-branch' untuk semua cabang
  period: string;          // tahun (YYYY) bila useCustomDate = false
  month: string;           // '01'..'12' atau 'all-month' bila useCustomDate = false
  compare?: boolean;
  useCustomDate?: boolean; // toggle pilih tanggal
  selectedDate?: string;   // YYYY-MM-DD bila useCustomDate = true
}

interface Option {
  value: string;
  name: string;
}

@Component({
  selector: 'app-filter-aftersales-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-aftersales-dashboard.component.html',
  styleUrl: './filter-aftersales-dashboard.component.css',
})
export class FilterAftersalesDashboardComponent implements OnInit, OnChanges, OnDestroy {
  /* =================== Inputs & Outputs =================== */
  @Input() initialFilter: AfterSalesFilter | null = null;
  @Input() loading = false;
  @Output() search = new EventEmitter<AfterSalesFilter>();

  /* =================== Static Options =================== */
  companies: Option[] = [
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
  ];

  // ⬇️ gunakan 'all-branch' + mapping kode 0001..0006
  cabangOptions: Option[] = [
    { value: 'all-branch', name: 'Semua Cabang' },
    { value: '0001', name: 'PETTARANI' },
    { value: '0002', name: 'GORONTALO' },
    { value: '0003', name: 'PALU' },
    { value: '0004', name: 'KENDARI' },
    { value: '0005', name: 'PALOPO' },
    { value: '0006', name: 'SUNGGUMINASA' },
  ];

  periods: Option[] = this.generateYearPeriods();
  months: Option[]  = this.generateMonths(); // dengan 'all-month'

  /* =================== Form State (ngModel) =================== */
  private readonly NOW = new Date();
  private readonly CURR_YEAR  = String(this.NOW.getFullYear());
  private readonly CURR_MONTH = String(this.NOW.getMonth() + 1).padStart(2, '0');

  company = '';
  cabang  = 'all-branch';
  period  = this.CURR_YEAR;
  month   = this.CURR_MONTH;     // default: bulan berjalan
  compare = true;

  // ✨ Mode pilih tanggal (selaras filter Sales)
  useCustomDate = true;
  selectedDate  = this.todayISO();

  /* =================== Alert State =================== */
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  private alertTimeoutId: any;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  /* =================== Lifecycle =================== */
  ngOnInit() {
    // Set default tanggal hari ini
    if (!this.selectedDate) this.selectedDate = this.todayISO();
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

  /* =================== Helpers =================== */
  private todayISO(): string {
    const d = new Date();
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }

  private applyInitialFilter(filter: AfterSalesFilter | null) {
    if (!filter) return;

    this.company = filter.company ?? this.company;
    // normalisasi cabang: default 'all-branch'
    this.cabang  = filter.cabang ?? 'all-branch';

    // Tambahkan tahun ke list jika belum ada
    const yr = (filter.period && String(filter.period)) || this.CURR_YEAR;
    if (!this.periods.find(p => p.value === yr)) {
      this.periods = [{ value: yr, name: yr }, ...this.periods];
    }
    this.period = yr;

    // Month normalisasi (boleh 'all-month')
    const mm = filter.month ?? this.CURR_MONTH;
    this.month = mm;

    this.compare       = !!filter.compare;
    this.useCustomDate = !!filter.useCustomDate;

    // selectedDate default ke hari ini bila custom ON dan belum ada
    this.selectedDate  = filter.selectedDate ?? (this.useCustomDate ? this.todayISO() : '');
  }

  private generateYearPeriods(): Option[] {
    const currentYear = new Date().getFullYear();
    const list: Option[] = [
      { value: String(currentYear), name: `Tahun Ini (${currentYear})` },
    ];
    for (let y = currentYear - 1; y >= 2022; y--) {
      list.push({ value: String(y), name: String(y) });
    }
    return list;
  }

  private generateMonths(): Option[] {
    const names = [
      'Januari','Februari','Maret','April','Mei','Juni',
      'Juli','Agustus','September','Oktober','November','Desember',
    ];
    const opts: Option[] = [{ value: 'all-month', name: 'Semua Bulan' }];
    for (let i = 0; i < 12; i++) {
      const v = String(i + 1).padStart(2, '0');
      opts.push({ value: v, name: names[i] });
    }
    return opts;
  }

  /* =================== UI Change Handlers =================== */
  onFilterChange() {
    if (this.showAlert) this.hideAlert();
  }

  onCompanyChange() {
    // reset cabang jika perusahaan berubah
    this.cabang = 'all-branch';
    this.onFilterChange();
  }

  onPeriodChange() {
    this.onFilterChange();
    // jika pilih tahun berjalan → default bulan = bulan sekarang; selain itu = all-month
    const selectedYear = parseInt(this.period, 10);
    const currentYear  = new Date().getFullYear();
    this.month = (selectedYear === currentYear) ? this.CURR_MONTH : 'all-month';
  }

  onCustomDateToggle() {
    if (this.useCustomDate) {
      if (!this.selectedDate) this.selectedDate = this.todayISO();
    } else {
      // kembali ke mode periode: pastikan year & month valid
      if (!this.period) this.period = this.CURR_YEAR;
      if (!this.month)  this.month  = this.CURR_MONTH;
    }
    this.onFilterChange();
  }

  onDateChange() {
    this.onFilterChange();
  }

  /* =================== Submit =================== */
  onSearchClick() {
    const empty: string[] = [];
    if (!this.company) empty.push('Perusahaan');

    // Validasi per mode
    if (this.useCustomDate) {
      if (!this.selectedDate) empty.push('Tanggal');
    } else {
      if (!this.period) empty.push('Tahun');
      // bulan boleh 'all-month' → tidak wajib isian lain
    }

    if (empty.length) {
      this.show('Mohon lengkapi: ' + empty.join(', '), 'danger');
      return;
    }

    this.search.emit({
      company: this.company,
      cabang: this.cabang,             // ⬅️ gunakan 'all-branch' sebagai "semua"
      period: this.useCustomDate ? '' : this.period,
      month:  this.useCustomDate ? '' : this.month,   // boleh 'all-month'
      compare: this.compare,
      useCustomDate: this.useCustomDate,
      selectedDate: this.useCustomDate ? this.selectedDate : '',
    });
  }

  /* =================== Alert helpers =================== */
  private show(msg: string, type: 'success' | 'danger') {
    this.alertMessage = msg;
    this.alertType = type;
    this.showAlert = true;

    clearTimeout(this.alertTimeoutId);
    this.alertTimeoutId = setTimeout(() => {
      this.ngZone.run(() => {
        this.hideAlert();
        this.cdr.markForCheck();
      });
    }, 4000);
  }

  hideAlert() {
    this.showAlert = false;
  }
}
