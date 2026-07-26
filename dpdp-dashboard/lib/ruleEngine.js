const KNOWN_FOREIGN_TRACKERS = ['kndctr_', 'amcv_', 'amcvs_', '_ga', '_gid', 'hubspot', 'adobe'];
const KNOWN_CONSENT_TOOLS = ['_pandectes_gdpr', 'onetrust', 'cookieyes', 'cookiebot'];

function checkRules(scan) {
  const violations = [];

  if (scan.noticeSignals.length === 0) {
    violations.push({ rule: 'Rule 3, Sec 4-5 - Notice & Consent', severity: 'fail', detail: 'No privacy policy / consent notice link found on page' });
  } else {
    violations.push({ rule: 'Rule 3, Sec 4-5 - Notice & Consent', severity: 'pass', detail: `Notice link(s) found: ${scan.noticeSignals.map(l => l.text).join(', ')}` });
  }

  const consentTool = scan.cookies.find(c => KNOWN_CONSENT_TOOLS.some(t => c.name.toLowerCase().includes(t)));
  if (consentTool) {
    violations.push({ rule: 'Rule 4 - Consent Manager', severity: 'flag', detail: `GDPR-style consent cookie (${consentTool.name}) found — not a registered DPDP Consent Manager` });
  } else {
    violations.push({ rule: 'Rule 4 - Consent Manager', severity: 'fail', detail: 'No consent management tool detected at all' });
  }

  if (!scan.isHttps) {
    violations.push({ rule: 'Rule 6 - Security Safeguards', severity: 'fail', detail: 'Site not served over HTTPS' });
  } else {
    violations.push({ rule: 'Rule 6 - Security Safeguards', severity: 'pass', detail: 'HTTPS enforced' });
  }

  if (scan.rightsSignals.length === 0) {
    violations.push({ rule: 'Rule 8 - Retention & Erasure', severity: 'fail', detail: 'No "delete my data" or erasure-request mechanism found' });
  } else {
    violations.push({ rule: 'Rule 8 - Retention & Erasure', severity: 'pass', detail: `Erasure signal(s) found: ${scan.rightsSignals.map(l => l.text).join(', ')}` });
  }

  if (scan.rightsSignals.length === 0) {
    violations.push({ rule: 'Rule 14 - Data Principal Rights', severity: 'fail', detail: 'No rights-request contact/form found on site' });
  } else {
    violations.push({ rule: 'Rule 14 - Data Principal Rights', severity: 'pass', detail: 'Rights-request mechanism appears present (same signal as Rule 8 — verify manually it covers access/correction, not just deletion)' });
  }

  if (scan.isKidOriented) {
    if (scan.hasAgeGate) {
      violations.push({ rule: 'Rule 10 - Children\'s Data', severity: 'pass', detail: 'Site appears kid-oriented; age-verification/parental-consent signal detected' });
    } else {
      violations.push({ rule: 'Rule 10 - Children\'s Data', severity: 'fail', detail: 'Site appears kid-oriented (content/keywords suggest minors as audience) but no age-gate or parental-consent mechanism detected — DigiLocker-based verifiable parental consent required, no tracking/profiling/targeted ads to children' });
    }
  } else {
    violations.push({ rule: 'Rule 10 - Children\'s Data', severity: 'pass', detail: 'Site does not appear kid-oriented — rule likely not applicable (verify manually if uncertain)' });
  }

  const foreignCookies = scan.cookies.filter(c => KNOWN_FOREIGN_TRACKERS.some(t => c.name.toLowerCase().includes(t)));
  if (foreignCookies.length) {
    violations.push({ rule: 'Rule 15 - Cross-Border Transfer', severity: 'flag', detail: `Foreign-hosted trackers detected: ${foreignCookies.map(c => c.name).join(', ')} — verify compliance, not automatic violation (blocklist model, not GDPR whitelist)` });
  } else {
    violations.push({ rule: 'Rule 15 - Cross-Border Transfer', severity: 'pass', detail: 'No known foreign-hosted trackers detected' });
  }

  return violations;
}

module.exports = { checkRules };
