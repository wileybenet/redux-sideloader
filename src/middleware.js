import { flatten } from 'lodash';

export const MODEL_REQUEST = '@@MODEL_REQUEST';

const getModels = (modelCache, chain) => {
  if (chain.match(/\./)) {
    const chainedModels = chain.split(/\./g);
    const base = chainedModels.shift();
    return [modelCache.getModel(base)].concat(getModels(modelCache, chainedModels.join('.')));
  }
  return modelCache.getModel(chain);
};

export default store => next => action => {
  if (action.type !== MODEL_REQUEST) {
    return next(action);
  }

  const {
    model,
    requestType,
    responseTypeKey,
    errorType,
    context: {
      primaryKey = null,
      include = [],
    } = {},
  } = action;

  const endpoint = primaryKey
    ? `${model.modelNamePlural}/${primaryKey}`
    : `${model.modelNamePlural}`;

  const includeArray = [].concat(include);

  const includedModels = flatten(includeArray.map(includeChain => getModels(model.modelCache, includeChain)));

  const params = {
    include: includeArray,
  };

  const fetchedModels = [...includedModels, model];

  next({
    type: requestType,
    primaryKey,
  });

  return model.api.get(endpoint, { params })
    .then(({ data }) => fetchedModels.map(Model => next({
      type: Model[responseTypeKey],
      data: data[Model.modelNamePlural],
      receivedAt: Date.now(),
      isStale: Boolean(primaryKey),
    })))
    .catch(err => {
      if (err.stack) {
        throw err;
      }
      const { response: { data } } = err;
      return next({
        type: errorType,
        errors: data.errors,
        receivedAt: Date.now(),
      });
    });
};
