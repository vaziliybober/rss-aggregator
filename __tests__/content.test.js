import nock from 'nock';
import prettier from 'prettier';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import run from '../src/application.js';
import config from '../src/config.js';

axios.defaults.adapter = httpAdapter;
nock.disableNetConnect();

const getFixturePath = (filepath) => path.join(__dirname, '..', '__fixtures__', filepath);

const options = {
  parser: 'html',
  htmlWhitespaceSensitivity: 'ignore',
  tabWidth: 4,
};

const { proxyUrl } = config;
const someUrl = 'https://ru.hexlet.io/lessons.rss';

let elements;

const prettify = (html) => prettier.format(html, options);
const getSectionTree = () => prettify(elements.section.innerHTML);

beforeEach(() => {
  const initHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html')).toString();
  document.documentElement.innerHTML = initHtml;

  const section = document.querySelector('.section-content');
  const form = document.querySelector('form');

  elements = {
    section,
    input: form.querySelector('input'),
    submit: form.querySelector('button'),
    feedsContainer: section.querySelector('.feeds'),
    postsContainer: section.querySelector('.posts'),
  };
});

test('content initial', async () => {
  run();
  expect(getSectionTree()).toMatchSnapshot();
});

test('content feeds with updating', async () => {
  const oldSetTimeout = window.setTimeout;
  window.setTimeout = (callback) => oldSetTimeout(callback, 10);

  run();

  const rss = await fsp.readFile(getFixturePath('rss.xml'));
  const rss1 = await fsp.readFile(getFixturePath('rss1.xml'));
  const rss2 = await fsp.readFile(getFixturePath('rss2.xml'));

  elements.input.value = someUrl;
  nock(proxyUrl).get(`/${someUrl}`)
    .reply(200, rss);
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent('Новые уроки на Хекслете');
  });
  expect(getSectionTree()).toMatchSnapshot();

  elements.input.value = someUrl;
  nock(proxyUrl).get(`/${someUrl}`)
    .reply(200, rss1);
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent('OLD ITEM');
    expect(elements.section).not.toHaveTextContent('NEW ITEM');
  });
  expect(getSectionTree()).toMatchSnapshot();

  const scope = nock(proxyUrl).get(`/${someUrl}`)
    .reply(200, rss2);
  await waitFor(() => {
    expect(elements.section).toHaveTextContent('NEW ITEM');
  });
  expect(getSectionTree()).toMatchSnapshot();
  scope.done();

  window.setTimeout = oldSetTimeout;
});
