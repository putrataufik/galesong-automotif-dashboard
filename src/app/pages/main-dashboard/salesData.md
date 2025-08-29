# API Response Structure - SGM Dashboard

## Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `year` | Number | Yes | Tahun laporan | 2025 |
| `month` | String | Yes | Bulan ("01"-"12") atau "all-month" | "08", "all-month" |
| `branch` | String | Yes | ID cabang atau "all-branch" | "0050", "all-branch" |
| `compare` | Boolean | Yes | Flag untuk data perbandingan | true, false |


### Compare = true (Monthly with comparison data)
```json
{
  "labels": {
    "selected": "Agu 2025",
    "selectedYear": 2025,
    "prevYear": "Agu 2024",
    "prevMonth": "Jul 2025"
  },
  "kpis": {
    "totalUnitSales": {
      "selected": 142,
      "prevYear": 140,
      "prevMonth": 135
    },
    "totalSPK": {
      "selected": 355,
      "prevYear": 360,
      "prevMonth": 345
    },
    "totalRevenue": {
      "selected": 1100000000,
      "prevYear": 1250000000,
      "prevMonth": 1220000000
    },
    "totalDO": {
      "selected": 138,
      "prevYear": 133,
      "prevMonth": 132
    },
    "topModel": {
      "selected": { "name": "Tipe A", "value": 94 },
      "prevYear": { "name": "Tipe B", "value": 88 },
      "prevMonth": { "name": "Tipe C", "value": 92 }
    },
    "topBranch": {
      "selected": { "code": "0050", "value": 128 },
      "prevYear": { "code": "0050", "value": 125 },
      "prevMonth": { "code": "0050", "value": 125 }
    }
  },
  "charts": {
    "lineMonthly": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      "datasets": [
        {
          "label": "Tahun 2025",
          "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0],
          "backgroundColor": "rgba(13,110,253,0.20)",
          "borderColor": "#0d6efd",
          "borderWidth": 2
        },
        {
          "label": "Tahun 2024",
          "data": [95, 88, 92, 105, 98, 115, 125, 140, 135, 128, 142, 155],
          "backgroundColor": "rgba(148,163,184,0.20)",
          "borderColor": "#94a3b8",
          "borderWidth": 1
        }
      ]
    },
    "modelDistribution": [
      { "name": "Stargazer", "curr": 102, "prev": 103 },
      { "name": "Creta", "curr": 1, "prev": 50 },
      { "name": "Palisade", "curr": 2, "prev": 52 },
      { "name": "Santa FE", "curr": 5, "prev": 48 },
      { "name": "Ionic 5", "curr": 9, "prev": 40 },
      { "name": "Ionic EV", "curr": 1, "prev": 35 }
    ],
    "branchPerformance": {
      "labels": ["PETTARANI", "PALU", "KENDARI", "GORONTALO", "PALOPO"],
      "data": [120, 85, 95, 70, 80]
    }
  }
}
```

### Compare = false (Monthly without comparison data)
```json
{
  "labels": {
    "selected": "Agu 2025",
    "selectedYear": 2025,
    "prevYear": null,
    "prevMonth": null
  },
  "kpis": {
    "totalUnitSales": {
      "selected": 142,
      "prevYear": null,
      "prevMonth": null
    },
    "totalSPK": {
      "selected": 355,
      "prevYear": null,
      "prevMonth": null
    },
    "totalRevenue": {
      "selected": 1100000000,
      "prevYear": null,
      "prevMonth": null
    },
    "totalDO": {
      "selected": 138,
      "prevYear": null,
      "prevMonth": null
    },
    "topModel": {
      "selected": { "name": "Tipe A", "value": 94 },
      "prevYear": null,
      "prevMonth": null
    },
    "topBranch": {
      "selected": { "code": "0050", "value": 128 },
      "prevYear": null,
      "prevMonth": null
    }
  },
  "charts": {
    "lineMonthly": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      "datasets": [
        {
          "label": "Tahun 2025",
          "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0],
          "backgroundColor": "rgba(13,110,253,0.20)",
          "borderColor": "#0d6efd",
          "borderWidth": 2
        }
      ]
    },
    "modelDistribution": [
      { "name": "Stargazer", "curr": 102, "prev": null },
      { "name": "Creta", "curr": 1, "prev": null },
      { "name": "Palisade", "curr": 2, "prev": null },
      { "name": "Santa FE", "curr": 5, "prev": null },
      { "name": "Ionic 5", "curr": 9, "prev": null },
      { "name": "Ionic EV", "curr": 1, "prev": null }
    ],
    "branchPerformance": {
      "labels": ["PETTARANI", "PALU", "KENDARI", "GORONTALO", "PALOPO"],
      "data": [120, 85, 95, 70, 80]
    }
  }
}
```

