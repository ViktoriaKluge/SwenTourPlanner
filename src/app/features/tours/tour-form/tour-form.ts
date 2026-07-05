import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { TourViewModelService } from '../view-model/tour-view-model.service';
import { AuthService } from '../../auth/services/auth.service';
import { LocationPickerComponent } from './location-picker/location-picker';
import { Tour } from '../models/tour.model';
import { calcDurationMin, fetchOsrmRoute, isValidCoord } from '../utils/routing';

const DRAFT_KEY = 'tour-form-draft';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

type PickerTarget = 'start' | 'end' | `poi:${number}`;
type RoutePoint = { latitude: number; longitude: number };

@Component({
  selector: 'app-tour-form',
  standalone: true,
  imports: [ReactiveFormsModule, LocationPickerComponent],
  templateUrl: './tour-form.html',
  styleUrls: ['./tour-form.css'],
})
export class TourFormComponent {
  readonly cancelled = output<void>();
  readonly tour = input<Tour | null>(null);

  private readonly state = inject(TourViewModelService);
  private readonly auth = inject(AuthService);

  tourForm: FormGroup;

  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly activePickerField = signal<PickerTarget | null>(null);
  readonly startSuggestions = signal<NominatimResult[]>([]);
  readonly endSuggestions = signal<NominatimResult[]>([]);
  readonly poiSuggestions = signal<{ index: number; results: NominatimResult[] } | null>(null);

  private readonly formStatus = signal<string | null>(null);
  readonly routeStatus = signal<string>('Start und Ziel waehlen, dann wird die Route berechnet.');
  private geocodeTimer: ReturnType<typeof setTimeout> | null = null;
  private routeTimer: ReturnType<typeof setTimeout> | null = null;
  private hydrating = false;

  readonly errorSummary = computed(() => {
    this.formStatus();
    if (!this.submitted()) return [];
    const errors: string[] = [];
    const push = (ctrl: AbstractControl | null, label: string) => {
      if (!ctrl || ctrl.valid) return;
      const e = ctrl.errors ?? {};
      if (e['required']) errors.push(`${label}: Pflichtfeld`);
      if (e['min']) errors.push(`${label}: Muss >= ${e['min'].min} sein`);
      if (e['max']) errors.push(`${label}: Muss <= ${e['max'].max} sein`);
      if (e['minlength']) errors.push(`${label}: Mindestens ${e['minlength'].requiredLength} Zeichen`);
    };
    push(this.tourForm.get('title'), 'Titel');
    push(this.tourForm.get('startPoint.name'), 'Startpunkt Name');
    push(this.tourForm.get('startPoint.latitude'), 'Startpunkt Koordinaten');
    push(this.tourForm.get('endPoint.name'), 'Endpunkt Name');
    push(this.tourForm.get('endPoint.latitude'), 'Endpunkt Koordinaten');
    push(this.tourForm.get('route.distance'), 'Distanz');
    push(this.tourForm.get('route.durationMin'), 'Dauer');
    this.poisArray.controls.forEach((g, i) => {
      push(g.get('name'), `Stopp ${i + 1} Name`);
      push(g.get('latitude'), `Stopp ${i + 1} Koordinaten`);
    });
    return errors;
  });

  get poisArray(): FormArray {
    return this.tourForm.get('pois') as FormArray;
  }

