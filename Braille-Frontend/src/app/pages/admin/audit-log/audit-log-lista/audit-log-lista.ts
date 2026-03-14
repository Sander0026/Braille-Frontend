import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLog, AuditStats, AuditAcao, QueryAuditDto } from '../../../../core/services/audit-log.service';

@Component({
    selector: 'app-audit-log-lista',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, A11yModule],
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

    // ── Humanização do Log ─────────────────────────────────────
    diferencas: { campo: string, de: string, para: string, alterado: boolean }[] = [];

    private dicionarioCampos: Record<string, string> = {
        'presente': 'Presença',
        'dataAula': 'Data da Aula',
        'fechado': 'Diário Fechado',
        'fechadoEm': 'Data de Fechamento',
        'fechadoPor': 'Fechado por',
        'observacao': 'Observação',
        'nome': 'Nome',
        'nomeCompleto': 'Nome Completo',
        'dataNascimento': 'Data de Nascimento',
        'email': 'E-mail',
        'telefone': 'Telefone',
        'status': 'Situação',
        'cpf': 'CPF',
        'rg': 'RG',
    };

    private camposIgnorados = ['id', 'alunoId', 'turmaId', 'criadoEm', 'atualizadoEm', 'senhaHash', 'professorId'];

    private formatarValorAmigavel(chave: string, valor: any): string {
        if (valor === null || valor === undefined) return '—';
        if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
        if (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            // Se for string de data ISO
            const d = new Date(valor);
            if (chave.toLowerCase().includes('data')) {
                // Se for data pura (ex: dataAula) mostra só a data se a hora for meia noite no UTC
                if (valor.includes('T00:00:00')) return d.toLocaleDateString('pt-BR');
            }
            return d.toLocaleString('pt-BR');
        }
        if (valor === '') return 'Vazio';
        return String(valor);
    }

    private gerarDiferencas(oldVal: any, newVal: any): void {
        this.diferencas = [];
        const oldObj = oldVal || {};
        const newObj = newVal || {};

        // Pegar todas as chaves (união das antigas e novas)
        const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

        for (const key of allKeys) {
            if (this.camposIgnorados.includes(key)) continue;

            const valAntigo = oldObj[key];
            const valNovo = newObj[key];

            // Se for CRIAR e o valor for null/vazio, pula pra não poluir.
            if (!oldVal && (valNovo === null || valNovo === undefined || valNovo === '')) continue;

            // Removido: as regras antigamente escondiam campos inalterados. 
            // Agora, a pedido, manteremos todos visíveis na UI (onde será marcado como 'Mantido').
            // if (valAntigo === valNovo && oldVal && newVal) continue;

            const labelAmigavel = this.dicionarioCampos[key] || key.charAt(0).toUpperCase() + key.slice(1);
            const strAntigo = this.formatarValorAmigavel(key, valAntigo);
            const strNovo = this.formatarValorAmigavel(key, valNovo);

            this.diferencas.push({
                campo: labelAmigavel,
                de: strAntigo,
                para: strNovo,
                alterado: (strAntigo !== strNovo)
            });
        }
    }

    abrirDetalhes(log: AuditLog): void {
        this.logSelecionado = log;
        this.gerarDiferencas(log.oldValue, log.newValue);
        this.cdr.markForCheck();
    }
    fecharDetalhes(): void {
        this.logSelecionado = null;
        this.diferencas = [];
        this.cdr.markForCheck();
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
