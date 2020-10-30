import onChange from 'on-change';
import i18next from 'i18next';

export default (state, elements) => {
  const {
    form, input, submit, feedsContainer, postsContainer,
  } = elements;

  const onIsValidChange = (isValid) => {
    if (isValid) {
      input.classList.remove('is-invalid');
    } else {
      input.classList.add('is-invalid');
    }
  };

  const onErrorChange = (error) => {
    form.nextElementSibling.nextElementSibling?.remove();
    if (error === '') {
      return;
    }

    const errorDiv = document.createElement('div');
    errorDiv.classList.add('text-danger');
    errorDiv.innerHTML = i18next.t(`form.errors.${error}`);
    form.parentNode.appendChild(errorDiv);
  };

  const onHintChange = (hint) => {
    form.nextElementSibling.nextElementSibling?.remove();
    if (hint === '') {
      return;
    }

    const hintDiv = document.createElement('div');
    hintDiv.classList.add('text-success');
    hintDiv.innerHTML = i18next.t(`form.hints.${hint}`);
    form.parentNode.appendChild(hintDiv);
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

  const watchedState = onChange(state, (path, value) => {
    console.log(`${path} = ${value}`);
    switch (path) {
      case 'form.isValid':
        onIsValidChange(value);
        break;
      case 'form.error':
        onErrorChange(value);
        break;
      case 'form.hint':
        onHintChange(value);
        break;
      case 'fetching':
        switch (value) {
          case 'pending':
            submit.disabled = true;
            break;
          case 'finished':
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
            throw new Error(`Unknown fetching state: ${value}`);
        }
        break;
      case 'updating':
        if (value === 'finished') {
          renderPosts(state.posts);
        }
        break;
      default:
        break;
    }
  });

  return watchedState;
};
