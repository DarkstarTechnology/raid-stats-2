import { Injectable } from '@angular/core';
import { Player, db } from '../processor/db';
import { IPlayerStats } from '../interfaces/player-stats';
import { Observable, concatMap, from, map, switchMap } from 'rxjs';
import { liveQuery } from 'dexie';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  constructor() {}

  async listPlayers() {
    return await db.players.toArray();
  }

  getPlayerStats(player: Player): Observable<IPlayerStats> {
    console.log('Players name: ' + player.name);
    return from(
      db.playersInRaid
        .filter((p) => p.name === player.name)
        .toArray()
        .then((raids) => raids)
    ).pipe(
      concatMap((raids) => {
        const pir = raids.filter((x) => x.isSnipe !== true);
        const snipes = raids.filter((x) => x.isSnipe === true).length;

        let totalRaids = pir.length;
        let avgPosition = pir.reduce((acc, cur) => acc + cur.position, 0) / totalRaids;
        let avgTime = pir.reduce((acc, curr) => acc + curr.time, 0) / totalRaids;

        // Fetch all raids asynchronously
        return from(
          db.raids
            .toArray()
            .then((allRaids) => {
              return allRaids;
            })
            .catch((error) => {
              console.error('Error fetching raids:', error);
              return [];
            })
        ).pipe(
          map((allRaids) => {
            let raidParticipation = totalRaids / allRaids.length;

            // Return the player stats object
            return {
              player: player,
              totalRaids: totalRaids,
              avgPosition: avgPosition,
              avgTime: avgTime,
              raidParticipation: raidParticipation,
              snipeAttempts: snipes,
            };
          })
        );
      })
    );
  }
}
