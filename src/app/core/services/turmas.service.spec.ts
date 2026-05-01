import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TurmasService } from './turmas.service';

describe('TurmasService SecDevOps', () => {
    let service: TurmasService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TurmasService]
        });
        service = TestBed.inject(TurmasService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('deve ser criado com sucesso', () => {
        expect(service).toBeTruthy();
    });

    it('deve realizar a listagem usando Cache-Control Headers rigorosos sem poluentes de URL', () => {
        service.listar(1, 10, undefined, 'all', undefined, undefined, 'all').subscribe(response => {
            expect(response).toBeTruthy();
        });

        const req = httpMock.expectOne(request => request.url === '/api/turmas');
        expect(req.request.method).toBe('GET');

        // Garantir que a poluição de request (_t) não existe mais
        expect(req.request.params.has('_t')).toBeFalsy();
        
        // Anti-Cache mechanism transposto para Cabeçalhos
        expect(req.request.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
        expect(req.request.headers.get('Pragma')).toBe('no-cache');
        
        // Garantir parser adequado dos filtros para a URL Payload
        expect(req.request.params.get('excluido')).toBe('all');
        expect(req.request.params.get('statusAtivo')).toBe('all');

        req.flush({ data: [], meta: { total: 0 } });
    });
});
