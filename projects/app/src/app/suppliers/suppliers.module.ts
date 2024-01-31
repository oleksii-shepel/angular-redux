import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule } from '@angular/core';
import { Store } from 'replique';
import { STORE } from '../../app/app.module';

export function auxiliaryReducer(state = {}, action: any): any {
  return state;
}

@Component({
  selector: 'app-suppliers',
  template: `<div>Suppliers work!</div>`,
  styles: [``]
})
export class SuppliersComponent {
  title = 'app-suppliers';

  ngOnInit() {

  }
}

@NgModule({
  declarations: [
    SuppliersComponent
  ],
  imports: [
    CommonModule,
  ]
})
export class SuppliersModule {
  constructor(@Inject(STORE) private store: Store) {
    store.addReducer('suppliers', auxiliaryReducer);
  }
}
