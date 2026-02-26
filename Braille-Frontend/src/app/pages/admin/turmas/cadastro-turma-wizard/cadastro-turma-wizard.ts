import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-cadastro-turma-wizard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './cadastro-turma-wizard.html',
    styleUrls: ['./cadastro-turma-wizard.scss']
})
export class CadastroTurmaWizard implements OnInit {
    etapaAtual: number = 1;
    totalEtapas: number = 2;

    formTurma!: FormGroup;

    mensagemFeedback: string | null = null;
    tipoFeedback: 'sucesso' | 'erro' | null = null;

    professoresSistema: string[] = [
        'Roberto Carlos',
        'Amanda Nunes',
        'Sérgio Cortella',
        'Luciana Sampaio',
        'Fernando Pessoa'
    ];

    constructor(private fb: FormBuilder, private router: Router) {
        this.formTurma = this.fb.group({
            nome: ['', Validators.required],
            professor: ['', Validators.required],
            mes: ['', Validators.required],
            ano: [(new Date()).getFullYear(), [Validators.required, Validators.min(2000)]],
            descricao: [''],
            capacidade: [20, [Validators.required, Validators.min(1)]]
        });
    }

    ngOnInit(): void {
    }

    proximaEtapa() {
        if (this.etapaAtual === 1) {
            // Validate first step if needed
            // For now, it's just one main step, but split into two for the wizard feel
            this.etapaAtual++;
        }
    }

    etapaAnterior() {
        if (this.etapaAtual > 1) {
            this.etapaAtual--;
        }
    }

    finalizarCadastro() {
        if (this.formTurma.valid) {
            // Aqui integraria com a API real
            console.log('Dados da Turma:', this.formTurma.value);
            this.mostrarFeedback('Turma cadastrada com sucesso!', 'sucesso');

            setTimeout(() => {
                this.router.navigate(['/admin/turmas']);
            }, 2000);
        } else {
            this.formTurma.markAllAsTouched();
            this.mostrarFeedback('Por favor, preencha todos os campos obrigatórios corretamente.', 'erro');
        }
    }

    mostrarFeedback(mensagem: string, tipo: 'sucesso' | 'erro') {
        this.mensagemFeedback = mensagem;
        this.tipoFeedback = tipo;
        setTimeout(() => {
            this.mensagemFeedback = null;
            this.tipoFeedback = null;
        }, 5000);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.formTurma.get(fieldName);
        return field ? (field.invalid && (field.dirty || field.touched)) : false;
    }
}
