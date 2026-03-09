#!/bin/sh
# Generates /usr/share/nginx/html/env.js at container startup so that
# runtime environment variables are available to the pre-built React bundle
# via window.__ENV__ without requiring a rebuild.
set -e

ENV_FILE=/usr/share/nginx/html/env.js

cat > "$ENV_FILE" << EOF
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-}",
  VITE_NAVIQORE_BACKEND_URL: "${VITE_NAVIQORE_BACKEND_URL:-}",
  VITE_DISABLE_BENCHMARK: "${VITE_DISABLE_BENCHMARK:-}",
  VITE_ENABLE_MOCK_DATA: "${VITE_ENABLE_MOCK_DATA:-}"
};
EOF

exec nginx -g 'daemon off;'
