import { Component, inject } from '@angular/core';

import { FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

import { IAlliance, Race } from '../processor/db';
import { Router } from '@angular/router';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  
  startDate!: Date;
  endDate!: Date;
  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    type === 'start' ? this.startDate = event.value : this.endDate = event.value;
  }
  
  
  races: Race[] = [
    Race.NONE,
    Race.DEMON,
    Race.DRAGON,
    Race.GNOME,
    Race.KOBOLD,
    Race.PLANT,
    Race.UNDEAD,
  ];


  settingsForm = this.fb.group({
    
  });

  constructor(private router: Router){
    this.router.navigateByUrl('/settings/(allianceOutlet:alliance)');

  }
  onSubmit(): void {
    alert('Thanks!');
  }


}
