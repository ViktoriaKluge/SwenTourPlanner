import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { Location } from '../models/tour.model';
import { fetchOsrmRoute, isValidCoord } from '../utils/routing';

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

  readonly isLoading = signal(false);

  private map: L.Map | null = null;
  private markersGroup: L.LayerGroup | null = null;
  private renderGen = 0; // prevents stale async updates

  constructor() {
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

    // Fix white-tile bug: recalculate map size after the container is fully painted
    setTimeout(() => this.map?.invalidateSize(), 150);

    this.render(this.startPoint(), this.endPoint(), this.pois());
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private render(start: Location | null, end: Location | null, pois: Location[]): void {
    const gen = ++this.renderGen;
    this.markersGroup?.clearLayers();

    const markerPoints: L.LatLng[] = [];
    const routeWaypoints: Location[] = [];

    if (isValidCoord(start)) {
      const ll = L.latLng(start!.latitude, start!.longitude);
      markerPoints.push(ll);
      routeWaypoints.push(start!);
      L.marker(ll, { icon: START_ICON })
        .bindPopup(`<b>Start:</b> ${start!.name}`)
        .addTo(this.markersGroup!);
    }

    // Insert POIs between start and end
    for (const poi of pois) {
      if (isValidCoord(poi)) {
        const ll = L.latLng(poi.latitude, poi.longitude);
        markerPoints.push(ll);
        routeWaypoints.push(poi);
        L.marker(ll, { icon: POI_ICON })
          .bindPopup(poi.name)
          .addTo(this.markersGroup!);
      }
    }

    if (isValidCoord(end)) {
      const ll = L.latLng(end!.latitude, end!.longitude);
      markerPoints.push(ll);
      routeWaypoints.push(end!);
      L.marker(ll, { icon: END_ICON })
        .bindPopup(`<b>Ziel:</b> ${end!.name}`)
        .addTo(this.markersGroup!);
    }

    if (routeWaypoints.length >= 2) {
      this.isLoading.set(true);
      fetchOsrmRoute(routeWaypoints).then(result => {
        if (gen !== this.renderGen || !this.map) return; // stale
        this.isLoading.set(false);

        if (result) {
          // Draw actual road route
          L.polyline(result.latLngs as L.LatLngExpression[], {
            color: '#667eea', weight: 4, opacity: 0.85,
          }).addTo(this.markersGroup!);
          this.map.fitBounds(
            L.latLngBounds(result.latLngs as L.LatLngExpression[]),
            { padding: [40, 40] },
          );
        } else {
          // Fallback: straight-line polyline
          L.polyline(markerPoints, {
            color: '#667eea', weight: 3, opacity: 0.6, dashArray: '6 4',
          }).addTo(this.markersGroup!);
          this.map.fitBounds(L.latLngBounds(markerPoints), { padding: [40, 40] });
        }
      });
    } else if (markerPoints.length === 1) {
      this.map?.setView(markerPoints[0], 13);
    } else {
      this.map?.setView([47.5, 13.5], 6);
    }
  }
}
