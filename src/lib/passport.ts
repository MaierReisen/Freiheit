import { CONT, nameOf } from './countries';
import type * as Scenes from './scenes';

/* Reisepass: Ränge und Stempel. Ein Stempel ist ein SVG-Text (Rahmen + Motiv + Name/Datum), eingefärbt über
   currentColor. Rund 140 Länder haben ein eigenes Motiv, alle anderen einen schlichten Stempel mit Regions- bzw.
   Kontinent-Symbol. Das Tinten-Aussehen kommt aus gemeinsamen Filtern (#pf0–#pf3, einmal in der Pass-Ansicht). */

/* ---------- Ränge ---------- */
export interface Rank {
	n: number;
	name: string;
	icon: string;
	/** kurzer Ansporn für diesen Rang */
	say: string;
}
/* Ränge bis zum letzten Land: der höchste Rang braucht alle Länder der gewählten Länderliste (194–198) */
const RANK_STEPS: Rank[] = [
	{ n: 1, name: 'Fernweh', icon: '🌱', say: 'Der erste Stempel ist gesetzt – das Fernweh hat dich gepackt.' },
	{ n: 3, name: 'Grenzgänger', icon: '🎟️', say: 'Drei Länder: Grenzen sind für dich nur Linien auf der Karte.' },
	{ n: 5, name: 'Entdecker', icon: '🧭', say: 'Fünf Länder – jetzt beginnt das Entdecken erst richtig.' },
	{ n: 10, name: 'Weltenbummler', icon: '🎒', say: 'Zweistellig! Dein Rucksack kennt schon einige Flughäfen.' },
	{ n: 20, name: 'Vielflieger', icon: '✈️', say: 'Zwanzig Länder – du sammelst Bordkarten wie andere Briefmarken.' },
	{ n: 30, name: 'Kartograf', icon: '🗺️', say: 'Deine Karte füllt sich: Du zeichnest deine eigene Welt.' },
	{ n: 50, name: 'Globetrotter', icon: '🌍', say: 'Fünfzig Länder – ein Viertel der Welt trägt deinen Fußabdruck.' },
	{ n: 75, name: 'Weltumsegler', icon: '⛵', say: 'Du kennst mehr Länder als die meisten Menschen je sehen.' },
	{ n: 100, name: 'Club der 100', icon: '💯', say: 'Hundert Länder – willkommen in einem sehr kleinen Club.' },
	{ n: 125, name: 'Nomade', icon: '🐪', say: 'Zuhause ist für dich, wo der nächste Stempel wartet.' },
	{ n: 150, name: 'Himmelsstürmer', icon: '🦅', say: 'Drei Viertel der Welt – der Rest wird knapp.' },
	{ n: 175, name: 'Legende', icon: '🏆', say: 'Nur noch eine Handvoll Länder trennt dich vom Ziel.' }
];
const LAST = { name: 'Weltmeister', icon: '👑', say: 'Jedes Land der Erde. Du hast die ganze Welt gesehen.' };
const rankCache = new Map<number, Rank[]>();
/** Alle Ränge für eine Länderliste mit `total` Ländern (letzter Rang = alle Länder) */
export function ranks(total: number): Rank[] {
	let r = rankCache.get(total);
	if (!r) rankCache.set(total, (r = [...RANK_STEPS.filter((x) => x.n < total), { n: total, ...LAST }]));
	return r;
}
/** Index des erreichten Rangs (-1 = noch keiner) */
export const rankIndex = (count: number, total: number) => ranks(total).filter((r) => count >= r.n).length - 1;

/** Stand für Kachel und Pass: Rang, nächster Rang, Fortschritt 0..1 dazwischen */
export function rankInfo(count: number, total: number) {
	const all = ranks(total),
		i = rankIndex(count, total);
	const rank = i >= 0 ? all[i] : null;
	const next = all[i + 1] ?? null;
	const from = rank?.n ?? 0;
	const p = next ? (count - from) / (next.n - from) : 1;
	return { rank, next, left: next ? next.n - count : 0, p: Math.max(0, Math.min(1, p)), tier: coverTier(i, all.length) };
}

/** Aussehen des Pass-Umschlags: 0 = noch kein Rang … 7 = Weltmeister (je zwei Ränge teilen sich eine Stufe) */
export const coverTier = (rankIdx: number, rankCount: number) =>
	rankIdx < 0 ? 0 : rankIdx >= rankCount - 1 ? 7 : Math.min(6, 1 + (rankIdx >> 1));

/* ---------- Datum ---------- */
const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
/** "2016-10" → "10.2016", "2016" → "2016" (für den Stempel) */
export const stampDate = (e?: string) => (e ? (e.length === 7 ? `${e.slice(5)}.${e.slice(0, 4)}` : e) : '');
/** "2016-10" → "Okt. 2016" (für Texte) */
export const longDate = (e?: string) => (e ? (e.length === 7 ? `${MON[+e.slice(5) - 1]} ${e.slice(0, 4)}` : e) : '');
export const yearOf = (e?: string) => (e ? +e.slice(0, 4) : 0);

/* ---------- Zeichenhilfen ---------- */
const TINT = 'fill="currentColor" fill-opacity=".09"';
const DOTS = 'stroke-width="1.6" stroke-dasharray="1 5"';
const f1 = (v: number) => +v.toFixed(1);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const waves = (x: number, y: number, n: number, w = 14, h = 5) => {
	let d = `M${x},${y}`;
	for (let i = 0; i < n; i++) d += ` q${w / 2},${-h} ${w},0`;
	return d;
};
const scallop = (n: number, r: number, b: number) => {
	let d = '';
	for (let i = 0; i <= n; i++) {
		const a = (i * 2 * Math.PI) / n,
			x = f1(100 + r * Math.cos(a)),
			y = f1(100 + r * Math.sin(a));
		d += i ? ` A${b},${b} 0 0 1 ${x},${y}` : `M${x},${y}`;
	}
	return d + 'Z';
};
const zig = (n: number, r1: number, r2: number) => {
	let d = '';
	for (let i = 0; i <= 2 * n; i++) {
		const r = i % 2 ? r2 : r1,
			a = (i * Math.PI) / n;
		d += (i ? 'L' : 'M') + f1(100 + r * Math.cos(a)) + ',' + f1(100 + r * Math.sin(a));
	}
	return d + 'Z';
};
const star = (x: number, y: number, r: number) => {
	let d = '';
	for (let i = 0; i < 10; i++) {
		const a = -Math.PI / 2 + (i * Math.PI) / 5,
			rr = i % 2 ? r * 0.45 : r;
		d += (i ? 'L' : 'M') + f1(x + rr * Math.cos(a)) + ',' + f1(y + rr * Math.sin(a));
	}
	return `<path d="${d}Z" fill="currentColor" stroke="none"/>`;
};
const sun = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;

/** Schriftgröße so, dass der Text in die Breite passt (Unbounded ist breit: ca. 0,8 em je Großbuchstabe) */
const fit = (txt: string, maxW: number, base: number, k = 0.8) => f1(Math.max(6.5, Math.min(base, maxW / (Math.max(1, txt.length) * k))));
/** Lange Namen auf zwei Zeilen (an einem Leerzeichen/Bindestrich nahe der Mitte) */
function split(name: string): string[] {
	if (name.length <= 13) return [name];
	const cuts = [...name.matchAll(/[ -]/g)].map((m) => m.index!);
	if (!cuts.length) return [name];
	const mid = name.length / 2;
	const c = cuts.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
	return [name.slice(0, c + (name[c] === '-' ? 1 : 0)).trim(), name.slice(c + 1).trim()];
}
function nameBlock(name: string, x: number, y: number, maxW: number, base: number) {
	const lines = split(name);
	if (lines.length === 1) return `<text class="d" x="${x}" y="${y}" font-size="${fit(name, maxW, base)}" text-anchor="middle">${esc(name)}</text>`;
	const fs = Math.min(...lines.map((l) => fit(l, maxW, base * 0.85)));
	// zweite Zeile steht, wo sonst die eine Zeile stünde – die erste rückt nach oben
	return lines.map((l, i) => `<text class="d" x="${x}" y="${f1(y + (i - 1) * fs * 1.15)}" font-size="${fs}" text-anchor="middle">${esc(l)}</text>`).join('');
}
const pill = (cx: number, y: number, txt: string, fs = 11.5) => {
	const w = Math.max(56, txt.length * fs * 0.62 + 18);
	return `<rect x="${f1(cx - w / 2)}" y="${y}" width="${f1(w)}" height="22" rx="11" fill="currentColor" stroke="none"/><text class="k" x="${cx}" y="${y + 15.5}" font-size="${fs}" text-anchor="middle">${esc(txt)}</text>`;
};
const small = (x: number, y: number, txt: string, fs = 11) => (txt ? `<text class="t" x="${x}" y="${y}" font-size="${fs}" text-anchor="middle">${esc(txt)}</text>` : '');

/* ---------- Motive: SVG-Inhalt + Rahmen-Box [x, y, b, h] in eigenen Koordinaten ---------- */
type Motif = { svg: string; box: [number, number, number, number] };
const M = (svg: string, box: [number, number, number, number] = [0, 0, 100, 80]): Motif => ({ svg, box });
const GROUND = '<path d="M2,76 H98" stroke-width="3.6"/>';
const SOLID = 'fill="currentColor" stroke="none"';
const HALF = 'fill="currentColor" fill-opacity=".3"';
const PAPER = 'fill="var(--paper)" stroke="none"';
/** Linie mit Papier-Rand: bleibt auch vor vollen Flächen sichtbar */
const halo = (d: string, w: number) => `<path d="${d}" stroke="var(--paper)" stroke-width="${w + 2.6}"/><path d="${d}" stroke-width="${w}"/>`;

const MOTIFS: Record<string, () => Motif> = {
	CA: () =>
		M(
			'<path d="M100,40 L108,58 L120,52 L116,78 L132,66 L136,76 L148,72 L142,92 L152,98 L126,116 L130,128 L104,124 L104,150 L96,150 L96,124 L70,128 L74,116 L48,98 L58,92 L52,72 L64,76 L68,66 L84,78 L80,52 L92,58 Z" fill="currentColor" stroke="currentColor" stroke-width="5"/>',
			[44, 36, 112, 118]
		),
	NO: () =>
		M(
			`<path d="M110,92 V34 M80,40 H140" stroke-width="3"/><rect x="84" y="40" width="52" height="38" rx="3" stroke-width="2.6"/>
<path d="M94.4,40 h10.4 v38 h-10.4 Z M115.2,40 h10.4 v38 h-10.4 Z" fill="currentColor" stroke="none"/>
<path d="M58,90 L162,90 Q150,104 110,104 Q70,104 58,90 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<path d="M60,91 Q46,78 50,62 q3,-6 9,-2 l-4,3 M160,91 Q174,78 170,64 q-3,-6 -8,-1" stroke-width="3.6"/>
${[72, 85, 98, 122, 135, 148].map((x) => `<circle cx="${x}" cy="85" r="4" stroke-width="2.2"/>`).join('')}
<path d="${waves(46, 110, 9)}" stroke-width="2.6"/>`,
			[44, 32, 132, 82]
		),
	FR: () =>
		M(
			`<path d="M70,26 V36 M67,36 L64,58 L59,84 L50,118 M73,36 L76,58 L81,84 L90,118 M63,58 H77 M56,84 H84 M54,118 Q70,96 86,118" stroke-width="3.4"/>
<path d="M60,84 L74,60 M80,84 L66,60" stroke-width="1.6"/>
<path d="M92,40 c-4,-6 -12,-2 -8,4 l8,8 l8,-8 c4,-6 -4,-10 -8,-4 Z" fill="currentColor" stroke-width="1"/>`,
			[46, 22, 58, 100]
		),
	IT: () => {
		let a = '';
		for (const [t, b] of [
			[72, 92],
			[92, 120]
		])
			for (let x = 30; x <= 94; x += 16) a += `M${x},${b} V${t + 9} a5,5 0 0 1 10,0 V${b} `;
		return M(
			`<path d="M26,120 V70 Q60,58 94,60 L99,66 L106,63 V120 M26,72 H106 M26,92 H106" stroke-width="3"/><path d="${a}" stroke-width="2.2"/><path d="M20,121 H112" stroke-width="4"/>`,
			[18, 56, 96, 68]
		);
	},
	GR: () =>
		M(
			`<path d="M66,96 L100,76 L134,96 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M66,101 H134" stroke-width="3.4"/>
<path d="M75,106 V126 M92,106 V126 M108,106 V126 M125,106 V126" stroke-width="5"/><path d="M62,131 H138" stroke-width="4"/>
<path d="${waves(72, 142, 4)}" stroke-width="2.6"/>`,
			[60, 72, 80, 74]
		),
	EG: () =>
		M(
			`<circle cx="110" cy="74" r="9" fill="currentColor" stroke="none"/><path d="M110,58 V54 M122,62 L125,59 M98,62 L95,59 M126,74 H130 M94,74 H90" stroke-width="2.6"/>
<path d="M62,140 L98,96 L134,140 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M116,140 L138,114 L160,140" stroke-width="3"/><path d="M98,96 L106,140" stroke-width="2"/>
<path d="M56,140 H164" stroke-width="3.6"/>`,
			[54, 50, 112, 92]
		),
	JP: () =>
		M(
			`<circle cx="122" cy="80" r="11" fill="currentColor" stroke="none"/>
<path d="M64,84 q0,-7 7,-7 q2,-6 9,-4 q6,0 6,6 q5,0 5,5 Z" stroke-width="2.4"/>
<path d="M60,126 L86,95 L92,101 L100,94 L108,101 L114,95 L140,126 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<path d="M86,95 L94,86 L106,86 L114,95" stroke-width="3.4"/><path d="${waves(68, 138, 4, 16)}" stroke-width="2.6"/>`,
			[58, 62, 84, 82]
		),
	AU: () =>
		M(
			`${[
				[152, 34],
				[164, 26],
				[176, 38],
				[162, 46],
				[186, 30]
			]
				.map(([x, y]) => `<path d="M${x},${y - 4} L${x + 1.2},${y - 1.2} L${x + 4},${y} L${x + 1.2},${y + 1.2} L${x},${y + 4} L${x - 1.2},${y + 1.2} L${x - 4},${y} L${x - 1.2},${y - 1.2} Z" fill="currentColor" stroke="none"/>`)
				.join('')}
<path d="M134,98 Q140,72 160,64 Q152,84 154,98 M152,98 Q162,68 186,60 Q174,84 176,98 M174,98 Q184,78 204,74 Q194,90 196,98" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M128,99 H210" stroke-width="3.6"/><path d="${waves(136, 112, 5, 14, 4)}" stroke-width="2.4"/>`,
			[126, 20, 88, 98]
		),
	// Spanien: Fächer und Sonne
	ES: () => {
		let ribs = '';
		for (let a = 200; a <= 340; a += 20) {
			const r = (a * Math.PI) / 180;
			ribs += `M44,66 L${f1(44 + 38 * Math.cos(r))},${f1(66 + 38 * Math.sin(r))} `;
		}
		return M(`${sun(82, 16, 9)}<path d="M6,66 A38,38 0 0 1 82,66 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="${ribs}" stroke-width="1.8"/>
<path d="M6,66 A38,38 0 0 1 82,66" stroke-width="2" stroke-dasharray="3 4" transform="translate(44,66) scale(.8) translate(-44,-66)"/><path d="M40,66 L44,78 L48,66" stroke-width="3"/>`);
	},
	// Portugal: Straßenbahn
	PT: () =>
		M(`<path d="M28,4 L98,10 M52,26 L62,7" stroke-width="2"/><rect x="14" y="26" width="72" height="36" rx="6" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
${[20, 36, 52, 68].map((x) => `<rect x="${x}" y="32" width="12" height="11" rx="2" fill="currentColor" stroke="none"/>`).join('')}
<path d="M14,51 H86" stroke-width="2"/>${sun(28, 66, 5)}${sun(72, 66, 5)}<path d="M2,74 H98" stroke-width="3.4"/>`),
	// Großbritannien: Big Ben
	GB: () =>
		M(`<path d="M38,22 L50,4 L62,22 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/><path d="M50,4 V0" stroke-width="2"/>
<rect x="40" y="22" width="20" height="54" fill="currentColor" fill-opacity=".3" stroke-width="3"/><circle cx="50" cy="33" r="7" stroke-width="2.4"/><path d="M50,33 V28 M50,33 L54,35" stroke-width="2"/>
<path d="M40,46 H60 M40,60 H60 M46,50 V57 M54,50 V57 M46,64 V72 M54,64 V72" stroke-width="2"/>
<path d="M14,76 V64 H30 V76 M70,76 V58 Q78,52 86,58 V76" stroke-width="2.4"/>${GROUND}`),
	// USA: Skyline mit Empire State Building
	US: () =>
		M(`<rect x="6" y="46" width="14" height="30" fill="currentColor" fill-opacity=".3" stroke-width="2.6"/><rect x="22" y="34" width="13" height="42" fill="currentColor" fill-opacity=".3" stroke-width="2.6"/>
<path d="M40,76 V34 H44 V26 H47 V18 H53 V26 H56 V34 H60 V76" fill="currentColor" stroke="currentColor" stroke-width="2"/><path d="M50,18 V3" stroke-width="2.4"/>
<rect x="65" y="40" width="13" height="36" fill="currentColor" fill-opacity=".3" stroke-width="2.6"/><rect x="80" y="54" width="14" height="22" fill="currentColor" fill-opacity=".3" stroke-width="2.6"/>
<path d="M10,52 V70 M16,52 V70 M27,40 V70 M31,40 V70 M70,46 V70 M74,46 V70" stroke-width="1.4" stroke-dasharray="2 3"/>${GROUND}`),
	// Thailand: Tempeldächer
	TH: () =>
		M(`<path d="M50,16 V2" stroke-width="2.4"/><path d="M26,44 Q38,40 50,16 Q62,40 74,44 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<path d="M12,62 Q30,58 50,30 Q70,58 88,62" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M12,62 q-4,-6 0,-11 M88,62 q4,-6 0,-11 M26,44 q-4,-5 0,-9 M74,44 q4,-5 0,-9" stroke-width="2.4"/>
<rect x="22" y="62" width="56" height="14" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M44,76 V68 Q50,62 56,68 V76" stroke-width="2.4"/>${GROUND}`),
	// Türkei: Heißluftballons über Kappadokien
	TR: () =>
		M(`<path d="M16,28 A18,18 0 1 1 52,28 Q50,40 40,48 H28 Q18,40 16,28 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M34,10 Q24,28 30,48 M34,10 Q44,28 38,48" stroke-width="2"/><path d="M29,48 L30,53 M39,48 L38,53" stroke-width="1.6"/><rect x="29" y="53" width="10" height="7" rx="1.5" fill="currentColor" stroke="none"/>
<path d="M66,24 A11,11 0 1 1 88,24 Q87,31 81,36 H73 Q67,31 66,24 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/><path d="M74,36 L75,40 M80,36 L79,40" stroke-width="1.4"/><rect x="74" y="40" width="6" height="5" rx="1" fill="currentColor" stroke="none"/>
<path d="M2,78 Q14,62 26,72 Q34,60 44,70 Q56,58 70,70 Q84,62 98,74" fill="currentColor" fill-opacity=".3" stroke-width="3"/>`),
	// Kroatien: Segelboot an der Adria
	HR: () =>
		M(`<path d="M50,58 V6 L60,9 L50,12" stroke-width="2.4"/><path d="M48,12 V54 H20 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M54,18 V54 H78 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M16,60 H84 L74,70 H26 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/><path d="${waves(6, 77, 6, 15, 5)}" stroke-width="2.6"/>`),
	// Österreich: Berge und Seilbahn
	AT: () =>
		M(`<path d="M2,8 L98,28" stroke-width="1.8"/><path d="M38,15.6 V22" stroke-width="1.8"/><rect x="31" y="22" width="14" height="11" rx="3" fill="currentColor" stroke="none"/>
<path d="M2,76 L30,38 L42,50 L62,22 L98,76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M24,46 L30,38 L36,46 L33,44 L30,47 L27,44 Z M55,32 L62,22 L69,32 L65,30 L62,34 L59,30 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>${GROUND}`),
	// Schweiz: Matterhorn und Kreuz
	CH: () =>
		M(`<path d="M6,76 L40,42 L50,6 L60,30 L70,24 L96,76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M43,30 L50,6 L57,24 L53,22 L50,28 L46,25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<rect x="72" y="2" width="20" height="20" rx="3" fill="currentColor" stroke="none"/><path d="M79.5,5.5H84.5V9.5H88.5V14.5H84.5V18.5H79.5V14.5H75.5V9.5H79.5Z" fill="var(--paper)" stroke="none"/>${GROUND}`),
	// Niederlande: Windmühle und Tulpen
	NL: () => {
		let blades = '';
		for (const [dx, dy] of [
			[1, -1],
			[-1, -1],
			[-1, 1],
			[1, 1]
		]) {
			const ux = dx / Math.SQRT2,
				uy = dy / Math.SQRT2,
				nx = -uy * 7,
				ny = ux * 7,
				p = (d: number, o: number) => `${f1(48 + ux * d + nx * o)},${f1(30 + uy * d + ny * o)}`;
			blades += `<path d="M${p(5, 0)} L${p(30, 0)} L${p(30, 1)} L${p(8, 1)} Z" fill="currentColor" fill-opacity=".3" stroke-width="2"/><path d="M${p(3, 0)} L${p(31, 0)}" stroke-width="2.6"/>`;
		}
		const tulip = (x: number) => `<path d="M${x},76 V64" stroke-width="2"/><path d="M${x - 4},63 Q${x - 4},55 ${x - 2},55 L${x},58 L${x + 2},55 Q${x + 4},55 ${x + 4},63 Z" fill="currentColor" stroke="none"/>`;
		return M(
			`<path d="M36,76 L40,36 H56 L60,76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M38,36 Q48,26 58,36" stroke-width="2.6"/><path d="M44,76 V68 Q48,63 52,68 V76" stroke-width="2.2"/>${blades}<circle cx="48" cy="30" r="3" fill="currentColor" stroke="none"/>${[72, 82, 92, 6, 16].map(tulip).join('')}${GROUND}`
		);
	},
	// Island: Vulkan und Polarlicht
	IS: () =>
		M(`<path d="M60,24 Q70,6 82,16 Q90,22 98,8 M62,34 Q72,18 84,26 Q91,31 98,20" stroke-width="2.6" stroke-dasharray="3 4"/>
<circle cx="42" cy="32" r="5" stroke-width="2.4"/><circle cx="36" cy="22" r="6" stroke-width="2.4"/><circle cx="42" cy="10" r="7" stroke-width="2.4"/>
<path d="M2,76 L34,42 H50 L84,76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M34,42 L38,50 L42,44 L46,50 L50,42" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>${GROUND}`),
	// Marokko: Hufeisenbogen und Laterne
	MA: () =>
		M(`<path d="M14,76 V8 H86 V76" stroke-width="3"/><path d="M14,14 H86" stroke-width="1.6" stroke-dasharray="3 3"/>
<path d="M26,76 V46 C20,32 32,18 50,18 C68,18 80,32 74,46 V76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M50,18 V26" stroke-width="1.8"/><path d="M44,26 H56 L58,36 L50,46 L42,36 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>${GROUND}`),
	// Mexiko: Kaktus und Sonne
	MX: () =>
		M(`${sun(84, 16, 9)}<path d="M84,2 V-2 M98,16 H102 M74,6 L71,3 M94,6 L97,3" stroke-width="2.2"/>
<path d="M44,76 V22 a6,6 0 0 1 12,0 V76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M44,54 H38 a5,5 0 0 1 -5,-5 V36 a4,4 0 0 1 8,0 V46 H44 M56,46 H62 a5,5 0 0 0 5,-5 V28 a4,4 0 0 0 -8,0 V38 H56" stroke-width="3"/>
<path d="M50,26 V72" stroke-width="1.4" stroke-dasharray="2 3"/><path d="M12,76 V62 a4,4 0 0 1 8,0 V76" fill="currentColor" fill-opacity=".3" stroke-width="2.6"/>${GROUND}`),
	// Südafrika: Tafelberg
	ZA: () =>
		M(`${sun(84, 14, 8)}<path d="M28,40 q4,-8 12,-5 q6,-8 16,-3 q8,-6 16,5" stroke-width="2.4"/>
<path d="M2,76 L18,50 L28,42 H74 L82,52 L98,76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M30,50 L34,62 M48,48 L46,64 M64,50 L68,62" stroke-width="1.6"/>${GROUND}`),
	// Indien: Taj Mahal
	IN: () =>
		M(`<path d="M50,22 V10" stroke-width="2"/><path d="M36,50 C30,40 36,28 50,22 C64,28 70,40 64,50 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<path d="M22,50 Q26,40 30,50 M70,50 Q74,40 78,50" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<rect x="20" y="50" width="60" height="26" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M44,76 V64 Q50,56 56,64 V76" stroke-width="2.4"/>
<path d="M28,70 V62 Q31,58 34,62 V70 M66,70 V62 Q69,58 72,62 V70" stroke-width="1.8"/>
<path d="M8,76 V32 H13 V76 M87,76 V32 H92 V76" stroke-width="2.4"/><circle cx="10.5" cy="28" r="3" fill="currentColor" stroke="none"/><circle cx="89.5" cy="28" r="3" fill="currentColor" stroke="none"/>${GROUND}`),
	// Vietnam: Nón lá über Reisfeldern
	VN: () =>
		M(`<path d="M12,44 L50,10 L88,44 Q50,52 12,44 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M31,27 Q50,31 69,27 M21,36 Q50,42 79,36" stroke-width="1.8"/>
<path d="M30,47 Q50,58 70,47" stroke-width="1.6"/>
${[10, 26, 42, 58, 74, 90].map((x) => `<path d="M${x},68 v-7 M${x},68 l-3,-5 M${x},68 l3,-5" stroke-width="1.8"/>`).join('')}
<path d="M2,68 H98" stroke-width="2.4"/><path d="${waves(4, 76, 6, 15, 3)}" stroke-width="2.2"/>`),
	// Indonesien: geteiltes Tempeltor (Bali)
	ID: () =>
		M(`${sun(50, 22, 7)}<path d="M6,76 V48 H11 V38 H17 V28 H24 V16 H32 V6 H42 V76 Z M94,76 V48 H89 V38 H83 V28 H76 V16 H68 V6 H58 V76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M42,70 H58 M42,64 H58" stroke-width="2"/>${GROUND}`),
	// Neuseeland: Silberfarn
	NZ: () => {
		const P = (t: number) => {
			const u = 1 - t;
			return [u * u * 30 + 2 * u * t * 30 + t * t * 80, u * u * 78 + 2 * u * t * 20 + t * t * 6];
		};
		let leaves = '';
		for (let t = 0.14; t < 0.97; t += 0.075) {
			const [x, y] = P(t),
				[x2, y2] = P(t + 0.01),
				dx = x2 - x,
				dy = y2 - y,
				l = Math.hypot(dx, dy),
				ux = dx / l,
				uy = dy / l,
				L = 18 * (1 - t) + 4;
			for (const s of [1, -1]) leaves += `M${f1(x)},${f1(y)} L${f1(x + (ux * 0.5 - uy * s) * L)},${f1(y + (uy * 0.5 + ux * s) * L)} `;
		}
		return M(`<path d="M30,78 Q30,20 80,6" stroke-width="3.4"/><path d="${leaves}" stroke-width="2.6"/>`);
	},
	// Brasilien: Christusstatue und Zuckerhut
	BR: () =>
		M(`<path d="M0,76 Q10,46 22,34 Q30,46 38,76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M22,34 V20 M14,24 H30" stroke-width="2.8"/><circle cx="22" cy="16" r="2.6" fill="currentColor" stroke="none"/>
<path d="M50,76 Q52,42 70,34 Q88,40 92,76 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M34,54 L66,36" stroke-width="1.6"/><rect x="47" y="45" width="7" height="6" rx="1.5" fill="currentColor" stroke="none"/>
<path d="${waves(2, 78, 7, 14, 3)}" stroke-width="2.2"/>`),
	// China: Große Mauer
	CN: () =>
		M(`<path d="M0,80 V70 L22,54 L40,62 L62,40 L84,52 L100,44 V80 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M0,64 L22,48 L40,56 L62,34 L84,46 L100,38" stroke-width="4" stroke-dasharray="3 3" stroke-linecap="butt"/>
${[
	[22, 54],
	[62, 40],
	[84, 52]
]
	.map(([x, y]) => `<rect x="${x - 5}" y="${y - 16}" width="10" height="14" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>`)
	.join('')}`),
	// Deutschland: Brandenburger Tor
	DE: () =>
		M(`<path d="M42,14 L44,6 L50,3 L56,6 L58,14 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<path d="M28,22 V14 H72 V22" stroke-width="3"/><rect x="8" y="22" width="84" height="11" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M14,33 V76 M26,33 V76 M40,33 V76 M60,33 V76 M74,33 V76 M86,33 V76" stroke-width="4.4"/><path d="M2,76 H98" stroke-width="4"/>`),
	// VAE: Burj Khalifa
	AE: () =>
		M(`${sun(84, 14, 7)}<path d="M38,76 L42,56 H44 L46,36 H48 L50,2 L52,36 H54 L56,56 H58 L62,76 Z" fill="currentColor" fill-opacity=".3" stroke-width="2.6"/><path d="M50,10 V76" stroke-width="1.6"/>
<rect x="18" y="56" width="10" height="20" fill="currentColor" fill-opacity=".3" stroke-width="2.4"/><rect x="70" y="50" width="11" height="26" fill="currentColor" fill-opacity=".3" stroke-width="2.4"/>${GROUND}`),
	// Malediven: Palmeninsel
	MV: () =>
		M(`${sun(20, 16, 7)}<path d="M14,70 Q50,54 86,70 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="M46,64 Q48,40 58,24" stroke-width="3.4"/>
<path d="M58,24 Q44,16 34,26 M58,24 Q54,10 42,8 M58,24 Q70,10 84,14 M58,24 Q76,22 82,36" stroke-width="3"/><circle cx="55" cy="29" r="2.4" fill="currentColor" stroke="none"/>
<path d="${waves(4, 77, 6, 15, 4)}" stroke-width="2.4"/>`),
	// Peru: Lama vor Machu Picchu
	PE: () =>
		M(`${sun(86, 12, 7)}<path d="M30,76 L46,46 Q52,20 62,18 Q70,20 72,34 L78,46 L98,76 Z" ${HALF} stroke-width="3"/>
<path d="M48,56 H86 M44,63 H90 M40,70 H94" stroke-width="1.8" stroke-dasharray="4 3"/>
<path d="M12,53 H28 V34 Q28,30 31,29 L30,23 L33,27 L35,23 L35,29 Q39,30 41,33 Q41,36 37,36 H35 V58 Q35,62 33,63 V76 H30 V64 H26 V76 H23 V64 H18 V76 H15 V64 H13 V76 H10 V62 Q7,60 8,56 Q9,53 12,53 Z" ${SOLID}/>
<circle cx="33" cy="31.5" r="1" ${PAPER}/><path d="M12,58 H33" stroke="var(--paper)" stroke-width="1.4" stroke-dasharray="2 2"/>${GROUND}`),
	// Kenia: Giraffe unter der Schirmakazie
	KE: () =>
		M(`${sun(90, 12, 6)}<path d="M58,36 Q78,24 98,34 Q80,42 58,36 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/><path d="M80,76 V54 M80,57 L70,40 M80,55 L88,38" stroke-width="3.2"/>
<path d="M20,50 Q22,44 30,44 L40,42 L52,14 Q53,10 57,10 L62,12 Q63,15 60,16 L56,17 L46,46 Q46,52 44,56 V76 H41 V58 H38 V76 H35 V58 H28 V76 H25 V58 L23,57 V76 H20 V56 Q19,53 20,50 Z" ${SOLID}/>
<path d="M54,11 L53,6 M57,10 L57.5,5" stroke-width="2"/><path d="M20,50 Q16,54 17,62" stroke-width="1.8"/>
${[[26, 50, 2.2], [33, 49, 2.4], [40, 47.5, 2], [45.5, 38, 1.6], [48.5, 30, 1.5], [51.5, 22, 1.2], [30, 54.5, 1.4], [38, 53, 1.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${PAPER}/>`).join('')}${GROUND}`),
	// Tansania: Kilimandscharo und Elefant
	TZ: () =>
		M(`<path d="M10,76 L38,36 Q50,28 64,30 Q72,32 78,40 L100,76 Z" ${HALF} stroke-width="3"/>
<path d="M38,36 Q50,28 64,30 Q72,32 78,40 L72,43 L67,38 L61,43 L55,37 L49,42 L44,38 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<path d="M51,76 V56 Q51,46 40,46 H28 Q19,46 16,53 Q14,58 13,66 Q12,72 8,72 Q7,75 10,75 Q16,75 17,66 L19,62 V76 H24 V64 H28 V76 H33 V64 H38 V76 H43 V64 H46 V76 Z" ${SOLID}/>
<path d="M30,49 Q22,49 22,56 Q23,62 31,60" stroke="var(--paper)" stroke-width="1.8"/><circle cx="18.5" cy="53" r="1.1" ${PAPER}/><path d="M18,60 Q20,64 25,63" stroke="var(--paper)" stroke-width="1.6"/>
<path d="M51,52 Q55,56 53,62" stroke-width="1.8"/>${GROUND}`),
	// Madagaskar: Allee der Baobabs
	MG: () => {
		const bao = (x: number, t: number, w: number) =>
			`<path d="M${f1(x - w / 2)},76 Q${f1(x - w * 0.62)},${f1((t + 76) / 2)} ${f1(x - w * 0.3)},${t} H${f1(x + w * 0.3)} Q${f1(x + w * 0.62)},${f1((t + 76) / 2)} ${f1(x + w / 2)},76 Z" ${SOLID}/>
<path d="M${f1(x - w * 0.2)},${t + 1} l${f1(-w * 0.45)},${f1(-w * 0.5)} m${f1(w * 0.15)},${f1(w * 0.17)} l${f1(-w * 0.3)},0 M${x},${t + 1} v${f1(-w * 0.6)} M${f1(x + w * 0.2)},${t + 1} l${f1(w * 0.45)},${f1(-w * 0.5)} m${f1(-w * 0.15)},${f1(w * 0.17)} l${f1(w * 0.3)},0" stroke-width="${f1(Math.max(1.6, w * 0.16))}"/>
${[[-0.65, -0.5], [-0.75, -0.18], [0, -0.68], [0.65, -0.5], [0.75, -0.18]].map(([dx, dy]) => `<circle cx="${f1(x + dx * w)}" cy="${f1(t + dy * w)}" r="${f1(w * 0.2)}" ${SOLID}/>`).join('')}`;
		return M(`${sun(86, 12, 7)}<path d="M8,14 q3,-3 6,0 q3,-3 6,0" stroke-width="1.8"/>${bao(22, 24, 13)}${bao(50, 36, 10)}${bao(72, 46, 7)}${bao(88, 54, 4.5)}<path d="M34,76 L58,58 M66,76 L60,58" stroke-width="1.4" stroke-dasharray="2 3"/>${GROUND}`);
	},
	// Schweden: Dalapferd
	SE: () =>
		M(`<path d="M30,9 L34,1 L37,11 Z" ${SOLID}/>
<path d="M22,12 Q28,6 34,10 L38,16 Q40,26 40,34 Q54,32 72,32 Q82,32 82,42 L80,46 L82,52 L78,52 L76,76 H66 L64,56 H44 L42,76 H32 L32,52 Q26,48 24,38 L18,30 Q14,28 14,24 L16,18 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<circle cx="25" cy="18" r="1.5" ${PAPER}/><path d="M18,25 Q26,27 34,21 M46,35 Q46,46 56,46 Q66,46 66,35 M33,64 H41 M67,64 H75 M72,37 q5,-1 6,4" stroke="var(--paper)" stroke-width="2"/>
<path d="M50,38 q6,6 12,0 M37,22 l3,2 M38,28 l3,2" stroke="var(--paper)" stroke-width="1.6"/>
<circle cx="56" cy="41" r="2.2" ${PAPER}/><circle cx="50" cy="43" r="1.2" ${PAPER}/><circle cx="62" cy="43" r="1.2" ${PAPER}/>${GROUND}`),
	// Finnland: Rentier unter dem Mond
	FI: () =>
		M(`<path d="M86,4 A10,10 0 1 0 96,20 A8,8 0 1 1 86,4 Z" ${SOLID}/>${star(70, 10, 3)}${star(60, 22, 2.4)}${star(80, 30, 2)}
