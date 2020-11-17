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

const validate = (link, schema) => {
  try {
    schema.validateSync(link);
  } catch (err) {
    err.type = err.message;
    throw err;
  }
};

const getFeedData = (link) => axios.get(proxifyUrl(link))
  .catch((err) => {
    err.type = 'networkError';
    throw err;
  })
  .then((response) => {
    try {
      return parse(response.data);
    } catch (err) {
      err.type = 'invalidRss';
      throw err;
    }
  });

const updateFeeds = (watchedState) => {
  watchedState.updating.state = 'pending';
  const promises = watchedState.feeds.map((feed) => {
    const feedId = feed.id;
    const oldPosts = watchedState.posts.filter((post) => post.feedId === feed.id);
    return axios.get(proxifyUrl(feed.link))
      .then((response) => {
        const feedData = parse(response.data);
        return { feedData, oldPosts, feedId };
      });
  });
  return Promise.allSettled(promises)
    .then((promisesResults) => {
      promisesResults
        .filter(({ status }) => status === 'fulfilled')
        .forEach(({ value }) => {
          const { feedData, oldPosts, feedId } = value;
          const newItems = _.differenceWith(feedData.items, oldPosts,
            (p1, p2) => p1.guid === p2.guid);
          const newPosts = newItems.map((item) => ({ ...item, feedId }));
          watchedState.posts.push(...newPosts);
        });
    })
    .then(() => {
      watchedState.updating.state = 'finished';
    });
};

const startPeriodicFeedsUpdating = (watchedState) => {
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

        watchedState.form.isValid = true;
        watchedState.form.error = '';
        const link = elements.input.value;
        const schema = urlSchema.notOneOf(watchedState.feeds.map((feed) => feed.link), 'repetativeUrl');
        try {
          validate(link, schema);
        } catch (err) {
          watchedState.form.isValid = false;
          watchedState.form.error = err.type;
          return Promise.resolve();
        }

        watchedState.fetching.state = 'pending';
        watchedState.fetching.error = '';
        return getFeedData(link)
          .then((feedData) => {
            const feedId = _.uniqueId();
            watchedState.feeds.push({ id: feedId, title: feedData.title, link });
            const posts = feedData.items.map((item) => ({ ...item, feedId }));
            watchedState.posts.push(...posts);
            watchedState.fetching.state = 'finished';
          })
          .catch((err) => {
            watchedState.fetching.state = 'failed';
            watchedState.fetching.error = err.type;
          });
      };

      elements.form.addEventListener('submit', handler);
      startPeriodicFeedsUpdating(watchedState);
    });
};
