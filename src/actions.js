import { omit } from 'lodash';
import { assert, pk, pkProtectedRandom, InheritedFields } from './utils';
import { MODEL_REQUEST, MODEL_PERSIST } from './middleware';

class ModelActions extends InheritedFields {
  static primaryKey = 'id';
  get primaryKeyValue() {
    return this[this.class.primaryKey];
  }

  static get TYPE() {
    return this.className.toUpperCase();
  }
  static get FETCH() {
    return `${this.TYPE}_FETCH`;
  }
  static get RECEIVE() {
    return `${this.TYPE}_RECEIVE`;
  }
  static get ERROR() {
    return `${this.TYPE}_ERROR`;
  }
  static get INVALIDATE() {
    return `${this.TYPE}_INVALIDATE`;
  }
  static get FETCH_ONE() {
    return `${this.TYPE}_FETCH_ONE`;
  }
  static get RECEIVE_ONE() {
    return `${this.TYPE}_RECEIVE_ONE`;
  }
  static get CREATE_ONE() {
    return `${this.TYPE}_CREATE_ONE`;
  }
  static get UPDATE_ONE() {
    return `${this.TYPE}_UPDATE_ONE`;
  }
  static get SAVE_ONE() {
    return `${this.TYPE}_SAVE_ONE`;
  }
  static get DELETE_ONE() {
    return `${this.TYPE}_DELETE_ONE`;
  }
  static get ERROR_ONE() {
    return `${this.TYPE}_ERROR_ONE`;
  }

  static bindActions() {
    this.create = this.create.bind(this);
  }
  static dispatch(action) {
    return this.store.dispatch(action);
  }

  static fetch(options = {}) {
    return {
      type: MODEL_REQUEST,
      model: this,
      requestType: this.FETCH,
      responseTypeKey: 'RECEIVE',
      errorType: this.ERROR,
      context: {
        primaryKey: options.primaryKey,
        include: options.include,
      },
    };
  }

  static create(data = {}, options = {}) {
    assert(data.constructor === Object, `
      Create() received an event or other non object literal,
      call ${this.className}.create() using an arrow function
      \`() => ${this.className}.create({ props })\`, the object method
      (${this.className}.create) cannot be passed to handlers
    `);
    const primaryKey = pkProtectedRandom(this.existingPrimaryKeys);
    return this.dispatch({
      type: this.CREATE_ONE,
      primaryKey,
      data: {
        ...data,
        [this.primaryKey]: primaryKey,
      },
    });
  }

  constructor(...args) {
    super(...args);

    this.save = this.save.bind(this);
  }
  dispatch(action) {
    return this.class.store.dispatch(action);
  }
  getState() {
    return this._state.isPersisted ? this._state : omit(this._state, this.primaryKey);
  }
  /**
   * Get a method to pass to onChange handlers bound to a specfic field
   *   <input value={model.first_name} onChange={model.change('first_name')} />
   *      or
   *   <input value={model.first_name} onChange={model.change(model.FIRST_NAME)} />
   * @param {String} field - field name to change, referenceable via model[CONST_CASED_PROPNAME] (user.FIRST_NAME // 'first_name')
   * @return {Function}
   *   @param {Event}
   *   @return {Dispatch}
   */
  change(field) {
    return ({ target: { value } }) => this.dispatch({
      type: this.class.UPDATE_ONE,
      primaryKey: this.primaryKeyValue,
      field,
      value,
    });
  }
  /**
   * Bound save method
   * Pass directly to onClick handlers
   *   <button onClick={model.save}></button>
   * @return {Dispatch}
   */
  save() {
    return this.dispatch({
      type: MODEL_PERSIST,
      model: this.class,
      requestType: this.class.SAVE_ONE,
      responseTypeKey: 'RECEIVE',
      errorType: this.class.ERROR,
      context: {
        primaryKey: this.primaryKeyValue,
        isPersisted: this.isPersisted,
        body: {
          [this.class.modelName]: this.getState(),
        },
      },
    });
  }
}

export default ModelActions;
