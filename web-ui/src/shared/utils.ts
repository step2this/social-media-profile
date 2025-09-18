/**
 * Centralized utility imports and shared functional programming helpers
 *
 * This file provides consistent imports and utilities across the entire project.
 * All lodash imports should come through here to ensure consistency.
 */

// === Lodash Functional Programming Utilities ===
// Import specific functions to optimize bundle size
import { pipe } from 'lodash/fp';
import { flow } from 'lodash/fp';
import { compose } from 'lodash/fp';
import { curry } from 'lodash/fp';
import { partial } from 'lodash/fp';

// Data manipulation
import { map } from 'lodash/fp';
import { filter } from 'lodash/fp';
import { reduce } from 'lodash/fp';
import { find } from 'lodash/fp';
import { some } from 'lodash/fp';
import { every } from 'lodash/fp';

// Array utilities
import { head } from 'lodash/fp';
import { tail } from 'lodash/fp';
import { take } from 'lodash/fp';
import { drop } from 'lodash/fp';
import { uniq } from 'lodash/fp';
import { flatten } from 'lodash/fp';
import { range as lodashRange } from 'lodash'; // Use non-fp version for array compatibility

// Object utilities
import { get } from 'lodash/fp';
import { set } from 'lodash/fp';
import { pick } from 'lodash/fp';
import { omit } from 'lodash/fp';
import { merge } from 'lodash/fp';

// === Re-export for consistent usage ===
export {
  // Functional composition
  pipe,
  flow,
  compose,
  curry,
  partial,

  // Data manipulation
  map,
  filter,
  reduce,
  find,
  some,
  every,

  // Array utilities
  head,
  tail,
  take,
  drop,
  uniq,
  flatten,

  // Object utilities
  get,
  set,
  pick,
  omit,
  merge,
};

// === Common functional patterns ===

/**
 * Identity function - returns input unchanged
 * Useful for functional composition and default cases
 */
export const identity = <T>(x: T): T => x;

/**
 * Constant function - always returns the same value
 * Useful for default values and placeholders
 */
export const constant = <T>(value: T) => (): T => value;

/**
 * Safe property access - returns undefined for missing properties
 * Alternative to optional chaining for functional style
 */
export const safeGet = curry((path: string, obj: unknown) =>
  get(path)(obj)
);

/**
 * Predicate helpers for common filtering operations
 */
export const predicates = {
  isNotEmpty: (value: unknown): boolean => Boolean(value),
  isNotNull: (value: unknown): boolean => value !== null,
  isNotUndefined: (value: unknown): boolean => value !== undefined,
  isPresent: (value: unknown): boolean => value !== null && value !== undefined,
} as const;

/**
 * Range function that returns a proper array (compatible with .map(), .filter(), etc.)
 */
export const range = (count: number): number[] => lodashRange(count);

/**
 * Array helpers following functional patterns
 */
export const arrays = {
  isEmpty: (arr: unknown[]): boolean => arr.length === 0,
  isNotEmpty: (arr: unknown[]): boolean => arr.length > 0,
  first: head,
  last: (arr: unknown[]) => arr[arr.length - 1],
  compact: filter(predicates.isPresent),
} as const;

/**
 * String helpers
 */
export const strings = {
  isEmpty: (str: string): boolean => str.length === 0,
  isNotEmpty: (str: string): boolean => str.length > 0,
  trim: (str: string): string => str.trim(),
} as const;

// === Type utilities ===

/**
 * Type-safe functional helpers
 */
export type Predicate<T> = (value: T) => boolean;
export type Transformer<T, R> = (value: T) => R;
export type Reducer<T, R> = (accumulator: R, value: T) => R;

/**
 * Helper for creating type-safe transformers
 */
export const createTransformer = <T, R>(fn: Transformer<T, R>) => fn;

/**
 * Helper for creating type-safe predicates
 */
export const createPredicate = <T>(fn: Predicate<T>) => fn;