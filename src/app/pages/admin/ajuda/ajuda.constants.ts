export type ManualRole = 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'COMUNICACAO';
export type ManualCardId = 'secretaria' | 'professor' | 'comunicacao' | 'administrador';

export interface ManualArquivo {
  titulo: string;
  descricao: string;
  arquivo: string;
  nomeArquivo: string;
  cardIds: ManualCardId[];
  roles: ManualRole[];
  conteudo?: ManualConteudoAcessivel;
}

export interface ManualCard {
  id: ManualCardId;
  titulo: string;
  descricao: string;
  icon: string;
  cor: string;
  arquivo: string | null;
  roles: ManualRole[];
}

export interface ManualConteudoAcessivel {
  introducao: string[];
  secoes: ManualSecaoAcessivel[];
}

export interface ManualSecaoAcessivel {
  titulo: string;
  textos: string[];
  itens?: string[];
  alerta?: string;
}

export interface TecnologiaItem {
  nome: string;
  icon: string;
  descricao: string;
}

export interface EquipeItem {
  nome: string;
  papel: string;
  github: string;
}

export const MANUAIS_AJUDA: ManualCard[] = [
  {
    id: 'secretaria',
    titulo: 'Guia da Secretaria',
    descricao: 'Como cadastrar alunos, gerenciar matrículas em oficinas e controlar frequências.',
    icon: 'badge',
    cor: 'primary',
    arquivo: null,
    roles: ['SECRETARIA', 'ADMIN']
  },
  {
    id: 'professor',
    titulo: 'Guia do Professor',
    descricao: 'Como acessar o diário de classe, registrar presença e encerrar chamadas.',
    icon: 'school',
    cor: 'info',
    arquivo: null,
    roles: ['PROFESSOR', 'ADMIN', 'SECRETARIA']
  },
  {
    id: 'comunicacao',
    titulo: 'Guia da Comunicação',
    descricao: 'Como publicar comunicados, gerenciar notícias, eventos e o conteúdo do site institucional.',
    icon: 'campaign',
    cor: 'warning',
    arquivo: null,
    roles: ['COMUNICACAO', 'ADMIN']
  },
  {
    id: 'administrador',
    titulo: 'Guia do Administrador',
    descricao: 'Emissão de certificados, gestão de apoiadores, comunicados e configurações do sistema.',
    icon: 'admin_panel_settings',
    cor: 'success',
    arquivo: null,
    roles: ['ADMIN']
  }
];

/*
 * Para adicionar novos PDFs:
 * 1. Coloque o arquivo em src/assets/manuais.
 * 2. Cadastre o PDF abaixo uma unica vez.
 * 3. Em cardIds, informe em quais cards ele deve aparecer.
 * 4. Em roles, informe quem pode ver. ADMIN ve todos automaticamente.
 */
