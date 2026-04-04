import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { TourStateService } from '../state/tour-state.service';
import { AuthService } from '../../auth/services/auth.service';
import { Tour } from '../models/tour.model';

const DRAFT_KEY = 'tour-form-draft';

export interface FieldInfo {
  label: string;
  hint: string;
  errorMessages: Record<string, string>;
}

@Component({
  selector: 'app-tour-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tour-form.html',
  styleUrls: ['./tour-form.css'],
})
export class TourFormComponent {
  readonly cancelled = output<void>();
  readonly tour = input<Tour | null>(null);

  private readonly state = inject(TourStateService);
  private readonly auth  = inject(AuthService);

  tourForm: FormGroup;

  // ── Info-tooltip visibility per field ──
  readonly openInfo = signal<string | null>(null);

  // ── Show validation errors after first submit attempt ──
  readonly submitted = signal(false);

  // Tracks form status changes so errorSummary re-runs when fields are corrected
  private readonly _formStatus = signal<string | null>(null);

  // ── Error summary computed from form ──
  readonly errorSummary = computed(() => {
    this._formStatus(); // register dependency on form status
    if (!this.submitted()) return [];
    const errors: string[] = [];
    const push = (ctrl: AbstractControl | null, label: string) => {
      if (!ctrl || ctrl.valid) return;
      const e = ctrl.errors ?? {};
      if (e['required'])  errors.push(`${label}: Pflichtfeld`);
      if (e['min'])       errors.push(`${label}: Wert muss ≥ ${e['min'].min} sein`);
      if (e['minlength']) errors.push(`${label}: mindestens ${e['minlength'].requiredLength} Zeichen`);
    };
    push(this.tourForm.get('title'),                'Titel');
    push(this.tourForm.get('category'),             'Kategorie');
    push(this.tourForm.get('startPoint.name'),      'Startpunkt Name');
    push(this.tourForm.get('startPoint.latitude'),  'Startpunkt Breitengrad');
    push(this.tourForm.get('startPoint.longitude'), 'Startpunkt Längengrad');
    push(this.tourForm.get('endPoint.name'),        'Endpunkt Name');
    push(this.tourForm.get('endPoint.latitude'),    'Endpunkt Breitengrad');
    push(this.tourForm.get('endPoint.longitude'),   'Endpunkt Längengrad');
    push(this.tourForm.get('route.distance'),       'Distanz');
    push(this.tourForm.get('route.durationMin'),    'Dauer');
    return errors;
  });

  readonly fieldInfos: Record<string, FieldInfo> = {
    title: {
      label: 'Titel',
      hint: 'Gib der Tour einen eindeutigen, beschreibenden Namen.',
      errorMessages: { required: 'Ein Titel ist erforderlich.' },
    },
    category: {
      label: 'Kategorie',
      hint: 'Wähle die passende Aktivitätsart für diese Tour.',
      errorMessages: { required: 'Eine Kategorie ist erforderlich.' },
    },
    description: {
      label: 'Beschreibung',
      hint: 'Optionale Beschreibung – z. B. Schwierigkeitsgrad, Highlights.',
      errorMessages: {},
    },
    startName: {
      label: 'Startpunkt Name',
      hint: 'Bezeichnung des Startorts, z. B. „Parkplatz Waldhütte".',
      errorMessages: { required: 'Name des Startpunkts erforderlich.' },
    },
    startLat: {
      label: 'Breitengrad (Start)',
      hint: 'GPS-Breitengrad, z. B. 48.2093. Liegt zwischen –90 und 90.',
      errorMessages: { required: 'Breitengrad erforderlich.' },
    },
    startLon: {
      label: 'Längengrad (Start)',
      hint: 'GPS-Längengrad, z. B. 16.3728. Liegt zwischen –180 und 180.',
      errorMessages: { required: 'Längengrad erforderlich.' },
    },
    endName: {
      label: 'Endpunkt Name',
      hint: 'Bezeichnung des Endorts, z. B. „Gipfelkreuz".',
      errorMessages: { required: 'Name des Endpunkts erforderlich.' },
    },
    endLat: {
      label: 'Breitengrad (Ende)',
      hint: 'GPS-Breitengrad des Endpunkts.',
      errorMessages: { required: 'Breitengrad erforderlich.' },
    },
    endLon: {
      label: 'Längengrad (Ende)',
      hint: 'GPS-Längengrad des Endpunkts.',
      errorMessages: { required: 'Längengrad erforderlich.' },
    },
    distance: {
      label: 'Distanz (km)',
      hint: 'Streckenlänge in Kilometern, muss ≥ 0 sein.',
      errorMessages: { required: 'Distanz erforderlich.', min: 'Wert muss ≥ 0 sein.' },
    },
    durationMin: {
      label: 'Dauer (Minuten)',
      hint: 'Geplante Dauer in Minuten, muss ≥ 0 sein.',
      errorMessages: { required: 'Dauer erforderlich.', min: 'Wert muss ≥ 0 sein.' },
    },
  };

  constructor(private fb: FormBuilder) {
    this.tourForm = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(2)]],
      category:    ['hike', Validators.required],
      description: [''],
      image:       [''],
      startPoint: this.fb.group({
        name:      ['', Validators.required],
        latitude:  [null, Validators.required],
        longitude: [null, Validators.required],
      }),
      endPoint: this.fb.group({
        name:      ['', Validators.required],
        latitude:  [null, Validators.required],
        longitude: [null, Validators.required],
      }),
      route: this.fb.group({
        distance:    [null, [Validators.required, Validators.min(0)]],
        durationMin: [null, [Validators.required, Validators.min(0)]],
      }),
    });

    // Restore saved draft (only for new tours)
    effect(() => {
      const t = this.tour();
      if (t) {
        this.tourForm.patchValue(t);
        localStorage.removeItem(DRAFT_KEY);
      } else {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          try { this.tourForm.patchValue(JSON.parse(saved)); } catch { /* ignore */ }
        }
      }
    });

    // Keep _formStatus signal in sync so errorSummary computed re-runs on field changes
    this.tourForm.statusChanges.subscribe((s) => this._formStatus.set(s));

    // Auto-save draft on every change (only for new tours)
    this.tourForm.valueChanges.subscribe((v) => {
      if (!this.tour()) localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
    });
  }

  isInvalid(path: string): boolean {
    const ctrl = this.tourForm.get(path);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.submitted());
  }

  getErrors(path: string): string[] {
    const ctrl = this.tourForm.get(path);
    if (!ctrl || ctrl.valid) return [];
    const e = ctrl.errors ?? {};
    const key = Object.keys(e)[0];
    const info = Object.values(this.fieldInfos).find(f =>
      Object.keys(f.errorMessages).includes(key)
    );
    const msg = info?.errorMessages[key];
    return msg ? [msg] : [];
  }

  toggleInfo(field: string): void {
    this.openInfo.update(v => v === field ? null : field);
  }

  submit(): void {
    this.submitted.set(true);
    if (this.tourForm.invalid) return;

    const v = this.tourForm.value;
    const existing = this.tour();

    if (existing) {
      this.state.updateTour({ ...existing, ...v });
    } else {
      this.state.addTour({
        id: crypto.randomUUID(),
        username: this.auth.activeSession().username,
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
      localStorage.removeItem(DRAFT_KEY);
    }
    this.cancelled.emit();
  }

  cancel(): void {
    this.cancelled.emit();
    if (!this.tour()) this.state.closeAddForm();
  }
}
