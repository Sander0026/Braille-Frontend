import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BeneficiariosService, Beneficiario } from '../../../core/services/beneficiarios.service';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './beneficiary-list.html',
  styleUrl: './beneficiary-list.scss'
})
export class BeneficiaryList implements OnInit, OnDestroy {
  alunos: Beneficiario[] = [];
  isLoading = true;
  erro = '';

  // Paginação
  paginaAtual = 1;
  totalPaginas = 1;
  total = 0;
  readonly limite = 10;

  // Busca
  buscaCtrl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(private beneficiariosService: BeneficiariosService) { }

  ngOnInit(): void {
    // Busca com debounce de 400ms
    this.buscaCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.paginaAtual = 1;
      this.carregar();
    });

    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.isLoading = true;
    const nome = this.buscaCtrl.value?.trim() || undefined;
    this.beneficiariosService.listar(this.paginaAtual, this.limite, nome).subscribe({
      next: (res) => {
        this.alunos = res.data;
        this.total = res.meta.total;
        this.totalPaginas = res.meta.lastPage;
        this.isLoading = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar alunos. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.carregar();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  formatarData(data: string): string {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  inativar(aluno: Beneficiario): void {
    if (!confirm(`Inativar ${aluno.nomeCompleto}?`)) return;
    this.beneficiariosService.inativar(aluno.id).subscribe({
      next: () => this.carregar(),
      error: () => alert('Erro ao inativar aluno.')
    });
  }
}
