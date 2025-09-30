// src/app/shared/directives/tooltip.directive.ts
import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  // === Tambahan: singleton tracking ===
  private static currentlyOpen: TooltipDirective | null = null;

  @Input('appTooltip') text: string = '';
  @Input() tooltipPos: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipMaxWidth = 260;
  @Input() tooltipDelay = 0; // klik-only; tak dipakai

  private tooltipEl?: HTMLElement;
  private offDocClick?: () => void;
  private offEsc?: () => void;

  constructor(private host: ElementRef<HTMLElement>, private r: Renderer2) {}

  ngOnDestroy(): void {
    this.destroyTooltip();
  }

  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    if (!this.text) return;
    e.stopPropagation();

    // Toggle sendiri
    if (this.tooltipEl) {
      this.destroyTooltip();
      return;
    }

    // === KUNCI: pastikan hanya 1 yang terbuka ===
    if (TooltipDirective.currentlyOpen && TooltipDirective.currentlyOpen !== this) {
      TooltipDirective.currentlyOpen.destroyTooltip();
    }

    this.show();
    TooltipDirective.currentlyOpen = this;

    // Tutup saat klik di luar / Esc
    this.offDocClick = this.r.listen('document', 'click', () => this.destroyTooltip());
    this.offEsc = this.r.listen('document', 'keydown', (ke: KeyboardEvent) => {
      if (ke.key === 'Escape') this.destroyTooltip();
    });
  }

  private show() {
    this.destroyTooltip(); // safety

    const el = this.r.createElement('div') as HTMLDivElement;
    this.tooltipEl = el;

    // Styling ringkas
    this.r.setStyle(el, 'position', 'fixed');
    this.r.setStyle(el, 'zIndex', '99999');
    this.r.setStyle(el, 'background', '#111827');
    this.r.setStyle(el, 'color', '#fff');
    this.r.setStyle(el, 'padding', '8px 10px');
    this.r.setStyle(el, 'borderRadius', '8px');
    this.r.setStyle(el, 'boxShadow', '0 10px 20px rgba(0,0,0,.18)');
    this.r.setStyle(el, 'fontSize', '12px');
    this.r.setStyle(el, 'lineHeight', '1.35');
    this.r.setStyle(el, 'maxWidth', `${this.tooltipMaxWidth}px`);
    this.r.setStyle(el, 'pointerEvents', 'none');
    this.r.setStyle(el, 'transition', 'opacity .12s ease');
    this.r.setStyle(el, 'opacity', '0');

    el.innerText = this.text;
    this.r.appendChild(document.body, el);

    // Posisi
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    const tipRect = el.getBoundingClientRect();
    let top = 0, left = 0, gap = 8;

    switch (this.tooltipPos) {
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + (hostRect.width - tipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tipRect.height) / 2;
        left = hostRect.left - tipRect.width - gap;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tipRect.height) / 2;
        left = hostRect.right + gap;
        break;
      default: // top
        top = hostRect.top - tipRect.height - gap;
        left = hostRect.left + (hostRect.width - tipRect.width) / 2;
    }

    // Clamp viewport
    const vw = window.innerWidth, vh = window.innerHeight;
    left = Math.max(8, Math.min(left, vw - tipRect.width - 8));
    top  = Math.max(8, Math.min(top,  vh - tipRect.height - 8));

    this.r.setStyle(el, 'left', `${left}px`);
    this.r.setStyle(el, 'top',  `${top}px`);
    requestAnimationFrame(() => this.r.setStyle(el, 'opacity', '1'));
  }

  private destroyTooltip() {
    if (this.tooltipEl) {
      this.r.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = undefined;
    }
    if (this.offDocClick) { this.offDocClick(); this.offDocClick = undefined; }
    if (this.offEsc) { this.offEsc(); this.offEsc = undefined; }

    // Bersihkan singleton bila ini yang aktif
    if (TooltipDirective.currentlyOpen === this) {
      TooltipDirective.currentlyOpen = null;
    }
  }
}