<path d="M33,27 Q30,16 36,6 M32,19 L39,16 M34,12 L40,9 M31,27 Q24,20 22,10 M26,19 L19,17 M23,13 L18,8" stroke-width="2.4"/>
<path d="M34,50 Q34,44 42,44 H66 Q74,44 75,50 L76,53 L74,55 V76 H70 V60 H66 V76 H62 V60 H46 V76 H42 V60 H38 V76 H34 V58 Q32,54 34,50 Z" ${SOLID}/>
<path d="M44,46 L36,31 Q34,27 30,28 L22,30 Q19,32 21,35 L30,36 L34,50 Z" ${SOLID}/><circle cx="29" cy="31" r="1" ${PAPER}/>
<path d="M36,44 Q38,50 36,54" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M84,76 V44 M92,76 V50" stroke-width="2.6"/><path d="M84,52 l-5,-5 M84,60 l5,-5 M92,58 l4,-4 M92,64 l-4,-4" stroke-width="1.8"/>${GROUND}`),
	// Dänemark: bunte Giebelhäuser in Nyhavn
	DK: () => {
		const H: [number, number, number, string][] = [
			[4, 18, 26, 'p'],
			[22, 18, 20, 's'],
			[40, 18, 28, 'r'],
			[58, 18, 22, 'p'],
			[76, 20, 30, 's']
		];
		let s = '';
		H.forEach(([x, w, t, g], i) => {
			const full = i % 2 === 1,
				r = x + w,
				m = x + w / 2;
			const top =
				g === 'p' ? `L${m},${t - 12} L${r},${t}` : g === 's' ? `V${t - 4} H${x + 3} V${t - 8} H${x + 6} V${t - 12} H${r - 6} V${t - 8} H${r - 3} V${t - 4} H${r} V${t}` : `Q${m},${t - 14} ${r},${t}`;
			s += `<path d="M${x},58 V${t} ${top} V58 Z" ${full ? 'fill="currentColor"' : HALF} stroke-width="2.4"/>`;
			for (let row = 0; row < 3; row++)
				for (const c of [0.28, 0.72]) s += `<rect x="${f1(x + w * c - 2)}" y="${t + 4 + row * 9}" width="4" height="5" ${full ? PAPER : SOLID}/>`;
		});
		return M(`${s}<path d="M2,58 H98" stroke-width="3"/><path d="M30,64 H64 L60,70 H34 Z" ${SOLID}/><path d="M40,64 V60 H50 V64" stroke-width="2"/><path d="${waves(4, 76, 6, 15, 4)}" stroke-width="2.4"/>`);
	},
	// Irland: Klippen von Moher und Kleeblatt
	IE: () =>
		M(`<g transform="translate(78,26)">${[0, 120, 240].map((a) => `<path d="M0,0 C-8,-4 -10,-14 -4,-16 Q0,-17 0,-12 Q0,-17 4,-16 C10,-14 8,-4 0,0 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" transform="rotate(${a})"/>`).join('')}<path d="M0,0 Q3,9 8,14" stroke-width="2.6"/></g>
<path d="M2,76 V28 L14,26 L18,34 L30,36 L34,46 L46,48 L50,58 L60,60 L62,76 Z" ${HALF} stroke-width="3"/>
<path d="M6,40 H14 M8,52 H28 M10,64 H40 M20,46 H30" stroke-width="1.6" stroke-dasharray="3 3"/>
<path d="M7,26 V16 H16 V26 M7,16 V13 H9 V16 M11.5,16 V13 H14 V16" stroke-width="2.2"/>
<path d="${waves(62, 68, 2, 16, 4)}" stroke-width="2.4"/><path d="${waves(54, 76, 3, 15, 4)}" stroke-width="2.4"/>`),
	// Tschechien: Altstädter Brückenturm und Karlsbrücke
	CZ: () =>
		M(`<path d="M16,24 L31,2 L46,24 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/><path d="M15,24 L17.5,10 L20,24 M42,24 L44.5,10 L47,24" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<rect x="18" y="24" width="26" height="52" ${HALF} stroke-width="3"/><path d="M24,76 V62 Q31,52 38,62 V76" stroke-width="2.6"/>
<path d="M24,32 V40 M31,32 V40 M38,32 V40 M22,46 H40" stroke-width="2"/>
<path d="M44,50 H100" stroke-width="3.4"/><path d="M44,54 H100" stroke-width="1.6"/>
<path d="M50,76 V66 Q60,56 70,66 V76 M74,76 V66 Q84,56 94,66 V76" stroke-width="2.6"/>
<path d="M60,50 V43 M84,50 V43" stroke-width="2.4"/><circle cx="60" cy="40" r="2.2" ${SOLID}/><circle cx="84" cy="40" r="2.2" ${SOLID}/>
<path d="M70,32 L72,24 L74,32 Z M88,30 L90,20 L92,30 Z" ${SOLID}/><path d="M62,34 H96" stroke-width="1.4" stroke-dasharray="2 3"/>${GROUND}`),
	// Belgien: Atomium
	BE: () => {
		const P = [
			[50, 14],
			[69, 25],
			[69, 47],
			[50, 58],
			[31, 47],
			[31, 25]
		];
		const tubes = P.map(([x, y]) => `M50,36 L${x},${y}`).join(' ') + ' M' + P.map(([x, y]) => `${x},${y}`).join(' L') + ' Z';
		return M(
			`<path d="${tubes}" stroke-width="2.8"/><path d="M50,64 V76 M40,51 L28,76 M60,51 L72,76" stroke-width="2.8"/>
${[[50, 36], ...P].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" ${SOLID}/><circle cx="${x - 2.2}" cy="${y - 2.2}" r="1.7" ${PAPER}/>`).join('')}${GROUND}`,
			[10, 2, 80, 78]
		);
	},
	// Malta: Fischerboot Luzzu mit Auge
	MT: () =>
		M(`${sun(84, 14, 7)}<path d="M26,14 q4,-4 8,0 q4,-4 8,0 M48,24 q3,-3 6,0 q3,-3 6,0" stroke-width="2"/>
<path d="M8,32 Q10,52 24,58 H78 Q90,54 94,30 Q88,42 78,44 H22 Q14,42 8,32 Z" ${HALF} stroke-width="3"/>
<path d="M8,33 L5,24 M94,31 L97,22" stroke-width="3"/><path d="M26,48 H84" stroke-width="3.4"/><path d="M28,53 H80" stroke-width="1.4" stroke-dasharray="3 3"/>
<path d="M13,47 Q18,42 23,47 Q18,52 13,47 Z" ${SOLID}/><circle cx="18" cy="47" r="1.4" ${PAPER}/>
<path d="${waves(2, 66, 7, 14, 4)}" stroke-width="2.4"/><path d="${waves(10, 75, 6, 14, 4)}" stroke-width="2.4"/>`),
	// Slowenien: Bleder See mit Inselkirche
	SI: () =>
		M(`<path d="M2,50 L18,30 L28,38 L44,12 L56,30 L70,22 L98,50" stroke-width="2.4"/>
<path d="M38,22 L44,12 L50,21 L47,19 L44,23 L41,19 Z M66,27 L70,22 L74,28 L70,26 Z M14,35 L18,30 L22,35 L18,33 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4"/>
<path d="M26,62 Q50,46 74,62 Z" ${SOLID}/><rect x="38" y="44" width="16" height="12" ${SOLID}/><path d="M37,44 L46,36 L55,44 Z" ${SOLID}/>
<path d="M55,56 V30 L58,18 L61,30 V56 Z" ${SOLID}/><path d="M58,18 V13" stroke-width="1.6"/><path d="M57,34 h2 v5 h-2 Z M42,48 h3 v4 h-3 Z M48,48 h3 v4 h-3 Z" ${PAPER}/>
<circle cx="33" cy="57" r="4" ${SOLID}/><circle cx="67" cy="57" r="3.4" ${SOLID}/>
<path d="M2,62 H98" stroke-width="2.4"/><path d="${waves(8, 69, 6, 14, 3)}" stroke-width="2.2"/><path d="${waves(18, 76, 4, 16, 3)}" stroke-width="2.2"/>`),
	// Russland: Basilius-Kathedrale
	RU: () => {
		const onion = (x: number, t: number, r: number, full = true) =>
			`<path d="M${x},${t} C${x + 3},${t + 6} ${x + r + 3},${t + 8} ${x + r},${t + 15} Q${x + r - 1},${t + 20} ${x},${t + 20} Q${x - r + 1},${t + 20} ${x - r},${t + 15} C${x - r - 3},${t + 8} ${x - 3},${t + 6} ${x},${t} Z" ${full ? 'fill="currentColor"' : HALF} stroke-width="2"/>
<path d="M${x},${t} V${t - 6} M${x - 2.5},${t - 3.5} H${x + 2.5}" stroke-width="1.6"/>` +
			(full ? `<path d="M${f1(x - r * 0.8)},${t + 16} Q${x},${t + 9} ${f1(x + r * 0.5)},${t + 3} M${f1(x - r * 0.3)},${t + 19} Q${f1(x + r * 0.5)},${t + 12} ${f1(x + r * 0.9)},${t + 8}" stroke="var(--paper)" stroke-width="1.5"/>` : '');
		return M(`<path d="M44,40 L50,8 L56,40 Z" ${HALF} stroke-width="2.4"/><path d="M47,24 H53 M46,32 H54" stroke-width="1.4"/>${onion(50, 0, 3)}
<rect x="42" y="40" width="16" height="36" ${HALF} stroke-width="2.6"/><path d="M46,76 V64 Q50,58 54,64 V76" stroke-width="2"/>
${onion(27, 22, 9)}<rect x="21" y="42" width="12" height="34" ${HALF} stroke-width="2.6"/>
${onion(73, 26, 8)}<rect x="67" y="46" width="12" height="30" ${HALF} stroke-width="2.6"/>
${onion(10, 40, 5, false)}<rect x="6" y="60" width="8" height="16" ${HALF} stroke-width="2.2"/>${onion(90, 42, 5, false)}<rect x="86" y="62" width="8" height="14" ${HALF} stroke-width="2.2"/>${GROUND}`);
	},
	// Bosnien und Herzegowina: Alte Brücke von Mostar
	BA: () =>
		M(`<rect x="4" y="24" width="15" height="40" ${HALF} stroke-width="2.6"/><path d="M2,24 L11.5,13 L21,24 Z" ${SOLID}/>
<rect x="81" y="30" width="15" height="34" ${HALF} stroke-width="2.6"/><path d="M79,30 L88.5,19 L98,30 Z" ${SOLID}/><path d="M9,36 v6 M14,36 v6 M86,40 v6 M91,40 v6" stroke-width="1.8"/>
<path d="M20,46 Q50,14 80,46 L76,64 Q50,4 24,64 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/><path d="M20,42 Q50,10 80,42" stroke-width="1.6" stroke-dasharray="2 2.5"/>
<path d="M2,76 V64 H26 L32,76 M98,76 V64 H74 L68,76" ${HALF} stroke-width="2.6"/><path d="${waves(30, 72, 3, 13, 3)}" stroke-width="2.2"/>${GROUND}`),
	// Polen: Storch auf dem Nest
	PL: () =>
		M(`<path d="M2,76 L18,64 H82 L98,76" ${HALF} stroke-width="2.6"/><rect x="46" y="56" width="16" height="10" ${HALF} stroke-width="2.4"/>
<path d="M32,56 Q54,64 76,56 L72,50 H36 Z" ${SOLID}/><path d="M30,54 L42,49 M66,49 L80,55 M40,58 L52,51 M56,51 L70,58" stroke-width="1.8"/>
<path d="M56,40 L54,50 M62,40 L64,50" stroke-width="2.2"/>
<path d="M44,32 Q50,24 64,26 L84,34 Q74,40 62,40 Q48,40 44,32 Z" ${HALF} stroke-width="2.4"/><path d="M58,30 Q70,30 84,34 Q74,40 60,38 Z" ${SOLID}/>
<path d="M46,32 Q40,24 42,16 Q44,10 40,8" stroke-width="4"/><circle cx="39" cy="8" r="3.6" ${HALF} stroke-width="2"/><path d="M36,9 L22,17" stroke-width="2.6"/>
<path d="M74,14 q6,-6 12,-2 q6,-6 12,0" stroke-width="2.2"/>`),
	// Ungarn: Parlament an der Donau
	HU: () =>
		M(`<path d="M50,20 V4" stroke-width="2.4"/><path d="M40,40 Q40,22 50,20 Q60,22 60,40 Z" ${SOLID}/><rect x="38" y="40" width="24" height="8" ${HALF} stroke-width="2.4"/>
<path d="M28,48 V30 L32,20 L36,30 V48 Z M64,48 V30 L68,20 L72,30 V48 Z" ${SOLID}/>
${[10, 18, 82, 90].map((x) => `<path d="M${x - 2},48 V42 L${x},36 L${x + 2},42 V48 Z" ${SOLID}/>`).join('')}
<rect x="6" y="48" width="88" height="16" ${HALF} stroke-width="2.6"/><path d="M9,56 H91" stroke-width="2" stroke-dasharray="2 3"/>
<path d="M2,64 H98" stroke-width="2.8"/><path d="${waves(4, 71, 6, 15, 3)}" stroke-width="2.2"/><path d="${waves(12, 77, 5, 15, 3)}" stroke-width="2.2"/>`),
	// Südkorea: Palasttor Gwanghwamun
	KR: () =>
		M(`<path d="M16,22 Q22,20 26,14 H74 Q78,20 84,22 Q72,22 70,25 H30 Q28,22 16,22 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/><path d="M30,12 H70" stroke-width="2.6"/>
<path d="M34,25 V31 M50,25 V31 M66,25 V31" stroke-width="2.2"/>
<path d="M6,36 Q14,34 18,30 H82 Q86,34 94,36 Q80,36 76,39 H24 Q20,36 6,36 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<path d="M26,39 V48 M40,39 V48 M60,39 V48 M74,39 V48" stroke-width="2.2"/>
<rect x="14" y="48" width="72" height="28" ${HALF} stroke-width="3"/>
<path d="M25,76 V65 Q30,58 35,65 V76 M43,76 V63 Q50,54 57,63 V76 M65,76 V65 Q70,58 75,65 V76" fill="var(--paper)" stroke-width="2.4"/>${GROUND}`),
	// Singapur: Marina Bay Sands und Supertrees
	SG: () => {
		const tree = (x: number, t: number) =>
			`<path d="M${x - 1.5},70 L${x - 1},${t + 9} L${x - 7},${t} H${x + 7} L${x + 1},${t + 9} L${x + 1.5},70 Z" ${SOLID}/><path d="M${x - 5},${t + 3} H${x + 5}" stroke="var(--paper)" stroke-width="1"/>`;
		return M(`${[28, 44, 60].map((x) => `<path d="M${x},70 L${x + 1},24 H${x + 9} L${x + 10},70 Z" ${HALF} stroke-width="2.4"/><path d="M${x + 5},30 V66" stroke-width="1.2" stroke-dasharray="2 3"/>`).join('')}
<path d="M20,20 Q44,16 76,17 L82,13 L80,21 Q46,24 22,24 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>${tree(84, 40)}${tree(94, 50)}${tree(10, 46)}
<path d="M2,70 H98" stroke-width="2.6"/><path d="${waves(4, 77, 6, 15, 3)}" stroke-width="2.2"/>`);
	},
	// Malaysia: Petronas Towers
	MY: () => {
		const tw = (x: number) =>
			`<path d="M${x - 8},76 V44 H${x - 6} V30 H${x - 4} V20 H${x - 2} V14 L${x},2 L${x + 2},14 V20 H${x + 4} V30 H${x + 6} V44 H${x + 8} V76 Z" ${HALF} stroke-width="2.4"/><path d="M${x},20 V72" stroke-width="1.2" stroke-dasharray="2 3"/>`;
		return M(`${tw(36)}${tw(64)}<rect x="44" y="40" width="12" height="4" ${SOLID}/><path d="M44,44 L50,52 L56,44" stroke-width="2"/>
<path d="M6,76 V60 H18 V76 M82,76 V56 H94 V76" ${HALF} stroke-width="2.2"/>${GROUND}`);
	},
	// Kambodscha: Angkor Wat mit Spiegelung
	KH: () => {
		const bud = (x: number, t: number, w: number, b: number) =>
			`M${x - w},${b} L${f1(x - w * 0.9)},${f1(t + (b - t) * 0.6)} Q${f1(x - w * 0.8)},${f1(t + (b - t) * 0.22)} ${x},${t} Q${f1(x + w * 0.8)},${f1(t + (b - t) * 0.22)} ${f1(x + w * 0.9)},${f1(t + (b - t) * 0.6)} L${x + w},${b} Z`;
		const T: [number, number, number, number][] = [
			[18, 26, 6, 44],
			[82, 26, 6, 44],
			[34, 16, 7, 44],
			[66, 16, 7, 44],
			[50, 4, 9, 44]
		];
		const all = T.map((t) => bud(...t)).join(' ');
		return M(`${T.map((t, i) => `<path d="${bud(...t)}" ${i === 4 ? 'fill="currentColor"' : HALF} stroke-width="2.2"/>`).join('')}
<path d="M44,16 H56 M43,26 H57 M42,35 H58" stroke="var(--paper)" stroke-width="1.4"/>
<rect x="6" y="44" width="88" height="12" ${HALF} stroke-width="2.6"/><path d="M10,50 H90" stroke-width="1.6" stroke-dasharray="2 3"/><path d="M2,58 H98" stroke-width="2.6"/>
<g transform="translate(0,58) scale(1,-.42) translate(0,-58)" stroke-width="2.4" stroke-dasharray="2 3"><path d="${all}"/></g>`);
	},
	// Sri Lanka: Stelzenfischer im Abendlicht
	LK: () => {
		const fisher = (dx: number, s: number) =>
			`<g transform="translate(${dx},0) scale(${s}) ">
<path d="M14,76 L16,30" stroke-width="2.6"/><path d="M8,46 L24,44" stroke-width="2.4"/>
<circle cx="17" cy="28" r="3.2" ${SOLID}/><path d="M17,31 L16,43 M16,43 L22,45 L22,54 M17,35 L26,33" stroke-width="3"/>
<path d="M24,34 Q42,16 56,20" stroke-width="1.4"/><path d="M56,20 V56" stroke-width=".9" stroke-dasharray="2 2"/></g>`;
		return M(`<path d="M50,52 A20,20 0 0 1 90,52 Z" ${HALF} stroke-width="2.4"/><path d="M2,52 H98" stroke-width="2"/>
${fisher(4, 1)}<g transform="translate(46,26)">${fisher(0, 0.7)}</g>
<path d="${waves(2, 62, 7, 14, 3)}" stroke-width="2.2"/><path d="${waves(10, 70, 6, 14, 3)}" stroke-width="2.2"/><path d="${waves(4, 77, 7, 14, 3)}" stroke-width="2.2"/>`);
	},
	// Nepal: Himalaya mit Gebetsfahnen
	NP: () => {
		let flags = '';
		for (let i = 0; i < 9; i++) {
			const t = (i + 0.5) / 9,
				x = f1(2 + 96 * t),
				y = f1((1 - t) * (1 - t) * 6 + 2 * (1 - t) * t * 26 + t * t * 6);
			flags += `<rect x="${f1(x - 3.6)}" y="${y}" width="7.2" height="8" ${i % 2 ? 'fill="currentColor"' : HALF} stroke-width="1.4"/>`;
		}
		return M(`<path d="M2,6 Q50,46 98,6" stroke-width="1.4"/>${flags}
<path d="M2,76 L22,52 L32,58 L54,30 L64,42 L72,37 L98,76 Z" ${HALF} stroke-width="3"/>
<path d="M47,40 L54,30 L60,39 L57,38 L54,42 L51,39 Z M17,58 L22,52 L27,58 L22,56 Z M68,42 L72,37 L76,43 L72,41 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4"/>${GROUND}`);
	},
	// Mongolei: Jurte und Pferd in der Steppe
	MN: () =>
		M(`${sun(84, 12, 7)}<path d="M2,52 L18,36 L30,46 L46,30 L64,48 L78,38 L98,54" stroke-width="2.2"/>
<path d="M18,76 V60 H62 V76" ${HALF} stroke-width="2.6"/><path d="M14,60 Q16,56 22,54 L40,44 L58,54 Q64,56 66,60 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<path d="M24,57 Q40,50 56,57" stroke="var(--paper)" stroke-width="1.6"/><path d="M36,44 Q40,40 44,44" stroke-width="2"/>
<rect x="35" y="64" width="10" height="12" ${SOLID}/><path d="M20,67 H33 M47,67 H60" stroke-width="1.6" stroke-dasharray="2 2"/>
<path d="M76,44 L78,40 L79,45 Q83,52 86,57 H92 Q97,57 97,62 V64 L96,76 H94 L93,66 L90,65 L91,76 H89 L87,65 H82 L81,76 H79 L78,65 L76,76 H74 L75,63 Q73,60 74,56 L72,54 Q69,56 67,54 Q66,52 68,50 Z" ${SOLID}/>
<path d="M97,59 Q101,64 98,72 M78,43 Q83,47 86,54" stroke-width="2"/>${GROUND}`),
	// Jordanien: Schatzhaus von Petra
	JO: () =>
		M(`<path d="M2,76 V8 Q10,2 18,6 L30,2 L46,6 L60,1 L76,5 L90,2 L98,8 V76" ${HALF} stroke-width="3"/>
<path d="M22,20 L30,13 V20 M78,20 L70,13 V20 M20,20 H36 M64,20 H80 M20,32 H80" stroke-width="2.4"/>
<rect x="42" y="16" width="16" height="16" ${SOLID}/><path d="M40,16 Q50,7 60,16 Z" ${SOLID}/><path d="M50,9 V4" stroke-width="2.4"/>
<path d="M26,20 V32 M33,20 V32 M67,20 V32 M74,20 V32" stroke-width="2.6"/><path d="M45,20 V30 M55,20 V30" stroke="var(--paper)" stroke-width="1.6"/>
<path d="M30,46 L50,36 L70,46" stroke-width="2.6"/><path d="M20,47 H80" stroke-width="3"/>
<path d="M24,49 V76 M34,49 V76 M42,49 V76 M58,49 V76 M66,49 V76 M76,49 V76" stroke-width="3.4"/><rect x="46" y="58" width="8" height="18" ${SOLID}/>${GROUND}`),
	// Myanmar: Pagoden von Bagan
	MM: () => {
		const stupa = (x: number, b: number, s: number, full: boolean) =>
			`<rect x="${f1(x - s * 1.3)}" y="${b}" width="${f1(s * 2.6)}" height="${f1(s * 0.45)}" ${full ? SOLID : HALF} stroke-width="1.8"/><path d="M${x - s},${b} Q${x - s},${f1(b - s * 1.2)} ${x},${f1(b - s * 1.6)} Q${x + s},${f1(b - s * 1.2)} ${x + s},${b} Z" ${full ? 'fill="currentColor"' : HALF} stroke-width="2"/><path d="M${x},${f1(b - s * 1.6)} V${f1(b - s * 2.7)}" stroke-width="${f1(Math.max(1.4, s * 0.22))}"/>`;
		return M(`<circle cx="66" cy="22" r="10" ${HALF} stroke-width="2.4"/><path d="M14,18 q3,-3 6,0 q3,-3 6,0 M30,10 q2.5,-2.5 5,0 q2.5,-2.5 5,0" stroke-width="1.8"/>
${stupa(50, 58, 14, true)}<rect x="30" y="64" width="40" height="6" ${SOLID}/>${stupa(20, 66, 8, false)}${stupa(80, 64, 9, false)}${stupa(94, 70, 4, false)}${stupa(6, 71, 3, false)}
<path d="M2,72 H98" stroke-width="1.6" stroke-dasharray="3 3"/>${GROUND}`);
	},
	// Usbekistan: Madrasa am Registan
	UZ: () =>
		M(
			`<path d="M38,14 Q38,0 50,-2 Q62,0 62,14 Z" ${SOLID}/><path d="M44,13 Q44,2 50,-1 M56,13 Q56,2 50,-1 M50,-1 V13" stroke="var(--paper)" stroke-width="1.4"/><path d="M50,-2 V-7" stroke-width="2"/>
<rect x="26" y="14" width="48" height="62" ${HALF} stroke-width="3"/><rect x="30" y="18" width="40" height="58" stroke-width="1.4" stroke-dasharray="2 2"/>
<path d="M36,76 V42 Q36,28 50,22 Q64,28 64,42 V76 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
${[[50, 32], [44, 42], [56, 42], [50, 52], [44, 62], [56, 62]].map(([x, y]) => `<path d="M${x},${y - 3.5} L${x + 3.5},${y} L${x},${y + 3.5} L${x - 3.5},${y} Z" ${PAPER}/>`).join('')}
<rect x="9" y="22" width="8" height="54" ${HALF} stroke-width="2.4"/><path d="M8,22 H18 L16,16 H10 Z" ${SOLID}/><path d="M13,16 V11" stroke-width="2"/>
<rect x="83" y="22" width="8" height="54" ${HALF} stroke-width="2.4"/><path d="M82,22 H92 L90,16 H84 Z" ${SOLID}/><path d="M87,16 V11" stroke-width="2"/>
<path d="M10,36 H16 M10,52 H16 M84,36 H90 M84,52 H90" stroke-width="1.6"/>${GROUND}`,
			[0, -8, 100, 86]
		),
	// Taiwan: Taipei 101 und Himmelslaternen
	TW: () => {
		let segs = '';
		for (let i = 0; i < 8; i++) {
			const b = 56 - i * 6;
			segs += `<path d="M44,${b} L42,${b - 6} H58 L56,${b} Z" ${i % 2 ? HALF : 'fill="currentColor" fill-opacity=".55"'} stroke-width="1.8"/>`;
		}
		const lantern = (x: number, y: number) => `<path d="M${x - 3},${y} L${x - 4.2},${y - 8} H${x + 4.2} L${x + 3},${y} Z" ${SOLID}/><circle cx="${x}" cy="${y + 2}" r="1" ${SOLID}/>`;
		return M(
			`<path d="M2,76 Q20,56 40,66 M60,66 Q80,52 98,70" stroke-width="2.4"/>${segs}<rect x="40" y="56" width="20" height="20" ${HALF} stroke-width="2.4"/>
<path d="M46,8 V2 H54 V8" stroke-width="2.2"/><path d="M50,2 V-6" stroke-width="2"/>${lantern(28, 20)}${lantern(22, 40)}${lantern(72, 26)}${lantern(80, 46)}${GROUND}`,
			[0, -8, 100, 86]
		);
	},
	// Philippinen: Auslegerboot vor Karstfelsen
	PH: () =>
		M(`${sun(50, 16, 6)}<path d="M8,58 Q6,26 20,22 Q30,24 30,40 Q32,30 40,32 Q48,36 46,58 Z" ${HALF} stroke-width="2.6"/><path d="M68,58 Q64,30 80,26 Q94,32 92,58 Z" ${HALF} stroke-width="2.6"/>
