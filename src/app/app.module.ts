import { NgModule, inject } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainComponent } from './main/main.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { SettingsComponent } from './settings/settings.component';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatExpansionModule } from '@angular/material/expansion';
import { ProcessorComponent } from './processor/processor.component';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpClientModule } from '@angular/common/http';
import { AllianceComponent } from './settings/alliance/alliance.component';
import { AllianceService } from './settings/alliance/alliance.service';
import { AllianceResolver } from './settings/alliance/alliance.resolver';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { PlayerTableComponent } from './player/player-table/player-table.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule} from '@angular/material/dialog';
import { PlayerDialogComponent } from './player/player-dialog/player-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavigationDirective } from './shared/navigation.directive';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableResponsiveModule } from './shared/mat-table-responsive/mat-table-responsive.module';
import { PlayerDataInitService } from './utils/player-data-init.service';
import { DatePipe } from '@angular/common';
import { StatsTableComponent } from './player/stats-table/stats-table.component';

/* export function initData(playerDataInit: PlayerDataInitService) {
  return () => {
     return inject(PlayerDataInitService).observable.pipe(a);
  };
} */

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    DashboardComponent,
    SettingsComponent,
    ProcessorComponent,
    AllianceComponent,
    PlayerTableComponent,
    PlayerDialogComponent,
    NavigationDirective,
    StatsTableComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatExpansionModule,
    FormsModule,
    MatDividerModule,
    MatProgressBarModule,
    HttpClientModule,
    MatSnackBarModule,
    MatTableModule,
    MatRippleModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    NgxChartsModule,
    MatSlideToggleModule,
    MatTableResponsiveModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    DatePipe
  ],
  providers: [
    {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {useUtc: true}},
    AllianceService,
    AllianceResolver
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
