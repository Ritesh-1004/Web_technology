// Manual location entry: an address / landmark, plus optional coordinates.
// Anything typed here is saved as "manual", never as GPS-verified.
export default function ManualLocation({ values, errors, gpsCaptured, onChange }) {
  return (
    <div>
      <div className="field">
        <label htmlFor="location">
          Address or landmark {gpsCaptured ? '(optional)' : ''}
        </label>
        <input
          id="location"
          type="text"
          className={errors.location ? 'invalid' : ''}
          value={values.location}
          onChange={(e) => onChange('location', e.target.value)}
          placeholder="Street, landmark, or area name"
        />
        {errors.location && <div className="field-error">{errors.location}</div>}
      </div>

      {!gpsCaptured && (
        <details className="manual-coords">
          <summary>I know the coordinates (optional)</summary>
          <p className="hint">Copy latitude and longitude from a map app. These are saved as manual, not GPS-verified.</p>
          <div className="form-row">
            <div className="field">
              <label htmlFor="manualLat">Latitude</label>
              <input id="manualLat" type="text" inputMode="decimal" value={values.manualLat} onChange={(e) => onChange('manualLat', e.target.value)} placeholder="e.g. 18.520430" />
            </div>
            <div className="field">
              <label htmlFor="manualLng">Longitude</label>
              <input id="manualLng" type="text" inputMode="decimal" value={values.manualLng} onChange={(e) => onChange('manualLng', e.target.value)} placeholder="e.g. 73.856740" />
            </div>
          </div>
          {errors.coordinates && <div className="field-error">{errors.coordinates}</div>}
        </details>
      )}
    </div>
  );
}
