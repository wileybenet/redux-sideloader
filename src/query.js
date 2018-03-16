import React from 'react';
import { connect } from 'react-redux';
import { isString, isNumber, assign, omit } from 'lodash';
import { assert, serializeQuery } from './utils';
import { MODEL_QUERY, UPDATE_QUERY_CACHE, INVALIDATE_QUERY_CACHE } from './actions';
import ModelSelectors from './selectors';

const Loading = ({ msg }) => (
  <div>{ msg ? msg : 'Loading...' }</div>
);

export const parseQ = (...args) => ({
  primaryKey: args.filter(arg => isString(arg) || isNumber(arg))[0] || null,
  includes: args.filter(arg => typeof arg === 'object').reduce((memo, arg) => assign((memo || {}), arg), null),
});

const validateQuery = ({ query, models }) => Boolean(query) && Boolean(models);

class QueryContainer extends React.Component {
  static isQuery = true;
  constructor(props) {
    super(props);
    this.query = serializeQuery(this.props.set.query);
  }
  componentDidMount() {
    this.props.sendQuery();
  }
  render() {
    if (this.props.isReady) {
      return this.props.children;
    }
    return <Loading msg="Loading..." />;
  }
}

const mapStateToProps = (state, ownProps) => ({
  isReady: Boolean(state.entities.$queries[serializeQuery(ownProps.set.query)]),
});

const mapDispatchToProps = (dispatch, ownProps) => {
  assert(validateQuery(ownProps.set), 'invalid query set, must be the result of q()', ownProps.set);
  return {
    sendQuery: () => dispatch({
      type: MODEL_QUERY,
      query: ownProps.set.query,
      models: ownProps.set.models,
    }),
  };
};

export const Query = connect(mapStateToProps, mapDispatchToProps)(QueryContainer);

export const queryReducer = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_QUERY_CACHE:
      return {
        ...state,
        [action.key]: true,
      };
    case INVALIDATE_QUERY_CACHE:
      return omit(state, action.key);
    default:
      return state;
  }
};

const getModels = obj => {
  if (!obj) {
    return [];
  }
  return Object.entries(obj).reduce((memo, [key, queryModel]) => {
    const { model, includes } = queryModel;
    delete queryModel.model;
    return [...memo, model, ...getModels(includes)];
  }, []);
};

export const q = (...args) => {
  const query = assign({}, ...args);
  return {
    query,
    models: getModels(query),
  };
};

export default class ModelQueries extends ModelSelectors {
  static q(/* [primaryKey], [includes] */ ...args) {
    const { primaryKey, includes } = parseQ(...args);
    return {
      [this.modelNamePlural]: {
        model: this,
        primaryKey,
        includes,
      },
    };
  }
}
