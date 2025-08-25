// src/app/shared/components/finance-transactions-table/finance-transactions-table.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule} from '@angular/common';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';

export interface FinanceTxn {
  tanggal: Date;
  perusahaan: string;
  cabang: string;
  kategori: string;
  keterangan: string;
  pemasukan: number;   // dalam Rupiah
  pengeluaran: number; // dalam Rupiah
  saldo?: number;      // akan dihitung otomatis (running balance)
}

@Component({
  selector: 'app-finance-transactions-table',
  standalone: true,
  imports: [CommonModule, TableModule, PaginatorModule],
  templateUrl: './finance-transactions-table.component.html',
  styleUrls: ['./finance-transactions-table.component.css'],
})
export class FinanceTransactionsTableComponent implements OnChanges {

  @Input() data: FinanceTxn[] | null = null;
  @Input() openingBalance = 0;
  rows: FinanceTxn[] = [];

  /** Dummy data jika parent tidak mengirim data */
  private readonly dummyData: FinanceTxn[] = [
  // === 2025 JANUARI ===
  { tanggal: new Date(2025, 0,  5), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Pemasukan',   keterangan: 'Penjualan Januari',      pemasukan: 12_000_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 0, 10), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Gaji',        keterangan: 'Gaji Karyawan',         pemasukan: 0,          pengeluaran: 8_000_000 },
  { tanggal: new Date(2025, 0, 18), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Sewa',        keterangan: 'Sewa Gedung',           pemasukan: 0,          pengeluaran: 3_500_000 },

  // === 2025 FEBRUARI ===
  { tanggal: new Date(2025, 1,  2), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Pemasukan',   keterangan: 'Penjualan Februari',     pemasukan: 13_500_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 1, 12), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Marketing',   keterangan: 'Iklan Sosmed',           pemasukan: 0,          pengeluaran: 2_000_000 },

  // === 2025 MARET ===
  { tanggal: new Date(2025, 2,  3), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Pemasukan',   keterangan: 'Penjualan Maret',        pemasukan: 12_800_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 2, 15), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Maintenance', keterangan: 'Service AC',             pemasukan: 0,          pengeluaran: 1_200_000 },
  { tanggal: new Date(2025, 2, 26), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Utilitas',    keterangan: 'Listrik & Air',          pemasukan: 0,          pengeluaran: 900_000 },

  // === 2025 APRIL ===
  { tanggal: new Date(2025, 3,  6), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Pemasukan',   keterangan: 'Penjualan April',        pemasukan: 14_200_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 3, 20), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Gaji',        keterangan: 'Gaji Karyawan',          pemasukan: 0,          pengeluaran: 8_200_000 },

  // === 2025 MEI ===
  { tanggal: new Date(2025, 4,  1), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Pemasukan',   keterangan: 'Penjualan Mei',          pemasukan: 15_000_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 4, 14), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Lain-lain',   keterangan: 'Keperluan Operasional',  pemasukan: 0,          pengeluaran: 1_000_000 },

  // === 2025 JUNI ===
  { tanggal: new Date(2025, 5,  4), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Pemasukan',   keterangan: 'Penjualan Juni',         pemasukan: 15_800_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 5, 12), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Gaji',        keterangan: 'Gaji Karyawan',          pemasukan: 0,          pengeluaran: 8_100_000 },
  { tanggal: new Date(2025, 5, 25), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Utilitas',    keterangan: 'Listrik & Air',          pemasukan: 0,          pengeluaran:   950_000 },

  // === 2025 JULI ===
  { tanggal: new Date(2025, 6,  3), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Pemasukan',   keterangan: 'Penjualan Juli',         pemasukan: 16_500_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 6, 11), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Marketing',   keterangan: 'Iklan Digital',          pemasukan: 0,          pengeluaran: 2_200_000 },
  { tanggal: new Date(2025, 6, 22), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Maintenance', keterangan: 'Perawatan Mesin',         pemasukan: 0,          pengeluaran: 1_300_000 },

  // === 2025 AGUSTUS ===
  { tanggal: new Date(2025, 7,  5), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Pemasukan',   keterangan: 'Penjualan Agustus',      pemasukan: 16_800_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 7, 18), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Gaji',        keterangan: 'Gaji Karyawan',          pemasukan: 0,          pengeluaran: 8_300_000 },
  { tanggal: new Date(2025, 7, 28), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Sewa',        keterangan: 'Sewa Gudang',            pemasukan: 0,          pengeluaran: 3_600_000 },

  // === 2025 SEPTEMBER ===
  { tanggal: new Date(2025, 8,  2), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Pemasukan',   keterangan: 'Penjualan September',    pemasukan: 17_200_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 8, 14), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Utilitas',    keterangan: 'Listrik & Air',          pemasukan: 0,          pengeluaran:   980_000 },
  { tanggal: new Date(2025, 8, 25), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Lain-lain',   keterangan: 'Keperluan Operasional',  pemasukan: 0,          pengeluaran: 1_100_000 },

  // === 2025 OKTOBER ===
  { tanggal: new Date(2025, 9,  7), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Pemasukan',   keterangan: 'Penjualan Oktober',      pemasukan: 17_900_000, pengeluaran: 0 },
  { tanggal: new Date(2025, 9, 19), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Gaji',        keterangan: 'Gaji Karyawan',          pemasukan: 0,          pengeluaran: 8_400_000 },
  { tanggal: new Date(2025, 9, 30), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Marketing',   keterangan: 'Kampanye Iklan',         pemasukan: 0,          pengeluaran: 2_300_000 },

  // === 2025 NOVEMBER ===
  { tanggal: new Date(2025,10,  4), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Pemasukan',   keterangan: 'Penjualan November',     pemasukan: 18_500_000, pengeluaran: 0 },
  { tanggal: new Date(2025,10, 15), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Maintenance', keterangan: 'Perawatan Peralatan',    pemasukan: 0,          pengeluaran: 1_400_000 },
  { tanggal: new Date(2025,10, 26), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Utilitas',    keterangan: 'Listrik & Air',          pemasukan: 0,          pengeluaran: 1_000_000 },

  // === 2025 DESEMBER ===
  { tanggal: new Date(2025,11,  6), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Pemasukan',   keterangan: 'Penjualan Desember',     pemasukan: 19_200_000, pengeluaran: 0 },
  { tanggal: new Date(2025,11, 17), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Gaji',        keterangan: 'Gaji Karyawan',          pemasukan: 0,          pengeluaran: 8_500_000 },
  { tanggal: new Date(2025,11, 27), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Lain-lain',   keterangan: 'Biaya Penutup Tahun',    pemasukan: 0,          pengeluaran: 1_200_000 },

  // === 2026 JANUARI ===
  { tanggal: new Date(2026, 0,  5), perusahaan: 'PT SGM', cabang: 'Makassar', kategori: 'Pemasukan',   keterangan: 'Penjualan Januari 2026', pemasukan: 20_000_000, pengeluaran: 0 },
  { tanggal: new Date(2026, 0, 12), perusahaan: 'PT SGM', cabang: 'Gowa',     kategori: 'Sewa',        keterangan: 'Sewa Gedung',            pemasukan: 0,          pengeluaran: 3_800_000 },
  { tanggal: new Date(2026, 0, 22), perusahaan: 'PT SGM', cabang: 'Maros',    kategori: 'Marketing',   keterangan: 'Promosi Awal Tahun',     pemasukan: 0,          pengeluaran: 2_400_000 },
];


  ngOnInit(): void {
    this.recompute(); // ✅ pastikan rows terisi saat komponen pertama kali dibuat
  }

  ngOnChanges(_: SimpleChanges): void {
    this.recompute(); // ✅ isi ulang saat input berubah
  }

  private recompute(): void {
    const source = (this.data && this.data.length) ? this.data : this.dummyData;
    const sorted = [...source].sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
    let saldo = this.openingBalance;
    this.rows = sorted.map(r => {
      saldo = saldo + (r.pemasukan || 0) - (r.pengeluaran || 0);
      return { ...r, saldo };
    });
  }
}
