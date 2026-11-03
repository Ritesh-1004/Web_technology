// imageValidator.js
//
// Image validation for CleanCity, in TWO separate parts:
//
//   PART 1 - FILE validation  (validateImageFile)
//     Is this a real, readable, reasonably sized JPEG / PNG / WebP?
//     It looks at the file's first bytes and tries to decode it.
//     It says NOTHING about what the picture shows.
//
//   PART 2 - CONTENT validation  (classifyContent + decideFromScores)
//     Does the picture actually show garbage?
//     This uses a real AI image model: CLIP "zero-shot" classification
//     (Xenova/clip-vit-base-patch32 via transformers.js), running in the
//     browser. We give it text descriptions ("a pile of garbage", "a selfie
//     of a person", ...) and it scores how well the picture matches each.
//
// Filenames, extensions and MIME types are NEVER used as evidence of garbage.
//
// SPEED: the model is preloaded in the background when the Report page opens,
// the text descriptions are encoded ONCE and cached, and each photo is shrunk
// to CLIP's 224 px input size, so a check only runs the (quantized) vision model.
//
// FAIL-CLOSED: if the model cannot be loaded (for example, no internet on the
// first use) the image is NOT accepted. The user sees "Try again".

// transformers.js is loaded at runtime from a CDN, so it is not an npm
// dependency. The model files (roughly 100-150 MB) are downloaded from
// huggingface.co on the first check and then cached by the browser.
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
const MODEL_ID = 'Xenova/clip-vit-base-patch32';
const MODEL_LOAD_TIMEOUT_MS = 180000;
const CLASSIFY_TIMEOUT_MS = 20000;
const INPUT_SIZE = 224; // CLIP input size; bigger photos are shrunk to this first
const LOGIT_SCALE = 100; // CLIP's learned temperature

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MIN_DIMENSION = 200; // pixels

export const INVALID_IMAGE_MESSAGE =
  'Invalid image. Please upload a clear photo showing garbage or a waste-related issue.';

/* ------------------------------------------------------------------ */
/* PART 1: FILE VALIDATION (is it a genuine, readable image file?)     */
/* ------------------------------------------------------------------ */

// Read the first bytes of the file and compare them with the known
// "signature" of each image format. This catches a text file or PDF that
// was simply renamed to photo.jpg.
async function detectImageFormat(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const startsWith = (sig, offset = 0) => sig.every((b, i) => bytes[offset + i] === b);

  if (startsWith([0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  // WebP files start with "RIFF", then 4 size bytes, then "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  return null;
}

function decodeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('corrupted'));
    };
    img.src = url;
  });
}

/**
 * Checks size, real file format, and that the browser can decode it.
 * Returns { ok: true, img, url } or { ok: false, reason }.
 * The caller must revoke `url` when finished.
 */
export async function validateImageFile(file) {
  if (!file) return { ok: false, reason: 'No file was selected.' };
  if (file.size === 0) return { ok: false, reason: 'The file is empty.' };
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: 'The file is larger than 10 MB. Please choose a smaller photo.' };
  }

  const format = await detectImageFormat(file);
  if (!format) {
    return { ok: false, reason: 'This is not a JPG, PNG or WebP image file.' };
  }

  let decoded;
  try {
    decoded = await decodeImage(file);
  } catch (err) {
    return { ok: false, reason: 'The image file is corrupted or cannot be read.' };
  }

  const { img, url } = decoded;
  if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
    URL.revokeObjectURL(url);
    return { ok: false, reason: 'The image is too small. Please use a photo that is at least 200 x 200 pixels.' };
  }

  return { ok: true, img, url };
}

/* ------------------------------------------------------------------ */
/* PART 2: CONTENT VALIDATION (does the picture show garbage?)         */
/* ------------------------------------------------------------------ */

// Text descriptions given to the CLIP model. The model picks which
// description best matches the photo.
const GARBAGE_LABELS = [
  'a pile of garbage and trash on the ground',
  'litter and plastic waste scattered on a street',
  'an overflowing garbage bin with trash around it',
  'dumped rubbish and waste at a roadside',
  'rotting food waste and garbage',
  'discarded paper, plastic bottles and bags lying as trash'
];

