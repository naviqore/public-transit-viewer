# STORY-0016: Production-ready Docker image and CI/CD pipeline

## Status

OPEN

## Context

The application has no containerisation strategy. Adding a production-ready `Dockerfile`
and corresponding GitHub Actions CI enables:

- Reproducible, environment-independent builds
- Security-hardened runtime (non-root user, minimal image surface)
- Automated validation of the Docker build on every pull request
- Automated image publishing to the GitHub Container Registry (`ghcr.io`) triggered by
  the existing Release Please release workflow

## Scope

- **`Dockerfile`** — multi-stage build: `node:lts-alpine` build stage (runs `npm ci` +
  `npm run build`) and an `nginx:alpine` runtime stage that serves the `dist/` output.
  The runtime stage must run as a non-root user, expose port 80, and include a minimal
  Nginx config that handles Vite's client-side routing (`try_files`).
- **`.github/workflows/docker.yml`** — CI workflow that builds (but does not push) the
  Docker image on every PR targeting `main`. Lint / unit tests must also pass before the
  Docker build step.
- **`.github/workflows/release.yml`** (or amendment to existing release workflow) — on
  `release-please` release events, build and publish the image to `ghcr.io` tagged with
  both the release semver tag and `latest`.
- **`nginx.conf`** — custom Nginx configuration co-located with the `Dockerfile`; must
  include `try_files` for SPA routing, gzip compression, and appropriate cache headers
  for hashed assets vs `index.html`.

## Acceptance Criteria

- [ ] `docker build -t naviqore-viewer .` succeeds from the repo root.
- [ ] The built container serves the Vite app correctly: `docker run -p 8080:80
naviqore-viewer` and opening `http://localhost:8080` returns the app with the correct
      title.
- [ ] Client-side routing works inside the container (navigating to a deep route and
      refreshing does not return 404).
- [ ] The runtime container process runs as a non-root user (verifiable via
      `docker inspect` or `whoami` inside the container).
- [ ] The `Dockerfile` uses a fixed digest-pinned or version-pinned base image tag (e.g.
      `node:22-alpine`, `nginx:1.27-alpine`) — no `latest` base images.
- [ ] `nginx.conf` sets `Cache-Control: max-age=31536000, immutable` for hashed asset
      paths (`/assets/*`) and `no-cache` for `index.html`.
- [ ] `docker.yml` CI workflow runs on every PR to `main` targeting the Docker build
      validation step; failing build blocks the PR.
- [ ] The release publish workflow pushes to `ghcr.io/<org>/<repo>:latest` and
      `ghcr.io/<org>/<repo>:<semver>` on release-please release events.
- [ ] Image is labelled with OCI standard labels (`org.opencontainers.image.*`).
- [ ] `npm run check` and `npm run test:run` still pass (Docker files do not affect
      TypeScript source).

## Implementation Notes

- Base stage: `node:22-alpine` — install deps with `npm ci`, run `npm run build`.
- Runtime stage: `nginx:1.27-alpine` — copy `dist/` into `/usr/share/nginx/html`,
  copy custom `nginx.conf` into `/etc/nginx/nginx.conf`.
- Non-root: create `appuser` with `adduser -S -D`, `USER appuser`; adjust Nginx port
  binding to avoid needing root (use `listen 8080` internally and remap at `docker run`
  time, or use `nginx:unprivileged` variant).
- Release workflow should reuse / extend the existing `release-please.yml` — add a
  `publish-docker` job that `needs: release`.
- Store `GITHUB_TOKEN` is sufficient for `ghcr.io`; no additional secrets required.

## Completion

- Date:
- Outcome:
- Descoped ACs:
