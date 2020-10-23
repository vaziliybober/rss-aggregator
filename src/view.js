import onChange from 'on-change';


export default (state, elements) => {
  const { form, input } = elements;

  const watchedState = onChange(state, (path, value) => {
    if (path === 'form.state') {
      switch(value) {
        case 'valid':
          console.log('valid');
          input.classList.remove('is-invalid');
          form.nextElementSibling.nextElementSibling?.remove();
          break;
        case 'invalid':
          console.log('invalid');
          input.classList.add('is-invalid');
          const errorDiv = document.createElement('div');
          errorDiv.classList.add('text-danger');
          errorDiv.innerHTML = 'this must be a valid URL';
          form.parentNode.appendChild(errorDiv);
          break;
        default:
          throw new Error('unknown form state: ' + value);
      }
    }
  });

  return watchedState;
};