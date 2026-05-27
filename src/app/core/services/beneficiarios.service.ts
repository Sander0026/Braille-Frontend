import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { StorageService } from './storage.service';

export interface Beneficiario {
    id: string;
    nomeCompleto: string;
    cpf: string | null;
  rg: string | null;
    dataNascimento: string;
    genero?: string;
    corRaca?: string;
    estadoCivil?: string;
    telefoneContato?: string;
    email?: string;
    fotoPerfil?: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    pontoReferencia?: string;
    tipoDeficiencia?: string;
    causaDeficiencia?: string;
    idadeOcorrencia?: string;
    laudoUrl?: string;
    termoLgpdUrl?: string;
    termoLgpdAceito?: boolean;
    termoLgpdAceitoEm?: string;
    tecAssistivas?: string;
    prefAcessibilidade?: string;
    escolaridade?: string;
    profissao?: string;
    rendaFamiliar?: string;
    beneficiosGov?: string;
    composicaoFamiliar?: string;
    precisaAcompanhante?: boolean;
    acompOftalmologico?: boolean;
    outrasComorbidades?: string;
    contatoEmergencia?: string;
    statusAtivo: boolean;
    motivoInativacao?: MotivoInativacaoAluno | null;
    observacaoInativacao?: string | null;
    inativadoEm?: string | null;
    inativadoPorId?: string | null;
    reativadoEm?: string | null;
    reativadoPorId?: string | null;
    motivoReativacao?: string | null;
    criadoEm: string;
    matricula?: string;
    matriculasOficina?: {
        id: string;
        status: 'ATIVA' | 'CONCLUIDA' | 'EVADIDA' | 'CANCELADA' | 'TRANSFERIDA';
        dataEntrada: string;
        dataEncerramento?: string;
        turma: { id: string; nome: string; horario?: string; modeloCertificadoId?: string | null; status?: string };
    }[];
    certificadosEmitidos?: {
        id: string;
        codigoValidacao: string;
        dataEmissao: string;
        pdfUrl?: string | null;
        status?: string;
        turmaId?: string | null;
        cursoImpresso?: string | null;
        cargaHorariaImpresso?: string | null;
        modelo?: { id: string; nome: string; tipo: 'ACADEMICO' | 'HONRARIA' };
        turma?: { id: string; nome: string; cargaHoraria?: string | null } | null;
    }[];
}

export interface BeneficiarioResumo {
    id: string;
    nomeCompleto: string;
    matricula?: string | null;
    cpfMascarado?: string | null;
    statusAtivo: boolean;
}

export type MotivoInativacaoAluno =
    | 'EVASAO_INSTITUCIONAL'
    | 'MUDANCA_DE_CIDADE'
    | 'PROBLEMA_SAUDE'
    | 'PROBLEMA_FAMILIAR'
    | 'DIFICULDADE_TRANSPORTE'
    | 'FALECIMENTO'
    | 'SOLICITACAO_DO_ALUNO'
    | 'FALTA_DE_CONTATO'
    | 'CADASTRO_DUPLICADO'
    | 'OUTRO';

export type StatusInativacaoMatricula = 'EVADIDA' | 'CANCELADA' | 'TRANSFERIDA';

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

export interface InativarAlunoPayload {
    motivoInativacao: MotivoInativacaoAluno;
    observacao?: string;
    encerrarMatriculasAtivas?: boolean;
    statusMatricula?: StatusInativacaoMatricula;
    motivoEncerramentoMatricula?: MotivoEncerramentoMatricula;
}

export type BeneficiarioPayload = Partial<
    Omit<Beneficiario, 'id' | 'statusAtivo' | 'criadoEm' | 'matricula' | 'matriculasOficina'>
>;

export interface PaginatedResponse<T> {
    data: T[];
    meta: { total: number; page: number; lastPage: number };
}

export type TipoEventoLinhaTempoAluno =
    | 'CADASTRO'
    | 'ATUALIZACAO_CADASTRO'
    | 'MATRICULA_TURMA'
    | 'ENCERRAMENTO_MATRICULA'
    | 'FREQUENCIA_PRESENTE'
    | 'FREQUENCIA_FALTA'
    | 'FREQUENCIA_FALTA_JUSTIFICADA'
    | 'ATENDIMENTO_INDIVIDUAL'
    | 'FALTA_ATENDIMENTO'
    | 'ATESTADO'
    | 'LAUDO'
    | 'CERTIFICADO'
    | 'PDI_CRIADO'
    | 'PDI_META_CRIADA'
    | 'PDI_META_ATUALIZADA'
    | 'PDI_EVOLUCAO'
    | 'ACAO_RISCO_EVASAO'
    | 'ACAO_RISCO_RESOLVIDA'
    | 'INATIVACAO'
    | 'REATIVACAO'
    | 'OBSERVACAO_MANUAL';

