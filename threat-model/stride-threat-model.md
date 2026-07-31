# STRIDE threat model, sample web app

System: public user browser, internet, web app, database.

Trust boundaries:
1. Browser to internet.
2. Internet to web app.
3. Web app to database.

| STRIDE | Threat | Mitigation | Demo proof |
| --- | --- | --- | --- |
| Spoofing | A caller pretends to be another user. | Real identity and managed identity. | Explain. |
| Tampering | User input is reflected into HTML. | HTML encode output and set CSP. | ZAP gate catches missing browser defenses. |
| Repudiation | No record of approval. | Pull requests and required checks. | GitHub run history. |
| Information disclosure | Browser defense headers are missing. | Set CSP, X-Frame-Options, X-Content-Type-Options, and Permissions-Policy. | ZAP reports these. |
| Denial of service | Slow scan or flood overwhelms app. | Rate limits and timeouts. | Backlog item. |
| Elevation of privilege | Broad database credential. | Least privilege and managed identity. | Azure implementation task. |