### Compare = true (Yearly with comparison data)
```json
{
  "labels": {
    "selected": "2025",
    "selectedYear": 2025,
    "prevYear": "2024",
    "prevMonth": null
  },
  "kpis": {
    "totalUnitSales": {
      "selected": 990,
      "prevYear": 1465,
      "prevMonth": null
    },
    "totalSPK": {
      "selected": 2475,
      "prevYear": 3750,
      "prevMonth": null
    },
    "totalRevenue": {
      "selected": 8500000000,
      "prevYear": 13150000000,
      "prevMonth": null
    },
    "totalDO": {
      "selected": 980,
      "prevYear": 1450,
      "prevMonth": null
    },
    "topModel": {
      "selected": { "name": "Tipe A", "value": 696 },
      "prevYear": { "name": "Tipe B", "value": 1005 },
      "prevMonth": null
    },
    "topBranch": {
      "selected": { "code": "0050", "value": 950 },
      "prevYear": { "code": "0050", "value": 1372 },
      "prevMonth": null
    }
  },
  "charts": {
    "lineMonthly": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      "datasets": [
        {
          "label": "Tahun 2025",
          "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0],
          "backgroundColor": "rgba(13,110,253,0.20)",
          "borderColor": "#0d6efd",
          "borderWidth": 2
        },
        {
          "label": "Tahun 2024",
          "data": [95, 88, 92, 105, 98, 115, 125, 140, 135, 128, 142, 155],
          "backgroundColor": "rgba(148,163,184,0.20)",
          "borderColor": "#94a3b8",
          "borderWidth": 1
        }
      ]
    },
    "modelDistribution": [
      { "name": "Stargazer", "curr": 696, "prev": 1005 },
      { "name": "Creta", "curr": 150, "prev": 250 },
      { "name": "Palisade", "curr": 80, "prev": 120 },
      { "name": "Santa FE", "curr": 45, "prev": 65 },
      { "name": "Ionic 5", "curr": 15, "prev": 20 },
      { "name": "Ionic EV", "curr": 4, "prev": 5 }
    ],
    "branchPerformance": {
      "labels": ["PETTARANI", "PALU", "KENDARI", "GORONTALO", "PALOPO"],
      "data": [950, 680, 760, 560, 640]
    }
  }
}
```

### Compare = false (Yearly without comparison data)
```json
{
  "labels": {
    "selected": "2025",
    "selectedYear": 2025,
    "prevYear": null,
    "prevMonth": null
  },
  "kpis": {
    "totalUnitSales": {
      "selected": 990,
      "prevYear": null,
      "prevMonth": null
    },
    "totalSPK": {
      "selected": 2475,
      "prevYear": null,
      "prevMonth": null
    },
    "totalRevenue": {
      "selected": 8500000000,
      "prevYear": null,
      "prevMonth": null
    },
    "totalDO": {
      "selected": 980,
      "prevYear": null,
      "prevMonth": null
    },
    "topModel": {
      "selected": { "name": "Tipe A", "value": 696 },
      "prevYear": null,
      "prevMonth": null
    },
    "topBranch": {
      "selected": { "code": "0050", "value": 950 },
      "prevYear": null,
      "prevMonth": null
    }
  },
  "charts": {
    "lineMonthly": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      "datasets": [
        {
          "label": "Tahun 2025",
          "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0],
          "backgroundColor": "rgba(13,110,253,0.20)",
          "borderColor": "#0d6efd",
          "borderWidth": 2
        }
      ]
    },
    "modelDistribution": [
      { "name": "Stargazer", "curr": 696, "prev": null },
      { "name": "Creta", "curr": 150, "prev": null },
      { "name": "Palisade", "curr": 80, "prev": null },
      { "name": "Santa FE", "curr": 45, "prev": null },
      { "name": "Ionic 5", "curr": 15, "prev": null },
      { "name": "Ionic EV", "curr": 4, "prev": null }
    ],
    "branchPerformance": {
      "labels": ["PETTARANI", "PALU", "KENDARI", "GORONTALO", "PALOPO"],
      "data": [950, 680, 760, 560, 640]
    }
  }
}
```

## Field List

### Request Parameters
- `year` (number) - Tahun data  
- `month` (string) - Bulan atau "all-month"
- `branch` (string) - ID cabang atau "all-branch"
- `compare` (boolean) - Flag untuk data perbandingan

### Root Level
- `labels` (object) - Label untuk display UI
- `kpis` (object) - Data KPI utama
- `charts` (object) - Data untuk chart visualisasi

### Labels Object
- `selected` (string) - Label tahun yang dipilih
- `selectedYear` (number) - Tahun yang dipilih
- `prevYear` (string|null) - Label tahun tahun sebelumnya
- `prevMonth` (string|null) - Label bulan sebelumnya (null untuk yearly)

### KPIs Object
- `totalUnitSales` (object) - Total unit kendaraan terjual
- `totalSPK` (object) - Total Surat Pesanan Kendaraan
- `totalRevenue` (object) - Total pendapatan (Rupiah)
- `totalDO` (object) - Total Delivery Order
- `topModel` (object) - Model terlaris
- `topBranch` (object) - Cabang terbaik

### Charts Object
- `lineMonthly` (object) - Data line chart penjualan bulanan
- `modelDistribution` (array) - Data distribusi penjualan per model
- `branchPerformance` (object) - Data performa cabang

### Standard KPI Structure (totalUnitSales, totalSPK, totalRevenue, totalDO)
- `selected` (number) - Nilai tahun terpilih
- `prevYear` (number|null) - Nilai tahun sebelumnya
- `prevMonth` (number|null) - Nilai bulan sebelumnya

### Top Model KPI Structure
- `selected` (object) - Data tahun terpilih
  - `name` (string) - Nama model
  - `value` (number) - Jumlah unit
- `prevYear` (object|null) - Data tahun sebelumnya
  - `name` (string) - Nama model
  - `value` (number) - Jumlah unit
- `prevMonth` (object|null) - Data bulan sebelumnya
  - `name` (string) - Nama model
  - `value` (number) - Jumlah unit

### Top Branch KPI Structure
- `selected` (object) - Data tahun terpilih
  - `code` (string) - Kode cabang
  - `value` (number) - Nilai performa
- `prevYear` (object|null) - Data tahun sebelumnya
  - `code` (string) - Kode cabang
  - `value` (number) - Nilai performa
- `prevMonth` (object|null) - Data bulan sebelumnya
  - `code` (string) - Kode cabang
  - `value` (number) - Nilai performa