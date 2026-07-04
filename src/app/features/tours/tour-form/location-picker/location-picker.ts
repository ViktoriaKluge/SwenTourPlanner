import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  input,
  output,
  signal,
} from '@angular/core';
import * as L from 'leaflet';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function circleIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
}

@Component({
  selector: 'app-location-picker',
  standalone: true,
  templateUrl: './location-picker.html',
  styleUrls: ['./location-picker.css'],
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  readonly title   = input<string>('Standort waehlen');
  readonly initLat = input<number | null>(null);
  readonly initLon = input<number | null>(null);

  readonly picked = output<{ latitude: number; longitude: number; name: string }>();
  readonly closed = output<void>();

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  readonly searchQuery   = signal('');
  readonly searching     = signal(false);
  readonly suggestions   = signal<NominatimResult[]>([]);
  readonly markerLat     = signal<number | null>(null);
  readonly markerLon     = signal<number | null>(null);

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    const lat  = this.initLat() ?? 47.5;
    const lon  = this.initLon() ?? 13.5;
    const zoom = this.initLat() != null ? 13 : 6;

    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true }).setView([lat, lon], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    if (this.initLat() != null && this.initLon() != null) {
      this.placeMarker(this.initLat()!, this.initLon()!);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.placeMarker(e.latlng.lat, e.latlng.lng);
      this.suggestions.set([]);
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.map?.remove();
    this.map = null;
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (value.trim().length < 2) { this.suggestions.set([]); return; }
    this.searchTimer = setTimeout(() => this.geocode(value), 500);
  }

  private async geocode(query: string): Promise<void> {
    this.searching.set(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=de`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`Geocoding fehlgeschlagen: ${res.status}`);
      const results = await res.json();
      this.suggestions.set(Array.isArray(results) ? results : []);
    } catch {
      this.suggestions.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  pickSuggestion(r: NominatimResult): void {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    this.placeMarker(lat, lon);
    this.searchQuery.set(r.display_name.split(',')[0].trim());
    this.suggestions.set([]);
    this.map?.setView([lat, lon], 14);
  }

  private placeMarker(lat: number, lon: number): void {
    this.markerLat.set(lat);
    this.markerLon.set(lon);
    if (this.marker) {
      this.marker.setLatLng([lat, lon]);
    } else {
      this.marker = L.marker([lat, lon], { icon: circleIcon('#667eea'), draggable: true }).addTo(this.map!);
      this.marker.on('drag', () => {
        const ll = this.marker!.getLatLng();
        this.markerLat.set(+ll.lat.toFixed(7));
        this.markerLon.set(+ll.lng.toFixed(7));
      });
    }
  }

  confirm(): void {
    const lat = this.markerLat();
    const lon = this.markerLon();
    if (lat == null || lon == null) return;
    this.picked.emit({
      latitude:  +lat.toFixed(7),
      longitude: +lon.toFixed(7),
      name: this.searchQuery().trim() || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    });
  }

  cancel(): void {
    this.closed.emit();
  }
}
