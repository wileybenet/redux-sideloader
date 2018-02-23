import { ModelCache } from './base';
import ModelSelectors from './selectors';
import modelMiddleware from './middleware';
import Query from './query';

export class Model extends ModelSelectors {
  static initialize(modelCache, store, api) {
    this.store = store;
    this.modelCache = modelCache;
    this.api = api;
    this.Query = Query(this);

    modelCache.cacheModel(this);
  }
  static getStoreState() {
    return this.store.getState();
  }
}

export const initialize = (store, api) => (...models) => {
  const modelCache = new ModelCache();
  models.forEach(Model => {
    Model.initialize(modelCache, store, api);
  });
  return {
    reducers: models.reduce((rootReducer, model) => ({
      ...rootReducer,
      [model.modelNamePlural]: model.reducer.bind(model),
    }), {}),
  };
}

export { modelMiddleware };
