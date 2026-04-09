import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { TourStateService } from '../state/tour-state.service';
import { AuthService } from '../../auth/services/auth.service';
import { LocationPickerComponent } from './location-picker/location-picker';
import { TourMapComponent } from '../tour-map/tour-map';
import { Tour, Location } from '../models/tour.model';
import { fetchOsrmRoute, calcDurationMin, isValidCoord, ACTIVITY_SPEEDS } from '../utils/routing';

const DRAFT_KEY = 'tour-form-draft';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-tour-form',
  standalone: true,
  imports: [ReactiveFormsModule, LocationPickerComponent, TourMapComponent],
  templateUrl: './tour-form.html',
  styleUrls: ['./tour-form.css'],
})
export class TourFormComponent {
  readonly cancelled = output<void>();
  readonly tour = input<Tour | null>(null);

  private readonly state = inject(TourStateService);
  private readonly auth  = inject(AuthService);

  tourForm: FormGroup;

  readonly submitted = signal(false);

  // Location picker modal
  readonly activePickerField = signal<'start' | 'end' | null>(null);

  // Geocoding suggestions for start/end
  readonly startSuggestions = signal<NominatimResult[]>([]);
  readonly endSuggestions   = signal<NominatimResult[]>([]);

  // POI suggestions — one array per POI entry
  readonly poiSuggestions = signal<NominatimResult[][]>([]);
  private poiGeocodeTimers: (ReturnType<typeof setTimeout> | null)[] = [];

  // Routing state
  readonly routeLoading      = signal(false);
  readonly routeDistanceKm   = signal<number | null>(null);
  readonly paceLevel         = signal<number>(0);   // -1 | 0 | 1

  // Live form snapshot → drives the preview map
  readonly formSnapshot = signal<any>(null);

  readonly mapStart = computed<Location | null>(() => {
    const v = this.formSnapshot()?.startPoint;
    return isValidCoord(v) ? v : null;
  });
  readonly mapEnd = computed<Location | null>(() => {
    const v = this.formSnapshot()?.endPoint;
    return isValidCoord(v) ? v : null;
  });
  readonly mapPois = computed<Location[]>(() =>
    (this.formSnapshot()?.pois ?? []).filter((p: any) => isValidCoord(p))
  );
  readonly showFormMap = computed(() => this.mapStart() !== null || this.mapEnd() !== null);

  // Exposed speed table for template
  readonly activitySpeeds = ACTIVITY_SPEEDS;

