// =============================
// src/app/shared/components/filter/filter.component.ts
// =============================
import { Component, EventEmitter, Output, Input, SimpleChanges, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppFilter, CategoryFilter } from '../../../types/filter.model';

interface Option { value: string; name: string; }

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css',
})
export class FilterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() initialFilter: AppFilter | null = null;
  @Input() loading = false; // opsional: disable tombol saat loading
  @Output() search = new EventEmitter<AppFilter>();

  companies: Option[] = [
    { value: 'sinar-galesong-mandiri',   name: 'Sinar Galesong Mandiri' },
    { value: 'sinar-galesong-prima',     name: 'Sinar Galesong Prima' },
    { value: 'sinar-galesong-automobil', name: 'Sinar Galesong Automobil' },
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
  ];

  categories: Option[] = [
    { value: 'all-category', name: 'Semua Kategori' },
    { value: 'sales',        name: 'Sales' },
    { value: 'after-sales',  name: 'After Sales' },
  ];

  periods: Option[] = this.generateYearPeriods();

  // state ngModel
  company = '';
  category: CategoryFilter = 'all-category';
  period = String(new Date().getFullYear());

  // alert state
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

  private applyInitialFilter(filter: AppFilter | null) {
    if (!filter) return;

    this.company = filter.company ?? this.company;
    this.category = (filter.category ?? this.category) as CategoryFilter;

    if (filter.period && !this.periods.find(p => p.value === filter.period)) {
      this.periods = [{ value: filter.period, name: filter.period }, ...this.periods];
    }
    this.period = filter.period ?? this.period;
  }

  private generateYearPeriods(): Option[] {
    const currentYear = new Date().getFullYear();
    const list: Option[] = [{ value: String(currentYear), name: `Tahun Ini (${currentYear})` }];
    for (let i = 1; i <= 5; i++) list.push({ value: String(currentYear - i), name: String(currentYear - i) });
    return list;
  }

  onFilterChange() {
    if (this.showAlert) this.hideAlert();
  }

  onSearchClick() {
    const empty: string[] = [];
    if (!this.company) empty.push('Perusahaan');
    if (!this.period) empty.push('Periode');

    if (empty.length) {
      this.show('Mohon lengkapi: ' + empty.join(', '), 'danger');
      return;
    }

    this.search.emit({ company: this.company, category: this.category, period: this.period });
    this.show('Pencarian berhasil! Data sedang dimuat…', 'success');
  }

  hideAlert() { this.showAlert = false; }

  private show(msg: string, type: 'success' | 'danger') {
    this.alertMessage = msg;
    this.alertType = type;
    this.showAlert = true;
    clearTimeout(this.alertTimeoutId);
    this.alertTimeoutId = setTimeout(() => this.hideAlert(), 4000);
  }
}