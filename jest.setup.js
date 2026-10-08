/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

// The persistence layer logs in development builds; keep test output readable.
console.log = jest.fn();
