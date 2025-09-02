## Data Requirment After Sales

##### Request Parameter

| Parameter | Type | Required | Description | Example | Default | Validation |
|-----------|------|----------|-------------|---------|---------|------------|
| `branchId` | string | ✅ Yes | ID cabang spesifik | `"0050"` | `null` (semua cabang) | Must exist in branch master for selected company |
| `year` | number | ✅ Yes | Tahun data yang ingin diambil | `2025` | - | Format: YYYY, range: 2020-current year |
| `month` | number | ❌ No | Bulan spesifik (1-12) | `9` | `null` (semua bulan) | Range: 1-12 |
| `compare` | boolean | ✅ Yes | Flag untuk menampilkan data komparasi | `true` | `false` | Boolean value |


##### comparison true
```
{
  "meta": {
    "companyName": "PT. SINARGALESONG MOBILINDO",
    "branchId": "0050",
    "year": 2025,
    "month": 9,
    "compare": true
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
        "prevMonth" : {
            "year": 2025,
            "month": 7,
            "metrics" : {
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
        "prevYearSameMonth": {
            "year": 2024,
            "month": 8,
            "metrics" : {
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
      "current": {
        "period": "2025-08",
        "label": "Agu 2025",
        "items": [
          { "name": "JASA SERVICE", "value": 7420000, "prevY": 6130000, "prevM": 8250000 },
          { "name": "PART TUNAI",   "value": 3560000, "prevY": 2910000, "prevM": 4780000 },
          { "name": "PART BENGKEL", "value": 9880000, "prevY": 8450000, "prevM": 9230000 },
          { "name": "OLI",          "value": 1540000, "prevY": 1200000, "prevM": 1880000 }
        ]
      }
    }
  }
}
}

```

##### comparison false
```
{
  "meta": {
    "companyName": "PT. SINARGALESONG MOBILINDO",
    "branchId": "0050",
    "year": 2025,
    "month": 9,
    "compare": true
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
    "comparisons": null,
  }, 
  "sales_monthly_trend": {
    "datasets": [
        {
        "label": "Tahun 2025",
        "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
        },
    ]
 },
{
  "proporsi_after_sales": {
    "data": {
      "current": {
        "period": "2025-08",
        "label": "Agu 2025",
        "items": [
          { "name": "JASA SERVICE", "value": 7420000, "prevY": 6130000, "prevM": 8250000 },
          { "name": "PART TUNAI",   "value": 3560000, "prevY": 2910000, "prevM": 4780000 },
          { "name": "PART BENGKEL", "value": 9880000, "prevY": 8450000, "prevM": 9230000 },
          { "name": "OLI",          "value": 1540000, "prevY": 1200000, "prevM": 1880000 }
        ]
      }
    }
  }
}
}
```


