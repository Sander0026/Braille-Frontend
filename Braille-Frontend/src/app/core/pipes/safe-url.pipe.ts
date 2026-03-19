import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(url: string | null | undefined): SafeResourceUrl {
    if (!url) return '';
    // Este comando diz ao Angular: "Pode confiar, essa URL é segura para colocar num iframe"
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}