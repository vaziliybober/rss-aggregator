import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import watch from './view.js';
import parse from './parser.js';
import resources from './locales/index.js';

const schema = yup.string().required().url();

const urls = {
  proxy: () => 'https://cors-anywhere.herokuapp.com',
};

const addFeed = (state, feedData, link) => {
  const feedId = _.uniqueId();

  state.feeds.push({
    id: feedId,
    title: feedData.title,
    link,
  });

  feedData.posts.forEach((post) => {
    state.posts.push({
      ...post,
      id: _.uniqueId(),
      feedId,
    });
  });
};

const addFeedByLink = (state, link) => {
  try {
    schema.validateSync(link);
  } catch (e) {
    return Promise.reject(new Error('invalidUrl'));
  }

  if (_.some(state.feeds, (feed) => feed.link === link)) {
    return Promise.reject(new Error('repetativeUrl'));
  }

  return axios({
    method: 'get',
    url: `/${link}`,
    baseURL: urls.proxy(),
  })
    .catch((error) => {
      console.log(error);
      throw new Error('networkError');
    })
    .then((response) => {
      const rss = response.data;
      try {
        const feedData = parse(rss);
        addFeed(state, feedData, link);
      } catch (e) {
        throw new Error('invalidRss');
      }
    });
};

const setUpController = () => {
  const state = {
    fetching: 'finished',
    form: {
      isValid: true,
      error: '',
      hint: '',
    },
    feeds: [],
    posts: [],
  };

  const form = document.querySelector('form');

  const elements = {
    form,
    input: form.querySelector('input'),
    submit: form.querySelector('button'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
  };

  const watchedState = watch(state, elements);

  const handler = (e) => {
    e.preventDefault();

    watchedState.form.isValid = true;
    watchedState.form.error = '';
    watchedState.form.hint = '';
    watchedState.fetching = 'pending';
    return addFeedByLink(watchedState, elements.input.value)
      .then(() => {
        watchedState.form.error = '';
        watchedState.form.hint = 'rssLoaded';
        watchedState.form.isValid = true;
        watchedState.fetching = 'finished';
      })
      .catch((err) => {
        watchedState.form.error = err.message;
        watchedState.form.hint = '';
        watchedState.form.isValid = false;
        watchedState.fetching = 'failed';
      });
  };

  elements.form.addEventListener('submit', handler);
};

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  })
    .then(setUpController);
};
