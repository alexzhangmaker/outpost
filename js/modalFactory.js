class ModalFactory {
  constructor() {
    // Inject CSS styles into the document
    this.injectStyles();
  }

  // Inject CSS styles for the modal
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .modal-overlay.show {
        opacity: 1;
      }
      .modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 100%;
        max-width: 500px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transform: translateY(-50px);
        transition: transform 0.3s ease;
      }
      .modal-overlay.show .modal-content {
        transform: translateY(0);
      }
      .modal-header {
        font-size: 1.5em;
        margin-bottom: 20px;
        color: #333;
      }
      .modal-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .modal-form label {
        font-size: 1em;
        color: #555;
      }
      .modal-form input,
      .modal-form select,
      .modal-form textarea {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1em;
        width: 100%;
        box-sizing: border-box;
      }
      .modal-form input:focus,
      .modal-form select:focus,
      .modal-form textarea:focus {
        outline: none;
        border-color: #007bff;
      }
      .modal-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      .modal-button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1em;
      }
      .modal-button.submit {
        background: #007bff;
        color: white;
      }
      .modal-button.cancel {
        background: #ccc;
        color: #333;
      }
      .modal-button:hover {
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
  }

  // Create a modal with specified configuration
  createModal(config) {
    const {
      title = 'Modal Form',
      fields = [],
      callback = () => console.log('No callback provided'),
      submitLabel = 'Submit',
      cancelLabel = 'Cancel'
    } = config;

    // Create modal elements
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Modal header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.textContent = title;

    // Modal form
    const form = document.createElement('form');
    form.className = 'modal-form';

    // Create form fields
    const inputs = {};
    fields.forEach((field) => {
      const {
        label,
        name,
        type = 'text',
        options = [],
        placeholder = '',
        required = false
      } = field;

      const fieldContainer = document.createElement('div');
      const labelElement = document.createElement('label');
      labelElement.textContent = label;
      labelElement.setAttribute('for', name);

      let inputElement;
      if (type === 'select') {
        inputElement = document.createElement('select');
        inputElement.id = name;
        inputElement.name = name;
        options.forEach((option) => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          inputElement.appendChild(optionElement);
        });
      } else if (type === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.id = name;
        inputElement.name = name;
        inputElement.placeholder = placeholder;
      } else {
        inputElement = document.createElement('input');
        inputElement.id = name;
        inputElement.name = name;
        inputElement.type = type;
        inputElement.placeholder = placeholder;
      }

      if (required) {
        inputElement.required = true;
      }

      fieldContainer.appendChild(labelElement);
      fieldContainer.appendChild(inputElement);
      form.appendChild(fieldContainer);
      inputs[name] = inputElement;
    });

    // Modal buttons
    const buttons = document.createElement('div');
    buttons.className = 'modal-buttons';

    const submitButton = document.createElement('button');
    submitButton.className = 'modal-button submit';
    submitButton.textContent = submitLabel;
    submitButton.type = 'submit';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'modal-button cancel';
    cancelButton.textContent = cancelLabel;
    cancelButton.type = 'button';

    buttons.appendChild(cancelButton);
    buttons.appendChild(submitButton);

    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(form);
    modalContent.appendChild(buttons);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    // Show modal
    setTimeout(() => overlay.classList.add('show'), 10);

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling to overlay
      console.log('Form submit event triggered'); // Debug log
      const formData = {};
      Object.keys(inputs).forEach((key) => {
        formData[key] = inputs[key].value;
      });
      console.log('Form data collected:', formData); // Debug log
      callback(formData);
      this.closeModal(overlay);
    });

    // Fallback submit button click handler
    submitButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling to overlay
      console.log('Submit button clicked'); // Debug log
      form.dispatchEvent(new Event('submit')); // Trigger form submit event
    });

    // Handle cancel button
    cancelButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling to overlay
      console.log('Cancel button clicked'); // Debug log
      this.closeModal(overlay);
    });

    // Close modal on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        console.log('Overlay clicked'); // Debug log
        this.closeModal(overlay);
      }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        console.log('Escape key pressed'); // Debug log
        this.closeModal(overlay);
      }
    }, { once: true });

    return overlay;
  }

  // Close and remove modal
  closeModal(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  }
}

// Attach ModalFactory instance to the global window object
window.modalFactory = new ModalFactory();