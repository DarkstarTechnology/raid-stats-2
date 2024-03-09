import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { ReplaySubject, first, type Observable, catchError, map, shareReplay, of } from 'rxjs';
import { HttpErrorService } from './http-error.service';
import { IPlayer } from '../processor/db';
import { Result } from '../interfaces/result';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

export interface PlayerDataInit {
  // TODO: describe the object
}

@Injectable({
  providedIn: 'root'
})
export class PlayerDataInitService {
  private playerUrl = 'api/player';
  private playerInRaidUrl = 'api/playerInRaid';
  private raidUrl = 'api/raid';

  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);
  
  private readonly subject = new ReplaySubject<PlayerDataInit[]>(1);
  private array: PlayerDataInit[];

  private playersResult$ = this.http.get<IPlayer[]>(this.playerUrl)
    .pipe(
      map((players) => ({ data: players } as Result<IPlayer[]>)),
      shareReplay(1),
      catchError(err => of({
        data: [],
        error: this.errorService.formatError(err)
      } as Result<IPlayer[]>))
    );

  private playersResult = toSignal(this.playersResult$,
    { initialValue: ({ data: [] } as Result<IPlayer[]>) });

  players = computed(() => this.playersResult().data);
  playersError = computed(() => this.playersResult().error);
  /**
    * @example
    *
    * ```
    * // Do not forget the parentheses
    * Component({
    *   template: `<div *ngFor="let item of listObservable | async">{{ item.someProperty }}</div>`
    * })
    * export class SomeComponent {
    *   listObservable = inject({{ className }}).observable;
    * }
    * ```
    */
  get observable(): Observable<PlayerDataInit[]> {
    return this.subject.asObservable();
  }

  /**
  * To get only the first value and complete automatically (no unsubscription needed)
  *
  * @example
  *
  * ```
  * export const someGuard: CanActivateFn = () => {
  *   return inject(PlayerDataInitService).firstValue.pipe(map((list) => list.length > 2));
  * };
  * ```
  */
  get firstValue(): Observable<PlayerDataInit[]> {
    return this.observable.pipe(first(), catchError((error) => {
      console.error('Error in observable', error);
      throw error;
    }));
  }

  constructor() {
    // Add the logic to initiliaze with the right value here
    this.array = [];
    this.subject.next([]);
  }

  add(value: PlayerDataInit): void {
    this.array = [...this.array, value];
    this.subject.next(this.array);
  }

  filter(predicate: (item: PlayerDataInit) => boolean): void {
    this.array = this.array.filter(predicate);
    this.subject.next(this.array);
  }

  clear(): void {
    this.array = [];
    this.subject.next(this.array);
  }

}
