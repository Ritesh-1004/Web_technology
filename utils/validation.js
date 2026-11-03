// utils/validation.js - reusable server-side validation functions

const DEPARTMENTS = [
  'Computer Engineering',
  'Software Engineering',
  'IT',
  'AI & Data Science'
];

// Returns a trimmed string, or '' if the value is not a string
// (e.g. missing field, or an array/object sent by a malicious request)
function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateName(name) {
  if (!name) return 'Full name is required.';
  if (name.length < 2 || name.length > 50) return 'Full name must be 2 to 50 characters long.';
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) {
    return 'Full name may contain only letters, spaces, dots, apostrophes and hyphens.';
  }
  return null;
}

function validateEmail(email) {
  if (!email) return 'Email address is required.';
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return 'Enter a valid email address (example: name@example.com).';
  }
  return null;
}

function validateMobile(mobile) {
  if (!mobile) return 'Mobile number is required.';
  if (!/^\d{10}$/.test(mobile)) return 'Mobile number must contain exactly 10 digits.';
  return null;
}

function validateAge(age) {
  if (!age) return 'Age is required.';
  if (!/^\d{1,3}$/.test(age)) return 'Age must be a valid whole number.';
  const n = Number(age);
  if (n < 18) return 'You must be at least 18 years old to register.';
  if (n > 100) return 'Enter a realistic age (maximum 100).';
  return null;
}

function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (password.length > 64) return 'Password must be at most 64 characters long.';
  return null;
}

function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Confirm password does not match the password.';
  return null;
}

function validateDepartment(department) {
  if (!department) return 'Please select a department.';
  if (!DEPARTMENTS.includes(department)) return 'Selected department is not valid.';
  return null;
}

// Validates the whole form. Returns { errors, values }.
// - errors: object with one message per invalid field (empty if all valid)
// - values: cleaned values (password is used for checking only; never displayed)
function validateRegistration(body) {
  const data = body && typeof body === 'object' ? body : {};

  const values = {
    name: cleanText(data.name),
    email: cleanText(data.email),
    mobile: cleanText(data.mobile),
    age: cleanText(data.age),
    // passwords are NOT trimmed: spaces may be part of a password
    password: typeof data.password === 'string' ? data.password : '',
    confirmPassword: typeof data.confirmPassword === 'string' ? data.confirmPassword : '',
    department: cleanText(data.department)
  };

  const errors = {};
  const checks = {
    name: validateName(values.name),
    email: validateEmail(values.email),
    mobile: validateMobile(values.mobile),
    age: validateAge(values.age),
    password: validatePassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
    department: validateDepartment(values.department)
  };

  Object.keys(checks).forEach((field) => {
    if (checks[field]) errors[field] = checks[field];
  });

  return { errors, values };
}

module.exports = { DEPARTMENTS, validateRegistration };
