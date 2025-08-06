import {
  Component,
  computed,
  EventEmitter,
  OnInit,
  Output,
  signal,
} from '@angular/core';

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
  // ✅ Ganti deteksi platform tanpa DI (supaya tidak memicu NG0203)
  private readonly isBrowser =
    typeof window !== 'undefined' && typeof document !== 'undefined';

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

  // Computed: cabang untuk company terpilih
  availableBranches = computed(() => {
    const selectedCompanyValue = this.selectedCompany();
    if (!selectedCompanyValue) return [];
    const company = this.companies.find(
      (c) => c.value === selectedCompanyValue
    );
    return company?.branches || [];
  });

  ngOnInit() {
    if (this.isBrowser) {
      const savedFilter = localStorage.getItem('dashboardFilter');
      if (savedFilter) {
        const filter = JSON.parse(savedFilter);
        this.selectedCompany.set(filter.company);
        this.selectedBranch.set(filter.branch);
        this.selectedCategory.set(filter.category);

        // set value ke select element (dipertahankan sesuai template Anda)
        setTimeout(() => {
          const companyEl = document.getElementById('company-select') as HTMLSelectElement | null;
          const branchEl = document.getElementById('branch-select') as HTMLSelectElement | null;
          const categoryEl = document.getElementById('category-select') as HTMLSelectElement | null;
          if (companyEl) companyEl.value = filter.company;
          if (branchEl) branchEl.value = filter.branch;
          if (categoryEl) categoryEl.value = filter.category;
        }, 0);
      }
    }
  }

  // Handle perubahan perusahaan
  onCompanyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCompany.set(target.value);

    // Default ke "Semua Cabang" ketika perusahaan berubah
    if (this.isBrowser) {
      const branchSelect = document.getElementById('branch-select') as HTMLSelectElement | null;
      if (branchSelect) branchSelect.value = 'all-branch';
    }
    this.selectedBranch.set('all-branch');
  }

  // Alert handler
  showAlertMessage(message: string, type: 'success' | 'danger' = 'danger') {
    this.alertMessage.set(message);
    this.alertType.set(type);
    this.showAlert.set(true);
    setTimeout(() => this.hideAlert(), 5000);
  }

  hideAlert() {
    this.showAlert.set(false);
  }

  // Handle pencarian
  onSearch() {
    // Ambil nilai dari DOM sesuai template Anda
    let company = this.selectedCompany();
    let branch = this.selectedBranch();
    let category = this.selectedCategory();

    if (this.isBrowser) {
      const companySelect = document.getElementById('company-select') as HTMLSelectElement | null;
      const branchSelect = document.getElementById('branch-select') as HTMLSelectElement | null;
      const categorySelect = document.getElementById('category-select') as HTMLSelectElement | null;
      company = companySelect?.value ?? company;
      branch = branchSelect?.value ?? branch;
      category = categorySelect?.value ?? category;
    }

    // Validasi
    const emptyFilters: string[] = [];
    if (!company) emptyFilters.push('Perusahaan');
    if (!branch) emptyFilters.push('Cabang');
    if (!category) emptyFilters.push('Kategori');

    if (emptyFilters.length > 0) {
      this.showAlertMessage(
        `Mohon lengkapi filter berikut: ${emptyFilters.join(', ')}`,
        'danger'
      );
      return;
    }

    const filters = { company, branch, category };

    if (this.isBrowser) {
      localStorage.setItem('dashboardFilter', JSON.stringify(filters));
    }

    this.search.emit(filters);
    this.showAlertMessage('Pencarian berhasil! Data sedang dimuat...', 'success');
  }
}
