import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ComunicadosService, Comunicado } from '../../../../core/services/comunicados.service';
import { SafeHtmlPipe } from '../../../../core/pipes/safe-html.pipe';
import { CloudinaryPipe } from '../../../../core/pipes/cloudinary.pipe';
import { CategoryLabelPipe } from '../../../../shared/pipes/category-label.pipe';
import { StripHtmlPipe } from '../../../../shared/pipes/strip-html.pipe';

@Component({
  selector: 'app-noticia-detalhe',
  standalone: true,
  imports: [CommonModule, DatePipe, SafeHtmlPipe, CloudinaryPipe, CategoryLabelPipe],
  templateUrl: './noticia-detalhe.html',
  styleUrl: './noticia-detalhe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticiaDetalhe {

  // ── DI via inject() — campo-level = injection context válido ─────────────────
  private readonly route               = inject(ActivatedRoute);
  private readonly comunicadosService  = inject(ComunicadosService);
  private readonly titleService        = inject(Title);
  private readonly metaService         = inject(Meta);
  private readonly destroyRef          = inject(DestroyRef);

  // ── Estado reativo ────────────────────────────────────────────────────────────
  noticia    = signal<Comunicado | null>(null);
  carregando = signal<boolean>(true);
  erro       = signal<string | null>(null);

  constructor() {
    /**
     * takeUntilDestroyed() SEM argumento é válido AQUI: estamos dentro do
     * constructor, que é um injection context ativo no Angular.
     * Assim que o componente for destruído, o router observable é cancelado
     * automaticamente — zero memory leak.
     */
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.carregarNoticia(id);
        } else {
          this.erro.set('Notícia não encontrada.');
          this.carregando.set(false);
        }
      });
  }

  private carregarNoticia(id: string): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.noticia.set(null);

    /**
     * CORREÇÃO NG0203: carregarNoticia() é um método regular —
     * NÃO está dentro do injection context.
     * Solução: passar this.destroyRef explicitamente.
     */
    this.comunicadosService.buscarPorId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.noticia.set(res);
          this.carregando.set(false);

          this.titleService.setTitle(`${res.titulo} — Instituto Luiz Braille`);

          // DRY: reutiliza StripHtmlPipe para gerar meta description sem XSS
          const descBruta = new StripHtmlPipe().transform(res.conteudo);
          const descSafe  = descBruta.length > 160 ? `${descBruta.slice(0, 160)}…` : descBruta;
          this.metaService.updateTag({ name: 'description', content: descSafe });

          if (res.imagemCapa) {
            this.metaService.updateTag({ property: 'og:image', content: res.imagemCapa });
          }
        },
        error: () => {
          // Silencia stack trace nativos (OWASP A05 - Security Misconfiguration)
          this.erro.set('Não foi possível carregar essa notícia. Ela pode ter sido removida temporariamente.');
          this.carregando.set(false);
          this.titleService.setTitle('Notícia não encontrada — Instituto Luiz Braille');
        },
      });
  }
}
