// Schnelltest der Kernseiten (lokal): node tests/smoke.mjs
// Startet die App selbst (Port 5176), öffnet die lokalen Testseiten in Brave/Chrome (Handybreite)
// und prüft: keine Fehler in der Konsole + erwartete Inhalte sind da.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BROWSERS = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'];
const exe = BROWSERS.find(existsSync);
if (!exe) { console.error('Kein Chrome/Brave gefunden'); process.exit(2); }
const PORT = 5176, URL = `http://localhost:${PORT}`;

// [Seite, Text der da sein muss, Mindestanzahl SVG-Bilder]
const CASES = [
  ['/', 'Freiheit', 0],
  ['/passtest?n=75', '75 Länder', 10],
  ['/laendertest?offen', 'Meine Länder', 3],
  ['/laendertest?kontinente', 'von 7 Kontinenten', 3],
  ['/laendertest?hauptstaedte', 'Wien', 3],
  ['/stempeltest?c=FR,IT', 'FRANKREICH', 5],
];

const srv = spawn('npx', ['vite', 'dev', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
const stop = () => srv.kill();
process.on('exit', stop);
for (let i = 0; i < 60; i++) { try { if ((await fetch(URL + '/')).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); }

const b = await chromium.launch({ executablePath: exe, headless: true });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
let errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto(URL + '/'); await p.waitForTimeout(4000); // erstes Laden der Entwicklungsversion aufwärmen

let bad = 0;
for (const [path, text, svgs] of CASES) {
  errs = [];
  await p.goto(URL + path); await p.waitForTimeout(3000);
  const body = (await p.innerText('body')).replace(/\s+/g, ' '), n = await p.locator('svg').count();
  const why = [];
  if (!body.includes(text)) why.push(`Text „${text}“ fehlt`);
  if (n < svgs) why.push(`nur ${n} Bilder (erwartet ≥ ${svgs})`);
  if (errs.length) why.push('Fehler: ' + errs.slice(0, 2).join(' | '));
  if (why.length) bad++;
  console.log(why.length ? '✗' : '✓', path, why.join('; '));
}
await b.close(); stop();
console.log(bad ? `\n${bad} von ${CASES.length} Seiten mit Problem` : `\nAlle ${CASES.length} Seiten in Ordnung`);
process.exit(bad ? 1 : 0);
