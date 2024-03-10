import { Injectable, computed, inject } from '@angular/core';
import { IAlliance, Player, Race, Raid, db } from '../processor/db';
import { EMPTY, Observable, catchError, defer, forkJoin, groupBy, map, mergeMap, of, reduce, shareReplay, toArray } from 'rxjs';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Result } from '../interfaces/result';
import { HttpErrorService } from '../utils/http-error.service';
import { LineChartSeries } from '../interfaces/line-chart-series';

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

  private dailyAllianceStatsUrl = 'api/alliance/daily';

  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);

  private dailyAllianceStatsResult$ = this.http.get<LineChartSeries[]>(this.dailyAllianceStatsUrl)
    .pipe(
      map(r => ({ data: r } as Result<LineChartSeries[]>)),
      shareReplay(1),
      catchError(err => of({
        data: [],
        error: this.errorService.formatError(err)
      } as Result<LineChartSeries[]>))
    );
  
  private dailyAllianceStatsResult = toSignal(this.dailyAllianceStatsResult$,
    { initialValue: { data: [] } as Result<LineChartSeries[]> });
  dailyAllianceStats = computed(() => this.dailyAllianceStatsResult().data);
  dailyAllianceStatsError = computed(() => this.dailyAllianceStatsResult().error);
  

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

