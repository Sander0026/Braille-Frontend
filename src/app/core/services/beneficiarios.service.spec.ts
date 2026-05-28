import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BeneficiariosService, InativarAlunoPayload, LinhaTempoAlunoResponse } from './beneficiarios.service';
import { DashboardService } from './dashboard.service';
import { StorageService } from './storage.service';

describe('BeneficiariosService', () => {
    let service: BeneficiariosService;
    let httpMock: HttpTestingController;
    let dashboardService: { limparCache: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        dashboardService = { limparCache: vi.fn() };

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                BeneficiariosService,
                { provide: DashboardService, useValue: dashboardService },
                { provide: StorageService, useValue: {} },
            ],
        });

        service = TestBed.inject(BeneficiariosService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('deve inativar aluno usando PATCH dedicado em vez de DELETE com body', () => {
        const payload: InativarAlunoPayload = {
            motivoInativacao: 'EVASAO_INSTITUCIONAL',
            encerrarMatriculasAtivas: true,
            statusMatricula: 'EVADIDA',
        };

        service.inativar('aluno-1', payload).subscribe();

        const req = httpMock.expectOne('/api/beneficiaries/aluno-1/inativar');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(payload);
        expect(dashboardService.limparCache).toHaveBeenCalled();

        req.flush(null);
    });

    it('deve consultar a linha do tempo com filtros e aceitar resposta direta da API', () => {
        const resposta: LinhaTempoAlunoResponse = {
            data: [
                {
                    id: 'evento-1',
                    alunoId: 'aluno-1',
                    tipo: 'ATENDIMENTO_INDIVIDUAL',
                    origem: 'ATENDIMENTO_INDIVIDUAL',
                    data: '2026-05-20T00:00:00.000Z',
                    titulo: 'Atendimento realizado',
                },
            ],
            meta: { page: 1, limit: 20, total: 1, lastPage: 1 },
        };

        service
            .linhaTempo('aluno-1', {
                page: 1,
                limit: 20,
                tipo: 'ATENDIMENTO_INDIVIDUAL',
                turmaId: 'turma-1',
            })
            .subscribe((res) => {
                expect(res).toEqual(resposta);
            });

        const req = httpMock.expectOne((request) => request.url === '/api/beneficiaries/aluno-1/linha-tempo');
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('page')).toBe('1');
        expect(req.request.params.get('limit')).toBe('20');
        expect(req.request.params.get('tipo')).toBe('ATENDIMENTO_INDIVIDUAL');
        expect(req.request.params.get('turmaId')).toBe('turma-1');

        req.flush(resposta);
    });

    it('deve desembrulhar resposta padronizada da API para a linha do tempo', () => {
        const resposta: LinhaTempoAlunoResponse = {
            data: [],
            meta: { page: 1, limit: 20, total: 0, lastPage: 1 },
        };

        service.linhaTempo('aluno-1').subscribe((res) => {
            expect(res).toEqual(resposta);
        });

        const req = httpMock.expectOne('/api/beneficiaries/aluno-1/linha-tempo');
        req.flush({ success: true, message: 'Linha do tempo carregada.', data: resposta });
    });

    it('deve desembrulhar resumo e turmas da linha do tempo quando vierem em envelope', () => {
        service.linhaTempoResumo('aluno-1').subscribe((res) => {
            expect(res).toEqual({ totalEventos: 2, ultimoAtendimento: '2026-05-20T00:00:00.000Z' });
        });
        httpMock.expectOne('/api/beneficiaries/aluno-1/linha-tempo/resumo').flush({
            success: true,
            data: { totalEventos: 2, ultimoAtendimento: '2026-05-20T00:00:00.000Z' },
        });

        service.linhaTempoTurmas('aluno-1').subscribe((res) => {
            expect(res).toEqual([{ id: 'turma-1', nome: 'Braille' }]);
        });
        httpMock.expectOne('/api/beneficiaries/aluno-1/linha-tempo/turmas').flush({
            success: true,
            data: [{ id: 'turma-1', nome: 'Braille' }],
        });
    });
});
