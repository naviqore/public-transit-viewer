# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci

# Build the Vite application
COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create a non-root user and fix permissions on all directories nginx needs
RUN adduser -S -D -u 1001 appuser \
 && chown -R appuser /var/cache/nginx \
                     /var/log/nginx \
                     /usr/share/nginx/html \
                     /etc/nginx/nginx.conf

# OCI standard image labels (dynamic labels are added by the CI publish step)
LABEL org.opencontainers.image.title="naviqore-public-transit-viewer" \
      org.opencontainers.image.description="Naviqore public transit viewer frontend" \
      org.opencontainers.image.url="https://github.com/naviqore/public-transit-viewer" \
      org.opencontainers.image.source="https://github.com/naviqore/public-transit-viewer" \
      org.opencontainers.image.licenses="MIT"

USER appuser

# nginx.conf listens on 8080 to avoid requiring root for privileged ports
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
