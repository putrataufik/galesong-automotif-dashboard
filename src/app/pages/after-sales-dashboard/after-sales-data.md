# Data Requirement After Sales

## Request Parameters

| Parameter | Type | Required | Description | Example | Default | Validation |
|-----------|------|----------|-------------|---------|---------|------------|
| `branchId` | string | ✅ Yes | ID cabang spesifik | "0050" | null (semua cabang) | Must exist in branch master for selected company |
| `year` | number | ✅ Yes | Tahun data yang ingin diambil | 2025 | - | Format: YYYY, range: 2020-current year |
| `month` | number | ❌ No | Bulan spesifik (1-12) | 9 | null (semua bulan) | Range: 1-12 |
| `compare` | boolean | ✅ Yes | Flag untuk menampilkan data komparasi | true | false | Boolean value |
| `useCustomDate` | Boolean | No |Flag penggunaan custom date (default: false) | true, false|
| `selectedDate` | String | Conditional | Tanggal spesifik YYYY-MM-DD (required jika useCustomDate=true) | "2025-08-15"| false | Format YYYY-MM-DD

## Response Examples

### When `comparison = true` & `useCustomDate = true`

```json
{
  "request": {
    "companyName": "PT. SINARGALESONG MOBILINDO",
    "branchId": "0050",
    "year": null,
    "month": null,
    "compare": true,
    "useCustomDate": "true",
    "selectedDate": "2025-08-15",

  },
  "kpi_data": {
    "selected": {
      "mekanik": 2,
      "hari_kerja": 25,
      "biaya_usaha": 94784828.0,
      "profit": 37454742.0,
      "after_sales_realisasi": 192610030.06,
      "after_sales_target": 320413000,
      "unit_entry_realisasi": 168,
      "unit_entry_target": 183,
      "jasa_service_realisasi": 47117060.0,
      "jasa_service_target": 91547000,
      "unit_entry_oli_realisasi": 2,
      "unit_entry_express_realisasi": 117,
      "unit_entry_rutin_realisasi": 31,
      "unit_entry_sedang_realisasi": 11,
      "unit_entry_berat_realisasi": 7,
      "unit_entry_overhoul_realisasi": 0,
      "unit_entry_claim_realisasi": 0,
      "unit_entry_kelistrikan_realisasi": 0,
      "unit_entry_kupon_realisasi": 105,
      "unit_entry_over_size_realisasi": 0,
      "unit_entry_pdc_realisasi": 0,
      "unit_entry_cvt_realisasi": 0,
      "unit_entry_body_repair_realisasi": 0,
      "jasa_service_oli_realisasi": 293240.0,
      "jasa_service_express_realisasi": 21902130.0,
      "jasa_service_rutin_realisasi": 11234000.0,
      "jasa_service_sedang_realisasi": 6209610.0,
      "jasa_service_berat_realisasi": 7478080.0,
      "jasa_service_overhoul_realisasi": 0.0,
      "jasa_service_claim_realisasi": 0.0,
      "jasa_service_kelistrikan_realisasi": 0.0,
      "jasa_service_kupon_realisasi": 24582060.0,
      "jasa_service_over_size_realisasi": 0.0,
      "jasa_service_pdc_realisasi": 0.0,
      "jasa_service_cvt_realisasi": 0.0,
      "jasa_service_body_repair_realisasi": 0.0,
      "part_bengkel_realisasi": 97837562.06,
      "part_bengkel_target": 169361000,
      "part_bengkel_oli_realisasi": 219580.2,
      "part_bengkel_express_realisasi": 42873279.4,
      "part_bengkel_rutin_realisasi": 10772293.66,
      "part_bengkel_sedang_realisasi": 7140905.0,
      "part_bengkel_berat_realisasi": 36831503.8,
      "part_bengkel_overhoul_realisasi": 0.0,
      "part_tunai_realisasi": 28236319.0,
      "part_tunai_target": 49485000,
      "total_revenue_realisasi": 220846349.06,
      "total_revenue_target": 369898000
    },
    "comparisons": {
      "prevDate": {
        "period": "2025-08-14",
        "metrics": {
          "mekanik": 2,
          "hari_kerja": 25,
          "biaya_usaha": 94784828.0,
          "profit": 37454742.0,
          "after_sales_realisasi": 192610030.06,
          "after_sales_target": 320413000,
          "unit_entry_realisasi": 168,
          "unit_entry_target": 183,
          "jasa_service_realisasi": 47117060.0,
          "jasa_service_target": 91547000,
          "unit_entry_oli_realisasi": 2,
          "unit_entry_express_realisasi": 117,
          "unit_entry_rutin_realisasi": 31,
          "unit_entry_sedang_realisasi": 11,
          "unit_entry_berat_realisasi": 7,
          "unit_entry_overhoul_realisasi": 0,
          "unit_entry_claim_realisasi": 0,
          "unit_entry_kelistrikan_realisasi": 0,
          "unit_entry_kupon_realisasi": 105,
          "unit_entry_over_size_realisasi": 0,
          "unit_entry_pdc_realisasi": 0,
          "unit_entry_cvt_realisasi": 0,
          "unit_entry_body_repair_realisasi": 0,
          "jasa_service_oli_realisasi": 293240.0,
          "jasa_service_express_realisasi": 21902130.0,
          "jasa_service_rutin_realisasi": 11234000.0,
          "jasa_service_sedang_realisasi": 6209610.0,
          "jasa_service_berat_realisasi": 7478080.0,
          "jasa_service_overhoul_realisasi": 0.0,
          "jasa_service_claim_realisasi": 0.0,
          "jasa_service_kelistrikan_realisasi": 0.0,
          "jasa_service_kupon_realisasi": 24582060.0,
          "jasa_service_over_size_realisasi": 0.0,
          "jasa_service_pdc_realisasi": 0.0,
          "jasa_service_cvt_realisasi": 0.0,
          "jasa_service_body_repair_realisasi": 0.0,
          "part_bengkel_realisasi": 97837562.06,
          "part_bengkel_target": 169361000,
          "part_bengkel_oli_realisasi": 219580.2,
          "part_bengkel_express_realisasi": 42873279.4,
          "part_bengkel_rutin_realisasi": 10772293.66,
          "part_bengkel_sedang_realisasi": 7140905.0,
          "part_bengkel_berat_realisasi": 36831503.8,
          "part_bengkel_overhoul_realisasi": 0.0,
          "part_tunai_realisasi": 28236319.0,
          "part_tunai_target": 49485000,
          "total_revenue_realisasi": 220846349.06,
          "total_revenue_target": 369898000
        }
      },
      "prevMonth": {
        "period": "2025-07-15",
        "metrics": {
          "mekanik": 2,
          "hari_kerja": 25,
          "biaya_usaha": 94784828.0,
          "profit": 37454742.0,
          "after_sales_realisasi": 192610030.06,
          "after_sales_target": 320413000,
          "unit_entry_realisasi": 168,
          "unit_entry_target": 183,
          "jasa_service_realisasi": 47117060.0,
          "jasa_service_target": 91547000,
          "unit_entry_oli_realisasi": 2,
          "unit_entry_express_realisasi": 117,
          "unit_entry_rutin_realisasi": 31,
          "unit_entry_sedang_realisasi": 11,
          "unit_entry_berat_realisasi": 7,
          "unit_entry_overhoul_realisasi": 0,
          "unit_entry_claim_realisasi": 0,
          "unit_entry_kelistrikan_realisasi": 0,
          "unit_entry_kupon_realisasi": 105,
          "unit_entry_over_size_realisasi": 0,
          "unit_entry_pdc_realisasi": 0,
          "unit_entry_cvt_realisasi": 0,
          "unit_entry_body_repair_realisasi": 0,
          "jasa_service_oli_realisasi": 293240.0,
          "jasa_service_express_realisasi": 21902130.0,
          "jasa_service_rutin_realisasi": 11234000.0,
          "jasa_service_sedang_realisasi": 6209610.0,
          "jasa_service_berat_realisasi": 7478080.0,
          "jasa_service_overhoul_realisasi": 0.0,
          "jasa_service_claim_realisasi": 0.0,
          "jasa_service_kelistrikan_realisasi": 0.0,
          "jasa_service_kupon_realisasi": 24582060.0,
          "jasa_service_over_size_realisasi": 0.0,
          "jasa_service_pdc_realisasi": 0.0,
          "jasa_service_cvt_realisasi": 0.0,
          "jasa_service_body_repair_realisasi": 0.0,
          "part_bengkel_realisasi": 97837562.06,
          "part_bengkel_target": 169361000,
          "part_bengkel_oli_realisasi": 219580.2,
          "part_bengkel_express_realisasi": 42873279.4,
          "part_bengkel_rutin_realisasi": 10772293.66,
          "part_bengkel_sedang_realisasi": 7140905.0,
          "part_bengkel_berat_realisasi": 36831503.8,
          "part_bengkel_overhoul_realisasi": 0.0,
          "part_tunai_realisasi": 28236319.0,
          "part_tunai_target": 49485000,
          "total_revenue_realisasi": 220846349.06,
          "total_revenue_target": 369898000
        }
      }
    }
  },
  "sales_monthly_trend": {
    "datasets": [
      {
        "label": "Tahun 2025",
        "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
      },
      {
        "label": "Tahun 2024",
        "data": [95, 88, 92, 105, 98, 115, 125, 140, 135, 128, 142, 155]
      }
    ]
  },
  {
  "proporsi_after_sales": {
    "data": {
      "items": [
        {
          "name": "JASA SERVICE",
          "selected": {
            "period": "2025-08-15",
            "value": 7420000
          },
          "prevDate": {
            "period": "2025-08-14",
            "value": 7420000
          },
          "prevMonth": {
            "period": "2025-07-15",
            "value": 7420000
          }
        },
        {
          "name": "PART TUNAI",
          "selected": {
            "period": "2025-08-15",
            "value": 3560000
          },
          "prevDate": {
            "period": "2025-08-14",
            "value": 2910000
          },
          "prevMonth": {
            "period": "2025-07-15",
            "value": 4780000
          }
        },
        {
          "name": "PART BENGKEL",
          "selected": {
            "period": "2025-08-15",
            "value": 9880000
          },
          "prevDate": {
            "period": "2025-08-14",
            "value": 8450000
          },
          "prevMonth": {
            "period": "2025-07-15",
            "value": 9230000
          }
        },
        {
          "name": "OLI",
          "selected": {
            "period": "2025-08-15",
            "value": 1540000
          },
          "prevDate": {
            "period": "2025-08-14",
            "value": 1200000
          },
          "prevMonth": {
            "period": "2025-07-15",
            "value": 1880000
          }
        }
      ]
    }
  }
}
}
```

