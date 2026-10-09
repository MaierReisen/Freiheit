/* Erzeugt docs/stempel.html: Bilder-Galerie aller Stempel (Common/Rare/Epic/Legendary je Land + Weltwunder).
   Nutzt die echten Stempel-Funktionen der App (passport.ts), daher immer aktuell.
   Aufruf: node scripts/build-stempel-galerie.mjs  (Datei danach im Browser öffnen) */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { build } from 'esbuild';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stempel-'));
const entry = path.join(tmp, 'entry.ts');
const root = process.cwd();
fs.writeFileSync(entry, `export { stamp, loadScenes, INK_FILTERS, wonderStamp } from '${root}/src/lib/passport';\nexport { WONDERS } from '${root}/src/lib/wonders';\n`);
const out = path.join(tmp, 'bundle.mjs');
await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: { '.json': 'json' }, logLevel: 'error' });
const m = await import(out);
await m.loadScenes();

const names = JSON.parse(fs.readFileSync('src/lib/data/names.json', 'utf8'));
const cont = JSON.parse(fs.readFileSync('src/lib/data/continents.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const css = fs.readFileSync('src/app.css', 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const codes = Object.keys(names).sort((a, b) => names[a].localeCompare(names[b], 'de'));
const T = ['Common', 'Rare', 'Epic', 'Legendary'];
const P = { Common: '70 %', Rare: '20 %', Epic: '8 %', Legendary: '2 %' };
const cell = (s, t) => `<figure class="c${t}"><div class="st" style="color:${s.color}">${s.svg}</div><figcaption>${T[t]}</figcaption></figure>`;

const rows = codes.map((c) => {
	const k = cont.names[cont.byCountry[c]] ?? 'Sonstige';
	return `<section class="row" data-k="${esc(k)}" data-n="${esc((names[c] + ' ' + c).toLowerCase())}"><h3>${esc(names[c])} <small>${c} · ${esc(k)}</small></h3><div class="g">${[0, 1, 2, 3].map((t) => cell(m.stamp(c, 12, '2026-03', t), t)).join('')}</div></section>`;
});
const wonders = m.WONDERS.map((w, i) => {
	const s = m.wonderStamp(w.id, w.name, i);
	return `<figure class="c4"><div class="st" style="color:${s.color}">${s.svg}</div><figcaption>${esc(w.name)}<br><small>${esc(names[w.code])}</small></figcaption></figure>`;
}).join('');
const conts = [...new Set(codes.map((c) => cont.names[cont.byCountry[c]] ?? 'Sonstige'))];

// Farben und Stempel-Stile direkt aus app.css übernehmen
const tokens = [css.match(/:root\{--paper[\s\S]*?--st-brown:#[0-9A-Fa-f]+\}/)?.[0], css.match(/@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{--paper[\s\S]*?--st-brown:#[0-9A-Fa-f]+\}\}/)?.[0],
	css.match(/:root\{--stp:[\s\S]*?\}\}:root\[data-theme="dark"\]\{[^}]*\}/)?.[0]].filter(Boolean).join('\n');
const stampCss = [...css.matchAll(/^\.pp-stamp[^\n]*$/gm)].map((x) => x[0]).filter((l) => !/pp-slot|pp-leg|pp-book|transition|:active/.test(l.slice(0, 60)) || l.startsWith('.pp-stamp ')).join('\n');

fs.writeFileSync('docs/stempel.html', `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Freiheit – Stempel-Galerie</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Figtree:wght@500;700&family=Unbounded:wght@700;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#EDF2F4;--ink:#0D2B3A;--muted:#587080;--line:#D5DFE4;--display:"Unbounded","Arial Black",system-ui,sans-serif;--text:"Figtree",system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#0A1A23;--ink:#E6F0F3;--muted:#8FA8B4;--line:#1D3A4A}}
${tokens}
body{margin:0;background:var(--bg);color:var(--ink);font:15px var(--text)}
header{position:sticky;top:0;z-index:5;background:var(--bg);padding:12px 16px;border-bottom:1px solid var(--line)}
h1{margin:0 0 6px;font:800 18px var(--display)}header p{margin:0 0 8px;color:var(--muted);font-size:13px}
input,select{font:inherit;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);margin-right:6px}
main{max-width:1100px;margin:0 auto;padding:8px 16px 40px}
h2{font:800 16px var(--display);margin:28px 0 4px}
.row{content-visibility:auto;contain-intrinsic-size:auto 230px;padding:10px 0;border-bottom:1px solid var(--line)}
h3{margin:0 0 6px;font-size:16px}h3 small{color:var(--muted);font-weight:500;font-size:12px;margin-left:6px}
.g{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.w{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
figure{margin:0;text-align:center;background:var(--paper);border-radius:12px;padding:10px 6px 6px;border:1px solid var(--line)}
.st{display:flex;justify-content:center;align-items:flex-end;height:170px}
figcaption{margin-top:6px;font-size:12px;font-weight:700}figcaption small{font-weight:500;color:var(--muted)}
.c0 figcaption{color:var(--muted)}.c1 figcaption{color:#2F6FB5}.c2 figcaption{color:#7E8892}.c3 figcaption{color:#B07800}.c4 figcaption{color:var(--ink)}
.pp-stamp{display:block;max-width:100%;max-height:168px;width:auto;height:auto}
${stampCss}
.pp-stamp.sp{height:160px;max-width:100%}.pp-stamp.sp.wd{width:100%;height:auto;max-height:160px}.pp-stamp:not(.sp){width:100%;height:100%;max-height:168px}
.hide{display:none}
@media(max-width:640px){.g{grid-template-columns:repeat(2,1fr)}}
</style></head><body>
<svg width="0" height="0" style="position:absolute">${m.INK_FILTERS}</svg>
<header><h1>Stempel-Galerie</h1><p>Version ${pkg.version} · automatisch erzeugt (<code>node scripts/build-stempel-galerie.mjs</code>) · Chancen: Common 70 %, Rare 20 %, Epic 8 %, Legendary 2 %</p>
<input id="q" type="search" placeholder="Land suchen …"><select id="k"><option value="">Alle Kontinente</option>${conts.map((k) => `<option>${esc(k)}</option>`).join('')}</select></header>
<main><h2>Weltwunder (Sondersammlung)</h2><div class="w">${wonders}</div><h2>Länder (${codes.length})</h2>${rows.join('\n')}</main>
<script>const q=document.getElementById('q'),k=document.getElementById('k'),R=[...document.querySelectorAll('.row')];
function f(){const s=q.value.trim().toLowerCase();R.forEach(r=>r.classList.toggle('hide',!!((s&&!r.dataset.n.includes(s))||(k.value&&r.dataset.k!==k.value))))}q.oninput=k.onchange=f;</script></body></html>`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('docs/stempel.html', (fs.statSync('docs/stempel.html').size / 1e6).toFixed(1) + ' MB');
