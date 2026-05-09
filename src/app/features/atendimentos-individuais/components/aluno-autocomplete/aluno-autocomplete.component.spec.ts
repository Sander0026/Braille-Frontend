import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AlunoAutocompleteComponent } from './aluno-autocomplete.component';
import type { BeneficiarioResumo } from '../../../../core/services/beneficiarios.service';

function makeAlunos(): BeneficiarioResumo[] {
  return [
    { id: 'a1', nomeCompleto: 'Ana Silva', matricula: '202600001', cpfMascarado: '***001' } as BeneficiarioResumo,
    { id: 'a2', nomeCompleto: 'Bruno Souza', matricula: '202600002', cpfMascarado: '***002' } as BeneficiarioResumo,
    { id: 'a3', nomeCompleto: 'Carlos Lima', matricula: '202600003', cpfMascarado: '***003' } as BeneficiarioResumo,
  ];
}

describe('AlunoAutocompleteComponent', () => {
  let component: AlunoAutocompleteComponent;

  beforeEach(() => {
    component = new AlunoAutocompleteComponent();
    component.alunos = makeAlunos();
    component.termo = 'Ana Silva test';
  });

  // ─── 1. Navega com setas ───────────────────────────────────────────

  it('deve navegar com ArrowDown e ArrowUp alterando activeIndex', () => {
    expect(component.activeIndex()).toBe(-1);

    const preventDefault = vi.fn();
    component.onKeydown({ key: 'ArrowDown', preventDefault } as unknown as KeyboardEvent);
    expect(component.activeIndex()).toBe(0);

    component.onKeydown({ key: 'ArrowDown', preventDefault } as unknown as KeyboardEvent);
    expect(component.activeIndex()).toBe(1);

    component.onKeydown({ key: 'ArrowUp', preventDefault } as unknown as KeyboardEvent);
    expect(component.activeIndex()).toBe(0);

    // ArrowUp do indice 0 → vai para o último
    component.onKeydown({ key: 'ArrowUp', preventDefault } as unknown as KeyboardEvent);
    expect(component.activeIndex()).toBe(2);
  });

  // ─── 2. Seleciona com Enter ────────────────────────────────────────

  it('deve selecionar aluno com Enter e emitir evento selected', () => {
    const emitSpy = vi.spyOn(component.selected, 'emit');
    const preventDefault = vi.fn();

    // Navega para o primeiro item
    component.onKeydown({ key: 'ArrowDown', preventDefault } as unknown as KeyboardEvent);
    expect(component.activeIndex()).toBe(0);

    // Seleciona com Enter
    component.onKeydown({ key: 'Enter', preventDefault } as unknown as KeyboardEvent);

    expect(emitSpy).toHaveBeenCalledWith(makeAlunos()[0]);
    expect(component.selecionado()).toEqual(makeAlunos()[0]);
    expect(component.activeIndex()).toBe(-1);
  });

  // ─── 3. Fecha com Escape ───────────────────────────────────────────

  it('deve fechar listbox com Escape e definir isManuallyClosed', () => {
    const preventDefault = vi.fn();

    // Abre a lista navegando
    component.onKeydown({ key: 'ArrowDown', preventDefault } as unknown as KeyboardEvent);
    expect(component.activeIndex()).toBe(0);

    // Fecha com Escape
    component.onKeydown({ key: 'Escape', preventDefault } as unknown as KeyboardEvent);
    expect(component.activeIndex()).toBe(-1);
    expect(component.isManuallyClosed()).toBe(true);
  });
});
