import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PlayerService } from '../player.service';
import { IPlayerStats } from 'src/app/interfaces/player-stats';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { db } from 'src/app/processor/db';
import { MatDialog } from '@angular/material/dialog';
import { PlayerDialogComponent } from '../player-dialog/player-dialog.component';

@Component({
  selector: 'app-player-table',
  templateUrl: './player-table.component.html',
  styleUrls: ['./player-table.component.scss']
})
export class PlayerTableComponent implements OnInit {
  displayedColumns: string[] = ['player.name', 'player.race','avgTime','avgPosition'];
  playerStatsDataSource: MatTableDataSource<IPlayerStats>;
  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;
  loading = true;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private playerService: PlayerService, public dialog: MatDialog, private cdRef: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.loadPlayerStats();
  }

  async loadPlayerStats(): Promise<void> {
    try {
      const data = await db.players.toArray();

      const playerStats$ = data.map(d => this.playerService.getPlayerStats(d));
      const stats = await forkJoin(playerStats$).toPromise(); // Convert Observable to Promise

      this.playerStatsDataSource = new MatTableDataSource(stats);
      this.playerStatsDataSource.paginator = this.paginator;
      this.playerStatsDataSource.sort = this.sort;

      this.playerStatsDataSource.sortingDataAccessor = this.getSortingDataAccessor();
    } catch (error) {
      console.error("Error occurred while loading player statistics:", error);
    } finally {
        this.cdRef.detectChanges();
        this.isLoadingResults = false;
    }
  }

  private getSortingDataAccessor(): (data: any, sortHeaderId: string) => string | number {
    return (item, property) => {
      switch (property) {
        case 'player.name': return item.player.name;
        case 'player.race': return item.player.race;
        case 'avgTime': return item.avgTime;
        case 'avgPosition': return item.avgPosition;
        default: return item[property];
      }
    };
  }

  showPlayerStats(player: IPlayerStats) {
    const dialogRef = this.dialog.open(PlayerDialogComponent, { data: player});
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.playerStatsDataSource.filter = filterValue.trim().toLowerCase();

    if (this.playerStatsDataSource.paginator) {
      this.playerStatsDataSource.paginator.firstPage();
    }
  }
}

