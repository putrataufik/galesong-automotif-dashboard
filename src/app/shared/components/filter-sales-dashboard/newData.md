### Request Parameters

| Parameter       | Type    | Required    | Description                                                    | Example              |
| --------------- | ------- | ----------- | -------------------------------------------------------------- | -------------------- |
| `year`          | Number  | Yes         | Tahun laporan                                                  | 2025                 |
| `month`         | String  | Yes         | Bulan ("01"-"12") atau "all-month"                             | "08", "all-month"    |
| `branch`        | String  | Yes         | ID cabang atau "all-branch"                                    | "0050", "all-branch" |
| `compare`       | Boolean | Yes         | Flag untuk data perbandingan                                   | true, false          |
| `useCustomDate` | Boolean | No          | Flag penggunaan custom date (default: false)                   | true, false          |
| `selectedDate`  | String  | Conditional | Tanggal spesifik YYYY-MM-DD (required jika useCustomDate=true) | "2025-08-15"         |

#### compare on useCustomDate false

```json
"DOperCabang":{
  "data": {
    "current": {
    "period": "2025-09",
    "label": "Sep 2025",
    "items":[
      {"branchName": "Pettarani", "value":3},
      {"branchName": "Kendari", "value": 3}
      ]
    },
    "prevMonth": {
    "period": "2025-09",
    "label": "Sep 2025",
    "items":[
      {"branchName": "Pettarani", "value":3},
      {"branchName": "Kendari", "value": 3}
    ]
    },
    "prevYear": {
    "period": "2025-09",
    "label": "Sep 2025",
    "items":[
      {"branchName": "Pettarani", "value":3},
      {"branchName": "Kendari", "value": 3}
    ]
    }
  }
}
```

#### compare on useCustomDate true

```json
"DOperCabang":{
  "data": {
    "current": {
     "period": "26-09-2025",
     "label": "26 Sep 2025",
     "items":[
       {"branchName": "Pettarani", "value":3},
       {"branchName": "Kendari", "value": 3}
      ]
    },
    "prevMonth": {
     "period": "26-08-2025",
     "label": "26 AGU 2025",
     "items":[
       {"branchName": "Pettarani", "value":3},
       {"branchName": "Kendari", "value": 3}
      ]
    },
    "prevDate": {
     "period": "25-09-2025",
     "label": "9 Sep 2025",
     "items":[
       {"branchName": "Pettarani", "value":3},
       {"branchName": "Kendari", "value": 3}
      ]
    }
  }
}
```

#### Ganti Total unit sales yang di API getSalesReportByDate dengan Total Stock (hanya menggunakan params perusahaan)

```json
"kpis": {
  "totalStock": {
    "value": 0,
  },
}
```

#### jumlah entry seluruh cabang (after sales & main dashboard)

Parameter

```json
  "entryAllbranch" : {
    "current": {
      "period" : "2025-09-26",
      "branchName": "Pettarani",
      "value": 10
    },
    "prevMonth": {
      "period" : "2025-08-26",
      "branchName": "Pettarani",
      "value": 10
    },
    "prevDate": {
      "period" : "2025-08-26",
      "branchName": "Pettarani",
      "value": 10
    }
  }
```

#### umur stock pada halaman sales

parameter nya company saja

```json
"stockAge" : {
    "period": ,
    "items": [
      {
        "tglsjln": "2024-10-10",
        "kgudang": "0001",
        "thnprod": "2024",
        "warna": "WHT",
        "hargabeli": "445397035.00",
        "ngudang": "SHOWROOM UNIT PETTARANI",
        "tymotor": "KONA EV 2 TR",
       },
      {
        "tglsjln": "2024-10-15",
        "kgudang": "0002",
        "thnprod": "2025",
        "warna": "WMR",
        "hargabeli": "445397035.00",
        "ngudang": "SHOWROOM UNIT PETTARANI",
        "tymotor": "KONA EV 2 TR",
       },
    ]
}
```

#### DO per Supervisor

```json
"doperSupervisor" : {
  "current": {
      "period" : "2025-09",
      "items" : [
        {"supervisorName": "Putra", "value": 10}
        {"supervisorName": "Putri", "value": 9}
      ]
    },
    "prevMonth": {
      "period" : "2025-08",
      "items" : [
        {"supervisorName": "Putra", "value": 9}
        {"supervisorName": "Putri", "value": 10}
      ]
    },
    "prevYear": {
      "period" : "2024-09",
      "items" : [
        {"supervisorName": "Putra", "value": 10}
        {"supervisorName": "Putri", "value": 10}
      ]
    },
}
```



