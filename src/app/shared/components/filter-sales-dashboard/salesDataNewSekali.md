# Sales Dashboard API Data Requirement (Updated)

## Overview
Keperluan Data Sales Dashboard dengan dukungan custom date picker.

## Request Parameters (Updated)

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| year | Number | Conditional | Tahun laporan (required jika useCustomDate=false) | 2025 |
| month | String | Conditional | Bulan ("01"-"12") atau "all-month" (required jika useCustomDate=false) | "08", "all-month" |
| branch | String | Yes | ID cabang atau "all-branch" | "0050", "all-branch" |
| compare | Boolean | Yes | Flag untuk data perbandingan | true, false |
| useCustomDate | Boolean | No | Flag penggunaan custom date (default: false) | true, false |
| selectedDate | String | Conditional | Tanggal spesifik YYYY-MM-DD (required jika useCustomDate=true) | "2025-08-15" |

### Parameter Validation Rules
- **Mode 1 - Month/Year Filter (useCustomDate=false atau tidak ada):**
  - `year` wajib diisi
  - `month` wajib diisi untuk beberapa endpoint
  - `selectedDate` diabaikan

- **Mode 2 - Custom Date Filter (useCustomDate=true):**
  - `selectedDate` wajib diisi dalam format `YYYY-MM-DD`
  - `year` dan `month` diabaikan
  - Tanggal harus valid dan tidak boleh masa depan

## 1. Sales KPI

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
  - Fields: name (String), value (Number)
  - Example: { "name": "STARGAZER", "value": 94 }

- **Top Branch**
  - Cabang dengan performa penjualan terbaik
  - Fields: code (String), value (Number)
  - Example: { "code": "0050", "value": 128 }

### Data Perbandingan (jika compare=true):
- **Mode Month/Year:**
  - prevYear: Data bulan yang sama tahun sebelumnya
  - prevMonth: Data bulan sebelumnya dalam tahun yang sama

- **Mode Custom Date:**
  - prevDate: Data tanggal kemarin (D-1)
  - prevMonth: Data tanggal yang sama di bulan lalu
  - **Note**: Tidak ada perbandingan tahun sebelumnya dalam mode custom date

