// src/app/core/services/data-master.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

/* ====== tipe hasil simpan (shrinked) ====== */
export interface Branch {
  id: string;
  name: string;
  branch_id: string;
}
export interface Company {
  id: string;
  business: string | null;
  name: string;
}
export interface JobLevel {
  id: string;
  name: string;
}
export interface Organization {
  id: string;
  name: string;
  organization_id: string;
}
export interface Qualification {
  id: string;
  name: string;
}
export interface WorkArea {
  id: string;
  name: string;
}

export interface MasterData {
  branches: Branch[];
  companies: Company[];
  jobLevels: JobLevel[];
  organizations: Organization[];
  qualifications: Qualification[];
  workAreas: WorkArea[];
}

/** Envelope cache di localStorage (tanpa TTL). */
interface CacheEnvelope {
  version: number;
  savedAt: number; // epoch ms
  data: MasterData;
}

@Injectable({ providedIn: 'root' })
export class DataMasterService {
  private http = inject(HttpClient);

  // Konfigurasi cache
  private readonly STORAGE_KEY = 'dm:cache:v1';
  private readonly VERSION = 1;

  // Header auth dari environment
  private authHeaders: HttpHeaders = new HttpHeaders({
    authentication: environment.authenticationToken,
  });

  // State signals
  private _data = signal<MasterData | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  readonly data = computed(() => this._data());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly isLoaded = computed(() => !!this._data());

  // RxJS interop (opsional)
  readonly data$ = toObservable(this._data);
  readonly loading$ = toObservable(this._loading);
  readonly error$ = toObservable(this._error);
  readonly isLoaded$ = toObservable(this.isLoaded);

  constructor() {
    const cached = this.readCache();
    if (cached) {
      console.log('[MASTER][CACHE] ditemukan cache, savedAt=', new Date(cached.savedAt).toISOString());
      this._data.set(cached.data);
    } else {
      console.log('[MASTER][CACHE] belum ada cache di key:', this.STORAGE_KEY);
    }
  }

  /** Opsional: kalau token auth dinamis (mis. dari URL) */
  setAuthToken(token: string) {
    this.authHeaders = new HttpHeaders({ authentication: token });
  }

