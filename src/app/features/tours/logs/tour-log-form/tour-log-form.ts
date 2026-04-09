import { Component, effect, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { TourLog } from '../../models/tour.model';

@Component({
  selector: 'app-tour-log-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tour-log-form.html',
  styleUrls: ['./tour-log-form.css'],
})
export class TourLogFormComponent {
  readonly log = input<TourLog | null>(null);

  readonly saved     = output<TourLog>();
  readonly cancelled = output<void>();

  readonly form: FormGroup;
  readonly submitted = signal(false);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      date:       [this.todayStr(), Validators.required],
      comment:    ['', [Validators.required, Validators.minLength(3)]],
      difficulty: [3,  [Validators.required, Validators.min(1), Validators.max(5)]],
      rating:     [3,  [Validators.required, Validators.min(1), Validators.max(5)]],
    });

    effect(() => {
      const l = this.log();
      if (l) {
        this.form.patchValue({
          date:       new Date(l.date).toISOString().split('T')[0],
          comment:    l.comment,
          difficulty: l.difficulty,
          rating:     l.rating,
        });
      }
    });
  }

  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched || this.submitted());
  }

  getError(field: string): string {
    const c = this.form.get(field);
    if (!c || c.valid) return '';
    const e = c.errors ?? {};
    if (e['required'])   return 'Pflichtfeld';
    if (e['minlength'])  return `Mindestens ${e['minlength'].requiredLength} Zeichen`;
    if (e['min'])        return `Muss ≥ ${e['min'].min} sein`;
    if (e['max'])        return `Muss ≤ ${e['max'].max} sein`;
    return '';
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.value;
    this.saved.emit({
      id:         this.log()?.id ?? crypto.randomUUID(),
      date:       new Date(v.date),
      comment:    v.comment,
      difficulty: +v.difficulty,
      rating:     +v.rating,
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
