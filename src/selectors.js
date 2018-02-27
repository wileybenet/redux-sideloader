import _, { isFunction, isArray, pick, omit } from 'lodash';

import ModelReducers from './reducers';
import { pk, InheritedFields } from './utils';

const getDefault = (dflt, nullDefault = null) => {
  if (dflt === null) {
    return nullDefault;
  }
  if (isFunction(dflt)) {
    return dflt();
  }
  return dflt;
}

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
class ModelHydrationSet extends InheritedFields {
  constructor(models, meta, Model = null, state = null, hydrationCache = null) {
    super(meta);

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
    return new ModelHydrationSet(pick(this.hydratedModels, primaryKeys), this._hydration);
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
  static defaultFields(nullDefault = null) {
    return _(this.fields).map(({ dflt }, key) => [
      key,
      getDefault(dflt, nullDefault),
    ]).fromPairs().value();
  }
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
    const meta = this.selector(state);
    const models = primaryKeys
      ? pick(meta.models, primaryKeys)
      : meta.models;
    const hydration = this.hydrate(omit(meta, 'models'), models, state, hydrationCache);
    if (!primaryKeys || isArray(primaryKeys)) {
      return hydration;
    }
    return hydration.get(primaryKeys);
  }
  static hydrate(meta, models, state, hydrationCache) {
    return new ModelHydrationSet(models, meta, this, state, hydrationCache);
  }
  constructor(...args) {
    super(...args);
    this._state = args[0];
  }
}
