import _, { snakeCase, isObject } from 'lodash';

export const constCase = str => snakeCase(str).toUpperCase();

export const pk = model => model[model.primaryKey];

export const pkProtectedRandom = (keys = []) => {
  let pk = null;
  do {
    pk = Math.floor(Math.random() * 1e8) + 1;
  } while (keys.includes(pk));
  return pk;
};

export class InheritedFields {
  constructor(hydration) {
    this.class = this.constructor;
    for (const key in hydration) {
      this[key] = hydration[key];
      this[constCase(key)] = key;
    }
    this._hydration = hydration;
  }
}

export const assert = (condition, message = 'Assertion failed', objectContext = null) => {
  if (!condition) {
    throw new Error(`${message.replace(/\n/g, '').replace(/\s+/g, ' ')}${objectContext ? `: ${JSON.stringify(objectContext, null, 2)}` : ''}`);
  }
};

const isLeaf = obj => obj && obj.primaryKey === null && obj.includes === null;

const stepIntoQueryObject = (obj, location) => _(obj)
  .map((value, key) => {
    const currentLocation = [...location, key];
    const param = value => `q[${currentLocation.join('][')}]=${value}`;
    if (isLeaf(value)) {
      return param(true);
    }
    if (isObject(value)) {
      return stepIntoQueryObject(value, currentLocation);
    }
    if (value !== null) {
      return param(value);
    }
    return null;
  })
  .flatten()
  .compact()
  .value();

export const serializeQuery = obj => stepIntoQueryObject(obj, []).sort().join('&');
