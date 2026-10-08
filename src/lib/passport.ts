import { CONT, nameOf } from './countries';

/* Reisepass: Ränge und Stempel. Ein Stempel ist ein SVG-Text (Rahmen + Motiv + Name/Datum), eingefärbt über
   currentColor. Rund 80 Länder haben ein eigenes Motiv, alle anderen einen schlichten Stempel mit
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
	VA: { f: 'circle', c: 'gold', short: 'VATIKAN' }
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
