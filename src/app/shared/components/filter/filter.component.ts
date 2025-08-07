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
  selector: 'app-filter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css',
})
export class FilterComponent implements OnInit, OnChanges, OnDestroy {
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
  ];

  // Periode tahun (generate dinamis)
  periods: Option[] = this.generateYearPeriods();

  // State untuk form filter (ngModel)
  company = '';
  category: CategoryFilter = 'all-category';
  period = String(new Date().getFullYear());

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
    });

    // Tampilkan notifikasi
    this.show('Pencarian berhasil! Data sedang dimuat…', 'success');
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
