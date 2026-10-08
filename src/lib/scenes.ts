/* Szenen der Spezialstempel (Briefmarken seltener Länder): je Land ein kleines Bild in 180 × 170, Himmel oben,
   Boden unten. Gezeichnet in der einen Stempelfarbe (currentColor); Abstufungen L1–L4 geben Tiefe,
   var(--paper) ist die Papierfarbe der Marke (für Aussparungen, Licht, Sterne). */

const f1 = (v: number) => +v.toFixed(1);
const SOLID = 'fill="currentColor" stroke="none"';
const PAPER = 'fill="var(--paper)" stroke="none"';
const DOTS = 'stroke-width="1.6" stroke-dasharray="1 5"';
const L1 = 'fill="currentColor" fill-opacity=".1"',
	L2 = 'fill="currentColor" fill-opacity=".22"',
	L3 = 'fill="currentColor" fill-opacity=".42"',
	L4 = 'fill="currentColor" fill-opacity=".7"';
const waves = (x: number, y: number, n: number, w = 14, h = 5) => {
	let d = `M${x},${y}`;
	for (let i = 0; i < n; i++) d += ` q${w / 2},${-h} ${w},0`;
	return d;
};

/* ---------- Bausteine (Ursprung jeweils am Fußpunkt) ---------- */
/** Baustein an (x, y) in Größe s, gespiegelt mit flip */
const at = (x: number, y: number, s: number, body: string, flip = false) => `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})">${body}</g>`;
const sun = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" ${SOLID}/><circle cx="${x}" cy="${y}" r="${r + 8}" ${DOTS}/>`;
const birds = (x: number, y: number, k = 1) =>
	`<path d="M${x},${y} q${4 * k},-4 ${8 * k},0 q${4 * k},-4 ${8 * k},0 M${x + 14 * k},${y - 9 * k} q${3 * k},-3 ${6 * k},0 q${3 * k},-3 ${6 * k},0" stroke-width="1.8"/>`;
/** Meer: helle Wellenlinie über dunkler, ab Höhe y */
const sea = (y: number, f = L2) => `<path d="M0,${y} H180 V170 H0 Z" ${f} stroke="none"/><path d="${waves(0, y + 10, 13, 14, 3)}" stroke-width="2"/><path d="${waves(6, y + 22, 13, 14, 3)}" stroke-width="1.6"/>`;
const pine = (x: number, y: number, h: number, f = SOLID) =>
	`<path d="M${x},${y - h} L${f1(x + h * 0.28)},${f1(y - h * 0.45)} H${f1(x + h * 0.14)} L${f1(x + h * 0.36)},${y - 2} H${f1(x - h * 0.36)} L${f1(x - h * 0.14)},${f1(y - h * 0.45)} H${f1(x - h * 0.28)} Z" ${f}/>`;
/** Palme: Stamm von (x, y) nach oben, Krone um l nach rechts versetzt */
const palm = (x: number, y: number, h: number, l = 8) => {
	const tx = x + l,
		ty = y - h,
		k = f1(h / 60);
	return `<path d="M${x},${y} Q${f1(x + l * 0.1)},${f1(y - h * 0.6)} ${tx},${ty}" stroke-width="${f1(3.4 * Math.min(1, k + 0.2))}"/>${at(tx, ty, k, `<path d="M0,0 Q-10,-10 -24,-2 Q-12,-6 0,0 M0,0 Q-6,-14 -18,-16 Q-8,-10 0,0 M0,0 Q5,-14 17,-15 Q8,-8 0,0 M0,0 Q11,-9 24,-1 Q12,-5 0,0 M0,0 Q-13,-1 -19,12 Q-10,2 0,0 M0,0 Q13,0 18,13 Q10,3 0,0" ${SOLID} stroke="currentColor" stroke-width="1.2"/>`)}`;
};
const ACACIA = `<path d="M0,0 V-13 M0,-8 L-7,-16 M0,-9 L6,-17" stroke-width="2.4"/><path d="M-22,-15 Q-4,-28 22,-16 Q2,-12 -22,-15 Z" ${SOLID}/>`;
/** Dromedar, Blick nach rechts (ca. 32 × 26) */
const CAMEL = `<path d="M2,-13 Q2,-21 9,-22 Q13,-28 18,-22 Q22,-21 23,-15 Q26,-16 26,-23 L31,-24 L32,-21 L29,-21 Q28,-12 23,-11 L21,-11 L22,0 H20 L19,-10 H9 L8,0 H6 L5,-11 Q2,-11 2,-13 Z" ${SOLID}/><path d="M9,-10 L11,0 M19,-10 L17,0 M2,-14 Q0,-10 1,-6" stroke-width="1.8"/>`;
/** Elefant, Blick nach links (ca. 40 × 30) */
const ELEPHANT = `<path d="M11,0 V-14 Q9,-28 23,-29 Q38,-30 39,-16 V0 H34 V-8 H31 V0 H26 V-8 H20 V0 H16 V-8 H15 V0 Z" ${SOLID}/><circle cx="10" cy="-21" r="7.5" ${SOLID}/><path d="M5,-18 Q0,-10 2,-3 Q3,0 5,-2" stroke-width="3.6"/><path d="M13,-26 Q20,-27 21,-19 Q20,-12 13,-14" fill="var(--paper)" fill-opacity=".35" stroke="var(--paper)" stroke-width="1.4"/><path d="M6,-14 Q4,-10 7,-8" stroke="var(--paper)" stroke-width="1.6"/><path d="M39,-20 Q42,-14 40,-8" stroke-width="1.4"/>`;
/** Rind mit großen Leierhörnern, Blick nach links (ca. 40 × 46) */
const COW = `<path d="M11,-22 H33 Q38,-22 38,-16 V0 H35 V-11 H32 V0 H29 V-11 H17 V0 H14 V-11 H11 V0 H8 V-16 Q8,-21 11,-22 Z M14,-22 Q18,-28 23,-22 Z" ${SOLID}/><path d="M10,-21 L3,-19 L2,-13 L6,-12 L10,-15 Z" ${SOLID}/><path d="M6,-20 C-1,-28 -3,-36 3,-46 M8,-21 C13,-30 15,-38 10,-47" stroke-width="2.6"/><path d="M38,-18 Q41,-12 39,-4" stroke-width="1.4"/>`;
/** Mensch (ca. 24 hoch) */
const PERSON = `<circle cx="0" cy="-21" r="2.8" ${SOLID}/><path d="M0,-18 V-8 L-3,0 M0,-8 L3,0 M0,-15 L-4,-9 M0,-15 L4,-9" stroke-width="2.2"/>`;
/** Fregattvogel im Flug (ca. 36 breit) */
const FRIGATE = `<path d="M-18,-2 Q-10,-8 -2,0 Q0,2 2,0 Q10,-8 18,-2 Q10,-5 3,3 L6,10 L1,5 L-1,5 L-6,10 L-3,3 Q-10,-5 -18,-2 Z" ${SOLID}/>`;
/** Wolke (Papier, Umriss), ca. 46 breit */
const cloud = (x: number, y: number) => `<path d="M${x},${y} q1,-10 13,-9 q5,-10 17,-5 q12,-2 13,14 Z" fill="var(--paper)" stroke-width="1.8"/>`;
/** Hütte mit Strohdach (ca. 40 breit) */
const HUT = `<path d="M-14,-14 V0 H14 V-14" ${L2} stroke-width="2"/><path d="M-4,0 V-8 H4 V0" ${SOLID}/><path d="M-21,-12 L0,-32 L21,-12 Z" ${SOLID}/>`;
/** Flamingo (ca. 16 hoch, Blick nach rechts) */
const FLAMINGO = `<path d="M0,0 V-13 M0,-7 L-4,-2" stroke-width="1.4"/><path d="M-7,-15 Q0,-21 6,-16 Q0,-11 -7,-15 Z" ${SOLID}/><path d="M5,-17 Q11,-22 7,-28 Q5,-32 9,-33 L12,-31" stroke-width="1.8"/>`;
/** Flusspferd, nur Kopf und Rücken über Wasser */
const HIPPO = `<path d="M-24,0 Q-24,-8 -16,-9 Q-14,-15 -8,-14 Q-4,-16 0,-12 Q10,-11 14,-6 Q20,-10 26,-6 Q30,-3 30,0 Z" ${SOLID}/><path d="M-14,-13 L-16,-19 L-11,-15 M-6,-14 L-5,-20 L-2,-15" ${SOLID} stroke="currentColor" stroke-width="1.6"/><circle cx="-10" cy="-10" r="1.3" ${PAPER}/><circle cx="-3" cy="-10" r="1.3" ${PAPER}/><path d="M-34,3 q6,-3 12,0 M30,3 q6,-3 12,0" stroke-width="1.4"/>`;
/** Wildschaf (Argali) mit gedrehten Hörnern, Blick nach rechts */
const ARGALI = `<path d="M2,-16 Q2,-24 12,-24 H24 Q30,-24 31,-18 L29,-12 H6 Q2,-12 2,-16 Z" ${SOLID}/><path d="M7,-12 V0 M11,-12 V0 M24,-12 V0 M28,-12 V0" stroke-width="2.2"/><path d="M29,-22 L36,-28 L40,-24 L34,-18 Z" ${SOLID}/><path d="M35,-26 Q30,-38 21,-33 Q14,-27 19,-19 Q23,-15 27,-20" stroke-width="3.4"/>`;
/** Meeresschildkröte von oben */
const TURTLE = `<path d="M-8,-12 l-8,-6 M8,-12 l9,-7 M-8,0 l-8,5 M8,0 l8,5" stroke-width="3.4"/><ellipse cx="0" cy="-6" rx="16" ry="9" ${SOLID}/><path d="M-10,-6 H10 M-4,-14 V2 M4,-14 V2" stroke="var(--paper)" stroke-width="1.2"/><circle cx="19" cy="-6" r="4.4" ${SOLID}/>`;
/** Trommler mit Trommel auf dem Kopf */
const DRUMMER = `<path d="M-8,-44 H8 L6,-26 H-6 Z" ${SOLID}/><path d="M-7,-38 H7 M-6,-31 H6" stroke="var(--paper)" stroke-width="1.2"/><circle cx="0" cy="-21" r="2.8" ${SOLID}/><path d="M0,-18 V-8 L-3,0 M0,-8 L3,0 M0,-15 L-8,-24 L-11,-31 M0,-15 L8,-24 L11,-31" stroke-width="2.2"/>`;
/** Pferd, Blick nach rechts (ca. 38 × 33); mit rider = Reiter */
const horse = (rider = '') =>
	`<path d="M4,-14 Q4,-22 12,-22 H24 L30,-30 Q33,-33 36,-30 L38,-24 L34,-23 L30,-18 Q30,-14 28,-12 H8 Q4,-12 4,-14 Z" ${SOLID}/><path d="M8,-12 L6,0 M12,-12 L13,0 M25,-12 L24,0 M28,-12 L30,0 M4,-18 Q-2,-14 0,-6" stroke-width="2.2"/>${rider}`;
