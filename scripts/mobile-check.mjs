/**
 * Mobile-friendliness sweep: horizontal overflow, tap targets, tiny text, viewport meta.
 * Usage: node scripts/mobile-check.mjs [url]
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME =
  process.env.CHROME_PATH ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const URL_TO_CHECK = process.argv[2] || 'http://localhost:4321/';
const VIEWPORTS = [
  { width: 320, height: 568, mobile: true },
  { width: 360, height: 800, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 412, height: 915, mobile: true },
  { width: 768, height: 1024, mobile: true },
  { width: 1440, height: 900, mobile: false },
];

const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9333',
  '--disable-gpu',
  '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

process.on('exit', () => chrome.kill());

let ws;
let id = 0;
const pending = new Map();

function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
    setTimeout(() => {
      if (pending.has(msgId)) {
        pending.delete(msgId);
        reject(new Error(`timeout: ${method}`));
      }
    }, 30000);
  });
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
  return res.result.value;
}

async function main() {
  let target;
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch {
      /* retry */
    }
    await sleep(250);
  }
  if (!target) throw new Error('no chrome target');

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');

  const results = [];

  for (const vp of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.mobile ? 3 : 1,
      mobile: vp.mobile,
    });
    await send('Page.navigate', { url: URL_TO_CHECK });
    await sleep(2500);

    const report = await evaluate(`(() => {
      const doc = document.documentElement;
      const de = document.body;
      const overflow = Math.max(doc.scrollWidth, de.scrollWidth) - doc.clientWidth;
      const overflowing = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1);
        })
        .slice(0, 8)
        .map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''));

      const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || null;

      const textNodes = [...document.querySelectorAll('body *')].filter((el) => {
        if (el.closest('[aria-hidden="true"]')) return false;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        return hasText;
      });
      const tinyText = textNodes
        .map((el) => ({ size: parseFloat(getComputedStyle(el).fontSize), text: el.textContent.trim().slice(0, 40) }))
        .filter((t) => t.size < 12);

      const targets = [...document.querySelectorAll('a, button, input, textarea, summary')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || r.width === 0) return null;
          return {
            w: Math.round(r.width),
            h: Math.round(r.height),
            tag: el.tagName.toLowerCase(),
            cls: typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '',
            text: (el.textContent || el.getAttribute('aria-label') || el.placeholder || '').trim().slice(0, 30),
          };
        })
        .filter(Boolean);
      const smallTargets = targets.filter((t) => t.h < 40);

      const inputs = [...document.querySelectorAll('input, textarea')].map((el) => ({
        font: parseFloat(getComputedStyle(el).fontSize),
        name: el.name,
      }));

      const tapNote = ${JSON.stringify(vp)};

      return {
        url: location.href,
        viewport: tapNote.width,
        overflowPx: overflow,
        overflowing,
        viewportMeta,
        tinyText,
        smallTargets,
        inputs,
        h1: document.querySelectorAll('h1').length,
        title: document.title.length,
        lang: document.documentElement.lang,
      };
    })()`);

    results.push(report);
    console.log(
      `\n=== ${vp.width}px ===\n` +
        ` url: ${report.url}\n overflow: ${report.overflowPx}px\n overflowing: ${
          report.overflowing.length ? report.overflowing.join(', ') : 'none'
        }\n tiny text (<12px): ${report.tinyText.length}\n small targets (<40px): ${
          report.smallTargets.length
        }\n ${report.smallTargets
          .slice(0, 8)
          .map((t) => `   ${t.tag}.${t.cls} [${t.w}x${t.h}] "${t.text}"`)
          .join('\n ')}\n inputs font: ${JSON.stringify(report.inputs.map((i) => i.font))}`,
    );
  }

  const failures = results.filter(
    (r) =>
      r.overflowPx > 0 ||
      r.tinyText.length > 0 ||
      (r.viewport <= 640 && r.smallTargets.length > 0),
  );
  console.log(`\n${failures.length === 0 ? 'PASS' : 'ISSUES'} — ${results.length} viewports checked`);
  chrome.kill();
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  chrome.kill();
  process.exit(2);
});
