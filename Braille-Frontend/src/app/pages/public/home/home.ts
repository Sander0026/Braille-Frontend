import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly oficinas = [
    {
      icon: '⠿',
      titulo: 'Leitura e Escrita Braille',
      descricao: 'Aprenda o sistema de leitura e escrita tátil criado por Louis Braille, base fundamental para a autonomia educacional.',
    },
    {
      icon: '💻',
      titulo: 'Informática Acessível',
      descricao: 'Uso de computadores com leitores de tela (NVDA, JAWS), navegação na internet e ferramentas de acessibilidade digital.',
    },
    {
      icon: '🎭',
      titulo: 'Artes e Expressão Cultural',
      descricao: 'Atividades de teatro, música e artesanato adaptado, estimulando criatividade e integração social.',
    },
    {
      icon: '🧶',
      titulo: 'Artesanato e Trabalhos Manuais',
      descricao: 'Cerâmica, tricô, crochê e outras atividades manuais que desenvolvem coordenação e geração de renda.',
    },
    {
      icon: '🏃',
      titulo: 'Orientação e Mobilidade',
      descricao: 'Técnicas de locomoção com bengala, reconhecimento de ambientes e uso seguro do espaço público.',
    },
    {
      icon: '📚',
      titulo: 'Reforço Escolar',
      descricao: 'Apoio pedagógico em matemática, português e outras disciplinas, com materiais didáticos adaptados.',
    },
  ];

  readonly depoimentos = [
    {
      texto: 'O instituto mudou minha vida. Aprendi Braille e hoje consigo ler e escrever com independência total.',
      nome: 'Maria Aparecida',
      idade: 52,
    },
    {
      texto: 'As aulas de informática me abriram portas no mercado de trabalho. Nunca imaginei que poderia usar um computador.',
      nome: 'João Carlos',
      idade: 34,
    },
    {
      texto: 'Encontrei amigos, aprendi coisas novas e me sinto parte da sociedade. O instituto é minha segunda família.',
      nome: 'Sandra Lima',
      idade: 41,
    },
  ];
}
