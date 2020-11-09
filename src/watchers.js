import onChange from 'on-change';
import i18next from 'i18next';

export default (state, elements) => {
  const {
    form, input, submit, feedsContainer, postsContainer,
  } = elements;

  const showMessage = (message, style = 'text-info') => {
    form.nextElementSibling.nextElementSibling?.remove();
    if (message === '') {
      return;
    }
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(style);
    messageDiv.innerHTML = message;
    form.parentNode.appendChild(messageDiv);
  };

  const renderFeeds = (feeds) => {
    feedsContainer.innerHTML = '';
    if (feeds.length === 0) {
      return;
    }
    const header = document.createElement('h2');
    header.textContent = i18next.t('feeds');
    feedsContainer.appendChild(header);
    const ul = document.createElement('ul');
    ul.className = 'list-group';
    feedsContainer.appendChild(ul);

    feeds.forEach((feed) => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      ul.appendChild(li);
      li.textContent = feed.title;
    });
  };

  const renderPosts = (posts) => {
    postsContainer.innerHTML = '';
    if (posts.length === 0) {
      return;
    }
    const header = document.createElement('h2');
    header.textContent = i18next.t('posts');
    postsContainer.appendChild(header);
    const ul = document.createElement('ul');
    ul.className = 'list-group';
    postsContainer.appendChild(ul);

    posts.forEach((post) => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      ul.appendChild(li);
      const a = document.createElement('a');
      li.appendChild(a);
      a.href = post.link;
      a.target = '_blank';
      a.rel = 'nofollow';
      a.textContent = post.title;
    });
  };

  const onFetchingStateChange = (fetchingState) => {
    switch (fetchingState) {
      case 'pending':
        submit.disabled = true;
        break;
      case 'finished':
        showMessage(i18next.t('fetching.success'), 'text-success');
        renderFeeds(state.feeds);
        renderPosts(state.posts);
        submit.disabled = false;
        input.value = '';
        input.focus();
        break;
      case 'failed':
        submit.disabled = false;
        break;
      default:
        throw new Error(`Unknown fetching state: ${fetchingState}`);
    }
  };

  const onUpdatingStateChange = (updatingState) => {
    switch (updatingState) {
      case 'pending':
        break;
      case 'finished':
        renderPosts(state.posts);
        break;
      default:
        throw new Error(`Unknown updating state: ${updatingState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.isValid':
        if (value) input.classList.remove('is-invalid');
        else input.classList.add('is-invalid');
        break;
      case 'form.error':
        showMessage(value && i18next.t(`form.errors.${value}`), 'text-danger');
        break;
      case 'fetching.state':
        onFetchingStateChange(value);
        break;
      case 'fetching.error':
        showMessage(value && i18next.t(`fetching.errors.${value}`), 'text-danger');
        break;
      case 'updating.state':
        onUpdatingStateChange(value);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
