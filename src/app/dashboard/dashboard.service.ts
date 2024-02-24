import { Injectable } from '@angular/core';
import { Raid, db } from '../processor/db';
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
  
  /* getGroupedStats(): Observable<GroupedStats[]> {
    return of(null).pipe(
      catchError(() => {
        console.error('Error fetching raid data');
        return EMPTY; // Return empty observable in case of error
      }),
      map(defer(async () => {
        try {
          const raids = await db.raids.toArray(); // Synchronously retrieve raids
          const dailyStats = this.groupRaidsByDate(raids, 'day');
          const monthlyStats = this.groupRaidsByDate(raids, 'month');
    
          return [...dailyStats, ...monthlyStats]; // Combine daily and monthly stats arrays
        } catch (error) {
          console.error('Error processing raid data:', error);
          return []; // Return empty array in case of error
        }
      }))
    );
  }
  
  private groupRaidsByDate(raids: Raid[], unit: 'day' | 'month'): GroupedStats[] {
    const groupedStats: { [key: string]: GroupedStats } = {};
  
    raids.forEach((raid: Raid) => {
      const date = moment.utc(raid.date * 1000).startOf(unit).format(unit === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM');
      if (!groupedStats[date]) {
        groupedStats[date] = { group: date, raids: [] };
      }
      groupedStats[date].raids.push(raid);
    });
  
    return Object.values(groupedStats);
  }
 */
  /* async getGroupStats(){
    const raids = await db.raids.toArray();
  
    const m$ = of(...raids).pipe(
      groupBy((r: Raid) => {
        const date = new Date(r.date * 1000); // Convert Unix timestamp to milliseconds
        return moment.utc(date).startOf('month').valueOf(); // Group by month
      }),
      mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
      map(arr => ({ group: moment(arr[0].date * 1000).format('YYYY-MM'), raids: arr })),
      toArray()
    );

    const d$ = of(...raids).pipe(
      groupBy((r: Raid) => {
        const date = new Date(r.date * 1000); // Convert Unix timestamp to milliseconds
        return moment.utc(date).startOf('day').valueOf(); // Group by day
      }),
      mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
      map(arr => ({ group: moment(arr[0].date * 1000).format('YYYY-MM-DD'), raids: arr })),
      toArray()
    );

    return { daily$: d$, monthly$: m$}
  } */

  async getDailyStats() {
    const raids = await db.raids.toArray();
   
    return of(...raids).pipe(
      groupBy((r: Raid) => {
        const date = new Date(r.date * 1000); // Convert Unix timestamp to milliseconds
        return moment.utc(date).startOf('day').valueOf(); // Group by day
      }),
      mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
      map(arr => ({ date: moment(arr[0].date * 1000).format('YYYY-MM-DD'), raids: arr })),
      toArray()
    );
  }
}