const RIDER = `<circle cx="17" cy="-36" r="3" ${SOLID}/><path d="M17,-33 V-22 M17,-29 L24,-25" stroke-width="2.4"/>`;
/** Jurte (ca. 40 breit) */
const YURT = `<path d="M-18,0 V-14 H18 V0 Z" ${L3} stroke-width="2"/><path d="M-20,-14 Q0,-30 20,-14 Z" ${SOLID}/><path d="M-4,0 V-9 H4 V0" ${SOLID}/><path d="M-18,-8 H18" stroke-width="1.4" stroke-dasharray="2 3"/>`;
/** Affenbrotbaum (Baobab) */
const BAOBAB = `<path d="M-9,0 Q-6,-20 -8,-34 H8 Q6,-20 9,0 Z" ${SOLID}/><path d="M-6,-32 L-18,-42 M-2,-34 L-6,-50 M4,-34 L10,-48 M6,-32 L19,-40" stroke-width="3"/>${[[-20, -44], [-7, -52], [11, -50], [21, -42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" ${L4} stroke="none"/>`).join('')}`;
/** Krokodil, halb im Wasser (Blick nach rechts) */
const CROC = `<path d="M-32,0 Q-20,-6 -4,-7 H16 Q26,-7 34,-3 L36,0 Z" ${SOLID}/><path d="M-4,-7 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3" ${SOLID} stroke="currentColor" stroke-width="1.4"/><circle cx="20" cy="-8" r="2.4" ${SOLID}/><path d="M-38,2 q6,-3 12,0 M34,2 q6,-3 12,0" stroke-width="1.4"/>`;

export const SCENES: Record<string, () => string> = {
	// Tuvalu: Atoll – Palmenstrand, Lagune mit Auslegerkanu, Riffinsel am Horizont
	TV: () => `${sun(136, 34, 14)}${birds(66, 26)}<path d="M0,74 H180 V96 H0 Z" ${L3} stroke="none"/>
<path d="M0,96 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M6,96 Q60,88 120,92 Q150,94 180,90" stroke-width="2.4"/>${palm(48, 92, 18, 3)}${palm(60, 91, 14, -3)}${palm(132, 92, 16, 3)}
<path d="${waves(10, 112, 9, 14, 2.4)}" stroke-width="1.6"/><path d="M52,124 Q72,132 94,124 Z" ${SOLID}/><path d="M56,116 H92 M60,116 V124 M88,116 V124" stroke-width="1.8"/><path d="M73,123 V96 L90,120 Z" ${L4} stroke-width="1.6"/>
<path d="M0,140 Q70,126 180,150 V170 H0 Z" ${L2} stroke-width="2.4"/><path d="M14,156 h2 M40,150 h2 M70,158 h2 M100,152 h2" stroke-width="1.6"/>${palm(150, 168, 96, -30)}${palm(22, 160, 64, 12)}`,
	// Nauru: Kalkstein-Zinnen am Anibare-Strand, Fregattvogel
	NR: () => `${sun(76, 40, 12)}${at(130, 34, 1.3, FRIGATE)}${at(150, 60, 0.7, FRIGATE)}${sea(84)}
<path d="M0,170 V128 L6,110 L11,122 L17,96 L24,118 L30,104 L36,126 L42,114 L47,132 L54,108 L60,124 L66,116 L72,140 L78,170 Z" ${L3} stroke-width="2.2"/><path d="M17,96 L20,120 M30,104 L32,124 M54,108 L56,128" stroke-width="1.4"/>
<path d="M100,170 L104,140 L110,148 L116,128 L122,146 L128,138 L134,170 Z" ${L4} stroke-width="2.2"/><path d="M60,170 Q100,150 180,156 V170 Z" ${L1} stroke-width="2.2"/>${palm(160, 160, 80, -14)}`,
	// Kiribati: erste Sonne der Welt über dem Pazifik, Fregattvogel (wie auf der Flagge)
	KI: () => `${Array.from({ length: 9 }, (_, i) => {
		const a = (Math.PI * (i + 1)) / 10;
		return `<path d="M${f1(90 - 38 * Math.cos(a))},${f1(104 - 38 * Math.sin(a))} L${f1(90 - 56 * Math.cos(a))},${f1(104 - 56 * Math.sin(a))}" stroke-width="3"/>`;
	}).join('')}<path d="M58,104 A32,32 0 0 1 122,104 Z" ${SOLID}/>${at(90, 34, 1.6, FRIGATE)}
<path d="M0,104 H180 V170 H0 Z" ${L3} stroke="none"/><path d="M0,104 H180" stroke-width="2.6"/>${[118, 134, 150].map((y, i) => `<path d="${waves(i * 5 - 4, y, 14, 14, 4)}" stroke="var(--paper)" stroke-width="2.6"/>`).join('')}
${at(28, 160, 0.8, `<path d="M-18,-6 Q0,2 18,-6 Z" ${SOLID}/><path d="M0,-6 V-34 L16,-10 Z" fill="var(--paper)" stroke-width="2"/>`)}`,
	// Nordkorea: Ryugyong-Hotel, Juche-Turm, Taedong-Fluss
	KP: () => `${birds(126, 26)}<path d="M0,132 V112 H20 V100 H34 V132 Z M104,132 V114 H124 V132 Z M150,132 V104 H166 V96 H180 V132 Z" ${L2} stroke-width="1.8"/>
