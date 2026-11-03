# Student Registration and Validation System

Web Technology Assignment 4 - **Design, Develop and Deploy a Web Application to Demonstrate Server-Side Validation Using Node.js**

A Node.js + Express app with a student registration form. Every field is validated **on the server**, so validation still works when the browser is bypassed (curl, Postman, etc.).

## Project Structure

```
student-registration/
├── server.js              # creates Express server, middleware, 404 + error handlers
├── routes/registration.js # GET / and POST /register
├── utils/validation.js    # reusable validation functions
├── views/form.html        # registration form (with {{placeholders}})
├── public/style.css       # styling
├── package.json
└── README.md
```

## Run Locally (Windows PowerShell)

```powershell
# 1. Open the project folder (change the path to where you extracted the ZIP)
cd C:\Users\YourName\Downloads\student-registration

# 2. Install dependencies
npm install

# 3. Start the server
npm start
#   (optional, auto-restart on changes: npm run dev)

# 4. Open in browser
start http://localhost:3000
```

Requires Node.js 18 or newer (`node -v` to check). To use another port: `$env:PORT=4000; npm start`.

## Validation Rules

| Field | Rule |
|---|---|
| Full Name | Required, 2-50 chars, letters/spaces/. ' - only |
| Email | Required, valid format |
| Mobile | Exactly 10 digits |
| Age | Whole number, 18 to 100 |
| Password | 8-64 characters |
| Confirm Password | Must match password |
| Department | Must be one of the 4 allowed options |

Text inputs are trimmed. Non-string or unexpected values are rejected safely. Passwords are never stored, logged or displayed.

## Test Plan

| # | Test case | Input | Expected result |
|---|---|---|---|
| 1 | Valid registration | Name `Ritesh Sharma`, email `ritesh@example.com`, mobile `9876543210`, age `21`, password `secret123`, confirm `secret123`, dept `IT` | 200, green success message |
| 2 | Empty name | Name blank | 400, "Full name is required." |
| 3 | Invalid email | `abc123` | 400, email error |
| 4 | Invalid mobile | `98765` | 400, mobile error |
| 5 | Underage student | Age `16` | 400, age error |
| 6 | Short password | `abc12` | 400, password error |
| 7 | Password mismatch | confirm `different1` | 400, mismatch error |
| 8 | Missing department | "-- Select Department --" | 400, department error |
| 9 | Direct POST | Invalid data sent via curl/Postman | 400, server rejects it |

### Browser testing
Open `http://localhost:3000`, fill the form as per each row, click **Submit Registration**. The form uses `novalidate` so the server (not the browser) does the checking. Previously typed values stay in the form after an error (except passwords).

### curl testing (PowerShell - use `curl.exe`, not `curl`)

```powershell
# Valid registration -> 200
curl.exe -i -X POST http://localhost:3000/register --data-urlencode "name=Ritesh Sharma" --data-urlencode "email=ritesh@example.com" --data-urlencode "mobile=9876543210" --data-urlencode "age=21" --data-urlencode "password=secret123" --data-urlencode "confirmPassword=secret123" --data-urlencode "department=IT"

# Invalid data sent directly (bypasses the browser) -> 400
curl.exe -i -X POST http://localhost:3000/register --data-urlencode "name=" --data-urlencode "email=abc123" --data-urlencode "mobile=123" --data-urlencode "age=16" --data-urlencode "password=abc" --data-urlencode "confirmPassword=xyz" --data-urlencode "department=Hacking"

# Empty POST -> 400 with all errors
curl.exe -i -X POST http://localhost:3000/register

# Unknown route -> 404
curl.exe -i http://localhost:3000/nothing
```

### Postman
Method `POST`, URL `http://localhost:3000/register`, Body -> `x-www-form-urlencoded`, add the 7 keys: `name, email, mobile, age, password, confirmPassword, department`.

## Deployment (Node.js hosting)

GitHub Pages **cannot** run an Express backend (it only serves static files). Use a Node.js host such as **Render** or Railway:

1. Push the project to a GitHub repository (`node_modules` is ignored by `.gitignore`).
2. On [render.com](https://render.com) create a new **Web Service** and connect the repository.
3. Settings: Runtime `Node`, Build Command `npm install`, Start Command `npm start`.
4. Deploy. The app reads `process.env.PORT`, which the host sets automatically.
5. Open the public URL Render gives you and test the form.

Note: registrations are stored only in server memory, so they disappear on restart/redeploy.

## Key Concepts (short explanations)

- **Modules:** each file exports with `module.exports` and is loaded with `require()` (`validation.js` -> `registration.js` -> `server.js`).
- **Routing:** `router.get('/')` and `router.post('/register')` map URL + HTTP method to a handler function. `express.Router()` keeps routes in a separate file.
- **Middleware:** functions that run between request and response. Used: `express.urlencoded()` (parses form data into `req.body`), `express.static()` (serves CSS), a 404 handler and an error handler.
- **Request handling:** form data arrives in `req.body`; we clean and validate it.
- **Response handling:** `res.status(400).send(html)` for errors, `res.status(200).send(html)` for success.

## Viva Questions and Answers

1. **Why validate on the server when the browser already validates?** Browser checks can be disabled or bypassed (curl, Postman, dev tools). Server validation is the only one you can trust.
2. **What is Express?** A Node.js framework that simplifies creating servers, routing and middleware.
3. **What is middleware?** A function with access to `req`, `res` and `next` that runs during request processing.
4. **What does `express.urlencoded()` do?** Parses HTML form data and puts it in `req.body`.
5. **Difference between GET and POST?** GET fetches a page (data in URL); POST sends data in the request body (used for forms).
6. **Why status 400 for invalid input?** 400 Bad Request means the client sent invalid data. 200 means OK, 404 means not found, 500 means server error.
7. **What are `require()` and `module.exports`?** `module.exports` shares code from a file; `require()` imports it elsewhere.
8. **Why is the password not shown or stored?** It is sensitive. Real apps store only a salted hash (e.g. bcrypt); this assignment does not store it at all.
9. **Why `novalidate` on the form?** To disable browser checks so server-side validation is demonstrated.
10. **Why `escapeHtml`?** To stop XSS: user input like `<script>` is shown as text instead of running.
11. **Is the data saved permanently?** No, only in an in-memory array, lost on restart. A database would be needed for permanent storage.
12. **Why `process.env.PORT`?** Hosting platforms assign the port; locally it falls back to 3000.
13. **Why can't GitHub Pages host this?** It only serves static files and cannot run Node.js.
14. **What is `package.json`?** Project metadata, scripts (`npm start`) and dependency list.
