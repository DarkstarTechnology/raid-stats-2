import { Injectable } from '@angular/core';
import { IAlliance, Player, Race, Raid, db } from './db';

import { HttpClient } from '@angular/common/http';
//import { RateLimiter } from 'limiter';

const attackMatch = /!(melee|mage|magic|range)/i;

@Injectable({
  providedIn: 'root',
})
export class ProcessorService {
  progress: number = 0;
  /* private rateLimiter = new RateLimiter({
    tokensPerInterval: 100,
    interval: 600000,
  }); */
  constructor(private http: HttpClient) {}

  async fetchJson(uri: RequestInfo | URL) {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();

    return data;
  }

  async fetchAndRetryIfNecessary(callAPIFn) {
    const response = await callAPIFn();
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const millisToSleep = this.getMillisToSleep(retryAfter);
      await this.sleep(millisToSleep);
      return this.fetchAndRetryIfNecessary(callAPIFn);
    }
    return response;
  }
  sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
  getMillisToSleep(retryHeaderString) {
    let millisToSleep = Math.round(parseFloat(retryHeaderString) * 1000);
    if (isNaN(millisToSleep)) {
      const retryHeader = new Date(retryHeaderString);
      const dtNow = new Date();
      millisToSleep = Math.max(0, retryHeader.getTime() - dtNow.getTime());
    }
    return millisToSleep;
  }
  raids: Raid[] = [];

  async processRaid(
    raidData: { data: { children: any[] } }[],

    raidId: string
  ) {
    const players: Player[] = [];
    const activeAlliances: IAlliance[] = await db.alliances
      .filter((alliance) => alliance.isActive && alliance.primary.length >= 2)
      .toArray();
    let raidDate: number;
    let raidTitle: string;
    let raidStartTimeout = 5;
    if (isNaN(raidStartTimeout) || !raidStartTimeout || raidStartTimeout < 0) {
      raidStartTimeout = 5;
    }

    function findAttacks(commentsArray: any[]): any {
      const matches = [];
      for (const comment of commentsArray) {
        const isAttack =
          (comment.body?.match(attackMatch) &&
            comment.author !== 'KickOpenTheDoorBot') ||
          (comment.author === 'KickOpenTheDoorBot' &&
            comment.body?.match(/u\/\w+/) &&
            comment.body?.includes('Damage Breakdown'));
        if (isAttack) {
          matches.push(comment);
        }
        if (comment.replies?.data?.children?.length) {
          if (
            !isAttack &&
            comment.replies.data.children.find(
              (x: { data: { author: string; body: string | string[] } }) =>
                x.data?.author === 'KickOpenTheDoorBot' &&
                x.data?.body?.includes('Damage Breakdown')
            )
          ) {
            matches.push(comment);
          }
          matches.push(
            ...findAttacks(
              comment.replies.data.children.map((x: { data: any }) => x.data)
            )
          );
        }
      }
      return matches;
    }
    const slayer = raidData[0].data.children[0].data.link_flair_text.match(
      /Boss slain by \/u\/(?<author>\w+)! \((?<race>\w+)\)/
    );
    const killer = slayer?.groups?.['author'];
    const killRace = slayer?.groups?.['race'];
    raidTitle = raidData[0].data.children[0].data.title as string;
    const attacks = findAttacks(raidData[1].data.children.map((x) => x.data));
    const killMatch =
      /SLAIN!|EXECUTION!|-\d+ Boss HP Remaining!|\n0 Boss HP Remaining!/gi;
    const killingAttack = attacks.find(
      (x: { replies: { data: { children: any[] } } }) =>
        x?.replies?.data?.children?.find(
          (y: { data: { body: string; author: string } }) =>
            killMatch.test(y?.data?.body) &&
            y?.data?.author === 'KickOpenTheDoorBot'
        )
    );
    if (!killingAttack) {
      return;
    }

    const killingAttackTime = killingAttack.created_utc;

    const minRaidStartTime = killingAttackTime - 3 * raidStartTimeout;

    const maxRaidEndTime = killingAttackTime + raidStartTimeout;

    let raidStart = minRaidStartTime;
    raidDate = minRaidStartTime;
    let lastAttack = maxRaidEndTime;
    const alliance: IAlliance = await db.alliances
      .where('firstRaid')
      .belowOrEqual(raidDate)
      .and((a) => (a.lastRaid ? a.lastRaid >= raidDate : true))
      .last();
    const raidAttacks = attacks
      .filter(
        (x) =>
          x?.created >= minRaidStartTime &&
          x?.created <= maxRaidEndTime &&
          x?.body.match(attackMatch)
      )
      .sort((a, b) => a.created - b.created);
    if (!raidAttacks?.length) {
      return;
    }
    lastAttack = 0;
    for (const attack of raidAttacks) {
      if (
        attack.created > lastAttack + raidStartTimeout &&
        attack.created <= killingAttackTime
      ) {
        raidStart = attack.created;
      }
      lastAttack = attack.created;
    }

    const seen: any[] = [];
    interface PlayerDict {
      [key: string]: boolean | undefined;
    }
    interface RaceCount {
      [key: string]: number;
    }
    const playerDict: PlayerDict = {};
    const raceCount: RaceCount = {};
    let firstDupe: any;
    let isDead = false;
    let time: number;
    const attackTimes: { [key: string]: { time: number; position: number } } =
      {};
    let pCount: number = 1;
    attacks
      .filter(
        (x: { created: number }) =>
          x.created >= raidStart &&
          (x.created <= lastAttack || x.created <= killingAttackTime)
      )
      .sort(
        (a: { created: number }, b: { created: number }) =>
          b.created - a.created
      )
      .reverse()
      .map(
        (x: {
          author_flair_text: string;
          author: string;
          permalink: any;
          body: string;
          created: number;
          replies: { data: { children: any[] } };
        }) => {
          const raceMatch = x.author_flair_text?.match(/: (?<race>[a-z]+)/i);

          let isDeleteMessage = false;
          const playerRace = raceMatch?.groups?.['race'];

          let authorName = x.author;
          if (x.author === 'KickOpenTheDoorBot') {
            const authorMatch = x.body?.match(/\/u\/(?<author>\w+)\n/);
            if (authorMatch?.groups?.['author']) {
              authorName = `*${authorMatch.groups['author']}*`;

              isDeleteMessage = true;
            }
          }

          const botReply = isDeleteMessage
            ? x
            : !x.replies?.data?.children?.length
            ? undefined
            : x.replies.data.children
                .map((x: { data: any }) => x.data)
                .find(
                  (x: { author: string }) => x.author === 'KickOpenTheDoorBot'
                );
          if (
            !botReply?.body ||
            botReply.body.includes('Sorry, this boss is already dead')
          ) {
            if (!isDead) {
            }
          } else if (botReply.body.includes("You're attacking too quickly!")) {
          } else {
          }
          const player: Player = new Player(authorName, playerRace);
          if (!players.find((p) => p.name === authorName)) {
            players.push(player);
          }

          if (!playerDict[authorName]) {
            playerDict[authorName] = true;
          } else {
          }
          if (x === killingAttack) {
            isDead = true;

            seen.push(authorName);
          } else {
            if (seen.includes(authorName)) {
              firstDupe = firstDupe || x;
            } else if (firstDupe && firstDupe !== x) {
            } else {
              seen.push(authorName);
            }
          }
          attackTimes[player.name] = {
            time: x.created - raidStart,
            position: pCount,
          };
          time = x.created - raidStart;
          pCount++;
        }
      );
    const killerRaceMatch =
      killingAttack.author_flair_text?.match(/: (?<race>[a-z]+)/i);
    const killerRace = killerRaceMatch?.groups?.['race'];

    const killerPlayer: Player = new Player(killingAttack.author, killerRace);
    console.log('Killer: ' + killerPlayer.name);
    const raid: Raid = new Raid(
      raidId,
      raidDate,
      killerPlayer,
      killerRace,
      killingAttackTime - raidStart,
      raidTitle
    );
    await raid.addRaid();
    for (const p of players) {
      const { time: tim, position: pos } = attackTimes[p.name];
      await raid.addPlayer(
        p,
        tim,
        pos,
        this.wasSnipeAttempt(p.race, killerRace, alliance)
      );
    }
    await raid.loadPlayers();
    await raid.save();
    this.raids.push(raid);
  }

  wasSnipeAttempt(raceA: string, raceB: string, alliance: IAlliance) {
    // Check if both races are in the same group (primary, secondary, or tertiary)
    console.log('Active alliance: ' + alliance.id + '  ' + alliance.primary[0]);

    console.log('Checking races: ' + raceA + '    ' + raceB);
    if (
      (alliance.primary.includes(raceA) && alliance.primary.includes(raceB)) ||
      (alliance.secondary.includes(raceA) &&
        alliance.secondary.includes(raceB)) ||
      (alliance.tertiary.includes(raceA) && alliance.tertiary.includes(raceB))
    ) {
      return false; // Both races are in the same group
    } else {
      return true; // Both races are not in the same group
    }
  }

  async fetchBossIds(limit: number) {
    const url = `https://www.reddit.com/r/kickopenthedoor/new.json?sort=new&limit=${limit}`;
    const json = await this.fetchJson(url);
    const bossIds = [];
    for (const post of json.data.children.filter((c) => c.kind === 't3')) {
      if (!post.data.locked || post.data.title.startsWith('[Slime Only] '))
        continue;

      bossIds.push(post.data.id);
    }
    return bossIds;
  }

  async loadRaidResults(limit: number) {
    const ids = await this.fetchBossIds(150);
    const total = ids.length;
    let counter = 1;
    const cached = await db.raids.where('redditId').anyOf(ids).toArray();
    const cachedIds = cached.map((x) => x.redditId);

    for (const raidId of ids) {
      if (!cachedIds.includes(raidId)) {
        const url = `https://www.reddit.com/r/kickopenthedoor/comments/${raidId}`;
        const jsonUrl = `${url}.json?raw_json=1`;
        //const tokensRemaining = await this.rateLimiter.removeTokens(1);
        const raidData = await this.fetchJson(jsonUrl);
        await this.processRaid(raidData, raidId);
      }
      this.progress = (counter / total) * 100;
      counter++;
    }
  }

  async clearDb() {
    await Promise.all([
      db.raids.clear(),
      db.players.clear(),
      db.playersInRaid.clear(),
    ]);
  }

  async printRaids() {
    let dbraids = await db.transaction(
      'r',
      [db.raids, db.players, db.playersInRaid],
      async () => {
        let raids: Raid[] = await db.raids.toArray();
        await Promise.all(raids.map((raid) => raid.loadPlayers()));
        return raids.sort((a, b) => b.date - a.date);
      }
    );
    let counter = 1;
    for (const raid of dbraids) {
      console.log(counter + '.' + raid.title);
      console.log('\n     Players: ');
      for (const player of raid.players) {
        console.log('        ' + player.name + '|' + player.race);
      }

      console.log('\n     Race Totals: ');
      const counts = await raid.getAllRaceCounts();
      for (const c of counts) {
        if (c.count > 0) {
          console.log('        ' + c.race + ': ' + c.count);
        }
      }
      console.log('');
      counter++;
    }
  }

  async getPlayerStats(name: string) {
    let pir = await db.transaction(
      'r',
      [db.raids, db.playersInRaid],
      async () => {
        let raids: Raid[] = await db.raids.toArray();
      }
    );
  }
}
