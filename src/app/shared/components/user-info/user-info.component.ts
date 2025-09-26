import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  inject,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataMasterService } from '../../../core/services/data-master.service';
import { MasterLookupService } from '../../../core/services/master-lookup.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserInfoComponent implements OnInit, AfterViewInit, OnDestroy {
  // ====== Services ======
  private dm = inject(DataMasterService);
  private ml = inject(MasterLookupService);

  // ====== View Refs (untuk bubble manual) ======
  /** Anchor container untuk avatar + bubble di mobile (pastikan ada #avatarAnchor di HTML) */
  @ViewChild('avatarAnchor', { static: false })
  avatarAnchor!: ElementRef<HTMLDivElement>;

  // ====== UI State (Signals) ======
  popoverOpen = signal<boolean>(false);

  full_name = signal<string>('');
  photo_profile_path = signal<string>('');

  work_area_id = signal<string>('');
  organization_id = signal<string>('');
  job_level_id = signal<string>('');
  company_id = signal<string>('');
  branch_id_raw = signal<string>('');
  qualification_id_raw = signal<string>('');

  work_area_name = signal<string>('');
  organization_name = signal<string>('');
  job_level_name = signal<string>('');
  company_name = signal<string>('');
  branch_name = signal<string>('');
  qualification_name = signal<string>('');

  // ====== Lifecycle ======
  async ngOnInit() {
    await this.dm.ensureLoaded();
    this.loadUserFromStorage();
  }

  ngAfterViewInit(): void {
    // Tidak perlu inisialisasi apa pun; bubble dibuat via *ngIf/@if dari signal
  }

  ngOnDestroy(): void {
    // Tidak ada resource eksternal; aman
  }

  // ====== Public handlers (dipakai di template) ======
  togglePopover(ev: MouseEvent) {
    ev.stopPropagation();
    this.popoverOpen.update((v) => !v);
  }

  closePopover() {
    this.popoverOpen.set(false);
  }

  // Tutup saat klik di luar anchor/bubble
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const host = this.avatarAnchor?.nativeElement;
    if (!host) return;
    if (!host.contains(ev.target as Node)) {
      this.closePopover();
    }
  }

  // Tutup saat tekan Escape
  @HostListener('document:keydown.escape')
  onEsc() {
    this.closePopover();
  }

  // Opsional: Tutup saat resize ke desktop untuk menghindari bubble nyangkut
  @HostListener('window:resize')
  onResize() {
    // Jika kamu pakai breakpoint 768px sebagai batas mobile/desktop:
    if (window.innerWidth >= 768 && this.popoverOpen()) {
      this.closePopover();
    }
  }

  // ====== Helpers ======
  private loadUserFromStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('auth.user');
      if (!raw) return;

      const p: any = JSON.parse(raw);
      // fleksibel: bisa {data:[...]} atau array langsung atau object
      const u = Array.isArray(p?.data) ? p.data[0] : Array.isArray(p) ? p[0] : p;
      if (!u) return;

      this.full_name.set(u?.full_name ?? u?.alias_name ?? '');
      this.photo_profile_path.set(u?.photo_profile_path ?? '');

      this.work_area_id.set(u?.work_area ?? '');
      this.organization_id.set(u?.organization ?? '');
      this.job_level_id.set(u?.job_level ?? '');
      this.company_id.set(u?.company ?? '');
      this.branch_id_raw.set(u?.branch ?? '');
      this.qualification_id_raw.set(u?.qualification ?? '');

      // Lookup nama dari master
      this.work_area_name.set(this.ml.getWorkAreaName(this.work_area_id()));
      this.organization_name.set(this.ml.getOrganizationName(this.organization_id()));
      this.job_level_name.set(this.ml.getJobLevelName(this.job_level_id()));
      this.company_name.set(this.ml.getCompanyName(this.company_id()));
      this.branch_name.set(this.ml.getBranchName(this.branch_id_raw()));
      this.qualification_name.set(this.ml.getQualificationName(this.qualification_id_raw()));
    } catch {
      // ignore parse error
    }
  }
}
