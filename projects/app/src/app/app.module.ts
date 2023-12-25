import { InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { NoPreloading, RouterModule, Routes } from '@angular/router';
import { applyMiddleware, createStore } from 'projects/redux/src/public-api';
import { thunk } from 'redux-thunk';
import { AppComponent } from './app.component';
import { SuppliersComponent, SuppliersModule } from './suppliers/suppliers.module';

export const STORE = new InjectionToken('redux-store');

export function mainReducer(state = {}, action: any): any {
  return state;
}


export const routes: Routes = [
  { path: '', component: SuppliersComponent },
  { path: 'customers', loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule) }
]

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SuppliersModule,
    RouterModule.forRoot(routes, {preloadingStrategy: NoPreloading})
  ],
  providers: [{provide: STORE, useFactory: () => createStore(mainReducer, applyMiddleware(thunk))}],
  bootstrap: [AppComponent]
})
export class AppModule { }
