export class ModelCache {
  constructor(models = []) {
    this.models = {};
  }
  cacheModel(Model) {
    this.models[Model.name] = Model;
    this.models[Model.modelNamePlural] = Model;
  }
  getModel(name) {
    if (this.models[name]) {
      return this.models[name];
    }
    throw new Error(`'${name}' is not a valid model name`);
  }
}