<path d="M44,132 L68,32 L72,24 L76,32 L100,132 Z" ${L3} stroke-width="2.4"/><path d="M72,24 V8 M62,58 H82 M58,76 H86 M54,94 H90 M50,112 H94" stroke-width="1.6"/><path d="M72,32 V132" stroke-width="1.2"/>
<path d="M132,132 L134,54 H142 L144,132 Z" ${SOLID}/><path d="M131,54 H145 M128,134 H148" stroke-width="2.6"/><path d="M138,50 Q130,42 135,32 Q137,38 138,28 Q141,38 143,34 Q146,43 138,50 Z" ${L4} stroke-width="1.4"/>
${sea(134)}`,
	// Turkmenistan: Gaskrater von Darvasa („Tor zur Hölle“) in der Wüstennacht
	TM: () => `<rect width="180" height="170" ${L4} stroke="none"/>${[[20, 24, 1.4], [44, 50, 1], [70, 18, 1.6], [96, 40, 1], [112, 14, 1.2], [26, 74, 1], [162, 66, 1.3], [84, 64, 0.9], [150, 90, 1]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${PAPER}/>`).join('')}
<circle cx="142" cy="32" r="13" ${PAPER}/><circle cx="148" cy="28" r="12" fill="currentColor" fill-opacity=".7" stroke="none"/>
<path d="M0,112 Q40,94 90,108 Q140,92 180,106 V170 H0 Z" ${SOLID}/><ellipse cx="90" cy="130" rx="60" ry="18" fill="var(--paper)" fill-opacity=".22" stroke="none"/><ellipse cx="90" cy="130" rx="46" ry="12" fill="var(--paper)" fill-opacity=".5" stroke="none"/>
<path d="M58,132 Q60,118 66,112 Q66,122 72,124 Q74,106 82,98 Q82,112 88,116 Q92,102 100,96 Q98,112 104,118 Q108,108 114,106 Q114,120 122,132 Z" ${PAPER}/><path d="M74,130 Q78,120 84,118 Q84,124 90,126 Q94,116 100,114 Q100,124 106,130 Z" ${L3} stroke="none"/>
<path d="M0,170 V142 Q40,132 90,148 Q140,132 180,142 V170 Z" ${SOLID}/>${at(132, 136, 0.45, PERSON.replace(/currentColor/g, 'var(--paper)').replace('<path', '<path stroke="var(--paper)"'))}`,
	// Somalia: Felsbilder von Laas Geel, Dromedar und Akazie
	SO: () => `${sun(152, 28, 11)}<path d="M14,122 L20,90 L36,66 L58,54 L96,44 L132,50 L156,66 L166,90 L160,108 L148,106 Q110,98 62,106 L40,112 L34,122 Z" ${L2} stroke-width="2.4"/><path d="M20,90 L44,96 M156,66 L140,80 M96,44 L100,58" stroke-width="1.4"/>
<path d="M42,110 Q90,94 152,104" stroke-width="1.6"/>${at(62, 92, 0.42, COW)}${at(96, 88, 0.42, COW, true)}${at(126, 92, 0.38, COW)}<path d="M80,64 l4,10 M120,58 l2,8" stroke-width="1.4"/>
<path d="M0,126 Q90,114 180,128 V170 H0 Z" ${L1} stroke-width="2"/>${at(150, 136, 1.1, ACACIA)}${at(86, 154, 1.4, CAMEL)}${at(66, 154, 1, PERSON)}<path d="M64,140 L60,154" stroke-width="1.6"/><path d="M14,152 l3,-6 l3,6 M32,162 l3,-6 l3,6 M128,160 l3,-6 l3,6" stroke-width="1.6"/>`,
	// Südsudan: Rinderlager der Mundari mit Leierhörnern, Rauch im Abendlicht
	SS: () => `${sun(124, 64, 22)}${birds(52, 40)}<path d="M0,118 Q90,108 180,118 V170 H0 Z" ${L1} stroke-width="2"/>
<path d="M56,150 q-8,-14 0,-26 q8,-12 -2,-26 q-8,-12 4,-24" stroke-width="2" stroke-opacity=".5"/><path d="M52,152 Q56,142 58,150 Q60,140 64,152 Z" ${SOLID}/>
${at(14, 154, 1.1, COW)}${at(160, 158, 1.25, COW, true)}${at(88, 154, 1.1, PERSON)}<path d="M93,140 L98,154" stroke-width="1.8"/><path d="M0,166 H180" stroke-width="2.4"/>`,
	// Eritrea: Fiat Tagliero in Asmara (Tankstelle mit Flugzeugflügeln)
	ER: () => `${sun(146, 32, 12)}<path d="M0,128 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,128 H180" stroke-width="2.4"/><path d="M0,148 H180" ${DOTS}/>
<rect x="58" y="104" width="64" height="24" ${L2} stroke-width="2"/><path d="M66,112 V122 M76,112 V122 M104,112 V122 M114,112 V122" stroke-width="2"/>
<rect x="82" y="58" width="16" height="70" ${L3} stroke-width="2"/><path d="M78,58 H102 L98,48 H82 Z" ${SOLID}/><path d="M90,48 V34 M90,36 l8,3 l-8,3" stroke-width="1.8"/><path d="M86,68 H94 M86,78 H94" stroke-width="1.6"/>
<path d="M82,90 L12,84 L12,88 L82,100 Z M98,90 L168,84 L168,88 L98,100 Z" ${SOLID}/>${palm(26, 128, 50, 6)}${palm(156, 128, 44, -6)}`,
	// Zentralafrikanische Republik: Waldelefanten auf der Lichtung Dzanga Bai
	CF: () => `${sun(146, 24, 9)}<path d="M0,92 Q8,70 20,78 Q28,58 44,70 Q56,52 70,66 Q84,56 96,70 Q110,50 124,66 Q138,56 148,72 Q162,60 180,74 V114 H0 Z" ${L3} stroke-width="2"/>
<path d="M150,114 V60 M150,72 l-10,-8 M150,66 l9,-8" stroke-width="2.6"/><path d="M132,62 Q132,44 150,44 Q168,42 170,58 Q160,64 150,60 Q140,66 132,62 Z" ${SOLID}/>${birds(64, 30)}
<path d="M0,110 Q90,102 180,110 V170 H0 Z" ${L1} stroke-width="2"/><ellipse cx="104" cy="146" rx="56" ry="10" ${L2} stroke="none"/><path d="${waves(60, 148, 6, 14, 2.4)}" stroke-width="1.6"/>
${at(136, 124, 0.55, ELEPHANT)}${at(28, 140, 1.15, ELEPHANT)}${at(124, 150, 0.95, ELEPHANT, true)}`,
	// Tschad: Felsbogen von Aloba im Ennedi, Kamelkarawane
	TD: () => `<path d="M0,150 L4,80 Q14,40 50,38 Q80,30 110,40 Q150,36 166,66 Q176,90 180,96 V150 Z" ${L3} stroke-width="2.4"/>
<path d="M44,150 Q44,88 88,80 Q130,86 132,150 Z" ${PAPER} /><path d="M44,150 Q44,88 88,80 Q130,86 132,150" stroke-width="2.4"/>${sun(90, 112, 9)}${birds(70, 18)}
<path d="M18,70 l4,30 M152,62 l-4,26 M108,46 l2,14 M64,50 l-2,12" stroke-width="1.6"/>
<path d="M0,150 Q50,132 100,146 Q140,136 180,148 V170 H0 Z" ${L1} stroke-width="2"/><path d="M0,170 Q60,154 120,162 Q150,158 180,162 V170 Z" ${L2} stroke="none"/>
${at(50, 154, 0.85, PERSON)}${at(60, 156, 0.8, CAMEL)}${at(92, 158, 0.8, CAMEL)}${at(124, 156, 0.8, CAMEL)}`,
	// Marshallinseln: Auslegerkanu mit Krebsscherensegel, Riffinseln
	MH: () => `${sun(148, 30, 11)}<path d="M0,96 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,96 H180" stroke-width="2"/><path d="M10,96 Q24,90 40,96 Z M150,96 Q160,92 172,96 Z" ${SOLID}/>${palm(22, 95, 16, 2)}${palm(30, 95, 12, -2)}${palm(160, 95, 12, 2)}
<path d="M92,122 L60,32 Q92,58 138,42 Z" ${L3} stroke="none"/><path d="M92,122 L60,32 M92,122 L138,42 M60,32 Q92,58 138,42" stroke-width="2.6"/><path d="M78,74 Q96,74 116,66 M70,52 Q92,62 124,52" stroke-width="1.2"/>
<path d="M52,122 Q92,134 140,122 L136,118 H56 Z" ${SOLID}/><path d="M70,124 L66,140 M114,124 L118,140 M56,140 H128" stroke-width="2.6"/><path d="${waves(0, 150, 13, 14, 3)}" stroke-width="1.8"/><path d="${waves(6, 162, 13, 14, 3)}" stroke-width="1.6"/>`,
	// Mikronesien: Steingeld (Rai) auf Yap unter Palmen
	FM: () => `${sun(146, 28, 10)}${palm(26, 124, 76, 8)}${palm(160, 124, 64, -8)}<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,124 H180" stroke-width="2"/>${at(132, 124, 1.1, HUT)}
<circle cx="76" cy="112" r="36" ${L3} stroke-width="2.6"/><circle cx="76" cy="112" r="8" ${PAPER}/><circle cx="76" cy="112" r="8" stroke-width="2.4"/><path d="M50,90 Q60,82 72,80 M98,128 Q92,138 82,142 M48,118 Q50,128 56,134" stroke-width="1.6"/>
<circle cx="138" cy="140" r="12" ${L4} stroke-width="2"/><circle cx="138" cy="140" r="3" ${PAPER}/><path d="M10,160 h3 M120,162 h3 M160,158 h3" stroke-width="1.6"/>`,
	// Palau: Pilzförmige Felseninseln im türkisen Wasser, Kajak
	PW: () => `${birds(86, 24)}${sun(150, 28, 10)}<path d="M0,100 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,132 H180 V170 H0 Z" ${L2} stroke="none"/>
<path d="M24,102 Q16,96 12,88 Q6,68 32,60 Q56,54 68,72 Q72,84 64,94 Q58,98 56,102 Z" ${L3} stroke-width="2.2"/><path d="M108,102 Q102,96 98,90 Q92,74 112,66 Q134,60 146,74 Q152,86 144,96 L140,102 Z" ${L3} stroke-width="2.2"/><path d="M76,102 Q70,98 70,90 Q70,80 82,78 Q94,78 94,90 Q94,96 88,102 Z" ${L4} stroke-width="2"/>
<path d="M24,108 H56 M76,106 H88 M108,108 H140" ${DOTS}/><path d="${waves(4, 124, 12, 14, 2.4)}" stroke-width="1.4"/>
<path d="M54,146 Q90,154 128,146 Q92,140 54,146 Z" ${SOLID}/><circle cx="92" cy="128" r="3.4" ${SOLID}/><path d="M92,132 V144 M74,152 L110,124" stroke-width="2.4"/><path d="M70,156 l6,-6 M108,122 l6,-4" stroke-width="3.4"/>`,
	// Salomonen: Kriegskanu (Tomoko) mit hohem Bug und Heck
	SB: () => `${sun(146, 30, 11)}<path d="M0,96 Q20,84 46,92 L60,96 Z" ${L3} stroke-width="2"/>${palm(26, 92, 22, 3)}${sea(96)}
<path d="M14,64 Q20,104 40,118 H140 Q160,104 166,64 Q150,96 136,110 H44 Q30,96 14,64 Z" ${SOLID}/><path d="M48,114 H132" stroke="var(--paper)" stroke-width="1.6" stroke-dasharray="2 4"/><circle cx="14" cy="64" r="3" ${SOLID}/><circle cx="166" cy="64" r="3" ${SOLID}/>
${[56, 76, 96, 116].map((x) => `<circle cx="${x}" cy="94" r="3.4" ${SOLID}/><path d="M${x},98 V108 M${x},102 L${x - 10},122" stroke-width="2.4"/><path d="M${x - 12},120 l-3,8" stroke-width="3.4"/>`).join('')}`,
	// Vanuatu: Vulkan Yasur und Turmspringer von Pentecost
	VU: () => `<path d="M84,58 Q72,42 84,30 Q80,12 100,14 Q116,8 120,26 Q134,30 124,46 Q114,56 104,58" ${L2} stroke-width="2"/><path d="M84,58 q-14,-20 -26,-14 M102,58 q12,-24 26,-18" stroke-width="1.6" stroke-dasharray="2 5"/><circle cx="58" cy="44" r="2.6" ${SOLID}/><circle cx="128" cy="40" r="2.6" ${SOLID}/><circle cx="70" cy="34" r="2" ${SOLID}/>
<path d="M36,142 L80,60 H104 L150,142 Z" ${L3} stroke-width="2.4"/><path d="M80,60 Q92,66 104,60" stroke-width="2"/><path d="M90,64 Q84,90 92,110 Q88,124 94,140 M98,64 Q108,86 112,106" stroke-width="2.6"/>
<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="2"/><path d="M14,170 L22,54 M36,170 L28,54 M16,142 H34 M18,118 H32 M19,96 H31 M21,74 H29" stroke-width="1.8"/><path d="M22,56 H40" stroke-width="2.4"/>
<path d="M40,56 Q50,90 48,118" stroke-width="1.4"/>${`<g transform="translate(48,120) rotate(180)">${PERSON}</g>`}`,
	// Tonga: Buckelwal springt, Trilithon Ha'amonga am Ufer
	TO: () => `${birds(122, 22)}<path d="M0,98 V80 Q22,74 46,98 Z" ${L3} stroke-width="2"/><path d="M10,80 V64 M22,80 V64 M6,64 H26" stroke-width="3.2"/>${sea(98)}
<path d="M74,104 Q66,64 92,38 Q100,30 106,38 Q110,50 98,62 Q86,78 92,104 Z" ${SOLID}/><path d="M88,64 Q66,58 54,72 Q70,66 86,72 Z" ${SOLID}/><path d="M96,44 Q86,60 80,90 M100,48 Q92,62 86,92" stroke="var(--paper)" stroke-width="1.2"/>
<path d="M60,104 q-8,-12 -2,-20 M106,104 q8,-10 2,-20 M66,100 q-4,-6 0,-10" stroke-width="2"/><path d="M138,140 Q136,124 128,116 Q142,120 146,126 Q150,120 164,116 Q156,124 154,140 Z" ${SOLID}/><path d="M124,144 Q146,136 168,144" stroke-width="2"/>`,
	// São Tomé und Príncipe: Felsnadel Pico Cão Grande über dem Regenwald
	ST: () => `<path d="M0,120 Q40,90 70,104 L110,98 Q150,84 180,100 V170 H0 Z" ${L1} stroke-width="1.8"/><path d="M76,140 L80,62 Q84,30 90,22 Q96,30 98,62 L104,140 Z" ${L4} stroke-width="2.2"/><path d="M86,40 Q84,70 88,110 M94,52 Q96,80 94,120" stroke="var(--paper)" stroke-width="1.2"/>
${cloud(48, 78)}${cloud(100, 96)}${birds(130, 28)}<path d="M0,152 Q10,128 24,136 Q36,116 52,130 Q64,120 76,132 Q90,122 104,134 Q118,118 132,130 Q146,120 160,132 Q172,122 180,128 V170 H0 Z" ${L3} stroke-width="2"/>${palm(150, 168, 64, -10)}${palm(24, 168, 52, 8)}`,
	// Komoren: Dau vor dem Vulkan Karthala, Halbmond
	KM: () => `<circle cx="146" cy="30" r="12" ${SOLID}/><circle cx="152" cy="26" r="11" fill="var(--paper)" stroke="none"/>${[[118, 18], [126, 32], [120, 46], [108, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" ${SOLID}/>`).join('')}
