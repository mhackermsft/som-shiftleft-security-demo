// State of Michigan Developer Days - Shift-Left Security demo application.
//
// Deliberately tiny. It exists to be threat-modelled, deployed to Azure App
// Service, and then attacked by a scanner in the pipeline.
//
// HOW THE VULNERABLE BRANCH DIFFERS, AND WHY IT LOOKS LIKE THAT
//
// An earlier version of this demo flipped a constant literally named
// `vulnerable` from false to true. That was a bad example and it undermined the
// point being made on stage: any reviewer who saw `const vulnerable = true` in a
// diff would stop the pull request immediately, and almost no real vulnerability
// is switched on by a flag.
//
// The feature/reflected-input branch now makes two changes that are genuinely
// the kind of thing that ships:
//
//   1. `app.use(securityHeaders)` becomes `app.use('/api', securityHeaders)`.
//      Scoping middleware to a path looks like tidying. In Express it means the
//      HTML route silently stops receiving its browser defence headers, because
//      the middleware no longer matches that path. Nothing errors. Nothing logs.
//
//   2. `renderName` stops calling `escapeHtml`. Losing output encoding during a
//      refactor is the single most common way reflected cross-site scripting is
//      introduced in real applications.
//
// Both are small, both read as housekeeping, and neither announces itself.
//
// THE STATUS PANEL IS DERIVED, NOT DECLARED
//
// The page reports whether encoding and browser defences are on. Those two
// values are measured from what the code actually did on the request being
// served - not read from a flag - so the panel cannot claim one thing while the
// application does another.
//
// WHY THE PAGE IS STYLED
//
// The styling is not decoration. This page appears in customer-facing demo
// recordings and on a projector in a room, so an unstyled serif page on white
// reads as "something is broken" and distracts from the actual point.

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Express advertises itself in a response header by default. That is a small
// information disclosure and ZAP reports it, so it goes on every branch.
app.disable('x-powered-by');

// ---------------------------------------------------------------- rendering

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// The single place a user-supplied value becomes page HTML.
function renderName(name) {
  return escapeHtml(name);
}

// ----------------------------------------------------------------- security

function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'none'; script-src 'self'; "
    + "style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; "
    + "base-uri 'self'; form-action 'self'");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cache-Control', 'no-store');
  next();
}

app.use(securityHeaders);

// ------------------------------------------------------------------ the page

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

// Measured, never declared.
//
// `encoded` pushes a known string through the SAME render helper the page uses,
// so it reports the behaviour of the code path actually serving this request.
// `headers` asks the response whether the header was really set. If the
// middleware did not run, it was not.
const ENCODING_PROBE = '<b>probe</b>';

function observedState(res) {
  return {
    encoded: renderName(ENCODING_PROBE) !== ENCODING_PROBE,
    headers: Boolean(res.getHeader('Content-Security-Policy'))
  };
}

// ------------------------------------------------------------------- routes

app.get('/', (req, res) => {
  const name = req.query.name || 'Michigan developer';
  res.type('html').send(page(renderName(name), observedState(res)));
});

app.get('/health', (req, res) => {
  const state = observedState(res);
  res.json({ ok: true, encoded: state.encoded, headers: state.headers });
});

app.listen(port, () => console.log(`listening on ${port}`));
