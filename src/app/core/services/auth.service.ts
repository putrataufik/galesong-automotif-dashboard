// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly BASE = 'https://webservice.sinargalesong.net/HR/api/multipleKey';
  private readonly authHeaders = new HttpHeaders({ authentication: 'rifqymuskar' });

  // GET https://webservice.../app_cookies_login?token=XXXX
  loginWithToken(token: string) {
    const params = new HttpParams().set('token', token); // sesuai spesifikasi kamu
    return this.http.get<any>(`${this.BASE}/app_cookies_login`, {
      params,
      headers: this.authHeaders,
    });
    // Alternatif kalau mau hardcode string (hasil sama):
    // return this.http.get<any>(`${this.BASE}/app_cookies_login?token=${encodeURIComponent(token)}`, { headers: this.authHeaders });
  }

  // GET https://webservice.../user?id=USER_ID
  fetchUser(userId: string) {
    const params = new HttpParams().set('id', userId);
    return this.http.get<any>(`${this.BASE}/user`, {
      params,
      headers: this.authHeaders,
    });
  }
}