<path d="M0,108 L44,58 Q52,52 60,58 L120,108 Z" ${L2} stroke-width="2"/><path d="M44,58 Q52,64 60,58" stroke-width="1.6"/><path d="M50,54 q-4,-8 2,-14" stroke-width="1.6" stroke-opacity=".6"/>${sea(108)}
<path d="M98,132 V62" stroke-width="2.4"/><path d="M58,100 L130,40 Q124,96 104,128 Z" ${L3} stroke-width="2"/><path d="M52,104 L134,36" stroke-width="2.8"/><path d="M48,130 Q60,146 124,144 L142,126 Z" ${SOLID}/>`,
	// Dschibuti: Kalkschlote am Lac Abbé, Flamingos
	DJ: () => `${sun(140, 30, 12)}<path d="M0,128 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,128 H180" stroke-width="2"/>
${[[24, 72, 22], [56, 52, 26], [88, 90, 16], [120, 64, 22], [158, 84, 18]].map(([x, top, w]) => `<path d="M${x - w},128 L${x - 4},${top} Q${x},${top - 6} ${x + 4},${top} L${x + w},128 Z" ${L3} stroke-width="2"/><path d="M${x - 2},${top + 14} L${x - 6},120 M${x + 4},${top + 22} L${x + 8},124" stroke-width="1.2"/><path d="M${x},${top - 4} q-6,-10 2,-18 q8,-8 0,-18" stroke-width="1.6" stroke-opacity=".5"/>`).join('')}
<ellipse cx="90" cy="152" rx="80" ry="10" ${L2} stroke="none"/>${at(46, 156, 1, FLAMINGO)}${at(64, 154, 0.9, FLAMINGO)}${at(112, 158, 1.1, FLAMINGO, true)}${at(132, 154, 0.9, FLAMINGO, true)}`,
	// Guinea-Bissau: Bijagós-Inseln – Mangroven, Flusspferd im Meer, Einbaum
	GW: () => `${sun(76, 30, 11)}${birds(118, 24)}<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 Q40,92 70,100 Z" ${SOLID}/>${palm(20, 98, 30, 4)}${palm(36, 98, 24, -3)}
<path d="M110,92 Q114,66 140,68 Q160,58 180,72 V100 H112 Z" ${SOLID}/><path d="M114,118 q6,-18 12,0 q6,-18 12,0 q6,-18 12,0 q6,-18 12,0 q6,-18 12,0 M120,100 L126,118 M144,100 L150,118 M168,100 L174,118" stroke-width="2"/>
${at(70, 140, 1.2, HIPPO)}<path d="M20,160 Q46,168 76,160 Q48,156 20,160 Z" ${SOLID}/><circle cx="46" cy="146" r="3" ${SOLID}/><path d="M46,150 V158 M40,166 L56,140" stroke-width="2"/><path d="${waves(90, 164, 6, 14, 2.4)}" stroke-width="1.4"/>`,
	// Burundi: königliche Trommler, Hügel und Bananenstauden
	BI: () => `${sun(146, 30, 11)}<path d="M0,96 Q30,72 60,90 Q90,70 124,88 Q152,72 180,86 V170 H0 Z" ${L1} stroke-width="2"/><path d="M0,120 Q40,100 80,116 Q130,98 180,114 V170 H0 Z" ${L2} stroke-width="2"/>
