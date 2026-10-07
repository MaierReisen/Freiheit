import { CONT, nameOf } from './countries';

/* Reisepass: Ränge und Stempel. Ein Stempel ist ein SVG-Text (Rahmen + Motiv + Name/Datum), eingefärbt über
   currentColor. Rund 30 beliebte Länder haben ein eigenes Motiv, alle anderen einen schlichten Stempel mit
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
	return { rank, next, left: next ? next.n - count : 0, p: Math.max(0, Math.min(1, p)) };
}

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
	KE: () =>
		M(
			`<path d="M104,126 A20,20 0 0 1 144,126 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M58,98 Q64,86 80,88 Q90,80 102,86 Q116,84 120,96 Q102,102 88,100 Q72,103 58,98 Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
<path d="M88,126 L90,112 Q88,104 78,99 M90,112 Q94,104 104,98" stroke-width="4"/><path d="M54,127 H146" stroke-width="3.6"/>`,
			[52, 78, 96, 52]
		),
	PE: () =>
		M(
			`<path d="M50,130 L74,112 L88,84 Q98,70 108,86 L118,106 L128,100 L150,130 Z" fill="currentColor" fill-opacity=".3" stroke-width="3"/>
<path d="M88,84 Q98,70 108,86 L102,92 L96,86 L92,92 Z" fill="currentColor" stroke="none"/><path d="M46,136 H154" stroke-width="3.6"/>`,
			[44, 70, 112, 68]
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
<path d="${waves(4, 77, 6, 15, 4)}" stroke-width="2.4"/>`)
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
type Frame = 'tag' | 'oct' | 'oval' | 'rrect' | 'circle' | 'scallop' | 'zig' | 'tri' | 'hex' | 'notch';
type Txt = { name: string; date: string; nr: string };

function place(m: Motif, [rx, ry, rw, rh]: number[]) {
	const [bx, by, bw, bh] = m.box,
		s = Math.min(rw / bw, rh / bh);
	return `<g transform="translate(${f1(rx + (rw - bw * s) / 2 - bx * s)},${f1(ry + (rh - bh * s) / 2 - by * s)}) scale(${+s.toFixed(3)})">${m.svg}</g>`;
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
	]
};

/* ---------- Stempel je Land ---------- */
type StampDef = { f: Frame; c: string; short?: string };
/** Eigene Stempel: Rahmen, Farbe (Token --st-…), ggf. kurzer Name */
const DEFS: Record<string, StampDef> = {
	CA: { f: 'tag', c: 'red' },
	NO: { f: 'oct', c: 'navy' },
	FR: { f: 'oval', c: 'blue' },
	IT: { f: 'rrect', c: 'green' },
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
	CH: { f: 'rrect', c: 'red' },
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
	DE: { f: 'rrect', c: 'navy' },
	AE: { f: 'oct', c: 'gold', short: 'EMIRATE' },
	MV: { f: 'circle', c: 'teal' }
};
const COLORS = ['teal', 'coral', 'gold', 'blue', 'plum', 'green', 'red', 'navy', 'brown'];
const GENERIC: Frame[] = ['circle', 'scallop', 'zig', 'oct', 'hex'];
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
/** Stempel für ein Land (zwischengespeichert: wird nur bei geändertem Datum/Nr. neu gebaut) */
export function stamp(code: string, nr: number, entered?: string): Stamp {
	const key = `${code}|${nr}|${entered ?? ''}`;
	const hit = cache.get(key);
	if (hit) return hit;
	const h = hash(code),
		def = DEFS[code];
	const frame: Frame = def?.f ?? GENERIC[h % GENERIC.length];
	const motif = (MOTIFS[code] && def ? MOTIFS[code] : (CONT_MOTIFS[CONT[code]] ?? CONT_MOTIFS.AN))();
	const name = (def?.short ?? nameOf(code)).toLocaleUpperCase('de').replace(/ẞ/g, 'SS');
	const [vb, inner] = FRAMES[frame]({ name, date: stampDate(entered), nr: `Nr. ${nr}` }, motif);
	const wide = +vb.split(' ')[2] / +vb.split(' ')[3] > 1.25;
	const s: Stamp = {
		svg: `<svg class="pp-stamp" viewBox="${vb}" aria-hidden="true"><g filter="url(#pf${h % 4})" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`,
		color: `var(--st-${def?.c ?? COLORS[(h >> 3) % COLORS.length]})`,
		rot: ((h >> 6) % 15) - 7,
		dy: ((h >> 10) % 9) - 4,
		w: wide ? 94 + ((h >> 14) % 5) : 84 + ((h >> 14) % 5)
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
