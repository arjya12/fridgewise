# Contributing

## Commit and push workflow

- Create focused branches per feature/fix.
- Stage selectively: `git add -p` to review hunks.
- Run checks before commit: `npm run lint` and `npm test`.
- Use conventional commits: `feat:`, `fix:`, `chore(repo):`, etc.
- Do not commit artifacts or secrets. If something sneaks in:
  1. Add to `.gitignore`
  2. Untrack: `git rm -r --cached <path>`

Ignored categories (see `.gitignore`):

- Dependencies: `node_modules/`
- Build/coverage: `build/`, `dist/`, `web-build/`, `coverage/`, `.expo/`
- Caches/logs: `.cache/`, `.tmp/`, `*.log`, `logs/`
- IDE/OS files: `.vscode/`, `.idea/`, `.DS_Store`, `Thumbs.db`
- Env files: `.env`, `.env.local`, `.env.production` (commit `.env.example` only)

## Secrets

Never commit real secrets. Use `.env` locally and keep `.env.example` updated with required keys.

