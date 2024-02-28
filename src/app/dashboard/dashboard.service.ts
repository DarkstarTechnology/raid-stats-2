import { Injectable } from '@angular/core';
import { IAlliance, Player, Race, Raid, db } from '../processor/db';
import { EMPTY, Observable, catchError, defer, forkJoin, groupBy, map, mergeMap, of, reduce, toArray } from 'rxjs';
import * as moment from 'moment';

export interface IGroupStats {
  daily$: Observable<{ group: string, raids: any[]}[]>;
  monthly$: Observable<{ group: string, raids: any[]}[]>;
}

export interface GroupedStats {
  group: string;
  raids: Raid[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  raidsByDay: any;

  constructor() { }

  getRaids(): Observable<Raid[]> {
    return defer(async () => {
      console.debug('Dashboard Service Called');
      return await db.raids.toArray();
    });
  }

  getPlayers(): Observable<Player[]> {
    return defer(async () => {
      return await db.players.toArray();
    });
  }

  getCurrentAlliance(): Observable<IAlliance> {
    return defer(async () => {
        try {
            const latestAlliance = await db.alliances
              .orderBy('firstRaid')
              .reverse()
              .first();
            return latestAlliance;
          } catch (error) {
            console.error('Error fetching latest alliance:', error);
            return undefined;
          }
    });
  }

  /* getAllianceSeries() {
    return defer(async () => {
        try {
            let seriesData: IAllianceSeriesData[];
            const alliance = await this.getAllianceAsync();

                const [prim, sec, tert]: Raid[][] = [[],[],[]];

            for(const raid of await db.raids.toArray()) {
                if(alliance.primary.includes(raid.race)) {
                    prim.push(raid);
                }
                else if (alliance.secondary.includes(raid.race)) {
                    sec.push(raid);
                }
                else if (alliance.tertiary.includes(raid.race)) {
                    tert.push(raid);
                }
                else {
                    //donothing
                }

            }
            const primSeries: Record<string, number> = Object.entries(this.groupByDay(prim)).reduce(
                (acc, [key, value]) => {
                  acc[key] = value.length;
                  return acc;
                },
                {} as Record<string, number>
              );
            const secSeries: Record<string, number> = Object.entries(this.groupByDay(prim)).reduce(
                (acc, [key, value]) => {
                  acc[key] = value.length;
                  return acc;
                },
                {} as Record<string, number>
              );
            const tertSeries: Record<string, number> = Object.entries(this.groupByDay(prim)).reduce(
                (acc, [key, value]) => {
                  acc[key] = value.length;
                  return acc;
                },
                {} as Record<string, number>
              );

            return [
                {
                    name: alliance.primary.join('/'),
                    series: primSeries,
                },
                {
                    name: alliance.secondary.join('/'),
                    series: secSeries,
                },
                {
                    name: alliance.tertiary.join('/'),
                    series: tertSeries,
                },
            ];
        }
        catch(error) {
            console.error('Error creating series data:', error);
            return undefined;
        }
    })
  }
 */
  groupByDay(objects: Raid[]): Record<string, Raid[]> {
    return objects.reduce((acc, obj) => {
      // Convert Unix timestamp to Date object
      const date = new Date(obj.date * 1000); // Convert to milliseconds
      // Format date as a string 'YYYY-MM-DD'
      const dateKey = date.toISOString().split('T')[0];

      // Group by this formatted date string
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(obj);

      return acc;
    }, {} as Record<string, Raid[]>);
  }
}

interface IAllianceSeriesData {
    name: string;
    series: IDailyStats[];
  }

  interface IDailyStats {
    name: string; // Day
    value: number; // Total Kills
  }

