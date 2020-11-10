/* eslint-disable no-param-reassign */

import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import watch from './watchers.js';
import parse from './parser.js';
import resources from './locales/index.js';
import config from './config.js';

const urlSchema = yup.string().required().url('invalidUrl');

const proxifyUrl = (url) => `${config.proxyUrl}/${url}`;

const addFeed = (watchedState, link) => {
  watchedState.form.isValid = true;
  watchedState.form.error = '';
  watchedState.fetching.state = 'pending';
  watchedState.fetching.error = '';

  const schema = urlSchema.notOneOf(watchedState.feeds.map((feed) => feed.link), 'repetativeUrl');

  return Promise.resolve()
    .then(() => schema.validate(link)
      .catch((err) => {
        watchedState.form.isValid = false;
        watchedState.form.error = err.message;
        throw err;
      }))
    .then((properLink) => axios.get(proxifyUrl(properLink))
      .catch((err) => {
        watchedState.fetching.error = 'networkError';
        throw err;
      }))
    .then((response) => {
      try {
        const feedData = parse(response.data);
        const feedId = _.uniqueId();
        watchedState.feeds.push({ id: feedId, title: feedData.title, link });
        const posts = feedData.items.map((item) => ({ ...item, feedId }));
        watchedState.posts.push(...posts);
      } catch (err) {
        watchedState.fetching.error = 'invalidRss';
        throw err;
      }
    })
    .then(() => {
      watchedState.fetching.state = 'finished';
    })
    .catch(() => {
      // console.log(err);
      watchedState.fetching.state = 'failed';
    });
};

const updateFeeds = (watchedState) => {
  watchedState.updating.state = 'pending';
  const promises = watchedState.feeds.map((feed) => {
    const feedId = feed.id;
    const oldPosts = watchedState.posts.filter((post) => post.feedId === feed.id);
    return axios.get(proxifyUrl(feed.link))
      .then((response) => ({ rssData: parse(response.data), oldPosts, feedId }));
  });
  return Promise.allSettled(promises).then((promisesResults) => {
    promisesResults
      .filter(({ status }) => status === 'fulfilled')
      .forEach(({ value }) => {
        const { rssData, oldPosts, feedId } = value;
        const newItems = _.differenceWith(rssData.items, oldPosts,
          (p1, p2) => p1.guid === p2.guid);
        const newPosts = newItems.map((item) => ({ ...item, feedId }));
        watchedState.posts.push(...newPosts);
      });
  })
    .then(() => {
      watchedState.updating.state = 'finished';
    });
};

const startUpdatingFeeds = (watchedState) => {
  const setUpdateFeedsTimeout = () => setTimeout(() => updateFeeds(watchedState)
    .then(setUpdateFeedsTimeout), config.updateInterval);

  setUpdateFeedsTimeout();
};

export default (options = {}) => {
  Object.assign(config, options);

  i18next.init({
    lng: 'en',
    resources,
  })
    .then(() => {
      const state = {
        form: {
          isValid: true,
          error: '',
        },
        fetching: {
          state: 'finished',
          error: '',
        },
        updating: {
          state: 'finished',
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
        return addFeed(watchedState, elements.input.value);
      };

      elements.form.addEventListener('submit', handler);
      startUpdatingFeeds(watchedState);
    });
};
