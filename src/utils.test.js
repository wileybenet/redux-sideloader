import { serializeQuery } from './utils';

describe('utils', () => {
  test('serializeQuery', () => {
    const query = {
      procs: {
        primaryKey: null,
        includes: null,
      },
    };
    expect(serializeQuery(query)).toEqual('q[procs]=true');
  });

  test('serializeQuery deep', () => {
    const query = {
      procs: {
        primaryKey: 1,
        include: {
          tasks: {
            primaryKey: null,
            include: {
              actions: {
                primaryKey: null,
                includes: null,
              },
            },
          },
        },
      },
    };
    expect(serializeQuery(query)).toEqual('q[procs][include][tasks][include][actions]=true&q[procs][primaryKey]=1');
  });

  test('serializeQuery multi', () => {
    const query = {
      procs: {
        primaryKey: 1,
        include: null,
      },
      tasks: {
        primaryKey: null,
        includes: null,
      },
      actions: {
        primaryKey: null,
        includes: null,
      },
    };
    expect(serializeQuery(query)).toEqual('q[actions]=true&q[procs][primaryKey]=1&q[tasks]=true');
  });

  test('serializeQuery multi sorted', () => {
    const query = {
      tasks: {
        primaryKey: null,
        includes: null,
      },
      actions: {
        primaryKey: null,
        includes: null,
      },
      procs: {
        primaryKey: 1,
        include: null,
      },
    };
    expect(serializeQuery(query)).toEqual('q[actions]=true&q[procs][primaryKey]=1&q[tasks]=true');
  });
});
