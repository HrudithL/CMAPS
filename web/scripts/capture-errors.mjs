import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:5173/";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];

page.on("pageerror", (e) => errors.push(`PAGE: ${e.message}\n${e.stack ?? ""}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`CONSOLE: ${m.text()}`);
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(12000);

const state = await page.evaluate(() => ({
  rootChildren: document.getElementById("root")?.childElementCount ?? -1,
  title: document.title,
  text: document.body?.innerText?.slice(0, 200) ?? "",
}));

console.log("URL:", url);
console.log("STATE:", JSON.stringify(state, null, 2));
console.log("ERRORS:", errors.length ? errors.join("\n---\n") : "(none)");

await browser.close();