const NOT_GARBAGE_LABELS = [
  'a selfie or portrait of a person',
  'a group of people',
  'a pet animal such as a cat or a dog',
  'a car, bike or other vehicle',
  'a clean street or road',
  'natural scenery, trees, sky or a landscape',
  'a building or a house',
  'a document, a page of text or a screenshot',
  'a computer or phone screen',
  'a plate of food or a meal',
  'an indoor room or furniture',
  'a single everyday object on a table',
  'a clean empty dustbin',
  'a plain wall or floor'
];

// Decision thresholds. These are starting values and have NOT been tuned on
// a large set of real photos. Try your own garbage / non-garbage photos and
// adjust them if needed.
const ACCEPT_THRESHOLD = 0.6;    // garbage share at or above this -> accepted
const UNCERTAIN_THRESHOLD = 0.35; // between the two -> "try again"

let enginePromise = null;

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function normalizeRows(data, rows, dim) {
  const out = new Float32Array(data.length);
  for (let r = 0; r < rows; r++) {
    let norm = 0;
    for (let i = 0; i < dim; i++) norm += data[r * dim + i] ** 2;
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < dim; i++) out[r * dim + i] = data[r * dim + i] / norm;
  }
  return out;
}

// Loads the model ONCE, encodes all label sentences ONCE, and keeps both.
// Later photos only need the vision model.
function loadEngine() {
  if (enginePromise) return enginePromise;
  enginePromise = withTimeout(
    (async () => {
      const t = await import(/* @vite-ignore */ TRANSFORMERS_URL);
      t.env.allowLocalModels = false;
      try {
        // Multi-threaded WASM only when the page allows it; otherwise 1 thread
        // (works on every host without special server headers).
        const threads = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated
          ? Math.min(4, navigator.hardwareConcurrency || 2)
          : 1;
        t.env.backends.onnx.wasm.numThreads = threads;
      } catch (err) {
        /* setting is optional */
      }

      const labels = [...GARBAGE_LABELS, ...NOT_GARBAGE_LABELS];

      // Download text + vision models in parallel
      const [tokenizer, textModel, processor, visionModel] = await Promise.all([
        t.AutoTokenizer.from_pretrained(MODEL_ID),
        t.CLIPTextModelWithProjection.from_pretrained(MODEL_ID),
        t.AutoProcessor.from_pretrained(MODEL_ID),
        t.CLIPVisionModelWithProjection.from_pretrained(MODEL_ID)
      ]);

      // Encode the label sentences one time and cache them
      const textInputs = tokenizer(labels.map((l) => `a photo of ${l}`), {
        padding: true,
        truncation: true
      });
      const { text_embeds } = await textModel(textInputs);
      const dim = text_embeds.dims[1];
      const textEmbeds = normalizeRows(text_embeds.data, labels.length, dim);

      return { RawImage: t.RawImage, processor, visionModel, textEmbeds, labels, dim };
    })(),
    MODEL_LOAD_TIMEOUT_MS,
    'The detection model took too long to load.'
  ).catch((err) => {
    enginePromise = null; // allow "Try again" to start a fresh download
    throw err;
  });
  return enginePromise;
}

/**
 * Start downloading / warming up the model in the background (e.g. when the
 * Report page opens) so the first photo check is fast. Safe to call many times.
 */
export function preloadModel() {
  try {
    const conn = navigator.connection;
    if (conn && conn.saveData) return; // respect Data Saver
  } catch (err) {
    /* ignore */
  }
  loadEngine().catch(() => {
    /* a real error is shown later, when the user actually uploads a photo */
  });
}

/**
 * Pure decision function (easy to test and explain).
 * `scores` is the model output: [{ label, score }], where all scores add up to 1.
 */
