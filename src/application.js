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

const addPostToState = (state, postData, feedId) => {
  state.posts.push({
    ...postData,
    id: postData.guid,
    feedId,
  });
};

const addFeedToState = (state, feedData, link) => {
  const feedId = _.uniqueId();

  state.feeds.push({
    id: feedId,
    title: feedData.title,
    link,
  });

  feedData.posts.forEach((postData) => {
    addPostToState(state, postData, feedId);
  });
};

const getRssByLink = (link) => {
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

const addFeedToStateByLink = (state, link) => {
  if (_.some(state.feeds, (feed) => feed.link === link)) {
    return Promise.reject(new Error('repetativeUrl'));
  }

  return getRssByLink(link)
    .then((rss) => {
      try {
        const feedData = parse(rss);
        addFeedToState(state, feedData, link);
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
    const oldPosts = state.posts.filter((post) => post.feedId === feed.id);
    return getRssByLink(feed.link)
      .then((rss) => {
        try {
          return { rssData: parse(rss), oldPosts, feedId };
        } catch (err) {
          throw new Error('invalidRss');
        }
      })
      .catch((err) => {
        console.log(`Error ${err.message} while updating this feed: ${feed.title}`);
      });
  });

  return Promise.all(promises).then((promisesResults) => {
    promisesResults.forEach(({ rssData, oldPosts, feedId }) => {
      const newPostsDataList = rssData.posts
        .filter((postData) => !_.some(oldPosts, (post) => post.id === postData.guid));
      newPostsDataList.forEach((postData) => {
        addPostToState(state, postData, feedId);
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
};

export default () => {
  i18next.init({
    lng: 'en',
    resources,
  })
    .then(setUpController);
};
