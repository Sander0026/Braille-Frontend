import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComunicadosService, Comunicado } from '../../../core/services/comunicados.service';

// Pipes reutilizáveis (DRY Application)
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';
import { CategoryLabelPipe } from '../../../shared/pipes/category-label.pipe';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';

@Component({
    selector: 'app-noticia-detalhe',
    standalone: true,
    imports: [CommonModule, DatePipe, SafeHtmlPipe, CloudinaryPipe, CategoryLabelPipe],
    templateUrl: './noticia-detalhe.html',
    styleUrl: './noticia-detalhe.scss',
    changeDetection: ChangeDetectionStrategy.OnPush // Aceleração Severa de Performance DevSecOps
})
export class NoticiaDetalhe implements OnInit {
    
    // Estado Reativo Puro
    noticia = signal<Comunicado | null>(null);
    carregando = signal<boolean>(true);
    erro = signal<string | null>(null);

    constructor(
        private route: ActivatedRoute,
        private comunicadosService: ComunicadosService,
        private titleService: Title,
        private metaService: Meta
    ) {
        // Enjaulamento Anti-Leak Integrado ao Router Change
        this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.carregarNoticia(id);
            } else {
                this.erro.set('Notícia não encontrada.');
                this.carregando.set(false);
            }
        });
    }

    ngOnInit(): void { }

    private carregarNoticia(id: string): void {
        this.carregando.set(true);
        this.erro.set(null);
        this.noticia.set(null);

        this.comunicadosService.buscarPorId(id)
            .pipe(takeUntilDestroyed())
            .subscribe({
                next: (res) => {
                    this.noticia.set(res);
                    this.carregando.set(false);

                    // Atualização Segura OnPush garantida
                    this.titleService.setTitle(`${res.titulo} — Instituto Luiz Braille`);

                    // Pipeline Isolado reutilizando Extrator já existente na arquitetura (StripHtmlPipe instance manual temporária)
                    const descSafe = new StripHtmlPipe().transform(res.conteudo);
                    const safeLimit = descSafe.length > 160 ? descSafe.slice(0, 160) + '…' : descSafe;
                    this.metaService.updateTag({ name: 'description', content: safeLimit });
                    
                    if (res.imagemCapa) {
                        this.metaService.updateTag({ property: 'og:image', content: res.imagemCapa });
                    }
                },
                error: () => {
                    // Silenciamento de Erros e Defensiva Total (sem devolução do stack).
                    this.erro.set('Não foi possível carregar essa notícia. Ela pode ter sido removida temporariamente.');
                    this.carregando.set(false);
                    this.titleService.setTitle('Notícia não encontrada — Instituto Luiz Braille');
                }
            });
    }

    // Funcões getLabelCategoria e extrairTexto foram CORTADAS por estarem violando DRY!
    // Ambas transferidas para seus Pipes nativos (CategoryLabel e StripHtml).
}
