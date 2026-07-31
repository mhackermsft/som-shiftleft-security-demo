const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const vulnerable = false;
app.disable('x-powered-by');
if (!vulnerable) {
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
}
app.get('/', (req, res) => {
  const name = req.query.name || 'Michigan developer';
  if (vulnerable) {
    res.send(`<html><body><h1>Hello ${name}</h1><form><input name="name"></form></body></html>`);
    return;
  }
  res.type('html').send(`<html><body><h1>Hello ${escapeHtml(name)}</h1><form><input name="name"></form></body></html>`);
});
app.get('/health', (req, res) => res.json({ ok: true, vulnerable }));
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
app.listen(port, () => console.log(`listening on ${port}, vulnerable=${vulnerable}`));
