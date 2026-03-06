# Repository Guidelines

## Project Structure & Module Organization
This repository is currently minimal; keep it organized from the start:
- `src/`: implementation code.
- `src/nodes/ZohoDesk/`: n8n node logic and operation files.
- `src/credentials/`: credential definitions.
- `test/`: unit/integration tests mirroring `src/` paths.
- `dist/`: generated build output (do not edit manually).

Example layout:
`src/nodes/ZohoDesk/ZohoDesk.node.ts`, `src/credentials/ZohoDeskApi.credentials.ts`, `test/nodes/ZohoDesk.node.test.ts`.

## Build, Test, and Development Commands
Use npm scripts as the single interface for local workflows:
- `npm install`: install dependencies.
- `npm run build`: compile TypeScript to `dist/`.
- `npm run lint`: run lint checks.
- `npm test`: run automated tests.
- `npm run dev`: local watch mode for iterative development.

If a script is missing, add it to `package.json` before opening a PR.

## Coding Style & Naming Conventions
- Language: TypeScript preferred for all runtime code.
- Indentation: 2 spaces; keep files Prettier-formatted.
- Linting: ESLint + Prettier (fix warnings before PR).
- Naming:
  - Files: `PascalCase` for node/credential files (`ZohoDesk.node.ts`).
  - Functions/variables: `camelCase`.
  - Constants/env keys: `UPPER_SNAKE_CASE`.
- Keep modules small and operation-focused; avoid large multi-purpose files.

## Testing Guidelines
- Place tests in `test/` with names ending in `.test.ts`.
- Cover success and failure paths for API calls, parameter validation, and response mapping.
- Keep tests deterministic; mock external Zoho Desk calls.
- Run `npm test` and `npm run lint` before every commit.

## Commit & Pull Request Guidelines
No Git history is available in this checkout, so use these conventions going forward:
- Commit format: Conventional Commits (e.g., `feat: add ticket search operation`, `fix: handle 429 retries`).
- Keep commits scoped and atomic.
- PRs should include:
  - Clear summary of behavior changes.
  - Linked issue/task ID when applicable.
  - Test evidence (command output or brief notes).
  - Screenshots only for UI/documentation changes.

## Security & Configuration Tips
- Never commit real API keys or tokens.
- Keep secrets in `.env` (ignored by Git) and document required variables in `README.md`.
