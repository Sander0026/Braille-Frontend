import { Pipe, PipeTransform } from '@angular/core';

/**
 * CloudinaryPipe
 * Propósito: Recebe uma URL insegura/pesada do Cloudinary e a reescreve ativando os Transformers CND
 * das tags f_auto (Retorna WEBP para o Chrome), e q_auto (Retorna Qualidade 60~80%). Reduz o consumo em 90%.
 */
@Pipe({
    name: 'cloudinary',
    standalone: true
})
export class CloudinaryPipe implements PipeTransform {
    transform(url: string | null | undefined): string {
        if (!url) return '';

        // Se não for cloudinary (ou for base64 local), retorna intacto
        if (!url.includes('res.cloudinary.com')) return url;

        // Se a API já gravadora já inseriu otimização nativa, não repete (Impede bugs)
        if (url.includes('f_auto') || url.includes('q_auto')) return url;

        // O padrão de upload do pacote nativo NodejS Cloudinary é:
        // https://res.cloudinary.com/<CLOUD>/image/upload/v12345/folder/file.jpg
        // Vamos injetar os transformadores /f_auto,q_auto/ LOGO APÓS o /upload/
        return url.replace('/upload/', '/upload/f_auto,q_auto/');
    }
}