<path d="M18,28 l-3,-4 M22,24 l2,-4 M80,28 l0,-4 M84,28 l3,-3" stroke-width="1.8"/><path d="M2,58 H98" stroke-width="2.2"/>
<path d="M40,64 V54 M64,63 V54 M37,54 H67" stroke-width="2"/><path d="M22,64 Q52,72 82,62 L86,58 Q60,63 26,60 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<path d="M12,70 H94" stroke-width="2.2"/><path d="M30,63 L24,70 M74,62 L80,70" stroke-width="1.8"/><path d="${waves(4, 77, 6, 15, 3)}" stroke-width="2.2"/>`),
	// Namibia: Deadvlei – tote Bäume vor roter Düne
	NA: () => {
		const tree = (x: number, s: number) =>
			`<g transform="translate(${x},76) scale(${s})">${halo('M0,0 Q-1,-10 1,-16 M1,-14 Q-6,-20 -10,-26 M0,-10 Q8,-16 12,-22 M1,-16 Q2,-24 -1,-30 M-6,-20 l-1,-6 M8,-16 l4,-2 M-1,-30 l3,-4', 2.4)}</g>`;
		return M(`${sun(16, 14, 6)}<path d="M2,64 C24,60 42,32 60,12 Q55,40 66,64 Z" ${SOLID}/><path d="M60,12 C70,28 84,44 98,48 V64 H66 Q55,40 60,12 Z" ${HALF} stroke-width="2.4"/>
<path d="M2,64 H98" stroke-width="2"/><path d="M8,70 l6,2 l5,-2 M40,70 l6,2 l6,-2 M74,71 l6,-2 l6,2" stroke-width="1.4"/>${tree(24, 1.2)}${tree(70, 0.9)}${tree(88, 0.6)}${GROUND}`);
	},
	// Tunesien: blaue Tür von Sidi Bou Said
	TN: () => {
		let studs = '';
		for (const [x, y] of [[50, 28], [44, 34], [56, 34], [50, 40], [40, 46], [60, 46], [44, 52], [56, 52], [50, 58], [40, 64], [60, 64], [50, 70]]) studs += `<circle cx="${x}" cy="${y}" r="1.4" ${PAPER}/>`;
		const flower = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" ${HALF} stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.35)}" ${SOLID}/>`;
		return M(`<path d="M16,76 V10 H84 V76" stroke-width="2.4"/>
<path d="M30,76 V36 Q30,16 50,16 Q70,16 70,36 V76 Z" fill="currentColor" stroke="currentColor" stroke-width="2.6"/><path d="M35,76 V38 Q35,22 50,22 Q65,22 65,38 V76" stroke="var(--paper)" stroke-width="1.6"/>${studs}
<path d="M24,76 V72 H76 V76" stroke-width="2.2"/><path d="M76,30 H84 M76,30 V44 H84" stroke-width="2"/>
${flower(10, 12, 4)}${flower(18, 6, 3.4)}${flower(6, 22, 3)}${flower(24, 14, 2.6)}${flower(14, 30, 2.4)}<path d="M20,20 q4,-1 6,3 M9,36 q3,0 4,4" stroke-width="1.8"/>${GROUND}`);
	},
	// Simbabwe/Sambia: Victoriafälle mit Regenbogen
	ZW: () =>
		M(`<path d="M2,24 H98 V32 H2 Z" ${SOLID}/>${[8, 22, 36, 50, 64, 78, 92].map((x) => `<circle cx="${x}" cy="21" r="4" ${SOLID}/>`).join('')}
${Array.from({ length: 15 }, (_, i) => `<path d="M${6 + i * 6},33 V${58 + (i % 3) * 3}" stroke-width="1.8" stroke-dasharray="${4 + (i % 3)} 3"/>`).join('')}
<path d="M14,76 A36,36 0 0 1 86,76" stroke-width="2.4"/><path d="M20,76 A30,30 0 0 1 80,76" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M26,76 A24,24 0 0 1 74,76" stroke-width="2"/>
<path d="M2,66 q5,-7 10,0 q5,-7 10,0 q5,-7 10,0 q5,-7 10,0 q5,-7 10,0 q5,-7 10,0 q5,-7 10,0 q5,-7 10,0 q5,-7 10,0 q4,-6 8,0" stroke-width="2.4"/>${GROUND}`),
	// Kuba: Oldtimer unter Palmen
	CU: () =>
		M(`${sun(80, 18, 8)}<path d="M18,58 Q14,34 22,16" stroke-width="3"/>
<path d="M22,16 Q12,10 4,18 M22,16 Q18,4 8,4 M22,16 Q30,4 40,6 M22,16 Q34,12 38,24 M22,16 Q24,8 20,2" stroke-width="2.8"/>
<path d="M8,68 Q8,60 16,59 L28,58 Q32,48 42,47 H60 Q68,48 72,57 L88,59 Q94,60 94,66 V70 H8 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/><path d="M8,62 L3,55 L11,59" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<path d="M33,57 Q36,50 44,50 H50 V57 Z M53,50 H59 Q66,51 69,57 H53 Z" ${PAPER}/><path d="M12,64 H90" stroke="var(--paper)" stroke-width="1.3"/>
${[24, 78].map((x) => `<circle cx="${x}" cy="69" r="7" fill="currentColor" stroke="var(--paper)" stroke-width="2"/><circle cx="${x}" cy="69" r="2.4" ${PAPER}/>`).join('')}<path d="M2,76 H14 M34,76 H68 M88,76 H98" stroke-width="3.6"/>`),
	// Argentinien: Fitz Roy und Kondor
	AR: () =>
		M(`<path d="M6,18 Q14,12 22,16 L26,13 L30,16 Q38,12 46,18 Q36,18 31,20 L28,23 L25,20 Q16,18 6,18 Z" ${SOLID}/><path d="M6,18 l-3,-2 M8,17 l-2,-4 M46,18 l3,-2 M44,17 l2,-4" stroke-width="1.6"/>
<path d="M2,76 L16,56 L24,60 L34,34 L40,40 L48,14 L54,24 L58,18 L66,40 L74,36 L84,56 L98,76 Z" ${HALF} stroke-width="3"/>
<path d="M42,30 L48,14 L54,24 L58,18 L63,32 L58,29 L54,34 L50,28 L46,32 Z M31,41 L34,34 L38,40 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4"/>
<path d="M18,70 Q50,62 82,70" stroke-width="2.2"/><path d="M30,74 H44 M56,74 H70" stroke-width="1.6"/>${GROUND}`),
	// Chile: Moai der Osterinsel
	CL: () => {
		const moai = (x: number, s: number, hat = false) =>
			`<g transform="translate(${x},70) scale(${s})"><path d="M6,0 V-16 L2,-18 L3,-21 L2,-24 L4,-27 L-1,-29 L3,-38 L1,-40 L4,-48 Q5,-52 10,-52 H16 Q20,-52 20,-46 V0 Z" ${SOLID}/>
<path d="M14,-41 Q16,-36 14,-30 M4,-38 H9" stroke="var(--paper)" stroke-width="1.4"/>${hat ? '<rect x="6" y="-58" width="12" height="6" rx="2" fill="currentColor" stroke="currentColor" stroke-width="1"/>' : ''}</g>`;
		return M(`<path d="M88,8 q3,-3 6,0 q3,-3 6,0" stroke-width="1.8"/>
${moai(8, 1, false)}${moai(36, 1.2, true)}${moai(66, 1.05, false)}<path d="M4,76 V70 H96 V76" ${HALF} stroke-width="2.6"/>${GROUND}`);
	},
	// Kolumbien: Wachspalmen im Cocora-Tal
	CO: () => {
		const palm = (x: number, t: number, b: number) =>
			`<path d="M${x},${b} Q${x + 1.5},${(t + b) / 2} ${x},${t}" stroke-width="2.2"/><path d="M${x},${t} q-8,-2 -12,4 M${x},${t} q-6,-6 -11,-6 M${x},${t} q8,-2 12,4 M${x},${t} q6,-6 11,-6 M${x},${t} q1,-6 3,-9" stroke-width="2.2"/>`;
		return M(`${sun(14, 14, 6)}<path d="M8,48 H30 M58,36 H86" stroke-width="1.6" stroke-dasharray="4 3"/>${palm(30, 10, 66)}${palm(48, 20, 62)}${palm(68, 6, 64)}${palm(84, 24, 62)}
<path d="M2,76 Q20,52 40,62 Q60,48 80,58 Q90,54 98,60 V76 Z" ${HALF} stroke-width="2.6"/>${GROUND}`);
	},
	// Costa Rica: Faultier am Ast
	CR: () =>
		M(
			`<path d="M2,14 Q50,20 98,8" stroke-width="4"/>${[[84, 11], [92, 9], [12, 15]].map(([x, y]) => `<path d="M${x},${y} q5,6 0,13 q-5,-7 0,-13 Z" ${SOLID}/>`).join('')}
<path d="M38,34 Q35,24 39,17 M46,32 Q46,24 48,18 M62,32 Q64,24 61,17 M68,34 Q72,24 68,16" stroke-width="4.4"/>
<path d="M36,17 q3,-4 6,-1 M45,18 q3,-4 6,-1 M58,17 q3,-4 6,-1 M65,16 q3,-4 6,-1" stroke-width="1.8"/>
<ellipse cx="53" cy="38" rx="20" ry="12" ${HALF} stroke-width="2.6"/><path d="M42,40 q4,3 8,0 M56,42 q4,3 8,0" stroke-width="1.4"/>
<circle cx="31" cy="44" r="9.5" fill="var(--paper)" stroke-width="2.4"/><circle cx="31" cy="44" r="9.5" ${HALF} stroke="none"/>
<ellipse cx="27.5" cy="43" rx="3.4" ry="2.2" transform="rotate(-20 27.5 43)" ${SOLID}/><ellipse cx="34.5" cy="43" rx="3.4" ry="2.2" transform="rotate(20 34.5 43)" ${SOLID}/>
<circle cx="27.8" cy="42.8" r=".9" ${PAPER}/><circle cx="34.2" cy="42.8" r=".9" ${PAPER}/><circle cx="31" cy="47" r="1.5" ${SOLID}/><path d="M28,50 Q31,52 34,50" stroke-width="1.4"/>`,
			[0, 2, 100, 56]
		),
	// Ecuador: Galápagos-Riesenschildkröte
	EC: () =>
		M(`${sun(86, 14, 7)}<path d="M22,58 Q22,26 52,24 Q80,26 82,58 Z" ${HALF} stroke-width="3"/>
<path d="M34,58 L38,46 L52,42 L66,46 L70,58 M38,46 L32,34 M52,42 V25 M66,46 L72,34 M38,46 L52,42" stroke-width="2"/>
<path d="M18,58 H86" stroke-width="3.4"/><rect x="28" y="59" width="9" height="17" rx="2" ${SOLID}/><rect x="68" y="59" width="9" height="17" rx="2" ${SOLID}/>
<path d="M26,54 Q14,52 10,42 Q8,34 14,32 Q20,31 20,38 Q21,44 28,46 Z" ${SOLID}/><circle cx="14" cy="36" r="1.2" ${PAPER}/><path d="M82,54 l6,4" stroke-width="2.4"/>${GROUND}`),
	// Bolivien: Salzsee von Uyuni mit Spiegelung
	BO: () =>
		M(`<path d="M28,42 L44,22 Q50,18 56,22 L72,42 Z" ${HALF} stroke-width="2.6"/><path d="M41,26 L44,22 Q50,18 56,22 L59,26 L54,25 L50,28 L46,25 Z" ${SOLID}/>
<path d="M28,42 L44,62 Q50,66 56,62 L72,42" stroke-width="1.8" stroke-dasharray="3 3"/>
<path d="M8,14 q4,-6 10,-2 q4,-6 10,0 q4,0 4,4 H8 Z" ${HALF} stroke-width="1.8"/><path d="M8,70 q4,6 10,2 q4,6 10,0 q4,0 4,-4 H8" stroke-width="1.4" stroke-dasharray="2 2"/>
<path d="M2,42 H98" stroke-width="2.2"/>
<path d="M80,31 Q86,27 92,32 Q88,36 82,35 Z" ${SOLID}/><path d="M81,31 Q75,24 79,17 Q81,13 77,11" stroke-width="2.2"/><path d="M77,11 Q73,11 73,15" stroke-width="2"/><path d="M86,35 V42 M86,38 l3,3" stroke-width="1.6"/>
<path d="M80,53 Q86,57 92,52 M81,53 Q75,60 79,67 M86,49 V42" stroke-width="1.4" stroke-dasharray="2 2"/>
<path d="M2,76 l8,-3 l8,3 l8,-3 l8,3 l8,-3 l8,3 l8,-3 l8,3 l8,-3 l8,3 l8,-3 l8,3" stroke-width="1.6"/>`),
	// Guatemala: Maya-Tempel von Tikal
	GT: () => {
		let d = '';
		for (let i = 0; i < 6; i++) {
			const w = 32 - i * 4,
				y = 76 - i * 7;
			d += `<rect x="${50 - w}" y="${y - 7}" width="${w * 2}" height="7" ${HALF} stroke-width="2.2"/>`;
		}
		return M(`${d}<path d="M45,76 V34 M55,76 V34" stroke-width="2"/><path d="M45,40 H55 M45,48 H55 M45,56 H55 M45,64 H55 M45,72 H55" stroke-width="1.4"/>
<rect x="41" y="20" width="18" height="14" ${SOLID}/><path d="M47,34 V27 H53 V34" ${PAPER}/><rect x="43" y="6" width="14" height="14" ${HALF} stroke-width="2.2"/><path d="M47,10 H53 M47,15 H53" stroke-width="1.4"/>
<path d="M2,76 Q2,60 10,62 Q14,52 22,58 Q26,66 24,76 Z M98,76 Q98,62 90,62 Q86,54 80,60 Q76,68 78,76 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/>
<path d="M76,18 q4,-4 8,0 q4,-4 8,0" stroke-width="2"/>${GROUND}`);
	},
	// Fidschi: Hibiskusblüte
	FJ: () =>
		M(
			`<path d="M20,64 Q28,46 46,46 Q34,58 20,64 Z M80,66 Q72,48 54,48 Q66,60 80,66 Z" ${SOLID}/>
<g transform="translate(50,40)">${[0, 72, 144, 216, 288].map((a) => `<g transform="rotate(${a})"><path d="M0,0 C-15,-5 -18,-24 -8,-28 Q-4,-30 -2,-27 Q0,-31 3,-28 Q7,-31 9,-27 C18,-22 14,-5 0,0 Z" ${HALF} stroke-width="2.4"/><path d="M0,-5 V-20 M-3,-8 L-6,-18 M3,-8 L6,-18" stroke-width="1.2"/></g>`).join('')}
<circle r="6" ${SOLID}/></g><path d="M50,40 Q62,30 70,18" stroke-width="2.4"/>${[[70, 16], [73, 19], [67, 14], [72, 13]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" ${SOLID}/>`).join('')}`,
			[10, 4, 80, 74]
		),
	// Französisch-Polynesien: Wasserbungalows vor dem Otemanu
	PF: () => {
		const hut = (x: number) =>
			`<path d="M${x - 10},44 L${x},33 L${x + 10},44 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6"/><rect x="${x - 7}" y="44" width="14" height="8" ${HALF} stroke-width="2"/><path d="M${x - 5},52 V64 M${x + 5},52 V64" stroke-width="2"/>`;
		return M(`<path d="M44,56 Q48,30 58,20 Q62,8 66,22 Q70,32 76,40 Q86,48 98,56 Z" ${HALF} stroke-width="3"/><path d="M58,20 Q62,8 66,22 L62,24 Z" ${SOLID}/>
<path d="M2,56 H98" stroke-width="2.2"/>${hut(14)}${hut(36)}<path d="M2,52 H48 M56,64 V52 H48" stroke-width="2.2"/>
<path d="${waves(4, 68, 7, 14, 3)}" stroke-width="2"/><path d="${waves(10, 76, 6, 14, 3)}" stroke-width="2"/>`);
	},
	// Mauritius: Dodo
	MU: () =>
		M(`<path d="M40,64 Q24,60 26,44 Q28,30 44,30 Q52,30 58,36 Q74,36 78,50 Q80,62 68,66 Q56,70 40,64 Z" ${HALF} stroke-width="3"/>
<path d="M30,38 Q28,28 34,26" stroke-width="5"/><circle cx="35" cy="20" r="8" ${HALF} stroke-width="2.6"/>
<path d="M28,17 Q14,16 10,23 Q9,30 15,30 Q14,26 21,26 Q26,26 29,23 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4"/><circle cx="36" cy="18" r="1.8" ${SOLID}/>
<path d="M50,42 Q62,40 66,50 Q56,54 50,48 Z" ${SOLID}/><path d="M76,44 q8,-6 11,0 M78,49 q8,-2 8,6 M77,46 q10,-3 12,3" stroke-width="2.4"/>
<path d="M46,66 V76 M58,66 V76" stroke-width="3.4"/><path d="M41,76 H51 M53,76 H63" stroke-width="2.6"/>${GROUND}`),
	// Antarktis: Kaiserpinguine auf dem Eis
	AQ: () => {
		const peng = (x: number, s: number, chick = false) =>
			`<g transform="translate(${x},74) scale(${s})"><path d="M0,-40 Q-8,-40 -8,-30 Q-12,-14 -8,-2 L-10,0 H10 L8,-2 Q12,-14 8,-30 Q8,-40 0,-40 Z" ${chick ? HALF : 'fill="currentColor"'} stroke="currentColor" stroke-width="1.6"/>` +
			(chick ? '<circle cx="-1" cy="-32" r="4" fill="var(--paper)" stroke="currentColor" stroke-width="1.4"/>' : '<path d="M-3,-30 Q-8,-16 -5,-3 H4 Q8,-16 4,-30 Q0,-33 -3,-30 Z" fill="var(--paper)" stroke="none"/><path d="M-2,-34 q-3,2 -2,5" stroke="var(--paper)" stroke-width="1.6"/>') +
			'<path d="M-7,-35 L-13,-32 L-7,-33" fill="currentColor" stroke="currentColor" stroke-width="1.2"/></g>';
		return M(`<path d="M52,44 L62,22 L72,28 L80,18 L94,44 Z" ${HALF} stroke-width="2.6"/><path d="M62,22 L66,34 M80,18 L78,32" stroke-width="1.4"/>
${star(12, 10, 2.4)}${star(30, 18, 2)}${star(22, 4, 1.6)}${peng(30, 1.1)}${peng(54, 0.95)}${peng(74, 0.55, true)}
<path d="M2,76 Q20,72 40,76 T98,74" stroke-width="2.6"/><path d="M2,52 Q12,48 24,52 M84,50 Q92,48 98,50" stroke-width="1.6"/>`);
	},
	// Grönland: Eisberg mit Kajak
	GL: () =>
		M(`<path d="M8,10 Q30,2 50,10 T96,8 M10,20 Q34,12 52,20 T96,18" stroke-width="2" stroke-dasharray="3 4"/>
<path d="M34,46 L44,26 L52,32 L60,18 L74,46 Z" ${HALF} stroke-width="3"/><path d="M60,18 L58,34 M44,26 L48,40" stroke-width="1.6"/>
<path d="M30,48 L22,62 L36,76 L70,74 L82,58 L76,48" stroke-width="2" stroke-dasharray="3 3"/><path d="M2,46 H98" stroke-width="2.4"/>
<path d="M4,44 Q14,48 26,44" stroke-width="3"/><circle cx="15" cy="37" r="2.4" ${SOLID}/><path d="M15,40 V44 M8,36 L22,46" stroke-width="2"/>
<path d="${waves(84, 54, 1, 12, 3)}" stroke-width="1.8"/><path d="${waves(4, 58, 1, 12, 3)}" stroke-width="1.8"/>`),
	// Vatikanstadt: Kuppel des Petersdoms
	VA: () =>
		M(`<path d="M50,6 V-2 M47,1 H53" stroke-width="2"/><rect x="46" y="6" width="8" height="9" ${SOLID}/>
<path d="M26,50 Q26,18 50,14 Q74,18 74,50 Z" ${HALF} stroke-width="3"/><path d="M38,49 Q38,22 50,15 M62,49 Q62,22 50,15 M50,15 V49" stroke-width="1.8"/>
<rect x="22" y="50" width="56" height="10" ${HALF} stroke-width="2.6"/><path d="M27,51 V59 M33,51 V59 M45,51 V59 M55,51 V59 M67,51 V59 M73,51 V59" stroke-width="1.6"/>
<rect x="6" y="60" width="88" height="16" ${HALF} stroke-width="2.6"/><path d="M12,62 V76 M20,62 V76 M30,62 V76 M70,62 V76 M80,62 V76 M88,62 V76" stroke-width="2.2"/><path d="M44,76 V66 Q50,60 56,66 V76" ${SOLID}/>
${[10, 22, 34, 66, 78, 90].map((x) => `<circle cx="${x}" cy="57" r="1.6" ${SOLID}/>`).join('')}${GROUND}`, [0, -4, 100, 82]),
	// Brunei: Omar-Ali-Saifuddien-Moschee in der Lagune mit Königsbarke
	BN: () =>
		M(`<path d="M50,8 V2 M47.5,4 Q50,7 52.5,4" stroke-width="1.8"/><path d="M38,40 Q35,26 50,14 Q65,26 62,40 Z" ${SOLID}/>
<rect x="28" y="40" width="44" height="18" ${HALF} stroke-width="2.6"/>${[34, 42, 58, 66].map((x) => `<path d="M${x - 2.5},56 V48 Q${x},44 ${x + 2.5},48 V56 Z" ${SOLID}/>`).join('')}<path d="M46,58 V48 Q50,43 54,48 V58" ${SOLID}/>
<path d="M27,40 Q31,33 35,40 Z M65,40 Q69,33 73,40 Z" ${SOLID}/><rect x="78" y="20" width="6" height="38" ${HALF} stroke-width="2.2"/><path d="M76.5,20 Q81,11 85.5,20 Z" ${SOLID}/><path d="M81,12 V6" stroke-width="1.6"/>
<path d="M20,58 H90" stroke-width="2.6"/><path d="M4,62 Q6,68 14,68 H30 Q36,68 38,62 Z" ${SOLID}/><path d="M38,62 L42,57 M4,62 L2,57" stroke-width="2"/><path d="M14,62 V56 H28 V62" stroke-width="1.8"/>
<path d="M30,66 V72 M70,66 V72 M50,66 V74" stroke-width="1.4" stroke-dasharray="2 2"/><path d="${waves(4, 77, 6, 15, 3)}" stroke-width="2.2"/>`),
	// Dominikanische Republik: Buckelwal vor Samaná unter Palmen
	DO: () =>
		M(`${sun(84, 12, 7)}<path d="M14,58 Q12,40 22,22" stroke-width="3"/><path d="M22,22 Q12,16 4,24 M22,22 Q18,10 8,9 M22,22 Q30,10 40,12 M22,22 Q34,18 38,30 M22,22 Q24,14 20,7" stroke-width="2.8"/>
<path d="M2,58 Q8,52 18,56 Q24,58 30,58" ${HALF} stroke-width="2.2"/>
<path d="M58,60 L62,42 H68 L72,60 Z" ${SOLID}/><path d="M65,42 C56,40 48,32 44,20 Q52,24 58,24 Q63,26 65,31 Q67,26 72,24 Q78,24 86,20 C82,32 74,40 65,42 Z" ${SOLID}/>
<path d="M46,26 V34 M84,26 V32 M50,30 V38" stroke-width="1.6" stroke-dasharray="2 3"/>
<path d="M34,60 Q46,56 56,61 M74,61 Q84,56 98,60" stroke-width="2.4"/><path d="${waves(4, 68, 7, 14, 3)}" stroke-width="2"/><path d="${waves(10, 76, 6, 14, 3)}" stroke-width="2"/>`),
	// Jamaika: Kolibri „Doctor Bird" an der Blüte
	JM: () =>
		M(`<path d="M10,76 Q6,62 12,50" stroke-width="2.4"/><path d="M12,50 Q4,48 2,40 Q10,40 12,50 Z" ${SOLID}/><path d="M22,38 L8,44 L14,52 Z" ${HALF} stroke-width="2.2"/><path d="M8,44 L5,42 M10,48 L6,49" stroke-width="1.6"/>
<path d="M33,25 L19,37" stroke-width="2"/><circle cx="38" cy="22" r="6" ${SOLID}/><circle cx="39.5" cy="20.5" r="1.3" ${PAPER}/>
<path d="M42,26 Q50,26 58,34 Q62,40 56,44 Q48,44 42,36 Q38,30 42,26 Z" ${SOLID}/><path d="M48,30 Q56,6 82,2 Q72,18 56,34 Z" ${HALF} stroke-width="2.4"/><path d="M54,26 Q62,14 74,8" stroke-width="1.4"/>
<path d="M56,42 Q68,62 94,64 M58,40 Q74,58 92,74" stroke-width="2.2"/><path d="M94,64 q4,1 3,5 q-4,0 -3,-5 Z M92,74 q4,0 4,4 q-4,1 -4,-4 Z" ${SOLID}/>`),
	// Bahamas: Flamingo im flachen Wasser
	BS: () =>
		M(`${sun(84, 14, 7)}<path d="M44,40 Q40,28 54,26 Q70,24 80,34 Q72,44 56,44 Q46,44 44,40 Z" ${SOLID}/><path d="M58,32 Q66,30 74,36" stroke="var(--paper)" stroke-width="1.6"/>
<path d="M46,34 Q34,30 36,18 Q38,8 30,8 Q24,8 24,14" stroke-width="3.6"/><circle cx="27" cy="11" r="4" ${SOLID}/><path d="M23,12 Q18,14 19,21" stroke-width="2.8"/><circle cx="27.5" cy="10" r="1" ${PAPER}/>
<path d="M58,44 V70" stroke-width="2.2"/><path d="M62,44 L70,54 L60,58" stroke-width="2"/>
<path d="M44,70 Q58,66 72,70" stroke-width="2"/><path d="${waves(4, 72, 7, 14, 3)}" stroke-width="2"/><path d="${waves(12, 78, 6, 14, 3)}" stroke-width="2"/>`, [0, 2, 100, 78]),
	// Panama: Frachter in der Kanalschleuse
	PA: () =>
		M(`<path d="M2,40 Q20,26 40,34 Q60,22 80,32 Q90,28 98,34" stroke-width="2"/><rect x="2" y="50" width="12" height="26" ${HALF} stroke-width="2.4"/><rect x="86" y="50" width="12" height="26" ${HALF} stroke-width="2.4"/>
<path d="M14,52 H86" stroke-width="1.4" stroke-dasharray="3 3"/><path d="M16,52 H84 L78,64 H22 Z" ${SOLID}/><path d="M24,58 H76" stroke="var(--paper)" stroke-width="1.4"/>
${[22, 32, 42, 52].map((x, i) => `<rect x="${x}" y="${i % 2 ? 40 : 44}" width="9" height="${i % 2 ? 12 : 8}" ${i % 2 ? SOLID : HALF} stroke-width="1.8"/>`).join('')}
<rect x="66" y="32" width="12" height="20" ${HALF} stroke-width="2.2"/><path d="M68,37 H76" stroke-width="2.4"/><rect x="70" y="24" width="5" height="8" ${SOLID}/>
<path d="M14,66 H86" stroke-width="2"/><path d="${waves(16, 72, 5, 14, 3)}" stroke-width="1.8"/>${GROUND}`),
	// Zypern: Aphrodite-Felsen im Abendlicht
	CY: () =>
		M(`<path d="M60,56 A18,18 0 0 1 96,56" ${HALF} stroke-width="2.4"/><path d="M62,40 l-4,-4 M78,34 V28 M94,40 l4,-4" stroke-width="2"/>
<path d="M14,22 q3,-3 6,0 q3,-3 6,0 M30,12 q2.5,-2.5 5,0 q2.5,-2.5 5,0" stroke-width="1.8"/>
<path d="M32,60 Q32,34 46,30 Q58,30 62,44 L64,60 Z" ${SOLID}/><path d="M42,40 Q46,36 52,38" stroke="var(--paper)" stroke-width="1.6"/><path d="M14,60 Q16,48 24,48 Q30,50 30,60 Z" ${HALF} stroke-width="2.2"/>
<path d="M2,60 H98" stroke-width="2.4"/><path d="M66,64 H92 M70,68 H88 M74,72 H84" stroke-width="1.8" stroke-dasharray="4 3"/><path d="${waves(4, 70, 4, 14, 3)}" stroke-width="2"/>${GROUND}`),
	// Bulgarien: Rose aus dem Rosental
	BG: () =>
		M(`<path d="M30,30 Q26,52 50,58 Q74,52 70,30 Q64,44 50,44 Q36,44 30,30 Z" ${HALF} stroke-width="2.6"/>
<path d="M38,34 Q36,18 50,15 Q64,18 62,34 Q56,40 50,36 Q44,40 38,34 Z" ${SOLID}/><path d="M50,31 Q44,27 49,22 Q56,22 55,29 M43,24 Q46,18 52,18" stroke="var(--paper)" stroke-width="1.6"/>
<path d="M50,58 Q47,68 50,78" stroke-width="3"/><path d="M49,66 Q36,58 28,64 Q38,72 49,66 Z M51,72 Q64,62 73,67 Q63,76 51,72 Z" ${SOLID}/><path d="M48,62 l-3,-2 M51,70 l3,-1" stroke-width="1.4"/>
<path d="M22,18 q-4,4 0,8 q4,-4 0,-8 Z M78,20 q-4,4 0,8 q4,-4 0,-8 Z" ${SOLID}/>`, [16, 12, 68, 66]),
	// Rumänien: Schloss Bran auf dem Felsen
	RO: () =>
		M(`<path d="M86,6 A9,9 0 1 0 95,20 A7,7 0 1 1 86,6 Z" ${SOLID}/><path d="M66,12 q3,-4 6,0 q3,-4 6,0 l-6,3 Z" ${SOLID}/>
<path d="M8,76 Q14,58 28,56 H74 Q88,58 94,76 Z" ${HALF} stroke-width="2.6"/><path d="M20,68 l6,-4 M70,66 l8,4" stroke-width="1.6"/>
<rect x="30" y="32" width="38" height="24" ${HALF} stroke-width="2.6"/><path d="M28,34 L38,24 H62 L70,34 Z" ${SOLID}/>
<rect x="18" y="22" width="13" height="34" ${HALF} stroke-width="2.4"/><path d="M16,22 L24.5,4 L33,22 Z" ${SOLID}/><rect x="64" y="26" width="12" height="30" ${HALF} stroke-width="2.4"/><path d="M62,26 L70,12 L78,26 Z" ${SOLID}/>
${[[22, 30], [22, 42], [69, 34], [69, 44], [38, 40], [48, 40], [58, 40]].map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="6" ${SOLID}/>`).join('')}${GROUND}`),
	// Montenegro: Bucht von Kotor mit Inselkirche
	ME: () =>
		M(`<path d="M2,62 L12,18 L22,30 L30,22 L42,62 Z" ${HALF} stroke-width="2.6"/><path d="M98,62 L88,12 L76,30 L70,24 L58,62 Z" ${HALF} stroke-width="2.6"/>
<path d="M12,18 L16,28 L20,26 M88,12 L84,24 L80,22" stroke-width="1.6"/><path d="M2,62 H98" stroke-width="2.2"/>
<ellipse cx="50" cy="62" rx="12" ry="3" ${SOLID}/><rect x="42" y="50" width="12" height="11" ${HALF} stroke-width="2"/><path d="M43,50 Q48,40 53,50 Z" ${SOLID}/><path d="M48,42 V38" stroke-width="1.4"/>
<rect x="55" y="44" width="5" height="17" ${SOLID}/><path d="M54.5,44 L57.5,37 L60.5,44 Z" ${SOLID}/>
<path d="M40,68 H60 M44,72 H56" stroke-width="1.6" stroke-dasharray="3 3"/><path d="${waves(4, 70, 2, 14, 3)}" stroke-width="2"/><path d="${waves(70, 70, 2, 14, 3)}" stroke-width="2"/>${GROUND}`),
	// Estland: Türme der Tallinner Altstadt
	EE: () => {
		const tower = (x: number, w: number, top: number, spire: number) =>
			`<rect x="${x - w / 2}" y="${top}" width="${w}" height="${56 - top}" ${HALF} stroke-width="2.4"/><path d="M${x - w / 2 - 2},${top} L${x},${top - spire} L${x + w / 2 + 2},${top} Z" ${SOLID}/><rect x="${x - 1.5}" y="${top + 6}" width="3" height="6" ${SOLID}/>`;
		return M(`${tower(20, 14, 30, 22)}${tower(46, 10, 30, 30)}${tower(68, 12, 26, 20)}${tower(86, 10, 38, 14)}
<rect x="2" y="56" width="96" height="20" ${HALF} stroke-width="2.6"/><path d="M2,56 V51 H8 V56 M14,56 V51 H20 V56 M80,56 V51 H86 V56 M92,56 V51 H98 V56" stroke-width="2"/>
<path d="M42,76 V66 Q48,60 54,66 V76" ${SOLID}/><path d="M8,64 H34 M64,64 H92" stroke-width="1.4" stroke-dasharray="3 3"/>${GROUND}`, [0, -2, 100, 80]);
	},
	// Monaco: Jacht vor dem Felsen
	MC: () =>
		M(`<path d="M50,52 Q56,30 70,28 L78,22 H98 V52 Z" ${HALF} stroke-width="2.4"/>${[[62, 34], [70, 30], [80, 26], [90, 26]].map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="${52 - y}" fill="var(--paper)" stroke-width="1.6"/>`).join('')}
<path d="M86,26 Q91,16 96,26" ${SOLID}/>${sun(16, 14, 6)}
<path d="M6,56 H94 L86,68 H18 Z" ${SOLID}/><path d="M22,56 V48 H70 L78,56 M32,48 V40 H62 L66,48" ${HALF} stroke-width="2.2"/><path d="M26,52 H70 M36,44 H60" stroke-width="1.6" stroke-dasharray="3 2"/>
<path d="M48,40 V30 M44,34 H52" stroke-width="1.8"/><path d="M12,62 H88" stroke="var(--paper)" stroke-width="1.4"/><path d="${waves(4, 76, 6, 15, 3)}" stroke-width="2.2"/>`),
	// Georgien: Gergeti-Kirche vor dem Kasbek
	GE: () =>
		M(`<path d="M30,62 L62,8 L98,62 Z" ${HALF} stroke-width="2.6"/><path d="M52,25 L62,8 L72,25 L67,22 L62,28 L57,22 Z" ${SOLID}/>
<path d="M2,76 Q10,52 28,48 Q44,48 56,76 Z" ${HALF} stroke-width="2.6"/>
<rect x="16" y="38" width="22" height="10" ${SOLID}/><rect x="23" y="27" width="8" height="11" ${SOLID}/><path d="M22,27 L27,18 L32,27 Z" ${SOLID}/><path d="M27,18 V13 M25,15 H29" stroke-width="1.4"/>
<rect x="40" y="40" width="5" height="8" ${SOLID}/><path d="M39.5,40 L42.5,35 L45.5,40 Z" ${SOLID}/><path d="M24,48 V43 Q27,40 30,43 V48" ${PAPER}/>
<path d="M78,20 q3,-3 6,0 q3,-3 6,0" stroke-width="1.6"/>${GROUND}`),
	// Armenien: Kloster Chor Virap vor dem Ararat
	AM: () =>
		M(`<path d="M4,58 L44,8 L66,34 L76,26 L98,58 Z" ${HALF} stroke-width="2.6"/><path d="M33,22 L44,8 L55,22 L50,20 L44,26 L38,20 Z M72,30 L76,26 L80,30 L76,32 Z" ${SOLID}/>
<path d="M2,76 Q20,60 50,62 Q72,62 88,76" ${HALF} stroke-width="2.4"/>
<path d="M28,64 V56 H32 V60 H36 V56 H40 V60 H60 V56 H64 V60 H68 V56 H72 V66 H28 Z" ${SOLID}/><rect x="42" y="46" width="16" height="14" ${SOLID}/><rect x="46" y="38" width="8" height="8" ${SOLID}/><path d="M45,38 L50,29 L55,38 Z" ${SOLID}/>
<path d="M50,29 V24 M48,26 H52" stroke-width="1.4"/><path d="M48,60 V54 Q50,51 52,54 V60" ${PAPER}/>${GROUND}`),
	// Aserbaidschan: Flame Towers in Baku
	AZ: () => {
		const flame = (x: number, w: number, top: number, fill: string) =>
			`<path d="M${x - w},76 V${top + 30} Q${x - w},${top + 8} ${x + w * 0.2},${top} Q${x + w * 0.1},${top + 12} ${x + w},${top + 22} V76 Z" ${fill} stroke-width="2.6"/>`;
		let win = '';
		for (let y = 26; y < 72; y += 6) win += `M40,${y} H58 `;
		return M(`${flame(26, 14, 22, HALF)}${flame(74, 14, 20, HALF)}${flame(50, 12, 2, SOLID)}<path d="${win}" stroke="var(--paper)" stroke-width="1.4" stroke-dasharray="3 2"/>
<path d="M16,46 H36 M16,56 H36 M64,44 H84 M64,54 H84" stroke-width="1.4" stroke-dasharray="3 3"/><path d="M2,68 Q8,64 14,68" stroke-width="1.8"/>${GROUND}`);
	},
	// Kasachstan: Bajterek-Turm in Astana
	KZ: () =>
		M(`<path d="M42,76 Q47,52 43,32 M58,76 Q53,52 57,32 M50,74 V32" stroke-width="2.6"/><path d="M44,40 L56,48 M56,40 L44,48 M45,54 L55,62 M55,54 L45,62" stroke-width="1.4"/>
<path d="M43,32 Q32,26 34,12 M57,32 Q68,26 66,12 M47,31 Q42,22 42,14 M53,31 Q58,22 58,14" stroke-width="2.2"/>
<circle cx="50" cy="17" r="10" ${SOLID}/><path d="M44,13 Q47,9 51,9" stroke="var(--paper)" stroke-width="1.8"/>
<rect x="36" y="70" width="28" height="6" ${HALF} stroke-width="2"/><rect x="6" y="56" width="14" height="20" ${HALF} stroke-width="2.2"/><rect x="80" y="50" width="14" height="26" ${HALF} stroke-width="2.2"/>
<path d="M10,62 H16 M10,68 H16 M84,56 H90 M84,62 H90 M84,68 H90" stroke-width="1.6"/>${GROUND}`),
	// Oman: Dau unter vollem Segel
	OM: () =>
		M(`${sun(86, 14, 7)}<path d="M52,58 L48,8" stroke-width="2.6"/><path d="M18,44 L80,4" stroke-width="2.6"/><path d="M22,42 L78,8 L64,56 Z" ${HALF} stroke-width="2.4"/>
<path d="M6,48 L16,66 H80 L96,48 L86,54 H22 Z" ${SOLID}/><path d="M18,60 H84" stroke="var(--paper)" stroke-width="1.4"/><path d="M6,48 L4,42 M96,48 L98,44" stroke-width="2"/>
<path d="${waves(4, 70, 7, 14, 3)}" stroke-width="2"/><path d="${waves(10, 77, 6, 14, 3)}" stroke-width="2"/>`),
	// Katar: Falke auf dem Sitzblock
	QA: () =>
		M(`<path d="M41,22 Q34,40 40,58 L46,64 H58 L62,56 Q68,38 59,22 Z" ${SOLID}/><circle cx="50" cy="17" r="9" ${SOLID}/>
<path d="M57,15 Q64,16 62,23 L59,20" ${SOLID}/><circle cx="53" cy="14.5" r="2.2" ${PAPER}/><circle cx="53.4" cy="14.5" r="1" ${SOLID}/><path d="M52,19 Q50,24 52,28" stroke="var(--paper)" stroke-width="1.6"/>
<path d="M44,32 Q40,46 46,58 M48,36 Q46,46 50,54" stroke="var(--paper)" stroke-width="1.4"/><path d="M47,64 L45,74 H57 L55,64 Z" ${SOLID}/>
<path d="M48,62 V68 M54,62 V68" stroke-width="2.2"/><rect x="34" y="66" width="34" height="5" rx="2" ${HALF} stroke-width="2"/><path d="M51,71 V76" stroke-width="3"/>
<rect x="6" y="50" width="8" height="26" ${HALF} stroke-width="2"/><rect x="16" y="40" width="9" height="36" ${HALF} stroke-width="2"/><path d="M80,76 V46 Q86,30 92,46 V76" ${HALF} stroke-width="2"/>${GROUND}`),
	// Saudi-Arabien: Elefantenfelsen bei AlUla
	SA: () =>
		M(`${star(14, 10, 2.4)}${star(30, 6, 1.8)}${star(84, 8, 2)}<path d="M66,12 A8,8 0 1 0 74,24 A6,6 0 1 1 66,12 Z" ${SOLID}/>
<path d="M12,76 V48 Q12,24 38,22 Q64,20 74,34 Q82,44 82,58 Q82,68 86,76 H76 Q74,60 70,52 Q66,60 66,76 Z" ${SOLID}/>
<path d="M22,36 Q30,30 40,32 M18,50 Q30,44 46,48 M50,30 Q58,34 60,44 M24,62 H44" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M2,72 Q20,66 40,72 Q70,66 98,72" stroke-width="1.8"/>${GROUND}`),
	// Laos: Goldene Stupa That Luang
	LA: () => {
		let spires = '';
		for (const x of [18, 28, 38, 62, 72, 82]) spires += `<path d="M${x - 3},60 L${x},48 L${x + 3},60 Z" ${SOLID}/>`;
		return M(`<rect x="10" y="60" width="80" height="16" ${HALF} stroke-width="2.6"/><rect x="24" y="50" width="52" height="10" ${HALF} stroke-width="2.4"/>${spires}
<path d="M36,50 Q36,38 50,32 Q64,38 64,50 Z" ${SOLID}/><path d="M42,50 Q44,42 50,38 Q56,42 58,50" stroke="var(--paper)" stroke-width="1.4"/><path d="M46,33 L50,2 L54,33 Z" ${SOLID}/>
<path d="M47,18 H53 M46.5,24 H53.5" stroke="var(--paper)" stroke-width="1.2"/><path d="M44,76 V68 Q50,62 56,68 V76" ${SOLID}/><path d="M16,68 H38 M62,68 H84" stroke-width="1.4" stroke-dasharray="2 3"/>${GROUND}`);
	},
	// Hongkong: Dschunke vor der Skyline
	HK: () =>
		M(`${[[4, 30, 10], [16, 18, 9], [62, 26, 10], [74, 12, 8], [84, 28, 12]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${58 - y}" ${HALF} stroke-width="1.8"/>`).join('')}
<path d="M26,58 V22 L34,4 L42,22 V58" ${HALF} stroke-width="1.8"/><path d="M26,22 L42,40 M42,22 L26,40" stroke-width="1.2"/>
<path d="M12,58 Q14,68 28,68 H70 Q84,68 88,56 L80,60 H18 Z" ${SOLID}/>
<path d="M44,58 V16 Q60,20 64,56 Z" ${SOLID}/><path d="M66,58 V30 Q78,34 80,56 Z" ${SOLID}/><path d="M22,58 V34 Q32,38 34,56 Z" ${SOLID}/>
<path d="M45,26 Q54,27 58,28 M45,36 Q55,36 60,38 M45,46 Q56,46 62,47 M67,40 Q74,41 77,42 M67,48 Q75,48 79,49 M23,44 Q29,44 31,45" stroke="var(--paper)" stroke-width="1.4"/>
<path d="${waves(4, 72, 7, 14, 3)}" stroke-width="2"/><path d="${waves(10, 78, 6, 14, 3)}" stroke-width="2"/>`, [0, 2, 100, 78]),
	// Bhutan: Kloster Tigernest an der Felswand
	BT: () =>
		M(`<path d="M62,2 Q54,18 60,34 Q50,52 56,76 H98 V2 Z" ${HALF} stroke-width="2.6"/><path d="M70,14 l6,8 M80,40 l8,6 M68,58 l6,10" stroke-width="1.4"/>
<path d="M30,30 L38,24 H54 L62,30 Z" ${SOLID}/><rect x="34" y="30" width="24" height="12" fill="var(--paper)" stroke-width="2.2"/><path d="M40,34 V38 M46,34 V38 M52,34 V38" stroke-width="2"/>
<path d="M20,46 L26,41 H44 L50,46 Z" ${SOLID}/><rect x="23" y="46" width="24" height="10" fill="var(--paper)" stroke-width="2.2"/><path d="M29,49 V53 M35,49 V53 M41,49 V53" stroke-width="2"/>
<path d="M48,8 L50,24 M46,22 H54" stroke-width="1.6"/><path d="M2,62 Q14,54 26,58" stroke-width="1.6"/>${[6, 12, 18, 24].map((x, i) => `<rect x="${x - 2}" y="${58 + (i % 2) - (x - 2) / 8}" width="3.5" height="5" ${i % 2 ? SOLID : HALF} stroke-width="1"/>`).join('')}
<path d="M4,30 q4,-6 10,-2 q4,-4 8,0" stroke-width="1.8"/><path d="M2,76 Q14,66 26,70 Q38,64 52,76" ${HALF} stroke-width="2"/>`),
	// Seychellen: Granitfelsen und Palme auf La Digue
	SC: () =>
		M(`${sun(16, 14, 6)}<path d="M8,76 Q4,50 24,46 Q42,44 44,62 Q46,76 38,76 Z" ${HALF} stroke-width="2.6"/><path d="M38,76 Q34,38 60,34 Q80,34 82,56 L80,76 Z" ${HALF} stroke-width="2.6"/>
<path d="M50,44 Q48,56 52,70 M60,40 Q58,54 62,72 M70,42 Q70,56 72,70 M20,52 Q18,62 22,72 M30,52 Q30,62 32,72" stroke-width="1.4"/>
<path d="M90,76 Q92,46 76,22" stroke-width="3"/><path d="M76,22 Q64,18 58,28 M76,22 Q70,10 58,10 M76,22 Q84,8 96,12 M76,22 Q90,22 94,34 M76,22 Q78,14 74,6" stroke-width="2.8"/>
<path d="M2,70 Q6,66 10,70" stroke-width="1.6"/>${GROUND}`),
	// Botsuana: Mokoro im Okavango-Delta
	BW: () =>
		M(`${sun(84, 14, 7)}<path d="M8,76 V40 M14,76 V34 M20,76 V44" stroke-width="1.8"/>${[[8, 40], [14, 34], [20, 44]].map(([x, y]) => `<path d="M${x},${y} l-5,-6 M${x},${y} l0,-8 M${x},${y} l5,-6 M${x},${y} l-7,-2 M${x},${y} l7,-2" stroke-width="1.4"/>`).join('')}
<path d="M26,60 Q54,70 90,60 Q56,64 26,60 Z" fill="currentColor" stroke="currentColor" stroke-width="2.4"/>
<circle cx="66" cy="30" r="3.6" ${SOLID}/><path d="M66,34 V48 M66,48 L62,59 M66,48 L70,59 M66,38 L74,34" stroke-width="3"/><path d="M58,76 L80,14" stroke-width="1.8"/>
<path d="M34,70 Q38,66 44,70 Z M80,70 Q84,66 90,70 Z" ${SOLID}/><path d="${waves(30, 76, 4, 14, 3)}" stroke-width="2"/>`),
	// Ruanda: Berggorilla im Bambus
	RW: () =>
		M(`<path d="M8,76 V10 M92,76 V14 M16,76 V30" stroke-width="2"/><path d="M8,30 l-6,-4 M8,46 l6,-6 M92,32 l6,-4 M92,50 l-6,-6 M16,44 l6,-4" stroke-width="1.8"/>
<path d="M24,76 Q20,50 30,38 Q34,30 40,28 Q38,16 48,12 Q58,10 61,20 Q62,26 59,30 Q72,32 78,46 Q84,60 82,76 Z" ${SOLID}/>
<path d="M43,22 Q50,19 57,22 M44,26 Q50,23 56,26" stroke="var(--paper)" stroke-width="1.6"/><circle cx="46" cy="24.5" r="1.3" ${PAPER}/><circle cx="54" cy="24.5" r="1.3" ${PAPER}/>
<path d="M46,32 Q50,35 54,32" stroke="var(--paper)" stroke-width="1.4"/><path d="M36,46 Q30,62 36,76 M70,46 Q76,62 70,76 M44,64 Q50,62 56,64" stroke="var(--paper)" stroke-width="1.6"/>`),
	// Äthiopien: Felsenkirche Bet Giyorgis in Lalibela
	ET: () =>
		M(`<path d="M12,4 H88 Q94,4 94,10 V70 Q94,76 88,76 H12 Q6,76 6,70 V10 Q6,4 12,4 Z" ${HALF} stroke-width="2.4" stroke-dasharray="5 3"/>
<path d="M40,10 H60 V30 H80 V50 H60 V70 H40 V50 H20 V30 H40 Z" ${SOLID}/><path d="M44,14 H56 V34 H76 V46 H56 V66 H44 V46 H24 V34 H44 Z M48,18 H52 V38 H72 V42 H52 V62 H48 V42 H28 V38 H48 Z" stroke="var(--paper)" stroke-width="1.4"/>`, [4, 2, 92, 76]),
	// Senegal: bunte Pirogen am Strand
	SN: () =>
		M(`${sun(84, 12, 6)}<path d="M20,44 Q30,50 52,50 Q74,50 82,40 L78,44 Q66,46 52,46 Q34,46 22,40 Z" ${HALF} stroke-width="2"/>
<path d="M6,54 Q18,68 50,68 Q80,68 94,50 L88,56 Q72,60 50,60 Q24,60 10,48 Z" ${SOLID}/><path d="M18,62 L26,58 L34,62 L42,58 L50,62 L58,58 L66,62 L74,58 L82,62" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M10,48 V36 M94,50 V38" stroke-width="2"/><path d="M10,36 l8,3 l-8,3 Z M94,38 l-8,3 l8,3 Z" ${SOLID}/><path d="M22,40 V32 M82,40 V32" stroke-width="1.6"/>
<path d="M2,72 Q26,68 50,72 Q74,68 98,72" stroke-width="1.8"/>${GROUND}`),
	// Venezuela: Salto Ángel am Tafelberg
	VE: () =>
		M(`<path d="M8,76 L16,22 Q18,14 28,14 H80 Q88,14 90,22 L96,76 Z" ${HALF} stroke-width="3"/><path d="M14,30 H24 M80,30 H90 M18,22 H34 M70,22 H86" stroke-width="1.4"/>
<path d="M46,14 V58 M50,14 V62 M54,14 V58" stroke-width="2" stroke-dasharray="6 3"/><path d="M40,62 q4,-6 10,-2 q6,-4 10,2 q-10,4 -20,0 Z" ${SOLID}/>
<path d="M30,8 q4,-6 10,-2 q4,-4 8,0 M64,8 q3,-4 7,-1 q3,-3 6,0" stroke-width="1.8"/>
<path d="M2,76 Q4,64 12,66 Q16,58 24,64 Q30,58 36,66 Q42,60 48,68 Q56,62 62,68 Q68,58 76,64 Q82,58 88,66 Q94,62 98,68 V76 Z" ${SOLID}/>`),
	// Uruguay: Mate-Becher mit Bombilla und Thermoskanne
	UY: () =>
		M(`<path d="M28,40 Q20,60 34,74 H60 Q74,60 66,40 Z" ${HALF} stroke-width="3"/><rect x="25" y="34" width="44" height="6" rx="2" ${SOLID}/><path d="M30,37 H64" stroke="var(--paper)" stroke-width="1.2" stroke-dasharray="2 2"/>
<path d="M54,36 L70,4 M68,4 H74" stroke-width="3"/><path d="M30,74 H64" stroke-width="3"/><path d="M36,52 Q46,48 56,54" stroke-width="1.6"/>
<rect x="78" y="28" width="14" height="48" rx="3" ${SOLID}/><path d="M80,28 V22 H90 V28 M90,24 H96 V30" stroke-width="2.4"/><path d="M80,40 H90 M80,62 H90" stroke="var(--paper)" stroke-width="1.6"/>
${sun(14, 14, 6)}<path d="M14,4 V2 M14,24 V26 M4,14 H2 M24,14 H26 M7,7 L5.5,5.5 M21,21 L22.5,22.5 M21,7 L22.5,5.5 M7,21 L5.5,22.5" stroke-width="1.8"/>${GROUND}`),
	// Ukraine: Sonnenblume über dem Weizenfeld
	UA: () => {
		let petals = '';
		for (let i = 0; i < 16; i++) petals += `<path d="M0,-12 Q5,-20 0,-27 Q-5,-20 0,-12 Z" transform="rotate(${i * 22.5})" ${HALF} stroke-width="1.8"/>`;
		let seeds = '';
		for (const [x, y] of [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4], [0, -7], [0, 7], [-7, 0], [7, 0]]) seeds += `<circle cx="${x}" cy="${y}" r="1" ${PAPER}/>`;
		return M(`<g transform="translate(50,30)">${petals}<circle r="12" ${SOLID}/>${seeds}</g>
