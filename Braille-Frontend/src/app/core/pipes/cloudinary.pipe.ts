import { Pipe, PipeTransform } from '@angular/core';

export interface CloudinaryConfig {
    w?: number;
    h?: number;
    c?: string; // fill, scale, crop, etc
}

/**
 * CloudinaryPipe
 * Propósito: Recebe a URL Raw do provedor e anexa transformações severas de Compressão e Resizing.
 * Mobile First: Permite parametrizar `w` para reduzir o tamanho de download de MB para KB nativamente na CDN.
 */
@Pipe({
    name: 'cloudinary',
    standalone: true,
    pure: true
})
export class CloudinaryPipe implements PipeTransform {
    transform(url: string | null | undefined, config?: CloudinaryConfig): string {
        if (!url || typeof url !== 'string') return '';

        // Ignora recursos locais ou de outros buckets Storage (SRP: Unicamente CND Image Optimizer)
        if (!url.includes('res.cloudinary.com')) return url;

        // Tolerância e proteção contra injeções duplicadas do Prisma API 
        if (url.includes('f_auto') || url.includes('q_auto')) return url;

        // Compõe os parãmetros nativos inegociáveis de Alta Otimização WebP (WCAG/FPS)
        let transformacoes = 'f_auto,q_auto';

        // Implementação Modular Mobile First DTO
        if (config) {
            if (config.w) transformacoes += `,w_${config.w}`;
            if (config.h) transformacoes += `,h_${config.h}`;
            if (config.c) transformacoes += `,c_${config.c}`;
        }

        // Padrão do Repositório Mestre Cloudinary Upload
        // Injeta antes da pasta de upload final simulando a Request On-The-Fly.
        return url.replace('/upload/', `/upload/${transformacoes}/`);
    }
}
