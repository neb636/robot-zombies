import { renderVariation, hitTest } from './renderer.js';

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  catalog: null,          // Catalog from /api/metadata
  variations: [],         // LayoutVariation[]
  activeVariationIdx: 0,
  selectedObjectId: null,
  dragState: null,        // { objectId, startMouseX, startMouseY, origObjX, origObjY }
  pendingAdd: null,       // AssetEntry awaiting placement click on canvas
  lastPrompt: '',
};

// ── DOM refs ──────────────────────────────────────────────────────────────────

const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const generateSpinner = document.getElementById('generate-spinner');
const tabsContainer = document.getElementById('variation-tabs');
const canvas = document.getElementById('main-canvas');
const canvasPlaceholder = document.getElementById('canvas-placeholder');
const paletteGrid = document.getElementById('palette-grid');
const paletteFilter = document.getElementById('palette-filter');
const paletteSearch = document.getElementById('palette-search');
const selectedPanel = document.getElementById('selected-panel');
const selectedLabel = document.getElementById('selected-label');
const selectedX = document.getElementById('selected-x');
const selectedY = document.getElementById('selected-y');
const selectedPath = document.getElementById('selected-path');
const deleteBtn = document.getElementById('delete-btn');
const exportBtn = document.getElementById('export-btn');
const statusBar = document.getElementById('status-bar');
const warningsPanel = document.getElementById('warnings-panel');

// ── Render ────────────────────────────────────────────────────────────────────

function getActiveVariation() {
  return state.variations[state.activeVariationIdx] ?? null;
}

function scheduleRender() {
  requestAnimationFrame(() => {
    const variation = getActiveVariation();
    if (!variation) return;
    renderVariation(canvas, variation, state.selectedObjectId, scheduleRender);
  });
}

function setStatus(msg, type = 'info') {
  statusBar.textContent = msg;
  statusBar.className = `status-bar status-${type}`;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function buildTabs() {
  tabsContainer.innerHTML = '';
  state.variations.forEach((v, i) => {
    const tab = document.createElement('button');
    tab.className = 'tab-btn' + (i === state.activeVariationIdx ? ' active' : '');
    tab.textContent = v.name;
    tab.title = v.description;
    tab.addEventListener('click', () => {
      state.activeVariationIdx = i;
      state.selectedObjectId = null;
      buildTabs();
      updateSelectedPanel();
      scheduleRender();
    });
    tabsContainer.appendChild(tab);
  });
}

// ── Palette ───────────────────────────────────────────────────────────────────

function buildPalette() {
  if (!state.catalog) return;

  const filterVal = paletteFilter.value;
  const searchVal = paletteSearch.value.toLowerCase();

  paletteGrid.innerHTML = '';

  for (const [, group] of Object.entries(state.catalog.groups)) {
    for (const asset of group.assets) {
      if (filterVal !== 'all' && asset.type !== filterVal) continue;
      if (searchVal && !asset.path.toLowerCase().includes(searchVal) && !group.label.toLowerCase().includes(searchVal)) continue;

      const item = document.createElement('div');
      item.className = 'palette-item' + (state.pendingAdd?.path === asset.path ? ' pending' : '');
      item.title = `${asset.path}\n${asset.type} | ${asset.w}×${asset.h}`;

      const img = document.createElement('img');
      img.src = '/assets/' + asset.path.replace('extracted-assets/', '');
      img.width = 48;
      img.height = 48;
      img.style.objectFit = 'contain';

      item.appendChild(img);
      item.addEventListener('click', () => {
        state.pendingAdd = asset;
        state.selectedObjectId = null;
        updateSelectedPanel();
        buildPalette();
        setStatus(`Click on the canvas to place: ${asset.path.split('/').pop()}`, 'info');
      });

      paletteGrid.appendChild(item);
    }
  }
}

// ── Selected object panel ─────────────────────────────────────────────────────

function updateSelectedPanel() {
  const variation = getActiveVariation();
  if (!variation || !state.selectedObjectId) {
    selectedPanel.style.display = 'none';
    return;
  }

  const obj = variation.objects.find((o) => o.id === state.selectedObjectId);
  if (!obj) { selectedPanel.style.display = 'none'; return; }

  selectedPanel.style.display = 'block';
  selectedLabel.value = obj.label ?? '';
  selectedX.value = String(Math.round(obj.x));
  selectedY.value = String(Math.round(obj.y));
  selectedPath.textContent = obj.assetPath.split('/').slice(-2).join('/');
  selectedPath.title = obj.assetPath;
}

function applySelectedEdits() {
  const variation = getActiveVariation();
  if (!variation || !state.selectedObjectId) return;
  const obj = variation.objects.find((o) => o.id === state.selectedObjectId);
  if (!obj) return;

  const newX = parseInt(selectedX.value, 10);
  const newY = parseInt(selectedY.value, 10);
  if (!isNaN(newX)) obj.x = newX;
  if (!isNaN(newY)) obj.y = newY;
  obj.label = selectedLabel.value || undefined;

  scheduleRender();
}

// ── Canvas interaction ────────────────────────────────────────────────────────

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const variation = getActiveVariation();
  if (!variation) return;

  const { x, y } = getCanvasCoords(e);

  // Pending placement
  if (state.pendingAdd) {
    const asset = state.pendingAdd;
    const newObj = {
      id: `obj-${Date.now()}`,
      assetPath: asset.path,
      x: Math.round(x - asset.w / 2),
      y: Math.round(y - asset.h / 2),
      w: asset.w,
      h: asset.h,
      layer: asset.type === 'tile' || asset.type === 'background' ? 'floor' : 'object',
      label: undefined,
    };
    variation.objects.push(newObj);
    state.pendingAdd = null;
    state.selectedObjectId = newObj.id;
    buildPalette();
    updateSelectedPanel();
    scheduleRender();
    setStatus(`Placed ${asset.path.split('/').pop()}`, 'success');
    return;
  }

  const hitId = hitTest(variation, x, y);
  state.selectedObjectId = hitId;
  updateSelectedPanel();
  scheduleRender();

  if (hitId) {
    const obj = variation.objects.find((o) => o.id === hitId);
    if (obj) {
      state.dragState = {
        objectId: hitId,
        startMouseX: x,
        startMouseY: y,
        origObjX: obj.x,
        origObjY: obj.y,
      };
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!state.dragState) return;
  const variation = getActiveVariation();
  if (!variation) return;

  const { x, y } = getCanvasCoords(e);
  const obj = variation.objects.find((o) => o.id === state.dragState.objectId);
  if (!obj) return;

  obj.x = Math.round(state.dragState.origObjX + (x - state.dragState.startMouseX));
  obj.y = Math.round(state.dragState.origObjY + (y - state.dragState.startMouseY));
  updateSelectedPanel();
  scheduleRender();
});

