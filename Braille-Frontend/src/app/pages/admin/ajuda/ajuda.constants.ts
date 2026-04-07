export interface ManualCard {
  titulo: string;
  descricao: string;
  icon: string;
  cor: string;
  arquivo: string | null;
  perfis: string[];
}

export interface TecnologiaItem {
  nome: string;
  icon: string;
  descricao: string;
}

export interface EquipeItem {
  nome: string;
  papel: string;
}

export const MANUAIS_AJUDA: ManualCard[] = [
  {
    titulo: 'Guia da Secretaria',
    descricao: 'Como cadastrar alunos, gerenciar matrículas em oficinas e controlar frequências.',
    icon: 'badge',
    cor: 'primary',
    arquivo: null,
    perfis: ['Secretaria', 'Admin']
  },
  {
    titulo: 'Guia do Professor',
    descricao: 'Como acessar o diário de classe, registrar presença e encerrar chamadas.',
    icon: 'school',
    cor: 'info',
    arquivo: null,
    perfis: ['Professor', 'Admin']
  },
  {
    titulo: 'Guia da Comunicação',
    descricao: 'Como publicar comunicados, gerenciar notícias, eventos e o conteúdo do site institucional.',
    icon: 'campaign',
    cor: 'warning',
    arquivo: null,
    perfis: ['Comunicação', 'Admin']
  },
  {
    titulo: 'Guia do Administrador',
    descricao: 'Emissão de certificados, gestão de apoiadores, comunicados e configurações do sistema.',
    icon: 'admin_panel_settings',
    cor: 'success',
    arquivo: null,
    perfis: ['Admin']
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
  { nome: 'Equipe PI-5', papel: 'Desenvolvimento e Arquitetura' },
];
