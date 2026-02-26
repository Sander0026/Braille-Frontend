import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';

interface TurmaMock {
    id: string;
    nome: string;
    mes: string;
    ano: number;
    professor: string;
    arquivada: boolean;
    alunos: AlunoMock[];
}

interface AlunoMock {
    id: string;
    nome: string;
    idade: number;
    contato: string;
}

@Component({
    selector: 'app-turmas-lista',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
    templateUrl: './turmas-lista.html',
    styleUrls: ['./turmas-lista.scss']
})
export class TurmasLista implements OnInit {
    // Mock global de alunos do sistema
    alunosSistema: AlunoMock[] = [
        { id: '101', nome: 'João Pedro', idade: 25, contato: '(11) 99999-9999' },
        { id: '102', nome: 'Maria Clara', idade: 30, contato: '(11) 98888-8888' },
        { id: '103', nome: 'Lucas Silva', idade: 22, contato: '(11) 97777-7777' },
        { id: '104', nome: 'Ana Souza', idade: 28, contato: '(11) 96666-6666' },
        { id: '105', nome: 'Carlos Oliveira', idade: 35, contato: '(11) 95555-5555' },
        { id: '106', nome: 'Fernanda Lima', idade: 19, contato: '(11) 94444-4444' }
    ];

    professoresSistema: string[] = [
        'Roberto Carlos',
        'Amanda Nunes',
        'Sérgio Cortella',
        'Luciana Sampaio',
        'Fernando Pessoa'
    ];

    turmas: TurmaMock[] = [
        {
            id: '1', nome: 'Turma Informática Básica', mes: 'Fevereiro', ano: 2026, professor: 'Roberto Carlos', arquivada: false, alunos: [
                this.alunosSistema[0], // João Pedro
                this.alunosSistema[1]  // Maria Clara
            ]
        },
        {
            id: '2', nome: 'Turma Braille', mes: 'Março', ano: 2026, professor: 'Amanda Nunes', arquivada: false, alunos: [
                this.alunosSistema[2]  // Lucas Silva
            ]
        }
    ];

    mesFiltro: string = '';
    anoFiltro: string = '';
    nomeFiltro: string = '';

    turmaExpandida: string | null = null;
    alunoSelecionado: AlunoMock | null = null;

    turmaEmEdicao: TurmaMock | null = null;
    editTurmaForm!: FormGroup;

    constructor(private fb: FormBuilder) {
        this.editTurmaForm = this.fb.group({
            nome: [''],
            mes: [''],
            ano: [''],
            professor: [''],
            alunosSelecionadosIds: [[]]
        });
    }

    ngOnInit(): void { }

    get turmasFiltradas(): TurmaMock[] {
        return this.turmas.filter(t => {
            const matchMes = !this.mesFiltro || t.mes.toLowerCase() === this.mesFiltro.toLowerCase();
            const matchAno = !this.anoFiltro || t.ano.toString() === this.anoFiltro;
            const matchNome = !this.nomeFiltro || t.nome.toLowerCase().includes(this.nomeFiltro.toLowerCase());
            return matchMes && matchAno && matchNome;
        });
    }

    get alunosDisponiveisParaAdicionar(): AlunoMock[] {
        if (!this.turmaEmEdicao) return [];
        const alunosNaTurmaIds = this.turmaEmEdicao.alunos.map(a => a.id);
        return this.alunosSistema.filter(a => !alunosNaTurmaIds.includes(a.id));
    }

    toggleTurma(turmaId: string) {
        if (this.turmaExpandida === turmaId) {
            this.turmaExpandida = null;
        } else {
            this.turmaExpandida = turmaId;
        }
    }

    abrirDetalhesAluno(aluno: AlunoMock) {
        this.alunoSelecionado = aluno;
    }

    fecharDetalhesAluno() {
        this.alunoSelecionado = null;
    }

    editarTurma(turma: TurmaMock, event: Event) {
        event.stopPropagation();
        this.turmaEmEdicao = turma;
        this.editTurmaForm.patchValue({
            nome: turma.nome,
            mes: turma.mes,
            ano: turma.ano,
            professor: turma.professor || '',
            alunosSelecionadosIds: []
        });
    }

    fecharModalEdicaoTurma() {
        this.turmaEmEdicao = null;
        this.editTurmaForm.reset();
    }

    toggleAlunoSelecao(alunoId: string, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        const controle = this.editTurmaForm.get('alunosSelecionadosIds');
        let valoresAtuais = controle?.value || [];

        if (isChecked) {
            if (!valoresAtuais.includes(alunoId)) {
                valoresAtuais.push(alunoId);
            }
        } else {
            valoresAtuais = valoresAtuais.filter((id: string) => id !== alunoId);
        }
        controle?.setValue(valoresAtuais);
    }

    adicionarAluno() {
        if (this.turmaEmEdicao) {
            const alunosIds: string[] = this.editTurmaForm.value.alunosSelecionadosIds || [];

            if (alunosIds.length > 0) {
                const alunosParaAdicionar = this.alunosSistema.filter(a => alunosIds.includes(a.id));
                this.turmaEmEdicao.alunos.push(...alunosParaAdicionar);

                this.editTurmaForm.patchValue({
                    alunosSelecionadosIds: []
                });
            }
        }
    }

    removerAlunoNaEdicao(alunoId: string) {
        if (this.turmaEmEdicao) {
            this.turmaEmEdicao.alunos = this.turmaEmEdicao.alunos.filter(a => a.id !== alunoId);
        }
    }

    salvarEdicaoTurma() {
        if (this.turmaEmEdicao) {
            const index = this.turmas.findIndex(t => t.id === this.turmaEmEdicao!.id);
            if (index !== -1) {
                this.turmas[index] = {
                    ...this.turmaEmEdicao,
                    nome: this.editTurmaForm.value.nome,
                    mes: this.editTurmaForm.value.mes,
                    ano: this.editTurmaForm.value.ano,
                    professor: this.editTurmaForm.value.professor
                };
            }
            this.fecharModalEdicaoTurma();
        }
    }

    arquivarTurma(turma: TurmaMock, event: Event) {
        event.stopPropagation();

        const index = this.turmas.findIndex(t => t.id === turma.id);
        if (index !== -1) {
            this.turmas[index].arquivada = !this.turmas[index].arquivada;
            const status = this.turmas[index].arquivada ? 'arquivada' : 'desarquivada';
            alert(`Turma ${status} com sucesso. Ela continua visível na busca.`);
        }
    }
}
