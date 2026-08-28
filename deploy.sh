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
# The GA4 property. Analytics renders nothing at all when this is empty — no tag, no page-view
# tracker, no consent banner — so an omission here is invisible on the site rather than broken.
GA_MEASUREMENT_ID="${NEXT_PUBLIC_GA_MEASUREMENT_ID:-G-PGF5L9QMCQ}"
# ─────────────────────────────────────────────────────────────────────────────


# ── Deploy record ─────────────────────────────────────────────────────────────
# Appends one entry to DEPLOYED.md every time this script finishes.
#
# Why this exists: "is that change live?" was being answered from memory, by both a human and an
# assistant reading the repo, and memory was wrong often enough to waste real time — a fix sat in
# the working tree through two production builds while everyone believed it had shipped, and
# separately, work that HAD shipped was repeatedly described as pending.
#
# The file answers it from evidence instead. The decisive field is `tree`: `clean` means the commit
# named beside it is exactly what shipped, so `git log <sha>..HEAD` lists everything since. `dirty`
# means uncommitted files were part of the build, so the commit alone does not identify the deploy —
# then the timestamp is what to compare against, and anything modified after it is unshipped.
#
# Append-only, newest entry LAST. `tail -12 DEPLOYED.md` shows the most recent deploy.
record_deploy() {
  local outcome="$1"
  local log="DEPLOYED.md"

  local sha branch tree
  sha="$(git rev-parse --short HEAD 2>/dev/null || echo 'no-git')"
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '-')"
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then tree="dirty"; else tree="clean"; fi

  if [ ! -f "$log" ]; then
    {
      echo "# Deploy log — ${IMAGE_NAME}"
      echo
      echo "Written automatically by \`deploy.sh\`. Newest entry is at the **bottom**."
      echo
      echo "\`tree: clean\` means the commit beside it is exactly what shipped, so"
      echo "\`git log <sha>..HEAD\` lists everything not yet deployed."
      echo "\`tree: dirty\` means uncommitted files were built in, so compare file"
      echo "modification times against the deploy timestamp instead."
      echo
      echo "Do not edit by hand, and do not delete — it is the only record of what is live."
      echo
    } > "$log"
  fi

  {
    echo "---"
    # IST computed as a UTC offset, not via TZ=Asia/Kolkata: Git Bash on Windows ships no tzdata,
    # so the named zone silently resolves to GMT and stamps the wrong local time.
    echo "- when:    $(date -u '+%Y-%m-%d %H:%M:%S') UTC  /  $(date -u -d '+5 hours 30 minutes' '+%Y-%m-%d %H:%M') IST"
    echo "- outcome: ${outcome}"
    echo "- commit:  ${sha} (${branch})"
    echo "- tree:    ${tree}"
    echo "- image:   ${IMAGE_NAME}:latest"
    echo "- target:  ${REMOTE_HOST}:${REMOTE_DIR}"
    echo "- by:      $(git config user.name 2>/dev/null || echo "${USER:-unknown}")"
  } >> "$log"

  echo
  echo "Recorded in $(pwd)/${log}  —  ${outcome}, commit ${sha}, tree ${tree}"
  if [ "$tree" = "dirty" ]; then
    echo "  NOTE: uncommitted files were built into this image. Commit them so the next"
    echo "        deploy record identifies exactly what is live."
  fi
}


# Record every outcome, not just success: this must distinguish "deployed and failed" from
# "never ran". An EXIT trap catches the set -e aborts above as well as a clean finish.
trap 'rc=$?; record_deploy "$([ $rc -eq 0 ] && echo SUCCESS || echo "FAILED (exit $rc)")"' EXIT


# ── Build provenance ──────────────────────────────────────────────────────────────────────────
# Stamped into the image and served by the build endpoint, so OPS can report what is ACTUALLY
# running rather than what a log claims was deployed. Captured here, once, so the values echoed
# below and the values baked into the image cannot disagree.
BUILD_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
BUILD_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
BUILD_TIME="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then BUILD_TREE="dirty"; else BUILD_TREE="clean"; fi

TARBALL="${IMAGE_NAME}.tgz"