  constructor(private fb: FormBuilder) {
    this.tourForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      transportType: ['walking', Validators.required],
      accessible: [false],
      description: [''],
      startPoint: this.fb.group({
        name: ['', Validators.required],
        latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
        longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      }),
      endPoint: this.fb.group({
        name: ['', Validators.required],
        latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
        longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      }),
      route: this.fb.group({
        distance: [null, [Validators.required, Validators.min(0)]],
        durationMin: [null, [Validators.required, Validators.min(0)]],
        geometry: [[]],
      }),
      pois: this.fb.array([]),
    });

    effect(() => {
      const t = this.tour();
      if (t) {
        this.hydrating = true;
        this.tourForm.patchValue(t);
        this.poisArray.clear();
        (t.poi ?? []).forEach((p) => this.poisArray.push(this.makePoiGroup(p.name, p.latitude, p.longitude)));
        this.hydrating = false;
        localStorage.removeItem(DRAFT_KEY);
        this.scheduleRouteCalculation();
      } else {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          try {
            this.tourForm.patchValue(JSON.parse(saved));
            this.scheduleRouteCalculation();
          } catch {
            // ignore invalid draft
          }
        }
      }
    });

    this.tourForm.statusChanges.subscribe((s) => this.formStatus.set(s));
    this.tourForm.get('transportType')?.valueChanges.subscribe(() => this.scheduleRouteCalculation());
    this.tourForm.get('accessible')?.valueChanges.subscribe(() => this.scheduleRouteCalculation());
    this.tourForm.get('startPoint')?.valueChanges.subscribe(() => this.scheduleRouteCalculation());
    this.tourForm.get('endPoint')?.valueChanges.subscribe(() => this.scheduleRouteCalculation());
    this.poisArray.valueChanges.subscribe(() => this.scheduleRouteCalculation());
    this.tourForm.valueChanges.subscribe((v) => {
      if (!this.tour()) localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
      if (this.tour() && !this.hydrating) this.state.markUnsaved();
    });
  }

  openPicker(field: PickerTarget): void {
    this.activePickerField.set(field);
  }

  openPoiPicker(index: number): void {
    this.activePickerField.set(`poi:${index}`);
  }

  closePicker(): void {
    this.activePickerField.set(null);
  }

  applyPickedLocation(loc: { latitude: number; longitude: number; name: string }): void {
    const field = this.activePickerField();
    if (!field) return;
    const path = this.pathForPicker(field);
    this.tourForm.get(path)?.patchValue(loc);
    this.tourForm.get(path)?.markAsDirty();
    this.activePickerField.set(null);
    this.scheduleRouteCalculation();
  }

  onLocationNameInput(field: 'start' | 'end' | number, value: string): void {
    if (this.geocodeTimer) clearTimeout(this.geocodeTimer);
    if (value.trim().length < 3) {
      this.setSuggestions(field, []);
      return;
    }
    this.geocodeTimer = setTimeout(() => this.geocodeName(value, field), 700);
  }

  private async geocodeName(query: string, field: 'start' | 'end' | number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=de`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Geocoding fehlgeschlagen: ${res.status}`);
      const results = await res.json();
      this.setSuggestions(field, Array.isArray(results) ? results : []);
    } catch (e) {
      console.error('Nominatim: Geocoding fehlgeschlagen', e);
      this.setSuggestions(field, []);
    }
  }

  applySuggestion(field: 'start' | 'end' | number, result: NominatimResult): void {
    const path = typeof field === 'number' ? `pois.${field}` : field === 'start' ? 'startPoint' : 'endPoint';
    this.tourForm.get(path)?.patchValue({
      name: result.display_name.split(',')[0].trim(),
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
    this.tourForm.get(path)?.markAsDirty();
    this.setSuggestions(field, []);
    this.scheduleRouteCalculation();
  }

  clearSuggestions(field: 'start' | 'end' | number): void {
    setTimeout(() => this.setSuggestions(field, []), 150);
  }

  getPickerTitle(): string {
    const field = this.activePickerField();
    if (!field) return 'Standort waehlen';
    if (field === 'start') return 'Startpunkt waehlen';
    if (field === 'end') return 'Endpunkt waehlen';
    return 'POI auf Karte waehlen';
  }

  getPickerInitLat(): number | null {
    const field = this.activePickerField();
    if (!field) return null;
    return this.tourForm.get(`${this.pathForPicker(field)}.latitude`)?.value ?? null;
  }

  getPickerInitLon(): number | null {
    const field = this.activePickerField();
    if (!field) return null;
    return this.tourForm.get(`${this.pathForPicker(field)}.longitude`)?.value ?? null;
  }

  addPoi(): void {
    this.poisArray.push(this.makePoiGroup('', null, null));
    this.scheduleRouteCalculation();
  }

  removePoi(i: number): void {
    this.poisArray.removeAt(i);
    this.scheduleRouteCalculation();
  }

  private makePoiGroup(name: string, lat: number | null, lon: number | null): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      latitude: [lat, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [lon, [Validators.required, Validators.min(-180), Validators.max(180)]],
    });
  }

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
    if (key === 'required') return ['Pflichtfeld'];
    if (key === 'min') return [`Muss >= ${e['min'].min} sein`];
    if (key === 'max') return [`Muss <= ${e['max'].max} sein`];
    if (key === 'minlength') return [`Mindestens ${e['minlength'].requiredLength} Zeichen`];
    return [];
  }

  getPoiErrors(i: number, field: string): string[] {
    const ctrl = this.poisArray.at(i)?.get(field);
    if (!ctrl || ctrl.valid) return [];
    const e = ctrl.errors ?? {};
    const key = Object.keys(e)[0];
    if (key === 'required') return ['Pflichtfeld'];
    if (key === 'min') return [`Muss >= ${e['min'].min} sein`];
    if (key === 'max') return [`Muss <= ${e['max'].max} sein`];
    return [];
  }

  async submit(): Promise<boolean> {
    if (this.saving()) return false;
    this.submitted.set(true);
    this.saveError.set(null);
    await this.calculateRoute();
    if (this.tourForm.invalid) return false;

    const v = this.tourForm.getRawValue();
    const existing = this.tour();

    this.saving.set(true);
    try {
      if (existing) {
        await this.state.updateTour({ ...existing, ...v, poi: v.pois ?? [] });
        this.state.endEditing();
      } else {
        await this.state.addTour({
          id: crypto.randomUUID(),
          username: this.auth.activeSession().username,
          title: v.title,
          transportType: v.transportType,
          accessible: !!v.accessible,
          favorite: false,
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
      return true;
    } catch {
      this.saveError.set('Tour konnte nicht gespeichert werden. Bitte Backend und Datenbank pruefen.');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    if (this.saving()) return;
    this.cancelled.emit();
    if (this.tour()) this.state.endEditing();
    if (!this.tour()) this.state.closeAddForm();
  }

  private setSuggestions(field: 'start' | 'end' | number, results: NominatimResult[]): void {
    if (field === 'start') this.startSuggestions.set(results);
    else if (field === 'end') this.endSuggestions.set(results);
    else this.poiSuggestions.set(results.length > 0 ? { index: field, results } : null);
  }

  private pathForPicker(field: PickerTarget): string {
    if (field === 'start') return 'startPoint';
    if (field === 'end') return 'endPoint';
    return `pois.${Number(field.split(':')[1])}`;
  }

  private scheduleRouteCalculation(): void {
    if (this.routeTimer) clearTimeout(this.routeTimer);
    this.routeTimer = setTimeout(() => void this.calculateRoute(), 350);
  }

  private async calculateRoute(): Promise<void> {
    const start = this.tourForm.get('startPoint')?.value;
    const end = this.tourForm.get('endPoint')?.value;
    if (!isValidCoord(start) || !isValidCoord(end)) {
      this.routeStatus.set('Start und Ziel waehlen, dann wird die Route berechnet.');
      return;
    }

    const poiPoints = this.poisArray.controls
      .map((group) => group.getRawValue())
      .filter((poi) => isValidCoord(poi));
    const routePoints: RoutePoint[] = [start, ...poiPoints, end];

    this.routeStatus.set('Route wird berechnet...');
    const transportType = this.tourForm.get('transportType')?.value ?? 'walking';
    const accessible = !!this.tourForm.get('accessible')?.value;
    const route = await fetchOsrmRoute(routePoints, transportType, accessible);
    const distanceKm = route
      ? Math.round(route.distanceM / 10) / 100
      : this.haversinePathKm(routePoints);
    const durationMin = calcDurationMin(distanceKm, transportType, accessible ? -1 : 0);

    this.tourForm.get('route')?.patchValue({
      distance: distanceKm,
      durationMin,
      geometry: route?.latLngs ?? routePoints.map((point) => [point.latitude, point.longitude]),
    }, { emitEvent: false });
    this.tourForm.get('route.distance')?.markAsDirty();
    this.tourForm.get('route.durationMin')?.markAsDirty();

    this.routeStatus.set(
      route
        ? `Route automatisch fuer ${this.transportLabel(transportType, accessible)} berechnet${poiPoints.length ? `, mit ${poiPoints.length} Zwischenstopp${poiPoints.length > 1 ? 's' : ''}` : ''}.`
        : 'Route per Luftlinie geschaetzt, Routing-API nicht erreichbar.',
    );
  }

  private transportLabel(value: string, accessible: boolean): string {
    const label = value === 'cycling' ? 'Rad' : value === 'running' ? 'Laufen' : 'Wandern';
    return accessible ? `${label} barrierefrei` : label;
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => value * Math.PI / 180;
    const radiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return Math.round(radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
  }

  private haversinePathKm(points: RoutePoint[]): number {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      distance += this.haversineKm(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude,
      );
    }
    return Math.round(distance * 100) / 100;
  }
}
