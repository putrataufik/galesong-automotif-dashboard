import {
  Component,
  EventEmitter,
  Output,
  Input,
  SimpleChanges,
  OnInit,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppFilter, CategoryFilter } from '../../../types/filter.model';

// Interface untuk opsi dropdown (company, category, period)
interface Option {
  value: string;
  name: string;
}

@Component({
  selector: 'app-filter-main-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-main-dashboard.component.html',
  styleUrl: './filter-main-dashboard.component.css',
})
export class FilterMainDashboardComponent implements OnInit, OnChanges, OnDestroy {
  // Props dari parent
  @Input() initialFilter: AppFilter | null = null;
  @Input() loading = false;

  // Event emitter untuk mengirim filter ke parent
  @Output() search = new EventEmitter<AppFilter>();

  // Static data perusahaan
  companies: Option[] = [
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
  ];

  // Static data kategori
  categories: Option[] = [
    { value: 'all-category', name: 'Semua Kategori' },
    { value: 'sales', name: 'Sales' },
    { value: 'after-sales', name: 'After Sales' },
  ];

  // Periode tahun (generate dinamis)
  periods: Option[] = this.generateYearPeriods();
  months: Option[] = this.generateMonths();

  // State untuk form filter (ngModel)
  company = '';
  category: CategoryFilter = 'all-category';
  period = String(new Date().getFullYear());
  month = 'all-month';

  // State alert notifikasi
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  private alertTimeoutId: any;

  // Lifecycle: pertama kali komponen dibuat
  ngOnInit() {
    if (this.initialFilter) this.applyInitialFilter(this.initialFilter);
  }

  // Lifecycle: jika input berubah
  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialFilter']) {
      this.applyInitialFilter(changes['initialFilter'].currentValue);
    }
  }

  // Lifecycle: sebelum komponen dihancurkan
  ngOnDestroy() {
    clearTimeout(this.alertTimeoutId);
  }

  // Terapkan filter awal yang dikirim dari parent
  private applyInitialFilter(filter: AppFilter | null) {
    if (!filter) return;

    this.company = filter.company ?? this.company;
    this.category = (filter.category ?? this.category) as CategoryFilter;

    // Jika tahun dari filter tidak ada dalam list tahun, tambahkan secara dinamis
    if (filter.period && !this.periods.find((p) => p.value === filter.period)) {
      this.periods = [
        { value: filter.period, name: filter.period },
        ...this.periods,
      ];
    }

    this.period = filter.period ?? this.period;
    this.month = filter.month ?? this.month;
  }

  // Buat daftar tahun (2022 - sekarang)
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
    const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const opts: Option[] = [{ value: 'all-month', name: 'Semua Bulan' }];
    for (let i = 0; i < 12; i++) {
      const v = String(i + 1).padStart(2, '0');
      opts.push({ value: v, name: names[i] });
    }
    return opts;
  }

  // Saat salah satu filter diubah → reset alert
  onFilterChange() {
    if (this.showAlert) this.hideAlert();
  }

  // Saat tombol cari ditekan
  onSearchClick() {
    const empty: string[] = [];
    if (!this.company) empty.push('Perusahaan');
    if (!this.period) empty.push('Periode');

    // Validasi: wajib pilih perusahaan dan periode
    if (empty.length) {
      this.show('Mohon lengkapi: ' + empty.join(', '), 'danger');
      return;
    }

    // Emit ke parent
    this.search.emit({
      company: this.company,
      category: this.category,
      period: this.period,
      month: this.month,
    });
  }

  // Sembunyikan alert secara manual
  hideAlert() {
    this.showAlert = false;
  }

  // Tampilkan alert dengan pesan dan tipe
  private show(msg: string, type: 'success' | 'danger') {
    this.alertMessage = msg;
    this.alertType = type;
    this.showAlert = true;

    // Auto-hide dalam 4 detik
    clearTimeout(this.alertTimeoutId);
    this.alertTimeoutId = setTimeout(() => this.hideAlert(), 4000);
  }
}
