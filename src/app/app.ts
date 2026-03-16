import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellComponent } from "./shell/shell";

@Component({
  selector: 'app-root',
  imports: [ShellComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('TourPlanner');
}
