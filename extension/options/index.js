const DEFAULT_API_BASE = 'https://supperware.sathyasekaran.com';

const tokenInput   = document.getElementById('api-token');
const baseInput    = document.getElementById('api-base');
const saveBtn      = document.getElementById('save-btn');
const savedMsg     = document.getElementById('saved-msg');
const settingsLink = document.getElementById('settings-link');

// Load saved values
chrome.storage.sync.get(['apiToken', 'apiBase'], ({ apiToken, apiBase }) => {
  if (apiToken) tokenInput.value = apiToken;
  baseInput.value = apiBase || DEFAULT_API_BASE;
  updateSettingsLink(apiBase || DEFAULT_API_BASE);
});

saveBtn.addEventListener('click', () => {
  const apiToken = tokenInput.value.trim();
  const apiBase  = baseInput.value.trim() || DEFAULT_API_BASE;

  chrome.storage.sync.set({ apiToken, apiBase }, () => {
    savedMsg.classList.add('visible');
    updateSettingsLink(apiBase);
    setTimeout(() => savedMsg.classList.remove('visible'), 2500);
  });
});

function updateSettingsLink(base) {
  settingsLink.href = `${base}/settings`;
  settingsLink.target = '_blank';
}
