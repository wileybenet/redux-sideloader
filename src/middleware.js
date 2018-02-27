import _ from 'lodash';

import { DEVELOPMENT } from './config';

export const MODEL_REQUEST = '@@MODEL_REQUEST';
export const MODEL_PERSIST = '@@MODEL_PERSIST';

const getModels = (modelCache, chain) => {
  if (chain.match(/\./)) {
    const chainedModels = chain.split(/\./g);
    const base = chainedModels.shift();
    return [modelCache.getModel(base)].concat(getModels(modelCache, chainedModels.join('.')));
  }
  return modelCache.getModel(chain);
};

const prepare = method => (next, action) => {
  const {
    model,
    requestType,
    responseTypeKey,
    errorType,
    context = {},
  } = action;

  const fetchedModels = [model];

  const params = {};

  if (context.include) {
    const includeArray = [].concat(context.include);
    _(includeArray)
      .map(includeChain => getModels(model.modelCache, includeChain))
      .flatten()
      .forEach(m => fetchedModels.unshift(m));
    params.include = includeArray;
  }

  next({
    type: requestType,
    primaryKey: context.primaryKey,
  });

  return method(model, requestType, context, { params })
    .then(({ data }) => fetchedModels.map(Model => {
      return next({
        type: Model[responseTypeKey],
        data: data[Model.modelNamePlural] || [],
        receivedAt: Date.now(),
        isStale: Boolean(context.primaryKey),
      });
    }))
    .catch(err => {
      if (err.response) {
        const { response: { data } } = err;
        if (DEVELOPMENT) {
          console.log(JSON.stringify(data, null, 2));
        }
        return next({
          type: errorType,
          errors: data.errors,
          receivedAt: Date.now(),
        });
      }
      throw err;
    });
}

const request = prepare((model, requestType, context, params) => {
  const endpoint = context.primaryKey
    ? `${model.modelNamePlural}/${context.primaryKey}`
    : `${model.modelNamePlural}`;
  return model.api.get(endpoint, params);
});

const persist = prepare((model, requestType, context) => {
  if (context.isPersisted) {
    return model.api.put(`${model.modelNamePlural}/${context.primaryKey}`, context.body);
  }
  return model.api.post(`${model.modelNamePlural}`, context.body);
});

export default store => next => action => {
  switch (action.type) {
    case MODEL_REQUEST:
      return request(next, action);
    case MODEL_PERSIST:
      return persist(next, action);
    default:
      return next(action);
  }
};