export const ARQUIVOS_MANUAIS_AJUDA: ManualArquivo[] = [
  {
    titulo: 'Cadastrar um novo aluno',
    descricao: 'Passo a passo para registrar um aluno no sistema.',
    arquivo: '/assets/manuais/cadastrar_um_novo_aluno.pdf',
    nomeArquivo: 'cadastrar_um_novo_aluno.pdf',
    cardIds: ['secretaria', 'administrador'],
    roles: ['SECRETARIA'],
    conteudo: {
      introducao: [
        'Aprenda a fazer o cadastro de novos alunos no Sistema Administrativo ILBES.',
        'Este guia orienta o preenchimento das informacoes pessoais, de contato, educacionais e medicas para que o cadastro seja concluido com seguranca.'
      ],
      secoes: [
        {
          titulo: 'Iniciar o cadastro',
          textos: [
            'Na tela Alunos, selecione o botao Novo Aluno para iniciar o cadastro.',
            'O sistema abrira o formulario de cadastro dividido em quatro etapas.'
          ]
        },
        {
          titulo: 'Preencher os dados iniciais',
          textos: [
            'Siga cada etapa preenchendo as informacoes solicitadas nos campos do formulario.',
            'Para adicionar Foto 3x4 ou Termo LGPD opcional, selecione o campo correspondente e escolha o arquivo quando o sistema solicitar.'
          ],
          alerta: 'Arquivos enviados ao sistema devem respeitar o limite de 10 MB.'
        },
        {
          titulo: 'Avancar com seguranca',
          textos: [
            'Depois de preencher a primeira etapa, selecione Avancar para continuar.',
            'Se voce tentar recarregar a pagina ou acessar outra tela durante o cadastro, o sistema exibira uma confirmacao de descarte.'
          ],
          itens: [
            'Para continuar preenchendo, selecione Continuar editando.',
            'Para sair e perder as alteracoes ainda nao salvas, confirme o descarte.'
          ]
        },
        {
          titulo: 'Informar contato e localizacao',
          textos: [
            'Na segunda etapa, preencha as informacoes de endereco e contato do aluno.',
            'Campos marcados como obrigatorios precisam ser preenchidos antes de avancar para a proxima etapa.'
          ],
          itens: [
            'Informe CEP, rua, numero ou marque S/N quando o aluno nao tiver numero residencial.',
            'Preencha bairro, cidade, UF, telefone e demais dados disponiveis.'
          ]
        },
        {
          titulo: 'Informar perfil da deficiencia visual',
          textos: [
            'Na etapa seguinte, informe os dados relacionados ao perfil da deficiencia visual do aluno.',
            'Quando a opcao Possui laudo medico for marcada, um campo de envio de arquivo sera exibido.'
          ],
          itens: [
            'Selecione o arquivo do laudo medico quando houver.',
            'Revise as informacoes antes de avancar.'
          ],
          alerta: 'O envio de laudo tambem deve respeitar o limite de 10 MB por arquivo.'
        },
        {
          titulo: 'Informar saude, autonomia e concluir',
          textos: [
            'Na ultima etapa, preencha as informacoes de situacao socioeconomica, saude e autonomia.',
            'Marque as opcoes quando o aluno necessita de acompanhante ou realiza acompanhamento oftalmologico.'
          ],
          itens: [
            'Se houver outras comorbidades, descreva no campo Descrever outras condicoes.',
            'Depois de revisar todas as informacoes, selecione Concluir cadastro.'
          ]
        }
      ]
    }
  },
  {
    titulo: 'Cadastrar um novo apoiador',
    descricao: 'Passo a passo para registrar um apoiador no sistema.',
    arquivo: '/assets/manuais/cadastrar_um_novo_apoiador.pdf',
    nomeArquivo: 'cadastrar_um_novo_apoiador.pdf',
    cardIds: ['secretaria', 'administrador', 'comunicacao'],
    roles: ['COMUNICACAO']
  },
  {
    titulo: 'Cadastrar um novo certificado',
    descricao: 'Passo a passo para registrar um novo certificado no sistema.',
    arquivo: '/assets/manuais/cadastrar_um_novo_certificado.pdf',
    nomeArquivo: 'cadastrar_um_novo_certificado.pdf',
    cardIds: ['comunicacao', 'administrador'],
    roles: ['COMUNICACAO']
  },
  {
    titulo: 'Cadastrar um novo usuário',
    descricao: 'Passo a passo para registrar um novo usuário no sistema.',
    arquivo: '/assets/manuais/cadastrar_um_novo_usuario.pdf',
    nomeArquivo: 'cadastrar_um_novo_usuario.pdf',
    cardIds: ['administrador'],
    roles: ['ADMIN'] // Mesmo que seja só para ADMIN, é bom deixar claro
  },
  {
    titulo: 'Realizar chamada',
    descricao: 'Passo a passo para realizar uma chamada no sistema.',
    arquivo: '/assets/manuais/realizar_chamada.pdf',
    nomeArquivo: 'realizar_chamada.pdf',
    cardIds: ['administrador', 'professor','secretaria'],
    roles: ['PROFESSOR'] // Mesmo que seja só para ADMIN, é bom deixar claro
  },
  {
    titulo: 'Alterar informações do site',
    descricao: 'Passo a passo para alterar informações do site institucional no sistema.',
    arquivo: '/assets/manuais/alterar_informacoes_site.pdf',
    nomeArquivo: 'alterar_informacoes_site.pdf',
    cardIds: ['administrador','comunicacao'],
    roles: ['COMUNICACAO'] // Mesmo que seja só para ADMIN, é bom deixar claro
  }
];

export const TECNOLOGIAS_SISTEMA: TecnologiaItem[] = [
  { nome: 'Angular 19', icon: 'code', descricao: 'Frontend' },
  { nome: 'NestJS', icon: 'api', descricao: 'Backend API' },
  { nome: 'PostgreSQL + Neon', icon: 'database', descricao: 'Banco de Dados' },
  { nome: 'Cloudinary', icon: 'cloud', descricao: 'Armazenamento de Arquivos' },
  { nome: 'Vercel', icon: '▲', descricao: 'Hospedagem Frontend' },
  { nome: 'Render.com', icon: 'language', descricao: 'Hospedagem Backend' },
];

export const EQUIPE_SISTEMA: EquipeItem[] = [
  { nome: 'Alexsander Ribeiro', papel: 'Dev', github: 'https://github.com/Sander0026' },
  { nome: 'Nickolas Blendes', papel: 'Dev', github: 'https://github.com/NycollasBlenes-max' },
  { nome: 'Victor Severiano', papel: 'Dev', github: 'https://github.com/VictorSeveriano' },
];
