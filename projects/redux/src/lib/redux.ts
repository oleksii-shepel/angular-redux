import { BehaviorSubject, Observable, Observer, Subscription, UnaryFunction, exhaustMap, firstValueFrom, map } from "rxjs";
import { AnyFn, isPlainObject, Action, AsyncAction, kindOf, Store, Middleware } from "./types";
import { Semaphore } from "./semaphore";

const randomString = (): string => Math.random().toString(36).substring(7).split("").join(".");

const ActionTypes = {
  INIT: `@@redux/INIT${/* @__PURE__ */ randomString()}`,
  REPLACE: `@@redux/REPLACE${/* @__PURE__ */ randomString()}`,
  PROBE_UNKNOWN_ACTION: (): string => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
};

const actionTypes_default = ActionTypes;

function createStore<K>(reducer: Function, preloadedState?: K | undefined, enhancer?: Function): Store<K> {

  if (typeof reducer !== "function") {
    throw new Error(`Expected the root reducer to be a function. Instead, received: '${kindOf(reducer)}'`);
  }

  if ((typeof preloadedState === "function" && typeof enhancer === "function") || (typeof enhancer === "function" && typeof arguments[3] === "function")) {
    throw new Error("It looks like you are passing several store enhancers to createStore(). This is not supported. Instead, compose them together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.");
  }

  if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      throw new Error(`Expected the enhancer to be a function. Instead, received: '${kindOf(enhancer)}'`);
    }
    return enhancer(createStore)(reducer, preloadedState);
  }

  let currentReducer = reducer;
  let currentState = new BehaviorSubject<K>(preloadedState as K);
  let isDispatching = false;

  function getState(): K {
    return currentState.value;
  }

  function subscribe(next?: AnyFn | Observer<any>, error?: AnyFn, complete?: AnyFn): Subscription {
    if (typeof next === 'function') {
      return currentState.subscribe({next, error, complete});
    } else {
      return currentState.subscribe(next as Partial<Observer<any>>);
    }
  }

  function dispatch(action: Action<any> | AsyncAction<any>): any {
    if (!isPlainObject(action) || action instanceof Function) {
      throw new Error(`Actions must be plain objects. Instead, the actual type was: '${kindOf(action)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`);
    }
    if (typeof action.type === "undefined") {
      throw new Error('Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
    }
    if (typeof action.type !== "string") {
      throw new Error(`Action "type" property must be a string. Instead, the actual type was: '${kindOf(action.type)}'. Value was: '${action.type}' (stringified)`);
    }
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    // queueScheduler.schedule(() => processAction(action));
    processAction(action);
    return action;
  }

  function processAction(action: any): void {
    try {
      isDispatching = true;
      const nextState = currentReducer(currentState.value, action);
      currentState.next(nextState);
    } finally {
      isDispatching = false;
    }
  }

  function replaceReducer(nextReducer: Function): void {
    if (typeof nextReducer !== "function") {
      throw new Error(`Expected the nextReducer to be a function. Instead, received: '${kindOf(nextReducer)}`);
    }
    currentReducer = nextReducer;
    dispatch({
      type: actionTypes_default.REPLACE
    });
  }

  function pipe(...operators: Array<UnaryFunction<Observable<K>, Observable<any>>>): Observable<any> {
    return operators.reduce((source, operator) => operator(source), currentState as Observable<K>);
  }

  dispatch({
    type: actionTypes_default.INIT
  });

  return {
    dispatch,
    getState,
    replaceReducer,
    pipe,
    subscribe
  }
}

function assertReducerShape(reducers: any): void {
  const reducerKeys = Object.keys(reducers);

  for (const key of reducerKeys) {
    const reducer = reducers[key];
    const initialState = reducer(undefined, {
      type: actionTypes_default.INIT
    });

    if (typeof initialState === "undefined") {
      throw new Error(`The slice reducer for key "${key}" returned undefined during initialization. If the state passed to the reducer is undefined, you must explicitly return the initial state. The initial state may not be undefined. If you don't want to set a value for this reducer, you can use null instead of undefined.`);
    }

    if (typeof reducer(undefined, {
      type: actionTypes_default.PROBE_UNKNOWN_ACTION()
    }) === "undefined") {
      throw new Error(`The slice reducer for key "${key}" returned undefined when probed with a random type. Don't try to handle '${actionTypes_default.INIT}' or other actions in "redux/*" namespace. They are considered private. Instead, you must return the current state for any unknown actions, unless it is undefined, in which case you must return the initial state, regardless of the action type. The initial state may not be undefined, but can be null.`);
    }
  }
}

function combineReducers(reducers: any): Function {
  const reducerKeys = Object.keys(reducers);
  const finalReducers: any = {};

  for (const key of reducerKeys) {
    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key];
    }
  }

  const finalReducerKeys = Object.keys(finalReducers);

  return function combination(state = {} as any, action: any): any {
    assertReducerShape(finalReducers);

    const nextState: any = {};
    let hasChanged = false;

    for (const key of finalReducerKeys) {
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      if (typeof nextStateForKey === "undefined") {
        const actionType = action && action.type;
        throw new Error(`When called with an action of type ${actionType ? `"${String(actionType)}"` : "(unknown type)"}, the slice reducer for key "${key}" returned undefined. To ignore an action, you must explicitly return the previous state. If you want this reducer to hold no value, you can return null instead of undefined.`);
      }

      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;

      if (hasChanged) {
        break;
      }
    }

    if (!hasChanged && finalReducerKeys.length === Object.keys(state).length) {
      return state;
    }

    return nextState;
  };
}

function compose(...funcs: Function[]): Function {
  if (funcs.length === 0) {
    return (arg: any): any => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args: any[]) => a(b(...args)));
}

function composeMiddleware(...funcs: Middleware[]): Function {
  if (funcs.length === 0) {
    return (next: any) => (action: any) => action;
  }

  const reducer = (a: Middleware, b: Middleware) => {
    return (next: any) => async (action: any) => {
      return await a(await b(next))(action);
    };
  };

  const composed = funcs.length === 1? funcs[0] : funcs.reduce(reducer);

  const semaphore = new Semaphore(1);

  return (next: any) => {
    return async (action: any) => {
      return await semaphore.callFunction(async () => {
        return await composed(next)(action);
      });
    };
  };
}

function applyMiddleware(...middlewares: Middleware[]) {
  return (createStore: Function) => (reducer: Function, preloadedState: any) => {
    const store = createStore(reducer, preloadedState);
    let dispatch = (action: any, ...args: any[]) => {
      throw new Error("Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch.");
    };
    const middlewareAPI = {
      getState: () => store.getState(),
      dispatch: (action: any, ...args: any[]) => dispatch(action, ...args)
    };
    const chain = middlewares.map((middleware) => middleware(middlewareAPI));
    dispatch = composeMiddleware(...chain)(store.dispatch);
    return {
      ...store,
      dispatch
    };
  }
}

export {
  actionTypes_default as __DO_NOT_USE__ActionTypes,
  applyMiddleware,
  combineReducers,
  compose,
  createStore
};
