import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap, tap} from 'rxjs/operators';
import { PlayerStats } from 'src/app/interfaces/player-stats';
import { RaidApi, Result, StatsApi } from 'src/app/interfaces/result';
import { HttpErrorService } from 'src/app/utils/http-error.service';
import { PlayerDialogComponent } from '../player-dialog/player-dialog.component';

@Component({
  selector: 'app-stats-table',
  templateUrl: './stats-table.component.html',
  styleUrls: ['./stats-table.component.scss']
})
export class StatsTableComponent implements AfterViewInit {
  displayedColumns: string[] = ['name', 'race', 'avg_time', 'avg_position', 'participation'];
  statsDatabase: StatsHttpDatabase | null;
  data: PlayerStats[] = [];

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;
  private errorService = inject(HttpErrorService);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(private _httpClient: HttpClient, public dialog: MatDialog) {}

  ngAfterViewInit(): void {
    this.statsDatabase = new StatsHttpDatabase(this._httpClient);
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.statsDatabase!.getPlayerStats(
            this.sort.active,
            this.sort.direction,
            this.paginator.pageIndex)
            .pipe(
              catchError(err => observableOf({
                items: [],
                error: this.errorService.formatError(err)
              } as StatsApi)));
        }),
        map(data => {
          this.isLoadingResults = false;
          this.isRateLimitReached = data === null;
          if (data === null) {
            console.log('data is null');
            return [];

          }

          this.resultsLength = data.total_count;
          console.log(data);
          this.data = data.items;
          console.log('data.items before return:', data.items); // Check if it's undefined
          return data.items;
        }),
        tap((data) => console.log('data inside tap:', data)) // Check if it's undefined)
      ).subscribe(data => (this.data = data));
  }
  showPlayerStats(player: PlayerStats) {
    const dialogRef = this.dialog.open(PlayerDialogComponent, { data: player});
  }

  
}

export class StatsHttpDatabase {
  constructor(private _httpClient: HttpClient) {}

  getPlayerStats(sort: string, order: SortDirection, page: number): Observable<StatsApi> {
    const href = '/api/playerStats';
    const requestUrl = `${href}?sort=${sort}&order=${order}&page=${page + 1}`;

    return this._httpClient.get<StatsApi>(requestUrl);
  }
}