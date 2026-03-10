# Naviqore Public Transit Viewer

A web frontend for the [Naviqore](https://github.com/naviqore) public transit routing engine. Connect to a live backend or explore with built-in mock data.

**Features:** stop/schedule explorer · connection routing · isoline (reachability) map · system monitor & benchmark

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS · Leaflet · React Router v7

## Configuration

Environment variables (prefix `VITE_` as required by Vite):

| Variable                 | Default                 | Description                                                  |
| ------------------------ | ----------------------- | ------------------------------------------------------------ |
| `VITE_API_BASE_URL`      | `http://localhost:8080` | Naviqore backend URL. When set, mock-data toggle is hidden.  |
| `VITE_ENABLE_MOCK_DATA`  | `false`                 | Start in mock-data mode automatically.                       |
| `VITE_DISABLE_BENCHMARK` | `false`                 | Hide the Benchmark tab (recommended for public deployments). |

## Running Locally

```bash
npm install       # install dependencies
npm run dev       # start dev server
npm run ci        # full quality gate: typecheck → lint → format → tests → build → coverage
```

Other useful scripts: `npm run test:run`, `npm run build`, `npm run lint:fix`.

## Docker

Since Vite bakes env vars into the static bundle, pass them as build args:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.your-naviqore-instance.com \
  --build-arg VITE_DISABLE_BENCHMARK=true \
  -t naviqore-viewer .

docker run -p 80:80 naviqore-viewer
```

## AI-Assisted Development

This repo uses a story-first workflow with GitHub Copilot.

- New features require a story doc approved before implementation starts.
- Copilot instructions: `.github/copilot-instructions.md` and `.github/instructions/frontend.instructions.md`
- Prompt templates: `.github/prompts/`
- Story backlog: `docs/stories/INDEX.md`
