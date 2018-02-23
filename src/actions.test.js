import { Model } from './index';

describe('actions', () => {
  class Toy extends Model {
    static className = 'Toy'
  }

  test('TYPE through inheritance', () => {
    expect(Toy.TYPE).toBe('TOY');
  });

  test('base actions', () => {
    expect(Toy.FETCH).toBe('FETCH_TOY');
    expect(Toy.RECEIVE).toBe('RECEIVE_TOY');
    expect(Toy.ERROR).toBe('ERROR_TOY');
  });
});
