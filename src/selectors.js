import { isArray, pick } from 'lodash';

import ModelReducers from './reducers';
import { pk } from './utils';

const getRelations = (Model, relations = []) => {
  return relations.concat(Model.relations.reduce((memo, [field, Relation]) => memo.concat(getRelations(Relation, relations)), []));
};

class HydrationCache {
  constructor() {
    this.cache = {};
  }
  get(Model, primaryKey) {
    if (this.cache[Model.modelName]) {
      return this.cache[Model.modelName][primaryKey];
    }
    return null;
  }
  set(Model, instance) {
    this.cache[Model.modelName] = this.cache[Model.modelName] || {};
    this.cache[Model.modelName][pk(instance)] = instance;
  }
}

/**
 * Use the static selector for a model to pass hydrated model instances to a display component
 * state =>
 *   filtered to relevant models =>
 *     iterate through relations =>
 *       recursively hydrate relevant relations
 * @class
 */
class ModelHydrationSet {
  constructor(models, Model = null, state = null, hydrationCache = null) {
    if (Model) {
      if (!hydrationCache) {
        hydrationCache = new HydrationCache();
      }
      this.hydratedModels = Object.entries(models)
        .map(([primaryKey, model]) => {
          const cachedHydration = hydrationCache.get(Model, primaryKey);
          if (cachedHydration) {
            return cachedHydration;
          }
          const instance = new Model(model);
          hydrationCache.set(Model, instance);
          Model.relations.forEach(([key, Relation]) => {
            if (instance.hasOwnProperty(key)) {
              instance[key] = Relation.hydratingSelector(state, instance[key], hydrationCache);
            }
          });
          return instance;
        })
        .reduce((hydratedModels, instance) => ({
          ...hydratedModels,
          [pk(instance)]: instance,
        }), {});
    } else {
      this.hydratedModels = models;
    }
  }
  get all() {
    return Object.entries(this.hydratedModels).map(([, model]) => model);
  }
  get length() {
    return Object.keys(this.hydratedModels).length;
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
    return this.all.reduce(...args);
  }
}

export default class ModelSelectors extends ModelReducers {
  static fields = {}
  static getModel(modelName) {
    return this.modelCache.getModel(modelName);
  }
  static selector(state) {
    return state.entities
      ? state.entities[this.modelNamePlural]
      : state[this.modelNamePlural];
  }
  static buildRelations() {
    const relations = Object.entries(this.fields)
      .filter(([field, config]) => config.type === 'relation')
      .map(([field, config = {}]) => {
        const Relation = this.getModel(config.modelName);
        if (config.inverse) {
          Relation.importRelation(this, config.inverse);
        }
        return [field, Relation];
      })
      .concat(this.foreignRelations || []);
    this.relations = (this.relations || []).concat(relations);
  }
  static importRelation(Relation, field) {
    this.relations = this.relations || [];
    this.relations.push([
      field,
      Relation,
    ]);
  }
  static attachStore(store) {
    this.store = store;
  }
  // TODO memoize at some point
  static hydratingSelector(state, primaryKeys = null, hydrationCache = null) {
    const models = primaryKeys
      ? pick(this.selector(state).models, primaryKeys)
      : this.selector(state).models;
    const hydration = this.hydrate(models, state, hydrationCache);
    if (!primaryKeys || isArray(primaryKeys)) {
      return hydration;
    }
    return hydration.get(primaryKeys);
  }
  static hydrate(models, state, hydrationCache) {
    return new ModelHydrationSet(models, this, state, hydrationCache);
  }
}
