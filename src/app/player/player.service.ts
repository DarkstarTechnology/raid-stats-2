import { Injectable, computed, inject } from '@angular/core';
import { PlayerStats } from '../interfaces/player-stats';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, combineLatest, map, of, shareReplay } from 'rxjs';
import { HttpErrorService } from '../utils/http-error.service';
import { Result } from '../interfaces/result';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    constructor() { }
    private playerInRaidUrl = 'api/playerInRaid';
    private requestUrl$ = new BehaviorSubject<string>(`?sort=name&order=asc&limit=25&offset=0`);
    private http = inject(HttpClient);
    private errorService = inject(HttpErrorService);
    
    

    private playerStatsResult$ = this.http.get<PlayerStats[]>(`this.playerInRaidUrl${this.requestUrl$.value}`)
        .pipe(
            map((ps) => ({ data: ps } as Result<PlayerStats[]>)),
            shareReplay(1),
            catchError(err => of({
                data: [],
                error: this.errorService.formatError(err)
            } as Result<PlayerStats[]>))
        );

    private playerStatsResult = toSignal(this.playerStatsResult$,
        { initialValue: ({ data: [] } as Result<PlayerStats[]>) });

    playerStats = computed(() => this.playerStatsResult().data);
    playerStatsError = computed(() => this.playerStatsResult().error);

    
        
}
