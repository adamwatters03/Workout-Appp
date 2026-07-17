# Recomp — Athlete OS

A mobile-first workout & nutrition app for a body-recomposition programme, built with React + Vite + Tailwind CSS. Implemented from a Claude Design (claude.ai/design) handoff prototype.

## Features

- **Today** — day picker week strip, gamified progress hero (XP, level, % ring), training and fuel preview cards
- **Train** — 3-day split (Upper / Lower / Full Body) with a 4-week progressive-overload mesocycle, per-exercise detail screens and week-by-week load prescriptions
- **Fuel** — nutrition targets per day type (gym / rest / cardio), UK meal plans with per-meal macros and £ cost, a UK food database, and a glycogen "surge" (+500 kcal / +90 g carbs) unlocked by completing cardio
- **Progress** — level ring, weekly stats, 8 unlockable achievements, and goal card
- XP / levels / badges / confetti celebrations, all derived from a small persisted state so scores can never drift
- Photo slots (tap or drag-and-drop) and all progress persist locally via `localStorage`

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Static output goes to `dist/`.

## Deploying to GitHub Pages

A ready-to-use GitHub Actions workflow is included at [`deploy-workflow/deploy.yml`](deploy-workflow/deploy.yml). To enable automatic deploys:

1. Move it into place: `mkdir -p .github/workflows && git mv deploy-workflow/deploy.yml .github/workflows/deploy.yml`
2. Commit and push (requires a token with the `workflow` scope, or push from the GitHub web UI / a machine with GitHub CLI auth).
3. In the repo's **Settings → Pages**, set the source to **GitHub Actions**.

The workflow builds the Vite app and publishes `dist/` on every push to `main`. (It lives outside `.github/workflows/` in this commit because the token used for the initial push lacked the `workflow` scope.)
