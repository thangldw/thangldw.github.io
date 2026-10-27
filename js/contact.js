(function () {
  'use strict';
  document.querySelectorAll('[data-copy-email]').forEach(function (button) {
    button.addEventListener('click', async function () {
      var status = button.closest('.resume-contact, .case-study-contact')?.querySelector('.copy-status');
      try {
        await navigator.clipboard.writeText(button.dataset.copyEmail);
        if (status) status.textContent = 'Email address copied.';
      } catch (error) {
        if (status) status.textContent = 'Select the email address to copy it, or open it in your email app.';
      }
    });
  });
})();
