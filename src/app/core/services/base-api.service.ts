// src/app/core/services/base-api.service.ts
import { inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export abstract class BaseApiService {
  protected http = inject(HttpClient);

  private readonly authHeaders = new HttpHeaders({
    authentication: environment.authenticationToken,
  });

  protected readonly cabangNameMap: Readonly<Record<string, string>> = {
    '0050': 'PETTARANI',
    '0051': 'PALU',
    '0052': 'KENDARI',
    '0053': 'GORONTALO',
    '0054': 'PALOPO',
    '0055': 'SUNGGUMINASA',
  } as const;

  protected baseUrlOf(company: string): string {
    const url = (environment.baseUrls as any)[company];
    if (!url) throw new Error(`Base URL tidak ditemukan untuk company '${company}'`);
    return url.replace(/\/+$/, '');
  }

  protected buildParams(params?: Record<string, string | number | undefined | null>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) httpParams = httpParams.set(k, String(v));
    }
    return httpParams;
  }

  /** Otomatis normalize: kalau respons punya 'data', kembalikan r.data; else kembalikan r */
  protected get<T>(company: string, endpoint: string, params?: Record<string, any>): Observable<T> {
    const url = `${this.baseUrlOf(company)}/${endpoint.replace(/^\/+/, '')}`;
    return this.http.get<any>(url, {
      headers: this.authHeaders,
      params: this.buildParams(params),
    }).pipe(
      map((r: any) => (r && typeof r === 'object' && 'data' in r ? r.data as T : r as T))
    );
  }

  getCabangName(id: string) { return this.cabangNameMap[id] ?? id; }
  getCabangNameMap() { return this.cabangNameMap; }
}
