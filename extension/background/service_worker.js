// Supperware background service worker (Manifest V3)
// Handles communication between popup and content scripts,
// and API calls to the Supperware backend.

const API_BASE = 'https://api.supperware.app'; // override in options

chrome.runtime.onInstalled.addListener(() => {
  console.log('Supperware extension installed.');
});

// TODO: Phase 3 — implement message passing + API save logic
