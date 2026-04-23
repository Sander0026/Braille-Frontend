/**
 * Gera um preview de texto limpo a partir de HTML rico (Quill, TipTap, etc.).
 *
 * Remove todas as tags HTML, normaliza espaços e trunca o resultado.
 * Seguro para uso em listagens, Dashboards e previews de conteúdo.
 *
 * @param html - String HTML a ser limpa (aceita null/undefined)
 * @param max  - Limite máximo de caracteres no resultado (padrão: 150)
 * @returns    String de texto puro, truncada com '…' se necessário
 */
export function generatePreview(html: string | null | undefined, max = 150): string {
  if (!html) return '';

  const semQuebrasDeLinha = html
    // Adiciona espaço antes de fechar tags de bloco para separar parágrafos visualmente
    .replace(/<\/(p|div|h[1-6])>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ');

  const semTags = semQuebrasDeLinha.replace(/<\/?[^>]+(>|$)/g, '');

  const limpo = semTags
    .replaceAll('&nbsp;', ' ')
    .replace(/\s+/g, ' ')  // regex cobre todos os tipos de whitespace — correto manter
    .trim();

  return limpo.length > max ? `${limpo.slice(0, max)}…` : limpo;
}

/**
 * @deprecated Use a função `generatePreview` diretamente.
 * Mantido como alias de retrocompatibilidade para consumers existentes.
 */
export const HtmlSanitizerUtil = { generatePreview };
