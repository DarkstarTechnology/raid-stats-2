import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { AllianceService } from './alliance.service';
import { IAlliance } from 'src/app/processor/db';

@Injectable()
export class AllianceResolver implements Resolve<Observable<any>> {
  constructor(private allianceService: AllianceService) {}

  resolve(): Observable<IAlliance[]> {
    return this.allianceService.getAlliances();
  }

}
