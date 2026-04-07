import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { BeneficiaryFormComponent } from './beneficiary-form';
import { BeneficiariosService, Beneficiario } from '../../../core/services/beneficiarios.service';

// ── Factories ─────────────────────────────────────────────────────────────────
const mockAluno: Beneficiario = {
  id: 'aluno-123',
  nomeCompleto: 'Maria Oliveira',
  cpf: '123.456.789-09',
  rg: '12.345.678',
  dataNascimento: '1990-05-15',
  statusAtivo: true,
  criadoEm: new Date().toISOString(),
  cep: '12345678',
  rua: 'Rua das Flores',
  numero: '10',
  bairro: 'Centro',
  cidade: 'São Paulo',
  uf: 'SP',
  tipoDeficiencia: 'VISUAL',
  prefAcessibilidade: 'BRAILLE',
  telefoneContato: '(11) 99999-9999',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function changeInput(campo: string, valor: any) {
  return { currentValue: valor, previousValue: null, firstChange: true, isFirstChange: () => true };
}

// ── Suite ──────────────────────────────────────────────────────────────────────
describe('BeneficiaryFormComponent', () => {
  let component: BeneficiaryFormComponent;
  let fixture:   ComponentFixture<BeneficiaryFormComponent>;

  let beneficiariosService: any;
  let router:               any;
  let httpMock:             any;

  beforeEach(async () => {
    beneficiariosService = {criarBeneficiario: vi.fn(),atualizar: vi.fn(),uploadImagem: vi.fn(),uploadPdf: vi.fn(),checkCpfRg: vi.fn(),: vi.fn()};
    router   = {navigate: vi.fn()};
    httpMock = {get: vi.fn()};

    beneficiariosService.criarBeneficiario.and.returnValue(of({ id: 'novo-id' } as any));
    beneficiariosService.atualizar.and.returnValue(of({ ...mockAluno, nomeCompleto: 'Maria Atualizada' } as any));
    beneficiariosService.checkCpfRg.and.returnValue(of({ status: 'livre' } as any));
    router.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports:   [BeneficiaryFormComponent, ReactiveFormsModule],
      providers: [
        { provide: BeneficiariosService, useValue: beneficiariosService },
        { provide: Router,               useValue: router },
        { provide: HttpClient,           useValue: httpMock },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(BeneficiaryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Smoke ─────────────────────────────────────────────────────────────────
  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  // ── MODO CRIAÇÃO (comportamento base) ─────────────────────────────────────
  it('deve iniciar em modo CRIAÇÃO quando alunoEmEdicao não é passado', () => {
    expect(component.isModoEdicao).toBeFalsy();
    expect(component.passoAtual).toBe(1);
  });

  it('deve chamar criarBeneficiario() (POST) em modo de CRIAÇÃO ao salvar', fakeAsync(() => {
    component.cadastroForm.patchValue({
      dadosPessoais:       { nomeCompleto: 'João Silva', dataNascimento: '2000-01-01', cpf: '12345678909' },
      enderecoLocalizacao: { cep: '12345678', rua: 'Rua A', numero: '1', bairro: 'Centro', cidade: 'SP', uf: 'SP', telefoneContato: '11999999999' },
      perfilDeficiencia:   { tipoDeficiencia: 'VISUAL', prefAcessibilidade: 'BRAILLE' },
      socioeconomico:      {},
    });
    component.salvarCadastro();
    tick();
    expect(beneficiariosService.criarBeneficiario).toHaveBeenCalled();
    expect(beneficiariosService.atualizar).not.toHaveBeenCalled();
  }));

  // ── MODO EDIÇÃO — causa raiz do bug ──────────────────────────────────────
  it('deve entrar em modo EDIÇÃO quando alunoEmEdicao é definido via ngOnChanges', () => {
    component.alunoEmEdicao = mockAluno;
    component.ngOnChanges({ alunoEmEdicao: changeInput('alunoEmEdicao', mockAluno) } as any);
    expect(component.isModoEdicao).toBeTruthy();
  });

  it('deve popular o formulário com os dados do aluno em modo EDIÇÃO', () => {
    component.alunoEmEdicao = mockAluno;
    component.ngOnChanges({ alunoEmEdicao: changeInput('alunoEmEdicao', mockAluno) } as any);
    expect(component.cadastroForm.get('dadosPessoais.nomeCompleto')?.value).toBe('Maria Oliveira');
    expect(component.cadastroForm.get('dadosPessoais.cpf')?.value).toBe('123.456.789-09');
  });

  it('deve chamar atualizar() (PATCH) e NÃO criarBeneficiario() em modo EDIÇÃO', fakeAsync(() => {
    // Setup modo edição
    component.alunoEmEdicao = mockAluno;
    component.ngOnChanges({ alunoEmEdicao: changeInput('alunoEmEdicao', mockAluno) } as any);

    component.cadastroForm.patchValue({
      dadosPessoais:       { nomeCompleto: 'Maria Atualizada', dataNascimento: '1990-05-15', cpf: '123.456.789-09' },
      enderecoLocalizacao: { cep: '12345678', rua: 'Rua das Flores', numero: '10', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP', telefoneContato: '(11) 99999-9999' },
      perfilDeficiencia:   { tipoDeficiencia: 'VISUAL', prefAcessibilidade: 'BRAILLE' },
      socioeconomico:      {},
    });

    component.salvarCadastro();
    tick();

    // ✅ Garante que PATCH (atualizar) foi chamado, não POST (criar)
    expect(beneficiariosService.atualizar).toHaveBeenCalledWith('aluno-123', expect.anything());
    expect(beneficiariosService.criarBeneficiario).not.toHaveBeenCalled();
  }));

  it('deve redefinir isModoEdicao para false quando alunoEmEdicao vira null', () => {
    component.alunoEmEdicao = mockAluno;
    component.ngOnChanges({ alunoEmEdicao: changeInput('alunoEmEdicao', mockAluno) } as any);
    expect(component.isModoEdicao).toBeTruthy();

    component.alunoEmEdicao = null;
    component.ngOnChanges({
      alunoEmEdicao: { currentValue: null, previousValue: mockAluno, firstChange: false, isFirstChange: () => false }
    } as any);
    expect(component.isModoEdicao).toBeFalsy();
  });

  // ── Acordeão (modo edição) ────────────────────────────────────────────────
  it('em modo EDIÇÃO o passoAtual deve ser 1 (acordeão 1 aberto por padrão)', () => {
    component.alunoEmEdicao = mockAluno;
    component.ngOnChanges({ alunoEmEdicao: changeInput('alunoEmEdicao', mockAluno) } as any);
    // Modo edição não navega por passos — passoAtual é sempre 1 (não usado na UI de edição)
    expect(component.passoAtual).toBe(1);
  });

  // ── Validações ────────────────────────────────────────────────────────────
  it('não deve chamar a API se o formulário for inválido', () => {
    component.salvarCadastro();
    expect(beneficiariosService.criarBeneficiario).not.toHaveBeenCalled();
    expect(beneficiariosService.atualizar).not.toHaveBeenCalled();
  });

  it('deve bloquear duplo submit (isSalvando guard)', fakeAsync(() => {
    component.isSalvando = true;
    component.salvarCadastro();
    tick();
    expect(beneficiariosService.criarBeneficiario).not.toHaveBeenCalled();
  }));

  // ── Cancelamento ─────────────────────────────────────────────────────────
  it('deve emitir evento cancelou ao chamar emitirCancelamento()', () => {
    spyOn(component.cancelou, 'emit');
    component.emitirCancelamento();
    expect(component.cancelou.emit).toHaveBeenCalled();
  });

  it('deve emitir salvou após salvar com sucesso em modo CRIAÇÃO', fakeAsync(() => {
    spyOn(component.salvou, 'emit');
    component.cadastroForm.patchValue({
      dadosPessoais:       { nomeCompleto: 'Novo Aluno', dataNascimento: '2000-01-01', cpf: '11111111111' },
      enderecoLocalizacao: { cep: '12345000', rua: 'Rua B', numero: '2', bairro: 'Bairro', cidade: 'Cidade', uf: 'RS', telefoneContato: '51999999999' },
      perfilDeficiencia:   { tipoDeficiencia: 'CEGUEIRA_TOTAL', prefAcessibilidade: 'BRAILLE' },
      socioeconomico:      {},
    });
    component.salvarCadastro();
    tick();
    expect(component.salvou.emit).toHaveBeenCalled();
  }));
});
