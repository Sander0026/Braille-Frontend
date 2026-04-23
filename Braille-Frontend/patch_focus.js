const fs = require('fs');
const path = 'e:\\\\PI-5\\\\Braille-Frontend\\\\Braille-Frontend\\\\src\\\\app\\\\features\\\\beneficiaries\\\\beneficiary-list\\\\beneficiary-list.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /private lastFocusBeforeModal:\s*HTMLElement\s*\|\s*null\s*=\s*null;/,
`private focusStack: HTMLElement[] = [];

  private pushFocus(): void {
    const el = document.activeElement as HTMLElement;
    if (el) this.focusStack.push(el);
  }

  private popFocus(): void {
    const fn = () => {
      const el = this.focusStack.pop();
      if (el && document.body.contains(el)) el.focus();
    };
    setTimeout(fn, 50);
  }`
);

code = code.replace(/this\.lastFocusBeforeModal = document\.activeElement as HTMLElement;/g, 'this.pushFocus();');
code = code.replace(/setTimeout\(\(\) => this\.lastFocusBeforeModal\?\.focus\(\), 0\);/g, 'this.popFocus();');

function inject(funcName, act) {
    const regex = new RegExp(`(${funcName}\\(.*?\\):\\s*void\\s*\\{\\s*)`);
    const actStr = act === 'push' ? 'this.pushFocus();\\n    ' : 'this.popFocus();\\n    ';
    code = code.replace(regex, `$1${actStr}`);
}

inject('inativar', 'push');
inject('cancelarInativacao', 'pop');
code = code.replace(
    /this\.alunoParaInativar = null;\n\s*this\.toast\.sucesso\('Aluno inativado com sucesso!'\);/g,
    "this.alunoParaInativar = null;\n          this.popFocus();\n          this.toast.sucesso('Aluno inativado com sucesso!');"
);
code = code.replace(
    /this\.toast\.erro\('Erro ao inativar aluno\.'\);/g,
    "this.popFocus();\n          this.toast.erro('Erro ao inativar aluno.');"
);

inject('excluirDefinitivamente', 'push');
inject('cancelarExclusaoDefinitiva', 'pop');
code = code.replace(
    /this\.alunoParaExcluirDefinitivo = null;\n\s*this\.toast\.sucesso\('Aluno excluído definitivamente com sucesso!'\);/g,
    "this.alunoParaExcluirDefinitivo = null;\n          this.popFocus();\n          this.toast.sucesso('Aluno excluído definitivamente com sucesso!');"
);
code = code.replace(
    /this\.toast\.erro\('Erro ao excluir aluno definitivamente\.'\);/g,
    "this.popFocus();\n          this.toast.erro('Erro ao excluir aluno definitivamente.');"
);

inject('restaurarConta', 'push');
inject('cancelarRestauracao', 'pop');
code = code.replace(
    /this\.alunoParaRestaurar = null;\n\s*this\.toast\.sucesso\('Aluno restaurado com sucesso!'\);/g,
    "this.alunoParaRestaurar = null;\n          this.popFocus();\n          this.toast.sucesso('Aluno restaurado com sucesso!');"
);
code = code.replace(
    /this\.toast\.erro\('Erro ao restaurar aluno\.'\);/g,
    "this.popFocus();\n          this.toast.erro('Erro ao restaurar aluno.');"
);

inject('excluirDocumento', 'push');
inject('cancelarExclusaoDocumento', 'pop');
code = code.replace(
    /this\.documentoParaExcluir = null;\n\s*this\.toast\.sucesso\('Documento excluído com sucesso!'\);/g,
    "this.documentoParaExcluir = null;\n              this.popFocus();\n              this.toast.sucesso('Documento excluído com sucesso!');"
);
code = code.replace(
    /this\.toast\.erro\('Erro ao desvincular documento do aluno\.'\);/g,
    "this.popFocus();\n              this.toast.erro('Erro ao desvincular documento do aluno.');"
);
code = code.replace(
    /this\.deletandoImage = false;\n\s*this\.toast\.erro\('Erro ao excluir documento\.'\);/g,
    "this.deletandoImage = false;\n        this.popFocus();\n        this.toast.erro('Erro ao excluir documento.');"
);

inject('abrirVisualizadorPdf', 'push');
inject('fecharVisualizadorPdf', 'pop');
inject('abrirModalImagem', 'push');
inject('fecharModalImagem', 'pop');
inject('abrirModalGerenciamentoAtestados', 'push');
inject('fecharModalGerenciamentoAtestados', 'pop');
inject('abrirModalAtestadoForm', 'push');
inject('fecharModalAtestadoForm', 'pop');
inject('abrirModalGerenciamentoLaudos', 'push');
inject('fecharModalGerenciamentoLaudos', 'pop');
inject('abrirModalLaudoForm', 'push');
inject('fecharModalLaudoForm', 'pop');
inject('abrirModalLgpd', 'push');
inject('fecharModalLgpd', 'pop');

fs.writeFileSync(path, code);
