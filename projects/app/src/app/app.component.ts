import { Component, Inject } from '@angular/core';
import { Store, createAction } from 'redux-replica';
import { STORE } from './app.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';

  constructor(@Inject(STORE) private store: Store) {
    store.subscribe((state: any) => console.log(state));
    const action = createAction('PING', (...args: any[]) => async (dispatch: any, getState: any) => 1);
    store.dispatch(action());
  }

  ngOnInit() {

  }
}
