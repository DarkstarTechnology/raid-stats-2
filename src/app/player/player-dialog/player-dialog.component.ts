import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPlayerStats } from 'src/app/interfaces/player-stats';
import { PlayerService } from '../player.service';
import { Observable } from 'rxjs';
import { Player } from 'src/app/processor/db';

@Component({
  selector: 'app-player-dialog',
  templateUrl: './player-dialog.component.html',
  styleUrls: ['./player-dialog.component.scss']
})
export class PlayerDialogComponent implements OnInit {
  loading = true; // Flag to indicate loading status
  playerStats$: Observable<IPlayerStats>; // Observable to hold the fetched data

  constructor(@Inject(MAT_DIALOG_DATA) public player: Player, private playerService: PlayerService){}

ngOnInit() {
  this.playerStats$ = this.playerService.getPlayerStats(this.player);
}
}
