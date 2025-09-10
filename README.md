# FridgeWise

Track your fridge inventory and get notified before food goes bad.

## Selective push workflow

- Create focused branches for features or fixes.
- Stage intentionally: use `git add -p` to review hunks.
- Before commits, run: `npm test` and `npm run lint`.
- Avoid committing artifacts or secrets:
  - Build/coverage outputs, caches, logs
  - `.env` and any API keys; commit only `.env.example`
- Use conventional commits, e.g. `feat:`, `fix:`, `chore(repo):`.
- Use `.gitignore` already provided; if an artifact shows up as modified, add it to `.gitignore` and untrack it: `git rm -r --cached <path>`.

## Environment

Copy `.env.example` to `.env` and fill in values as needed. Never commit real secrets.
