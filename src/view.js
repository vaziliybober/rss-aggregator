import onChange from 'on-change';


export default (state, elements) => {
  const { form, input, submit, feedsContainer, postsContainer } = elements;

  const onIsValidChange = (isValid) => {
    if (isValid) {
      input.classList.remove('is-invalid');
      
    } else {
      input.classList.add('is-invalid');
    }
  };

  const onErrorChange = (error) => {
    form.nextElementSibling.nextElementSibling?.remove();
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('text-danger');
    errorDiv.innerHTML = error;
    form.parentNode.appendChild(errorDiv);
  };

  const onHintChange = (hint) => {
    form.nextElementSibling.nextElementSibling?.remove();
    const hintDiv = document.createElement('div');
    hintDiv.classList.add('text-success');
    hintDiv.innerHTML = hint;
    form.parentNode.appendChild(hintDiv);
  }

  const renderFeeds = (feeds) => {
    feedsContainer.innerHTML = '';
    if (feeds.length === 0) {
      return;
    }

    const header = document.createElement('h2');
    header.textContent = 'Feeds';
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
    header.textContent = 'Posts';
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
      a.rel = "nofollow";
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
            break;
          case 'failed':
            submit.disabled = false;
            break;
          default:
            throw new Error('Unknown fetching state: ' + value);
        }
        break;
    }
  });

  return watchedState;
};
