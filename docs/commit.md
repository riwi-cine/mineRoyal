# Commit conventions

This document explains the commit message rules enforced by the `commit-msg` Git hook (`backend/.husky/commit-msg` → `backend/.husky/validate-commit-msg.cjs`), and what else runs before a commit is accepted.

## 1. Required message format

```
[US-XXX] type: description
```

- `US-XXX` — the user story / ticket number the commit belongs to (e.g. `US-150`).
- `type` — one of: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`.
- `description` — a short summary of the change, in English.

Valid examples:

```
[US-101] feat: add user authentication
[US-150] chore: configure Husky and ESLint flat config, document Git workflow
[US-010] fix: correct seat availability calculation
```

Any message that doesn't match `^\[US-\d+\] (feat|fix|test|refactor|docs|chore): .+$` is rejected, and the hook prints the expected format plus the message that was received.

## 2. What runs on every commit

Two hooks are installed via Husky (`backend/.husky/`), wired through `core.hooksPath`:

- **`pre-commit`**: runs, in order, `pnpm lint`, `pnpm type-check`, then `pnpm test`. Any failing step aborts the commit.
- **`commit-msg`**: validates the message format described above.

Both hooks run automatically on `git commit` — there's no extra step to opt in, as long as `pnpm install` has been run at least once (the `prepare` script in `backend/package.json` installs the hooks).

## 3. Practical notes

- Write the ticket number first, even for commits that touch tooling/config rather than a specific feature — pick the most relevant US or the one tracking that work.
- Keep the description in English, lowercase after the colon, imperative mood (e.g. `add`, `fix`, `update`) rather than past tense.
- If `pre-commit` fails on `type-check` or `test`, fix the underlying issue — don't bypass the hook with `--no-verify`.
