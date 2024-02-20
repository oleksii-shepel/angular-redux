import { AnyFn, MemoizedFunction, MemoizedSelector, ProjectionFunction, SelectorFunction } from "./types";

// Shallow equality check function
const shallowEqual = (a: any[], b: any[]): boolean => {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export const defaultMemoize: AnyFn = (fn: AnyFn): MemoizedFunction => {
  let lastArgs: any[] | undefined = undefined;
  let lastResult: any | undefined = undefined;
  let called = false;

  const resultFunc: MemoizedFunction = (...args: any[]): any => {
    if (called && lastArgs !== undefined && shallowEqual(args, lastArgs)) {
      return lastResult;
    }

    try {
      const result = fn(...args);
      lastResult = result;
      // Create a shallow copy of the args array to prevent future mutations from affecting the memoization
      lastArgs = [...args];
      called = true;
      return result;
    } catch (error) {
      // Handle error here
      throw error;
    }
  };

  resultFunc.release = () => {
    lastArgs = undefined;
    lastResult = undefined;
    called = false;
  };

  return resultFunc;
};

export function nomemoize(fn: AnyFn) {
  const func = (...args: any[]) => fn(...args);
  func.release = () => { Function.prototype };
  return func;
}

export function createSelector(
  selectors: SelectorFunction | SelectorFunction[],
  projectionOrOptions?: ProjectionFunction | { memoizeSelectors?: AnyFn; memoizeProjection?: AnyFn },
  options: { memoizeSelectors?: AnyFn; memoizeProjection?: AnyFn } = {}
): MemoizedSelector {
  options = (typeof projectionOrOptions !== "function" ? projectionOrOptions as any : options) || {};

  const isSelectorArray = Array.isArray(selectors);
  const selectorArray: SelectorFunction[] = isSelectorArray ? selectors : [selectors];
  const projection = typeof projectionOrOptions === "function" ? projectionOrOptions : undefined;

  // Default memoization functions if not provided
  const memoizeSelector = options.memoizeSelectors || nomemoize;
  const memoizeProjection = options.memoizeProjection || nomemoize;

  if (isSelectorArray && !projection) {
    throw new Error("Invalid parameters: When 'selectors' is an array, 'projection' function should be provided.");
  }

  // Memoize each selector
  const memoizedSelectors = memoizeSelector === nomemoize ? selectorArray : selectorArray.map(selector => memoizeSelector(selector));
  // If a projection is provided, memoize it; otherwise, use identity function
  const memoizedProjection = projection ? (memoizeProjection === nomemoize ? projection : memoizeProjection(projection)) : undefined;

  // The memoizedSelector function will return a function that executes the selectors and projection
  const memoizedSelector: MemoizedSelector = (state: any, props?: any) => {
    // Execute each selector with the state and props
    const resolvedSelectors = memoizedSelectors.map(selector => selector(state, props));
    // Apply the projection function to the resolved selector values
    return memoizedProjection ? memoizedProjection(...resolvedSelectors) : resolvedSelectors[0];
  };

  // Optional: Implement a release method if your memoization functions require cleanup
  memoizedSelector.release = () => {
    // Release logic here, if necessary
    memoizedSelectors !== selectorArray && memoizedSelectors.forEach(selector => selector.release());
    projection && memoizedProjection.release();
  };

  return memoizedSelector;
}
