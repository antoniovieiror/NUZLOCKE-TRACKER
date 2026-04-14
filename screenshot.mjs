import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const url = process.argv[2];
const label = process.argv[3] || null;

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label]');
  process.exit(1);
}

const screenshotsDir = path.join(process.cwd(), 'temporary screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Auto-increment
const existing = fs.readdirSync(screenshotsDir)
  .map(f => {
    const match = f.match(/^screenshot-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;

const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;
const outputPath = path.join(screenshotsDir, filename);

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

try {
  execFileSync(CHROME, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-software-rasterizer',
    `--screenshot=${outputPath}`,
    '--window-size=1280,900',
    '--hide-scrollbars',
    url,
  ], { timeout: 30000, stdio: 'pipe' });

  console.log(`Saved: ${outputPath}`);
} catch (err) {
  console.error('Chrome screenshot failed:', err.message);
  process.exit(1);
}
