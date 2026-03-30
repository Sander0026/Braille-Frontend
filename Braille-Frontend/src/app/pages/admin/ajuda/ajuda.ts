import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface ManualCard {
  titulo: string;
  descricao: string;
  icon: string;
  cor: string;
  arquivo: string | null; // null = em breve
  perfis: string[];
}

@Component({
  selector: 'app-ajuda',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ajuda.html',
  styleUrl: './ajuda.scss'
})
export class Ajuda {
  pdfAtivo: string | null = null;
  tituloAtivo = '';

  readonly manuais: ManualCard[] = [
    {
      titulo: 'Guia da Secretaria',
      descricao: 'Como cadastrar alunos, gerenciar matrículas em oficinas e controlar frequências.',
      icon: 'badge',
      cor: 'primary',
      arquivo: null, // Será o path: 'assets/manuais/secretaria_guia.pdf'
      perfis: ['Secretaria', 'Admin']
    },
    {
      titulo: 'Guia do Professor',
      descricao: 'Como acessar o diário de classe, registrar presença e encerrar chamadas.',
      icon: 'school',
      cor: 'info',
      arquivo: null, // Será o path: 'assets/manuais/professor_guia.pdf'
      perfis: ['Professor', 'Admin']
    },
    {
      titulo: 'Guia da Comunicação',
      descricao: 'Como publicar comunicados, gerenciar notícias, eventos e o conteúdo do site institucional.',
      icon: 'campaign',
      cor: 'warning',
      arquivo: null, // Será o path: 'assets/manuais/comunicacao_guia.pdf'
      perfis: ['Comunicação', 'Admin']
    },
    {
      titulo: 'Guia do Administrador',
      descricao: 'Emissão de certificados, gestão de apoiadores, comunicados e configurações do sistema.',
      icon: 'admin_panel_settings',
      cor: 'success',
      arquivo: null, // Será o path: 'assets/manuais/admin_guia.pdf'
      perfis: ['Admin']
    }
  ];

  readonly tecnologias = [
    { nome: 'Angular 19', icon: '🅰️', descricao: 'Frontend' },
    { nome: 'NestJS', icon: '🐈', descricao: 'Backend API' },
    { nome: 'PostgreSQL + Neon', icon: '🐘', descricao: 'Banco de Dados' },
    { nome: 'Cloudinary', icon: '☁️', descricao: 'Armazenamento de Arquivos' },
    { nome: 'Vercel', icon: '▲', descricao: 'Hospedagem Frontend' },
    { nome: 'Render.com', icon: '🌐', descricao: 'Hospedagem Backend' },
  ];

  readonly equipe = [
    { nome: 'Equipe PI-5', papel: 'Desenvolvimento e Arquitetura' },
  ];

  abrirManual(manual: ManualCard): void {
    if (!manual.arquivo) return;
    this.pdfAtivo = manual.arquivo;
    this.tituloAtivo = manual.titulo;
  }

  fecharPdf(): void {
    this.pdfAtivo = null;
    this.tituloAtivo = '';
  }
}
