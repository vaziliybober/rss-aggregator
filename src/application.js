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

const addPost = (state, postData, feedId) => {
  state.posts.push({
    title: postData.title,
    id: postData.guid,
    feedId,
  });
};

const addFeed = (state, feedData, link) => {
  const feedId = _.uniqueId();

  state.feeds.push({
    id: feedId,
    title: feedData.title,
    link,
  });

  feedData.posts.forEach((postData) => {
    addPost(state, postData, feedId);
  });
};

const getFeedByLink = (link) => {
  try {
    schema.validateSync(link);
  } catch (e) {
    return Promise.reject(new Error('invalidUrl'));
  }

  return axios({
    method: 'get',
    url: `/${link}`,
    baseURL: urls.proxy(),
  })
    .catch(() => {
      throw new Error('networkError');
    })
    .then((response) => response.data);
};

const addFeedByLink = (state, link) => {
  if (_.some(state.feeds, (feed) => feed.link === link)) {
    return Promise.reject(new Error('repetativeUrl'));
  }

  return getFeedByLink(link)
    .then((rss) => {
      try {
        const feedData = parse(rss);
        addFeed(state, feedData, link);
      } catch (e) {
        throw new Error('invalidRss');
      }
    });
};

const updateFeeds = (state) => {
  if (state.feeds.length === 0) {
    return Promise.resolve();
  }

  const promises = state.feeds.map((feed) => {
    const feedId = feed.id;
    const posts = state.posts.filter((post) => post.feedId === feed.id);
    return getFeedByLink(feed.link).then((rss) => ({ rss, posts, feedId }));
  });

  return Promise.all(promises).then((data) => {
    data.forEach(({ rss, posts, feedId }) => {
      const rssData = parse(rss);
      const newPostsData = rssData.posts
        .filter((postData) => !_.some(posts, (post) => post.id === postData.guid));
      newPostsData.forEach((postData) => {
        addPost(state, postData, feedId);
      });
    });
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
};

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  })
    .then(setUpController);
};
