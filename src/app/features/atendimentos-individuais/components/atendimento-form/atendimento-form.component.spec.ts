import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AtendimentoFormComponent } from './atendimento-form.component';

describe('AtendimentoFormComponent', () => {
  let component: AtendimentoFormComponent;

  beforeEach(() => {
    component = new AtendimentoFormComponent();
  });

  // ─── 1. Formulário envia hora, modalidade, duração e local ────────

  it('deve emitir payload com horaInicio, horaFim, modalidade, duracaoMinutos e localAtendimento', () => {
    const emitSpy = vi.spyOn(component.save, 'emit');

    component.value = {
      dataAtendimento: '2026-05-08',
      tipoRegistro: 'ATENDIMENTO_REALIZADO',
      horaInicio: '08:00',
      horaFim: '09:30',
      duracaoMinutos: 90,
      modalidade: 'PRESENCIAL',
      localAtendimento: 'Sala 3',
      assuntoDoDia: 'Leitura avancada',
      observacao: 'Aluno progrediu bem',
    };

    component.submit();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    const emitted = emitSpy.mock.calls[0][0];
    expect(emitted).toBeDefined();
    expect(emitted!.horaInicio).toBe('08:00');
    expect(emitted!.horaFim).toBe('09:30');
    expect(emitted!.duracaoMinutos).toBe(90);
    expect(emitted!.modalidade).toBe('PRESENCIAL');
    expect(emitted!.localAtendimento).toBe('Sala 3');
  });

  // ─── 2. Validação de horário no formulário ────────────────────────

  it('deve exibir erro quando horaFim e menor ou igual a horaInicio', () => {
    const emitSpy = vi.spyOn(component.save, 'emit');

    component.value = {
      dataAtendimento: '2026-05-08',
      tipoRegistro: 'ATENDIMENTO_REALIZADO',
      horaInicio: '14:00',
      horaFim: '13:00',
      assuntoDoDia: 'Teste',
      observacao: 'Teste obs',
    };

    component.submit();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.error).toContain('horario de fim');
  });
});
