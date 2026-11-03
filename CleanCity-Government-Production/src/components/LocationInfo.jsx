import { describeLocation, formatCoordinates, getMapUrl } from '../utils/location';

// Shows a report's saved location: coordinates, how trustworthy they are,
// and a Google Maps link. Works for old reports that have no coordinates.
export default function LocationInfo({ report }) {
  const coords = formatCoordinates(report.latitude, report.longitude);
  const mapUrl = getMapUrl(report.latitude, report.longitude);
  const info = describeLocation(report);

  return (
    <div className="location-info">
      {report.location && <div className="location-text">{report.location}</div>}
      {coords ? (
        <div className="mono coords">{coords}</div>
      ) : (
        <div className="muted">Coordinates not available</div>
      )}
      <span className={`verify-chip chip-${info.tone}`}>{info.label}</span>
      {mapUrl ? (
        <a className="map-link" href={mapUrl} target="_blank" rel="noopener noreferrer">View on Map</a>
      ) : (
        <div className="muted">Location not available on map</div>
      )}
    </div>
  );
}
