import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { AllianceErrorStateMatcher } from './AllianceErrorStateMatcher';
import { IAlliance, Race, db } from '../../processor/db';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AllianceService } from './alliance.service';
import { MatRadioChange } from '@angular/material/radio';

@Component({
  selector: 'app-alliance',
  templateUrl: './alliance.component.html',
  styleUrls: ['./alliance.component.scss'],
})
export class AllianceComponent implements OnInit {
  private fb = inject(FormBuilder);
  activeAlliance: IAlliance;
  selectedAlliance: IAlliance;

  alliance: IAlliance = {
    primary: [],
    secondary: [],
    tertiary: [],
    isActive: true,
  };
  savedAlliances: IAlliance[] = [];
  matcher = new AllianceErrorStateMatcher();

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
    selectPrimary: [[]], // Initialize selectPrimary with an empty array
    selectSecondary: [[]], // Initialize selectSecondary with an empty array
    selectTertiary: [[]], // Initialize selectTertiary with an empty array
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _snackBar: MatSnackBar,
    private allianceService: AllianceService
  ) {}

  ngOnInit() {

    const dbAlliances = this.route.snapshot.data['alliances'];
    if (dbAlliances) {
    for (const alli of dbAlliances) {
      this.savedAlliances.push(alli);
      if (alli.isActive === true) {
        this.selectedAlliance = alli;
      }
    }
  }
  else {
    console.log('Getting data from alliance service...');
    this.reloadAlliances();
  }
  }

  async onSubmit(): Promise<void> {
   
  }

  async onRadioChange(event: MatRadioChange) {
    // Handle radio button selection change event
    for (const a of this.savedAlliances) {
      const tempAlliance = await this.allianceService.getAllianceById(a.id);
      tempAlliance.isActive = a.id === event.value.id;
      this.allianceService.saveAlliance(tempAlliance);
    }
  }

  async saveAlliance() {
    if (this.alliance.primary.length >= 2 && this.alliance.secondary.length >= 2) {
      const id = await db.alliances.add(this.alliance);
      this.selectedAlliance = this.alliance;
      await db.alliances.where('id').notEqual(id).modify({isActive: false});
      this.reloadAlliances();
      this._snackBar.open('Alliance Saved', 'Dismiss', { duration: 2500 });
    } 
    else {
      this._snackBar.open('Invalid Selection', 'Dismiss', {duration: 2000});
    }
    
  }

  async deleteAlliance() {
    if (!this.selectedAlliance) {
      console.log('No selected alliance...');
      return;
    }
    console.log('Deleting alliance...');
    await this.allianceService.deleteAlliance(this.selectedAlliance); // Pass the selected alliance to deleteAlliance function
    console.log('Starting cleanup....');
    await this.allianceService.cleanUpAlliances();
    this._snackBar.open('Alliance Deleted', 'Dismiss', { duration: 2500 });

    // After deleting, select the first alliance if it exists
    if (this.savedAlliances.length > 0) {
      this.selectedAlliance = this.savedAlliances[0];
      await db.alliances.where('id').notEqual(this.selectedAlliance.id).modify({isActive: false});
    } else {
      // If there are no alliances left, clear the selectedAlliance property
      this.selectedAlliance = null;
    }
    this.reloadAlliances();
  }

  reloadAlliances() {
    this.savedAlliances = [];
    const serviceAlliances = this.allianceService.getAlliances().subscribe({
      next: (data: IAlliance[]) => {
        console.log('Received data:', data);
        // Use the data here, such as assigning it to a component property
        for (const a of data) {
          this.savedAlliances.push(a);
          if (a.isActive === true) {
            this.selectedAlliance = a;
          }
        }
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      }
    });
  }
}
