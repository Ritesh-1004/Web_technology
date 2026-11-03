// helpers.js — small, reusable formatting and validation helpers

import { isValidCoordinates } from './location';

/** Format an ISO date string, e.g. "12 Aug 2026, 04:30 pm". Safe for missing dates. */
export function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Validate the report form and return an object of field -> error message. */
export function validateReportForm(fields) {
  const errors = {};

  if (!fields.name || fields.name.trim().length < 2) {
    errors.name = 'Please enter your full name.';
  }

  if (!fields.contact || !/^[6-9]\d{9}$/.test(fields.contact.trim())) {
    errors.contact = 'Enter a valid 10-digit contact number.';
  }

  if (!fields.issueType) {
    errors.issueType = 'Please select an issue type.';
  }

  if (!fields.description || fields.description.trim().length < 10) {
    errors.description = 'Description should be at least 10 characters.';
  }

  // Location: GPS is best. Otherwise the user must type an address or
  // valid coordinates. We never invent a location for them.
  const hasGps = fields.gps && isValidCoordinates(fields.gps.latitude, fields.gps.longitude);
  if (!hasGps) {
    const typedLat = String(fields.manualLat || '').trim();
    const typedLng = String(fields.manualLng || '').trim();
    const typedCoords = typedLat !== '' || typedLng !== '';

    if (typedCoords && !isValidCoordinates(typedLat, typedLng)) {
      errors.coordinates = 'Enter a valid latitude (-90 to 90) and longitude (-180 to 180), or leave both empty.';
    } else if (!typedCoords && (!fields.location || fields.location.trim().length < 3)) {
      errors.location = 'Use "Use My Current Location", or type the street, landmark or area.';
    }
  }

  if (!fields.image || !fields.imageValidation) {
    errors.image = 'Please add a photo and wait for the image check to finish.';
  } else if (!fields.imageValidation.valid || fields.imageValidation.category !== 'garbage') {
    errors.image = 'The photo must pass the garbage check before you can submit.';
  }

  return errors;
}

/** The three statuses a report can have, in workflow order. */
export const STATUS_STEPS = ['Pending', 'In Progress', 'Resolved'];

/** CSS class used for each status badge. */
export function statusMeta(status) {
  switch (status) {
    case 'In Progress':
      return { className: 'status-progress' };
    case 'Resolved':
      return { className: 'status-resolved' };
    default:
      return { className: 'status-pending' };
  }
}
