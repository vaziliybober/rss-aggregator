import * as yup from 'yup';
import watch from './view.js';

const schema = yup.string().required().url();

export default () => {
  const state = {
    form: {
      state: 'valid',
      link: '',
    },
  };

  const form = document.querySelector('form');

  const elements = {
    form,
    input: form.querySelector('input'),
    submit: form.querySelector('button'),
  };

  const watchedState = watch(state, elements);

  const handler = (e) => {
    e.preventDefault();

    watchedState.form.link = elements.input.value;

    try {
      schema.validateSync(watchedState.form.link);
      watchedState.form.state = 'valid';
    } catch (ex) {
      watchedState.form.state = 'invalid';
    }
  };

  elements.form.addEventListener('submit', handler);
};
