import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { TourStateService } from '../state/tour-state.service';
import { TourCardComponent } from '../tour-card/tour-card';
import { Tour } from '../models/tour.model';

@Component({
  selector: 'app-tour-list',
  standalone: true,
  imports: [TourCardComponent],
  templateUrl: './tour-list.html',
  styleUrls: ['./tour-list.css'],
})
export class TourListComponent implements OnInit, OnDestroy {
  @ViewChild('sentinel', { static: true }) sentinel!: ElementRef<HTMLDivElement>;

  protected readonly state = inject(TourStateService);

  readonly tours      = this.state.visibleTours;
  readonly selectedId = this.state.selectedTourId;
  readonly hasMore    = this.state.hasMore;

  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore()) {
          this.state.loadMore();
        }
      },
      { threshold: 0.1 }
    );
    this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onSelect(tour: Tour): void {
    this.state.selectTour(tour.id);
  }
}