### When `comparison = true` & `useCustomDate = true`
```json
  {
  "request": {
    "companyName": "PT. SINARGALESONG MOBILINDO",
    "branchId": "0050",
    "year": 2025,
    "month": 8,
    "compare": true,
    "useCustomDate": "false",
    "selectedDate": null
  },
  "kpi_data": {
    "selected": {
      "mekanik": 2,
      "hari_kerja": 25,
      "biaya_usaha": 94784828.0,
      "profit": 37454742.0,
      "after_sales_realisasi": 192610030.06,
      "after_sales_target": 320413000,
      "unit_entry_realisasi": 168,
      "unit_entry_target": 183,
      "jasa_service_realisasi": 47117060.0,
      "jasa_service_target": 91547000,
      "unit_entry_oli_realisasi": 2,
      "unit_entry_express_realisasi": 117,
      "unit_entry_rutin_realisasi": 31,
      "unit_entry_sedang_realisasi": 11,
      "unit_entry_berat_realisasi": 7,
      "unit_entry_overhoul_realisasi": 0,
      "unit_entry_claim_realisasi": 0,
      "unit_entry_kelistrikan_realisasi": 0,
      "unit_entry_kupon_realisasi": 105,
      "unit_entry_over_size_realisasi": 0,
      "unit_entry_pdc_realisasi": 0,
      "unit_entry_cvt_realisasi": 0,
      "unit_entry_body_repair_realisasi": 0,
      "jasa_service_oli_realisasi": 293240.0,
      "jasa_service_express_realisasi": 21902130.0,
      "jasa_service_rutin_realisasi": 11234000.0,
      "jasa_service_sedang_realisasi": 6209610.0,
      "jasa_service_berat_realisasi": 7478080.0,
      "jasa_service_overhoul_realisasi": 0.0,
      "jasa_service_claim_realisasi": 0.0,
      "jasa_service_kelistrikan_realisasi": 0.0,
      "jasa_service_kupon_realisasi": 24582060.0,
      "jasa_service_over_size_realisasi": 0.0,
      "jasa_service_pdc_realisasi": 0.0,
      "jasa_service_cvt_realisasi": 0.0,
      "jasa_service_body_repair_realisasi": 0.0,
      "part_bengkel_realisasi": 97837562.06,
      "part_bengkel_target": 169361000,
      "part_bengkel_oli_realisasi": 219580.2,
      "part_bengkel_express_realisasi": 42873279.4,
      "part_bengkel_rutin_realisasi": 10772293.66,
      "part_bengkel_sedang_realisasi": 7140905.0,
      "part_bengkel_berat_realisasi": 36831503.8,
      "part_bengkel_overhoul_realisasi": 0.0,
      "part_tunai_realisasi": 28236319.0,
      "part_tunai_target": 49485000,
      "total_revenue_realisasi": 220846349.06,
      "total_revenue_target": 369898000
    },
    "comparisons": {
      "prevMonth": {
        "period": "2025-07",
        "metrics": {
          "mekanik": 2,
          "hari_kerja": 23,
          "biaya_usaha": 89234567.0,
          "profit": 35678923.0,
          "after_sales_realisasi": 185340123.45,
          "after_sales_target": 310234000,
          "unit_entry_realisasi": 155,
          "unit_entry_target": 175,
          "jasa_service_realisasi": 44567890.0,
          "jasa_service_target": 87234000,
          "unit_entry_oli_realisasi": 3,
          "unit_entry_express_realisasi": 110,
          "unit_entry_rutin_realisasi": 28,
          "unit_entry_sedang_realisasi": 9,
          "unit_entry_berat_realisasi": 5,
          "unit_entry_overhoul_realisasi": 0,
          "unit_entry_claim_realisasi": 0,
          "unit_entry_kelistrikan_realisasi": 0,
          "unit_entry_kupon_realisasi": 98,
          "unit_entry_over_size_realisasi": 0,
          "unit_entry_pdc_realisasi": 0,
          "unit_entry_cvt_realisasi": 0,
          "unit_entry_body_repair_realisasi": 0,
          "jasa_service_oli_realisasi": 345670.0,
          "jasa_service_express_realisasi": 20456780.0,
          "jasa_service_rutin_realisasi": 10987654.0,
          "jasa_service_sedang_realisasi": 5678900.0,
          "jasa_service_berat_realisasi": 7098786.0,
          "jasa_service_overhoul_realisasi": 0.0,
          "jasa_service_claim_realisasi": 0.0,
          "jasa_service_kelistrikan_realisasi": 0.0,
          "jasa_service_kupon_realisasi": 23456789.0,
          "jasa_service_over_size_realisasi": 0.0,
          "jasa_service_pdc_realisasi": 0.0,
          "jasa_service_cvt_realisasi": 0.0,
          "jasa_service_body_repair_realisasi": 0.0,
          "part_bengkel_realisasi": 92345678.45,
          "part_bengkel_target": 162345000,
          "part_bengkel_oli_realisasi": 234567.8,
          "part_bengkel_express_realisasi": 40123456.7,
          "part_bengkel_rutin_realisasi": 9876543.21,
          "part_bengkel_sedang_realisasi": 6789012.34,
          "part_bengkel_berat_realisasi": 35321098.4,
          "part_bengkel_overhoul_realisasi": 0.0,
          "part_tunai_realisasi": 26789012.0,
          "part_tunai_target": 47234000,
          "total_revenue_realisasi": 212134690.45,
          "total_revenue_target": 357468000
        }
      },
      "prevYearSameMonth": {
        "period": "2024-08",
        "metrics": {
          "mekanik": 2,
          "hari_kerja": 26,
          "biaya_usaha": 87234567.0,
          "profit": 32123456.0,
          "after_sales_realisasi": 178234567.89,
          "after_sales_target": 298765000,
          "unit_entry_realisasi": 145,
          "unit_entry_target": 165,
          "jasa_service_realisasi": 41234567.0,
          "jasa_service_target": 82345000,
          "unit_entry_oli_realisasi": 4,
          "unit_entry_express_realisasi": 102,
          "unit_entry_rutin_realisasi": 25,
          "unit_entry_sedang_realisasi": 8,
          "unit_entry_berat_realisasi": 6,
          "unit_entry_overhoul_realisasi": 0,
          "unit_entry_claim_realisasi": 0,
          "unit_entry_kelistrikan_realisasi": 0,
          "unit_entry_kupon_realisasi": 89,
          "unit_entry_over_size_realisasi": 0,
          "unit_entry_pdc_realisasi": 0,
          "unit_entry_cvt_realisasi": 0,
          "unit_entry_body_repair_realisasi": 0,
          "jasa_service_oli_realisasi": 456789.0,
          "jasa_service_express_realisasi": 19876543.0,
          "jasa_service_rutin_realisasi": 9876543.0,
          "jasa_service_sedang_realisasi": 4567890.0,
          "jasa_service_berat_realisasi": 6456802.0,
          "jasa_service_overhoul_realisasi": 0.0,
          "jasa_service_claim_realisasi": 0.0,
          "jasa_service_kelistrikan_realisasi": 0.0,
          "jasa_service_kupon_realisasi": 21234567.0,
          "jasa_service_over_size_realisasi": 0.0,
          "jasa_service_pdc_realisasi": 0.0,
          "jasa_service_cvt_realisasi": 0.0,
          "jasa_service_body_repair_realisasi": 0.0,
          "part_bengkel_realisasi": 89876543.89,
          "part_bengkel_target": 154321000,
          "part_bengkel_oli_realisasi": 198765.4,
          "part_bengkel_express_realisasi": 38765432.1,
          "part_bengkel_rutin_realisasi": 8765432.10,
          "part_bengkel_sedang_realisasi": 5432109.87,
          "part_bengkel_berat_realisasi": 36814804.42,
          "part_bengkel_overhoul_realisasi": 0.0,
          "part_tunai_realisasi": 24567890.0,
          "part_tunai_target": 44444000,
          "total_revenue_realisasi": 201802457.89,
          "total_revenue_target": 337110000
        }
      }
    }
  },
  "sales_monthly_trend": {
    "datasets": [
      {
        "label": "Tahun 2025",
        "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
      },
      {
        "label": "Tahun 2024",
        "data": [95, 88, 92, 105, 98, 115, 125, 140, 135, 128, 142, 155]
      }
    ]
  },
  "proporsi_after_sales": {
    "data": {
      "items": [
        {
          "name": "JASA SERVICE",
          "selected": {
            "period": "2025-08",
            "value": 7420000
          },
          "prevMonth": {
            "period": "2025-07",
            "value": 6890000
          },
          "prevYearSameMonth": {
            "period": "2024-08",
            "value": 6234000
          }
        },
        {
          "name": "PART TUNAI",
          "selected": {
            "period": "2025-08",
            "value": 3560000
          },
          "prevMonth": {
            "period": "2025-07",
            "value": 3210000
          },
          "prevYearSameMonth": {
            "period": "2024-08",
            "value": 2987000
          }
        },
        {
          "name": "PART BENGKEL",
          "selected": {
            "period": "2025-08",
            "value": 9880000
          },
          "prevMonth": {
            "period": "2025-07",
            "value": 9345000
          },
          "prevYearSameMonth": {
            "period": "2024-08",
            "value": 8876000
          }
        },
        {
          "name": "OLI",
          "selected": {
            "period": "2025-08",
            "value": 1540000
          },
          "prevMonth": {
            "period": "2025-07",
            "value": 1430000
          },
          "prevYearSameMonth": {
            "period": "2024-08",
            "value": 1299000
          }
        }
      ]
    }
  }
}
```



