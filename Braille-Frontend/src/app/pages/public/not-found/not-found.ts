import { Component, ChangeDetectionStrategy, Inject, PLATFORM_ID, signal, OnInit } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // Sem Avaliação em Massa Desnecessária
})
export class NotFound implements OnInit {

  // Signal Reativo puro com alocação O(1) e leitura rápida na DOM
  possuiHistorico = signal<boolean>(false);

  constructor(
    private location: Location, 
    private router: Router,
    // O Injection Token e Platform previnem Accessos Perigosos Globais se renderizado Universal (SSR)
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Quando navigationId > 1 detectamos firmemente o Router interno rodando.
      // Acima de 2 detectamos firmemente saltos via Referência Nativa de Browser sem Router SPA
      const navId = history.state?.navigationId || 1;
      this.possuiHistorico.set(navId > 1 || window.history.length > 2);
    }
  }

  voltarPaginaAnterior(): void {
    // Salvaguarda: Acidente do Botão Voltar Sem Histórico Redirecionará ao Início Limpamente
    if (this.possuiHistorico()) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
