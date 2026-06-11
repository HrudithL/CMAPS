import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.API_PORT ?? "8000";
const apiDir = join(dirname(fileURLToPath(import.meta.url)), "..", "api");
const python = process.platform === "win32" ? "python" : "python3";

const child = spawn(
  python,
  [
    "-m",
    "uvicorn",
    "main:app",
    "--reload",
    "--host",
    "127.0.0.1",
    "--port",
    port,
  ],
  { cwd: apiDir, stdio: "inherit", shell: process.platform === "win32" },
);

child.on("exit", (code) => process.exit(code ?? 0));
