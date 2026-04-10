const fs = require('fs');
const path = 'e:\\\\PI-5\\\\Braille-Frontend\\\\Braille-Frontend\\\\src\\\\app\\\\pages\\\\admin\\\\usuarios\\\\components\\\\usuario-form-modal\\\\usuario-form-modal.component.html';
let code = fs.readFileSync(path, 'utf8');

// 1. Add aria-modal to `<dialog>`
code = code.replace(/<dialog([^>]*)aria-labelledby="modal-titulo"/, '<dialog$1aria-labelledby="modal-titulo" aria-modal="true"');

// 2. Change <p class="section-label">Dados Básicos</p> and following div to a <fieldset>
code = code.replace(
    /<p class="section-label">Dados Básicos<\/p>/,
    '<fieldset style="border: none; padding: 0; margin: 0; min-width: 0;">\n      <legend class="section-label">Dados Básicos</legend>'
);

// 3. Inject aria-invalid and aria-describedby for 'nome'
code = code.replace(
    /autocomplete="name" \/>\s*@if \(editForm\.get\('nome'\)\?\.invalid && editForm\.get\('nome'\)\?\.touched\) \{\s*<span class="form-error" role="alert">/g,
    `[attr.aria-invalid]="editForm.get('nome')?.invalid && editForm.get('nome')?.touched ? 'true' : null"
            [attr.aria-describedby]="(editForm.get('nome')?.invalid && editForm.get('nome')?.touched) ? 'err-nome' : null"
            autocomplete="name" />
          @if (editForm.get('nome')?.invalid && editForm.get('nome')?.touched) {
            <span id="err-nome" class="form-error" role="alert">`
);

// 4. Inject aria-invalid and aria-describedby for 'cpf' and its status indicator
code = code.replace(
    /autocomplete="off" \/>\s*<div class="cpf-status-indicator"/g,
    `[attr.aria-invalid]="(editForm.get('cpf')?.invalid && editForm.get('cpf')?.touched) || (cpfStatus() !== '' && cpfStatus() !== 'livre' && cpfStatus() !== 'verificando') ? 'true' : null"
            [attr.aria-describedby]="((editForm.get('cpf')?.invalid && editForm.get('cpf')?.touched) || (cpfStatus() !== '' && cpfStatus() !== 'livre' && cpfStatus() !== 'verificando')) ? 'err-cpf cpf-status-msg' : 'cpf-status-msg'"
            autocomplete="off" />
          
          <div id="cpf-status-msg" class="cpf-status-indicator"`
);
// fix err-cpf span
code = code.replace(
    /@if \(editForm\.get\('cpf'\)\?\.invalid && editForm\.get\('cpf'\)\?\.touched\) \{\s*<span class="form-error" role="alert">/g,
    `@if (editForm.get('cpf')?.invalid && editForm.get('cpf')?.touched) {
            <span id="err-cpf" class="form-error" role="alert">`
);

// 5. Inject for 'email'
code = code.replace(
    /autocomplete="email" \/>\s*@if \(editForm\.get\('email'\)\?\.invalid && editForm\.get\('email'\)\?\.touched\) \{\s*<span class="form-error" role="alert">/g,
    `[attr.aria-invalid]="editForm.get('email')?.invalid && editForm.get('email')?.touched ? 'true' : null"
            [attr.aria-describedby]="(editForm.get('email')?.invalid && editForm.get('email')?.touched) ? 'err-email' : null"
            autocomplete="email" />
          @if (editForm.get('email')?.invalid && editForm.get('email')?.touched) {
            <span id="err-email" class="form-error" role="alert">`
);

// 6. Inject for 'role'
code = code.replace(
    /formControlName="role">/g,
    `formControlName="role"
            [attr.aria-invalid]="editForm.get('role')?.invalid && editForm.get('role')?.touched ? 'true' : null"
            [attr.aria-describedby]="(editForm.get('role')?.invalid && editForm.get('role')?.touched) ? 'err-role' : null">`
);

code = code.replace(
    /<\/select>\s*<\/div>/g,
    `</select>
          @if (editForm.get('role')?.invalid && editForm.get('role')?.touched) {
            <span id="err-role" class="form-error" role="alert">Função obrigatória</span>
          }
        </div>`
);

// Close first fieldset right before Endereço
code = code.replace(
    /<\/div>\s*<!-- Seção: Endereço -->/,
    `</div>\n      </fieldset>\n\n      <!-- Seção: Endereço -->`
);

// 7. Change <p class="section-label">Endereço</p> and following div to a <fieldset>
code = code.replace(
    /<p class="section-label">Endereço<\/p>/,
    '<fieldset style="border: none; padding: 0; margin: 0; min-width: 0;">\n        <legend class="section-label">Endereço</legend>'
);

// Close second fieldset right before form close
code = code.replace(
    /<\/div>\s*<\/form>/,
    `</div>\n      </fieldset>\n    </form>`
);

// 8. Make Cancel / Save buttons fully disabled with aria
code = code.replace(/\[disabled\]="salvando\(\)"/g, `[disabled]="salvando()" [attr.aria-disabled]="salvando()"`);
code = code.replace(/\[disabled\]="editForm\.invalid \|\| salvando\(\)"/g, `[disabled]="editForm.invalid || salvando()" [attr.aria-disabled]="editForm.invalid || salvando()"`);

fs.writeFileSync(path, code);
console.log('HTML patch successful.');
