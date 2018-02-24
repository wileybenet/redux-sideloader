import { snakeCase } from 'lodash';

export const constCase = str => snakeCase(str).toUpperCase();

export const pk = model => model[model.primaryKey];

export class InheritedFields {
  constructor(hydration) {
    this.class = this.constructor;
    for (const key in hydration) {
      this[key] = hydration[key];
      this[constCase(key)] = key;
    }
  }
}

export const assert = (condition, message = 'Assertion failed', objectContext = null) => {
  if (!condition) {
    throw new Error(`${message}${objectContext ? `: ${JSON.stringify(objectContext, null, 2)}` : ''}`);
  }
}
