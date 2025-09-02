# Sales Dashboard API Data Requirement

## Overview
Keperluan Data Sales Dashboard.

### Request Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `year` | Number | Yes | Tahun laporan | 2025 |
| `month` | String | Yes | Bulan ("01"-"12") atau "all-month" | "08", "all-month" |
| `branch` | String | Yes | ID cabang atau "all-branch" | "0050", "all-branch" |
| `compare` | Boolean | Yes | Flag untuk data perbandingan | true, false |

### 1. Sales Kpi
### Data yang dibutuhkan:
- **Total Unit Sales**
  - Jumlah unit kendaraan yang terjual
  - Type: Number
  - Example: 142

- **Total SPK**
  - Jumlah Surat Pesanan Kendaraan
  - Type: Number
  - Example: 355

- **Total Revenue**
  - Total pendapatan penjualan (dalam rupiah)
  - Type: Number
  - Example: 1100000000

- **Total DO**
  - Jumlah Delivery Order
  - Type: Number
  - Example: 138

- **Top Model**
  - Model kendaraan dengan penjualan tertinggi
  - Fields: `name` (String), `value` (Number)
  - Example: `{ "name": "STARGAZER", "value": 94 }`

- **Top Branch**
  - Cabang dengan performa penjualan terbaik
  - Fields: `code` (String), `value` (Number)
  - Example: `{ "code": "0050", "value": 128 }`

### Data Perbandingan (jika compare=true):
- **prevYear**: Data Bulan yang sama tahun sebelumnya
- **prevMonth**: Data bulan sebelumnya dalam tahun yang sama

#### Response Structure Compare **ON**
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {
    "request": {
      "companyId": "sinar-galesong-mobilindo",
      "year": 2025,
      "month": "08",
      "branchId": "all-branch"
    },
    "kpis": {
      "totalUnitSales": {
        "selected": { "value": 142, "period": "2025-08" },
        "prevYear": { "value": 140, "period": "2024-08" },
        "prevMonth": { "value": 135, "period": "2025-07" }
      },
      "totalSPK": {
        "selected": { "value": 355, "period": "2025-08" },
        "prevYear": { "value": 360, "period": "2024-08" },
        "prevMonth": { "value": 345, "period": "2025-07" }
      },
      "totalRevenue": {
        "selected": { "value": 1100000000, "period": "2025-08" },
        "prevYear": { "value": 1250000000, "period": "2024-08" },
        "prevMonth": { "value": 1220000000, "period": "2025-07" }
      },
      "totalDO": {
        "selected": { "value": 138, "period": "2025-08" },
        "prevYear": { "value": 133, "period": "2024-08" },
        "prevMonth": { "value": 132, "period": "2025-07" }
      },
      "topModel": {
        "selected": { "name": "STARGAZER", "value": 94, "period": "2025-08" },
        "prevYear": { "name": "Palisade", "value": 88, "period": "2024-08" },
        "prevMonth": { "name": "Santa Fe", "value": 92, "period": "2025-07" }
      },
      "topBranch": {
        "selected": { "code": "0050", "value": 128, "period": "2025-08" },
        "prevYear": { "code": "0050", "value": 125, "period": "2024-08" },
        "prevMonth": { "code": "0050", "value": 125, "period": "2025-07" }
      }
    }
  }
}
```

#### Response Structure Compare **OFF**
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {
    "request": {
      "companyId": "sinar-galesong-mobilindo",
      "year": 2025,
      "month": "08",
      "branchId": "all-branch"
    },
    "kpis": {
      "totalUnitSales": {
        "selected": { "value": 142, "period": "2025-08" }
      },
      "totalSPK": {
        "selected": { "value": 355, "period": "2025-08" }
      },
      "totalRevenue": {
        "selected": { "value": 1100000000, "period": "2025-08" }
      },
      "totalDO": {
        "selected": { "value": 138, "period": "2025-08" }
      },
      "topModel": {
        "selected": { "name": "STARGAZER", "value": 94, "period": "2025-08" }
      },
      "topBranch": {
        "selected": { "code": "0050", "value": 128, "period": "2025-08" }
      }
    }
  }
}
```

### 2. Sales Monthly Trend

#### Request Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `year` | Number | Yes | Tahun laporan | 2025 |
| `month` | String | No |  | null |
| `branch` | String | Yes | ID cabang atau "all-branch" | "0050", "all-branch" |
| `compare` | Boolean | Yes | Flag untuk data perbandingan | true, false |

### Data yang dibutuhkan:

- **Datasets**
  - **Current Year Dataset**:
    - `label`: "Tahun {YYYY}"
    - `data`: Array[Number] - data penjualan per bulan
    - Example: `[89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]`

#### Response Structure Compare **ON**
```json
{
  "salesMontlyTrend": {
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
  }
}
```

#### Response Structure Compare **OFF**
```json
{
  "salesMontlyTrend": {
    "datasets": [
      {
        "label": "Tahun 2025",
        "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
      }
    ]
  }
}
```