canvas.addEventListener('mouseup', () => {
  state.dragState = null;
});

canvas.addEventListener('mouseleave', () => {
  state.dragState = null;
});

// ── Keyboard ──────────────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.target === promptInput || e.target === selectedLabel || e.target === selectedX || e.target === selectedY) return;

  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedObjectId) {
    const variation = getActiveVariation();
    if (!variation) return;
    variation.objects = variation.objects.filter((o) => o.id !== state.selectedObjectId);
    state.selectedObjectId = null;
    updateSelectedPanel();
    scheduleRender();
    e.preventDefault();
  }

  if (e.key === 'Escape') {
    state.pendingAdd = null;
    buildPalette();
    setStatus('', 'info');
  }
});

// ── API calls ─────────────────────────────────────────────────────────────────

async function loadCatalog() {
  try {
    const res = await fetch('/api/metadata');
    state.catalog = await res.json();
    buildPalette();
  } catch (err) {
    setStatus('Failed to load asset catalog: ' + err.message, 'error');
  }
}

async function generate() {
  const prompt = promptInput.value.trim();
  if (!prompt) { setStatus('Enter a room description first', 'error'); return; }

  state.lastPrompt = prompt;
  generateBtn.disabled = true;
  generateSpinner.style.display = 'inline';
  setStatus('Asking Claude to design your level...', 'info');
  warningsPanel.style.display = 'none';

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus('Error: ' + (data.error ?? res.statusText), 'error');
      return;
    }

    state.variations = data.variations;
    state.activeVariationIdx = 0;
    state.selectedObjectId = null;

    // Show canvas, hide placeholder
    canvasPlaceholder.style.display = 'none';
    canvas.style.display = 'block';

    buildTabs();
    updateSelectedPanel();
    scheduleRender();

    if (data.warnings?.length > 0) {
      warningsPanel.style.display = 'block';
      warningsPanel.textContent = 'Warnings: ' + data.warnings.join(' | ');
    }

    setStatus(`Generated ${state.variations.length} variations. Select, drag, or add objects from the palette.`, 'success');
  } catch (err) {
    setStatus('Request failed: ' + err.message, 'error');
  } finally {
    generateBtn.disabled = false;
    generateSpinner.style.display = 'none';
  }
}

async function exportLayout() {
  const variation = getActiveVariation();
  if (!variation) { setStatus('Nothing to export', 'error'); return; }

  try {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variation, promptUsed: state.lastPrompt }),
    });

    const layout = await res.json();
    if (!res.ok) { setStatus('Export error: ' + (layout.error ?? res.statusText), 'error'); return; }

    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Exported level JSON', 'success');
  } catch (err) {
    setStatus('Export failed: ' + err.message, 'error');
  }
}

// ── Event wiring ──────────────────────────────────────────────────────────────

generateBtn.addEventListener('click', generate);
promptInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } });
exportBtn.addEventListener('click', exportLayout);
deleteBtn.addEventListener('click', () => {
  if (!state.selectedObjectId) return;
  const variation = getActiveVariation();
  if (!variation) return;
  variation.objects = variation.objects.filter((o) => o.id !== state.selectedObjectId);
  state.selectedObjectId = null;
  updateSelectedPanel();
  scheduleRender();
});

paletteFilter.addEventListener('change', buildPalette);
paletteSearch.addEventListener('input', buildPalette);

selectedLabel.addEventListener('change', applySelectedEdits);
selectedX.addEventListener('change', applySelectedEdits);
selectedY.addEventListener('change', applySelectedEdits);

// ── Init ──────────────────────────────────────────────────────────────────────

loadCatalog();
