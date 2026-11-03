// routes/registration.js - handles GET / and POST /register
const express = require('express');
const fs = require('fs');
const path = require('path');
const { DEPARTMENTS, validateRegistration } = require('../utils/validation');

const router = express.Router();

// Registered students are kept ONLY in server memory (lost when the server restarts).
// Passwords are never stored.
const registeredStudents = [];

const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'form.html'), 'utf8');

// Escape user input before putting it into HTML (prevents XSS)
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fieldError(errors, field) {
  return errors[field] ? '<p class="field-error">' + escapeHtml(errors[field]) + '</p>' : '';
}

// Fills the {{placeholders}} in views/form.html
function renderPage({ values = {}, errors = {}, success = null }) {
  const errorList = Object.values(errors);

  let banner = '';
  if (errorList.length > 0) {
    banner =
      '<div class="message error-box"><strong>Please fix the following errors:</strong><ul>' +
      errorList.map((e) => '<li>' + escapeHtml(e) + '</li>').join('') +
      '</ul></div>';
  } else if (success) {
    banner =
      '<div class="message success-box"><strong>Registration successful!</strong>' +
      '<p>Welcome, ' + escapeHtml(success.name) + '. Your details were validated by the server.</p>' +
      '<ul>' +
      '<li>Email: ' + escapeHtml(success.email) + '</li>' +
      '<li>Mobile: ' + escapeHtml(success.mobile) + '</li>' +
      '<li>Age: ' + escapeHtml(success.age) + '</li>' +
      '<li>Department: ' + escapeHtml(success.department) + '</li>' +
      '</ul>' +
      '<p class="note">Note: data is held only in server memory and is not saved permanently.</p></div>';
  }

  const options = DEPARTMENTS.map(
    (d) =>
      '<option value="' + escapeHtml(d) + '"' +
      (values.department === d ? ' selected' : '') + '>' + escapeHtml(d) + '</option>'
  ).join('');

  const data = {
    BANNER: banner,
    NAME: escapeHtml(values.name || ''),
    EMAIL: escapeHtml(values.email || ''),
    MOBILE: escapeHtml(values.mobile || ''),
    AGE: escapeHtml(values.age || ''),
    DEPARTMENT_OPTIONS: options,
    NAME_ERROR: fieldError(errors, 'name'),
    EMAIL_ERROR: fieldError(errors, 'email'),
    MOBILE_ERROR: fieldError(errors, 'mobile'),
    AGE_ERROR: fieldError(errors, 'age'),
    PASSWORD_ERROR: fieldError(errors, 'password'),
    CONFIRM_ERROR: fieldError(errors, 'confirmPassword'),
    DEPARTMENT_ERROR: fieldError(errors, 'department')
  };

  return template.replace(/{{(\w+)}}/g, (match, key) => (key in data ? data[key] : ''));
}

// GET / -> show the empty registration form
router.get('/', (req, res) => {
  res.status(200).send(renderPage({}));
});

// POST /register -> validate on the server, then respond
router.post('/register', (req, res) => {
  const { errors, values } = validateRegistration(req.body);

  if (Object.keys(errors).length > 0) {
    // 400 Bad Request; keep previous values but never send the password back
    return res.status(400).send(renderPage({ values, errors }));
  }

  const student = {
    name: values.name,
    email: values.email,
    mobile: values.mobile,
    age: values.age,
    department: values.department
  };
  registeredStudents.push(student);
  console.log('New registration #' + registeredStudents.length + ': ' + student.email);

  // 200 OK with a success message and an empty form
  res.status(200).send(renderPage({ success: student }));
});

module.exports = router;
