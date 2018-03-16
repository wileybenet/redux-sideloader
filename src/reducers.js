import { camelCase } from 'lodash';
import pluralize from 'pluralize';

import { assert } from './utils';
import ModelActions from './actions';

const defaultRecordState = {
  models: {},
  isLoading: false,
  isStale: true,
  receivedAt: null,
  errors: null,
};

class ModelReducers extends ModelActions {
  static get modelName() {
    return camelCase(this.className);
  }
  static get modelNamePlural() {
    return pluralize(this.modelName);
  }
  static get existingPrimaryKeys() {
    return Object.keys(this.selector(this.store.getState()).models);
  }
  static reducer(state = defaultRecordState, action) {
    switch (action.type) {
      case this.FETCH:
        return {
          ...state,
          isLoading: true,
          errors: null,
        };
      case this.RECEIVE:
        return {
          ...state,
          models: this.modelSetReducer(state.models, action),
          isLoading: false,
          isStale: state.isStale && action.isStale,
          receivedAt: action.receivedAt,
          errors: null,
        };
      case this.ERROR:
        return {
          ...state,
          receivedAt: action.receivedAt,
          errors: action.errors,
        };
      case this.INVALIDATE:
        return {
          ...state,
          isStale: true,
        };
      case this.CREATE_ONE:
      case this.UPDATE_ONE:
      case this.SAVE_ONE:
      case this.DELETE_ONE:
      case this.ERROR_ONE:
        return {
          ...state,
          models: this.modelSetReducer(state.models, action),
        };
      default:
        return state;
    }
  }
  static modelSetReducer(state = {}, action) {
    switch (action.type) {
      case this.RECEIVE:
        return {
          ...state,
          ...this.modelGroupReducer(state, action),
        };
      case this.CREATE_ONE:
      case this.UPDATE_ONE:
      case this.SAVE_ONE:
      case this.ERROR_ONE:
        assert(action.primaryKey, '`primaryKey` required in action', action);
        return {
          ...state,
          [action.primaryKey]: this.modelInstanceReducer(state[action.primaryKey], action),
        };
      default:
        return state;
    }
  }
  static modelGroupReducer(state = {}, action) {
    const modelSetArray = [].concat(action.data);
    if (modelSetArray.length) {
      return modelSetArray.reduce((newState, model) => {
        const primaryKey = model[this.primaryKey];
        return {
          ...newState,
          [primaryKey]: {
            ...state[primaryKey],
            ...model,
            isPersisted: true,
            isFetching: false,
            isSaved: true,
            isSaving: false,
          },
        };
      }, {});
    }
    return state;
  }
  static modelInstanceReducer(state = {}, action) {
    switch (action.type) {
      case this.CREATE_ONE:
        return {
          ...this.defaultFields(),
          ...action.data,
          isPersisted: false,
          isSaved: false,
        };
      case this.UPDATE_ONE:
        return {
          ...state,
          [action.field]: action.value,
          isSaved: false,
        };
      case this.SAVE_ONE:
        return {
          ...state,
          isSaving: true,
        };
      case this.ERROR_ONE:
        return {
          ...state,
          errors: action.errors,
        };
      default:
        return state;
    }
  }
}

export default ModelReducers;
