import { Injectable } from '@angular/core';
import { InMemoryDbService, RequestInfo } from 'angular-in-memory-web-api';

// Interface untuk tipe item KPI Card
interface KpiCard {
  title: string;
  value: string | number;
  unit: string;
  icon: string;
  bgColor: string;
}

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  // Data perusahaan & branch
  private companies = [
    {
      company: 'sinar-galesong-mandiri',
      branches: [
        'suzuki-urip-sumoharjo',
        'suzuki-yos-sudarso',
        'suzuki-aeropala',
        'suzuki-gowa',
      ],
    },
    {
      company: 'sinar-galesong-prima',
      branches: ['cabang-bitung', 'cabang-manado', 'cabang-kotamobagu'],
    },
    {
      company: 'sinar-galesong-automobil',
      branches: ['mg-pettarani', 'mg-kairagi'],
    },
    {
      company: 'sinar-galesong-mobilindo',
      branches: [
        'hyundaipettarani',
        'hyundai-gorontalo',
        'hyundai-palu',
        'hyundai-kendari',
        'hyundai-palopo',
        'hyundai-sungguminasa',
      ],
    },
  ];

  // Akan diisi otomatis di constructor
  private kpiData: any[] = [];

  constructor() {
    // Generate data dummy otomatis
    const categories = ['sales', 'after-sales'];

    this.companies.forEach((comp) => {
      comp.branches.forEach((branch) => {
        categories.forEach((cat) => {
          this.kpiData.push({
            company: comp.company,
            branch: branch,
            category: cat,
            kpis: this.generateKpi(cat, branch),
          });
        });
      });
    });
  }

  createDb() {
    return { kpi: this.kpiData };
  }

  // Generate nilai KPI berdasarkan kategori dan branch
  private generateKpi(category: string, branch: string) {
    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      totalSales: category === 'sales' ? rand(100, 2000) : 0,
      totalAfterSales: category === 'after-sales' ? rand(50, 1000) : 0,
      totalPendapatan: rand(5, 40) * 1_000_000_000,
      totalPengeluaran: rand(2, 20) * 1_000_000_000,
      topSalesBranch: category === 'sales' ? branch : '',
      topAfterSalesBranch: category === 'after-sales' ? branch : '',
      totalOmzetSales: category === 'sales' ? rand(2, 20) * 1_000_000_000 : 0,
      totalOmzetAfterSales:
        category === 'after-sales' ? rand(2, 10) * 1_000_000_000 : 0,
    };
  }

  get(reqInfo: RequestInfo) {
    if (reqInfo.collectionName === 'kpi') {
      const company = reqInfo.query.get('company')?.[0];
      const branch = reqInfo.query.get('branch')?.[0];
      const category = reqInfo.query.get('category')?.[0];

      let data = this.kpiData.filter((item) => item.company === company);

      // Filter branch jika bukan all-branch
      if (branch && branch !== 'all-branch') {
        data = data.filter((item) => item.branch === branch);
      }

      // Filter category jika bukan all-category
      if (category && category !== 'all-category') {
        data = data.filter((item) => item.category === category);
      }

      // Gabungkan data KPI
      const combinedKpi = {
        totalSales: data.reduce((sum, d) => sum + d.kpis.totalSales, 0),
        totalAfterSales: data.reduce((sum, d) => sum + d.kpis.totalAfterSales, 0),
        totalPendapatan: data.reduce((sum, d) => sum + d.kpis.totalPendapatan, 0),
        totalPengeluaran: data.reduce((sum, d) => sum + d.kpis.totalPengeluaran, 0),
        topSalesBranch: data.find((d) => d.kpis.topSalesBranch)?.kpis.topSalesBranch || '',
        topAfterSalesBranch: data.find((d) => d.kpis.topAfterSalesBranch)?.kpis.topAfterSalesBranch || '',
        totalOmzetSales: data.reduce((sum, d) => sum + d.kpis.totalOmzetSales, 0),
        totalOmzetAfterSales: data.reduce((sum, d) => sum + d.kpis.totalOmzetAfterSales, 0),
      };

      // Buat array KPI Cards sesuai filter
      const kpiCards: KpiCard[] = [];

      // KPI Sales (tampil jika category bukan after-sales)
      if (category !== 'after-sales') {
        kpiCards.push({
          title: 'Total Sales',
          value: combinedKpi.totalSales,
          unit: 'unit',
          icon: 'icons/sales.png',
          bgColor: '#BFE8FF',
        });
        kpiCards.push({
          title: 'Total Omzet Sales',
          value: `Rp. ${(combinedKpi.totalOmzetSales / 1_000_000_000).toFixed(1)} M`,
          unit: '',
          icon: 'icons/omzet-sales.png',
          bgColor: '#C1CED8',
        });
      }

      // KPI After Sales (tampil jika category bukan sales)
      if (category !== 'sales') {
        kpiCards.push({
          title: 'Total After Sales',
          value: combinedKpi.totalAfterSales,
          unit: '',
          icon: 'icons/after-sales.png',
          bgColor: '#BFD1FF',
        });
        kpiCards.push({
          title: 'Total Omzet After Sales',
          value: `Rp. ${(combinedKpi.totalOmzetAfterSales / 1_000_000_000).toFixed(1)} M`,
          unit: '',
          icon: 'icons/omzet-after-sales.png',
          bgColor: '#C3FFBF',
        });
      }

      // KPI yang hanya muncul untuk filter all-branch
      if (branch === 'all-branch') {
        if (category !== 'after-sales') {
          kpiCards.push({
            title: 'Cabang dengan Sales Tertinggi',
            value: combinedKpi.topSalesBranch,
            unit: '',
            icon: 'icons/top-sales.png',
            bgColor: '#F4E9BF',
          });
        }
        if (category !== 'sales') {
          kpiCards.push({
            title: 'Cabang dengan After Sales Terbaik',
            value: combinedKpi.topAfterSalesBranch,
            unit: '',
            icon: 'icons/top-after-sales.png',
            bgColor: '#F4E9BF',
          });
        }
      }

      // KPI umum (Pendapatan & Pengeluaran)
      kpiCards.push({
        title: 'Total Pendapatan',
        value: `Rp. ${(combinedKpi.totalPendapatan / 1_000_000_000).toFixed(1)} M`,
        unit: '',
        icon: 'icons/revenue.png',
        bgColor: '#C3FFBF',
      });
      kpiCards.push({
        title: 'Total Pengeluaran',
        value: `Rp. ${(combinedKpi.totalPengeluaran / 1_000_000_000).toFixed(1)} M`,
        unit: '',
        icon: 'icons/expense.png',
        bgColor: '#FFBFBF',
      }); 

      return reqInfo.utils.createResponse$(() => ({
        body: kpiCards,
        status: 200,
      }));
    }

    return undefined;
  }
}