export interface LinhaTempoAlunoItem {
    id: string;
    tipo: TipoEventoLinhaTempoAluno;
    data: string;
    titulo: string;
    descricao?: string;
    origem: string;
    alunoId: string;
    turmaId?: string;
    turmaNome?: string;
    professorNome?: string;
    usuarioNome?: string;
    metadata?: Record<string, unknown>;
}

export interface LinhaTempoAlunoResponse {
    data: LinhaTempoAlunoItem[];
    meta: { page: number; limit: number; total: number; lastPage: number };
}

export interface LinhaTempoAlunoResumo {
    totalEventos: number;
    ultimaFrequencia?: string;
    ultimoAtendimento?: string;
    ultimoPdi?: string;
    ultimaAcaoRisco?: string;
}

export interface LinhaTempoTurmaResumo {
    id: string;
    nome: string;
}

export interface LinhaTempoAlunoQuery {
    dataInicio?: string;
    dataFim?: string;
    tipo?: string;
    turmaId?: string;
    page?: number;
    limit?: number;
}

export interface CriarEventoLinhaTempoManualPayload {
    tipo: 'OBSERVACAO_MANUAL';
    dataEvento?: string;
    titulo: string;
    descricao?: string;
    turmaId?: string;
    sensivel?: boolean;
}

type ApiEnvelope<T> = {
    success?: boolean;
    message?: string;
    data: T;
};

/** Resposta quando o CPF/RG já existe inativo no sistema */
export interface ReativacaoAluno {
    _reativacao: true;
    id: string;
    nomeCompleto: string;
    matricula?: string;
    statusAtivo: boolean;
    excluido: boolean;
    message: string;
}

export type CheckCpfRgBeneficiarioResponse =
    | { status: 'livre' }
    | { status: 'ativo'; id: string; nomeCompleto: string; matricula: string | null }
    | { status: 'inativo'; id: string; nomeCompleto: string; matricula: string | null; excluido: boolean };


