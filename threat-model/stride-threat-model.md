# STRIDE threat model, sample web app on Azure

**System.** A public user's browser reaches a Node.js web application running on
**Azure App Service**. In a real system that application would also read and
write a database. Three moving parts is already enough to threat model.

**Trust boundaries.** A trust boundary is any line where data crosses from
somewhere you do not control into somewhere you do. Risk concentrates here.

1. Browser to internet.
2. Internet to the Azure App Service application.
3. Application to database.

## The STRIDE table

STRIDE is a Microsoft Security Development Lifecycle technique: six prompts you
walk deliberately so the awkward questions get asked on purpose. This model was
produced with the **Microsoft Threat Modeling Tool** and is kept here in the
repository, next to the code it describes, so it can be reviewed in a pull
request like anything else.

The last column is the one that matters. A mitigation nobody can verify is a
wish, not a control.

| STRIDE | Threat | Mitigation | Demo proof |
| --- | --- | --- | --- |
| Spoofing | A caller pretends to be another user. | Entra ID sign-in and managed identity between services. | Backlog. |
| Tampering | User input is reflected into the page as HTML. | HTML-encode all output and set a Content-Security-Policy. | **DAST gate fails the build.** |
| Repudiation | No record of who approved a risky change. | Pull requests plus required status checks. | GitHub run history. |
| Information disclosure | Browser defence headers are missing. | Set CSP, X-Frame-Options, X-Content-Type-Options and Permissions-Policy. | **DAST gate fails the build.** |
| Denial of service | Traffic or slow requests exhaust the app. | App Service autoscale, rate limits and timeouts. | Backlog. |
| Elevation of privilege | Over-broad credentials reach the data tier. | Least privilege and managed identity, no stored secrets. | Backlog. |

## Infrastructure is in scope too

Most cloud incidents are configuration, not application code. `infra/storage.json`
is deliberately misconfigured — HTTPS-only disabled, anonymous blob access
allowed, TLS 1.0 — and **Microsoft Security DevOps** scans it on every push,
publishing findings to the repository Security tab.

| Threat | Mitigation | Demo proof |
| --- | --- | --- |
| Data readable in transit | Require HTTPS and TLS 1.2 or better. | Microsoft Security DevOps finding. |
| Anonymous access to storage | Disable public blob access. | Microsoft Security DevOps finding. |
