/* eslint-disable no-underscore-dangle */

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

axios.defaults.adapter = httpAdapter;
nock.disableNetConnect();

const getFixturePath = (filepath) => path.join(__dirname, '..', '__fixtures__', filepath);

const options = {
  parser: 'html',
  htmlWhitespaceSensitivity: 'ignore',
  tabWidth: 4,
};

let elements;

const prettify = (html) => prettier.format(html, options);
const getSectionTree = () => prettify(elements.section.innerHTML);

beforeEach(() => {
  const initHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html')).toString();
  document.documentElement.innerHTML = initHtml;

  const section = document.querySelector('section.jumbotron');
  const form = section.querySelector('form');

  elements = {
    section,
    form,
    input: form.querySelector('input'),
    submit: form.querySelector('button'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
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
  elements.input.value = 'https://ru.hexlet.io/lessons.rss';
  nock('https://cors-anywhere.herokuapp.com')
    .get('/https://ru.hexlet.io/lessons.rss')
    .reply(200, 'some invalid <pipipu> rss');
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('form.errors.invalidRss'));
  });
  expect(getSectionTree()).toMatchSnapshot();
});

test('form network error', async () => {
  elements.input.value = 'https://ru.hexletttttttt.io/lessons.rss';
  nock('https://cors-anywhere.herokuapp.com')
    .get('/https://ru.hexletttttttt.io/lessons.rss')
    .replyWithError('some error');
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('form.errors.networkError'));
  });
  expect(getSectionTree()).toMatchSnapshot();
});

test("form rss loaded and can't load same", async () => {
  elements.input.value = 'https://ru.hexlet.io/lessons.rss';
  const rss = await fsp.readFile(getFixturePath('rss.xml'));
  nock('https://cors-anywhere.herokuapp.com')
    .get('/https://ru.hexlet.io/lessons.rss')
    .reply(200, rss);
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('form.hints.rssLoaded'));
  });
  expect(getSectionTree()).toMatchSnapshot();

  elements.input.value = 'https://ru.hexlet.io/lessons.rss';
  elements.submit.click();
  await waitFor(() => {
    expect(elements.section).toHaveTextContent(i18next.t('form.errors.repetativeUrl'));
  });
  expect(getSectionTree()).toMatchSnapshot();
});
