import { TestBed } from '@angular/core/testing';
import { ApoiadoresLista } from './apoiadores-lista';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApoiadoresService } from '../apoiadores.service';
import { ChangeDetectorRef } from '@angular/core';
import { signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

  it('deve retornar para o modal de Perfil ao fechar Acoes ou Certificados se foi aberto a partir de Perfil', () => {
    // Configura o apoiador atual
    component.apoiadoresOriginais = [
      { id: '1', nomeRazaoSocial: 'Empresa Teste', ativo: true, tipo: 'EMPRESA' } as any
    ];
    // Simula abrirAcoes a partir do Perfil
    component.abrirAcoes('1', true);
    
    // Verifica estado interno
    expect(component.modalVoltarParaPerfil()).toBe(true);
    expect(component.modalAcoesAberto()).toBe(true);
    expect(component.modalPerfilAberto()).toBe(false);

    // Simula fechamento do modal Acoes
    component.onAcoesClosed();

    // Deve abrir o Perfil e resetar a flag
    expect(component.modalAcoesAberto()).toBe(false);
    expect(component.modalPerfilAberto()).toBe(true);
    expect(component.modalVoltarParaPerfil()).toBe(false);
  });

  it('NAO deve retornar para o modal de Perfil se Acoes foi aberto a partir da lista', () => {
    component.apoiadoresOriginais = [
      { id: '1', nomeRazaoSocial: 'Empresa Teste', ativo: true, tipo: 'EMPRESA' } as any
    ];
    // Lista abre acoes (fromPerfil = false)
    component.abrirAcoes('1', false);
    
    expect(component.modalVoltarParaPerfil()).toBe(false);
    expect(component.modalAcoesAberto()).toBe(true);

    component.onAcoesClosed();

    expect(component.modalAcoesAberto()).toBe(false);
    expect(component.modalPerfilAberto()).toBe(false); // Continua fechado!
  });
});