<path d="M50,42 Q47,60 50,76" stroke-width="3.2"/><path d="M49,56 Q34,48 24,56 Q36,64 49,56 Z M51,64 Q66,54 76,62 Q64,70 51,64 Z" ${SOLID}/>
<path d="M4,76 V62 M10,76 V58 M16,76 V64 M84,76 V60 M90,76 V56 M96,76 V62" stroke-width="1.8"/>${[[4, 62], [10, 58], [16, 64], [84, 60], [90, 56], [96, 62]].map(([x, y]) => `<ellipse cx="${x}" cy="${y - 3}" rx="1.8" ry="4" ${SOLID}/>`).join('')}${GROUND}`, [0, 0, 100, 80]);
	},
	// Libanon: Zeder
	LB: () => {
		let t = '';
		for (const [y, w] of [[64, 42], [52, 34], [41, 26], [30, 18], [20, 10]])
			t += `<path d="M${50 - w},${y} Q${50 - w / 2},${y - 10} 50,${y - 6} Q${50 + w / 2},${y - 10} ${50 + w},${y} Q${50 + w / 2},${y - 3} 50,${y + 1} Q${50 - w / 2},${y - 3} ${50 - w},${y} Z" ${SOLID}/>`;
		return M(`<path d="M50,76 V12" stroke-width="4"/><path d="M50,62 L36,56 M50,50 L62,46 M50,40 L40,36" stroke-width="2.4"/>${t}<path d="M50,14 V8" stroke-width="2.4"/>${GROUND}`);
	},
	// Puerto Rico: Wachhäuschen (Garita) von El Morro
	PR: () =>
		M(`${sun(84, 14, 7)}<rect x="2" y="52" width="70" height="24" ${HALF} stroke-width="2.6"/><path d="M2,60 H72 M2,68 H72 M14,52 V60 M30,52 V60 M46,52 V60 M62,52 V60 M22,60 V68 M38,60 V68 M54,60 V68 M10,68 V76 M30,68 V76 M50,68 V76" stroke-width="1.4"/>
<path d="M28,52 V30 H52 V52 Q40,60 28,52 Z" ${HALF} stroke-width="2.6"/><path d="M26,30 Q40,8 54,30 Z" ${SOLID}/><circle cx="40" cy="12" r="2.6" ${SOLID}/><path d="M26,30 H54" stroke-width="3"/>
<rect x="38" y="34" width="4" height="12" ${SOLID}/><path d="M72,62 Q80,58 88,62 Q94,66 98,62" stroke-width="2"/><path d="${waves(74, 70, 2, 12, 3)}" stroke-width="1.8"/>${GROUND}`),
	// Trinidad und Tobago: Steeldrum
	TT: () =>
		M(`<ellipse cx="50" cy="30" rx="32" ry="10" ${HALF} stroke-width="3"/><ellipse cx="42" cy="29" rx="7" ry="3" stroke-width="1.6"/><ellipse cx="58" cy="29" rx="7" ry="3" stroke-width="1.6"/><ellipse cx="50" cy="34" rx="5" ry="2" stroke-width="1.6"/><ellipse cx="50" cy="25" rx="5" ry="1.8" stroke-width="1.6"/>
<path d="M18,30 V66 Q50,82 82,66 V30" stroke-width="3"/><path d="M18,46 Q50,58 82,46 M18,58 Q50,70 82,58" stroke-width="2.4"/><path d="M18,30 Q50,44 82,30 V40 Q50,54 18,40 Z" ${SOLID}/>
<path d="M14,4 L40,22 M86,4 L60,22" stroke-width="2.6"/><circle cx="40" cy="22" r="3" ${SOLID}/><circle cx="60" cy="22" r="3" ${SOLID}/>
<path d="M88,32 V20 L96,18 V30" stroke-width="1.8"/><circle cx="86" cy="32" r="2.4" ${SOLID}/><circle cx="94" cy="30" r="2.4" ${SOLID}/>`, [2, 0, 96, 80]),
	// San Marino: die drei Türme auf dem Monte Titano
	SM: () => {
		const tw = (x: number, y: number) =>
			`<rect x="${x - 5}" y="${y - 16}" width="10" height="16" ${SOLID}/><path d="M${x - 6},${y - 16} V${y - 20} H${x - 3} V${y - 17} H${x - 1} V${y - 20} H${x + 1} V${y - 17} H${x + 3} V${y - 20} H${x + 6} V${y - 16} Z" ${SOLID}/><path d="M${x},${y - 20} V${y - 28} q4,-1 6,2 q-3,2 -6,1" stroke-width="1.6"/><rect x="${x - 1.5}" y="${y - 10}" width="3" height="5" ${PAPER}/>`;
		return M(`<path d="M2,76 L18,56 L40,40 L58,34 L80,38 L98,54 V76 Z" ${HALF} stroke-width="2.6"/><path d="M24,58 L30,64 M60,44 L64,52 M80,50 L84,58" stroke-width="1.4"/>
${tw(24, 52)}${tw(54, 36)}${tw(80, 40)}<path d="M28,48 L50,34 M58,34 L76,38" stroke-width="1.6" stroke-dasharray="2 2"/>${GROUND}`, [0, 0, 100, 80]);
	},
	// Albanien: Berat, Stadt der tausend Fenster
	AL: () => {
		const house = (x: number, y: number) =>
			`<path d="M${x - 1},${y} L${x + 6},${y - 5} L${x + 13},${y} Z" ${SOLID}/><rect x="${x}" y="${y}" width="12" height="9" fill="var(--paper)" stroke-width="1.6"/><path d="M${x + 2},${y + 3} h2 v3.5 h-2 Z M${x + 5},${y + 3} h2 v3.5 h-2 Z M${x + 8},${y + 3} h2 v3.5 h-2 Z" ${SOLID}/>`;
		let h = '';
		for (const [y, xs] of [[37, [50, 64, 78]], [50, [26, 40, 54, 68, 82]], [64, [4, 18, 32, 46, 60, 74, 86]]] as [number, number[]][]) for (const x of xs) h += house(x, y);
		return M(`<path d="M2,76 V62 L30,48 L56,32 L76,22 H98 V76 Z" ${HALF} stroke-width="2.4"/><path d="M74,22 V16 H78 V19 H82 V16 H86 V19 H90 V16 H94 V19 H98" stroke-width="2"/>${h}${GROUND}`);
	},
	// Andorra: romanischer Kirchturm vor den Pyrenäen
	AD: () => {
		let w = '';
		for (const y of [31, 45, 59]) w += `<path d="M43,${y + 9} V${y + 3} a2.5,2.5 0 0 1 5,0 V${y + 9} Z M52,${y + 9} V${y + 3} a2.5,2.5 0 0 1 5,0 V${y + 9} Z" ${SOLID}/>`;
		return M(`<path d="M2,76 V60 L22,26 L34,40 L50,16 L68,42 L80,30 L98,56 V76 Z" ${HALF} stroke-width="2.2"/><path d="M18,33 L22,26 L26,32 L23,30 Z M45,24 L50,16 L55,24 L52,22 L50,25 L47,22 Z M76,36 L80,30 L84,36 Z" ${SOLID}/>
<rect x="40" y="28" width="20" height="48" fill="var(--paper)" stroke-width="2.6"/><path d="M38,28 L50,20 L62,28 Z" ${SOLID}/><path d="M40,42 H60 M40,56 H60" stroke-width="1.6"/>${w}
<rect x="60" y="50" width="30" height="26" fill="var(--paper)" stroke-width="2.4"/><path d="M58,50 L75,42 L92,50 Z" ${SOLID}/><path d="M70,76 V68 a5,5 0 0 1 10,0 V76 Z" ${SOLID}/>${GROUND}`);
	},
	// Luxemburg: Adolphe-Brücke mit den Türmen der Kathedrale
	LU: () =>
		M(`${sun(14, 14, 7)}<path d="M66,33 L69,12 L72,33 Z M76,33 L79,6 L82,33 Z M86,33 L89,12 L92,33 Z" ${HALF} stroke-width="1.8"/>
<path d="M2,36 H98 V76 H90 V62 Q90,52 86,52 Q82,52 82,62 V76 H76 Q76,42 50,42 Q24,42 24,76 H18 V62 Q18,52 14,52 Q10,52 10,62 V76 H2 Z" ${HALF} stroke-width="2.6"/>
<rect x="2" y="32" width="96" height="5" ${SOLID}/><path d="M38,76 q-6,-8 0,-14 q6,6 0,14 Z M60,76 q-5,-7 0,-12 q5,5 0,12 Z M49,76 q-4,-5 0,-9 q4,4 0,9 Z" ${SOLID}/>${GROUND}`),
	// Liechtenstein: Schloss Vaduz über den Weinbergen
	LI: () =>
		M(`<path d="M2,48 L20,22 L32,34 L46,14 L62,36 L76,24 L98,46" stroke-width="2"/><path d="M16,28 L20,22 L24,28 Z M42,20 L46,14 L50,20 Z M72,30 L76,24 L80,30 Z" ${SOLID}/>
<path d="M2,76 Q20,58 40,56 Q60,52 74,58 Q90,64 98,76 Z" ${HALF} stroke-width="2.4"/><path d="M10,72 L18,66 M18,74 L28,66 M68,64 L76,70 M80,66 L88,72" stroke-width="1.6" stroke-dasharray="2 2"/>
<rect x="30" y="40" width="40" height="16" fill="var(--paper)" stroke-width="2.4"/><path d="M28,40 L36,32 H66 L72,40 Z" ${SOLID}/>
<rect x="64" y="30" width="12" height="26" fill="var(--paper)" stroke-width="2.4"/><path d="M62,30 L70,21 L78,30 Z" ${SOLID}/>
<rect x="38" y="18" width="14" height="22" fill="var(--paper)" stroke-width="2.4"/><path d="M36,18 L45,9 L54,18 Z" ${SOLID}/>
<path d="M34,45 h2.4 v4 h-2.4 Z M40,45 h2.4 v4 h-2.4 Z M46,45 h2.4 v4 h-2.4 Z M52,45 h2.4 v4 h-2.4 Z M58,45 h2.4 v4 h-2.4 Z M42,24 h2.4 v4 h-2.4 Z M47,24 h2.4 v4 h-2.4 Z M69,36 h2.4 v4 h-2.4 Z" ${SOLID}/>`),
	// Litauen: Wasserburg Trakai mit Spiegelung
	LT: () =>
		M(`<rect x="40" y="20" width="20" height="22" fill="var(--paper)" stroke-width="2.4"/><path d="M38,20 L50,8 L62,20 Z" ${SOLID}/><path d="M46,26 h3 v5 h-3 Z M51,26 h3 v5 h-3 Z" ${SOLID}/>
<rect x="18" y="38" width="64" height="16" fill="var(--paper)" stroke-width="2.4"/><path d="M24,44 v4 M32,44 v4 M40,44 v4 M60,44 v4 M68,44 v4 M76,44 v4" stroke-width="2"/><path d="M46,54 V47 a4,4 0 0 1 8,0 V54 Z" ${SOLID}/>
<rect x="12" y="32" width="10" height="22" fill="var(--paper)" stroke-width="2.4"/><path d="M10,32 L17,23 L24,32 Z" ${SOLID}/><rect x="78" y="32" width="10" height="22" fill="var(--paper)" stroke-width="2.4"/><path d="M76,32 L83,23 L90,32 Z" ${SOLID}/>
<path d="M4,55 H96" stroke-width="3"/><path d="M14,58 H86 V64 H14 Z M40,64 H60 V68 L50,76 L40,68 Z" ${HALF} stroke="none"/>
<path d="${waves(8, 62, 6, 14, 3)}" stroke-width="1.8"/><path d="${waves(16, 71, 5, 14, 3)}" stroke-width="1.8"/>`),
	// Lettland: Schwarzhäupterhaus in Riga
	LV: () =>
		M(`<path d="M26,76 V40 H30 V32 H34 V24 H40 V16 H46 V8 H54 V16 H60 V24 H66 V32 H70 V40 H74 V76 Z" ${HALF} stroke-width="2.6"/><path d="M50,8 V2" stroke-width="2"/>
