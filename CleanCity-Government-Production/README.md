# CleanCity — Citizen Garbage Reporting Portal

React + Vite web app where a citizen reports garbage with a **photo** and **GPS location**, gets a
**complaint ID**, and tracks the report. An **officer dashboard** shows every report with its
coordinates, a "View on Map" link and a status update control.

> College project prototype. Not operated by or affiliated with any government body.
> Uses only HTML, CSS, JavaScript and React. No backend, no paid APIs, no API keys.

## Installation and start

```bash
npm install
npm run dev        # opens http://localhost:5173
```

Production build: `npm run build`, then `npm run preview`.

Needs Node.js 18 or newer. **Internet is needed the first time a photo is checked** (see below).

## Main features

- Take a photo with the phone camera or upload one, with a preview and a "Remove Image" button.
- Photo check in two separate steps (file check, then garbage check). Submit is blocked until the photo passes.
- "Use My Current Location" button using the browser Geolocation API; coordinates are shown before submitting.
- Manual location (address, optional typed coordinates) when GPS is denied. Saved as **manual**, never as GPS-verified.
- Unique complaint ID per report (for example `CC-2026-1001`).
- Track page: status, location, coordinates, Google Maps link.
- Officer dashboard: totals, pending / in-progress / resolved counts, thumbnail, ID, category, date,
  coordinates, location status, View on Map, Update Status, search (ID / category / location), category and status filters.
- Light blue and white theme, responsive (tables become cards on phones).

## How garbage-image validation works

Code: `src/services/imageValidator.js`. There are two **separate** parts.

**Part 1 — File validation (says nothing about what the picture shows).**
Size at most 10 MB; the first bytes of the file must match JPEG, PNG or WebP (so a renamed `.txt` or `.pdf` is rejected);
the browser must be able to decode it (rejects corrupted files); at least 200 x 200 pixels.
File names, extensions and MIME types are never used to decide that something is garbage.

**Part 2 — Content validation (does it show garbage?).**
Uses a real AI model: **CLIP zero-shot image classification** (`Xenova/clip-vit-base-patch32`) through
transformers.js, running in the browser. The model compares the photo with 6 "garbage" descriptions
(for example "a pile of garbage and trash on the ground") and 14 "not garbage" descriptions (selfie, group of
people, pet, vehicle, clean street, scenery, building, document or screenshot, screen, food, room, object, clean bin, plain wall).
- Accepted: total garbage share is at least 0.60 **and** the best single match is a garbage description.
- Between 0.35 and 0.60: "Try again" (not accepted).
- Below 0.35: "Invalid image. Please upload a clear photo showing garbage or a waste-related issue."

States shown to the user: **Checking image**, **Garbage detected**, **Invalid image**, **Try again**.
Under the result, "What the model saw" lists the top 3 matches, which helps when explaining or tuning.

### Model limitations (please read)

- **Download and internet.** transformers.js is loaded from `cdn.jsdelivr.net` and the model files (roughly 100–150 MB,
  exact size not measured here) from `huggingface.co` on the first check. The browser caches them afterwards.
  The model is **not** stored in this ZIP. Offline on first use, the check cannot run, and the photo is **not accepted**
  ("Try again"). This fail-closed behaviour is deliberate.
- **Not trained for garbage.** CLIP is a general model. It is much better than a pixel heuristic, but it can make mistakes:
  piles of other objects may pass, small litter or poor lighting may fail, and a photo of a photo can fool it.
- **Thresholds are untuned.** 0.60 and 0.35 (constants `ACCEPT_THRESHOLD` and `UNCERTAIN_THRESHOLD`) are starting values.
  Test with your own garbage and non-garbage photos and adjust if needed.
- Only the 800 px compressed copy of an accepted photo is saved (to protect localStorage).

## How GPS works

1. The user presses "Use My Current Location". The browser shows its own permission prompt.
2. On success the real latitude and longitude (6 decimals) and accuracy in metres are shown and saved with the report.
3. If permission is denied, the location is unavailable, or the request times out, a clear message is shown and
   **no location is filled in**. The user can type an address (and optionally coordinates). These are saved with
   `locationSource: "manual"` and shown as "not GPS-verified".
4. Browsers only allow GPS on **https:// pages or localhost**. If you open the dev server on a phone through a
   LAN address (`http://192.168.x.x:5173`), GPS will be blocked. Use a deployed https site (for example Netlify or Vercel)
   to test GPS on a phone.

"GPS captured" means the device reported these coordinates. It cannot prove that the user is really there (location can be faked on a device).

## How officers open a report location

In the Officer dashboard (and on the Track page) each report that has valid coordinates shows a **View on Map** link:
`https://www.google.com/maps?q=LATITUDE,LONGITUDE`, built from the saved numbers after range validation.
No API key is needed. Reports without coordinates show "Location not available on map". Older reports without
the new fields still display safely.

## Data storage

Reports are saved in the browser's `localStorage` (key `cleancity_reports`). Each report has a unique ID, the compressed photo,
coordinates, location source and status. Status changes are saved and read by the Track page. If the browser storage is full,
an error message is shown and the report is **not** claimed as saved.

## Known limitations

- **Single-browser data.** There is no backend, so an officer only sees reports saved in the same browser. A real deployment
  needs a server and database.
- **Login / register is a prototype.** Visitors first see a login / register page for **Citizen** or **Officer**. Accounts are saved in this browser only (passwords as salted hashes), so this separates the dashboards but is not real security. Officers need the *officer registration code* to register (demo code `CLEANCITY-OFFICER`; change it in `.env`, see `.env.example`). Use a server-side login for real use.
- The system does not notify anyone. Nothing claims that an officer has received a report; the status is changed manually on the dashboard.
- localStorage holds roughly 5 MB, which is about tens of photo reports.
- Photo check quality depends on the model (see above). Camera capture opens the rear camera only on mobile browsers.

## Project structure

```
src/components   small reusable pieces (ImageUpload, LocationButton, ManualLocation, LocationInfo, ReportForm, tables, cards)
src/pages        Home, ReportIssue, TrackReport, Welcome (login / register), Dashboard (citizen), AdminDashboard (officer portal), NotFound
src/layouts      CitizenLayout, OfficerLayout (the two areas are kept separate)
src/services     imageValidator.js (file + content validation)
src/hooks        useImageValidation.js (photo check state)
src/utils        storage.js, location.js, complaintId.js, helpers.js
src/styles       variables.css, base.css, components.css, pages.css
```
