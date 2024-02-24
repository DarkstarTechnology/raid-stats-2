import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { ProcessorComponent } from './processor/processor.component';
import { AllianceComponent } from './settings/alliance/alliance.component';
import { AllianceResolver } from './settings/alliance/alliance.resolver';
import { enableDebugTools } from '@angular/platform-browser';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'settings',
    component: SettingsComponent,
    children: [
      { path: '', redirectTo: 'alliance', pathMatch: 'full' }, // Redirect to 'alliance' by default
      {
        path: 'alliance',
        component: AllianceComponent,
        resolve: { alliances: AllianceResolver },
        outlet: 'allianceOutlet'
      }
    ]
  },
  {
    path: 'processor',
    component: ProcessorComponent
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
