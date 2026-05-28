import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { AdminLayout } from './admin-layout';
import { AuthService } from '../../core/services/auth.service';
import { AccessibilityService } from '../../core/services/accessibility.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { HotkeysService } from '../../core/services/hotkeys.service';

describe('AdminLayout', () => {
  let component: AdminLayout;
  let fixture: ComponentFixture<AdminLayout>;
  let authService: any;

  beforeEach(async () => {
    authService = {
      getUser: vi.fn().mockReturnValue({ sub: 'u-1', nome: 'Admin', role: 'ADMIN' }),
      getMe: vi.fn().mockReturnValue(of({
        id: 'u-1',
        nome: 'Admin',
        username: 'admin',
        email: 'admin@ilbes.org',
        role: 'ADMIN',
        fotoPerfil: null,
        statusAtivo: true,
        criadoEm: '2026-05-01T00:00:00.000Z',
      })),
      logout: vi.fn(),
      atualizarFoto: vi.fn().mockReturnValue(of({ message: 'ok' })),
    };

    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: AccessibilityService, useValue: { isAltoContraste: false } },
        { provide: HotkeysService, useValue: { getRegisteredHotkeys: () => [], onHelpRequested$: new Subject<void>() } },
        { provide: ConfirmDialogService, useValue: { confirmar: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(AdminLayout, {
      set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exibe o menu Relatorios para ADMIN e SECRETARIA', () => {
    component.usuario = { sub: 'admin-1', nome: 'Admin', role: 'ADMIN' };
    expect(component.rotasPermitidas.some((item) => item.rota === '/admin/relatorios')).toBe(true);

    component.usuario = { sub: 'sec-1', nome: 'Secretaria', role: 'SECRETARIA' };
    expect(component.rotasPermitidas.some((item) => item.rota === '/admin/relatorios')).toBe(true);
  });

  it('mantem Relatorios fora do menu de perfil sem permissao administrativa', () => {
    component.usuario = { sub: 'prof-1', nome: 'Professor', role: 'PROFESSOR' };

    expect(component.rotasPermitidas.some((item) => item.rota === '/admin/relatorios')).toBe(false);
  });

  it('permite Relatorios para COMUNICACAO somente pelo fluxo publico de exportacao', () => {
    component.usuario = { sub: 'com-1', nome: 'Comunicacao', role: 'COMUNICACAO' };

    expect(component.rotasPermitidas.some((item) => item.rota === '/admin/relatorios')).toBe(true);
  });
});
