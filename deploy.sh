#!/usr/bin/env bash
# One-click deploy for the CrossFriend storefront -> https://crossfriend.in
#
# Same build -> save -> scp -> ssh -> load -> restart cycle as the other three deploy scripts, with
# two differences specific to this app:
#
#   1. THIS SITE RUNS ON A DIFFERENT SERVER. crossfriend.in resolves to 155.248.243.46 (Oracle
#      Cloud, nginx in front). The other three services run on 13.62.195.167 (AWS) and authenticate
#      with pranajivainnovationpem.pem — that key is rejected here. This host uses
#      ssh-key-2026-02-08.key, which lives in this directory and is git-ignored.
#
#   2. NEXT_PUBLIC_* is inlined by the bundler at BUILD time. It is not read when the container
#      starts, so it cannot be fixed by editing the server's .env or compose file — a wrong value
#      means rebuilding. The build args below are therefore passed explicitly rather than relying on
#      whatever the shell happens to have exported. This is not theoretical: production once shipped
#      <link rel="canonical" href="http://localhost:8000/..."> on every page, which tells Google the
#      real content lives at an address it cannot reach.
#
# Run from anywhere; paths below resolve relative to this file, not the caller's cwd.
#
# Usage: ./deploy.sh          (Git Bash, or double-click deploy.bat on Windows)

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# ── Configuration — this host's details differ from the AWS box ───────────────
# Note this is a .key, not the .pem the other three services use: different server, different key.
# All four values below were verified against the live host on 2026-08-09.
SSH_KEY="${DEPLOY_SSH_KEY:-ssh-key-2026-02-08.key}"   # override with: DEPLOY_SSH_KEY=/path/to/key ./deploy.sh
REMOTE_HOST="ubuntu@155.248.243.46"                   # Oracle Cloud, nginx in front — not the AWS box
REMOTE_DIR="/home/ubuntu/crossfriend"                 # from the container's compose working_dir label
SERVICE_NAME="crossfriend-storefront"                 # the service key in the SERVER's docker-compose.yml
# ─────────────────────────────────────────────────────────────────────────────

# ── Build-time configuration — changing any of these requires a rebuild ───────
IMAGE_NAME="crossfriend-storefront"
BASE_URL="${NEXT_PUBLIC_BASE_URL:-https://crossfriend.in}"
DEFAULT_REGION="${NEXT_PUBLIC_DEFAULT_REGION:-in}"
# ─────────────────────────────────────────────────────────────────────────────

TARBALL="${IMAGE_NAME}.tgz"

if [ ! -f "$SSH_KEY" ]; then
  echo "SSH key not found at: $SSH_KEY"
  echo "Set DEPLOY_SSH_KEY=/full/path/to/key before running, or edit SSH_KEY in deploy.sh."
  exit 1
fi

# A localhost base URL de-indexes the whole site silently, so refuse to build one by accident.
case "$BASE_URL" in
  http://localhost*|http://127.0.0.1*)
    echo "REFUSING TO BUILD: NEXT_PUBLIC_BASE_URL is '$BASE_URL'."
    echo "That value gets baked into every canonical tag, og:url and sitemap entry, and tells"
    echo "Google the content lives somewhere it cannot reach. Unset it, or set the real domain."
    exit 1
    ;;
esac

echo "==> [1/6] Building ${IMAGE_NAME}:latest (--no-cache)"
echo "         NEXT_PUBLIC_BASE_URL      = ${BASE_URL}"
echo "         NEXT_PUBLIC_DEFAULT_REGION = ${DEFAULT_REGION}"
docker build --no-cache \
  --build-arg "NEXT_PUBLIC_BASE_URL=${BASE_URL}" \
  --build-arg "NEXT_PUBLIC_DEFAULT_REGION=${DEFAULT_REGION}" \
  -t "${IMAGE_NAME}:latest" .

# Confirm the value actually landed in the compiled output rather than trusting that the build arg
# was wired through. Advisory only — a miss here may just mean Next arranged the chunks differently,
# so it warns rather than aborting. A hit on localhost is worth stopping to look at.
echo "==> [2/6] Checking the baked-in base URL..."
BAKED="$(docker run --rm --entrypoint sh "${IMAGE_NAME}:latest" -c \
  "grep -rlo 'http://localhost:8000' .next/server 2>/dev/null | head -1" || true)"
if [ -n "$BAKED" ]; then
  echo "    WARNING: found 'http://localhost:8000' inside .next/server ($BAKED)."
  echo "    Check the rendered canonical tag before trusting this deploy."
else
  echo "    OK — no localhost base URL found in the compiled server output."
fi

