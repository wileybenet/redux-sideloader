import React from 'react';

export default (Model) => {
  class Form extends React.Component {
    constructor(...args) {
      super(...args);
      this._formStateKey = `${Model.modelName}Form`;
      this.state = this.defaultState();

      this.createModel = this.createModel.bind(this);
    }
    defaultState() {
      return {
        [this._formStateKey]: Model.defaultFields(''),
      };
    }
    updateModelForm(field) {
      return ({ target: { value }}) => this.setState({
        [this._formStateKey]: {
          ...this.state[this._formStateKey],
          [field]: value,
        },
      });
    }
    createModel() {
      Model.create(this.state[this._formStateKey]);
      this.setState(this.defaultState());
    }
  }

  return Form;
}
