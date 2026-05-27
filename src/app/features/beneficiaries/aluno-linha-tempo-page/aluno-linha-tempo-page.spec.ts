import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { BeneficiariosService } from '../../../core/services/beneficiarios.service';
import { AlunoLinhaTempoPage } from './aluno-linha-tempo-page';

describe('AlunoLinhaTempoPage', () => {
  let fixture: ComponentFixture<AlunoLinhaTempoPage>;
  let component: AlunoLinhaTempoPage;
  let beneficiariosService: {
    buscarPorId: ReturnType<typeof vi.fn>;
    linhaTempoResumo: ReturnType<typeof vi.fn>;
    linhaTempoTurmas: ReturnType<typeof vi.fn>;
    linhaTempo: ReturnType<typeof vi.fn>;
    criarEventoLinhaTempoManual: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    beneficiariosService = {
      buscarPorId: vi.fn(() =>
        of({
          id: 'aluno-1',
          nomeCompleto: 'Aluno Linha do Tempo',
          cpf: null,
          rg: null,
          dataNascimento: '2010-01-01',
          statusAtivo: true,
          criadoEm: '2026-01-01',
          matricula: '20260001',
        }),
      ),
      linhaTempoResumo: vi.fn(() =>
        of({
          totalEventos: 1,
          ultimoAtendimento: '2026-05-20T10:00:00.000Z',
        }),
      ),
      linhaTempoTurmas: vi.fn(() => of([])),
      linhaTempo: vi.fn(() =>
        of({
          data: [
            {
              id: 'evento-1',
              alunoId: 'aluno-1',
              tipo: 'ATENDIMENTO_INDIVIDUAL',
              origem: 'ATENDIMENTO_INDIVIDUAL',
              data: '2026-05-20T10:00:00.000Z',
              titulo: 'Atendimento carregado',
            },
          ],
          meta: { page: 1, limit: 20, total: 1, lastPage: 1 },
        }),
      ),
      criarEventoLinhaTempoManual: vi.fn(),
    };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AlunoLinhaTempoPage],
      providers: [
        { provide: BeneficiariosService, useValue: beneficiariosService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'aluno-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlunoLinhaTempoPage);
    component = fixture.componentInstance;
  });

  it('deve consultar aluno, resumo e eventos ao abrir a tela completa', () => {
    fixture.detectChanges();

    expect(beneficiariosService.buscarPorId).toHaveBeenCalledWith('aluno-1');
    expect(beneficiariosService.linhaTempoResumo).toHaveBeenCalledWith('aluno-1');
    expect(beneficiariosService.linhaTempo).toHaveBeenCalledWith(
      'aluno-1',
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    expect(component.carregandoAluno).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Aluno Linha do Tempo');
    expect(fixture.nativeElement.textContent).toContain('Atendimento carregado');
  });

  it('deve mostrar erro e sair do carregamento quando aluno nao carregar', () => {
    beneficiariosService.buscarPorId.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Aluno nao encontrado.' } })),
    );

    fixture.detectChanges();

    expect(component.carregandoAluno).toBe(false);
    expect(component.erro).toBe('Aluno nao encontrado.');
    expect(fixture.nativeElement.textContent).toContain('Aluno nao encontrado.');
  });

  it('deve carregar a linha do tempo mesmo enquanto a ficha completa do aluno ainda esta pendente', () => {
    const alunoPendente$ = new Subject<any>();
    beneficiariosService.buscarPorId.mockReturnValueOnce(alunoPendente$.asObservable());

    fixture.detectChanges();

    expect(component.carregandoAluno).toBe(true);
    expect(beneficiariosService.linhaTempo).toHaveBeenCalledWith(
      'aluno-1',
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    expect(fixture.nativeElement.textContent).toContain('Atendimento carregado');

    alunoPendente$.next({
      id: 'aluno-1',
      nomeCompleto: 'Aluno Linha do Tempo',
      cpf: null,
      rg: null,
      dataNascimento: '2010-01-01',
      statusAtivo: true,
      criadoEm: '2026-01-01',
    });
    alunoPendente$.complete();
  });

  it('deve voltar para a lista de alunos', () => {
    component.voltar();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/alunos']);
  });
});
