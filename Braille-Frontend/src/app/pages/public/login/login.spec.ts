import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';

import { Login } from './login';
import { AuthService } from '../../../core/services/auth.service';

// ── Mocks ────────────────────────────────────────────────────────────────────
const authServiceMock = {
  login:       vi.fn(),
  trocarSenha: vi.fn(),
  logout:      vi.fn(),
  getUser:     vi.fn(),
};

const routerMock = {
  navigate: vi.fn().mockResolvedValue(true),
};

// ── Suite ────────────────────────────────────────────────────────────────────
describe('Login Component', () => {
  let component: Login;
  let fixture:   ComponentFixture<Login>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router,      useValue: routerMock },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser criado com sucesso', () => {
    expect(component).toBeTruthy();
  });

  // ── loginForm validation ───────────────────────────────────────────────────
  it('deve marcar o form inválido e sair cedo se estiver vazio', () => {
    component.fazerLogin();
    expect(component.loginForm.touched).toBe(true);
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('deve chamar authService.login() com payload limpo', fakeAsync(() => {
    authServiceMock.login.mockReturnValue(of({}));
    authServiceMock.getUser.mockReturnValue({ precisaTrocarSenha: false });

    component.loginForm.setValue({ username: '  admin  ', senha: 'senha123' });
    component.fazerLogin();
    tick();

    expect(authServiceMock.login).toHaveBeenCalledWith({ username: 'admin', senha: 'senha123' });
  }));

  it('deve navegar para /admin ao fazer login com sucesso', fakeAsync(() => {
    authServiceMock.login.mockReturnValue(of({}));
    authServiceMock.getUser.mockReturnValue({ precisaTrocarSenha: false });

    component.loginForm.setValue({ username: 'admin', senha: 'pass' });
    component.fazerLogin();
    tick();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin']);
  }));

  it('deve exibir tela de troca de senha quando precisaTrocarSenha = true', fakeAsync(() => {
    authServiceMock.login.mockReturnValue(of({}));
    authServiceMock.getUser.mockReturnValue({ precisaTrocarSenha: true });

    component.loginForm.setValue({ username: 'admin', senha: 'Pass@123' });
    component.fazerLogin();
    tick();

    expect(component.precisaTrocarSenha()).toBe(true);
    expect(component.senhaAntigaTemp()).toBe('Pass@123');
  }));

  // ── Error handling ────────────────────────────────────────────────────────
  it('deve exibir mensagem amigável em erro 401', fakeAsync(() => {
    const err = new HttpErrorResponse({ status: 401, error: { message: 'Credenciais inválidas' } });
    authServiceMock.login.mockReturnValue(throwError(() => err));

    component.loginForm.setValue({ username: 'x', senha: 'y' });
    component.fazerLogin();
    tick();

    expect(component.erroLogin()).toBe('Credenciais inválidas');
    expect(component.carregando()).toBe(false);
  }));

  it('deve exibir mensagem de conexão em erro status 0', fakeAsync(() => {
    const err = new HttpErrorResponse({ status: 0 });
    authServiceMock.login.mockReturnValue(throwError(() => err));

    component.loginForm.setValue({ username: 'x', senha: 'y' });
    component.fazerLogin();
    tick();

    expect(component.erroLogin()).toContain('conectar ao servidor');
  }));

  // ── confirmarNovaSenha ────────────────────────────────────────────────────
  it('não deve chamar trocarSenha se novaSenhaForm for inválido', () => {
    component.confirmarNovaSenha();
    expect(authServiceMock.trocarSenha).not.toHaveBeenCalled();
  });

  it('deve definir senhaAlteradaOk=true e fazer logout após trocar senha', fakeAsync(() => {
    authServiceMock.trocarSenha.mockReturnValue(of({}));

    component.novaSenhaForm.setValue({ novaSenha: 'Nova@Senha1', confirmarSenha: 'Nova@Senha1' });
    component.confirmarNovaSenha();
    tick();

    expect(component.senhaAlteradaOk()).toBe(true);
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(component.precisaTrocarSenha()).toBe(false);
  }));

  // ── toggleSenha ───────────────────────────────────────────────────────────
  it('deve alternar mostrarSenha a cada chamada', () => {
    expect(component.mostrarSenha()).toBe(false);
    component.toggleSenha();
    expect(component.mostrarSenha()).toBe(true);
    component.toggleSenha();
    expect(component.mostrarSenha()).toBe(false);
  });
});
