const DEFAULT_API_BASE = 'https://supperware.sathyasekaran.com';
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 60; // 90 seconds

const app = document.getElementById('app');

// State management
function setState(state) {
  app.dataset.state = state;
}

function showError(msg) {
  document.getElementById('error-msg').textContent = msg;
  setState('error');
}

// Storage helpers
function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['apiToken', 'apiBase'], ({ apiToken, apiBase }) => {
      resolve({ apiToken, apiBase: apiBase || DEFAULT_API_BASE });
    });
  });
}

// API helper
async function apiRequest(path, { apiToken, apiBase, method = 'GET', body } = {}) {
  const res = await fetch(`${apiBase}/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Token': apiToken,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) throw new Error('Invalid API token. Check your settings.');
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Poll parse job until done or failed
async function pollJob(jobId, settings) {
  setState('polling');
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > POLL_MAX_ATTEMPTS) {
        clearInterval(interval);
        reject(new Error('Timed out waiting for recipe. Check your recipes list.'));
        return;
      }

      try {
        const job = await apiRequest(`/parse_jobs/${jobId}`, settings);
        if (job.status === 'done') {
          clearInterval(interval);
          resolve(job.result_recipe_id);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          reject(new Error(job.error_message || 'Parsing failed.'));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, POLL_INTERVAL_MS);
  });
}

// Show saved state
function showSaved(recipeId, title, apiBase) {
  document.getElementById('saved-title').textContent = title || 'Recipe saved!';
  document.getElementById('open-recipe-link').href = `${apiBase}/recipes/${recipeId}`;
  setState('saved');
}

// Main
(async () => {
  const settings = await getSettings();

  if (!settings.apiToken) {
    setState('setup');
    document.getElementById('open-options-btn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  // Inject extractor into active tab
  setState('detecting');
  let extraction;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content_scripts/recipe_extractor.js'],
    });
    extraction = results[0]?.result;
  } catch (e) {
    showError('Could not access this page. Try the web app instead.');
    return;
  }

  if (!extraction) {
    showError('Could not read page content.');
    return;
  }

  // ── JSON-LD path ──────────────────────────────────────────────────────────
  if (extraction.method === 'json_ld') {
    const titleEl    = document.getElementById('preview-title');
    const imgEl      = document.getElementById('preview-img');
    const placeholder = document.getElementById('preview-img-placeholder');

    titleEl.textContent = extraction.title || extraction.json_ld?.name || 'Recipe found';

    if (extraction.image) {
      imgEl.src = extraction.image;
      imgEl.style.display = 'block';
      placeholder.style.display = 'none';
    }

    setState('ready');

    document.getElementById('save-json-ld-btn').addEventListener('click', async () => {
      setState('saving');
      try {
        const data = await apiRequest('/recipes/parse', {
          ...settings,
          method: 'POST',
          body: { json_ld: extraction.json_ld, url: extraction.url },
        });
        showSaved(data.recipe_id, extraction.title || extraction.json_ld?.name, settings.apiBase);
      } catch (e) {
        showError(e.message);
      }
    });
    return;
  }

  // ── HTML fallback path ────────────────────────────────────────────────────
  if (extraction.method === 'html' && extraction.html) {
    setState('saving');
    try {
      const data = await apiRequest('/recipes/parse', {
        ...settings,
        method: 'POST',
        body: { html: extraction.html, url: extraction.url },
      });
      showSaved(data.recipe_id, extraction.title, settings.apiBase);
    } catch (e) {
      // HTML parsing failed (no structured data) — fall through to text paste
      offerTextPaste(extraction.url, settings);
    }
    return;
  }

  offerTextPaste(extraction?.url, settings);
})();

// ── Text paste state ──────────────────────────────────────────────────────────
function offerTextPaste(url, settings) {
  setState('no-recipe');

  document.getElementById('save-text-btn').addEventListener('click', async () => {
    const text = document.getElementById('paste-textarea').value.trim();
    if (!text) {
      document.getElementById('paste-textarea').focus();
      return;
    }

    setState('saving');
    try {
      const data = await apiRequest('/recipes/parse', {
        ...settings,
        method: 'POST',
        body: { text, url },
      });

      if (data.job_id) {
        try {
          const recipeId = await pollJob(data.job_id, settings);
          showSaved(recipeId, null, settings.apiBase);
        } catch (e) {
          showError(e.message);
        }
      } else if (data.recipe_id) {
        showSaved(data.recipe_id, null, settings.apiBase);
      }
    } catch (e) {
      showError(e.message);
    }
  });
}

// ── Button wiring ─────────────────────────────────────────────────────────────
document.getElementById('close-btn').addEventListener('click', () => window.close());

document.getElementById('retry-btn').addEventListener('click', () => {
  setState('no-recipe');
});
