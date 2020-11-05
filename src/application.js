import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import watch from './watchers.js';
import parse from './parser.js';
import resources from './locales/index.js';

const urlSchema = yup.string().required().url('invalidUrl');

const urls = {
  proxy: () => 'https://cors-anywhere.herokuapp.com',
};

const getRssByLink = (link) => axios.get(`${urls.proxy()}/${link}`)
  .then((response) => response.data)
  .catch(() => {
    throw new Error('networkError');
  });

const addFeedToStateByLink = (state, link) => urlSchema
  .notOneOf(state.feeds.map((feed) => feed.link), 'repetativeUrl')
  .validate(link)
  .then(getRssByLink)
  .then((rss) => {
    try {
      const feedData = parse(rss);
      const feedId = _.uniqueId();
      state.feeds.push({ id: feedId, title: feedData.title, link });
      const posts = feedData.items.map((item) => ({ ...item, feedId }));
      state.posts.push(...posts);
    } catch (e) {
      throw new Error('invalidRss');
    }
  });

const updateFeeds = (state) => {
  if (state.feeds.length === 0) {
    return Promise.resolve();
  }

  const promises = state.feeds.map((feed) => {
    const feedId = feed.id;
    const oldPosts = state.posts.filter((post) => post.feedId === feed.id);
    return getRssByLink(feed.link)
      .then((rss) => {
        try {
          return { rssData: parse(rss), oldPosts, feedId };
        } catch (err) {
          throw new Error('invalidRss');
        }
      });
  });

  return Promise.all(promises).then((promisesResults) => {
    promisesResults.forEach(({ rssData, oldPosts, feedId }) => {
      const newItems = _.differenceWith(rssData.items, oldPosts,
        (p1, p2) => p1.guid === p2.guid);
      const newPosts = newItems.map((item) => ({ ...item, feedId }));
      state.posts.push(...newPosts);
    });
  });
};

export default () => {
  i18next.init({
    lng: 'en',
    resources,
  })
    .then(() => {
      const state = {
        fetching: 'finished',
        form: {
          isValid: true,
          error: '',
          hint: '',
        },
        updating: 'finished',
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
        return addFeedToStateByLink(watchedState, elements.input.value)
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

      const setUpdateFeedsTimeout = () => setTimeout(() => {
        watchedState.updating = 'pending';
        return updateFeeds(watchedState)
          .catch(() => {
            watchedState.updating = 'failed';
          })
          .then(() => {
            watchedState.updating = 'finished';
          })
          .then(setUpdateFeedsTimeout);
      }, 5000);

      setUpdateFeedsTimeout();
    });
};
