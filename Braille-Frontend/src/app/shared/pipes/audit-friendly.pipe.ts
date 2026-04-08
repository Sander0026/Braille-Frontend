import { Pipe, PipeTransform } from '@angular/core';
import { AuditLog } from '../../core/services/audit-log.service';

@Pipe({
  name: 'auditFriendly',
  standalone: true,
  pure: true
})
export class AuditFriendlyPipe implements PipeTransform {
  transform(log: AuditLog): string {
    if (!log) return 'Ação desconhecida';

    const usuario = log.autorNome ? log.autorNome.split(' ')[0] : 'Sistema';
    const entidadeFormatada = this.formatarEntidade(log.entidade);

    switch (log.acao) {
      case 'CRIAR':
        return `${usuario} cadastrou um novo ${entidadeFormatada}.`;
      case 'ATUALIZAR':
        return `${usuario} atualizou os dados do ${entidadeFormatada}.`;
      case 'EXCLUIR':
        return `${usuario} removeu definitivamente um ${entidadeFormatada}.`;
      case 'ARQUIVAR':
        return `${usuario} inativou/arquivou o registro de ${entidadeFormatada}.`;
      case 'RESTAURAR':
        return `${usuario} restaurou o registro inativo do ${entidadeFormatada}.`;
      case 'LOGIN':
        return `${usuario} realizou login no sistema.`;
      case 'LOGOUT':
        return `${usuario} realizou logout do sistema.`;
      case 'MATRICULAR':
        return `${usuario} matriculou um aluno.`;
      case 'DESMATRICULAR':
        return `${usuario} cancelou uma matrícula.`;
      case 'FECHAR_DIARIO':
        return `${usuario} fechou/aprovou o diário de frequência.`;
      case 'REABRIR_DIARIO':
        return `${usuario} reabriu um diário de frequência.`;
      case 'MUDAR_STATUS':
        return `${usuario} alterou o status do ${entidadeFormatada}.`;
      default:
        return `${usuario} executou uma ação no ${entidadeFormatada}.`;
    }
  }

  private formatarEntidade(entidade: string): string {
    const mapa: Record<string, string> = {
      User: 'usuário',
      Apoiador: 'apoiador',
      Turma: 'turma',
      Frequencia: 'registro de frequência',
      Beneficiario: 'beneficiário',
      Contato: 'contato',
      Comunicado: 'comunicado',
      Certificado: 'certificado',
    };
    return mapa[entidade] || entidade.toLowerCase();
  }
}
