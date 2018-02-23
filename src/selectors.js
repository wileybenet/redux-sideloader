import { values, isUndefined, isArray, pick } from 'lodash';
import { createSelector } from 'reselect';

import store from '../../services/store';
import ModelReducers from './reducers';
import { pk } from './utils';

class ModelHydrationSet {
  constructor(models, Model) {
    if (Model) {
      const state = store.getState();
      const hydratedRelationsByField = Object.entries(Model.relations).reduce((memo, [field, Relation]) => ({
        ...memo,
        [field]: Relation.hydrate(Relation.selector(state).models),
      }), {});
      this.hydratedModels = Object.entries(models).reduce((modelSet, [, model]) => ({
        ...modelSet,
        [pk(model)]: new Model(model, hydratedRelationsByField),
      }), {});
    } else {
      this.hydratedModels = models;
    }
  }
  get(primaryKey) {
    return this.hydratedModels[primaryKey];
  }
  filter(primaryKeys) {
    return new ModelHydrationSet(pick(this.hydratedModels, primaryKeys));
  }
  get all() {
    return Object.entries(this.hydratedModels).map(([, model]) => model);
  }
  get length() {
    return Object.keys(this.hydratedModels).length;
  }
}

export default class ModelSelectors extends ModelReducers {
  static relations = {}
  static selector(state) {
    return state.entities[this.modelNamePlural];
  }
  static getRelationModels() {
    return Object.entries(this.relations);
  }
  // memoizing a static method using a getter
  static get memoizedHydratingSelector() {
    if (!this._memoizedHydratingSelector) {
      this._memoizedHydratingSelector = createSelector(
        this.selector.bind(this),
        ...values(this.relations).map(Model => Model.selector.bind(Model)),
        (modelState) => this.hydrate(modelState.models)
      );
    }
    return this._memoizedHydratingSelector;
  }
  static hydratingSelector(state) {
    return this.hydrate(this.selector(state).models);
  }
  static hydrate(models) {
    return new ModelHydrationSet(models, this);
  }
  constructor(modelHydration, hydratedRelationsByField) {
    super(modelHydration);
    Object.keys(this.class.relations)
      .filter(field => hydratedRelationsByField[field])
      .forEach(field => {
        if (isArray(this[field])) {
          this[field] = hydratedRelationsByField[field].filter(this[field]);
        } else if (!isUndefined(this[field])) {
          this[field] = hydratedRelationsByField[field].get(this[field]);
        }
      });
  }
}
