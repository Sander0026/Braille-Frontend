import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';
import { DashboardService } from './dashboard.service';

export interface GradeHorariaDto {
    dia: 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM';
    horaInicio: number; // minutos desde meia-noite
    horaFim: number;
}

export type TurmaStatus = 'PREVISTA' | 'ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
export type MatriculaStatus = 'ATIVA' | 'CONCLUIDA' | 'EVADIDA' | 'CANCELADA' | 'TRANSFERIDA';
export type StatusEncerramentoMatricula = Exclude<MatriculaStatus, 'ATIVA'>;
export type MotivoEncerramentoMatricula =
    | 'CONCLUSAO'
    | 'EVASAO_SEM_JUSTIFICATIVA'
    | 'MUDANCA_DE_TURNO'
    | 'TRANSFERENCIA_DE_TURMA'
    | 'MUDANCA_DE_CIDADE'
    | 'DIFICULDADE_TRANSPORTE'
    | 'PROBLEMA_SAUDE'
    | 'PROBLEMA_FAMILIAR'
    | 'INCOMPATIBILIDADE_HORARIO'
    | 'FALTA_DE_CONTATO'
    | 'DESISTENCIA_VOLUNTARIA'
    | 'CANCELAMENTO_DA_TURMA'
    | 'OUTRO';

export interface AlunoMatriculadoResumo {
    id: string;
    nomeCompleto: string;
    matricula?: string;
}

export interface MatriculaOficinaResumo {
    id: string;
    status: MatriculaStatus;
    dataEntrada: string;
    dataEncerramento?: string | null;
    motivoEncerramento?: MotivoEncerramentoMatricula | null;
    observacao?: string | null;
    encerradoPorId?: string | null;
    encerradoEm?: string | null;
    aluno: AlunoMatriculadoResumo;
}

export interface EncerrarMatriculaDto {
    status: StatusEncerramentoMatricula;
    motivoEncerramento: MotivoEncerramentoMatricula;
    observacao?: string;
    dataEncerramento?: string;
}

/**
 * Representa uma turma/oficina do Instituto Luiz Braille.
 *
 * ## Diferenca entre `status` e `statusAtivo`
 *
 * | Campo        | Tipo          | Semantica                                                                 |
 * |--------------|---------------|---------------------------------------------------------------------------|
 * | `status`     | `TurmaStatus` | Progresso pedagogico: PREVISTA -> ANDAMENTO -> CONCLUIDA -> CANCELADA.   |
 * | `statusAtivo`| `boolean`     | Visibilidade administrativa: true = aba Ativas; false = Arquivadas.      |
 * | `excluido`   | `boolean`     | Soft-delete: true = oculto de todas as abas. Historico preservado.       |
 *
 * Uma turma pode ter status='CONCLUIDA' e statusAtivo=true simultaneamente.
 * Os dois campos sao INDEPENDENTES entre si.
 */
export interface Turma {
    id: string;
    nome: string;
    descricao?: string;
    horario?: string;
    capacidadeMaxima?: number;
    cargaHoraria?: string;
    dataInicio?: string;
    dataFim?: string;
    statusAtivo: boolean;
    excluido: boolean;
    status: TurmaStatus;         
    professor?: { id: string; nome: string; email: string };
    gradeHoraria?: GradeHorariaDto[];
    matriculasOficina?: MatriculaOficinaResumo[];
    _count?: { matriculasOficina: number };
}

export interface CreateTurmaDto {
    nome: string;
    descricao?: string;
    horario?: string;
    capacidadeMaxima?: number;
    professorId: string;
    gradeHoraria?: GradeHorariaDto[];
    dataInicio?: string;
    dataFim?: string;
    cargaHoraria?: string;
    modeloCertificadoId?: string;
}

@Injectable({ providedIn: 'root' })
export class TurmasService {
    private readonly url = '/api/turmas';

    constructor(
        private readonly http: HttpClient,
        private readonly dashboardService: DashboardService
    ) { }

