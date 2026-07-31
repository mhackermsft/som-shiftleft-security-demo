# Shift-Left Security demo repo

Main is safe. The feature/reflected-input branch makes the app vulnerable. The dast-gate workflow runs OWASP ZAP and fails on missing browser defenses.

The msdo-scan workflow runs Microsoft Security DevOps and publishes findings to the Security tab. infra/storage.json is deliberately misconfigured so those scanners have something to find.
