// Supperware recipe extractor content script
// Runs on every page. When the popup sends an "extract" message,
// this script pulls recipe data from the live DOM.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'extract') return;

  const result = extractRecipe();
  sendResponse(result);
});

function extractRecipe() {
  // Priority 1: JSON-LD
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const recipe = findRecipeNode(data);
      if (recipe) {
        return {
          method: 'json_ld',
          url: location.href,
          json_ld: recipe,
          html: null, // only send HTML if JSON-LD not found
        };
      }
    } catch (_e) {
      // malformed JSON-LD — skip
    }
  }

  // Fallback: send full HTML for server-side parsing
  return {
    method: 'html',
    url: location.href,
    json_ld: null,
    html: document.documentElement.outerHTML,
  };
}

function findRecipeNode(data) {
  if (!data) return null;
  // Handle @graph arrays
  if (data['@graph']) {
    return data['@graph'].find(n => normalizeType(n['@type']) === 'recipe') ?? null;
  }
  // Handle arrays of LD blocks
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (normalizeType(data['@type']) === 'recipe') return data;
  return null;
}

function normalizeType(type) {
  if (!type) return '';
  const t = Array.isArray(type) ? type[0] : type;
  return t.replace(/^https?:\/\/schema\.org\//, '').toLowerCase();
}
