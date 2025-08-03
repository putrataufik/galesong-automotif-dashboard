import { Component, computed, signal } from '@angular/core';

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

export class FilterComponent {
  selectedCompany = signal<string>('');
  showAlert = signal<boolean>(false);
  alertMessage = signal<string>('');
  alertType = signal<'success' | 'danger'>('danger');
  // Data Company dan Branchnya
  companies: Company[] = [
    {
      value: 'sinar-galesong-mandiri',
      name: 'Sinar Galesong Mandiri',
      branches: [
        { value: 'all-branch', name: 'Semua Cabang' },
        {
          value: 'suzuki-urip-sumoharjo',
          name: 'Suzuki Motor Cabang Urip Sumoharjo',
        },
        {
          value: 'suzuki-yos-sudarso',
          name: 'Suzuki Motor Cabang Yos Sudarso',
        },
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
    if (!selectedCompanyValue) {
      return [];
    }

    const company = this.companies.find(
      (c) => c.value === selectedCompanyValue
    );
    return company?.branches || [];
  });

  // Method untuk handle perubahan perusahaan
  onCompanyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCompany.set(target.value);

    // Set default ke "Semua Cabang" ketika perusahaan berubah
    const branchSelect = document.getElementById(
      'branch-select'
    ) as HTMLSelectElement;
    if (branchSelect) {
      branchSelect.value = 'all-branch';
    }
  }

  // <<<<<<<<=============== ALLERT METHOD ==============>>>>>>>>
  showAlertMessage(message: string, type: 'success' | 'danger' = 'danger') {
    this.alertMessage.set(message);
    this.alertType.set(type);
    this.showAlert.set(true);

    // Auto hide alert setelah 5 detik
    setTimeout(() => {
      this.hideAlert();
    }, 5000);
  }
  // Method untuk menyembunyikan alert
  hideAlert() {
    this.showAlert.set(false);
  }

  // <<<<<<<<=============== ALLERT METHOD ==============>>>>>>>>

  // Method untuk handle pencarian
  onSearch() {
    const companySelect = document.getElementById(
      'company-select'
    ) as HTMLSelectElement;
    const branchSelect = document.getElementById(
      'branch-select'
    ) as HTMLSelectElement;
    const categorySelect = document.getElementById(
      'category-select'
    ) as HTMLSelectElement;

    // Validasi filter yang kosong
    const emptyFilters = [];

    if (!companySelect.value) {
      emptyFilters.push('Perusahaan');
    }
    if (!branchSelect.value) {
      emptyFilters.push('Cabang');
    }
    if (!categorySelect.value) {
      emptyFilters.push('Kategori');
    }

    // Jika ada filter yang kosong, tampilkan alert
    if (emptyFilters.length > 0) {
      const missingFilters = emptyFilters.join(', ');
      this.showAlertMessage(
        `Mohon lengkapi filter berikut: ${missingFilters}`,
        'danger'
      );
      return;
    }

    const filters = {
      company: companySelect.value,
      branch: branchSelect.value,
      category: categorySelect.value,
    };

    console.log('Filter yang dipilih:', filters);
    // Implementasi logika pencarian di sini
    this.showAlertMessage(
      'Pencarian berhasil! Data sedang dimuat...',
      'success'
    );
  }
}
