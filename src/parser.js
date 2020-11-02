const parse = (rss) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rss, 'text/xml');
  const errors = Array.from(doc.getElementsByTagName('parsererror'))
    .map((err) => err.innerHTML);

  try {
    const title = doc.querySelector('title').textContent;
    const postElements = Array.from(doc.querySelectorAll('item'));
    const posts = postElements.map((postElem) => ({
      title: postElem.querySelector('title').textContent,
      link: postElem.querySelector('link').textContent,
      guid: postElem.querySelector('guid').textContent,
    }));

    return { title, posts, errors };
  } catch (err) {
    return { errors: [...errors, err] };
  }
};

export default parse;
