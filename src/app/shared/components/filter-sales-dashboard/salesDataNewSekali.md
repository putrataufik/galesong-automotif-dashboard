list api
- API after sales, data target di setiap CPUS dan non CPUS 
- data grafik sales per bulan
```
compare true
{
 "salesMontlyTrend": {
    datasets": [
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

```
compare false
{
 "salesMontlyTrend": {
    datasets": [
    {
      "label": "Tahun 2025",
      "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
    },
    ]
  }
}
```
- data grafik DO vs SPK
```
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
- data grafin Model
```
compare true
{
 "status": "success",
 "message": "Model distribution data retrieved successfully",
 "data": {
  "current": {
    "period": "2025-08",
    "label": "Agu 2025",
    "items": [
      {"name":"STARGAZER", "value": 45},
      {"name":"CRETA", "value": 32},
      {"name":"PALISADE", "value": 28},
      {"name":"SANTA FE", "value": 22},
      {"name":"IONIC 5", "value": 10},
      {"name":"IONIC EV", "value": 5},
    ]
  },
  "prevMonth": {
    "period": "2025-07",
    "label": "Agu 2025",
    "items": [
      {"name":"STARGAZER", "value": 45},
      {"name":"CRETA", "value": 32},
      {"name":"PALISADE", "value": 28},
      {"name":"SANTA FE", "value": 22},
      {"name":"IONIC 5", "value": 10},
      {"name":"IONIC EV", "value": 5},
    ]
  },
  "prevYear": {
    "period": "2024-08",
    "label": "Agu 2025",
    "items": [
      {"name":"STARGAZER", "value": 45},
      {"name":"CRETA", "value": 32},
      {"name":"PALISADE", "value": 28},
      {"name":"SANTA FE", "value": 22},
      {"name":"IONIC 5", "value": 10},
      {"name":"IONIC EV", "value": 5},
    ]
  },
 }
}
```
```
compare false
{
 "status": "success",
 "message": "Model distribution data retrieved successfully",
 "data": {
  "current": {
    "period": "2025-08",
    "label": "Agu 2025",
    "items": [
      {"name":"STARGAZER", "value": 45},
      {"name":"CRETA", "value": 32},
      {"name":"PALISADE", "value": 28},
      {"name":"SANTA FE", "value": 22},
      {"name":"IONIC 5", "value": 10},
      {"name":"IONIC EV", "value": 5},
    ]
  },
 }
}
```

- data grafik after sales per bulan
```
compare on
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
 }
```
```
compare off
"sales_monthly_trend": {
  "datasets": [
    {
      "label": "Tahun 2025",
      "data": [89, 94, 102, 88, 95, 110, 120, 142, 0, 0, 0, 0]
    },
  ]
 }
```