    listar(page = 1, limit = 10, nome?: string, statusAtivo?: boolean | 'all', professorId?: string, status?: string, excluido?: boolean | 'all'): Observable<PaginatedResponse<Turma>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (excluido !== undefined && excluido !== 'all') params = params.set('excluido', String(excluido));
        else if (excluido === 'all') params = params.set('excluido', 'all');
        else params = params.set('excluido', 'false');
        
        if (nome) params = params.set('nome', nome);
        if (statusAtivo !== undefined && statusAtivo !== 'all') params = params.set('statusAtivo', String(statusAtivo));
        else if (statusAtivo === 'all') params = params.set('statusAtivo', 'all');
        if (professorId) params = params.set('professorId', professorId);
        if (status) params = params.set('status', status);

        const headers = new HttpHeaders({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        return this.http.get<PaginatedResponse<Turma>>(this.url, { params, headers });
    }

    listarProfessoresAtivos(): Observable<{ id: string; nome: string; role?: string }[]> {
        return this.http.get<{ id: string; nome: string; role?: string }[]>(`${this.url}/professores-ativos`);
    }

    buscarPorId(id: string): Observable<Turma> {
        return this.http.get<Turma>(`${this.url}/${id}`);
    }

    alunosDisponiveis(turmaId: string, nome?: string): Observable<{ id: string; nomeCompleto: string; matricula: string | null }[]> {
        let params = new HttpParams();
        if (nome?.trim()) params = params.set('nome', nome.trim());
        return this.http.get<{ id: string; nomeCompleto: string; matricula: string | null }[]>(
            `${this.url}/${turmaId}/alunos-disponiveis`, { params }
        );
    }

    criar(dados: CreateTurmaDto): Observable<Turma> {
        this.dashboardService.limparCache();
        return this.http.post<Turma>(this.url, dados);
    }

    atualizar(id: string, dados: Partial<CreateTurmaDto>): Observable<Turma> {
        this.dashboardService.limparCache();
        return this.http.patch<Turma>(`${this.url}/${id}`, dados);
    }

    arquivar(id: string): Observable<Turma> {
        this.dashboardService.limparCache();
        return this.http.delete<Turma>(`${this.url}/${id}`);
    }

    excluir(id: string): Observable<Turma> {
        return this.arquivar(id);
    }

    restaurar(id: string): Observable<Turma> {
        this.dashboardService.limparCache();
        return this.http.patch<Turma>(`${this.url}/${id}/restaurar`, {});
    }

    ocultarDaAba(id: string): Observable<Turma> {
        this.dashboardService.limparCache();
        return this.http.patch<Turma>(`${this.url}/${id}/ocultar`, {});
    }

    matricularAluno(turmaId: string, alunoId: string): Observable<any> {
        this.dashboardService.limparCache();
        return this.http.post(`${this.url}/${turmaId}/alunos/${alunoId}`, {});
    }

    encerrarMatriculaAluno(turmaId: string, alunoId: string, dados: EncerrarMatriculaDto): Observable<MatriculaOficinaResumo> {
        this.dashboardService.limparCache();
        return this.http.patch<MatriculaOficinaResumo>(`${this.url}/${turmaId}/alunos/${alunoId}/encerrar`, dados);
    }

    mudarStatus(id: string, status: TurmaStatus): Observable<{ id: string; nome: string; status: TurmaStatus; statusAtivo: boolean }> {
        this.dashboardService.limparCache();
        return this.http.patch<{ id: string; nome: string; status: TurmaStatus; statusAtivo: boolean }>(`${this.url}/${id}/status`, { status });
    }

    cancelar(id: string): Observable<Turma> {
        this.dashboardService.limparCache();
        return this.http.patch<Turma>(`${this.url}/${id}/cancelar`, {});
    }

    concluir(id: string): Observable<Turma> {
        this.dashboardService.limparCache();
        return this.http.patch<Turma>(`${this.url}/${id}/concluir`, {});
    }
}
