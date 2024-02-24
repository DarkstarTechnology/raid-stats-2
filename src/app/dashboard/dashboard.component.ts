import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { filter, map, takeUntil } from 'rxjs/operators';
import { ProcessorService } from '../processor/processor.service';
import { DashboardService } from './dashboard.service';
import { Raid } from '../processor/db';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';

interface IDailyStats {
  day: string;
  totalRaids: number;
}

enum ContentType {
  TEXT,
  ACTION
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  raids: Raid[] = [];
  oldestRaid: string;
  totalRaids: number;
  avgRaidsPerDay: number;
  highestRaidsInDay: IDailyStats;
  contentType = ContentType;
  cards: any; // Update with the correct type
  isLoading = true;

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.loadRaids();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.loadRaids();
    });
  }
 
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadRaids() {
    this.dashboardService.getRaids().pipe(takeUntil(this.unsubscribe$)).subscribe((raids) => {
      this.raids = raids;
      this.isLoading = false;
      this.totalRaids = raids.length;
      if (this.totalRaids > 0) {
        this.oldestRaid = this.formatDateFromUnixTimestamp(
          this.raids.reduce((p, c) => {
            return p.date < c.date ? p : c;
          }).date
        );
        this.highestRaidsInDay = this.getDailyStats(this.raids);
        
      }
    });
   
  }

  getDailyStats(raids: Raid[]): IDailyStats {
    const dailyStats = Object.entries(this.groupRaidsByDay(this.raids)).reduce((acc, [key, value]) => {
      return (value.length > acc.value.length) ? { key, value } : acc;
  }, { key: '', value: [] });

    return {day: dailyStats.key, totalRaids: dailyStats.value.length};
  }

  formatDateFromUnixTimestamp(timestamp: number): string {
    // Convert Unix timestamp to milliseconds
    const unixTimestampMilliseconds = timestamp * 1000;

    // Create a new Date object from the Unix timestamp
    const date = new Date(unixTimestampMilliseconds);

    // Format the date string
    const formattedDateString = date.toLocaleString('en-US', {
      timeZone: 'UTC', // Assuming Unix timestamp is in UTC timezone
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return formattedDateString;
  }

  groupRaidsByDay(objects: Raid[]): Record<string, Raid[]> {
    return objects.reduce((acc, obj) => {
      // Ensure the date is a Date object
      const date = new Date(obj.date);
      // Create a date string key in the format YYYY-MM-DD to represent the day
      const dateKey = date.toISOString().split('T')[0];
  
      // If the key doesn't exist, initialize it with an empty array
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
  
      // Add the current object to the array for the calculated date key
      acc[dateKey].push(obj);
  
      return acc;
    }, {} as Record<string, Raid[]>);
  }
  

  /* cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {

      const dbInfo: ContentLine[] = (this.totalRaids > 0) ?  [{header: 'Total Raids', value: this.totalRaids.toString()}, {header: 'Avg Raids/Day', value: ''}, {header: 'Highest Raid Count', value: `${this.highestRaidsInDay.day} - ${this.highestRaidsInDay.totalRaids} Raids`}]  :
      [{ header: 'No Raids in DB!', value: 'Run the processor to populate database.'}];

      return [
        { title: 'Database', contents: { type: ContentType.TEXT, content: { lines: dbInfo } }, cols: matches ? 3 : 2, rows: 1 },
        { title: 'Process Raids', contents: { type: this.contentType.ACTION, content: {route:'/processor'}}, cols: 1, rows: 1 },
        { title: 'Player Stats', contents: {type: this.contentType.ACTION, content: {route:'/players'}}, cols: 1, rows: 1 }
       
      ];
    })
  ); */
}
export interface CardData {
  title: string;
  contents: CardContents;
  cols: number;
  rows: number;
}
interface CardContents {
  type: ContentType;
  content: ContentsData;
}
interface ContentsData {
  lines?: ContentLine[];
  route?: string;
}
interface ContentLine {
  header: string;
  value: string;
}