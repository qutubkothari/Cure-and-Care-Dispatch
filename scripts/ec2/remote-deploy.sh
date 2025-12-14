#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cure-care-dispatch}"
REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
SWAP_GB="${SWAP_GB:-4}"
CLEAR_CACHES="${CLEAR_CACHES:-true}"
JWT_SECRET="${JWT_SECRET:-}"
WEB_ORIGIN="${WEB_ORIGIN:-}"

log() { echo "[deploy] $*"; }

ensure_swap() {
  if swapon --show | grep -q '^/swapfile'; then
    log "Swap already present"
    return 0
  fi

  log "Creating ${SWAP_GB}G swap at /swapfile"
  sudo fallocate -l "${SWAP_GB}G" /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=$((SWAP_GB*1024))
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile

  if ! grep -q "^/swapfile" /etc/fstab; then
    echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
  fi

  sudo tee /etc/sysctl.d/99-dispatch.conf >/dev/null <<'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF
  sudo sysctl --system >/dev/null

  log "Swap enabled"
}

clear_caches() {
  if [ "${CLEAR_CACHES}" != "true" ]; then
    log "Cache clearing disabled"
    return 0
  fi

  log "Pruning Docker build cache (safe)"
  sudo docker builder prune -af || true

  log "Pruning dangling Docker images"
  sudo docker image prune -f || true

  # Optional: drop filesystem caches (not a silver bullet, but requested)
  log "Dropping Linux page cache"
  sync
  echo 3 | sudo tee /proc/sys/vm/drop_caches >/dev/null || true
}

ensure_prereqs() {
  log "Ensuring prerequisites (git + docker)"
  if ! command -v git >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y git
  fi

  if ! command -v docker >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi

  if ! sudo docker compose version >/dev/null 2>&1; then
    log "Docker compose plugin missing; reinstall docker-compose-plugin"
    sudo apt-get update -y
    sudo apt-get install -y docker-compose-plugin
  fi
}

sync_repo() {
  if [ -z "${REPO_URL}" ] || [ "${REPO_URL}" = "PUT_YOUR_GIT_REPO_URL_HERE" ]; then
    log "REPO_URL is not set; cannot git clone/pull. Set REPO_URL to your repo URL."
    exit 2
  fi

  sudo mkdir -p "${APP_DIR}"
  sudo chown -R "$USER":"$USER" "${APP_DIR}"

  if [ ! -d "${APP_DIR}/.git" ]; then
    log "Cloning repo into ${APP_DIR}"
    git clone "${REPO_URL}" "${APP_DIR}"
  fi

  cd "${APP_DIR}"
  log "Fetching and resetting to origin/${BRANCH}"
  git fetch --all --prune
  git checkout "${BRANCH}" || git checkout -b "${BRANCH}"
  git reset --hard "origin/${BRANCH}"
}

deploy_compose() {
  cd "${APP_DIR}"

  # Ensure .env.ec2 exists and is populated from provided env
  if [ -z "${JWT_SECRET}" ]; then
    log "JWT_SECRET not provided; refusing to deploy"
    exit 3
  fi
  if [ -z "${WEB_ORIGIN}" ]; then
    WEB_ORIGIN="http://localhost:3000"
  fi

  log "Writing .env.ec2"
  cat > .env.ec2 <<EOF
JWT_SECRET=${JWT_SECRET}
WEB_ORIGIN=${WEB_ORIGIN}
EOF
  chmod 600 .env.ec2

  log "Pulling and starting services"
  sudo docker compose -f docker-compose.ec2.yml --env-file .env.ec2 pull
  sudo docker compose -f docker-compose.ec2.yml --env-file .env.ec2 up -d

  log "Done"
}

main() {
  ensure_prereqs
  ensure_swap
  clear_caches
  sync_repo
  deploy_compose
}

main "$@"
