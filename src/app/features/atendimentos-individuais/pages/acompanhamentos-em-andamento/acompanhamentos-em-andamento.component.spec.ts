import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AcompanhamentosEmAndamentoComponent } from './acompanhamentos-em-andamento.component';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';

function makeAcompanhamento(professorId = 'prof-1'): AcompanhamentoIndividual {
  return {
    id: 'acomp-1',
    alunoId: 'aluno-1',
    professorId,
    assuntoAtual: 'Braille',
    status: 'EM_ANDAMENTO',
    dataInicio: '2026-05-01',
    criadoEm: '2026-05-01',
    atualizadoEm: '2026-05-01',
    aluno: { id: 'aluno-1', nomeCompleto: 'Aluno Teste' },
    professor: { id: professorId, nome: 'Professor Teste' },
    _count: { atendimentos: 0 },
  };
}

describe('AcompanhamentosEmAndamentoComponent', () => {
  let fixture: ComponentFixture<AcompanhamentosEmAndamentoComponent>;
  let api: { listar: ReturnType<typeof vi.fn> };
  let auth: { getUser: ReturnType<typeof vi.fn> };

  function setup(role = 'PROFESSOR', sub = 'prof-1', meta = { total: 40, page: 1, lastPage: 2 }) {
    api = {
      listar: vi.fn().mockReturnValue(of({ data: [makeAcompanhamento()], meta })),
    };
    auth = {
      getUser: vi.fn().mockReturnValue({ sub, role, nome: 'Teste' }),
    };

    TestBed.configureTestingModule({
      imports: [AcompanhamentosEmAndamentoComponent],
      providers: [
        provideRouter([]),
        { provide: AtendimentosIndividuaisApiService, useValue: api },
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: { erro: vi.fn(), sucesso: vi.fn() } },
      ],
    });

    fixture = TestBed.createComponent(AcompanhamentosEmAndamentoComponent);
    fixture.detectChanges();
  }

  it('PROFESSOR dono deve poder criar novo atendimento', () => {
    setup('PROFESSOR', 'prof-1');

    expect(fixture.componentInstance.canCreateAtendimento(makeAcompanhamento('prof-1'))).toBe(true);
  });

  it('SECRETARIA nao deve poder criar novo atendimento pela listagem', () => {
    setup('SECRETARIA', 'sec-1');

    expect(fixture.componentInstance.canCreateAtendimento(makeAcompanhamento('prof-1'))).toBe(false);
  });

  it('deve avancar e voltar pagina', () => {
    setup('ADMIN', 'admin-1');
    const component = fixture.componentInstance;

    component.proximaPagina();
    expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, limit: 20 }));

    component.paginaAnterior();
    expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
  });
});
