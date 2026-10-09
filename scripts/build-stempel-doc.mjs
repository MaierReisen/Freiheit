/* Erzeugt docs/STEMPEL.md: alle Stempel aller Länder, Seltenheit, Weltwunder, Abzeichen, Ränge.
   Liest die Quelldateien (passport.ts, scenes.ts, special.svelte.ts, wonders.ts, badges.ts) – nichts von Hand pflegen.
   Aufruf: node scripts/build-stempel-doc.mjs */
import fs from 'fs';
const rd = (f) => fs.readFileSync(f, 'utf8');
const P = rd('src/lib/passport.ts'), S = rd('src/lib/scenes.ts'), SP = rd('src/lib/special.svelte.ts'), W = rd('src/lib/wonders.ts'), B = rd('src/lib/badges.ts');
const names = JSON.parse(rd('src/lib/data/names.json'));
const cont = JSON.parse(rd('src/lib/data/continents.json'));
const CONT = cont.byCountry, CN = cont.names;
const pkg = JSON.parse(rd('package.json'));
const sec = (t, a, b) => { const i = t.indexOf(a), j = t.indexOf(b, i + 1); return t.slice(i, j < 0 ? undefined : j); };
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');

/* ---- Länder-Daten ---- */
const shortMap = Object.fromEntries([...sec(P, 'const SHORT', 'const COLORS').matchAll(/([A-Z]{2}): '([^']+)'/g)].map((m) => [m[1], m[2]]));
const defs = {};
for (const m of sec(P, 'const DEFS', 'const SHORT').matchAll(/^\t([A-Z]{2}): \{ f: '(\w+)', c: '(\w+)'(?:, short: '([^']+)')? \}/gm)) defs[m[1]] = { f: m[2], c: m[3], short: m[4] };
const commentMap = (text, open) => {
	const out = {};
	for (const m of text.matchAll(new RegExp(`^\\t// (.*)\\n\\t([A-Z]{2}): ${open}`, 'gm'))) out[m[2]] = m[1].replace(/^[^:]+:\s*/, '');
	return out;
};
const motifTxt = commentMap(sec(P, 'const MOTIFS', 'const CONT_MOTIFS'), '\\(\\) =>');
/* Motive ohne Kommentar im Code (beim Anlegen neuer Motive dort einen Kommentar „// Land: Beschreibung“ setzen, dann entfällt das hier) */
Object.assign(motifTxt, { CA: 'Ahornblatt', NO: 'Wikingerschiff auf Wellen', FR: 'Eiffelturm mit Herz', IT: 'Kolosseum', GR: 'Tempel mit Säulen am Meer', EG: 'Pyramiden mit Sonne', JP: 'Fuji mit Sonne', AU: 'Opernhaus Sydney mit Sternen' });
motifTxt.ZM ??= motifTxt.ZW;
const sceneTxt = commentMap(sec(S, 'export const SCENES', 'export const TIERED'), '\\(\\) =>');
const tierTxt = commentMap(sec(S, 'export const TIERED', 'export const WIDE'), '\\[');
const wideKeys = new Set([...sec(S, 'export const WIDE', 'export const WONDER').matchAll(/^\t([A-Z]{2}): \(\) =>/gm)].map((m) => m[1]));
const tieredKeys = new Set([...sec(S, 'export const TIERED', 'export const WIDE').matchAll(/^\t([A-Z]{2}): \[/gm)].map((m) => m[1]));

/* gleiche Rückfall-Regeln wie passport.ts stamp() */
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const COLORS = ['teal', 'coral', 'gold', 'blue', 'plum', 'green', 'red', 'navy', 'brown'];
const GENERIC = ['circle', 'scallop', 'zig', 'oct', 'hex', 'shield', 'diamond', 'perf', 'banner', 'arch'];
const TWO = ['oct', 'hex', 'shield', 'perf', 'arch', 'tag', 'notch'];
const FARBE = { teal: 'Türkis', coral: 'Koralle', gold: 'Gold', blue: 'Blau', plum: 'Pflaume', green: 'Grün', red: 'Rot', navy: 'Marine', brown: 'Braun' };
const FORM = { circle: 'Kreis', scallop: 'Zackenkreis', zig: 'Zickzack', oct: 'Achteck', hex: 'Sechseck', shield: 'Wappen', diamond: 'Raute', perf: 'Briefmarkenrand', banner: 'Banner', arch: 'Bogen', tag: 'Etikett', notch: 'Kerbe', oval: 'Oval', tri: 'Dreieck', rrect: 'Rundrechteck' };

const codes = Object.keys(names).sort((a, b) => names[a].localeCompare(names[b], 'de'));
const rows = codes.map((c) => {
	const d = defs[c], h = hash(c);
	const short = (d?.short ?? shortMap[c] ?? names[c]);
	const f = d?.f ?? (short.length > 13 ? TWO[h % TWO.length] : GENERIC[h % GENERIC.length]);
	const col = d?.c ?? COLORS[(h >>> 3) % COLORS.length];
	const parts = (tierTxt[c] ?? '').split(' – ');
	const three = parts.length === 3;
	if (three && /^(mit|und|in|im|am|bei|über|vor) /.test(parts[1])) parts[1] = parts[0].split(' ')[0] + ' ' + parts[1];
	return {
		c, name: names[c], cont: CN[CONT[c]] ?? 'ohne', short, f: FORM[f] ?? f, col: FARBE[col] ?? col,
		motif: motifTxt[c] ?? '',
		rare: three ? parts[0] : tierTxt[c] ?? '',
		epic: wideKeys.has(c) ? (three ? parts[1] : 'eigenes Querbild') : '–',
		leg: three && !parts[2].startsWith('(Legendary') ? parts[2] : (sceneTxt[c] ?? tierTxt[c] ?? '') + (three ? ' (bisheriges Bild)' : ''),
		old: !!sceneTxt[c], tiered: tieredKeys.has(c)
	};
});

/* ---- Ränge ---- */
const ranks = [...sec(P, 'const RANK_STEPS', 'const LAST').matchAll(/\{ n: (\d+), name: '([^']+)', icon: '([^']+)', say: '([^']+)'/g)].map((m) => ({ n: m[1], name: m[2], icon: m[3], say: m[4] }));
const last = sec(P, 'const LAST', 'const rankCache').match(/name: '([^']+)', icon: '([^']+)'/);

/* ---- Chancen ---- */
const ch = SP.match(/CHANCE = \{ rare: ([\d.]+), epic: ([\d.]+), legend: ([\d.]+) \}/);
const pct = (x) => Math.round(+x * 100);
const rare = pct(ch[1]), epic = pct(ch[2]), leg = pct(ch[3]), common = 100 - rare - epic - leg;

/* ---- Weltwunder ---- */
const wonders = [...W.matchAll(/\{ id: '(\w+)', name: '([^']+)', code: '(\w+)', place: '([^']+)' \}/g)].map((m) => ({ id: m[1], name: m[2], code: m[3], place: m[4] }));

/* ---- Abzeichen ---- */
const SIZE = { 'MICRO.size': 7, 'POLAR.size': 8, 'eight.size': 4 };
const tierStr = (t) => t.split(',').map((x) => x.trim()).map((x) => SIZE[x] ?? (x === '1e9' ? '1 Mrd.' : x === '3e9' ? '3 Mrd.' : x === '5e9' ? '5 Mrd.' : x)).join(' / ');
const bsec = sec(B, 'function defs(', 'export function badges');
const badges = [];
for (const m of bsec.matchAll(/id: '(\w+)',\s*name: '([^']+)',\s*icon: '([^']+)',\s*what: '([^']+)',\s*tiers: \[([^\]]+)\]/g)) badges.push({ id: m[1], name: m[2], icon: m[3], what: m[4], tiers: tierStr(m[5]) });
const contB = [...B.matchAll(/^\t([A-Z]{2}): \['([^']+)', '([^']+)'\]/gm)].map((m) => ({ k: m[1], name: m[2], icon: m[3] }));
for (const b of contB) badges.push({ id: 'c' + b.k, name: b.name, icon: b.icon, what: `Länder in ${CN[b.k]} (¼ / ½ / alle)`, tiers: 'ein Viertel / die Hälfte / alle Länder des Kontinents' });
const badgesOut = badges.filter((b, i, a) => a.findIndex((x) => x.id === b.id) === i);

/* ---- Dokument ---- */
const L = [];
const push = (...x) => L.push(...x);
push(`# Stempel – Übersicht`, '',
	`> Automatisch erzeugt aus dem Code (App-Version ${pkg.version}). Nicht von Hand ändern, sondern neu erzeugen: \`node scripts/build-stempel-doc.mjs\`.`, '', '> **Bilder aller Stempel:** [stempel.html](stempel.html) öffnen (Galerie mit Suche; Common, Rare, Epic, Legendary je Land + Weltwunder).', '',
	'## Inhalt', '', '1. So funktioniert der Pass', '2. Seltenheit der Stempel', '3. Ränge', '4. Weltwunder', '5. Abzeichen', `6. Alle ${rows.length} Länderstempel (nach Kontinent)`, '7. Stempel-Technik', '');

push('## 1. So funktioniert der Pass', '',
	'- Jedes bereiste Land bekommt im Reisepass einen **Stempel** mit Landesnamen, Einreisedatum (Monat.Jahr) und fortlaufender Nummer.',
	'- Der Pass hat drei Reiter: **Stempel**, **Weltwunder**, **Abzeichen**. Er öffnet auf der Seite mit den neuesten Stempeln; neue Länder werden beim Öffnen nacheinander gestempelt.',
	'- Jeder Stempel hat ein **eigenes Motiv** (Bauwerk, Tier oder Naturwunder), eine eigene Rahmenform und Stempelfarbe. Länder ohne feste Zuordnung bekommen Form und Farbe nach einem festen Zufall pro Länderkürzel (immer gleich).',
	'- Stempel antippen öffnet die Länderseite. Das Teilen-Symbol erzeugt ein Bild (Pass-Umschlag oder Stempel-Collage) ohne Namen.', '');

push('## 2. Seltenheit der Stempel', '',
	'Jedes Land wird **einmal**, beim ersten Öffnen des Passes, ausgelost. Das Los gilt dauerhaft und auf allen Geräten (gespeichert im Konto, Spalte `special`; erstes Gerät gewinnt).', '',
	'| Stufe | Chance | Aussehen | Bild |', '|---|---|---|---|',
	`| **Common** | ${common} % | Normaler Stempel in Tinte, Rahmenform und Motiv des Landes | Motiv (Abschnitt 6, „Motiv“) |`,
	`| **Rare** | ${rare} % | Eingeklebte Briefmarke, gezähntes Papier, getöntes Bild, Länder-Nr. als Nennwert, Beschriftung RARE | Hochformat, eigenes Bild pro Land |`,
	`| **Epic** | ${epic} % | Breite Briefmarke (Querformat) mit metallischem **Silberrand**, schräg aufgeklebt mit Silberglanz, Beschriftung EPIC | Querbild, eigenes Bild pro Land |`,
	`| **Legendary** | ${leg} % | Prachtvolle Briefmarke mit **Goldrand**, schwebt beim Aufkleben, Goldschimmer und Funken, Beschriftung LEGENDARY | Hochformat, aufwendigste Szene pro Land |`,
	'| **Weltwunder** | Sondersammlung | Hologramm-Briefmarke mit Regenbogen-Schein, römische Ziffer I–VII, Beschriftung WELTWUNDER | siehe Abschnitt 4 |', '',
	`Bei ${rows.length} Ländern ist im Schnitt etwa ${Math.round(rows.length * rare / 100)} Mal Rare, ${Math.round(rows.length * epic / 100)} Mal Epic und ${Math.round(rows.length * leg / 100)} Mal Legendary zu erwarten.`,
	'Alle Länder haben alle drei Sonderbilder (Rare, Epic, Legendary) – egal welche Stufe ausgelost wird, es gibt immer ein eigenes Bild.', '',
	'**Weiteres:** Die Zeile über den Stempelseiten zeigt die Anzahl Rare / Epic / Legendary; antippen öffnet die Legende mit den vier Stufen (Beispiel Japan). Vorschau zum Ausprobieren: Adresse mit `?spezial` (alle Rare), `?spezial=epic`, `?spezial=legende`.', '');

push('## 3. Ränge', '', 'Der Rang richtet sich nach der Zahl bereister Länder. Der letzte Rang braucht **alle** Länder der gewählten Länderliste (194–198, je nach Einstellung).', '',
	'| ab Länder | Rang | Spruch |', '|---:|---|---|');
for (const r of ranks) push(`| ${r.n} | ${r.icon} ${r.name} | ${esc(r.say)} |`);
push(`| alle | ${last[2]} ${last[1]} | Jedes Land der Erde. Du hast die ganze Welt gesehen. |`, '',
	'Der Pass-Umschlag ändert sein Aussehen in 8 Stufen (0 = noch kein Rang … 7 = Weltmeister; je zwei Ränge teilen sich eine Stufe). Rang-Aufstieg zeigt eine Feier-Karte.', '');

push('## 4. Weltwunder', '',
	'Eigene Seite im Pass mit den **neuen 7 Weltwundern** (Wahl von 2007). Ein „?“-Platz erscheint, sobald das Land bereist ist. Gesammelt wird per „Hier war ich“ – das Land allein reicht nicht. Sind alle 7 da, kommt eine Feier-Karte.', '',
	'| Nr. | Weltwunder | Land | Ort |', '|---|---|---|---|');
const R = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
wonders.forEach((w, i) => push(`| ${R[i]} | ${w.name} | ${names[w.code]} (${w.code}) | ${w.place} |`));
push('');

push('## 5. Abzeichen', '',
	'Sonderauszeichnungen auf der Visa-Seite im Pass, in bis zu drei Stufen **Bronze / Silber / Gold** (Abzeichen mit nur einer Stufe sind gleich Gold). Berechnet aus bereisten Ländern, Länderfakten und Einreisedaten. Eine neue Stufe löst eine Feier-Karte aus.', '',
	'| Abzeichen | Gezählt wird | Stufen (Bronze / Silber / Gold) |', '|---|---|---|');
for (const b of badgesOut) push(`| ${b.icon} ${b.name} | ${esc(b.what)} | ${esc(b.tiers)} |`);
push('');

push(`## 6. Alle ${rows.length} Länderstempel`, '',
	'Spalten: **Stempelname** = Text im Stempel · **Form/Farbe** = Rahmen und Stempelfarbe · **Common** = Motiv des normalen Stempels · **Rare / Epic / Legendary** = Bild der jeweiligen Briefmarke.', '');
const conts = ['Europa', 'Asien', 'Afrika', 'Nordamerika', 'Südamerika', 'Ozeanien', 'Antarktis'];
const byCont = (k) => rows.filter((r) => r.cont === k);
const rest = rows.filter((r) => !conts.includes(r.cont));
for (const k of [...conts, ...(rest.length ? ['ohne'] : [])]) {
	const rs = k === 'ohne' ? rest : byCont(k);
	if (!rs.length) continue;
	push(`### ${k === 'ohne' ? 'Ohne Kontinent' : k} (${rs.length})`, '', '| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |', '|---|---|---|---|---|---|---|');
	for (const r of rs) push(`| ${esc(r.name)} (${r.c}) | ${esc(r.short)} | ${r.f} / ${r.col} | ${esc(r.motif || '–')} | ${esc(r.rare)} | ${esc(r.epic)} | ${esc(r.leg)} |`);
	push('');
}
const oldN = rows.filter((r) => r.old).length;
push('## 7. Stempel-Technik (Kurzfassung)', '',
	'- `src/lib/passport.ts`: Ränge, Stempel-Rahmen (15 Formen), Motive (`MOTIFS`), Farben/Formen je Land (`DEFS`), Kurznamen (`SHORT`), Weltwunder-Briefmarke.',
	'- `src/lib/scenes.ts` (groß, wird nachgeladen): Bilder `TIERED` (Rare + Legendary, Hochformat 180 × 170), `WIDE` (Epic, Querformat 270 × 130), `WONDER` (Weltwunder), `SCENES` (' + oldN + ' ältere Bilder, die als Legendary dienen).',
	'- `src/lib/special.svelte.ts`: Auslosung und Chancen. `src/lib/wonders.ts`: Weltwunder. `src/lib/badges.ts`: Abzeichen.',
	'- Bildecke oben links (x < 48, y < 34) bleibt frei für die Länder-Nr.',
	'- Aufkleb-Animation je Stufe in `src/lib/markfx.ts`.', '');
fs.writeFileSync('docs/STEMPEL.md', L.join('\n'));
console.log('docs/STEMPEL.md', rows.length, 'Länder,', badgesOut.length, 'Abzeichen,', rows.filter((r) => !r.motif).map((r) => r.c).join(' '));
