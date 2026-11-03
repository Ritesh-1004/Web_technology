// server.js - creates the Express server and starts it
const express = require('express');
const path = require('path');
const registrationRoutes = require('./routes/registration');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// Middleware: parse HTML form data (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Middleware: serve static files (CSS) from /public
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', registrationRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).send(
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>404 Not Found</title>' +
    '<link rel="stylesheet" href="/style.css"></head><body><div class="container">' +
    '<h1>404 - Page Not Found</h1><p>The page you requested does not exist.</p>' +
    '<p><a href="/">Back to registration form</a></p></div></body></html>'
  );
});

// Error-handling middleware (4 arguments). Never shows stack traces to users.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status === 400 || err.status === 413 ? err.status : 500).send(
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Error</title>' +
    '<link rel="stylesheet" href="/style.css"></head><body><div class="container">' +
    '<h1>Something went wrong</h1><p>The request could not be processed. Please try again.</p>' +
    '<p><a href="/">Back to registration form</a></p></div></body></html>'
  );
});

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
