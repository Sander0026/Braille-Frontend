import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * SRP (Single Responsibility Principle)
 * Serviço Sênior totalmente focado em Transportar I/O de Blobs, Arquivos Binários e Exclusões de Nuvem (Cloudinary / S3).
 * Limpa o lixo interno dos serviços de Auth e Benefícios!
 */
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private readonly uploadApi = '/api/upload';

    constructor(private readonly http: HttpClient) { }

    uploadGlobalImage(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>(this.uploadApi, formData);
    }

    uploadSecurePdf(file: File, tipo: 'lgpd' | 'atestado' | 'laudo'): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>(`${this.uploadApi}/pdf?tipo=${tipo}`, formData);
    }

    deleteCloudFile(urlArquivo: string): Observable<any> {
        const params = new HttpParams().set('url', urlArquivo);
        return this.http.delete(this.uploadApi, { params });
    }
}