### When `comparison = false` & `useCustomDate = true`

```json
{
  "request": {
    "companyId": "sinar-galesong-mobilindo",
    "branchId": "all-branch",
    "useCustomDate": false,
    "compare": true,
    "year": "2025",
    "month": "8",
    "selectedDate": null
  },
  "kpi_data": {
    "selected": {
      "mekanik": 2,
      "hari_kerja": 25,
      "biaya_usaha": 94784828.0,
      "profit": 37454742.0,
      "after_sales_realisasi": 192610030.06,
      "after_sales_target": 320413000,
      "unit_entry_realisasi": 168,
      "unit_entry_target": 183,
      "jasa_service_realisasi": 47117060.0,
      "jasa_service_target": 91547000,
      "unit_entry_oli_realisasi": 2,
      "unit_entry_express_realisasi": 117,
      "unit_entry_rutin_realisasi": 31,
      "unit_entry_sedang_realisasi": 11,
      "unit_entry_berat_realisasi": 7,
      "unit_entry_overhoul_realisasi": 0,
      "unit_entry_claim_realisasi": 0,
      "unit_entry_kelistrikan_realisasi": 0,
      "unit_entry_kupon_realisasi": 105,
      "unit_entry_over_size_realisasi": 0,
      "unit_entry_pdc_realisasi": 0,
      "unit_entry_cvt_realisasi": 0,
      "unit_entry_body_repair_realisasi": 0,
      "jasa_service_oli_realisasi": 293240.0,
      "jasa_service_express_realisasi": 21902130.0,
      "jasa_service_rutin_realisasi": 11234000.0,
      "jasa_service_sedang_realisasi": 6209610.0,
      "jasa_service_berat_realisasi": 7478080.0,
      "jasa_service_overhoul_realisasi": 0.0,
      "jasa_service_claim_realisasi": 0.0,
      "jasa_service_kelistrikan_realisasi": 0.0,
      "jasa_service_kupon_realisasi": 24582060.0,
      "jasa_service_over_size_realisasi": 0.0,
      "jasa_service_pdc_realisasi": 0.0,
      "jasa_service_cvt_realisasi": 0.0,
      "jasa_service_body_repair_realisasi": 0.0,
      "part_bengkel_realisasi": 97837562.06,
      "part_bengkel_target": 169361000,
      "part_bengkel_oli_realisasi": 219580.2,
      "part_bengkel_express_realisasi": 42873279.4,
      "part_bengkel_rutin_realisasi": 10772293.66,
      "part_bengkel_sedang_realisasi": 7140905.0,
      "part_bengkel_berat_realisasi": 36831503.8,
      "part_bengkel_overhoul_realisasi": 0.0,
      "part_tunai_realisasi": 28236319.0,
      "part_tunai_target": 49485000,
      "total_revenue_realisasi": 220846349.06,
      "total_revenue_target": 369898000
    },
    "comparisons": null
  },
  "sales_monthly_trend": {
    "datasets": [
      {
        "label": "Tahun 2025",
        "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
      }
    ]
  },
  {
  "proporsi_after_sales": {
    "data": {
      "current": {
        "period": "2025-08",
        "items": [
          {
            "name": "JASA SERVICE",
            "value": 7420000
          },
          {
            "name": "PART TUNAI",
            "value": 3560000
          },
          {
            "name": "PART BENGKEL",
            "value": 9880000
          },
          {
            "name": "OLI",
            "value": 1540000
          }
        ]
      }
    }
  }
}
}
```

## Key Differences

- **When `compare = true`**: Response includes `comparisons` object with `prevMonth` and `prevYearSameMonth` data
- **When `compare = false`**: Response has `comparisons: null` and only shows current period data
- Sales monthly trend shows data for both years when comparison is enabled, or just current year when disabled