export class HtmlSanitizerUtil {
  /**
   * Remove tags HTML e retorna apenas o texto limpo adequadamente truncado.
   * Útil para previews de conteúdo Rico (QuillJS) em listagens e Dashboards, poupando a thread.
   *
   * @param html String HTML a ser limpa
   * @param max Limite máximo de caracteres permitidos
   * @returns String formatada contendo apenas texto amigável
   */
  static generatePreview(html: string | null | undefined, max = 15): string {
    if (!html) return '';
    const htmlComEspaco = html.replace(/<\/(p|div|h[1-6])>/gi, ' ').replace(/<br\s*[\/]?>/gi, ' ');
    const semTags = htmlComEspaco.replace(/<\/?[^>]+(>|$)/g, '');
    const limpo = semTags.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    
    return limpo.length > max ? limpo.slice(0, max) + '…' : limpo;
  }
}
