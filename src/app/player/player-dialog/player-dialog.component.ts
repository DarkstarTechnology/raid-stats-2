import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPlayerStats } from 'src/app/interfaces/player-stats';
import { Observable } from 'rxjs';
import { Race } from 'src/app/processor/db';

@Component({
    selector: 'app-player-dialog',
    templateUrl: './player-dialog.component.html',
    styleUrls: ['./player-dialog.component.scss'],
})
export class PlayerDialogComponent {
    loading = true; // Flag to indicate loading status
    playerStats$: Observable<IPlayerStats>; // Observable to hold the fetched data
    imageKitBaseUrl = 'https://ik.imagekit.io/kotd/';

    public race = Race;
    constructor(@Inject(MAT_DIALOG_DATA) public playerStats: IPlayerStats) {}

    getImageUrl(fileName: string): string {
        return `${this.imageKitBaseUrl}${fileName}.webp`;
    }
}
