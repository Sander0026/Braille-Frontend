import { TestBed } from '@angular/core/testing';
import { ApoiadoresLista } from './apoiadores-lista';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApoiadoresService } from '../apoiadores.service';
import { ChangeDetectorRef } from '@angular/core';
import { signal } from '@angular/core';

describe('ApoiadoresLista (SecDevOps Test)', () => {
  let component: ApoiadoresLista;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ApoiadoresLista],
      providers: [
        ApoiadoresService,
        { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } }
      ]
    });
    const fixture = TestBed.createComponent(ApoiadoresLista);
    component = fixture.componentInstance;
  });

  it('deve alternar a visualização da Lista usando Abas Baseadas em Signals e Filtragem Otimista', () => {
    // Mock de Repositório 
    component.apoiadoresOriginais = [
      { id: '1', nomeRazaoSocial: 'Empresa Ativa', ativo: true, tipo: 'EMPRESA' } as any,
      { id: '2', nomeRazaoSocial: 'ONG Inativa', ativo: false, tipo: 'ONG' } as any
    ];

    // Assert Inicial (Aba de Ativos)
    expect(component.abaAtiva()).toBe('ATIVOS');
    component.aplicarFiltros();
    expect(component.apoiadoresFiltrados.length).toBe(1);
    expect(component.apoiadoresFiltrados[0].id).toBe('1');

    // Chaveamento para Inativos
    component.mudarAba('INATIVOS');
    expect(component.abaAtiva()).toBe('INATIVOS');
    expect(component.apoiadoresFiltrados.length).toBe(1);
    expect(component.apoiadoresFiltrados[0].id).toBe('2');
  });
});