  private readonly _formStatus = signal<string | null>(null);
  private geocodeTimer: ReturnType<typeof setTimeout> | null = null;
  private routeGen = 0;

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
    push(this.tourForm.get('startPoint.name'),      'Startpunkt Name');
    push(this.tourForm.get('startPoint.latitude'),  'Startpunkt Koordinaten');
    push(this.tourForm.get('endPoint.name'),        'Endpunkt Name');
    push(this.tourForm.get('endPoint.latitude'),    'Endpunkt Koordinaten');
    push(this.tourForm.get('route.distance'),       'Distanz');
    push(this.tourForm.get('route.durationMin'),    'Dauer');
    this.poisArray.controls.forEach((g, i) => {
      push(g.get('name'),     `Stopp ${i + 1} Name`);
      push(g.get('latitude'), `Stopp ${i + 1} Koordinaten`);
    });
    return errors;
  });

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

    // Populate form when editing an existing tour
    effect(() => {
      const t = this.tour();
      if (t) {
        this.tourForm.patchValue(t);
        this.poisArray.clear();
        this.poiSuggestions.set([]);
        this.poiGeocodeTimers = [];
        (t.poi ?? []).forEach(p => {
          this.poisArray.push(this.makePoiGroup(p.name, p.latitude, p.longitude));
          this.poiSuggestions.update(arr => [...arr, []]);
          this.poiGeocodeTimers.push(null);
        });
        localStorage.removeItem(DRAFT_KEY);
        setTimeout(() => this.recalculateRoute(), 300);
      } else {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          try { this.tourForm.patchValue(JSON.parse(saved)); } catch { /* ignore */ }
        }
      }
    });

    // Re-calculate duration when category changes
    this.tourForm.get('category')?.valueChanges.subscribe(() => this.recalculateDuration());

    // Keep errorSummary reactive + update snapshot
    this.tourForm.statusChanges.subscribe(s => this._formStatus.set(s));

    this.tourForm.valueChanges.subscribe(v => {
      this.formSnapshot.set(v);
      if (!this.tour()) localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
    });
  }

  // ── Routing ──

  async recalculateRoute(): Promise<void> {
    const start = this.tourForm.get('startPoint')?.value;
    const end   = this.tourForm.get('endPoint')?.value;
    if (!isValidCoord(start) || !isValidCoord(end)) return;

    const gen = ++this.routeGen;
    this.routeLoading.set(true);

    const validPois = (this.poisArray.value as any[]).filter(p => isValidCoord(p));
    const waypoints = [start, ...validPois, end];

    const result = await fetchOsrmRoute(waypoints);
    if (gen !== this.routeGen) return;

    if (result) {
      const km = +(result.distanceM / 1000).toFixed(2);
      this.routeDistanceKm.set(km);
      this.tourForm.get('route.distance')?.setValue(km, { emitEvent: false });
      this.tourForm.get('route.distance')?.markAsDirty();
      this.recalculateDuration();
    }
    this.routeLoading.set(false);
  }

  recalculateDuration(): void {
    const km = this.routeDistanceKm();
    if (km == null) return;
    const cat = this.tourForm.get('category')?.value ?? 'hike';
    const dur = calcDurationMin(km, cat, this.paceLevel());
    this.tourForm.get('route.durationMin')?.setValue(dur, { emitEvent: false });
    this.tourForm.get('route.durationMin')?.markAsDirty();
  }

  onPaceChange(level: number): void {
    this.paceLevel.set(level);
    this.recalculateDuration();
  }

  // ── Location picker ──

  openPicker(field: 'start' | 'end'): void {
    this.activePickerField.set(field);
  }

  closePicker(): void {
    this.activePickerField.set(null);
  }

  applyPickedLocation(loc: { latitude: number; longitude: number; name: string }): void {
    const field = this.activePickerField();
    if (!field) return;
    const path = field === 'start' ? 'startPoint' : 'endPoint';
    this.tourForm.get(path)?.patchValue(loc);
    this.tourForm.get(path)?.markAsDirty();
    this.activePickerField.set(null);
    this.recalculateRoute();
  }

  getCoordValue(field: 'start' | 'end', coord: 'latitude' | 'longitude'): number | null {
    const path = field === 'start' ? 'startPoint' : 'endPoint';
    return this.tourForm.get(`${path}.${coord}`)?.value ?? null;
  }

  // ── Geocoding: start / end ──

  onLocationNameInput(field: 'start' | 'end', value: string): void {
    const suggestions = field === 'start' ? this.startSuggestions : this.endSuggestions;
    if (this.geocodeTimer) clearTimeout(this.geocodeTimer);
    if (value.trim().length < 3) { suggestions.set([]); return; }
    this.geocodeTimer = setTimeout(() => this.geocodeName(value, field), 700);
  }

  private async geocodeName(query: string, field: 'start' | 'end'): Promise<void> {
    const suggestions = field === 'start' ? this.startSuggestions : this.endSuggestions;
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=de`;
      suggestions.set(await (await fetch(url)).json());
    } catch { suggestions.set([]); }
  }

  applySuggestion(field: 'start' | 'end', result: NominatimResult): void {
    const path = field === 'start' ? 'startPoint' : 'endPoint';
    this.tourForm.get(path)?.patchValue({
      name:      result.display_name.split(',')[0].trim(),
      latitude:  parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
    this.tourForm.get(path)?.markAsDirty();
    (field === 'start' ? this.startSuggestions : this.endSuggestions).set([]);
    this.recalculateRoute();
  }

  clearSuggestions(field: 'start' | 'end'): void {
    setTimeout(() => {
      (field === 'start' ? this.startSuggestions : this.endSuggestions).set([]);
    }, 150);
  }

  // ── Geocoding: POIs ──

  onPoiNameInput(i: number, value: string): void {
    if (this.poiGeocodeTimers[i]) clearTimeout(this.poiGeocodeTimers[i]!);
    if (value.trim().length < 3) {
      this.poiSuggestions.update(arr => { const next = [...arr]; next[i] = []; return next; });
      return;
    }
    this.poiGeocodeTimers[i] = setTimeout(() => this.geocodePoiName(i, value), 700);
  }

  private async geocodePoiName(i: number, query: string): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=de`;
      const results = await (await fetch(url)).json();
      this.poiSuggestions.update(arr => { const next = [...arr]; next[i] = results; return next; });
    } catch {
      this.poiSuggestions.update(arr => { const next = [...arr]; next[i] = []; return next; });
    }
  }

  applyPoiSuggestion(i: number, result: NominatimResult): void {
    const group = this.poisArray.at(i) as FormGroup;
    group.patchValue({
      name:      result.display_name.split(',')[0].trim(),
      latitude:  parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
    group.markAsDirty();
    this.poiSuggestions.update(arr => { const next = [...arr]; next[i] = []; return next; });
    this.recalculateRoute();
  }

  clearPoiSuggestions(i: number): void {
    setTimeout(() => {
      this.poiSuggestions.update(arr => { const next = [...arr]; next[i] = []; return next; });
    }, 150);
  }

  // ── POI management ──

  addPoi(): void {
    this.poisArray.push(this.makePoiGroup('', null, null));
    this.poiSuggestions.update(arr => [...arr, []]);
    this.poiGeocodeTimers.push(null);
  }

  removePoi(i: number): void {
    this.poisArray.removeAt(i);
    this.poiSuggestions.update(arr => arr.filter((_, idx) => idx !== i));
    this.poiGeocodeTimers.splice(i, 1);
    this.recalculateRoute();
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
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched || this.submitted());
  }

  isPoiInvalid(i: number, field: string): boolean {
    const ctrl = this.poisArray.at(i)?.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched || this.submitted());
  }

  getErrors(path: string): string[] {
    const ctrl = this.tourForm.get(path);
    if (!ctrl || ctrl.valid) return [];
    const e = ctrl.errors ?? {};
    const key = Object.keys(e)[0];
    if (key === 'required')  return ['Pflichtfeld'];
    if (key === 'min')       return [`Muss ≥ ${e['min'].min} sein`];
    if (key === 'max')       return [`Muss ≤ ${e['max'].max} sein`];
    if (key === 'minlength') return [`Mindestens ${e['minlength'].requiredLength} Zeichen`];
    return [];
  }

  getPoiErrors(i: number, field: string): string[] {
    const ctrl = this.poisArray.at(i)?.get(field);
    if (!ctrl || ctrl.valid) return [];
    const e = ctrl.errors ?? {};
    const key = Object.keys(e)[0];
    if (key === 'required') return ['Pflichtfeld'];
    if (key === 'min')      return [`Muss ≥ ${e['min'].min} sein`];
    if (key === 'max')      return [`Muss ≤ ${e['max'].max} sein`];
    return [];
  }

  // ── Submit ──

  submit(): void {
    this.submitted.set(true);
    if (this.tourForm.invalid) return;

    const v = this.tourForm.value;
    const existing = this.tour();

    if (existing) {
      this.state.updateTour({ ...existing, ...v, poi: v.pois ?? [] });
    } else {
      this.state.addTour({
        id: crypto.randomUUID(),
        username: this.auth.activeSession().username,
        title: v.title,
        category: v.category,
        description: v.description,
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
    if (!this.tour()) {
      localStorage.removeItem(DRAFT_KEY);
      this.state.closeAddForm();
    }
  }
}