${[[30, 32], [34, 24], [40, 16], [60, 16], [66, 24], [70, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y - 2}" r="1.6" ${SOLID}/>`).join('')}
<circle cx="50" cy="28" r="5" fill="var(--paper)" stroke-width="2"/><path d="M50,25 V28 L52,29" stroke-width="1.4"/>
<path d="M31,44 h5 v8 h-5 Z M40,44 h5 v8 h-5 Z M55,44 h5 v8 h-5 Z M64,44 h5 v8 h-5 Z M31,58 h5 v8 h-5 Z M64,58 h5 v8 h-5 Z M40,58 h5 v8 h-5 Z M55,58 h5 v8 h-5 Z M38,32 h4 v6 h-4 Z M58,32 h4 v6 h-4 Z" ${SOLID}/>
<path d="M46,76 V68 a4,4 0 0 1 8,0 V76 Z" ${SOLID}/><path d="M76,76 V44 L86,34 L96,44 V76 M81,48 h4 v6 h-4 Z M88,48 h4 v6 h-4 Z" stroke-width="2"/><path d="M4,76 V48 H22 V76 M8,54 h4 v6 h-4 M14,54 h4 v6 h-4" stroke-width="2"/>${GROUND}`),
	// Slowakei: Burg Bratislava über der Donau
	SK: () =>
		M(`<path d="M2,66 Q28,50 50,50 Q74,50 98,66 Z" ${HALF} stroke-width="2.4"/>
<rect x="26" y="26" width="48" height="24" fill="var(--paper)" stroke-width="2.6"/><path d="M26,26 L32,20 H68 L74,26 Z" ${SOLID}/>
${[37, 44, 51, 58].map((x) => `<path d="M${x},31 h3 v4 h-3 Z M${x},40 h3 v4 h-3 Z" ${SOLID}/>`).join('')}
<rect x="20" y="14" width="10" height="36" fill="var(--paper)" stroke-width="2.4"/><path d="M19,14 L25,7 L31,14 Z" ${SOLID}/><rect x="70" y="14" width="10" height="36" fill="var(--paper)" stroke-width="2.4"/><path d="M69,14 L75,7 L81,14 Z" ${SOLID}/>
<path d="M24,20 h2 v4 h-2 Z M24,32 h2 v4 h-2 Z M74,20 h2 v4 h-2 Z M74,32 h2 v4 h-2 Z" ${SOLID}/><path d="${waves(4, 72, 6, 15, 3)}" stroke-width="2"/><path d="${waves(12, 78, 5, 15, 2.4)}" stroke-width="1.6"/>`),
	// Serbien: Ćevapi mit Zwiebeln und Ajvar
	RS: () => {
		let c = '';
		for (let i = 0; i < 5; i++) c += `<rect x="${22 + i * 2}" y="${36 + i * 5}" width="38" height="7" rx="3.5" fill="currentColor" stroke="var(--paper)" stroke-width="1.4" transform="rotate(-8 ${41 + i * 2} ${39 + i * 5})"/>`;
		let o = '';
		for (const [x, y, r] of [[68, 52, 10], [74, 57, -20], [65, 59, 30], [76, 50, 5], [71, 62, -10], [80, 55, 25]]) o += `<rect x="${x}" y="${y}" width="3.4" height="3.4" fill="var(--paper)" stroke-width="1.3" transform="rotate(${r} ${x + 1.7} ${y + 1.7})"/>`;
		return M(`<ellipse cx="50" cy="56" rx="46" ry="19" stroke-width="2.8"/><ellipse cx="50" cy="56" rx="38" ry="13" stroke-width="1.4" stroke-dasharray="2 3"/>
<path d="M16,54 Q18,40 46,36 Q66,36 70,46 Q50,58 16,54 Z" ${HALF} stroke-width="2"/>${c}<path d="M74,40 q6,-4 10,1 q2,6 -5,7 q-7,0 -5,-8 Z" ${HALF} stroke-width="1.8"/>${o}
<path d="M34,26 q-4,-5 0,-9 q4,-4 0,-9 M48,24 q-4,-5 0,-9 q4,-4 0,-9 M62,26 q-4,-5 0,-9 q4,-4 0,-9" stroke-width="1.8"/>`);
	},
	// Nordmazedonien: Kirche Kaneo über dem Ohridsee
	MK: () =>
		M(`<path d="M2,46 Q20,38 34,42 Q50,34 64,40" stroke-width="1.8"/>
<path d="M50,76 V60 Q54,50 60,46 L66,40 H98 V76 Z" ${HALF} stroke-width="2.4"/><path d="M58,56 l6,4 M70,50 l8,6 M84,58 l6,6" stroke-width="1.4"/>
<rect x="70" y="28" width="22" height="12" fill="var(--paper)" stroke-width="2"/><path d="M70,40 V32 Q64,32 64,36 V40 Z" fill="var(--paper)" stroke-width="2"/><path d="M68,28 L81,22 L94,28 Z" ${SOLID}/>
<rect x="77" y="12" width="8" height="10" fill="var(--paper)" stroke-width="2"/><path d="M75,12 L81,6 L87,12 Z" ${SOLID}/><path d="M81,6 V1 M79.2,2.8 H82.8" stroke-width="1.4"/><path d="M80,15 h2 v4 h-2 Z M74,32 h2 v4 h-2 Z M86,32 h2 v4 h-2 Z" ${SOLID}/>
<path d="M12,58 H32 L28,62 H16 Z" ${SOLID}/><path d="M22,58 V48 L30,56 Z" ${HALF} stroke-width="1.6"/><path d="${waves(4, 66, 3, 14, 3)}" stroke-width="2"/><path d="${waves(8, 74, 3, 13, 3)}" stroke-width="2"/>`),
	// Moldau: Weinfass, Trauben und ein Glas Rotwein
	MD: () => {
		let g = '';
		for (const [x, y] of [[72, 30], [80, 30], [88, 30], [76, 37], [84, 37], [80, 44]]) g += `<circle cx="${x}" cy="${y}" r="4.2" fill="currentColor" stroke="var(--paper)" stroke-width="1.2"/>`;
		return M(`<path d="M22,30 Q16,52 22,74 H58 Q64,52 58,30 Z" ${HALF} stroke-width="2.6"/><ellipse cx="40" cy="30" rx="18" ry="4" fill="var(--paper)" stroke-width="2.4"/>
<path d="M19,42 Q40,48 61,42 M19,64 Q40,70 61,64" stroke-width="2.4"/><path d="M36,54 h8 v4 h-8 Z M39,58 v4" ${SOLID}/><path d="M39,58 v5" stroke-width="2"/>
<path d="M80,24 Q76,14 66,16 Q70,24 80,24 Z" ${SOLID}/><path d="M80,26 V20 q2,-4 6,-4" stroke-width="1.8"/>${g}
<path d="M70,52 Q70,64 80,64 Q90,64 90,52 Z" fill="var(--paper)" stroke-width="2"/><path d="M71,56 Q72,63 80,63 Q88,63 89,56 Z" ${SOLID}/><path d="M80,64 V74 M73,75 H87" stroke-width="2.2"/>${GROUND}`);
	},
	// Färöer: Wasserfall Múlafossur und Grasdachhäuser
	FO: () =>
		M(`<path d="M58,40 Q72,22 90,26 Q96,30 98,40" stroke-width="2"/><path d="M2,26 H44 Q46,28 46,32 V76 H2 Z" ${HALF} stroke-width="2.6"/><path d="M2,24 H44 Q47,25 46,30 H2 Z" ${SOLID}/>
<rect x="8" y="16" width="10" height="8" fill="var(--paper)" stroke-width="1.6"/><path d="M6,16 L13,10 L20,16 Z" ${SOLID}/><rect x="26" y="17" width="9" height="7" fill="var(--paper)" stroke-width="1.6"/><path d="M24,17 L30.5,11 L37,17 Z" ${SOLID}/>
<path d="M44,30 Q50,32 50,42 V66 M47,30 Q53,33 53,42 V66" stroke-width="2.2" stroke-dasharray="6 3"/><path d="M44,68 q4,-4 8,0 q4,-4 8,0" stroke-width="1.8"/>
<path d="M70,76 V52 L74,46 L78,52 V76 Z M84,76 V60 L88,54 L92,60 V76 Z" ${HALF} stroke-width="2"/><path d="M62,12 q3,-3 6,0 q3,-3 6,0 M80,8 q2,-2 4,0 q2,-2 4,0" stroke-width="1.6"/>
<path d="${waves(54, 70, 3, 14, 3)}" stroke-width="2"/><path d="${waves(58, 77, 3, 13, 2.4)}" stroke-width="1.6"/>`),
	// Gibraltar: Berberaffe vor dem Felsen
	GI: () =>
		M(`${sun(84, 12, 6)}<path d="M2,76 V54 Q6,46 10,40 L18,20 Q20,14 26,14 L40,18 L60,26 L82,44 L98,52 V76 Z" ${HALF} stroke-width="2.6"/><path d="M22,24 L28,34 M44,26 L48,36 M66,36 L70,44" stroke-width="1.4"/>
<ellipse cx="74" cy="62" rx="12" ry="14" ${SOLID}/><ellipse cx="65" cy="72" rx="9" ry="5" ${SOLID}/><path d="M66,52 Q58,60 61,72" stroke="var(--paper)" stroke-width="1.6"/>
<circle cx="70" cy="44" r="8" ${SOLID}/><ellipse cx="67" cy="46" rx="4.4" ry="5" ${PAPER}/><circle cx="65.6" cy="44.6" r="1" ${SOLID}/><circle cx="68.6" cy="44.6" r="1" ${SOLID}/><path d="M65.6,48.6 Q67,49.6 68.4,48.6" stroke-width="1"/>${GROUND}`),
	// Israel: Zeitunglesen im Toten Meer
	IL: () =>
		M(`${sun(84, 12, 7)}<path d="M2,40 V36 Q20,24 36,30 Q54,20 70,28 Q86,22 98,30 V40 Z" ${HALF} stroke-width="2"/><path d="M2,48 H98" stroke-width="1.8"/>
<path d="M34,49 Q50,44 62,48 Q50,53 34,51 Z" ${SOLID}/><circle cx="30" cy="47" r="5" ${SOLID}/><path d="M62,48 L80,46 M62,50 L80,51" stroke-width="3.2"/><path d="M80,46 l2,-4 M80,51 l2,-4" stroke-width="2.4"/>
<path d="M38,47 L42,37 M50,46 L52,37" stroke-width="2.6"/><path d="M34,26 L56,23 L58,38 L37,41 Z" fill="var(--paper)" stroke-width="2"/><path d="M39,29 H52 M39,32.5 H54 M40,36 H50" stroke-width="1.2"/>
<path d="${waves(4, 58, 6, 15, 3)}" stroke-width="2"/><path d="${waves(10, 68, 6, 15, 3)}" stroke-width="2"/><path d="M4,76 h6 l2,-3 l3,3 h8 M80,76 h6 l2,-4 l3,4 h6" stroke-width="1.8"/>`),
	// Iran: Granatäpfel
	IR: () => {
		let s = '';
		for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5; s += `<ellipse cx="${f1(70 + 10 * Math.cos(a))}" cy="${f1(54 + 10 * Math.sin(a))}" rx="2.3" ry="2.7" ${SOLID}/>`; }
		for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5 + 0.3; s += `<ellipse cx="${f1(70 + 4.6 * Math.cos(a))}" cy="${f1(54 + 4.6 * Math.sin(a))}" rx="2.1" ry="2.5" ${SOLID}/>`; }
		return M(`<path d="M42,22 Q54,8 66,14 Q56,24 42,22 Z" ${SOLID}/><path d="M44,21 Q54,16 62,15" stroke="var(--paper)" stroke-width="1.2"/>
<circle cx="34" cy="48" r="22" ${HALF} stroke-width="2.8"/><path d="M27,28 L28,20 L31,25 L34,18 L37,25 L40,20 L41,28 Z" ${SOLID}/><path d="M22,40 Q24,34 30,32" stroke-width="2"/>
<circle cx="70" cy="54" r="18" ${SOLID}/><circle cx="70" cy="54" r="15" ${PAPER}/>${s}<ellipse cx="50" cy="73" rx="2.3" ry="2.7" ${SOLID}/><ellipse cx="94" cy="72" rx="2.3" ry="2.7" ${SOLID}/>${GROUND}`);
	},
	// Pakistan: bunt bemalter Lastwagen
	PK: () => {
		let d = '';
		for (let x = 36; x < 92; x += 8) d += `L${x + 4},34 L${x + 8},40 `;
		return M(`<rect x="34" y="30" width="60" height="34" ${HALF} stroke-width="2.6"/><path d="M36,40 ${d}" stroke-width="1.6"/><circle cx="64" cy="50" r="6" ${SOLID}/><circle cx="64" cy="50" r="2.4" ${PAPER}/>
${[40, 48, 56, 72, 80, 88].map((x) => `<circle cx="${x}" cy="58" r="1.8" ${SOLID}/>`).join('')}
<path d="M10,64 V44 L16,34 H32 V64 Z" fill="var(--paper)" stroke-width="2.6"/><path d="M17,38 L14,46 H30 V38 Z" ${HALF} stroke-width="1.6"/>
<path d="M12,34 L8,12 Q21,4 35,12 L32,34 Z" ${SOLID}/><circle cx="21" cy="20" r="3.4" ${PAPER}/><path d="M13,28 H29 M15,14 l2,-2 M27,14 l-2,-2" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M6,64 H96" stroke-width="3"/><path d="M36,67 H62" stroke-width="1.4" stroke-dasharray="1 2"/>
${[22, 70, 84].map((x) => `<circle cx="${x}" cy="68" r="7" fill="var(--paper)" stroke-width="3"/><circle cx="${x}" cy="68" r="2.2" ${SOLID}/>`).join('')}`);
	},
	// Bangladesch: Fahrradrikscha
	BD: () => {
		const wheel = (x: number, y: number, r: number) => {
			let s = '';
			for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 4; s += `M${f1(x + r * Math.cos(a))},${f1(y + r * Math.sin(a))} L${f1(x - r * Math.cos(a))},${f1(y - r * Math.sin(a))} `; }
			return `<circle cx="${x}" cy="${y}" r="${r}" stroke-width="2.6"/><path d="${s}" stroke-width="1"/>`;
		};
		return M(`${wheel(18, 64, 11)}${wheel(66, 62, 13)}<path d="M18,64 L30,46 L40,56 L66,62 M30,46 L28,40 M24,40 H32 M40,56 L38,44" stroke-width="2.4"/>
<circle cx="34" cy="22" r="4" ${SOLID}/><path d="M34,26 L38,42 M38,42 L44,52 L40,60 M35,30 L28,40" stroke-width="3.2"/>
<path d="M50,48 Q50,20 70,18 Q88,18 88,48 Z" ${SOLID}/><path d="M56,40 Q64,26 80,26 M58,46 Q68,34 84,36" stroke="var(--paper)" stroke-width="1.6"/>${[[62, 30], [74, 32], [80, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" ${PAPER}/>`).join('')}
<path d="M52,48 H84 V56 H52 Z" ${HALF} stroke-width="2"/>${GROUND}`);
	},
	// Uganda: Schuhschnabel im Papyrus
	UG: () =>
		M(`<path d="M80,76 Q78,50 82,30 M90,76 Q92,56 88,40" stroke-width="1.8"/>${[[82, 30], [88, 40]].map(([x, y]) => `<path d="M${x},${y} l-8,-6 M${x},${y} l-4,-9 M${x},${y} l0,-10 M${x},${y} l4,-9 M${x},${y} l8,-6" stroke-width="1.4"/>`).join('')}
<path d="M50,76 V58 M56,76 V58" stroke-width="2.4"/><path d="M44,76 H52 M54,76 H62" stroke-width="2"/>
<path d="M42,56 Q36,38 46,30 Q56,26 62,34 Q68,48 60,58 Q52,62 42,56 Z" ${HALF} stroke-width="2.6"/><path d="M48,38 Q56,44 58,54 M46,44 Q52,50 52,56" stroke-width="1.4"/>
<path d="M46,32 Q44,26 42,22" stroke-width="5"/><circle cx="40" cy="16" r="8" ${HALF} stroke-width="2.6"/><path d="M46,10 l4,-3" stroke-width="2"/>
<path d="M33,13 Q20,11 14,17 Q12,24 18,26 Q26,26 34,21 Z" ${SOLID}/><path d="M14,18 q-2,4 2,6" stroke-width="2"/><circle cx="40" cy="14" r="2.4" ${PAPER}/><circle cx="40" cy="14" r="1.2" ${SOLID}/>${GROUND}`),
	// Kap Verde: Vulkan Fogo mit Weinreben
	CV: () =>
		M(`${sun(14, 14, 6)}<path d="M4,70 L42,18 Q50,12 58,18 L96,70 Z" ${HALF} stroke-width="2.6"/><path d="M50,14 q-4,-4 0,-8 q4,-4 0,-8" stroke-width="1.8"/><path d="M45,22 Q40,40 34,50 M55,22 Q60,38 66,48" stroke-width="1.6"/>
<path d="M14,64 H34 M64,64 H86 M18,58 H30 M68,58 H82" stroke-width="1.8" stroke-dasharray="2 2.4"/>
<rect x="38" y="58" width="10" height="8" fill="var(--paper)" stroke-width="1.8"/><path d="M37,58 L43,53 L49,58 Z" ${SOLID}/><rect x="52" y="60" width="9" height="6" fill="var(--paper)" stroke-width="1.8"/><path d="M51,60 L56.5,56 L62,60 Z" ${SOLID}/>
<path d="${waves(4, 75, 6, 15, 3)}" stroke-width="2"/>`),
	// Réunion: Lava des Piton de la Fournaise und Tropikvogel
	RE: () =>
		M(`<path d="M10,20 Q18,14 24,20 Q30,14 38,18" stroke-width="2.2"/><path d="M24,20 Q22,32 14,40 M24,20 Q26,32 20,40" stroke-width="1.3"/>
<path d="M2,64 Q30,36 44,30 H58 Q70,36 86,64 Z" ${HALF} stroke-width="2.6"/><path d="M44,30 Q51,34 58,30" stroke-width="2"/>
<path d="M48,30 Q45,20 50,12 Q55,20 52,30 Z" ${SOLID}/>${[[43, 18], [58, 20], [53, 6], [46, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" ${SOLID}/>`).join('')}
<path d="M54,32 Q62,44 60,54 Q64,62 76,68" stroke-width="4"/><path d="M78,66 q-2,-4 2,-6 q4,-2 2,-6 M84,68 q-2,-4 2,-6" stroke-width="1.4"/>
<path d="${waves(2, 70, 7, 14, 3)}" stroke-width="2"/><path d="${waves(8, 77, 6, 14, 2.4)}" stroke-width="1.6"/>`),
	// Aruba: Divi-Divi-Baum am Strand
	AW: () =>
		M(`<path d="M24,62 H30 M74,62 H98" stroke-width="1.8"/><path d="${waves(70, 68, 2, 12, 2.4)}" stroke-width="1.6"/>
<path d="M30,76 Q30,60 38,52 Q50,44 64,42" stroke-width="4.4"/><path d="M44,48 L58,38 M52,46 L72,38" stroke-width="2"/>
<path d="M36,52 Q40,36 60,32 Q80,30 96,36 Q88,42 74,42 Q60,44 50,50 Q44,54 36,52 Z" ${SOLID}/><path d="M48,44 Q64,36 86,36" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M22,76 Q50,70 98,74" ${HALF} stroke-width="2.4"/><path d="M22,76 H98" stroke-width="3.6"/>`, [22, 26, 78, 52]),
	// Curaçao: bunte Giebelhäuser in Willemstad
	CW: () => {
		const gab = [
			(x: number) => `V34 H${x + 3} V28 H${x + 6} V22 H${x + 12} V28 H${x + 15} V34 H${x + 18}`,
			(x: number) => `Q${x},30 ${x + 5},30 Q${x + 6},22 ${x + 9},20 Q${x + 12},22 ${x + 13},30 Q${x + 18},30 ${x + 18},40`,
			(x: number) => `L${x + 9},24 L${x + 18},40`
		];
		let h = '';
		for (let i = 0; i < 5; i++) {
			const x = 5 + i * 18,
				dark = i % 2 === 1;
			h += `<path d="M${x},64 V40 ${gab[i % 3](x)} V64 Z" ${dark ? SOLID : HALF} stroke-width="2"/>`;
			h += `<path d="M${x + 4},44 h3 v5 h-3 Z M${x + 11},44 h3 v5 h-3 Z M${x + 4},53 h3 v5 h-3 Z M${x + 11},53 h3 v5 h-3 Z M${x + 7.5},31 h3 v4 h-3 Z" ${dark ? PAPER : SOLID}/>`;
		}
		return M(`${h}<path d="M2,64 H98" stroke-width="3"/><path d="${waves(4, 70, 6, 15, 3)}" stroke-width="2"/><path d="${waves(10, 77, 6, 14, 2.4)}" stroke-width="1.6"/>`);
	},
	// St. Lucia: die Pitons im Abendlicht
	LC: () =>
		M(`${sun(56, 34, 5)}<path d="M2,68 Q18,62 24,40 Q30,14 38,14 Q46,16 50,42 Q54,58 60,60 Q64,40 70,22 Q74,14 78,22 Q84,44 90,62 Q94,68 98,68 V70 H2 Z" ${HALF} stroke-width="2.6"/>
<path d="M30,30 l4,6 M40,40 l4,6 M72,32 l4,8" stroke-width="1.4"/><path d="M6,70 H22 L19,74 H9 Z" ${SOLID}/><path d="M14,70 V52" stroke-width="1.6"/><path d="M14,54 L21,68 H14 Z" ${HALF} stroke-width="1.6"/>
<path d="${waves(26, 74, 5, 14, 3)}" stroke-width="2"/>`),
	// Belize: Great Blue Hole im Riff
	BZ: () =>
		M(`<path d="M10,40 Q10,14 50,12 Q90,12 92,40 Q92,68 50,70 Q10,68 10,40 Z" ${HALF} stroke-width="2" stroke-dasharray="5 3"/>
<circle cx="50" cy="40" r="23" stroke-width="1.6" stroke-dasharray="2 3"/><circle cx="50" cy="40" r="19" ${SOLID}/><path d="M38,32 Q46,26 56,28" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M16,22 q4,-3 8,0 M80,58 q4,-3 8,0 M18,58 q3,-2 6,0" stroke-width="1.6"/><path d="M72,66 Q80,62 90,64 Q82,68 72,66 Z" ${SOLID}/><path d="M70,68 q-6,2 -12,0 M70,64 q-6,-2 -12,0" stroke-width="1.2"/>`),
	// Macau: Pastéis de Nata
	MO: () => {
		const tart = (x: number, y: number) =>
			`<path d="M${x - 14},${y} Q${x - 14},${y + 10} ${x - 10},${y + 12} H${x + 10} Q${x + 14},${y + 10} ${x + 14},${y} Z" ${HALF} stroke-width="2.2"/><path d="M${x - 8},${y + 3} V${y + 11} M${x - 4},${y + 3} V${y + 12} M${x},${y + 3} V${y + 12} M${x + 4},${y + 3} V${y + 12} M${x + 8},${y + 3} V${y + 11}" stroke-width="1.2"/>
<ellipse cx="${x}" cy="${y}" rx="14" ry="5" fill="var(--paper)" stroke-width="2.2"/><ellipse cx="${x - 4}" cy="${y - 0.5}" rx="3" ry="1.4" ${SOLID}/><ellipse cx="${x + 4}" cy="${y + 1}" rx="2.4" ry="1.2" ${SOLID}/><ellipse cx="${x + 2}" cy="${y - 2.4}" rx="1.6" ry=".9" ${SOLID}/>`;
		return M(`<ellipse cx="50" cy="64" rx="46" ry="12" stroke-width="2.6"/>${tart(50, 42)}${tart(30, 54)}${tart(70, 54)}<path d="M44,28 q-3,-5 0,-9 q3,-4 0,-9 M56,28 q-3,-5 0,-9 q3,-4 0,-9" stroke-width="1.6"/>`);
	},
	// Kirgisistan: Steinadler auf dem Arm des Jägers
	KG: () =>
		M(`<path d="M2,60 L20,36 L30,46 L46,26 L62,48 L76,34 L98,58" stroke-width="2"/><path d="M16,41 L20,36 L24,41 Z M42,31 L46,26 L50,31 Z M72,39 L76,34 L80,39 Z" ${SOLID}/>
<path d="M100,76 Q82,73 64,67" stroke-width="9"/><circle cx="62" cy="65" r="6" ${SOLID}/>
<path d="M54,62 L50,76 H62 L64,62 Z" ${SOLID}/><path d="M50,62 Q42,46 52,30 Q60,24 68,30 Q74,42 68,58 Q62,66 50,62 Z" ${SOLID}/>
<circle cx="54" cy="24" r="7" ${SOLID}/><path d="M48,21 Q41,21 43,28 L49,27 Z" ${SOLID}/><circle cx="52" cy="22" r="1.4" ${PAPER}/>
<path d="M58,34 Q66,44 64,58 M54,38 Q60,48 58,60" stroke="var(--paper)" stroke-width="1.4"/>`),
	// Turkmenistan: brennender Gaskrater von Darvaza
	TM: () => {
		let f = '';
		for (const [x, h] of [[24, 40], [33, 32], [42, 42], [51, 30], [60, 40], [69, 34], [77, 44]]) f += `<path d="M${x - 4},60 Q${x - 6},${h + 10} ${x},${h} Q${x + 6},${h + 10} ${x + 4},60 Z" ${HALF} stroke-width="1.8"/>`;
		return M(`${star(10, 10, 2.2)}${star(24, 18, 1.6)}${star(84, 10, 2.4)}${star(92, 26, 1.6)}${star(60, 8, 1.4)}
<ellipse cx="50" cy="62" rx="38" ry="12" ${SOLID}/>${f}<ellipse cx="50" cy="62" rx="38" ry="12" stroke-width="2.4"/>
<circle cx="92" cy="54" r="1.8" ${SOLID}/><path d="M92,56 V63 M92,63 L90,69 M92,63 L94,69" stroke-width="1.6"/>${GROUND}`);
	},
	// Papua-Neuguinea: Paradiesvogel
	PG: () => {
		let p = '';
		for (const [cx, cy, ex, ey, w] of [[60, 40, 96, 56, 2.4], [62, 48, 92, 66, 1.4], [58, 54, 84, 74, 2.4], [52, 58, 72, 78, 1.4], [46, 60, 60, 78, 2.4], [42, 58, 50, 74, 1.4]])
			p += `<path d="M38,40 Q${cx},${cy} ${ex},${ey}" stroke-width="${w}"/>`;
		return M(`<path d="M2,40 Q30,36 60,40" stroke-width="3.6"/><path d="M14,38 Q10,28 20,26 Q22,34 14,38 Z M54,40 Q60,30 68,32 Q64,40 54,40 Z" ${HALF} stroke-width="1.6"/>${p}
<path d="M34,42 Q30,60 40,74 q4,4 8,0" stroke-width="1.2"/><path d="M30,38 Q28,28 36,24 Q44,22 46,30 Q46,38 38,42 Z" ${SOLID}/><circle cx="42" cy="20" r="5" ${SOLID}/><path d="M46,19 L52,21 L46,23 Z" ${SOLID}/><circle cx="43" cy="19" r="1" ${PAPER}/>`);
	},
	// Vanuatu: Lianenspringer auf Pentecost
	VU: () => {
		let s = '';
		for (let y = 18; y <= 70; y += 8) { const k = (76 - y) / 66; s += `M${f1(42 - 8 * k)},${y} H${f1(50 + 8 * k)} `; }
		return M(`<path d="M34,76 L42,10 M58,76 L50,10" stroke-width="2.6"/><path d="${s}" stroke-width="1.6"/><path d="M36,62 L56,46 M38,46 L54,30 M40,30 L52,18" stroke-width="1.2"/>
<path d="M38,14 H56 M50,14 H72" stroke-width="3"/><path d="M71,14 Q76,30 78,44 M71,14 Q80,28 81,44" stroke-width="1.4"/>
<path d="M79,44 L80,54" stroke-width="3"/><path d="M80,54 V63" stroke-width="4"/><path d="M80,58 L74,64 M80,58 L86,64" stroke-width="2.4"/><circle cx="80" cy="67" r="3.2" ${SOLID}/>
<path d="M8,76 V60 M8,60 q-6,-2 -6,-8 M8,60 q6,-2 6,-8 M8,60 q-2,-6 0,-10" stroke-width="2"/>${GROUND}`);
	},
	// Falklandinseln: Felsenpinguin
	FK: () =>
		M(`<path d="M30,76 Q34,62 50,60 Q70,58 76,68 L80,76 Z" ${HALF} stroke-width="2.4"/>
<path d="M42,60 Q38,40 44,26 Q48,16 54,16 Q60,18 62,28 Q66,42 62,60 Z" ${SOLID}/><path d="M46,58 Q42,44 48,32 Q54,30 58,36 Q62,48 58,58 Z" ${PAPER}/>
<path d="M44,36 Q36,44 38,52" stroke-width="3.2"/><path d="M46,60 l-4,2 M58,60 l4,2" stroke-width="2.4"/><circle cx="55" cy="22" r="1.4" ${PAPER}/><path d="M59,23 L65,25 L59,27 Z" ${SOLID}/>
<path d="M52,20 L42,14 M53,19 L44,9 M54,19 L48,7 M51,17 L49,10" stroke-width="1.6"/><path d="${waves(2, 72, 2, 12, 3)}" stroke-width="2"/><path d="${waves(80, 72, 1, 14, 3)}" stroke-width="2"/>
<path d="M8,64 q2,-4 0,-8 M14,62 q2,-4 0,-6" stroke-width="1.4"/>`),
	// Malawi: Buntbarsch im Malawisee
	MW: () =>
		M(`<circle cx="12" cy="22" r="2" stroke-width="1.4"/><circle cx="8" cy="14" r="1.4" stroke-width="1.4"/><circle cx="14" cy="8" r="1" stroke-width="1.2"/>
<path d="M30,28 Q44,14 66,24 L58,27 Q44,22 34,30 Z" ${SOLID}/><path d="M78,38 L94,26 Q90,38 94,52 Z" ${SOLID}/>
<path d="M18,40 Q30,22 56,24 Q72,26 78,38 Q72,50 56,54 Q30,56 18,40 Z" ${HALF} stroke-width="2.6"/><path d="M34,28 Q32,40 34,52 M44,25 Q42,40 44,54 M54,24 Q52,40 54,54 M64,26 Q62,40 64,51" stroke-width="3"/>
<path d="M44,54 Q54,62 64,52" stroke-width="2"/><circle cx="52" cy="57" r="1.6" ${SOLID}/><circle cx="26" cy="36" r="3" fill="var(--paper)" stroke-width="1.6"/><circle cx="26" cy="36" r="1.4" ${SOLID}/><path d="M18,40 l3,1" stroke-width="1.6"/>
<path d="M2,76 Q8,64 18,68 Q24,60 34,68 Q40,64 46,70 Q56,62 66,70 Q76,64 84,70 Q92,66 98,72 V76 Z" ${HALF} stroke-width="2"/><path d="M88,68 Q86,58 90,50 M92,68 Q94,60 92,54" stroke-width="1.6"/>`),
	// Jemen: Drachenblutbaum auf Sokotra
	YE: () =>
		M(`<path d="M46,76 Q48,64 48,56 H52 Q52,64 54,76 Z" ${SOLID}/><path d="M50,58 Q44,46 30,34 M50,58 Q46,44 42,34 M50,58 V34 M50,58 Q54,44 58,34 M50,58 Q58,46 72,34 M38,40 L34,34 M62,40 L66,34" stroke-width="3"/>
<path d="M10,30 Q12,14 50,12 Q88,14 90,30 Q70,36 50,34 Q30,36 10,30 Z" ${SOLID}/><path d="M20,26 Q50,18 80,26 M30,20 Q50,15 70,20" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M76,56 Q86,48 96,56 Q86,58 76,56 Z" ${SOLID}/><path d="M86,57 V76" stroke-width="2.4"/><path d="M2,76 Q14,66 28,72 M64,72 Q74,66 84,70" stroke-width="1.8"/>${GROUND}`),
	// Lesotho: Basotho-Hut vor den Bergen
	LS: () =>
		M(`<path d="M2,76 V70 L18,46 L28,54 L44,34 L60,52 L72,40 L98,66 V76 Z" ${HALF} stroke-width="2"/>
<path d="M22,64 Q50,58 78,64 Q64,46 54,26 L52,18 H48 L46,26 Q36,46 22,64 Z" ${SOLID}/><path d="M30,57 Q50,51 70,57 M36,48 Q50,44 64,48 M41,39 Q50,36 59,39" stroke="var(--paper)" stroke-width="1.6" stroke-dasharray="2 2"/>
<ellipse cx="50" cy="64" rx="28" ry="4" ${SOLID}/><circle cx="50" cy="14" r="3.4" ${SOLID}/><path d="M47,13 q-5,-6 0,-9 M53,13 q5,-6 0,-9" stroke-width="1.6"/>${GROUND}`),
	// Åland: Viermastbark Pommern im Hafen von Mariehamn
	AX: () => {
		let s = '';
		for (const x of [26, 42, 58, 74])
			s += `<path d="M${x},58 V8" stroke-width="2"/><path d="M${x - 5.5},14 H${x + 5.5} L${x + 6.5},24 H${x - 6.5} Z M${x - 6.5},27 H${x + 6.5} L${x + 7},38 H${x - 7} Z M${x - 7},41 H${x + 7} V52 H${x - 7} Z" ${HALF} stroke-width="1.6"/>`;
		return M(`${s}<path d="M6,50 L26,10 M74,10 L96,52" stroke-width="1.2"/><path d="M6,55 H94 L84,68 H18 Z" ${SOLID}/><path d="M22,61 H80" stroke="var(--paper)" stroke-width="1.6" stroke-dasharray="3 3"/><path d="${waves(4, 75, 6, 15, 3)}" stroke-width="2"/>`);
	},
	// Belarus: Wisent im Urwald von Białowieża
	BY: () => {
		const tree = (x: number, t: number) => `<path d="M${x},${t} L${x + 8},${t + 22} H${x + 4} L${x + 10},${t + 40} H${x - 10} L${x - 4},${t + 22} H${x - 8} Z" ${HALF} stroke-width="1.8"/><path d="M${x},${t + 40} V76" stroke-width="2"/>`;
		return M(`${tree(10, 22)}${tree(90, 14)}
<path d="M30,44 Q32,24 48,22 Q60,22 64,32 Q78,32 84,40 Q88,50 82,58 Q60,62 38,58 Q30,54 30,44 Z" ${SOLID}/><path d="M38,56 V73 M46,58 V73 M72,58 V73 M80,56 V73" stroke-width="4.4"/>
<path d="M33,40 Q20,37 16,48 Q14,58 22,60 Q30,58 35,50 Z" ${SOLID}/><path d="M18,58 Q17,67 24,63 Z" ${SOLID}/><path d="M23,42 Q16,39 19,34 M31,40 Q34,34 30,32" stroke-width="2.2"/>
<circle cx="22" cy="47" r="1.3" ${PAPER}/><path d="M42,30 q4,4 8,2 M48,26 q4,4 8,2 M40,38 q4,4 8,2" stroke="var(--paper)" stroke-width="1.2"/><path d="M85,44 Q91,50 89,60" stroke-width="1.8"/>${GROUND}`);
	},
	// Guernsey: Castle Cornet auf dem Felsen vor St. Peter Port
	GG: () =>
		M(`${sun(84, 14, 6)}<path d="M8,64 Q16,54 30,55 Q56,50 78,58 L86,64 Z" ${HALF} stroke-width="2"/>
<path d="M22,56 V38 H27 V33 H31 V38 H36 V28 H40 V24 H44 V28 H48 V44 H58 V39 H62 V35 H66 V39 H70 V56 Z" ${SOLID}/><path d="M44,24 V10" stroke-width="1.4"/><path d="M44,10 h9 l-2.5,3 l2.5,3 h-9 Z" ${SOLID}/>
<path d="M40,32 h4 v5 h-4 Z M28,42 h3 v4 h-3 Z M62,44 h3 v4 h-3 Z M40,44 h4 v5 h-4 Z" ${PAPER}/><path d="M86,63 H98" stroke-width="3"/><path d="${waves(4, 72, 6, 15, 3)}" stroke-width="2"/>`),
	// Isle of Man: Laxey Wheel
	IM: () => {
		let sp = '';
		for (let i = 0; i < 12; i++) {
			const a = (i * Math.PI) / 6;
			sp += `M${f1(38 + 6 * Math.cos(a))},${f1(34 + 6 * Math.sin(a))} L${f1(38 + 25 * Math.cos(a))},${f1(34 + 25 * Math.sin(a))} `;
		}
		return M(`<path d="M62,76 V54 H96 V76 H90 V64 Q86,58 82,64 V76 H76 V64 Q72,58 68,64 V76 Z" ${HALF} stroke-width="2"/><path d="M60,52 H98" stroke-width="3"/>
<path d="M84,52 V22 H92 V52" ${HALF} stroke-width="2"/><path d="M82,22 L88,13 L94,22 Z" ${SOLID}/><path d="M84,46 L92,40 M84,36 L92,30" stroke-width="1.2"/>
<path d="M8,76 V62 H64 V76" ${HALF} stroke-width="2"/><circle cx="38" cy="34" r="28" stroke-width="3.4"/><circle cx="38" cy="34" r="24" stroke-width="1.4"/><path d="${sp}" stroke-width="1.8"/><circle cx="38" cy="34" r="5" ${SOLID}/>${GROUND}`);
	},
	// Jersey: Jersey-Kuh auf der Weide
	JE: () =>
		M(`<path d="M30,30 Q52,25 74,30 Q83,32 82,42 L80,52 Q70,56 56,54 Q42,56 32,53 Q26,46 30,30 Z" ${HALF} stroke-width="2.4"/>
<path d="M35,52 V73 M41,54 V73 M70,54 V73 M76,52 V73" stroke-width="3.6"/><path d="M54,54 q4,6 8,0" stroke-width="2"/><path d="M82,34 Q88,44 86,58 l2,5" stroke-width="1.6"/>
<path d="M32,32 Q24,28 19,34 L12,48 Q11,56 17,56 Q22,55 25,48 L32,42 Z" ${SOLID}/><path d="M21,32 L11,29 L17,37 Z" ${SOLID}/><path d="M26,30 q-2,-6 3,-8" stroke-width="1.6"/>
<circle cx="20" cy="40" r="1.6" ${PAPER}/><ellipse cx="15" cy="52" rx="3.2" ry="2.2" ${PAPER}/><path d="M88,76 v-6 m-3,2 l3,-2 l3,2" stroke-width="1.4"/>${GROUND}`),
	// Kosovo: Steinbrücke und Moschee in Prizren, Festung auf dem Hügel
	XK: () =>
		M(`<path d="M2,50 Q14,18 34,16 Q50,18 60,42" ${HALF} stroke-width="2"/><path d="M18,22 V14 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h3 V20" stroke-width="1.8"/>
<path d="M62,58 V46 A10,10 0 0 1 82,46 V58 Z" ${SOLID}/><path d="M88,58 V18 L90,8 L92,18 V58 Z" ${SOLID}/><path d="M85,24 H95" stroke-width="1.8"/><path d="M72,36 V31" stroke-width="1.4"/><path d="M58,58 H98" stroke-width="2.4"/>
<path d="M2,66 H10 M50,66 H98" stroke-width="2.4"/><path d="M8,67 Q30,30 52,67" stroke-width="6"/><path d="M10,62 Q30,40 50,62" stroke-width="1.2" stroke-dasharray="2 3"/><path d="M14,58 L18,54 M42,54 L46,58" stroke-width="1.2"/>
<path d="${waves(4, 73, 6, 15, 2.6)}" stroke-width="1.8"/>`),
	// Afghanistan: Minarett von Dschām im Gebirgstal
	AF: () =>
		M(`<path d="M2,76 V50 L16,28 L28,44 L36,36 V76 Z M64,76 V40 L76,22 L86,36 L98,30 V76 Z" ${HALF} stroke-width="2"/>
<path d="M42,76 L45,24 H55 L58,76 Z" ${SOLID}/><path d="M44,62 H56 M45,46 H55 M45.5,34 H54.5" stroke="var(--paper)" stroke-width="1.6"/><path d="M43,24 H57" stroke-width="2.4"/>
<path d="M46.5,24 V15 H53.5 V24 Z" ${SOLID}/><path d="M45,15 H55" stroke-width="2"/><path d="M47.5,15 L50,7 L52.5,15 Z" ${SOLID}/><path d="M47,40 v4 M53,40 v4" stroke="var(--paper)" stroke-width="1.4"/>${GROUND}`),
	// Bahrain: Perlmuschel mit Perle
	BH: () => {
		let r = '';
		for (let i = 1; i < 8; i++) {
			const x = 12 + i * 9.5;
			r += `M50,46 L${x},${f1(46 - 30 * Math.sin((i * Math.PI) / 8))} `;
		}
		return M(`<path d="M12,48 Q14,20 50,13 Q86,20 88,48 Q50,40 12,48 Z" ${HALF} stroke-width="2.4"/><path d="${r}" stroke-width="1.2"/>
<path d="M12,52 Q14,72 50,75 Q86,72 88,52 Q50,60 12,52 Z" ${SOLID}/><path d="M24,62 Q50,70 76,62" stroke="var(--paper)" stroke-width="1.2"/>
<circle cx="50" cy="52" r="9" fill="var(--paper)" stroke-width="2.4"/><path d="M45,49 q2,-4 6,-4" stroke-width="1.6"/>${star(86, 12, 3)}${star(14, 14, 2.2)}${star(92, 30, 1.8)}`);
	},
	// Chagos-Inseln: Meeresschildkröte über dem Riff
	IO: () =>
		M(`<ellipse cx="50" cy="38" rx="18" ry="21" ${SOLID}/><ellipse cx="50" cy="12" rx="6" ry="7" ${SOLID}/><circle cx="47" cy="10" r="1.2" ${PAPER}/><circle cx="53" cy="10" r="1.2" ${PAPER}/>
<path d="M35,28 Q18,16 8,26 Q22,30 33,40 Z M65,28 Q82,16 92,26 Q78,30 67,40 Z M38,54 Q28,62 27,72 Q38,66 43,57 Z M62,54 Q72,62 73,72 Q62,66 57,57 Z" ${SOLID}/>
<path d="M50,20 V56 M38,30 L50,36 L62,30 M36,46 L50,44 L64,46 M42,54 L50,50 L58,54" stroke="var(--paper)" stroke-width="1.4"/>
<circle cx="80" cy="44" r="2" stroke-width="1.4"/><circle cx="84" cy="36" r="1.4" stroke-width="1.2"/><path d="M4,76 Q8,64 6,58 M8,66 Q12,62 14,58 M90,76 Q92,66 96,62 M92,68 Q88,62 86,60" stroke-width="2"/><path d="M2,76 H98" stroke-width="2.4" stroke-dasharray="4 3"/>`),
	// Irak: Spiralminarett von Samarra
	IQ: () => {
		const L = (y: number) => 28 + ((76 - y) * 15) / 64,
			R = (y: number) => 72 - ((76 - y) * 15) / 64;
		let rp = '';
		for (const y of [70, 57, 44, 31]) rp += `M${f1(L(y))},${y} L${f1(R(y - 9))},${y - 9} `;
		return M(`<path d="M28,76 L43,12 H57 L72,76 Z" ${HALF} stroke-width="2.4"/><path d="${rp}" stroke-width="2.6"/><path d="M45,12 V4 H55 V12 Z" ${SOLID}/><path d="M48,9 h4" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M12,76 Q10,54 14,40" stroke-width="2.4"/><path d="M14,40 Q6,36 2,42 M14,40 Q10,30 4,30 M14,40 Q20,30 26,32 M14,40 Q22,40 24,48" stroke-width="2.2"/>${GROUND}`);
	},
	// Nordkorea: Kratersee auf dem Paektusan
	KP: () =>
		M(`<path d="M2,76 L20,38 Q30,28 40,34 Q50,28 60,32 Q70,26 80,38 L98,76 Z" ${HALF} stroke-width="2.4"/><ellipse cx="50" cy="38" rx="17" ry="4.6" ${SOLID}/>
<path d="M24,44 L30,36 M70,34 L76,44 M18,54 L24,46 M80,46 L86,56" stroke-width="1.6"/><path d="M14,18 q5,-6 11,-2 q6,-4 10,2 q4,0 4,4 H14 Z" stroke-width="1.8"/>${sun(82, 14, 6)}${GROUND}`),
	// Kuwait: Kuwait Towers am Golf
	KW: () => {
		let d = '';
		for (const [cx, cy, r] of [[40, 38, 11], [64, 48, 9.5]] as const)
			for (let y = cy - r + 3; y < cy + r - 1; y += 3.4)
				for (let x = cx - r + 3; x < cx + r - 1; x += 3.4) if ((x - cx) ** 2 + (y - cy) ** 2 < (r - 2) ** 2) d += `<circle cx="${f1(x)}" cy="${f1(y)}" r=".9" ${PAPER}/>`;
		return M(`<path d="M40,72 V4 M64,72 V22 M84,72 V44" stroke-width="3"/><circle cx="40" cy="38" r="11" ${SOLID}/><circle cx="40" cy="19" r="6" ${SOLID}/><circle cx="64" cy="48" r="9.5" ${SOLID}/>
<path d="M80,44 H88" stroke-width="2.4"/>${d}<path d="M30,72 H94" stroke-width="3"/><path d="${waves(4, 76, 6, 15, 3)}" stroke-width="2"/>`);
	},
	// Palästinensische Gebiete: Olivenzweig
	PS: () => {
		let l = '';
		for (let i = 0; i < 7; i++) {
			const t = 0.14 + i * 0.12,
				x = 14 + 72 * t,
				y = 70 - 56 * t + 8 * Math.sin(t * Math.PI),
				s = i % 2 ? 1 : -1;
			l += `<ellipse cx="${f1(x + s * 7)}" cy="${f1(y + s * 6)}" rx="10" ry="3.4" transform="rotate(${s > 0 ? 30 : -78} ${f1(x + s * 7)} ${f1(y + s * 6)})" ${HALF} stroke-width="1.6"/>`;
		}
		return M(`<path d="M10,74 Q40,58 88,12" stroke-width="2.8"/>${l}<ellipse cx="44" cy="62" rx="3.6" ry="4.6" ${SOLID}/><ellipse cx="66" cy="44" rx="3.6" ry="4.6" ${SOLID}/><ellipse cx="34" cy="44" rx="3.4" ry="4.4" ${SOLID}/>
<path d="M44,57 l3,-6 M66,39 l2,-6 M34,39 l3,-4" stroke-width="1.2"/>`);
	},
	// Syrien: Wasserräder (Norias) von Hama
	SY: () => {
		let sp = '';
		for (let i = 0; i < 16; i++) {
			const a = (i * Math.PI) / 8;
			sp += `M${f1(38 + 4 * Math.cos(a))},${f1(38 + 4 * Math.sin(a))} L${f1(38 + 29 * Math.cos(a))},${f1(38 + 29 * Math.sin(a))} `;
		}
		return M(`<path d="M58,22 H98 V76 H92 V42 Q87,34 82,42 V76 H76 V42 Q71,34 66,42 V76 H58 Z" ${HALF} stroke-width="2"/><path d="M56,20 H98" stroke-width="3"/>
<circle cx="38" cy="38" r="31" stroke-width="3"/><circle cx="38" cy="38" r="27" stroke-width="1.4"/><path d="${sp}" stroke-width="1.6"/><circle cx="38" cy="38" r="5" ${SOLID}/>
<path d="M2,70 H98 V76 H2 Z" ${SOLID}/><path d="${waves(4, 73, 6, 15, 2)}" stroke="var(--paper)" stroke-width="1.4"/>`);
	},
	// Tadschikistan: Marco-Polo-Schaf im Pamir
	TJ: () =>
		M(`<path d="M2,58 L20,30 L32,44 L50,14 L66,40 L78,28 L98,54" stroke-width="2"/><path d="M15,38 L20,30 L25,38 Z M45,22 L50,14 L55,22 Z M73,36 L78,28 L83,36 Z" ${SOLID}/>
<path d="M40,52 Q42,42 56,42 Q74,42 78,50 Q80,58 74,62 H44 Q38,60 40,52 Z" ${SOLID}/><path d="M46,60 V73 M52,61 V73 M70,61 V73 M75,58 V73" stroke-width="2.8"/>
<path d="M45,50 L37,42 Q32,40 28,44 L24,48 Q24,52 28,52 L37,53 Z" ${SOLID}/><path d="M38,42 Q44,28 34,25 Q24,25 24,35 Q26,43 32,41" stroke-width="4.2"/><circle cx="30" cy="46" r="1.1" ${PAPER}/>
<path d="M50,58 Q60,61 70,58" stroke="var(--paper)" stroke-width="1.4"/><path d="M2,76 Q20,70 40,73 Q70,70 98,76" ${HALF} stroke-width="2.2"/>`),
	// Timor-Leste: Cristo Rei über der Bucht von Dili
	TL: () =>
		M(`<path d="M2,76 Q22,48 50,46 Q78,48 98,76 Z" ${HALF} stroke-width="2"/><circle cx="50" cy="38" r="7.5" ${SOLID}/><path d="M43,38 H57 M50,30.5 Q45,38 50,45.5 Q55,38 50,30.5" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M47,31 L46,15 H54 L53,31 Z" ${SOLID}/><path d="M37,11 L50,17 L63,11" stroke-width="3.2"/><circle cx="50" cy="10" r="3.4" ${SOLID}/>
<path d="${waves(2, 76, 2, 10, 2.4)}" stroke-width="1.8"/><path d="M12,58 Q10,48 14,42 M14,42 q-6,-2 -8,2 M14,42 q2,-6 7,-6 M14,42 q6,0 6,5" stroke-width="1.8"/>`),
	// Südgeorgien: Königspinguine vor den Bergen
	GS: () => {
		const peng = (x: number, s: number) =>
			`<g transform="translate(${x},74) scale(${s})"><path d="M-9,0 Q-19,-14 -17,-34 Q-15,-50 -5,-56 Q4,-58 5,-48 Q10,-30 7,0 Z" ${SOLID}/><path d="M2,-4 Q7,-20 5,-36 Q4,-41 1,-43 Q2,-24 -2,-4 Z" ${PAPER}/>
<path d="M-3,-46 Q3,-45 5,-39 Q-1,-40 -5,-44 Z" ${HALF}/><circle cx="-1" cy="-51" r="1.2" ${PAPER}/><path d="M3,-52 L14,-48 L3,-47 Z" ${SOLID}/><path d="M-13,-32 Q-19,-20 -15,-10" stroke="var(--paper)" stroke-width="1.4"/><path d="M-7,0 h-5 M3,0 h6" stroke-width="2.4"/></g>`;
		return M(`<path d="M2,52 L18,24 L28,36 L44,12 L60,34 L72,22 L98,50" stroke-width="2"/><path d="M38,20 L44,12 L50,20 Z M66,28 L72,22 L78,28 Z" ${SOLID}/>${peng(76, 0.78)}${peng(46, 1.05)}<path d="M2,76 H98" stroke-width="3"/>`);
	},
	// Guyana: Kaieteur-Fälle stürzen vom Tafelberg in die Schlucht
	GY: () =>
		M(`<path d="M2,20 H44 L46,60 L38,70 H2 Z M56,20 H98 V70 H62 L54,60 Z" ${HALF} stroke-width="2"/><path d="M10,30 V58 M20,26 V64 M30,32 V54 M70,30 V56 M80,24 V64 M90,32 V58" stroke-width="1.2"/>
<path d="M2,20 H44 M56,20 H98" stroke-width="3"/><path d="M44,20 H56 V60 H44 Z" ${PAPER}/><path d="M46,20 V60 M50,20 V62 M54,20 V60" stroke-width="1.4"/><path d="M40,20 Q50,14 60,20" stroke-width="2"/>
<path d="M36,64 q4,-6 9,-2 q5,-6 10,0 q5,-4 9,2" ${PAPER}/><path d="M36,64 q4,-6 9,-2 q5,-6 10,0 q5,-4 9,2" stroke-width="1.8"/>
<path d="M2,76 V70 q5,-7 10,0 q5,-8 10,0 q5,-7 10,0 q4,-5 8,0 H60 q4,-5 8,0 q5,-7 10,0 q5,-8 10,0 q5,-6 10,0 V76 Z" ${SOLID}/><path d="M18,10 q4,-4 8,0 q3,-3 6,0 M70,10 q4,-4 8,0" stroke-width="1.6"/>`),
	// Paraguay: Ñandutí-Spitze
	PY: () => {
		let r = '',
			p = '';
		for (let i = 0; i < 24; i++) {
			const a = (i * Math.PI) / 12;
			r += `M${f1(50 + 6 * Math.cos(a))},${f1(40 + 6 * Math.sin(a))} L${f1(50 + 33 * Math.cos(a))},${f1(40 + 33 * Math.sin(a))} `;
		}
		for (let i = 0; i < 12; i++) {
			const a = ((i + 0.5) * Math.PI) / 6;
			p += `<ellipse cx="${f1(50 + 19 * Math.cos(a))}" cy="${f1(40 + 19 * Math.sin(a))}" rx="7" ry="3" transform="rotate(${f1((a * 180) / Math.PI)} ${f1(50 + 19 * Math.cos(a))} ${f1(40 + 19 * Math.sin(a))})" ${HALF} stroke-width="1.4"/>`;
		}
		return M(`<path d="${r}" stroke-width="1"/>${p}<circle cx="50" cy="40" r="11" stroke-width="1.4" stroke-dasharray="2 2"/><circle cx="50" cy="40" r="28" stroke-width="1.4" stroke-dasharray="2 2"/>
<path d="${scallop(24, 33, 3)}" transform="translate(-50,-60)" stroke-width="2"/><circle cx="50" cy="40" r="4.4" ${SOLID}/>`, [12, 2, 76, 76]);
	},
	// Suriname: Blauer Pfeilgiftfrosch auf dem Blatt
	SR: () =>
		M(`<path d="M6,72 Q18,20 72,12 Q94,40 62,66 Q34,80 6,72 Z" ${HALF} stroke-width="2"/><path d="M6,72 Q40,48 72,12" stroke-width="1.4"/>
<path d="M40,36 Q28,36 24,28 M24,28 l-5,-1 M24,28 l-2,-5 M60,36 Q72,36 76,28 M76,28 l5,-1 M76,28 l2,-5 M40,52 Q24,52 22,64 M22,64 l-5,1 M22,64 l1,5 M60,52 Q76,52 78,64 M78,64 l5,1 M78,64 l-1,5" stroke-width="3"/>
<ellipse cx="50" cy="46" rx="13" ry="15" ${SOLID}/><circle cx="50" cy="28" r="10" ${SOLID}/><circle cx="43" cy="22" r="4.4" ${SOLID}/><circle cx="57" cy="22" r="4.4" ${SOLID}/>
<circle cx="43" cy="21" r="1.8" ${PAPER}/><circle cx="57" cy="21" r="1.8" ${PAPER}/><circle cx="46" cy="42" r="2" ${PAPER}/><circle cx="55" cy="48" r="2.4" ${PAPER}/><circle cx="48" cy="54" r="1.6" ${PAPER}/><circle cx="54" cy="36" r="1.4" ${PAPER}/>`),
	// Angola: Riesen-Rappenantilope (Palanca Negra)
	AO: () =>
		M(`<path d="M34,44 Q36,36 48,36 Q66,34 76,38 Q84,42 82,52 L80,56 Q66,58 52,56 Q42,56 38,52 Z" ${SOLID}/><path d="M42,54 V74 M48,55 V74 M72,56 V74 M78,54 V74" stroke-width="2.8"/>
<path d="M40,42 L32,30 Q30,26 26,28 L18,36 Q16,40 20,42 L28,40 L36,48 Z" ${SOLID}/><path d="M30,28 Q40,8 64,8" stroke-width="3.2"/><path d="M27,28 Q34,10 56,5" stroke-width="2.6"/><path d="M31,30 l5,-6 l-1,7 Z" ${SOLID}/>
<path d="M20,40 L28,32" stroke="var(--paper)" stroke-width="1.4"/><circle cx="25" cy="32" r="1" ${PAPER}/><path d="M50,55 Q62,57 74,55" stroke="var(--paper)" stroke-width="1.4"/><path d="M82,44 Q88,50 86,60" stroke-width="1.6"/>
<path d="M8,76 q2,-6 0,-10 M12,76 q2,-6 4,-8 M90,76 q2,-6 0,-9" stroke-width="1.6"/>${GROUND}`),
	// Burkina Faso: bemalte Lehmhäuser von Tiébélé
	BF: () => {
		let t = '',
			c = '';
		for (let x = 14; x < 66; x += 8) t += `M${x},48 L${x + 4},40 L${x + 8},48 Z `;
		for (let x = 14; x < 66; x += 8) c += `M${x},56 h4 v4 h-4 Z M${x + 4},60 h4 v4 h-4 Z `;
		return M(`<path d="M14,76 V36 Q14,32 18,32 H62 Q66,32 66,36 V76 Z" ${HALF} stroke-width="2.4"/><path d="${t}" ${SOLID}/><path d="${c}" ${SOLID}/><path d="M14,50 H66 M14,66 H66" stroke-width="1.6"/>
<path d="M34,76 V68 Q40,62 46,68 V76 Z" ${SOLID}/><path d="M72,76 V52 H94 V76 Z" ${HALF} stroke-width="2.2"/><path d="M68,52 L83,30 L98,52 Z" ${SOLID}/><path d="M76,60 l4,6 l4,-6 l4,6 l4,-6" stroke-width="1.6"/>${GROUND}`);
	},
	// Burundi: königliche Trommler
	BI: () => {
		const drum = (x: number, w: number, top: number) =>
			`<path d="M${x - w / 2},${top} H${x + w / 2} L${f1(x + w * 0.32)},76 H${f1(x - w * 0.32)} Z" ${HALF} stroke-width="2.2"/><path d="M${x - w / 2 + 2},${top + 6} L${x},${top + 16} L${x + w / 2 - 2},${top + 6} M${f1(x - w * 0.38)},${top + 18} L${x},${top + 26} L${f1(x + w * 0.38)},${top + 18}" stroke-width="1.4"/><ellipse cx="${x}" cy="${top}" rx="${w / 2}" ry="3.4" fill="var(--paper)" stroke-width="2"/>`;
		return M(`<circle cx="50" cy="12" r="5.4" ${SOLID}/><path d="M43,42 Q43,20 50,20 Q57,20 57,42 Z" ${SOLID}/><path d="M45,24 L34,12 M55,24 L66,12" stroke-width="3.4"/><path d="M34,12 L29,4 M66,12 L71,4" stroke-width="2.2"/>
${drum(18, 24, 50)}${drum(82, 24, 50)}${drum(50, 32, 42)}${GROUND}`);
	},
	// Benin: Pfahlbauten von Ganvié auf dem Nokoué-See
	BJ: () => {
		const house = (x: number, s = 1) =>
			`<path d="M${x - 11 * s},${f1(66 - 22 * s)} L${x},${f1(66 - 32 * s)} L${x + 11 * s},${f1(66 - 22 * s)} Z" ${SOLID}/><path d="M${x - 8 * s},${f1(66 - 22 * s)} V${f1(66 - 10 * s)} H${x + 8 * s} V${f1(66 - 22 * s)}" ${HALF} stroke-width="2"/><path d="M${x - 7 * s},${f1(66 - 10 * s)} V68 M${x},${f1(66 - 10 * s)} V68 M${x + 7 * s},${f1(66 - 10 * s)} V68" stroke-width="1.8"/>`;
		return M(`${house(18)}${house(52, 0.85)}${house(84, 0.7)}<path d="M2,66 H98" stroke-width="1.4" stroke-dasharray="3 3"/>
<path d="M28,70 H72 L66,75 H34 Z" ${SOLID}/><path d="M50,70 V60" stroke-width="2.4"/><circle cx="50" cy="56" r="2.6" ${SOLID}/><path d="M56,48 L44,76" stroke-width="1.6"/><path d="${waves(4, 78, 6, 15, 2)}" stroke-width="1.6"/>`);
	},
	// DR Kongo: Okapi im Regenwald
	CD: () =>
		M(`<path d="M2,2 Q20,10 18,30 Q8,20 2,24 Z M98,2 Q80,8 82,26 Q92,18 98,22 Z" ${HALF} stroke-width="1.6"/>
<path d="M34,40 Q38,32 52,32 Q68,32 76,36 Q82,40 80,50 L78,54 H38 Q32,50 34,40 Z" ${SOLID}/><path d="M40,52 V74 M46,52 V74 M72,52 V74 M78,50 V74" stroke-width="3.6"/>
<path d="M70,41 h10 M70,46 h11 M71,51 h8 M70,60 h4 M76,60 h4 M70,65 h4 M76,65 h4 M38,64 h4 M44,64 h4 M38,69 h4 M44,69 h4" stroke="var(--paper)" stroke-width="1.6"/>
<path d="M38,38 L30,22 Q28,18 24,20 L14,26 Q12,30 16,31 L24,30 L32,44 Z" ${SOLID}/><path d="M28,20 L32,13 L31,22 Z" ${SOLID}/><circle cx="23" cy="24" r="1.1" ${PAPER}/><path d="M16,29 L22,27" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M80,40 Q84,46 83,54" stroke-width="1.6"/>${GROUND}`),
	// Zentralafrika: Waldelefant auf der Lichtung Dzanga Bai
	CF: () =>
		M(`<path d="M2,30 Q8,18 16,26 Q22,14 32,22 Q40,12 50,22 V40 H2 Z M98,30 Q92,18 84,26 Q78,16 70,24 V40 H98 Z" ${HALF} stroke-width="1.6"/>
<ellipse cx="50" cy="74" rx="46" ry="4" ${HALF} stroke-width="1.6"/><path d="M24,44 Q26,26 46,24 Q64,24 70,34 Q76,40 74,52 L72,56 H30 Q22,54 24,44 Z" ${SOLID}/><path d="M31,54 V73 M39,55 V73 M61,55 V73 M68,54 V73" stroke-width="6"/>
<path d="M66,30 Q78,26 82,36 Q84,44 80,50 Q82,62 86,70 Q88,74 84,74 Q78,64 76,54 Z" ${SOLID}/><path d="M64,32 Q58,40 62,48 Q70,48 72,40" stroke="var(--paper)" stroke-width="1.4"/><path d="M77,50 Q80,57 88,57" stroke="var(--paper)" stroke-width="2.4"/>
<circle cx="74" cy="36" r="1.2" ${PAPER}/><path d="M24,42 Q18,48 20,56" stroke-width="1.6"/>`),
	// Republik Kongo: Graupapagei auf dem Ast
	CG: () =>
		M(`<path d="M6,62 Q50,54 94,60" stroke-width="4"/><path d="M78,59 Q86,48 96,50 Q90,58 78,59 Z M16,61 Q10,50 2,52 Q6,60 16,61 Z" ${HALF} stroke-width="1.6"/>
<path d="M44,60 Q35,44 40,30 Q44,18 54,18 Q62,20 62,30 Q64,46 56,60 Z" ${HALF} stroke-width="2.2"/><path d="M44,32 Q40,46 48,58 Q56,48 55,34 Q50,28 44,32 Z" ${SOLID}/><path d="M46,40 q4,2 8,0 M46,46 q4,2 8,0 M47,52 q3,2 6,0" stroke="var(--paper)" stroke-width="1.2"/>
<circle cx="56" cy="26" r="4.4" ${PAPER}/><circle cx="57" cy="26" r="1.5" ${SOLID}/><path d="M61,23 Q69,25 66,33 Q62,32 60,30 Z" ${SOLID}/><path d="M47,59 L45,76 H55 L54,59 Z" ${SOLID}/><path d="M48,60 l-2,4 M54,60 l2,4" stroke-width="2"/>`),
	// Côte d’Ivoire: Basilika von Yamoussoukro
	CI: () =>
		M(`<path d="M30,46 Q30,16 50,14 Q70,16 70,46 Z" ${HALF} stroke-width="2.4"/><path d="M40,46 Q40,22 50,15 M60,46 Q60,22 50,15 M50,15 V46" stroke-width="1.4"/><path d="M46,14 V7 H54 V14 Z" ${SOLID}/><path d="M50,7 V1 M47,3 H53" stroke-width="1.4"/>
<path d="M27,46 H73 V54 H27 Z" ${SOLID}/><path d="M2,76 V58 Q14,52 28,54 V76 M98,76 V58 Q86,52 72,54 V76" ${HALF} stroke-width="2"/><path d="M6,76 V60 M11,76 V58 M16,76 V57 M21,76 V56 M79,76 V56 M84,76 V57 M89,76 V58 M94,76 V60" stroke-width="1.4"/>
<path d="M28,54 H72 V76 H28 Z" ${HALF} stroke-width="2"/><path d="M44,76 V64 Q50,58 56,64 V76" ${SOLID}/>${GROUND}`),
	// Kamerun: Kamerunberg über Palmen und Meer
	CM: () =>
		M(`<path d="M2,70 L30,30 Q36,24 42,26 L50,22 Q56,22 60,30 L98,70" ${HALF} stroke-width="2.2"/><path d="M44,18 q-4,-6 2,-9 q2,-6 8,-3 q6,-2 6,4 q4,2 0,6" stroke-width="1.6"/><path d="M36,34 L32,46 M56,30 L62,44" stroke-width="1.4"/>
<path d="M14,76 Q12,58 18,46 M18,46 q-8,-2 -12,4 M18,46 q-2,-8 -9,-8 M18,46 q6,-6 12,-4 M18,46 q8,2 8,8" stroke-width="2.2"/><path d="M84,76 Q86,60 82,50 M82,50 q-8,0 -10,6 M82,50 q2,-7 9,-7 M82,50 q8,0 9,6" stroke-width="2.2"/>
<path d="M2,70 H98" stroke-width="1.6"/><path d="${waves(26, 76, 3, 16, 2.6)}" stroke-width="1.8"/>`),
	// Dschibuti: Kalkschlote am Lac Abbé mit Flamingo
	DJ: () => {
		const ch = (x: number, h: number, w: number) =>
			`<path d="M${x - w},70 Q${x - w - 2},${70 - h * 0.5} ${f1(x - w * 0.6)},${70 - h} Q${x},${70 - h - 4} ${f1(x + w * 0.6)},${70 - h} Q${x + w + 2},${70 - h * 0.5} ${x + w},70 Z" ${HALF} stroke-width="2"/><path d="M${x},${66 - h} q-3,-4 0,-8 q3,-4 0,-8" stroke-width="1.4"/>`;
		return M(`${ch(18, 40, 9)}${ch(44, 50, 10)}${ch(68, 32, 8)}<path d="M2,70 H98" stroke-width="2"/>
<path d="M84,74 V58 M88,74 L86,58" stroke-width="1.4"/><path d="M78,56 Q84,48 95,52 Q90,58 82,58 Z" ${SOLID}/><path d="M80,54 Q72,44 80,36 Q86,32 86,38" stroke-width="2"/><path d="M86,38 L90,42 L86,41" stroke-width="1.6"/>
<path d="${waves(4, 76, 5, 14, 2)}" stroke-width="1.6"/>`);
	},
	// Algerien: Ghardaïa im M’zab-Tal
	DZ: () => {
		let h = '';
		for (const [y, xs] of [[62, [4, 18, 32, 54, 68, 82]], [48, [14, 28, 58, 72]], [36, [24, 62]]] as const)
			for (const x of xs) h += `<path d="M${x},${y} h14 v14 h-14 Z" ${HALF} stroke-width="1.6"/><path d="M${x + 5},${y + 5} h3 v4 h-3 Z" ${SOLID}/>`;
		return M(`${h}<path d="M43,76 L45,12 H55 L57,76 Z" ${SOLID}/><path d="M44,12 L44,6 M48,12 V5 M52,12 V5 M56,12 V6" stroke-width="2"/><path d="M47,24 h2 v4 h-2 Z M51,36 h2 v4 h-2 Z" ${PAPER}/>${GROUND}`);
	},
	// Westsahara: Nomadenzelt (Khaima) in den Dünen
	EH: () =>
		M(`<path d="M10,4 A9,9 0 1 0 19,18 A7,7 0 1 1 10,4 Z" ${SOLID}/>${star(30, 8, 2)}${star(84, 10, 2.4)}${star(70, 4, 1.6)}<path d="M2,54 Q30,40 60,50 Q80,42 98,50 V60 H2 Z" ${HALF} stroke-width="2"/>
<path d="M12,68 L22,50 L36,46 L50,40 L64,46 L78,50 L88,68 Z" ${SOLID}/><path d="M43,68 L50,52 L57,68 Z" ${PAPER}/><path d="M50,40 V34 M22,50 V44 M78,50 V44" stroke-width="1.8"/><path d="M4,68 L12,68 M88,68 H96" stroke-width="1.6"/>${GROUND}`),
	// Eritrea: Fiat-Tagliero-Tankstelle in Asmara
	ER: () =>
		M(`<path d="M38,76 V44 H62 V76 Z" ${HALF} stroke-width="2"/><path d="M46,44 V20 H54 V44 Z" ${SOLID}/><path d="M43,20 H57" stroke-width="2.4"/><path d="M50,20 V8" stroke-width="1.4"/><path d="M50,8 h7 l-2,2.5 l2,2.5 h-7 Z" ${SOLID}/>
<path d="M4,47 L38,43 V50 L4,52 Z M96,47 L62,43 V50 L96,52 Z" ${SOLID}/><path d="M41,56 H59 M41,62 H59" stroke-width="1.4"/><path d="M46,76 V68 H54 V76" ${SOLID}/>
<path d="M14,76 Q12,64 16,56 M16,56 q-6,-2 -9,3 M16,56 q-1,-6 -6,-7 M16,56 q5,-4 10,-2 M86,76 Q88,64 84,56 M84,56 q6,-2 9,3 M84,56 q1,-6 6,-7 M84,56 q-5,-4 -10,-2" stroke-width="1.8"/>${GROUND}`),
	// Gabun: Surfende Flusspferde von Loango
	GA: () =>
		M(`${sun(84, 12, 6)}<path d="M2,30 H24 M8,30 q-2,-10 4,-14 M12,16 q-8,-2 -8,4 M12,16 q6,-4 10,0" stroke-width="1.8"/>
<path d="M42,60 Q46,34 68,32 Q88,32 94,50 L96,60 Z" ${SOLID}/><path d="M48,52 Q44,40 32,40 Q16,40 10,48 Q8,58 18,60 H48 Z" ${SOLID}/>
<circle cx="40" cy="36" r="3.2" ${SOLID}/><circle cx="47" cy="34" r="3" ${SOLID}/><circle cx="34" cy="40" r="3.6" ${SOLID}/><circle cx="33.4" cy="39.4" r="1.2" ${PAPER}/><ellipse cx="15" cy="47" rx="2" ry="1.4" ${PAPER}/><path d="M12,54 Q22,56 30,52" stroke="var(--paper)" stroke-width="1.4"/>
<path d="M2,62 Q14,48 26,52 Q20,56 24,60 Q40,56 56,62 Q76,58 98,62 V76 H2 Z" ${HALF} stroke-width="2.2"/><path d="${waves(10, 70, 5, 16, 2.4)}" stroke-width="1.6"/>`),
	// Ghana: Kakaofrüchte am Stamm
	GH: () => {
		const pod = (x: number, y: number, a: number, solid = true) =>
			`<g transform="rotate(${a} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="7" ry="13" ${solid ? SOLID : `${HALF} stroke-width="2"`}/><path d="M${x - 3},${y - 11} Q${x - 5},${y} ${x - 3},${y + 11} M${x + 3},${y - 11} Q${x + 5},${y} ${x + 3},${y + 11}" stroke="${solid ? 'var(--paper)' : 'currentColor'}" stroke-width="1.2"/></g>`;
		return M(`<path d="M46,76 V4 H54 V76 Z" ${HALF} stroke-width="2"/><path d="M54,30 Q70,22 84,8 M46,22 Q30,16 18,4" stroke-width="2.6"/>
<path d="M84,8 Q96,10 96,22 Q86,22 84,8 Z M18,4 Q6,6 4,18 Q14,18 18,4 Z M70,20 Q80,26 78,36 Q70,32 70,20 Z" ${HALF} stroke-width="1.6"/>
${pod(36, 40, 18)}${pod(64, 48, -16)}${pod(38, 62, 8, false)}<path d="M82,76 Q74,74 72,66 Q82,64 90,70 Z" ${HALF} stroke-width="1.6"/><circle cx="78" cy="70" r="1.6" ${SOLID}/><circle cx="83" cy="71" r="1.6" ${SOLID}/>${GROUND}`);
	},
	// Gambia: Krokodil am Flussufer
	GM: () =>
		M(`${sun(80, 16, 7)}<path d="M2,40 Q20,30 40,38 M70,42 Q84,36 98,40" stroke-width="1.6"/><path d="M2,64 Q50,58 98,66 V76 H2 Z" ${HALF} stroke-width="1.8"/>
<path d="M6,58 L30,54 Q36,48 48,48 Q66,48 76,54 Q86,60 98,66 Q84,64 74,62 L34,64 Q20,62 6,60 Z" ${SOLID}/><path d="M40,48 l3,-4 l3,4 M50,47 l3,-4 l3,4 M60,48 l3,-4 l3,4 M70,51 l3,-3 l3,4" ${SOLID}/>
<path d="M40,62 L35,70 M64,62 L68,70" stroke-width="3.6"/><circle cx="30" cy="52" r="3.2" ${SOLID}/><circle cx="30" cy="51" r="1" ${PAPER}/><path d="M9,59.5 l3,1.6 l3,-1.6 l3,1.6 l3,-1.6 l3,1.6" stroke="var(--paper)" stroke-width="1"/>`),
	// Guinea: Wasserfall „Brautschleier“ im Fouta Djallon
	GN: () =>
		M(`<path d="M2,24 H44 Q30,50 22,70 H2 Z M98,24 H56 Q70,50 78,70 H98 Z" ${HALF} stroke-width="2"/><path d="M44,24 Q30,50 22,70 H78 Q70,50 56,24 Z" ${PAPER}/>
<path d="M46,24 Q36,48 30,70 M49,24 Q44,48 42,70 M51,24 Q56,48 58,70 M54,24 Q64,48 70,70" stroke-width="1.4"/><path d="M2,22 Q8,12 16,18 Q24,8 34,16 Q40,10 44,22 M56,22 Q62,10 72,16 Q80,8 88,18 Q94,12 98,22" ${SOLID}/>
<path d="M2,24 H44 M56,24 H98" stroke-width="2.4"/><path d="M18,72 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0" stroke-width="1.8"/><path d="${waves(6, 78, 6, 15, 2)}" stroke-width="1.6"/>`),
	// Äquatorialguinea: Kapokbaum (Ceiba)
	GQ: () =>
		M(`<path d="M44,76 Q46,56 46,36 H54 Q54,56 56,76 Z" ${SOLID}/><path d="M28,76 Q42,70 46,58 M72,76 Q58,70 54,58 M36,76 Q45,68 47,60 M64,76 Q55,68 53,60" stroke-width="3"/><path d="M48,38 L30,28 M52,38 L70,28 M50,36 V22" stroke-width="3"/>
<path d="M6,30 Q20,16 50,18 Q80,16 94,30 Q70,36 50,34 Q30,36 6,30 Z" ${SOLID}/><path d="M24,16 Q36,4 50,6 Q64,4 76,16 Q60,20 50,18 Q40,20 24,16 Z" ${SOLID}/><path d="M18,28 Q50,22 82,28" stroke="var(--paper)" stroke-width="1.2"/>${GROUND}`),
	// Guinea-Bissau: Cashewapfel mit Nuss
	GW: () =>
		M(`<path d="M50,2 V14" stroke-width="2.4"/><path d="M50,8 Q36,0 24,6 Q34,14 50,8 Z M50,10 Q66,2 78,8 Q68,16 50,10 Z" ${HALF} stroke-width="1.8"/><path d="M28,6 Q38,6 48,8 M72,8 Q62,8 52,10" stroke-width="1"/>
<path d="M40,16 Q38,13 45,13 H55 Q62,13 60,16 Q68,36 60,50 H40 Q32,36 40,16 Z" ${HALF} stroke-width="2.4"/><path d="M44,20 Q40,32 43,44" stroke-width="1.6"/>
<path d="M41,52 Q38,66 48,70 Q57,73 59,64 Q52,64 52,58 Q54,52 50,50 Z" ${SOLID}/><path d="M46,58 q2,6 6,8" stroke="var(--paper)" stroke-width="1.2"/>`, [20, 0, 60, 76]),
	// Komoren: Quastenflosser
	KM: () => {
		let d = '';
		for (const [x, y, r] of [[30, 34, 2.2], [42, 44, 1.8], [52, 32, 2.4], [62, 46, 2], [72, 36, 1.8], [36, 48, 1.4], [58, 39, 1.4]]) d += `<circle cx="${x}" cy="${y}" r="${r}" ${PAPER}/>`;
		return M(`<path d="M8,40 Q18,24 46,24 Q72,24 82,36 L96,28 Q92,40 96,52 L82,44 Q72,56 46,56 Q18,56 8,40 Z" ${SOLID}/><path d="M82,40 H98" stroke-width="3"/>
<path d="M38,54 Q36,64 28,70 Q40,68 46,56 Z M60,54 Q62,64 70,68 Q66,58 66,54 Z M44,26 Q48,12 58,14 Q56,22 56,26 Z M66,28 Q70,18 76,20 Q72,28 72,31 Z M24,50 Q20,58 14,60 Q22,60 30,54 Z" ${SOLID}/>
${d}<circle cx="18" cy="37" r="3" ${PAPER}/><circle cx="18" cy="37" r="1.4" ${SOLID}/><path d="M9,42 Q14,45 20,44 M24,30 Q22,40 24,50" stroke="var(--paper)" stroke-width="1.4"/>
<circle cx="6" cy="22" r="1.8" stroke-width="1.4"/><circle cx="10" cy="14" r="1.2" stroke-width="1.2"/>`, [0, 8, 100, 66]);
	},
	// Liberia: Zwergflusspferd im Regenwald
	LR: () =>
		M(`<path d="M2,2 Q18,8 18,28 Q8,18 2,22 Z M98,2 Q82,6 80,24 Q92,16 98,20 Z M84,30 Q94,32 98,44 Q88,42 84,30 Z" ${HALF} stroke-width="1.6"/>
<path d="M26,48 Q28,30 50,30 Q72,30 78,44 Q82,54 74,60 H32 Q24,58 26,48 Z" ${SOLID}/><path d="M30,42 Q18,40 12,48 Q10,57 18,58 L32,56 Z" ${SOLID}/><path d="M34,58 V74 M42,59 V74 M64,59 V74 M72,58 V74" stroke-width="5.4"/>
<circle cx="28" cy="38" r="2.8" ${SOLID}/><circle cx="23" cy="43" r="1.2" ${PAPER}/><ellipse cx="14" cy="49" rx="1.6" ry="1.1" ${PAPER}/><path d="M14,54 Q20,56 26,53" stroke="var(--paper)" stroke-width="1.2"/><path d="M78,46 q4,2 4,6" stroke-width="1.6"/>${GROUND}`),
	// Libyen: Severusbogen in Leptis Magna
	LY: () =>
		M(`<path d="M20,76 V26 H80 V76 H64 V52 Q50,36 36,52 V76 Z" ${HALF} stroke-width="2.4"/><path d="M17,26 H83 V17 H17 Z" ${SOLID}/><path d="M22,21 H78" stroke="var(--paper)" stroke-width="1.2" stroke-dasharray="3 2"/>
<path d="M25,76 V30 M31,76 V30 M69,76 V30 M75,76 V30" stroke-width="1.6"/><path d="M23,30 h10 M67,30 h10 M23,42 h10 M67,42 h10" stroke-width="1.4"/><path d="M36,52 Q50,38 64,52" stroke-width="1.4"/>
<path d="M7,76 V48 M93,76 V58" stroke-width="5"/><path d="M3,48 H11 M89,58 H97" stroke-width="2.6"/><path d="M84,76 l4,-4 h6 l2,4" ${SOLID}/>${GROUND}`),
	// Mali: Große Moschee von Djenné
	ML: () => {
		const tw = (x: number, t: number) => {
			let s = '';
			for (let y = t + 10; y < 72; y += 7) s += `M${x - 9},${y} h3 M${x + 6},${y} h3 `;
			return `<path d="M${x - 6},76 V${t + 6} Q${x},${t - 2} ${x + 6},${t + 6} V76 Z" ${SOLID}/><circle cx="${x}" cy="${t - 3}" r="2.2" ${SOLID}/><path d="${s}" stroke-width="1.6"/>`;
		};
		let st = '';
		for (let x = 14; x < 90; x += 8) st += `M${x},50 v-3 M${x},62 v-3 `;
		return M(`<path d="M8,76 V40 H92 V76 Z" ${HALF} stroke-width="2"/><path d="M8,40 l3,-4 l3,4 l3,-4 l3,4 M80,40 l3,-4 l3,4 l3,-4 l3,4" stroke-width="1.6"/><path d="${st}" stroke-width="1.4"/>
${tw(26, 16)}${tw(50, 8)}${tw(74, 16)}<path d="M44,76 V66 Q50,60 56,66 V76" ${PAPER}/>${GROUND}`);
	},
	// Mauretanien: Erzzug durch die Sahara
	MR: () => {
		let c = '';
		for (let i = 0; i < 6; i++) {
			const x = 30 + i * 11.4;
			c += `<path d="M${f1(x)},48 h10 v11 h-10 Z" ${HALF} stroke-width="1.6"/><path d="M${f1(x)},48 Q${f1(x + 5)},42 ${f1(x + 10)},48 Z" ${SOLID}/><circle cx="${f1(x + 2.5)}" cy="61" r="1.6" ${SOLID}/><circle cx="${f1(x + 7.5)}" cy="61" r="1.6" ${SOLID}/>`;
		}
		return M(`${sun(80, 14, 7)}<path d="M2,44 Q24,34 50,42 Q74,32 98,40" ${HALF} stroke-width="1.6"/><path d="M4,60 V42 H22 L28,48 V60 Z" ${SOLID}/><path d="M8,46 h5 v4 h-5 Z" ${PAPER}/><circle cx="10" cy="61" r="2" ${SOLID}/><circle cx="22" cy="61" r="2" ${SOLID}/>
${c}<path d="M2,64 H98" stroke-width="2"/><path d="M2,67 H98" stroke-width="2.4" stroke-dasharray="1.6 3"/><path d="M2,76 Q30,70 60,74 Q80,70 98,74" stroke-width="2"/>`);
	},
	// Mosambik: Walhai vor Tofo
	MZ: () => {
		let d = '';
		for (let x = 24; x < 80; x += 7) for (const y of [34, 41, 47]) if (!((x + y) % 3)) d += `<circle cx="${x}" cy="${y}" r="1.3" ${PAPER}/>`; else d += `<circle cx="${x + 3}" cy="${y}" r="1" ${PAPER}/>`;
		return M(`<path d="M30,2 L22,22 M50,2 L48,18 M70,2 L76,20" stroke-width="1.2" stroke-dasharray="3 3"/>
<path d="M6,42 Q18,28 48,28 Q72,30 84,38 L98,26 Q94,40 98,56 L84,44 Q72,54 48,54 Q18,54 6,42 Z" ${SOLID}/><path d="M38,52 Q34,64 26,68 Q38,64 46,54 Z M56,29 Q62,16 70,18 Q66,26 66,31 Z" ${SOLID}/>
${d}<path d="M7,43 Q12,47 18,46 M20,34 V48 M23,34 V48" stroke="var(--paper)" stroke-width="1.2"/><circle cx="13" cy="38" r="1.2" ${PAPER}/>
<circle cx="88" cy="64" r="1.8" stroke-width="1.2"/><circle cx="92" cy="70" r="1.2" stroke-width="1.2"/><path d="${waves(2, 76, 6, 16, 2)}" stroke-width="1.6"/>`);
	},
	// Niger: Lehmminarett der Großen Moschee von Agadez
	NE: () => {
		let b = '';
		for (let y = 16; y < 72; y += 8) {
			const w = 6 + ((76 - y) * 0) + (y - 8) * (6 / 68);
			b += `M${f1(50 - w - 5)},${y} H${f1(50 + w + 5)} `;
		}
		return M(`<path d="M38,76 L44,8 H56 L62,76 Z" ${HALF} stroke-width="2.4"/><path d="M44,8 L46,2 H54 L56,8 Z" ${SOLID}/><path d="${b}" stroke-width="1.6"/><path d="M48,22 h4 v5 h-4 Z" ${SOLID}/>
<path d="M4,76 V58 H34 V76 M66,76 V62 H96 V76" ${HALF} stroke-width="2"/><path d="M10,64 h4 v5 h-4 Z M22,64 h4 v5 h-4 Z M74,67 h4 v4 h-4 Z M86,67 h4 v4 h-4 Z" ${SOLID}/>${GROUND}`);
	},
	// Nigeria: Zuma Rock
	NG: () =>
		M(`<path d="M10,72 Q12,40 30,22 Q50,8 70,22 Q90,40 92,72 Z" ${HALF} stroke-width="2.4"/><path d="M26,32 Q24,50 26,68 M36,22 Q34,44 36,68 M66,22 Q68,44 66,68 M76,32 Q78,50 76,68" stroke-width="1.2"/>
<ellipse cx="43" cy="36" rx="3" ry="2" ${SOLID}/><ellipse cx="57" cy="36" rx="3" ry="2" ${SOLID}/><path d="M50,40 V46 M44,52 Q50,55 56,52" stroke-width="1.8"/>
<path d="M2,76 V70 q5,-7 10,0 q5,-8 10,0 q5,-6 10,0 H70 q5,-7 10,0 q5,-8 10,0 q4,-5 8,0 V76 Z" ${SOLID}/><path d="M32,74 H70" stroke-width="2.6"/>`),
	// Sudan: Pyramiden von Meroë
	SD: () => {
		const py = (x: number, w: number, h: number) =>
			`<path d="M${x - w / 2},68 L${x},${68 - h} L${x + w / 2},68 Z" ${HALF} stroke-width="2"/><path d="M${x},${68 - h} L${x + w / 6},68" stroke-width="1.2"/><path d="M${x - 4},68 V${62} h8 V68" ${SOLID}/>`;
		return M(`${sun(16, 14, 7)}${py(88, 12, 22)}${py(70, 18, 32)}${py(22, 20, 36)}${py(46, 24, 44)}<path d="M2,70 Q20,62 44,68 Q70,62 98,68 V76 H2 Z" ${HALF} stroke-width="2"/>${GROUND}`);
	},
	// St. Helena: Jacob’s Ladder über Jamestown
	SH: () => {
		let r = '';
		for (let i = 1; i < 14; i++) {
			const t = i / 14;
			r += `M${f1(10 + 56 * t)},${f1(74 - 62 * t)} L${f1(18 + 54 * t)},${f1(76 - 62 * t)} `;
		}
		return M(`<path d="M2,76 V58 L28,38 L58,10 L98,6 V76 Z" ${HALF} stroke-width="2"/><path d="M10,74 L66,12 M18,76 L72,14" stroke-width="2"/><path d="${r}" stroke-width="1.2"/>
<path d="M24,76 V64 H34 V76 M36,76 V60 L41,55 L46,60 V76 M48,76 V66 H58 V76" ${SOLID}/><path d="M40,64 h2 v3 h-2 Z" ${PAPER}/><path d="M80,76 V60 h10 V76" ${SOLID}/><path d="M85,60 V54" stroke-width="1.6"/>${GROUND}`);
	},
	// Sierra Leone: Schimpanse im Schutzgebiet Tacugama
	SL: () =>
		M(`<path d="M2,8 Q20,14 22,34 Q10,26 2,30 Z M6,40 Q18,44 20,58 Q10,52 4,54 Z" ${HALF} stroke-width="1.6"/>
<path d="M32,74 Q24,52 34,38 Q42,30 54,32 Q66,36 68,52 Q70,66 64,74 Z" ${SOLID}/><circle cx="52" cy="22" r="12" ${SOLID}/><ellipse cx="39.5" cy="22" rx="3.6" ry="4.4" ${PAPER}/><ellipse cx="64.5" cy="22" rx="3.6" ry="4.4" ${PAPER}/>
<path d="M44,22 Q44,14 52,15 Q60,14 60,22 Q61,32 52,33 Q43,32 44,22 Z" ${PAPER}/><circle cx="48.5" cy="21" r="1.4" ${SOLID}/><circle cx="55.5" cy="21" r="1.4" ${SOLID}/><path d="M50,26 h4 M48,29.5 Q52,31.5 56,29.5" stroke-width="1.2"/>
<path d="M64,44 Q76,54 70,72" stroke-width="6"/><path d="M36,46 Q28,58 38,66" stroke="var(--paper)" stroke-width="1.4"/>${GROUND}`),
	// Somalia: Felsmalereien von Laas Geel
	SO: () => {
		const cow = (x: number, y: number) =>
			`<path d="M${x - 10},${y} Q${x - 10},${y - 6} ${x},${y - 6} Q${x + 10},${y - 6} ${x + 10},${y} Q${x + 10},${y + 4} ${x},${y + 4} Q${x - 10},${y + 4} ${x - 10},${y} Z" ${SOLID}/><path d="M${x - 7},${y + 3} v7 M${x - 3},${y + 3} v7 M${x + 4},${y + 3} v7 M${x + 8},${y + 3} v7" stroke-width="1.6"/>
<path d="M${x - 9},${y - 3} L${x - 15},${y - 7}" stroke-width="3"/><path d="M${x - 15},${y - 7} q-4,-6 0,-9 M${x - 15},${y - 7} q3,-6 7,-6" stroke-width="1.4"/><path d="M${x - 5},${y - 5} v8 M${x - 1},${y - 6} v9 M${x + 3},${y - 6} v9" stroke="var(--paper)" stroke-width="1"/>`;
		return M(`<path d="M2,30 Q30,24 50,26 Q70,24 98,30 V76 H2 Z" ${HALF} stroke-width="1.6"/><path d="M2,6 Q50,0 98,8 V30 Q70,24 50,26 Q30,24 2,30 Z" ${SOLID}/>
${cow(34, 44)}${cow(72, 52)}<circle cx="52" cy="58" r="2" ${SOLID}/><path d="M52,60 v8 M52,62 l-4,3 M52,62 l4,-3 M52,68 l-3,5 M52,68 l3,5" stroke-width="1.6"/>${GROUND}`);
	},
	// Südsudan: Mundari-Rinder mit gewaltigen Hörnern
	SS: () =>
		M(`<path d="M26,46 Q28,36 44,36 Q64,36 74,40 Q80,46 78,56 L76,58 H32 Q24,56 26,46 Z" ${SOLID}/><path d="M34,38 Q36,28 46,34 Z" ${SOLID}/><path d="M34,56 V74 M40,57 V74 M68,57 V74 M74,56 V74" stroke-width="2.8"/>
<path d="M32,44 Q22,42 18,48 L14,58 Q14,62 18,62 Q22,60 24,54 L32,50 Z" ${SOLID}/><path d="M24,44 Q6,32 12,4" stroke-width="4.2"/><path d="M28,42 Q38,24 32,2" stroke-width="4.2"/>
<path d="M28,52 Q30,60 34,58" stroke-width="2"/><circle cx="22" cy="50" r="1.1" ${PAPER}/><path d="M78,46 Q84,52 82,62" stroke-width="1.6"/><path d="M84,74 q-2,-10 4,-16 q6,-8 2,-16" stroke-width="1.4" stroke-dasharray="2 3"/>${GROUND}`),
	// São Tomé: Pico Cão Grande über dem Regenwald
	ST: () =>
		M(`<path d="M42,72 Q44,40 46,20 Q48,8 52,8 Q56,10 56,22 Q58,40 62,72 Z" ${HALF} stroke-width="2.4"/><path d="M50,14 Q48,40 48,70 M54,20 Q55,44 56,70" stroke-width="1.2"/>
<path d="M28,34 q4,-6 10,-2 q4,-4 8,0 M60,26 q4,-5 9,-2 q4,-3 7,1" ${PAPER}/><path d="M28,34 q4,-6 10,-2 q4,-4 8,0 M60,26 q4,-5 9,-2 q4,-3 7,1" stroke-width="1.6"/>
<path d="M2,76 V64 q5,-8 10,-2 q5,-9 10,-1 q5,-8 10,0 q5,-8 10,1 q5,-7 10,0 q5,-8 10,0 q5,-8 10,-1 q5,-7 10,1 q5,-6 8,0 V76 Z" ${SOLID}/>
<path d="M12,60 Q10,46 14,38 M14,38 q-6,-2 -10,2 M14,38 q-2,-6 -7,-7 M14,38 q4,-6 10,-4 M14,38 q6,2 7,7" stroke-width="1.8"/>`),
	// Eswatini: Breitmaulnashorn im Hlane-Park
	SZ: () =>
		M(`<path d="M84,58 V40 M84,44 L76,36 M84,42 L92,34" stroke-width="2"/><path d="M68,36 Q84,24 98,34 Q84,40 68,36 Z" ${HALF} stroke-width="1.6"/>
<path d="M30,42 Q34,28 54,28 Q74,28 80,40 Q84,50 78,58 H34 Q26,54 30,42 Z" ${SOLID}/><path d="M34,38 Q24,36 16,46 L10,54 Q10,58 16,58 H34 Z" ${SOLID}/><path d="M12,50 L7,34 L19,48 Z M21,44 L21,37 L26,44 Z M32,34 L30,25 L37,32 Z" ${SOLID}/>
<path d="M39,56 V74 M47,57 V74 M68,57 V74 M76,56 V74" stroke-width="6"/><circle cx="26" cy="44" r="1.2" ${PAPER}/><path d="M40,32 Q38,44 40,56 M66,30 Q70,44 68,56" stroke="var(--paper)" stroke-width="1.2"/><path d="M80,42 q4,4 3,10" stroke-width="1.6"/>${GROUND}`),
	// Tschad: Felsbogen von Aloba im Ennedi mit Karawane
	TD: () => {
		const cam = (x: number) =>
			`<g transform="translate(${x},74)"><path d="M-8,-9 Q-6,-17 0,-15 Q6,-19 10,-11 L14,-17 H18 V-14 L15,-13 L12,-5 H-8 Z" ${SOLID}/><path d="M-6,-6 V0 M-2,-6 V0 M6,-6 V0 M10,-6 V0" stroke-width="1.6"/></g>`;
		return M(`<path d="M8,76 Q6,30 20,16 Q50,0 80,16 Q94,30 92,76 H74 Q76,44 66,34 Q50,24 34,34 Q24,44 26,76 Z" ${HALF} stroke-width="2.4"/><path d="M14,40 Q16,30 22,24 M84,40 Q82,30 78,24 M40,10 Q50,8 60,10" stroke-width="1.2"/>
${cam(42)}${cam(60)}<path d="M2,76 Q20,72 40,74" stroke-width="1.6"/>${GROUND}`);
	},
	// Togo: Lehmburgen (Takienta) der Batammariba
	TG: () => {
		const tw = (x: number, t: number) => `<path d="M${x - 8},76 V${t} Q${x},${t - 4} ${x + 8},${t} V76 Z" ${HALF} stroke-width="2"/><path d="M${x - 11},${t + 2} L${x},${t - 20} L${x + 11},${t + 2} Z" ${SOLID}/>`;
		return M(`<path d="M14,76 V58 H86 V76" ${HALF} stroke-width="2"/>${tw(22, 46)}${tw(78, 46)}${tw(50, 38)}<path d="M45,76 V66 Q50,60 55,66 V76 Z" ${SOLID}/><path d="M14,64 H86" stroke-width="1.2" stroke-dasharray="2 2"/>${GROUND}`);
	},
	// Antigua und Barbuda: Regatta der Sailing Week
	AG: () => {
		const boat = (x: number, s: number) =>
			`<g transform="translate(${x},66) scale(${s}) rotate(-8)"><path d="M-16,0 H16 L11,6 H-12 Z" ${SOLID}/><path d="M0,-2 V-44" stroke-width="2"/><path d="M2,-42 L18,-4 H2 Z" ${HALF} stroke-width="1.8"/><path d="M-2,-38 L-14,-4 H-2 Z" ${HALF} stroke-width="1.8"/></g>`;
		return M(`${sun(14, 14, 6)}<path d="M2,52 Q30,46 60,50 T98,48" stroke-width="1.4"/>${boat(76, 0.62)}${boat(28, 0.82)}${boat(54, 1)}<path d="${waves(2, 74, 6, 16, 3)}" stroke-width="2"/>`);
	},
	// Anguilla: Langusten-Fang
	AI: () => {
		let s = '';
		for (let i = 0; i < 5; i++) s += `M${30 + i * 8},${44} Q${28 + i * 8},${52} ${24 + i * 8},${58} M${30 + i * 8},${36} Q${28 + i * 8},${28} ${24 + i * 8},${22} `;
		return M(`<path d="${s}" stroke-width="1.8"/><path d="M20,40 Q24,30 40,32 H70 L76,36 L92,30 L88,40 L92,50 L76,44 L70,48 H40 Q24,50 20,40 Z" ${SOLID}/><path d="M46,33 V47 M54,33 V47 M62,33 V47 M70,34 V46" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M22,36 Q8,20 4,4 M22,44 Q8,60 4,76 M24,36 Q14,26 18,16 M24,44 Q14,54 18,64" stroke-width="1.6"/><circle cx="26" cy="38" r="1.2" ${PAPER}/>`, [2, 2, 94, 76]);
	},
	// Barbados: Fliegender Fisch
	BB: () =>
		M(`${sun(84, 14, 6)}<path d="M34,26 Q48,4 74,10 Q60,20 52,34 Z M36,48 Q48,64 70,62 Q58,54 52,44 Z" ${HALF} stroke-width="2"/><path d="M42,30 L64,14 M44,46 L62,58" stroke-width="1.2"/>
<path d="M14,40 Q24,30 50,34 Q70,36 82,40 L96,30 L92,40 L96,50 L82,42 Q70,46 50,46 Q24,50 14,40 Z" ${SOLID}/><circle cx="22" cy="38" r="1.6" ${PAPER}/><path d="M28,36 Q27,40 28,44" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M2,48 h6 M4,40 h6 M6,32 h4" stroke-width="1.4"/><path d="${waves(4, 74, 6, 15, 3)}" stroke-width="2"/>`),
	// St. Barthélemy: rote Dächer über dem Hafen von Gustavia
	BL: () => {
		let h = '';
		for (const [x, y] of [[8, 40], [24, 34], [40, 42], [58, 36], [74, 44]]) h += `<path d="M${x},${y + 14} V${y + 4} L${x + 7},${y - 2} L${x + 14},${y + 4} V${y + 14} Z" ${PAPER}/><path d="M${x},${y + 14} V${y + 4} H${x + 14} V${y + 14}" stroke-width="1.6"/><path d="M${x - 1},${y + 5} L${x + 7},${y - 3} L${x + 15},${y + 5} Z" ${SOLID}/><path d="M${x + 5},${y + 8} h4 v4 h-4 Z" ${SOLID}/>`;
		return M(`<path d="M2,62 Q8,30 30,26 Q60,22 98,46 V62 Z" ${HALF} stroke-width="2"/>${h}<path d="M2,62 H98" stroke-width="2"/>
<path d="M58,68 H86 L82,73 H62 Z" ${SOLID}/><path d="M72,68 V48" stroke-width="1.6"/><path d="M74,50 L84,66 H74 Z" ${HALF} stroke-width="1.4"/><path d="${waves(4, 76, 3, 16, 2)}" stroke-width="1.6"/>`);
	},
	// Bermuda: Mondtor aus weißem Stein mit Blick aufs Meer und Longtail-Vogel
	BM: () =>
		M(`<path d="M14,76 V24 H86 V76 Z M26,52 A24,24 0 1 0 74,52 A24,24 0 1 0 26,52 Z" fill="currentColor" fill-opacity=".3" fill-rule="evenodd" stroke-width="2.2"/><path d="M10,24 H90 M12,19 H88" stroke-width="2.4"/>
<path d="M27.5,60 H72.5" stroke-width="1.8"/><path d="M34,66 q4,-3 8,0 q4,-3 8,0 q4,-3 8,0" stroke-width="1.4"/><path d="M42,60 A8,8 0 0 1 58,60 Z" ${SOLID}/><path d="M46,12 q4,-4 7,0 q3,-4 7,0 M53,12 l-8,6" stroke-width="1.4"/>
<path d="M20,34 h6 v6 h-6 Z M74,34 h6 v6 h-6 Z" ${SOLID}/><path d="M6,76 q2,-12 6,-14 q-2,8 2,14 M94,76 q-2,-12 -6,-14 q2,8 -2,14" stroke-width="1.6"/>${GROUND}`),
	// Dominica: Trafalgar-Zwillingsfälle im Regenwald
	DM: () =>
		M(`<path d="M2,76 V30 Q12,16 24,24 L30,20 V76 Z M70,76 V14 Q80,6 90,14 L98,10 V76 Z M38,76 V26 Q48,18 58,26 V76 Z" ${HALF} stroke-width="2"/>
<path d="M30,22 H38 V70 H30 Z M58,26 H70 V70 H58 Z" ${PAPER}/><path d="M32,22 V70 M36,22 V70 M60,26 V70 M64,26 V70 M68,26 V70" stroke-width="1.2"/><path d="M26,70 q4,-5 8,0 q4,-5 8,0 M54,70 q4,-5 8,0 q4,-5 8,0 q4,-5 8,0" stroke-width="1.6"/>
<path d="M2,26 Q6,14 14,20 Q18,10 26,16 M72,12 Q78,2 86,8 Q92,2 98,8" stroke-width="1.6"/><path d="M2,74 H98" stroke-width="1.4" stroke-dasharray="3 3"/>`),
	// Grenada: Muskatnuss mit rotem Samenmantel
	GD: () =>
		M(`<path d="M50,4 V14" stroke-width="2.4"/><path d="M50,10 Q36,0 22,6 Q34,16 50,10 Z M50,10 Q64,0 78,6 Q66,16 50,10 Z" ${HALF} stroke-width="1.8"/>
<path d="M30,44 Q30,16 50,14 Q70,16 70,44 Q70,72 50,74 Q30,72 30,44 Z" ${HALF} stroke-width="2.4"/><path d="M38,44 Q38,26 50,24 Q62,26 62,44 Q62,64 50,66 Q38,64 38,44 Z" ${SOLID}/>
<path d="M44,30 Q48,38 44,46 Q48,54 44,60 M52,28 Q56,36 52,46 Q56,54 52,62 M58,34 Q54,44 58,54" stroke="var(--paper)" stroke-width="1.6"/><path d="M50,14 V24" stroke-width="1.6"/>`, [16, 0, 68, 76]),
	// Honduras: Hellroter Ara vor den Stufen von Copán
	HN: () =>
		M(`<path d="M64,76 V62 H72 V52 H80 V42 H88 V32 H96 V76 Z" ${HALF} stroke-width="2"/><path d="M72,66 h4 v4 h-4 Z M86,46 h4 v4 h-4 Z" ${SOLID}/><path d="M14,52 H76" stroke-width="3.6"/>
<path d="M38,24 Q32,40 38,52 H50 Q54,40 52,24 Z" ${HALF} stroke-width="2"/><path d="M39,30 Q35,42 41,54 L45,54 Q47,42 45,30 Z" ${SOLID}/><path d="M38,40 l5,2 M38,46 l5,2" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M41,52 L36,78 H44 L48,52 Z" ${SOLID}/><circle cx="46" cy="18" r="8" ${SOLID}/><ellipse cx="49" cy="18" rx="3.2" ry="4" ${PAPER}/><circle cx="49.5" cy="17.5" r="1.2" ${SOLID}/>
<path d="M53,13 Q63,15 59,25 Q55,23 53,21 Z" ${SOLID}/><path d="M42,52 l-2,3 M48,52 l2,3" stroke-width="1.8"/>`),
	// Haiti: Zitadelle Laferrière auf dem Berg
	HT: () =>
		M(`<path d="M2,76 L24,40 L38,30 L54,26 L70,32 L98,60 V76 Z" ${HALF} stroke-width="2"/><path d="M28,34 L36,22 H74 L80,30 L62,40 H34 Z" ${SOLID}/><path d="M36,22 V16 H48 V22 M60,22 V14 H72 V22" ${SOLID}/>
<path d="M40,28 h3 M48,28 h3 M56,28 h3 M64,28 h3 M72,26 h3" stroke="var(--paper)" stroke-width="1.6"/><path d="M8,76 Q10,64 14,58 M14,58 q-6,-2 -9,2 M14,58 q0,-6 6,-7 M14,58 q6,0 8,4" stroke-width="1.6"/>${GROUND}`),
	// St. Kitts und Nevis: Zuckerrohrbahn vor dem Mount Liamuiga
	KN: () => {
		let c = '';
		for (let i = 0; i < 3; i++) c += `<path d="M${36 + i * 20},50 h16 v10 h-16 Z" ${HALF} stroke-width="1.6"/><path d="M${36 + i * 20},50 V44 M${52 + i * 20},50 V44 M${36 + i * 20},46 H${52 + i * 20}" stroke-width="1.2"/><circle cx="${40 + i * 20}" cy="62" r="2" ${SOLID}/><circle cx="${48 + i * 20}" cy="62" r="2" ${SOLID}/>`;
		return M(`<path d="M2,48 L30,14 Q36,10 42,14 L76,48" ${HALF} stroke-width="2"/><path d="M34,12 q-2,-6 4,-8" stroke-width="1.4"/>
<path d="M6,60 V40 H18 V32 H24 V44 H32 V60 Z" ${SOLID}/><path d="M9,44 h5 v4 h-5 Z" ${PAPER}/><circle cx="12" cy="62" r="2.4" ${SOLID}/><circle cx="26" cy="62" r="2.4" ${SOLID}/>${c}
<path d="M2,65 H98" stroke-width="2"/><path d="M84,76 V56 M88,76 V52 M92,76 V58 M84,58 l-4,-3 M88,54 l4,-3 M92,60 l4,-3" stroke-width="1.6"/>${GROUND}`);
	},
	// Kaimaninseln: Stachelrochen in Stingray City
	KY: () =>
		M(`<path d="M50,16 Q76,18 92,40 Q72,44 58,58 Q54,62 50,62 Q46,62 42,58 Q28,44 8,40 Q24,18 50,16 Z" ${SOLID}/><path d="M50,62 Q52,72 66,78" stroke-width="2"/>
<circle cx="44" cy="28" r="1.6" ${PAPER}/><circle cx="56" cy="28" r="1.6" ${PAPER}/><path d="M30,32 Q50,24 70,32 M50,22 V54" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M2,10 q6,-4 12,0 M80,8 q6,-4 12,0" stroke-width="1.4"/><circle cx="20" cy="62" r="1.8" stroke-width="1.2"/><circle cx="16" cy="56" r="1.2" stroke-width="1.2"/><path d="M2,76 Q20,70 36,76 M70,76 Q84,70 98,76" stroke-width="2"/>`),
	// St. Martin: Fort Louis über der Bucht von Marigot
	MF: () =>
		M(`<path d="M2,58 Q16,36 36,32 Q56,30 70,44 L78,58 Z" ${HALF} stroke-width="2"/><path d="M24,34 V24 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 V36" stroke-width="2"/><path d="M38,24 V12" stroke-width="1.4"/><path d="M38,12 h8 l-2,2.5 l2,2.5 h-8 Z" ${SOLID}/>
<path d="M46,30 L58,26" stroke-width="3"/><circle cx="46" cy="30" r="2.6" ${SOLID}/><path d="M2,60 H98" stroke-width="1.6"/>
<path d="M64,66 H90 L86,71 H68 Z" ${SOLID}/><path d="M77,66 V46" stroke-width="1.6"/><path d="M79,48 L88,64 H79 Z" ${HALF} stroke-width="1.4"/><path d="M75,50 L68,64 H75 Z" ${HALF} stroke-width="1.4"/><path d="${waves(4, 76, 3, 16, 2)}" stroke-width="1.6"/>`),
	// Montserrat: Soufrière Hills und die verschüttete Stadt Plymouth
	MS: () =>
		M(`<path d="M2,62 L34,22 Q40,16 46,22 L80,62" ${HALF} stroke-width="2.2"/><path d="M40,18 Q30,10 36,4 Q44,0 48,6 Q56,2 60,8 Q66,12 58,16" stroke-width="1.8"/>
<path d="M60,62 V40 H68 V62" ${SOLID}/><path d="M58,40 L64,34 L70,40 Z" ${SOLID}/><circle cx="64" cy="46" r="2.4" ${PAPER}/><path d="M76,62 V50 l5,-4 l5,4 V62" ${SOLID}/>
<path d="M2,62 Q30,56 50,60 Q76,52 98,58 V66 H2 Z" ${HALF} stroke-width="1.8"/><path d="${waves(4, 74, 6, 15, 2.4)}" stroke-width="1.8"/>`),
	// Nicaragua: Doppelvulkan Ometepe im Nicaraguasee
	NI: () =>
		M(`${sun(86, 12, 6)}<path d="M2,62 L28,20 Q32,16 36,20 L52,44 L62,32 Q66,28 70,32 L98,62 Z" ${HALF} stroke-width="2.2"/><path d="M28,20 L34,30 L30,32 L24,28 Z" ${SOLID}/><path d="M32,16 q-2,-6 4,-9" stroke-width="1.4"/>
<path d="M14,62 Q12,52 16,46 M16,46 q-6,-2 -9,2 M16,46 q0,-6 6,-6 M16,46 q6,0 7,4" stroke-width="1.6"/><path d="M2,62 H98" stroke-width="2"/><path d="${waves(4, 70, 6, 15, 2.4)}" stroke-width="1.8"/><path d="${waves(12, 77, 5, 15, 2)}" stroke-width="1.4"/>`),
	// St. Pierre und Miquelon: bunte Holzhäuser und Leuchtturm
	PM: () => {
		let h = '';
		for (const [x, d] of [[4, 0], [20, 1], [36, 0], [52, 1]]) h += `<path d="M${x},64 V44 L${x + 7},36 L${x + 14},44 V64 Z" ${d ? SOLID : HALF} stroke-width="1.8"/><path d="M${x + 3},48 h3 v4 h-3 Z M${x + 8},48 h3 v4 h-3 Z M${x + 5},56 h4 v8 h-4 Z" ${d ? PAPER : SOLID}/>`;
		return M(`${h}<path d="M76,64 L78,22 H86 L88,64 Z" ${PAPER}/><path d="M76,64 L78,22 H86 L88,64 Z" stroke-width="2"/><path d="M77,36 H87 M76.5,50 H87.5" stroke-width="5"/><path d="M76,22 H88 V16 H76 Z" ${SOLID}/><path d="M78,16 L82,10 L86,16" ${SOLID}/>
<path d="M90,14 L98,10 M90,18 L98,22" stroke-width="1.4"/><path d="M2,64 H98" stroke-width="2.4"/><path d="${waves(4, 72, 6, 15, 2.4)}" stroke-width="1.8"/>`);
	},
	// El Salvador: Surfer vor dem Vulkan Izalco
	SV: () =>
		M(`<path d="M2,52 L24,18 Q28,14 32,18 L54,52" ${HALF} stroke-width="2"/><path d="M28,14 q-4,-6 2,-10 q6,-2 6,4" stroke-width="1.4"/>
<path d="M2,56 Q40,50 64,56 Q80,40 98,42 V76 H2 Z" ${HALF} stroke-width="2.2"/><path d="M98,42 Q78,40 70,56 Q84,48 92,54" stroke-width="2"/>
<path d="M58,58 L84,52" stroke-width="3.4"/><path d="M68,54 L70,44 L76,40 M70,44 L64,38 M76,40 L82,42 M70,44 L74,54" stroke-width="2.4"/><circle cx="76" cy="35" r="2.6" ${SOLID}/>
<path d="${waves(6, 70, 5, 16, 2.4)}" stroke-width="1.8"/>`),
	// Sint Maarten: Flugzeug im Tiefflug über Maho Beach
	SX: () =>
		M(`<path d="M10,24 Q8,18 14,18 H72 Q86,18 92,24 Q86,30 72,30 H14 Q8,30 10,24 Z" ${SOLID}/><path d="M40,24 L28,6 H36 L56,24 Z M40,26 L32,40 H40 L54,26 Z M14,20 L8,8 H14 L22,20 Z" ${SOLID}/>
<path d="M22,22 H80" stroke="var(--paper)" stroke-width="1.6" stroke-dasharray="2 2.4"/><path d="M84,22 l4,0" stroke="var(--paper)" stroke-width="2"/>
<path d="M2,62 Q40,56 98,62 V68 H2 Z" ${HALF} stroke-width="2"/><path d="M28,62 v-6 M28,56 l-3,4 M28,56 l3,4 M60,62 v-6 M60,56 l-3,4 M60,56 l3,4 M66,62 v-5" stroke-width="1.6"/><circle cx="28" cy="53" r="1.8" ${SOLID}/><circle cx="60" cy="53" r="1.8" ${SOLID}/>
<path d="${waves(4, 74, 6, 15, 2.4)}" stroke-width="1.8"/>`),
	// Turks- und Caicosinseln: Fechterschnecke (Queen Conch)
	TC: () =>
		M(`<path d="M20,56 Q14,40 26,26 Q40,10 62,14 L74,6 L72,18 L86,16 L80,28 L94,32 L82,40 Q84,56 70,64 Q50,74 30,66 Z" ${HALF} stroke-width="2.4"/>
<path d="M30,60 Q24,46 34,36 Q44,26 58,30 Q70,36 66,48 Q60,58 46,60 Q34,62 30,60 Z" ${SOLID}/><path d="M38,50 Q36,42 44,38 Q52,36 56,42" stroke="var(--paper)" stroke-width="1.6"/>
<path d="M26,26 L18,14 M40,16 L36,4 M62,14 L60,4" stroke-width="2"/><path d="${waves(4, 76, 6, 15, 2.4)}" stroke-width="1.8"/>`),
	// St. Vincent und die Grenadinen: Brotfrucht aus dem Botanischen Garten
	VC: () => {
		let d = '';
		for (let y = 30; y < 70; y += 7) for (let x = 34 + ((y / 7) % 2) * 3.5; x < 68; x += 7) if ((x - 50) ** 2 / 300 + (y - 50) ** 2 / 400 < 1) d += `<path d="M${f1(x - 2.5)},${y} l2.5,-2.5 l2.5,2.5 l-2.5,2.5 Z" stroke-width="1.1"/>`;
		return M(`<path d="M50,4 V18" stroke-width="2.6"/><path d="M50,12 Q30,0 12,10 L18,14 L10,20 Q32,22 50,12 Z M50,12 Q70,0 88,10 L82,14 L90,20 Q68,22 50,12 Z" ${HALF} stroke-width="1.8"/>
<ellipse cx="50" cy="48" rx="20" ry="25" ${HALF} stroke-width="2.4"/>${d}`, [8, 0, 84, 76]);
	},
	// Britische Jungferninseln: Granitfelsen der Baths auf Virgin Gorda
	VG: () =>
		M(`<path d="M6,64 Q4,40 20,34 Q36,30 40,48 Q42,64 34,66 Z" ${HALF} stroke-width="2.2"/><path d="M34,66 Q30,30 56,22 Q78,20 80,44 Q82,64 70,66 Z" ${SOLID}/><path d="M70,66 Q72,48 86,48 Q98,50 96,66 Z" ${HALF} stroke-width="2.2"/>
<path d="M46,36 Q52,30 60,30" stroke="var(--paper)" stroke-width="1.6"/><path d="M12,30 Q10,18 14,12 M14,12 q-6,-2 -9,2 M14,12 q0,-6 6,-7 M14,12 q6,0 8,4" stroke-width="1.6"/>
<path d="M2,66 H98" stroke-width="2"/><path d="${waves(4, 72, 6, 15, 2.4)}" stroke-width="1.8"/><path d="${waves(12, 78, 5, 15, 2)}" stroke-width="1.4"/>`),
	// Amerikanische Jungferninseln: Windmühlenruine der Annaberg-Plantage
	VI: () =>
		M(`<path d="M2,76 V64 Q30,56 60,60 Q80,54 98,62 V76 Z" ${HALF} stroke-width="1.8"/><path d="M30,64 L34,22 H54 L58,64 Z" ${HALF} stroke-width="2.4"/><path d="M33,22 H55 M36,34 H52" stroke-width="1.4"/>
<path d="M40,64 V54 Q44,48 48,54 V64 Z M42,32 h4 v6 h-4 Z" ${SOLID}/><path d="M34,30 l-3,0 M58,44 l3,0" stroke-width="1.4"/><path d="M38,40 l3,1 M48,46 l3,-1 M44,58 l-3,1" stroke-width="1"/>
<path d="M76,58 Q74,44 78,36 M78,36 q-6,-2 -9,2 M78,36 q0,-6 6,-7 M78,36 q6,0 8,4" stroke-width="1.6"/>${sun(14, 16, 6)}<path d="${waves(64, 76, 2, 14, 2)}" stroke-width="1.4"/>`),
	// Guadeloupe: Pointe des Châteaux mit dem Kreuz
	GP: () =>
		M(`<path d="M2,62 Q20,58 34,54 L44,30 L52,26 L58,40 L64,58 Q80,60 98,62 V66 H2 Z" ${HALF} stroke-width="2.2"/><path d="M48,26 V12 M44,16 H52" stroke-width="2"/>
<path d="M70,62 L74,46 L80,42 L84,52 L86,62 Z" ${SOLID}/><path d="M88,62 L90,54 L94,52 L96,62 Z" ${SOLID}/><path d="M46,34 L42,50 M54,38 L56,52" stroke-width="1.2"/>
<path d="${waves(4, 70, 6, 15, 2.4)}" stroke-width="1.8"/><path d="${waves(12, 77, 5, 15, 2)}" stroke-width="1.4"/>`),
	// Martinique: Rocher du Diamant vor der Küste, dahinter die Montagne Pelée
	MQ: () =>
		M(`<path d="M2,52 L22,24 Q28,18 34,24 L56,52" ${HALF} stroke-width="1.8"/><path d="M50,62 Q54,32 66,18 Q74,14 80,22 Q90,40 92,62 Z" ${SOLID}/><path d="M68,24 Q64,40 64,58 M78,28 Q82,44 84,58" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M2,56 Q16,52 30,56 L36,62" stroke-width="1.6"/><path d="M8,56 Q6,46 10,40 M10,40 q-5,-2 -8,2 M10,40 q1,-6 6,-6" stroke-width="1.4"/>${sun(84, 10, 5)}
<path d="M2,62 H98" stroke-width="2"/><path d="${waves(4, 70, 6, 15, 2.4)}" stroke-width="1.8"/><path d="${waves(12, 77, 5, 15, 2)}" stroke-width="1.4"/>`),
	// Bonaire: Salzberge an den rosa Salinen
	BQ: () =>
		M(`${sun(12, 12, 6)}<path d="M4,56 L16,34 L28,56 Z M24,56 L40,26 L56,56 Z M50,56 L62,38 L74,56 Z" ${PAPER}/><path d="M4,56 L16,34 L28,56 M24,56 L40,26 L56,56 M50,56 L62,38 L74,56" stroke-width="2.2"/>
<path d="M32,40 L36,34 M58,46 L62,42" stroke-width="1.2"/><path d="M80,56 V28 L84,24 L88,28 V56" ${SOLID}/><path d="M2,58 H98 V68 H2 Z" ${HALF} stroke-width="1.8"/>
<path d="M30,66 V58 M34,66 L32,58" stroke-width="1"/><path d="M26,56 Q30,52 36,54 Q34,58 28,58 Z" ${SOLID}/><path d="M28,56 Q22,50 26,46 Q30,44 30,48" stroke-width="1.4"/><path d="${waves(4, 76, 6, 15, 2)}" stroke-width="1.6"/>`),
	// Amerikanisch-Samoa: Felsinsel Pola vor Vatia
	AS: () =>
		M(`<path d="M2,64 V36 Q8,24 18,30 Q24,40 26,64 Z" ${HALF} stroke-width="2"/><path d="M40,64 Q38,30 50,14 Q58,8 64,16 Q74,32 72,64 Z" ${SOLID}/><path d="M50,20 Q46,40 48,62 M60,20 Q64,40 62,62" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M80,64 Q82,48 90,46 Q98,48 98,64" ${HALF} stroke-width="2"/><path d="M52,12 q2,-6 8,-6 M48,16 q-6,-4 -10,0" stroke-width="1.6"/><path d="M2,64 H98" stroke-width="2"/><path d="${waves(4, 71, 6, 15, 2.4)}" stroke-width="1.8"/>`),
	// Cookinseln: geschnitzter Gott Tangaroa
	CK: () =>
		M(`<path d="M34,10 Q34,2 50,2 Q66,2 66,10 V34 Q66,40 58,40 H42 Q34,40 34,34 Z" ${SOLID}/><ellipse cx="43" cy="18" rx="5" ry="4" ${PAPER}/><ellipse cx="57" cy="18" rx="5" ry="4" ${PAPER}/><circle cx="43" cy="18" r="1.8" ${SOLID}/><circle cx="57" cy="18" r="1.8" ${SOLID}/>
<path d="M44,30 Q50,34 56,30" stroke="var(--paper)" stroke-width="2"/><path d="M50,22 V27" stroke="var(--paper)" stroke-width="1.6"/><path d="M38,40 Q30,52 36,62 H64 Q70,52 62,40 Z" ${SOLID}/>
<path d="M38,46 Q30,52 40,56 M62,46 Q70,52 60,56" stroke="var(--paper)" stroke-width="1.6"/><path d="M38,62 V74 H46 V64 M62,62 V74 H54 V64" ${SOLID}/><path d="M50,48 v8" stroke="var(--paper)" stroke-width="1.4"/>${GROUND}`, [16, 0, 68, 78]),
	// Mikronesien: Steingeld (Rai) auf Yap
	FM: () =>
		M(`<path d="M10,40 Q8,10 34,8 Q60,10 58,40 Q60,70 34,72 Q8,70 10,40 Z" ${HALF} stroke-width="2.6"/><circle cx="34" cy="40" r="9" fill="var(--paper)" stroke-width="2.4"/><path d="M18,26 Q22,18 30,16 M50,56 Q46,62 40,64" stroke-width="1.4"/>
<path d="M60,58 Q60,40 72,40 Q84,40 84,58 Q84,72 72,72 Q60,72 60,58 Z" ${SOLID}/><circle cx="72" cy="56" r="4" ${PAPER}/>
<path d="M88,72 Q86,52 90,40 M90,40 q-6,-2 -9,2 M90,40 q0,-6 6,-7 M90,40 q6,0 8,4" stroke-width="1.6"/>${GROUND}`),
	// Guam: Latte-Steine
	GU: () => {
		const l = (x: number, h: number) => `<path d="M${x - 4},76 V${76 - h} H${x + 4} V76 Z" ${HALF} stroke-width="2"/><path d="M${x - 9},${76 - h} Q${x - 9},${70 - h - 8} ${x},${70 - h - 8} Q${x + 9},${70 - h - 8} ${x + 9},${76 - h} Z" ${SOLID}/>`;
		return M(`${sun(84, 14, 6)}<path d="M2,44 Q30,36 60,42" stroke-width="1.4"/>${l(18, 32)}${l(42, 38)}${l(66, 32)}${l(88, 26)}${GROUND}`);
	},
	// Kiribati: Fregattvogel über der Sonne im Meer
	KI: () => {
		let r = '';
		for (let i = 0; i < 9; i++) {
			const a = Math.PI + (i * Math.PI) / 8;
			r += `M${f1(50 + 20 * Math.cos(a))},${f1(60 + 20 * Math.sin(a))} L${f1(50 + 28 * Math.cos(a))},${f1(60 + 28 * Math.sin(a))} `;
		}
		return M(`<path d="M34,60 A16,16 0 0 1 66,60 Z" ${HALF} stroke-width="2"/><path d="${r}" stroke-width="2"/>
<path d="M50,26 Q36,14 8,18 Q30,22 44,32 Q48,34 50,34 Q52,34 56,32 Q70,22 92,18 Q64,14 50,26 Z" ${SOLID}/><path d="M50,30 L56,24 L52,30 Z M48,32 L44,40 L50,34 Z" ${SOLID}/>
<path d="M2,62 H98" stroke-width="2"/><path d="${waves(4, 69, 6, 15, 2.4)}" stroke-width="1.8"/><path d="${waves(12, 76, 5, 15, 2)}" stroke-width="1.4"/>`);
	},
	// Marshallinseln: Stabkarte der Seefahrer
	MH: () =>
		M(`<path d="M10,10 H90 V70 H10 Z" stroke-width="2.6"/><path d="M10,10 L90,70 M90,10 L10,70 M50,10 V70 M10,40 H90" stroke-width="2"/><path d="M10,40 Q30,20 50,10 M50,70 Q70,60 90,40 M10,40 Q30,60 50,70 M50,10 Q70,20 90,40" stroke-width="1.6"/>
${[[30, 25], [70, 25], [30, 55], [70, 55], [50, 40], [20, 18], [80, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" ${SOLID}/><circle cx="${x - 1}" cy="${y - 1}" r="1" ${PAPER}/>`).join('')}`),
	// Nördliche Marianen: Palmendieb (Kokosnusskrabbe)
	MP: () =>
		M(`<path d="M74,76 Q78,48 70,20" stroke-width="5"/><path d="M70,20 Q56,10 46,16 M70,20 Q66,6 54,4 M70,20 Q80,6 92,8 M70,20 Q86,18 92,28" stroke-width="2.6"/><circle cx="66" cy="24" r="4" ${SOLID}/><circle cx="74" cy="24" r="4" ${SOLID}/>
<path d="M22,60 Q20,46 34,44 Q48,44 50,56 Q50,64 36,64 Q22,64 22,60 Z" ${SOLID}/><path d="M28,48 Q36,46 44,50" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M48,52 Q58,46 60,38 L66,36 L62,44 Q60,52 50,58" ${SOLID}/><path d="M24,56 Q14,50 10,40 L6,38 L10,46 Q14,56 24,60" ${SOLID}/>
<path d="M26,62 L18,74 M32,64 L28,76 M42,64 L46,76 M48,62 L56,74" stroke-width="2.4"/><path d="M34,44 L30,34 M40,44 L42,34" stroke-width="1.4"/><circle cx="30" cy="34" r="1.6" ${SOLID}/><circle cx="42" cy="34" r="1.6" ${SOLID}/>${GROUND}`),
	// Neukaledonien: Kanak-Hütte mit Firstspitze
	NC: () =>
		M(`<path d="M20,76 V50 Q20,44 26,44 H74 Q80,44 80,50 V76 Z" ${HALF} stroke-width="2"/><path d="M16,48 Q30,16 50,14 Q70,16 84,48 Z" ${SOLID}/><path d="M24,40 Q36,22 50,20 M76,40 Q64,22 50,20 M50,20 V46" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M50,14 V2 M44,6 H56 M46,10 H54" stroke-width="2.2"/><path d="M44,76 V60 Q50,54 56,60 V76 Z" ${SOLID}/><path d="M30,54 V72 M70,54 V72" stroke-width="3"/>
<path d="M90,76 V42 M90,46 l-6,-4 M90,52 l6,-4 M90,58 l-6,-4 M90,64 l6,-4" stroke-width="1.6"/><path d="M8,76 V48 M8,52 l-5,-3 M8,58 l5,-3 M8,64 l-5,-3" stroke-width="1.6"/>${GROUND}`),
	// Norfolkinsel: Norfolk-Tanne
	NF: () => {
		let b = '';
		for (let i = 0; i < 9; i++) {
			const y = 14 + i * 6.4,
				w = 6 + i * 3.2;
			b += `M${50 - w},${f1(y + 3)} Q${50 - w / 2},${f1(y - 1)} 50,${f1(y)} Q${50 + w / 2},${f1(y - 1)} ${50 + w},${f1(y + 3)} `;
		}
		return M(`<path d="M50,76 V6" stroke-width="3"/><path d="${b}" stroke-width="2.6"/><path d="M48,6 L50,2 L52,6" stroke-width="2"/>
<path d="M2,76 Q20,68 40,72 M60,72 Q80,68 98,76" stroke-width="2"/><path d="${waves(4, 64, 1, 12, 2)}" stroke-width="1.4"/><path d="${waves(80, 62, 1, 12, 2)}" stroke-width="1.4"/>${GROUND}`, [12, 0, 76, 80]);
	},
	// Nauru: Kalksteinzinnen an der Küste
	NR: () => {
		const p = (x: number, h: number, w: number) => `<path d="M${x - w},64 Q${x - w},${64 - h * 0.6} ${x - w * 0.4},${64 - h} Q${x},${64 - h - 3} ${x + w * 0.4},${64 - h} Q${x + w},${64 - h * 0.6} ${x + w},64 Z" ${HALF} stroke-width="2"/>`;
		return M(`${sun(84, 12, 6)}${p(12, 26, 7)}${p(28, 38, 8)}${p(46, 22, 6)}${p(62, 32, 7)}${p(80, 18, 6)}<path d="M28,34 V56 M62,40 V58" stroke-width="1.2"/>
<path d="M2,64 H98" stroke-width="2"/><path d="${waves(4, 71, 6, 15, 2.4)}" stroke-width="1.8"/><path d="${waves(12, 77, 5, 15, 2)}" stroke-width="1.4"/>`);
	},
	// Niue: Felsbögen von Talava
	NU: () =>
		M(`<path d="M2,20 H70 Q84,22 86,40 V66 H72 V48 Q70,36 58,36 Q46,36 44,48 V66 H30 V44 Q26,36 18,40 Q12,44 12,66 H2 Z" ${HALF} stroke-width="2.2"/><path d="M8,28 H64 M20,24 V34 M48,24 V32 M74,30 V42" stroke-width="1.2"/>
<path d="M2,18 Q12,8 24,14 Q34,6 46,12 Q58,4 70,12" stroke-width="1.8"/><path d="M2,66 H98" stroke-width="2"/><path d="${waves(4, 72, 6, 15, 2.4)}" stroke-width="1.8"/><path d="M90,62 Q92,52 96,50 Q94,58 98,62" ${SOLID}/>`),
	// Pitcairninseln: Anker der Bounty vor der Insel
	PN: () =>
		M(`<path d="M2,58 Q14,24 40,20 Q70,18 98,46 V58 Z" ${HALF} stroke-width="2"/><path d="M50,12 V66" stroke-width="4"/><circle cx="50" cy="8" r="5" stroke-width="2.6"/><path d="M38,22 H62" stroke-width="3.4"/>
<path d="M26,52 Q30,70 50,70 Q70,70 74,52" stroke-width="4"/><path d="M20,52 L26,46 L32,54 Z M80,52 L74,46 L68,54 Z" ${SOLID}/><path d="M2,60 H98" stroke-width="1.4" stroke-dasharray="3 3"/>`),
	// Palau: Quallensee zwischen den Felseninseln
	PW: () => {
		const j = (x: number, y: number, s: number) =>
			`<g transform="translate(${x},${y}) scale(${s})"><path d="M-12,0 Q-12,-14 0,-14 Q12,-14 12,0 Q6,2 0,0 Q-6,2 -12,0 Z" ${HALF} stroke-width="2"/><path d="M-8,1 q-2,6 0,10 q2,4 0,8 M-3,2 q2,6 0,10 q-2,4 0,8 M3,2 q-2,6 0,10 q2,4 0,8 M8,1 q2,6 0,10 q-2,4 0,8" stroke-width="1.4"/></g>`;
		return M(`<path d="M2,20 Q4,6 16,6 Q26,8 24,20 Q20,26 12,24 Q4,26 2,20 Z M76,16 Q78,4 88,4 Q98,6 98,16 Q92,22 86,20 Q78,22 76,16 Z" ${SOLID}/><path d="M2,22 H98" stroke-width="1.6"/>
${j(30, 44, 1.1)}${j(64, 36, 0.8)}${j(78, 60, 0.7)}${j(46, 66, 0.6)}`);
	},
	// Salomonen: Kriegskanu (Tomoko) mit hohem Bug
	SB: () =>
		M(`<path d="M6,10 Q12,40 22,54 H78 Q88,40 94,10 Q90,30 80,46 H20 Q10,30 6,10 Z" ${SOLID}/><path d="M22,54 H78 L74,60 H26 Z" ${SOLID}/><path d="M24,50 H76" stroke="var(--paper)" stroke-width="1.4" stroke-dasharray="2 2"/>
<circle cx="8" cy="12" r="2.4" ${PAPER}/><circle cx="92" cy="12" r="2.4" ${PAPER}/>${[30, 40, 50, 60, 70].map((x) => `<circle cx="${x}" cy="40" r="2.4" ${SOLID}/><path d="M${x},43 V48 M${x - 2},38 L${x + 8},56" stroke-width="1.6"/>`).join('')}
<path d="${waves(4, 70, 6, 15, 2.4)}" stroke-width="1.8"/>`),
	// Tonga: Trilithon Haʻamonga ʻa Maui
	TO: () =>
		M(`<path d="M18,76 V30 H34 V76 Z M66,76 V30 H82 V76 Z" ${HALF} stroke-width="2.4"/><path d="M14,30 V20 H86 V30 Z" ${SOLID}/><path d="M22,40 v8 M28,56 v8 M72,44 v8 M76,60 v6" stroke-width="1.2"/>
<path d="M44,76 Q42,60 46,52 M46,52 q-6,-2 -9,2 M46,52 q0,-6 6,-7 M46,52 q6,0 8,4" stroke-width="1.6"/>${sun(50, 8, 4)}${GROUND}`),
	// Tuvalu: Atoll Funafuti von oben
	TV: () => {
		let s = '';
		for (let i = 0; i < 14; i++) {
			const a = (i * Math.PI) / 7 + 0.2,
				x = 50 + 40 * Math.cos(a),
				y = 40 + 30 * Math.sin(a);
			s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${i % 3 ? 5 : 8}" ry="3" transform="rotate(${f1((a * 180) / Math.PI + 90)} ${f1(x)} ${f1(y)})" ${SOLID}/>`;
		}
		return M(`<ellipse cx="50" cy="40" rx="44" ry="34" stroke-width="1.4" stroke-dasharray="3 3"/><ellipse cx="50" cy="40" rx="36" ry="26" ${HALF} stroke-width="1.4"/>${s}
<path d="M44,40 H58 L55,44 H47 Z" ${SOLID}/><path d="M51,40 V30 L57,38" stroke-width="1.4"/>`);
	},
	// Wallis und Futuna: Kathedrale von Mata-Utu
	WF: () =>
		M(`<path d="M22,76 V30 H38 V76 Z M62,76 V30 H78 V76 Z" ${HALF} stroke-width="2.2"/><path d="M20,30 L30,16 L40,30 M60,30 L70,16 L80,30" ${SOLID}/><path d="M30,16 V8 M27,11 H33 M70,16 V8 M67,11 H73" stroke-width="1.6"/>
<path d="M38,76 V44 L50,34 L62,44 V76 Z" ${SOLID}/><circle cx="50" cy="48" r="4" ${PAPER}/><path d="M45,76 V62 Q50,56 55,62 V76 Z M27,40 h6 v8 h-6 Z M67,40 h6 v8 h-6 Z" ${PAPER}/>
<path d="M27,40 h6 v8 h-6 Z M67,40 h6 v8 h-6 Z" stroke-width="1.2"/><path d="M8,76 Q10,62 14,56 M14,56 q-6,-2 -9,2 M14,56 q0,-6 6,-7 M14,56 q6,0 8,4" stroke-width="1.6"/>${GROUND}`),
	// Samoa: To Sua Ocean Trench mit Holzleiter
	WS: () => {
		let r = '';
		for (let y = 14; y < 58; y += 6) r += `M54,${y} H62 `;
		return M(`<path d="M2,8 H98 V76 H2 Z" ${HALF} stroke-width="1.8"/><path d="M14,76 V30 Q14,16 30,14 H70 Q86,16 86,30 V76" ${PAPER}/><path d="M14,76 V30 Q14,16 30,14 H70 Q86,16 86,30 V76" stroke-width="2.2"/>
<path d="M14,58 H86 V76 H14 Z" ${SOLID}/><path d="${waves(18, 64, 4, 16, 2)}" stroke="var(--paper)" stroke-width="1.4"/><path d="M54,8 V58 M62,8 V58" stroke-width="1.8"/><path d="${r}" stroke-width="1.4"/>
<path d="M6,8 Q4,0 10,0 M90,8 Q92,0 98,2 M22,22 q4,4 2,10 M78,24 q-4,4 -2,10" stroke-width="1.6"/>`);
	},
	// Bouvetinsel: vergletscherte Vulkaninsel im Südpolarmeer
	BV: () =>
		M(`<path d="M2,62 Q10,58 18,48 L34,24 Q50,12 66,24 L82,48 Q90,58 98,62 Z" ${HALF} stroke-width="2.2"/><path d="M34,24 Q50,12 66,24 L60,30 L54,26 L48,32 L42,26 L36,32 Z" ${PAPER}/><path d="M34,24 Q50,12 66,24" stroke-width="2.2"/>
<path d="M22,46 L30,52 M74,44 L68,52 M46,36 L44,46 M56,36 L58,46" stroke-width="1.4"/><path d="M80,62 L84,54 L90,54 L94,62 Z M8,62 L10,58 H16 L18,62 Z" ${SOLID}/>
<path d="M2,62 H98" stroke-width="2"/><path d="${waves(4, 70, 6, 15, 2.4)}" stroke-width="1.8"/>${star(14, 10, 2)}${star(88, 14, 1.6)}`),
	// Kokosinseln: Palme über der Lagune mit Einsiedlerkrebs
	CC: () =>
		M(`<path d="M30,66 Q30,40 52,18" stroke-width="3.6"/><path d="M52,18 Q40,8 26,14 M52,18 Q48,2 34,2 M52,18 Q60,2 76,4 M52,18 Q70,14 78,26 M52,18 Q58,26 56,36" stroke-width="2.8"/><circle cx="50" cy="22" r="3" ${SOLID}/><circle cx="55" cy="21" r="2.6" ${SOLID}/>
<path d="M2,64 Q50,58 98,64" stroke-width="2"/><path d="M2,68 Q50,62 98,68 V76 H2 Z" ${HALF} stroke-width="1.6"/>
<path d="M68,62 Q68,52 76,52 Q84,52 84,62 Z" ${SOLID}/><path d="M72,57 Q76,54 80,57" stroke="var(--paper)" stroke-width="1.2"/><path d="M68,60 L62,56 M70,62 L64,64 M84,62 L88,66" stroke-width="1.6"/><circle cx="64" cy="54" r="1.4" ${SOLID}/>`),
	// Weihnachtsinsel: Wanderung der Roten Krabben
	CX: () => {
		const crab = (x: number, y: number, s: number) =>
			`<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="9" ry="6.4" ${SOLID}/><path d="M-6,4 L-12,10 M-3,5 L-6,12 M3,5 L6,12 M6,4 L12,10 M-7,-2 L-14,-2 M7,-2 L14,-2" stroke-width="2"/>
<path d="M-6,-5 Q-12,-12 -8,-16 Q-4,-14 -6,-10 M6,-5 Q12,-12 8,-16 Q4,-14 6,-10" stroke-width="2.6"/><circle cx="-3" cy="-6" r="1.2" ${SOLID}/><circle cx="3" cy="-6" r="1.2" ${SOLID}/></g>`;
		return M(`<path d="M2,40 Q30,34 50,40 Q76,48 98,40" stroke-width="1.4" stroke-dasharray="3 3"/>${crab(24, 30, 0.9)}${crab(56, 22, 0.7)}${crab(82, 32, 0.8)}${crab(40, 58, 1.2)}${crab(74, 62, 1)}${crab(12, 66, 0.7)}`);
	},
	// Französisch-Guayana: Raketenstart in Kourou
	GF: () =>
		M(`<path d="M50,2 Q56,10 56,22 V52 H44 V22 Q44,10 50,2 Z" ${PAPER}/><path d="M50,2 Q56,10 56,22 V52 H44 V22 Q44,10 50,2 Z" stroke-width="2.2"/><path d="M44,22 H56 M44,40 H56" stroke-width="1.4"/>
<path d="M36,30 Q32,30 32,36 V54 H40 V36 Q40,30 36,30 Z M64,30 Q68,30 68,36 V54 H60 V36 Q60,30 64,30 Z" ${SOLID}/><path d="M42,54 L40,62 L46,58 L50,66 L54,58 L60,62 L58,54 Z" ${HALF} stroke-width="1.6"/>
<path d="M2,76 Q8,62 22,66 Q30,56 42,66 Q50,60 58,66 Q70,56 78,66 Q92,62 98,76 Z" ${HALF} stroke-width="2"/><path d="M80,64 V24 M74,30 H86 M80,30 L86,36 M80,40 L74,46" stroke-width="1.6"/>`),
	// Spitzbergen: Eisbär auf der Scholle
	SJ: () =>
		M(`<path d="M8,62 L14,52 H86 L94,62 Z" ${PAPER}/><path d="M8,62 L14,52 H86 L94,62" stroke-width="2.2"/>
<path d="M22,46 Q22,32 38,30 Q54,28 68,30 Q80,32 84,40 Q86,44 82,46 L80,52 H74 L72,46 Q60,48 50,46 L46,52 H40 L38,46 Q30,46 28,52 H22 Z" ${HALF} stroke-width="2.2"/>
<path d="M80,36 Q88,34 92,40 Q94,44 88,44 L82,44" ${HALF} stroke-width="2.2"/><circle cx="86" cy="38" r="1.1" ${SOLID}/><circle cx="92.5" cy="41" r="1.2" ${SOLID}/><path d="M80,34 l2,-3" stroke-width="1.8"/>
<path d="M2,62 H98" stroke-width="1.6"/><path d="${waves(4, 70, 6, 15, 2.4)}" stroke-width="1.8"/><path d="M10,14 L22,4 L34,14 Z M70,16 L80,8 L92,18 Z" ${HALF} stroke-width="1.6"/>`),
	// Tokelau: Auslegerkanu im Sonnenuntergang
	TK: () => {
		let r = '';
		for (let i = 0; i < 7; i++) {
			const a = Math.PI + ((i + 0.5) * Math.PI) / 7;
			r += `M${f1(50 + 18 * Math.cos(a))},${f1(48 + 18 * Math.sin(a))} L${f1(50 + 26 * Math.cos(a))},${f1(48 + 26 * Math.sin(a))} `;
		}
		return M(`<path d="M36,48 A14,14 0 0 1 64,48 Z" ${HALF} stroke-width="2"/><path d="${r}" stroke-width="2"/><path d="M2,48 H98" stroke-width="2"/>
<path d="M22,54 H74 L68,60 H28 Z" ${SOLID}/><path d="M34,56 V64 M60,56 V64 M30,66 H66" stroke-width="2"/><path d="M48,54 V30 L62,52 Z" ${SOLID}/><circle cx="40" cy="48" r="2.4" ${SOLID}/><path d="M40,51 V54 M42,50 L52,62" stroke-width="1.6"/>
<path d="${waves(4, 72, 6, 15, 2.4)}" stroke-width="1.8"/>`);
	},
	// Amerikanische Überseeinseln: Laysan-Albatros auf Midway
	UM: () =>
		M(`<path d="M2,62 Q30,56 60,60 Q80,56 98,62" stroke-width="2"/><path d="M2,76 Q50,66 98,76" ${HALF} stroke-width="1.6"/>
<path d="M30,54 Q24,42 34,36 Q46,30 60,34 Q72,38 74,48 Q72,56 60,58 H38 Q32,58 30,54 Z" ${PAPER}/><path d="M30,54 Q24,42 34,36 Q46,30 60,34 Q72,38 74,48 Q72,56 60,58 H38 Q32,58 30,54 Z" stroke-width="2.2"/>
<path d="M38,40 Q56,34 72,46 Q80,50 92,48 Q80,56 66,54 Q50,52 38,40 Z" ${SOLID}/><circle cx="30" cy="34" r="7" ${PAPER}/><circle cx="30" cy="34" r="7" stroke-width="2.2"/><circle cx="28" cy="32" r="1.4" ${SOLID}/>
<path d="M24,34 L12,38 L24,38 Z" ${SOLID}/><path d="M46,58 V62 M54,58 V62" stroke-width="2"/>`),
	// Mayotte: Maki in der Lagune
	YT: () =>
		M(`<path d="M2,26 Q50,18 98,30" stroke-width="3.4"/><path d="M80,28 Q90,16 98,18 Q94,26 80,28 Z M16,24 Q8,12 2,14 Q4,22 16,24 Z" ${HALF} stroke-width="1.6"/>
<path d="M40,28 Q34,40 38,52 Q42,58 52,58 Q60,56 62,46 Q62,34 56,28" ${SOLID}/><circle cx="46" cy="22" r="8" ${SOLID}/><path d="M40,16 L38,10 L44,14 Z M52,16 L54,10 L48,14 Z" ${SOLID}/>
<circle cx="43" cy="21" r="2" ${PAPER}/><circle cx="49" cy="21" r="2" ${PAPER}/><circle cx="43" cy="21" r=".9" ${SOLID}/><circle cx="49" cy="21" r=".9" ${SOLID}/><path d="M44,26 Q46,28 48,26" stroke="var(--paper)" stroke-width="1"/>
<path d="M40,26 L36,30 M56,30 L60,26" stroke-width="3"/><path d="M58,54 Q72,60 74,72 Q76,78 70,76" stroke-width="4"/><path d="M2,72 Q30,66 50,70" stroke-width="1.6"/><path d="${waves(4, 77, 3, 15, 2)}" stroke-width="1.4"/>`),
	// Heard und McDonaldinseln: Vulkan Mawson Peak über den Gletschern
	HM: () =>
		M(`<path d="M2,62 L36,20 Q42,14 48,14 Q54,14 60,20 L98,62 Z" ${HALF} stroke-width="2.2"/><path d="M36,20 Q42,14 48,14 Q54,14 60,20 L54,28 L48,22 L42,30 Z" ${PAPER}/><path d="M36,20 Q42,14 60,20" stroke-width="2.2"/>
<path d="M46,10 q-4,-4 0,-8 M52,10 q4,-4 0,-8" stroke-width="1.6"/><path d="M14,62 L28,44 L34,62 M66,62 L74,40 L86,62" ${PAPER}/><path d="M14,62 L28,44 L34,62 M66,62 L74,40 L86,62" stroke-width="1.6"/>
<path d="M2,62 H98" stroke-width="2"/><path d="${waves(4, 70, 6, 15, 2.4)}" stroke-width="1.8"/>`),
	// Französische Süd- und Antarktisgebiete: See-Elefant auf Kerguelen
	TF: () =>
		M(`<path d="M2,38 L18,20 L30,30 L44,14 L60,34" stroke-width="1.8"/><path d="M38,20 L44,14 L50,20 Z" ${SOLID}/>
<path d="M10,70 Q8,56 22,50 Q40,44 60,48 Q80,52 90,62 L98,56 L95,67 L98,74 Q60,74 20,74 Q10,74 10,70 Z" ${SOLID}/><path d="M22,54 Q12,46 16,36 Q22,28 32,32 Q38,40 36,52 Z" ${SOLID}/>
<path d="M18,36 Q8,38 9,48 Q13,51 17,46 Z" ${SOLID}/><circle cx="25" cy="37" r="1.4" ${PAPER}/><path d="M40,56 Q56,58 74,60" stroke="var(--paper)" stroke-width="1.4"/><path d="M38,66 L30,75" stroke-width="3.4"/>${GROUND}`),
	ZM: () => MOTIFS.ZW()
};

/* Kontinent-Symbole für Länder ohne eigenes Motiv */
const CONT_MOTIFS: Record<string, () => Motif> = {
	// Europa: Sternenkranz
	EU: () => {
		let s = '';
		for (let i = 0; i < 12; i++) {
			const a = (i * Math.PI) / 6;
			s += star(f1(50 + 30 * Math.cos(a)), f1(40 + 30 * Math.sin(a)), 6);
		}
		return M(s, [10, 0, 80, 80]);
	},
	// Asien: Lotusblüte
	AS: () =>
		M(`<path d="M50,14 Q62,36 50,60 Q38,36 50,14 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<path d="M50,60 Q28,52 24,30 Q44,36 50,60 Q72,52 76,30 Q56,36 50,60" fill="currentColor" fill-opacity=".3" stroke-width="2.8"/>
<path d="M50,62 Q20,64 8,46 Q32,44 50,62 Q80,64 92,46 Q68,44 50,62" fill="currentColor" fill-opacity=".3" stroke-width="2.8"/><path d="${waves(14, 74, 5, 14, 4)}" stroke-width="2.4"/>`),
	// Afrika: Schirmakazie
	AF: () =>
		M(`<circle cx="80" cy="16" r="8" stroke-width="3"/><path d="M18,38 Q50,20 82,38 Q50,46 18,38 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<path d="M50,76 V54 M50,58 L38,42 M50,56 L62,42" stroke-width="3.4"/>${GROUND}`),
	// Nordamerika: Tannen
	NA: () => {
		const tree = (x: number, top: number, w: number) => {
			const h = 76 - top;
			return `<path d="M${x},${top} L${x + w / 2},${top + h * 0.45} H${x + w / 4} L${x + w / 2 + 4},${top + h * 0.85} H${x - w / 2 - 4} L${x - w / 4},${top + h * 0.45} H${x - w / 2} Z" fill="currentColor" fill-opacity=".3" stroke-width="2.8"/><path d="M${x},${top + h * 0.85} V76" stroke-width="3"/>`;
		};
		return M(tree(32, 8, 30) + tree(64, 26, 22) + tree(84, 40, 16) + GROUND);
	},
	// Südamerika: Sonne der Inka
	SA: () => {
		let rays = '';
		for (let i = 0; i < 16; i++) {
			const a = (i * Math.PI) / 8,
				r1 = 21,
				r2 = i % 2 ? 29 : 35;
			rays += `M${f1(50 + r1 * Math.cos(a))},${f1(40 + r1 * Math.sin(a))} L${f1(50 + r2 * Math.cos(a))},${f1(40 + r2 * Math.sin(a))} `;
		}
		return M(`<circle cx="50" cy="40" r="16" fill="currentColor" fill-opacity=".3" stroke-width="3"/><path d="${rays}" stroke-width="3"/>
<circle cx="44" cy="37" r="2" fill="currentColor" stroke="none"/><circle cx="56" cy="37" r="2" fill="currentColor" stroke="none"/><path d="M44,46 Q50,50 56,46" stroke-width="2"/>`, [10, 0, 80, 80]);
	},
	// Ozeanien: Welle
	OC: () =>
		M(`<path d="M4,70 Q28,70 38,46 Q48,22 70,22 Q90,24 88,40 Q86,50 76,46 Q70,38 78,34" fill="currentColor" fill-opacity=".2" stroke-width="3.4"/>
<path d="M50,30 Q58,28 64,34 M44,44 Q50,40 56,44" stroke-width="2"/><path d="${waves(4, 76, 6, 15, 4)}" stroke-width="2.4"/>`),
	// Antarktis und Sonstiges: Kompass
	AN: () =>
		M(`<circle cx="50" cy="40" r="30" stroke-width="3"/><path d="M50,14 L57,40 L50,66 L43,40 Z" fill="currentColor" fill-opacity=".3" stroke-width="2.4"/><path d="M50,14 L57,40 H43 Z" fill="currentColor" stroke="none"/>`, [10, 0, 80, 80])
};

/* ---------- Rahmen ---------- */
type Frame = 'tag' | 'oct' | 'oval' | 'rrect' | 'circle' | 'scallop' | 'zig' | 'tri' | 'hex' | 'notch' | 'shield' | 'diamond' | 'perf' | 'banner' | 'arch';
type Txt = { name: string; date: string; nr: string };

function place(m: Motif, [rx, ry, rw, rh]: number[]) {
	const [bx, by, bw, bh] = m.box,
		s = Math.min(rw / bw, rh / bh);
	return `<g transform="translate(${f1(rx + (rw - bw * s) / 2 - bx * s)},${f1(ry + (rh - bh * s) / 2 - by * s)}) scale(${+s.toFixed(3)})">${m.svg}</g>`;
}
/** Briefmarken-Rand: Rechteck mit halbrunden Zähnen */
function perfPath(x: number, y: number, w: number, h: number, r: number, s: number) {
	let d = `M${x},${y}`;
	const edge = (x0: number, y0: number, dx: number, dy: number, len: number) => {
		const n = Math.round(len / s),
			st = len / n;
		for (let i = 0; i < n; i++) {
			const c = st * (i + 0.5);
			d += ` L${f1(x0 + dx * (c - r))},${f1(y0 + dy * (c - r))} A${r},${r} 0 0 0 ${f1(x0 + dx * (c + r))},${f1(y0 + dy * (c + r))}`;
		}
		d += ` L${x0 + dx * len},${y0 + dy * len}`;
	};
	edge(x, y, 1, 0, w);
	edge(x + w, y, 0, 1, h);
	edge(x + w, y + h, -1, 0, w);
	edge(x, y + h, 0, -1, h);
	return d + 'Z';
}
const below = (t: Txt) => (t.date ? `${t.date} · ${t.nr}` : t.nr);

let uid = 0;
function arcs(top: string, bot: string, ft = 15) {
	const k = 'pa' + ++uid;
	return `<path id="t${k}" d="M44,100 A56,56 0 0 1 156,100" stroke="none"/><path id="b${k}" d="M36,100 A64,64 0 0 0 164,100" stroke="none"/>
<text class="d" font-size="${fit(top, 168, ft)}" letter-spacing="1"><textPath href="#t${k}" startOffset="50%" text-anchor="middle">${esc(top)}</textPath></text>
<text class="t" font-size="10.5" letter-spacing=".5"><textPath href="#b${k}" startOffset="50%" text-anchor="middle">${esc(bot)}</textPath></text>`;
}

/** Text links, Motiv rechts (bzw. umgekehrt): Name, Datum als Pille, darunter die Nummer */
const sideText = (t: Txt, x: number, maxW: number, base: number, yName = 62, yPill = 76, yNr = 122) =>
	nameBlock(t.name, x, yName, maxW, base) + pill(x, yPill, t.date || t.nr) + (t.date ? small(x, yNr, t.nr) : '');

const FRAMES: Record<Frame, (t: Txt, m: Motif) => [string, string]> = {
	tag: (t, m) => [
		'0 0 220 150',
		`<path d="M20,6 H200 A14,14 0 0 0 214,20 V130 A14,14 0 0 0 200,144 H20 A14,14 0 0 0 6,130 V20 A14,14 0 0 0 20,6 Z" ${TINT} stroke-width="4"/>
<path d="M26,15 H194 A10,10 0 0 0 205,26 V124 A10,10 0 0 0 194,135 H26 A10,10 0 0 0 15,124 V26 A10,10 0 0 0 26,15 Z" ${DOTS}/>
${place(m, [126, 26, 80, 96])}${sideText(t, 72, 100, 15)}`
	],
	oct: (t, m) => [
		'0 0 220 170',
		`<path d="M30,8 H190 L212,30 V140 L190,162 H30 L8,140 V30 Z" ${TINT} stroke-width="4.5"/><path d="M34,18 H186 L202,34 V136 L186,152 H34 L18,136 V34 Z" ${DOTS}/>
${place(m, [42, 28, 136, 86])}${nameBlock(t.name, 110, 130, 150, 13)}${small(110, 145, below(t), 10)}`
	],
	oval: (t, m) => [
		'0 0 240 160',
		`<ellipse cx="120" cy="80" rx="112" ry="74" ${TINT} stroke-width="4"/><ellipse cx="120" cy="80" rx="101" ry="63" ${DOTS}/>
${place(m, [42, 24, 70, 100])}${sideText(t, 162, 92, 12.5, 72, 84, 126)}`
	],
	rrect: (t, m) => [
		'0 0 220 160',
		`<rect x="6" y="6" width="208" height="148" rx="26" ${TINT} stroke-width="4"/><rect x="16" y="16" width="188" height="128" rx="17" ${DOTS}/>
${place(m, [20, 34, 96, 92])}${sideText(t, 162, 80, 13, 72, 84, 126)}`
	],
	circle: (t, m) => [
		'0 0 200 200',
		`<circle cx="100" cy="100" r="90" ${TINT} stroke-width="4"/><circle cx="100" cy="100" r="77" ${DOTS}/>${arcs(t.name, below(t), 12)}${place(m, [58, 68, 84, 80])}`
	],
	scallop: (t, m) => [
		'0 0 200 200',
		`<path d="${scallop(16, 86, 18)}" ${TINT} stroke-width="4"/><circle cx="100" cy="100" r="74" ${DOTS}/>${arcs(t.name, below(t))}${place(m, [58, 64, 84, 80])}`
	],
	zig: (t, m) => [
		'0 0 200 200',
		`<path d="${zig(36, 94, 85)}" ${TINT} stroke-width="3.6"/><circle cx="100" cy="100" r="75" ${DOTS}/>${arcs(t.name, below(t))}${place(m, [54, 68, 92, 68])}`
	],
	tri: (t, m) => [
		'0 0 220 200',
		`<path d="M110,14 L208,186 L12,186 Z" ${TINT} stroke-width="5"/><path d="M110,36 L190,176 L30,176 Z" ${DOTS}/>
${place(m, [62, 62, 96, 80])}${nameBlock(t.name, 110, 160, 120, 12)}${small(110, 173, below(t), 9.5)}`
	],
	hex: (t, m) => [
		'0 0 200 200',
		`<path d="M192,100 L146,180 L54,180 L8,100 L54,20 L146,20 Z" ${TINT} stroke-width="5"/><path d="M181,100 L140,170 L60,170 L19,100 L60,30 L140,30 Z" ${DOTS}/>
${nameBlock(t.name, 100, 60, 112, 17)}${place(m, [46, 70, 108, 66])}${pill(100, 144, below(t), 10.5)}`
	],
	notch: (t, m) => [
		'0 0 240 140',
		`<path d="M12,6 H228 Q234,6 234,12 V56 A14,14 0 0 0 234,84 V128 Q234,134 228,134 H12 Q6,134 6,128 V84 A14,14 0 0 0 6,56 V12 Q6,6 12,6 Z" ${TINT} stroke-width="4"/>
<rect x="26" y="16" width="188" height="108" rx="10" ${DOTS}/>${place(m, [128, 20, 84, 98])}${sideText(t, 74, 84, 13, 52, 64, 108)}`
	],
	shield: (t, m) => [
		'0 0 200 220',
		`<path d="M16,10 H184 V92 Q184,168 100,210 Q16,168 16,92 Z" ${TINT} stroke-width="4.5"/><path d="M28,22 H172 V92 Q172,158 100,196 Q28,158 28,92 Z" ${DOTS}/>
${nameBlock(t.name, 100, 52, 132, 15)}${place(m, [50, 64, 100, 76])}${small(100, 162, below(t), 10)}`
	],
	diamond: (t, m) => [
		'0 0 220 220',
		`<path d="M110,6 L214,110 L110,214 L6,110 Z" ${TINT} stroke-width="4.5"/><path d="M110,22 L198,110 L110,198 L22,110 Z" ${DOTS}/>
${place(m, [56, 36, 108, 86])}${nameBlock(t.name, 110, 143, 116, 13)}${small(110, 159, below(t), 9.5)}`
	],
	perf: (t, m) => [
		'0 0 180 210',
		`<path d="${perfPath(6, 6, 168, 198, 4.5, 15)}" ${TINT} stroke-width="3"/><rect x="18" y="18" width="144" height="174" stroke-width="2.4"/>
${place(m, [28, 26, 124, 96])}${nameBlock(t.name, 90, 154, 112, 14)}${small(90, 178, below(t), 10.5)}`
	],
	banner: (t, m) => [
		'0 0 220 200',
		`<circle cx="110" cy="100" r="88" ${TINT} stroke-width="4"/><circle cx="110" cy="100" r="76" ${DOTS}/>${place(m, [62, 30, 96, 78])}
<path d="M4,112 H216 L206,125 L216,138 H4 L14,125 Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
<text class="k" x="110" y="${f1(125 + fit(t.name, 172, 15) * 0.36)}" font-family="var(--display)" font-weight="800" font-size="${fit(t.name, 172, 15)}" text-anchor="middle" letter-spacing=".5">${esc(t.name)}</text>${small(110, 160, below(t), 10.5)}`
	],
	arch: (t, m) => [
		'0 0 180 220',
		`<path d="M10,212 V88 A80,80 0 0 1 170,88 V212 Z" ${TINT} stroke-width="4.5"/><path d="M22,200 V88 A68,68 0 0 1 158,88 V200 Z" ${DOTS}/>
${place(m, [40, 40, 100, 84])}${nameBlock(t.name, 90, 150, 124, 14)}${pill(90, 164, below(t), 10.5)}`
	]
};

/* ---------- Spezialstempel: Briefmarke (Szenen in scenes.ts) ---------- */
let markId = 0;
/** Seltenheit: Beschriftung auf der Marke (1 = Rare, 2 = Epic, 3 = Legendary) */
export const TIER_LABEL = ['', 'RARE', 'EPIC', 'LEGENDARY'];
/** Briefmarke statt Stempel: gezähntes Papier, farbig bedrucktes Bild (Szene oder sonst das Stempelmotiv), Länder-Nr. als Nennwert,
    darunter Name und Stufe; Epic mit metallischem Silberrand, Legendary mit Goldrand. Ohne Tinten-Filter: gedruckt, nicht gestempelt. */
function markFrame(t: Txt, scene: string | null, m: Motif, tier: number, nr: number, wide?: string): [string, string] {
	if (wide) return wideFrame(t, wide, nr);
	const id = 'mk' + ++markId,
		two = split(t.name).length > 1,
		art = scene ? `<g transform="translate(18,18) scale(.911)">${scene}</g>` : place(m, [46, 40, 118, 116]),
		label = TIER_LABEL[tier] + (t.date ? ` · ${t.date}` : ''),
		fs = tier > 1 ? 10.5 : 11.5,
		sx = f1(label.length * fs * 0.27 + 10),
		edge = perfPath(4, 4, 192, 232, 4.5, 15),
		inner = '<rect x="12" y="12" width="176" height="216" class="pp"/>';
	const paper =
		tier > 2
			? `<path d="${edge}" class="gd"/>${inner}`
			: tier > 1
				? `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--sv1)"/><stop offset=".3" stop-color="var(--sv2)"/><stop offset=".5" stop-color="var(--sv3)"/><stop offset=".72" stop-color="var(--sv2)"/><stop offset="1" stop-color="var(--sv1)"/></linearGradient><path d="${edge}" fill="url(#${id}s)" stroke="none"/>${inner}`
				: `<path d="${edge}" class="pp"/>`;
	return [
		'0 0 200 240',
		`${paper}<clipPath id="${id}"><rect x="18" y="18" width="164" height="150"/></clipPath>
<g class="pic"><rect x="18" y="18" width="164" height="150" class="bg"/><g clip-path="url(#${id})">${art}</g><rect x="18" y="18" width="164" height="150" stroke-width="2"/>
<text class="v" x="27" y="46" font-size="24">${nr}</text></g>
${nameBlock(t.name, 100, two ? 211 : 200, 164, two ? 19 : 22)}${small(100, 226, label, fs)}${star(100 - sx, 222, 5)}${star(100 + sx, 222, 5)}`
	];
}

/** Epic im Querformat: Silberrand, breites Bild (270 × 130, Szenen in WIDE) */
function wideFrame(t: Txt, scene: string, nr: number): [string, string] {
	const id = 'mk' + ++markId,
		label = TIER_LABEL[2] + (t.date ? ` · ${t.date}` : ''),
		sx = f1(label.length * 10.5 * 0.27 + 10);
	return [
		'0 0 280 200',
		`<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--sv1)"/><stop offset=".3" stop-color="var(--sv2)"/><stop offset=".5" stop-color="var(--sv3)"/><stop offset=".72" stop-color="var(--sv2)"/><stop offset="1" stop-color="var(--sv1)"/></linearGradient><path d="${perfPath(4, 4, 272, 192, 4.5, 15)}" fill="url(#${id}s)" stroke="none"/><rect x="12" y="12" width="256" height="176" class="pp"/>
<clipPath id="${id}"><rect x="18" y="18" width="244" height="118"/></clipPath><g class="pic"><rect x="18" y="18" width="244" height="118" class="bg"/><g clip-path="url(#${id})"><g transform="translate(18,18) scale(.904)">${scene}</g></g><rect x="18" y="18" width="244" height="118" stroke-width="2"/>
<text class="v" x="27" y="46" font-size="24">${nr}</text></g>
${split(t.name).length > 1 ? nameBlock(t.name, 140, 168, 230, 17) : nameBlock(t.name, 140, 164, 230, 22)}${small(140, 183, label, 10.5)}${star(140 - sx, 179, 5)}${star(140 + sx, 179, 5)}`
	];
}

/* ---------- Stempel je Land ---------- */
type StampDef = { f: Frame; c: string; short?: string };
/** Eigene Stempel: Rahmen, Farbe (Token --st-…), ggf. kurzer Name */
const DEFS: Record<string, StampDef> = {
	CA: { f: 'tag', c: 'red' },
	NO: { f: 'oct', c: 'navy' },
	FR: { f: 'oval', c: 'blue' },
	IT: { f: 'perf', c: 'green' },
	GR: { f: 'circle', c: 'teal' },
	EG: { f: 'tri', c: 'gold' },
	JP: { f: 'scallop', c: 'coral' },
	KE: { f: 'zig', c: 'brown' },
	PE: { f: 'hex', c: 'plum' },
	AU: { f: 'notch', c: 'teal' },
	ES: { f: 'scallop', c: 'red' },
	PT: { f: 'notch', c: 'blue' },
	GB: { f: 'oval', c: 'navy', short: 'GROSS-BRITANNIEN' },
	US: { f: 'tag', c: 'blue', short: 'USA' },
	TH: { f: 'tri', c: 'gold' },
	TR: { f: 'circle', c: 'coral' },
	HR: { f: 'circle', c: 'blue' },
	AT: { f: 'oct', c: 'red' },
	CH: { f: 'shield', c: 'red' },
	NL: { f: 'tag', c: 'coral' },
	IS: { f: 'hex', c: 'navy' },
	MA: { f: 'oct', c: 'brown' },
	MX: { f: 'zig', c: 'green' },
	ZA: { f: 'notch', c: 'gold' },
	IN: { f: 'rrect', c: 'plum' },
	VN: { f: 'scallop', c: 'green' },
	ID: { f: 'tri', c: 'teal' },
	NZ: { f: 'hex', c: 'green', short: 'NEUSEELAND' },
	BR: { f: 'oval', c: 'green' },
	CN: { f: 'tag', c: 'red' },
	DE: { f: 'arch', c: 'navy' },
	AE: { f: 'oct', c: 'gold', short: 'EMIRATE' },
	MV: { f: 'circle', c: 'teal' },
	TZ: { f: 'oct', c: 'gold' },
	MG: { f: 'oct', c: 'brown' },
	SE: { f: 'scallop', c: 'blue' },
	FI: { f: 'circle', c: 'navy' },
	DK: { f: 'oct', c: 'red' },
	IE: { f: 'zig', c: 'green' },
	CZ: { f: 'tag', c: 'navy' },
	BE: { f: 'hex', c: 'gold' },
	MT: { f: 'oct', c: 'teal' },
	SI: { f: 'circle', c: 'green' },
	RU: { f: 'tri', c: 'red' },
	BA: { f: 'notch', c: 'teal', short: 'BOSNIEN' },
	PL: { f: 'zig', c: 'red' },
	HU: { f: 'tag', c: 'green' },
	KR: { f: 'oct', c: 'blue', short: 'SÜDKOREA' },
	SG: { f: 'tag', c: 'teal' },
	MY: { f: 'tri', c: 'navy' },
	KH: { f: 'hex', c: 'brown' },
	LK: { f: 'circle', c: 'coral' },
	NP: { f: 'scallop', c: 'plum' },
	MN: { f: 'zig', c: 'blue' },
	JO: { f: 'rrect', c: 'coral' },
	MM: { f: 'scallop', c: 'gold' },
	UZ: { f: 'hex', c: 'blue' },
	TW: { f: 'tri', c: 'coral' },
	PH: { f: 'zig', c: 'teal' },
	NA: { f: 'hex', c: 'coral' },
	TN: { f: 'rrect', c: 'blue' },
	ZW: { f: 'notch', c: 'green' },
	ZM: { f: 'oct', c: 'green' },
	CU: { f: 'notch', c: 'red' },
	AR: { f: 'oct', c: 'blue' },
	CL: { f: 'scallop', c: 'navy' },
	CO: { f: 'oval', c: 'gold' },
	CR: { f: 'oct', c: 'green' },
	EC: { f: 'oct', c: 'green' },
	BO: { f: 'hex', c: 'teal' },
	GT: { f: 'tri', c: 'green' },
	FJ: { f: 'circle', c: 'plum' },
	PF: { f: 'tag', c: 'teal', short: 'POLYNESIEN' },
	MU: { f: 'oct', c: 'plum' },
	AQ: { f: 'zig', c: 'navy' },
	GL: { f: 'scallop', c: 'teal' },
	VA: { f: 'circle', c: 'gold', short: 'VATIKAN' },
	BN: { f: 'arch', c: 'gold' },
	DO: { f: 'shield', c: 'blue' },
	JM: { f: 'banner', c: 'green' },
	BS: { f: 'perf', c: 'coral' },
	PA: { f: 'tag', c: 'blue' },
	CY: { f: 'diamond', c: 'coral' },
	BG: { f: 'perf', c: 'red' },
	RO: { f: 'shield', c: 'plum' },
	ME: { f: 'banner', c: 'navy' },
	EE: { f: 'arch', c: 'blue' },
	MC: { f: 'diamond', c: 'red' },
	GE: { f: 'shield', c: 'red' },
	AM: { f: 'arch', c: 'coral' },
	AZ: { f: 'banner', c: 'teal' },
	KZ: { f: 'diamond', c: 'gold' },
	OM: { f: 'perf', c: 'brown' },
	QA: { f: 'diamond', c: 'plum' },
	SA: { f: 'arch', c: 'green' },
	LA: { f: 'shield', c: 'gold' },
	HK: { f: 'banner', c: 'red' },
	BT: { f: 'perf', c: 'plum' },
	SC: { f: 'banner', c: 'teal' },
	BW: { f: 'diamond', c: 'brown' },
	RW: { f: 'shield', c: 'green' },
	ET: { f: 'perf', c: 'green' },
	SN: { f: 'tag', c: 'gold' },
	VE: { f: 'shield', c: 'teal' },
	UY: { f: 'banner', c: 'blue' },
	UA: { f: 'perf', c: 'gold' },
	LB: { f: 'diamond', c: 'green' },
	PR: { f: 'arch', c: 'navy' },
	TT: { f: 'perf', c: 'red' },
	SM: { f: 'banner', c: 'plum' },
	AL: { f: 'arch', c: 'red' },
	AD: { f: 'shield', c: 'blue' },
	LU: { f: 'perf', c: 'blue' },
	LI: { f: 'shield', c: 'navy' },
	LT: { f: 'scallop', c: 'red' },
	LV: { f: 'arch', c: 'plum' },
	SK: { f: 'oct', c: 'blue' },
	RS: { f: 'circle', c: 'coral' },
	MK: { f: 'shield', c: 'gold', short: 'NORD-MAZEDONIEN' },
	MD: { f: 'diamond', c: 'plum' },
	FO: { f: 'hex', c: 'teal' },
	GI: { f: 'notch', c: 'brown' },
	IL: { f: 'oct', c: 'blue' },
	IR: { f: 'circle', c: 'red' },
	PK: { f: 'rrect', c: 'green' },
	BD: { f: 'perf', c: 'green' },
	UG: { f: 'hex', c: 'brown' },
	CV: { f: 'zig', c: 'blue' },
	RE: { f: 'tri', c: 'coral' },
	AW: { f: 'scallop', c: 'teal' },
	CW: { f: 'perf', c: 'coral' },
	LC: { f: 'banner', c: 'green' },
	BZ: { f: 'circle', c: 'teal' },
	MO: { f: 'hex', c: 'gold' },
	KG: { f: 'oct', c: 'brown' },
	TM: { f: 'diamond', c: 'red' },
	PG: { f: 'arch', c: 'gold', short: 'PAPUA-NEUGUINEA' },
	VU: { f: 'zig', c: 'green' },
	FK: { f: 'rrect', c: 'navy', short: 'FALKLAND' },
	MW: { f: 'notch', c: 'blue' },
	YE: { f: 'oct', c: 'plum' },
	LS: { f: 'banner', c: 'blue' },
	AX: { f: 'perf', c: 'navy' },
	BY: { f: 'circle', c: 'green' },
	GG: { f: 'oct', c: 'blue' },
	IM: { f: 'shield', c: 'red' },
	JE: { f: 'scallop', c: 'brown' },
	XK: { f: 'hex', c: 'plum' },
	AF: { f: 'arch', c: 'brown' },
	BH: { f: 'oval', c: 'teal' },
	IO: { f: 'notch', c: 'blue' },
	IQ: { f: 'tri', c: 'gold' },
	KP: { f: 'rrect', c: 'navy' },
	KW: { f: 'banner', c: 'blue' },
	PS: { f: 'circle', c: 'green' },
	SY: { f: 'zig', c: 'brown' },
	TJ: { f: 'oct', c: 'teal' },
	TL: { f: 'perf', c: 'coral' },
	GS: { f: 'hex', c: 'navy' },
	GY: { f: 'tag', c: 'green' },
	PY: { f: 'scallop', c: 'red' },
	SR: { f: 'oval', c: 'blue' },
	AO: { f: 'oct', c: 'red' },
	BF: { f: 'scallop', c: 'brown' },
	BI: { f: 'circle', c: 'green' },
	BJ: { f: 'notch', c: 'blue' },
	CD: { f: 'hex', c: 'brown' },
	CF: { f: 'perf', c: 'green' },
	CG: { f: 'circle', c: 'plum' },
	CI: { f: 'arch', c: 'gold' },
	CM: { f: 'tri', c: 'green' },
	DJ: { f: 'oval', c: 'teal' },
	DZ: { f: 'arch', c: 'brown' },
	EH: { f: 'rrect', c: 'gold' },
	ER: { f: 'tag', c: 'teal' },
	GA: { f: 'zig', c: 'teal' },
	GH: { f: 'scallop', c: 'gold' },
	GM: { f: 'banner', c: 'green' },
	GN: { f: 'shield', c: 'coral' },
	GQ: { f: 'hex', c: 'green', short: 'Äquatorial-Guinea' },
	GW: { f: 'perf', c: 'red' },
	KM: { f: 'scallop', c: 'teal' },
	LR: { f: 'circle', c: 'blue' },
	LY: { f: 'arch', c: 'brown' },
	ML: { f: 'tri', c: 'brown' },
	MR: { f: 'rrect', c: 'red' },
	MZ: { f: 'oval', c: 'blue' },
	NE: { f: 'hex', c: 'gold' },
	NG: { f: 'shield', c: 'green' },
	SD: { f: 'perf', c: 'gold' },
	SH: { f: 'notch', c: 'navy' },
	SL: { f: 'zig', c: 'green' },
	SO: { f: 'oct', c: 'blue' },
	SS: { f: 'tag', c: 'brown' },
	ST: { f: 'tri', c: 'green' },
	SZ: { f: 'circle', c: 'red' },
	TD: { f: 'diamond', c: 'brown' },
	TG: { f: 'banner', c: 'green' },
	AG: { f: 'perf', c: 'coral' },
	AI: { f: 'circle', c: 'red' },
	BB: { f: 'scallop', c: 'blue' },
	BL: { f: 'tag', c: 'coral' },
	BM: { f: 'arch', c: 'teal' },
	DM: { f: 'zig', c: 'green' },
	GD: { f: 'hex', c: 'red' },
	HN: { f: 'shield', c: 'blue' },
	HT: { f: 'oct', c: 'navy' },
	KN: { f: 'notch', c: 'green' },
	KY: { f: 'perf', c: 'teal' },
	MF: { f: 'banner', c: 'blue' },
	MS: { f: 'tri', c: 'green' },
	NI: { f: 'circle', c: 'blue' },
	PM: { f: 'tag', c: 'navy' },
	SV: { f: 'zig', c: 'blue' },
	SX: { f: 'oval', c: 'coral' },
	TC: { f: 'hex', c: 'coral' },
	VC: { f: 'arch', c: 'green' },
	VG: { f: 'shield', c: 'teal' },
	VI: { f: 'perf', c: 'gold', short: 'Amerik. Jungferninseln' },
	GP: { f: 'circle', c: 'red' },
	MQ: { f: 'tri', c: 'teal' },
	BQ: { f: 'perf', c: 'plum' },
	AS: { f: 'oct', c: 'teal' },
	CK: { f: 'shield', c: 'green' },
	FM: { f: 'circle', c: 'brown' },
	GU: { f: 'banner', c: 'coral' },
	KI: { f: 'scallop', c: 'red' },
	MH: { f: 'hex', c: 'navy' },
	MP: { f: 'tag', c: 'brown' },
	NC: { f: 'arch', c: 'red' },
	NF: { f: 'tri', c: 'green' },
	NR: { f: 'zig', c: 'blue' },
	NU: { f: 'oval', c: 'teal' },
	PN: { f: 'notch', c: 'navy' },
	PW: { f: 'circle', c: 'teal' },
	SB: { f: 'perf', c: 'brown' },
	TO: { f: 'hex', c: 'red' },
	TV: { f: 'circle', c: 'blue' },
	WF: { f: 'shield', c: 'red' },
	WS: { f: 'oct', c: 'green' },
	BV: { f: 'hex', c: 'navy' },
	CC: { f: 'scallop', c: 'teal' },
	CX: { f: 'circle', c: 'red' },
	GF: { f: 'tag', c: 'green', short: 'Franz.-Guayana' },
	SJ: { f: 'oct', c: 'navy' },
	TK: { f: 'zig', c: 'blue' },
	UM: { f: 'perf', c: 'navy' },
	YT: { f: 'oval', c: 'plum' },
	HM: { f: 'hex', c: 'teal' },
	TF: { f: 'perf', c: 'blue' }
};
/** Kurze Stempelnamen für lange amtliche Namen (Länder ohne eigenen Kurznamen im Stempel) */
const SHORT: Record<string, string> = {
	BN: 'Brunei', CD: 'DR Kongo', CG: 'Kongo', CF: 'Zentralafrika', AG: 'Antigua & Barbuda', KN: 'St. Kitts & Nevis', VC: 'St. Vincent',
	TT: 'Trinidad & Tobago', ST: 'São Tomé', PS: 'Palästina', MD: 'Moldau', BQ: 'Bonaire', GS: 'Südgeorgien', HM: 'Heard-Insel', IO: 'Chagos-Inseln',
	TF: 'Franz. Süd-Gebiete', UM: 'US-Überseeinseln', VG: 'Brit. Jungferninseln', VI: 'US-Jungferninseln', TC: 'Turks & Caicos', PM: 'St. Pierre',
	SJ: 'Spitzbergen', AX: 'Åland', MP: 'Nördl. Marianen', GF: 'Franz.-Guayana', VA: 'Vatikan', BA: 'Bosnien'
};
const COLORS = ['teal', 'coral', 'gold', 'blue', 'plum', 'green', 'red', 'navy', 'brown'];
const GENERIC: Frame[] = ['circle', 'scallop', 'zig', 'oct', 'hex', 'shield', 'diamond', 'perf', 'banner', 'arch'];
/** Rahmen mit Platz für zwei Namenszeilen (für lange Namen; Kreis-Bögen und Banner haben nur eine Zeile) */
const TWO_LINE: Frame[] = ['oct', 'hex', 'shield', 'perf', 'arch', 'tag', 'notch'];
/** fester Zufall je Land (immer gleich) */
const hash = (s: string) => {
	let h = 2166136261;
	for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
	return h >>> 0;
};

export interface Stamp {
	svg: string;
	/** Farbtoken, z. B. var(--st-teal) */
	color: string;
	/** Drehung in Grad, Versatz in px, Breite in % – damit es wie von Hand gestempelt aussieht */
	rot: number;
	dy: number;
	w: number;
}

const cache = new Map<string, Stamp>();
/** Bilder der Briefmarken (groß, eigene Datei): erst bei Bedarf nachladen, damit der Start der App schnell bleibt */
let SC: typeof Scenes | null = null;
let scLoad: Promise<void> | null = null;
export const loadScenes = () =>
	(scLoad ??= import('./scenes').then((m) => {
		SC = m;
		cache.clear();
	}));
export const scenesLoaded = () => SC !== null;
/** Stempel für ein Land (zwischengespeichert: wird nur bei geändertem Datum/Nr. neu gebaut) */
export function stamp(code: string, nr: number, entered?: string, special: 0 | 1 | 2 | 3 = 0): Stamp {
	const key = `${code}|${nr}|${entered ?? ''}|${special}`;
	const hit = cache.get(key);
	if (hit) return hit;
	const h = hash(code),
		def = DEFS[code];
	const name = (def?.short ?? SHORT[code] ?? nameOf(code)).toLocaleUpperCase('de').replace(/ẞ/g, 'SS');
	const frame: Frame = def?.f ?? (name.length > 13 ? TWO_LINE[h % TWO_LINE.length] : GENERIC[h % GENERIC.length]);
	const motif = (MOTIFS[code] && def ? MOTIFS[code] : (CONT_MOTIFS[CONT[code]] ?? CONT_MOTIFS.AN))();
	const txt = { name, date: stampDate(entered), nr: `Nr. ${nr}` };
	const [vb, inner] = special ? markFrame(txt, (SC && (SC.TIERED[code]?.[special - 1] ?? SC.SCENES[code])?.()) || null, motif, special, nr, special === 2 ? SC?.WIDE[code]?.() : undefined) : FRAMES[frame](txt, motif);
	const wide = !special && +vb.split(' ')[2] / +vb.split(' ')[3] > 1.25;
	const s: Stamp = {
		svg: special
			? `<svg class="pp-stamp sp${vb.startsWith('0 0 280') ? ' wd' : ''}" viewBox="${vb}" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`
			: `<svg class="pp-stamp" viewBox="${vb}" aria-hidden="true"><g filter="url(#pf${h % 4})" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`,
		color: `var(--st-${def?.c ?? COLORS[(h >>> 3) % COLORS.length]})`,
		rot: special ? (((h >>> 6) % 7) - 3) : ((h >>> 6) % 15) - 7,
		dy: ((h >>> 10) % 9) - 4,
		w: special ? 96 : wide ? 94 + ((h >>> 14) % 5) : 84 + ((h >>> 14) % 5)
	};
	if (cache.size > 400) cache.clear();
	cache.set(key, s);
	return s;
}

/** Gemeinsame Tinten-Filter (unregelmäßiger Rand + gesprenkelte Farbe), einmal pro Seite einbinden */
export const INK_FILTERS = [71, 11, 41, 61]
	.map(
		(seed, i) =>
			`<filter id="pf${i}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="${seed}" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="1.8" result="d"/><feTurbulence type="fractalNoise" baseFrequency="0.8" seed="${seed + 3}" result="s"/><feColorMatrix in="s" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -7 5.4" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>`
	)
	.join('');
