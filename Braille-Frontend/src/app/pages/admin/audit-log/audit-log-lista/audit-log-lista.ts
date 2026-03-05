import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLog, AuditStats, AuditAcao, QueryAuditDto } from '../../../../core/services/audit-log.service';

@Component({
    selector: 'app-audit-log-lista',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule],
    templateUrl: './audit-log-lista.html',
    styleUrl: './audit-log-lista.scss',
})
export class AuditLogLista implements OnInit {

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
    logSelecionado: AuditLog | null = null;

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
        private auditService: AuditLogService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.carregarStats();
        this.carregarLogs();
    }

    carregarStats(): void {
        this.auditService.stats().subscribe({
            next: (s) => { this.stats = s; this.cdr.markForCheck(); },
            error: () => { /* stats não crítico */ },
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

        this.auditService.listar(q).subscribe({
            next: (res) => {
                this.logs = res.data;
                this.total = res.meta.total;
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.erro = err.error?.message ?? 'Erro ao carregar logs.';
                this.isLoading = false;
                this.cdr.markForCheck();
            },
        });
    }

    aplicarFiltros(): void { this.carregarLogs(1); }
    limparFiltros(): void {
        this.filtroEntidade = '';
        this.filtroAcao = '';
        this.filtroAutorId = '';
        this.filtroDe = '';
        this.filtroAte = '';
        this.carregarLogs(1);
    }

    abrirDetalhes(log: AuditLog): void {
        this.logSelecionado = log;
        this.cdr.markForCheck();
    }
    fecharDetalhes(): void {
        this.logSelecionado = null;
        this.cdr.markForCheck();
    }

    // ── Paginação ──────────────────────────────────────────────
    get totalPaginas(): number { return Math.ceil(this.total / this.limit); }
    anterior(): void { if (this.pagina > 1) this.carregarLogs(this.pagina - 1); }
    proximo(): void { if (this.pagina < this.totalPaginas) this.carregarLogs(this.pagina + 1); }

    // ── Utilitários ────────────────────────────────────────────
    formatarData(iso: string): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    jsonPretty(val: any): string {
        if (!val) return '—';
        try { return JSON.stringify(val, null, 2); }
        catch { return String(val); }
    }

    trackById(_: number, item: AuditLog): string { return item.id; }
}
