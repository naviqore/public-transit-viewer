# Naviqore Viewer

Naviqore Viewer is a web application designed to visualize and interact with the Naviqore backend service. It provides
features for routing, exploring schedules, viewing isolines, and monitoring system performance.

## Environment Variables

The application can be configured using the following environment variables. In a Vite project, these variables must be
prefixed with `VITE_`.

- `VITE_API_BASE_URL` (or `VITE_NAVIQORE_BACKEND_URL`): Sets the base URL for the Naviqore backend API. If this is set,
  the application will connect to the specified backend and disable the mock data option in the settings. If not set, it
  defaults to `http://localhost:8080`.
- `VITE_ENABLE_MOCK_DATA`: Set this to `true` to automatically enable mock data mode on startup.
- `VITE_DISABLE_BENCHMARK`: Set this to `true` to disable the Benchmark tab in the System Monitor page. This is highly
  recommended for public deployments to prevent excessive load on the backend service.

### Example `.env` file

```env
VITE_API_BASE_URL=https://api.your-naviqore-instance.com
VITE_ENABLE_MOCK_DATA=false
VITE_DISABLE_BENCHMARK=true
```

## Running Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Professional Development Setup

### Quality and Automation Scripts

- `npm run lint` runs ESLint with zero-warning policy.
- `npm run lint:fix` applies safe lint fixes.
- `npm run format` formats the repository with Prettier.
- `npm run format:check` validates formatting without rewriting files.
- `npm run typecheck` runs TypeScript checks without emitting.
- `npm run test` starts Vitest in watch mode.
- `npm run test:run` runs unit tests once.
- `npm run test:coverage` runs tests with V8 coverage reports.
- `npm run commitlint` validates recent commits against Conventional Commits.
- `npm run check` runs the full local quality gate.

Recommended day-to-day loop:

```bash
npm run check
```

### Tests

- Test runner: `Vitest`
- DOM environment: `jsdom`
- Test setup file: `src/test/setup.ts`
- Coverage output: `coverage/`

Simple test workflow:

```bash
npm run test:run
```

For coverage on larger changes:

```bash
npm run test:coverage
```

Testing conventions:

- Co-locate tests near source files as `*.test.ts` / `*.test.tsx`.
- Prefer fast unit tests for `src/services`, `src/utils`, and important hooks.
- For React components, use Testing Library and assert user-visible behavior.

### VS Code Setup

This repo is optimized for VS Code with shared workspace config:

- `.vscode/extensions.json` contains recommended extensions.
- `.vscode/settings.json` enables format-on-save and ESLint flat config behavior.
- `.vscode/tasks.json` provides reusable tasks for `check`, `test`, and `build`.

### CI and Dependency Automation

- `Quality CI` workflow runs lint/typecheck/format/tests/build on push and PR.
- `Commitlint` workflow validates commit messages on pull requests.
- `Release Please` workflow creates release PRs/tags from Conventional Commits on `main`.
- Docker workflows are kept for image build/publish.
- Dependabot tracks `npm`, `github-actions`, and `docker` updates.

### Conventional Commits and Releases

This project uses Conventional Commits so Release Please can generate changelogs and releases automatically.

- Commit format: `<type>(<scope>): <subject>`
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Breaking changes: use `!` after type/scope or a `BREAKING CHANGE:` footer

Examples:

```text
feat(connect): add transfer duration slider
fix(map): keep bounds stable on stop swap
chore(ci): add release please workflow
```

Local and CI enforcement:

- Husky `commit-msg` hook runs `commitlint`
- PR commits are validated by `.github/workflows/commitlint.yml`

### Story Workflow for Agents

To keep agent work deterministic and auditable, this repo uses a local story index:

- `docs/stories/INDEX.md` is the source of truth for story status
- stories use sequential IDs (`STORY-0001`, `STORY-0002`, ...)
- implementation should pick the highest-numbered `OPEN` story unless directed otherwise
- when complete, mark story `CLOSED` and add date + outcome
- use `docs/stories/STORY_TEMPLATE.md` for new stories

### AI Agent Setup

VS Code Copilot instructions live in:

- `.github/copilot-instructions.md` (workspace-wide behavior)
- `.github/instructions/frontend.instructions.md` (frontend-specific guidance)

This is the canonical location for AI guidance in VS Code. Keep these files aligned with scripts and architecture when conventions change.

## Docker Deployment

A `Dockerfile` is provided for deploying the application using a production-ready Nginx server.

1. Build the Docker image:

   ```bash
   docker build -t naviqore-viewer .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 80:80 -e VITE_API_BASE_URL=https://api.example.com -e VITE_DISABLE_BENCHMARK=true naviqore-viewer
   ```
   _Note: Environment variables need to be passed during the build process if they are baked into the static files by
   Vite, or you can use a runtime configuration approach._

### Building with Build Arguments

Since Vite bakes environment variables into the static build, you should pass them as build arguments:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.your-naviqore-instance.com \
  --build-arg VITE_DISABLE_BENCHMARK=true \
  -t naviqore-viewer .
```
