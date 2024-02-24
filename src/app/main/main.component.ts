import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NavItem } from '../interfaces/nav-item';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  navItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
    },
    {
      title: 'Processor',
      icon: 'memory',
      route: '/processor',
    },
    {
      title: 'Settings',
      icon: 'settings',
      route: '/settings',
    },
  ];

  constructor(private router: Router) {}

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
