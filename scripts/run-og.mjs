/**
 * Runs the Open Graph generator inside a Node 20 container.
 *
 * This wrapper exists because `docker run -v "$PWD:/app"` in package.json does not work on Windows.
 * npm executes scripts through cmd.exe there regardless of which shell invoked it, so `$PWD` is
 * never expanded and docker receives the literal string — which it rejects as an invalid volume
 * name. The failure is confusing rather than obvious: it looks like a docker problem, not a shell
 * one, and it only appears on one platform.
 *
 * Resolving the path in Node sidesteps the shell entirely and works the same everywhere.
 *
 * The container is still required: @vercel/og reads its bundled font at module scope through a
 * malformed file:// URL that Node 20 tolerates and Node 22+ rejects. See the long note at the top
 * of generate-og-images.mjs.
 */

import { spawnSync } from "node:child_process"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")

// Docker wants forward slashes even on Windows.
const mount = root.split(path.sep).join("/")

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "-v",
    `${mount}:/app`,
    "-w",
    "/app",
    "node:20-alpine",
    "node",
    "scripts/generate-og-images.mjs",
  ],
  {
    stdio: "inherit",
    // Stops MSYS/Git Bash rewriting the container-side /app path into a Windows path.
    env: { ...process.env, MSYS_NO_PATHCONV: "1" },
  }
)

if (result.error) {
  console.error("Could not run docker. Is Docker Desktop started?")
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
