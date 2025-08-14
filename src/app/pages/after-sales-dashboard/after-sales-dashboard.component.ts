import { Component, inject, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { FilterAftersalesDashboardComponent, AfterSalesFilter } from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';
import { KpiCardAsComponent } from '../../shared/components/kpi-card-as/kpi-card-as.component';

import { AfterSalesService } from '../../core/services/aftersales.service';
import { AfterSalesResponse, AfterSalesItem } from '../../types/aftersales.model';

interface KpiData {
  afterSales: { realisasi: number; target: number; };
  serviceCabang: { realisasi: number; target: number; };
  unitEntry: { realisasi: number; target: number; };
  sparepartTunai: { realisasi: number; target: number; };
  totalUnitEntry: number;
}

interface SisaHariOption {
  value: string;
  name: string;
}

@Component({
  selector: 'app-after-sales-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterAftersalesDashboardComponent, KpiCardAsComponent],
  templateUrl: './after-sales-dashboard.component.html',
  styleUrl: './after-sales-dashboard.component.css'
})
export class AfterSalesDashboardComponent {
  private afterSalesService = inject(AfterSalesService);
  private destroyRef = inject(DestroyRef);

  // State signals
  loading = signal(false);
  error = signal<string | null>(null);
  kpiData = signal<KpiData | null>(null);
  currentFilter = signal<AfterSalesFilter | null>(null);

  // Sisa Hari Kerja filter (moved from filter component)
  sisaHariKerja = '';
  sisaHariKerjaOptions: SisaHariOption[] = [];
  showSisaHariKerja = signal(false);

  // Computed properties
  hasData = computed(() => !!this.kpiData());

  onSearch(filter: AfterSalesFilter) {
    console.log('After Sales Search initiated:', filter);
  
    this.error.set(null);
    this.currentFilter.set(filter);
    
    // First update with no API data (will use fallback)
    this.updateSisaHariKerjaOptions(filter);
    this.loading.set(true);
  
    this.afterSalesService.getAfterSalesMonthly(filter.company, filter.period)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          console.log('📡 Raw API Response:', response);
  
          // DEBUG: Lihat struktur data asli
          console.log('🔍 DEBUG - First 3 items from API:');
          response.aftersales?.slice(0, 3).forEach((item, index) => {
            console.log(`Item ${index + 1}:`, {
              month: item.month,
              cabang_id: item.cabang_id,
              hari_kerja: item.hari_kerja, // ← Important field
              after_sales_realisasi: item.after_sales_realisasi,
              after_sales_target: item.after_sales_target
            });
          });
  
          // Update sisa hari kerja options dengan data API
          this.updateSisaHariKerjaOptions(filter, response.aftersales);
  
          const processed = this.processAfterSalesData(response, filter);
          console.log('✅ Final Processed KPI Data:', processed);
          this.kpiData.set(processed);
        },
        error: (err) => {
          console.error('Error fetching after sales data:', err);
          this.error.set('Gagal memuat data after sales. Silakan coba lagi.');
        }
      });
  }

  private updateSisaHariKerjaOptions(filter: AfterSalesFilter, apiData?: AfterSalesItem[]) {
    console.log('🔧 Updating sisa hari kerja options for filter:', filter);
    console.log('🔧 API data available:', !!apiData, 'items:', apiData?.length || 0);
    
    if (filter.month === 'all-month' || !filter.month) {
      console.log('🔧 Hiding sisa hari kerja (all-month selected)');
      this.showSisaHariKerja.set(false);
      this.sisaHariKerja = '';
      this.sisaHariKerjaOptions = [];
    } else {
      console.log('🔧 Showing sisa hari kerja (specific month selected)');
      this.showSisaHariKerja.set(true);
      
      // Generate options based on API data if available
      if (apiData && apiData.length > 0) {
        this.sisaHariKerjaOptions = this.generateSisaHariKerjaFromAPI(filter, apiData);
      } else {
        // Fallback: use calendar days if no API data yet
        this.sisaHariKerjaOptions = this.generateSisaHariKerjaFallback(filter.month, filter.period);
      }
      
      console.log('🔧 Generated options:', this.sisaHariKerjaOptions.length, 'days');
      
      // Set default to mid-range
      const defaultDay = Math.min(15, this.sisaHariKerjaOptions.length);
      this.sisaHariKerja = String(defaultDay);
      console.log('🔧 Set default sisa hari kerja to:', this.sisaHariKerja);
    }
  }
  private generateSisaHariKerjaFallback(month: string, year: string): SisaHariOption[] {
    console.log('📅 Generating sisa hari kerja FALLBACK for month:', month, 'year:', year);
    
    const monthNum = parseInt(month); 
    const yearNum = parseInt(year);   
    
    // Get days in month sebagai fallback
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    console.log('📅 Fallback - Days in month:', daysInMonth);
  
    const options: SisaHariOption[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      options.push({
        value: String(i),
        name: `${i} hari tersisa`
      });
    }
    
    console.log('📅 Generated', options.length, 'fallback options');
    return options;
  }

  private generateSisaHariKerjaOptions(month: string, year: string): SisaHariOption[] {
    console.log('📅 Generating sisa hari kerja options for month:', month, 'year:', year);
    
    const monthNum = parseInt(month); // "01" -> 1
    const yearNum = parseInt(year);   // "2024" -> 2024
    
    console.log('📅 Parsed month:', monthNum, 'year:', yearNum);
    
    // Get days in month
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    console.log('📅 Days in month:', daysInMonth);
  
    const options: SisaHariOption[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      options.push({
        value: String(i),
        name: `${i} hari tersisa`
      });
    }
    
    console.log('📅 Generated', options.length, 'options:', options.slice(0, 3), '...');
    return options;
  }
  private generateSisaHariKerjaFromAPI(filter: AfterSalesFilter, apiData: AfterSalesItem[]): SisaHariOption[] {
    console.log('📅 Generating sisa hari kerja from API data');
    
    // Filter data untuk month yang dipilih
    const normalizedFilterMonth = parseInt(filter.month).toString();
    const monthData = apiData.filter(item => item.month === normalizedFilterMonth);
    
    console.log('📅 Filtered data for month', normalizedFilterMonth, ':', monthData.length, 'items');
    
    if (monthData.length === 0) {
      console.warn('📅 No data found for month', normalizedFilterMonth, 'using fallback');
      return this.generateSisaHariKerjaFallback(filter.month, filter.period);
    }
    
    // Ambil hari_kerja dari data pertama (asumsi semua cabang sama hari kerjanya untuk bulan tersebut)
    const hariKerja = parseInt(monthData[0].hari_kerja) || 30;
    console.log('📅 Hari kerja from API:', hariKerja, 'days');
    
    // Generate options dari 1 sampai hari_kerja
    const options: SisaHariOption[] = [];
    for (let i = 1; i <= hariKerja; i++) {
      options.push({
        value: String(i),
        name: `${i} hari tersisa`
      });
    }
    
    console.log('📅 Generated', options.length, 'options from API data');
    return options;
  }

  onSisaHariKerjaChange() {
    // Trigger recalculation when sisa hari kerja changes
    if (this.kpiData()) {
      // Force update untuk memicu recalculation di KPI cards
      this.kpiData.set({ ...this.kpiData()! });
    }
  }

  private processAfterSalesData(response: AfterSalesResponse, filter: AfterSalesFilter): KpiData {
    console.log('🔄 Starting data processing...');
    console.log('🔄 Filter received:', filter);

    let filteredData = response.aftersales;

    console.log('📊 Original data count:', filteredData.length);
    console.log('📊 Sample original data:', filteredData.slice(0, 2));

    // Filter by month if specific month selected
    if (filter.month && filter.month !== 'all-month') {
      console.log('🔍 Filtering by month. Filter month:', filter.month, '(type:', typeof filter.month, ')');

      // Show months in original data
      const originalMonths = [...new Set(filteredData.map(item => item.month))];
      console.log('📅 Available months in data:', originalMonths);

      // FIX: Convert filter month "01" to "1" to match API format
      const normalizedFilterMonth = parseInt(filter.month).toString();
      console.log('🔧 Normalized filter month:', normalizedFilterMonth);

      filteredData = filteredData.filter(item => {
        const itemMonth = item.month;
        const matches = itemMonth === normalizedFilterMonth;

        console.log(`🔍 Comparing: data="${itemMonth}" vs normalized="${normalizedFilterMonth}" → ${matches ? '✅' : '❌'}`);
        return matches;
      });

      console.log('📊 After month filter:', filteredData.length, 'items for month', normalizedFilterMonth);
      console.log('📊 Filtered data sample:', filteredData.slice(0, 1));
    }

    // Filter by cabang if specific cabang selected
    if (filter.cabang && filter.cabang !== 'all-cabang') {
      console.log('🔍 Filtering by cabang:', filter.cabang);

      // Show cabang in original data before filtering
      const originalCabangs = [...new Set(filteredData.map(item => item.cabang_id))];
      console.log('🏢 Available cabangs in filtered data:', originalCabangs);

      filteredData = filteredData.filter(item => {
        const matches = item.cabang_id === filter.cabang;
        console.log(`🏢 Comparing: data="${item.cabang_id}" vs filter="${filter.cabang}" → ${matches ? '✅' : '❌'}`);
        return matches;
      });

      console.log('📊 After cabang filter:', filteredData.length, 'items for cabang', filter.cabang);
    }

    console.log('📊 Final filtered data count:', filteredData.length);
    console.log('📊 Final filtered data:', filteredData);

    if (filteredData.length === 0) {
      console.warn('⚠️ No data after filtering! Check filter criteria vs API data format.');
    }

    return this.calculateKpiMetrics(filteredData);
  }

  private calculateKpiMetrics(data: AfterSalesItem[]): KpiData {
    console.log('Calculating KPI for data:', data);

    // Calculate After Sales KPI
    const afterSales = {
      realisasi: this.sumField(data, 'total_revenue_realisasi'),
      target: this.sumField(data, 'total_revenue_target')
    };

    // Calculate Service Cabang KPI (After Sales - Sparepart Tunai)
    const serviceCabang = {
      realisasi: this.sumField(data, 'total_revenue_realisasi') - this.sumField(data, 'part_tunai_realisasi'),
      target: this.sumField(data, 'total_revenue_target') - this.sumField(data, 'part_tunai_target')
    };

    // Calculate Unit Entry KPI
    const unitEntry = {
      realisasi: this.sumField(data, 'unit_entry_realisasi'),
      target: this.sumField(data, 'unit_entry_target')
    };

    // Calculate Sparepart Tunai KPI
    const sparepartTunai = {
      realisasi: this.sumField(data, 'part_tunai_realisasi'),
      target: this.sumField(data, 'part_tunai_target')
    };

    // Total unit entry for rata-rata calculation
    const totalUnitEntry = unitEntry.realisasi;

    const result = {
      afterSales,
      serviceCabang,
      unitEntry,
      sparepartTunai,
      totalUnitEntry
    };

    console.log('Calculated KPI metrics:', result);
    return result;
  }

  private sumField(data: AfterSalesItem[], field: keyof AfterSalesItem): number {
    const sum = data.reduce((total, item) => {
      const value = Number(item[field]) || 0;
      return total + value;
    }, 0);
    console.log(`Sum of ${field}:`, sum);
    return sum;
  }

  // Helper method to get sisa hari kerja for KPI cards
  getSisaHariKerja(): number | undefined {
    return this.sisaHariKerja ? Number(this.sisaHariKerja) : undefined;
  }

  // Helper method to get unit entry for rata-rata calculation
  getTotalUnitEntry(): number {
    return this.kpiData()?.totalUnitEntry || 0;
  }
}