  /**
   * Muat semua master (field shrinked sesuai kebutuhan).
   * - force=false → pakai cache jika ada.
   * - force=true  → abaikan cache, fetch baru dan overwrite.
   */
  async loadAll(force = false): Promise<void> {
    if (!force) {
      const cached = this.readCache();
      if (cached) {
        console.log('[MASTER] menggunakan data dari cache (tanpa TTL).');
        this._data.set(cached.data);
        return;
      }
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const opts = { headers: this.authHeaders };

      const req = {
        branches: this.http.get<any>('https://webservice.sinargalesong.net/HR/api/master_branch', opts),
        companies: this.http.get<any>('https://webservice.sinargalesong.net/HR/api/master_company', opts),
        jobLevels: this.http.get<any>('https://webservice.sinargalesong.net/HR/api/master_job_level', opts),
        organizations: this.http.get<any>('https://webservice.sinargalesong.net/HR/api/master_organization', opts),
        qualifications: this.http.get<any>('https://webservice.sinargalesong.net/HR/api/master_qualification', opts),
        workAreas: this.http.get<any>('https://webservice.sinargalesong.net/HR/api/master_workarea', opts),
      };

      const res = await firstValueFrom(forkJoin(req));

      // === DEBUG: payload mentah dari server ===
      console.log('[MASTER][RAW][branches]', res.branches);
      console.log('[MASTER][RAW][companies]', res.companies);
      console.log('[MASTER][RAW][jobLevels]', res.jobLevels);
      console.log('[MASTER][RAW][organizations]', res.organizations);
      console.log('[MASTER][RAW][qualifications]', res.qualifications);
      console.log('[MASTER][RAW][workAreas]', res.workAreas);

      // Normalisasi sumber → array mentah
      const rawBranches = this.asArray(res.branches);
      const rawCompanies = this.asArray(res.companies);
      const rawJobLevels = this.asArray(res.jobLevels);
      const rawOrganizations = this.asArray(res.organizations);
      const rawQualifications = this.asArray(res.qualifications);
      const rawWorkAreas = this.asArray(res.workAreas);

      // Map ke bentuk shrinked yang kita simpan
      const branches: Branch[] = rawBranches.map((x: any) => ({
        id: String(x?.id ?? ''),
        name: String(x?.name ?? ''),
        branch_id: String(x?.branch_id ?? ''),
      }));

      const companies: Company[] = rawCompanies.map((x: any) => ({
        id: String(x?.id ?? ''),
        business: x?.business != null ? String(x.business) : null,
        name: String(x?.name ?? ''),
      }));

      const jobLevels: JobLevel[] = rawJobLevels.map((x: any) => ({
        id: String(x?.id ?? ''),
        name: String(x?.name ?? ''),
      }));

      const organizations: Organization[] = rawOrganizations.map((x: any) => ({
        id: String(x?.id ?? ''),
        name: String(x?.name ?? ''),
        organization_id: String(x?.organization_id ?? ''),
      }));

      const qualifications: Qualification[] = rawQualifications.map((x: any) => ({
        id: String(x?.id ?? ''),
        name: String(x?.name ?? ''),
      }));

      const workAreas: WorkArea[] = rawWorkAreas.map((x: any) => ({
        id: String(x?.id ?? ''),
        name: String(x?.name ?? ''),
      }));

      // === DEBUG: hasil normalisasi
      console.log('[MASTER][NORM] branches:', branches.length, 'sample:', branches[0]);
      console.log('[MASTER][NORM] companies:', companies.length, 'sample:', companies[0]);
      console.log('[MASTER][NORM] jobLevels:', jobLevels.length, 'sample:', jobLevels[0]);
      console.log('[MASTER][NORM] organizations:', organizations.length, 'sample:', organizations[0]);
      console.log('[MASTER][NORM] qualifications:', qualifications.length, 'sample:', qualifications[0]);
      console.log('[MASTER][NORM] workAreas:', workAreas.length, 'sample:', workAreas[0]);

      const data: MasterData = {
        branches,
        companies,
        jobLevels,
        organizations,
        qualifications,
        workAreas,
      };

      // Simpan ke state & cache
      this._data.set(data);
      this.writeCache(data);

      // Verifikasi cache
      const saved = this.readCache();
      console.log('[MASTER][CACHE][VERIFY] tersimpan?', !!saved, saved);
    } catch (e: any) {
      const msg = this.humanizeHttpError(e);
      this._error.set(msg);
      console.error('[MASTER] Gagal memuat master:', e);
    } finally {
      this._loading.set(false);
    }
  }

  refresh() {
    return this.loadAll(true);
  }

  async ensureLoaded() {
    if (!this.isLoaded()) {
      await this.loadAll(false);
    }
  }

  // ===== Getter ringkas =====
  getBranches(): Branch[] { return this._data()?.branches ?? []; }
  getCompanies(): Company[] { return this._data()?.companies ?? []; }
  getJobLevels(): JobLevel[] { return this._data()?.jobLevels ?? []; }
  getOrganizations(): Organization[] { return this._data()?.organizations ?? []; }
  getQualifications(): Qualification[] { return this._data()?.qualifications ?? []; }
  getWorkAreas(): WorkArea[] { return this._data()?.workAreas ?? []; }

  // ===== Debug util =====
  debugDumpCache(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    console.log('[MASTER][CACHE][DUMP]', raw ? JSON.parse(raw) : '(tidak ada)');
  }
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[MASTER][CACHE] dihapus');
  }

  // ===== Private helpers =====
  private writeCache(data: MasterData) {
    const env: CacheEnvelope = {
      version: this.VERSION,
      savedAt: Date.now(),
      data,
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(env));
      console.log('[MASTER][CACHE] write ok ke key:', this.STORAGE_KEY);
    } catch (err) {
      console.warn('[MASTER][CACHE] gagal menulis ke localStorage:', err);
    }
  }

  private readCache(): CacheEnvelope | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEnvelope;
      if (parsed.version !== this.VERSION) {
        console.log('[MASTER][CACHE] versi beda, abaikan:', parsed.version, '!=', this.VERSION);
        return null;
      }
      return parsed;
    } catch (err) {
      console.warn('[MASTER][CACHE] gagal parse cache:', err);
      return null;
    }
  }

  private asArray(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (payload?.items && Array.isArray(payload.items)) return payload.items;
    return [];
  }

  private humanizeHttpError(err: any): string {
    const status = err?.status;
    const url = err?.url;
    if (status === 0) return 'Tidak dapat menghubungi server. Cek koneksi/CORS.';
    return `Gagal memuat data master (status ${status || 'unknown'}) dari ${url || 'server'}.`;
  }
}
