// src/app/pages/sales-dashboard/shared/components/filter-sales-dashboard/filter-sales-dashboard.component.ts
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
import { AppFilter, CategoryFilter } from '../../../types/filter.model';
import { UserInfoComponent } from "../user-info/user-info.component";
// Interface opsi dropdown
interface Option {
  value: string;
  name: string;
}

@Component({
  selector: 'app-filter-sales-dashboard',
  standalone: true,
  imports: [FormsModule, UserInfoComponent],
  templateUrl: './filter-sales-dashboard.component.html',
  styleUrl: './filter-sales-dashboard.component.css',
})
export class FilterSalesDashboardComponent implements OnInit, OnChanges, OnDestroy {
  // Props dari parent
  @Input() currentFilter: AppFilter | null = null;
  @Input() loading = false;
  isFilterExpanded = true; // default compact
  toggleFilter() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }
  // Emit ke parent
  @Output() search = new EventEmitter<AppFilter>();

  // Static data
  companies: Option[] = [
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
  ];

  branches: Option[] = [
    { value: 'all-branch', name: 'Semua Cabang' },
    { value: '0050', name: 'Pettarani' },
    { value: '0051', name: 'Palu' },
    { value: '0052', name: 'Kendari' },
    { value: '0053', name: 'Gorontalo' },
    { value: '0054', name: 'Palopo' },
  ];

  years: Option[] = this.generateYearYears();
  months: Option[] = this.generateMonths(); // tanpa "all-month"

  // State form (ngModel) — default tahun/bulan = sekarang
  private readonly NOW = new Date();
  private readonly CURR_YEAR = String(this.NOW.getFullYear());
  private readonly CURR_MONTH = String(this.NOW.getMonth() + 1).padStart(2, '0');

  company = '';
  category: CategoryFilter = 'sales';
  year = this.CURR_YEAR;          // default tahun ini
  month = this.CURR_MONTH;        // default bulan ini (2 digit)
  branch = 'all-branch';
  compare = true;

  // ✨ Single date picker state (custom date mode)
  useCustomDate = true;
  selectedDate = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  // Alert
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  private alertTimeoutId: any;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setDefaultDate(); // set selectedDate = hari ini
    if (this.currentFilter) this.applyCurrentFilter(this.currentFilter);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentFilter']) {
      this.applyCurrentFilter(changes['currentFilter'].currentValue);
    }
  }

  ngOnDestroy() {
    clearTimeout(this.alertTimeoutId);
  }

  // ===== Helpers =====
  private setDefaultDate() {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private applyCurrentFilter(filter: AppFilter | null) {
    if (!filter) return;

    this.company  = filter.company  ?? this.company;
    this.category = (filter.category ?? this.category) as CategoryFilter;

    // Year normalize
    const normalizedYear =
      (filter.year && filter.year.trim()) ? filter.year : this.CURR_YEAR;
    if (!this.years.find(p => p.value === normalizedYear)) {
      this.years = [{ value: normalizedYear, name: normalizedYear }, ...this.years];
    }
    this.year = normalizedYear;

    // Month normalize: wajib "MM"
    const isValidMM = (m?: string) => !!m && /^\d{2}$/.test(m);
    const normalizedMonth = isValidMM(filter.month) ? String(filter.month) : this.CURR_MONTH;
    this.month = normalizedMonth;

    this.branch = filter.branch ?? 'all-branch';
    this.compare = !!filter.compare;

    // Custom date
    this.useCustomDate = !!filter.useCustomDate;
    this.selectedDate = filter.selectedDate ?? this.selectedDate;

    // Jika mode custom date & belum ada tanggal → set default (hari ini)
    if (this.useCustomDate && !this.selectedDate) this.setDefaultDate();
  }

  private generateYearYears(): Option[] {
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
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const opts: Option[] = []; // ← TANPA "all-month"
    for (let i = 0; i < 12; i++) {
      const v = String(i + 1).padStart(2, '0');
      opts.push({ value: v, name: names[i] });
    }
    return opts;
  }

  // ===== UI Change handlers =====
  onFilterChange() {
    if (this.showAlert) this.hideAlert();
  }

  onYearChange() {
    // pastikan month tetap valid "MM"
    if (!this.month || !/^\d{2}$/.test(this.month)) {
      this.month = this.CURR_MONTH;
    }
    this.onFilterChange();
  }

  onCompanyChange() {
    this.branch = 'all-branch';
    this.onFilterChange();
  }

  onCustomDateToggle() {
    if (this.useCustomDate) {
      if (!this.selectedDate) this.setDefaultDate();
    } else {
      // kembali ke mode periode: pastikan year & month valid
      if (!this.year) this.year = this.CURR_YEAR;
      if (!this.month || !/^\d{2}$/.test(this.month)) {
        this.month = this.CURR_MONTH;   // ⬅️ bulan sekarang
      }
    }
    this.onFilterChange();
  }

  // ✨ Handle date change
  onDateChange() {
    this.onFilterChange();
  }

  // ===== Submit =====
  onSearchClick() {
    const empty: string[] = [];
    if (!this.company) empty.push('Perusahaan');

    // Validasi sesuai mode
    if (this.useCustomDate) {
      if (!this.selectedDate) empty.push('Tanggal');
    } else {
      if (!this.year) empty.push('Tahun');
      if (!this.month) empty.push('Bulan'); // ← bulan wajib
    }

    if (empty.length) {
      this.show('Mohon lengkapi: ' + empty.join(', '), 'danger');
      return;
    }

    this.search.emit({
      company: this.company,
      category: this.category,
      year: this.useCustomDate ? '' : this.year,     // kirim tahun hanya saat mode periode
      month: this.useCustomDate ? '' : this.month,   // kirim bulan hanya saat mode periode
      branch: this.branch,
      compare: this.compare,
      useCustomDate: this.useCustomDate,
      selectedDate: this.useCustomDate ? this.selectedDate : '',
    });
  }

  // ===== Alert helpers =====
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
