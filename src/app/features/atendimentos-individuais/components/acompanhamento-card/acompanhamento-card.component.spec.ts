import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AcompanhamentoCardComponent } from './acompanhamento-card.component';
import type { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';

function makeAcompanhamento(status: AcompanhamentoIndividual['status'] = 'EM_ANDAMENTO'): AcompanhamentoIndividual {
  return {
    id: 'acomp-1',
    alunoId: 'aluno-1',
    professorId: 'prof-1',
    assuntoAtual: 'Braille',
    status,
    dataInicio: '2026-05-01',
    criadoEm: '2026-05-01',
    atualizadoEm: '2026-05-01',
    aluno: { id: 'aluno-1', nomeCompleto: 'Aluno Teste', matricula: '2026001' },
    professor: { id: 'prof-1', nome: 'Professor Teste' },
    _count: { atendimentos: 2 },
  };
}

describe('AcompanhamentoCardComponent', () => {
  let fixture: ComponentFixture<AcompanhamentoCardComponent>;

  function setup(canCreateAtendimento: boolean, status: AcompanhamentoIndividual['status'] = 'EM_ANDAMENTO') {
    TestBed.configureTestingModule({
      imports: [AcompanhamentoCardComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(AcompanhamentoCardComponent);
    fixture.componentInstance.acompanhamento = makeAcompanhamento(status);
    fixture.componentInstance.canCreateAtendimento = canCreateAtendimento;
    fixture.detectChanges();
  }

  it('deve mostrar Novo atendimento quando permitido e em andamento', () => {
    setup(true, 'EM_ANDAMENTO');

    expect(fixture.nativeElement.textContent).toContain('Novo atendimento');
  });

  it('nao deve mostrar Novo atendimento quando nao permitido', () => {
    setup(false, 'EM_ANDAMENTO');

    expect(fixture.nativeElement.textContent).not.toContain('Novo atendimento');
  });

  it('nao deve mostrar Novo atendimento para acompanhamento finalizado', () => {
    setup(true, 'FINALIZADO');

    expect(fixture.nativeElement.textContent).not.toContain('Novo atendimento');
  });
});
