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

## Development Commands

- Full local quality gate: `npm run check`
- Unit tests (lean default): `npm run test:run`
- Build: `npm run build`

## How To Work With Agents

This section describes the recommended state-of-the-art workflow for AI-assisted delivery in this repo.

### Core Rule: Story First

- New feature work must start with a story document.
- You review and approve the story before any implementation starts.
- After implementation, the agent validates acceptance criteria with lean tests.
- The agent then shows the proposed commit message and asks once whether to commit and close the story.
- You review changes and run app checks manually if desired, then give explicit commit approval.
- Only after your approval should the agent commit and close the story.

### Prompt Templates (VS Code / Copilot)

This repo includes reusable prompt templates in `.github/prompts/`:

- `.github/prompts/implement-existing-story.prompt.md`
- `.github/prompts/new-feature-story-first.prompt.md`
- `.github/prompts/commit-gate.prompt.md`

Use them when chatting with agents instead of rewriting prompts each time.

- Option 1: open a template file and paste/adapt its content in chat.
- Option 2: use VS Code Copilot prompt file support to insert and run prompt templates directly.

### AI Agent Setup

VS Code Copilot instructions live in:

- `.github/copilot-instructions.md` (workspace-wide behavior)
- `.github/instructions/frontend.instructions.md` (frontend-specific guidance)

This is the canonical location for AI guidance in VS Code. Keep these files aligned with scripts and architecture when conventions change.

Also relevant:

- Story index: `docs/stories/INDEX.md`
- Story template: `docs/stories/STORY_TEMPLATE.md`

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
