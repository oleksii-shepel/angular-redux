import { InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { NoPreloading, RouterModule, Routes } from '@angular/router';
import { Reducer, applyMiddleware, compose, createStore } from 'projects/redux/src/public-api';
import logger from 'redux-logger';
import { thunk } from 'redux-thunk';
import { AppComponent } from './app.component';
import { SuppliersComponent, SuppliersModule } from './suppliers/suppliers.module';

export const STORE = new InjectionToken('redux-store');

export function mainReducer(state = {}, action: any): any {
  return state;
}

export function metaReducer(reducer: Reducer): Reducer {
  return function(state, action) {
    console.log('metaReducer was called with state', state, 'and action', action);

    // Call the passed in reducer
    const newState = reducer(state, action);

    // Check if state has changed
    if (newState !== state) {
      return newState;
    }

    // If state hasn't changed, return the original state
    return state;
  }
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
  providers: [{provide: STORE, useFactory: () => createStore(compose(metaReducer)(mainReducer), applyMiddleware(thunk, logger))}],
  bootstrap: [AppComponent]
})
export class AppModule { }
