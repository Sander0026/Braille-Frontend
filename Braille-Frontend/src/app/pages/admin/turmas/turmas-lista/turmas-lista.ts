import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TurmasService, Turma } from '../../../../core/services/turmas.service';

@Component({
    selector: 'app-turmas-lista',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './turmas-lista.html',
    styleUrl: './turmas-lista.scss'
})
export class TurmasLista implements OnInit {
    turmas: Turma[] = [];
    isLoading = true;
    erro = '';

    constructor(private turmasService: TurmasService) { }

    ngOnInit(): void {
        this.turmasService.listar().subscribe({
            next: (res) => { this.turmas = res.data; this.isLoading = false; },
            error: () => { this.erro = 'Erro ao carregar turmas.'; this.isLoading = false; }
        });
    }
}
