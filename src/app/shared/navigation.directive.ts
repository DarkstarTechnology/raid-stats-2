import { Directive, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appNavigate]'
})
export class NavigationDirective {
  @Input() appNavigate!: string;

  constructor(private router: Router) { }

  @HostListener('click') onClick() {
    this.router.navigate([this.appNavigate]);
  }
}
