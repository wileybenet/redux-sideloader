import { invokeMap } from 'lodash';
import { combineReducers } from 'redux';
import { ModelCache } from './base';
import ModelSelectors from './selectors';
import modelMiddleware from './middleware';
import Query from './query';


/**
 * Base Model class
 * Derive specific data modals from Model to simplify fetching, storing, caching, creating,
 * updating, and deleting
 * Define relations using the static relations prop to enable automatic model tree hydration
 * @class
 */
export class Model extends ModelSelectors {
  static initialize(modelCache, api) {
    this.modelCache = modelCache;
    this.api = api;
    this.Query = Query(this);

    modelCache.cacheModel(this);
  }
}

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
    Model.initialize(modelCache, api);
  });
  const attachStore = store => invokeMap(models, 'attachStore', store);
  const reducers = {
    entities: combineReducers(models.reduce((rootReducer, model) => ({
      ...rootReducer,
      [model.modelNamePlural]: model.reducer.bind(model),
    }), {})),
  };
  return {
    modelCache,
    reducers,
    attachStore,
  };
}

export { modelMiddleware };
