import { isUndefined, isArray, pick } from 'lodash';
import { createSelector } from 'reselect';

import ModelReducers from './reducers';
import { pk } from './utils';

class ModelHydrationSet {
  constructor(models, Model = null, entityStates = null) {
    if (Model) {
      const hydratedRelationsByField = Object.entries(Model.relations).reduce((memo, [field, Relation]) => ({
        ...memo,
        [field]: Relation.memoizedHydratingSelector({ entities: entityStates }),
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
  map(...args) {
    return this.all.map(...args);
  }
  reduce(...args) {
    return this.all.map(...args);
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
    return state.entities
      ? state.entities[this.modelNamePlural]
      : state[this.modelNamePlural];
  }
  static entities(state) {
    return state.entities;
  }
  static getRelationModels() {
    return Object.entries(this.relations);
  }
  static attachStore(store) {
    this.store = store;
  }
  // memoizing a static method using a getter
  static get memoizedHydratingSelector() {
    if (!this._memoizedHydratingSelector) {
      this._memoizedHydratingSelector = createSelector(
        this.selector.bind(this),
        this.entities, // TODO should walk foreign key tree and only watch related entities
        (modelState, entityStates) => this.hydrate(modelState.models, entityStates)
      );
    }
    return this._memoizedHydratingSelector;
  }
  static hydratingSelector(state) {
    return this.hydrate(this.selector(state).models, state.entities);
  }
  static hydrate(models, entityStates) {
    return new ModelHydrationSet(models, this, entityStates);
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
