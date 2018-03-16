import { Model } from './index';

describe('actions', () => {
  class Toy extends Model {
    static className = 'Toy'
  }

  test('TYPE through inheritance', () => {
    expect(Toy.TYPE).toBe('TOY');
  });

  test('base actions', () => {
    expect(Toy.RECEIVE).toBe('TOY_RECEIVE');
    expect(Toy.RECEIVE_ONE).toBe('TOY_RECEIVE_ONE');
    expect(Toy.ERROR).toBe('TOY_ERROR');
  });
});
