import { Component, signal } from '@angular/core';

interface Company {
  value: string;
  name: string;
}

interface Category {
  value: string;
  name: string;
}

interface Period {
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

  // Data Company tanpa branches
  companies: Company[] = [
    {
      value: 'sinar-galesong-mandiri',
      name: 'Sinar Galesong Mandiri'
    },
    {
      value: 'sinar-galesong-prima',
      name: 'Sinar Galesong Prima'
    },
    {
      value: 'sinar-galesong-automobil',
      name: 'Sinar Galesong Automobil'
    },
    {
      value: 'sinar-galesong-mobilindo',
      name: 'Sinar Galesong Mobilindo'
    },
  ];

  // Data kategori
  categories: Category[] = [
    { value: 'all-category', name: 'Semua Kategori' },
    { value: 'sales', name: 'Sales' },
    { value: 'after-sales', name: 'After Sales' },
  ];

  // Data periode - dinamis berdasarkan tahun sekarang
  periods: Period[] = this.generateYearPeriods();

  // Method untuk generate periode tahun dinamis
  private generateYearPeriods(): Period[] {
    const currentYear = new Date().getFullYear();
    const periods: Period[] = [];
    
    // Tambahkan "Tahun Ini" sebagai pilihan pertama
    periods.push({ 
      value: currentYear.toString(), 
      name: `Tahun Ini (${currentYear})` 
    });
    
    // Tambahkan 5 tahun ke belakang
    for (let i = 1; i <= 5; i++) {
      const year = currentYear - i;
      periods.push({ 
        value: year.toString(), 
        name: year.toString() 
      });
    }
    
    return periods;
  }

  // Method untuk handle perubahan perusahaan
  onCompanyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCompany.set(target.value);
  }

  // <<<<<<<<=============== ALERT METHOD ==============>>>>>>>>
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

  // <<<<<<<<=============== ALERT METHOD ==============>>>>>>>>

  // Method untuk handle pencarian
  onSearch() {
    const companySelect = document.getElementById(
      'company-select'
    ) as HTMLSelectElement;
    const categorySelect = document.getElementById(
      'category-select'
    ) as HTMLSelectElement;
    const periodSelect = document.getElementById(
      'period-select'
    ) as HTMLSelectElement;

    // Validasi filter yang kosong
    const emptyFilters = [];

    if (!companySelect.value) {
      emptyFilters.push('Perusahaan');
    }
    if (!categorySelect.value) {
      emptyFilters.push('Kategori');
    }
    if (!periodSelect.value) {
      emptyFilters.push('Periode');
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
      category: categorySelect.value,
      period: periodSelect.value,
    };

    console.log('Filter yang dipilih:', filters);
    // Implementasi logika pencarian di sini
    this.showAlertMessage(
      'Pencarian berhasil! Data sedang dimuat...',
      'success'
    );
  }
}