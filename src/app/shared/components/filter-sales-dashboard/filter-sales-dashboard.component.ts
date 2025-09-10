// filter-sales-dashboard.component.ts
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

// Interface opsi dropdown
interface Option {
  value: string;
  name: string;
}

@Component({
  selector: 'app-filter-sales-dashboard',
  imports: [FormsModule],
  templateUrl: './filter-sales-dashboard.component.html',
  styleUrl: './filter-sales-dashboard.component.css',
})

export class FilterSalesDashboardComponent implements OnInit, OnChanges, OnDestroy {
  // Props dari parent
  @Input() currentFilter: AppFilter | null = null;
  @Input() loading = false;

  // Emit ke parent
  @Output() search = new EventEmitter<AppFilter>();

  // Static data
  companies: Option[] = [
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
  ];

  branches: Option[] = [
    { value: 'all-branch', name: 'Semua Cabang' },
    { value: 'pettarani', name: 'Pettarani' },
    { value: 'palu', name: 'Palu' },
    { value: 'kendari', name: 'Kendari' },
    { value: 'gorontalo', name: 'Gorontalo' },
    { value: 'palopo', name: 'Palopo' },
  ];

  years: Option[] = this.generateYearYears();
  months: Option[] = this.generateMonths();

  // State form (ngModel)
  company = '';
  category: CategoryFilter = 'sales';
  year = String(new Date().getFullYear());
  month = 'all-month';
  branch = 'all-branch';
  compare = false;
  
  // ✨ NEW: Single date picker state
  useCustomDate = false;
  selectedDate = '';

  // Alert
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  private alertTimeoutId: any;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.currentFilter) this.applyCurrentFilter(this.currentFilter);
    // Set default date to today
    this.setDefaultDate();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentFilter']) {
      this.applyCurrentFilter(changes['currentFilter'].currentValue);
    }
  }

  ngOnDestroy() {
    clearTimeout(this.alertTimeoutId);
  }

  // ✨ NEW: Set default date to today
  private setDefaultDate() {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  private applyCurrentFilter(filter: AppFilter | null) {
    if (!filter) return;

    this.company = filter.company ?? this.company;
    this.category = (filter.category ?? this.category) as CategoryFilter;

    if (filter.year && !this.years.find((p) => p.value === filter.year)) {
      this.years = [{ value: filter.year, name: filter.year }, ...this.years];
    }

    this.year = filter.year ?? this.year;
    this.month = filter.month ?? 'all-month';
    this.branch = filter.branch ?? 'all-branch';
    this.compare = !!filter.compare;
    
    // ✨ NEW: Apply custom date filter
    this.useCustomDate = !!filter.useCustomDate;
    this.selectedDate = filter.selectedDate ?? this.selectedDate;
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
    const opts: Option[] = [{ value: 'all-month', name: 'Semua Bulan' }];
    for (let i = 0; i < 12; i++) {
      const v = String(i + 1).padStart(2, '0');
      opts.push({ value: v, name: names[i] });
    }
    return opts;
  }

  onFilterChange() {
    if (this.showAlert) this.hideAlert();
  }

  onYearChange() {
    this.month = 'all-month';
    this.onFilterChange();
  }

  onCompanyChange() {
    this.branch = 'all-branch';
    this.onFilterChange();
  }

  // ✨ NEW: Handle custom date toggle
  onCustomDateToggle() {
    if (this.useCustomDate) {
      // When enabling custom date, set to today
      this.setDefaultDate();
    }
    this.onFilterChange();
  }

  // ✨ NEW: Handle date change
  onDateChange() {
    this.onFilterChange();
  }

  onSearchClick() {
    const empty: string[] = [];
    if (!this.company) empty.push('Perusahaan');
    
    // Validate based on mode
    if (this.useCustomDate) {
      if (!this.selectedDate) empty.push('Tanggal');
    } else {
      if (!this.year) empty.push('Tahun');
    }

    if (empty.length) {
      this.show('Mohon lengkapi: ' + empty.join(', '), 'danger');
      return;
    }

    this.search.emit({
      company: this.company,
      category: this.category,
      year: this.useCustomDate ? '' : this.year,
      month: this.useCustomDate ? '' : this.month,
      branch: this.branch,
      compare: this.compare,
      useCustomDate: this.useCustomDate,
      selectedDate: this.useCustomDate ? this.selectedDate : '',
    });
  }

  // Alert helpers
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