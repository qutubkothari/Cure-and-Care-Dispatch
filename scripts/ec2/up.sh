#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/ec2/up.sh
# Assumes you're on the EC2 instance and in the repo root.

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

# Compose v2 plugin: 'docker compose'
if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required (Docker Compose v2)" >&2
  exit 1
fi

if [ ! -f .env.ec2 ]; then
  echo "Missing .env.ec2. Copy .env.ec2.example to .env.ec2 and set secrets." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.ec2
set +a

docker compose -f docker-compose.ec2.yml up -d --build

echo "Web: http://<EC2_PUBLIC_IP>:3000"
echo "API: http://<EC2_PUBLIC_IP>:4000/health"
echo "Assistant: http://<EC2_PUBLIC_IP>:4100/health"
