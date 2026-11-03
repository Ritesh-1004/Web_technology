import { useState } from 'react';
import ImageUpload from './ImageUpload';
import LocationButton from './LocationButton';
import ManualLocation from './ManualLocation';
import { validateReportForm } from '../utils/helpers';
import { resolveLocation } from '../utils/location';
import { addReport } from '../utils/storage';
import { generateComplaintId } from '../utils/complaintId';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const ISSUE_TYPES = [
  'Garbage Dumping',
  'Overflowing Bin',
  'Street Litter',
  'Plastic Waste',
  'Mixed Waste',
  'Construction Debris',
  'Other Waste Issue'
];

const initialState = {
  name: '',
  contact: '',
  issueType: '',
  description: '',
  location: '',        // typed address / landmark
  gps: null,           // { latitude, longitude, accuracy } from the GPS button
  manualLat: '',       // typed coordinates (saved as "manual")
  manualLng: '',
  image: null,         // small saved copy of the photo
  imageValidation: null
};

export default function ReportForm({ onSubmitted }) {
  const { session } = useAuth();
  // Pre-fill name (and mobile number, if that is how they registered)
  const startingFields = () => ({
    ...initialState,
    name: session ? session.name : '',
    contact: session && /^\+?\d{10,13}$/.test(session.identifier) ? session.identifier.slice(-10) : ''
  });
  const [fields, setFields] = useState(startingFields);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [photoKey, setPhotoKey] = useState(0);
  const { showToast } = useToast();

  const updateField = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, coordinates: undefined }));
  };

  const handleImageValidated = (payload) => {
    // payload is null until the photo has passed the garbage check
    setFields((prev) => ({
      ...prev,
      image: payload ? payload.dataUrl : null,
      imageValidation: payload ? payload.validation : null
    }));
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaveError('');

    const validationErrors = validateReportForm(fields);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    // Second check: a report is never created without a photo that passed
    // the garbage check, even if the button state were somehow wrong.
    const v = fields.imageValidation;
    if (!fields.image || !v || v.valid !== true || v.category !== 'garbage') {
      setErrors((prev) => ({ ...prev, image: 'The photo must pass the garbage check before you can submit.' }));
      return;
    }

    const place = resolveLocation(fields);

    const report = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      complaintId: generateComplaintId(),
      userId: session ? session.userId : null, // the citizen account that owns this report
      name: fields.name.trim(),
      contact: fields.contact.trim(),
      issueType: fields.issueType,
      description: fields.description.trim(),
      location: place.location,
      latitude: place.latitude,
      longitude: place.longitude,
      accuracy: place.accuracy,
      locationSource: place.locationSource, // 'gps' or 'manual'
      image: fields.image,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const saved = addReport(report);
    if (!saved.ok) {
      setSaveError(saved.error);
      showToast('Report could not be saved.', 'error');
      return;
    }

    showToast('Report submitted.', 'success');
    setFields(startingFields());
    setErrors({});
    setPhotoKey((k) => k + 1); // resets the photo box
    onSubmitted(report);
  };

  const photoOk = Boolean(fields.imageValidation && fields.imageValidation.valid);
  const hasGps = Boolean(fields.gps);

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label>Photo of the garbage</label>
        <ImageUpload key={photoKey} onValidatedChange={handleImageValidated} />
        {errors.image && <div className="field-error">{errors.image}</div>}
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="name">Full Name</label>
          <input id="name" type="text" className={errors.name ? 'invalid' : ''} value={fields.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. Aditi Sharma" />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </div>

        <div className="field">
          <label htmlFor="contact">Contact Number</label>
          <input id="contact" type="tel" className={errors.contact ? 'invalid' : ''} value={fields.contact} onChange={(e) => updateField('contact', e.target.value)} placeholder="10-digit mobile number" />
          {errors.contact && <div className="field-error">{errors.contact}</div>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="issueType">Issue Type</label>
        <select id="issueType" className={errors.issueType ? 'invalid' : ''} value={fields.issueType} onChange={(e) => updateField('issueType', e.target.value)}>
          <option value="">Select an issue type</option>
          {ISSUE_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {errors.issueType && <div className="field-error">{errors.issueType}</div>}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" className={errors.description ? 'invalid' : ''} value={fields.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe what you saw: how large the problem is, since when, any hazards." />
        {errors.description && <div className="field-error">{errors.description}</div>}
      </div>

      <fieldset className="location-fieldset">
        <legend>Location</legend>
        <LocationButton
          gps={fields.gps}
          onLocationFound={(gps) => {
            setFields((prev) => ({ ...prev, gps }));
            setErrors((prev) => ({ ...prev, location: undefined, coordinates: undefined }));
          }}
          onClear={() => setFields((prev) => ({ ...prev, gps: null }))}
        />
        <ManualLocation values={fields} errors={errors} gpsCaptured={hasGps} onChange={updateField} />
        <p className="hint">
          {hasGps
            ? 'This report will be saved with your GPS coordinates.'
            : 'Without GPS, the location is saved as manual and is not GPS-verified.'}
        </p>
      </fieldset>

      {saveError && <div className="form-error" role="alert">{saveError}</div>}

      <button type="submit" className="btn btn-primary btn-block" disabled={!photoOk}>
        Submit Report
      </button>
      {!photoOk && <p className="hint center">Add a photo and wait for "Garbage detected" to enable submission.</p>}
    </form>
  );
}
