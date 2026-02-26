import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiButtonComponent } from './shared/components/ui-button/ui-button';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Braille-Frontend');
}