export function decideFromScores(scores) {
  if (
    !Array.isArray(scores) ||
    scores.length === 0 ||
    scores.some((s) => !s || typeof s.score !== 'number' || Number.isNaN(s.score))
  ) {
    throw new Error('The model returned an unreadable result.');
  }

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const garbageShare = sorted
    .filter((s) => GARBAGE_LABELS.includes(s.label))
    .reduce((sum, s) => sum + s.score, 0);
  const topIsGarbage = GARBAGE_LABELS.includes(sorted[0].label);

  const topGuesses = sorted.slice(0, 3).map((s) => ({
    label: s.label,
    percent: Math.round(s.score * 100)
  }));
  const confidence = Math.round(garbageShare * 100) / 100;

  if (garbageShare >= ACCEPT_THRESHOLD && topIsGarbage) {
    return { category: 'garbage', confidence, topGuesses };
  }
  if (garbageShare >= UNCERTAIN_THRESHOLD) {
    return { category: 'uncertain', confidence, topGuesses };
  }
  return { category: 'not-garbage', confidence, topGuesses };
}

// Shrinks the photo to CLIP's input size (short side 224 px). Decoding and
// resizing a 10 MB photo inside the model is the slow part, so we do it cheaply
// on a canvas first.
function toSmallBlob(img) {
  const scale = INPUT_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
  const w = Math.max(INPUT_SIZE, Math.round(img.naturalWidth * Math.min(1, scale)));
  const h = Math.max(INPUT_SIZE, Math.round(img.naturalHeight * Math.min(1, scale)));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', 0.92);
  });
}

/** Runs the CLIP vision model on the picture and returns the decision. */
async function classifyContent(img) {
  const engine = await loadEngine();
  const blob = await toSmallBlob(img);

  const output = await withTimeout(
    (async () => {
      const image = await engine.RawImage.fromBlob(blob);
      const imageInputs = await engine.processor(image);
      const { image_embeds } = await engine.visionModel(imageInputs);
      const { dim, labels, textEmbeds } = engine;
      const imgVec = normalizeRows(image_embeds.data, 1, dim);

      // cosine similarity x temperature, then softmax -> probabilities
      const logits = labels.map((_, i) => {
        let dot = 0;
        for (let k = 0; k < dim; k++) dot += imgVec[k] * textEmbeds[i * dim + k];
        return dot * LOGIT_SCALE;
      });
      const max = Math.max(...logits);
      const exps = logits.map((l) => Math.exp(l - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      return labels.map((label, i) => ({ label, score: exps[i] / sum }));
    })(),
    CLASSIFY_TIMEOUT_MS,
    'The image check took too long.'
  );
  return decideFromScores(output);
}

/* ------------------------------------------------------------------ */
/* Saving a small copy of the photo                                    */
/* ------------------------------------------------------------------ */

/**
 * Shrinks the photo before it is saved in localStorage (which is small,
 * about 5 MB in total). A 800 px JPEG is usually 50-120 KB.
 */
export function compressImage(img, maxDimension = 800, quality = 0.6) {
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

function result(valid, category, reason, extra = {}) {
  return { valid, category, reason, confidence: 0, topGuesses: [], previewDataUrl: null, ...extra };
}

/**
 * Runs PART 1 then PART 2 on a File.
 * category is one of:
 *   'garbage'      - accepted
 *   'not-garbage'  - a real image, but it does not show garbage
 *   'uncertain'    - the model was not sure
 *   'invalid-file' - failed file validation (Part 1)
 *   'unavailable'  - the model could not run (fail-closed)
 */
export async function validateWasteImage(file) {
  const fileCheck = await validateImageFile(file);
  if (!fileCheck.ok) {
    return result(false, 'invalid-file', `Invalid image. ${fileCheck.reason}`);
  }

  const { img, url } = fileCheck;
  try {
    let decision;
    try {
      decision = await classifyContent(img);
    } catch (err) {
      console.error('Image content check failed:', err);
      return result(
        false,
        'unavailable',
        'The image check could not run. The detection model needs an internet connection the first time it is used. Please check your connection and try again.'
      );
    }

    const base = { confidence: decision.confidence, topGuesses: decision.topGuesses };

    if (decision.category === 'garbage') {
      return result(true, 'garbage', 'The image appears to show garbage or a waste-related issue.', {
        ...base,
        previewDataUrl: compressImage(img)
      });
    }
    if (decision.category === 'uncertain') {
      return result(
        false,
        'uncertain',
        'We could not clearly tell whether this photo shows garbage. Please take a clearer, closer photo of the waste and try again.',
        base
      );
    }
    return result(false, 'not-garbage', INVALID_IMAGE_MESSAGE, base);
  } finally {
    URL.revokeObjectURL(url);
  }
}
