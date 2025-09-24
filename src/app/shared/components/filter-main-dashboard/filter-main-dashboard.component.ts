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
  selector: 'app-filter-main-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-main-dashboard.component.html',
  styleUrl: './filter-main-dashboard.component.css',
})
export class FilterMainDashboardComponent
  implements OnInit, OnChanges, OnDestroy
{
  // Props dari parent
  @Input() currentFilter: AppFilter | null = null;
  @Input() loading = false;

  // Emit ke parent
  @Output() search = new EventEmitter<AppFilter>();

  // Static data
  companies: Option[] = [
    { value: 'sinar-galesong-mobilindo', name: 'Sinar Galesong Mobilindo' },
  ];

  categories: Option[] = [
    { value: 'all-category', name: 'Semua Kategori' },
    { value: 'sales', name: 'Sales' },
    { value: 'after-sales', name: 'After Sales' },
  ];

  // Branch/cabang (contoh statis; bisa diganti dari API)
  branches: Option[] = [
    { value: 'all-branch', name: 'Semua Cabang' },
    { value: '0050', name: 'Pettarani' },
    { value: '0051', name: 'Palu' },
    { value: '0052', name: 'Kendari' },
    { value: '0053', name: 'Gorontalo' },
    { value: '0054', name: 'Palopo' },
  ];

  // Tahun & Bulan
  years: Option[] = this.generateYearYears();
  months: Option[] = this.generateMonths();

  company = '';
  category: CategoryFilter = 'all-category';
  year = String(new Date().getFullYear());
  // bulan default = bulan saat ini
  month = String(new Date().getMonth() + 1).padStart(2, '0');
  branch = 'all-branch'; // default: Semua Cabang
  compare = false;

  // Alert
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  full_name = '';
  photo_profile_path = '';
  work_area = '';
  organization = '';
  job_level = '';
  company_name= '';
  private alertTimeoutId: any;
  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  // Lifecycle
  ngOnInit() {
    console.log('Filter Ter Init')
    try { 
      const raw = localStorage.getItem('auth.user'); 
      if (raw) { 
        const p: any = JSON.parse(raw);
        const u = Array.isArray(p?.data) ? p.data[0] : Array.isArray(p) ? p[0] : p;
        this.full_name = u?.full_name ?? u?.alias_name ?? '';
        this.photo_profile_path = u?.photo_profile_path ?? '';
        this.work_area = u?.work_area ?? '';
        this.organization = u?.organization ?? '';
        this.job_level = u?.job_level ?? '';
        this.company_name = u?.company ?? '';

        console.log('Dataaaaa: ',this.full_name, this.photo_profile_path, this.work_area, this.organization, this.job_level, this.company_name);
      }
      console.log('di luarrrr')
    } catch {
      console.log('Gagal parse user data');
    }
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

  // Terapkan filter dari parent
  private applyCurrentFilter(filter: AppFilter | null) {
    if (!filter) return;

    this.company = filter.company ?? this.company;
    this.category = (filter.category ?? this.category) as CategoryFilter;

    // Jika tahun tidak ada di list -> tambahkan
    if (filter.year && !this.years.find((p) => p.value === filter.year)) {
      this.years = [{ value: filter.year, name: filter.year }, ...this.years];
    }

    this.year = filter.year ?? this.year;
    this.month = filter.month ?? 'all-month';
    this.branch = filter.branch ?? 'all-branch';
    this.compare = !!filter.compare;
  }

  // Generate list tahun (current -> 2022)
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
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const opts: Option[] = [];
    for (let i = 0; i < 12; i++) {
      const v = String(i + 1).padStart(2, '0'); // "01".."12"
      opts.push({ value: v, name: names[i] });
    }
    return opts;
  }

  // Perubahan filter → reset alert
  onFilterChange() {
    if (this.showAlert) this.hideAlert();
  }

  // Saat tahun berubah → jangan reset bulan ke "all-month"
  onYearChange() {
    this.onFilterChange();
  }

  // Saat perusahaan berubah → reset branch ke "Semua"
  onCompanyChange() {
    this.branch = 'all-branch';
    this.onFilterChange();
  }

  // Klik cari
  onSearchClick() {
    const empty: string[] = [];
    if (!this.company) empty.push('Perusahaan');
    if (!this.year) empty.push('Tahun');

    if (empty.length) {
      this.show('Mohon lengkapi: ' + empty.join(', '), 'danger');
      return;
    }
    console.log('search klik')
    console.log('nama: ', this.full_name)
    this.search.emit({
      company: this.company,
      category: this.category,
      year: this.year,
      month: this.month,
      branch: this.branch,
      compare: this.compare,
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
