import { Component } from '@angular/core';
import { Action, applyMiddleware, createStore } from 'projects/redux/src/public-api';
import logger from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import { throttle } from 'redux-saga/effects';
import { thunk } from 'redux-thunk';
import { sequential } from './app.middlewares';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';

  ngOnInit() {

    function* handleInput(input: any) {
      console.log('handleInput');
    }

    function* watchInput() {
      yield throttle(500, 'INCREMENT', handleInput)
    }

    function incrementAsync() {
      return (dispatch: any) => {
        setTimeout(() => {
          // Yay! Can invoke sync or async actions with `dispatch`
          dispatch({ type: 'INCREMENT_ASYNC' })
        }, 1000)
      }
    }

    function counter(state: any, action: Action<any>) {
      if (typeof state === 'undefined') {
        state = 0 // If state is undefined, initialize it with a default value
      }

      if (action.type === 'INCREMENT') {
        return state + 1
      } else if (action.type === 'DECREMENT') {
        return state - 1
      } else {
        return state // In case an action is passed in we don't understand
      }
    }

    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(counter, applyMiddleware(sagaMiddleware, sequential(thunk), logger));

    sagaMiddleware.run(watchInput);

    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'DECREMENT' });
    incrementAsync()(store.dispatch);
  }
}
