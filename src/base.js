const models = {};

export const getModel = name => {
  if (models[name]) {
    return models[name];
  }
  throw new Error(`'${name}' is not a valid model name`);
};

export const cacheModel = Model => {
  models[Model.name] = Model;
  models[Model.modelNamePlural] = Model;
};
