import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { AuditLogService, AuditLog, AuditStats, AuditAcao, QueryAuditDto, defaultAuditStats } from '../../../../core/services/audit-log.service';

import { AuditStatsComponent } from '../components/audit-stats/audit-stats.component';
import { AuditModalDetalhesComponent } from '../components/audit-modal-detalhes/audit-modal-detalhes.component';
import { AuditFriendlyPipe } from '../../../../shared/pipes/audit-friendly.pipe';

@Component({
    selector: 'app-audit-log-lista',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, A11yModule, AuditStatsComponent, AuditModalDetalhesComponent, AuditFriendlyPipe],
    templateUrl: './audit-log-lista.html',
    styleUrl: './audit-log-lista.scss',
})
export class AuditLogLista implements OnInit, OnDestroy {

    // ── Estado principal ───────────────────────────────────────
    logs: AuditLog[] = [];
    isLoading = true;
    erro = '';
    total = 0;
    pagina = 1;
    readonly limit = 20;

    // ── Stats ──────────────────────────────────────────────────
    stats: AuditStats | null = null;

    // ── Filtros ────────────────────────────────────────────────
    filtroEntidade = '';
    filtroAcao = '';
    filtroAutorId = '';
    filtroDe = '';
    filtroAte = '';

    // ── Modal detalhes ──────────────────────────────────────────
    modalAberto = signal<boolean>(false);
    logSelecionado = signal<AuditLog | null>(null);

    private readonly destroy$ = new Subject<void>();
    private readonly announcer = inject(LiveAnnouncer);

    readonly acoes: AuditAcao[] = [
        'CRIAR', 'ATUALIZAR', 'EXCLUIR', 'ARQUIVAR', 'RESTAURAR',
        'LOGIN', 'LOGOUT', 'MATRICULAR', 'DESMATRICULAR',
        'FECHAR_DIARIO', 'REABRIR_DIARIO', 'MUDAR_STATUS',
    ];

    readonly acaoCor: Record<string, string> = {
        CRIAR: 'badge-criar',
        ATUALIZAR: 'badge-atualizar',
        EXCLUIR: 'badge-excluir',
        ARQUIVAR: 'badge-arquivar',
        RESTAURAR: 'badge-restaurar',
        LOGIN: 'badge-login',
        LOGOUT: 'badge-logout',
        MATRICULAR: 'badge-matricular',
        DESMATRICULAR: 'badge-desmatricular',
        FECHAR_DIARIO: 'badge-fechar',
        REABRIR_DIARIO: 'badge-reabrir',
        MUDAR_STATUS: 'badge-status',
    };

    constructor(
        private readonly auditService: AuditLogService,
        private readonly cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.carregarStats();
        this.carregarLogs();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    carregarStats(): void {
        this.auditService.stats()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                // ✅ Merge com defaults: garante que topAcoes nunca seja undefined
                next: (s) => {
                    this.stats = { ...defaultAuditStats(), ...s, topAcoes: s?.topAcoes ?? [] };
                    this.cdr.markForCheck();
                },
                error: () => { /* stats não crítico — silencia sem expor detalhes ao usuário */ },
            });
    }

    carregarLogs(pagina = 1): void {
        this.isLoading = true;
        this.pagina = pagina;
        this.erro = '';

        const q: QueryAuditDto = {
            page: pagina,
            limit: this.limit,
        };
        if (this.filtroEntidade) q.entidade = this.filtroEntidade;
        if (this.filtroAcao) q.acao = this.filtroAcao as AuditAcao;
        if (this.filtroAutorId) q.autorId = this.filtroAutorId;
        if (this.filtroDe) q.de = this.filtroDe;
        if (this.filtroAte) q.ate = this.filtroAte;

        this.auditService.listar(q)
            .pipe(
                takeUntil(this.destroy$),
                // ✅ Normaliza o contrato ANTES do subscribe: garante que data é sempre Array real
                // Isso protege contra re-emissão do cache shareReplay que pode devolver objeto sem Symbol.iterator
                map(res => ({
                    data:  Array.isArray(res?.data) ? res.data : [],
                    total: res?.meta?.total ?? 0,
                })),
            )
            .subscribe({
                next: ({ data, total }) => {
                    this.logs  = data;
                    this.total = total;
                    this.isLoading = false;
                    this.announcer.announce(`Exibindo ${data.length} de ${total} registros de auditoria, página ${this.pagina}.`, 'polite');
                    this.cdr.markForCheck();
                },
                error: (err: { error?: { message?: string } }) => {
                    // ✅ Nunca expõe stack trace — apenas mensagem segura (OWASP A3)
                    this.erro = err.error?.message ?? 'Erro ao carregar logs de auditoria.';
                    this.announcer.announce(this.erro, 'assertive');
                    this.isLoading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    aplicarFiltros(): void { 
      this.announcer.announce('Aplicando filtros de auditoria...', 'polite');
      this.carregarLogs(1); 
    }
    
    limparFiltros(): void {
        this.filtroEntidade = '';
        this.filtroAcao = '';
        this.filtroAutorId = '';
        this.filtroDe = '';
        this.filtroAte = '';
        this.announcer.announce('Filtros de auditoria limpos. Trazendo carga geral.', 'polite');
        this.carregarLogs(1);
    }

    abrirDetalhes(log: AuditLog): void {
        this.logSelecionado.set(log);
        this.modalAberto.set(true);
    }
    
    fecharDetalhes(): void {
        this.modalAberto.set(false);
        this.logSelecionado.set(null);
    }

    // ── Paginação ──────────────────────────────────────────────
    get totalPaginas(): number { return Math.ceil(this.total / this.limit); }
    irParaPagina(pagina: number): void {
        if (pagina < 1 || pagina > this.totalPaginas) return;
        this.pagina = pagina;
        this.carregarLogs(this.pagina);
    }

    get paginasVisiveis(): number[] {
        const total = this.totalPaginas;
        const atual = this.pagina;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

        const janela = 2; // páginas de cada lado
        const inicio = Math.max(2, atual - janela);
        const fim = Math.min(total - 1, atual + janela);

        const paginas: number[] = [1];
        if (inicio > 2) paginas.push(-1); // reticências
        for (let p = inicio; p <= fim; p++) paginas.push(p);
        if (fim < total - 1) paginas.push(-1); // reticências
        paginas.push(total);
        return paginas;
    }

    // ── Utilitários ────────────────────────────────────────────
    formatarData(iso: string): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    trackById(_: number, item: AuditLog): string { return item.id; }
}
