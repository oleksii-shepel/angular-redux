import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Store } from 'replique';
import { STORE } from '../app.module';

export function auxiliaryReducer(state = {}, action: any): any {
  return state;
}

@Component({
  selector: 'app-customers',
  template: `<div>Customers work!</div>`,
  styles: [``]
})
export class CustomersComponent {
  title = 'app-customers';

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
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class CustomersModule {
  constructor(@Inject(STORE) private store: Store) {
    store.addReducer('customers', auxiliaryReducer);
  }
}
