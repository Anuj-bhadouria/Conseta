(function () {
  var scriptTag = document.currentScript;
  var clientKey = scriptTag.getAttribute('data-client-id');
  if (!clientKey) {
    console.error('DPDP widget: data-client-id missing on script tag');
    return;
  }

  var STORAGE_KEY = 'dpdp_consent_' + clientKey;
  var API_BASE = new URL(scriptTag.src).origin;

  function getStoredConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeConsent(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch (e) {}
  }

  // The actual compliance mechanism: non-essential scripts must be
  // written on the client's page as:
  //   <script type="text/plain" data-consent-src="https://tracker.js"></script>
  // Browsers do not execute type="text/plain" scripts, so trackers
  // stay inert until the visitor consents. This function converts
  // them into real, executing scripts.
  function unblockTrackers() {
    var blocked = document.querySelectorAll('script[type="text/plain"][data-consent-src]');
    blocked.forEach(function (oldScript) {
      var newScript = document.createElement('script');
      newScript.src = oldScript.getAttribute('data-consent-src');
      Array.from(oldScript.attributes).forEach(function (attr) {
        if (attr.name !== 'type' && attr.name !== 'data-consent-src') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  function logConsent(choice) {
    fetch(API_BASE + '/api/consent-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_key: clientKey, choice: choice })
    }).catch(function (err) {
      console.error('DPDP widget: consent log failed', err);
    });
  }

  function showBanner() {
    var banner = document.createElement('div');
    banner.setAttribute('id', 'dpdp-consent-banner');
    banner.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:999999;' +
      'background:#1a1a1a;color:#fff;padding:16px 20px;' +
      'font-family:sans-serif;font-size:14px;line-height:1.5;' +
      'display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;';

    var text = document.createElement('span');
    text.style.flex = '1';
    text.style.minWidth = '250px';
    text.innerText = 'This site uses cookies and similar technologies to collect personal data, as described in our privacy policy. You can accept or reject non-essential data collection.';

    var btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:8px;';

    var rejectBtn = document.createElement('button');
    rejectBtn.innerText = 'Reject';
    rejectBtn.style.cssText = 'padding:8px 16px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;';

    var acceptBtn = document.createElement('button');
    acceptBtn.innerText = 'Accept';
    acceptBtn.style.cssText = 'padding:8px 16px;background:#2e7d32;color:#fff;border:none;border-radius:4px;cursor:pointer;';

    function handleChoice(choice) {
      storeConsent(choice);
      logConsent(choice);
      if (choice === 'accept') {
        unblockTrackers();
      }
      banner.remove();
    }

    acceptBtn.onclick = function () { handleChoice('accept'); };
    rejectBtn.onclick = function () { handleChoice('reject'); };

    btnWrap.appendChild(rejectBtn);
    btnWrap.appendChild(acceptBtn);
    banner.appendChild(text);
    banner.appendChild(btnWrap);
    document.body.appendChild(banner);
  }

  function init() {
    var existing = getStoredConsent();
    if (existing === 'accept') {
      unblockTrackers();
    } else if (existing === null) {
      showBanner();
    }
    // if existing === 'reject', trackers stay blocked, no banner shown again
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
