import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BeneficiariosService, InativarAlunoPayload } from './beneficiarios.service';
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
});