echo "==> [3/6] Saving image to ${TARBALL}..."
docker save -o "$TARBALL" "${IMAGE_NAME}:latest"

# Verify the target BEFORE uploading, and never create it. A directory that isn't there means
# REMOTE_DIR is wrong, not that a directory needs making: `mkdir -p` on a wrong path silently
# produces an empty one, compose then finds no .env, every ${VAR} resolves to "", and the deploy
# fails in confusing ways well after a long build has completed.
echo "==> [4/6] Verifying ${REMOTE_DIR} on ${REMOTE_HOST}..."
ssh -i "$SSH_KEY" "$REMOTE_HOST" "test -f ${REMOTE_DIR}/docker-compose.yml" || {
  echo "ERROR: ${REMOTE_DIR} on ${REMOTE_HOST} has no docker-compose.yml."
  echo "Find the real path with:"
  echo "  ssh -i ${SSH_KEY} ${REMOTE_HOST} \"docker inspect ${SERVICE_NAME} --format '{{index .Config.Labels \\\"com.docker.compose.project.working_dir\\\"}}'\""
  exit 1
}
# Only the image ships. The server's docker-compose.yml and .env are the source of truth for how
# this deployment is wired and are deliberately NOT overwritten from a developer machine — the local
# copy can legitimately differ, and clobbering the server's version breaks a running production site
# in a way that stays invisible until the next restart. When compose genuinely needs a new variable,
# edit the server copy by hand and add it to that .env in the same sitting. Remember that adding a
# NEXT_PUBLIC_* variable there does nothing: those are build-time only, handled above.
scp -i "$SSH_KEY" "$TARBALL" "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "==> [5/6] Loading image on the server..."
ssh -i "$SSH_KEY" "$REMOTE_HOST" "cd ${REMOTE_DIR} && docker load -i ${TARBALL}"

echo "==> [6/6] Restarting ${SERVICE_NAME}..."
# --no-deps in case this compose file gains a second service later; harmless when it has only one.
ssh -i "$SSH_KEY" "$REMOTE_HOST" \
  "cd ${REMOTE_DIR} && docker compose up -d --no-deps --force-recreate ${SERVICE_NAME}"

echo "==> Container status:"
ssh -i "$SSH_KEY" "$REMOTE_HOST" "cd ${REMOTE_DIR} && docker compose ps"

# A deploy that prints "Done" while the container crash-loops is worse than one that fails loudly —
# you go and do something else. Poll the public URL, which also proves nginx is still routing.
echo "==> Verifying ${BASE_URL} is answering..."
HEALTH_OK=0
for attempt in $(seq 1 20); do
  if curl -fsS -o /dev/null --max-time 8 "${BASE_URL}"; then
    HEALTH_OK=1
    break
  fi
  sleep 3
done

echo
if [ "$HEALTH_OK" = "1" ]; then
  echo "Deployed ${IMAGE_NAME}:latest — ${BASE_URL} is responding."
  echo
  # A sitemap listing only the hardcoded static paths is the signature of the data fetches having
  # failed — which is exactly what happened when this route was still prerendered at build time.
  # It looks like a valid sitemap, so nothing else catches it.
  echo "==> Checking the sitemap has more than just static pages..."
  TOTAL_URLS="$(curl -fsS --max-time 20 "${BASE_URL}/sitemap.xml" | grep -c '<loc>' || echo 0)"
  DYNAMIC_URLS="$(curl -fsS --max-time 20 "${BASE_URL}/sitemap.xml" | grep -c 'bakers/\|occasions/\|products/' || echo 0)"
  if [ "$DYNAMIC_URLS" -gt 0 ]; then
    echo "    OK — ${TOTAL_URLS} URLs, ${DYNAMIC_URLS} of them products/bakers/occasions."
  else
    echo "    WARNING: ${TOTAL_URLS} URLs and NONE are products, bakers or occasions."
    echo "    The backend fetches inside the container are failing. Check:"
    echo "      ssh -i ${SSH_KEY} ${REMOTE_HOST} \"docker exec ${SERVICE_NAME} sh -c 'wget -qO- \\\$MEDUSA_BACKEND_URL/store/crossfriend/taxonomy'\""
  fi

  echo
  echo "Worth a look after an SEO change:"
  echo "  curl -s ${BASE_URL}/robots.txt"
  echo "  curl -s ${BASE_URL} | grep -o '<link rel=\"canonical\"[^>]*>'"
else
  echo "WARNING: image deployed, but ${BASE_URL} did not answer within 60s."
  echo "Check the logs:"
  echo "  ssh -i ${SSH_KEY} ${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker compose logs --tail=80 ${SERVICE_NAME}'"
  exit 1
fi
