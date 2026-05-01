import { Directive, ElementRef, Renderer2, OnInit, PLATFORM_ID, input, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DestroyRef } from '@angular/core';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit {
  /** Sensibilidade de entrada em tela. Padrão 0.15 (15% visível). Configurável via input. */
  threshold = input<number>(0.15);

  // Injeção moderna funcional — elimina @Inject(PLATFORM_ID) e constructor verboso
  private readonly el         = inject(ElementRef);
  private readonly renderer   = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.renderer.addClass(this.el.nativeElement, 'is-visible');
              this.observer?.unobserve(this.el.nativeElement);
            }
          });
        },
        { root: null, rootMargin: '0px', threshold: this.threshold() }
      );

      this.observer.observe(this.el.nativeElement);

      // DestroyRef substitui ngOnDestroy — sem necessidade de implementar OnDestroy
      this.destroyRef.onDestroy(() => this.observer?.disconnect());
    } else {
      // Fallback SSR/Sem-suporte: torna elemento visível imediatamente
      this.renderer.addClass(this.el.nativeElement, 'is-visible');
    }
  }
}
