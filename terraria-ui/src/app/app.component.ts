import { Component } from '@angular/core';
import { TerrariaComponent } from './terraria/terraria.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TerrariaComponent],
  template: '<app-terraria></app-terraria>',
  styles: [':host { display: block; height: 100%; }']
})
export class AppComponent {}