${[[22, 112], [154, 110]].map(([x, y]) => `<path d="M${x},${y + 30} V${y}" stroke-width="3"/><path d="M${x},${y} Q${x - 22},${y - 6} ${x - 26},${y + 10} Q${x - 12},${y + 2} ${x},${y} Q${x - 10},${y - 22} ${x - 4},${y - 30} Q${x},${y - 16} ${x},${y} Q${x + 8},${y - 24} ${x + 20},${y - 20} Q${x + 8},${y - 10} ${x},${y} Q${x + 22},${y - 4} ${x + 26},${y + 12} Q${x + 12},${y + 2} ${x},${y} Z" ${SOLID}/>`).join('')}
<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,150 H180" stroke-width="2"/>${at(56, 156, 1.1, DRUMMER)}${at(90, 154, 1.2, DRUMMER)}${at(124, 156, 1.1, DRUMMER)}`,
	// Sierra Leone: Löwenberge über der Freetown-Halbinsel, Fischerboote am Strand
	SL: () => `${sun(148, 30, 11)}${birds(74, 26)}<path d="M0,102 L18,74 Q30,58 44,70 L60,56 Q76,46 90,64 L106,80 Q120,68 134,82 L150,96 L180,90 V110 H0 Z" ${L3} stroke-width="2.2"/><path d="M0,110 H180 V136 H0 Z" ${L2} stroke="none"/><path d="${waves(6, 122, 12, 14, 2.4)}" stroke-width="1.6"/>
<path d="M0,136 Q90,128 180,138 V170 H0 Z" ${L1} stroke-width="2"/>${[[40, 148], [96, 152]].map(([x, y]) => `<path d="M${x - 26},${y - 4} Q${x - 22},${y + 6} ${x},${y + 6} Q${x + 22},${y + 6} ${x + 28},${y - 6} Z" ${SOLID}/><path d="M${x - 20},${y - 1} H${x + 22}" stroke="var(--paper)" stroke-width="1.4"/>`).join('')}${palm(158, 166, 70, -12)}`,
	// Liberia: Surfen bei Robertsport, Palmen am Strand
	LR: () => `${sun(76, 34, 12)}${birds(118, 22)}<path d="M0,84 H180 V170 H0 Z" ${L1} stroke="none"/>
<path d="M0,120 Q20,120 34,104 Q52,78 84,76 Q112,74 124,92 Q112,86 102,90 Q114,98 120,116 Q140,124 180,120 V170 H0 Z" ${L3} stroke-width="2.4"/><path d="M84,76 Q100,72 112,82" stroke="var(--paper)" stroke-width="2"/><path d="M40,116 Q60,104 90,108 M54,128 Q80,118 110,122" stroke="var(--paper)" stroke-width="1.6"/>
<path d="M76,108 L104,100" stroke-width="3.4"/><g transform="translate(90,104) rotate(-10)">${PERSON}</g><path d="M0,148 Q90,138 180,150 V170 H0 Z" ${L2} stroke-width="2"/>${palm(156, 166, 84, -14)}${palm(170, 166, 64, -8)}`,
	// Mauretanien: Erzzug durch die Sahara, einer der längsten Züge der Welt
	MR: () => `${sun(140, 36, 14)}<path d="M0,100 Q40,84 80,96 Q130,80 180,94 V170 H0 Z" ${L1} stroke-width="2"/>
<path d="M0,150 L180,132" stroke-width="2"/><path d="M0,156 L180,138" stroke-width="2"/>${Array.from({ length: 6 }, (_, i) => {
		const x = 2 + i * 28,
			y = f1(148 - i * 2.8);
		return `<path d="M${x},${y} L${x + 3},${y - 20} H${x + 23} L${x + 26},${y - 2.6} Z" ${L3} stroke-width="2"/><path d="M${x + 4},${y - 20} Q${x + 13},${y - 30} ${x + 22},${y - 22}" ${L4} stroke="none"/><circle cx="${x + 6}" cy="${y + 1}" r="2.4" ${SOLID}/><circle cx="${x + 20}" cy="${f1(y - 1)}" r="2.4" ${SOLID}/>`;
	}).join('')}<path d="M152,128 L152,100 H172 L180,108 V126 Z" ${SOLID}/><path d="M156,106 h10" stroke="var(--paper)" stroke-width="2"/><path d="M160,100 V92 q-4,-8 2,-14" stroke-width="1.8" stroke-opacity=".6"/>${at(60, 120, 0.55, PERSON)}${at(92, 116, 0.55, PERSON)}
<path d="M0,170 Q60,158 120,166 Q150,162 180,164 V170 Z" ${L2} stroke="none"/>`,
	// Niger: Lehm-Minarett der Großen Moschee von Agadez, Tuareg mit Dromedar
	NE: () => `${sun(146, 32, 11)}${birds(100, 22)}<path d="M50,130 L58,40 Q60,28 66,26 Q72,28 74,40 L82,130 Z" ${L3} stroke-width="2.4"/><path d="M58,26 H74 M66,26 V18" stroke-width="2.4"/>
${[46, 60, 74, 88, 102, 116].map((y) => `<path d="M${f1(54 - (130 - y) * -0.05)},${y} h-8 M${f1(78 + (130 - y) * -0.05)},${y} h8" stroke-width="2"/>`).join('')}
<path d="M20,130 V108 H44 V130 Z M88,130 V100 H134 V130 Z" ${L2} stroke-width="2"/><path d="M96,112 h6 M112,112 h6 M30,116 h6" stroke-width="2"/>
<path d="M0,130 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,130 H180" stroke-width="2"/>${at(118, 162, 1.3, CAMEL)}${at(100, 162, 1.05, PERSON)}<path d="M96,140 l-4,10" stroke-width="1.6"/>`,
	// Mali: Große Moschee von Djenné aus Lehm
	ML: () => `${sun(152, 28, 10)}${birds(70, 20)}<path d="M14,130 V84 H166 V130 Z" ${L2} stroke-width="2.2"/>
${[[30, 62, 14], [90, 44, 20], [150, 62, 14]].map(([x, top, w]) => `<path d="M${x - w / 2},84 V${top + 6} Q${x},${top - 6} ${x + w / 2},${top + 6} V84 Z" ${L3} stroke-width="2.2"/><path d="M${x},${top} V${top - 10}" stroke-width="2"/><circle cx="${x}" cy="${top - 12}" r="2.4" ${SOLID}/>`).join('')}
<path d="M44,84 V70 M58,84 V70 M72,84 V70 M108,84 V70 M122,84 V70 M136,84 V70" stroke-width="2.6"/>${[64, 76, 96, 110].map((y) => `<path d="M${y === 64 || y === 96 ? 20 : 26},${y} H${y === 64 || y === 96 ? 160 : 154}" stroke-width="1.6" stroke-dasharray="3 9"/>`).join('')}<path d="M80,130 V110 Q90,100 100,110 V130" ${SOLID}/>
<path d="M0,130 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,130 H180" stroke-width="2"/>${at(40, 160, 1, PERSON)}${at(140, 158, 0.9, PERSON)}<path d="M136,135 h8 v-4 h-8 z" ${SOLID}/>`,
	// Burkina Faso: bemalte Lehmhäuser von Tiébélé
	BF: () => `${sun(146, 28, 11)}${birds(64, 22)}<path d="M0,132 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,132 H180" stroke-width="2"/>
<path d="M12,132 V82 H96 V132 Z" ${L2} stroke-width="2.4"/><path d="M12,82 H96" stroke-width="3.4"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${12 + i * 12},96 l6,-10 l6,10 Z" ${i % 2 ? SOLID : L4}/>`).join('')}<path d="M12,102 H96 M12,120 H96" stroke-width="1.6"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${16 + i * 10},104 l5,6 l-5,6 l5,0" stroke-width="1.6"/>`).join('')}
<path d="M46,132 V112 Q54,104 62,112 V132 Z" ${SOLID}/><path d="M108,132 V96 Q108,84 130,84 Q152,84 152,96 V132 Z" ${L3} stroke-width="2.4"/><path d="M112,100 H148 M112,116 H148" stroke-width="2"/><path d="M118,108 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4" stroke-width="1.6"/><path d="M124,132 V120 H136 V132" ${SOLID}/>
${at(166, 164, 1, PERSON)}<path d="M160,140 q6,-6 12,0" stroke-width="1.4"/>`,
	// Äquatorialguinea: Pico Basilé auf Bioko, Meeresschildkröten am Strand von Ureca
	GQ: () => `${birds(100, 24)}<path d="M20,96 L74,40 Q82,34 90,40 L150,96 Z" ${L2} stroke-width="2"/><path d="M74,40 Q82,46 90,40" stroke-width="1.6"/><path d="M40,90 Q60,70 76,74 Q92,66 110,78 Q130,72 148,90" stroke-width="1.6" stroke-dasharray="3 5"/>
${sea(96, L2)}<path d="M0,126 Q90,116 180,128 V170 H0 Z" ${L1} stroke-width="2"/>${at(70, 152, 1.3, TURTLE)}<path d="M40,154 H48 M30,156 H38 M20,158 H28" stroke-width="2" stroke-dasharray="2 3"/>${at(130, 140, 0.8, TURTLE, true)}${palm(166, 166, 70, -10)}`,
	// Afghanistan: Felswand von Bamiyan mit Nischen, Pappeln im Tal
	AF: () => `${sun(150, 26, 10)}<path d="M0,128 V44 Q40,36 90,42 Q140,36 180,46 V128 Z" ${L3} stroke-width="2.2"/><path d="M10,60 V84 M28,50 V70 M150,58 V80 M170,66 V90" stroke-width="1.4"/>
<path d="M36,128 V78 Q36,60 50,60 Q64,60 64,78 V128 Z M112,128 V96 Q112,82 124,82 Q136,82 136,96 V128 Z" ${PAPER}/><path d="M36,128 V78 Q36,60 50,60 Q64,60 64,78 V128 M112,128 V96 Q112,82 124,82 Q136,82 136,96 V128" stroke-width="2.4"/>
${[[82, 70], [92, 76], [152, 106], [20, 100]].map(([x, y]) => `<path d="M${x - 3},${y + 10} V${y} Q${x},${y - 6} ${x + 3},${y} V${y + 10} Z" ${SOLID}/>`).join('')}
<path d="M0,128 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,128 H180" stroke-width="2"/>${[20, 34, 48, 140, 156, 170].map((x, i) => `<path d="M${x},160 V128" stroke-width="2"/><path d="M${x},${100 + (i % 3) * 6} Q${x - 7},${120} ${x},${136} Q${x + 7},${120} ${x},${100 + (i % 3) * 6} Z" ${SOLID}/>`).join('')}<path d="M70,170 Q90,150 110,170" stroke-width="2"/>`,
	// Tadschikistan: Pamir-Gebirge, Pamir Highway, Marco-Polo-Schaf
	TJ: () => `<path d="M0,96 L26,52 L40,66 L66,22 L92,62 L112,40 L140,74 L160,50 L180,70 V170 H0 Z" ${L1} stroke-width="2"/><path d="M66,22 L56,40 L64,36 L68,46 L74,38 L80,42 Z M112,40 L104,54 L112,50 L118,56 Z M26,52 L20,64 L27,60 L32,64 Z M160,50 L154,62 L161,58 L166,62 Z" ${L4} stroke="none"/>
<path d="M0,112 Q50,92 100,110 Q140,96 180,108 V170 H0 Z" ${L2} stroke-width="2"/><path d="M86,170 Q70,150 104,140 Q140,130 112,120 Q92,114 120,106" stroke-width="7" stroke="var(--paper)"/><path d="M86,170 Q70,150 104,140 Q140,130 112,120 Q92,114 120,106" stroke-width="1.4" stroke-dasharray="3 4"/>
${at(18, 154, 1.3, ARGALI)}${birds(126, 20)}`,
	// Kirgisistan: Jurten am Bergsee Song-Köl, Reiter
	KG: () => `<path d="M0,84 L24,50 L40,62 L64,32 L86,58 L108,40 L134,66 L154,46 L180,64 V100 H0 Z" ${L1} stroke-width="2"/><path d="M64,32 L56,46 L64,43 L68,50 L74,44 Z M108,40 L101,52 L108,49 L114,54 Z M154,46 L148,58 L155,55 L160,59 Z" ${L4} stroke="none"/>
<path d="M0,96 H180 V118 H0 Z" ${L2} stroke="none"/><path d="M0,96 H180 M10,106 H40 M70,110 H120 M140,104 H170" stroke-width="1.6"/><path d="M0,118 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,118 H180" stroke-width="2"/>
${at(30, 134, 0.9, YURT)}${at(70, 130, 0.7, YURT)}${at(104, 162, 1.3, horse(RIDER))}${at(150, 146, 0.8, horse())}${birds(118, 22)}`,
	// Jemen: Lehmhochhäuser von Schibam vor der Wadi-Wand, Drachenblutbaum von Sokotra
	YE: () => `${sun(152, 26, 10)}<path d="M0,84 Q40,72 90,78 Q140,70 180,80 V140 H0 Z" ${L1} stroke-width="2"/>
${[[56, 74, 18], [74, 60, 16], [90, 70, 18], [108, 56, 16], [124, 68, 18], [142, 78, 16], [66, 88, 14], [100, 84, 16], [132, 90, 14]].map(([x, top, w]) => `<path d="M${x},140 V${top + 2} L${x + 1},${top} H${x + w - 1} L${x + w},${top + 2} V140 Z" ${L3} stroke-width="1.8"/><path d="M${x + 4},${top + 8} h3 M${x + w - 7},${top + 8} h3 M${x + 4},${top + 20} h3 M${x + w - 7},${top + 20} h3 M${x + 4},${top + 32} h3" stroke-width="1.8"/>`).join('')}
<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(24, 166, 1.4, `<path d="M-3,0 Q-2,-14 -3,-22 H3 Q2,-14 3,0 Z" ${SOLID}/><path d="M0,-20 L-12,-32 M0,-20 L12,-32 M0,-22 L-4,-36 M0,-22 L5,-37 M-6,-26 L-18,-30 M6,-26 L18,-30" stroke-width="2.2"/><path d="M-26,-30 Q-14,-48 0,-46 Q14,-48 26,-30 Q0,-36 -26,-30 Z" ${SOLID}/>`)}`,
	// Syrien: Säulenstraße und Bogen von Palmyra in der Wüste
	SY: () => `${sun(150, 30, 12)}${birds(62, 22)}<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,124 H180" stroke-width="2"/><path d="M110,124 Q130,112 150,118 L160,124 Z" ${L2} stroke-width="1.6"/>
