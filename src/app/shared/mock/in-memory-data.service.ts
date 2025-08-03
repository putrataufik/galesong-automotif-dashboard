import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const kpi = [
      { id: 1, title: 'Unit Terjual', value: 120, unit: 'unit', subtitle: 'YTD' },
      { id: 2, title: 'Omzet', value: 200000000, unit: 'Rp', subtitle: 'YTD' },
      { id: 2, title: 'revenue', value: 200000000, unit: 'Rp', subtitle: 'YTD' },
    ];

    const charts = [
      { id: 1, label: 'Sales', data: [10, 20, 30] },
      { id: 2, label: 'After Sales', data: [5, 15, 25] },
    ];

    return { kpi, charts };
  }
}
