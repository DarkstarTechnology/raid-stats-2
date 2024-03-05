import { Injectable } from '@angular/core';
import { Player, db } from '../processor/db';
import { IPlayerStats } from '../interfaces/player-stats';
import { liveQuery } from 'dexie';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    constructor() {}

    async listPlayers() {
        return await db.players.toArray();
    }

    async getPlayerStats(player: Player): Promise<IPlayerStats> {
        console.log(`Player's name: ${player.name}`);
        try {
            const raids = await db.playersInRaid
                .filter((p) => p.name === player.name)
                .toArray();
            const allRaids = await db.raids.toArray();

            const participatingInRaids = raids.filter((x) => !x.isSnipe);
            const snipes = raids.length - participatingInRaids.length;
            const totalRaids = participatingInRaids.length;

            const avgPosition =
                totalRaids > 0
                    ? participatingInRaids.reduce(
                          (acc, cur) => acc + cur.position,
                          0
                      ) / totalRaids
                    : 0;
            const avgTime =
                totalRaids > 0
                    ? participatingInRaids.reduce(
                          (acc, curr) => acc + curr.time,
                          0
                      ) / totalRaids
                    : 0;
            const raidParticipation =
                allRaids.length > 0 ? totalRaids / allRaids.length : 0;

            return {
                player,
                totalRaids,
                avgPosition,
                avgTime,
                raidParticipation,
                snipeAttempts: snipes,
            };
        } catch (error) {
            console.error('Error fetching player or raids data:', error);
            throw error;
        }
    }
}
