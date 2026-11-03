import { useState } from 'react';
import { formatCoordinates } from '../utils/location';

// "Use My Current Location" button.
// Calls the browser Geolocation API (the browser shows its own permission
// prompt), then reports the real latitude/longitude up to the form.
// If anything fails we show the reason and leave the location EMPTY:
// we never fill in a guessed or default location.
export default function LocationButton({ gps, onLocationFound, onClear }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = () => {
    setError('');

    if (!('geolocation' in navigator)) {
      setError('This browser does not support GPS location. Please type the location below instead.');
      return;
    }
    // Browsers only allow GPS on https:// pages (or localhost)
    if (window.isSecureContext === false) {
      setError('GPS only works on a secure (https) page. Please type the location below instead.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        const { latitude, longitude, accuracy } = position.coords;
        onLocationFound({
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          accuracy: Math.round(accuracy)
        });
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setError('Location permission was denied. Allow location access for this site in your browser settings and try again, or type the location below. A typed location is saved as "manual", not GPS-verified.');
        } else if (err.code === 2) {
          setError('Your location is not available right now (no GPS signal or location services are off). Try again outdoors, or type the location below.');
        } else if (err.code === 3) {
          setError('Finding your location took too long. Please try again, or type the location below.');
        } else {
          setError('Could not get your location. Please try again, or type the location below.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="location-box">
      <div className="location-row">
        <button type="button" className="btn btn-outline btn-sm" onClick={handleClick} disabled={loading}>
          {loading ? 'Finding your location…' : 'Use My Current Location'}
        </button>
        {gps && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>Clear GPS location</button>
        )}
      </div>

      {gps && (
        <div className="location-result" role="status">
          <strong>GPS location captured</strong>
          <div>Latitude, Longitude: <span className="mono">{formatCoordinates(gps.latitude, gps.longitude)}</span></div>
          {gps.accuracy !== null && gps.accuracy !== undefined && <div>Accuracy: about {gps.accuracy} metres</div>}
          {gps.accuracy > 100 && (
            <div className="location-warning">Accuracy is low. For a better reading, move outdoors and press the button again.</div>
          )}
        </div>
      )}

      {error && <div className="location-error" role="alert">{error}</div>}
    </div>
  );
}