@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
    private readonly url = '/api/beneficiaries';
    // Cache Passivo O(1) sem Leaks (Zero setTimeout na call stack do Angular Node Engine)
    private readonly cache = new Map<string, { data$: Observable<PaginatedResponse<Beneficiario>>, expiresAt: number }>();
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(
        private readonly http: HttpClient, 
        private readonly dashboardService: DashboardService,
        private readonly storage: StorageService
    ) { }

    limparCache(): void {
        this.cache.clear();
        this.dashboardService.limparCache();
    }

    private buildCacheKey(page: number, limit: number, busca?: string, inativos?: boolean, filtros?: Record<string, unknown>): string {
        const filtrosStr = filtros ? JSON.stringify(filtros) : '';
        return `${page}|${limit}|${busca ?? ''}|${inativos ?? false}|${filtrosStr}`;
    }

    listar(page = 1, limit = 10, busca?: string, inativos?: boolean, filtros?: Record<string, unknown>): Observable<PaginatedResponse<Beneficiario>> {
        const key = this.buildCacheKey(page, limit, busca, inativos, filtros);
        const now = Date.now();

        // Expiração passiva do GC (Garbage Collector) - Sem Timeout Engine Leaks
        if (this.cache.has(key) && this.cache.get(key)!.expiresAt > now) {
            return this.cache.get(key)!.data$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (busca) params = params.set('busca', busca);
        if (inativos) params = params.set('inativos', 'true');

        if (filtros) {
            Object.entries(filtros).forEach(([k, v]) => {
                if (v !== null && v !== undefined && v !== '') {
                    params = params.set(k, String(v));
                }
            });
        }

        const req$ = this.http.get<PaginatedResponse<Beneficiario>>(this.url, { params }).pipe(shareReplay(1));
        this.cache.set(key, { data$: req$, expiresAt: now + this.cacheTimeMs });

        return req$;
    }

    buscarResumo(busca: string): Observable<BeneficiarioResumo[]> {
        let params = new HttpParams().set('busca', busca);
        return this.http.get<BeneficiarioResumo[]>(`${this.url}/search`, { params });
    }

    linhaTempo(id: string, query: LinhaTempoAlunoQuery = {}): Observable<LinhaTempoAlunoResponse> {
        let params = new HttpParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, String(value));
            }
        });
        return this.http
            .get<LinhaTempoAlunoResponse | ApiEnvelope<LinhaTempoAlunoResponse>>(`${this.url}/${id}/linha-tempo`, { params })
            .pipe(map((response) => this.unwrapApiData(response)));
    }

    linhaTempoResumo(id: string): Observable<LinhaTempoAlunoResumo> {
        return this.http
            .get<LinhaTempoAlunoResumo | ApiEnvelope<LinhaTempoAlunoResumo>>(`${this.url}/${id}/linha-tempo/resumo`)
            .pipe(map((response) => this.unwrapApiData(response)));
    }

    linhaTempoTurmas(id: string): Observable<LinhaTempoTurmaResumo[]> {
        return this.http
            .get<LinhaTempoTurmaResumo[] | ApiEnvelope<LinhaTempoTurmaResumo[]>>(`${this.url}/${id}/linha-tempo/turmas`)
            .pipe(map((response) => this.unwrapApiData(response)));
    }

    criarEventoLinhaTempoManual(
        id: string,
        payload: CriarEventoLinhaTempoManualPayload
    ): Observable<LinhaTempoAlunoItem> {
        return this.http
            .post<LinhaTempoAlunoItem | ApiEnvelope<LinhaTempoAlunoItem>>(`${this.url}/${id}/linha-tempo/manual`, payload)
            .pipe(map((response) => this.unwrapApiData(response)));
    }

    private unwrapApiData<T>(response: T | ApiEnvelope<T>): T {
        if (this.isApiEnvelope<T>(response)) {
            return response.data;
        }
        return response;
    }

    private isApiEnvelope<T>(response: T | ApiEnvelope<T>): response is ApiEnvelope<T> {
        return !!response
            && typeof response === 'object'
            && 'data' in response
            && ('success' in response || 'message' in response);
    }

    exportarLista(busca?: string, inativos?: boolean, filtros?: Record<string, unknown>): Observable<ArrayBuffer> {
        let params = new HttpParams();
        if (busca) params = params.set('busca', busca);
        if (inativos) params = params.set('inativos', 'true');
        if (filtros) {
            Object.entries(filtros).forEach(([k, v]) => {
                if (v !== null && v !== undefined && v !== '') {
                    params = params.set(k, String(v));
                }
            });
        }
        return this.http.get(`${this.url}/export`, { params, responseType: 'arraybuffer' });
    }

    buscarPorId(id: string): Observable<Beneficiario> {
        return this.http.get<Beneficiario>(`${this.url}/${id}`);
    }

    checkCpfRg(cpf?: string, rg?: string): Observable<CheckCpfRgBeneficiarioResponse> {
        let params = new HttpParams();
        if (cpf) params = params.set('cpf', cpf);
        if (rg) params = params.set('rg', rg);
        return this.http.get<CheckCpfRgBeneficiarioResponse>(`${this.url}/check-cpf-rg`, { params });
    }

    atualizar(id: string, dados: BeneficiarioPayload): Observable<Beneficiario> {
        this.limparCache();
        return this.http.patch<Beneficiario>(`${this.url}/${id}`, dados);
    }

    inativar(id: string, dados: InativarAlunoPayload): Observable<void> {
        this.limparCache();
        return this.http.patch<void>(`${this.url}/${id}/inativar`, dados);
    }

    restaurar(id: string): Observable<void> {
        this.limparCache();
        return this.http.patch<void>(`${this.url}/${id}/restore`, {});
    }

    excluirDefinitivo(id: string): Observable<void> {
        this.limparCache();
        return this.http.delete<void>(`${this.url}/${id}/hard`);
    }

    criarBeneficiario(dados: BeneficiarioPayload): Observable<Beneficiario | ReativacaoAluno> {
        this.limparCache();
        return this.http.post<Beneficiario | ReativacaoAluno>(this.url, dados);
    }

    reativar(id: string): Observable<Beneficiario> {
        this.limparCache();
        return this.http.post<Beneficiario>(`${this.url}/${id}/reactivate`, {});
    }

    /** DELEGATES SRP DE STORAGE (Mantém Contrato Antigo para Zero Regressions UI) */
    uploadImagem(file: File): Observable<{ url: string }> {
        return this.storage.uploadGlobalImage(file);
    }

    uploadPdf(file: File, tipo: 'lgpd' | 'atestado' | 'laudo'): Observable<{ url: string }> {
        return this.storage.uploadSecurePdf(file, tipo);
    }

    excluirArquivo(urlArquivo: string): Observable<void> {
        return this.storage.deleteCloudFile(urlArquivo);
    }

    importar(file: File): Observable<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        this.limparCache();
        return this.http.post<ImportResult>(`${this.url}/import`, formData);
    }

    importarLote(dados: Record<string, unknown>[]): Observable<ImportResult> {
        this.limparCache();
        return this.http.post<ImportResult>(`${this.url}/import-batch`, { data: dados });
    }
}

export interface ImportResult {
    importados: number;
    ignorados: number;
    erros: { linha: number; documento: string; motivo: string }[];
}
