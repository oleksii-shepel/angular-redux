import { AsyncFunction, SyncFunction, kindOf } from "./types";

export function createAction(type: string, fn: SyncFunction<any> | AsyncFunction<any>) {
  return (...args: any[]) => (dispatch: Function, getState?: Function) => {
    const result = fn(...args)(dispatch, getState);
    if (result instanceof Promise && (result as any)?.then instanceof Function) {
      return result.then(
        (data) => dispatch({ type: `${type}_SUCCESS`, payload: data }),
        (error) => dispatch({ type: `${type}_FAILURE`, payload: error, error: true })
      );
    } else {
      return dispatch({ type, payload: result });
    }
  };
}

export function bindActionCreator(actionCreator: Function, dispatch: Function): Function {
  return function(this: any, ...args: any[]): any {
    return dispatch(actionCreator.apply(this, args));
  };
}

export function bindActionCreators(actionCreators: any, dispatch: Function): any {
  if (typeof actionCreators === "function") {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== "object" || actionCreators === null) {
    throw new Error(`bindActionCreators expected an object or a function, but instead received: '${kindOf(actionCreators)}'. Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`);
  }

  const keys = Object.keys(actionCreators);
  const numKeys = keys.length;

  if (numKeys === 1) {
    const actionCreator = actionCreators[keys[0]];

    if (typeof actionCreator === "function") {
      return bindActionCreator(actionCreator, dispatch);
    }
  }

  for (let i = 0; i < numKeys; i++) {
    const key = keys[i];
    const actionCreator = actionCreators[key];

    if (typeof actionCreator === "function") {
      actionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }

  return actionCreators;
}
