import { Component, signal } from '@angular/core';
import { ShellComponent } from "./layout/shell/shell";

@Component({
  selector: 'app-root',
  imports: [ShellComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('TourPlanner');
}
