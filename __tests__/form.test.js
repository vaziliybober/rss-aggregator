/* eslint-disable no-underscore-dangle */

import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http.js';
import prettier from 'prettier';
import path from 'path';
import fs from 'fs';
// import { promises as fsp } from 'fs';
import timer from 'timer-promise';
import run from '../src/application.js';

axios.defaults.adapter = httpAdapter;
nock.disableNetConnect();

// const getFixturePath = (filepath) => path.join(__dirname, '..', '__fixtures__', filepath);

const options = {
  parser: 'html',
  htmlWhitespaceSensitivity: 'ignore',
  tabWidth: 4,
};

const prettify = (html) => prettier.format(html, options);

beforeEach(() => {
  const initHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html')).toString();
  document.documentElement.innerHTML = initHtml;
  run();
});

test('form', async () => {
  const section = document.querySelector('section.jumbotron');
  const getSectionTree = () => prettify(section.innerHTML);

  const form = section.querySelector('form');

  const elements = {
    form,
    input: form.querySelector('input'),
    submit: form.querySelector('button'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
  };

  expect(getSectionTree()).toMatchSnapshot();

  elements.input.value = 'asdf';
  elements.submit.click();
  await timer.start(10);
  expect(getSectionTree()).toMatchSnapshot();

  // elements.input.value = 'https://ru.hexlet.io/lessons.rss';
  // const rss = await fsp.readFile(getFixturePath('rss.xml'));
  // nock('https://cors-anywhere.herokuapp.com')
  //   .get('/https://ru.hexlet.io/lessons.rss')
  //   .reply(200, rss);
  // elements.submit.click();
  // await timer.start(10);
  // expect(getSectionTree()).toMatchSnapshot();
});
