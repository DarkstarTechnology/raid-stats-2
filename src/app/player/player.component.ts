import { Component, OnInit } from '@angular/core';
import { liveQuery } from 'dexie';
import { Player, db } from '../processor/db';
import { DataSource } from '@angular/cdk/table';
import { IPlayerStats } from '../interfaces/player-stats';
import { CollectionViewer } from '@angular/cdk/collections';
import { Observable, ReplaySubject, forkJoin, from, map, mergeMap, of, pipe, switchMap, toArray,  } from 'rxjs';
import { PlayerService } from './player.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {
  displayedColumns: string[] = ['name', 'race', 'avgTime', 'avgPosition'];
  playerDataSource: PlayerDataSource; // Declare dataSource variable
  players$: Observable<IPlayerStats[]>; // Adjust type to IPlayerStats[]


  constructor(private playerService: PlayerService) {}

  showPlayerStats(player: Player) {

  }
  async ngOnInit() {
    /* console.log('ng On Init');
    const pa: IPlayerStats[] = [];
    const p = await db.players.toArray(); // Emit the promise that resolves to an array of players
    console.log(p.length);
    for (const x of p) {
      console.log(x.name);
      const y = await this.playerService.getPlayerStats(x);
      pa.push(y);
    }
    this.playerDataSource = new PlayerDataSource(pa); */
  }
}

class PlayerDataSource extends DataSource<IPlayerStats> {

  private _dataStream = new ReplaySubject<IPlayerStats[]>();

  constructor(initialData: IPlayerStats[]) {
    super();
    console.log(initialData[0]);
    this.setData(initialData);
  }

  override connect(
    collectionViewer: CollectionViewer
  ): Observable<readonly IPlayerStats[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: IPlayerStats[]) {
    console.log(data[0].avgPosition)
    this._dataStream.next(data);
  }
}
