import ModelQueries, { q, parseQ } from './query';

describe('query', () => {
  describe('ModelQueries', () => {
    class Car extends ModelQueries {
      static className = 'Car';
    }

    class Tire extends ModelQueries {
      static className = 'Tire';
    }

    class Speaker extends ModelQueries {
      static className = 'Speaker';
    }

    test('q()', () => {
      expect(q(Car.q(10, Tire.q('1234')))).toEqual({
        query: {
          cars: {
            primaryKey: 10,
            includes: {
              tires: {
                primaryKey: '1234',
                includes: null,
              },
            },
          },
        },
        models: [Car, Tire],
      });
    });

    test('Model.q()', () => {
      expect(Car.q()).toEqual({
        cars: {
          model: Car,
          primaryKey: null,
          includes: null,
        },
      });
    });

    test('Model.q(<primaryKey>)', () => {
      expect(Car.q(12)).toEqual({
        cars: {
          model: Car,
          primaryKey: 12,
          includes: null,
        },
      });
    });

    test('Model.q(Model.q())', () => {
      expect(Car.q(Tire.q())).toEqual({
        cars: {
          model: Car,
          primaryKey: null,
          includes: {
            tires: {
              model: Tire,
              primaryKey: null,
              includes: null,
            },
          },
        },
      });
    });

    test('Model.q(<primaryKey>, Model.q(<primaryKey>))', () => {
      expect(Car.q(10, Tire.q('1234'))).toEqual({
        cars: {
          model: Car,
          primaryKey: 10,
          includes: {
            tires: {
              model: Tire,
              primaryKey: '1234',
              includes: null,
            },
          },
        },
      });
    });

    test('Model.q(Model.q(), Model.q(<primaryKey>))', () => {
      expect(Car.q(Tire.q(), Speaker.q())).toEqual({
        cars: {
          model: Car,
          primaryKey: null,
          includes: {
            tires: {
              model: Tire,
              primaryKey: null,
              includes: null,
            },
            speakers: {
              model: Speaker,
              primaryKey: null,
              includes: null,
            },
          },
        },
      });
    });
  });

  describe('helpers', () => {
    test('parseQ without params', () => {
      const args = [];
      const expected = {
        primaryKey: null,
        includes: null,
      };
      expect(parseQ(...args)).toEqual(expected);
    });

    test('parseQ with primaryKey', () => {
      const args = ['1'];
      const expected = {
        primaryKey: '1',
        includes: null,
      };
      expect(parseQ(...args)).toEqual(expected);
    });

    test('parseQ with object', () => {
      const args = [{
        tasks: {
          primaryKey: '45',
          includes: {
            actions: {
              primaryKey: null,
              includes: null,
            },
          },
        },
      }];
      const expected = {
        primaryKey: null,
        includes: {
          tasks: {
            primaryKey: '45',
            includes: {
              actions: {
                primaryKey: null,
                includes: null,
              },
            },
          },
        },
      };
      expect(parseQ(...args)).toEqual(expected);
    });

    test('parseQ with array', () => {
      const args = [{
        tasks: {
          primaryKey: '45',
          includes: null,
        },
      }, {
        actions: {
          primaryKey: null,
          includes: null,
        },
      }];
      const expected = {
        primaryKey: null,
        includes: {
          tasks: {
            primaryKey: '45',
            includes: null,
          },
          actions: {
            primaryKey: null,
            includes: null,
          },
        },
      };
      expect(parseQ(...args)).toEqual(expected);
    });

    test('parseQ with primaryKey and object', () => {
      const args = ['10', {
        toys: {
          primaryKey: null,
          includes: null,
        },
      }];
      const expected = {
        primaryKey: '10',
        includes: {
          toys: {
            primaryKey: null,
            includes: null,
          },
        },
      };
      expect(parseQ(...args)).toEqual(expected);
    });

    test('parseQ with primaryKey and array', () => {
      const args = ['09876', {
        toys: {
          primaryKey: null,
          includes: null,
        },
      }, {
        tasks: {
          primaryKey: '45',
          includes: {
            actions: {
              primaryKey: null,
              includes: null,
            },
          },
        },
      }];
      const expected = {
        primaryKey: '09876',
        includes: {
          toys: {
            primaryKey: null,
            includes: null,
          },
          tasks: {
            primaryKey: '45',
            includes: {
              actions: {
                primaryKey: null,
                includes: null,
              },
            },
          },
        },
      };
      expect(parseQ(...args)).toEqual(expected);
    });
  });
});
