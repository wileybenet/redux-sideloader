import { cacheModel } from './base';
import ModelSelectors from './selectors';
import modelMiddleware from './middleware';
import Query from './query';

export class Model extends ModelSelectors {
  static get Query() {
    this._Query = this._Query || Query(this);
    return this._Query;
  }
}

export const combineModelReducers = (...models) => {
  models.forEach(cacheModel);
  return models.reduce((rootReducer, model) => ({
    ...rootReducer,
    [model.modelNamePlural]: model.reducer.bind(model),
  }), {});
};

export { modelMiddleware };
