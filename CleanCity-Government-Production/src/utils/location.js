// location.js — small helpers for coordinates and map links.
// Everything that touches latitude/longitude goes through here, so the
// rules (valid range, Google Maps URL format) live in exactly one place.

/** Convert a value to a number. Empty strings become NaN (not 0). */
function toNumber(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'string' && value.trim() === '') return NaN;
  return Number(value);
}

/** True only for real numbers inside the valid latitude/longitude range. */
export function isValidCoordinates(latitude, longitude) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // 0,0 is a classic "empty value" bug, so we never accept it as a location.
  if (lat === 0 && lng === 0) return false;
  return true;
}

/** Google Maps link built from validated coordinates, or null if invalid. */
export function getMapUrl(latitude, longitude) {
  if (!isValidCoordinates(latitude, longitude)) return null;
  return `https://www.google.com/maps?q=${Number(latitude)},${Number(longitude)}`;
}

/** "18.520430, 73.856740" — or null if the coordinates are not valid. */
export function formatCoordinates(latitude, longitude) {
  if (!isValidCoordinates(latitude, longitude)) return null;
  return `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;
}

/**
 * Turns what the form knows into the location fields saved with a report.
 * - GPS captured        -> source "gps"
 * - typed coordinates   -> source "manual" (not GPS-verified)
 * - address text only   -> source "manual", no coordinates
 */
export function resolveLocation(fields) {
  const address = (fields.location || '').trim();

  if (fields.gps && isValidCoordinates(fields.gps.latitude, fields.gps.longitude)) {
    return {
      location: address || 'GPS location (no address entered)',
      latitude: Number(Number(fields.gps.latitude).toFixed(6)),
      longitude: Number(Number(fields.gps.longitude).toFixed(6)),
      accuracy: fields.gps.accuracy ?? null,
      locationSource: 'gps'
    };
  }

  if (isValidCoordinates(fields.manualLat, fields.manualLng)) {
    return {
      location: address || 'Manually entered coordinates',
      latitude: Number(Number(fields.manualLat).toFixed(6)),
      longitude: Number(Number(fields.manualLng).toFixed(6)),
      accuracy: null,
      locationSource: 'manual'
    };
  }

  return { location: address, latitude: null, longitude: null, accuracy: null, locationSource: 'manual' };
}

/** Label + style used wherever we show how trustworthy a location is. */
export function describeLocation(report) {
  const hasCoords = isValidCoordinates(report.latitude, report.longitude);
  if (hasCoords && report.locationSource === 'gps') {
    return { label: 'GPS captured', tone: 'ok' };
  }
  if (hasCoords) {
    return { label: 'Manual coordinates (not GPS-verified)', tone: 'warn' };
  }
  if (report.location) {
    return { label: 'Manual address only (not GPS-verified)', tone: 'warn' };
  }
  return { label: 'Location not available', tone: 'none' };
}
