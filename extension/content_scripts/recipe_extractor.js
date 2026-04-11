// Supperware recipe extractor — injected on demand by popup.js
// Returns extraction result via executeScript return value.

(function extractRecipe() {
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
          title: recipe.name || null,
          image: extractImage(recipe.image),
          json_ld: recipe,
          html: null,
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
    title: document.title || null,
    image: null,
    json_ld: null,
    html: document.documentElement.outerHTML,
  };
})();

function findRecipeNode(data) {
  if (!data) return null;
  if (data['@graph']) {
    return data['@graph'].find(n => normalizeType(n['@type']) === 'recipe') ?? null;
  }
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

function extractImage(image) {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return extractImage(image[0]);
  if (image.url) return image.url;
  return null;
}
