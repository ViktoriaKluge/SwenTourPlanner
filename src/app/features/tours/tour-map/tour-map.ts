import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core';
import * as L from 'leaflet';
import { Location } from '../models/tour.model';

function circleIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
}

const START_ICON = circleIcon('#22c55e');
const END_ICON   = circleIcon('#ef4444');
const POI_ICON   = circleIcon('#3b82f6');

@Component({
  selector: 'app-tour-map',
  standalone: true,
  templateUrl: './tour-map.html',
  styleUrls: ['./tour-map.css'],
})
export class TourMapComponent implements AfterViewInit, OnDestroy {
  readonly startPoint = input<Location | null>(null);
  readonly endPoint   = input<Location | null>(null);
  readonly pois       = input<Location[]>([]);

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private markersGroup: L.LayerGroup | null = null;

  constructor() {
    // Re-render markers whenever inputs change (after map is initialized)
    effect(() => {
      const start = this.startPoint();
      const end   = this.endPoint();
      const pois  = this.pois();
      if (this.map) this.render(start, end, pois);
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
    this.render(this.startPoint(), this.endPoint(), this.pois());
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private render(start: Location | null, end: Location | null, pois: Location[]): void {
    this.markersGroup?.clearLayers();
    const points: L.LatLng[] = [];

    if (this.isValid(start)) {
      const ll = L.latLng(start.latitude, start.longitude);
      points.push(ll);
      L.marker(ll, { icon: START_ICON })
        .bindPopup(`<b>Start:</b> ${start.name}`)
        .addTo(this.markersGroup!);
    }

    if (this.isValid(end)) {
      const ll = L.latLng(end.latitude, end.longitude);
      points.push(ll);
      L.marker(ll, { icon: END_ICON })
        .bindPopup(`<b>Ziel:</b> ${end.name}`)
        .addTo(this.markersGroup!);
    }

    for (const poi of pois) {
      if (this.isValid(poi)) {
        const ll = L.latLng(poi.latitude, poi.longitude);
        points.push(ll);
        L.marker(ll, { icon: POI_ICON })
          .bindPopup(poi.name)
          .addTo(this.markersGroup!);
      }
    }

    if (points.length >= 2) {
      L.polyline(points, { color: '#667eea', weight: 3, opacity: 0.7, dashArray: '6 4' })
        .addTo(this.markersGroup!);
      this.map?.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    } else if (points.length === 1) {
      this.map?.setView(points[0], 13);
    } else {
      // No valid coordinates – show Alps region as default
      this.map?.setView([47.5, 13.5], 6);
    }
  }

  private isValid(loc: Location | null | undefined): loc is Location {
    return (
      !!loc &&
      loc.latitude  >= -90  && loc.latitude  <= 90 &&
      loc.longitude >= -180 && loc.longitude <= 180
    );
  }
}
