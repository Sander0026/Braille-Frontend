import { AuditFriendlyPipe } from './audit-friendly.pipe';
import { AuditLog } from '../../core/services/audit-log.service';

describe('AuditFriendlyPipe', () => {
  let pipe: AuditFriendlyPipe;

  beforeEach(() => {
    pipe = new AuditFriendlyPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('deve retornar mensagem genérica se log for nulo/indefinido (Fail-Safe OWASP)', () => {
    expect(pipe.transform(null as any)).toBe('Ação desconhecida');
  });

  it('deve formatar mensagens de CRIAR corretamente isolando o primeiro nome', () => {
    const log = {
      acao: 'CRIAR',
      autorNome: 'Carlos Almeida Ramos',
      entidade: 'User'
    } as AuditLog;

    expect(pipe.transform(log)).toBe('Carlos cadastrou um novo usuário.');
  });

  it('deve utilizar "Sistema" se autorNome for nulo', () => {
    const log = {
      acao: 'ATUALIZAR',
      autorNome: null,
      entidade: 'Turma'
    } as AuditLog;

    expect(pipe.transform(log)).toBe('Sistema atualizou os dados do turma.');
  });

  it('deve formatar mensagens de MATRICULAR corretamente', () => {
    const log = {
      acao: 'MATRICULAR',
      autorNome: 'Eduardo Ribeiro',
      entidade: 'User'
    } as AuditLog;

    expect(pipe.transform(log)).toBe('Eduardo matriculou um aluno.');
  });

  it('deve garantir formatação padrão em entidades não documentadas no mapa', () => {
    const log = {
      acao: 'ARQUIVAR',
      autorNome: 'Admin',
      entidade: 'NovaEntidadeV1'
    } as AuditLog;

    expect(pipe.transform(log)).toBe('Admin inativou/arquivou o registro de novaentidadev1.');
  });
});
