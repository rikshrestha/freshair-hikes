# Contributing Guide

## Branching
- Keep `main` clean and deployable.
- Create a short-lived branch per task: `feature/<name>`, `fix/<name>`, `chore/<name>`. Examples: `feature/nav-voice-cues`, `chore/ci-setup`.

## Workflow
1. Sync main: `git checkout main && git pull`.
2. Branch: `git checkout -b feature/<task-name>`.
3. Develop and commit in small, focused commits.
4. Push and open a PR into `main`; fix any lint/test issues.
5. Merge when green; tag releases on `main` as needed.

## Commits
- Clear messages summarizing the change (e.g., `Move OSM data to assets`, `Add docs index for sprint status`).
- Avoid committing large binaries; keep them in `project-docs` outside git.

## Testing
- Run available checks before PR (lint/tests/type-check). Add more as Sprint 2 builds out CI.

## Docs
- Start from `CONTEXT_INDEX.md` to load relevant docs.
- Keep `/docs` files concise; add ADRs for notable decisions in `/docs/decisions/`.