### Response Structure Compare ON (Month/Year Mode)
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {
    "request": {
      "companyId": "sinar-galesong-mobilindo",
      "year": 2025,
      "month": "08",
      "branchId": "all-branch",
      "useCustomDate": false,
      "selectedDate": null
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

### Response Structure Compare ON (Custom Date Mode)
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {
    "request": {
      "companyId": "sinar-galesong-mobilindo",
      "year": null,
      "month": null,
      "branchId": "all-branch",
      "useCustomDate": true,
      "selectedDate": "2025-08-15"
    },
    "kpis": {
      "totalUnitSales": {
        "selected": { "value": 5, "period": "2025-08-15" },
        "prevDate": { "value": 4, "period": "2025-08-14" },
        "prevMonth": { "value": 6, "period": "2025-07-15" }
      },
      "totalSPK": {
        "selected": { "value": 12, "period": "2025-08-15" },
        "prevDate": { "value": 10, "period": "2025-08-14" },
        "prevMonth": { "value": 11, "period": "2025-07-15" }
      },
      "totalRevenue": {
        "selected": { "value": 85000000, "period": "2025-08-15" },
        "prevDate": { "value": 75000000, "period": "2025-08-14" },
        "prevMonth": { "value": 90000000, "period": "2025-07-15" }
      },
      "totalDO": {
        "selected": { "value": 4, "period": "2025-08-15" },
        "prevDate": { "value": 3, "period": "2025-08-14" },
        "prevMonth": { "value": 5, "period": "2025-07-15" }
      },
      "topModel": {
        "selected": { "name": "STARGAZER", "value": 2, "period": "2025-08-15" },
        "prevDate": { "name": "CRETA", "value": 2, "period": "2025-08-14" },
        "prevMonth": { "name": "STARGAZER", "value": 3, "period": "2025-07-15" }
      },
      "topBranch": {
        "selected": { "code": "0050", "value": 3, "period": "2025-08-15" },
        "prevDate": { "code": "0050", "value": 2, "period": "2025-08-14" },
        "prevMonth": { "code": "0050", "value": 4, "period": "2025-07-15" }
      }
    }
  }
}
```

### Response Structure Compare OFF
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {
    "request": {
      "companyId": "sinar-galesong-mobilindo",
      "year": 2025,
      "month": "08",
      "branchId": "all-branch",
      "useCustomDate": false,
      "selectedDate": null
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

## 2. Sales Monthly Trend

### Request Parameters

| Parameter | Type    | Required | Description                     | Example             |
|-----------|---------|----------|---------------------------------|---------------------|
| year      | Number  | Yes      | Tahun laporan                   | 2025                |
| month     | String  | No       |                                 | null                |
| branch    | String  | Yes      | ID cabang atau "all-branch"     | "0050", "all-branch"|
| compare   | Boolean | Yes      | Flag untuk data perbandingan    | true, false         |

Data yang dibutuhkan:

### Datasets
**Current Year Dataset:**
- label: "Tahun {YYYY}"
- data: Array[Number] - data penjualan per bulan
- Example: [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]

### Response Structure Compare ON

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

### Response Structure Compare OFF

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

## 3. DO vs SPK Monthly Trend

### Request Parameters

| Parameter | Type    | Required | Description                     | Example             |
|-----------|---------|----------|---------------------------------|---------------------|
| year      | Number  | Yes      | Tahun laporan                   | 2025                |
| month     | String  | No       |                                 | null                |
| branch    | String  | Yes      | ID cabang atau "all-branch"     | "0050", "all-branch"|
| compare   | Boolean | No       | Tidak ada Perbandingan          | false               |

Data yang dibutuhkan:

### Datasets
**Current Year Dataset:**
- label: "Tahun {YYYY}"
- data: Array[Number] - data DO dan SPK Per bulan
- Example: [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]

### Response Structure Compare OFF

```json
{
  "DOvsSPKMontlyTrend": {
    "datasets": [
      {
        "label": "Delivery Order",
        "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
      },
      {
        "label": "Surat Pemesanan Kendaraan",
        "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
      }
    ]
  }
}
```

## 4. Sales by Model Distribution

### Request Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| year | Number | Conditional | Tahun laporan (required jika useCustomDate=false) | 2025 |
| month | String | Conditional | Bulan ("01"-"12") atau "all-month" (required jika useCustomDate=false) | "08", "all-month" |
| branch | String | No | ID cabang atau "all-branch" | "0050", "all-branch" |
| compare | Boolean | No | Include comparison data | true |
| **useCustomDate** | **Boolean** | **No** | **Flag penggunaan custom date** | **true, false** |
| **selectedDate** | **String** | **Conditional** | **Tanggal spesifik (required jika useCustomDate=true)** | **"2025-08-15"** |

### Current Period Data:
- **period**: Format "YYYY-MM" atau "YYYY-MM-DD"
- **label**: Format "Mmm YYYY" atau "DD Mmm YYYY"
- **items**: Array objek dengan struktur:
  - name (String): Nama model
  - value (Number): Jumlah unit terjual
  - percentage (Number): Persentase dari total penjualan

### Data Perbandingan (jika compare=true):
- **Mode Month/Year:**
  - prevYear: Data bulan yang sama tahun sebelumnya
  - prevMonth: Data bulan sebelumnya dalam tahun yang sama
- **Mode Custom Date:**
  - prevDate: Data tanggal kemarin (D-1)
  - prevMonth: Data tanggal yang sama di bulan lalu

### Response Structure Compare ON (Month Mode)
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

### Response Structure Compare ON (Custom Date Mode)
```json
{
  "status": "success",
  "message": "Model distribution data retrieved successfully",
  "data": {
    "current": {
      "period": "2025-08-15",
      "label": "15 Agu 2025",
      "items": [
        { "name": "STARGAZER", "value": 2, "prevD": 1, "prevM": 3 },
        { "name": "CRETA", "value": 1, "prevD": 2, "prevM": 1 },
        { "name": "PALISADE", "value": 1, "prevD": 1, "prevM": 0 },
        { "name": "SANTA FE", "value": 1, "prevD": 0, "prevM": 2 },
        { "name": "IONIC 5", "value": 0, "prevD": 0, "prevM": 0 },
        { "name": "IONIC EV", "value": 0, "prevD": 0, "prevM": 0 }
      ]
    }
  }
}
```

### Response Structure Compare OFF
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

## 5. Sales by Branch Performance

### Dataset Structure:
- **data**: Array[Number] - jumlah unit per cabang
- **Example**: [128, 95, 85, 70, 64]
- **urutannya**: ['PETTARANI', 'PALU', 'KENDARI', 'GORONTALO', 'PALOPO']

### Request Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| year | Number | Conditional | Tahun laporan (required jika useCustomDate=false) | 2025 |
| month | String | Conditional | Bulan ("01"-"12") atau "all-month" (required jika useCustomDate=false) | "08", "all-month" |
| compare | Boolean | Yes | Flag untuk data perbandingan | true, false |
| **useCustomDate** | **Boolean** | **No** | **Flag penggunaan custom date** | **true, false** |
| **selectedDate** | **String** | **Conditional** | **Tanggal spesifik (required jika useCustomDate=true)** | **"2025-08-15"** |

### Response Structure Compare ON (Month Mode)
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
      ]
    },
    "comparison": {
      "prevYear": {
        "period": "2024-08",
        "label": "Agu 2024",
        "datasets": [
          {
            "data": [125, 88, 78, 65, 58]
          }
        ]
      },
      "prevMonth": {
        "period": "2025-07",
        "label": "Jul 2025",
        "datasets": [
          {
            "data": [125, 92, 82, 68, 62]
          }
        ]
      }
    }
  }
}
```

### Response Structure Compare ON (Custom Date Mode)
```json
{
  "status": "success",
  "message": "Branch performance data retrieved successfully",
  "data": {
    "current": {
      "period": "2025-08-15",
      "label": "15 Agu 2025",
      "datasets": [
        {
          "data": [3, 2, 1, 1, 0]
        }
      ]
    },
    "comparison": {
      "prevDate": {
        "period": "2025-08-14",
        "label": "14 Agu 2025",
        "datasets": [
          {
            "data": [2, 1, 1, 0, 1]
          }
        ]
      },
      "prevMonth": {
        "period": "2025-07-15",
        "label": "15 Jul 2025",
        "datasets": [
          {
            "data": [4, 3, 2, 1, 1]
          }
        ]
      }
    }
  }
}
```

### Response Structure Compare OFF
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
      ]
    }
  }
}
```

## API Summary

### Endpoints Overview

#### Filter Parameters:
- **Year**: Tahun laporan (required jika useCustomDate=false)
- **Month**: Bulan spesifik atau "all-month" (required untuk sebagian endpoint jika useCustomDate=false)
- **Branch**: Cabang spesifik atau "all-branch" (required untuk sebagian endpoint)
- **Compare**: Flag untuk menampilkan data perbandingan tahun/bulan sebelumnya
- **useCustomDate**: Flag untuk menggunakan mode custom date (default: false)
- **selectedDate**: Tanggal spesifik dalam format YYYY-MM-DD (required jika useCustomDate=true)

#### Response Structure:
- Semua endpoint menggunakan struktur response standar dengan status, message, dan data
- Ketika compare: true, data perbandingan akan menyertakan prevYear dan prevMonth (mode month/year) atau prevDate dan prevMonth (mode custom date)
- Ketika compare: false, hanya data periode yang dipilih yang dikembalikan
- Format periode disesuaikan dengan mode: "YYYY-MM" untuk monthly, "YYYY-MM-DD" untuk daily

#### Data Comparison Logic:
- **Mode Month/Year:**
  - prevYear: Data bulan yang sama tahun sebelumnya
  - prevMonth: Data bulan sebelumnya dalam tahun yang sama
- **Mode Custom Date (3 data points only):**
  - selected: Data tanggal yang dipilih
  - prevDate: Data tanggal kemarin (D-1)
  - prevMonth: Data tanggal yang sama di bulan lalu
  - **No prevYear comparison in custom date mode**
- Format periode: "YYYY-MM" atau "YYYY-MM-DD"

#### Error Handling:
- Jika useCustomDate=true tapi selectedDate kosong: Return error "selectedDate is required when useCustomDate is true"
- Jika useCustomDate=false tapi year/month kosong: Return error "year and month are required when useCustomDate is false"
- Jika selectedDate format salah: Return error "selectedDate must be in YYYY-MM-DD format"
- Jika selectedDate masa depan: Return error "selectedDate cannot be in the future"

#### Backend Implementation Notes:
1. Validasi parameter berdasarkan mode filter
2. Query database disesuaikan dengan granularitas data (monthly vs daily)
3. Logic perbandingan data disesuaikan dengan mode
4. Format response period disesuaikan dengan input
5. Handle edge cases untuk tanggal yang tidak ada di bulan sebelumnya