# ── Server disk hygiene ───────────────────────────────────────────────────────
# Repeated deploys fill the server, and the failure lands at the worst possible moment: the image
# tarball has already been uploaded and `docker load` is halfway through extracting it. On a script
# that stopped the container first, the service is then down with no image to start.
#
# Two causes, both invisible until they bite:
#
#   1. Every `docker load` of the same :latest tag untags the previous image rather than deleting
#      it. Twenty-one of these had accumulated on the storefront host over three weeks, one per
#      deploy, ~280MB each. Nothing ever collects them.
#   2. The uploaded .tgz is never removed. Five of them, back to May, were sitting in the deploy
#      directories on one host — 498MB doing nothing.
#
# Note the prune below is deliberately NOT `-a`. `docker image prune -a` removes every image not
# used by a *running* container, and these hosts run several services side by side: if any other
# service happened to be stopped at that moment, its image would be deleted too and it could not
# restart without a fresh upload. `-a` also throws away the previous image, which is the only
# rollback available when a new one turns out to be broken. Dangling-only removes exactly the
# garbage and nothing that anything could still want.
DEPLOY_KEY="${PEM_PATH:-${SSH_KEY:-}}"

# Refuse to start if the server cannot comfortably hold the incoming image. Checked BEFORE the
# upload and before anything is stopped, so a failure here costs nothing but a message.
preflight_disk() {
  local tarball_bytes free_kb need_kb
  tarball_bytes="$(wc -c < "$TARBALL" 2>/dev/null || echo 0)"
  # Three times the tarball: the compressed upload, the extracted layers, and headroom for the
  # previous image to stay in place until the new one is running.
  need_kb=$(( (tarball_bytes / 1024) * 3 ))

  free_kb="$(ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "df -Pk ${REMOTE_DIR} | tail -1 | awk '{print \$4}'" 2>/dev/null || echo 0)"

  if [ "$free_kb" -lt "$need_kb" ]; then
    echo "REFUSING TO DEPLOY: not enough disk on ${REMOTE_HOST}."
    echo "  free:   $(( free_kb / 1024 )) MB"
    echo "  needed: $(( need_kb / 1024 )) MB (3x the ${IMAGE_NAME} image)"
    echo
    echo "Reclaim space without touching any running service:"
    echo "  ssh -i ${DEPLOY_KEY} ${REMOTE_HOST} 'sudo docker image prune -f; sudo rm -f ${REMOTE_DIR}/*.tgz'"
    echo
    echo "Only if that is not enough, review what else is there before removing anything:"
    echo "  ssh -i ${DEPLOY_KEY} ${REMOTE_HOST} 'sudo docker images -a; sudo du -sh /home/ubuntu/*'"
    exit 1
  fi
  echo "    OK — $(( free_kb / 1024 )) MB free, need ~$(( need_kb / 1024 )) MB."
}

# Runs only after the new container is confirmed up, so the previous image survives until the
# replacement has actually started.
cleanup_server() {
  echo "==> Reclaiming server disk (dangling images + uploaded tarball)..."
  ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" \
    "rm -f ${REMOTE_DIR}/${TARBALL}; sudo docker image prune -f 2>/dev/null || docker image prune -f" \
    | tail -3 || echo "    (cleanup skipped — non-fatal)"
}

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

echo "==> [1/7] Building ${IMAGE_NAME}:latest (--no-cache)"
echo "         NEXT_PUBLIC_BASE_URL           = ${BASE_URL}"
echo "         NEXT_PUBLIC_DEFAULT_REGION     = ${DEFAULT_REGION}"
echo "         NEXT_PUBLIC_GA_MEASUREMENT_ID  = ${GA_MEASUREMENT_ID:-(empty - analytics off)}"
docker build --no-cache \
  --build-arg "BUILD_COMMIT=${BUILD_COMMIT}" \
  --build-arg "BUILD_BRANCH=${BUILD_BRANCH}" \
  --build-arg "BUILD_TREE=${BUILD_TREE}" \
  --build-arg "BUILD_TIME=${BUILD_TIME}" \
  --build-arg "NEXT_PUBLIC_BASE_URL=${BASE_URL}" \
  --build-arg "NEXT_PUBLIC_DEFAULT_REGION=${DEFAULT_REGION}" \
  --build-arg "NEXT_PUBLIC_GA_MEASUREMENT_ID=${GA_MEASUREMENT_ID}" \
  -t "${IMAGE_NAME}:latest" .

