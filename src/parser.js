const parse = (rss) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rss, 'text/xml');
  const firstErrorElement = doc.querySelector('parsererror');

  if (firstErrorElement) {
    throw new Error(firstErrorElement.textContent);
  }

  const title = doc.querySelector('title').textContent;
  const postElements = Array.from(doc.querySelectorAll('item'));
  const items = postElements.map((postElem) => ({
    title: postElem.querySelector('title').textContent,
    link: postElem.querySelector('link').textContent,
    guid: postElem.querySelector('guid').textContent,
  }));

  return { title, items };
};

export default parse;
