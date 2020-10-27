import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import watch from './view.js';
import parse from './parser.js';

const schema = yup.string().required().url();

const urls = {
  proxy: () => 'https://cors-anywhere.herokuapp.com',
};

const addFeed = (state, feedData, link) => {
  const feedId = _.uniqueId();

  state.feeds.push({ 
    id: feedId, 
    title: feedData.title, 
    link
  });

  feedData.posts.forEach((post) => {
    state.posts.push({ 
      ...post, 
      id: _.uniqueId(), 
      feedId 
    });
  });
};

const addFeedByLink = (state, link) => {
  try {
    schema.validateSync(link);
  } catch (e) {
    return Promise.reject(new Error('This must be a valid URL'));
  }

  if (_.some(state.feeds, (feed) => feed.link === link)) {
    return Promise.reject(new Error('This URL has already been added'));
  }

  return axios({
    method: 'get',
    url: `/${link}`,
    baseURL: urls.proxy(),
  })
  .catch((error) => {
    console.log(error);
    throw new Error('Network error');
  })
  .then((response) => {
    const rss = response.data;
    try {
      const feedData = parse(rss);
      addFeed(state, feedData, link);
    } catch (e) {
      throw new Error('This source must contain valid RSS');
    }
  });
};

export default () => {
  const state = {
    fetching: 'finished',
    form: {
      isValid: true,
      error: '',
      hint: ''
    },
    feeds: [],
    posts: []
  };

  const form = document.querySelector('form');

  const elements = {
    form,
    input: form.querySelector('input'),
    submit: form.querySelector('button'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts')
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
      watchedState.form.hint = 'RSS has been loaded'
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
