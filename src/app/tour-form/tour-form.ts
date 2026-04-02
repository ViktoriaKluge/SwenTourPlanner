import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppStateService } from '../app-state';
import { Tour } from '../app-types';

@Component({
  selector: 'app-tour-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tour-form.html',
  styleUrls: ['../app.css', './tour-form.css'],
})
export class TourFormComponent {
  readonly cancelled = output<void>();

  private readonly state = inject(AppStateService);
  readonly showForm = computed(() => this.state.activeSession().sections.includes('addTour'));
  readonly tour = input<Tour | null>(null);

  tourForm: FormGroup;

  constructor(private builder: FormBuilder) {
    this.tourForm = this.builder.group({
      title: ['', Validators.required],
      category: ['hike', Validators.required],
      description: [''],
      image: [''],
      startPoint: this.builder.group({
        name: ['', Validators.required],
        latitude: [null, Validators.required],
        longitude: [null, Validators.required],
      }),
      endPoint: this.builder.group({
        name: ['', Validators.required],
        latitude: [null, Validators.required],
        longitude: [null, Validators.required],
      }),
      route: this.builder.group({
        distance: [null, [Validators.required, Validators.min(0)]],
        durationMin: [null, [Validators.required, Validators.min(0)]],
      }),
    });

    effect(() => {
      const t = this.tour();
      if (t) this.tourForm.patchValue(t);
      else this.tourForm.reset({ category: 'hike' });
    });
  }

  submit(): void {
    if (this.tourForm.invalid) return;

    const v = this.tourForm.value;
    const existing = this.tour();

    if (existing) {
      this.state.updateTour({ ...existing, ...v });
    } else {
      this.state.addTour({
        id: crypto.randomUUID(),
        username: this.state.activeSession().username,
        title: v.title,
        category: v.category,
        description: v.description,
        image: v.image || 'tba',
        startPoint: v.startPoint,
        endPoint: v.endPoint,
        poi: [],
        route: v.route,
        logs: [],
      });
      this.state.subtractSection('addTour');
    }

    this.cancelled.emit();
  }

  cancel(): void {
    this.cancelled.emit();
    this.state.subtractSection('addTour');
  }
}
