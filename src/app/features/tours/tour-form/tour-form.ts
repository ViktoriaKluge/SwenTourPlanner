import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { TourStateService } from '../state/tour-state.service';
import { AuthService } from '../../auth/services/auth.service';
import { Tour } from '../models/tour.model';

const DRAFT_KEY = 'tour-form-draft';

export interface FieldInfo {
  label: string;
  hint: string;
  errorMessages: Record<string, string>;
}

// Maps form control path → fieldInfos key for correct error lookup
const PATH_TO_FIELD: Record<string, string> = {
  'title':                  'title',
  'category':               'category',
  'description':            'description',
  'startPoint.name':        'startName',
  'startPoint.latitude':    'startLat',
  'startPoint.longitude':   'startLon',
  'endPoint.name':          'endName',
  'endPoint.latitude':      'endLat',
  'endPoint.longitude':     'endLon',
  'route.distance':         'distance',
  'route.durationMin':      'durationMin',
};

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

  readonly openInfo  = signal<string | null>(null);
  readonly submitted = signal(false);

  private readonly _formStatus = signal<string | null>(null);

  readonly errorSummary = computed(() => {
    this._formStatus();
    if (!this.submitted()) return [];
    const errors: string[] = [];
    const push = (ctrl: AbstractControl | null, label: string) => {
      if (!ctrl || ctrl.valid) return;
      const e = ctrl.errors ?? {};
      if (e['required'])   errors.push(`${label}: Pflichtfeld`);
      if (e['min'])        errors.push(`${label}: Muss ≥ ${e['min'].min} sein`);
      if (e['max'])        errors.push(`${label}: Muss ≤ ${e['max'].max} sein`);
      if (e['minlength'])  errors.push(`${label}: Mindestens ${e['minlength'].requiredLength} Zeichen`);
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
    // POI errors
    this.poisArray.controls.forEach((g, i) => {
      push(g.get('name'),      `POI ${i + 1} Name`);
      push(g.get('latitude'),  `POI ${i + 1} Breitengrad`);
      push(g.get('longitude'), `POI ${i + 1} Längengrad`);
    });
    return errors;
  });

  readonly fieldInfos: Record<string, FieldInfo> = {
    title: {
      label: 'Titel',
      hint: 'Gib der Tour einen eindeutigen, beschreibenden Namen.',
      errorMessages: { required: 'Ein Titel ist erforderlich.', minlength: 'Mindestens 2 Zeichen.' },
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
      errorMessages: { required: 'Name des Startpunkts ist erforderlich.' },
    },
    startLat: {
      label: 'Breitengrad (Start)',
      hint: 'GPS-Breitengrad zwischen –90 und 90. Beispiel: 48.2093',
      errorMessages: { required: 'Pflichtfeld.', min: 'Muss ≥ –90 sein.', max: 'Muss ≤ 90 sein.' },
    },
    startLon: {
      label: 'Längengrad (Start)',
      hint: 'GPS-Längengrad zwischen –180 und 180. Beispiel: 16.3728',
      errorMessages: { required: 'Pflichtfeld.', min: 'Muss ≥ –180 sein.', max: 'Muss ≤ 180 sein.' },
    },
    endName: {
      label: 'Endpunkt Name',
      hint: 'Bezeichnung des Endorts, z. B. „Gipfelkreuz".',
      errorMessages: { required: 'Name des Endpunkts ist erforderlich.' },
    },
    endLat: {
      label: 'Breitengrad (Ende)',
      hint: 'GPS-Breitengrad zwischen –90 und 90.',
      errorMessages: { required: 'Pflichtfeld.', min: 'Muss ≥ –90 sein.', max: 'Muss ≤ 90 sein.' },
    },
    endLon: {
      label: 'Längengrad (Ende)',
      hint: 'GPS-Längengrad zwischen –180 und 180.',
      errorMessages: { required: 'Pflichtfeld.', min: 'Muss ≥ –180 sein.', max: 'Muss ≤ 180 sein.' },
    },
    distance: {
      label: 'Distanz (km)',
      hint: 'Streckenlänge in Kilometern, muss ≥ 0 sein.',
      errorMessages: { required: 'Distanz ist erforderlich.', min: 'Muss ≥ 0 sein.' },
    },
    durationMin: {
      label: 'Dauer (Minuten)',
      hint: 'Geplante Dauer in Minuten, muss ≥ 0 sein.',
      errorMessages: { required: 'Dauer ist erforderlich.', min: 'Muss ≥ 0 sein.' },
    },
  };

  get poisArray(): FormArray {
    return this.tourForm.get('pois') as FormArray;
  }

  constructor(private fb: FormBuilder) {
    this.tourForm = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(2)]],
      category:    ['hike', Validators.required],
      description: [''],
      image:       [''],
      startPoint: this.fb.group({
        name:      ['', Validators.required],
        latitude:  [null, [Validators.required, Validators.min(-90),  Validators.max(90)]],
        longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      }),
      endPoint: this.fb.group({
        name:      ['', Validators.required],
        latitude:  [null, [Validators.required, Validators.min(-90),  Validators.max(90)]],
        longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      }),
      route: this.fb.group({
        distance:    [null, [Validators.required, Validators.min(0)]],
        durationMin: [null, [Validators.required, Validators.min(0)]],
      }),
      pois: this.fb.array([]),
    });

    // Populate form when editing a tour
    effect(() => {
      const t = this.tour();
      if (t) {
        this.tourForm.patchValue(t);
        this.poisArray.clear();
        (t.poi ?? []).forEach(p => this.poisArray.push(this.makePoiGroup(p.name, p.latitude, p.longitude)));
        localStorage.removeItem(DRAFT_KEY);
      } else {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          try { this.tourForm.patchValue(JSON.parse(saved)); } catch { /* ignore */ }
        }
      }
    });

    // Keep _formStatus in sync so errorSummary re-runs on field changes
    this.tourForm.statusChanges.subscribe(s => this._formStatus.set(s));

    // Auto-save draft for new tours
    this.tourForm.valueChanges.subscribe(v => {
      if (!this.tour()) localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
    });
  }

  // ── POI management ──

  addPoi(): void {
    this.poisArray.push(this.makePoiGroup('', null, null));
  }

  removePoi(i: number): void {
    this.poisArray.removeAt(i);
  }

  private makePoiGroup(name: string, lat: number | null, lon: number | null): FormGroup {
    return this.fb.group({
      name:      [name, Validators.required],
      latitude:  [lat,  [Validators.required, Validators.min(-90),  Validators.max(90)]],
      longitude: [lon,  [Validators.required, Validators.min(-180), Validators.max(180)]],
    });
  }

  // ── Validation helpers ──

  isInvalid(path: string): boolean {
    const ctrl = this.tourForm.get(path);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.submitted());
  }

  isPoiInvalid(i: number, field: string): boolean {
    const ctrl = this.poisArray.at(i)?.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.submitted());
  }

  getErrors(path: string): string[] {
    const ctrl = this.tourForm.get(path);
    if (!ctrl || ctrl.valid) return [];
    const e = ctrl.errors ?? {};
    const errorKey = Object.keys(e)[0];
    const fieldKey = PATH_TO_FIELD[path];
    const msg = fieldKey ? this.fieldInfos[fieldKey]?.errorMessages[errorKey] : undefined;
    if (msg) return [msg];
    if (errorKey === 'required')   return ['Pflichtfeld.'];
    if (errorKey === 'min')        return [`Muss ≥ ${e['min'].min} sein.`];
    if (errorKey === 'max')        return [`Muss ≤ ${e['max'].max} sein.`];
    if (errorKey === 'minlength')  return [`Mindestens ${e['minlength'].requiredLength} Zeichen.`];
    return [];
  }

  getPoiErrors(i: number, field: string): string[] {
    const ctrl = this.poisArray.at(i)?.get(field);
    if (!ctrl || ctrl.valid) return [];
    const e = ctrl.errors ?? {};
    const errorKey = Object.keys(e)[0];
    if (errorKey === 'required')  return ['Pflichtfeld.'];
    if (errorKey === 'min')       return [`Muss ≥ ${e['min'].min} sein.`];
    if (errorKey === 'max')       return [`Muss ≤ ${e['max'].max} sein.`];
    return [];
  }

  toggleInfo(field: string): void {
    this.openInfo.update(v => v === field ? null : field);
  }

  // ── Submit ──

  submit(): void {
    this.submitted.set(true);
    if (this.tourForm.invalid) return;

    const v = this.tourForm.value;
    const existing = this.tour();

    if (existing) {
      this.state.updateTour({
        ...existing,
        ...v,
        poi: v.pois ?? [],
      });
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
        poi: v.pois ?? [],
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
