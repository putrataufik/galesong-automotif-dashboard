import { DashboardApiResponse, FilterParams } from '../models/dashboard.model';

// Mock data untuk berbagai filter kombinasi
export const MOCK_DASHBOARD_DATA: Record<string, DashboardApiResponse> = {
  
  // Default: Semua Cabang, Semua Kategori
  'COMP001-ALL-ALL-2025': {
    status: "success",
    message: "Data dashboard berhasil diambil",
    data: {
      filterInfo: {
        companyId: "COMP001",
        companyName: "PT. Sinar Galesong Mobilindo",
        branchId: "ALL",
        branchName: "Semua Cabang",
        category: "ALL",
        year: 2025
      },
      kpi: {
        salesMetrics: {
          totalUnitsSold: 1250,
          salesRevenue: 32000000000
        },
        afterSalesMetrics: {
          totalTransactions: 3200,
          afterSalesRevenue: 5500000000
        },
        financialMetrics: {
          totalRevenue: 37500000000,
          totalExpenditure: 19000000000,
          netProfitLoss: 18500000000
        },
        performanceMetrics: {
          topPerformingBranch: {
            branchId: "BR001",
            branchName: "Hyundai Pettarani, Makassar",
            revenue: 15200000000
          }
        }
      }
    }
  },

  // Filter: Cabang Pettarani, Semua Kategori
  'COMP001-BR001-ALL-2025': {
    status: "success",
    message: "Data dashboard berhasil diambil",
    data: {
      filterInfo: {
        companyId: "COMP001",
        companyName: "PT. Sinar Galesong Mobilindo",
        branchId: "BR001",
        branchName: "Hyundai Pettarani",
        category: "ALL",
        year: 2025
      },
      kpi: {
        salesMetrics: {
          totalUnitsSold: 520,
          salesRevenue: 15200000000
        },
        afterSalesMetrics: {
          totalTransactions: 1450,
          afterSalesRevenue: 2800000000
        },
        financialMetrics: {
          totalRevenue: 18000000000,
          totalExpenditure: 9500000000,
          netProfitLoss: 8500000000
        },
        performanceMetrics: {
          topPerformingBranch: {
            branchId: "BR001",
            branchName: "Hyundai Pettarani, Makassar",
            revenue: 15200000000
          }
        }
      }
    }
  },

  // Filter: Cabang Gorontalo, Semua Kategori
  'COMP001-BR002-ALL-2025': {
    status: "success",
    message: "Data dashboard berhasil diambil",
    data: {
      filterInfo: {
        companyId: "COMP001",
        companyName: "PT. Sinar Galesong Mobilindo",
        branchId: "BR002",
        branchName: "Hyundai Gorontalo",
        category: "ALL",
        year: 2025
      },
      kpi: {
        salesMetrics: {
          totalUnitsSold: 381,
          salesRevenue: 9800000000
        },
        afterSalesMetrics: {
          totalTransactions: 980,
          afterSalesRevenue: 1700000000
        },
        financialMetrics: {
          totalRevenue: 11500000000,
          totalExpenditure: 6200000000,
          netProfitLoss: 5300000000
        },
        performanceMetrics: {
          topPerformingBranch: {
            branchId: "BR002",
            branchName: "Hyundai Gorontalo",
            revenue: 9800000000
          }
        }
      }
    }
  },

  // Filter: Semua Cabang, Kategori Sales Only
  'COMP001-ALL-SALES-2025': {
    status: "success",
    message: "Data dashboard berhasil diambil",
    data: {
      filterInfo: {
        companyId: "COMP001",
        companyName: "PT. Sinar Galesong Mobilindo",
        branchId: null,
        branchName: "Semua Cabang",
        category: "SALES",
        year: 2025
      },
      kpi: {
        salesMetrics: {
          totalUnitsSold: 1250,
          salesRevenue: 32000000000
        },
        afterSalesMetrics: {
          totalTransactions: 0,
          afterSalesRevenue: 0
        },
        financialMetrics: {
          totalRevenue: 32000000000,
          totalExpenditure: 14500000000,
          netProfitLoss: 17500000000
        },
        performanceMetrics: {
          topPerformingBranch: {
            branchId: "BR001",
            branchName: "Hyundai Pettarani, Makassar",
            revenue: 15200000000
          }
        }
      }
    }
  },

  // Filter: Semua Cabang, Kategori After Sales Only
  'COMP001-ALL-AFTERSALES-2025': {
    status: "success",
    message: "Data dashboard berhasil diambil",
    data: {
      filterInfo: {
        companyId: "COMP001",
        companyName: "PT. Sinar Galesong Mobilindo",
        branchId: null,
        branchName: "Semua Cabang",
        category: "AFTERSALES",
        year: 2025
      },
      kpi: {
        salesMetrics: {
          totalUnitsSold: 0,
          salesRevenue: 0
        },
        afterSalesMetrics: {
          totalTransactions: 3200,
          afterSalesRevenue: 5500000000
        },
        financialMetrics: {
          totalRevenue: 5500000000,
          totalExpenditure: 4500000000,
          netProfitLoss: 1000000000
        },
        performanceMetrics: {
          topPerformingBranch: {
            branchId: "BR001",
            branchName: "Hyundai Pettarani, Makassar",
            revenue: 2800000000
          }
        }
      }
    }
  }
};

// Master data untuk dropdown options
export const FILTER_OPTIONS = {
  companies: [
    { id: 'COMP001', name: 'PT. Sinar Galesong Mobilindo' },
    { id: 'COMP002', name: 'PT. Sinar Galesong MG' }
  ],
  branches: [
    { id: 'ALL', name: 'Semua Cabang' },
    { id: 'BR001', name: 'Hyundai Pettarani' },
    { id: 'BR002', name: 'Hyundai Gorontalo' },
    { id: 'BR003', name: 'Hyundai Kendari' }
  ],
  categories: [
    { id: 'ALL', name: 'Semua Kategori' },
    { id: 'SALES', name: 'Sales' },
    { id: 'AFTERSALES', name: 'After Sales' }
  ],
  years: [2023, 2024, 2025]
};

// Helper function untuk generate cache key
export function generateCacheKey(filter: FilterParams): string {
  const branchId = filter.branchId || 'ALL';
  return `${filter.companyId}-${branchId}-${filter.category}-${filter.year}`;
}

// Helper function untuk get mock data berdasarkan filter
export function getMockData(filter: FilterParams): DashboardApiResponse {
  const key = generateCacheKey(filter);
  const data = MOCK_DASHBOARD_DATA[key];

  if (data) {
    return data;
  }

  // Return a 'not found' response if no data matches the key
  return {
    status: 'error',
    message: 'Data untuk filter yang dipilih tidak tersedia.',
    data: null
  }as unknown as DashboardApiResponse;
}