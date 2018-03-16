import ModelQueries from './query';

/**
 * Base Model class
 * Derive specific data modals from Model to simplify fetching, storing, caching, creating,
 * updating, and deleting
 * Define relations using the static relations prop to enable automatic model tree hydration
 * @class
 */
export default class Model extends ModelQueries {
  static initialize(modelCache) {
    this.modelCache = modelCache;

    modelCache.cacheModel(this);
    this.bindActions();
  }
}