### 3. Sales by Model Distribution

#### Request Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `year` | Number | Yes | Tahun laporan | 2025 |
| `month` | String | Yes | Bulan ("01"-"12") atau "all-month" | "08", "all-month" |
| `branch` | String | No | ID cabang atau "all-branch" | "0050", "all-branch" |
| `compare` | Boolean | No | Include comparison data | true |


#### Current Period Data:
- **period**: Format "YYYY-MM"
- **label**: Format "Mmm YYYY" (contoh: "Agu 2025")
- **items**: Array objek dengan struktur:
  - `name` (String): Nama model
  - `value` (Number): Jumlah unit terjual
  - `percentage` (Number): Persentase dari total penjualan
### Data Perbandingan (jika compare=true):
- **prevYear**: Data Bulan yang sama tahun sebelumnya
- **prevMonth**: Data bulan sebelumnya dalam tahun yang sama

#### Response Structure Compare **ON**
```json
{
  "status": "success",
  "message": "Model distribution data retrieved successfully",
  "data": {
    "current": {
      "period": "2025-08",
      "label": "Agu 2025",
      "items": [
        { "name": "STARGAZER", "value": 45, "prevY": 30, "prevM": 40 },
        { "name": "CRETA", "value": 32, "prevY": 38, "prevM": 30 },
        { "name": "PALISADE", "value": 28, "prevY": 42, "prevM": 20 },
        { "name": "SANTA FE", "value": 22, "prevY": 18, "prevM": 35 },
        { "name": "IONIC 5", "value": 10, "prevY": 8, "prevM": 7 },
        { "name": "IONIC EV", "value": 5, "prevY": 4, "prevM": 3 }
      ]
    }
  }
}
```

#### Response Structure Compare **OFF**
```json
{
  "status": "success",
  "message": "Model distribution data retrieved successfully",
  "data": {
    "current": {
      "period": "2025-08",
      "label": "Agu 2025",
      "items": [
        { "name": "STARGAZER", "value": 45 },
        { "name": "CRETA", "value": 32 },
        { "name": "PALISADE", "value": 28 },
        { "name": "SANTA FE", "value": 22 },
        { "name": "IONIC 5", "value": 10 },
        { "name": "IONIC EV", "value": 5 }
      ]
    }
  }
}
```

### 4. Sales by Branch Performance
#### Dataset Structure:

- **data**: Array[Number] - jumlah unit per cabang
- Example: `[128, 95, 85, 70, 64]` 
- urutannya `['PETTARANI', 'PALU', 'KENDARI', 'GORONTALO', 'PALOPO']`,
#### Request Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `year` | Number | Yes | Tahun laporan | 2025 |
| `month` | String | Yes | Bulan ("01"-"12") atau "all-month" | "08", "all-month" |
| `compare` | Boolean | Yes | Flag untuk data perbandingan | true, false |

#### Response Structure Compare **ON**
```json
{
  "status": "success",
  "message": "Branch performance data retrieved successfully",
  "data": {
    "current": {
      "period": "2025-08",
      "label": "Agu 2025",
      "datasets": [
        {
          "data": [128, 95, 85, 70, 64]
        }
      ],
    },
    "comparison": {
      "prevYear": {
        "period": "2024-08",
        "label": "Agu 2024",
        "datasets": [
          {
            "data": [125, 88, 78, 65, 58]
          }
        ],
      },
      "prevMonth": {
        "period": "2025-07",
        "label": "Jul 2025",
        "datasets": [
          {
            "data": [125, 92, 82, 68, 62]
          }
        ],
      }
    }
  }
}
```

#### Response Structure Compare **OFF**
```json
{
  "status": "success",
  "message": "Branch performance data retrieved successfully",
  "data": {
    "current": {
      "period": "2025-08",
      "label": "Agu 2025",  
      "datasets": [
        {
          "data": [128, 95, 85, 70, 64]
        }
      ],
    }
  }
}
```

## API Summary

### Endpoints Overview

**Filter Parameters:**
- **Year**: Tahun laporan (required)
- **Month**: Bulan spesifik atau "all-month" (required untuk sebagian endpoint)
- **Branch**: Cabang spesifik atau "all-branch" (required untuk sebagian endpoint)
- **Compare**: Flag untuk menampilkan data perbandingan tahun/bulan sebelumnya

**Response Structure:**
- Semua endpoint menggunakan struktur response standar dengan `status`, `message`, dan `data`
- Ketika `compare: true`, data perbandingan akan menyertakan `prevYear` dan `prevMonth`
- Ketika `compare: false`, hanya data periode yang dipilih yang dikembalikan

**Data Comparison Logic:**
- **prevYear**: Data Bulan yang sama tahun sebelumnya
- **prevMonth**: Data bulan sebelumnya dalam tahun yang sama
- Format periode: "YYYY-MM"