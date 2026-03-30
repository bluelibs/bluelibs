# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within any BlueLibs package, please report it responsibly:

1. **Do NOT open a public issue.**
2. Send an e-mail to [theodor@bluelibs.com](mailto:theodor@bluelibs.com) with:
   - A description of the vulnerability
   - Steps to reproduce
   - Affected package(s) and version(s)
   - Any potential impact assessment

You will receive a response within 48 hours acknowledging receipt. We will work with you to understand and address the issue before any public disclosure.

## Disclosure Policy

- We will confirm the vulnerability and determine its impact.
- We will release a patch as soon as possible.
- We will publicly disclose the vulnerability after a fix is available.

## Security Best Practices for Contributors

- Never commit secrets, API keys, or credentials.
- Use environment variables for all sensitive configuration.
- Keep dependencies up to date — Dependabot is enabled on this repository.
- Run `npm audit` before submitting PRs.
