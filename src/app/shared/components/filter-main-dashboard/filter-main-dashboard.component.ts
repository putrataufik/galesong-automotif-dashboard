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
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppFilter, CategoryFilter } from '../../../types/filter.model';

import { UserInfoComponent } from '../user-info/user-info.component';

interface Option {
  value: string;
  name: string;
}

@Component({
  selector: 'app-filter-main-dashboard',
  standalone: true,
  imports: [FormsModule, UserInfoComponent],
  templateUrl: './filter-main-dashboard.component.html',
  styleUrls: ['./filter-main-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterMainDashboardComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() currentFilter: AppFilter | null = null;
  @Input() loading = false;

  @Output() search = new EventEmitter<AppFilter>();

  companies: Option[] = [
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
  ];

  categories: Option[] = [
    { value: 'all-category', name: 'Semua Kategori' },
    { value: 'sales', name: 'Sales' },
    { value: 'after-sales', name: 'After Sales' },
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
  months: Option[] = this.generateMonths();

  company = '';
  category: CategoryFilter = 'all-category';
  year = String(new Date().getFullYear());
  month = String(new Date().getMonth() + 1).padStart(2, '0');
  branch = 'all-branch';
  compare = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  private alertTimeoutId: any;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {} // <-- Hapus dm & ml dari constructor

  async ngOnInit() {
    // Hapus: await this.dm.ensureLoaded();
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
  }

  private generateYearYears(): Option[] {
    const currentYear = new Date().getFullYear();
    const list: Option[] = [{ value: String(currentYear), name: `Tahun Ini (${currentYear})` }];
    for (let y = currentYear - 1; y >= 2022; y--) list.push({ value: String(y), name: String(y) });
    return list;
  }

  private generateMonths(): Option[] {
    const names = [
      'Januari','Februari','Maret','April','Mei','Juni',
      'Juli','Agustus','September','Oktober','November','Desember',
    ];
    const opts: Option[] = [];
    for (let i = 0; i < 12; i++) {
      const v = String(i + 1).padStart(2, '0');
      opts.push({ value: v, name: names[i] });
    }
    return opts;
  }

  onFilterChange() {
    if (this.showAlert) this.hideAlert();
  }
  onYearChange() { this.onFilterChange(); }
  onCompanyChange() {
    this.branch = 'all-branch';
    this.onFilterChange();
  }

  onSearchClick() {
    const empty: string[] = [];
    if (!this.company) empty.push('Perusahaan');
    if (!this.year) empty.push('Tahun');

    if (empty.length) {
      this.show('Mohon lengkapi: ' + empty.join(', '), 'danger');
      return;
    }

    this.search.emit({
      company: this.company,
      category: this.category,
      year: this.year,
      month: this.month,
      branch: this.branch,
      compare: this.compare,
    });
  }

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

  trackByValue = (index: number, item: Option) => item?.value ?? index;
}
