export const pk = model => model[model.primaryKey];

export class InheritedFields {
  constructor(hydration) {
    this.class = this.constructor;
    for (const key in hydration) {
      this[key] = hydration[key];
    }
  }
}
