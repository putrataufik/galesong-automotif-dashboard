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

// Interface untuk filter After Sales
export interface AfterSalesFilter {
  company: string;
  cabang: string;
  period: string;
  month: string;
}

// Interface untuk opsi dropdown
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
  // Props dari parent
  @Input() initialFilter: AfterSalesFilter | null = null;
  @Input() loading = false;

  // Event emitter untuk mengirim filter ke parent
  @Output() search = new EventEmitter<AfterSalesFilter>();

  // Static data perusahaan
  companies: Option[] = [
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
    // { value: 'sinar-galesong-mandiri', name: 'Sinar Galesong Mandiri' },
    // { value: 'sinar-galesong-prima', name: 'Sinar Galesong Prima' },
    // { value: 'sinar-galesong-automobil', name: 'Sinar Galesong Automobil' },
  ];

  // Static data cabang (berdasarkan mapping yang ada di BaseApiService)
  cabangOptions: Option[] = [
    { value: 'all-cabang', name: 'Semua Cabang' },
    { value: '0050', name: 'PETTARANI' },
    // { value: '0051', name: 'PALU' },
    // { value: '0052', name: 'KENDARI' },
    // { value: '0053', name: 'GORONTALO' },
    // { value: '0054', name: 'PALOPO' },
    // { value: '0055', name: 'SUNGGUMINASA' },
  ];

  // Periode tahun (generate dinamis)
  periods: Option[] = this.generateYearPeriods();
  months: Option[] = this.generateMonths();

  // State untuk form filter (ngModel)
  company = '';
  cabang = 'all-cabang';
  period = String(new Date().getFullYear());
  month = this.getCurrentMonth(); // ✅ Default ke bulan saat ini

  // State alert notifikasi
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  private alertTimeoutId: any;

  // ✅ Method untuk mendapatkan bulan saat ini dalam format "MM"
  private getCurrentMonth(): string {
    const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11, kita butuh 1-12
    return String(currentMonth).padStart(2, '0'); // Format menjadi "01", "02", dst
  }

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
  private applyInitialFilter(filter: AfterSalesFilter | null) {
    if (!filter) return;

    this.company = filter.company ?? this.company;
    this.cabang = filter.cabang ?? this.cabang;

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
    const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
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

  // ✅ Method yang dipanggil saat tahun berubah
  onPeriodChange() {
    this.onFilterChange();

    // Update default bulan berdasarkan tahun yang dipilih
    const currentYear = new Date().getFullYear();
    const selectedYear = parseInt(this.period);

    if (selectedYear === currentYear) {
      // Jika pilih tahun sekarang → default ke bulan saat ini
      this.month = this.getCurrentMonth();
    } else {
      // Jika pilih tahun lain → default ke "Semua Bulan"
      this.month = 'all-month';
    }
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
      cabang: this.cabang,
      period: this.period,
      month: this.month,
    });

    // Tampilkan notifikasi
    this.show('Pencarian berhasil! Data After Sales sedang dimuat…', 'success');
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
    this.alertTimeoutId = setTimeout(() => this.hideAlert(), 1000);
  }
}