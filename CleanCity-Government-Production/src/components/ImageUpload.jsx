import { useEffect, useRef } from 'react';
import useImageValidation from '../hooks/useImageValidation';

// Lets the user take a photo or choose one, shows the preview and the
// validation state, and reports the result to the form through
// onValidatedChange(null | { dataUrl, validation }).
// The form checks the result again before saving a report, so this
// component is not the only safety net.
export default function ImageUpload({ onValidatedChange }) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { status, result, previewUrl, selectFile, retry, reset, isBusy } = useImageValidation();

  // Tell the form whenever the outcome changes. Only a valid image is passed up.
  useEffect(() => {
    if (status === 'valid' && result) {
      onValidatedChange({ dataUrl: result.previewDataUrl, validation: result });
    } else {
      onValidatedChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, result]);

  const handleFileSelect = (e) => {
    selectFile(e.target.files && e.target.files[0]);
    e.target.value = ''; // lets the user pick the same file again later
  };

  const openCamera = () => cameraInputRef.current && cameraInputRef.current.click();
  const openGallery = () => galleryInputRef.current && galleryInputRef.current.click();

  const hiddenInputs = (
    <>
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="visually-hidden" tabIndex={-1} aria-hidden="true" data-testid="gallery-input" />
      {/* capture="environment" opens the rear camera on phones */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="visually-hidden" tabIndex={-1} aria-hidden="true" data-testid="camera-input" />
    </>
  );

  // No photo yet
  if (status === 'idle') {
    return (
      <div className="upload-box">
        <p className="upload-lead">Add a clear photo of the garbage or waste issue</p>
        <div className="upload-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={openCamera}>Take Photo</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={openGallery}>Upload Image</button>
        </div>
        <p className="upload-hint">JPG, PNG or WebP, up to 10 MB. The photo is checked before it can be submitted.</p>
        {hiddenInputs}
      </div>
    );
  }

  return (
    <div className="verify-panel">
      <div className="verify-preview">
        {previewUrl && <img src={previewUrl} alt="Selected photo preview" />}
      </div>

      {status === 'checking' && (
        <div className="verify-status analyzing" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <div className="verify-status-title">Checking image…</div>
            <p className="verify-status-detail">
              Scanning for garbage. This usually takes only a few seconds (the very first time, the detection model is downloaded once and then saved on your device).
            </p>
          </div>
        </div>
      )}

      {status === 'valid' && (
        <div className="verify-status valid" role="status" aria-live="polite">
          <span className="verify-status-icon" aria-hidden="true">✓</span>
          <div>
            <div className="verify-status-title">Garbage detected</div>
            <p className="verify-status-detail">
              The model judged that this photo shows garbage or waste ({Math.round(result.confidence * 100)}% match).
            </p>
          </div>
        </div>
      )}

      {status === 'invalid' && (
        <div className="verify-status invalid" role="alert">
          <span className="verify-status-icon" aria-hidden="true">✕</span>
          <div>
            <div className="verify-status-title">Invalid image</div>
            <p className="verify-status-detail">{result && result.reason}</p>
          </div>
        </div>
      )}

      {(status === 'uncertain' || status === 'error') && (
        <div className="verify-status uncertain" role="alert">
          <span className="verify-status-icon" aria-hidden="true">!</span>
          <div>
            <div className="verify-status-title">Try again</div>
            <p className="verify-status-detail">{result && result.reason}</p>
          </div>
        </div>
      )}

      {result && result.topGuesses && result.topGuesses.length > 0 && (
        <details className="verify-details">
          <summary>What the model saw (top matches)</summary>
          <ul>
            {result.topGuesses.map((g) => (
              <li key={g.label}>{g.label}: {g.percent}%</li>
            ))}
          </ul>
        </details>
      )}

      {!isBusy && (
        <div className="verify-status-actions">
          {status === 'error' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={retry}>Try again</button>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={openCamera}>Take Another Photo</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={openGallery}>Upload Another</button>
          <button type="button" className="btn btn-danger-outline btn-sm" onClick={reset}>Remove Image</button>
        </div>
      )}

      {hiddenInputs}
    </div>
  );
}
