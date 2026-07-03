const axios = require('axios');
const fs = require('fs');
const path = require('path');

const HF_TOKEN = process.env.HF_API_KEY;
const HEADERS_BINARY = {
  Authorization: `Bearer ${HF_TOKEN}`,
  'Content-Type': 'application/octet-stream',
};
const HEADERS_JSON = {
  Authorization: `Bearer ${HF_TOKEN}`,
  'Content-Type': 'application/json',
};

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

/**
 * Check if a file is an image based on extension
 */
function isImage(fileName) {
  return IMAGE_EXTS.includes(path.extname(fileName).toLowerCase());
}

/**
 * Retry wrapper for cold-start 503 errors
 */
async function callWithRetry(fn, retries = 3, delayMs = 25000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      if (status === 503 && i < retries - 1) {
        // Model is loading — wait and retry
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Scene / general classification using ViT
 */
async function detectScene(imagePath) {
  const image = fs.readFileSync(imagePath);
  const res = await callWithRetry(() =>
    axios.post(
      'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
      image,
      { headers: HEADERS_BINARY }
    )
  );
  // Returns [{ label, score }, ...]
  return (res.data || []).slice(0, 5);
}

/**
 * Object detection using DETR
 */
async function detectObjects(imagePath) {
  const image = fs.readFileSync(imagePath);
  const res = await callWithRetry(() =>
    axios.post(
      'https://api-inference.huggingface.co/models/facebook/detr-resnet-50',
      image,
      { headers: HEADERS_BINARY }
    )
  );
  // Returns [{ label, score, box: { xmin, ymin, xmax, ymax } }, ...]
  return (res.data || []).filter(d => d.score > 0.5);
}

/**
 * Full image forensic analysis — runs both models and builds a summary
 */
async function analyzeImage(filePath, fileName) {
  const result = {
    fileName,
    isImage: true,
    sceneLabels: [],
    detectedObjects: [],
    forensicSummary: '',
    riskIndicators: [],
    confidence: 0,
  };

  try {
    // Run both in parallel with a 1s gap to avoid rate limits
    const [scene, objects] = await Promise.all([
      detectScene(filePath).catch(() => []),
      new Promise(r => setTimeout(r, 1000)).then(() =>
        detectObjects(filePath).catch(() => [])
      ),
    ]);

    result.sceneLabels = scene;
    result.detectedObjects = objects;

    // Build forensic summary
    const topScene = scene[0]?.label || 'Unknown scene';
    const objectList = objects.map(o => o.label).join(', ') || 'none detected';
    result.forensicSummary = `Scene classified as "${topScene}" with confidence ${((scene[0]?.score || 0) * 100).toFixed(1)}%. Objects detected: ${objectList}.`;

    // Risk indicators
    const riskLabels = ['weapon', 'gun', 'knife', 'blood', 'fire', 'explosion', 'violence', 'drug', 'money'];
    const allLabels = [
      ...scene.map(s => s.label.toLowerCase()),
      ...objects.map(o => o.label.toLowerCase()),
    ];
    result.riskIndicators = riskLabels.filter(r => allLabels.some(l => l.includes(r)));

    // Confidence = average of top scene score + avg object score
    const sceneConf = scene[0]?.score || 0;
    const objConf = objects.length > 0
      ? objects.reduce((s, o) => s + o.score, 0) / objects.length
      : sceneConf;
    result.confidence = ((sceneConf + objConf) / 2) * 100;

  } catch (err) {
    result.forensicSummary = `Image analysis failed: ${err.message}`;
    result.confidence = 0;
  }

  return result;
}

module.exports = { analyzeImage, isImage };
