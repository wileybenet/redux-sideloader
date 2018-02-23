import { Model } from './index';

describe('reducers', () => {
  test('base reducer', () => {
    class Book extends Model {
      static className = 'Book'
    }
    const state = {
      models: {
        1: {
          name: 'test',
        }
      },
    };
    const action = {
      type: Book.UPDATE_ONE,
      primaryKey: 1,
      field: 'name',
      value: 'new_test',
    };
    expect(Book.reducer(state, action)).toEqual({
      models: {
        1: {
          name: 'new_test',
          isSaved: false,
        }
      },
    });
  });
});
