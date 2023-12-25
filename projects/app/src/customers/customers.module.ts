import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { Store } from 'projects/redux/src/public-api';
import { STORE } from '../app/app.module';

export function auxiliaryReducer(state = {}, action: any): any {
  return state;
}

@Component({
  selector: 'app-suppliers',
  template: `<div>Customers work!</div>`,
  styles: [``]
})
export class CustomersComponent {
  title = 'app-suppliers';

  ngOnInit() {

  }
}

export const routes: Routes = [
  {path: '',  component: CustomersComponent}
]

@NgModule({
  declarations: [
    CustomersComponent
  ],
  imports: [
    CommonModule
  ]
})
export class CustomersModule {
  constructor(@Inject(STORE) private store: Store) {

  }
}
