// Canvas 2D isometric renderer
// Uses painter's algorithm: floor layer first, then remaining objects sorted by (y + h) ascending

const imageCache = new Map(); // assetPath → HTMLImageElement | 'loading' | 'error'

/**
 * Load an image into the cache. Calls onLoad when ready.
 * @param {string} assetPath - metadata.json key
 * @param {() => void} onLoad - called when image finishes loading
 * @returns {HTMLImageElement | null}
 */
export function getImage(assetPath, onLoad) {
  const cached = imageCache.get(assetPath);
  if (cached instanceof HTMLImageElement) return cached;
  if (cached === 'loading' || cached === 'error') return null;

  imageCache.set(assetPath, 'loading');
  const img = new Image();
  const url = '/assets/' + assetPath.replace('extracted-assets/', '');
  img.src = url;
  img.onload = () => {
    imageCache.set(assetPath, img);
    onLoad();
  };
  img.onerror = () => {
    imageCache.set(assetPath, 'error');
    console.warn('Failed to load image:', url);
  };
  return null;
}

/**
 * Render a LayoutVariation onto a canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} variation - LayoutVariation shaped object
 * @param {string | null} selectedObjectId
 * @param {() => void} onImageLoad - called when any image finishes loading (triggers re-render)
 */
export function renderVariation(canvas, variation, selectedObjectId, onImageLoad) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = variation.canvasWidth;
  canvas.height = variation.canvasHeight;

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!variation.objects || variation.objects.length === 0) {
    ctx.fillStyle = '#4a4a6a';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No objects in this variation', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Build render order: floor layer first, then by (y + h) ascending (painter's algorithm)
  const floors = variation.objects.filter((o) => o.layer === 'floor');
  const others = variation.objects
    .filter((o) => o.layer !== 'floor')
    .sort((a, b) => {
      const aBottom = a.y + (a.h ?? 48);
      const bBottom = b.y + (b.h ?? 48);
      return aBottom - bBottom;
    });

  const renderList = [...floors, ...others];

  for (const obj of renderList) {
    const img = getImage(obj.assetPath, onImageLoad);
    const w = obj.w ?? 48;
    const h = obj.h ?? 48;

    if (img) {
      ctx.drawImage(img, obj.x, obj.y, w, h);
    } else {
      // Placeholder box while image loads
      ctx.fillStyle = obj.layer === 'floor' ? '#2a2a4a' : '#3a3060';
      ctx.fillRect(obj.x, obj.y, w, h);
      ctx.strokeStyle = '#5a5080';
      ctx.lineWidth = 1;
      ctx.strokeRect(obj.x + 0.5, obj.y + 0.5, w - 1, h - 1);
    }

    // Selection highlight
    if (obj.id === selectedObjectId) {
      ctx.strokeStyle = '#7af8ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(obj.x - 1, obj.y - 1, w + 2, h + 2);

      // Corner handles
      const hs = 5;
      ctx.fillStyle = '#7af8ff';
      [[obj.x - 1, obj.y - 1], [obj.x + w - hs + 1, obj.y - 1],
       [obj.x - 1, obj.y + h - hs + 1], [obj.x + w - hs + 1, obj.y + h - hs + 1]
      ].forEach(([hx, hy]) => ctx.fillRect(hx, hy, hs, hs));
    }
  }
}

/**
 * Hit-test: find the topmost object at pixel (px, py).
 * Iterates render order in reverse so topmost-rendered is found first.
 *
 * @param {object} variation
 * @param {number} px
 * @param {number} py
 * @returns {string | null} object id or null
 */
export function hitTest(variation, px, py) {
  if (!variation?.objects) return null;

  const floors = variation.objects.filter((o) => o.layer === 'floor');
  const others = variation.objects
    .filter((o) => o.layer !== 'floor')
    .sort((a, b) => (a.y + (a.h ?? 48)) - (b.y + (b.h ?? 48)));

  const renderList = [...floors, ...others];

  // Reverse to get topmost first
  for (let i = renderList.length - 1; i >= 0; i--) {
    const obj = renderList[i];
    const w = obj.w ?? 48;
    const h = obj.h ?? 48;
    if (px >= obj.x && px <= obj.x + w && py >= obj.y && py <= obj.y + h) {
      return obj.id;
    }
  }
  return null;
}
