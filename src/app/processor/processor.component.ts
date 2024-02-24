import { Component } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ProcessorService } from './processor.service';

@Component({
  selector: 'app-processor',
  templateUrl: './processor.component.html',
  styleUrls: ['./processor.component.scss']
})
export class ProcessorComponent {
  raidStartTimeoutValue: number = 15;
  rangeSetting: string = "Set Total";
  rangeOptions: string[] = ["Set Total", "Date Range"];
  totalRaids: number = 10;
  startDate!: Date;
  endDate!: Date;
  isRunning: boolean = false;
  progressValue: number = 0;
  progressTotal: number = 0;

  constructor(private processor: ProcessorService) {}

  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    type === 'start' ? this.startDate = event.value : this.endDate = event.value;
  }

  get progValue() {
   // console.log("Getting progress: " + this.processor.progress);
    return this.processor.progress;
  }
  async runProcessor() {
    this.progressTotal = 0;
    this.isRunning = true;
    if (this.rangeSetting === 'Set Total') {
      await this.processor.loadRaidResults(this.totalRaids);
      /* const observable = await this.processor.process$(this.totalRaids);
      observable.subscribe({
          next(x) {
            if (this.progressTotal === 0) {
              this.progressTotal = x;
              console.log("Progress Total: " + this.progressTotal);
            }
            this.progressValue = (x / this.progressTotal) * 100;
            console.log("Progress Value: " + this.progressValue);
          },
          complete() {
            this.isRunning = false;
          }
      }) */

    }
    this.isRunning = false;
  }

}
