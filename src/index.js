import { invokeMap } from 'lodash';
import { combineReducers } from 'redux';
import { ModelCache } from './base';
import Model from './model';
import buildMiddleware from './middleware';
import { Query, queryReducer, q } from './query';

/**
 * Intialize all models and register them in the cache
 * Also connect the API interface to each model's reducer
 * @param {Interface} api
 * @return {Function}
 *   @param {...Model} ...models
 *   @return {Object} { reducers }
 */
export const initialize = api => (...models) => {
  const modelCache = new ModelCache();
  models.forEach(Model => {
    Model.initialize(modelCache);
  });
  invokeMap(models, 'buildRelations');
  const attachStore = store => invokeMap(models, 'attachStore', store);
  const reducers = {
    entities: combineReducers(models.reduce((rootReducer, model) => ({
      ...rootReducer,
      [model.modelNamePlural]: model.reducer.bind(model),
    }), {
      $queries: queryReducer,
    })),
  };
  const modelMiddleware = buildMiddleware(api);
  return {
    modelCache,
    reducers,
    attachStore,
    modelMiddleware,
  };
}

export {
  Query,
  Model,
  q,
};

export const field = {
  string: () => ({
    dflt: null,
  }),
  number: () => ({
    dflt: null,
  }),
  shape: () => ({
    dflt: null,
  }),
  relation: (modelName, { inverse = null, hasOne = null } = {}) => ({
    type: 'relation',
    modelName,
    inverse,
    dflt: hasOne ? null : [],
  }),
};
