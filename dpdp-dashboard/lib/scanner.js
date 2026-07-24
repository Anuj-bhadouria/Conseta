import puppeteer from 'puppeteer';

function dedupeForms(forms) {
  const seen = new Set();
  return forms.filter(f => {
    const key = f.action + '|' + f.inputs.join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function scanSite(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    await browser.close();
    throw new Error(`Failed to load ${url}: ${err.message}`);
  }

  const forms = await page.$$eval('form', forms =>
    forms.map(f => ({
      action: f.action,
      inputs: Array.from(f.querySelectorAll('input')).map(i => i.type)
    }))
  );
  const uniqueForms = dedupeForms(forms);

  const links = await page.$$eval('a', as =>
    as.map(a => ({ text: a.innerText.trim(), href: a.href }))
  );

  const RIGHTS_KEYWORDS = ['delete my data', 'delete account', 'your rights', 'data request', 'right to erasure', 'privacy request'];
  const NOTICE_KEYWORDS = ['privacy policy', 'privacy notice', 'consent'];

  const rightsSignals = links.filter(l => RIGHTS_KEYWORDS.some(k => l.text.toLowerCase().includes(k)));
  const noticeSignals = links.filter(l => NOTICE_KEYWORDS.some(k => l.text.toLowerCase().includes(k)));

  const cookies = await page.cookies();
  const isHttps = url.startsWith('https://');

  await browser.close();
  return { forms: uniqueForms, cookies, isHttps, rightsSignals, noticeSignals };
}

export { scanSite };
