import Dexie, { Table } from 'dexie';

export enum Race {
  Plant = 'Plant',
  Gnome = 'Gnome',
  Dragon = 'Dragon',
  Demon = 'Demon',
  Kobold = 'Kobold',
  Undead = 'Undead',
  Troll = 'Troll',
  None = 'None',
}

export interface IAlliance {
  id?: number;
  primary: string[];
  secondary: string[];
  tertiary: string[];
  isActive?: boolean;
  firstRaid?: number;
  lastRaid?: number;
}

export interface IPlayer {
  name: string;
  race: string;
}

export interface IRaid {
  redditId: string;
  title: string;
  date: number;
  kill: Player;
  time: number;
  race: string;
  players: Player[];
}

export interface IPlayersInRaid {
  name: string;
  redditId: string;
  time: number;
  position: number;
  isSnipe: boolean;
}

export interface IRaceCount {
  race: Race;
  count: number;
}

export class Raid implements IRaid {
  redditId: string;
  date: number;
  title: string;
  kill: Player;
  time: number;
  race: string;
  players: Player[];

  constructor(
    redditId: string,
    date: number,
    killer: Player,
    raceKill: string,
    raidTime: number,
    title?: string
  ) {
    this.redditId = redditId;
    this.date = date;
    this.kill = killer;
    this.time = raidTime;
    this.race = raceKill;
    if (title) this.title = title;

    Object.defineProperties(this, {
      players: { value: [], enumerable: true, writable: true },
    });
  }

  async addRaid() {
    await db.raids.put(this);
  }

  async addPlayer(player: Player, t: number, p: number, c: boolean) {
    await db.players.put(player);

    await db.playersInRaid.put({
      name: player.name,
      redditId: this.redditId,
      time: t,
      position: p,
      isSnipe: c,
    });
    this.players.push(player);
  }

  async loadPlayers() {
    const playerLinks = await db.playersInRaid
      .where('redditId')
      .equals(this.redditId)
      .toArray();
    const players = await db.players
      .where('name')
      .anyOf(playerLinks.map((l) => l.name))
      .toArray();
    for (const player of players) {
      if (!this.players.find((p) => p.name === player.name)) {
        this.players.push(player);
      }
    }
    await this.save();
    return players;
  }

  async getAllRaceCounts() {
    const raceCounts: IRaceCount[] = [];
    const links = await db.playersInRaid
      .where('redditId')
      .equals(this.redditId)
      .toArray();
    const players = await db.players
      .where('name')
      .anyOf(links.map((l) => l.name))
      .toArray();
    for (const r of [
      Race.Demon,
      Race.Dragon,
      Race.Gnome,
      Race.Kobold,
      Race.Plant,
      Race.Undead,
    ]) {
      const n = players.filter((player) => player.race === r).length;
      raceCounts.push({ race: r, count: n });
    }
    return raceCounts;
  }

  async getRaceCount(race: string) {
    return this.players.filter((player) => player.race === race).length;
  }

  async save() {
    await db.raids.put(this);
    console.log(this);
  }
}

export class Player implements IPlayer {
  name: string;
  race: string;
  raids!: IRaid[];
  avg!: number;

  constructor(name: string, race: string, id?: number) {
    this.name = name;
    this.race = race;

    Object.defineProperties(this, {
      raids: { value: [], enumerable: false, writable: true },
    });
  }

  async getAvg() {
    const links = await db.playersInRaid
      .where('name')
      .equals(this.name)
      .toArray();
    const n = links.length;
    const total = links.reduce((t, l) => t + l.time, 0);
    this.avg = total / n;
    return total / n;
  }
}

export class AppDB extends Dexie {
  players: Table<Player, number>;
  raids: Table<Raid, number>;
  public alliances: Table<IAlliance, number>;
  public playersInRaid!: Table<IPlayersInRaid, [number, number]>;

  constructor() {
    super('RaidDatabase');
    var db = this;
    db.version(4).stores({
      players: 'name, race',
      raids: 'redditId, date',
      playersInRaid: '[name+redditId], name, redditId',
      alliances: 'id++, firstRaid, lastRaid',
    });

    this.players = db.table('players');
    this.raids = db.table('raids');
    this.playersInRaid = db.table('playersInRaid');
    this.alliances = db.table('alliances');
    this.players.mapToClass(Player);
    this.raids.mapToClass(Raid);
  }
}

async function addAlliance(alliance: IAlliance) {
  if (alliance.firstRaid && alliance.lastRaid) {
    const overlappingAlliance = await db.alliances
      .filter(
        (a) =>
          (a.firstRaid < alliance.lastRaid && a.lastRaid > alliance.firstRaid) ||
          (a.firstRaid === alliance.firstRaid && a.lastRaid === alliance.lastRaid)
      )
      .first();
    if (overlappingAlliance) {
      throw new Error(
        'The timespan between firstRaid and lastRaid overlaps with an existing alliance.'
      );
    }
    else {
        await db.alliances.add(alliance);
      }
  }
  else if (await db.alliances.filter((a) => !(a.lastRaid)).count() > 0) {
    throw new Error(
        'Cannot add another alliance with no last raid date.'
      );
  }
  else {
    await db.alliances.add(alliance);
  }
}

async function seedAllianceTable(db: AppDB) {
  const seedData: IAlliance[] = [
    {
      primary: [Race.Plant, Race.Gnome],
      secondary: [Race.Demon, Race.Dragon, Race.Kobold, Race.Undead],
      tertiary: [Race.None],
      firstRaid: 1706828348,
      lastRaid: 1708362389,
    },
    {
      primary: [Race.Dragon, Race.Plant],
      secondary: [Race.Demon, Race.Gnome],
      tertiary: [Race.Undead, Race.Kobold],
      firstRaid: 1708362390,
    },
  ];
  for (const a of seedData) {
    try {
      await addAlliance(a);
    } catch (error) {
      console.log('Alliance already exists in database.');
    }
  }
}

export const db = new AppDB();
db.open().then(() => {
  console.log('Database initialized.');
  seedAllianceTable(db)
    .then(() => {
      console.log('Alliance data seeded successfully.');
    })
    .catch((error) => console.error('Error initializing database:', error));
});

function downloadExportedData(dbName, data) {
  const json = JSON.stringify(data);
  const blob = new Blob([json], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${dbName}.json`;
  document.body.appendChild(a); // Required for Firefox
  a.click();
  a.remove();
  
  URL.revokeObjectURL(url);
}

export function exportIndexedDB(dbName) {
  const dbRequest = indexedDB.open(dbName);
  dbRequest.onsuccess = function(event) {
    // Correctly type-cast the event target to an IDBRequest
    const db = (event.target as IDBRequest).result;
    const data = {};
    const stores = db.objectStoreNames;

    let storeCount = stores.length;
    for (const storeName of stores) {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      store.getAll().onsuccess = function(event) {
        // Again, cast the event target correctly
        data[storeName] = (event.target as IDBRequest).result;
        storeCount--;
        if (storeCount === 0) { // All stores have been processed
          downloadExportedData(dbName, data);
        }
      };
    }
  };
  dbRequest.onerror = function(event) {
    console.error('Error opening database:', dbRequest.error);
  };
}
