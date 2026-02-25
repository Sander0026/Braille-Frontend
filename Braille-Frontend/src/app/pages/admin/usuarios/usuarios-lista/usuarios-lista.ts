import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface UsuarioMock {
    id: string;
    nome: string;
    login: string;
    funcao: string;
}

@Component({
    selector: 'app-usuarios-lista',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './usuarios-lista.html',
    styleUrls: ['./usuarios-lista.scss']
})
export class UsuariosLista implements OnInit {
    // TODO: Trocar por dados reais vindos da API (HttpClient)
    usuarios: UsuarioMock[] = [
        { id: '1', nome: 'Victor Oliveira', login: 'voliveira', funcao: 'Administrador' },
        { id: '2', nome: 'Maria Silva', login: 'msilva', funcao: 'Professor' },
        { id: '3', nome: 'João Souza', login: 'jsouza', funcao: 'Atendente' }
    ];

    usuarioEmEdicao: UsuarioMock | null = null;
    editForm!: FormGroup;

    constructor(private fb: FormBuilder) {
        this.editForm = this.fb.group({
            nome: ['', Validators.required],
            login: ['', Validators.required],
            funcao: ['', Validators.required]
        });
    }

    ngOnInit(): void {
    }

    abrirModalEdicao(usuario: UsuarioMock) {
        this.usuarioEmEdicao = usuario;
        this.editForm.patchValue({
            nome: usuario.nome,
            login: usuario.login,
            funcao: usuario.funcao
        });
    }

    fecharModalEdicao() {
        this.usuarioEmEdicao = null;
        this.editForm.reset();
    }

    salvarEdicao() {
        if (this.editForm.valid && this.usuarioEmEdicao) {
            // Find the user and update the mock data
            const index = this.usuarios.findIndex(u => u.id === this.usuarioEmEdicao!.id);
            if (index !== -1) {
                this.usuarios[index] = {
                    ...this.usuarios[index],
                    ...this.editForm.value
                };
            }
            this.fecharModalEdicao();
        }
    }
}
