// src/app/core/services/master-lookup.service.ts
import { Injectable, computed, inject } from '@angular/core';
import { DataMasterService } from './data-master.service';

/** Bentuk minimal auth.user (ambil yang kamu perlukan saja) */
export interface AuthUser {
  id: string;
  username: string;
  branch?: string | null;         // bisa "id" atau "branch_id" tergantung backend
  company?: string | null;        // id company
  job_level?: string | null;      // id job level
  organization?: string | null;   // id organization (kadang ada organization_id di master)
  qualification?: string | null;  // id qualification
  work_area?: string | null;      // id work area
  [k: string]: any;
}

@Injectable({ providedIn: 'root' })
export class MasterLookupService {
  private dm = inject(DataMasterService);

  // ========== Normalizer ==========
  private norm(v?: string | null): string {
    return (v ?? '').toString().trim();
  }

  // ========== Index (dictionary) dari master ==========
  // Branch: kita siapkan 3 jenis index karena field user `branch` bisa mengacu ke id/branch_id/code
  private branchById = computed(() => {
    const map = new Map<string, string>();
    for (const b of this.dm.getBranches()) map.set(this.norm(b.id), b.name);
    return map;
  });
  private branchByBranchId = computed(() => {
    const map = new Map<string, string>();
    for (const b of this.dm.getBranches()) map.set(this.norm(b.branch_id), b.name);
    return map;
  });
  // kalau suatu saat kamu butuh `code`, tinggal tambah ke Branch shrinked & index-nya

  private companyById = computed(() => {
    const map = new Map<string, string>();
    for (const c of this.dm.getCompanies()) map.set(this.norm(c.id), c.name);
    return map;
  });

  private jobLevelById = computed(() => {
    const map = new Map<string, string>();
    for (const j of this.dm.getJobLevels()) map.set(this.norm(j.id), j.name);
    return map;
  });

  private organizationById = computed(() => {
    const map = new Map<string, string>();
    for (const o of this.dm.getOrganizations()) map.set(this.norm(o.id), o.name);
    return map;
  });
  private organizationByOrgId = computed(() => {
    const map = new Map<string, string>();
    for (const o of this.dm.getOrganizations()) map.set(this.norm(o.organization_id), o.name);
    return map;
  });

  private qualificationById = computed(() => {
    const map = new Map<string, string>();
    for (const q of this.dm.getQualifications()) map.set(this.norm(q.id), q.name);
    return map;
  });

  private workAreaById = computed(() => {
    const map = new Map<string, string>();
    for (const w of this.dm.getWorkAreas()) map.set(this.norm(w.id), w.name);
    return map;
  });

  // ========== Public: single lookup ==========
  getBranchName(value?: string | null): string {
    const key = this.norm(value);
    if (!key) return '';
    // coba urut: cocok id → branch_id
    return (
      this.branchById().get(key) ??
      this.branchByBranchId().get(key) ??
      ''
    );
  }

  getCompanyName(id?: string | null): string {
    const key = this.norm(id);
    if (!key) return '';
    return this.companyById().get(key) ?? '';
  }

  getJobLevelName(id?: string | null): string {
    const key = this.norm(id);
    if (!key) return '';
    return this.jobLevelById().get(key) ?? '';
  }

  getOrganizationName(value?: string | null): string {
    const key = this.norm(value);
    if (!key) return '';
    // coba id → organization_id
    return (
      this.organizationById().get(key) ??
      this.organizationByOrgId().get(key) ??
      ''
    );
  }

  getQualificationName(id?: string | null): string {
    const key = this.norm(id);
    if (!key) return '';
    return this.qualificationById().get(key) ?? '';
  }

  getWorkAreaName(id?: string | null): string {
    const key = this.norm(id);
    if (!key) return '';
    return this.workAreaById().get(key) ?? '';
  }

  // ========== Public: enrich seluruh auth user ==========
  /** Menghasilkan objek baru berisi tambahan field *Name dari master. */
  enrichAuthUser(user: AuthUser) {
    return {
      ...user,
      branchName: this.getBranchName(user.branch),
      companyName: this.getCompanyName(user.company),
      jobLevelName: this.getJobLevelName(user.job_level),
      organizationName: this.getOrganizationName(user.organization),
      qualificationName: this.getQualificationName(user.qualification),
      workAreaName: this.getWorkAreaName(user.work_area),
    };
  }
}
