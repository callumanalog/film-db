/**
 * Opens the app in Chromium/Chrome with a fixed mobile layout viewport (412×892 by default)
 * and device pixel ratio (MOBILE_DPR, default 2.625) so sizing is closer to a typical phone
 * than the Cursor Simple Browser panel.
 *
 * Usage: npm run open:mobile
 *        MOBILE_DPR=3 MOBILE_HEIGHT=915 npm run open:mobile
 *        npm run open:mobile -- http://localhost:3001
 */
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000";
const width = Number.parseInt(process.env.MOBILE_WIDTH ?? "412", 10);
const height = Number.parseInt(process.env.MOBILE_HEIGHT ?? "892", 10);
const dpr = Number.parseFloat(process.env.MOBILE_DPR ?? "2.625");

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: false });
} catch {
  browser = await chromium.launch({ headless: false });
}

const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: dpr,
  isMobile: true,
  hasTouch: true,
});

const page = await context.newPage();
await page.goto(url);

await new Promise((resolve) => {
  browser.on("disconnected", resolve);
});
