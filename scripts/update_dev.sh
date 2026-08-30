#!/usr/bin/env bash
# Rebuild development images, migrate, and replace services.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.dev.yml)

cd "$PROJECT_ROOT"

"${COMPOSE[@]}" up -d --wait postgres
"${COMPOSE[@]}" build --pull web frontend

# Apply schema changes using the newly built image before replacing the web service.
"${COMPOSE[@]}" run --rm --no-deps web python manage.py migrate --noinput
"${COMPOSE[@]}" up -d --force-recreate --wait web frontend

echo "Development update completed successfully."
