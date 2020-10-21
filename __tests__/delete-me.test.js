import deleteMe from '../src/delete-me.js';

test('hello world', () => {
  expect(deleteMe('hello')).toEqual('hello world');
});
