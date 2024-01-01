import { InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { NoPreloading, RouterModule, Routes } from '@angular/router';
import { Reducer, applyMiddleware, compose, createStore } from 'projects/redux/src/public-api';
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

    return newState;
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
  providers: [{provide: STORE, useFactory: () => createStore(compose(metaReducer)(mainReducer), applyMiddleware(thunk))}],
  bootstrap: [AppComponent]
})
export class AppModule { }
