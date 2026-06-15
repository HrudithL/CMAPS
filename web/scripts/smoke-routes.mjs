import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const base = process.argv[2] ?? "http://localhost:5173";
const outDir = join(process.cwd(), "scripts", "screenshots");
const routes = ["/", "/overview", "/methodology", "/plots"];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];

page.on("pageerror", (e) => errors.push(`${page.url()} PAGE: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`${page.url()} CONSOLE: ${m.text()}`);
});

for (const route of routes) {
  const url = `${base}${route}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(route === "/plots" ? 15000 : 8000);

  const state = await page.evaluate(() => ({
    rootChildren: document.getElementById("root")?.childElementCount ?? 0,
    hasSvg: document.querySelectorAll("svg").length,
    textLen: document.body?.innerText?.length ?? 0,
  }));

  const name = route === "/" ? "landing" : route.slice(1);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
  console.log(`OK ${route}`, JSON.stringify(state));
}

console.log("ERRORS:", errors.length ? errors.join("\n") : "(none)");
await browser.close();
