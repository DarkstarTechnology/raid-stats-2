import { Component, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, merge, startWith, switchMap, map } from 'rxjs';
import { Player } from 'src/app/processor/db';
import { PlayerService } from '../player.service';
import { DataSource } from '@angular/cdk/table';
import { IPlayerStats } from 'src/app/interfaces/player-stats';
import { CollectionViewer } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import Dexie, { liveQuery } from 'dexie';
import { db } from 'src/app/processor/db';
import { MatDialog } from '@angular/material/dialog';
import { PlayerDialogComponent } from '../player-dialog/player-dialog.component';

@Component({
  selector: 'app-player-table',
  templateUrl: './player-table.component.html',
  styleUrls: ['./player-table.component.scss']
})
export class PlayerTableComponent implements OnInit {
  displayedColumns: string[] = ['name', 'race'];
  
  players$: Observable<Player[]>; // Adjust type to IPlayerStats[]
  players: Player[];
  playerDataSource: MatTableDataSource<any>;
  clickedRows = new Set<Player>();
  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private playerService: PlayerService, public dialog: MatDialog) {
    
  }

  ngOnInit() {
    db.players.toArray().then(data => {
      this.playerDataSource = new MatTableDataSource(data);
      this.playerDataSource.paginator = this.paginator;
      this.playerDataSource.sort = this.sort;
    }).catch(error => console.log("Error retrieving players.", error));
    
  }

  showPlayerStats(player: Player) {
    this.clickedRows.add(player);
    const dialogRef = this.dialog.open(PlayerDialogComponent, { data: player});
  }
  

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.playerDataSource.filter = filterValue.trim().toLowerCase();

    if (this.playerDataSource.paginator) {
      this.playerDataSource.paginator.firstPage();
    }
  }
}


class PlayerDataSource extends MatTableDataSource<Player> {

  private _dataStream: BehaviorSubject<Player[]>;

  constructor(initialData: Player[]) {
    super();
    this._dataStream = new BehaviorSubject(initialData);
    this.setData(initialData);
  }

  override connect() {
    return this._dataStream;
  }

  override disconnect() {}

  setData(data: Player[]) {
    this._dataStream.next(data);
  }
}
