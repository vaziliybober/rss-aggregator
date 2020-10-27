/* eslint-disable no-underscore-dangle */

import { fileURLToPath } from 'url';
import path from 'path';
import { promises as fs } from 'fs';
import parse from '../src/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filepath) => path.join(__dirname, '..', '__fixtures__', filepath);

test('parse', async () => {
  const rss = await fs.readFile(getFixturePath('rss.xml'));
  const actual = parse(rss);
  const expected = JSON.parse(await fs.readFile(getFixturePath('parse-result.json')));

  expect(actual).toEqual(expected);
});