# Confirm the value actually landed in the compiled output rather than trusting that the build arg
# was wired through. Advisory only — a miss here may just mean Next arranged the chunks differently,
# so it warns rather than aborting. A hit on localhost is worth stopping to look at.
echo "==> [2/7] Checking the baked-in base URL..."
BAKED="$(docker run --rm --entrypoint sh "${IMAGE_NAME}:latest" -c \
  "grep -rlo 'http://localhost:8000' .next/server 2>/dev/null | head -1" || true)"
if [ -n "$BAKED" ]; then
  echo "    WARNING: found 'http://localhost:8000' inside .next/server ($BAKED)."
  echo "    Check the rendered canonical tag before trusting this deploy."
else
  echo "    OK — no localhost base URL found in the compiled server output."
fi

# Unlike the base URL check above, this one ABORTS. A missing measurement ID produces a site that
# looks completely normal — the tag is simply absent, so there is no rendering fault to notice and
# no error in any log. It shipped twice that way. The only moment it is cheap to catch is here,
# before a 68MB image is copied over the wire.
echo "==> [3/7] Checking the baked-in GA measurement ID..."
if [ -z "${GA_MEASUREMENT_ID}" ]; then
  echo "    SKIPPED — building with analytics off (NEXT_PUBLIC_GA_MEASUREMENT_ID was set empty)."
else
  GA_HITS="$(docker run --rm --entrypoint sh "${IMAGE_NAME}:latest" -c \
    "grep -rl '${GA_MEASUREMENT_ID}' .next/static/chunks 2>/dev/null | wc -l" || echo 0)"
  if [ "${GA_HITS}" -gt 0 ]; then
    echo "    OK — ${GA_MEASUREMENT_ID} found in ${GA_HITS} client chunks."
  else
    echo "REFUSING TO DEPLOY: ${GA_MEASUREMENT_ID} is not in any client chunk."
    echo "The build arg did not reach the bundler, so gtag.js will never load and GA4 will show"
    echo "no traffic — with nothing visibly wrong on the site. Check that the Dockerfile's builder"
    echo "stage still declares ARG NEXT_PUBLIC_GA_MEASUREMENT_ID; Docker ignores an undeclared one."
    exit 1
  fi
fi

echo "==> [4/7] Saving image to ${TARBALL}..."
docker save -o "$TARBALL" "${IMAGE_NAME}:latest"

echo "==> Checking the server has room for this image..."
preflight_disk

# Verify the target BEFORE uploading, and never create it. A directory that isn't there means
# REMOTE_DIR is wrong, not that a directory needs making: `mkdir -p` on a wrong path silently
# produces an empty one, compose then finds no .env, every ${VAR} resolves to "", and the deploy
# fails in confusing ways well after a long build has completed.
echo "==> [5/7] Verifying ${REMOTE_DIR} on ${REMOTE_HOST}..."
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

echo "==> [6/7] Loading image on the server..."
ssh -i "$SSH_KEY" "$REMOTE_HOST" "cd ${REMOTE_DIR} && docker load -i ${TARBALL}"

echo "==> [7/7] Restarting ${SERVICE_NAME}..."
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

  # The chunk check at step [3/7] proves the ID reached the bundler; this proves the tag survived
  # into what a browser is actually served, which is the thing GA4 DebugView reflects.
  if [ -n "${GA_MEASUREMENT_ID}" ]; then
    echo
    echo "==> Checking gtag.js is in the served HTML..."
    if curl -fsS --max-time 20 "${BASE_URL}" | grep -q "gtag/js?id=${GA_MEASUREMENT_ID}"; then
      echo "    OK — the served page loads ${GA_MEASUREMENT_ID}. DebugView should now see traffic."
    else
      echo "    WARNING: the image carries ${GA_MEASUREMENT_ID} but the served page does not load it."
      echo "    The container is probably still running the previous image, or nginx is caching."
    fi
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

# Last, and only now: the container is confirmed running, so the image it replaced is safe to
# collect. Dangling-only - see the note on preflight_disk above for why -a is not used here.
cleanup_server
