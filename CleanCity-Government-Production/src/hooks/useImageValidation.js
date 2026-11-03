import { useCallback, useEffect, useRef, useState } from 'react';
import { validateWasteImage } from '../services/imageValidator';

/**
 * Keeps track of the photo and its validation state.
 *
 * status:
 *   idle      - no photo chosen
 *   checking  - "Checking image"
 *   valid     - "Garbage detected"
 *   invalid   - "Invalid image"
 *   uncertain - "Try again" (model was not sure)
 *   error     - "Try again" (check could not run)
 *
 * If the user picks another photo while a check is running, the old
 * result is ignored (that is what the token is for).
 */
export default function useImageValidation() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const tokenRef = useRef(0);
  const fileRef = useRef(null);
  const previewUrlRef = useRef(null);

  // Free the preview URL when the component goes away
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const runCheck = useCallback((file) => {
    const myToken = ++tokenRef.current;
    setStatus('checking');
    setResult(null);

    validateWasteImage(file)
      .then((res) => {
        if (myToken !== tokenRef.current) return; // a newer photo replaced this one
        setResult(res);
        if (res.valid) setStatus('valid');
        else if (res.category === 'uncertain') setStatus('uncertain');
        else if (res.category === 'unavailable') setStatus('error');
        else setStatus('invalid');
      })
      .catch((err) => {
        if (myToken !== tokenRef.current) return;
        console.error('Unexpected image validation error:', err);
        setStatus('error');
        setResult({
          valid: false,
          category: 'unavailable',
          reason: 'Something went wrong while checking the image. Please try again.',
          confidence: 0,
          topGuesses: [],
          previewDataUrl: null
        });
      });
  }, []);

  const selectFile = useCallback(
    (file) => {
      if (!file) return;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(file);
      fileRef.current = file;
      setPreviewUrl(previewUrlRef.current);
      runCheck(file);
    },
    [runCheck]
  );

  /** Re-run the check on the same photo (used by the "Try again" button). */
  const retry = useCallback(() => {
    if (fileRef.current) runCheck(fileRef.current);
  }, [runCheck]);

  /** Remove the photo completely. */
  const reset = useCallback(() => {
    tokenRef.current += 1; // ignore any check still running
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    fileRef.current = null;
    setStatus('idle');
    setResult(null);
    setPreviewUrl(null);
  }, []);

  return { status, result, previewUrl, selectFile, retry, reset, isBusy: status === 'checking' };
}
