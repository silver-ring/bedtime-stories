module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  // Extends the preset: the Redux packages resolve to ESM builds under the
  // react-native condition and React Navigation ships TypeScript sources, so
  // all of them must be transformed.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@react-native-async-storage|@reduxjs|immer|redux|redux-thunk|react-redux|reselect)/)',
  ],
};
