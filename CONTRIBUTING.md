# Contributing to DineEase

Thank you for contributing to **DineEase**!

## Prerequisites

- Node.js 20+
- npm

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verification Checklist

Before opening a pull request, please run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Branch & Commit Conventions

- Create a focused branch from `main` (e.g., `feat/...`, `fix/...`, `docs/...`).
- Keep commits small and descriptive using conventional prefixes (`feat:`, `fix:`, `docs:`, `refactor:`).
- Ensure TypeScript and ESLint pass with zero errors.
