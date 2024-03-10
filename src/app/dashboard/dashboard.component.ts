import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { filter, map, takeUntil } from 'rxjs/operators';
import { ProcessorService } from '../processor/processor.service';
import { DashboardService } from './dashboard.service';
import { Raid } from '../processor/db';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { LegendPosition, ScaleType } from '@swimlane/ngx-charts';
import { exportIndexedDB } from '../processor/db';

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
    totalPlayers: number;
    avgRaidsPerDay: number;
    highestRaidsInDay: string;
    cards: any; // Update with the correct type
    isLoading = true;
    chartData: any[];
    view: [number, number] = [350, 350];
    // options
    lineChartData: any[];
    legend: boolean = true;
    legendPosition: LegendPosition = LegendPosition.Below;
    legendTitle: any = 'Alliances';
    showLabels: boolean = true;
    animations: boolean = true;
    xAxis: boolean = true;
    yAxis: boolean = true;
    showYAxisLabel: boolean = false;
    showXAxisLabel: boolean = false;
    showGridLines = false;
    yScaleMin: number = 5;
    schemeType: ScaleType = ScaleType.Ordinal;
    xAxisTickCount: number = 5;
    xAxisLabel: string = 'Day';
    yAxisLabel: string = 'Raids';
    timeline: boolean = false;
    lineChartView: [number, number] = [700, 300];
    colorScheme = 'aqua';
        lineScheme = 'vivid';
        roundDomains = true;
        xAxisTickFormatting = (value) => {
                const date = new Date(value);
                const options = { year: '2-digit', month: 'short', day: '2-digit' } as Intl.DateTimeFormatOptions;
                const shortUTCDate = date.toLocaleDateString('en-US', options);
                return shortUTCDate;
        };
        /* colorScheme = {
        domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
    }; */
        cardColor: string = '#20262d';
        xScaleMin: any;

    constructor(
        private dashboardService: DashboardService,
        private router: Router,
        private processor: ProcessorService
    ) {}

    async ngOnInit() {
        //exportIndexedDB('RaidDatabase');
        await this.processor.loadRaidResults(50);
        this.loadData();

        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(() => {
                this.loadData();
            });
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    loadData() {
        this.dashboardService
            .getPlayers()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((players) => {
                this.totalPlayers = players.length;
            });

        this.dashboardService
            .getRaids()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((raids) => {
                this.raids = raids;
                this.totalRaids = raids.length;
                if (this.totalRaids > 0) {
                    this.oldestRaid = this.formatDateFromUnixTimestamp(
                        this.raids.reduce((p, c) => {
                            return p.date < c.date ? p : c;
                        }).date
                    );

                    const dailyGroups = this.groupByDay(this.raids);
                    this.avgRaidsPerDay =
                        this.totalRaids / Object.keys(dailyGroups).length;

                    this.calculateChartData();
                    //this.calculateAllianceSeries();
                    this.lineChartData = this.dashboardService.dailyAllianceStats();
                    this.isLoading = false;
                }
            });
    }

    onSelect(event) {
        console.log(event);
    }
    onActivate(data): void {
        console.log('Activate', JSON.parse(JSON.stringify(data)));
    }

    onDeactivate(data): void {
        console.log('Deactivate', JSON.parse(JSON.stringify(data)));
    }

    calculateAllianceSeries() {
        this.dashboardService
            .getCurrentAlliance()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((alliance) => {
                try {
                    const [prim, sec, tert]: Raid[][] = [[], [], []];
                    this.xScaleMin = new Date(this.roundUnixTimestampToDay(alliance.firstRaid));
                    for (const raid of this.raids) {
                        if (alliance.primary.includes(raid.race)) {
                            prim.push(raid);
                        } else if (alliance.secondary.includes(raid.race)) {
                            sec.push(raid);
                        } else if (alliance.tertiary.includes(raid.race)) {
                            tert.push(raid);
                        } else {
                            //donothing
                        }
                    }
                    const primRec: Record<string, number> = Object.entries(
                        this.groupByDay(prim)
                    ).reduce((acc, [key, value]) => {
                        acc[key] = value.length;
                        return acc;
                    }, {} as Record<string, number>);
                    const primSeries = Object.entries(primRec).map(
                        ([date, raids]) => {
                            return {
                                name: new Date(date),
                                value: raids,
                            };
                        }
                    );
                    const secRec: Record<string, number> = Object.entries(
                        this.groupByDay(sec)
                    ).reduce((acc, [key, value]) => {
                        acc[key] = value.length;
                        return acc;
                    }, {} as Record<string, number>);
                    const secSeries = Object.entries(secRec).map(
                        ([date, raids]) => {
                            return {
                                name: new Date(date),
                                value: raids,
                            };
                        }
                    );
                    const tertRec: Record<string, number> = Object.entries(
                        this.groupByDay(tert)
                    ).reduce((acc, [key, value]) => {
                        acc[key] = value.length;
                        return acc;
                    }, {} as Record<string, number>);
                    const tertSeries = Object.entries(tertRec).map(
                        ([date, raids]) => {
                            return {
                                name: new Date(date),
                                value: raids,
                            };
                        }
                    );

                    this.lineChartData = [
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
                } catch (error) {
                    console.error('Error creating series data:', error);
                    return undefined;
                }
            });
    }

    calculateChartData() {
        this.chartData = [
            {
                name: 'Total Raids',
                value: this.totalRaids,
            },
            {
                name: 'Oldest Raid',
                value: this.oldestRaid ?? 'N/A',
            },
            {
                name: 'Daily Avg',
                value: this.avgRaidsPerDay.toFixed(2) ?? 'N/A',
            },
            {
                name: 'Total Players',
                value: this.totalPlayers,
            },
        ];
    }

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

    formatDateFromUnixTimestamp(timestamp: number): string {
        // Convert Unix timestamp to milliseconds
        const unixTimestampMilliseconds = timestamp * 1000;
        // Create a new Date object from the Unix timestamp
        const date = new Date(unixTimestampMilliseconds);
        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const monthName = monthNames[monthIndex];
        return `${day}.${monthName}`;
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

    roundUnixTimestampToDay(timestamp: number): number {
        // Convert Unix timestamp to milliseconds
        let date = new Date(timestamp * 1000);

        // Check if time is greater than or equal to 12:00:00 AM
        if (date.getHours() > 0 || date.getMinutes() > 0 || date.getSeconds() > 0) {
            // Increment date by one day
            date.setDate(date.getDate() + 1);
        }

        // Set time to 12:00:00 AM
        date.setHours(0, 0, 0, 0);

        // Convert date back to Unix timestamp and return
        return Math.round(date.getTime());
    }
}
