import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const bin =
  process.platform === "win32"
    ? join(root, "node_modules", ".bin", "concurrently.cmd")
    : join(root, "node_modules", ".bin", "concurrently");

const child = spawn(
  bin,
  [
    "-k",
    "-n",
    "api,web",
    "-c",
    "blue,green",
    "npm:dev:api",
    "npm:dev:web",
  ],
  {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  },
);

child.on("exit", (code) => process.exit(code ?? 0));
