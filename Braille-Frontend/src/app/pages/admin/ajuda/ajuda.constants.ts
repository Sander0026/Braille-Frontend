export type ManualRole = 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'COMUNICACAO';
export type ManualCardId = 'secretaria' | 'professor' | 'comunicacao' | 'administrador';

export interface ManualArquivo {
  titulo: string;
  descricao: string;
  arquivo: string;
  nomeArquivo: string;
  cardIds: ManualCardId[];
  roles: ManualRole[];
}

export interface ManualCard {
  id: ManualCardId;
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
    perfis: ['Secretaria', 'Admin']
  },
  {
    id: 'professor',
    titulo: 'Guia do Professor',
    descricao: 'Como acessar o diário de classe, registrar presença e encerrar chamadas.',
    icon: 'school',
    cor: 'info',
    arquivo: null,
    perfis: ['Professor', 'Admin', 'Secretaria']
  },
  {
    id: 'comunicacao',
    titulo: 'Guia da Comunicação',
    descricao: 'Como publicar comunicados, gerenciar notícias, eventos e o conteúdo do site institucional.',
    icon: 'campaign',
    cor: 'warning',
    arquivo: null,
    perfis: ['Comunicação', 'Admin']
  },
  {
    id: 'administrador',
    titulo: 'Guia do Administrador',
    descricao: 'Emissão de certificados, gestão de apoiadores, comunicados e configurações do sistema.',
    icon: 'admin_panel_settings',
    cor: 'success',
    arquivo: null,
    perfis: ['Admin']
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
    roles: ['SECRETARIA']
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
