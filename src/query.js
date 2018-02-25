import React from 'react';
import { connect } from 'react-redux';

const Loading = ({ msg }) => (
  <div>{ msg ? msg : 'Loading...' }</div>
);

export default (Model) => {
  class Query extends React.Component {
    static defaultProps = {
      isReady: true,
    }
    componentDidMount() {
      this.props.loadModel();
    }
    render() {
      if (this.props.nonBlocking || (!this.props.isLoading && this.props.isReady)) {
        return this.props.children;
      }
      return <Loading msg={`Loading ${this.props.primaryKey ? Model.modelName : Model.modelNamePlural}...`} />;
    }
  }

  const mapDispatchToProps = (dispatch, ownProps) => ({
    modelAction: () => dispatch(Model.fetch({
      primaryKey: ownProps.primaryKey,
      include: ownProps.include,
    })),
  });

  const mergeProps = (stateProps, dispatchProps, ownProps) => ({
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    isLoading: ownProps.isStale,
    loadModel() {
      if (ownProps.isStale) {
        dispatchProps.modelAction(stateProps);
      }
    }
  });

  const ConnectComponent = connect(null, mapDispatchToProps, mergeProps)(Query);
  ConnectComponent.isQuery = true;
  return ConnectComponent;
}
