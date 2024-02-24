import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class AllianceErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isInvalidCtrl = !!(control && control.invalid && control.parent.dirty);
    const isInvalidForm = !!(form && form.invalid && form.dirty);

    // Get references to the three mat-select controls
    const selectPrimary = control?.parent?.get('selectPrimary');
    const selectSecondary = control?.parent?.get('selectSecondary');
    const selectTertiary = control?.parent?.get('selectTertiary');

    // Check if any two selects share any values
    const sharedValuesInvalid =
      !!(selectPrimary?.value && selectSecondary?.value && selectTertiary?.value &&
        (selectPrimary.value.some(value => selectSecondary.value.includes(value)) ||
        selectPrimary.value.some(value => selectTertiary.value.includes(value)) ||
        selectSecondary.value.some(value => selectTertiary.value.includes(value))));

    return isInvalidCtrl || isInvalidForm || sharedValuesInvalid;
  }
}