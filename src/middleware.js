import { serializeQuery } from './utils';
import { MODEL_QUERY, MODEL_PERSIST, UPDATE_QUERY_CACHE } from './actions';
import { DEVELOPMENT } from './config';

const ENDPOINT = 'sideloader';

export default api => store => next => action => {
  const receiveModels = ({ data }) => action.models.map(Model => next({
    type: Model.RECEIVE,
    data: data[Model.modelNamePlural] || [data[Model.modelName]],
    receivedAt: Date.now(),
  }));

  const error = err => {
    if (err.response) {
      const { response: { data } } = err;
      if (DEVELOPMENT) {
        console.log(JSON.stringify(data, null, 2));
      }
      return; // next(error_action);
    }
    throw err;
  };

  switch (action.type) {
    case MODEL_QUERY:
      const params = serializeQuery(action.query);
      return api.get(`${ENDPOINT}?${params}`)
        .then(receiveModels)
        .then(() => {
          next({
            type: UPDATE_QUERY_CACHE,
            key: params,
          });
        })
        .catch(error);
    case MODEL_PERSIST:
      return api.post(ENDPOINT)
        .then(receiveModels)
        // .then(() => {
        //   next({
        //     type: UPDATE_QUERY_CACHE,
        //     key: params,
        //   });
        // })
        .catch(error);
    default:
      return next(action);
  }
};
