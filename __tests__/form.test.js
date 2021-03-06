import nock from 'nock';
import prettier from 'prettier';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import i18next from 'i18next';
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

  const section = document.querySelector('.section-form');
  const form = section.querySelector('form');

  elements = {
    section,
    input: form.querySelector('input'),
    submit: form.querySelector('button'),
  };

  run();
});

test('form initial', async () => {
  expect(getSectionTree()).toMatchSnapshot();
});

test('form invalid url', async () => {
  elements.input.value = 'asdf';
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('form.errors.invalidUrl'));
  });
  expect(getSectionTree()).toMatchSnapshot();
});

test('form invalid RSS', async () => {
  elements.input.value = someUrl;
  nock(proxyUrl)
    .get(`/${someUrl}`)
    .reply(200, 'some invalid <pipipu> rss');
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('fetching.errors.invalidRss'));
  });
  expect(getSectionTree()).toMatchSnapshot();
});

test('form network error', async () => {
  elements.input.value = someUrl;
  nock(proxyUrl)
    .get(`/${someUrl}`)
    .replyWithError('some error');
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('fetching.errors.networkError'));
  });
  expect(getSectionTree()).toMatchSnapshot();
});

test("form rss loaded and can't load same", async () => {
  elements.input.value = someUrl;
  const rss = await fsp.readFile(getFixturePath('rss.xml'));
  nock(proxyUrl)
    .get(`/${someUrl}`)
    .reply(200, rss);
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('fetching.success'));
  });
  expect(getSectionTree()).toMatchSnapshot();

  elements.input.value = someUrl;
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('form.errors.repetativeUrl'));
  });
  expect(getSectionTree()).toMatchSnapshot();
});