<path d="M40,124 V70 H112 V124 H96 V96 Q76,74 56,96 V124 Z" ${L3} stroke-width="2.2"/><path d="M36,70 H116 V62 H36 Z" ${SOLID}/><path d="M44,124 V102 Q48,96 52,102 V124 M100,124 V102 Q104,96 108,102 V124" ${PAPER}/><path d="M44,124 V102 Q48,96 52,102 V124 M100,124 V102 Q104,96 108,102 V124" stroke-width="1.6"/><path d="M48,80 v8 M104,80 v8" stroke-width="1.6"/>
${[8, 22, 126, 140, 154, 168].map((x, i) => `<path d="M${x},124 V${i === 3 ? 96 : 84}" stroke-width="5"/><path d="M${x - 5},${i === 3 ? 96 : 84} h10" stroke-width="3"/>`).join('')}<path d="M136,84 H174" stroke-width="3"/><path d="M60,150 l-4,-4 h10 z M130,156 h14" stroke-width="1.8"/>`,
	// Libyen: Oasensee von Ubari zwischen Sanddünen
	LY: () => `${sun(146, 30, 12)}<path d="M0,100 Q30,60 70,72 Q100,80 120,64 Q150,50 180,72 V120 H0 Z" ${L2} stroke-width="2.2"/><path d="M70,72 Q80,86 74,104 M120,64 Q130,82 122,106" stroke-width="1.6"/>
<ellipse cx="90" cy="128" rx="68" ry="12" ${L3} stroke="none"/><path d="M42,128 H70 M100,132 H130" stroke="var(--paper)" stroke-width="1.6"/>${palm(28, 126, 50, 6)}${palm(44, 126, 38, -4)}${palm(146, 124, 46, -6)}${palm(160, 124, 34, 4)}
<path d="M0,150 Q60,134 110,148 Q150,140 180,146 V170 H0 Z" ${L1} stroke-width="2"/>${at(120, 158, 0.8, CAMEL)}`,
	// Myanmar: Tempel von Bagan mit Heißluftballons
	MM: () => `${[[42, 38, 12], [112, 26, 10], [150, 54, 8]].map(([x, y, r]) => `<path d="M${x - r},${y} A${r},${r + 2} 0 1 1 ${x + r},${y} Q${x + r * 0.5},${y + r * 1.1} ${x + 3},${y + r * 1.4} H${x - 3} Q${x - r * 0.5},${y + r * 1.1} ${x - r},${y} Z" ${L3} stroke-width="1.8"/><path d="M${x},${y - r - 2} V${y + r * 1.4} M${x - r * 0.6},${y - r * 0.7} Q${x},${y + r} ${x + r * 0.6},${y - r * 0.7}" stroke-width="1.2"/><rect x="${x - 3}" y="${f1(y + r * 1.6)}" width="6" height="5" ${SOLID}/>`).join('')}
<path d="M0,122 Q90,112 180,124 V170 H0 Z" ${L1} stroke-width="2"/>${[[30, 120, 0.7], [140, 118, 0.6], [86, 132, 1.1]].map(([x, y, s]) => at(x, y, s, `<path d="M-30,0 V-14 H30 V0 Z M-22,-14 V-24 H22 V-14 Z M-14,-24 V-32 H14 V-24 Z" ${L3} stroke-width="2"/><path d="M-8,-32 Q0,-56 8,-32 Z" ${SOLID}/><path d="M0,-50 V-60" stroke-width="2"/><path d="M-6,0 V-8 Q0,-12 6,-8 V0" ${SOLID}/>`)).join('')}
${[12, 60, 116, 166].map((x) => `<path d="M${x},150 V138" stroke-width="2"/><circle cx="${x}" cy="134" r="6" ${SOLID}/>`).join('')}`,
	// Laos: Mönche beim Almosengang vor dem Tempel Wat Xieng Thong in Luang Prabang
	LA: () => `${sun(152, 28, 10)}<path d="M20,70 L56,50 H124 L160,70 Z" ${SOLID}/><path d="M30,88 L60,66 H120 L150,88 Z" ${L4} stroke-width="1.6"/><path d="M14,70 l-6,-6 M166,70 l6,-6 M24,88 l-6,-6 M156,88 l6,-6" stroke-width="2"/><path d="M90,50 V38" stroke-width="2"/>
