import {
  Component,
  computed,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Branch {
  value: string;
  name: string;
}

interface Company {
  value: string;
  name: string;
  branches: Branch[];
}

interface Category {
  value: string;
  name: string;
}

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css',
})
export class FilterComponent implements OnInit {
  selectedCompany = signal<string>('');
  selectedBranch = signal<string>('');
  selectedCategory = signal<string>('');
  showAlert = signal<boolean>(false);
  alertMessage = signal<string>('');
  alertType = signal<'success' | 'danger'>('danger');

  @Output() search = new EventEmitter<{
    company: string;
    branch: string;
    category: string;
  }>();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  // Data Company dan Branchnya
  companies: Company[] = [
    {
      value: 'sinar-galesong-mandiri',
      name: 'Sinar Galesong Mandiri',
      branches: [
        { value: 'all-branch', name: 'Semua Cabang' },
        { value: 'suzuki-urip-sumoharjo', name: 'Suzuki Motor Cabang Urip Sumoharjo' },
        { value: 'suzuki-yos-sudarso', name: 'Suzuki Motor Cabang Yos Sudarso' },
        { value: 'suzuki-aeropala', name: 'Suzuki Motor Cabang Aeropala' },
        { value: 'suzuki-gowa', name: 'Suzuki Motor Cabang Gowa' },
      ],
    },
    {
      value: 'sinar-galesong-prima',
      name: 'Sinar Galesong Prima',
      branches: [
        { value: 'all-branch', name: 'Semua Cabang' },
        { value: 'cabang-bitung', name: 'Cabang Bitung' },
        { value: 'cabang-manado', name: 'Cabang Manado' },
        { value: 'cabang-kotamobagu', name: 'Cabang Kotamobagu' },
      ],
    },
    {
      value: 'sinar-galesong-automobil',
      name: 'Sinar Galesong Automobil',
      branches: [
        { value: 'all-branch', name: 'Semua Cabang' },
        { value: 'mg-pettarani', name: 'MG Pettarani' },
        { value: 'mg-kairagi', name: 'MG Kairagi' },
      ],
    },
    {
      value: 'sinar-galesong-mobilindo',
      name: 'Sinar Galesong Mobilindo',
      branches: [
        { value: 'all-branch', name: 'Semua Cabang' },
        { value: 'hyundai-pettarani', name: 'Hyundai Pettarani' },
        { value: 'hyundai-gorontalo', name: 'Hyundai Gorontalo' },
        { value: 'hyundai-palu', name: 'Hyundai Palu' },
        { value: 'hyundai-kendari', name: 'Hyundai Kendari' },
        { value: 'hyundai-palopo', name: 'Hyundai Palopo' },
        { value: 'hyundai-sungguminasa', name: 'Hyundai Sungguminasa' },
      ],
    },
  ];

  // Data kategori
  categories: Category[] = [
    { value: 'all-category', name: 'Semua Kategori' },
    { value: 'sales', name: 'Sales' },
    { value: 'after-sales', name: 'After Sales' },
  ];

  // Computed signal untuk cabang yang tersedia berdasarkan perusahaan terpilih
  availableBranches = computed(() => {
    const selectedCompanyValue = this.selectedCompany();
    if (!selectedCompanyValue) return [];
    const company = this.companies.find(
      (c) => c.value === selectedCompanyValue
    );
    return company?.branches || [];
  });

  ngOnInit() {
    // Cek apakah di browser sebelum akses localStorage
    if (isPlatformBrowser(this.platformId)) {
      const savedFilter = localStorage.getItem('dashboardFilter');
      if (savedFilter) {
        const filter = JSON.parse(savedFilter);
        this.selectedCompany.set(filter.company);
        this.selectedBranch.set(filter.branch);
        this.selectedCategory.set(filter.category);

        // set value ke select element
        setTimeout(() => {
          (document.getElementById('company-select') as HTMLSelectElement).value = filter.company;
          (document.getElementById('branch-select') as HTMLSelectElement).value = filter.branch;
          (document.getElementById('category-select') as HTMLSelectElement).value = filter.category;
        }, 0);
      }
    }
  }

  // Method untuk handle perubahan perusahaan
  onCompanyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCompany.set(target.value);

    // Set default ke "Semua Cabang" ketika perusahaan berubah
    const branchSelect = document.getElementById('branch-select') as HTMLSelectElement;
    if (branchSelect) {
      branchSelect.value = 'all-branch';
    }
  }

  // Alert handler
  showAlertMessage(message: string, type: 'success' | 'danger' = 'danger') {
    this.alertMessage.set(message);
    this.alertType.set(type);
    this.showAlert.set(true);

    // Auto hide alert setelah 5 detik
    setTimeout(() => this.hideAlert(), 5000);
  }

  hideAlert() {
    this.showAlert.set(false);
  }

  // Handle pencarian
  onSearch() {
    const companySelect = document.getElementById('company-select') as HTMLSelectElement;
    const branchSelect = document.getElementById('branch-select') as HTMLSelectElement;
    const categorySelect = document.getElementById('category-select') as HTMLSelectElement;

    // Validasi filter
    const emptyFilters = [];
    if (!companySelect.value) emptyFilters.push('Perusahaan');
    if (!branchSelect.value) emptyFilters.push('Cabang');
    if (!categorySelect.value) emptyFilters.push('Kategori');

    if (emptyFilters.length > 0) {
      this.showAlertMessage(
        `Mohon lengkapi filter berikut: ${emptyFilters.join(', ')}`,
        'danger'
      );
      return;
    }

    const filters = {
      company: companySelect.value,
      branch: branchSelect.value,
      category: categorySelect.value,
    };

    // Simpan ke localStorage jika di browser
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('dashboardFilter', JSON.stringify(filters));
    }

    this.search.emit(filters);
    this.showAlertMessage('Pencarian berhasil! Data sedang dimuat...', 'success');
  }
}
