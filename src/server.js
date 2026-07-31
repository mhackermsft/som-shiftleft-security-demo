// State of Michigan Developer Days - Shift-Left Security demo application.
//
// Deliberately tiny. It exists to be threat-modelled, deployed to Azure App
// Service, and then attacked by a scanner in the pipeline.
//
// THE ONE SWITCH THAT MATTERS
//
// `vulnerable` is false on main and true on the feature/reflected-input branch.
// When it is false the app HTML-encodes user input and sets four browser
// defence headers. When it is true it does neither, which is precisely the pair
// of STRIDE threats the threat model selected: tampering (reflected input) and
// information disclosure (missing browser defences).
//
// WHY THE PAGE IS STYLED
//
// The styling is not decoration. This page appears in customer-facing demo
// recordings and on a projector in a room, so an unstyled serif page on white
// reads as "something is broken" and distracts from the actual point. The CSS
// is inline in a <style> element rather than a separate file because the
// Content-Security-Policy below restricts style-src to 'self', and because one
// file is easier to reason about when the whole app is the demo.

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
<<<<<<< HEAD
const vulnerable = true;
=======

// FLIPPED ON THE VULNERABLE BRANCH. Do not "tidy" this into an env var: the
// point of the demo is that a reviewer sees a one-line source change in a diff.
const vulnerable = true;

// Express advertises itself in a response header by default. That is a small
// information disclosure and ZAP reports it, so it goes regardless of branch.
>>>>>>> main
app.disable('x-powered-by');

if (!vulnerable) {
  app.use((req, res, next) => {
    // The four headers the threat model promised, plus no-store so a shared
    // browser on a kiosk does not keep the page.
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; frame-ancestors 'none'; script-src 'self'; "
      + "style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; "
      + "base-uri 'self'; form-action 'self'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
}

const STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0d1117 0%, #161b33 55%, #1b2440 100%);
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #e6edf3;
  }
  .card {
    width: min(680px, 92vw);
    background: rgba(13, 17, 23, .72);
    border: 1px solid #30363d; border-radius: 14px;
    padding: 44px 48px;
    box-shadow: 0 18px 60px rgba(0,0,0,.45);
  }
  .eyebrow {
    font-size: 12px; letter-spacing: .2em; text-transform: uppercase;
    color: #7d8bb0; margin-bottom: 14px;
  }
  h1 { margin: 0 0 6px; font-size: 40px; line-height: 1.15; color: #fff; }
  .sub { color: #a9b6cf; font-size: 16px; margin-bottom: 28px; }
  form { display: flex; gap: 10px; margin-bottom: 26px; }
  input {
    flex: 1; padding: 12px 14px; font-size: 15px;
    background: #0d1117; color: #e6edf3;
    border: 1px solid #30363d; border-radius: 8px;
  }
  button {
    padding: 12px 22px; font-size: 15px; font-weight: 600; cursor: pointer;
    background: #2f81f7; color: #fff; border: 0; border-radius: 8px;
  }
  .meta {
    display: grid; grid-template-columns: auto 1fr; gap: 8px 16px;
    font-size: 14px; color: #a9b6cf;
    border-top: 1px solid #30363d; padding-top: 22px;
  }
  .meta b { color: #7d8bb0; font-weight: 600; }
  .ok { color: #3fb950; font-weight: 600; }
  .bad { color: #f85149; font-weight: 600; }
`;

function page(nameHtml, state) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shift-Left Security demo</title>
<style>${STYLE}</style>
</head><body>
  <main class="card">
    <div class="eyebrow">State of Michigan Developer Days 2026</div>
    <h1>Hello ${nameHtml}</h1>
    <div class="sub">A sample web application running on Azure App Service.</div>
    <form>
      <input name="name" placeholder="Type a name and submit" aria-label="Your name">
      <button type="submit">Greet</button>
    </form>
    <div class="meta">
      <b>Hosting</b><span>Azure App Service &middot; Linux &middot; Node</span>
      <b>Transport</b><span>HTTPS only, TLS 1.2 minimum</span>
      <b>Output encoding</b><span class="${state.encoded ? 'ok' : 'bad'}">${state.encoded ? 'on' : 'OFF'}</span>
      <b>Browser defences</b><span class="${state.headers ? 'ok' : 'bad'}">${state.headers ? 'on' : 'OFF'}</span>
    </div>
  </main>
</body></html>`;
}

app.get('/', (req, res) => {
  const name = req.query.name || 'Michigan developer';
  const state = { encoded: !vulnerable, headers: !vulnerable };
  if (vulnerable) {
    // Reflected straight into the page. This is the bug.
    res.type('html').send(page(name, state));
    return;
  }
  res.type('html').send(page(escapeHtml(name), state));
});

app.get('/health', (req, res) => res.json({ ok: true, vulnerable }));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

app.listen(port, () => console.log(`listening on ${port}, vulnerable=${vulnerable}`));