<path d="M36,88 V124 H144 V88" ${L2} stroke-width="2"/><path d="M80,124 V100 H100 V124" ${SOLID}/><path d="M50,96 V116 M64,96 V116 M116,96 V116 M130,96 V116" stroke-width="2"/>
<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,124 H180" stroke-width="2"/>${[30, 62, 94, 126, 158].map((x) => at(x, 162, 1.1, `<circle cx="0" cy="-26" r="3.2" ${SOLID}/><path d="M-3,-22 H3 L8,0 H-8 Z" ${L4} stroke-width="1.4"/><path d="M-4,-20 L6,-6" stroke="var(--paper)" stroke-width="1.4"/><path d="M-1,-14 Q3,-10 7,-14 Z" ${SOLID}/>`)).join('')}`,
	// Osttimor: Cristo-Rei-Statue auf der Landzunge vor Dili
	TL: () => `${sun(40, 52, 10)}${birds(122, 24)}<path d="M64,110 Q84,70 112,62 Q140,58 160,86 L180,96 V110 Z" ${L3} stroke-width="2.2"/>
<circle cx="114" cy="54" r="9" ${L2} stroke-width="1.8"/><path d="M106,54 Q114,50 122,54" stroke-width="1.2"/><path d="M111,46 L112,24 H116 L117,46 Z" ${SOLID}/><circle cx="114" cy="20" r="3.4" ${SOLID}/><path d="M102,30 H126" stroke-width="3"/><path d="M110,24 L118,24 L120,46 H108 Z" ${SOLID}/>
${sea(110)}<path d="M0,150 Q60,140 110,152 Q150,146 180,150 V170 H0 Z" ${L1} stroke-width="2"/>${palm(22, 160, 70, 10)}`,
	// Papua-Neuguinea: Paradiesvogel mit Schmuckfedern im Regenwald
	PG: () => `${sun(150, 28, 10)}<path d="M0,110 Q20,80 40,92 Q56,66 80,82 Q100,62 124,80 Q146,64 180,84 V170 H0 Z" ${L1} stroke-width="2"/><path d="M0,146 Q30,124 60,140 Q90,122 120,138 Q150,124 180,136 V170 H0 Z" ${L2} stroke-width="2"/>
<path d="M0,90 Q80,100 180,80" stroke-width="3.6"/><path d="M150,84 q6,-12 18,-12 M30,92 q-4,-12 -16,-14" stroke-width="2"/>${[[162, 72], [16, 78], [124, 88]].map(([x, y]) => `<path d="M${x - 9},${y} q9,-11 18,0 q-9,7 -18,0 Z" ${L4} stroke="none"/>`).join('')}
${at(100, 94, 1.6, `<path d="M-8,-6 Q-34,-6 -48,24 Q-38,10 -26,12 Q-36,22 -38,42 Q-24,20 -12,22 Q-16,34 -10,50 Q-2,26 0,-2 Z" ${L3} stroke-width="1.2"/><path d="M-10,-4 Q-30,6 -40,22 M-8,0 Q-22,16 -28,32 M-6,2 Q-12,20 -12,40" stroke-width="1"/><path d="M-10,0 Q-14,-16 -2,-22 Q8,-26 12,-16 Q12,-6 4,0 Z" ${SOLID}/><circle cx="8" cy="-24" r="5.4" ${SOLID}/><path d="M13,-26 L20,-23 L13,-21" ${SOLID}/><circle cx="9" cy="-25" r="1.2" ${PAPER}/><path d="M2,0 Q10,30 2,52 Q-2,58 4,62 M5,0 Q16,26 12,48 Q10,54 16,56" stroke-width="1.1"/>`)}`,
	// Guinea: Wasserfall „Brautschleier“ im Hochland Fouta Djallon
	GN: () => `${sun(152, 26, 10)}${birds(64, 22)}<path d="M0,40 H76 Q80,40 80,46 V120 H0 Z M110,46 Q110,40 116,40 H180 V120 H110 Z" ${L3} stroke-width="2.2"/><path d="M10,56 l6,16 M40,50 l-4,20 M130,58 l4,18 M160,52 l-6,22" stroke-width="1.4"/>
<path d="M80,46 Q95,42 110,46 V120 H80 Z" ${L1} stroke="none"/><path d="M84,46 Q82,80 86,120 M90,44 Q88,84 92,120 M96,44 Q96,84 98,120 M102,44 Q104,84 104,120 M108,46 Q110,80 108,120" stroke-width="1.6"/>
<path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M60,124 Q95,110 130,124" stroke="var(--paper)" stroke-width="2"/><path d="${waves(10, 140, 12, 14, 2.4)}" stroke-width="1.6"/>
<path d="M0,150 Q10,128 26,136 Q34,122 48,134 L50,170 H0 Z M180,150 Q170,128 154,136 Q146,122 132,134 L130,170 H180 Z" ${SOLID}/>`,
	// Gambia: Gambia-Fluss mit Einbaum, Baobab, Krokodil
	GM: () => `${sun(146, 30, 11)}${birds(72, 22)}<path d="M0,100 Q90,92 180,100 V112 H0 Z" ${L1} stroke-width="2"/>${at(40, 104, 1.1, BAOBAB)}${palm(120, 102, 34, 4)}${palm(134, 102, 28, -3)}
<path d="M0,112 H180 V170 H0 Z" ${L2} stroke="none"/><path d="${waves(4, 124, 12, 14, 2.4)}" stroke-width="1.6"/><path d="M80,138 Q108,146 140,138 Q108,134 80,138 Z" ${SOLID}/><circle cx="110" cy="122" r="3" ${SOLID}/><path d="M110,126 V136 M100,146 L120,118" stroke-width="2"/>
${at(50, 158, 1.1, CROC)}`,
	// Mongolei: Adlerjäger zu Pferd, Jurte in der Steppe
	MN: () => `${sun(150, 28, 11)}<path d="M0,104 Q40,80 80,96 Q120,78 180,96 V170 H0 Z" ${L1} stroke-width="2"/><path d="M0,128 Q60,116 120,130 Q150,124 180,128 V170 H0 Z" ${L2} stroke-width="2"/>${at(150, 118, 0.9, YURT)}${at(122, 120, 0.6, YURT)}
${at(42, 160, 1.9, horse(`${RIDER}<path d="M17,-38 Q14,-44 20,-44 Q24,-42 20,-38" ${SOLID}/><path d="M24,-27 Q16,-44 1,-43 Q12,-37 22,-26 Z M27,-27 Q36,-46 52,-45 Q39,-38 29,-26 Z" ${SOLID}/><circle cx="25.5" cy="-28" r="2.8" ${SOLID}/>`))}${birds(70, 24)}`,
	// Republik Kongo: Silberrücken-Gorilla im Regenwald von Odzala
	CG: () => `<path d="M0,0 H180 V120 H0 Z" ${L1} stroke="none"/>${[[18, 6], [62, 0], [118, 4], [162, 10]].map(([x, y]) => `<path d="M${x},120 V${y + 40}" stroke-width="4"/><path d="M${x - 24},${y + 44} Q${x - 26},${y + 16} ${x},${y + 14} Q${x + 26},${y + 16} ${x + 24},${y + 44} Q${x},${y + 36} ${x - 24},${y + 44} Z" ${L3} stroke-width="1.8"/>`).join('')}<path d="M40,60 Q44,90 36,120 M140,50 Q130,84 138,120" stroke-width="1.4"/>
<path d="M0,120 Q90,110 180,122 V170 H0 Z" ${L2} stroke-width="2"/>${at(92, 158, 1.5, `<path d="M-18,0 Q-24,-22 -14,-34 Q-6,-42 6,-40 Q16,-38 18,-28 L22,-22 Q24,-12 20,-6 L22,0 Z" ${SOLID}/><path d="M2,-42 Q10,-50 16,-42 Q20,-36 18,-28 Q12,-30 8,-34 Z" ${SOLID}/><path d="M-14,-30 Q-4,-38 8,-34" stroke="var(--paper)" stroke-width="2.6" stroke-opacity=".5"/><path d="M10,-24 Q16,-12 12,0" stroke="var(--paper)" stroke-width="1.4"/><circle cx="14" cy="-36" r="1.2" ${PAPER}/><path d="M8,-26 Q20,-18 20,0 H13 Q14,-14 4,-20 Z" ${SOLID}/><path d="M6,-24 Q16,-16 14,0" stroke="var(--paper)" stroke-width="1.4"/>`)}
${[[24, 160], [150, 162], [176, 150]].map(([x, y]) => `<path d="M${x},${y} q-10,-16 -18,-14 M${x},${y} q-2,-20 6,-26 M${x},${y} q10,-14 18,-12" stroke-width="2"/>`).join('')}`,
	// Gabun: Waldelefant am Strand von Loango, Flusspferd in der Brandung
	GA: () => `${sun(76, 30, 11)}${birds(120, 22)}<path d="M0,86 H180 V122 H0 Z" ${L2} stroke="none"/><path d="${waves(0, 98, 13, 14, 3)}" stroke-width="1.8"/><path d="M0,112 Q30,104 60,112 Q90,104 120,112 Q150,104 180,112" stroke="var(--paper)" stroke-width="2"/>${at(130, 112, 0.9, HIPPO)}
<path d="M0,118 Q90,112 180,120 V170 H0 Z" ${L1} stroke-width="2"/>${at(56, 160, 1.5, ELEPHANT)}${palm(162, 166, 76, -12)}<path d="M120,154 h3 M30,164 h3 M144,160 h3" stroke-width="1.6"/>`,
	// Malawi: Malawisee – Fischer im Einbaum, bunte Buntbarsche unter Wasser
	MW: () => `${sun(146, 30, 11)}${birds(70, 22)}<path d="M0,82 Q20,70 40,80 Q60,72 74,82 Z" ${L3} stroke-width="1.8"/><path d="M0,82 H180 V100 H0 Z" ${L1} stroke="none"/>
<path d="M60,98 Q90,106 124,98 Q92,94 60,98 Z" ${SOLID}/><circle cx="96" cy="78" r="3.2" ${SOLID}/><path d="M96,82 V96 M84,104 L110,72" stroke-width="2.2"/><path d="M0,100 H180" stroke-width="2.4"/>
<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,170 V150 Q14,138 28,148 Q40,136 54,150 L60,170 Z M120,170 L126,152 Q140,136 156,148 Q168,140 180,146 V170 Z" ${L4} stroke-width="1.8"/>
${[[40, 118, 1], [80, 128, 1.2], [118, 116, 0.9], [100, 146, 1], [150, 124, 1.1], [64, 150, 0.8]].map(([x, y, s], i) => at(x, y, s, `<path d="M-10,0 Q0,-8 10,0 Q0,8 -10,0 Z M-10,0 L-17,-5 V5 Z" ${i % 2 ? SOLID : PAPER} stroke="currentColor" stroke-width="1.4"/><path d="M-2,-5 V5 M3,-4 V4" stroke="${i % 2 ? 'var(--paper)' : 'currentColor'}" stroke-width="1.2"/>`, i % 3 === 0)).join('')}<path d="M20,140 q-2,-6 2,-10 M168,130 q-2,-6 2,-10" stroke-width="1.4"/>`,
	// Mosambik: Wanderdüne von Bazaruto, Dau, Walhai im klaren Wasser
	MZ: () => `${sun(150, 28, 11)}<path d="M0,100 Q20,50 70,46 Q110,46 130,98 Z" ${L2} stroke-width="2.2"/><path d="M70,46 Q86,66 92,98" stroke-width="1.6"/><path d="M20,80 h6 M40,64 h6 M104,70 h6" stroke-width="1.6"/>
<path d="M0,98 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,98 H180" stroke-width="2.2"/><path d="M128,94 Q142,104 168,100 L174,92 Z" ${SOLID}/><path d="M150,96 L148,58 Q164,70 170,90 Z" ${L3} stroke-width="1.8"/><path d="M146,62 L172,92" stroke-width="2.2"/>
<path d="${waves(10, 110, 12, 14, 2.4)}" stroke-width="1.6"/>${at(84, 146, 1.4, `<path d="M-40,0 Q-20,-14 14,-12 Q30,-10 36,-2 Q30,6 14,8 Q-20,10 -40,0 Z M-40,0 L-54,-12 L-50,0 L-54,10 Z M-4,-12 L4,-22 L8,-12 Z" ${SOLID}/><path d="M28,0 h6" stroke="var(--paper)" stroke-width="1.6"/>${[[-26, -2], [-16, -6], [-14, 2], [-4, -4], [-2, 4], [8, -6], [10, 2], [18, -2], [-30, 3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" ${PAPER}/>`).join('')}`)}`,
	// Angola: Wasserfälle von Kalandula
	AO: () => `${sun(116, 26, 10)}${birds(60, 20)}<path d="M0,56 Q90,48 180,58 V70 H0 Z" ${SOLID}/>${palm(16, 54, 26, 3)}${palm(162, 56, 22, -3)}
<path d="M0,70 H180 V126 H0 Z" ${L1} stroke="none"/>${[[6, 34], [44, 40], [92, 30], [128, 46]].map(([x, w]) => `<path d="M${x},70 H${x + w} V126 H${x} Z" ${L2} stroke="none"/>${Array.from({ length: Math.floor(w / 6) }, (_, i) => `<path d="M${x + 3 + i * 6},72 Q${x + 2 + i * 6},100 ${x + 4 + i * 6},124" stroke-width="1.4"/>`).join('')}`).join('')}<path d="M40,70 V126 M84,70 V110 M122,70 V126 M174,70 V118" stroke-width="2.6"/>
${cloud(20, 128)}${cloud(76, 126)}${cloud(126, 130)}<path d="M0,134 H180 V170 H0 Z" ${L2} stroke="none"/><path d="${waves(4, 146, 12, 14, 2.4)}" stroke-width="1.6"/><path d="${waves(10, 158, 12, 14, 2.4)}" stroke-width="1.4"/>`,
	// Äthiopien: Felsenkirche Bete Giyorgis in Lalibela (in den Fels gehauen, kreuzförmig)
	ET: () => `<path d="M0,34 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,34 Q90,26 180,34" stroke-width="2"/><path d="M24,46 H156 L168,160 H12 Z" ${L3} stroke-width="2.4"/><path d="M24,46 L36,64 H144 L156,46 M36,64 L28,160 M144,64 L152,160" stroke-width="1.4"/>
<path d="M74,58 H106 V86 H134 V118 H106 V150 H74 V118 H46 V86 H74 Z" ${L2} stroke-width="2.6"/><path d="M80,64 H100 V92 H128 V112 H100 V144 H80 V112 H52 V92 H80 Z" stroke-width="1.8"/><path d="M84,70 H96 V96 H122 V108 H96 V138 H84 V108 H58 V96 H84 Z" ${SOLID}/>
${at(120, 42, 0.6, PERSON)}${at(150, 42, 0.6, PERSON)}`,
	// Sudan: Pyramiden von Meroe in den Dünen
	SD: () => `${sun(146, 32, 13)}${birds(66, 22)}<path d="M0,116 Q50,98 100,110 Q140,100 180,108 V170 H0 Z" ${L1} stroke-width="2"/>
${[[30, 66, 18], [62, 50, 22], [100, 58, 20], [134, 72, 16], [160, 84, 12]].map(([x, top, w]) => `<path d="M${x - w},${120 - (x > 120 ? 6 : 0)} L${x},${top} L${x + w},${120 - (x > 120 ? 6 : 0)} Z" ${L3} stroke-width="2"/><path d="M${x},${top} L${x + w},${120 - (x > 120 ? 6 : 0)}" stroke-width="2"/><path d="M${x - w * 0.25},${f1(top + (120 - top) * 0.25)} h${f1(w * 0.5)}" stroke-width="1.2"/><path d="M${x - w - 6},${120 - (x > 120 ? 6 : 0)} V${f1(126 - (x > 120 ? 6 : 0) - (120 - top) * 0.25)} H${x - w * 0.6}" ${L2} stroke-width="1.6"/>`).join('')}
<path d="M0,136 Q60,124 120,138 Q150,132 180,136 V170 H0 Z" ${L2} stroke-width="2"/>${at(126, 162, 0.9, CAMEL)}`,
	// Irak: Zikkurat von Ur zwischen Dattelpalmen
	IQ: () => `${sun(150, 28, 12)}${birds(60, 26)}<path d="M18,130 V108 H162 V130 Z" ${L3} stroke-width="2.2"/><path d="M38,108 V86 H142 V108 Z" ${L2} stroke-width="2.2"/><path d="M64,86 V68 H116 V86 Z" ${L3} stroke-width="2.2"/><path d="M78,68 V58 H102 V68 Z" ${SOLID}/>
<path d="M82,130 L86,86 H94 L98,130 Z" ${PAPER}/><path d="M82,130 L86,86 H94 L98,130 M84,120 H96 M85,108 H95 M86,96 H94" stroke-width="1.6"/>${[26, 34, 146, 154].map((x) => `<path d="M${x},116 V${x < 100 ? 124 : 124}" stroke-width="1.6"/>`).join('')}<path d="M24,118 H72 M108,118 H156 M46,96 H74 M106,96 H134" stroke-width="1.4" stroke-dasharray="3 3"/>
<path d="M0,130 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,130 H180" stroke-width="2"/>${palm(14, 168, 64, 6)}${palm(30, 168, 46, -4)}${palm(160, 168, 58, -6)}`,
	// Iran: Schah-Moschee in Isfahan, gespiegelt im Wasserbecken
	IR: () => `${birds(30, 50)}<path d="M54,96 Q54,56 90,46 Q126,56 126,96 Z" ${L3} stroke-width="2.4"/><path d="M90,46 V34" stroke-width="2"/><circle cx="90" cy="32" r="2.6" ${SOLID}/><path d="M64,90 Q66,64 90,54 Q114,64 116,90" stroke-width="1.2" stroke-dasharray="2 4"/>
<path d="M58,96 H122 V104 H58 Z" ${SOLID}/><path d="M28,124 V36 M38,124 V36 M142,124 V36 M152,124 V36" stroke-width="5"/><path d="M26,40 h14 M140,40 h14" stroke-width="3"/><path d="M33,36 V28 M147,36 V28" stroke-width="2"/>
<path d="M46,124 V104 H134 V124 Z" ${L2} stroke-width="2"/><path d="M76,124 V114 Q90,102 104,114 V124" ${SOLID}/><path d="M54,110 V120 M64,110 V120 M116,110 V120 M126,110 V120" stroke-width="2"/>
<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M20,132 H160 V162 H20 Z" ${L2} stroke-width="2"/><path d="M54,134 Q90,160 126,134 M28,134 V160 M152,134 V160" stroke-width="1.4" stroke-dasharray="2 4"/>`,
	// Kuba: Oldtimer vor bunten Kolonialfassaden in Havanna
	CU: () => `<path d="M0,40 H58 V130 H0 Z" ${L2} stroke-width="2"/><path d="M58,54 H120 V130 H58 Z" ${L1} stroke-width="2"/><path d="M120,34 H180 V130 H120 Z" ${L3} stroke-width="2"/><path d="M0,40 H58 M58,54 H120 M120,34 H180" stroke-width="3.4"/>
${[[10, 56], [34, 56], [10, 88], [34, 88], [68, 68], [96, 68], [130, 50], [156, 50], [130, 82], [156, 82]].map(([x, y]) => `<path d="M${x},${y + 20} V${y + 5} Q${x + 7},${y - 3} ${x + 14},${y + 5} V${y + 20} Z" ${PAPER}/><path d="M${x},${y + 20} V${y + 5} Q${x + 7},${y - 3} ${x + 14},${y + 5} V${y + 20}" stroke-width="1.6"/><path d="M${x - 3},${y + 20} H${x + 17} M${x - 2},${y + 20} V${y + 26} M${x + 16},${y + 20} V${y + 26}" stroke-width="1.6"/>`).join('')}
<path d="M0,130 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,130 H180" stroke-width="2"/><path d="M22,156 V144 Q24,138 36,137 L52,126 H100 L118,137 H146 Q158,138 160,146 V156 Z" ${SOLID}/><path d="M58,129 H76 V137 H52 Z M80,129 H96 L110,137 H80 Z" ${PAPER}/><path d="M22,148 H160" stroke="var(--paper)" stroke-width="1.4"/><circle cx="50" cy="156" r="8" ${SOLID}/><circle cx="132" cy="156" r="8" ${SOLID}/><circle cx="50" cy="156" r="3" ${PAPER}/><circle cx="132" cy="156" r="3" ${PAPER}/>${palm(170, 132, 60, -8)}`,
	// Venezuela: Salto Ángel, der höchste Wasserfall der Welt, vom Tafelberg
	VE: () => `${birds(140, 70)}<path d="M0,40 Q10,36 30,36 H150 Q170,36 180,42 V132 H0 Z" ${L3} stroke-width="2.4"/><path d="M0,40 Q90,30 180,42" stroke-width="2"/>${cloud(56, 40)}${cloud(124, 34)}<path d="M20,56 l4,40 M48,48 l-2,50 M140,54 l4,46 M164,60 l-2,40" stroke-width="1.4"/>
<path d="M82,38 Q80,90 86,132 H96 Q94,90 92,38 Z" ${PAPER}/><path d="M84,40 Q82,90 88,132 M90,40 Q90,90 94,132" stroke-width="1.4"/>${cloud(66, 136)}
<path d="M0,170 V146 Q10,130 24,138 Q36,124 50,136 Q64,126 78,140 Q100,128 116,138 Q130,124 146,136 Q162,126 180,134 V170 Z" ${SOLID}/>`,
	// Bhutan: Tigernest über dem Paro-Tal, Gebetsfahnen, Himalaya-Gipfel
	BT: () => `<circle cx="132" cy="34" r="17" ${SOLID}/><circle cx="132" cy="34" r="25" ${DOTS}/>
<path d="M0,112 L26,66 L42,84 L72,30 L104,88 L124,62 L180,112 V170 H0 Z" ${L1} stroke-width="2"/><path d="M72,30 L62,46 L70,43 L74,52 L80,43 L86,47 Z M26,66 L19,78 L26,75 L32,80 Z M124,62 L117,74 L124,72 L130,77 Z" ${L4} stroke="none"/>
<path d="M0,128 Q30,104 60,122 Q92,100 120,126 L180,116 V170 H0 Z" ${L2} stroke-width="2"/>
<path d="M104,170 Q96,128 108,100 Q104,76 114,56 H180 V170 Z" ${L3} stroke-width="2.6"/><path d="M118,70 l12,10 M140,96 l12,6 M116,112 l10,12 M150,134 l12,8 M128,150 l9,10" stroke-width="1.6"/>
<path d="M58,106 Q76,98 100,104" stroke-width="3.2"/>
<path d="M46,92 L62,82 H92 L106,92 Z" ${SOLID}/><rect x="52" y="92" width="48" height="16" fill="var(--paper)" stroke-width="2.4"/><path d="M60,96 V104 M70,96 V104 M80,96 V104 M90,96 V104" stroke-width="2.2"/>
<path d="M60,76 L72,66 H92 L100,76 Z" ${SOLID}/><rect x="64" y="76" width="30" height="7" fill="var(--paper)" stroke-width="2"/><path d="M76,66 V56 M72,59 H80 M76,56 l0,-5" stroke-width="1.8"/>
<path d="M26,112 L38,103 H62 L70,112 Z" ${SOLID}/><rect x="30" y="112" width="34" height="14" fill="var(--paper)" stroke-width="2.4"/><path d="M38,116 V122 M47,116 V122 M56,116 V122" stroke-width="2.2"/>
<path d="M0,22 Q40,52 104,36" stroke-width="1.6"/>${[14, 30, 46, 62, 78, 94].map((x, i) => `<rect x="${x - 3}" y="${[24, 32, 38, 42, 42, 38][i]}" width="7" height="9" ${i % 3 === 0 ? SOLID : i % 3 === 1 ? L3 : 'fill="var(--paper)"'} stroke-width="1.4"/>`).join('')}
${pine(14, 170, 52)}${pine(34, 170, 38, L4)}${pine(160, 170, 44)}<path d="M4,150 q6,-8 12,0 M138,16 q5,-6 10,0 q5,-6 10,0 M150,68 q4,-5 8,0 q4,-5 8,0" stroke-width="1.8"/>
<path d="${waves(0, 160, 13, 14, 3)}" stroke-width="2" stroke="var(--paper)"/><path d="${waves(4, 166, 12, 14, 3)}" stroke-width="2"/>`
};
