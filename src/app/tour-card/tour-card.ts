import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Tour } from "../app-state";

@Component ({
    selector: 'app-tour-card',
    standalone: true,
    templateUrl: './tour-card.html',
})

export class TourCardComponent {
    

    @Input({ required: true}) tour!: Tour;

    @Input({
        required: true,
        transform: (v: unknown) => Boolean(v),
    })
    active!: boolean;

    @Output() select = new EventEmitter<Tour>();

    choose(): void {
        this.select.emit(this.tour);
    }
}