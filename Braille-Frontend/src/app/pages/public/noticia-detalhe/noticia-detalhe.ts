import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { ComunicadosService, Comunicado } from '../../../core/services/comunicados.service';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';

@Component({
    selector: 'app-noticia-detalhe',
    imports: [CommonModule, DatePipe, SafeHtmlPipe, CloudinaryPipe],
    templateUrl: './noticia-detalhe.html',
    styleUrl: './noticia-detalhe.scss',
})
export class NoticiaDetalhe implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    noticia: Comunicado | null = null;
    carregando = true;
    erro: string | null = null;

    readonly labelCategoria: Record<string, string> = {
        NOTICIA: 'Notícia',
        VAGA_EMPREGO: 'Vaga de Emprego',
        SERVICO: 'Serviço',
        EVENTO_CULTURAL: 'Evento Cultural',
        LEGISLACAO: 'Legislação',
        TRABALHO_PCD: 'Trabalho PcD',
        AVISO: 'Aviso',
    };

    constructor(
        private route: ActivatedRoute,
        private comunicadosService: ComunicadosService,
        private sanitizer: DomSanitizer,
        private titleService: Title,
        private metaService: Meta,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                const id = params.get('id');
                if (id) {
                    this.carregarNoticia(id);
                } else {
                    this.erro = 'Notícia não encontrada.';
                    this.carregando = false;
                }
            });
    }

    private carregarNoticia(id: string): void {
        this.carregando = true;
        this.erro = null;
        this.noticia = null;
        this.cdr.detectChanges();

        this.comunicadosService.buscarPorId(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (noticia) => {
                    // Atualiza TUDO de uma só vez para o Angular sincronizar
                    this.noticia = noticia;
                    this.carregando = false;

                    // Força o ciclo de detecção para garantir que o withFetch() não "pule" a atualização
                    this.cdr.markForCheck();
                    this.cdr.detectChanges();

                    // SEO: atualiza title/meta depois da renderização
                    this.titleService.setTitle(`${noticia.titulo} — Instituto Luiz Braille`);
                    this.metaService.updateTag({ name: 'description', content: this.extrairTexto(noticia.conteudo, 160) });
                    if (noticia.imagemCapa) {
                        this.metaService.updateTag({ property: 'og:image', content: noticia.imagemCapa });
                    }
                },
                error: () => {
                    this.erro = 'Não foi possível carregar essa notícia. Ela pode ter sido removida.';
                    this.carregando = false;
                    this.titleService.setTitle('Notícia não encontrada — Instituto Luiz Braille');
                    this.cdr.markForCheck();
                    this.cdr.detectChanges();
                }
            });
    }

    getLabelCategoria(categoria: string): string {
        return this.labelCategoria[categoria] ?? categoria;
    }

    /** Extrai texto puro do HTML (Quill usa HTML serializado) */
    private extrairTexto(html: string, limite: number): string {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const texto = tmp.textContent || tmp.innerText || '';
        return texto.length > limite ? texto.slice(0, limite) + '…' : texto;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
