const parse = (rss) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rss, 'text/xml');

  const title = doc.querySelector('title').textContent;
  const postElements = Array.from(doc.querySelectorAll('item'));

  const posts = postElements.map((postElem) => ({
    title: postElem.querySelector('title').textContent,
    link: postElem.querySelector('link').textContent,
    guid: postElem.querySelector('guid').textContent,
  }));

  return { title, posts };
};

export default parse;
