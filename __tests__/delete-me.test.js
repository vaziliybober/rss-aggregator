import deleteMe from '../index.js';

test('hello world', () => {
  expect(deleteMe('hello')).toEqual('hello world');
});
