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

/* ---------- Motive je Seltenheit: [Rare, Epic, Legendary], von Stufe zu Stufe detaillierter ---------- */
/** Weißes Markenpapier (heller als der getönte Bildgrund): Schnee, Gischt, Polarlicht */
const SNOW = 'fill="var(--stp)"';
/** Nachthimmel und Sterne: hell wie dunkel gleich (sonst kehrt sich der Himmel im dunklen Modus um) */
const NIGHT = 'style="fill:color-mix(in srgb,currentColor 28%,#0D2B3A)"',
	STAR = 'fill="#F4F7FA"';
const grass = (x: number, y: number) => `<path d="M${x},${y} l-3,-6 M${x},${y} v-7 M${x},${y} l3,-6" stroke-width="1.4"/>`;
const dots = (pts: number[][], f = SOLID) => pts.map(([x, y, r = 1.4]) => `<circle cx="${x}" cy="${y}" r="${r}" ${f}/>`).join('');
const rays = (x: number, y: number, r: number, n = 12) =>
	`<path d="${Array.from({ length: n }, (_, i) => {
		const a = (i / n) * Math.PI * 2,
			c = Math.cos(a),
			s = Math.sin(a);
		return `M${f1(x + c * (r + 4))},${f1(y + s * (r + 4))} L${f1(x + c * (r + 10))},${f1(y + s * (r + 10))}`;
	}).join(' ')}" stroke-width="1.8"/>`;
/** Pyramide mit Schattenseite, d = Steinlagen */
const pyr = (x: number, y: number, h: number, d = false) => {
	const w = f1(h * 0.85);
	let s = `<path d="M${f1(x - w)},${y} L${x},${y - h} L${f1(x + w)},${y} Z" ${L2} stroke-width="2.2"/><path d="M${x},${y - h} L${f1(x + w)},${y} H${f1(x + w * 0.2)} Z" ${L4} stroke="none"/>`;
	if (d) for (const k of [0.2, 0.4, 0.6, 0.8]) s += `<path d="M${f1(x - w * (1 - k))},${f1(y - h * k)} H${f1(x + w * 0.2 * (1 - k))}" stroke-width="1" stroke-dasharray="3 3"/>`;
	return s;
};
const FELUCCA = `<path d="M-22,0 Q0,7 22,0 Z" ${SOLID}/><path d="M-2,0 V-40" stroke-width="2"/><path d="M-16,-6 L8,-48" stroke-width="1.8"/><path d="M-14,-8 L7,-46 Q13,-24 6,-4 Z" ${L3} stroke-width="1.4"/>`;
const CAMEL_RIDER = `${CAMEL}<circle cx="14" cy="-34" r="2.8" ${SOLID}/><path d="M14,-31 V-23 M14,-29 L21,-27" stroke-width="2.4"/><path d="M10,-36 Q14,-41 18,-36" ${SOLID}/>`;
const PAPYRUS = (x: number, y: number) =>
	`<path d="M${x},170 Q${x - 2},${y + 14} ${x},${y}" stroke-width="1.6"/><path d="M${x},${y} l-7,-6 M${x},${y} l-3,-9 M${x},${y} l3,-9 M${x},${y} l7,-6" stroke-width="1.3"/>`;
/** Fuji mit Schneekappe; d = Schneerinnen */
const fuji = (d = false) =>
	`<path d="M-4,132 L58,72 Q90,52 122,72 L184,132 Z" ${L2} stroke-width="2.2"/><path d="M58,72 Q90,52 122,72 L130,80 L120,78 L112,88 L104,80 L96,90 L88,80 L80,88 L72,78 L62,82 L50,80 Z" ${SNOW} stroke-width="1.8"/>${
		d ? `<path d="M70,96 L64,112 M84,98 L82,116 M98,100 L100,118 M114,96 L120,112 M44,102 L36,114 M138,100 L148,112" stroke-width="1.2" stroke-dasharray="4 3"/>` : ''
	}`;
const pagoda = (n = 5) => {
	let s = '',
		y = 0;
	for (let i = 0; i < n; i++) {
		const w = 20 - i * 2.6;
		s += `<path d="M${f1(-w + 6)},${y} V${y - 6} H${f1(w - 6)} V${y}" ${L2} stroke-width="1.4"/><path d="M${f1(-w - 3)},${y - 5} L${f1(-w + 5)},${y - 11} H${f1(w - 5)} L${f1(w + 3)},${y - 5} Q0,${y - 8} ${f1(-w - 3)},${y - 5} Z" ${SOLID}/>`;
		y -= 11;
	}
	return `${s}<path d="M0,${y} V${y - 14}" stroke-width="1.8"/><path d="M-2,${y - 4} H2 M-2,${y - 8} H2" stroke-width="1.4"/>`;
};
const TORII = `<path d="M-11,0 V-28 M11,0 V-28" stroke-width="3.4"/><path d="M-15,-21 H15" stroke-width="2.6"/><path d="M-21,-29 Q0,-26 21,-29 L23,-35 Q0,-31 -23,-35 Z" ${SOLID}/>`;
/** Kirschzweig aus der Ecke oben rechts; p = fallende Blütenblätter */
const sakura = (p = false) =>
	`<path d="M184,6 Q156,12 136,30 M156,14 Q150,4 142,-2 M142,26 Q130,26 122,36" stroke-width="2.6"/>${[[136, 30], [142, 22], [126, 34], [150, 14], [143, 4], [120, 38], [160, 10], [131, 26], [168, 6]]
		.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" ${L3} stroke="none"/><circle cx="${x}" cy="${y}" r="1.2" ${SNOW} stroke="none"/>`)
		.join('')}${p ? [[112, 52], [128, 60], [150, 44], [104, 70], [160, 64]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.4" transform="rotate(30 ${x} ${y})" ${L3} stroke="none"/>`).join('') : ''}`;
const GIRAFFE = `<g transform="translate(-40,-76)"><path d="M20,50 Q22,44 30,44 L40,42 L52,14 Q53,10 57,10 L62,12 Q63,15 60,16 L56,17 L46,46 Q46,52 44,56 V76 H41 V58 H38 V76 H35 V58 H28 V76 H25 V58 L23,57 V76 H20 V56 Q19,53 20,50 Z" ${SOLID}/><path d="M54,11 L53,6 M57,10 L57.5,5" stroke-width="2"/><path d="M20,50 Q16,54 17,62" stroke-width="1.8"/>${dots([[26, 50, 2.2], [33, 49, 2.4], [40, 47.5, 2], [45.5, 38, 1.6], [48.5, 30, 1.5], [51.5, 22, 1.2], [30, 54.5, 1.4], [38, 53, 1.5]], PAPER)}</g>`;
const kili = (y = 112) =>
	`<path d="M0,${y} Q40,${y - 10} 70,${y - 40} Q90,${y - 50} 110,${y - 40} Q140,${y - 12} 180,${y - 4} V${y + 16} H0 Z" ${L1} stroke-width="1.8"/><path d="M70,${y - 40} Q90,${y - 50} 110,${y - 40} L104,${y - 35} L98,${y - 40} L92,${y - 33} L86,${y - 40} L80,${y - 34} Z" ${SNOW} stroke-width="1.4"/>`;
const BALLOON = `<path d="M0,-58 C-18,-58 -20,-38 -10,-26 L-4,-14 H4 L10,-26 C20,-38 18,-58 0,-58 Z" ${L3} stroke-width="1.6"/><path d="M0,-58 C-7,-48 -7,-30 -4,-14 M0,-58 C7,-48 7,-30 4,-14" stroke-width="1.2"/><path d="M-4,-14 L-3,-6 M4,-14 L3,-6" stroke-width="1"/><rect x="-4" y="-6" width="8" height="6" ${SOLID}/>`;
const MAASAI = `${PERSON}<path d="M-3,-17 H3 L5,-5 H-5 Z" ${L4} stroke-width="1.2"/><path d="M6,4 L9,-34" stroke-width="1.4"/>`;
/** Kirkjufell, Islands „Kirchberg“ */
const KIRKJU = `M16,124 Q50,118 66,96 Q78,60 96,56 Q110,58 124,90 Q138,116 172,124 Z`;
const aurora = (f: string) =>
	`<path d="M40,58 Q76,26 112,46 Q144,64 184,36 V52 Q146,80 112,62 Q76,44 40,72 Z" ${f} stroke="none"/><path d="M40,58 Q76,26 112,46 Q144,64 184,36" stroke-width="2.4" stroke-dasharray="3 4"/>`;
const PUFFIN = `<path d="M-6,0 Q-10,-10 -6,-18 Q-2,-24 4,-22 Q8,-20 8,-14 Q8,-6 4,0 Z" ${SOLID}/><path d="M2,-15 Q8,-11 6,-3 Q4,0 2,0 Q-1,-8 2,-15 Z" ${SNOW} stroke="none"/><circle cx="4" cy="-18.5" r="2.6" ${SNOW} stroke="none"/><circle cx="4.6" cy="-18.6" r=".9" ${SOLID}/><path d="M7.5,-21 L14,-17.5 L7.5,-14.5 Z" ${L3} stroke-width="1.1"/><path d="M-2,0 h4 M3,0 h4" stroke-width="1.6"/>`;
const LLAMA = `<g transform="translate(-24,-76)"><path d="M12,53 H28 V34 Q28,30 31,29 L30,23 L33,27 L35,23 L35,29 Q39,30 41,33 Q41,36 37,36 H35 V58 Q35,62 33,63 V76 H30 V64 H26 V76 H23 V64 H18 V76 H15 V64 H13 V76 H10 V62 Q7,60 8,56 Q9,53 12,53 Z" ${SOLID}/><circle cx="33" cy="31.5" r="1" ${PAPER}/><path d="M12,58 H33" stroke="var(--paper)" stroke-width="1.4" stroke-dasharray="2 2"/></g>`;
const CONDOR = `<path d="M-26,0 Q-12,-6 -2,-2 Q0,-4 2,-2 Q12,-6 26,0 L22,1 L24,3 L19,2 L20,4 Q10,0 2,2 L0,5 L-2,2 Q-10,0 -20,4 L-19,2 L-24,3 L-22,1 Z" ${SOLID}/><path d="M-1.6,-2.6 H1.6" stroke="var(--stp)" stroke-width="1.4"/>`;
/** Machu Picchu: Huayna Picchu und Terrassen; d = Ruinen und Mauerwerk */
const picchu = (d = false) =>
	`<path d="M92,132 L110,64 Q120,34 130,32 Q140,36 146,64 L172,132 Z" ${L3} stroke-width="2.2"/><path d="M130,32 Q126,60 118,84 M138,48 Q140,72 150,96" stroke-width="1.2"/>
<path d="M0,132 V108 Q30,96 62,98 L104,110 V132 Z" ${L2} stroke-width="2"/><path d="M8,110 H96 M4,116 H100 M2,122 H102 M0,128 H104" stroke-width="1.3" stroke-dasharray="6 3"/>${
		d
			? [[18, 104], [32, 100], [46, 99], [60, 100], [76, 103]].map(([x, y]) => `<path d="M${x - 5},${y} V${y - 6} L${x},${y - 11} L${x + 5},${y - 6} V${y} Z" ${L4} stroke-width="1.2"/><rect x="${x - 1.5}" y="${y - 5}" width="3" height="3" ${PAPER}/>`).join('')
			: ''
	}`;

/* Bausteine Südeuropa/Mittelmeer */
const cypress = (x: number, y: number, h: number) => {
	const w = f1(h * 0.27);
	return `<path d="M${x},${y} Q${f1(x - w)},${f1(y - h * 0.45)} ${x},${y - h} Q${f1(x + w)},${f1(y - h * 0.45)} ${x},${y} Z" ${SOLID}/>`;
};
/** Laubbaum (rund), r = Kronenradius */
const bush = (x: number, y: number, r: number, f = L3) => `<path d="M${x},${y} V${f1(y - r)}" stroke-width="2"/><circle cx="${x}" cy="${f1(y - r * 1.7)}" r="${r}" ${f} stroke-width="1.4"/>`;
const OLIVE = `<path d="M0,0 Q1,-8 -2,-14 M0,-6 Q4,-10 6,-16" stroke-width="2.4"/><path d="M-14,-14 Q-16,-24 -6,-26 Q-2,-34 8,-30 Q18,-30 16,-20 Q20,-12 10,-12 Q2,-8 -6,-12 Q-14,-8 -14,-14 Z" ${L3} stroke-width="1.4"/>`;
/** Pinie (Schirmkiefer) */
const STONEPINE = `<path d="M0,0 Q-2,-20 1,-30 M0,-18 Q6,-24 10,-30" stroke-width="2.4"/><path d="M-22,-30 Q-20,-44 0,-44 Q22,-44 24,-30 Q0,-25 -22,-30 Z" ${SOLID}/>`;
/** Segelboot auf der Wasserlinie */
const SAIL = `<path d="M-14,0 H14 L10,5 H-10 Z" ${SOLID}/><path d="M0,0 V-34" stroke-width="1.6"/><path d="M1.5,-32 L16,-3 H1.5 Z" ${SNOW} stroke-width="1.4"/><path d="M-1.5,-27 L-12,-3 H-1.5 Z" ${L3} stroke-width="1.4"/>`;
/** weißer Würfelhaus-Block mit Fenster */
const cube = (x: number, y: number, w: number, h: number, f = SNOW) =>
	`<rect x="${x}" y="${y - h}" width="${w}" height="${h}" ${f} stroke-width="1.3"/><rect x="${f1(x + w / 2 - 1.8)}" y="${f1(y - h * 0.62)}" width="3.6" height="4.4" ${SOLID}/>`;
/** Kapelle mit blauer Kuppel (Santorini) */
const CHAPEL = `<path d="M-12,0 V-18 H12 V0 Z" ${SNOW} stroke-width="1.5"/><path d="M-9,-18 Q-9,-32 0,-32 Q9,-32 9,-18 Z" ${SOLID}/><path d="M0,-32 V-40 M-3,-37 H3" stroke-width="1.6"/><path d="M-3,0 V-7 Q0,-11 3,-7 V0 Z" ${SOLID}/>`;
/** Windmühle mit vier Flügeln */
const windmill = (r = 15) =>
	`<path d="M-8,0 L-6,-26 H6 L8,0 Z" ${SNOW} stroke-width="1.6"/><path d="M-8,-26 Q0,-36 8,-26 Z" ${SOLID}/><path d="M-2,0 V-7 H2 V0 Z" ${SOLID}/><g transform="translate(0,-28) rotate(${r})"><path d="M0,0 V-20 M0,0 H20 M0,0 V20 M0,0 H-20" stroke-width="1.4"/><path d="M0,-20 h5 v14 h-5 Z M20,0 v5 h-14 v-5 Z M0,20 h-5 v-14 h5 Z M-20,0 v-5 h14 v5 Z" ${L2} stroke-width="1"/><circle r="2" ${SOLID}/></g>`;
/** Wehrturm mit Zinnen, Fuß bei (x, y) */
const keep = (x: number, y: number, w: number, h: number, f = L2) => {
	const a = f1(w / 5);
	return `<path d="M${x},${y} V${y - h - 4} h${a} v4 h${a} v-4 h${a} v4 h${a} v-4 h${a} V${y} Z" ${f} stroke-width="1.5"/><path d="M${f1(x + w / 2)},${f1(y - h * 0.7)} v6" stroke-width="2"/>`;
};
/** Eiffelturm, Höhe h; d = Gitterwerk */
const EIFFEL = (k: number, d = false) => {
	const p = (v: number) => f1(v * k);
	return `<path d="M${p(-0.3)},0 Q${p(-0.15)},${p(-0.2)} ${p(-0.1)},${p(-0.46)} L${p(-0.04)},${p(-0.82)} L0,${-k} L${p(0.04)},${p(-0.82)} L${p(0.1)},${p(-0.46)} Q${p(0.15)},${p(-0.2)} ${p(0.3)},0 H${p(0.18)} Q0,${p(-0.28)} ${p(-0.18)},0 Z" ${L3} stroke-width="1.8"/>
<rect x="${p(-0.2)}" y="${p(-0.23)}" width="${p(0.4)}" height="${p(0.035)}" ${SOLID}/><rect x="${p(-0.115)}" y="${p(-0.485)}" width="${p(0.23)}" height="${p(0.03)}" ${SOLID}/><rect x="${p(-0.05)}" y="${p(-0.835)}" width="${p(0.1)}" height="${p(0.025)}" ${SOLID}/><path d="M0,${-k} V${p(-1.07)}" stroke-width="1.6"/>${
		d ? `<path d="M${p(-0.15)},${p(-0.23)} L${p(-0.06)},${p(-0.455)} L${p(0.06)},${p(-0.23)} M${p(0.15)},${p(-0.23)} L${p(0.06)},${p(-0.455)} L${p(-0.06)},${p(-0.23)} M${p(-0.07)},${p(-0.485)} L0,${p(-0.81)} L${p(0.07)},${p(-0.485)}" stroke-width="1" stroke-dasharray="2 2"/>` : ''
	}`;
};
/** Kolosseum (ca. 120 × 56), Ursprung unten Mitte, rechts verfallen */
const COLOS = `<path d="M-60,0 V-56 H10 L14,-50 H24 L28,-42 H36 L40,-34 H48 V-26 H60 V0 Z" ${L2} stroke-width="2"/><path d="M-60,-14 H60 M-60,-28 H48 M-60,-42 H34" stroke-width="1.4"/>${[0, 1, 2]
	.map((r) =>
		Array.from({ length: 10 - r * 2 }, (_, i) => {
			const x = -56 + i * 11.4,
				y = -3 - r * 14;
			return `<path d="M${f1(x)},${y} V${y - 6} Q${f1(x + 3.8)},${y - 11} ${f1(x + 7.6)},${y - 6} V${y} Z" ${PAPER}/>`;
		}).join('')
	)
	.join('')}${[0, 1, 2, 3, 4].map((i) => `<rect x="${-54 + i * 13}" y="-52" width="4" height="5" ${SOLID}/>`).join('')}`;
const VESPA = `<path d="M-18,-6 Q-19,-17 -8,-17 Q-2,-17 0,-10 H6 L4,-6 Z" ${L3} stroke-width="1.4"/><path d="M-15,-18 H-4" stroke-width="3.4"/><path d="M5,-6 L8,-24 Q10,-26 12,-24 L15,-8 Q15,-5 11,-5 Z" ${L3} stroke-width="1.4"/><path d="M6,-26 H15" stroke-width="1.8"/><circle cx="13" cy="-22" r="1.6" ${SOLID}/><path d="M7,-6 Q12,-12 18,-6" stroke-width="1.6"/><circle cx="-12" cy="-4" r="4.5" ${SOLID}/><circle cx="12" cy="-4" r="4.5" ${SOLID}/><circle cx="-12" cy="-4" r="1.8" ${PAPER}/><circle cx="12" cy="-4" r="1.8" ${PAPER}/>`;
/** Straßenbahn (Lissabon), ca. 46 × 44 */
const TRAM = `<path d="M0,-29 L-7,-38 L5,-44" stroke-width="1.2"/><rect x="-22" y="-28" width="44" height="24" rx="4" ${SOLID}/>${[-17, -8, 1, 10].map((x) => `<rect x="${x}" y="-24" width="7" height="8" rx="1" ${PAPER}/>`).join('')}<path d="M-22,-11 H22" stroke="var(--stp)" stroke-width="1.6"/><circle cx="-12" cy="-3" r="3" ${L4} stroke-width="1.2"/><circle cx="12" cy="-3" r="3" ${L4} stroke-width="1.2"/>`;
/** Hängebrücke über eine Breite w, Fahrbahn auf y */
const bridge = (x: number, y: number, w: number) =>
	`<path d="M${x},${y} H${x + w}" stroke-width="2.6"/><path d="M${f1(x + w * 0.25)},${y + 18} V${y - 34} M${f1(x + w * 0.75)},${y + 18} V${y - 34}" stroke-width="3"/><path d="M${x},${y - 6} Q${f1(x + w * 0.12)},${y - 10} ${f1(x + w * 0.25)},${y - 34} Q${f1(x + w * 0.5)},${y - 2} ${f1(x + w * 0.75)},${y - 34} Q${f1(x + w * 0.88)},${y - 10} ${x + w},${y - 6}" stroke-width="1.4"/>`;
/** Hausfassaden nebeneinander bis zum Bildrand unten: Startwerte x, Oberkante top, Breite w, Anstieg je Haus dy */
const facades = (x: number, top: number, n: number, w: number, dy: number, bottom = 170) =>
	Array.from({ length: n }, (_, i) => {
		const hx = x + i * w,
			t = top - i * dy,
			f = [SNOW, L1, L2][i % 3];
		return `<rect x="${hx}" y="${t}" width="${w}" height="${bottom - t}" ${f} stroke-width="1.3"/><path d="M${hx - 1},${t} H${hx + w + 1}" stroke-width="2.4"/><rect x="${hx + 4}" y="${t + 6}" width="4" height="6" ${SOLID}/><rect x="${hx + w - 8}" y="${t + 6}" width="4" height="6" ${SOLID}/><rect x="${hx + 4}" y="${t + 18}" width="4" height="6" ${SOLID}/><rect x="${hx + w - 8}" y="${t + 18}" width="4" height="6" ${SOLID}/>`;
	}).join('');
/** Torre de Belém */
const BELEM = `<path d="M-10,0 V-28 H10 V0 Z" ${SNOW} stroke-width="1.5"/><path d="M-7,-28 V-42 H7 V-28" ${SNOW} stroke-width="1.5"/><path d="M-10,-28 v-3 h3 v3 h3 v-3 h3 v3 h3 v-3 h3 v3 h1 M-7,-42 v-3 h3.5 v3 h3.5 v-3 h3.5 v3 h3.5 v-3" stroke-width="1.2"/><path d="M-3,-34 V-38 Q0,-41 3,-38 V-34 Z M-4,-14 V-20 Q0,-24 4,-20 V-14 Z" ${SOLID}/>`;
/** Fischerboot Luzzu mit Auge */
const LUZZU = `<path d="M-28,-14 L-24,-9 Q-20,0 0,0 Q20,0 24,-9 L28,-14 L22,-10 H-22 Z" ${L3} stroke-width="1.6"/><path d="M-22,-5 Q0,-2 22,-5" stroke="var(--stp)" stroke-width="1.6"/><path d="M-28,-14 V-21 M28,-14 V-21" stroke-width="2.4"/><ellipse cx="17" cy="-7" rx="3.2" ry="1.9" ${PAPER}/><circle cx="17" cy="-7" r="1.1" ${SOLID}/>`;
/** Kuppelkirche (Valletta) */
const VALLETTA = `<path d="M-16,0 V-16 H16 V0 Z" ${L2} stroke-width="1.5"/><path d="M-9,-16 V-22 H9 V-16" stroke-width="1.5"/><path d="M-9,-22 Q-9,-36 0,-37 Q9,-36 9,-22 Z" ${SOLID}/><path d="M0,-37 V-44" stroke-width="1.6"/><path d="M20,0 V-34 L23,-42 L26,-34 V0" ${L3} stroke-width="1.4"/>`;
/** Petersdom: Fassade, Tambour, Kuppel */
const STPETER = `<path d="M-34,0 V-22 H34 V0 Z" ${L2} stroke-width="1.6"/><path d="M-28,0 V-20 M-20,0 V-20 M-12,0 V-20 M12,0 V-20 M20,0 V-20 M28,0 V-20 M-36,-22 H36 M-8,-22 L0,-28 L8,-22" stroke-width="1.2"/><path d="M-18,-22 V-36 H18 V-22" ${L2} stroke-width="1.5"/><path d="M-20,-36 Q-20,-66 0,-68 Q20,-66 20,-36 Z" ${L3} stroke-width="1.8"/><path d="M-10,-37 Q-10,-58 0,-67 M10,-37 Q10,-58 0,-67" stroke-width="1.1"/><path d="M-3,-68 V-75 H3 V-68 M0,-75 V-83 M-3,-79 H3" stroke-width="1.6"/>`;
/** Kolonnaden-Bogen (Petersplatz) von x1 bis x2 */
const colonnade = (x1: number, x2: number, y: number, up: number) =>
	`<path d="M${x1},${y} Q${f1((x1 + x2) / 2)},${y + up} ${x2},${y} V${y - 10} Q${f1((x1 + x2) / 2)},${y + up - 10} ${x1},${y - 10} Z" ${L2} stroke-width="1.4"/><path d="${Array.from({ length: 6 }, (_, i) => `M${f1(x1 + ((x2 - x1) * (i + 0.5)) / 6)},${y - 10} v-4`).join(' ')}" stroke-width="2"/><path d="${Array.from({ length: 9 }, (_, i) => {
		const t = (i + 0.5) / 9,
			x = x1 + (x2 - x1) * t,
			yy = y + up * 4 * t * (1 - t) * 0.5;
		return `M${f1(x)},${f1(yy)} v-9`;
	}).join(' ')}" stroke-width="1.2"/>`;
const OBELISK = `<path d="M-3,0 L-2,-32 L0,-36 L2,-32 L3,0 Z" ${SOLID}/><path d="M-6,0 H6" stroke-width="2"/>`;
const GUARD = `${PERSON}<path d="M-3,-17 H3 L4,-8 H-4 Z" ${L3} stroke-width="1.2"/><path d="M-4,-24 Q0,-28 4,-24" ${SOLID}/><path d="M6,2 V-36 M3,-32 Q6,-36 9,-32 Z" stroke-width="1.4"/>`;
/** Felsen im Meer (Aphrodite-Felsen) */
const STACK = `<path d="M-22,0 Q-24,-18 -14,-30 Q-6,-42 4,-38 Q14,-34 18,-18 Q22,-8 24,0 Z" ${L3} stroke-width="1.8"/><path d="M-10,-28 Q-6,-16 -12,-4 M6,-34 Q10,-20 6,-6" stroke-width="1.1"/>`;
const SHELL = `<path d="M0,0 L-10,-4 Q-10,-16 0,-18 Q10,-16 10,-4 Z" ${L2} stroke-width="1.3"/><path d="M0,0 L-6,-15 M0,0 V-18 M0,0 L6,-15" stroke-width="1"/>`;
/** Inselkirche (Gospa od Škrpjela) auf kleiner Insel */
const ISLECHURCH = `<path d="M-30,0 Q-20,-6 0,-7 Q20,-6 30,0 Z" ${L3} stroke-width="1.4"/><path d="M-14,-6 V-18 L-2,-24 L10,-18 V-6 Z" ${SNOW} stroke-width="1.4"/><path d="M-6,-24 Q-6,-34 0,-34 Q6,-34 6,-24" ${SOLID}/><path d="M14,-6 V-30 L17,-36 L20,-30 V-6 Z" ${SNOW} stroke-width="1.3"/><path d="M0,-34 V-39" stroke-width="1.4"/>`;
const YACHT = `<path d="M-30,-8 H30 L22,0 H-26 Z" ${SNOW} stroke-width="1.5"/><path d="M-16,-8 V-14 H10 L16,-8" ${SNOW} stroke-width="1.4"/><path d="M-10,-14 V-19 H4 L8,-14 Z" ${SOLID}/><path d="M-24,-4 H18" stroke-width="1" stroke-dasharray="3 2"/>`;
/** Fürstenpalast auf dem Felsen (Monaco) */
const PALAIS = `<path d="M-30,0 V-14 H30 V0" ${SNOW} stroke-width="1.4"/><path d="M-30,-14 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3" stroke-width="1.2"/><path d="M-6,-14 V-24 H6 V-14" ${SNOW} stroke-width="1.4"/>${[-22, -14, 10, 18].map((x) => `<rect x="${x}" y="-10" width="3" height="5" ${SOLID}/>`).join('')}`;
/** Casino Monte-Carlo */
const CASINO = `<path d="M-24,0 V-16 H24 V0 Z" ${SNOW} stroke-width="1.4"/><path d="M-24,-16 H24 L18,-20 H-18 Z" ${L3} stroke-width="1.2"/><path d="M-26,-16 V-24 Q-22,-30 -18,-24 V-16 M18,-16 V-24 Q22,-30 26,-24 V-16" ${SNOW} stroke-width="1.3"/><path d="M-6,-20 Q0,-28 6,-20" ${SOLID}/>${[-16, -8, 4, 12].map((x) => `<path d="M${x},-3 V-10 Q${x + 2},-12 ${x + 4},-10 V-3 Z" ${SOLID}/>`).join('')}`;
const RACECAR = `<path d="M-26,0 L-24,-6 L-8,-8 L-2,-14 H6 L10,-8 L24,-5 L26,0 Z" ${SOLID}/><path d="M-26,-6 V-13 H-19" stroke-width="2"/><circle cx="-16" cy="0" r="4.4" ${SOLID}/><circle cx="16" cy="0" r="4.4" ${SOLID}/><circle cx="-16" cy="0" r="1.6" ${PAPER}/><circle cx="16" cy="0" r="1.6" ${PAPER}/>`;
/** Feuerwerk */
const burst = (x: number, y: number, r: number) => `${rays(x, y, r, 12)}<circle cx="${x}" cy="${y}" r="2" ${SOLID}/>`;
/** Turm von San Marino auf Felsspitze */
const GUAITA = `<path d="M-7,0 V-24 H7 V0 Z" ${SNOW} stroke-width="1.5"/><path d="M-9,-24 v-4 h3 v3 h3 v-3 h3 v3 h3 v-3 h3 v3 h3 v-3 v4 Z" ${SNOW} stroke-width="1.2"/><path d="M-4,-28 V-38 H4 V-28" ${SNOW} stroke-width="1.4"/><path d="M-5,-38 L0,-46 L5,-38 Z" ${SOLID}/><path d="M0,-46 V-54 L8,-51 L0,-48" stroke-width="1.2"/><rect x="-1.5" y="-18" width="3" height="5" ${SOLID}/>`;
/** Häuserzeile von Berat: viele Fenster, gestaffelt am Hang (Fuß x, y; n Häuser) */
const berat = (x: number, y: number, n: number, dy = 9) =>
	Array.from({ length: n }, (_, i) => {
		const hx = x + (i % 4) * 22,
			hy = y - Math.floor(i / 4) * dy - (i % 2) * 2;
		return `<path d="M${hx},${hy} V${hy - 12} H${hx + 20} V${hy}" ${SNOW} stroke-width="1.2"/><path d="M${hx - 2},${hy - 12} L${hx + 10},${hy - 17} L${hx + 22},${hy - 12} Z" ${L3} stroke-width="1"/>${[3, 8, 13].map((d) => `<rect x="${hx + d}" y="${hy - 9}" width="3" height="4" ${SOLID}/>`).join('')}`;
	})
		.reverse()
		.join('');
const MINARET = `<path d="M-3,0 V-34 H3 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-5,-26 H5 M-4,-34 L0,-42 L4,-34" stroke-width="1.4"/><path d="M-4,-34 L0,-42 L4,-34 Z" ${SOLID}/>`;
/** romanische Kirche mit Turm (Andorra) */
const ROMAN = `<path d="M6,0 V-18 L18,-26 H42 V0 Z" ${L2} stroke-width="1.5"/><path d="M42,0 V-14 Q48,-14 48,-8 V0" ${L2} stroke-width="1.3"/><path d="M-8,0 V-52 H8 V0 Z" ${L1} stroke-width="1.6"/><path d="M-10,-52 L0,-60 L10,-52 Z" ${SOLID}/>${[-44, -32, -20].map((y) => `<path d="M-5,${y} V${y - 5} Q-3.5,${y - 7} -2,${y - 5} V${y} Z M2,${y} V${y - 5} Q3.5,${y - 7} 5,${y - 5} V${y} Z" ${SOLID}/><path d="M-8,${y + 3} H8" stroke-width="1"/>`).join('')}<path d="M24,0 V-8 Q27,-11 30,-8 V0" ${SOLID}/>`;
const CHAMOIS = `<path d="M2,-14 Q2,-20 10,-20 H22 Q27,-20 28,-15 L26,-11 H6 Q2,-11 2,-14 Z" ${SOLID}/><path d="M7,-11 V0 M11,-11 V0 M22,-11 V0 M25,-11 V0" stroke-width="2"/><path d="M26,-18 L31,-26 L35,-23 L30,-15 Z" ${SOLID}/><path d="M31,-26 Q31,-32 28,-31" stroke-width="1.6"/>`;
/** Felsen von Gibraltar (Nordwand links) */
const ROCK = (y: number, s = 1) =>
	`<path d="M${f1(20 * s)},${y} L${f1(46 * s)},${f1(y - 66 * s)} Q${f1(50 * s)},${f1(y - 78 * s)} ${f1(62 * s)},${f1(y - 78 * s)} Q${f1(90 * s)},${f1(y - 74 * s)} ${f1(120 * s)},${f1(y - 56 * s)} Q${f1(150 * s)},${f1(y - 34 * s)} ${f1(178 * s)},${y} Z" ${L3} stroke-width="2"/><path d="M${f1(50 * s)},${f1(y - 60 * s)} L${f1(42 * s)},${f1(y - 20 * s)} M${f1(62 * s)},${f1(y - 70 * s)} L${f1(58 * s)},${f1(y - 34 * s)}" stroke-width="1.1"/>`;
const MACAQUE = `<path d="M-8,0 Q-12,-10 -6,-18 Q0,-22 6,-18 Q12,-10 8,0 Z" ${SOLID}/><circle cx="-6" cy="-29" r="2.4" ${SOLID}/><circle cx="6" cy="-29" r="2.4" ${SOLID}/><circle cx="0" cy="-26" r="7" ${SOLID}/><ellipse cx="0" cy="-25" rx="4.4" ry="3.6" ${PAPER}/><circle cx="-1.7" cy="-26" r=".9" ${SOLID}/><circle cx="1.7" cy="-26" r=".9" ${SOLID}/><path d="M-1,-23 H1" stroke-width="1"/>`;
const DOLPHIN = `<path d="M-14,0 Q-6,-12 8,-8 L12,-12 L12,-7 Q16,-5 17,-2 Q6,-4 -2,2 L-6,6 L-6,1 Q-10,2 -14,0 Z" ${SOLID}/>`;
const LIGHTHOUSE = `<path d="M-5,0 L-3,-30 H3 L5,0 Z" ${SNOW} stroke-width="1.4"/><path d="M-4.6,-8 H4.6 M-4,-18 H4" stroke-width="3"/><rect x="-3" y="-36" width="6" height="6" ${SOLID}/><path d="M-4,-36 L0,-40 L4,-36 Z" ${SOLID}/><path d="M-6,-33 L-16,-36 M-6,-33 L-16,-30 M6,-33 L16,-36 M6,-33 L16,-30" stroke-width="1"/>`;

/* Bausteine Mittel-/Nordeuropa */
/** Brandenburger Tor mit Quadriga (ca. 124 × 86) */
const BRANDENBURG = `<path d="M-62,0 V-30 H-50 V0 Z M50,0 V-30 H62 V0 Z" ${L2} stroke-width="1.4"/><path d="M-54,0 V-4 H54 V0 Z" ${SOLID}/>${[-44, -30, -16, 16, 30, 44].map((x) => `<rect x="${x - 2.5}" y="-44" width="5" height="40" ${SNOW} stroke-width="1.2"/>`).join('')}
<path d="M-6,-4 V-44 M6,-4 V-44" stroke-width="1.2"/><path d="M-54,-44 H54 V-53 H-54 Z" ${L3} stroke-width="1.5"/><path d="M-50,-48.5 H50" stroke="var(--stp)" stroke-width="1" stroke-dasharray="2 2"/><path d="M-30,-53 V-60 H30 V-53" ${L2} stroke-width="1.4"/>
<path d="M-14,-60 L-12,-65 Q-9,-71 -5,-67 L-2,-66 L0,-72 L2,-66 L5,-67 Q9,-71 12,-65 L14,-60 Z" ${SOLID}/><path d="M0,-72 V-84 M-3,-80 H3" stroke-width="1.4"/><circle cx="0" cy="-86" r="2.2" stroke-width="1.2"/>`;
/** Turm mit Spitzdach (Neuschwanstein): Fuß (x, y), Breite w, Höhe h */
const towr = (x: number, y: number, w: number, h: number, f = SNOW) =>
	`<path d="M${f1(x - w / 2)},${y} V${y - h} H${f1(x + w / 2)} V${y}" ${f} stroke-width="1.3"/><path d="M${f1(x - w / 2 - 1.5)},${y - h} L${x},${f1(y - h - w * 1.7)} L${f1(x + w / 2 + 1.5)},${y - h} Z" ${SOLID}/><rect x="${f1(x - 1.2)}" y="${f1(y - h + 4)}" width="2.4" height="4" ${SOLID}/>`;
/** Schloss Neuschwanstein (ca. 80 breit, 96 hoch) */
const NEUSCH = `<path d="M-30,0 V-40 H24 V0 Z" ${SNOW} stroke-width="1.4"/><path d="M-30,-40 L-26,-50 H20 L24,-40 Z" ${L3} stroke-width="1.2"/>${towr(-34, 0, 9, 62)}${towr(-12, -40, 7, 24)}${towr(30, 0, 10, 46)}${towr(8, -46, 6, 18)}${towr(40, 0, 7, 32)}
${[-24, -16, -8, 0, 8, 16].map((x) => `<rect x="${x}" y="-34" width="3" height="5" ${SOLID}/><rect x="${x}" y="-22" width="3" height="5" ${SOLID}/>`).join('')}<path d="M-6,0 V-10 Q-2,-14 2,-10 V0 Z" ${SOLID}/>`;
/** Hangweinberg-Reihen auf einer Fläche */
const vines = (x: number, y: number, w: number, n: number, dx = 6) => `<path d="${Array.from({ length: n }, (_, i) => `M${x + i * dx},${y} l${f1(w * 0.3)},${f1(-w * 0.5)}`).join(' ')}" stroke-width="1.2" stroke-dasharray="1.6 2"/>`;
/** Rheinschiff */
const RIVERBOAT = `<path d="M-24,0 H24 L20,-6 H-22 Z" ${SOLID}/><path d="M-16,-6 V-12 H12 V-6" ${SNOW} stroke-width="1.3"/><path d="M-12,-9 H8" stroke-width="1" stroke-dasharray="2 2"/><path d="M4,-12 V-18 H8 V-12" ${SOLID}/>`;
/** Alpenkette mit Schneekappen über einer Linie y */
const alps = (y: number, w = 180, f = L1) =>
	`<path d="M0,${y} L${f1(w * 0.12)},${y - 40} L${f1(w * 0.22)},${y - 26} L${f1(w * 0.36)},${y - 56} L${f1(w * 0.5)},${y - 30} L${f1(w * 0.62)},${y - 48} L${f1(w * 0.78)},${y - 22} L${f1(w * 0.9)},${y - 38} L${w},${y - 16} V${y + 20} H0 Z" ${f} stroke-width="1.8"/>
<path d="M${f1(w * 0.12)},${y - 40} L${f1(w * 0.09)},${y - 32} L${f1(w * 0.13)},${y - 34} L${f1(w * 0.16)},${y - 30} Z M${f1(w * 0.36)},${y - 56} L${f1(w * 0.32)},${y - 46} L${f1(w * 0.37)},${y - 48} L${f1(w * 0.41)},${y - 44} Z M${f1(w * 0.62)},${y - 48} L${f1(w * 0.59)},${y - 40} L${f1(w * 0.63)},${y - 42} L${f1(w * 0.66)},${y - 38} Z M${f1(w * 0.9)},${y - 38} L${f1(w * 0.87)},${y - 31} L${f1(w * 0.91)},${y - 33} L${f1(w * 0.94)},${y - 29} Z" ${SNOW} stroke-width="1.1"/>`;
/** Dorfkirche mit Spitzturm (Hallstatt, Heiligenblut) */
const SPIRE = `<path d="M-6,0 V-34 H6 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-7,-34 L0,-60 L7,-34 Z" ${SOLID}/><path d="M6,0 V-16 L14,-22 L30,-22 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M4,-16 L14,-24 H31 L30,-22" ${L3} stroke-width="1.2"/><rect x="-2" y="-28" width="4" height="6" ${SOLID}/><path d="M0,-60 V-66" stroke-width="1.2"/>`;
/** Riesenrad (Wiener Prater), Radius r */
const wheel = (r: number) =>
	`<path d="M${-r * 0.6},0 L0,${-r - 4} L${r * 0.6},0" stroke-width="2"/><circle cx="0" cy="${-r - 4}" r="${r}" stroke-width="2"/><circle cx="0" cy="${-r - 4}" r="${f1(r * 0.85)}" stroke-width="1"/><path d="${Array.from({ length: 12 }, (_, i) => {
		const a = (i * Math.PI) / 6;
		return `M0,${-r - 4} L${f1(r * Math.cos(a))},${f1(-r - 4 + r * Math.sin(a))}`;
	}).join(' ')}" stroke-width="1"/>${Array.from({ length: 12 }, (_, i) => {
		const a = (i * Math.PI) / 6;
		return `<rect x="${f1(r * Math.cos(a) - 3)}" y="${f1(-r - 4 + r * Math.sin(a))}" width="6" height="5" rx="1" ${SOLID}/>`;
	}).join('')}`;
/** Stephansdom: Südturm und steiles Ziegeldach */
const STEPHAN = `<path d="M-6,0 V-46 L-3,-70 L0,-84 L3,-70 L6,-46 V0 Z" ${L3} stroke-width="1.4"/><path d="M-4,-40 H4 M-3,-54 H3 M-2,-64 H2" stroke-width="1"/><path d="M6,0 V-24 L14,-40 H46 L52,-24 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M8,-24 L14,-38 H45 L50,-24 Z" ${L4} stroke="none"/><path d="M14,-32 l4,4 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4" stroke="var(--stp)" stroke-width="1"/>`;
/** Matterhorn (breite Pyramide mit Schnee), Fuß bei y */
const MATTER = (y: number, x = 90, k = 1) =>
	`<path d="M${f1(x - 70 * k)},${y} L${f1(x - 10 * k)},${f1(y - 70 * k)} Q${f1(x - 4 * k)},${f1(y - 96 * k)} ${f1(x + 6 * k)},${f1(y - 92 * k)} L${f1(x + 24 * k)},${f1(y - 50 * k)} L${f1(x + 70 * k)},${y} Z" ${L3} stroke-width="2"/>
<path d="M${f1(x - 10 * k)},${f1(y - 70 * k)} Q${f1(x - 4 * k)},${f1(y - 96 * k)} ${f1(x + 6 * k)},${f1(y - 92 * k)} L${f1(x + 16 * k)},${f1(y - 68 * k)} L${f1(x + 8 * k)},${f1(y - 72 * k)} L${f1(x + 2 * k)},${f1(y - 62 * k)} L${f1(x - 4 * k)},${f1(y - 70 * k)} Z" ${SNOW} stroke-width="1.2"/><path d="M${f1(x + 6 * k)},${f1(y - 92 * k)} L${f1(x + 2 * k)},${f1(y - 40 * k)} L${f1(x - 6 * k)},${y}" stroke-width="1.1"/>`;
/** Rote Bahn (Glacier Express): n Wagen, Länge je 26 */
const train = (n: number) =>
	Array.from({ length: n }, (_, i) => `<rect x="${i * 27}" y="-12" width="25" height="12" rx="2" ${i ? L4 : SOLID}/><path d="M${i * 27 + 3},-8 h19" stroke="var(--stp)" stroke-width="2.4" stroke-dasharray="4 1.6"/>`).join('');
/** Viadukt mit Bögen von x über Breite w, Fahrbahn y, Bogenhöhe h */
const viaduct = (x: number, y: number, w: number, h: number, n: number) => {
	const a = w / n;
	let d = `M${x},${y} H${x + w} V${y + h + 20} H${x} Z`;
	return `<path d="${d}" ${L2} stroke-width="1.4"/>${Array.from({ length: n }, (_, i) => `<path d="M${f1(x + i * a + 3)},${y + h + 20} V${y + 10} Q${f1(x + i * a + a / 2)},${y + 2} ${f1(x + (i + 1) * a - 3)},${y + 10} V${y + h + 20} Z" ${PAPER}/>`).join('')}<path d="M${x - 2},${y} H${x + w + 2}" stroke-width="2"/>`;
};
/** Chalet */
const CHALET = `<path d="M-16,0 V-16 H16 V0 Z" ${L2} stroke-width="1.3"/><path d="M-21,-14 L0,-28 L21,-14 Z" ${SOLID}/><path d="M-12,-10 h6 v5 h-6 Z M6,-10 h6 v5 h-6 Z" ${SNOW} stroke-width="1"/><path d="M-16,-6 H16" stroke-width="1.6"/>`;
/** Kuh mit Glocke, Blick nach links (ca. 34 × 22) */
const ALPCOW = `<path d="M6,-20 H28 Q32,-20 32,-15 V0 H29 V-9 H26 V0 H23 V-9 H12 V0 H9 V-9 H6 Z" ${SOLID}/><path d="M6,-18 L0,-16 Q-3,-14 -1,-10 L5,-9 L8,-12" ${SOLID}/><path d="M2,-19 l-3,-4 M6,-19 l2,-4" stroke-width="1.4"/><path d="M14,-17 q4,4 8,0 M24,-12 q2,3 5,0" stroke="var(--stp)" stroke-width="1.4"/><path d="M4,-9 v3" stroke-width="1"/><circle cx="4" cy="-4.6" r="1.8" ${L3} stroke-width="1"/><path d="M32,-17 q4,4 2,10" stroke-width="1.2"/>`;
/** Edelweiß */
const EDEL = Array.from({ length: 8 }, (_, i) => `<ellipse cx="0" cy="-6" rx="2.4" ry="5.6" transform="rotate(${i * 45})" ${SNOW} stroke-width="1"/>`).join('') + `<circle r="2.6" ${L3} stroke-width="1"/>`;
/** Grachtenhäuser: Giebel n Stück ab x, Fuß y */
const gables = (x: number, y: number, n: number, w = 16) =>
	Array.from({ length: n }, (_, i) => {
		const hx = x + i * w,
			h = 38 + ((i * 7) % 12),
			f = [SNOW, L2, L1, L3][i % 4],
			g = i % 3;
		const top = g === 0 ? `V${y - h} H${hx + 3} V${y - h - 5} H${hx + 6} V${y - h - 10} H${hx + w - 6} V${y - h - 5} H${hx + w - 3} V${y - h} H${hx + w}` : g === 1 ? `V${y - h} Q${hx + 2},${y - h - 8} ${hx + w / 2},${y - h - 12} Q${hx + w - 2},${y - h - 8} ${hx + w},${y - h}` : `V${y - h} L${hx + w / 2},${y - h - 11} L${hx + w},${y - h}`;
		return `<path d="M${hx},${y} ${top} V${y} Z" ${f} stroke-width="1.2"/>${[0, 1, 2].map((r) => `<rect x="${hx + 3}" y="${y - h + 4 + r * 11}" width="3.4" height="6" ${SOLID}/><rect x="${hx + w - 6.4}" y="${y - h + 4 + r * 11}" width="3.4" height="6" ${SOLID}/>`).join('')}`;
	}).join('');
/** Fahrrad */
const BIKE = `<circle cx="-8" cy="-5" r="5" stroke-width="1.3"/><circle cx="8" cy="-5" r="5" stroke-width="1.3"/><path d="M-8,-5 L-2,-14 H6 L8,-5 M-2,-14 L1,-5 L6,-14 M-4,-16 H0 M5,-17 L7,-14" stroke-width="1.3"/>`;
/** Tulpe */
const tulip = (x: number, y: number, f = SOLID) => `<path d="M${x},${y} V${y - 10}" stroke-width="1.2"/><path d="M${x - 3},${y - 10} V${y - 15} L${x - 1.5},${y - 13} L${x},${y - 16} L${x + 1.5},${y - 13} L${x + 3},${y - 15} V${y - 10} Q${x},${y - 7} ${x - 3},${y - 10} Z" ${f}/>`;
/** Atomium (ca. 70 × 100) */
const ATOMIUM = (() => {
	const p = [[0, -96], [-22, -78], [22, -78], [0, -60], [-22, -42], [22, -42], [0, -24], [-14, -66], [14, -54]];
	const e = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6], [0, 3], [3, 6], [1, 4], [2, 5]];
	return `<path d="M-8,0 L-3,-24 M8,0 L3,-24 M-22,-42 L-30,0 M22,-42 L30,0" stroke-width="2"/><path d="${e.map(([a, b]) => `M${p[a][0]},${p[a][1]} L${p[b][0]},${p[b][1]}`).join(' ')}" stroke-width="3"/>${p.slice(0, 7).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.4" ${SNOW} stroke-width="1.6"/><path d="M${x - 4},${y - 3} q3,-3 6,-2" stroke-width="1"/>`).join('')}`;
})();
/** Belfried von Brügge */
const BELFRY = `<path d="M-14,0 V-44 H14 V0 Z" ${L2} stroke-width="1.4"/><path d="M-10,-44 V-70 H10 V-44" ${L1} stroke-width="1.4"/><path d="M-7,-70 V-86 H7 V-70" ${SNOW} stroke-width="1.3"/><path d="M-8,-86 L0,-94 L8,-86 Z" ${SOLID}/>
<path d="M-14,-44 l2,-4 l2,4 M10,-44 l2,-4 l2,4 M-10,-70 l2,-3 l2,3 M6,-70 l2,-3 l2,3" stroke-width="1.2"/><circle cx="0" cy="-58" r="4" ${SNOW} stroke-width="1.2"/><path d="M-5,-30 V-38 Q0,-42 5,-38 V-30 Z M-4,0 V-12 Q0,-16 4,-12 V0 Z" ${SOLID}/>`;
/** Schwan, Blick nach links */
const SWAN = `<path d="M-8,0 Q-10,-6 -2,-7 Q8,-8 12,-3 Q14,0 10,0 Z" ${SNOW} stroke-width="1.2"/><path d="M-4,-6 Q-8,-12 -6,-18 Q-4,-21 -2,-18" stroke-width="1.6"/><path d="M-6,-18 L-10,-17" stroke-width="1.4"/>`;
/** Big Ben (ca. 22 × 110) */
const BIGBEN = `<path d="M-9,0 V-70 H9 V0 Z" ${L2} stroke-width="1.4"/><path d="M-11,-70 H11 V-88 H-11 Z" ${SNOW} stroke-width="1.3"/><circle cx="0" cy="-79" r="6.4" ${SNOW} stroke-width="1.3"/><path d="M0,-79 V-83 M0,-79 L3,-78" stroke-width="1.1"/>
<path d="M-11,-88 L0,-112 L11,-88 Z" ${SOLID}/><path d="M0,-112 V-118" stroke-width="1.2"/><path d="M-5,-8 V-62 M5,-8 V-62" stroke-width="1" stroke-dasharray="4 3"/>`;
/** Doppeldeckerbus, Blick nach links */
const BUS = `<rect x="-22" y="-24" width="44" height="21" rx="3" ${SOLID}/><path d="M-19,-20 H19 M-19,-11 H19" stroke="var(--stp)" stroke-width="3.4" stroke-dasharray="5 1.6"/><circle cx="-12" cy="-3" r="3.4" ${L4} stroke-width="1.2"/><circle cx="12" cy="-3" r="3.4" ${L4} stroke-width="1.2"/>`;
/** Tower Bridge (ca. 120 × 70) */
const TOWERBR = `${[-36, 36].map((x) => `<path d="M${x - 9},0 V-50 H${x + 9} V0" ${SNOW} stroke-width="1.4"/><path d="M${x - 11},-50 L${x - 9},-58 L${x - 4},-56 L${x},-66 L${x + 4},-56 L${x + 9},-58 L${x + 11},-50 Z" ${SOLID}/><path d="M${x - 4},-14 V-22 Q${x},-26 ${x + 4},-22 V-14 Z M${x - 4},-34 V-40 Q${x},-44 ${x + 4},-40 V-34 Z" ${SOLID}/>`).join('')}
<path d="M-27,-44 H27 M-27,-40 H27" stroke-width="2"/><path d="M-27,-14 L-6,-10 M27,-14 L6,-10" stroke-width="3"/><path d="M-62,-10 Q-52,-40 -45,-46 M62,-10 Q52,-40 45,-46" stroke-width="1.6"/><path d="M-62,-10 H62" stroke-width="2.4"/>`;
/** Stonehenge (Trilithen), Breite ca. 120 */
const STONEH = `${[[-52, 26], [-34, 30], [-12, 34], [12, 34], [34, 30], [52, 24]].map(([x, h]) => `<path d="M${x - 5},0 V${-h} H${x + 5} V0 Z" ${SOLID}/>`).join('')}<path d="M-40,-30 H-26 V-36 H-40 Z M-18,-34 H18 V-40 H-18 Z M28,-30 H42 V-35 H28 Z" ${SOLID}/><path d="M66,0 L68,-14 L74,-12 L76,0 Z M-70,0 L-66,-10 L-62,0 Z" ${L4} stroke="none"/>`;
/** Schaf, Blick nach links */
const SHEEP = `<path d="M2,-10 q-2,-6 4,-7 q2,-5 8,-3 q6,-3 9,2 q5,1 4,6 q2,5 -4,6 H6 q-5,0 -4,-4 Z" ${SNOW} stroke-width="1.3"/><path d="M4,-14 L-2,-13 Q-4,-11 -2,-9 L4,-9 Z" ${SOLID}/><path d="M9,-4 V0 M13,-4 V0 M20,-4 V0 M24,-4 V0" stroke-width="1.6"/>`;
/** irischer Rundturm */
const ROUNDT = `<path d="M-5,0 L-4,-52 H4 L5,0 Z" ${L2} stroke-width="1.4"/><path d="M-5,-52 L0,-62 L5,-52 Z" ${SOLID}/><rect x="-1.2" y="-48" width="2.4" height="4" ${SOLID}/><rect x="-1.2" y="-26" width="2.4" height="5" ${SOLID}/>`;
/** Kleeblatt */
const CLOVER = `${[0, 120, 240].map((a) => `<path d="M0,0 C-6,-4 -7,-12 -2,-13 Q0,-13 0,-10 Q0,-13 2,-13 C7,-12 6,-4 0,0 Z" transform="rotate(${a})" ${SOLID}/>`).join('')}<path d="M0,0 Q2,8 6,12" stroke-width="1.6"/>`;
/** Kleine Meerjungfrau auf dem Stein */
const MERMAID = `<path d="M-18,0 Q-20,-10 -8,-14 Q6,-16 14,-8 Q20,-2 18,0 Z" ${L3} stroke-width="1.5"/><path d="M-6,-14 Q-4,-24 2,-30 Q4,-34 2,-38 M2,-30 Q8,-24 10,-14 Q12,-12 16,-14 L18,-18 L18,-12" ${SOLID} stroke="currentColor" stroke-width="2.2"/><circle cx="1" cy="-41" r="3" ${SOLID}/><path d="M-2,-40 Q-4,-34 -1,-32" stroke-width="1.4"/><path d="M0,-30 Q-6,-24 -4,-18" stroke-width="1.6"/>`;
/** Wikingerschiff mit Rahsegel, Blick nach rechts */
const VIKING = `<path d="M-46,-14 Q-48,-26 -42,-30 Q-38,-26 -40,-20 Q-30,-2 0,0 Q30,-2 40,-20 Q38,-26 42,-30 Q48,-26 46,-14 Q36,4 0,6 Q-36,4 -46,-14 Z" ${SOLID}/><path d="M0,0 V-58" stroke-width="2.2"/><path d="M-24,-54 H24 Q22,-30 26,-10 H-26 Q-22,-30 -24,-54 Z" ${SNOW} stroke-width="1.6"/>
<path d="M-12,-53 Q-11,-30 -13,-10 M12,-53 Q11,-30 13,-10" stroke-width="5" stroke-opacity=".5"/><path d="M-24,-54 H24" stroke-width="2"/>${[-30, -18, -6, 6, 18, 30].map((x) => `<circle cx="${x}" cy="-3" r="3.6" ${L2} stroke="var(--stp)" stroke-width="1.2"/>`).join('')}`;
/** Nyhavn: bunte Giebelhäuser mit Booten */
const nyhavn = (x: number, y: number, n: number, w = 15) =>
	Array.from({ length: n }, (_, i) => {
		const hx = x + i * w,
			h = 34 + ((i * 5) % 10),
			f = [L3, SNOW, L1, L2, SOLID][i % 5],
			win = i % 5 === 4 ? PAPER : SOLID;
		return `<path d="M${hx},${y} V${y - h} L${hx + w / 2},${y - h - 8} L${hx + w},${y - h} V${y} Z" ${f} stroke-width="1.1"/>${[0, 1, 2].map((r) => `<rect x="${hx + 3}" y="${y - h + 3 + r * 10}" width="3" height="5" ${win}/><rect x="${hx + w - 6}" y="${y - h + 3 + r * 10}" width="3" height="5" ${win}/>`).join('')}`;
	}).join('');
/** Stabkirche (gestaffelte Dächer mit Drachenköpfen) */
const STAVE = `<path d="M-20,0 V-12 H20 V0 Z" ${L3} stroke-width="1.3"/><path d="M-24,-10 L0,-22 L24,-10 Z" ${SOLID}/><path d="M-12,-20 V-28 H12 V-20" ${L3} stroke-width="1.2"/><path d="M-16,-26 L0,-36 L16,-26 Z" ${SOLID}/><path d="M-6,-34 V-40 H6 V-34" ${L3} stroke-width="1.2"/><path d="M-9,-39 L0,-56 L9,-39 Z" ${SOLID}/>
<path d="M-24,-10 l-4,-4 M24,-10 l4,-4 M-16,-26 l-4,-4 M16,-26 l4,-4" stroke-width="1.6"/><path d="M-3,0 V-7 H3 V0" ${PAPER}/>`;
/** rotes Fischerhaus (Rorbu) auf Stelzen */
const RORBU = `<path d="M-12,-6 V-20 H12 V-6 Z" ${SOLID}/><path d="M-15,-19 L0,-30 L15,-19 Z" ${L3} stroke-width="1.2"/><path d="M-10,-6 V4 M0,-6 V4 M10,-6 V4" stroke-width="1.6"/><path d="M-6,-16 h4 v5 h-4 Z M3,-16 h4 v5 h-4 Z" ${SNOW}/>`;
/** schwedisches Holzhaus: rot mit weißen Ecken */
const STUGA = `<path d="M-16,0 V-16 H16 V0 Z" ${SOLID}/><path d="M-19,-15 L0,-28 L19,-15 Z" ${L3} stroke-width="1.2"/><path d="M-16,0 V-16 M16,0 V-16" stroke="var(--stp)" stroke-width="2"/><path d="M-11,-12 h6 v6 h-6 Z M5,-12 h6 v6 h-6 Z M-2,0 V-9 H2 V0" ${SNOW}/><path d="M8,-24 V-30 H12 V-21" ${SOLID}/>`;
/** Birke, Höhe h */
const birch = (x: number, y: number, h: number) =>
	`<path d="M${x},${y} V${y - h}" stroke-width="2.6"/><path d="M${x},${f1(y - h * 0.3)} h2 M${x},${f1(y - h * 0.5)} h-2 M${x},${f1(y - h * 0.7)} h2" stroke="var(--stp)" stroke-width="1.4"/><path d="M${x},${f1(y - h * 0.55)} Q${x - h * 0.3},${f1(y - h * 0.7)} ${f1(x - h * 0.24)},${f1(y - h * 0.98)} Q${x},${f1(y - h * 1.18)} ${f1(x + h * 0.24)},${f1(y - h * 0.98)} Q${x + h * 0.3},${f1(y - h * 0.7)} ${x},${f1(y - h * 0.55)} Z" ${L2} stroke-width="1.3"/>`;
/** Mittsommerbaum mit Kränzen */
const MAYPOLE = `<path d="M0,0 V-64 M-16,-48 H16" stroke-width="2.6"/><circle cx="-16" cy="-40" r="7" ${L2} stroke-width="1.6"/><circle cx="16" cy="-40" r="7" ${L2} stroke-width="1.6"/><path d="M-4,-64 Q0,-70 4,-64 M-6,-56 Q0,-52 6,-56" stroke-width="1.4"/>${[-16, 16].map((x) => `<path d="M${x - 5},-44 l2,-2 M${x + 3},-36 l2,2 M${x - 6},-37 l2,0" stroke-width="1.4"/>`).join('')}`;
/** Rentier, Blick nach rechts */
const REINDEER = `<path d="M2,-16 Q2,-22 10,-22 H22 Q26,-22 27,-18 L25,-13 H6 Q2,-13 2,-16 Z" ${SOLID}/><path d="M7,-13 V0 M11,-13 V0 M21,-13 V0 M24,-13 V0" stroke-width="2"/><path d="M25,-19 L30,-26 L36,-24 L34,-21 L29,-20 Z" ${SOLID}/>
<path d="M30,-26 L28,-36 M28,-32 L24,-36 M29,-34 L32,-40 M31,-26 L34,-34 M33,-31 L38,-33" stroke-width="1.4"/><path d="M8,-14 l2,3 l2,-3" stroke="var(--stp)" stroke-width="1"/>`;
/** Sauna-Hütte am Steg */
const SAUNA = `<path d="M-14,0 V-14 H14 V0 Z" ${L3} stroke-width="1.3"/><path d="M-17,-13 L0,-24 L17,-13 Z" ${SOLID}/><path d="M8,-20 V-30 H12 V-17" ${SOLID}/><path d="M10,-32 q-3,-4 0,-8 q3,-4 0,-8" stroke-width="1.2"/><path d="M-3,0 V-9 H3 V0" ${SNOW}/><path d="M14,0 H40 M20,0 V5 M32,0 V5" stroke-width="1.6"/>`;
/** Glas-Iglu */
const IGLOO = `<path d="M-14,0 Q-14,-16 0,-16 Q14,-16 14,0 Z" ${L1} stroke="#F4F7FA" stroke-width="1.4"/><path d="M-8,-13 V0 M0,-16 V0 M8,-13 V0 M-13,-6 H13" stroke="#F4F7FA" stroke-opacity=".6" stroke-width="1"/>`;
/** Marienkirche Krakau: zwei ungleiche Türme */
const MARIACKI = `<path d="M-22,0 V-60 H-8 V0 Z" ${L2} stroke-width="1.4"/><path d="M-24,-60 L-15,-82 L-6,-60 Z" ${SOLID}/><path d="M-15,-82 V-90" stroke-width="1.2"/><path d="M-19,-66 l2,-6 l2,6 M-13,-66 l2,-6 l2,6" stroke-width="1"/>
<path d="M8,0 V-48 H22 V0 Z" ${L2} stroke-width="1.4"/><path d="M7,-48 Q15,-62 23,-48 Z" ${SOLID}/><path d="M-8,0 V-36 L0,-44 L8,-36 V0 Z" ${SNOW} stroke-width="1.3"/><circle cx="0" cy="-30" r="4" ${L3} stroke-width="1"/><path d="M-4,0 V-12 Q0,-16 4,-12 V0 Z" ${SOLID}/>${[-18, -12, 12, 18].map((x) => `<rect x="${x - 1.4}" y="-40" width="2.8" height="8" ${SOLID}/>`).join('')}`;
/** Storch mit Nest auf Mast */
const STORKNEST = `<path d="M0,0 V-30" stroke-width="2.4"/><path d="M-12,-30 Q0,-24 12,-30 L10,-36 Q0,-32 -10,-36 Z" ${L3} stroke-width="1.3"/><path d="M-4,-36 Q-6,-46 0,-50 Q6,-52 8,-46 Q8,-40 4,-36 Z" ${SNOW} stroke-width="1.2"/><path d="M0,-50 Q-2,-56 2,-58 Q6,-58 6,-54" stroke-width="1.6"/><path d="M6,-56 L13,-54 L6,-53 Z" ${SOLID}/><path d="M-2,-42 Q2,-40 6,-44" stroke-width="2.4"/>`;
/** Holzkirche mit Zwiebelhaube */
const WOODCH = `<path d="M-14,0 V-18 H14 V0 Z" ${L3} stroke-width="1.3"/><path d="M-18,-16 L0,-28 L18,-16 Z" ${SOLID}/><path d="M-6,-24 V-36 H6 V-24" ${L3} stroke-width="1.2"/><path d="M-6,-36 Q-7,-44 0,-48 Q7,-44 6,-36 Z" ${SOLID}/><path d="M0,-48 V-54 M-2,-52 H2" stroke-width="1.2"/>`;
/** Mohnblume */
const poppy = (x: number, y: number) => `<path d="M${x},${y} V${y - 9}" stroke-width="1.1"/><circle cx="${x}" cy="${y - 11}" r="3" ${SOLID}/><circle cx="${x}" cy="${y - 11}" r="1" ${PAPER}/>`;
/** Prager Burg mit Veitsdom (ca. 110 breit) */
const HRAD = `<path d="M-56,0 V-14 H56 V0 Z" ${SNOW} stroke-width="1.3"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${-52 + i * 7.6}" y="-11" width="3" height="5" ${SOLID}/>`).join('')}<path d="M-10,-14 V-34 H22 V-14" ${L2} stroke-width="1.3"/><path d="M-10,-34 L6,-44 L22,-34 Z" ${L3} stroke-width="1.1"/>
<path d="M-4,-34 V-58 L-1,-64 L2,-58 V-34 M10,-34 V-58 L13,-64 L16,-58 V-34" ${L3} stroke-width="1.2"/><path d="M24,-14 V-50 H34 V-14 Z" ${L2} stroke-width="1.3"/><path d="M24,-50 Q29,-60 34,-50 Z M27,-58 Q29,-66 31,-58 Z" ${SOLID}/><path d="M29,-66 V-72" stroke-width="1.2"/>`;
/** Karlsbrücke: Bögen über Breite w, Fahrbahn y */
const charles = (x: number, y: number, w: number, n: number, statues = false) => {
	const a = w / n;
	return `<path d="M${x},${y} H${x + w} V${y + 22} H${x} Z" ${L3} stroke-width="1.3"/>${Array.from({ length: n }, (_, i) => `<path d="M${f1(x + i * a + 3)},${y + 22} V${y + 12} Q${f1(x + i * a + a / 2)},${y + 2} ${f1(x + (i + 1) * a - 3)},${y + 12} V${y + 22} Z" ${PAPER}/>`).join('')}<path d="M${x - 2},${y} H${x + w + 2}" stroke-width="2"/>${
		statues ? Array.from({ length: n + 1 }, (_, i) => `<path d="M${f1(x + i * a)},${y} v-8" stroke-width="2.4"/><circle cx="${f1(x + i * a)}" cy="${y - 10}" r="1.8" ${SOLID}/>`).join('') : ''
	}`;
};
/** Turm von Český Krumlov */
const KRUMLOV = `<path d="M-7,0 V-40 H7 V0 Z" ${L2} stroke-width="1.3"/><path d="M-9,-40 H9 V-50 H-9 Z" ${SNOW} stroke-width="1.2"/><path d="M-6,-50 V-58 H6 V-50" ${L3} stroke-width="1.1"/><path d="M-7,-58 Q0,-66 7,-58 Z" ${SOLID}/><path d="M0,-64 Q-3,-70 0,-74 Q3,-70 0,-64" ${SOLID}/><path d="M0,-74 V-78" stroke-width="1"/><path d="M-5,-46 h3 v3 h-3 Z M2,-46 h3 v3 h-3 Z" ${SOLID}/>`;
/** Adolphe-Brücke (großer Bogen über die Schlucht) über Breite w, Fahrbahn y */
const adolphe = (x: number, y: number, w: number) =>
	`<path d="M${x},${y} H${x + w} V${y + 74} H${x + w - 12} Q${f1(x + w / 2)},${y + 4} ${x + 12},${y + 74} H${x} Z" ${L2} stroke-width="1.6"/><path d="${Array.from({ length: 9 }, (_, i) => {
		const t = (i + 1) / 10,
			xx = x + 12 + (w - 24) * t,
			yy = y + 74 - 70 * 4 * t * (1 - t) * 0.98;
		return `M${f1(xx)},${y + 2} V${f1(Math.max(y + 4, yy - 2))}`;
	}).join(' ')}" stroke-width="1"/><path d="M${x - 2},${y} H${x + w + 2}" stroke-width="2.6"/>`;
/* Bausteine Osteuropa */
/** Zwiebelkuppel an (x, y = Fuß), Breite r */
const onion = (x: number, y: number, r: number, f = SOLID) =>
	`<path d="M${f1(x - r)},${y} Q${f1(x - r * 1.3)},${f1(y - r * 1.2)} ${x},${f1(y - r * 2)} Q${f1(x + r * 1.3)},${f1(y - r * 1.2)} ${f1(x + r)},${y} Z" ${f}/><path d="M${x},${f1(y - r * 2)} V${f1(y - r * 2.6)} M${f1(x - r * 0.3)},${f1(y - r * 2.4)} H${f1(x + r * 0.3)}" stroke-width="1.1"/>`;
/** Rundturm mit Kegeldach (Burgmauer), Fuß (x, y) */
const rtower = (x: number, y: number, w: number, h: number, f = L2) =>
	`<path d="M${f1(x - w / 2)},${y} V${y - h} H${f1(x + w / 2)} V${y}" ${f} stroke-width="1.3"/><path d="M${f1(x - w / 2 - 1.5)},${y - h} L${x},${f1(y - h - w * 1.1)} L${f1(x + w / 2 + 1.5)},${y - h} Z" ${SOLID}/><rect x="${f1(x - 1.2)}" y="${f1(y - h + 5)}" width="2.4" height="4" ${SOLID}/>`;
/** Stadtmauer zwischen x1 und x2 mit Zinnen */
const wall = (x1: number, x2: number, y: number, h: number, f = L2) =>
	`<path d="M${x1},${y} V${y - h} H${x2} V${y}" ${f} stroke-width="1.3"/><path d="M${x1},${y - h} ${Array.from({ length: Math.floor((x2 - x1) / 6) }, () => 'v-3 h3 v3 h3').join(' ')}" stroke-width="1.1"/>`;
/** schlanker Kirchturm (Olaikirche, Petrikirche), Höhe h */
const steeple = (x: number, y: number, h: number, f = L2) =>
	`<path d="M${x - 6},${y} V${f1(y - h * 0.5)} H${x + 6} V${y}" ${f} stroke-width="1.3"/><path d="M${x - 4},${f1(y - h * 0.5)} V${f1(y - h * 0.62)} H${x + 4} V${f1(y - h * 0.5)}" ${f} stroke-width="1.1"/><path d="M${x - 5},${f1(y - h * 0.62)} L${x},${y - h} L${x + 5},${f1(y - h * 0.62)} Z" ${SOLID}/>`;
/** Weihnachtsbaum mit Stern */
const xtree = (x: number, y: number, h: number) => `${pine(x, y, h)}${dots([[x - h * 0.12, y - h * 0.3, 1.4], [x + h * 0.14, y - h * 0.18, 1.4], [x - h * 0.05, y - h * 0.56, 1.4], [x + h * 0.08, y - h * 0.42, 1.4]], STAR)}<path d="M${x},${y - h - 4} l1.4,3 h3 l-2.4,2 l1,3 l-3,-2 l-3,2 l1,-3 l-2.4,-2 h3 Z" ${STAR} stroke="none"/>`;
/** Marktstand mit Dach */
const STALL = `<path d="M-12,0 V-12 H12 V0" ${L3} stroke="none"/><path d="M-15,-12 L0,-20 L15,-12 Z" fill="#F4F7FA" fill-opacity=".85" stroke="none"/><path d="M-10,-6 H10" stroke="#F4F7FA" stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="2 2"/>`;
/** Freiheitsdenkmal Riga: Säule mit Milda und drei Sternen */
const MILDA = `<path d="M-14,0 V-10 H14 V0 Z M-10,-10 V-18 H10 V-10" ${L2} stroke-width="1.3"/><path d="M-4,-18 L-3,-74 H3 L4,-18 Z" ${SNOW} stroke-width="1.3"/><path d="M-3,-74 L-2,-84 H2 L3,-74 Z" ${SOLID}/><circle cx="0" cy="-87" r="2.4" ${SOLID}/><path d="M0,-84 L-6,-96 M0,-84 L6,-96 M0,-84 V-98" stroke-width="1.6"/>${[[-7, -98], [0, -101], [7, -98]].map(([x, y]) => `<path d="M${x},${y - 3} l1,2 h2 l-1.6,1.4 l.6,2.2 l-2,-1.2 l-2,1.2 l.6,-2.2 l-1.6,-1.4 h2 Z" ${SOLID}/>`).join('')}`;
/** Elch, Blick nach links */
const MOOSE = `<path d="M8,-22 H30 Q35,-22 35,-16 V-12 H33 V0 H30 V-12 H14 V0 H11 V-12 H8 Z" ${SOLID}/><path d="M10,-21 L2,-18 Q-2,-14 0,-10 L6,-11 L10,-14" ${SOLID}/><path d="M8,-22 Q2,-30 -4,-28 M8,-22 Q4,-32 10,-34 M6,-24 L0,-32" stroke-width="2"/><path d="M4,-11 v4" stroke-width="2"/>`;
/** Heißluftballon (gemustert) */
const balloon = (f = L3) => `<path d="M0,-34 C-12,-34 -14,-20 -6,-12 L-3,-6 H3 L6,-12 C14,-20 12,-34 0,-34 Z" ${f} stroke-width="1.2"/><path d="M0,-34 V-6 M-7,-30 Q-4,-20 -3,-6 M7,-30 Q4,-20 3,-6" stroke-width=".9"/><rect x="-2.6" y="-4" width="5.2" height="4" ${SOLID}/>`;
/** Burgruine auf dem Hügel (Spiš): Breite w */
const SPIS = `<path d="M-60,0 V-16 H-40 V-24 H-10 V-14 H20 V-30 H44 V-20 H60 V0" ${SNOW} stroke-width="1.3"/>${wall(-60, -40, -16, 0, 'fill="none"')}${rtower(-30, -24, 10, 18, SNOW)}${rtower(32, -30, 12, 22, SNOW)}<path d="M-6,-14 V-40 H8 V-14" ${SNOW} stroke-width="1.2"/><path d="M-8,-40 h3 v-3 h3 v3 h3 v-3 h3 v3 h3" stroke-width="1"/>${[-52, -20, 0, 26, 48].map((x) => `<rect x="${x}" y="-10" width="3" height="5" ${SOLID}/>`).join('')}`;
/** Fischerbastei (Türmchen mit Kegelhauben) */
const BASTEI = `<path d="M-60,0 V-20 H60 V0 Z" ${SNOW} stroke-width="1.3"/>${[-48, -36, -24, -12, 0, 12, 24, 36, 48].map((x) => `<path d="M${x - 3},-6 V-14 Q${x},-17 ${x + 3},-14 V-6 Z" ${SOLID}/>`).join('')}${[[-50, 14], [-22, 22], [6, 28], [34, 20], [56, 12]].map(([x, h]) => `${rtower(x, -20, 9, h, SNOW)}`).join('')}`;
/** Kettenbrücke (zwei Torbögen mit Ketten) über Breite w */
const chainbr = (x: number, y: number, w: number) => {
	const t1 = x + w * 0.3,
		t2 = x + w * 0.7;
	return `<path d="M${x},${y} H${x + w}" stroke-width="2.6"/>${[t1, t2].map((t) => `<path d="M${f1(t - 8)},${y + 14} V${y - 22} H${f1(t + 8)} V${y + 14} Z" ${SNOW} stroke-width="1.3"/><path d="M${f1(t - 4)},${y} V${y - 12} Q${t},${y - 17} ${f1(t + 4)},${y - 12} V${y} Z" ${PAPER}/><path d="M${f1(t - 9)},${y - 22} H${f1(t + 9)}" stroke-width="2"/>`).join('')}
<path d="M${x},${y - 4} Q${f1((x + t1) / 2)},${y - 4} ${f1(t1)},${y - 20} Q${f1((t1 + t2) / 2)},${y + 2} ${f1(t2)},${y - 20} Q${f1((t2 + x + w) / 2)},${y - 4} ${x + w},${y - 4}" stroke-width="1.8"/>`;
};
/** Ziehbrunnen der Puszta */
const WELL = `<path d="M0,0 V-34" stroke-width="2.6"/><path d="M-30,-6 L24,-42" stroke-width="2"/><path d="M-30,-6 V8" stroke-width="1"/><path d="M-12,0 H12 V-8 H-12 Z" ${L3} stroke-width="1.2"/><path d="M20,-44 h8 v6 h-8 Z" ${SOLID}/>`;
/** Paprika-Girlande */
const paprika = (x: number, y: number, n: number) => `<path d="M${x},${y} H${x + n * 7}" stroke-width="1"/>${Array.from({ length: n }, (_, i) => `<path d="M${x + i * 7 + 2},${y} q-2,8 1,14 q4,-6 2,-14 Z" ${SOLID}/>`).join('')}`;
/** Drachenbrücke-Drache (sitzend, Blick nach links) */
const DRAGON = `<path d="M8,0 V-10 Q8,-20 16,-22 Q20,-30 14,-36 Q6,-40 2,-34 L-4,-36 L0,-30 Q8,-28 6,-22 Q0,-18 0,-10 V0 Z" ${SOLID}/><path d="M16,-22 Q30,-26 34,-14 Q36,-4 26,0" stroke-width="2.6"/><path d="M16,-20 L24,-34 L30,-30 L28,-24 L34,-28 L32,-18" ${L3} stroke-width="1.3"/><circle cx="6" cy="-33" r="1" ${PAPER}/>`;
/** bemaltes Moldaukloster (Voroneț) */
const VORONET = `<path d="M-30,0 V-24 Q-30,-30 -24,-30 H24 Q30,-30 30,-24 V0 Z" ${L3} stroke-width="1.4"/><path d="M-34,-28 L-26,-40 H26 L34,-28 Z" ${SOLID}/><path d="M-6,-40 V-50 H6 V-40" ${L3} stroke-width="1.2"/><path d="M-8,-50 L0,-58 L8,-50 Z" ${SOLID}/><path d="M0,-58 V-64 M-2,-62 H2" stroke-width="1.1"/>
${[-22, -12, -2, 8, 18].map((x) => `<path d="M${x},-6 V-22 M${x + 4},-6 V-22" stroke="var(--stp)" stroke-width=".9"/><circle cx="${x + 2}" cy="-25" r="1.4" ${SNOW}/>`).join('')}`;
/** Fledermaus */
const BAT = `<path d="M0,0 Q-4,-3 -8,-1 Q-10,-4 -14,-3 Q-12,0 -14,3 Q-8,1 -4,4 Q-2,2 0,4 Q2,2 4,4 Q8,1 14,3 Q12,0 14,-3 Q10,-4 8,-1 Q4,-3 0,0 Z" ${SOLID}/>`;
/** Alexander-Newski-Kathedrale (goldene Kuppeln) */
const NEVSKI = `<path d="M-40,0 V-22 H40 V0 Z" ${SNOW} stroke-width="1.3"/>${[-30, -18, 18, 30].map((x) => `<path d="M${x - 5},-22 V-30 H${x + 5} V-22" ${SNOW} stroke-width="1.1"/><path d="M${x - 6},-30 Q${x},-40 ${x + 6},-30 Z" ${L3} stroke-width="1"/>`).join('')}<path d="M-12,-22 V-40 H12 V-22" ${SNOW} stroke-width="1.3"/><path d="M-14,-40 Q0,-62 14,-40 Z" ${L3} stroke-width="1.4"/><path d="M0,-55 V-64 M-3,-61 H3" stroke-width="1.2"/>
<path d="M44,0 V-50 H54 V0" ${SNOW} stroke-width="1.3"/><path d="M43,-50 Q49,-62 55,-50 Z" ${L3} stroke-width="1"/><path d="M-30,-4 V-14 Q-27,-18 -24,-14 V-4 Z M-4,0 V-12 Q0,-16 4,-12 V0 Z M24,-4 V-14 Q27,-18 30,-14 V-4 Z" ${SOLID}/>`;
/** gestreifte Arkaden (Rila-Kloster) */
const arcade = (x: number, y: number, n: number, w = 12, rows = 2) =>
	Array.from({ length: rows }, (_, r) => Array.from({ length: n }, (_, i) => {
		const ax = x + i * w,
			ay = y - r * 14;
		return `<path d="M${ax + 1},${ay} V${ay - 8} Q${ax + w / 2},${ay - 14} ${ax + w - 1},${ay - 8} V${ay} Z" ${PAPER}/><path d="M${ax + 1},${ay - 8} Q${ax + w / 2},${ay - 14} ${ax + w - 1},${ay - 8}" stroke-width="2" stroke-dasharray="2 1.4"/>`;
	}).join('')).join('');
/** Rose (große Blüte) */
const ROSE = `<path d="M0,0 V18" stroke-width="1.6"/><path d="M0,10 q-8,-4 -10,2 q6,2 10,-2 M0,14 q8,-4 10,2 q-6,2 -10,-2" ${L3} stroke-width="1"/><circle r="9" ${SOLID}/><path d="M-5,-2 Q0,-8 5,-2 Q0,4 -5,-2 M-7,2 Q0,8 7,2" stroke="var(--paper)" stroke-width="1.2"/>`;
/** Pobednik-Statue auf Säule (Belgrad) */
const POBEDNIK = `<path d="M-8,0 V-8 H8 V0 Z" ${L2} stroke-width="1.2"/><path d="M-3,-8 V-62 H3 V-8 Z" ${SNOW} stroke-width="1.2"/><path d="M-4,-62 H4 V-66 H-4 Z" ${SOLID}/><circle cx="0" cy="-76" r="2" ${SOLID}/><path d="M0,-74 V-66 M0,-72 L5,-80 M0,-72 L-4,-68" stroke-width="1.8"/><path d="M5,-80 l2,-3" stroke-width="1.2"/>`;
/** große Kuppelkirche (Hl. Sava) */
const SAVA = `<path d="M-40,0 V-24 H40 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-26,-24 V-40 H26 V-24" ${SNOW} stroke-width="1.3"/><path d="M-22,-40 Q-22,-70 0,-72 Q22,-70 22,-40 Z" ${L3} stroke-width="1.5"/><path d="M0,-72 V-82 M-4,-78 H4" stroke-width="1.4"/>${[-34, 34].map((x) => `<path d="M${x - 6},-24 V-34 H${x + 6} V-24" ${SNOW} stroke-width="1.1"/><path d="M${x - 6},-34 Q${x},-44 ${x + 6},-34 Z" ${L3} stroke-width="1"/>`).join('')}${[-30, -18, -6, 6, 18, 30].map((x) => `<path d="M${x - 2},-6 V-16 Q${x},-19 ${x + 2},-16 V-6 Z" ${SOLID}/>`).join('')}`;
/** Sebilj-Brunnen (Sarajevo) */
const SEBILJ = `<path d="M-14,0 V-22 H14 V0 Z" ${L2} stroke-width="1.3"/>${[-10, -3, 4, 11].map((x) => `<path d="M${x - 2},-4 V-16 Q${x},-19 ${x + 2},-16 V-4 Z" ${PAPER}/>`).join('')}<path d="M-18,-22 H18 L12,-28 H-12 Z" ${SOLID}/><path d="M-12,-28 Q-12,-42 0,-44 Q12,-42 12,-28 Z" ${L3} stroke-width="1.3"/><path d="M0,-44 V-50" stroke-width="1.2"/>`;
/** Taube */
const PIGEON = `<path d="M-6,0 Q-8,-6 -2,-8 Q2,-12 6,-8 L8,-8 L6,-6 Q6,-2 2,0 Z" ${L3} stroke-width="1"/>`;
/** Wasserfall-Stufen (Kravica): bewachsene Kalkkanten mit Wasservorhängen über Breite w */
const cascades = (x: number, y: number, w: number, n: number) =>
	Array.from({ length: n }, (_, i) => {
		const cx = x + (i * w) / n,
			cw = w / n,
			h = 14 + ((i * 7) % 12),
			ty = y + ((i * 5) % 8);
		return `<path d="M${f1(cx + 2)},${ty + h} C${f1(cx + 4)},${ty + 4} ${f1(cx + cw * 0.3)},${ty} ${f1(cx + cw / 2)},${ty} C${f1(cx + cw * 0.7)},${ty} ${f1(cx + cw - 4)},${ty + 4} ${f1(cx + cw - 2)},${ty + h} Z" ${SNOW} stroke-width="1.1"/><path d="M${f1(cx + cw * 0.3)},${ty + 3} V${ty + h - 1} M${f1(cx + cw * 0.5)},${ty + 1} V${ty + h} M${f1(cx + cw * 0.7)},${ty + 3} V${ty + h - 1}" stroke-width=".9"/>
<path d="M${f1(cx - 1)},${ty + 1} Q${f1(cx + cw / 2)},${ty - 9} ${f1(cx + cw + 1)},${ty + 1} Q${f1(cx + cw / 2)},${ty - 3} ${f1(cx - 1)},${ty + 1} Z" ${L3} stroke-width="1"/><path d="M${f1(cx + 3)},${ty + h + 2} q${f1(cw / 4)},-4 ${f1(cw / 2 - 3)},0 q${f1(cw / 4)},-4 ${f1(cw / 2 - 3)},0" stroke="var(--stp)" stroke-width="1.4"/>`;
	}).join('');
/** Mostar: Alte Brücke (Bogen) mit Türmen, Spannweite w */
const mostar = (x: number, y: number, w: number) =>
	`<path d="M${x - 14},${y + 50} V${y + 4} H${x} Q${f1(x + w / 2)},${y - 22} ${x + w},${y + 4} H${x + w + 14} V${y + 50} H${x + w} V${y + 10} Q${f1(x + w / 2)},${y - 10} ${x},${y + 10} V${y + 50} Z" ${L2} stroke-width="1.5"/>
<path d="M${x - 14},${y + 4} V${y - 14} H${x - 2} V${y + 4} M${x + w + 2},${y + 4} V${y - 18} H${x + w + 14} V${y + 4}" ${L3} stroke-width="1.3"/><path d="M${x - 15},${y - 14} L${x - 8},${y - 20} L${x - 1},${y - 14} Z M${x + w + 1},${y - 18} L${x + w + 8},${y - 24} L${x + w + 15},${y - 18} Z" ${SOLID}/>`;
/** Turmspringer im Sprung */
const DIVER = `<circle cx="0" cy="-6" r="2.4" ${SOLID}/><path d="M0,-3 L2,8 M-6,-8 L0,-4 L6,-8 M2,8 L-1,16 M2,8 L5,15" stroke-width="2"/>`;
/** Holzboot von Ohrid */
const ROWBOAT = `<path d="M-16,0 Q0,6 16,0 L14,-4 H-14 Z" ${SOLID}/><path d="M-4,-4 L-12,-14 M4,-4 L12,-14" stroke-width="1.2"/>${PERSON.replace(/<circle/, '<circle transform="translate(0,-2)"')}`;
/** Höhlenkloster an der Felskante (Orheiul Vechi) */
const ORHEI = `<path d="M-50,0 Q-48,-30 -20,-36 Q10,-40 40,-30 Q52,-20 50,0 Z" ${L3} stroke-width="1.6"/><path d="M-30,-20 h6 v6 h-6 Z M-14,-24 h6 v6 h-6 Z" ${SOLID}/><path d="M10,-38 V-50 H22 V-38" ${SNOW} stroke-width="1.2"/><path d="M8,-50 L16,-58 L24,-50 Z" ${SOLID}/><path d="M16,-58 V-64 M13,-61 H19" stroke-width="1.2"/>`;
/** Weinfässer */
const barrel = (x: number, y: number, r: number) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r}" ${L3} stroke-width="1.4"/><ellipse cx="${x}" cy="${y}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.6)}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.18)}" ${SOLID}/>`;
/** Kerze */
const candle = (x: number, y: number) => `<rect x="${x - 2}" y="${y - 10}" width="4" height="10" fill="#F4F7FA" fill-opacity=".8" stroke="none"/><path d="M${x},${y - 11} q-2,-3 0,-6 q2,3 0,6 Z" fill="#F7E3A1" stroke="none"/><circle cx="${x}" cy="${y - 14}" r="6" fill="#F7E3A1" fill-opacity=".18" stroke="none"/>`;
/** Höhlenkloster Lawra: goldene Kuppeln, Glockenturm */
const LAVRA = `<path d="M-36,0 V-22 H24 V0 Z" ${SNOW} stroke-width="1.3"/>${onion(-24, -22, 6, L3)}${onion(12, -22, 6, L3)}<path d="M-12,-22 V-34 H0 V-22" ${SNOW} stroke-width="1.2"/>${onion(-6, -34, 9, L3)}
<path d="M30,0 V-58 H42 V0" ${SNOW} stroke-width="1.3"/><path d="M28,-30 H44 M28,-44 H44" stroke-width="1.4"/>${onion(36, -58, 6, L3)}<path d="M-28,-4 V-12 Q-25,-16 -22,-12 V-4 Z M-8,0 V-10 Q-5,-14 -2,-10 V0 Z M8,-4 V-12 Q11,-16 14,-12 V-4 Z" ${SOLID}/>`;
/** Burg Mir (Ziegel mit Ecktürmen) */
const MIR = `<path d="M-40,0 V-30 H40 V0 Z" ${L2} stroke-width="1.3"/>${[-40, -14, 14, 40].map((x, i) => `<path d="M${x - 7},0 V${i % 3 ? -44 : -50} H${x + 7} V0" ${SNOW} stroke-width="1.2"/><path d="M${x - 8},${i % 3 ? -44 : -50} Q${x},${i % 3 ? -56 : -64} ${x + 8},${i % 3 ? -44 : -50} Z" ${SOLID}/>${[-30, -16].map((y) => `<rect x="${x - 1.4}" y="${y}" width="2.8" height="5" ${SOLID}/>`).join('')}`).join('')}<path d="M-30,-20 H-22 M22,-20 H30" stroke="var(--stp)" stroke-width="1.6" stroke-dasharray="2 2"/><path d="M-4,0 V-12 Q0,-16 4,-12 V0 Z" ${SOLID}/>`;
/** Peter-und-Paul-Kathedrale (Turmnadel) */
const NEEDLE = `<path d="M-20,0 V-20 H20 V0 Z" ${L2} stroke-width="1.3"/><path d="M-8,-20 V-44 H8 V-20" ${SNOW} stroke-width="1.2"/><path d="M-6,-44 V-56 H6 V-44" ${L2} stroke-width="1.1"/><path d="M-4,-56 L0,-106 L4,-56 Z" ${L3} stroke-width="1"/><path d="M0,-106 V-112 M-2,-110 H2" stroke-width="1"/>`;
/** Basilius-Kathedrale (vereinfachte Zwiebeltürme) */
const BASIL = `<path d="M-36,0 V-20 H36 V0 Z" ${L2} stroke-width="1.3"/>${[[-26, -20, 6, 14], [26, -20, 6, 14], [-12, -20, 7, 26], [12, -20, 7, 26]].map(([x, y, r, h]) => `<path d="M${x - r * 0.8},${y} V${y - h} H${x + r * 0.8} V${y}" ${SNOW} stroke-width="1.1"/>${onion(x, y - h, r, [SOLID, L3][Math.abs(x) % 2])}`).join('')}<path d="M-6,-20 V-56 L0,-66 L6,-56 V-20" ${SNOW} stroke-width="1.2"/>${onion(0, -66, 5)}<path d="M-6,-40 H6 M-6,-48 H6" stroke-width="1"/>`;
/** Kremlturm (Spasski) */
const SPASSKI = `<path d="M-10,0 V-40 H10 V0 Z" ${L3} stroke-width="1.3"/><path d="M-8,-40 V-54 H8 V-40" ${L3} stroke-width="1.2"/><circle cx="0" cy="-47" r="4" ${SNOW} stroke-width="1"/><path d="M-6,-54 L0,-76 L6,-54 Z" ${SOLID}/><path d="M0,-76 l1.6,3 h3 l-2.4,2 l1,3 l-3.2,-2 l-3.2,2 l1,-3 l-2.4,-2 h3 Z" ${STAR} stroke="none"/><path d="M-4,0 V-12 Q0,-16 4,-12 V0 Z" ${SOLID}/>`;
/** Kloster Gračanica: gestaffelte Kuppeln */
const GRACANICA = `<path d="M-34,0 V-18 H34 V0 Z" ${L2} stroke-width="1.3"/><path d="M-24,-18 V-30 H24 V-18" ${L2} stroke-width="1.2"/>${[-20, 20].map((x) => `<path d="M${x - 5},-30 V-38 H${x + 5} V-30" ${SNOW} stroke-width="1"/><path d="M${x - 6},-38 Q${x},-46 ${x + 6},-38 Z" ${SOLID}/>`).join('')}<path d="M-8,-30 V-48 H8 V-30" ${SNOW} stroke-width="1.2"/><path d="M-9,-48 Q0,-60 9,-48 Z" ${SOLID}/><path d="M0,-58 V-64 M-2,-62 H2" stroke-width="1.2"/>${[-26, -14, 14, 26].map((x) => `<path d="M${x - 2},-4 V-12 Q${x},-15 ${x + 2},-12 V-4 Z" ${SOLID}/>`).join('')}`;
/** Eisberg (Breite ca. 60) */
const ICEBERG = `<path d="M-30,0 L-22,-20 L-12,-24 L-6,-40 L4,-34 L10,-46 L20,-28 L30,0 Z" ${SNOW} stroke-width="1.5"/><path d="M-6,-40 L-2,-10 M10,-46 L8,-16 M-22,-20 L-14,-4" stroke-width="1"/><path d="M-30,0 L-20,10 H20 L30,0" ${L1} stroke-width="1" stroke-dasharray="2 2"/>`;
/** Walflosse über dem Wasser */
const FLUKE = `<path d="M0,0 Q-2,-10 0,-14 Q-8,-18 -16,-16 Q-8,-22 0,-18 Q8,-22 16,-16 Q8,-18 0,-14 Q2,-10 0,0 Z" ${SOLID}/><path d="M-10,-14 v3 M-4,-18 v4 M6,-18 v4" stroke="var(--stp)" stroke-width="1"/>`;
/** Hundeschlitten, Blick nach links */
const DOGSLED = `${[0, 12, 24].map((x) => `<path d="M${x},-6 Q${x + 2},-10 ${x + 8},-10 L${x + 10},-13 L${x + 11},-9 Q${x + 12},-6 ${x + 10},-5 V0 M${x + 2},-5 V0" ${SOLID} stroke="currentColor" stroke-width="1.6"/>`).join('')}<path d="M10,-8 H60" stroke-width="1"/><path d="M40,0 H66 Q70,0 70,-4 M44,-2 V-10 H64 V-2" stroke-width="1.6"/>${PERSON.replace('<circle cx="0"', '<circle cx="0"').replace(/^/, '<g transform="translate(60,-8) scale(.7)">') + '</g>'}`;
/** Haus mit Grasdach */
const GRASSHUT = `<path d="M-14,0 V-12 H14 V0 Z" ${L3} stroke-width="1.3"/><path d="M-17,-11 L0,-22 L17,-11 Z" ${L2} stroke-width="1.3"/><path d="M-14,-13 q2,-2 4,0 q2,-2 4,0 q2,-2 4,0 q2,-2 4,0" stroke-width="1"/><path d="M-3,0 V-7 H3 V0 M7,-8 h4 v3 h-4 Z" ${SNOW}/>`;
/** Felsnadeln im Meer (Drangarnir) */
const STACKS = `<path d="M-30,0 Q-32,-26 -24,-34 L-18,-30 L-14,0 Z" ${L3} stroke-width="1.5"/><path d="M-4,0 V-22 Q2,-50 10,-48 Q18,-36 16,-20 L20,0 Z" ${L3} stroke-width="1.5"/><path d="M0,-6 Q6,-14 10,-6" ${PAPER}/>`;
/** Bockwindmühle (Åland) */
const POSTMILL = `<path d="M-4,0 L-1,-16 L4,0 M-6,-6 H6" stroke-width="1.4"/><path d="M-8,-16 V-30 L0,-36 L8,-30 V-16 Z" ${SOLID}/><g transform="translate(0,-26) rotate(20)"><path d="M0,0 V-18 M0,0 H18 M0,0 V18 M0,0 H-18" stroke-width="1.4"/><path d="M0,-18 h4 v12 h-4 Z M18,0 v4 h-12 v-4 Z M0,18 h-4 v-12 h4 Z M-18,0 v-4 h12 v4 Z" ${L2} stroke-width=".9"/></g>`;
/** rotes Bootshaus */
const BOATHOUSE = `<path d="M-14,0 V-12 H14 V0 Z" ${SOLID}/><path d="M-17,-11 L0,-22 L17,-11 Z" ${L3} stroke-width="1.2"/><path d="M-8,0 V-9 H8 V0" ${PAPER}/><path d="M-14,0 V-12 M14,0 V-12" stroke="var(--stp)" stroke-width="1.6"/>`;
/** Little Chapel (Guernsey): winzige Kapelle mit Mosaik */
const LITCHAPEL = `<path d="M-14,0 V-18 H14 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-16,-18 L0,-30 L16,-18 Z" ${L3} stroke-width="1.2"/><path d="M-4,-30 V-38 H4 V-30" ${SNOW} stroke-width="1.1"/><path d="M-5,-38 L0,-48 L5,-38 Z" ${SOLID}/><path d="M-4,0 V-10 Q0,-14 4,-10 V0 Z" ${SOLID}/>${dots([[-10, -14, 1.2], [-6, -6, 1.2], [8, -14, 1.2], [10, -6, 1.2], [0, -22, 1.2], [-8, -21, 1], [8, -21, 1]], L3)}`;
/** Motorradfahrer (TT), Blick nach rechts */
const MOTO = `<circle cx="-12" cy="-6" r="6" stroke-width="2"/><circle cx="14" cy="-6" r="6" stroke-width="2"/><path d="M-12,-6 L-2,-14 H8 L14,-6 M-4,-14 L2,-20 H10 L14,-14" stroke-width="2.2"/><path d="M-2,-16 Q2,-26 10,-24 L14,-20" ${SOLID} stroke="currentColor" stroke-width="2"/><circle cx="8" cy="-28" r="3.6" ${SOLID}/><path d="M-20,-16 h-8 M-22,-10 h-10 M-20,-4 h-6" stroke-width="1.2"/>`;
/** Manx-Katze (ohne Schwanz) */
const MANX = `<path d="M-12,0 Q-14,-12 -4,-14 H8 Q14,-14 14,-8 V0 H11 V-6 H-6 V0 H-9 V-6 Q-12,-4 -12,0 Z" ${SOLID}/><circle cx="12" cy="-18" r="6" ${SOLID}/><path d="M8,-22 L8,-28 L11,-23 M14,-23 L17,-28 L17,-22" ${SOLID}/><circle cx="10" cy="-18" r=".9" ${PAPER}/><circle cx="14" cy="-18" r=".9" ${PAPER}/><path d="M-12,-12 q-2,-2 -1,-4" stroke-width="2"/>`;
/** Walross */
const WALRUS = `<path d="M-30,0 Q-32,-10 -20,-14 Q-6,-20 6,-18 Q16,-20 20,-12 Q24,-4 20,0 Z" ${SOLID}/><path d="M14,-8 L13,4 M18,-8 L18,4" stroke="var(--stp)" stroke-width="1.8"/><circle cx="14" cy="-14" r="1" ${PAPER}/><path d="M-30,0 L-36,-4 M-30,0 L-36,4" stroke-width="2"/>`;
/** Moschee mit Kuppeln und Minaretten (Istanbul), Breite ca. 100 */
const MOSQUE = `<path d="M-40,0 V-16 H40 V0 Z" ${L2} stroke-width="1.3"/>${[-26, 26].map((x) => `<path d="M${x - 8},-16 Q${x},-28 ${x + 8},-16 Z" ${L3} stroke-width="1.1"/>`).join('')}<path d="M-14,-16 Q-14,-30 0,-30 Q14,-30 14,-16" ${L3} stroke-width="1.3"/><path d="M-24,-30 H24 V-16" stroke="none"/><path d="M-20,-24 Q-20,-46 0,-48 Q20,-46 20,-24 Z" ${L3} stroke-width="1.5"/><path d="M0,-48 V-54" stroke-width="1.2"/><path d="M-1.6,-56 a1.6,1.6 0 1 0 3.2,0" stroke-width="1"/>
${[-48, -40, 40, 48].map((x, i) => `<path d="M${x - 2},0 V${i % 3 ? -54 : -62} H${x + 2} V0 Z" ${SNOW} stroke-width="1"/><path d="M${x - 2},${i % 3 ? -54 : -62} L${x},${i % 3 ? -64 : -72} L${x + 2},${i % 3 ? -54 : -62} Z" ${SOLID}/><path d="M${x - 3.4},${i % 3 ? -42 : -48} H${x + 3.4}" stroke-width="1.4"/>`).join('')}`;
/** Sinterterrassen (Pamukkale): Reihen runder weißer Becken am Hang ab Höhe y */
const terraces = (y: number, rows: number, w = 270) =>
	Array.from({ length: rows }, (_, r) => {
		const ty = y + r * 13,
			n = 5 + r,
			bw = w / n;
		return Array.from({ length: n }, (_, i) => {
			const bx = i * bw + ((r % 2) * bw) / 2 - bw / 4;
			return `<path d="M${f1(bx)},${ty} H${f1(bx + bw - 3)} Q${f1(bx + bw - 1)},${ty + 10} ${f1(bx + bw / 2)},${ty + 11} Q${f1(bx + 1)},${ty + 10} ${f1(bx)},${ty} Z" ${SNOW} stroke-width="1.2"/><path d="M${f1(bx + 3)},${ty + 2.4} H${f1(bx + bw - 6)}" ${L2} stroke-width="2.6"/><path d="M${f1(bx + bw * 0.3)},${ty + 6} v4 M${f1(bx + bw * 0.6)},${ty + 6} v5" stroke-width=".9"/>`;
		}).join('');
	}).join('');
/** Feenkamin (Kappadokien) */
const chimney = (x: number, y: number, h: number) => `<path d="M${x - 6},${y} Q${x - 5},${y - h * 0.6} ${x - 3},${y - h * 0.9} H${x + 3} Q${x + 5},${y - h * 0.6} ${x + 6},${y} Z" ${L3} stroke-width="1.3"/><path d="M${x - 6},${y - h * 0.9} Q${x},${y - h - 6} ${x + 6},${y - h * 0.9} Z" ${SOLID}/><rect x="${x - 1.4}" y="${f1(y - h * 0.5)}" width="2.8" height="4" ${SOLID}/>`;
/* Bausteine Kaukasus und Naher Osten */
/** georgische Kreuzkuppelkirche (Gergeti) */
const GERGETI = `<path d="M-20,0 V-14 H20 V0 Z" ${L2} stroke-width="1.3"/><path d="M-22,-14 L0,-22 L22,-14 Z" ${SOLID}/><path d="M-6,-20 V-34 H6 V-20" ${L2} stroke-width="1.2"/><path d="M-7,-34 L0,-44 L7,-34 Z" ${SOLID}/><path d="M22,0 V-20 H30 V0" ${L2} stroke-width="1.1"/><path d="M21,-20 L26,-28 L31,-20 Z" ${SOLID}/><rect x="-1.4" y="-30" width="2.8" height="5" ${SOLID}/>`;
/** Swanetischer Wehrturm */
const SVAN = `<path d="M-6,0 V-44 H6 V0 Z" ${L2} stroke-width="1.3"/><path d="M-7,-44 L0,-50 L7,-44 Z" ${SOLID}/><rect x="-1.4" y="-38" width="2.8" height="4" ${SOLID}/><rect x="-1.4" y="-24" width="2.8" height="4" ${SOLID}/><path d="M-6,0 V-10 H-14 V0 Z" ${L3} stroke-width="1"/>`;
/** Holzbalkone (Tiflis) */
const balcony = (x: number, y: number, w: number) => `<path d="M${x},${y} H${x + w} V${y - 14} H${x} Z" ${SNOW} stroke-width="1.2"/><path d="M${x},${y - 7} H${x + w}" stroke-width="1"/>${Array.from({ length: Math.floor(w / 5) }, (_, i) => `<path d="M${x + 2.5 + i * 5},${y} v-6" stroke-width=".8"/>`).join('')}<path d="M${x - 2},${y - 14} H${x + w + 2} L${x + w},${y - 18} H${x} Z" ${SOLID}/>`;
/** Ararat mit Kleinem Ararat */
const ARARAT = (y: number, w = 180) =>
	`<path d="M${f1(w * 0.05)},${y} L${f1(w * 0.36)},${y - 70} Q${f1(w * 0.4)},${y - 76} ${f1(w * 0.44)},${y - 70} L${f1(w * 0.62)},${y - 38} L${f1(w * 0.72)},${y - 46} L${f1(w * 0.95)},${y} Z" ${L1} stroke-width="1.8"/><path d="M${f1(w * 0.36)},${y - 70} Q${f1(w * 0.4)},${y - 76} ${f1(w * 0.44)},${y - 70} L${f1(w * 0.5)},${y - 58} L${f1(w * 0.45)},${y - 60} L${f1(w * 0.41)},${y - 54} L${f1(w * 0.37)},${y - 60} L${f1(w * 0.31)},${y - 58} Z M${f1(w * 0.72)},${y - 46} L${f1(w * 0.76)},${y - 39} L${f1(w * 0.72)},${y - 40} L${f1(w * 0.68)},${y - 38} Z" ${SNOW} stroke-width="1.1"/>`;
/** armenisches Kloster mit Kegelkuppel */
const ARMCH = `<path d="M-18,0 V-16 H18 V0 Z" ${L2} stroke-width="1.3"/><path d="M-20,-16 L0,-22 L20,-16 Z" ${SOLID}/><path d="M-6,-20 V-30 H6 V-20" ${L2} stroke-width="1.2"/><path d="M-7,-30 L0,-42 L7,-30 Z" ${SOLID}/><path d="M0,-42 V-47 M-2,-45 H2" stroke-width="1.1"/>`;
/** Tempel von Garni */
const GARNI = `<path d="M-30,0 V-4 H30 V0 Z M-26,-4 V-8 H26 V-4" ${L3} stroke-width="1.1"/>${[-22, -13, -4, 4, 13, 22].map((x) => `<path d="M${x - 1.8},-8 V-30 H${x + 1.8} V-8" ${SNOW} stroke-width="1"/>`).join('')}<path d="M-28,-30 H28 V-35 H-28 Z" ${SOLID}/><path d="M-28,-35 L0,-46 L28,-35 Z" ${L2} stroke-width="1.2"/>`;
/** Granatapfel */
const POMEGRANATE = `<circle r="9" ${SOLID}/><path d="M-3,-8 L-4,-13 L-1,-11 L0,-14 L1,-11 L4,-13 L3,-8" ${SOLID}/><path d="M-4,-3 q3,-3 6,-1" stroke="var(--paper)" stroke-width="1.2"/>`;
/** Jungfrauenturm (Baku) */
const MAIDEN = `<path d="M-12,0 V-50 Q-12,-54 -8,-54 H8 Q12,-54 12,-50 V0 Z" ${L2} stroke-width="1.4"/><path d="M12,-12 Q20,-12 20,-4 V0 H12" ${L2} stroke-width="1.2"/><path d="M-12,-54 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3" stroke-width="1.2"/><path d="M-12,-40 H12 M-12,-26 H12 M-12,-12 H12" stroke-width="1" stroke-dasharray="3 2"/><rect x="-2" y="-34" width="4" height="6" ${SOLID}/>`;
/** Flame Towers (drei Flammen), Höhe h */
const flames = (h: number, f = L3) => [[-18, 0.8], [0, 1], [18, 0.86]].map(([x, k]) => `<path d="M${x - 9},0 Q${x - 11},${f1(-h * k * 0.5)} ${x - 4},${f1(-h * k * 0.85)} Q${x},${f1(-h * k)} ${x + 2},${f1(-h * k)} Q${x + 10},${f1(-h * k * 0.6)} ${x + 9},0 Z" ${f} stroke-width="1.4"/><path d="M${x - 6},${f1(-h * k * 0.3)} H${x + 7} M${x - 6},${f1(-h * k * 0.55)} H${x + 6}" stroke-width=".9"/>`).join('');
/** Tafelberg Masada */
const MASADA = (y: number) => `<path d="M10,${y} L40,${y - 50} H130 L160,${y}" ${L3} stroke-width="2"/><path d="M40,${y - 50} H130" stroke-width="3"/><path d="M56,${y - 50} V${y - 56} H70 V${y - 50} M100,${y - 50} V${y - 54} H116 V${y - 50}" ${SNOW} stroke-width="1.1"/><path d="M50,${y - 40} L44,${y - 6} M80,${y - 44} L76,${y - 8} M110,${y - 44} L114,${y - 8}" stroke-width="1"/>`;
/** Steinbock (Nubischer), Blick nach rechts */
const IBEX = `<path d="M2,-12 Q2,-18 10,-18 H22 Q26,-18 27,-14 L25,-10 H6 Q2,-10 2,-12 Z" ${SOLID}/><path d="M7,-10 V0 M11,-10 V0 M21,-10 V0 M24,-10 V0" stroke-width="1.8"/><path d="M25,-16 L30,-22 L34,-20 L30,-14 Z" ${SOLID}/><path d="M30,-22 Q28,-34 18,-34" stroke-width="2.2"/><path d="M34,-18 l2,4" stroke-width="1.2"/>`;
/** Felsentempel (Petra): Fassade in Fels, Breite ca. 60 */
const PETRA = (night = false) => `<path d="M-40,0 V-80 H40 V0 Z" ${night ? L4 : L2} stroke="none"/><path d="M-26,0 V-30 H26 V0" ${night ? L3 : SNOW} stroke-width="1.3"/>${[-20, -8, 8, 20].map((x) => `<path d="M${x},-2 V-28" stroke-width="2"/>`).join('')}<path d="M-28,-30 L0,-40 L28,-30 Z" ${night ? L3 : SNOW} stroke-width="1.2"/>
<path d="M-24,-44 V-70 H-12 V-44 M12,-44 V-70 H24 V-44" ${night ? L3 : SNOW} stroke-width="1.2"/><path d="M-6,-44 V-64 Q0,-72 6,-64 V-44" ${night ? L3 : SNOW} stroke-width="1.2"/><path d="M-26,-44 H26" stroke-width="2"/><path d="M-4,0 V-16 H4 V0" ${SOLID}/>`;
/** Felsnadel in der Wüste (Wadi Rum) */
const RUMROCK = `<path d="M-40,0 Q-38,-30 -26,-44 Q-14,-56 0,-50 Q14,-60 26,-46 Q38,-30 40,0 Z" ${L3} stroke-width="1.8"/><path d="M-26,-40 Q-22,-20 -24,-2 M-8,-50 Q-10,-24 -8,-2 M12,-52 Q14,-26 12,-2 M28,-40 Q26,-20 28,-2" stroke-width="1"/>`;
/** Säulen von Baalbek */
const BAALBEK = `<path d="M-40,0 V-6 H40 V0 Z" ${L3} stroke-width="1.2"/>${[-30, -18, -6, 6].map((x) => `<path d="M${x - 3},-6 V-60 H${x + 3} V-6" ${SNOW} stroke-width="1.2"/><path d="M${x - 1},-10 V-56" stroke-width=".8"/>`).join('')}<path d="M-34,-60 H10 V-70 H-34 Z" ${L3} stroke-width="1.2"/><path d="M-34,-66 H10" stroke-width=".9" stroke-dasharray="2 2"/><path d="M18,0 V-22 H26 V0 M30,0 V-12 H36 V0" ${SNOW} stroke-width="1.1"/>`;
/** Zeder (vereinfacht), Größe s */
const CEDAR = `<path d="M0,0 V-30" stroke-width="3"/><path d="M-26,-12 Q0,-18 26,-12 Q16,-6 0,-8 Q-16,-6 -26,-12 Z M-20,-24 Q0,-30 20,-24 Q12,-18 0,-20 Q-12,-18 -20,-24 Z M-12,-36 Q0,-42 12,-36 Q6,-30 0,-32 Q-6,-30 -12,-36 Z" ${SOLID}/>`;
/** Felsgrab von Hegra (Qasr al-Farid) */
const HEGRA = `<path d="M-30,0 Q-34,-40 -24,-62 Q-10,-74 10,-70 Q30,-66 32,-40 Q34,-16 30,0 Z" ${L3} stroke-width="1.8"/><path d="M-14,0 V-30 H14 V0" ${SNOW} stroke-width="1.3"/><path d="M-16,-30 H16 M-14,-34 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l3,6" stroke-width="1.3"/><path d="M-4,0 V-16 H4 V0" ${SOLID}/><path d="M-20,-60 Q-16,-30 -20,-6 M20,-60 Q24,-30 22,-6" stroke-width="1"/>`;
/** Elefantenfelsen */
const ELEROCK = `<path d="M-40,0 Q-42,-26 -30,-38 Q-10,-50 14,-44 Q30,-40 34,-26 Q36,-16 32,-10 Q28,-4 30,0 H18 Q16,-14 10,-16 Q4,-12 2,0 Z" ${L4} stroke-width="1.6"/>`;
/** Scheich-Zayid-Moschee (weiße Kuppeln) */
const ZAYED = `<path d="M-50,0 V-14 H50 V0 Z" ${SNOW} stroke-width="1.3"/>${[-34, -18, 18, 34].map((x) => `<path d="M${x - 7},-14 Q${x - 7},-26 ${x},-28 Q${x + 7},-26 ${x + 7},-14 Z" ${SNOW} stroke-width="1.2"/><path d="M${x},-28 V-32" stroke-width="1"/>`).join('')}<path d="M-14,-14 Q-14,-40 0,-42 Q14,-40 14,-14 Z" ${SNOW} stroke-width="1.4"/><path d="M0,-42 V-48" stroke-width="1.2"/>
${[-56, 56].map((x) => `<path d="M${x - 2.4},0 V-56 H${x + 2.4} V0" ${SNOW} stroke-width="1.1"/><path d="M${x - 2.4},-56 L${x},-62 L${x + 2.4},-56 Z" ${SOLID}/><path d="M${x - 4},-40 H${x + 4}" stroke-width="1.4"/>`).join('')}${[-40, -28, -16, -4, 8, 20, 32, 44].map((x) => `<path d="M${x - 2},-2 V-9 Q${x},-12 ${x + 2},-9 V-2 Z" ${SOLID}/>`).join('')}`;
/** Burj al Arab (Segel) */
const BURJARAB = `<path d="M-4,0 L-6,-70 Q10,-60 14,-36 Q16,-16 10,0 Z" ${SNOW} stroke-width="1.4"/><path d="M-6,-70 L-8,0" stroke-width="2"/><path d="M-4,-56 Q6,-48 10,-34 M-4,-40 Q6,-32 11,-18" stroke-width="1"/><path d="M10,-20 h10 v3 h-10 Z" ${SOLID}/>`;
/** Burj Khalifa, Höhe h */
const khalifa = (h: number) => `<path d="M-10,0 L-8,${f1(-h * 0.3)} L-6,${f1(-h * 0.55)} L-4,${f1(-h * 0.75)} L-2,${f1(-h * 0.9)} L0,${-h} L2,${f1(-h * 0.9)} L4,${f1(-h * 0.75)} L6,${f1(-h * 0.55)} L8,${f1(-h * 0.3)} L10,0 Z" ${L3} stroke-width="1.2"/><path d="M0,0 V${f1(-h * 0.92)}" stroke-width=".8"/>`;
/** Falke im Flug */
const FALCON = `<path d="M0,0 Q-8,-6 -20,-4 Q-10,-2 -4,2 Q-2,4 0,6 Q2,4 4,2 Q10,-2 20,-4 Q8,-6 0,0 Z" ${SOLID}/><path d="M0,6 L-3,12 H3 Z" ${SOLID}/><circle cx="0" cy="-1" r="2.4" ${SOLID}/>`;
/** Museum für Islamische Kunst (Doha) */
const MIA = `<path d="M-30,0 V-16 H30 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-20,-16 V-30 H20 V-16" ${SNOW} stroke-width="1.3"/><path d="M-12,-30 V-42 H12 V-30" ${SNOW} stroke-width="1.3"/><path d="M-6,-42 V-50 H6 V-42" ${SNOW} stroke-width="1.2"/><path d="M-4,-40 Q0,-36 4,-40" stroke-width="1.2"/><path d="M-8,0 V-8 H8 V0" ${SOLID}/>`;
/** Arabische Oryx, Blick nach links */
const ORYX = `<path d="M6,-16 Q8,-22 16,-22 H28 Q32,-22 32,-16 V0 H29 V-10 H26 V0 H23 V-10 H14 V0 H11 V-10 H8 V0 H6 Z" ${SNOW} stroke-width="1.3"/><path d="M8,-20 L2,-20 Q-1,-18 0,-14 L6,-14" ${SNOW} stroke-width="1.2"/><path d="M4,-20 L10,-40 M6,-20 L13,-40" stroke-width="1.4"/><path d="M1,-17 h3" stroke-width="1.4"/><path d="M8,-10 V0 M30,-10 V0" stroke-width="1"/>`;
/** Rundturm des Forts von Nizwa */
const NIZWA = `<path d="M-24,0 V-40 Q-24,-46 -18,-46 H18 Q24,-46 24,-40 V0 Z" ${L2} stroke-width="1.4"/><path d="M-24,-46 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4" stroke-width="1.2"/><path d="M-24,-30 H24 M-24,-16 H24" stroke-width=".9" stroke-dasharray="3 2"/><rect x="-3" y="-38" width="6" height="6" ${SOLID}/><path d="M24,0 V-20 H44 V0" ${L3} stroke-width="1.2"/>`;
/** Weihrauchbaum */
const FRANK = `<path d="M0,0 Q-2,-12 2,-20 M2,-20 Q-8,-28 -16,-26 M2,-20 Q8,-30 18,-30 M0,-14 Q10,-16 16,-12" stroke-width="2.6"/><path d="M-24,-30 Q-16,-38 -8,-30 Q-14,-26 -24,-30 Z M10,-34 Q18,-42 26,-34 Q20,-30 10,-34 Z M12,-14 Q20,-20 26,-14 Q20,-10 12,-14 Z" ${L3} stroke-width="1.2"/>`;
/** Baum des Lebens (Bahrain) */
const TREELIFE = `<path d="M-4,0 Q-2,-14 -6,-24 M4,0 Q2,-14 6,-24" stroke-width="3"/><path d="M-40,-24 Q-30,-52 0,-54 Q30,-52 40,-24 Q20,-14 0,-18 Q-20,-14 -40,-24 Z" ${SOLID}/><path d="M-30,-30 Q0,-40 30,-30" stroke="var(--paper)" stroke-width="1.2"/>`;
/** World Trade Center Bahrain (Segel mit Windrädern) */
const BWTC = `${[-14, 14].map((s) => `<path d="M${s > 0 ? 4 : -4},0 L${s > 0 ? 6 : -6},-70 Q${s * 1.6},-40 ${s * 1.4},0 Z" ${SNOW} stroke-width="1.3"/>`).join('')}${[-50, -36, -22].map((y) => `<path d="M-6,${y} H6" stroke-width="2"/><circle cx="0" cy="${y}" r="5" stroke-width="1"/>`).join('')}`;
/** Perlentaucher unter Wasser */
const DIVERP = `<path d="M0,0 L-6,-10 L-14,-12 M0,0 L10,-4 M-6,-10 L-4,-20 M-4,-20 L4,-26 M-4,-20 L-12,-24" stroke-width="2.4"/><circle cx="-4" cy="-24" r="0" /><circle cx="6" cy="-28" r="3" ${SOLID}/><path d="M-10,8 L-14,16 M2,6 L4,14" stroke-width="2"/>`;
/** Befreiungsturm (Kuwait) */
const LIBTOWER = `<path d="M-6,0 L-4,-80 H4 L6,0 Z" ${L2} stroke-width="1.3"/><path d="M-9,-60 H9 V-72 H-9 Z" ${SNOW} stroke-width="1.2"/><path d="M-4,-80 L0,-104 L4,-80" stroke-width="1.6"/><path d="M-12,0 H12" stroke-width="2"/>`;
/** Stickmuster (Tatreez): Kreuzstich-Rauten */
const tatreez = (x: number, y: number, n: number, k = 1) => Array.from({ length: n }, (_, i) => `<path d="M${x + i * 14 * k},${y} l${7 * k},${-7 * k} l${7 * k},${7 * k} l${-7 * k},${7 * k} Z" ${SOLID}/><path d="M${x + i * 14 * k + 7 * k},${y - 3 * k} v${6 * k} M${x + i * 14 * k + 4 * k},${y} h${6 * k}" stroke="var(--paper)" stroke-width="1"/>`).join('');
/** Olivenbaum mit Krone und knorrigem Stamm */
const OLIVETREE = `<path d="M-4,0 Q-8,-12 -2,-22 Q2,-28 -2,-34 M4,0 Q8,-14 4,-24" stroke-width="3.4"/><path d="M-30,-30 Q-26,-48 -6,-48 Q4,-58 18,-50 Q34,-46 32,-30 Q24,-22 10,-26 Q0,-20 -10,-26 Q-24,-20 -30,-30 Z" ${L3} stroke-width="1.4"/>${dots([[-18, -36, 1.6], [-4, -42, 1.6], [12, -38, 1.6], [22, -32, 1.6], [0, -30, 1.6]])}`;
/** Ischtar-Tor */
const ISHTAR = `<path d="M-40,0 V-50 H-20 V-62 H20 V-50 H40 V0 H14 V-26 Q0,-40 -14,-26 V0 Z" ${L3} stroke-width="1.6"/><path d="M-40,-50 l4,-5 l4,5 l4,-5 l4,5 M20,-50 l4,-5 l4,5 l4,-5 l4,5 M-20,-62 l4,-5 l4,5 l4,-5 l4,5 l4,-5 l4,5 l4,-5 l4,5 l4,-5 l4,5" stroke-width="1.2"/>
${[[-30, -16], [-30, -36], [28, -16], [28, -36], [0, -50]].map(([x, y]) => `<path d="M${x - 6},${y} Q${x - 4},${y - 4} ${x + 2},${y - 4} L${x + 6},${y - 7} L${x + 6},${y - 3} Q${x + 4},${y} ${x + 2},${y} M${x - 4},${y} v3 M${x + 2},${y} v3" ${SNOW} stroke="var(--stp)" stroke-width="1.2"/>`).join('')}`;
/** Schilfhaus (Mudhif) der Marscharaber */
const MUDHIF = `<path d="M-30,0 V-14 Q-30,-30 0,-30 Q30,-30 30,-14 V0 Z" ${L2} stroke-width="1.4"/>${[-22, -12, 0, 12, 22].map((x) => `<path d="M${x},0 V${-14 - Math.round(16 * (1 - (x / 30) ** 2))}" stroke-width="1"/>`).join('')}<path d="M-6,0 V-12 Q0,-18 6,-12 V0 Z" ${SOLID}/>`;
/** Asadi-Turm (Teheran) */
const AZADI = `<path d="M-30,0 Q-26,-30 -10,-50 L0,-64 L10,-50 Q26,-30 30,0 H16 Q12,-20 0,-26 Q-12,-20 -16,0 Z" ${SNOW} stroke-width="1.5"/><path d="M-10,-50 H10 M-6,-56 H6" stroke-width="1.2"/><path d="M-22,-10 Q-18,-30 -6,-44 M22,-10 Q18,-30 6,-44" stroke-width="1"/>`;
/** Brücke Si-o-se-pol (zwei Arkadenreihen) über Breite w */
const siosepol = (x: number, y: number, w: number, n: number) => {
	const a = w / n;
	return `<path d="M${x},${y} H${x + w} V${y + 26} H${x} Z" ${L3} stroke-width="1.3"/>${Array.from({ length: n }, (_, i) => `<path d="M${f1(x + i * a + 2)},${y + 26} V${y + 18} Q${f1(x + i * a + a / 2)},${y + 12} ${f1(x + (i + 1) * a - 2)},${y + 18} V${y + 26} Z M${f1(x + i * a + 3)},${y + 10} V${y + 5} Q${f1(x + i * a + a / 2)},${y + 2} ${f1(x + (i + 1) * a - 3)},${y + 5} V${y + 10} Z" ${PAPER}/>`).join('')}<path d="M${x - 2},${y} H${x + w + 2}" stroke-width="2"/>`;
};
/** Säulen von Palmyra mit Torbogen */
const PALMYRA = `<path d="M-14,0 V-40 H14 V0 H6 V-20 Q0,-28 -6,-20 V0 Z" ${L3} stroke-width="1.5"/><path d="M-16,-40 H16 V-46 H-16 Z" ${SOLID}/>${[-40, -30, 26, 36, 46].map((x, i) => `<path d="M${x - 2.4},0 V${-30 + (i % 2) * 6} H${x + 2.4} V0" ${SNOW} stroke-width="1"/><path d="M${x - 4},${-30 + (i % 2) * 6} H${x + 4}" stroke-width="1.6"/>`).join('')}`;
/** Krak des Chevaliers */
const KRAK = `<path d="M-60,0 V-20 H60 V0" ${L2} stroke-width="1.4"/>${[-56, -30, 28, 54].map((x) => rtower(x, -20, 10, 10, L2)).join('')}<path d="M-30,-20 V-38 H30 V-20" ${SNOW} stroke-width="1.3"/>${[-26, 0, 24].map((x) => rtower(x, -38, 9, 10, SNOW)).join('')}<path d="M-60,-20 l3,-3 l3,3 l3,-3 l3,3 M40,-20 l3,-3 l3,3 l3,-3 l3,3" stroke-width="1"/>`;
/** Lehmhochhäuser von Schibam */
const SHIBAM = Array.from({ length: 9 }, (_, i) => {
	const x = -48 + i * 12,
		h = 34 + ((i * 11) % 20);
	return `<path d="M${x},0 V${-h} H${x + 11} V0" ${[SNOW, L1, L2][i % 3]} stroke-width="1.1"/>${Array.from({ length: Math.floor(h / 9) }, (_, k) => `<rect x="${x + 2}" y="${-h + 4 + k * 9}" width="2.4" height="3" ${SOLID}/><rect x="${x + 6.6}" y="${-h + 4 + k * 9}" width="2.4" height="3" ${SOLID}/>`).join('')}<path d="M${x},${-h} h11" stroke="var(--stp)" stroke-width="2"/>`;
}).join('');
/** Drachenblutbaum */
const DRAGONTREE = `<path d="M-3,0 Q-2,-12 -3,-20 H3 Q2,-12 3,0 Z" ${SOLID}/><path d="M0,-18 Q-8,-24 -18,-30 M0,-18 Q-4,-26 -6,-32 M0,-18 V-32 M0,-18 Q4,-26 6,-32 M0,-18 Q8,-24 18,-30" stroke-width="2"/><path d="M-28,-30 Q-24,-44 0,-46 Q24,-44 28,-30 Q14,-34 0,-33 Q-14,-34 -28,-30 Z" ${SOLID}/>`;
/* Bausteine Zentral- und Südasien */
/** Bajterek-Turm (Astana) */
const BAITEREK = `<path d="M-4,0 L-2,-60 M4,0 L2,-60" stroke-width="2"/><path d="M-10,0 Q-4,-30 -2,-60 M10,0 Q4,-30 2,-60" stroke-width="1.4"/><circle cx="0" cy="-68" r="9" ${L3} stroke-width="1.4"/><path d="M-2,-60 Q-12,-64 -12,-76 M2,-60 Q12,-64 12,-76" stroke-width="1.4"/><path d="M-14,0 H14" stroke-width="2.4"/>`;
/** Khan-Schatyr-Zelt */
const KHANSH = `<path d="M-26,0 Q-10,-24 -2,-60 L2,-60 Q10,-24 26,0 Z" ${L2} stroke-width="1.3"/><path d="M-14,0 Q-4,-30 0,-58 M14,0 Q4,-30 0,-58" stroke-width=".9"/>`;
/** Adlerjäger zu Pferd */
const EAGLEHUNTER = `${horse(RIDER)}<path d="M24,-28 L30,-34" stroke-width="2"/><path d="M28,-36 Q24,-42 30,-46 Q36,-42 34,-36 Z" ${SOLID}/><path d="M28,-40 Q22,-44 18,-42 M34,-40 Q40,-44 44,-42" stroke-width="1.4"/>`;
/** blaues Minarett (Kalta Minor, Khiva): breit, unvollendet */
const KALTA = `<path d="M-16,0 L-12,-46 H12 L16,0 Z" ${L3} stroke-width="1.5"/>${[-8, -18, -28, -38].map((y, i) => `<path d="M${-14 + i},${y} H${14 - i}" stroke="var(--stp)" stroke-width="2.4" stroke-dasharray="${i % 2 ? '2 2' : '4 2'}"/>`).join('')}<path d="M-12,-46 H12" stroke-width="2"/>`;
/** Madrasa: Portal (Iwan) mit zwei Minaretten und Kuppel, Breite ca. 60 */
const madrasa = (dome = true) => `<path d="M-24,0 V-36 H24 V0 Z" ${L2} stroke-width="1.3"/><path d="M-12,0 V-26 Q0,-38 12,-26 V0 Z" ${SNOW} stroke-width="1.2"/><path d="M-12,-30 H12" stroke="var(--stp)" stroke-width="1.6" stroke-dasharray="2 2"/>${[-28, 28].map((x) => `<path d="M${x - 3},0 L${x - 2},-44 H${x + 2} L${x + 3},0 Z" ${L3} stroke-width="1.1"/><path d="M${x - 3},-44 H${x + 3} V-48 H${x - 3} Z" ${SOLID}/>`).join('')}${dome ? `<path d="M-10,-36 Q-10,-52 0,-54 Q10,-52 10,-36" ${L3} stroke-width="1.3"/><path d="M-6,-50 L0,-54 L6,-50" stroke="var(--stp)" stroke-width="1" stroke-dasharray="1 1.4"/>` : ''}`;
/** Badshahi-Moschee (Lahore) */
const BADSHAHI = `<path d="M-40,0 V-18 H40 V0 Z" ${L2} stroke-width="1.3"/>${[-22, 0, 22].map((x, i) => `<path d="M${x - (i === 1 ? 12 : 8)},-18 Q${x - (i === 1 ? 12 : 8)},${i === 1 ? -40 : -32} ${x},${i === 1 ? -42 : -34} Q${x + (i === 1 ? 12 : 8)},${i === 1 ? -40 : -32} ${x + (i === 1 ? 12 : 8)},-18 Z" ${SNOW} stroke-width="1.3"/><path d="M${x},${i === 1 ? -42 : -34} V${i === 1 ? -48 : -38}" stroke-width="1.1"/>`).join('')}${[-46, 46].map((x) => `<path d="M${x - 3},0 V-50 H${x + 3} V0" ${L3} stroke-width="1.1"/><path d="M${x - 4},-50 Q${x},-58 ${x + 4},-50 Z" ${SNOW} stroke-width="1"/>`).join('')}<path d="M-6,0 V-12 Q0,-16 6,-12 V0 Z" ${SOLID}/>`;
/** Hawa Mahal: Fassade mit vielen Erkern */
const HAWA = `<path d="M-40,0 V-34 L-30,-44 L-20,-54 L-10,-64 L0,-70 L10,-64 L20,-54 L30,-44 L40,-34 V0 Z" ${L2} stroke-width="1.4"/>${[0, 1, 2, 3, 4].map((r) => Array.from({ length: 9 - r * 2 }, (_, i) => {
	const x = -32 + r * 8 + i * 8,
		y = -6 - r * 12;
	return `<path d="M${x - 3},${y} V${y - 6} Q${x},${y - 9} ${x + 3},${y - 6} V${y} Z" ${SNOW} stroke-width=".8"/>`;
}).join('')).join('')}${[-30, -20, -10, 0, 10, 20, 30].map((x) => `<path d="M${x - 2},${-36 - (3 - Math.abs(x) / 10) * 10} L${x},${-40 - (3 - Math.abs(x) / 10) * 10} L${x + 2},${-36 - (3 - Math.abs(x) / 10) * 10}" stroke-width="1"/>`).join('')}`;
/** Hausboot (Kerala) */
const HOUSEBOAT = `<path d="M-30,0 Q0,8 30,0 L26,-6 H-26 Z" ${SOLID}/><path d="M-22,-6 Q-20,-20 0,-20 Q20,-20 22,-6" ${L3} stroke-width="1.4"/><path d="M-14,-6 V-16 M-4,-6 V-19 M6,-6 V-19 M16,-6 V-16" stroke-width="1"/>`;
/** Taj Mahal (ca. 120 breit) */
const TAJ = `<path d="M-34,0 V-30 H34 V0 Z" ${SNOW} stroke-width="1.4"/><path d="M-10,0 V-24 Q0,-34 10,-24 V0 Z" ${L2} stroke-width="1.1"/><path d="M-24,-6 V-18 Q-20,-24 -16,-18 V-6 Z M16,-6 V-18 Q20,-24 24,-18 V-6 Z" ${L2} stroke-width="1"/><path d="M-14,-30 V-38 H14 V-30" ${SNOW} stroke-width="1.2"/><path d="M-16,-38 Q-18,-60 0,-70 Q18,-60 16,-38 Z" ${SNOW} stroke-width="1.5"/><path d="M0,-70 V-78" stroke-width="1.2"/>
${[-26, 26].map((x) => `<path d="M${x - 5},-30 V-38 H${x + 5} V-30" ${SNOW} stroke-width="1"/><path d="M${x - 6},-38 Q${x},-48 ${x + 6},-38 Z" ${SNOW} stroke-width="1"/>`).join('')}${[-54, 54].map((x) => `<path d="M${x - 2.6},0 L${x - 2},-56 H${x + 2} L${x + 2.6},0 Z" ${SNOW} stroke-width="1"/><path d="M${x - 4},-56 Q${x},-62 ${x + 4},-56 Z" ${SOLID}/><path d="M${x - 4},-20 H${x + 4} M${x - 3.6},-38 H${x + 3.6}" stroke-width="1.2"/>`).join('')}`;
/** Pfau mit Rad */
const PEACOCK = `${Array.from({ length: 9 }, (_, i) => {
	const a = Math.PI + (i * Math.PI) / 8;
	return `<path d="M0,-6 L${f1(26 * Math.cos(a))},${f1(-6 + 26 * Math.sin(a))}" stroke-width="1"/><circle cx="${f1(24 * Math.cos(a))}" cy="${f1(-6 + 24 * Math.sin(a))}" r="3" ${L3} stroke-width=".8"/><circle cx="${f1(24 * Math.cos(a))}" cy="${f1(-6 + 24 * Math.sin(a))}" r="1.2" ${SOLID}/>`;
}).join('')}<path d="M-4,0 Q-6,-10 0,-14 Q4,-18 2,-24 Q6,-26 6,-22 Q4,-14 6,-8 Q6,0 0,2 Z" ${SOLID}/><path d="M2,-24 l2,-4 M3,-24 l3,-3" stroke-width="1"/><path d="M-2,2 V8 M2,2 V8" stroke-width="1.2"/>`;
/** Stupa von Boudhanath mit Augen */
const BOUDHA = `<path d="M-50,0 L-40,-8 H40 L50,0 Z" ${L2} stroke-width="1.2"/><path d="M-36,-8 Q-34,-34 0,-36 Q34,-34 36,-8 Z" ${SNOW} stroke-width="1.5"/><path d="M-10,-36 V-50 H10 V-36" ${L3} stroke-width="1.2"/><path d="M-7,-44 q2,-2 4,0 M3,-44 q2,-2 4,0" stroke-width="1.4"/><path d="M-1,-41 q1,2 2,0" stroke-width="1"/>
<path d="M-8,-50 L0,-76 L8,-50 Z" ${L3} stroke-width="1.1"/>${[-56, -62, -68].map((y, i) => `<path d="M${-5 + i * 1.5},${y} H${5 - i * 1.5}" stroke-width="1"/>`).join('')}<path d="M0,-76 V-80" stroke-width="1"/><path d="M0,-80 L-40,-20 M0,-80 L40,-20 M0,-80 L-24,-6 M0,-80 L24,-6" stroke-width=".8" stroke-dasharray="3 2"/>`;
/** Gebetsfahnen zwischen zwei Punkten */
const flags = (x1: number, y1: number, x2: number, y2: number, n = 8) => `<path d="M${x1},${y1} Q${f1((x1 + x2) / 2)},${f1(Math.max(y1, y2) + 8)} ${x2},${y2}" stroke-width="1"/>${Array.from({ length: n }, (_, i) => {
	const t = (i + 0.5) / n,
		x = x1 + (x2 - x1) * t,
		y = y1 + (y2 - y1) * t + 8 * 4 * t * (1 - t) * 0.5;
	return `<path d="M${f1(x - 2.4)},${f1(y)} h4.8 v5 h-4.8 Z" ${[SOLID, L3, SNOW, L2][i % 4]} stroke-width=".6"/>`;
}).join('')}`;
/** Yak, Blick nach rechts */
const YAK = `<path d="M2,-16 Q4,-24 14,-24 Q22,-26 28,-20 Q32,-18 32,-12 L30,-4 H6 Q0,-6 2,-16 Z" ${SOLID}/><path d="M6,-6 L4,4 M10,-6 V4 M26,-6 V4 M30,-6 L32,4" stroke-width="2"/><path d="M6,-8 q2,6 6,4 M14,-6 q2,6 6,4 M22,-6 q2,6 6,4" stroke-width="1.2"/><path d="M28,-20 Q36,-18 36,-12 L32,-10" ${SOLID}/><path d="M30,-20 q2,-6 6,-6 M30,-20 q-2,-6 -6,-6" stroke-width="1.4"/>`;
/** Tiger, Blick nach rechts */
const TIGER = `<path d="M0,-12 Q2,-20 14,-20 H30 Q36,-20 38,-14 L36,-8 H34 V0 H31 V-8 H12 V0 H9 V-8 H6 Q0,-8 0,-12 Z" ${L3} stroke-width="1.3"/><path d="M36,-18 Q40,-24 46,-20 Q48,-16 46,-12 Q42,-10 38,-12" ${L3} stroke-width="1.3"/><path d="M40,-22 l1,-3 l2,2 M44,-22 l1,-3" stroke-width="1"/>
<path d="M12,-20 q-2,6 0,10 M18,-20 q-2,6 0,10 M24,-20 q-2,6 0,10 M30,-20 q-2,6 0,10" stroke-width="1.8"/><path d="M0,-12 Q-8,-14 -10,-22" stroke-width="1.6"/><circle cx="43" cy="-17" r=".9" ${SOLID}/>`;
/** Löwenfelsen Sigiriya */
const SIGIRIYA = `<path d="M-40,0 Q-36,-20 -26,-30 Q-24,-56 -10,-62 H14 Q26,-58 28,-30 Q38,-20 40,0 Z" ${L3} stroke-width="1.8"/><path d="M-10,-62 H14" stroke-width="2.4"/><path d="M-18,-40 Q-14,-20 -16,-4 M2,-58 Q0,-30 2,-4 M20,-44 Q22,-24 20,-4" stroke-width="1"/><path d="M-6,0 V-10 H6 V0 M-8,-10 Q-10,-16 -6,-18 M8,-10 Q10,-16 6,-18" ${SNOW} stroke-width="1.2"/>`;
/** Neun-Bögen-Brücke mit Zug, Breite w */
const ninearch = (x: number, y: number, w: number) => {
	const a = w / 9;
	return `<path d="M${x},${y} H${x + w} V${y + 36} H${x} Z" ${L2} stroke-width="1.3"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${f1(x + i * a + 2)},${y + 36} V${y + 14} Q${f1(x + i * a + a / 2)},${y + 4} ${f1(x + (i + 1) * a - 2)},${y + 14} V${y + 36} Z" ${PAPER}/>`).join('')}<path d="M${x - 2},${y} H${x + w + 2}" stroke-width="2"/>`;
};
/** Teeplantage: Reihen am Hang */
const tea = (x: number, y: number, w: number, n: number) => Array.from({ length: n }, (_, i) => `<path d="M${x},${y + i * 7} q${w / 8},-5 ${w / 4},0 q${w / 8},-5 ${w / 4},0 q${w / 8},-5 ${w / 4},0 q${w / 8},-5 ${w / 4},0" stroke-width="2.4" stroke-linecap="round"/>`).join('');
/** geschmückter Elefant (Perahera) */
const PERAHERA = `<path d="M11,0 V-14 Q9,-28 23,-29 Q38,-30 39,-16 V0 H34 V-8 H31 V0 H26 V-8 H20 V0 H16 V-8 H15 V0 Z" ${SOLID}/><path d="M11,-20 Q2,-20 2,-10 Q2,-2 6,0 M11,-14 Q6,-10 8,-4" stroke-width="2.6"/><path d="M12,-28 H38 V-14 H12 Z" ${L2} stroke="var(--stp)" stroke-width="1.2"/>${dots([[16, -24, 1], [22, -24, 1], [28, -24, 1], [34, -24, 1], [19, -18, 1], [25, -18, 1], [31, -18, 1]], SNOW)}<path d="M8,-26 Q4,-34 10,-34 Q14,-30 12,-24" ${L2} stroke="var(--stp)" stroke-width="1"/>`;
/** Mantarochen */
const MANTA = `<path d="M0,-6 Q-14,-8 -30,4 Q-14,2 -6,10 Q0,12 6,10 Q14,2 30,4 Q14,-8 0,-6 Z" ${SOLID}/><path d="M-4,-6 L-6,-12 M4,-6 L6,-12" stroke-width="1.6"/><path d="M0,10 Q2,18 8,24" stroke-width="1.2"/><path d="M-10,0 h20" stroke="var(--paper)" stroke-width="1" stroke-dasharray="2 2"/>`;
/** Wasserflugzeug */
const SEAPLANE = `<path d="M-20,-8 Q-22,-12 -16,-12 H14 Q20,-12 22,-8 Q20,-4 14,-4 H-16 Q-22,-4 -20,-8 Z" ${SNOW} stroke-width="1.2"/><path d="M-4,-12 L-10,-20 H-4 L4,-12 Z M-18,-12 L-22,-18 H-18 L-14,-12 Z" ${SOLID}/><path d="M-12,-4 L-14,2 M10,-4 L12,2 M-18,2 H-6 M6,2 H18" stroke-width="1.4"/>`;
/** Blaue Moschee (Mazar-e Scharif) */
const BLUEMOSQ = `<path d="M-40,0 V-20 H40 V0 Z" ${L3} stroke-width="1.3"/>${[-24, 24].map((x) => `<path d="M${x - 8},-20 Q${x - 8},-32 ${x},-34 Q${x + 8},-32 ${x + 8},-20 Z" ${L3} stroke-width="1.1"/>`).join('')}<path d="M-14,-20 V-28 H14 V-20" ${L3} stroke-width="1.1"/><path d="M-14,-28 Q-16,-46 0,-50 Q16,-46 14,-28 Z" ${L3} stroke-width="1.4"/><path d="M0,-50 V-56" stroke-width="1.1"/>${[-46, 46].map((x) => `<path d="M${x - 3},0 V-48 H${x + 3} V0" ${L3} stroke-width="1"/><path d="M${x - 4},-48 Q${x},-56 ${x + 4},-48 Z" ${SOLID}/>`).join('')}
<path d="M-38,-8 H38 M-30,-14 H30" stroke="var(--stp)" stroke-width="1.4" stroke-dasharray="2 2"/><path d="M-6,0 V-12 Q0,-16 6,-12 V0 Z" ${SNOW}/>`;
/** Burana-Turm */
const BURANA = `<path d="M-8,0 L-6,-46 H6 L8,0 Z" ${L2} stroke-width="1.3"/><path d="M-10,0 H10 V4 H-10 Z" ${SOLID}/><path d="M-7,-12 H7 M-6.6,-22 H6.6 M-6.3,-32 H6.3 M-6,-42 H6" stroke-width="1" stroke-dasharray="2 1.4"/><path d="M-6,-46 h3 v-3 h6 v3 h3" stroke-width="1"/>`;
/** Reiterstandbild Dschingis Khan */
const GENGHIS = `<path d="M-30,0 V-24 H30 V0 Z" ${L2} stroke-width="1.3"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${-26 + i * 7},-4 V-20" stroke-width="1"/>`).join('')}<g transform="translate(-20,-24) scale(1.2)">${horse(RIDER)}</g>`;
/** Baktrisches Kamel (zwei Höcker), Blick nach rechts */
const BACTRIAN = `<path d="M2,-14 Q2,-22 8,-22 Q10,-30 16,-24 Q20,-30 24,-22 Q28,-22 30,-16 L34,-26 L38,-26 L38,-22 L35,-21 L32,-10 H4 Z" ${SOLID}/><path d="M6,-10 V0 M11,-10 V0 M24,-10 V0 M29,-10 V0" stroke-width="1.8"/><path d="M8,-22 q2,-4 4,0 M18,-24 q2,-4 4,0" stroke-width="1"/>`;
/** Dzong (Punakha): weiße Mauern, roter Gürtel, gestufte Dächer */
const DZONG = `<path d="M-50,0 V-24 H50 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-50,-20 H50" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${-46 + i * 8}" y="-14" width="3" height="5" ${SOLID}/>`).join('')}<path d="M-54,-24 L-48,-30 H48 L54,-24 Z" ${SOLID}/>
<path d="M-14,-30 V-46 H14 V-30" ${SNOW} stroke-width="1.2"/><path d="M-14,-42 H14" stroke-width="2.4"/><path d="M-18,-46 L-12,-52 H12 L18,-46 Z" ${SOLID}/><path d="M-8,-52 L0,-60 L8,-52 Z" ${L3} stroke-width="1"/><path d="M0,-60 V-64" stroke-width="1.2"/>`;
/** Chorten (Stupa) */
const CHORTEN = `<path d="M-8,0 V-8 H8 V0 Z" ${SNOW} stroke-width="1.1"/><path d="M-6,-8 Q-6,-16 0,-16 Q6,-16 6,-8 Z" ${SNOW} stroke-width="1.1"/><path d="M-2,-16 V-22 H2 V-16" ${SNOW} stroke-width="1"/><path d="M-3,-22 L0,-28 L3,-22 Z" ${SOLID}/>`;
/** Takin, Blick nach links */
const TAKIN = `<path d="M8,-22 Q18,-28 30,-24 Q36,-20 36,-12 L34,-6 H10 Q6,-12 8,-22 Z" ${L3} stroke-width="1.3"/><path d="M12,-6 V0 M16,-6 V0 M28,-6 V0 M32,-6 V0" stroke-width="2.2"/><path d="M10,-22 Q2,-24 0,-16 Q0,-10 6,-10 L10,-12" ${L3} stroke-width="1.3"/><path d="M6,-22 q-2,-6 2,-8 q4,2 2,6" stroke-width="1.4"/>`;
/* Bausteine Ost- und Südostasien */
/** Himmelstempel (runde Halle, drei blaue Dächer) */
const HEAVEN = `<path d="M-30,0 V-6 H30 V0 Z M-24,-6 V-10 H24 V-6" ${L2} stroke-width="1.1"/>${[[22, -10, 8], [17, -24, 7], [12, -36, 6]].map(([w, y, h]) => `<path d="M${-w + 4},${y} V${y - h} H${w - 4} V${y}" ${SNOW} stroke-width="1.1"/><path d="M${-w - 2},${y - h} Q0,${y - h - 9} ${w + 2},${y - h} Z" ${SOLID}/>`).join('')}<path d="M0,-51 V-58" stroke-width="1.4"/><circle cx="0" cy="-58" r="1.8" ${SOLID}/>`;
/** Karstkegel (Guilin) */
const karst = (x: number, y: number, h: number, w: number, f = L2) => `<path d="M${x - w},${y} Q${x - w},${y - h * 0.7} ${x - w * 0.4},${y - h} Q${x},${y - h - 4} ${x + w * 0.4},${y - h} Q${x + w},${y - h * 0.7} ${x + w},${y} Z" ${f} stroke-width="1.4"/>`;
/** Bambusfloß mit Fischer */
const RAFT = `<path d="M-22,0 H22" stroke-width="3"/><path d="M-22,-2 H22" stroke-width="1" stroke-dasharray="3 1.4"/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}<path d="M4,-4 L20,-30" stroke-width="1.2"/><path d="M-4,-24 Q0,-30 4,-24 Z" ${SOLID}/>`;
/** Pandabär sitzend */
const PANDA = `<ellipse cx="0" cy="-10" rx="12" ry="10" ${SNOW} stroke-width="1.4"/><circle cx="0" cy="-26" r="9" ${SNOW} stroke-width="1.4"/><circle cx="-7" cy="-33" r="3.4" ${SOLID}/><circle cx="7" cy="-33" r="3.4" ${SOLID}/><ellipse cx="-3.6" cy="-27" rx="2.4" ry="3" ${SOLID}/><ellipse cx="3.6" cy="-27" rx="2.4" ry="3" ${SOLID}/><circle cx="0" cy="-22" r="1.4" ${SOLID}/>
<path d="M-12,-14 Q-16,-6 -10,-2 M12,-14 Q16,-6 10,-2" stroke-width="6"/><path d="M-10,0 h6 M4,0 h6" stroke-width="5"/>`;
/** Bambus */
const bamboo = (x: number, y: number, h: number) => `<path d="M${x},${y} V${y - h}" stroke-width="3"/>${Array.from({ length: Math.floor(h / 12) }, (_, i) => `<path d="M${x - 2},${y - 10 - i * 12} h4" stroke="var(--paper)" stroke-width="1.2"/><path d="M${x},${y - 14 - i * 12} q${i % 2 ? 10 : -10},-2 ${i % 2 ? 14 : -14},-8" stroke-width="2"/>`).join('')}`;
/** Fernsehturm N Seoul Tower auf dem Hügel */
const NSEOUL = `<path d="M-2,0 V-50 H2 V0" ${L3} stroke-width="1"/><path d="M-8,-50 H8 V-58 H-8 Z" ${SNOW} stroke-width="1.2"/><path d="M-5,-58 H5 V-62 H-5 Z" ${L3} stroke-width="1"/><path d="M0,-62 V-80" stroke-width="1.6"/>`;
/** Hanok-Dach (geschwungen) */
const hanok = (x: number, y: number, w: number) => `<path d="M${x},${y} V${y - 10} H${x + w} V${y}" ${SNOW} stroke-width="1.1"/><path d="M${x - 6},${y - 8} Q${x + w / 2},${y - 14} ${x + w + 6},${y - 8} Q${x + w + 2},${y - 18} ${x + w / 2},${y - 20} Q${x - 2},${y - 18} ${x - 6},${y - 8} Z" ${SOLID}/>`;
/** Seongsan Ilchulbong (Kraterberg am Meer) */
const SEONGSAN = `<path d="M-60,0 Q-50,-30 -30,-40 Q-20,-46 0,-44 Q20,-46 30,-40 Q50,-30 60,0 Z" ${L3} stroke-width="1.8"/><path d="M-30,-40 Q0,-34 30,-40" stroke-width="1.4"/><path d="M-40,-30 V-4 M-20,-38 V-4 M0,-40 V-4 M20,-38 V-4 M40,-30 V-4" stroke-width="1" stroke-dasharray="5 3"/>`;
/** Rapsfeld-Blüten */
const canola = (x: number, y: number, n: number, w = 7) => Array.from({ length: n }, (_, i) => `<path d="M${x + i * w},${y} v-8" stroke-width="1"/><circle cx="${x + i * w}" cy="${y - 9}" r="2.4" ${SOLID}/>`).join('');
/** Pagode am See (Sonne-Mond-See) */
const LAKEPAGODA = `<path d="M-8,0 V-8 H8 V0 Z" ${SNOW} stroke-width="1"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-12 + i},${-8 - i * 8} Q0,${-12 - i * 8} ${12 - i},${-8 - i * 8} L${9 - i},${-12 - i * 8} H${-9 + i} Z" ${SOLID}/><path d="M${-6 + i * 0.6},${-12 - i * 8} V${-16 - i * 8} H${6 - i * 0.6} V${-12 - i * 8}" ${SNOW} stroke-width=".8"/>`).join('')}<path d="M0,-60 V-66" stroke-width="1.2"/>`;
/** Laterne (rot) */
const lantern = (x: number, y: number, s = 1, f = SOLID) => `<path d="M${x},${y - 6 * s} V${y - 9 * s}" stroke-width="1"/><ellipse cx="${x}" cy="${y}" rx="${f1(5 * s)}" ry="${f1(6 * s)}" ${f}/><path d="M${x - 3 * s},${y - 5.6 * s} h${6 * s} M${x - 3 * s},${y + 5.6 * s} h${6 * s}" stroke-width="1.4"/>`;
/** Himmelslaterne (glühend) */
const skylantern = (x: number, y: number, s = 1) => `<path d="M${x - 5 * s},${y} L${x - 6 * s},${y - 12 * s} Q${x},${y - 16 * s} ${x + 6 * s},${y - 12 * s} L${x + 5 * s},${y} Z" fill="#F7E3A1" fill-opacity=".9" stroke="none"/><circle cx="${x}" cy="${y - 6 * s}" r="${f1(10 * s)}" fill="#F7E3A1" fill-opacity=".15" stroke="none"/>`;
/** Doppelstock-Straßenbahn (Hongkong) */
const DINGDING = `<rect x="-20" y="-34" width="40" height="30" rx="3" ${SOLID}/>${[-16, -6, 4].map((x) => `<rect x="${x + 2}" y="-30" width="7" height="7" rx="1" ${PAPER}/><rect x="${x + 2}" y="-18" width="7" height="8" rx="1" ${PAPER}/>`).join('')}<path d="M0,-34 L-6,-44 L6,-50" stroke-width="1.2"/><circle cx="-12" cy="-3" r="3" ${L4} stroke-width="1.2"/><circle cx="12" cy="-3" r="3" ${L4} stroke-width="1.2"/>`;
/** Dschunke mit rotem Segel */
const JUNK = `<path d="M-24,0 Q0,6 24,-4 L20,-8 H-22 Z" ${SOLID}/><path d="M-4,-8 V-40 M10,-8 V-30" stroke-width="1.4"/><path d="M-4,-40 Q-20,-30 -16,-10 H-4 Z M10,-30 Q22,-22 20,-10 H10 Z" ${L3} stroke-width="1.2"/><path d="M-14,-34 L-4,-34 M-16,-26 H-4 M-16,-18 H-4 M12,-24 H20 M12,-17 H21" stroke-width=".9"/>`;
/** Ruine von São Paulo (Fassade) */
const SAOPAULO = `<path d="M-30,0 V-40 H30 V0 Z" ${L2} stroke-width="1.4"/><path d="M-24,-40 V-56 H24 V-40" ${L2} stroke-width="1.3"/><path d="M-14,-56 V-68 H14 V-56" ${L2} stroke-width="1.2"/><path d="M-6,-68 L0,-78 L6,-68 Z" ${SOLID}/>${[-20, -8, 8, 20].map((x) => `<path d="M${x - 2},-4 V-36 M${x + 2},-4 V-36" stroke-width="1"/>`).join('')}<path d="M-6,0 V-16 Q0,-22 6,-16 V0 Z M-4,-30 V-36 Q0,-40 4,-36 V-30 Z M-4,-46 V-52 Q0,-55 4,-52 V-46 Z" ${PAPER}/><path d="M-30,-20 H30 M-24,-48 H24" stroke-width="1"/>`;
/** Macau Tower */
const MACAUTW = `<path d="M-3,0 V-60 H3 V0" ${L3} stroke-width="1"/><path d="M-10,-60 Q0,-70 10,-60 V-56 Q0,-52 -10,-56 Z" ${SNOW} stroke-width="1.2"/><path d="M0,-66 V-90" stroke-width="1.6"/>`;
/** Wat Arun (Prang mit Nebentürmen) */
const prang = (h: number) => `<path d="M${-h * 0.18},0 L${-h * 0.12},${f1(-h * 0.5)} L${-h * 0.06},${f1(-h * 0.85)} L0,${-h} L${h * 0.06},${f1(-h * 0.85)} L${h * 0.12},${f1(-h * 0.5)} L${h * 0.18},0 Z" ${L3} stroke-width="1.3"/>${[0.2, 0.4, 0.6, 0.78].map((k) => `<path d="M${f1(-h * 0.17 * (1 - k * 0.6))},${f1(-h * k)} H${f1(h * 0.17 * (1 - k * 0.6))}" stroke="var(--stp)" stroke-width="1.2" stroke-dasharray="1.6 1.4"/>`).join('')}`;
/** Ruderboot mit Strohhut-Händlerin */
const MARKETBOAT = `<path d="M-24,0 Q0,6 24,0 L20,-4 H-20 Z" ${SOLID}/>${dots([[-14, -6, 2.6], [-8, -6, 2.4], [10, -6, 2.6], [16, -6, 2.4]], L3)}<circle cx="0" cy="-12" r="2.6" ${SOLID}/><path d="M-6,-13 L0,-18 L6,-13 Z" ${L3} stroke-width="1"/><path d="M0,-10 V-4" stroke-width="2.4"/><path d="M2,-8 L20,-20" stroke-width="1.2"/>`;
/** Bayon: Turm mit Gesicht */
const BAYON = `<path d="M-30,0 V-20 H30 V0 Z" ${L2} stroke-width="1.3"/><path d="M-16,-20 L-14,-60 Q0,-72 14,-60 L16,-20 Z" ${L2} stroke-width="1.4"/><path d="M-8,-48 q4,-3 7,0 M2,-48 q4,-3 7,0" stroke-width="1.6"/><path d="M0,-46 v6" stroke-width="1.2"/><path d="M-6,-36 Q0,-32 6,-36" stroke-width="1.6"/><path d="M-12,-56 Q0,-62 12,-56" stroke-width="1"/>${[-24, 24].map((x) => `<path d="M${x - 5},-20 L${x - 4},-36 Q${x},-42 ${x + 4},-36 L${x + 5},-20 Z" ${L3} stroke-width="1"/>`).join('')}`;
/** Pfahlhaus (Tonle Sap) */
const STILT = `<path d="M-12,-10 V-22 H12 V-10 Z" ${L3} stroke-width="1.2"/><path d="M-15,-21 L0,-30 L15,-21 Z" ${SOLID}/><path d="M-10,-10 V6 M0,-10 V6 M10,-10 V6" stroke-width="1.6"/>`;
/** Mönch mit Schirm */
const MONK = `<circle cx="0" cy="-21" r="2.8" ${SOLID}/><path d="M-4,-17 H4 L6,0 H-6 Z" ${L3} stroke-width="1.2"/>`;
/** Lotusblüte */
const LOTUS = `<path d="M0,0 Q-6,-8 0,-16 Q6,-8 0,0 Z M0,0 Q-12,-4 -12,-12 Q-4,-10 0,0 M0,0 Q12,-4 12,-12 Q4,-10 0,0" ${SOLID}/><path d="M-14,2 Q0,6 14,2" stroke-width="1.2"/>`;
/** Hội-An-Haus mit Laternen */
const HOIAN = `<path d="M-30,0 V-24 H30 V0 Z" ${L2} stroke-width="1.3"/><path d="M-36,-22 Q0,-30 36,-22 L30,-32 H-30 Z" ${SOLID}/><path d="M-20,0 V-16 H-8 V0 M8,0 V-16 H20 V0" ${SNOW} stroke-width="1.1"/>${[-26, -12, 2, 16, 28].map((x) => lantern(x, -16, 0.8)).join('')}`;
/** Reisterrassen am Hang (Sapa) */
const riceterr = (y: number, n: number, w = 180) => Array.from({ length: n }, (_, i) => `<path d="M0,${y + i * 9} Q${w * 0.25},${y + i * 9 - 8} ${w * 0.5},${y + i * 9 - 2} T${w},${y + i * 9 - 4}" stroke-width="1.6"/>`).join('');
/** Wasserbüffel, Blick nach links */
const BUFFALO = `<path d="M8,-18 H30 Q35,-18 35,-12 V0 H32 V-8 H29 V0 H26 V-8 H14 V0 H11 V-8 H8 Z" ${SOLID}/><path d="M10,-16 L2,-14 Q-2,-12 0,-8 L6,-8 L10,-12" ${SOLID}/><path d="M6,-16 Q-4,-22 -2,-28 M8,-16 Q14,-26 8,-30" stroke-width="2"/>`;
/** Orang-Utan an einer Liane */
const ORANGUTAN = `<path d="M0,-60 V-34" stroke-width="1.6"/><path d="M-4,-58 Q-14,-40 -6,-28 M6,-58 Q14,-46 10,-30" stroke-width="4"/><ellipse cx="0" cy="-20" rx="12" ry="14" ${L3} stroke-width="1.4"/><circle cx="0" cy="-40" r="7" ${L3} stroke-width="1.3"/><ellipse cx="0" cy="-38" rx="5" ry="4" ${PAPER}/><circle cx="-2" cy="-40" r=".9" ${SOLID}/><circle cx="2" cy="-40" r=".9" ${SOLID}/><path d="M-8,-8 L-12,4 M8,-8 L10,4" stroke-width="4"/>`;
/** Petronas Towers (Paar), Höhe h */
const petronas = (h: number) => [-12, 12].map((x) => `<path d="M${x - 6},0 V${f1(-h * 0.6)} L${x - 4},${f1(-h * 0.8)} L${x - 2},${f1(-h * 0.92)} L${x},${-h} L${x + 2},${f1(-h * 0.92)} L${x + 4},${f1(-h * 0.8)} L${x + 6},${f1(-h * 0.6)} V0 Z" ${SNOW} stroke-width="1.2"/>${Array.from({ length: 6 }, (_, k) => `<path d="M${x - 5},${f1(-h * 0.1 * (k + 1))} h10" stroke-width=".7"/>`).join('')}`).join('') + `<path d="M-6,${f1(-h * 0.45)} H6" stroke-width="2.4"/>`;
/** Rafflesia-Blüte */
const RAFFLESIA = `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-12" rx="9" ry="11" transform="rotate(${a})" ${SOLID}/>`).join('')}<circle r="7" ${L3} stroke="var(--paper)" stroke-width="1.4"/>${dots([[-4, -14, 1.2], [4, -16, 1.2], [10, -6, 1.2], [-10, -6, 1.2], [0, 12, 1.2]], PAPER)}`;
/** Merlion */
const MERLION = `<path d="M-14,0 V-6 H14 V0 Z" ${L3} stroke-width="1.2"/><path d="M-6,-6 Q-12,-20 -6,-32 Q-2,-38 -2,-46 Q4,-50 10,-46 Q14,-42 12,-36 Q8,-34 8,-28 Q14,-20 8,-6 Z" ${SNOW} stroke-width="1.4"/><path d="M-6,-32 Q-2,-26 -6,-18 M-2,-46 Q-6,-40 -4,-34" stroke-width="1"/><path d="M12,-38 Q26,-40 36,-32" stroke-width="2" stroke-dasharray="2 2"/><circle cx="5" cy="-42" r="1" ${SOLID}/>`;
/** Marina Bay Sands */
const MBS = `${[-24, 0, 24].map((x) => `<path d="M${x - 6},0 L${x - 4},-46 H${x + 4} L${x + 6},0 Z" ${SNOW} stroke-width="1.2"/>`).join('')}<path d="M-36,-46 H38 Q42,-46 40,-50 H-34 Q-38,-50 -36,-46 Z" ${SOLID}/>`;
/** Supertree (leuchtend optional) */
const supertree = (h: number, glow = false) => `<path d="M-3,0 L-2,${-h} M3,0 L2,${-h}" stroke-width="2"/><path d="M-3,${f1(-h * 0.3)} L3,${f1(-h * 0.5)} M3,${f1(-h * 0.3)} L-3,${f1(-h * 0.5)} M-3,${f1(-h * 0.6)} L3,${f1(-h * 0.8)}" stroke-width="1"/><path d="M-16,${-h} Q0,${-h + 6} 16,${-h} L10,${-h - 6} H-10 Z" ${glow ? 'fill="#7FE7E0" fill-opacity=".85" stroke="none"' : L3 + ' stroke-width="1.2"'}/>`;
/** Borobudur-Stupa (glockenförmig, durchbrochen) */
const BOROSTUPA = `<path d="M-14,0 Q-16,-18 0,-22 Q16,-18 14,0 Z" ${L2} stroke-width="1.3"/>${[-8, 0, 8].map((x) => `<path d="M${x - 2},-4 l2,-3 l2,3 l-2,3 Z M${x - 2},-12 l2,-3 l2,3 l-2,3 Z" ${SOLID}/>`).join('')}<path d="M-3,-22 V-28 H3 V-22 M-2,-28 L0,-34 L2,-28" stroke-width="1.2"/>`;
/** Komodowaran, Blick nach rechts */
const KOMODO = `<path d="M-30,-2 Q-20,-8 -4,-8 H14 Q22,-8 28,-6 L36,-6 Q38,-4 36,-2 L28,-2 Q20,0 14,0 H-4 Q-20,0 -30,-2 Z" ${SOLID}/><path d="M-30,-2 Q-40,-4 -46,2" stroke-width="2.4"/><path d="M-12,-6 L-16,4 M-2,-6 L2,4 M12,-6 L8,4 M20,-6 L24,4" stroke-width="2"/><path d="M36,-4 l6,-2 M36,-4 l6,2" stroke-width="1"/><circle cx="30" cy="-5" r=".8" ${PAPER}/>`;
/** Jeepney */
const JEEPNEY = `<path d="M-30,-6 V-18 Q-30,-22 -26,-22 H20 L28,-14 V-6 Z" ${SOLID}/><path d="M-30,-22 H20" stroke-width="2"/><path d="M-26,-26 H18 V-22" stroke-width="1.6"/>${[-24, -14, -4, 6].map((x) => `<rect x="${x}" y="-19" width="7" height="6" rx="1" ${PAPER}/>`).join('')}<path d="M20,-20 L26,-14 H20 Z" ${PAPER}/><circle cx="-18" cy="-4" r="4" ${L4} stroke-width="1.2"/><circle cx="16" cy="-4" r="4" ${L4} stroke-width="1.2"/><path d="M26,-26 l4,-4 M30,-26 l2,-4" stroke-width="1.2"/>`;
/** Schokoladenhügel */
const chocohills = (y: number, w = 270) => Array.from({ length: 12 }, (_, i) => {
	const x = 10 + ((i * 47) % w),
		r = 10 + ((i * 7) % 8),
		yy = y + ((i * 13) % 20);
	return `<path d="M${x - r},${yy} Q${x - r},${yy - r * 1.2} ${x},${yy - r * 1.3} Q${x + r},${yy - r * 1.2} ${x + r},${yy} Z" ${[L3, L2, L4][i % 3]} stroke-width="1.2"/>`;
}).join('');
/** Koboldmaki (Tarsier) */
const TARSIER = `<ellipse cx="0" cy="-10" rx="8" ry="10" ${L3} stroke-width="1.3"/><circle cx="0" cy="-26" r="9" ${L3} stroke-width="1.3"/><circle cx="-4" cy="-27" r="4" ${SNOW} stroke-width="1"/><circle cx="4" cy="-27" r="4" ${SNOW} stroke-width="1"/><circle cx="-4" cy="-27" r="2" ${SOLID}/><circle cx="4" cy="-27" r="2" ${SOLID}/><path d="M-8,-32 l-3,-5 l4,2 M8,-32 l3,-5 l-4,2" ${L3} stroke-width="1"/><path d="M-6,-6 L-12,-2 M6,-6 L12,-2 M0,0 Q8,8 4,20" stroke-width="1.6"/>`;
/** Vulkan Mayon (perfekter Kegel) */
const MAYON = (y: number, x = 90, k = 1) => `<path d="M${x - 70 * k},${y} Q${x - 30 * k},${y - 20 * k} ${x - 6 * k},${y - 74 * k} H${x + 6 * k} Q${x + 30 * k},${y - 20 * k} ${x + 70 * k},${y} Z" ${L3} stroke-width="1.8"/><path d="M${x},${y - 76 * k} q-4,-8 2,-12 q6,-4 4,-10" stroke-width="1.4"/>`;
/** Nasenaffe */
const PROBOSCIS = `<ellipse cx="0" cy="-12" rx="9" ry="12" ${L3} stroke-width="1.3"/><circle cx="0" cy="-30" r="7" ${L3} stroke-width="1.3"/><path d="M0,-30 Q6,-26 4,-20 Q-2,-20 -1,-26 Z" ${SOLID}/><circle cx="-2" cy="-32" r=".9" ${SOLID}/><circle cx="3" cy="-32" r=".9" ${SOLID}/><path d="M-8,-18 Q-16,-30 -14,-44 M8,-18 Q12,-6 14,4 M-6,0 L-8,6 M0,0 Q0,14 -6,22" stroke-width="2.4"/>`;
/** Shwedagon-Pagode */
const SHWEDAGON = `<path d="M-40,0 V-8 H40 V0 Z" ${L2} stroke-width="1.2"/><path d="M-30,-8 Q-28,-24 -12,-30 Q-6,-44 -4,-60 L0,-90 L4,-60 Q6,-44 12,-30 Q28,-24 30,-8 Z" ${L3} stroke-width="1.5"/><path d="M-12,-30 H12 M-8,-44 H8 M-5,-56 H5" stroke="var(--stp)" stroke-width="1.2"/>${[-34, 34].map((x) => `<path d="M${x - 5},-8 Q${x - 4},-16 ${x},-26 Q${x + 4},-16 ${x + 5},-8 Z" ${L3} stroke-width="1"/>`).join('')}`;
/** Einbeinruderer vom Inle-See */
const INLE = `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/><circle cx="10" cy="-26" r="2.6" ${SOLID}/><path d="M10,-24 V-12 L6,-4 M10,-12 L14,-4 M10,-20 L4,-18" stroke-width="2"/><path d="M14,-14 Q18,-8 22,8" stroke-width="2.2"/><path d="M-16,-3 L-6,-30 L4,-3 Z" fill="none" stroke-width="1.4"/><path d="M-12,-14 H0 M-10,-20 H-2" stroke-width=".9"/>`;
/** Langboot (Mekong) */
const LONGBOAT = `<path d="M-34,0 Q0,6 34,-4 L30,-8 H-30 Z" ${SOLID}/><path d="M-24,-8 V-16 H20 V-8" ${L3} stroke-width="1.2"/><path d="M-26,-16 H22" stroke-width="2"/>`;
/** Uma Lulik (Heiliges Haus, Osttimor) */
const UMALULIK = `<path d="M-10,0 V-14 M10,0 V-14 M0,0 V-14" stroke-width="1.6"/><path d="M-14,-14 H14 V-22 H-14 Z" ${L3} stroke-width="1.2"/><path d="M-20,-22 Q-10,-36 -4,-64 L0,-70 L4,-64 Q10,-36 20,-22 Z" ${SOLID}/><path d="M-12,-30 Q0,-34 12,-30 M-7,-44 Q0,-46 7,-44" stroke="var(--paper)" stroke-width="1.2"/>`;
/** Geisterhaus (Haus Tambaran, Sepik) */
const TAMBARAN = `<path d="M-30,0 V-14 H30 V0" ${L2} stroke-width="1.3"/><path d="M-30,-14 L-14,-70 L-6,-76 L-4,-70 Q10,-40 30,-14 Z" ${SOLID}/><path d="M-22,-24 L-10,-62 L-2,-30 Z" ${L3} stroke="var(--paper)" stroke-width="1.2"/><circle cx="-12" cy="-44" r="3" ${PAPER}/><circle cx="-6" cy="-44" r="3" ${PAPER}/><path d="M-12,-38 Q-9,-34 -6,-38" stroke="var(--paper)" stroke-width="1.2"/>`;
/* Bausteine Nord- und Westafrika */
/** blaue Gasse (Chefchaouen): Stufen, Tür, Blumentöpfe */
const CHAOUEN = `<path d="M-40,0 V-80 H-14 V0 Z M14,0 V-90 H40 V0 Z" ${L2} stroke-width="1.4"/><path d="M-14,0 V-50 Q0,-62 14,-50 V0" ${L1} stroke-width="1.2"/><path d="M-34,-60 V-70 Q-28,-76 -22,-70 V-60 Z M20,-70 V-80 Q26,-86 32,-80 V-70 Z" ${SOLID}/><path d="M-6,0 V-22 Q0,-28 6,-22 V0 Z" ${L4} stroke-width="1"/><path d="M-14,-4 H14 M-12,-8 H12 M-10,-12 H10" stroke-width="1"/>${[[-30, -40], [24, -50], [30, -26]].map(([x, y]) => `<path d="M${x - 3},${y} h6 l-1,4 h-4 Z" ${L3} stroke-width=".8"/><circle cx="${x}" cy="${y - 2}" r="2.4" ${SOLID}/>`).join('')}`;
/** Kasbah (Aït-Ben-Haddou), Breite ca. 80 */
const KASBAH = `${[[-30, 34], [-10, 46], [12, 40], [30, 30]].map(([x, h]) => `<path d="M${x - 10},0 V${-h} H${x + 10} V0" ${L2} stroke-width="1.2"/><path d="M${x - 10},${-h} l3,-4 l3,4 l3,-4 l3,4 l3,-4 l2,4" stroke-width="1"/><rect x="${x - 2}" y="${-h + 8}" width="4" height="5" ${SOLID}/>`).join('')}`;
/** Koutoubia-Minarett */
const KOUTOUBIA = `<path d="M-9,0 V-64 H9 V0 Z" ${L2} stroke-width="1.3"/><path d="M-9,-64 h3 v-3 h3 v3 h3 v-3 h3 v3 h3 v-3 v3" stroke-width="1"/><path d="M-4,-64 V-76 H4 V-64" ${L2} stroke-width="1.1"/><path d="M-3,-76 Q0,-82 3,-76 Z" ${SOLID}/><path d="M0,-80 V-86" stroke-width="1"/><path d="M-5,-50 V-56 Q-3,-58 -1,-56 V-50 Z M1,-50 V-56 Q3,-58 5,-56 V-50 Z M-4,-30 V-38 Q0,-42 4,-38 V-30 Z" ${SOLID}/>`;
/** Amphitheater von El Djem */
const ELDJEM = `<path d="M-60,0 V-40 H50 L56,-30 L60,-20 V0 Z" ${L2} stroke-width="1.6"/><path d="M-60,-13 H60 M-60,-27 H54" stroke-width="1.2"/>${[0, 1, 2].map((r) => Array.from({ length: 10 }, (_, i) => `<path d="M${-56 + i * 11.6},${-3 - r * 13} V${-9 - r * 13} Q${-52 + i * 11.6},${-13 - r * 13} ${-48 + i * 11.6},${-9 - r * 13} V${-3 - r * 13} Z" ${PAPER}/>`).join('')).join('')}`;
/** weißes Haus mit blauer Tür/Fensterladen (Sidi Bou Said) */
const sidi = (x: number, y: number, w: number, h: number) => `<path d="M${x},${y} V${y - h} H${x + w} V${y}" ${SNOW} stroke-width="1.1"/><path d="M${x + w / 2 - 3},${y} V${y - 10} Q${x + w / 2},${y - 13} ${x + w / 2 + 3},${y - 10} V${y} Z M${x + 3},${y - h + 4} h4 v5 h-4 Z" ${SOLID}/>`;
/** Kitesurfer */
const KITE = `<path d="M-10,-50 Q10,-62 30,-48 Q12,-54 -10,-50 Z" ${L3} stroke-width="1.2"/><path d="M-10,-50 L0,-12 M30,-48 L0,-12" stroke-width=".8"/><circle cx="0" cy="-14" r="2.2" ${SOLID}/><path d="M0,-12 V-4 L-4,0 M0,-4 L4,0" stroke-width="1.8"/><path d="M-8,0 H8" stroke-width="2"/>`;
/** Pelikan */
const PELICAN = `<path d="M-10,0 Q-14,-10 -4,-14 Q4,-16 10,-10 Q12,-4 8,0 Z" ${SNOW} stroke-width="1.2"/><path d="M-4,-14 Q-6,-24 0,-26 Q4,-26 4,-22" stroke-width="1.6"/><path d="M4,-24 L16,-18 L4,-20 Z" ${SOLID}/>`;
/** Siegestor (Black Star Gate) */
const BLACKSTAR = `<path d="M-40,0 V-30 H40 V0 H26 V-18 H-26 V0 Z" ${SNOW} stroke-width="1.4"/><path d="M-40,-30 H40 V-38 H-40 Z" ${L3} stroke-width="1.2"/><path d="M0,-52 l3.6,8 h8.4 l-6.8,5 l2.6,8 l-7.8,-5 l-7.8,5 l2.6,-8 l-6.8,-5 h8.4 Z" ${SOLID}/>${[-34, -20, 20, 34].map((x) => `<path d="M${x},-4 V-26" stroke-width="1.4"/>`).join('')}`;
/** Hängebrücke im Blätterdach (Kakum) */
const canopy = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1},${y1} Q${f1((x1 + x2) / 2)},${f1(Math.max(y1, y2) + 14)} ${x2},${y2}" stroke-width="2"/><path d="M${x1},${y1 - 8} Q${f1((x1 + x2) / 2)},${f1(Math.max(y1, y2) + 6)} ${x2},${y2 - 8}" stroke-width="1"/>${Array.from({ length: 9 }, (_, i) => {
	const t = (i + 1) / 10,
		x = x1 + (x2 - x1) * t,
		y = y1 + (y2 - y1) * t + 14 * 4 * t * (1 - t) * 0.5;
	return `<path d="M${f1(x)},${f1(y)} v-8" stroke-width=".8"/>`;
}).join('')}`;
/** großer Regenwaldbaum */
const bigtree = (x: number, y: number, h: number) => `<path d="M${x - 4},${y} Q${x - 3},${y - h * 0.6} ${x - 2},${y - h} H${x + 2} Q${x + 3},${y - h * 0.6} ${x + 4},${y} Z" ${SOLID}/><path d="M${x - 24},${y - h + 6} Q${x - 20},${y - h - 18} ${x},${y - h - 16} Q${x + 20},${y - h - 18} ${x + 24},${y - h + 6} Q${x},${y - h + 2} ${x - 24},${y - h + 6} Z" ${L3} stroke-width="1.2"/>`;
/** Löwe, Blick nach links */
const LION = `<path d="M8,-18 H30 Q36,-18 36,-12 V0 H33 V-8 H30 V0 H27 V-8 H15 V0 H12 V-8 H9 V0 H7 Z" ${L3} stroke-width="1.2"/><circle cx="6" cy="-18" r="9" ${SOLID}/><circle cx="4" cy="-17" r="5" ${L3} stroke-width="1"/><circle cx="2" cy="-18" r=".8" ${SOLID}/><path d="M36,-12 Q42,-12 42,-4 l2,2" stroke-width="1.4"/>`;
/** Reiter beim Durbar (Federschmuck) */
const DURBAR = `${horse(RIDER)}<path d="M17,-39 L14,-48 M17,-39 L20,-48 M17,-39 L17,-50" stroke-width="1.4"/><path d="M6,-26 H30 L28,-18 H8 Z" ${L2} stroke="var(--stp)" stroke-width="1"/><path d="M28,-36 L36,-30" stroke-width="1.4"/><path d="M8,-16 l3,4 l3,-4 l3,4 l3,-4 l3,4 l3,-4" stroke="var(--stp)" stroke-width="1"/>`;
/** Seilbahngondel */
const GONDOLA = `<path d="M0,-12 V-20" stroke-width="1.2"/><rect x="-6" y="-12" width="12" height="10" rx="2" ${SOLID}/><rect x="-4" y="-10" width="8" height="4" ${PAPER}/>`;
/* Bausteine südliches und östliches Afrika */
/** Erdmännchen (aufrecht) */
const MEERKAT = `<path d="M-3,0 Q-5,-10 -3,-20 Q-2,-26 0,-28 Q3,-26 3,-20 Q5,-10 3,0 Z" ${L3} stroke-width="1.2"/><circle cx="0" cy="-30" r="3" ${L3} stroke-width="1.1"/><path d="M2,-30 l3,1" stroke-width="1"/><circle cx="1" cy="-31" r=".7" ${SOLID}/><path d="M-3,-18 l3,3 l3,-3" stroke-width="1"/>`;
/** Mokoro mit Stakenden */
const MOKORO = `<path d="M-22,0 Q0,4 22,0 L20,-3 H-20 Z" ${SOLID}/><circle cx="8" cy="-26" r="2.6" ${SOLID}/><path d="M8,-24 V-12 L4,-3 M8,-12 L12,-3 M8,-20 L2,-24" stroke-width="2"/><path d="M2,-28 L-6,8" stroke-width="1.2"/>`;
/** Lavasee-Vulkan (Nyiragongo) */
const NYIRA = (y: number) => `<path d="M10,${y} L60,${y - 64} H120 L170,${y} Z" ${L3} stroke-width="1.8"/><ellipse cx="90" cy="${y - 64}" rx="30" ry="6" ${SOLID}/><ellipse cx="90" cy="${y - 64}" rx="20" ry="3.4" fill="#F7A35C" fill-opacity=".9" stroke="none"/><path d="M84,${y - 70} q-4,-10 2,-16 q6,-6 2,-14 M98,${y - 70} q4,-8 0,-14" stroke-width="1.4"/>`;
/** Flussschiff mit Lastkähnen (Kongo) */
const BARGE = `<path d="M-40,0 H40 L36,6 H-36 Z" ${SOLID}/><path d="M-36,0 V-8 H-6 V0 M2,0 V-10 H30 V0" ${L3} stroke-width="1.1"/><path d="M14,-10 V-18 H22 V-10" ${SOLID}/>${[-30, -22, -14].map((x) => `<circle cx="${x}" cy="-12" r="2" ${SOLID}/>`).join('')}`;
/** Schmetterling */
const BUTTERFLY = `<path d="M0,0 Q-8,-10 -12,-4 Q-10,2 0,0 Q-8,8 -4,10 Q0,6 0,0 Q8,-10 12,-4 Q10,2 0,0 Q8,8 4,10 Q0,6 0,0 Z" ${L3} stroke-width="1"/>`;
/** Rhumsiki-Felsnadel mit Dorf */
const RHUMSIKI = `<path d="M-14,0 Q-12,-30 -4,-54 Q0,-62 4,-56 Q10,-30 16,0 Z" ${L3} stroke-width="1.6"/><path d="M-4,-50 Q-6,-30 -8,-4 M4,-52 Q6,-30 10,-4" stroke-width="1"/>`;
/** Rundhütte (Rondavel) */
const RONDAVEL = `<path d="M-10,0 V-10 H10 V0 Z" ${SNOW} stroke-width="1.1"/><path d="M-13,-9 L0,-20 L13,-9 Z" ${L3} stroke-width="1"/><path d="M-3,0 V-6 H3 V0" ${SOLID}/>`;
/** Basotho-Reiter in Decke */
const BASOTHO = `${horse(RIDER)}<path d="M12,-34 L22,-34 L24,-20 L10,-20 Z" ${L3} stroke="var(--stp)" stroke-width="1"/><path d="M13,-40 L17,-48 L21,-40 Z" ${SOLID}/>`;
/** Katta (Ringelschwanzlemur) */
const KATTA = `<path d="M-6,0 Q-8,-12 -2,-18 Q6,-20 8,-12 Q10,-4 6,0 Z" ${L3} stroke-width="1.2"/><circle cx="0" cy="-24" r="5.6" ${SNOW} stroke-width="1.2"/><path d="M-4,-28 l-2,-4 l3,1 M4,-28 l2,-4 l-3,1" stroke-width="1.2"/><circle cx="-2" cy="-24" r="1.4" ${SOLID}/><circle cx="2" cy="-24" r="1.4" ${SOLID}/><path d="M6,-2 Q20,-6 22,-24 Q24,-40 16,-52" stroke-width="4"/><path d="M6,-2 Q20,-6 22,-24 Q24,-40 16,-52" stroke="var(--stp)" stroke-width="4" stroke-dasharray="3 3"/>`;
/** Tsingy: Kalknadeln */
const tsingy = (x: number, y: number, n: number, w = 10) => Array.from({ length: n }, (_, i) => {
	const h = 30 + ((i * 17) % 34),
		xx = x + i * w;
	return `<path d="M${xx - w / 2},${y} L${xx - 1},${y - h} L${xx + 1},${y - h + 3} L${xx + w / 2},${y} Z" ${[L3, L2, L4][i % 3]} stroke-width="1"/>`;
}).join('');
/** Chamäleon auf Ast */
const CHAMELEON = `<path d="M-30,0 H30" stroke-width="3"/><path d="M-16,-2 Q-18,-14 -6,-16 Q8,-18 14,-10 Q16,-4 12,-2 Z" ${SOLID}/><path d="M-16,-6 Q-24,-8 -24,-2" ${SOLID}/><circle cx="-18" cy="-8" r="2.4" ${PAPER}/><circle cx="-18" cy="-8" r="1" ${SOLID}/><path d="M14,-6 Q24,-6 24,2 Q24,8 18,8 Q14,6 18,4" stroke-width="2"/><path d="M-10,-2 l-2,4 M6,-2 l2,4" stroke-width="1.6"/><path d="M-12,-12 q4,-4 8,0 q4,-4 8,0" stroke="var(--paper)" stroke-width="1"/>`;
/** Le Morne Brabant */
const LEMORNE = (y: number, x = 60, k = 1) => `<path d="M${x - 50 * k},${y} Q${x - 40 * k},${y - 20 * k} ${x - 24 * k},${y - 30 * k} L${x - 10 * k},${y - 66 * k} Q${x},${y - 72 * k} ${x + 14 * k},${y - 64 * k} L${x + 30 * k},${y - 30 * k} Q${x + 50 * k},${y - 18 * k} ${x + 70 * k},${y} Z" ${L3} stroke-width="1.8"/><path d="M${x - 10 * k},${y - 66 * k} L${x - 4 * k},${y - 30 * k} M${x + 14 * k},${y - 64 * k} L${x + 10 * k},${y - 30 * k}" stroke-width="1"/>`;
/** Katamaran */
const CATAMARAN = `<path d="M-20,0 H20 M-20,4 H20" stroke-width="2.6"/><path d="M-16,0 V-4 H16 V0" ${SNOW} stroke-width="1"/><path d="M0,-4 V-34" stroke-width="1.4"/><path d="M1.5,-32 L16,-6 H1.5 Z" ${SNOW} stroke-width="1.1"/><path d="M-1.5,-28 L-12,-6 H-1.5 Z" ${L2} stroke-width="1"/>`;
/** Köcherbaum */
const QUIVER = `<path d="M-3,0 Q-4,-14 0,-22 Q4,-14 3,0 Z" ${SOLID}/><path d="M0,-20 L-10,-30 M0,-20 L10,-30 M-6,-26 L-12,-26 M6,-26 L12,-26 M0,-20 V-34" stroke-width="2"/>${[[-12, -32], [-14, -26], [10, -32], [14, -26], [0, -36], [-6, -34], [6, -34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" ${L3} stroke-width=".8"/>`).join('')}`;
/** Teehügel (Ruanda): runde Hügel mit Reihen */
const teahill = (x: number, y: number, r: number, f = L2) => `<path d="M${x - r},${y} Q${x - r},${y - r * 0.8} ${x},${y - r * 0.9} Q${x + r},${y - r * 0.8} ${x + r},${y} Z" ${f} stroke-width="1.4"/>${Array.from({ length: 4 }, (_, i) => `<path d="M${f1(x - r * (0.9 - i * 0.18))},${f1(y - r * 0.15 - i * r * 0.18)} Q${x},${f1(y - r * 0.3 - i * r * 0.2)} ${f1(x + r * (0.9 - i * 0.18))},${f1(y - r * 0.15 - i * r * 0.18)}" stroke-width="2" stroke-dasharray="1.4 2.4"/>`).join('')}`;
/** Berggorilla (sitzend) */
const GORILLA = `<path d="M-18,0 Q-22,-20 -12,-30 Q0,-38 12,-30 Q22,-20 18,0 Z" ${SOLID}/><circle cx="0" cy="-36" r="9" ${SOLID}/><path d="M-6,-40 Q0,-34 6,-40 Q4,-30 0,-30 Q-4,-30 -6,-40 Z" ${L3} stroke="none"/><circle cx="-3" cy="-38" r=".9" ${PAPER}/><circle cx="3" cy="-38" r=".9" ${PAPER}/><path d="M-16,-20 Q-24,-8 -18,0 M16,-20 Q24,-8 18,0" stroke-width="5"/><path d="M-8,-20 Q0,-16 8,-20" stroke="var(--paper)" stroke-width="1"/>`;
/** Coco-de-mer-Nuss */
const COCODEMER = `<path d="M0,-30 Q-18,-30 -18,-10 Q-18,6 -4,4 Q0,2 0,-4 Q0,2 4,4 Q18,6 18,-10 Q18,-30 0,-30 Z" ${SOLID}/><path d="M0,-30 V-4" stroke="var(--paper)" stroke-width="1.6"/><path d="M-10,-22 q-4,6 -2,14 M10,-22 q4,6 2,14" stroke="var(--paper)" stroke-width="1"/>`;
/** Riesenschildkröte (Aldabra), Blick nach links */
const TORTOISE = `<path d="M-20,0 Q-22,-22 0,-24 Q22,-22 20,0 Z" ${L3} stroke-width="1.5"/><path d="M-12,-4 L-8,-18 M0,-6 V-22 M12,-4 L8,-18 M-18,-8 H18" stroke-width="1"/><path d="M-20,-4 Q-30,-6 -34,-12 Q-36,-16 -32,-18 Q-28,-16 -24,-10" ${SOLID}/><circle cx="-32" cy="-16" r=".9" ${PAPER}/><path d="M-14,0 v4 M12,0 v4" stroke-width="4"/>`;
/** Bienenkorbhütte (Eswatini) */
const BEEHIVE = `<path d="M-14,0 Q-16,-22 0,-24 Q16,-22 14,0 Z" ${L3} stroke-width="1.3"/><path d="M-12,-8 Q0,-12 12,-8 M-10,-16 Q0,-19 10,-16" stroke-width=".9"/><path d="M-3,0 V-6 Q0,-8 3,-6 V0" ${SOLID}/>`;
/** Zebra, Blick nach rechts */
const ZEBRA = `<path d="M2,-14 Q2,-22 10,-22 H24 Q28,-22 29,-18 L34,-28 Q36,-32 39,-30 L40,-26 Q38,-26 37,-22 L32,-12 Q30,-10 26,-10 H6 Q2,-10 2,-14 Z" ${SNOW} stroke-width="1.3"/><path d="M7,-10 V0 M11,-10 V0 M23,-10 V0 M27,-10 V0" stroke-width="2"/><path d="M8,-22 V-12 M13,-22 V-11 M18,-22 V-11 M23,-21 V-12 M30,-22 L33,-16 M33,-26 L36,-20" stroke-width="1.6"/><path d="M2,-16 Q-2,-14 -2,-8" stroke-width="1.4"/>`;
/** Gnu, Blick nach rechts */
const GNU = `<path d="M2,-14 Q4,-22 14,-22 H22 Q28,-24 30,-18 L34,-16 Q36,-12 32,-10 L28,-12 Q24,-10 20,-10 H6 Q2,-10 2,-14 Z" ${SOLID}/><path d="M7,-10 V0 M11,-10 V0 M21,-10 V0 M25,-10 V0" stroke-width="1.6"/><path d="M28,-20 q-2,-6 2,-6 M32,-20 q2,-6 -2,-6" stroke-width="1.2"/>`;
/** Löwe im Baum (Ishasha) */
const TREELION = `<path d="M-14,0 Q-16,-8 -8,-10 H10 Q16,-10 16,-4 V0 Z" ${L3} stroke-width="1.2"/><circle cx="-12" cy="-8" r="6" ${SOLID}/><circle cx="-12" cy="-8" r="3.4" ${L3} stroke="none"/><path d="M16,-4 Q22,0 20,10" stroke-width="1.4"/><path d="M-8,0 v8 M10,0 v6" stroke-width="2.4"/>`;
/** Pinguin (Boulders Beach) */
const AFPENG = `<path d="M-5,0 Q-8,-10 -6,-18 Q-4,-24 0,-24 Q4,-24 5,-18 Q8,-10 5,0 Z" ${SOLID}/><path d="M-3,-2 Q-5,-10 -3,-16 Q0,-18 3,-16 Q5,-10 3,-2 Z" ${PAPER}/><path d="M-4,-14 H4" stroke-width="1"/><circle cx="1" cy="-21" r=".8" ${PAPER}/><path d="M4,-21 l4,1" stroke-width="1.2"/>`;
/** Protea-Blüte */
const PROTEA = `<path d="M0,0 V14" stroke-width="1.6"/>${Array.from({ length: 9 }, (_, i) => `<path d="M0,0 Q${f1(-12 + i * 3)},${-8 - Math.abs(4 - i) * -1} ${f1(-10 + i * 2.5)},-22" stroke-width="2.4"/>`).join('')}<path d="M-10,0 Q0,6 10,0 Q0,-14 -10,0 Z" ${SOLID}/>`;
/** Flughund-Schwarm */
const bats = (x: number, y: number, n: number) => Array.from({ length: n }, (_, i) => `<path d="M${x + ((i * 37) % 120)},${y + ((i * 23) % 50)} q2,-2 4,0 q2,-2 4,0" stroke-width="1.2"/>`).join('');
/** Great-Zimbabwe-Turm und Mauer */
const GREATZIM = `<path d="M-60,0 Q-60,-26 -40,-30 H40 Q60,-26 60,0" ${L2} stroke-width="1.5"/><path d="M-54,-6 Q-54,-22 -40,-24 H40 Q54,-22 54,-6" stroke-width="1" stroke-dasharray="3 2"/><path d="M-8,-26 L-6,-60 Q0,-64 6,-60 L8,-26 Z" ${L3} stroke-width="1.4"/><path d="M-7,-34 H7 M-6.6,-42 H6.6 M-6.3,-50 H6.3" stroke-width=".9"/>`;
/** Elefant auf den Hinterbeinen (Mana Pools) */
const ELEUP = `<path d="M-4,0 V-16 Q-8,-34 4,-46 Q14,-50 18,-40 Q20,-30 14,-20 V0 H10 V-12 H2 V0 Z" ${SOLID}/><path d="M16,-44 Q26,-52 24,-66 Q22,-72 18,-70" stroke-width="4"/><path d="M8,-42 Q2,-36 6,-30" stroke="var(--paper)" stroke-width="1.2"/><path d="M14,-36 q6,0 8,-4" stroke="var(--paper)" stroke-width="1.6"/>`;
/** Ylang-Ylang-Blüte */
const YLANG = `<path d="M0,0 V-6" stroke-width="1.2"/>${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M0,-6 Q4,-14 2,-24 Q-2,-16 0,-6 Z" transform="rotate(${a} 0 -6)" ${L3} stroke-width=".8"/>`).join('')}<circle cx="0" cy="-6" r="2" ${SOLID}/>`;
/** springender Buckelwal */
const HUMPBACK = `<path d="M-30,0 Q-26,-30 0,-44 Q12,-50 16,-44 Q10,-36 4,-20 Q0,-6 6,0 Z" ${SOLID}/><path d="M-6,-30 Q-18,-24 -24,-12" stroke="var(--paper)" stroke-width="1.2"/><path d="M-10,-24 L-26,-30 L-20,-18 Z" ${SOLID}/><path d="M-36,2 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0" stroke="var(--stp)" stroke-width="2"/>`;
/** Mandrill-Gesicht */
const MANDRILL = `<path d="M-14,0 Q-18,-24 0,-30 Q18,-24 14,0 Z" ${L3} stroke-width="1.3"/><path d="M-4,-18 Q-6,-4 0,0 Q6,-4 4,-18 Z" ${SOLID}/><path d="M-10,-16 Q-8,-6 -5,-4 M10,-16 Q8,-6 5,-4" stroke-width="2" stroke="var(--stp)"/><circle cx="-5" cy="-20" r="1.4" ${SOLID}/><circle cx="5" cy="-20" r="1.4" ${SOLID}/><path d="M-12,-26 Q0,-36 12,-26" stroke-width="2"/>`;
/** Dschelada auf der Klippe */
const GELADA = `<path d="M-8,0 Q-12,-14 -4,-22 Q4,-26 10,-18 Q12,-8 8,0 Z" ${L3} stroke-width="1.2"/><path d="M-6,-20 Q-12,-24 -10,-30 Q-4,-34 2,-30 Q4,-24 0,-20" ${SOLID}/><path d="M-4,-14 L0,-10 L4,-14" stroke="var(--stp)" stroke-width="1.6"/><path d="M8,-4 Q16,-2 18,6" stroke-width="1.6"/>`;
/** Kirche mit zwei Türmen (Malabo, Brazzaville) */
const TWINCH = `<path d="M-14,0 V-26 L0,-36 L14,-26 V0 Z" ${SNOW} stroke-width="1.3"/>${[-20, 20].map((x) => `<path d="M${x - 6},0 V-40 H${x + 6} V0" ${SNOW} stroke-width="1.2"/><path d="M${x - 7},-40 L${x},-56 L${x + 7},-40 Z" ${SOLID}/><rect x="${x - 1.4}" y="-34" width="2.8" height="5" ${SOLID}/>`).join('')}<circle cx="0" cy="-22" r="4" ${L3} stroke-width="1"/><path d="M-4,0 V-10 Q0,-14 4,-10 V0 Z" ${SOLID}/>`;
/** Dampflok mit Wagen (Eritrea) */
const STEAM = `<path d="M-30,-6 V-18 H-6 V-26 H4 V-6 Z" ${SOLID}/><path d="M-26,-18 V-26 H-20 V-18" ${SOLID}/><path d="M-22,-30 q-4,-6 2,-10 q6,-4 2,-10" stroke-width="1.4"/><circle cx="-22" cy="-4" r="4" ${SOLID}/><circle cx="-10" cy="-4" r="4" ${SOLID}/>${[0, 1].map((i) => `<rect x="${8 + i * 24}" y="-18" width="22" height="13" rx="1.6" ${L3} stroke-width="1"/><circle cx="${13 + i * 24}" cy="-3" r="2.4" ${SOLID}/><circle cx="${25 + i * 24}" cy="-3" r="2.4" ${SOLID}/>`).join('')}`;
/** Arkadenhaus (Massawa) */
const ARCADES = `<path d="M-40,0 V-40 H40 V0 Z" ${SNOW} stroke-width="1.3"/>${[-32, -16, 0, 16].map((x) => `<path d="M${x + 2},0 V-12 Q${x + 8},-20 ${x + 14},-12 V0 Z M${x + 2},-22 V-30 Q${x + 8},-36 ${x + 14},-30 V-22 Z" ${L3} stroke="none"/>`).join('')}<path d="M-42,-40 H42 M-40,-20 H40" stroke-width="1.6"/>`;
/** Schwefelquellen (Dallol): Becken und Kegel */
const dallol = (x: number, y: number, n: number) => Array.from({ length: n }, (_, i) => {
	const cx = x + i * 26 + ((i * 13) % 10),
		r = 10 + ((i * 7) % 8);
	return `<ellipse cx="${cx}" cy="${y + ((i * 5) % 8)}" rx="${r}" ry="${f1(r * 0.35)}" ${[L3, SNOW, L2][i % 3]} stroke-width="1.2"/><path d="M${cx - 4},${y + ((i * 5) % 8) - 2} q4,-10 8,0" ${L4} stroke-width="1"/>`;
}).join('');
/** Torbogen Arch 22 (Banjul) */
const ARCH22 = `<path d="M-40,0 V-40 H-20 V0 Z M20,0 V-40 H40 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-44,-40 H44 V-56 H-44 Z" ${L2} stroke-width="1.3"/><path d="M-44,-56 L0,-70 L44,-56 Z" ${SOLID}/>${[-36, -28, 28, 36].map((x) => `<path d="M${x},-4 V-36" stroke-width="1.2"/>`).join('')}`;
/** quadratisches Lehmminarett (Chinguetti, Timbuktu) */
const SQMINARET = `<path d="M-30,0 V-16 H30 V0 Z" ${L2} stroke-width="1.3"/><path d="M-8,-16 L-7,-56 H7 L8,-16 Z" ${L2} stroke-width="1.4"/><path d="M-9,-56 h3 v-4 h3 v4 h3 v-4 h3 v4 h3 v-4 h3 v4" stroke-width="1"/><path d="M-10,-24 h20 M-10,-36 h20 M-10,-48 h20" stroke-width="1.4" stroke-dasharray="1.6 3"/><path d="M-26,0 V-8 h4 v8 M22,0 V-8 h4 v8" ${SOLID}/>`;
/** Richat-Struktur (Ringe) */
const RICHAT = `${[44, 34, 24, 14, 6].map((r, i) => `<ellipse cx="0" cy="0" rx="${r * 1.6}" ry="${r}" ${[L1, L2, SNOW, L3, L2][i]} stroke-width="1.2"/>`).join('')}`;
/** Tuareg mit Kamel und Indigo-Turban */
const TUAREG = `${CAMEL}<circle cx="-12" cy="-28" r="3" ${SOLID}/><path d="M-15,-28 h6 M-15,-26 h6" stroke="var(--stp)" stroke-width="1"/><path d="M-16,-25 L-8,-25 L-6,0 H-18 Z" ${L4} stroke-width="1"/><path d="M-8,-20 L4,-18" stroke-width="1.6"/>`;
/** Giraffe (klein), Blick nach rechts */
const GIRAFFE2 = `<path d="M4,-22 L6,0 M8,-22 L10,0 M20,-22 L19,0 M24,-22 L24,0" stroke-width="1.8"/><path d="M2,-28 Q4,-34 14,-34 Q24,-34 26,-28 L26,-22 H2 Z" ${L3} stroke-width="1.2"/><path d="M24,-30 L32,-56 L36,-54 L30,-28" ${L3} stroke-width="1.2"/><path d="M32,-56 L38,-58 L40,-54 L36,-52" ${SOLID}/>${dots([[8, -28, 1.4], [14, -30, 1.4], [20, -28, 1.4], [31, -44, 1.2]], SOLID)}`;
/** Gummibaum mit Zapfschale */
const RUBBER = `<path d="M-6,0 Q-4,-30 -6,-60 H6 Q4,-30 6,0 Z" ${L3} stroke-width="1.3"/><path d="M-5,-30 L5,-36 M-5,-22 L5,-28" stroke="var(--stp)" stroke-width="1.4"/><path d="M5,-20 h6 v4 h-6" ${SNOW} stroke-width="1"/><path d="M-30,-60 Q-20,-80 0,-80 Q20,-80 30,-60 Q10,-64 0,-62 Q-10,-64 -30,-60 Z" ${SOLID}/>`;
/** Moschee von Ghadames (weiße Gasse) */
const GHADAMES = `<path d="M-40,0 V-40 H-10 V0 Z M10,0 V-46 H40 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-40,-40 l4,-6 l4,6 l4,-6 l4,6 l4,-6 l4,6 l4,-6 M10,-46 l4,-6 l4,6 l4,-6 l4,6 l4,-6 l4,6 l4,-6" stroke-width="1.2"/><path d="M-10,-30 Q0,-40 10,-30 V0 H-10 Z" ${L2} stroke-width="1.2"/><path d="M-30,-20 h6 v8 h-6 Z M20,-26 h6 v8 h-6 Z" ${SOLID}/>`;
/** Tempel am Jebel Barkal (Tafelberg mit Felsnadel) */
const BARKAL = `<path d="M-60,0 L-50,-40 H40 L44,-30 L50,-40 L54,-30 L60,0 Z" ${L3} stroke-width="1.6"/><path d="M40,-40 L44,-58 L48,-40" ${L3} stroke-width="1.4"/><path d="M-40,0 V-14 H-10 V0 M-30,-14 V-20 H-20 V-14" ${SNOW} stroke-width="1.1"/>${[-36, -30, -24, -18, -12].map((x) => `<path d="M${x},0 V-10" stroke-width="1.2"/>`).join('')}`;
/** Cotton Tree (Freetown) */
const COTTONTREE = `<path d="M-6,0 Q-4,-20 -6,-34 H6 Q4,-20 6,0 Z" ${SOLID}/><path d="M-20,0 Q-10,-6 -6,-14 M20,0 Q10,-6 6,-14" stroke-width="2.6"/><path d="M0,-30 L-20,-40 M0,-30 L20,-42 M0,-32 V-48" stroke-width="2.6"/><path d="M-44,-40 Q-40,-62 -14,-62 Q0,-72 14,-62 Q40,-62 44,-40 Q20,-34 0,-38 Q-20,-34 -44,-40 Z" ${L3} stroke-width="1.4"/>`;
/** Kamele am Brunnen */
const CAMELWELL = `<path d="M-10,0 V-10 H10 V0 Z" ${L3} stroke-width="1.2"/><path d="M-12,-10 H12" stroke-width="2"/><path d="M-8,-10 V-24 M8,-10 V-24 M-10,-24 H10" stroke-width="1.6"/>`;
/** Weißohr-Kob, Blick nach rechts */
const KOB = `<path d="M2,-12 Q2,-18 10,-18 H22 Q26,-18 27,-14 L25,-10 H6 Q2,-10 2,-12 Z" ${L3} stroke-width="1"/><path d="M7,-10 V0 M11,-10 V0 M21,-10 V0 M24,-10 V0" stroke-width="1.4"/><path d="M25,-16 L30,-22 L34,-20 L30,-14 Z" ${L3} stroke-width="1"/><path d="M30,-22 Q28,-30 32,-34 M32,-22 Q32,-30 36,-32" stroke-width="1.2"/>`;
/** Papyrusboot (Tschadsee) */
const PAPYRUSBOAT = `<path d="M-26,-6 Q-30,-14 -26,-16 Q0,-4 26,-16 Q30,-14 26,-6 Q0,6 -26,-6 Z" ${L3} stroke-width="1.3"/><path d="M-18,-8 Q0,0 18,-8" stroke-width=".9"/>${PERSON.replace('<circle', '<circle transform="translate(0,-4)"')}<path d="M4,-18 L18,4" stroke-width="1.2"/>`;
/** Pflanzerhaus (Roça) auf São Tomé */
const ROCA = `<path d="M-40,0 V-24 H40 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-46,-22 L-40,-32 H40 L46,-22 Z" ${SOLID}/>${[-32, -20, -8, 4, 16, 28].map((x) => `<path d="M${x},0 V-14 Q${x + 3},-18 ${x + 6},-14 V0 Z" ${L3} stroke="none"/>`).join('')}<path d="M-44,-12 H44" stroke-width="1.4"/>`;
/* Bausteine Südamerika */
/** Gletscherfront (Perito Moreno) */
const GLACIER = (y: number, w = 180) => `<path d="M0,${y} V${y - 40} L${w * 0.15},${y - 46} L${w * 0.3},${y - 40} L${w * 0.45},${y - 50} L${w * 0.6},${y - 42} L${w * 0.75},${y - 48} L${w},${y - 40} V${y} Z" ${SNOW} stroke-width="1.6"/>${Array.from({ length: Math.floor(w / 12) }, (_, i) => `<path d="M${6 + i * 12},${y - 2} V${y - 36 + (i % 3) * 4}" stroke-width="1" stroke-opacity=".6"/>`).join('')}`;
/** Tangopaar */
const TANGO = `<circle cx="-5" cy="-46" r="3.4" ${SOLID}/><circle cx="6" cy="-44" r="3" ${SOLID}/><path d="M-5,-42 L-6,-24 L-10,0 M-6,-24 L-2,0 M-5,-38 L4,-36" stroke-width="2.6"/><path d="M6,-40 Q8,-30 4,-24 Q12,-14 16,0 H0 Q4,-12 4,-24" ${SOLID}/><path d="M6,-38 L-2,-34" stroke-width="2"/><path d="M-9,-49 h8" stroke-width="1.6"/>`;
/** Schilfboot (Titicaca) */
const TOTORA = `<path d="M-28,-10 Q-34,-20 -26,-22 Q-20,-8 0,-6 Q20,-8 26,-22 Q34,-20 28,-10 Q0,6 -28,-10 Z" ${L3} stroke-width="1.4"/><path d="M-22,-12 Q0,-2 22,-12" stroke-width=".9"/><path d="M0,-8 V-40" stroke-width="1.4"/><path d="M0,-38 H14 V-12 H0" ${L2} stroke-width="1"/>`;
/** Geländewagen */
const JEEP = `<path d="M-16,-4 V-12 L-10,-18 H8 L12,-12 H18 V-4 Z" ${SOLID}/><path d="M-8,-16 h6 v4 h-6 Z M0,-16 h6 v4 h-6 Z" ${PAPER}/><circle cx="-10" cy="-3" r="3" ${L4} stroke-width="1"/><circle cx="12" cy="-3" r="3" ${L4} stroke-width="1"/><path d="M-12,-18 h20 v-3 h-20 Z" ${L3} stroke="none"/>`;
/** Tukan auf Ast */
const TOUCAN = `<path d="M-24,0 H24" stroke-width="3"/><path d="M-8,0 Q-12,-16 -4,-26 Q4,-30 8,-22 Q10,-10 4,0 Z" ${SOLID}/><path d="M-4,-22 Q0,-26 6,-20 Q4,-14 -2,-16 Z" ${PAPER}/><path d="M6,-24 Q26,-26 30,-18 Q20,-14 6,-18 Z" ${L3} stroke-width="1.2"/><circle cx="2" cy="-22" r="1.2" ${SOLID}/><path d="M-6,0 L-10,10" stroke-width="2"/>`;
/** Zuckerhut (Pão de Açúcar) */
const SUGARLOAF = (x: number, y: number, k = 1) => `<path d="M${x - 30 * k},${y} Q${x - 26 * k},${y - 40 * k} ${x - 6 * k},${y - 56 * k} Q${x + 10 * k},${y - 60 * k} ${x + 18 * k},${y - 40 * k} Q${x + 24 * k},${y - 20 * k} ${x + 30 * k},${y} Z" ${L3} stroke-width="1.6"/>`;
/** Christusstatue */
const CRISTO = `<path d="M-2.6,0 L-3,-22 H3 L2.6,0 Z" ${SOLID}/><path d="M-14,-20 H14" stroke-width="3.4"/><circle cx="0" cy="-26" r="2.6" ${SOLID}/><path d="M-4,0 H4 V4 H-4 Z" ${SOLID}/>`;
/** Karnevalstänzerin mit Federschmuck */
const SAMBA = `${Array.from({ length: 9 }, (_, i) => {
	const a = Math.PI + (i * Math.PI) / 8;
	return `<path d="M0,-40 L${f1(26 * Math.cos(a))},${f1(-40 + 26 * Math.sin(a))}" stroke-width="3" stroke-linecap="round"/><circle cx="${f1(26 * Math.cos(a))}" cy="${f1(-40 + 26 * Math.sin(a))}" r="2.6" ${L3}/>`;
}).join('')}<circle cx="0" cy="-40" r="4" ${SOLID}/><path d="M0,-36 L-2,-20 L-8,0 M-2,-20 L4,0 M0,-32 L-12,-40 M0,-32 L12,-44" stroke-width="2.4"/><path d="M-6,-24 H4 L2,-18 H-4 Z" ${L3} stroke="none"/>`;
/** Torres del Paine (drei Granittürme) */
const PAINE = (y: number) => `<path d="M30,${y} L60,${y - 40} L66,${y - 80} L74,${y - 84} L80,${y - 50} L88,${y - 92} L96,${y - 94} L100,${y - 54} L108,${y - 86} L116,${y - 84} L120,${y - 44} L150,${y} Z" ${L3} stroke-width="1.8"/><path d="M66,${y - 80} L74,${y - 84} L76,${y - 70} L68,${y - 68} Z M88,${y - 92} L96,${y - 94} L98,${y - 80} L90,${y - 78} Z M108,${y - 86} L116,${y - 84} L117,${y - 72} L109,${y - 72} Z" ${SNOW} stroke-width="1"/>`;
/** Radioteleskop (ALMA) */
const DISH = `<path d="M-2,0 V-12 M2,0 V-12 M-6,0 H6" stroke-width="1.6"/><path d="M-12,-20 Q0,-8 12,-20 Z" ${SNOW} stroke-width="1.4"/><path d="M0,-14 V-24" stroke-width="1.2"/>`;
/** Moai */
const MOAI = `<path d="M-8,0 V-30 Q-8,-38 -4,-42 H6 Q8,-36 8,-30 L6,0 Z" ${SOLID}/><path d="M-6,-34 H6" stroke="var(--paper)" stroke-width="1.6"/><path d="M4,-34 V-24 L7,-22" stroke="var(--paper)" stroke-width="1.2"/><path d="M-4,-16 H4" stroke="var(--paper)" stroke-width="1"/>`;
/** Kolonialbalkone (Cartagena) */
const cartagena = (x: number, y: number, n: number, w = 22) => Array.from({ length: n }, (_, i) => {
	const hx = x + i * w,
		f = [L2, SNOW, L3, L1][i % 4];
	return `<path d="M${hx},${y} V${y - 44} H${hx + w} V${y}" ${f} stroke-width="1.2"/><path d="M${hx - 1},${y - 44} H${hx + w + 1}" stroke-width="2"/><path d="M${hx + 3},${y - 30} H${hx + w - 3} V${y - 22} H${hx + 3} Z" ${SOLID}/><path d="M${hx + 4},${y - 22} v-8 M${hx + 8},${y - 22} v-8 M${hx + 12},${y - 22} v-8 M${hx + 16},${y - 22} v-8" stroke="var(--paper)" stroke-width=".8"/><path d="M${hx + w / 2 - 4},${y} V${y - 12} Q${hx + w / 2},${y - 16} ${hx + w / 2 + 4},${y - 12} V${y} Z" ${SOLID}/><path d="M${hx + 2},${y - 36} q4,-4 8,0" stroke-width="1"/>`;
}).join('');
/** Kolibri */
const HUMMINGBIRD = `<path d="M0,0 Q-6,-4 -4,-10 Q2,-12 6,-6 L20,-10 L6,-2 Q4,2 0,0 Z" ${SOLID}/><path d="M-2,-6 Q-12,-18 -6,-22 Q0,-14 -2,-6 Z" ${L3} stroke-width="1"/><path d="M-2,0 L-8,6 L-4,6 Z" ${SOLID}/>`;
/** Willys-Jeep mit Kaffeesäcken */
const WILLYS = `<path d="M-18,-4 V-12 H-6 L-2,-18 H12 V-4 Z" ${SOLID}/><circle cx="-12" cy="-3" r="3.4" ${L4} stroke-width="1"/><circle cx="8" cy="-3" r="3.4" ${L4} stroke-width="1"/><path d="M-16,-12 Q-12,-24 -4,-20 Q4,-26 10,-20" ${L3} stroke-width="1.2"/>`;
/** Blaufußtölpel */
const BOOBY = `<path d="M-6,0 Q-8,-8 -4,-14 Q2,-18 6,-12 Q8,-6 4,0 Z" ${SNOW} stroke-width="1.2"/><circle cx="0" cy="-18" r="3.4" ${SNOW} stroke-width="1.1"/><path d="M2,-18 L10,-15 L2,-16" ${SOLID}/><path d="M-3,0 l-2,4 h-3 M3,0 l2,4 h3" ${SOLID} stroke="currentColor" stroke-width="1.6"/>`;
/** Meerechse */
const IGUANA = `<path d="M-30,0 Q-20,-6 -4,-6 H12 Q20,-6 24,-4 L32,-6 Q34,-2 30,0 Z" ${SOLID}/><path d="M-6,-6 l2,-4 l2,4 l2,-4 l2,4 l2,-4 l2,4 l2,-4 l2,4" ${SOLID} stroke="currentColor" stroke-width="1"/><path d="M-30,0 Q-40,2 -46,6" stroke-width="2"/><path d="M-10,0 l-4,6 M8,0 l4,6" stroke-width="1.8"/><circle cx="26" cy="-4" r=".9" ${PAPER}/>`;
/** Seelöwe */
const SEALION = `<path d="M-20,0 Q-22,-8 -12,-12 Q0,-18 8,-22 Q12,-30 18,-28 Q22,-24 18,-18 Q14,-8 12,0 Z" ${SOLID}/><circle cx="16" cy="-26" r=".9" ${PAPER}/><path d="M-20,0 L-28,-4 M-20,0 L-28,4 M4,0 L8,4" stroke-width="2"/>`;
/** Walknochenbogen vor der Kathedrale (Stanley) */
const WHALEBONE = `<path d="M-30,0 V-30 H10 V0" ${SNOW} stroke-width="1.3"/><path d="M-34,-28 L-10,-44 L14,-28 Z" ${SOLID}/><path d="M10,0 V-50 H22 V0" ${SNOW} stroke-width="1.2"/><path d="M8,-50 L16,-62 L24,-50 Z" ${SOLID}/><path d="M-60,0 Q-60,-30 -48,-30 Q-36,-30 -36,0" stroke-width="3" stroke="var(--stp)"/><path d="M-60,0 Q-60,-30 -48,-30 Q-36,-30 -36,0" stroke-width="1"/>`;
/** Eselspinguin */
const GENTOO = `<path d="M-5,0 Q-8,-10 -6,-18 Q-4,-24 0,-24 Q4,-24 5,-18 Q8,-10 5,0 Z" ${SOLID}/><path d="M-3,-2 Q-5,-10 -3,-16 Q0,-17 3,-16 Q5,-10 3,-2 Z" ${PAPER}/><path d="M-2,-21 h3" stroke="var(--paper)" stroke-width="1.4"/><path d="M4,-20 l4,1" stroke-width="1.4"/>`;
/** Albatros im Flug */
const ALBATROSS = `<path d="M-36,-2 Q-18,-8 -4,-2 Q0,0 4,-2 Q18,-8 36,-2 Q18,-4 4,2 Q0,4 -4,2 Q-18,-4 -36,-2 Z" ${SOLID}/><path d="M4,0 L10,2 L4,3 Z" ${SOLID}/>`;
/** Holzkirche (Grytviken / Paramaribo) */
const WOODCHURCH = `<path d="M-20,0 V-24 H20 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-24,-22 L0,-36 L24,-22 Z" ${L3} stroke-width="1.2"/><path d="M-6,-32 V-50 H6 V-32" ${SNOW} stroke-width="1.2"/><path d="M-8,-50 L0,-64 L8,-50 Z" ${SOLID}/><path d="M-4,0 V-12 Q0,-16 4,-12 V0 Z M-14,-18 v-6 M14,-18 v-6" ${SOLID}/><path d="M-20,-12 H20" stroke-width=".9"/>`;
/** Riesenseerose (Victoria amazonica) */
const LILYPAD = (x: number, y: number, r: number) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.3)}" ${L3} stroke-width="1.4"/><path d="M${x - r},${y} Q${x - r},${y - 3} ${x - r + 2},${y - 3} H${x + r - 2} Q${x + r},${y - 3} ${x + r},${y}" stroke-width="1.6"/><path d="M${x},${y} L${x - r * 0.6},${f1(y - r * 0.15)} M${x},${y} L${x + r * 0.6},${f1(y - r * 0.15)} M${x},${y} V${f1(y - r * 0.25)}" stroke-width=".8"/>`;
/** Hoatzin */
const HOATZIN = `<path d="M-8,0 Q-12,-12 -4,-18 Q4,-20 8,-14 Q10,-6 6,0 Z" ${L3} stroke-width="1.2"/><circle cx="2" cy="-22" r="4" ${L3} stroke-width="1"/><path d="M0,-26 l-2,-6 M2,-26 l0,-7 M4,-26 l2,-6" stroke-width="1.2"/><path d="M5,-22 l4,1" stroke-width="1.2"/><path d="M-8,-4 Q-18,-2 -22,6" stroke-width="2"/>`;
/** Jesuitenreduktion (Ruine mit Bögen) */
const REDUCCION = `<path d="M-50,0 V-36 H50 V0" ${L2} stroke-width="1.5"/>${[-40, -20, 0, 20, 40].map((x) => `<path d="M${x - 7},0 V-20 Q${x},-30 ${x + 7},-20 V0 Z" ${PAPER}/>`).join('')}<path d="M-50,-36 L-44,-44 L-30,-40 L-20,-46 L0,-42 L10,-48 L30,-40 L40,-44 L50,-36" stroke-width="1.4"/><path d="M30,-36 V-60 H42 V-36" ${L3} stroke-width="1.2"/>`;
/** Paraguayische Harfe */
const HARP = `<path d="M-14,0 L-10,-60 Q6,-66 18,-50 L4,0 Z" ${L2} stroke-width="1.6"/><path d="M-10,-60 Q6,-66 18,-50" stroke-width="3"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${-9 + i * 2},${-58 + i * 1.4} L${-12 + i * 2.2},-2" stroke-width=".7"/>`).join('')}`;
/** Jabiru-Storch */
const JABIRU = `<path d="M0,0 V-14 M4,0 L3,-14" stroke-width="1.2"/><path d="M-8,-14 Q-6,-22 4,-22 Q10,-20 8,-14 Z" ${SNOW} stroke-width="1.2"/><path d="M4,-22 Q2,-30 6,-34" stroke-width="2.6"/><path d="M6,-34 L18,-30 L6,-31" ${SOLID}/>`;
/** Skulptur „Los Dedos“ (Punta del Este) */
const DEDOS = `${[[-16, 26], [-6, 34], [4, 32], [14, 24]].map(([x, h]) => `<path d="M${x - 4},0 V${-h} Q${x},${-h - 5} ${x + 4},${-h} V0" ${L3} stroke-width="1.3"/><path d="M${x - 2},${-h + 2} h4" stroke-width=".9"/>`).join('')}<path d="M22,0 Q24,-10 30,-12 Q34,-12 32,-6 Q28,-4 28,0" ${L3} stroke-width="1.3"/>`;
/** Gaucho mit Pferd */
const GAUCHO = `${horse()}<circle cx="-6" cy="-24" r="2.8" ${SOLID}/><path d="M-11,-26 H-1" stroke-width="2"/><path d="M-9,-24 h6 v-3 h-6 Z" ${SOLID}/><path d="M-6,-21 V-10 L-9,0 M-6,-10 L-3,0 M-6,-18 L0,-14" stroke-width="2"/><path d="M-10,-20 L-2,-20 L-4,-12 H-8 Z" ${L3} stroke="none"/>`;
/** Asado-Grill */
const ASADO = `<path d="M-14,0 V-6 H14 V0" stroke-width="1.6"/><path d="M-16,-6 H16" stroke-width="2"/><path d="M-10,-10 h8 v3 h-8 Z M2,-10 h8 v3 h-8 Z" ${SOLID}/><path d="M-4,-14 q-2,-4 0,-8 M4,-14 q2,-4 0,-8" stroke-width="1"/>`;
/** Scharlachsichler */
const IBIS = `<path d="M-6,0 Q-8,-6 -2,-8 Q4,-8 6,-4 Q6,0 2,0 Z" ${SOLID}/><path d="M4,-6 Q8,-12 10,-10 Q12,-6 18,-2" stroke-width="1.4"/><path d="M-2,0 L-4,6 M2,0 L2,6" stroke-width="1"/>`;
/** Wasserschwein */
const CAPYBARA = `<path d="M-14,0 Q-16,-12 -4,-14 H8 Q14,-14 16,-8 Q18,-4 14,-2 L14,0 Z" ${L3} stroke-width="1.3"/><path d="M-10,0 v4 M10,0 v4" stroke-width="2.4"/><circle cx="12" cy="-10" r=".9" ${SOLID}/><path d="M8,-14 l2,-3" stroke-width="1.2"/>`;
/* Bausteine Nord- und Mittelamerika */
/** Freiheitsstatue */
const LIBERTY = `<path d="M-14,0 V-14 H14 V0 Z M-10,-14 V-24 H10 V-14" ${L2} stroke-width="1.3"/><path d="M-6,-24 L-5,-58 Q0,-62 5,-58 L6,-24 Z" ${L3} stroke-width="1.3"/><circle cx="0" cy="-64" r="4" ${L3} stroke-width="1.2"/><path d="M-4,-68 L-6,-74 M0,-69 V-76 M4,-68 L6,-74" stroke-width="1.2"/><path d="M4,-56 L10,-80" stroke-width="2.6"/><path d="M8,-82 Q10,-90 12,-82 Z" ${SOLID}/><path d="M-5,-48 L-12,-44 L-10,-40" stroke-width="2"/>`;
/** Golden Gate Bridge über Breite w */
const goldengate = (x: number, y: number, w: number) => {
	const t1 = x + w * 0.22,
		t2 = x + w * 0.78;
	return `<path d="M${x},${y} H${x + w}" stroke-width="2.6"/>${[t1, t2].map((t) => `<path d="M${f1(t - 3)},${y + 24} V${y - 56} M${f1(t + 3)},${y + 24} V${y - 56}" stroke-width="2.4"/><path d="M${f1(t - 3)},${y - 50} H${f1(t + 3)} M${f1(t - 3)},${y - 36} H${f1(t + 3)} M${f1(t - 3)},${y - 20} H${f1(t + 3)}" stroke-width="1.6"/>`).join('')}<path d="M${x},${y - 6} Q${f1((x + t1) / 2)},${y - 14} ${f1(t1)},${y - 56} Q${f1((t1 + t2) / 2)},${y - 2} ${f1(t2)},${y - 56} Q${f1((t2 + x + w) / 2)},${y - 14} ${x + w},${y - 6}" stroke-width="1.6"/>${Array.from({ length: 18 }, (_, i) => {
		const t = (i + 1) / 19,
			xx = t1 + (t2 - t1) * t,
			yy = y - 56 + 54 * 4 * t * (1 - t);
		return `<path d="M${f1(xx)},${f1(yy)} V${y}" stroke-width=".6"/>`;
	}).join('')}`;
};
/** Kanu (Kanada) */
const CANOE = `<path d="M-24,-2 Q0,6 24,-2 L28,-8 Q0,0 -28,-8 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(4,-4)"')}<path d="M8,-14 L18,4" stroke-width="1.4"/>`;
/** Elch, Blick nach rechts */
const MOOSE2 = `<g transform="scale(-1,1)">${MOOSE}</g>`;
/** Ahornblatt */
const MAPLE = `<path d="M0,0 V-4 M0,-4 L-4,-6 L-10,-4 L-8,-8 L-14,-14 L-8,-14 L-10,-20 L-4,-16 L0,-24 L4,-16 L10,-20 L8,-14 L14,-14 L8,-8 L10,-4 L4,-6 Z" ${SOLID}/>`;
/** Pyramide von Chichén Itzá */
const CHICHEN = `${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-50 + i * 7},${-i * 9} H${50 - i * 7} V${-i * 9 - 9} H${-50 + i * 7} Z" ${L2} stroke-width="1.2"/>`).join('')}<path d="M-8,0 V-54 H8 V0" ${L3} stroke-width="1.2"/>${Array.from({ length: 9 }, (_, i) => `<path d="M-8,${-4 - i * 6} H8" stroke-width=".9"/>`).join('')}<path d="M-12,-54 V-68 H12 V-54" ${SNOW} stroke-width="1.3"/><path d="M-4,-54 V-62 H4 V-54" ${SOLID}/>`;
/** Totenkopf (Calavera) */
const CALAVERA = `<path d="M-16,-10 Q-18,-36 0,-38 Q18,-36 16,-10 Q14,0 8,2 V6 H-8 V2 Q-14,0 -16,-10 Z" ${SNOW} stroke-width="1.6"/><circle cx="-7" cy="-18" r="5" ${SOLID}/><circle cx="7" cy="-18" r="5" ${SOLID}/><path d="M0,-12 l-2,4 h4 Z" ${SOLID}/><path d="M-6,0 V6 M-2,0 V6 M2,0 V6 M6,0 V6" stroke-width="1"/>${[-7, 7].map((x) => `<circle cx="${x}" cy="-18" r="2" ${L3}/>`).join('')}<path d="M-10,-30 q4,-4 8,0 q4,-4 8,0 q4,-4 4,0" stroke-width="1.2"/>`;
/** Studentenblume (Cempasúchil) */
const MARIGOLD = (x: number, y: number, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" ${SOLID}/><circle cx="${x}" cy="${y}" r="${f1(r * 0.6)}" ${L3} stroke="var(--paper)" stroke-width=".8"/>`;
/** Papel picado (Wimpelkette) */
const picado = (y: number, n: number, w = 180) => `<path d="M0,${y} Q${w / 2},${y + 8} ${w},${y}" stroke-width="1"/>${Array.from({ length: n }, (_, i) => {
	const x = (i + 0.5) * (w / n),
		yy = y + 8 * 4 * ((i + 0.5) / n) * (1 - (i + 0.5) / n) * 0.5;
	return `<path d="M${f1(x - 8)},${f1(yy)} H${f1(x + 8)} V${f1(yy + 14)} L${f1(x + 4)},${f1(yy + 11)} L${f1(x)},${f1(yy + 14)} L${f1(x - 4)},${f1(yy + 11)} L${f1(x - 8)},${f1(yy + 14)} Z" ${[SOLID, L3, SNOW, L2][i % 4]} stroke-width=".8"/><circle cx="${f1(x)}" cy="${f1(yy + 6)}" r="1.6" ${PAPER}/>`;
}).join('')}`;
/** Hängebrücke im Nebelwald */
const hangbridge = (x1: number, y1: number, x2: number, y2: number) => canopy(x1, y1, x2, y2);
/** Rotaugenlaubfrosch */
const TREEFROG = `<path d="M-30,0 Q0,6 30,0" stroke-width="3"/><path d="M-12,-4 Q-16,-18 -2,-22 Q14,-24 16,-10 Q16,-2 8,-2 Z" ${L3} stroke-width="1.4"/><circle cx="-8" cy="-22" r="4" ${SNOW} stroke-width="1.2"/><circle cx="4" cy="-24" r="4" ${SNOW} stroke-width="1.2"/><circle cx="-8" cy="-22" r="2" ${SOLID}/><circle cx="4" cy="-24" r="2" ${SOLID}/><path d="M-12,-6 l-6,6 M14,-6 l6,6 M-4,-2 l-2,4 M8,-2 l2,4" stroke-width="2.4"/><path d="M-4,-14 q6,2 12,-2" stroke="var(--paper)" stroke-width="1"/>`;
/** Mogote (Viñales) */
const mogote = (x: number, y: number, h: number, w: number) => `<path d="M${x - w},${y} Q${x - w - 2},${y - h} ${x - w / 2},${y - h - 4} Q${x},${y - h - 8} ${x + w / 2},${y - h - 4} Q${x + w + 2},${y - h} ${x + w},${y} Z" ${L3} stroke-width="1.4"/><path d="M${x - w + 2},${y - h + 6} Q${x},${y - h - 2} ${x + w - 2},${y - h + 6}" stroke-width="1" stroke-dasharray="2 2"/>`;
/** Tabakbauer mit Ochsen */
const OXCART = `${COW}<path d="M-10,-14 H6" stroke-width="2"/>${PERSON.replace('<circle cx="0"', '<circle cx="-14"').replace(/M0,/g, 'M-14,')}`;
/** Arco de Santa Catalina (Antigua) */
const CATALINA = `<path d="M-50,0 V-40 H50 V0 H16 V-20 Q0,-36 -16,-20 V0 Z" ${L2} stroke-width="1.6"/><path d="M-12,-40 V-56 H12 V-40" ${L2} stroke-width="1.3"/><circle cx="0" cy="-48" r="4" ${SNOW} stroke-width="1"/><path d="M-14,-56 L0,-64 L14,-56 Z" ${SOLID}/>${[-40, -28, 28, 40].map((x) => `<rect x="${x - 3}" y="-32" width="6" height="8" ${SOLID}/>`).join('')}`;
/** gedrehter Wolkenkratzer (Panama) */
const TWIST = `<path d="M-8,0 L-10,-30 L-6,-60 L-9,-90 H9 L6,-60 L10,-30 L8,0 Z" ${L2} stroke-width="1.2"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${-9 + (i % 2) * 2},${-10 - i * 9} H${9 - (i % 2) * 2}" stroke-width=".8"/>`).join('')}`;
/** Jaguar, Blick nach rechts */
const JAGUAR = `<path d="M0,-12 Q2,-20 14,-20 H30 Q36,-20 38,-14 L36,-8 H34 V0 H31 V-8 H12 V0 H9 V-8 H6 Q0,-8 0,-12 Z" ${L3} stroke-width="1.3"/><path d="M36,-18 Q40,-24 46,-20 Q48,-16 46,-12 Q42,-10 38,-12" ${L3} stroke-width="1.3"/><path d="M40,-22 l1,-3 l2,2" stroke-width="1"/>${dots([[10, -16, 1.6], [16, -14, 1.6], [22, -17, 1.6], [28, -14, 1.6], [13, -11, 1.4], [25, -11, 1.4], [32, -16, 1.4]], SOLID)}<path d="M0,-12 Q-8,-14 -10,-4" stroke-width="1.6"/><circle cx="43" cy="-17" r=".9" ${SOLID}/>`;
/* Bausteine Karibik */
/** Meer für das Querformat ab Höhe y */
const seaW = (y: number, f = L2) => `<path d="M0,${y} H270 V132 H0 Z" ${f} stroke="none"/><path d="M0,${y} H270" stroke-width="1.6"/><path d="${waves(4, y + 10, 17, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`;
/** Strand im Hochformat ab Höhe y mit Palmen links/rechts */
const beach = (y: number) => `<path d="M0,${y} Q90,${y - 8} 180,${y + 2} V170 H0 Z" ${SNOW} stroke-width="1.6"/>${palm(20, y + 10, 50, 8)}${palm(160, y + 12, 44, -8)}`;
/** Segelboote einer Regatta */
const regatta = (pts: number[][]) => pts.map(([x, y, s]) => at(x, y, s, `<path d="M-14,0 H14 L10,4 H-10 Z" ${SOLID}/><path d="M0,0 V-34" stroke-width="1.4"/><path d="M1.5,-32 L16,-4 H1.5 Z" ${SNOW} stroke-width="1.1"/><path d="M-1.5,-30 L-12,-4 H-1.5 Z" ${L3} stroke-width="1"/>`)).join('');
/** georgianisches Werftgebäude */
const GEORGIAN = `<path d="M-40,0 V-30 H40 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-44,-30 L-40,-38 H40 L44,-30 Z" ${SOLID}/>${[-32, -20, -8, 4, 16, 28].map((x) => `<path d="M${x},0 V-12 Q${x + 3},-16 ${x + 6},-12 V0 Z" ${L3} stroke="none"/><rect x="${x + 1}" y="-26" width="4" height="7" ${SOLID}/>`).join('')}`;
/** Strandbar */
const BEACHBAR = `<path d="M-16,0 V-12 H16 V0" ${L2} stroke-width="1.2"/><path d="M-22,-12 L0,-26 L22,-12 Z" ${L3} stroke-width="1.2"/><path d="M-20,-12 l3,4 l3,-4 l3,4 l3,-4 l3,4 l3,-4 l3,4 l3,-4 l3,4 l3,-4 l3,4 l3,-4" stroke-width="1"/>`;
/** Divi-Divi-Baum (windgebeugt) */
const DIVI = `<path d="M-6,0 Q-6,-10 0,-16 Q10,-22 24,-22" stroke-width="3.4"/><path d="M0,-18 Q14,-34 36,-28 Q44,-26 48,-20 Q36,-20 24,-18 Q12,-16 0,-18 Z" ${SOLID}/>`;
/** schwimmende Schweine */
const PIG = `<path d="M-12,-2 Q-14,-12 -2,-12 H8 Q14,-12 14,-6 L18,-6 L18,-2 Z" ${L3} stroke-width="1.3"/><path d="M8,-12 l2,-4 l2,3" stroke-width="1.2"/><circle cx="10" cy="-8" r=".8" ${SOLID}/>`;
/** Pontonbrücke (Königin-Emma-Brücke) */
const pontoon = (x: number, y: number, w: number) => `<path d="M${x},${y} H${x + w}" stroke-width="3"/>${Array.from({ length: Math.floor(w / 10) }, (_, i) => `<ellipse cx="${x + 5 + i * 10}" cy="${y + 3}" rx="4" ry="2" ${SOLID}/>`).join('')}${Array.from({ length: Math.floor(w / 14) }, (_, i) => `<path d="M${x + 7 + i * 14},${y} q4,-6 8,0" stroke-width="1"/>`).join('')}`;
/** Sisserou-Papagei */
const PARROT = `<path d="M-8,0 Q-12,-16 -2,-24 Q8,-26 10,-16 Q12,-6 6,0 Z" ${L3} stroke-width="1.3"/><path d="M-6,-14 Q-10,-4 -4,2 Q2,-6 0,-16 Z" ${SOLID}/><circle cx="2" cy="-26" r="6" ${L3} stroke-width="1.2"/><circle cx="4" cy="-27" r="1.2" ${SOLID}/><path d="M7,-28 Q14,-26 10,-20 Q8,-22 7,-24 Z" ${SOLID}/><path d="M-4,0 L-8,14 H0 L2,0" ${SOLID}/>`;
/** Alcázar de Colón (Arkadenpalast) */
const ALCAZAR = `<path d="M-50,0 V-34 H50 V0 Z" ${L2} stroke-width="1.4"/>${[0, 1].map((r) => Array.from({ length: 7 }, (_, i) => `<path d="M${-44 + i * 13},${-2 - r * 16} V${-10 - r * 16} Q${-40 + i * 13},${-15 - r * 16} ${-36 + i * 13},${-10 - r * 16} V${-2 - r * 16} Z" ${PAPER}/>`).join('')).join('')}<path d="M-52,-34 H52" stroke-width="2"/>`;
/** Unterwasser-Skulpturen im Kreis */
const SCULPTURES = Array.from({ length: 7 }, (_, i) => {
	const a = (i / 7) * Math.PI * 2,
		x = f1(40 * Math.cos(a)),
		y = f1(10 * Math.sin(a));
	return `<g transform="translate(${x},${y})"><circle cx="0" cy="-16" r="3" ${L3} stroke-width="1"/><path d="M-3,-13 H3 L4,0 H-4 Z" ${L3} stroke-width="1"/></g>`;
}).join('');
/** Maya-Stele (Copán) */
const STELA = `<path d="M-10,0 V-56 Q0,-62 10,-56 V0 Z" ${L3} stroke-width="1.4"/><circle cx="0" cy="-46" r="5" ${SNOW} stroke-width="1"/><path d="M-3,-47 h2 M1,-47 h2 M-2,-43 h4" stroke-width="1"/><path d="M-8,-36 H8 M-8,-26 H8 M-8,-16 H8 M-8,-6 H8" stroke-width="1" stroke-dasharray="2 2"/><path d="M-14,0 H14" stroke-width="2"/>`;
/** Tap-Tap-Bus (bunt bemalt) */
const TAPTAP = `<path d="M-30,-6 V-24 Q-30,-28 -26,-28 H20 L28,-18 V-6 Z" ${SOLID}/><path d="M-28,-32 H22 V-28" stroke-width="1.6"/><path d="M-26,-22 H18" stroke="var(--stp)" stroke-width="3" stroke-dasharray="4 2"/><path d="M-26,-14 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4" stroke="var(--paper)" stroke-width="1"/><circle cx="-18" cy="-4" r="4" ${L4} stroke-width="1"/><circle cx="16" cy="-4" r="4" ${L4} stroke-width="1"/><path d="M-26,-36 h6 v4 h-6 Z M-14,-36 h8 v4 h-8 Z M0,-36 h8 v4 h-8 Z" ${L3} stroke-width=".8"/>`;
/** Felsklippe mit Springer (Negril) */
const CLIFFDIVE = `<path d="M-40,0 V-40 Q-30,-46 -10,-44 L0,-40 V0 Z" ${L3} stroke-width="1.6"/><path d="M-36,-36 L-20,-38 M-30,-20 H-8" stroke-width="1"/>`;
/** grüne Meerkatze */
const MONKEY = `<path d="M-6,0 Q-8,-10 -2,-16 Q6,-18 8,-10 Q10,-4 6,0 Z" ${L3} stroke-width="1.2"/><circle cx="0" cy="-20" r="5" ${L3} stroke-width="1.1"/><circle cx="-1.6" cy="-21" r=".8" ${SOLID}/><circle cx="1.6" cy="-21" r=".8" ${SOLID}/><path d="M6,-2 Q18,0 20,-12 Q22,-20 16,-22" stroke-width="1.8"/>`;
/** Blauer Leguan */
const BLUEIGUANA = `<path d="M-24,0 Q-16,-8 0,-10 H10 Q18,-12 22,-6 L28,-4 Q26,0 22,0 Z" ${L3} stroke-width="1.3"/><path d="M-4,-10 l2,-4 l2,4 l2,-4 l2,4 l2,-4 l2,4 l2,-4 l2,4" stroke-width="1"/><path d="M-24,0 Q-34,4 -40,10" stroke-width="2"/><path d="M-8,0 l-4,6 M10,0 l4,6" stroke-width="1.8"/><circle cx="22" cy="-6" r=".9" ${SOLID}/>`;
/** Lavasee bei Nacht (Masaya) */
const LAVALAKE = `<path d="M-60,0 Q-50,-30 -20,-34 H20 Q50,-30 60,0 Z" ${SOLID}/><ellipse cx="0" cy="-10" rx="30" ry="7" fill="#F7A35C" fill-opacity=".9" stroke="none"/><ellipse cx="0" cy="-10" rx="18" ry="4" fill="#F7E3A1" stroke="none"/><path d="M-10,-18 q-4,-10 2,-16 q6,-6 2,-14 M10,-20 q4,-10 -2,-16" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="1.4"/>`;
/** gelbe Kathedrale (Granada) */
const GRANADA = `<path d="M-24,0 V-30 H24 V0 Z" ${L2} stroke-width="1.3"/><path d="M-28,-30 L0,-44 L28,-30 Z" ${L3} stroke-width="1.2"/><circle cx="0" cy="-22" r="5" ${SNOW} stroke-width="1"/>${[-30, 30].map((x) => `<path d="M${x - 6},0 V-50 H${x + 6} V0" ${L2} stroke-width="1.2"/><path d="M${x - 7},-50 Q${x},-60 ${x + 7},-50 Z" ${SOLID}/>`).join('')}<path d="M-6,0 V-12 Q0,-16 6,-12 V0 Z" ${SOLID}/><path d="M0,-44 V-58 Q-6,-60 0,-66 Q6,-60 0,-58" ${SOLID}/>`;
/** Kajak mit Paddler */
const KAYAK = `<path d="M-20,0 Q0,4 20,0 Q0,-4 -20,0 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-1)"')}<path d="M-12,-14 L12,-6" stroke-width="1.4"/>`;
/** die zwei Pitons */
const PITONS = (y: number, x = 90, k = 1) => `<path d="M${x - 70 * k},${y} Q${x - 50 * k},${y - 10 * k} ${x - 40 * k},${y - 60 * k} Q${x - 34 * k},${y - 84 * k} ${x - 26 * k},${y - 62 * k} Q${x - 18 * k},${y - 20 * k} ${x},${y - 18 * k} Q${x + 14 * k},${y - 40 * k} ${x + 22 * k},${y - 64 * k} Q${x + 28 * k},${y - 76 * k} ${x + 34 * k},${y - 62 * k} Q${x + 44 * k},${y - 20 * k} ${x + 70 * k},${y} Z" ${L3} stroke-width="1.8"/>`;
/** Steelband-Trommel mit Spieler */
const PANMAN = `<ellipse cx="0" cy="-16" rx="12" ry="4" ${SNOW} stroke-width="1.2"/><path d="M-12,-16 V-4 M12,-16 V-4 M-12,-4 Q0,0 12,-4" stroke-width="1.6"/><circle cx="0" cy="-34" r="3" ${SOLID}/><path d="M0,-31 V-20 M0,-28 L-8,-20 M0,-28 L8,-20" stroke-width="2"/>`;
/** Turk’s-Head-Kaktus */
const TURKCACTUS = `<path d="M-10,0 Q-12,-14 0,-16 Q12,-14 10,0 Z" ${L3} stroke-width="1.3"/><path d="M-6,0 Q-8,-10 -4,-15 M0,0 V-16 M6,0 Q8,-10 4,-15" stroke-width=".9"/><path d="M-6,-16 Q0,-26 6,-16 Z" ${SOLID}/>`;
/** Lederschildkröte */
const LEATHERBACK = `<path d="M-24,0 Q-24,-18 0,-20 Q24,-18 26,0 Q0,8 -24,0 Z" ${SOLID}/><path d="M-14,-12 Q0,-16 14,-12 M-20,-4 Q0,-10 22,-4" stroke="var(--paper)" stroke-width="1"/><path d="M26,-6 Q34,-8 36,-2 Q34,2 28,0" ${SOLID}/><path d="M-10,0 Q-20,10 -32,8 M10,0 Q20,10 30,10" stroke-width="4"/>`;
/* Bausteine Ozeanien */
/** Opernhaus Sydney */
const OPERA = `<path d="M-60,0 V-8 H60 V0 Z" ${L3} stroke-width="1.2"/>${[[-44, 26, 18], [-26, 34, 20], [-4, 42, 22], [18, 34, 20], [38, 24, 16]].map(([x, h, w]) => `<path d="M${x - w / 2},-8 Q${x - w / 2 + 2},${-8 - h} ${x + w / 2},${-8 - h} Q${x + w / 2 - 2},-20 ${x + w / 2},-8 Z" ${SNOW} stroke-width="1.3"/><path d="M${x - w / 4},-10 Q${x},${-8 - h * 0.7} ${x + w / 2 - 2},${-8 - h * 0.9}" stroke-width=".8"/>`).join('')}`;
/** Uluru */
const ULURU = (y: number, x = 135, k = 1) => `<path d="M${x - 90 * k},${y} Q${x - 86 * k},${y - 34 * k} ${x - 60 * k},${y - 40 * k} H${x + 60 * k} Q${x + 86 * k},${y - 34 * k} ${x + 90 * k},${y} Z" ${L3} stroke-width="1.8"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${f1(x - 70 * k + i * 17 * k)},${f1(y - 38 * k)} Q${f1(x - 74 * k + i * 17 * k)},${f1(y - 18 * k)} ${f1(x - 70 * k + i * 17 * k)},${y}" stroke-width="1"/>`).join('')}`;
/** Känguru, Blick nach rechts */
const KANGAROO = `<path d="M-14,0 Q-24,-2 -30,4 M-6,-6 Q-12,-20 -4,-30 Q4,-34 8,-26 L12,-34 Q14,-38 18,-36 L20,-32 Q18,-30 16,-28 L14,-22 Q14,-12 8,-6 Z" ${SOLID}/><path d="M-6,-6 Q-20,-4 -32,6" stroke-width="3"/><path d="M4,-6 L10,0 H16" stroke-width="2.4"/><path d="M8,-20 L14,-16" stroke-width="1.6"/><path d="M14,-36 l-2,-6 M17,-36 l2,-6" stroke-width="1.6"/>`;
/** Korallen und Clownfisch */
const coral = (x: number, y: number, h: number) => `<path d="M${x},${y} V${y - h} M${x},${f1(y - h * 0.5)} Q${x - h * 0.4},${f1(y - h * 0.6)} ${f1(x - h * 0.4)},${f1(y - h * 0.9)} M${x},${f1(y - h * 0.4)} Q${x + h * 0.4},${f1(y - h * 0.5)} ${f1(x + h * 0.4)},${f1(y - h * 0.8)}" stroke-width="3" stroke-linecap="round"/>`;
const CLOWNFISH = `<path d="M-10,0 Q-6,-6 4,-6 Q10,-4 12,0 Q10,4 4,6 Q-6,6 -10,0 Z" ${L3} stroke-width="1.2"/><path d="M-10,0 L-16,-5 L-16,5 Z" ${L3} stroke-width="1"/><path d="M-2,-6 V6 M6,-5 V5" stroke="var(--stp)" stroke-width="2"/><circle cx="8" cy="-1" r=".9" ${SOLID}/>`;
/** Mitre Peak (Milford Sound) */
const MITRE = (y: number) => `<path d="M20,${y} L70,${y - 40} L84,${y - 96} L92,${y - 100} L104,${y - 50} L150,${y} Z" ${L3} stroke-width="1.8"/><path d="M84,${y - 96} L92,${y - 100} L94,${y - 86} L86,${y - 84} Z" ${SNOW} stroke-width="1"/><path d="M0,${y - 30} L30,${y - 60} L50,${y} M130,${y} L160,${y - 70} L180,${y - 50}" ${L2} stroke-width="1.4"/>`;
/** Kiwi */
const KIWI = `<path d="M-14,0 Q-18,-14 -4,-18 Q10,-20 14,-8 Q14,0 8,0 Z" ${SOLID}/><circle cx="12" cy="-12" r="4" ${SOLID}/><path d="M14,-10 Q24,-4 30,4" stroke-width="1.6"/><path d="M-4,0 V6 M4,0 V6" stroke-width="1.6"/><circle cx="13" cy="-13" r=".8" ${PAPER}/>`;
/** Auslegerkanu mit Ruderern */
const VAA = `<path d="M-40,0 Q0,6 40,-4 L44,-8 Q0,0 -40,-6 Z" ${SOLID}/><path d="M-20,-4 L-26,-16 M10,-4 L16,-16 M-26,-16 H24" stroke-width="1.4"/><path d="M-30,-20 H28" stroke-width="2.6"/>${[-28, -14, 0, 14, 28].map((x) => `<circle cx="${x}" cy="-14" r="2.4" ${SOLID}/><path d="M${x},-12 V-4 M${x},-10 L${x + 8},0" stroke-width="1.6"/>`).join('')}`;
/** Schwarze Perle in der Auster */
const PEARL = `<path d="M-24,0 Q-22,-14 0,-16 Q22,-14 24,0 Q0,8 -24,0 Z" ${L3} stroke-width="1.4"/><path d="M-24,-2 Q-22,-28 0,-34 Q22,-28 24,-2 Q0,-12 -24,-2 Z" ${L2} stroke-width="1.4"/><circle cx="0" cy="-6" r="7" ${SOLID}/><path d="M-3,-9 q2,-2 5,-1" stroke="var(--paper)" stroke-width="1.2"/>`;
/** Tiare-Blüte */
const TIARE = `${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-9" rx="4" ry="9" transform="rotate(${a})" ${SNOW} stroke-width="1"/>`).join('')}<circle r="3" ${L3} stroke-width=".8"/>`;
/** Bure (Strohhütte, Fidschi) */
const BURE = `<path d="M-16,0 V-12 H16 V0" ${L2} stroke-width="1.2"/><path d="M-22,-12 L0,-34 L22,-12 Z" ${L3} stroke-width="1.3"/><path d="M-18,-16 H18 M-12,-22 H12 M-6,-28 H6" stroke-width=".8"/><path d="M-4,0 V-8 H4 V0" ${SOLID}/>`;
/** offenes samoanisches Fale */
const FALE = `<path d="M-24,0 H24 V2 H-24 Z" ${SOLID}/>${[-20, -10, 0, 10, 20].map((x) => `<path d="M${x},0 V-12" stroke-width="1.6"/>`).join('')}<path d="M-28,-12 Q0,-36 28,-12 Z" ${L3} stroke-width="1.4"/><path d="M-20,-16 Q0,-30 20,-16" stroke-width=".9"/>`;
/** Feuermesser-Tänzer */
const FIREKNIFE = `<circle cx="0" cy="-34" r="3" fill="#F4F7FA" stroke="none"/><path d="M0,-31 V-16 L-6,0 M0,-16 L6,0 M0,-28 L-10,-36 M0,-28 L10,-22" stroke="#F4F7FA" stroke-width="2.4"/><path d="M-10,-36 L-20,-46 M10,-22 L20,-12" stroke="#F4F7FA" stroke-width="1.4"/><circle cx="-20" cy="-46" r="4" fill="#F7A35C" stroke="none"/><circle cx="20" cy="-12" r="4" fill="#F7A35C" stroke="none"/><path d="M-30,-30 A24,24 0 0 1 10,-56 M30,-28 A24,24 0 0 1 -6,2" stroke="#F7E3A1" stroke-opacity=".5" stroke-width="2"/>`;
/** Flughund */
const FLYINGFOX = `<path d="M0,0 Q-10,-8 -22,-4 Q-18,0 -20,4 Q-12,2 -6,6 Q-2,4 0,6 Q2,4 6,6 Q12,2 20,4 Q18,0 22,-4 Q10,-8 0,0 Z" ${SOLID}/><path d="M-2,-2 l-2,-4 M2,-2 l2,-4" stroke-width="1.2"/>`;
/** Riesenmuschel */
const CLAM = `<path d="M-20,0 Q-20,-14 0,-16 Q20,-14 20,0 Z" ${L3} stroke-width="1.4"/><path d="M-20,0 q4,-6 8,0 q4,-6 8,0 q4,-6 8,0 q4,-6 8,0 q4,-6 8,0" ${SOLID}/><path d="M-12,-4 Q0,-10 12,-4" stroke="var(--paper)" stroke-width="1"/>`;
/** Klippe der zwei Liebenden (Guam) */
const TWOLOVERS = `<path d="M-60,0 V-40 L-10,-50 L4,-46 Q8,-44 4,-40 L-20,-36 V0 Z" ${L3} stroke-width="1.6"/><path d="M-50,-30 V-6 M-36,-34 V-6" stroke-width="1" stroke-dasharray="5 3"/><path d="M-8,-50 V-56 H0 V-48" stroke-width="1.4"/>`;
/** Tjibaou-Kulturzentrum (Muschelhütten) */
const TJIBAOU = [[-30, 50], [0, 64], [30, 44]].map(([x, h]) => `<path d="M${x - 10},0 Q${x - 12},${-h * 0.6} ${x - 2},${-h} L${x + 2},${-h} Q${x + 10},${-h * 0.7} ${x + 10},0" ${L2} stroke-width="1.4"/>${Array.from({ length: Math.floor(h / 8) }, (_, i) => `<path d="M${x - 8},${-6 - i * 8} Q${x},${-8 - i * 8} ${x + 9},${-6 - i * 8}" stroke-width=".8"/>`).join('')}`).join('');
/** Araukarie (Säulenkiefer) */
const araucaria = (x: number, y: number, h: number) => `<path d="M${x},${y} V${y - h}" stroke-width="1.6"/>${Array.from({ length: Math.floor(h / 6) }, (_, i) => `<path d="M${x - 4},${y - h + 4 + i * 6} H${x + 4}" stroke-width="2.4"/>`).join('')}`;
/** Bounty (Dreimaster) */
const BOUNTY = `<path d="M-44,-6 H40 L34,8 H-38 Z" ${SOLID}/><path d="M40,-6 L54,-12" stroke-width="1.6"/>${[-26, -2, 22].map((x, i) => `<path d="M${x},-6 V${i === 1 ? -70 : -60}" stroke-width="1.6"/><path d="M${x - 10},${i === 1 ? -64 : -54} H${x + 10} L${x + 11},${i === 1 ? -50 : -42} H${x - 11} Z M${x - 11},${i === 1 ? -46 : -38} H${x + 11} L${x + 12},${i === 1 ? -30 : -24} H${x - 12} Z M${x - 12},${i === 1 ? -26 : -20} H${x + 12} V-10 H${x - 12} Z" ${SNOW} stroke-width="1"/>`).join('')}<path d="M-44,-6 L-48,-18 H-38" stroke-width="1.4"/>`;
/** Nan Madol (Basaltsäulen-Mauer) */
const NANMADOL = `<path d="M-50,0 V-24 H50 V0" ${L3} stroke-width="1.4"/>${Array.from({ length: 6 }, (_, r) => `<path d="M-50,${-4 - r * 4} H50" stroke-width="2" stroke-dasharray="${8 + (r % 2) * 4} 2"/>`).join('')}<path d="M-14,0 V-12 H14 V0" ${PAPER}/>`;
/** Versammlungshaus (Maneaba) */
const MANEABA = `<path d="M-40,0 H40" stroke-width="2"/>${[-34, -20, -6, 6, 20, 34].map((x) => `<path d="M${x},0 V-10" stroke-width="1.4"/>`).join('')}<path d="M-46,-10 Q-20,-44 0,-46 Q20,-44 46,-10 Z" ${L3} stroke-width="1.4"/><path d="M-30,-18 Q0,-38 30,-18" stroke-width=".9"/>`;
/** Hai */
const SHARK = `<path d="M-30,0 Q-10,-8 14,-6 Q24,-4 30,0 Q24,4 14,6 Q-10,8 -30,0 Z" ${SOLID}/><path d="M-4,-6 L2,-18 L8,-6 Z M-30,0 L-40,-8 L-36,0 L-40,8 Z" ${SOLID}/><path d="M18,-2 v4 M14,-2 v4" stroke="var(--paper)" stroke-width=".8"/>`;
/** Blasloch (Fontäne) */
const blowhole = (x: number, y: number, h: number) => `<path d="M${x - 8},${y} Q${x - 10},${y - h * 0.6} ${x - 4},${y - h} Q${x},${y - h - 6} ${x + 4},${y - h} Q${x + 10},${y - h * 0.6} ${x + 8},${y}" ${SNOW} stroke-width="1.2"/><path d="M${x - 4},${y - h + 6} q-6,-4 -10,0 M${x + 4},${y - h + 6} q6,-4 10,0" stroke-width="1"/>`;
/** Unterwasser-Briefkasten */
const POSTBOX = `<path d="M-2,0 V-20 M2,0 V-20" stroke-width="2"/><rect x="-10" y="-34" width="20" height="14" rx="3" ${L3} stroke-width="1.3"/><path d="M-6,-28 h12" stroke-width="1.6"/>`;
/** [Rare, Epic (nur Ersatz, falls kein WIDE), Legendary] */
export const TIERED: Record<string, [() => string, (() => string) | null, () => string]> = {
	// Ägypten: Pyramiden von Gizeh – Karawane – Nil mit Feluken
	EG: [
		() => `${sun(140, 36, 12)}${birds(84, 30)}<path d="M0,128 Q60,120 120,126 Q150,122 180,126 V170 H0 Z" ${L1} stroke-width="2"/>${pyr(72, 128, 64)}${pyr(140, 128, 36)}`,
		() => `${sun(142, 32, 12)}${birds(76, 28)}${birds(110, 44, 0.7)}<path d="M0,118 Q40,104 80,114 Q130,104 180,116 V130 H0 Z" ${L1} stroke-width="1.6"/>
${pyr(64, 126, 66, true)}${pyr(128, 126, 44, true)}${pyr(164, 126, 24)}<path d="M0,126 Q60,120 120,126 Q150,122 180,126 V170 H0 Z" ${L1} stroke-width="2"/>
${at(30, 154, 0.85, CAMEL)}${at(64, 152, 0.75, CAMEL)}${at(94, 150, 0.65, CAMEL)}<path d="M57,138 Q60,142 64,140 M89,139 Q92,142 94,141" stroke-width="1"/>${palm(160, 160, 40, -6)}${grass(126, 156)}${grass(8, 162)}`,
		() => `${sun(136, 32, 12)}${rays(136, 32, 12)}${birds(66, 24)}${birds(96, 44, 0.7)}<path d="M0,104 Q40,92 80,100 Q130,90 180,102 V114 H0 Z" ${L1} stroke-width="1.6"/>
${pyr(60, 112, 60, true)}${pyr(116, 112, 42, true)}${pyr(154, 112, 24, true)}<path d="M0,112 Q90,104 180,112 V130 H0 Z" ${L1} stroke-width="2"/>
${at(84, 128, 0.62, CAMEL_RIDER)}${at(112, 127, 0.55, CAMEL)}${sea(130)}${at(64, 154, 1, FELUCCA)}${at(142, 150, 0.66, FELUCCA)}
${palm(12, 130, 50, 6)}${palm(26, 130, 36, -4)}${palm(170, 130, 42, -6)}${PAPYRUS(164, 150)}${PAPYRUS(174, 144)}${PAPYRUS(8, 152)}`
	],
	// Japan: Fuji – Pagode, See und Kirschblüte – Torii im See, Kraniche, fallende Blüten
	JP: [
		() => `<circle cx="140" cy="36" r="15" ${SOLID}/>${fuji()}<path d="M0,132 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,132 H180" stroke-width="2"/><path d="${waves(4, 148, 12, 15, 3)}" stroke-width="1.6"/>`,
		() => `<circle cx="90" cy="32" r="13" ${SOLID}/><path d="M56,54 H92 M104,48 H130" stroke-width="1.4" stroke-dasharray="6 4"/>${fuji(true)}${sakura()}
<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M20,126 L62,148 Q90,158 118,148 L160,126" stroke-width="1.2" stroke-dasharray="3 4"/><path d="${waves(70, 160, 7, 15, 2.4)}" stroke-width="1.4"/>
<path d="M0,124 Q30,112 60,120 L66,128 Q30,132 0,130 Z" ${L3} stroke-width="1.8"/>${at(30, 120, 1, pagoda())}${pine(56, 122, 20)}`,
		() => `<circle cx="90" cy="32" r="13" ${SOLID}/><circle cx="90" cy="32" r="20" ${DOTS}/><path d="M48,62 Q70,56 96,62 T140,60 M66,68 Q90,64 112,68" stroke-width="1.4"/>${birds(108, 22, 0.8)}${fuji(true)}${sakura(true)}
<path d="M0,116 Q40,104 80,112 Q130,102 180,112 V124 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,124 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M20,124 L62,148 Q90,158 118,148 L160,124" stroke="var(--stp)" stroke-width="1.4" stroke-dasharray="3 4"/>
${at(128, 150, 1.1, TORII)}<g opacity=".35" transform="translate(128,150) scale(1.1,-1.1)">${TORII}</g><path d="${waves(84, 154, 6, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>
<path d="M0,122 Q30,110 60,118 L68,128 Q30,134 0,132 Z" ${L3} stroke-width="1.8"/>${at(28, 118, 1, pagoda())}${pine(54, 120, 22)}${pine(64, 124, 14, L4)}`
	],
	// Kenia: Giraffe und Akazie im Abendrot – Kilimandscharo und Elefanten – Ballon, Maasai, Flamingos
	KE: [
		() => `<path d="M76,118 A22,22 0 0 1 120,118 Z" ${SOLID}/><path d="M68,118 A30,30 0 0 1 128,118" ${DOTS}/>${birds(120, 34)}<path d="M0,118 Q90,112 180,118 V170 H0 Z" ${L2} stroke-width="2"/>
${at(40, 120, 1.5, ACACIA)}${at(144, 122, 1.1, GIRAFFE)}${grass(20, 150)}${grass(90, 156)}${grass(160, 148)}`,
		() => `${sun(150, 32, 11)}${birds(80, 30)}${kili()}<path d="M0,126 Q90,118 180,126 V170 H0 Z" ${L2} stroke-width="2"/>
${at(40, 124, 1.4, ACACIA)}${at(142, 128, 1, GIRAFFE)}${at(78, 146, 0.75, ELEPHANT)}${at(104, 148, 0.55, ELEPHANT)}${grass(14, 156)}${grass(126, 160)}${grass(168, 150)}${grass(60, 162)}`,
		() => `${sun(96, 34, 12)}${rays(96, 34, 12)}${at(150, 66, 0.72, BALLOON)}${birds(118, 22, 0.8)}${kili(108)}<path d="M0,122 Q90,114 180,122 V170 H0 Z" ${L2} stroke-width="2"/>
${at(36, 120, 1.45, ACACIA)}${at(128, 124, 1.02, GIRAFFE)}${at(152, 126, 0.78, GIRAFFE)}${at(70, 138, 0.7, ELEPHANT)}${at(94, 140, 0.5, ELEPHANT)}
<path d="M4,158 Q36,146 74,156 Q40,166 4,158 Z" ${L3} stroke-width="1.4"/>${at(22, 157, 0.75, FLAMINGO)}${at(36, 155, 0.7, FLAMINGO)}${at(52, 158, 0.75, FLAMINGO)}
${at(146, 166, 1.05, MAASAI)}${at(162, 167, 1, MAASAI)}${grass(110, 160)}${grass(86, 166)}${grass(176, 150)}${grass(10, 140)}`
	],
	// Island: Kirkjufell unter Polarlicht – mit Wasserfall und Kirche – Nachthimmel, Polarlicht-Vorhang, Papageitaucher
	IS: [
		() => `${dots([[70, 14], [100, 26], [150, 16], [166, 44], [124, 8], [60, 34]])}<path d="M40,56 Q76,28 112,46 Q144,62 184,36" stroke-width="2.4" stroke-dasharray="3 4"/><path d="M36,72 Q76,44 112,62 Q144,78 184,52" stroke-width="2" stroke-dasharray="3 5"/>
<path d="${KIRKJU}" ${L3} stroke-width="2.2"/><path d="M96,56 Q92,80 80,104 M110,70 Q110,92 118,110" stroke-width="1.2"/>${sea(124)}`,
		() => `${dots([[70, 14], [100, 24], [150, 12], [168, 26], [124, 8], [60, 34], [84, 6]])}<path d="M152,18 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${SOLID}/>${aurora(L1)}<path d="M36,74 Q76,46 112,64 Q144,80 184,54" stroke-width="1.8" stroke-dasharray="3 5"/>
<path d="${KIRKJU}" ${L3} stroke-width="2.2"/><path d="M96,56 L92,64 L98,62 L102,70 L106,62 Z" ${SNOW} stroke-width="1.2"/><path d="M96,56 Q92,80 80,104 M110,70 Q110,92 118,110 M86,72 Q80,90 70,104" stroke-width="1.2"/>
<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,124 H180" stroke-width="2"/>${at(150, 128, 0.8, `<path d="M-10,0 V-12 H10 V0 Z" ${SOLID}/><path d="M-12,-11 L0,-20 L12,-11 Z" ${SOLID}/><path d="M-6,-14 V-28 M-9,-18 L-6,-28 L-3,-18" ${SOLID} stroke="currentColor" stroke-width="1.6"/><rect x="-2" y="-8" width="4" height="8" ${PAPER}/>`)}
<path d="M0,136 H76 Q84,136 84,142 V170 H0 Z" ${L3} stroke-width="2"/><path d="M28,136 V160 M38,136 V162 M48,136 V158 M58,136 V161" stroke="var(--stp)" stroke-width="2.2"/><path d="${waves(20, 164, 4, 12, 2.4)}" stroke="var(--stp)" stroke-width="1.6"/>`,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[64, 12], [100, 22], [150, 10], [170, 30], [124, 6], [56, 36, 1], [84, 4, 1], [140, 34, 1], [176, 12, 1]], STAR)}<path d="M152,18 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${STAR} stroke="none"/>
<path d="M30,62 Q70,24 110,44 Q146,62 184,30 V60 Q146,90 110,72 Q70,52 30,88 Z" ${STAR} fill-opacity=".22" stroke="none"/><path d="${Array.from({ length: 22 }, (_, i) => {
			const x = 34 + i * 7,
				y = f1(52 - 18 * Math.sin((i / 21) * Math.PI * 1.6) + 6 * Math.sin(i));
			return `M${x},${y} v${16 + (i % 4) * 5}`;
		}).join(' ')}" stroke="#F4F7FA" stroke-opacity=".55" stroke-width="2"/>
<path d="${KIRKJU}" ${SOLID}/><path d="M96,56 L92,64 L98,62 L102,70 L106,62 Z M84,80 L80,90 L86,86 Z M116,82 L120,92 L114,90 Z" ${STAR} stroke="none"/><path d="M0,124 H180 V170 H0 Z" ${L3} stroke="none"/><path d="M40,124 L70,146 Q96,156 120,146 L150,124" stroke="var(--stp)" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="3 4"/>
<path d="M0,134 H76 Q84,134 84,140 V170 H0 Z" ${SOLID}/><path d="M24,134 V160 M32,134 V163 M40,134 V158 M48,134 V162 M56,134 V159 M64,134 V161" stroke="var(--stp)" stroke-width="2.2"/><path d="${waves(18, 165, 5, 11, 2.4)}" stroke="var(--stp)" stroke-width="1.6"/>
<path d="M124,170 Q130,150 150,148 Q172,146 180,152 V170 Z" ${L2} stroke="var(--stp)" stroke-width="1.4"/>${at(146, 150, 1, PUFFIN)}${at(166, 149, 0.85, PUFFIN, true)}`
	],
	// Peru: Machu Picchu – mit Anden, Ruinen und Lama – Inti-Sonne, Kondore, Wolken im Tal
	PE: [
		() => `${sun(160, 26, 10)}${birds(70, 30)}${picchu()}<path d="M0,132 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,132 H180" stroke-width="2"/>`,
		() => `${sun(160, 24, 10)}<path d="M0,96 L30,62 L50,76 L76,46 L100,72 L180,58 V132 H0 Z" ${L1} stroke-width="1.6"/><path d="M76,46 L70,56 L77,53 L82,58 Z M30,62 L25,70 L31,68 L35,70 Z" ${SNOW} stroke-width="1.2"/>${picchu(true)}
${cloud(40, 136)}<path d="M0,134 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,134 H180" stroke-width="2"/>${at(150, 164, 1.05, LLAMA)}${grass(20, 160)}${grass(104, 164)}`,
		() => `${sun(158, 28, 10)}${rays(158, 28, 10)}${at(72, 34, 0.9, CONDOR)}${at(104, 22, 0.55, CONDOR)}<path d="M0,92 L28,60 L48,74 L74,42 L98,70 L120,56 L180,62 V132 H0 Z" ${L1} stroke-width="1.6"/><path d="M74,42 L68,52 L75,49 L80,54 Z M28,60 L23,68 L29,66 L33,68 Z M120,56 L115,63 L121,61 L125,63 Z" ${SNOW} stroke-width="1.2"/>
${picchu(true)}<path d="M100,126 Q96,116 106,114 Q108,106 118,110 Q126,104 132,112 Q142,110 142,120 Z" ${SNOW} stroke-width="1.4"/>${cloud(28, 138)}<path d="M0,136 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,136 H180" stroke-width="2"/>
${at(140, 166, 1.05, LLAMA)}${at(166, 166, 0.8, LLAMA)}${at(40, 166, 0.7, PERSON)}${dots([[16, 158, 2], [24, 162, 2], [96, 160, 2], [108, 164, 2]], L3)}${grass(20, 166)}${grass(100, 166)}${grass(70, 162)}`
	],
	// Frankreich: Eiffelturm – Paris an der Seine – Feuerwerk am 14. Juli
	FR: [
		() => `${sun(148, 34, 11)}${cloud(22, 74)}${cloud(116, 92)}<path d="M0,140 Q90,132 180,140 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 140, 1, EIFFEL(108))}${bush(30, 146, 7)}${bush(150, 148, 8)}${grass(70, 160)}${grass(120, 162)}`,
		null,
		() => `${burst(140, 32, 3)}${burst(112, 60, 2)}${burst(160, 72, 2)}${dots([[124, 18], [96, 34], [172, 44]])}${at(66, 138, 1, EIFFEL(118, true))}
<path d="M0,138 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M96,138 H180" stroke-width="2.4"/><path d="M100,138 V148 Q114,134 128,148 Q142,134 156,148 Q168,136 180,146" stroke-width="1.8"/><path d="M0,138 H100" stroke-width="2"/>
${[112, 140, 168].map((x) => `<path d="M${x},138 V124 M${x - 3},124 H${x + 3}" stroke-width="1.4"/><circle cx="${x}" cy="121" r="2" ${SOLID}/>`).join('')}${bush(14, 138, 7)}${at(48, 160, 1, `<path d="M-20,0 H20 L16,5 H-16 Z" ${SOLID}/><path d="M-14,0 V-6 H12 V0" ${SNOW} stroke-width="1.3"/><path d="M-10,-3 H8" stroke-width="1" stroke-dasharray="2 2"/>`)}<path d="${waves(90, 160, 6, 14, 2.4)}" stroke-width="1.4"/>`
	],
	// Italien: Kolosseum – Rom mit Pinien – Toskana-Hügel, Zypressen, Vespa
	IT: [
		() => `${sun(148, 34, 11)}${birds(92, 34)}<path d="M0,132 Q90,126 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 132, 1.1, COLOS)}${cypress(12, 134, 42)}${cypress(168, 134, 34)}${grass(60, 154)}${grass(120, 156)}`,
		null,
		() => `${sun(150, 30, 11)}${rays(150, 30, 11)}${birds(78, 26)}<path d="M0,78 Q40,62 80,74 Q130,58 180,72 V96 H0 Z" ${L1} stroke-width="1.6"/>${[96, 108, 120, 132].map((x) => cypress(x, 76 - (x - 96) / 6, 16)).join('')}<path d="M110,66 h10 v-6 l5,-4 l5,4 v6" ${SNOW} stroke-width="1.2"/>
<path d="M0,96 Q90,88 180,96 V170 H0 Z" ${L2} stroke-width="1.8"/>${at(92, 128, 1, COLOS)}${at(18, 132, 0.9, STONEPINE)}${cypress(164, 134, 40)}${cypress(176, 134, 28)}
<path d="M0,148 Q90,140 180,148" stroke-width="1.4" stroke-dasharray="6 4"/>${at(118, 164, 1.1, VESPA)}${grass(30, 160)}${grass(70, 164)}${grass(160, 162)}`
	],
	// Griechenland: Kapelle mit blauer Kuppel – Santorini-Klippe mit Windmühle – Sonnenuntergang über der Caldera
	GR: [
		() => `${sun(148, 34, 11)}${birds(100, 40)}<path d="M0,100 H98 Q106,104 108,120 L114,140 H0 Z" ${L2} stroke-width="2"/>${cube(10, 100, 18, 14)}${cube(28, 100, 14, 20)}${at(66, 100, 1.4, CHAPEL)}${sea(140)}${at(148, 148, 0.9, SAIL)}`,
		null,
		() => `${sun(140, 82, 16)}${rays(140, 82, 16, 16)}${birds(118, 30)}${birds(150, 46, 0.7)}<path d="M100,98 Q130,92 180,96" stroke-width="1.4"/><path d="M128,98 Q146,90 164,98 Z" ${L3} stroke-width="1.2"/>
<path d="M0,64 H70 Q80,70 84,92 L92,140 H0 Z" ${L2} stroke-width="2"/>${at(60, 64, 1, windmill(20))}${cube(4, 80, 16, 14)}${cube(20, 82, 14, 18)}${at(46, 92, 1.1, CHAPEL)}${cube(4, 104, 20, 14)}${cube(24, 108, 16, 12)}${cube(62, 112, 14, 12)}
${at(24, 124, 0.9, `<path d="M-8,0 V-20 H8 V0 Z M-8,-20 Q0,-28 8,-20" ${SNOW} stroke-width="1.4"/><path d="M-4,-8 V-14 Q0,-18 4,-14 V-8 Z" ${SOLID}/><circle cx="0" cy="-11" r="1.6" ${SNOW}/>`)}${dots([[8, 118, 2.2], [14, 116, 2], [12, 121, 1.8], [40, 128, 2.2], [46, 126, 2], [80, 104, 2]], L4)}
${sea(140)}${at(132, 152, 0.9, SAIL)}`
	],
	// Spanien: Windmühlen der Mancha – mit Burg und Olivenhainen – Sonnenblumenfeld
	ES: [
		() => `${sun(148, 34, 11)}${birds(90, 40)}<path d="M0,140 Q60,106 120,118 Q150,124 180,122 V170 H0 Z" ${L2} stroke-width="2"/>${at(48, 120, 1.3, windmill(15))}${at(104, 118, 1.1, windmill(40))}${grass(30, 156)}${grass(140, 150)}`,
		null,
		() => `${sun(150, 30, 12)}${rays(150, 30, 12)}${birds(84, 40)}<path d="M0,104 Q50,72 110,82 Q150,88 180,84 V120 H0 Z" ${L2} stroke-width="2"/>${keep(118, 84, 22, 18)}${keep(140, 86, 14, 12)}
${at(30, 92, 1, windmill(10))}${at(62, 80, 1, windmill(35))}${at(92, 82, 1, windmill(60))}<path d="M0,120 H180 V170 H0 Z" ${L1} stroke-width="1.8"/>
${[[12, 132], [40, 130], [68, 132], [96, 130], [124, 132], [152, 130]].map(([x, y]) => at(x, y, 0.5, OLIVE)).join('')}
${[16, 46, 76, 106, 136, 166].map((x, i) => `<path d="M${x},170 V${154 - (i % 2) * 5} M${x},164 q5,-2 7,-7 M${x},162 q-5,-2 -7,-6" stroke-width="1.6"/>${rays(x, 150 - (i % 2) * 5, 1, 12)}<circle cx="${x}" cy="${150 - (i % 2) * 5}" r="5" ${SOLID}/>`).join('')}`
	],
	// Portugal: Straßenbahn am Hang – Lissabon am Tejo – mit Torre de Belém und Möwen
	PT: [
		() => `${sun(148, 34, 11)}${facades(0, 114, 8, 23, 6)}<path d="M0,156 L180,116 V170 H0 Z" ${L2} stroke-width="2"/><path d="M0,162 L180,122" stroke-width="1.2" stroke-dasharray="4 3"/>${at(90, 139, 1.2, `<g transform="rotate(-12)">${TRAM}</g>`)}`,
		null,
		() => `${sun(150, 28, 10)}${birds(80, 30)}${birds(112, 18, 0.7)}<path d="M0,68 Q30,56 60,62 L80,66 V120 H0 Z" ${L1} stroke-width="1.6"/>${cube(4, 80, 18, 14)}${cube(22, 76, 16, 18, L2)}${cube(38, 78, 18, 16)}${cube(56, 82, 16, 14, L2)}
<path d="M80,104 H180 V170 H80 Z" ${L2} stroke="none"/>${bridge(80, 96, 100)}<path d="${waves(90, 118, 6, 14, 2.4)}" stroke-width="1.4"/>${at(148, 134, 0.9, BELEM)}<path d="M126,134 H170" stroke-width="2"/>
${facades(0, 88, 5, 21, 5)}<path d="M0,154 L104,126 V170 H0 Z" ${L3} stroke-width="2"/><path d="M0,160 L104,132" stroke-width="1.2" stroke-dasharray="4 3"/>${at(54, 141, 1.1, `<g transform="rotate(-15)">${TRAM}</g>`)}
<path d="M110,150 h4 l2,-3 l2,3 h4 M96,160 h4 l2,-3 l2,3 h4" stroke-width="1.4"/>${[[6, 152], [16, 158], [28, 164], [40, 156], [62, 166], [80, 160]].map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="6" ${L4} stroke="none"/>`).join('')}`
	],
	// Kroatien: Stadtmauer von Dubrovnik – Altstadt auf der Halbinsel – mit Hügeln, Booten und Möwen
	HR: [
		() => `${sun(148, 34, 11)}${birds(96, 40)}<path d="M14,124 V96 H166 V124 Z" ${L2} stroke-width="2"/>${keep(14, 124, 22, 40, L3)}${keep(140, 124, 26, 36, L3)}${[44, 64, 84, 104, 124].map((x) => `<path d="M${x},96 L${x + 9},86 L${x + 18},96 Z" ${L3} stroke-width="1.2"/>`).join('')}${sea(124)}`,
		null,
		() => `${sun(146, 30, 11)}${rays(146, 30, 11)}${birds(82, 32)}<path d="M0,96 Q40,70 90,80 Q140,66 180,82 V104 H0 Z" ${L1} stroke-width="1.6"/><path d="M80,74 V60 L108,72" stroke-width="1"/>
<path d="M4,128 V96 Q60,88 120,96 V128 Z" ${L2} stroke-width="2"/>${keep(4, 128, 22, 44, L3)}${keep(98, 128, 22, 40, L3)}${[28, 46, 64, 80].map((x, i) => `<path d="M${x},${96 - (i % 2) * 6} L${x + 8},${86 - (i % 2) * 6} L${x + 16},${96 - (i % 2) * 6} Z" ${L3} stroke-width="1.2"/>`).join('')}<path d="M50,96 V70 M47,70 L50,64 L53,70" stroke-width="2"/>
<path d="M136,126 Q156,114 180,118 V126 Z" ${L3} stroke-width="1.4"/>${pine(160, 118, 12)}${sea(126)}${at(140, 150, 0.9, SAIL)}${at(60, 160, 0.7, SAIL)}<path d="M100,150 h4 l2,-3 l2,3 h4" stroke-width="1.4"/>`
	],
	// Malta: Luzzu im Hafen – Hafen von Valletta – mit Felsbogen und Möwen
	MT: [
		() => `${sun(148, 34, 11)}<path d="M0,112 H180 V124 H0 Z" ${L1} stroke-width="1.6"/>${at(120, 112, 1.1, VALLETTA)}${sea(124)}${at(80, 146, 1.4, LUZZU)}`,
		null,
		() => `${sun(150, 28, 10)}${rays(150, 28, 10)}${birds(110, 50)}<path d="M0,66 Q8,50 20,46 Q34,44 40,60 L44,104 H34 V80 Q28,68 20,72 Q12,78 12,104 H0 Z" ${L3} stroke-width="2"/>
<path d="M44,104 V96 H180 V104" ${L1} stroke-width="1.6"/>${at(100, 96, 1, VALLETTA)}${keep(140, 96, 26, 10, L2)}${keep(60, 96, 18, 8, L2)}${sea(104)}
${at(58, 132, 1, LUZZU)}${at(126, 146, 1.1, LUZZU)}${at(76, 160, 0.8, LUZZU)}<path d="M150,124 h4 l2,-3 l2,3 h4" stroke-width="1.4"/>`
	],
	// Vatikan: Kuppel des Petersdoms – Petersplatz mit Kolonnaden – mit Schweizergarde und Tauben
	VA: [
		() => `${sun(148, 34, 11)}${birds(40, 60)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 140, 1.4, STPETER)}`,
		null,
		() => `${sun(150, 26, 10)}${rays(150, 26, 10)}<path d="M0,170 V110 H180 V170 Z" ${L1} stroke="none"/>${at(90, 108, 1.15, STPETER)}${colonnade(0, 64, 112, 0)}${colonnade(116, 180, 112, 0)}
<path d="M0,110 H180" stroke-width="1.6"/><path d="M20,140 Q90,126 160,140 Q90,160 20,140 Z" ${L2} stroke-width="1.2"/>${at(90, 146, 1, OBELISK)}${at(50, 140, 0.6, `<path d="M-8,0 H8 L5,-4 H-5 Z" ${SOLID}/><path d="M0,-4 V-10 M-4,-10 Q0,-16 4,-10" stroke-width="1.4"/>`)}${at(130, 140, 0.6, `<path d="M-8,0 H8 L5,-4 H-5 Z" ${SOLID}/><path d="M0,-4 V-10 M-4,-10 Q0,-16 4,-10" stroke-width="1.4"/>`)}
${at(28, 166, 1.1, GUARD)}${at(154, 166, 1.1, GUARD, true)}${birds(60, 50, 0.7)}${birds(118, 62, 0.6)}${dots([[72, 160, 2], [104, 162, 2], [112, 158, 2]], SOLID)}`
	],
	// Zypern: Aphrodite-Felsen – Küste im Abendlicht – Sonnenuntergang mit Gischt und Muschel
	CY: [
		() => `${sun(130, 84, 14)}<path d="M0,98 H180" stroke-width="1.6"/>${sea(98, L1)}${at(70, 128, 1.6, STACK)}<path d="M40,128 q8,-6 16,0 M90,128 q8,-6 16,0" stroke="var(--stp)" stroke-width="2"/>${birds(32, 50)}`,
		null,
		() => `<circle cx="110" cy="90" r="20" ${SOLID}/>${rays(110, 90, 20, 18)}${birds(30, 56)}${birds(140, 40, 0.7)}<path d="M0,92 H180" stroke-width="1.6"/><path d="M0,92 H180 V140 H0 Z" ${L1} stroke="none"/>
<path d="M90,96 H130 M96,102 H124 M102,108 H118" stroke="var(--stp)" stroke-width="1.6"/><path d="M134,138 Q150,80 180,72 V140 Z" ${L3} stroke-width="2"/>${at(62, 126, 1.4, STACK)}${at(104, 124, 0.7, STACK)}
<path d="M28,124 q8,-8 16,0 q8,-8 16,0 M84,124 q6,-6 12,0" stroke="var(--stp)" stroke-width="2"/>${dots([[32, 116], [40, 112], [88, 116]], STAR)}<path d="M0,140 Q90,132 180,140 V170 H0 Z" ${L2} stroke-width="1.8"/>${at(140, 160, 1, SHELL)}${grass(20, 158)}${grass(80, 164)}`
	],
	// Montenegro: Inselkirche – Bucht von Kotor – mit Altstadt und Festungsmauer
	ME: [
		() => `${sun(148, 34, 11)}<path d="M0,110 L40,58 L70,84 L104,46 L140,80 L180,64 V112 H0 Z" ${L2} stroke-width="2"/>${sea(112, L1)}${at(90, 132, 1.3, ISLECHURCH)}`,
		null,
		() => `${sun(150, 26, 10)}${birds(96, 22)}<path d="M0,120 V40 L30,20 L58,52 L80,100 L100,120 Z" ${L2} stroke-width="2"/><path d="M180,120 V50 L150,30 L128,56 L104,104 L96,120 Z" ${L3} stroke-width="2"/>
<path d="M30,26 L38,40 L28,52 L44,62 L34,76 L52,86" stroke-width="1.4" stroke-dasharray="3 2"/>${keep(26, 30, 10, 6, L4)}${[4, 18, 32, 46, 60].map((x, i) => cube(x, 120 - (i % 2) * 2, 12, 10 + (i % 3) * 3)).join('')}<path d="M8,104 V92 L11,88 L14,92 V104" ${SNOW} stroke-width="1.2"/>
${sea(120, L1)}${at(110, 136, 1.1, ISLECHURCH)}${at(150, 150, 0.6, `<path d="M-30,0 Q-20,-6 0,-6 Q20,-6 30,0 Z" ${L3} stroke-width="1.2"/>${cypress(-10, -4, 16)}${cypress(0, -5, 20)}${cypress(10, -4, 14)}`)}${at(48, 156, 0.8, `<path d="M-14,0 H14 L10,5 H-10 Z" ${SOLID}/><path d="M-8,0 V-5 H6 V0" ${SNOW} stroke-width="1.2"/>`)}`
	],
	// Monaco: Jacht vor dem Felsen – Hafen und Casino – Formel-1-Wagen und Feuerwerk
	MC: [
		() => `${sun(148, 34, 11)}<path d="M0,120 Q10,80 50,74 Q90,72 104,92 L112,120 Z" ${L3} stroke-width="2"/>${at(56, 76, 0.9, PALAIS)}${sea(120)}${at(118, 146, 1.4, YACHT)}`,
		null,
		() => `${burst(146, 30, 3)}${burst(118, 46, 2)}${burst(164, 58, 2)}<path d="M80,96 Q100,60 130,58 Q160,56 180,70 V100 H80 Z" ${L1} stroke-width="1.6"/>${at(128, 92, 0.9, CASINO)}
<path d="M0,104 Q8,64 40,60 Q70,60 80,80 L86,104 Z" ${L3} stroke-width="2"/>${at(42, 62, 0.8, PALAIS)}${palm(94, 104, 24, 6)}${palm(170, 100, 30, -6)}<path d="M80,104 H180" stroke-width="2"/>${at(140, 102, 0.8, RACECAR)}
${sea(106)}${at(56, 138, 1.1, YACHT)}${at(136, 134, 0.8, YACHT)}${at(110, 158, 0.9, YACHT)}`
	],
	// San Marino: Turm Guaita – drei Türme auf dem Monte Titano – mit Mauern, Fahnen und Ebene
	SM: [
		() => `${sun(148, 34, 11)}${cloud(20, 120)}<path d="M20,170 L60,100 L84,82 L100,86 L120,110 L180,150 V170 Z" ${L3} stroke-width="2"/>${at(92, 86, 1.4, GUAITA)}${cloud(120, 140)}`,
		null,
		() => `${sun(156, 28, 10)}${rays(156, 28, 10)}${birds(112, 52)}<path d="M0,150 Q90,140 180,150 V170 H0 Z" ${L1} stroke-width="1.6"/><path d="M10,160 H40 M60,162 H100 M120,158 H170" stroke-width="1.2" stroke-dasharray="5 3"/>
<path d="M0,150 L30,116 L56,86 L74,92 L96,72 L116,84 L136,64 L158,96 L180,118 V150 Z" ${L3} stroke-width="2"/><path d="M56,86 L74,92 L96,72 L116,84 L136,64" stroke-width="1.6" stroke-dasharray="3 2"/>
${at(56, 88, 0.9, GUAITA)}${at(96, 74, 1.05, GUAITA)}${at(136, 66, 0.8, GUAITA)}${cube(20, 138, 14, 10)}${cube(36, 134, 12, 12)}${cube(144, 130, 12, 10)}${cloud(-6, 122)}${cloud(150, 140)}`
	],
	// Albanien: Berat, Stadt der tausend Fenster – mit Fluss und Brücke – mit Burg, Minarett und Bergen
	AL: [
		() => `${sun(148, 34, 11)}<path d="M0,170 V90 Q60,70 120,100 Q150,116 180,130 V170 Z" ${L2} stroke-width="2"/>${berat(12, 140, 8, 20)}${grass(150, 160)}`,
		null,
		() => `${sun(150, 26, 10)}<path d="M0,72 L40,30 L70,50 L100,20 L140,50 L180,40 V90 H0 Z" ${L1} stroke-width="1.6"/><path d="M100,20 L92,32 L100,28 L108,32 Z M40,30 L34,38 L41,36 L46,38 Z" ${SNOW} stroke-width="1.2"/>
<path d="M0,170 V82 Q40,70 80,78 Q130,90 180,110 V170 Z" ${L2} stroke-width="2"/><path d="M8,82 V72 H80 V84" ${L3} stroke-width="1.4"/>${keep(10, 82, 12, 12, L3)}${keep(66, 84, 12, 10, L3)}${berat(10, 128, 8, 18)}${at(118, 122, 1.1, MINARET)}
<path d="M0,170 V150 Q90,142 180,150 V170 Z" ${L3} stroke="none"/><path d="M40,150 Q70,128 100,150" stroke-width="3"/><path d="M48,150 Q70,136 92,150" ${PAPER}/><path d="${waves(4, 162, 12, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Andorra: Kirchturm vor den Pyrenäen – Tal mit Steinbrücke – mit Gämse, Tannen und Schnee
	AD: [
		() => `${sun(148, 34, 11)}<path d="M0,104 L50,52 L80,76 L120,40 L180,96 V120 H0 Z" ${L1} stroke-width="1.8"/><path d="M120,40 L110,52 L120,48 L130,54 Z M50,52 L42,62 L51,58 L58,62 Z" ${SNOW} stroke-width="1.2"/><path d="M0,140 Q90,130 180,140 V170 H0 Z" ${L2} stroke-width="2"/>${at(76, 140, 1.4, ROMAN)}`,
		null,
		() => `${sun(156, 26, 10)}${birds(100, 30)}<path d="M0,96 L40,40 L70,64 L110,24 L150,60 L180,48 V110 H0 Z" ${L1} stroke-width="1.8"/><path d="M110,24 L98,40 L110,34 L122,42 Z M40,40 L32,52 L41,48 L48,52 Z M180,48 L170,56 L180,54 Z" ${SNOW} stroke-width="1.2"/>
${at(126, 56, 0.7, CHAMOIS)}<path d="M0,120 Q90,108 180,120 V170 H0 Z" ${L2} stroke-width="2"/>${at(58, 120, 1.1, ROMAN)}${pine(12, 122, 30)}${pine(28, 118, 20, L4)}${pine(160, 122, 34)}${pine(144, 120, 22, L4)}
<path d="M0,170 V150 Q90,142 180,150 V170 Z" ${L3} stroke="none"/><path d="M80,150 Q104,124 128,150" stroke-width="3"/><path d="M88,150 Q104,132 120,150" ${PAPER}/><path d="M74,150 H134" stroke-width="2"/><path d="${waves(4, 162, 12, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Gibraltar: der Felsen – mit Schiff und Berberaffe – mit Leuchtturm und Delfinen
	GI: [
		() => `${sun(148, 34, 11)}${birds(90, 44)}${ROCK(128)}${sea(128)}`,
		null,
		() => `${sun(156, 26, 10)}${rays(156, 26, 10)}${birds(100, 22)}${ROCK(118)}${at(160, 118, 0.9, LIGHTHOUSE)}${sea(118)}${at(60, 146, 1, DOLPHIN)}${at(96, 150, 0.8, DOLPHIN)}<path d="M50,150 q4,-4 8,0 M88,152 q4,-4 8,0" stroke="var(--stp)" stroke-width="1.6"/>
<path d="M110,170 V146 H180 V170 Z" ${L3} stroke-width="2"/><path d="M110,146 H180" stroke-width="2.6"/>${at(132, 146, 1, MACAQUE)}${at(152, 146, 0.65, MACAQUE)}`
	],
	// Deutschland: Brandenburger Tor – Burg am Rhein mit Weinbergen – Neuschwanstein in der Winternacht
	DE: [
		() => `${sun(150, 30, 10)}${cloud(16, 56)}${birds(60, 30)}<path d="M0,134 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,134 H180" stroke-width="2"/>${at(90, 134, 1.15, BRANDENBURG)}<path d="M14,152 H166" stroke-width="1" stroke-dasharray="4 4"/>${bush(10, 134, 6)}${bush(170, 134, 7)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[20, 14], [46, 30], [70, 10], [118, 22], [96, 40, 1], [170, 50], [100, 8, 1], [30, 50, 1], [164, 66, 1], [8, 34, 1]], STAR)}<path d="M146,16 a10,10 0 1 0 9,14 a8,8 0 1 1 -9,-14 Z" ${STAR} stroke="none"/>
<path d="M0,112 L22,72 L40,86 L70,50 L96,78 L120,60 L150,88 L168,72 L180,82 V170 H0 Z" ${L3} stroke="none"/><path d="M70,50 L64,62 L71,58 L76,64 Z M22,72 L17,82 L23,78 L27,82 Z M120,60 L115,70 L121,67 L126,71 Z" ${STAR} fill-opacity=".7" stroke="none"/>
<path d="M48,170 L58,128 Q76,112 96,116 Q116,120 126,142 L132,170 Z" ${SOLID}/>${at(92, 120, 0.82, NEUSCH)}<path d="M126,116 q-6,-4 -2,-10 q4,-6 0,-12" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="1.2"/>
${[[8, 170, 34], [24, 170, 26], [38, 170, 22], [142, 170, 24], [158, 170, 32], [174, 170, 26]].map(([x, y, h]) => pine(x, y, h)).join('')}<path d="M0,170 V160 Q30,152 50,160 V170 Z M130,170 V162 Q150,154 180,160 V170 Z" ${SNOW}/>${dots([[16, 120, 1.2], [40, 104, 1.2], [140, 104, 1.2], [166, 118, 1.2], [60, 96, 1], [108, 92, 1]], STAR)}`
	],
	// Österreich: Kirche vor dem Großglockner – Hallstatt am See – Wien mit Riesenrad und Stephansdom
	AT: [
		() => `${sun(142, 30, 9)}${birds(130, 26)}${alps(100)}<path d="M0,126 Q60,112 120,120 Q150,116 180,124 V170 H0 Z" ${L1} stroke-width="2"/>${at(96, 138, 1.2, SPIRE)}${pine(30, 140, 30)}${pine(46, 142, 22, L4)}${pine(158, 142, 28)}${grass(70, 160)}${grass(140, 162)}`,
		null,
		() => `${sun(140, 98, 18)}${rays(140, 98, 18, 16)}${birds(94, 24)}${birds(150, 34, 0.7)}<path d="M0,118 Q90,108 180,118" stroke-width="1.4" stroke-dasharray="4 4"/>${at(52, 148, 1, wheel(38))}${at(108, 148, 1, STEPHAN)}
<path d="M0,148 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,148 H180" stroke-width="2"/>${bush(14, 148, 8)}${bush(168, 148, 7)}
<path d="M150,46 V30 L166,26 V42 M150,34 L166,30" stroke-width="1.6"/><ellipse cx="147.5" cy="46" rx="3.2" ry="2.4" ${SOLID}/><ellipse cx="163.5" cy="42" rx="3.2" ry="2.4" ${SOLID}/><path d="M26,58 V46 l6,3" stroke-width="1.6"/><ellipse cx="23.5" cy="58" rx="3" ry="2.2" ${SOLID}/>
<path d="M0,160 Q30,154 60,160 T120,160 T180,158" stroke="var(--stp)" stroke-width="1.6"/>`
	],
	// Schweiz: Matterhorn mit Spiegelung – Glacier Express auf dem Landwasserviadukt – Alm mit Chalet, Kühen und Edelweiß
	CH: [
		() => `${sun(150, 26, 9)}${birds(100, 30)}${MATTER(124)}<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,124 H180" stroke-width="2"/><g opacity=".3" transform="translate(0,248) scale(1,-1)">${MATTER(124)}</g><path d="${waves(20, 150, 10, 14, 2.4)}" stroke-width="1.4"/>${pine(10, 126, 28)}${pine(24, 126, 18, L4)}${pine(170, 126, 30)}`,
		null,
		() => `${sun(142, 24, 9)}${rays(142, 24, 9)}${birds(100, 24)}${MATTER(108, 96, 0.95)}<path d="M0,112 Q50,100 100,108 Q140,102 180,110 V170 H0 Z" ${L1} stroke-width="2"/>${at(144, 130, 1.1, CHALET)}${pine(170, 130, 26)}${pine(118, 128, 20, L4)}
${at(30, 146, 1, ALPCOW)}${at(78, 156, 0.85, ALPCOW, true)}${at(150, 160, 1, EDEL)}${at(166, 152, 0.7, EDEL)}${at(120, 162, 0.6, EDEL)}${grass(14, 164)}${grass(104, 150)}<path d="M0,134 Q40,126 70,132" stroke-width="1" stroke-dasharray="3 3"/>`
	],
	// Niederlande: Windmühle und Tulpen – Amsterdamer Grachtenhäuser – Mühlen von Kinderdijk über Tulpenfeldern
	NL: [
		() => `${sun(150, 30, 10)}${cloud(74, 44)}${birds(96, 26)}<path d="M0,120 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,120 H180" stroke-width="2"/>${at(70, 122, 1.6, windmill(20))}
${[130, 140, 150, 160].map((y, r) => Array.from({ length: 11 }, (_, i) => tulip(8 + i * 16 + (r % 2) * 8, y + 8, r % 2 ? L3 : SOLID)).join('')).join('')}`,
		null,
		() => `${sun(90, 70, 20)}${rays(90, 70, 20, 16)}${birds(130, 24)}${birds(100, 34, 0.7)}<path d="M0,96 H180" stroke-width="1.6"/>${at(26, 96, 1, windmill(30))}${at(64, 96, 0.75, windmill(10))}${at(118, 96, 0.6, windmill(40))}${at(150, 96, 0.48, windmill(20))}
<path d="M0,96 H180 V108 H0 Z" ${L2} stroke="none"/><path d="M8,102 h40 M70,104 h30 M120,101 h40" stroke="var(--stp)" stroke-width="1.4"/>
${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-40 + i * 50},170 L${82 + i * 4},108 L${88 + i * 4},108 L${-14 + i * 50},170 Z" ${[SOLID, L1, L3, SNOW, L2, L4][i]}/>`).join('')}<path d="M0,108 H180" stroke-width="1.6"/>${[[20, 160], [44, 152], [140, 156], [160, 166]].map(([x, y]) => tulip(x, y)).join('')}`
	],
	// Belgien: Atomium – Belfried von Brügge am Kanal – Grand-Place mit Blumenteppich
	BE: [
		() => `${sun(148, 30, 9)}${birds(100, 30)}${cloud(108, 66)}<path d="M0,142 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,142 H180" stroke-width="2"/>${at(90, 142, 1.05, ATOMIUM)}${bush(20, 142, 9)}${bush(36, 142, 6)}${bush(160, 142, 8)}`,
		null,
		() => `${burst(150, 24, 3)}${burst(28, 30, 2)}${dots([[60, 12], [120, 16], [96, 28]])}<path d="M64,108 V40 L72,24 L76,8 L80,24 L88,40 V108 Z" ${L2} stroke-width="1.5"/><path d="M70,40 H82 M72,56 H80 M72,72 H80" stroke-width="1"/><path d="M40,108 V70 H112 V108" ${SNOW} stroke-width="1.4"/>
${[46, 54, 92, 100].map((x) => `<path d="M${x},80 V88 Q${x + 2.5},91 ${x + 5},88 V80 Z M${x},96 V104 Q${x + 2.5},107 ${x + 5},104 V96 Z" ${SOLID}/>`).join('')}<path d="M40,70 l3,-5 l3,5 l3,-5 l3,5 l3,-5 l3,5 M94,70 l3,-5 l3,5 l3,-5 l3,5 l3,-5 l3,5" stroke-width="1.2"/>
${gables(0, 108, 2, 18)}${gables(126, 108, 3, 18)}<path d="M0,108 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,108 H180" stroke-width="2"/>
<ellipse cx="90" cy="140" rx="80" ry="22" ${L1} stroke-width="1.4"/>${Array.from({ length: 21 }, (_, i) => {
			const a = (i / 21) * Math.PI * 2,
				x = f1(90 + 64 * Math.cos(a)),
				y = f1(140 + 15 * Math.sin(a));
			return `<circle cx="${x}" cy="${y}" r="3.4" ${[SOLID, L3, SNOW][i % 3]} stroke-width=".8"/>`;
		}).join('')}<path d="M90,128 l8,12 l-8,12 l-8,-12 Z" ${SOLID}/><path d="M60,140 l10,-6 l10,6 l-10,6 Z M100,140 l10,-6 l10,6 l-10,6 Z" ${L3} stroke-width="1"/><circle cx="90" cy="140" r="3" ${PAPER}/>`
	],
	// Großbritannien: Big Ben und Doppeldeckerbus – Tower Bridge an der Themse – Stonehenge bei Sonnenaufgang
	GB: [
		() => `${cloud(78, 46)}${cloud(126, 30)}${birds(60, 26)}<path d="M120,152 V114 H176 V152" ${L1} stroke-width="1.4"/><path d="M120,114 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l3,6 l3,-6 l2,4" stroke-width="1.2"/><path d="M126,122 V146 M134,122 V146 M142,122 V146 M150,122 V146 M158,122 V146 M166,122 V146" stroke-width="1" stroke-dasharray="3 2"/>
${at(106, 152, 1.04, BIGBEN)}<path d="M0,152 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,152 H180" stroke-width="2"/>${at(48, 152, 1.1, BUS)}<path d="M0,162 H180" stroke-width="1" stroke-dasharray="6 5"/>`,
		null,
		() => `${sun(90, 100, 20)}${rays(90, 100, 20, 16)}${birds(98, 30)}${birds(140, 22, 0.8)}<path d="M0,112 Q50,100 100,108 Q140,100 180,110" stroke-width="1.4"/>${at(90, 124, 1.05, STONEH)}
<path d="M0,124 Q90,116 180,124 V170 H0 Z" ${L2} stroke-width="2"/><path d="M0,134 Q40,128 80,134 M100,140 Q140,132 180,138" stroke="var(--stp)" stroke-width="1.6" stroke-dasharray="6 4"/>${at(24, 150, 1, SHEEP)}${at(54, 158, 0.8, SHEEP)}${at(150, 156, 0.9, SHEEP, true)}${grass(100, 160)}${grass(124, 150)}${grass(8, 164)}`
	],
	// Irland: Klippen von Moher – grüne Hügel mit Steinmauern, Schafen und Rundturm – Klippen mit Leuchtturm, Regenbogen und Papageitauchern
	IE: [
		() => `${sun(150, 28, 9)}${birds(100, 30)}${birds(130, 52, 0.7)}<path d="M0,40 L36,44 L60,60 L82,70 L104,92 L120,112 V170 H0 Z" ${L3} stroke-width="2"/><path d="M20,48 V160 M40,50 V160 M60,64 V160 M80,74 V160 M100,94 V160" stroke-width="1" stroke-dasharray="6 3"/>
<path d="M0,40 L36,44 L60,60 L82,70 L104,92 L120,112" stroke-width="3"/>${at(28, 42, 0.7, `<path d="M-5,0 V-20 H5 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-6,-20 v-3 h3 v2 h3 v-2 h3 v2 h3 v3 Z" ${SOLID}/>`)}${sea(120)}<path d="M112,120 q4,-6 10,-2" stroke="var(--stp)" stroke-width="1.6"/>`,
		null,
		() => `<path d="M30,112 A70,70 0 0 1 170,112" stroke-width="3"/><path d="M38,112 A62,62 0 0 1 162,112" stroke-width="3" stroke-opacity=".5"/><path d="M46,112 A54,54 0 0 1 154,112" stroke-width="3" stroke-opacity=".25"/>${birds(80, 30, 0.8)}
<path d="M0,56 L30,58 L52,74 L64,84 L80,104 V170 H0 Z" ${L3} stroke-width="2"/><path d="M14,62 V160 M32,64 V160 M50,76 V160 M66,90 V160" stroke-width="1" stroke-dasharray="6 3"/><path d="M0,56 L30,58 L52,74 L64,84 L80,104" stroke-width="3"/>${at(22, 58, 0.9, LIGHTHOUSE)}
<path d="M80,124 H180 V170 H80 Z" ${L2} stroke="none"/><path d="${waves(84, 134, 7, 14, 3)}" stroke-width="2"/><path d="${waves(90, 150, 6, 14, 3)}" stroke-width="1.6"/>
<path d="M110,124 Q120,108 140,106 Q164,104 170,124 Z" ${L3} stroke-width="1.6"/>${at(132, 108, 0.9, PUFFIN)}${at(152, 107, 0.8, PUFFIN, true)}${at(40, 150, 1.2, CLOVER)}${at(58, 160, 0.8, CLOVER)}`
	],
	// Dänemark: Kleine Meerjungfrau – Nyhavn mit Booten – Wikingerschiff vor den Kreidefelsen von Møn
	DK: [
		() => `${sun(146, 30, 9)}${birds(110, 30)}${birds(110, 50, 0.7)}<path d="M0,108 Q30,100 60,106 Q100,98 180,104" stroke-width="1.4"/><path d="M120,104 V88 H130 V104 M136,104 V82 L140,74 L144,82 V104" ${L2} stroke-width="1.2"/>${sea(124)}${at(90, 138, 1.5, MERMAID)}`,
		null,
		() => `${sun(130, 60, 20)}${rays(130, 60, 20, 16)}${birds(150, 22)}${birds(110, 30, 0.8)}<path d="M0,40 L22,42 L30,90 Q20,100 0,102 Z" ${SNOW} stroke-width="1.8"/><path d="M0,40 L22,42 L24,48 L0,46 Z" ${SOLID}/><path d="M8,50 L10,96 M16,48 L20,94" stroke-width="1" stroke-dasharray="4 3"/>
${sea(108)}${at(100, 142, 1.3, VIKING)}<path d="M40,150 q6,-4 12,0 M150,152 q6,-4 12,0" stroke="var(--stp)" stroke-width="1.6"/>`
	],
	// Norwegen: Fjord mit Schiff – Lofoten mit roten Rorbuer – Preikestolen in der Mitternachtssonne
	NO: [
		() => `${sun(90, 28, 9)}${birds(120, 30)}<path d="M0,20 L24,30 L44,60 L58,120 H0 Z" ${L3} stroke-width="2"/><path d="M180,30 L152,40 L134,70 L122,120 H180 Z" ${L3} stroke-width="2"/><path d="M12,36 L28,80 M164,44 L146,90" stroke-width="1.2"/>
<path d="M154,54 V110" stroke="var(--stp)" stroke-width="2" stroke-dasharray="3 2"/><path d="M58,120 L70,100 L110,100 L122,120 Z" ${L1} stroke-width="1.4"/><path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,120 H180" stroke-width="2"/>${at(90, 138, 0.9, YACHT)}<path d="${waves(10, 156, 11, 15, 2.4)}" stroke-width="1.4"/>`,
		null,
		() => `${sun(126, 90, 14)}${rays(126, 90, 14, 16)}<path d="M80,98 H180" stroke-width="1.6"/><path d="M80,98 H180 V170 H80 Z" ${L1} stroke="none"/><path d="M100,104 H160 M110,112 H150 M118,120 H142" stroke="var(--stp)" stroke-width="1.6"/>
<path d="M0,60 L54,58 L60,64 L56,170 H0 Z" ${L3} stroke-width="2"/><path d="M0,60 L54,58 L60,64" stroke-width="3"/><path d="M14,70 L12,160 M30,70 L30,166 M46,68 L44,164" stroke-width="1.1" stroke-dasharray="7 3"/>${at(46, 58, 0.9, PERSON)}
<path d="M60,170 Q70,140 98,132 Q140,124 180,134 V170 Z" ${L2} stroke-width="1.6"/>${at(150, 160, 0.9, STAVE)}${birds(90, 26)}${birds(140, 30, 0.7)}`
	],
	// Schweden: rotes Holzhaus am See – Gamla Stan in Stockholm – Mittsommer mit Maibaum
	SE: [
		() => `${sun(146, 30, 9)}${birds(60, 30)}<path d="M0,112 Q40,100 90,108 Q140,98 180,108 V122 H0 Z" ${L2} stroke-width="1.6"/>${[[10, 112, 26], [24, 112, 20], [166, 112, 24]].map(([x, y, h]) => pine(x, y, h)).join('')}${at(84, 124, 1.4, STUGA)}${birch(130, 126, 40)}
<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,124 H180" stroke-width="2"/><path d="${waves(14, 144, 11, 14, 2.4)}" stroke-width="1.4"/><path d="M40,154 H70 L66,158 H44 Z" ${SOLID}/>`,
		null,
		() => `${sun(142, 30, 10)}${rays(142, 30, 10)}${birds(110, 26)}<path d="M0,96 Q60,86 120,94 Q150,90 180,96 V108 H0 Z" ${L2} stroke-width="1.6"/>${pine(160, 96, 22)}${pine(172, 98, 16, L4)}${at(150, 108, 0.9, STUGA)}
<path d="M0,108 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,108 H180" stroke-width="2"/>${at(76, 150, 1.3, MAYPOLE)}${[[44, 158], [106, 158], [60, 166], [92, 166]].map(([x, y]) => at(x, y, 0.85, PERSON)).join('')}
<path d="M44,140 Q60,146 76,140 Q92,146 108,140" stroke-width="1" stroke-dasharray="2 2"/>${dots([[20, 150, 2], [130, 156, 2], [150, 146, 2], [14, 164, 1.6], [170, 160, 1.6]], L3)}${birch(22, 140, 36)}`
	],
	// Finnland: Saunahütte am See – Tausend Seen mit Wäldern – Lappland: Rentier, Polarlicht und Glas-Iglu
	FI: [
		() => `<path d="M134,22 a10,10 0 1 0 9,14 a8,8 0 1 1 -9,-14 Z" ${SOLID}/>${birds(110, 30)}<path d="M0,110 Q40,98 80,106 Q130,96 180,108 V120 H0 Z" ${L2} stroke-width="1.6"/>${[[12, 110, 28], [28, 110, 20], [150, 110, 26], [166, 110, 32]].map(([x, y, h]) => pine(x, y, h)).join('')}
${at(70, 122, 1.4, SAUNA)}${birch(40, 124, 36)}<path d="M0,122 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,122 H180" stroke-width="2"/><g opacity=".3" transform="translate(0,244) scale(1,-1)">${at(70, 122, 1.4, SAUNA)}</g><path d="${waves(10, 156, 11, 15, 2.4)}" stroke-width="1.4"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[20, 14], [60, 10], [100, 20], [150, 12], [170, 34], [40, 36, 1], [130, 40, 1], [86, 6, 1]], STAR)}
<path d="M0,66 Q50,24 100,50 Q140,70 180,34 V62 Q140,96 100,78 Q50,54 0,96 Z" ${STAR} fill-opacity=".22" stroke="none"/><path d="${Array.from({ length: 24 }, (_, i) => {
			const x = 4 + i * 7.4,
				y = f1(56 - 18 * Math.sin((i / 23) * Math.PI * 1.4) + 4 * Math.sin(i * 1.3));
			return `M${x},${y} v${14 + (i % 4) * 5}`;
		}).join(' ')}" stroke="#F4F7FA" stroke-opacity=".5" stroke-width="2"/>
<path d="M0,120 Q60,110 120,118 Q150,114 180,120 V170 H0 Z" ${SNOW}/>${[[10, 124, 40], [26, 120, 30], [154, 122, 34], [170, 124, 44]].map(([x, y, h]) => `${pine(x, y, h)}<path d="M${x - h * 0.3},${f1(y - h * 0.44)} Q${x},${f1(y - h * 0.56)} ${x + h * 0.3},${f1(y - h * 0.44)} M${x - h * 0.16},${f1(y - h * 0.8)} Q${x},${f1(y - h * 0.9)} ${x + h * 0.16},${f1(y - h * 0.8)}" stroke="#F4F7FA" stroke-width="3"/>`).join('')}
${at(126, 128, 1, IGLOO)}${at(52, 150, 1.5, REINDEER)}<path d="M40,152 Q80,146 120,152" stroke-width="1" stroke-dasharray="3 3"/>`
	],
	// Polen: Marienkirche in Krakau – Tatra mit dem Meerauge – Störche, Mohnfeld und Holzkirche
	PL: [
		() => `${sun(150, 26, 9)}${birds(106, 30)}<path d="M0,146 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,146 H180" stroke-width="2"/>${gables(0, 146, 2, 16)}${gables(132, 146, 3, 16)}${at(90, 146, 1.1, MARIACKI)}`,
		null,
		() => `<path d="M0,0 H180 V120 H0 Z" fill="#F7A35C" fill-opacity=".14" stroke="none"/><circle cx="146" cy="50" r="13" ${SOLID}/><circle cx="146" cy="50" r="21" ${DOTS}/>${birds(60, 44)}${birds(76, 56, 0.7)}
<path d="M6,120 V96 H174 V120 Z" ${L2} stroke-width="1.8"/>${Array.from({ length: 21 }, (_, i) => `<rect x="${7 + i * 8}" y="91" width="4" height="5" ${SOLID}/>`).join('')}
<path d="M30,120 V58 H90 V120 Z" ${L3} stroke-width="2"/><path d="M27,58 L60,38 L93,58 Z" ${SOLID}/><path d="M96,120 V34 H112 V120 Z" ${L3} stroke-width="2"/><path d="M93,34 L104,10 L115,34 Z" ${SOLID}/><path d="M118,120 V78 H170 V120 Z" ${L2} stroke-width="1.8"/><path d="M116,78 L144,62 L172,78 Z" ${SOLID}/>
<path d="M30,72 H90 M30,86 H90 M30,100 H90 M96,50 H112 M96,66 H112 M96,82 H112" stroke-width=".8" stroke-dasharray="4 3"/>${[[40, 66], [52, 66], [68, 66], [80, 66], [40, 90], [52, 90], [68, 90], [80, 90], [104, 44], [104, 60], [128, 88], [142, 88], [156, 88]].map(([x, y]) => `<path d="M${x - 2.5},${y + 9} V${y + 2} A2.5,2.5 0 0 1 ${x + 2.5},${y + 2} V${y + 9} Z" ${SOLID}/>`).join('')}
<path d="M0,120 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,120 H180" stroke-width="2"/><path d="M100,124 V160 M60,124 V146 M144,124 V144" stroke-width="3" stroke-opacity=".25" stroke-dasharray="5 4"/><path d="${waves(14, 134, 5, 14, 2)} ${waves(100, 152, 5, 14, 2)}" stroke-width="1.3"/>
<path d="M120,140 H160 L154,148 H126 Z" ${SOLID}/><path d="M138,140 V122 M138,124 L150,138 H138" stroke-width="1.4"/>${[8, 14, 20, 26].map((x, i) => `<path d="M${x},170 Q${x + 2},${158 - i * 2} ${x + 4},${150 - i * 3}" stroke-width="1.4"/>`).join('')}`
	],
	// Tschechien: Prager Burg über der Moldau – Český Krumlov an der Flussschleife – Karlsbrücke und Burg bei Nacht
	CZ: [
		() => `${sun(150, 26, 9)}${birds(100, 26)}<path d="M0,110 Q40,92 90,96 Q140,92 180,108 V124 H0 Z" ${L2} stroke-width="1.8"/>${at(90, 100, 1.1, HRAD)}<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/>${charles(0, 128, 180, 6)}<path d="${waves(10, 162, 11, 15, 2.4)}" stroke-width="1.4"/>`,
		null,
		() => `${sun(152, 30, 9)}${birds(124, 24)}${gables(116, 150, 4, 16)}
<path d="M10,150 V96 L34,80 L58,96 V150 Z" ${L2} stroke-width="1.8"/>${[[22, 62], [46, 62]].map(([x, y]) => `<path d="M${x - 7},96 V${y} H${x + 7} V96" ${L3} stroke-width="1.6"/><path d="M${x - 8},${y} L${x},${y - 24} L${x + 8},${y} Z" ${SOLID}/><path d="M${x - 8},${y} l-2,-9 l2,1 Z M${x + 8},${y} l2,-9 l-2,1 Z M${x - 4},${y - 8} l-2,-8 l3,2 Z M${x + 4},${y - 8} l2,-8 l-3,2 Z" ${SOLID}/>`).join('')}<path d="M30,150 V128 A4,4 0 0 1 38,128 V150" ${SOLID}/><circle cx="34" cy="108" r="5" ${PAPER} stroke-width="1.2"/>
<path d="M72,150 V50 H108 V150 Z" ${L1} stroke-width="2"/><path d="M68,50 H112 M70,46 H110" stroke-width="1.8"/><path d="M72,46 L76,38 H104 L108,46 Z" ${L3} stroke-width="1.4"/><path d="M80,38 L90,10 L100,38 Z" ${SOLID}/><path d="M71,46 l2,-12 l2,12 Z M105,46 l2,-12 l2,12 Z" ${SOLID}/>
<path d="M80,68 V60 A3,3 0 0 1 86,60 V68 Z M94,68 V60 A3,3 0 0 1 100,60 V68 Z" ${SOLID}/>
<circle cx="90" cy="96" r="18" ${PAPER} stroke-width="2"/><circle cx="90" cy="96" r="13" ${L2} stroke-width="1"/><circle cx="92" cy="92" r="8" fill="none" stroke-width="1.2"/>${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${f1(90 + Math.cos(a) * 15)},${f1(96 + Math.sin(a) * 15)} L${f1(90 + Math.cos(a) * 18)},${f1(96 + Math.sin(a) * 18)}" stroke-width="1.2"/>`; }).join('')}
<path d="M90,96 L90,80 M90,96 L102,104" stroke-width="1.6"/><circle cx="90" cy="82" r="2.6" ${SOLID}/><circle cx="101" cy="103" r="1.8" ${SOLID}/><circle cx="90" cy="96" r="1.6" ${SOLID}/>
<circle cx="90" cy="132" r="11" ${SNOW} stroke-width="1.6"/><circle cx="90" cy="132" r="5" ${L3} stroke-width="1"/>${Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `<path d="M${f1(90 + Math.cos(a) * 5)},${f1(132 + Math.sin(a) * 5)} L${f1(90 + Math.cos(a) * 11)},${f1(132 + Math.sin(a) * 11)}" stroke-width=".8"/>`; }).join('')}
<path d="M64,96 h6 v8 h-6 Z M110,96 h6 v8 h-6 Z" ${L3} stroke-width="1"/><circle cx="67" cy="93" r="2" ${SOLID}/><circle cx="113" cy="93" r="2" ${SOLID}/>
<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,150 H180" stroke-width="2"/><path d="M10,158 H40 M60,162 H100 M130,158 H170 M24,166 H70 M110,166 H150" stroke-width="1" stroke-dasharray="3 3"/>`
	],
	// Luxemburg: Adolphe-Brücke – Altstadt auf den Felsen über dem Alzettetal – Burg Vianden im Herbst
	LU: [
		() => `${sun(150, 28, 9)}${birds(100, 26)}<path d="M0,60 H40 V170 H0 Z M140,60 H180 V170 H140 Z" ${L3} stroke-width="2"/><path d="M10,70 V160 M26,66 V160 M154,70 V160 M168,66 V160" stroke-width="1" stroke-dasharray="6 3"/>${adolphe(36, 60, 108)}
${at(160, 60, 0.6, SPIRE)}${at(20, 60, 0.5, SPIRE, true)}<path d="M40,170 Q90,150 140,170" ${L1} stroke-width="1.6"/>${bush(70, 166, 8)}${bush(110, 166, 7)}`,
		null,
		() => `${sun(156, 26, 9)}${birds(116, 22)}
<path d="M14,76 L28,54 H152 L166,76 Z" ${L2} stroke-width="1.8"/>${[[44, 62], [90, 60], [136, 62]].map(([x, y]) => `<path d="M${x - 6},68 V${y} L${x},${y - 6} L${x + 6},${y} V68 Z" ${SNOW} stroke-width="1.2"/>`).join('')}
<path d="M90,54 V30" stroke-width="1.6"/><path d="M90,30 H108 V34 H90 Z" ${L1} stroke-width="1"/><path d="M90,34 H108 V38 H90 Z" ${SNOW} stroke-width="1"/><path d="M90,38 H108 V42 H90 Z" ${L3} stroke-width="1"/>
<path d="M18,150 V76 H162 V150 Z" ${L1} stroke-width="2"/><path d="M18,112 H162" stroke-width="1" stroke-dasharray="2 2"/>
${[28, 38, 70, 82, 94, 106, 138, 148].flatMap((x) => [84, 102].map((y) => `<rect x="${x}" y="${y}" width="6" height="10" ${SOLID}/>`)).join('')}${[28, 38, 138, 148].map((x) => `<rect x="${x}" y="122" width="6" height="12" ${SOLID}/>`).join('')}
${[56, 124].map((x) => `<path d="M${x - 7},120 V64 H${x + 7} V120 L${x},128 Z" ${L3} stroke-width="1.6"/><path d="M${x - 9},64 L${x},36 L${x + 9},64 Z" ${SOLID}/><path d="M${x},36 V30" stroke-width="1.4"/><rect x="${x - 2}" y="78" width="4" height="8" ${SNOW}/><rect x="${x - 2}" y="96" width="4" height="8" ${SNOW}/>`).join('')}
<path d="M76,118 H114 V122 H76 Z" ${SOLID}/><path d="M78,118 V112 M86,118 V112 M94,118 V112 M102,118 V112 M110,118 V112 M76,112 H114" stroke-width="1"/><path d="M86,150 V136 A9,9 0 0 1 104,136 V150 Z" ${SOLID}/>
<path d="M166,150 V128 L172,120 L178,128 V150 Z" ${L2} stroke-width="1.4"/><path d="M169,150 V132 H175 V150" ${SOLID}/>
<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,150 H180" stroke-width="2"/><path d="M8,158 H40 M60,162 H120 M140,158 H172 M20,166 H80 M110,166 H160" stroke-width="1" stroke-dasharray="3 3"/>${[8, 68].map((x) => `<path d="M${x},150 V128" stroke-width="1.4"/><path d="M${x - 3},128 h6 l-1,-6 h-4 Z" ${SOLID}/>`).join('')}`
	],
	// Liechtenstein: Schloss Vaduz über dem Rheintal – Rheintal mit Weinbergen vor den Alpen – Schloss im Abendlicht vor verschneiten Gipfeln
	LI: [
		() => `${sun(150, 26, 9)}${birds(110, 28)}${alps(90)}<path d="M0,120 Q30,84 70,80 Q110,82 130,110 L180,120 V170 H0 Z" ${L2} stroke-width="1.8"/>
${at(70, 84, 1, `${keep(-30, 0, 20, 20, SNOW)}<path d="M-10,0 V-22 H24 V0" ${SNOW} stroke-width="1.3"/><path d="M-12,-22 L7,-32 L26,-22 Z" ${SOLID}/>${keep(24, 0, 12, 30, SNOW)}`)}${vines(20, 150, 40, 18, 7)}<path d="M0,150 H180" stroke-width="1" stroke-dasharray="4 4"/>`,
		null,
		() => `${sun(90, 64, 16)}${rays(90, 64, 16, 16)}${birds(100, 26)}${birds(140, 22, 0.7)}${alps(96, 180, L2)}<path d="M0,128 Q30,88 74,84 Q114,86 132,116 L180,128 V170 H0 Z" ${L3} stroke-width="1.8"/>
${at(74, 88, 1.1, `${keep(-30, 0, 20, 20, SNOW)}<path d="M-10,0 V-22 H24 V0" ${SNOW} stroke-width="1.3"/><path d="M-12,-22 L7,-32 L26,-22 Z" ${SOLID}/>${keep(24, 0, 12, 30, SNOW)}<path d="M30,-34 V-46 L38,-43 L30,-40" stroke-width="1.2"/>`)}${vines(10, 160, 44, 22, 7)}${pine(150, 132, 24)}${pine(166, 134, 18, L4)}${at(124, 160, 0.8, EDEL)}`
	],
	// Estland: Tallinner Altstadt mit Olaikirche – Küste von Lahemaa mit Findlingen und Moorpfad – Weihnachtsmarkt in der Winternacht
	EE: [
		() => `${sun(150, 26, 9)}${birds(100, 30)}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/>${wall(10, 170, 150, 16)}${steeple(54, 134, 104)}${rtower(18, 134, 14, 20)}${rtower(150, 134, 16, 24)}${rtower(118, 134, 10, 30, SNOW)}
${gables(66, 134, 3, 14)}${gables(126, 134, 1, 12)}<path d="M0,150 H180" stroke-width="2"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[18, 12], [60, 22], [104, 10], [150, 18], [170, 44, 1], [40, 40, 1], [126, 36, 1]], STAR)}${steeple(40, 120, 100, L3)}${rtower(146, 120, 16, 26, L3)}${gables(56, 120, 6, 14).replace(/var\(--stp\)/g, '#F4F7FA')}
<path d="M0,120 H180 V170 H0 Z" ${SNOW}/>${xtree(90, 156, 50)}${at(34, 156, 1, STALL)}${at(146, 156, 1, STALL)}${dots([[10, 60, 1.2], [70, 50, 1.2], [120, 64, 1.2], [160, 80, 1.2], [26, 94, 1.2], [96, 30, 1]], STAR)}${at(64, 164, 0.7, PERSON)}${at(118, 164, 0.7, PERSON)}`
	],
	// Lettland: Riga mit Petrikirche an der Daugava – Strand von Jūrmala mit Kiefern – Freiheitsdenkmal mit Blumen
	LV: [
		() => `${sun(150, 26, 9)}${birds(94, 30)}${gables(4, 118, 4, 14)}${steeple(80, 118, 96)}${gables(96, 118, 5, 14)}<path d="M0,118 H180" stroke-width="2"/>${sea(122)}<path d="M20,140 H60 M110,138 H160" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(148, 28, 10)}${rays(148, 28, 10)}${birds(130, 26)}${cloud(116, 54)}${at(90, 150, 1.12, MILDA)}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,150 H180" stroke-width="2"/>
${bush(18, 150, 10)}${bush(38, 150, 7, L2)}${bush(150, 150, 9)}${bush(168, 150, 7, L2)}${[[64, 162], [72, 166], [108, 162], [116, 166], [80, 168], [100, 168]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" ${SOLID}/><circle cx="${x}" cy="${y}" r="1" ${PAPER}/>`).join('')}`
	],
	// Litauen: Gediminas-Turm über Vilnius – Kurische Nehrung mit Elch – Burg Trakai mit Ballons im Abendrot
	LT: [
		() => `${sun(150, 26, 9)}${birds(106, 30)}<path d="M20,170 Q30,100 90,96 Q150,100 160,170 Z" ${L2} stroke-width="2"/>${pine(40, 140, 22)}${pine(140, 140, 20)}${pine(56, 120, 16, L4)}${pine(124, 122, 16, L4)}
${at(90, 98, 1, `<path d="M-14,0 V-30 H14 V0 Z" ${SNOW} stroke-width="1.4"/><path d="M-16,-30 v-4 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 v4 Z" ${SNOW} stroke-width="1.1"/><path d="M-4,-30 V-40 M-4,-40 h10 l-2,3 l2,3 h-10" stroke-width="1.2"/><rect x="-6" y="-24" width="4" height="6" ${SOLID}/><rect x="3" y="-24" width="4" height="6" ${SOLID}/>`)}`,
		null,
		() => `${sun(90, 98, 16)}${rays(90, 98, 16, 14)}${[[40, 54, 1], [126, 40, 0.8], [150, 70, 0.6], [64, 30, 0.6]].map(([x, y, s], i) => at(x, y, s, balloon([L3, SNOW, L2, L4][i]))).join('')}
<path d="M40,112 V86 H120 V112" ${L3} stroke-width="1.3"/>${rtower(46, 86, 10, 12, L3)}${rtower(114, 86, 10, 12, L3)}<path d="M70,112 V70 H90 V112" ${SNOW} stroke-width="1.3"/><path d="M68,70 L80,56 L92,70 Z" ${SOLID}/><path d="M92,86 L106,78 L120,86" ${SOLID}/>
<path d="M0,112 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,112 H180" stroke-width="2"/><g opacity=".3" transform="translate(0,224) scale(1,-1)"><path d="M40,112 V86 H120 V112 Z M70,86 V70 H90 V86 Z" ${L4} stroke="none"/></g><path d="${waves(10, 150, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(150, 136, 0.7, SWAN)}`
	],
	// Slowakei: Gipfel der Hohen Tatra mit Gämse – Zipser Burg – Bergsee mit Hütte, Gämsen und Edelweiß
	SK: [
		() => `${sun(150, 24, 9)}${birds(100, 28)}${alps(110)}<path d="M0,128 Q60,114 120,122 Q150,118 180,126 V170 H0 Z" ${L1} stroke-width="2"/>${at(60, 134, 1.6, CHAMOIS)}${pine(150, 140, 26)}${pine(166, 142, 20, L4)}${grass(110, 160)}`,
		null,
		() => `${sun(150, 24, 9)}${rays(150, 24, 9)}${birds(110, 26)}${alps(92, 180, L2)}<path d="M20,104 H160 Q140,120 90,120 Q40,120 20,104 Z" ${L3} stroke-width="1.6"/><g opacity=".3" transform="translate(0,208) scale(1,-1)">${alps(104, 180, L3)}</g>
<path d="M0,104 H20 M160,104 H180" stroke-width="1.6"/><path d="M0,120 Q90,112 180,122 V170 H0 Z" ${L1} stroke-width="2"/>${at(144, 136, 1, CHALET)}${at(40, 144, 1.1, CHAMOIS)}${at(66, 136, 0.7, CHAMOIS, true)}${at(110, 158, 1, EDEL)}${at(126, 164, 0.6, EDEL)}${pine(170, 140, 24)}${grass(20, 164)}`
	],
	// Ungarn: Fischerbastei – Kettenbrücke und Parlament an der Donau – Puszta mit Ziehbrunnen, Pferden und Paprika
	HU: [
		() => `${sun(150, 26, 9)}${birds(106, 26)}${cloud(100, 50)}${at(90, 132, 1.3, BASTEI)}<path d="M0,132 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,132 H180" stroke-width="2"/><path d="M0,140 Q90,150 180,140" stroke-width="1" stroke-dasharray="4 4"/>`,
		null,
		() => `${sun(148, 30, 12)}${rays(148, 30, 12)}${birds(120, 26)}<path d="M0,110 Q90,102 180,110 V170 H0 Z" ${L1} stroke-width="2"/>${at(120, 112, 1.2, WELL)}${paprika(10, 54, 6)}
${at(40, 140, 1, horse())}${at(80, 150, 0.85, horse(RIDER))}${grass(150, 150)}${grass(166, 160)}${grass(20, 160)}<path d="M100,124 Q130,118 170,124" stroke-width="1" stroke-dasharray="3 3"/>`
	],
	// Slowenien: Triglav – Bleder See mit Burg, Inselkirche und Pletna – Drachenbrücke in Ljubljana mit Burg
	SI: [
		() => `${sun(148, 28, 9)}${birds(120, 26)}<path d="M0,120 L40,70 L60,82 L90,34 L120,76 L140,64 L180,110 V170 H0 Z" ${L2} stroke-width="2"/><path d="M90,34 L82,48 L90,44 L96,52 Z M40,70 L35,78 L41,76 L44,80 Z" ${SNOW} stroke-width="1.2"/>
<path d="M90,34 L92,60 L86,90" stroke-width="1.1"/><path d="M0,130 Q90,118 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${pine(20, 140, 26)}${pine(36, 142, 18, L4)}${pine(160, 142, 24)}${at(100, 150, 1, EDEL)}`,
		null,
		() => `${sun(150, 24, 9)}${birds(106, 26)}<path d="M0,106 Q30,60 70,62 Q100,64 120,90 L130,106 Z" ${L2} stroke-width="1.8"/>${at(80, 64, 0.8, `${keep(-30, 0, 18, 20, SNOW)}<path d="M-12,0 V-18 H20 V0" ${SNOW} stroke-width="1.3"/><path d="M-14,-18 L4,-26 L22,-18 Z" ${SOLID}/>`)}
<path d="M0,106 H180 V170 H0 Z" ${L1} stroke="none"/>${charles(14, 112, 152, 4)}<path d="M14,112 H166" stroke-width="2.4"/>${at(40, 112, 0.9, DRAGON)}${at(140, 112, 0.9, DRAGON, true)}<path d="M0,134 H180 V170 H0 Z" ${L2} stroke="none"/><path d="${waves(8, 150, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Rumänien: bemaltes Kloster Voroneț – Transfăgărășan-Serpentinen – Schloss Bran bei Vollmond mit Fledermäusen
	RO: [
		() => `${sun(150, 26, 9)}${birds(106, 30)}<path d="M0,120 Q40,96 90,104 Q140,96 180,116 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 140, 1.4, VORONET)}${pine(16, 140, 26)}${pine(164, 140, 28)}${pine(150, 142, 18, L4)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/><circle cx="120" cy="50" r="26" ${STAR} fill-opacity=".9" stroke="none"/><circle cx="112" cy="44" r="4" ${STAR} fill-opacity=".6" stroke="none"/>${dots([[20, 16], [50, 30], [80, 12], [160, 18], [170, 90, 1], [30, 60, 1]], STAR)}
${at(124, 46, 0.6, BAT)}${at(150, 34, 0.45, BAT)}${at(96, 26, 0.5, BAT)}<path d="M30,170 L44,120 Q60,98 82,100 Q108,104 118,130 L126,170 Z" ${L3} stroke="none"/>
<path d="M54,106 V80 H96 V106" ${SOLID}/>${rtower(60, 80, 12, 14, SOLID)}${rtower(92, 80, 14, 22, SOLID)}<path d="M72,80 V64 H82 V80" ${SOLID}/><path d="M70,64 L77,52 L84,64 Z" ${SOLID}/>${dots([[66, 92, 1.4], [80, 96, 1.4], [88, 88, 1.4], [76, 70, 1.2]], STAR)}
${[[8, 170, 34], [22, 170, 26], [150, 170, 30], [166, 170, 38], [138, 170, 22]].map(([x, y, h]) => pine(x, y, h)).join('')}`
	],
	// Bulgarien: Alexander-Newski-Kathedrale – Rila-Kloster in den Bergen – Rosenernte im Rosental
	BG: [
		() => `${sun(150, 26, 9)}${birds(100, 30)}${cloud(10, 56)}${at(84, 140, 1.3, NEVSKI)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${bush(14, 140, 8)}${bush(166, 140, 7)}`,
		null,
		() => `${sun(140, 30, 12)}${rays(140, 30, 12)}${birds(110, 28)}<path d="M0,96 Q40,72 90,84 Q140,70 180,90" ${L1} stroke-width="1.6"/><path d="M0,104 Q90,92 180,104 V170 H0 Z" ${L1} stroke-width="2"/>
${[0, 1, 2, 3].map((r) => Array.from({ length: 6 }, (_, i) => `<path d="M${-10 + i * 36 + (r % 2) * 18},${118 + r * 14} q6,-4 12,0 q6,-4 12,0" stroke-width="1.4"/>`).join('')).join('')}${at(30, 132, 1.3, ROSE)}${at(150, 144, 1.1, ROSE)}${at(100, 156, 0.9, ROSE)}
${at(68, 126, 1, PERSON)}${at(120, 122, 0.9, PERSON)}<path d="M64,118 h10 v6 h-10 Z" ${L3} stroke-width="1"/><path d="M116,116 h9 v5 h-9 Z" ${L3} stroke-width="1"/>`
	],
	// Serbien: Pobednik über der Festung Belgrad – Festung Golubac an der Donau – Tempel des Hl. Sava im Abendlicht
	RS: [
		() => `${sun(150, 30, 9)}${birds(80, 30)}<path d="M0,120 Q60,104 120,110 Q150,108 180,116 V170 H0 Z" ${L1} stroke-width="2"/>${wall(20, 120, 124, 18)}${rtower(30, 106, 12, 10)}${at(90, 110, 1.05, POBEDNIK)}<path d="M0,140 H180 V170 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(146, 40, 12)}${rays(146, 40, 12, 16)}${birds(70, 24)}<path d="M0,100 Q90,90 180,100" stroke-width="1.2" stroke-dasharray="4 4"/>${at(90, 140, 1.3, SAVA)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${bush(14, 140, 9)}${bush(166, 140, 9)}${bush(30, 140, 6, L2)}${[[60, 156], [120, 156], [90, 164]].map(([x, y]) => at(x, y, 0.6, PERSON)).join('')}`
	],
	// Bosnien und Herzegowina: Sebilj-Brunnen mit Tauben – Kravica-Wasserfälle – Alte Brücke von Mostar mit Brückenspringer
	BA: [
		() => `${sun(150, 28, 9)}${birds(70, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.6, SEBILJ)}${[[30, 156], [46, 162], [134, 158], [150, 164], [114, 166]].map(([x, y]) => at(x, y, 1, PIGEON)).join('')}<path d="M10,120 V140 M10,124 L4,128" stroke-width="1.6"/><path d="M162,108 V140 L158,116 L166,116 Z" ${L3} stroke-width="1.2"/>`,
		null,
		() => `${sun(150, 26, 9)}${birds(80, 26)}<path d="M0,40 Q30,52 30,170 H0 Z M180,40 Q150,52 150,170 H180 Z" ${L2} stroke-width="1.8"/><path d="M8,60 L14,160 M168,60 L162,160" stroke-width="1" stroke-dasharray="6 3"/>
${at(150, 50, 0.8, MINARET)}${at(26, 70, 0.8, `<path d="M-10,0 V-14 H10 V0 Z" ${SNOW} stroke-width="1.2"/><path d="M-12,-14 L0,-22 L12,-14 Z" ${SOLID}/>`)}${mostar(44, 92, 92)}${at(90, 112, 1.4, DIVER)}<path d="M30,150 H150 V170 H30 Z" ${L2} stroke="none"/><path d="${waves(34, 156, 8, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/><path d="M84,152 q6,-6 12,0" stroke="var(--stp)" stroke-width="1.6"/>`
	],
	// Nordmazedonien: Fischerboot vor der Festung von Ohrid – Matka-Schlucht – Kirche Kaneo im Abendrot über dem See
	MK: [
		() => `${sun(150, 28, 9)}${birds(70, 30)}<path d="M0,110 Q30,60 80,58 Q110,60 126,90 L136,110 Z" ${L2} stroke-width="1.8"/>${wall(40, 110, 62, 10, SNOW)}${rtower(46, 52, 8, 8, SNOW)}${rtower(104, 52, 8, 8, SNOW)}<path d="M0,110 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,110 H180" stroke-width="2"/>${at(110, 140, 1.4, ROWBOAT)}<path d="${waves(10, 156, 11, 15, 2.4)}" stroke-width="1.4"/>`,
		null,
		() => `${sun(120, 76, 18)}${rays(120, 76, 18, 16)}${birds(150, 26)}<path d="M0,74 Q20,64 40,70 L64,96 L70,120 H0 Z" ${L3} stroke-width="2"/>${at(40, 70, 1.3, `<path d="M-12,0 V-12 H12 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-6,-12 V-18 H6 V-12" ${SNOW} stroke-width="1.2"/><path d="M-8,-18 Q0,-28 8,-18 Z" ${SOLID}/><path d="M-14,-11 L0,-15 L14,-11" stroke-width="1.4"/>`)}
<path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,120 H180" stroke-width="2"/><path d="M90,124 H150 M96,132 H144 M104,140 H136" stroke="var(--stp)" stroke-width="1.6"/>${at(60, 150, 1, ROWBOAT)}<path d="${waves(10, 162, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.2"/>`
	],
	// Moldau: Höhlenkloster Orheiul Vechi – Weinberge mit Kellereingang – Weinkeller mit Fässern und Kerzen
	MD: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,120 Q60,110 120,116 Q150,112 180,118 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 128, 1.4, ORHEI)}<path d="M0,150 Q60,138 100,150 Q140,164 180,150 V170 H0 Z" ${L2} stroke-width="1.6"/><path d="${waves(10, 162, 6, 15, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/><path d="M0,40 Q90,0 180,40 V170 H0 Z" ${L3} stroke="none"/><path d="M14,170 V60 Q90,20 166,60 V170" stroke="#F4F7FA" stroke-opacity=".3" stroke-width="2"/>
${[[30, 120, 18], [66, 120, 18], [114, 120, 18], [150, 120, 18], [48, 88, 16], [90, 86, 16], [132, 88, 16]].map(([x, y, r]) => barrel(x, y, r)).join('')}<path d="M0,140 H180 V170 H0 Z" ${SOLID}/>
${candle(90, 140)}${candle(48, 140)}${candle(132, 140)}<path d="M70,160 h10 v-14 h-10 Z" fill="#F4F7FA" fill-opacity=".25" stroke="none"/><path d="M100,166 Q104,150 112,148 L114,140 M112,148 Q120,150 122,166" stroke="#F4F7FA" stroke-opacity=".6" stroke-width="1.4"/>`
	],
	// Ukraine: Höhlenkloster in Kyjiw – Holzkirche in den Karpaten – Tunnel der Liebe bei Klewan
	UA: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,130 V170 H0 Z" ${L1} stroke-width="2"/>${at(86, 132, 1.3, LAVRA)}${bush(14, 132, 9)}${bush(170, 132, 8)}<path d="M0,150 H180" stroke-width="1" stroke-dasharray="4 4"/>`,
		null,
		() => `${sun(90, 70, 10)}<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,0 H40 Q60,60 70,96 L66,170 H0 Z M180,0 H140 Q120,60 110,96 L114,170 H180 Z" ${L3} stroke-width="1.8"/><path d="M40,0 Q90,-10 140,0 Q120,30 90,40 Q60,30 40,0 Z" ${L3} stroke-width="1.6"/>
${[[20, 30], [30, 70], [16, 110], [150, 30], [160, 76], [146, 116], [70, 14], [110, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" ${L4} stroke="none"/>`).join('')}<path d="M80,96 L60,170 M100,96 L120,170" stroke-width="2.4"/><path d="${Array.from({ length: 7 }, (_, i) => {
			const t = i / 6,
				y = 100 + t * 70,
				w = 10 + t * 30;
			return `M${f1(90 - w)},${f1(y)} H${f1(90 + w)}`;
		}).join(' ')}" stroke-width="1.6"/>${at(90, 150, 0.8, PERSON)}${at(98, 150, 0.8, PERSON)}`
	],
	// Belarus: Burg Mir – Urwald von Białowieża mit Wisenten – Burg Mir am See mit Störchen
	BY: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,134 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,134 H180" stroke-width="2"/>${at(90, 134, 1.4, MIR)}${pine(10, 136, 26)}${pine(170, 136, 30)}`,
		null,
		() => `${sun(150, 28, 9)}${rays(150, 28, 9)}${birds(80, 26)}<path d="M0,104 Q60,96 120,100 Q150,98 180,102" stroke-width="1.4"/>${at(84, 106, 1, MIR)}<path d="M0,106 H180 V170 H0 Z" ${L2} stroke="none"/><g opacity=".3" transform="translate(0,212) scale(1,-1)">${at(84, 106, 1, MIR)}</g>
<path d="${waves(10, 150, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(150, 104, 0.8, STORKNEST)}<path d="M20,60 Q28,54 36,58 Q42,54 48,60 L54,58 Q46,64 40,64 Q32,66 26,62 Z" ${SNOW} stroke-width="1.2"/><path d="M20,60 L12,62" stroke-width="1.4"/>${pine(10, 106, 22)}`
	],
	// Russland: Peter-und-Paul-Kathedrale an der Newa – Transsib am Baikalsee – Kreml und Basilius-Kathedrale in der Winternacht
	RU: [
		() => `${sun(150, 28, 9)}${birds(100, 40)}${wall(30, 150, 126, 12)}${at(90, 126, 1, NEEDLE)}<path d="M0,126 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,126 H180" stroke-width="2"/><path d="${waves(10, 146, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 20], [100, 10], [150, 16], [170, 44, 1], [80, 40, 1], [130, 36, 1]], STAR)}${wall(0, 70, 130, 18, L3)}${at(34, 112, 1, SPASSKI)}${at(118, 130, 1.2, BASIL)}
<path d="M0,130 H180 V170 H0 Z" ${SNOW}/><path d="M0,130 H180" stroke-width="1.6"/>${dots([[20, 90, 1.2], [60, 70, 1.2], [96, 98, 1.2], [160, 74, 1.2], [140, 104, 1], [8, 120, 1]], STAR)}${at(80, 156, 0.7, PERSON)}${at(140, 160, 0.7, PERSON)}`
	],
	// Kosovo: Kloster Gračanica – Rugova-Schlucht – Prizren bei Nacht mit Brücke und Festung
	XK: [
		() => `${sun(150, 28, 9)}${birds(70, 30)}<path d="M0,136 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,136 H180" stroke-width="2"/>${at(90, 136, 1.5, GRACANICA)}${cypress(20, 138, 36)}${cypress(160, 138, 30)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [140, 10], [170, 34], [80, 40, 1], [120, 44, 1]], STAR)}<path d="M150,18 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${STAR} stroke="none"/>
<path d="M0,90 Q30,50 70,54 Q100,58 116,90 Z" ${L3} stroke="none"/>${wall(30, 100, 60, 10, L3)}<path d="M120,120 V100 A10,10 0 0 1 140,100 V120 Z" ${SOLID}/><path d="M148,120 V70 L150,60 L152,70 V120 Z" ${SOLID}/>
<path d="M0,120 H180 V170 H0 Z" ${L3} stroke="none"/><path d="M20,124 Q60,80 100,124 H92 Q60,96 28,124 Z" ${SOLID}/>${dots([[40, 64, 1.2], [64, 62, 1.2], [90, 66, 1.2], [130, 108, 1.2], [150, 80, 1]], STAR)}<path d="${waves(10, 150, 11, 15, 2.4)}" stroke="#F4F7FA" stroke-opacity=".45" stroke-width="1.4"/>`
	],
	// Grönland: Eisberge im Fjord mit Walflosse – bunte Häuser von Ilulissat – Hundeschlitten unter dem Polarlicht
	GL: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,84 L30,60 L56,72 L80,50 L110,74 L140,58 L180,80 V96 H0 Z" ${L1} stroke-width="1.6"/>${at(56, 116, 1.3, ICEBERG)}${at(140, 112, 0.7, ICEBERG)}${sea(116)}${at(114, 138, 1.1, FLUKE)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40, 1], [80, 40, 1], [130, 36, 1]], STAR)}<path d="M0,58 Q50,20 100,44 Q140,64 180,30 V58 Q140,92 100,74 Q50,50 0,88 Z" ${STAR} fill-opacity=".22" stroke="none"/><path d="${Array.from({ length: 24 }, (_, i) => `M${4 + i * 7.4},${f1(50 - 16 * Math.sin((i / 23) * Math.PI * 1.4) + 4 * Math.sin(i * 1.3))} v${14 + (i % 4) * 5}`).join(' ')}" stroke="#F4F7FA" stroke-opacity=".5" stroke-width="2"/>
${at(140, 118, 1, ICEBERG)}<path d="M0,118 H180 V170 H0 Z" ${SNOW}/><path d="M0,118 H180" stroke-width="1.4"/>${at(30, 150, 1.1, DOGSLED)}<path d="M20,152 Q90,144 170,156" stroke-width="1" stroke-dasharray="3 3"/>`
	],
	// Färöer: Kirche mit Grasdach – Sørvágsvatn über den Klippen – Felsnadeln, Papageitaucher und Schafe
	FO: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,110 L40,60 L80,76 L120,50 L180,96 V170 H0 Z" ${L2} stroke-width="1.8"/>${at(90, 132, 1.5, `${GRASSHUT}<path d="M10,-11 V-24 H16 V-11" ${L3} stroke-width="1.1"/><path d="M9,-24 L13,-30 L17,-24 Z" ${SOLID}/>`)}<path d="M0,132 Q90,124 180,134 V170 H0 Z" ${L1} stroke-width="2"/>${at(40, 150, 0.9, SHEEP)}${at(140, 154, 0.8, SHEEP, true)}`,
		null,
		() => `${sun(130, 30, 9)}${birds(70, 26)}${birds(150, 54, 0.7)}<path d="M0,44 Q40,40 70,54 L80,170 H0 Z" ${L3} stroke-width="2"/><path d="M14,52 V160 M34,50 V160 M54,56 V160" stroke-width="1" stroke-dasharray="6 3"/><path d="M0,44 Q40,40 70,54" stroke-width="3"/>${at(28, 44, 0.8, SHEEP)}${at(54, 50, 0.6, SHEEP)}
${sea(110)}${at(130, 110, 1.1, STACKS)}<path d="M70,110 Q86,96 104,104 L110,110" ${L2} stroke-width="1.4"/>${at(86, 98, 0.8, PUFFIN)}${at(100, 102, 0.6, PUFFIN, true)}<path d="M120,136 q6,-4 12,0 M150,150 q6,-4 12,0" stroke="var(--stp)" stroke-width="1.6"/>`
	],
	// Åland: rotes Bootshaus und Bockwindmühle – Schären mit Segelbooten – Viermastbark Pommern im Abendrot
	AX: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,118 Q40,100 90,108 Q140,100 180,112 V124 H0 Z" ${L2} stroke-width="1.6"/>${at(120, 110, 1.6, POSTMILL)}${at(56, 126, 1.4, BOATHOUSE)}${pine(16, 112, 26)}${pine(170, 112, 22)}<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,124 H180" stroke-width="2"/><path d="${waves(10, 150, 11, 15, 2.4)}" stroke-width="1.4"/>`,
		null,
		() => `${sun(90, 92, 18)}${rays(90, 92, 18, 16)}${birds(140, 24)}<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="2"/>
${at(90, 140, 1.25, `<path d="M-50,-8 H50 L42,6 H-44 Z" ${SOLID}/><path d="M-40,-2 H38" stroke="var(--stp)" stroke-width="1.2" stroke-dasharray="3 3"/>${[-32, -12, 8, 28].map((x) => `<path d="M${x},-8 V-72" stroke-width="1.6"/><path d="M${x - 8},-66 H${x + 8} L${x + 9},-56 H${x - 9} Z M${x - 9},-53 H${x + 9} L${x + 10},-42 H${x - 10} Z M${x - 10},-39 H${x + 10} V-28 H${x - 10} Z M${x - 10},-25 H${x + 10} V-14 H${x - 10} Z" ${SNOW} stroke-width="1"/>`).join('')}<path d="M-50,-8 L-60,-24 M28,-72 L56,-10" stroke-width="1"/>`)}
<path d="M10,152 H50 M120,156 H170" stroke="var(--stp)" stroke-width="1.6"/><path d="M0,108 L20,102 L30,108 Z M150,108 L166,100 L180,106 V108 Z" ${SOLID}/>`
	],
	// Guernsey: Little Chapel – Hafen von St. Peter Port mit Castle Cornet – Kuh auf der Klippe über dem Meer
	GG: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 2, LITCHAPEL)}${bush(20, 140, 10)}${bush(160, 140, 12)}${bush(40, 140, 6, L2)}`,
		null,
		() => `${sun(130, 70, 16)}${rays(130, 70, 16, 16)}${birds(150, 24)}<path d="M0,70 Q40,64 80,80 L100,170 H0 Z" ${L2} stroke-width="2"/><path d="M0,70 Q40,64 80,80" stroke-width="3"/>${at(40, 70, 0.9, ALPCOW)}${[[14, 92], [24, 100], [60, 96], [30, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" ${L3} stroke="none"/>`).join('')}
${sea(110).replace('M0,110 H180', 'M84,110 H180')}<path d="M84,110 H180 V170 H84 Z" ${L2} stroke="none"/><path d="${waves(90, 130, 6, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(150, 112, 0.7, LIGHTHOUSE)}<path d="M140,112 Q150,104 160,112 Z" ${L3} stroke-width="1.2"/>`
	],
	// Isle of Man: TT-Rennfahrer – Peel Castle auf der Insel – Laxey Wheel mit Manx-Katze
	IM: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,110 Q40,90 90,100 Q140,90 180,104 V170 H0 Z" ${L1} stroke-width="2"/><path d="M0,150 Q90,130 180,150" stroke-width="16" stroke-opacity=".2"/><path d="M0,150 Q90,130 180,150" stroke="var(--stp)" stroke-width="1.4" stroke-dasharray="6 5"/>${at(96, 142, 1.5, MOTO)}${bush(20, 108, 8)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(80, 26)}${at(76, 140, 1, `<path d="M-60,0 V-8 H52 V0" ${L2} stroke-width="1.4"/><path d="M-44,-8 V-18 H-4 V-8 M-24,-18 V-26 H-4 V-18" ${SNOW} stroke-width="1.2"/>`)}
<path d="M120,140 V100 H160 V140" ${L1} stroke-width="1.3"/><path d="M138,100 V60 H146 V100" ${L1} stroke-width="1.3"/><path d="M136,60 L142,52 L148,60 Z" ${SOLID}/>${at(78, 132, 1, `<g transform="translate(0,-48)">${'<circle r="44" stroke-width="2.6"/><circle r="38" stroke-width="1.2"/>' + Array.from({ length: 12 }, (_, i) => {
			const a = (i * Math.PI) / 6;
			return `<path d="M${f1(6 * Math.cos(a))},${f1(6 * Math.sin(a))} L${f1(42 * Math.cos(a))},${f1(42 * Math.sin(a))}" stroke-width="1.4"/>`;
		}).join('') + `<circle r="6" ${SOLID}/>`}</g>`)}
<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(30, 158, 1.3, MANX)}${grass(150, 160)}`
	],
	// Jersey: Mont Orgueil über Gorey – Leuchtturm La Corbière mit Damm – La Corbière im Sonnenuntergang mit Gezeitenpools
	JE: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M20,124 Q30,70 80,62 Q120,60 140,100 L150,124 Z" ${L2} stroke-width="1.8"/>${at(80, 66, 1, `${keep(-30, 0, 18, 22, SNOW)}<path d="M-12,0 V-30 H20 V0" ${SNOW} stroke-width="1.3"/><path d="M-12,-30 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4" stroke-width="1.2"/>${keep(20, 0, 14, 16, SNOW)}`)}
${sea(124)}${at(30, 128, 0.8, `<path d="M-10,0 V-10 H10 V0 Z" ${SNOW} stroke-width="1"/><path d="M-12,-10 L0,-16 L12,-10 Z" ${SOLID}/>`)}<path d="M130,140 H160 L156,144 H134 Z" ${SOLID}/>`,
		null,
		() => `${sun(120, 80, 22)}${rays(120, 80, 22, 18)}${birds(150, 24)}<path d="M0,96 H180" stroke-width="1.6"/><path d="M0,96 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M96,104 H150 M104,112 H142 M112,120 H134" stroke="var(--stp)" stroke-width="1.6"/>
<path d="M30,100 Q40,84 58,86 Q72,88 74,100 Z" ${SOLID}/>${at(54, 86, 1.1, LIGHTHOUSE)}<path d="M74,100 Q120,110 180,140" stroke-width="3"/><path d="M74,100 Q120,110 180,140" stroke="var(--stp)" stroke-width="1" stroke-dasharray="2 3"/>
${[[30, 140, 20, 6], [80, 150, 26, 7], [140, 160, 22, 5]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ${SNOW} stroke-width="1.3"/>`).join('')}${at(30, 140, 0.5, SHELL)}`
	],
	// Spitzbergen: Walross auf der Scholle – bunte Häuser von Longyearbyen – Eisbärin mit Jungem unter dem Polarlicht
	SJ: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,90 L30,60 L60,76 L96,46 L130,70 L180,56 V100 H0 Z" ${SNOW} stroke-width="1.6"/>${sea(120)}<path d="M30,122 L40,112 H130 L140,122 Z" ${SNOW} stroke-width="1.4"/>${at(84, 114, 1.4, WALRUS)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40, 1], [80, 40, 1], [130, 36, 1]], STAR)}<path d="M0,66 Q50,24 100,50 Q140,70 180,34 V62 Q140,96 100,78 Q50,54 0,96 Z" ${STAR} fill-opacity=".22" stroke="none"/><path d="${Array.from({ length: 24 }, (_, i) => `M${4 + i * 7.4},${f1(56 - 18 * Math.sin((i / 23) * Math.PI * 1.4) + 4 * Math.sin(i * 1.3))} v${14 + (i % 4) * 5}`).join(' ')}" stroke="#F4F7FA" stroke-opacity=".5" stroke-width="2"/>
<path d="M0,116 H180 V170 H0 Z" ${SNOW}/><path d="M0,116 H180" stroke-width="1.4"/>${at(84, 150, 1.6, `<path d="M-28,0 V-8 Q-30,-20 -16,-22 Q0,-26 14,-22 Q20,-20 22,-16 L30,-16 Q36,-14 34,-9 L26,-8 L24,0 H18 L17,-7 H-10 L-12,0 H-18 L-19,-6 Q-24,-6 -22,0 Z" ${SNOW} stroke-width="1.5"/><circle cx="22" cy="-19" r="1.8" ${SNOW} stroke-width="1"/><circle cx="27" cy="-13" r="1" ${SOLID}/><circle cx="34" cy="-11" r="1.2" ${SOLID}/>`)}${at(138, 152, 0.8, `<path d="M-28,0 V-8 Q-30,-20 -16,-22 Q0,-26 14,-22 Q20,-20 22,-16 L30,-16 Q36,-14 34,-9 L26,-8 L24,0 H18 L17,-7 H-10 L-12,0 H-18 L-19,-6 Q-24,-6 -22,0 Z" ${SNOW} stroke-width="1.5"/><circle cx="22" cy="-19" r="1.8" ${SNOW} stroke-width="1"/><circle cx="27" cy="-13" r="1" ${SOLID}/><circle cx="34" cy="-11" r="1.2" ${SOLID}/>`)}`
	],
	// Türkei: Hagia Sophia – Kalkterrassen von Pamukkale – Kappadokien bei Sonnenaufgang mit vielen Ballons
	TR: [
		() => `${sun(150, 28, 9)}${birds(80, 30)}<path d="M0,136 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,136 H180" stroke-width="2"/>${at(90, 136, 1.4, MOSQUE)}<path d="M0,150 H180" stroke-width="1" stroke-dasharray="4 4"/>`,
		null,
		() => `${sun(90, 100, 16)}${rays(90, 100, 16, 16)}${[[30, 56, 0.9], [70, 40, 0.7], [120, 50, 1.1], [150, 30, 0.6], [100, 22, 0.5], [160, 76, 0.7], [50, 84, 0.6]].map(([x, y, s], i) => at(x, y, s, balloon([L3, SNOW, L2, L4, SOLID][i % 5]))).join('')}
<path d="M0,120 Q40,104 90,112 Q140,104 180,116 V170 H0 Z" ${L2} stroke-width="2"/>${chimney(20, 140, 34)}${chimney(36, 144, 26)}${chimney(140, 140, 36)}${chimney(158, 146, 28)}${chimney(122, 150, 20)}<path d="M0,150 Q90,142 180,154 V170 H0 Z" ${L3} stroke-width="1.6"/>`
	],
	// Georgien: Festung Narikala über den Balkonen von Tiflis – Wehrtürme von Uschguli – Gergeti-Kirche unter dem Kasbek im Abendrot
	GE: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q30,70 80,62 Q120,60 140,90 L150,110 Z" ${L2} stroke-width="1.8"/>${wall(40, 100, 64, 10, SNOW)}${rtower(44, 54, 8, 10, SNOW)}${rtower(96, 54, 10, 14, SNOW)}<path d="M0,110 H180 V170 H0 Z" ${L1} stroke="none"/>
${balcony(10, 138, 34)}${balcony(56, 134, 30)}${balcony(100, 140, 36)}${balcony(144, 136, 30)}<path d="M10,138 V170 M44,138 V170 M56,134 V170 M86,134 V170 M100,140 V170 M136,140 V170 M144,136 V170 M174,136 V170" stroke-width="1.2"/>`,
		null,
		() => `${sun(140, 50, 14)}${rays(140, 50, 14, 16)}${birds(80, 24)}<path d="M20,104 L70,30 Q80,22 90,30 L150,104 Z" ${L1} stroke-width="1.8"/><path d="M70,30 Q80,22 90,30 L100,46 L90,42 L82,52 L74,42 L64,46 Z" ${SNOW} stroke-width="1.2"/>
<path d="M0,120 Q40,96 90,104 Q140,96 180,112 V170 H0 Z" ${L2} stroke-width="2"/>${at(90, 104, 1.2, GERGETI)}${at(30, 146, 1, horse())}${at(120, 150, 0.8, SHEEP)}${at(146, 156, 0.7, SHEEP)}${grass(80, 160)}`
	],
	// Armenien: Kloster Tatew am Felsen – Chor Virap vor dem Ararat – Tempel von Garni im Morgenlicht mit Granatäpfeln
	AM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,90 Q40,80 70,96 L90,170 H0 Z M180,80 Q140,84 120,104 L106,170 H180 Z" ${L3} stroke-width="1.8"/>${at(40, 86, 1.1, ARMCH)}${wall(16, 64, 92, 8, SNOW)}<path d="M90,170 Q98,130 106,170" ${L1} stroke-width="1.4"/>${pine(150, 104, 18)}${pine(164, 108, 22)}`,
		null,
		() => `${sun(130, 40, 10)}${rays(130, 40, 10, 16)}${birds(80, 24)}${ARARAT(112)}<path d="M0,112 Q90,104 180,114 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 124, 1.4, GARNI)}
${at(30, 156, 1.1, POMEGRANATE)}${at(48, 160, 0.8, POMEGRANATE)}${at(150, 158, 1, POMEGRANATE)}${grass(120, 160)}${grass(10, 164)}`
	],
	// Aserbaidschan: Jungfrauenturm in Baku – Flame Towers und Uferpromenade – Yanar Dağ und Flame Towers bei Nacht
	AZ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${wall(10, 70, 140, 14)}${at(90, 140, 1.4, MAIDEN)}${wall(120, 170, 140, 14)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40, 1], [80, 40, 1]], STAR)}${at(120, 110, 1.3, flames(70, `fill="#F7E3A1" fill-opacity=".85" stroke="#F7E3A1"`))}<path d="M0,110 H180" stroke-width="1.4"/>
<path d="M0,170 V130 Q30,110 60,124 Q80,134 90,170 Z" ${SOLID}/>${[14, 26, 38, 50, 62].map((x, i) => `<path d="M${x - 6},${130 + (i % 2) * 4} Q${x - 4},${116 - (i % 3) * 6} ${x},${110 - (i % 3) * 6} Q${x + 4},${118} ${x + 6},${130 + (i % 2) * 4} Z" fill="#F7E3A1" fill-opacity=".85" stroke="none"/>`).join('')}
<path d="M90,170 V140 H180 V170 Z" ${L4} stroke="none"/><path d="${waves(96, 154, 6, 14, 2.4)}" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="1.4"/>`
	],
	// Israel: Masada am Toten Meer – Strand und Skyline von Tel Aviv – Ramon-Krater mit Steinböcken unter den Sternen
	IL: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${MASADA(124)}<path d="M0,124 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,124 H180" stroke-width="2"/><path d="M20,140 h30 M100,146 h40" stroke="var(--stp)" stroke-width="2"/>${dots([[60, 150, 2], [130, 136, 2.4], [80, 160, 1.6]], SNOW)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1], [20, 60, 1], [160, 70, 1], [110, 56, 1]], STAR)}<path d="M40,30 Q90,20 160,50" stroke="#F4F7FA" stroke-opacity=".25" stroke-width="12"/>
<path d="M0,96 L30,100 L60,96 L90,102 L120,94 L150,100 L180,96 V170 H0 Z" ${L3} stroke="none"/><path d="M10,170 Q20,124 90,122 Q160,124 170,170 Z" ${L4} stroke="none"/><path d="M30,140 Q60,132 90,136 Q120,130 150,140" stroke="#F4F7FA" stroke-opacity=".3" stroke-width="1.2"/>
${at(30, 100, 1.2, IBEX)}${at(130, 98, 0.9, IBEX, true)}`
	],
	// Jordanien: Wadi Rum mit Kamel – Kloster Ad-Deir in Petra – Schatzhaus von Petra bei Nacht mit Kerzen
	JO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(70, 128, 1.4, RUMROCK)}${at(150, 128, 0.8, RUMROCK)}<path d="M0,128 Q90,120 180,130 V170 H0 Z" ${L1} stroke-width="2"/>${at(110, 152, 1.1, CAMEL)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[150, 12], [170, 30, 1], [130, 26, 1]], STAR)}<path d="M0,0 H40 Q46,60 40,170 H0 Z M180,0 H140 Q134,60 140,170 H180 Z" ${SOLID}/>${at(90, 138, 1.15, PETRA(true))}
<path d="M0,138 H180 V170 H0 Z" ${L4} stroke="none"/>${Array.from({ length: 30 }, (_, i) => candle(14 + (i % 10) * 17 + ((i / 10) | 0) * 6, 148 + ((i / 10) | 0) * 8)).join('')}`
	],
	// Libanon: Säulen von Baalbek – Hafen von Byblos – Zedern Gottes im Schnee
	LB: [
		() => `${sun(150, 26, 9)}${birds(100, 30)}${at(90, 140, 1.4, BAALBEK)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${grass(20, 160)}${grass(160, 158)}`,
		null,
		() => `${sun(140, 30, 9)}${rays(140, 30, 9)}${birds(80, 24)}${alps(96, 180, L1)}<path d="M0,112 Q90,100 180,114 V170 H0 Z" ${SNOW} stroke-width="2"/>${at(90, 150, 1.6, CEDAR)}${at(40, 130, 1, CEDAR)}${at(150, 132, 1.1, CEDAR)}
<path d="M64,128 Q90,124 116,128 M50,140 Q90,136 130,140" stroke="var(--stp)" stroke-width="2"/>${dots([[30, 70, 1.4], [60, 50, 1.4], [120, 64, 1.4], [160, 84, 1.4], [100, 90, 1.4]], SNOW)}`
	],
	// Saudi-Arabien: Felsgrab von Hegra – AlUla mit dem Spiegelbau Maraya – Wüstennacht mit Karawane und Elefantenfelsen
	SA: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,132 Q90,124 180,134 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 134, 1.4, HEGRA)}${palm(20, 150, 30, 4)}${palm(164, 150, 26, -4)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[20, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1], [40, 30, 1], [110, 60, 1]], STAR)}<path d="M152,22 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${STAR} stroke="none"/>
${at(120, 120, 1, ELEROCK)}<path d="M0,120 Q60,104 120,116 Q150,110 180,118 V170 H0 Z" ${L3} stroke="none"/><path d="M0,140 Q50,128 100,138 Q140,130 180,140 V170 H0 Z" ${L4} stroke="none"/>
${at(30, 140, 0.8, CAMEL_RIDER)}${at(60, 138, 0.7, CAMEL)}${at(86, 136, 0.6, CAMEL)}`
	],
	// Vereinigte Arabische Emirate: Scheich-Zayid-Moschee – Skyline von Dubai mit Burj al Arab – Wüste mit Falke vor dem Burj Khalifa
	AE: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,134 H180" stroke-width="2"/>${at(90, 134, 1.3, ZAYED)}<path d="M20,148 H160" stroke="var(--stp)" stroke-width="3"/><path d="M20,148 H160" stroke-width="1"/>`,
		null,
		() => `${sun(90, 70, 16)}${rays(90, 70, 16, 16)}${at(70, 112, 1, khalifa(96))}${at(100, 112, 0.6, khalifa(50))}<path d="M0,112 Q30,96 70,106 Q120,94 180,108 V170 H0 Z" ${L2} stroke-width="2"/><path d="M0,136 Q60,120 110,134 Q150,124 180,132 V170 H0 Z" ${L3} stroke-width="1.6"/>
${at(130, 46, 1.4, FALCON)}${at(150, 150, 0.8, CAMEL)}${at(40, 156, 0.7, CAMEL)}`
	],
	// Katar: Museum für Islamische Kunst – Skyline von Doha mit Dauen – Binnenmeer Khor al-Adaid mit Oryx und Falke
	QA: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,126 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,126 H180" stroke-width="2"/>${at(90, 126, 1.6, MIA)}<g opacity=".3" transform="translate(0,252) scale(1,-1)">${at(90, 126, 1.6, MIA)}</g>${palm(20, 126, 30, 4)}${palm(160, 126, 26, -4)}`,
		null,
		() => `${sun(130, 40, 12)}${rays(130, 40, 12, 16)}${at(60, 50, 1.2, FALCON)}<path d="M0,96 Q40,72 90,84 Q140,74 180,90 V110 H0 Z" ${L2} stroke-width="1.8"/><path d="M0,110 H180 V136 H0 Z" ${L1} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/><path d="${waves(20, 124, 10, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>
<path d="M0,136 Q60,126 120,134 Q150,130 180,136 V170 H0 Z" ${L3} stroke-width="1.8"/>${at(60, 160, 1.4, ORYX)}${at(130, 156, 1, ORYX, true)}`
	],
	// Oman: Fort von Nizwa – Wadi Shab mit Palmen und Becken – Weihrauchbaum und Dau im Abendrot
	OM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 Q90,126 180,136 V170 H0 Z" ${L1} stroke-width="2"/>${at(80, 136, 1.4, NIZWA)}${palm(20, 150, 34, 4)}${palm(164, 150, 30, -4)}${palm(150, 150, 22, 3)}`,
		null,
		() => `${sun(90, 90, 18)}${rays(90, 90, 18, 16)}${birds(140, 24)}<path d="M0,104 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,104 H180" stroke-width="2"/>${at(120, 128, 1.1, `<path d="M-30,-6 Q0,8 34,-10 L28,2 Q0,8 -24,2 Z" ${SOLID}/><path d="M0,-4 V-50" stroke-width="1.6"/><path d="M-24,-44 Q6,-56 22,-10 L0,-8 Z" ${SNOW} stroke-width="1.3"/>`)}
<path d="M0,120 Q20,104 50,108 L60,170 H0 Z" ${L3} stroke-width="1.6"/>${at(26, 110, 1.3, FRANK)}<path d="M40,104 q-3,-6 0,-12 q3,-6 0,-12" stroke-width="1.2"/><path d="${waves(70, 150, 7, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Bahrain: Baum des Lebens in der Wüste – Skyline von Manama mit Dau – Perlentaucher zwischen Austern
	BH: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,132 Q90,124 180,134 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 134, 1.6, TREELIFE)}<path d="M20,150 Q60,144 90,150 Q130,156 160,148" stroke-width="1" stroke-dasharray="3 3"/>`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M40,0 L60,90 M90,0 L96,100 M140,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke="var(--stp)" stroke-width="1.6"/>
${at(90, 90, 2, DIVERP)}<path d="M100,30 v-6 M104,40 v-4 M98,20 v-3" stroke="var(--stp)" stroke-width="1.6"/><path d="M0,150 Q30,134 60,144 Q100,132 130,146 Q160,136 180,144 V170 H0 Z" ${L3} stroke-width="1.6"/>
${[[40, 146], [80, 150], [130, 148]].map(([x, y]) => `<path d="M${x - 10},${y} Q${x},${y - 12} ${x + 10},${y} Q${x},${y + 4} ${x - 10},${y} Z" ${SOLID}/><circle cx="${x}" cy="${y - 2}" r="2.6" ${SNOW}/>`).join('')}<path d="M150,170 Q148,150 156,136 M160,170 Q164,154 172,146" stroke-width="2"/>`
	],
	// Kuwait: Befreiungsturm – Kuwait Towers am Golf – Kuwait Towers im Abendrot mit Dau und Möwen
	KW: [
		() => `${sun(150, 26, 9)}${birds(100, 30)}<path d="M0,144 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,144 H180" stroke-width="2"/>${at(90, 144, 1.2, LIBTOWER)}${[[30, 30], [46, 44], [130, 36], [148, 50]].map(([x, h], i) => `<path d="M${x - 6},144 V${144 - h} H${x + 6} V144" ${[L1, L2][i % 2]} stroke-width="1.1"/>`).join('')}`,
		null,
		() => `${sun(130, 96, 16)}${rays(130, 96, 16, 16)}${birds(150, 26)}${birds(110, 44, 0.7)}${at(56, 116, 1, `<path d="M0,0 V-92 M24,0 V-66 M44,0 V-36" stroke-width="3"/><circle cx="0" cy="-48" r="13" ${SOLID}/><circle cx="0" cy="-74" r="7" ${SOLID}/><circle cx="24" cy="-36" r="11" ${SOLID}/>${dots([[-6, -52, 1], [0, -44, 1], [6, -50, 1], [-4, -40, 1], [20, -38, 1], [28, -32, 1], [24, -40, 1]], PAPER)}`)}
<path d="M0,116 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,116 H180" stroke-width="2"/>${at(130, 140, 0.9, `<path d="M-30,-6 Q0,8 34,-10 L28,2 Q0,8 -24,2 Z" ${SOLID}/><path d="M0,-4 V-40" stroke-width="1.6"/><path d="M-20,-36 Q6,-46 20,-10 L0,-8 Z" ${SNOW} stroke-width="1.3"/>`)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Palästinensische Gebiete: Olivenernte – Hügel mit Olivenhainen und Steindorf – Olivenbaum, Tauben und Stickmuster
	PS: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,136 Q90,128 180,138 V170 H0 Z" ${L1} stroke-width="2"/>${at(80, 138, 1.6, OLIVETREE)}<path d="M120,150 h22 l-3,12 h-16 Z" ${L3} stroke-width="1.3"/>${dots([[126, 148, 2], [132, 146, 2], [138, 148, 2]])}${at(150, 160, 1, PERSON)}`,
		null,
		() => `${sun(130, 30, 10)}${rays(130, 30, 10)}${at(90, 132, 1.8, OLIVETREE)}<path d="M0,132 Q90,124 180,134 V140 H0 Z" ${L1} stroke-width="2"/><path d="M0,144 H180 V170 H0 Z" ${L3} stroke="none"/>${tatreez(4, 157, 12, 1.07)}
${at(40, 60, 1, `<path d="M0,0 Q-6,-6 -14,-4 Q-6,-2 -2,2 Q4,4 10,0 L14,-2 L10,-4 Q6,-8 0,0 Z" ${SNOW} stroke-width="1.2"/>`)}${at(150, 80, 0.8, `<path d="M0,0 Q-6,-6 -14,-4 Q-6,-2 -2,2 Q4,4 10,0 L14,-2 L10,-4 Q6,-8 0,0 Z" ${SNOW} stroke-width="1.2"/>`, true)}`
	],
	// Irak: Ischtar-Tor – Schilfhäuser in den Marschen – (Legendary: bisheriges Bild)
	IQ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,136 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,136 H180" stroke-width="2"/>${at(90, 136, 1.4, ISHTAR)}${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		SCENES.IQ
	],
	// Iran: Asadi-Turm – Brücke Si-o-se-pol in Isfahan – (Legendary: bisheriges Bild)
	IR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,134 H180" stroke-width="2"/>${at(90, 134, 1.5, AZADI)}${alps(134, 180, 'fill="none"').replace(/stroke-width="1.8"/, 'stroke-width="1" stroke-opacity=".5"')}`,
		null,
		SCENES.IR
	],
	// Syrien: Römisches Theater von Bosra – Krak des Chevaliers – (Legendary: bisheriges Bild)
	SY: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M10,140 V96 Q90,40 170,96 V140 Z" ${L2} stroke-width="1.8"/>${[0, 1, 2, 3, 4, 5].map((r) => `<path d="M${22 + r * 9},${136 - r * 2} Q90,${70 + r * 9} ${158 - r * 9},${136 - r * 2}" stroke-width="1.4"/>`).join('')}<path d="M60,140 V124 H120 V140" ${SNOW} stroke-width="1.3"/>${[66, 78, 90, 102, 114].map((x) => `<path d="M${x},140 V126" stroke-width="2"/>`).join('')}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>`,
		null,
		SCENES.SY
	],
	// Jemen: Bergdorf Al-Hadschara über Kaffeeterrassen – Sokotra mit Drachenblutbäumen – (Legendary: bisheriges Bild)
	YE: [
		() => `${sun(150, 26, 9)}${birds(70, 40)}<path d="M0,170 V120 L40,80 L70,46 Q80,38 90,46 L130,90 L180,110 V170 Z" ${L2} stroke-width="1.8"/>${Array.from({ length: 7 }, (_, k) => `<path d="M${46 + k * 5},${80 - k * 4} h${8 - k}" stroke="none"/>`).join('')}
${[[62, 46], [72, 42], [82, 44], [92, 48], [68, 54], [86, 56]].map(([x, y], k) => `<path d="M${x - 5},${y} V${y - 12} H${x + 5} V${y}" ${[SNOW, L1][k % 2]} stroke-width="1"/><rect x="${x - 2}" y="${y - 9}" width="1.8" height="2.4" ${SOLID}/><rect x="${x + 1}" y="${y - 9}" width="1.8" height="2.4" ${SOLID}/>`).join('')}
${[0, 1, 2, 3, 4, 5].map((r) => `<path d="M0,${124 + r * 8} Q60,${104 + r * 9} 120,${116 + r * 8} T180,${124 + r * 7}" stroke-width="1.4"/>`).join('')}${dots([[30, 140, 1.6], [50, 132, 1.6], [110, 136, 1.6], [140, 148, 1.6], [80, 150, 1.6]], SOLID)}`,
		null,
		SCENES.YE
	],
	// Kasachstan: Tscharyn-Canyon – Steppe mit Adlerjäger und Jurten – Astana bei Nacht mit Bajterek und Khan Schatyr
	KZ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V70 Q20,60 30,74 L40,64 Q52,58 60,72 L66,170 Z M180,170 V66 Q160,56 150,72 L140,60 Q128,58 122,72 L114,170 Z" ${L3} stroke-width="1.8"/><path d="M10,80 V160 M24,76 V160 M40,70 V160 M54,76 V160 M170,74 V160 M156,72 V160 M140,66 V160 M126,76 V160" stroke-width="1" stroke-dasharray="6 3"/><path d="M66,170 Q90,140 114,170" ${L1} stroke-width="1.4"/><path d="M76,160 Q90,150 104,160" stroke="var(--stp)" stroke-width="2"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40, 1], [80, 40, 1], [130, 36, 1]], STAR)}${at(130, 140, 1.2, KHANSH)}${[[20, 50], [36, 64], [150, 40], [164, 56], [58, 36]].map(([x, h], i) => `<path d="M${x - 6},140 V${140 - h} H${x + 6} V140" ${L3} stroke="none"/>${Array.from({ length: Math.floor(h / 8) }, (_, k) => `<rect x="${x - 3}" y="${136 - k * 8}" width="2" height="3" ${STAR} fill-opacity=".7"/><rect x="${x + 1}" y="${136 - k * 8}" width="2" height="3" ${STAR} fill-opacity=".7"/>`).join('')}`).join('')}
${at(90, 140, 1.2, BAITEREK.replace(`${L3}`, 'fill="#F7E3A1" fill-opacity=".9"'))}<path d="M0,140 H180 V170 H0 Z" ${L4} stroke="none"/><path d="M10,154 H170" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="2" stroke-dasharray="4 4"/>`
	],
	// Usbekistan: Minarett Kalta Minor in Chiwa – Registan in Samarkand – Shah-i-Zinda mit Karawane und Granatäpfeln
	UZ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${wall(10, 60, 140, 20)}${at(90, 140, 1.6, KALTA)}${wall(120, 170, 140, 20)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(80, 26)}${at(46, 112, 0.9, madrasa())}${at(118, 112, 1, `<path d="M-30,0 V-24 H30 V0 Z" ${L2} stroke-width="1.3"/>${[-18, 0, 18].map((x) => `<path d="M${x - 7},-24 Q${x - 7},-38 ${x},-40 Q${x + 7},-38 ${x + 7},-24 Z" ${L3} stroke-width="1.2"/><path d="M${x - 4},-34 L${x},-40 L${x + 4},-34" stroke="var(--stp)" stroke-width="1" stroke-dasharray="1 1.4"/>`).join('')}`)}
<path d="M0,112 Q90,104 180,114 V170 H0 Z" ${L1} stroke-width="2"/>${at(30, 144, 0.8, CAMEL_RIDER)}${at(66, 142, 0.7, CAMEL)}${at(140, 154, 1.1, POMEGRANATE)}${at(158, 160, 0.8, POMEGRANATE)}`
	],
	// Pakistan: Badshahi-Moschee in Lahore – K2 und Attabad-See – Hunza-Tal mit Aprikosenblüte vor dem Rakaposhi
	PK: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,134 H180" stroke-width="2"/>${at(90, 134, 1.4, BADSHAHI)}<path d="M20,150 H160" stroke="var(--stp)" stroke-width="3"/><path d="M20,150 H160" stroke-width="1"/>`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M10,110 L60,30 Q70,22 80,30 L140,110 Z" ${L1} stroke-width="1.8"/><path d="M60,30 Q70,22 80,30 L92,50 L82,46 L74,56 L66,46 L54,50 Z" ${SNOW} stroke-width="1.2"/><path d="M0,120 Q40,96 90,104 Q140,96 180,112 V170 H0 Z" ${L2} stroke-width="2"/>
${[[24, 140, 12], [52, 132, 10], [130, 136, 12], [156, 144, 10], [92, 146, 9]].map(([x, y, r]) => `<path d="M${x},${y} V${y - r}" stroke-width="1.8"/><circle cx="${x}" cy="${y - r - 2}" r="${r}" ${SNOW} stroke-width="1.2"/>${dots([[x - r / 2, y - r - 4, 1.2], [x + r / 3, y - r, 1.2], [x, y - r * 1.5, 1.2]], L3)}`).join('')}${at(70, 112, 0.7, `<path d="M-10,0 V-10 H10 V0 Z" ${SNOW} stroke-width="1"/><path d="M-12,-10 H12 V-13 H-12 Z" ${SOLID}/>`)}`
	],
	// Indien: Hawa Mahal in Jaipur – Backwaters von Kerala mit Hausboot – Taj Mahal im Morgenlicht mit Pfau
	IN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.5, HAWA)}`,
		null,
		() => `${sun(90, 40, 14)}${rays(90, 40, 14, 16)}${birds(140, 26)}${at(90, 112, 1.05, TAJ)}<path d="M0,112 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,112 H180" stroke-width="2"/><path d="M80,112 L70,170 H110 L100,112 Z" ${L3} stroke="none"/><g opacity=".3" transform="translate(0,224) scale(1,-1)">${at(90, 112, 1.05, TAJ)}</g>
${cypress(56, 116, 20)}${cypress(124, 116, 20)}${cypress(40, 122, 26)}${cypress(140, 122, 26)}${at(30, 160, 1, PEACOCK)}`
	],
	// Nepal: Stupa von Boudhanath – Everest mit Yaks auf dem Pfad – Annapurna im Morgenrot über dem Phewa-See
	NP: [
		() => `${sun(150, 26, 9)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.25, BOUDHA)}`,
		null,
		() => `${sun(36, 70, 10)}${rays(36, 70, 10)}${alps(96, 180, L1)}<path d="M0,104 H180" stroke-width="1.6"/><path d="M0,104 H180 V170 H0 Z" ${L2} stroke="none"/><g opacity=".3" transform="translate(0,208) scale(1,-1)">${alps(104, 180, L3)}</g>
${at(70, 140, 1, `<path d="M-20,0 Q0,5 20,0 L18,-4 H-18 Z" ${SOLID}/><path d="M-10,-4 Q0,-14 10,-4" ${L3} stroke-width="1"/>`)}${at(130, 150, 0.8, `<path d="M-20,0 Q0,5 20,0 L18,-4 H-18 Z" ${SOLID}/>`)}${flags(4, 110, 70, 100)}${flags(110, 100, 178, 112)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Bangladesch: Palast Ahsan Manzil – Segelboote auf dem Padma – Bengalischer Tiger in den Sundarbans
	BD: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,136 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,136 H180" stroke-width="2"/>${at(90, 136, 1.4, `<path d="M-50,0 V-26 H50 V0 Z" ${L3} stroke-width="1.3"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${-46 + i * 9},-4 V-14 Q${-43 + i * 9},-18 ${-40 + i * 9},-14 V-4 Z" ${SNOW} stroke="none"/>`).join('')}<path d="M-50,-26 H50 V-30 H-50 Z" ${SOLID}/><path d="M-14,-30 V-38 H14 V-30" ${L3} stroke-width="1.2"/><path d="M-12,-38 Q-12,-54 0,-56 Q12,-54 12,-38 Z" ${L2} stroke-width="1.3"/><path d="M0,-56 V-62" stroke-width="1"/>`)}${palm(20, 150, 30, 4)}${palm(164, 150, 26, -4)}`,
		null,
		() => `${sun(130, 46, 16)}${rays(130, 46, 16, 16)}${birds(80, 30)}<path d="M0,0 Q20,40 10,90 M180,0 Q160,40 170,90" stroke-width="2"/>${[[16, 40], [8, 70], [168, 36], [176, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" ${L3} stroke="none"/>`).join('')}
<path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,120 H180" stroke-width="1.6"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${6 + i * 13},120 l-3,8 M${6 + i * 13},120 l3,8 M${6 + i * 13},120 v-14" stroke-width="1.2"/>`).join('')}${at(56, 120, 1.6, TIGER)}<g opacity=".3" transform="translate(0,240) scale(1,-1)">${at(56, 120, 1.6, TIGER)}</g>`
	],
	// Sri Lanka: Löwenfelsen Sigiriya – Neun-Bögen-Brücke in den Teeplantagen – Kandy Perahera mit geschmücktem Elefanten
	LK: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 Q90,126 180,136 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 134, 1.4, SIGIRIYA)}${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40, 1], [80, 40, 1]], STAR)}${[[20, 40], [60, 30], [120, 34], [160, 48]].map(([x, y]) => `${burst(x, y + 20, 2)}`).join('').replace(/currentColor/g, '#F7E3A1')}
<path d="M0,130 H180 V170 H0 Z" ${L4} stroke="none"/>${at(72, 140, 2, PERAHERA)}${[[20, 150], [150, 152], [166, 148]].map(([x, y]) => `${candle(x, y)}${at(x, y + 14, 0.7, PERSON)}`).join('')}`
	],
	// Malediven: Mantarochen unter Wasser – Atolle mit Wasserflugzeug – leuchtender Strand bei Nacht
	MV: [
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M30,0 L50,80 M90,0 L94,90 M150,0 L130,80" stroke="var(--stp)" stroke-width="10" stroke-opacity=".4"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/>${at(90, 84, 2, MANTA)}<circle cx="140" cy="60" r="2" stroke-width="1.2"/><circle cx="146" cy="50" r="1.4" stroke-width="1.2"/>
<path d="M0,150 Q30,138 60,146 Q100,136 130,148 Q160,140 180,146 V170 H0 Z" ${L3} stroke-width="1.6"/><path d="M20,150 Q22,138 30,132 M26,140 Q34,136 38,130 M150,150 Q148,136 156,128" stroke-width="2"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1], [40, 30, 1], [110, 60, 1]], STAR)}<path d="M40,20 Q90,10 160,40" stroke="#F4F7FA" stroke-opacity=".2" stroke-width="12"/>
<path d="M0,100 H180 V136 H0 Z" ${L4} stroke="none"/>${[112, 122, 132].map((y, i) => `<path d="M0,${y} Q22,${y - 6} 45,${y} T90,${y} T135,${y} T180,${y}" stroke="#7FE7E0" stroke-opacity="${0.9 - i * 0.25}" stroke-width="2.4"/>`).join('')}<path d="M0,136 Q90,128 180,138 V170 H0 Z" ${L3} stroke="none"/>${dots([[30, 140, 1.4], [70, 136, 1.4], [120, 138, 1.4], [160, 142, 1.4]], 'fill="#7FE7E0"')}${palm(150, 150, 50, -8)}${at(60, 156, 0.8, PERSON)}`
	],
	// Turkmenistan: Achal-Tekkiner – Aschgabat in weißem Marmor – (Legendary: bisheriges Bild)
	TM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/><path d="M0,104 Q40,94 90,100 Q140,92 180,102" stroke-width="1.4"/>${at(52, 152, 2.2, horse())}${grass(150, 156)}${grass(20, 162)}`,
		null,
		SCENES.TM
	],
	// Afghanistan: Blaue Moschee von Masar-e Scharif – Seen von Band-e Amir – (Legendary: bisheriges Bild)
	AF: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,136 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,136 H180" stroke-width="2"/>${at(90, 136, 1.5, BLUEMOSQ)}${[[24, 156], [40, 160], [140, 158], [156, 162]].map(([x, y]) => at(x, y, 1, PIGEON)).join('')}`,
		null,
		SCENES.AF
	],
	// Tadschikistan: Iskanderkul-See – Wachan-Tal am Pamir Highway – (Legendary: bisheriges Bild)
	TJ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${alps(100)}<path d="M20,108 H160 Q140,128 90,128 Q40,128 20,108 Z" ${L3} stroke-width="1.6"/><g opacity=".3" transform="translate(0,216) scale(1,-1)">${alps(108, 180, L3)}</g><path d="M0,108 H20 M160,108 H180" stroke-width="1.6"/><path d="M0,128 Q90,120 180,130 V170 H0 Z" ${L1} stroke-width="2"/>${[[12, 132, 22], [26, 134, 16], [160, 132, 24], [172, 134, 18]].map(([x, y, h]) => pine(x, y, h)).join('')}${grass(90, 160)}`,
		null,
		SCENES.TJ
	],
	// Kirgisistan: Burana-Turm vor dem Tian Shan – Issyk-Kul mit Bergkette – (Legendary: bisheriges Bild)
	KG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${alps(110, 180, L1)}<path d="M0,128 Q90,118 180,130 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 138, 1.6, BURANA)}${[[30, 144], [48, 150], [130, 148], [148, 144]].map(([x, y]) => `<path d="M${x - 4},${y} h8 l-1,-4 h-6 Z" ${L3} stroke-width="1"/>`).join('')}${grass(20, 162)}${grass(160, 160)}`,
		null,
		SCENES.KG
	],
	// Mongolei: Dschingis-Khan-Reiterstandbild – Gobi mit Trampeltieren – (Legendary: bisheriges Bild)
	MN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 Q90,124 180,136 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 136, 1.4, GENGHIS)}${grass(20, 160)}${grass(160, 158)}`,
		null,
		SCENES.MN
	],
	// Bhutan: Punakha-Dzong am Zusammenfluss – Dochula-Pass mit Chörten und Takin – (Legendary: bisheriges Bild)
	BT: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 L40,60 L70,80 L110,44 L150,76 L180,62 V120 H0 Z" ${L1} stroke-width="1.6"/>${at(90, 124, 1.15, DZONG)}<path d="M0,124 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,124 H180" stroke-width="2"/><path d="${waves(10, 148, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${cypress(20, 126, 30)}${cypress(160, 126, 26)}`,
		null,
		SCENES.BT
	],
	// China: Himmelstempel – Karstberge am Li-Fluss mit Bambusfloß – Große Mauer im Morgenrot mit Panda im Bambus
	CN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.7, HEAVEN)}${pine(20, 142, 22)}${pine(160, 142, 26)}`,
		null,
		() => `${sun(130, 40, 12)}${rays(130, 40, 12, 16)}${birds(80, 26)}<path d="M0,100 L30,70 L60,84 L96,52 L130,78 L160,62 L180,70 V130 H0 Z" ${L1} stroke-width="1.6"/>
<path d="M0,96 L20,80 L30,86 L50,70 L64,78 L84,62 L100,70 L120,58 L140,72 L160,64 L180,76" stroke="var(--stp)" stroke-width="5"/><path d="M0,96 L20,80 L30,86 L50,70 L64,78 L84,62 L100,70 L120,58 L140,72 L160,64 L180,76" stroke-width="1.4"/>${[[20, 80], [50, 70], [84, 62], [120, 58], [160, 64]].map(([x, y]) => `<path d="M${x - 4},${y} V${y - 8} H${x + 4} V${y}" ${L3} stroke-width="1"/><path d="M${x - 5},${y - 8} L${x},${y - 12} L${x + 5},${y - 8}" stroke-width="1"/>`).join('')}
<path d="M0,128 Q90,118 180,130 V170 H0 Z" ${L2} stroke-width="2"/>${bamboo(16, 170, 66)}${bamboo(30, 170, 50)}${bamboo(166, 170, 60)}${at(100, 162, 1.4, PANDA)}`
	],
	// Südkorea: N Seoul Tower über der Stadt – Hanok-Dächer vor der Skyline – Seongsan Ilchulbong bei Sonnenaufgang mit Rapsblüte
	KR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M20,120 Q50,66 90,62 Q130,66 160,120 Z" ${L2} stroke-width="1.8"/>${at(90, 66, 1, NSEOUL)}${[[30, 110, 12], [44, 100, 10], [136, 104, 10], [150, 112, 12]].map(([x, y, r]) => bush(x, y, r, L3)).join('')}
<path d="M0,120 H180 V170 H0 Z" ${L1} stroke="none"/>${[[10, 50], [26, 36], [42, 44], [128, 40], [144, 54], [160, 34]].map(([x, h], i) => `<path d="M${x - 7},170 V${120 + 50 - h - 40} H${x + 7} V170" ${[L2, SNOW, L3][i % 3]} stroke-width="1"/>`).join('')}${hanok(64, 160, 52)}`,
		null,
		() => `${sun(90, 70, 16)}${rays(90, 70, 16, 16)}${birds(140, 26)}<path d="M0,90 H180 V130 H0 Z" ${L2} stroke="none"/><path d="M0,90 H180" stroke-width="1.6"/>${at(100, 112, 1, SEONGSAN)}<path d="M0,112 H40 M160,112 H180" stroke-width="1.4"/>
<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${canola(4, 150, 26)}${canola(8, 162, 25)}${canola(2, 172, 26)}${at(30, 118, 0.7, PERSON)}`
	],
	// Taiwan: Pagode am Sonne-Mond-See – Teehäuser von Jiufen mit Laternen – Himmelslaternen über Pingxi
	TW: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q40,80 90,88 Q140,78 180,100 V124 H0 Z" ${L2} stroke-width="1.8"/>${at(60, 100, 0.9, LAKEPAGODA)}<path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,124 H180" stroke-width="2"/><path d="${waves(10, 148, 11, 15, 2.4)}" stroke-width="1.4"/>${at(120, 146, 1, `<path d="M-16,0 H16 L12,4 H-12 Z" ${SOLID}/>`)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[100, 22], [150, 10], [170, 40, 1]], STAR)}${[[30, 60, 1], [60, 40, 1.2], [90, 70, 0.8], [120, 44, 1.4], [150, 70, 1], [76, 100, 1.2], [130, 100, 0.9], [44, 90, 0.7], [160, 30, 0.7], [104, 20, 0.6]].map(([x, y, s]) => skylantern(x, y, s)).join('')}
<path d="M0,130 Q40,120 70,132 H180 V170 H0 Z" ${L3} stroke="none"/><path d="M0,148 H180" stroke="#F4F7FA" stroke-opacity=".5" stroke-width="2"/><path d="M0,152 H180" stroke="#F4F7FA" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3 3"/>${[[40, 140], [60, 142], [120, 144], [146, 140]].map(([x, y]) => at(x, y, 0.8, PERSON)).join('')}`
	],
	// Hongkong: Doppelstock-Straßenbahn – Victoria Harbour mit Star Ferry – Skyline bei Nacht mit Dschunke
	HK: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${[[14, 70], [36, 90], [140, 80], [164, 96]].map(([x, h], i) => `<path d="M${x - 10},150 V${150 - h} H${x + 10} V150" ${[L1, L2][i % 2]} stroke-width="1.2"/>${Array.from({ length: Math.floor(h / 8) }, (_, k) => `<path d="M${x - 6},${146 - k * 8} h12" stroke-width=".8"/>`).join('')}`).join('')}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,150 H180" stroke-width="2"/><path d="M0,104 H180" stroke-width="1"/>${at(90, 150, 1.6, DINGDING)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[100, 12], [150, 10], [170, 30, 1]], STAR)}<path d="M0,80 Q40,50 90,58 Q140,50 180,70 V110 H0 Z" ${L3} stroke="none"/>${[[14, 50], [28, 70], [44, 40], [60, 84], [76, 56], [96, 64], [114, 48], [130, 76], [148, 44], [166, 58]].map(([x, h]) => `<path d="M${x - 6},110 V${110 - h} H${x + 6} V110 Z" ${L4} stroke="none"/>${Array.from({ length: Math.floor(h / 7) }, (_, k) => `<rect x="${x - 3}" y="${106 - k * 7}" width="2" height="2.4" ${STAR} fill-opacity=".8"/><rect x="${x + 1}" y="${106 - k * 7}" width="2" height="2.4" ${STAR} fill-opacity=".6"/>`).join('')}`).join('')}
<path d="M0,110 H180 V170 H0 Z" ${SOLID}/>${[20, 40, 60, 80, 100, 120, 140, 160].map((x, i) => `<path d="M${x},116 V${130 + (i % 3) * 8}" stroke="#F7E3A1" stroke-opacity=".5" stroke-width="2"/>`).join('')}${at(100, 154, 1.4, JUNK.replace(/\$\{L3\}/g, '').replace(`${L3}`, 'fill="#E36D4C"'))}`
	],
	// Macau: Ruine von São Paulo – Macau Tower und Lisboa an der Uferstraße – Senado-Platz mit Wellenpflaster und Laternen
	MO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,146 H180 V170 H0 Z" ${L1} stroke="none"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${50 + i * 4},${146 + i * 4} H${130 - i * 4}" stroke-width="1.4"/>`).join('')}${at(90, 146, 1.4, SAOPAULO)}<path d="M0,146 H50 M130,146 H180" stroke-width="2"/>`,
		null,
		() => `${burst(146, 30, 3)}${burst(120, 56, 2)}${birds(70, 30)}${gables(0, 112, 3, 18)}${gables(126, 112, 3, 18)}<path d="M58,112 V70 H122 V112" ${SNOW} stroke-width="1.3"/><path d="M58,70 L90,56 L122,70 Z" ${L3} stroke-width="1.2"/>${[64, 76, 98, 110].map((x) => `<path d="M${x},106 V84 Q${x + 4},80 ${x + 8},84 V106 Z" ${SOLID}/>`).join('')}
<path d="M0,112 H180 V170 H0 Z" ${SNOW}/>${Array.from({ length: 7 }, (_, r) => `<path d="M0,${120 + r * 8} Q11,${114 + r * 8} 22,${120 + r * 8} T45,${120 + r * 8} T67,${120 + r * 8} T90,${120 + r * 8} T112,${120 + r * 8} T135,${120 + r * 8} T157,${120 + r * 8} T180,${120 + r * 8}" stroke-width="2"/>`).join('')}
<path d="M0,96 Q90,86 180,96" stroke-width="1"/>${[20, 44, 68, 92, 116, 140, 164].map((x, i) => lantern(x, 100 - Math.round(4 * Math.sin((i / 6) * Math.PI)), 0.9)).join('')}`
	],
	// Thailand: Wat Arun – schwimmender Markt – Yi-Peng-Laternen über dem Tempel mit Elefant
	TH: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,134 H180" stroke-width="2"/>${at(90, 134, 1, prang(104))}${at(50, 134, 1, prang(56))}${at(130, 134, 1, prang(56))}${at(24, 134, 1, prang(34))}${at(156, 134, 1, prang(34))}<path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${[[30, 50, 1], [56, 30, 1.2], [84, 60, 0.8], [116, 36, 1.3], [146, 56, 1], [70, 86, 1.1], [130, 84, 0.9], [100, 14, 0.6], [160, 24, 0.7], [20, 80, 0.7]].map(([x, y, s]) => skylantern(x, y, s)).join('')}
<path d="M30,140 L40,112 H140 L150,140 Z" ${L3} stroke="none"/><path d="M40,112 L60,96 H120 L140,112 Z" ${L4} stroke="none"/><path d="M60,96 L90,82 L120,96 Z" ${SOLID}/><path d="M90,82 V70" stroke="#F7E3A1" stroke-width="1.6"/><path d="M40,112 l-6,-8 M140,112 l6,-8 M60,96 l-5,-7 M120,96 l5,-7" stroke="#F7E3A1" stroke-width="1.4"/>
<path d="M0,140 H180 V170 H0 Z" ${SOLID}/>${at(14, 166, 0.9, ELEPHANT)}${[[100, 150], [130, 156]].map(([x, y]) => candle(x, y)).join('')}`
	],
	// Kambodscha: Gesichterturm des Bayon – Pfahldorf am Tonle Sap – Angkor Wat bei Sonnenaufgang mit Mönchen und Lotus
	KH: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.5, BAYON)}${palm(16, 150, 34, 4)}${palm(166, 150, 30, -4)}`,
		null,
		() => `${sun(90, 66, 18)}${rays(90, 66, 18, 16)}${birds(140, 26)}<path d="M20,108 V96 H160 V108" ${L3} stroke-width="1.2"/>${[[40, 30], [65, 40], [90, 54], [115, 40], [140, 30]].map(([x, h]) => `<path d="M${x - 7},96 L${x - 5},${96 - h * 0.6} L${x},${96 - h} L${x + 5},${96 - h * 0.6} L${x + 7},96 Z" ${SOLID}/>`).join('')}
<path d="M0,108 H180 V150 H0 Z" ${L2} stroke="none"/><g opacity=".35" transform="translate(0,216) scale(1,-1)">${[[40, 30], [65, 40], [90, 54], [115, 40], [140, 30]].map(([x, h]) => `<path d="M${x - 7},108 L${x},${108 - h} L${x + 7},108 Z" ${SOLID}/>`).join('')}</g>
<path d="M0,150 H180 V170 H0 Z" ${L3} stroke="none"/>${[[20, 162], [44, 160], [140, 164], [160, 160]].map(([x, y]) => at(x, y, 0.9, LOTUS)).join('')}${[[80, 166], [94, 166], [108, 166]].map(([x, y]) => at(x, y, 0.9, MONK)).join('')}`
	],
	// Vietnam: Hội An mit Laternen – Halong-Bucht mit Dschunken – Reisterrassen bei Sa Pa mit Wasserbüffel
	VN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,138 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,138 H180" stroke-width="2"/>${at(90, 138, 1.8, HOIAN)}<path d="${waves(10, 158, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(140, 40, 12)}${rays(140, 40, 12, 16)}${birds(80, 30)}<path d="M0,90 L40,56 L80,74 L120,44 L180,80 V110 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,100 Q90,80 180,96 V170 H0 Z" ${L2} stroke-width="1.8"/>${riceterr(108, 7)}
${at(40, 150, 1.2, BUFFALO)}${at(120, 148, 1, PERSON)}<path d="M114,128 L120,122 L126,128 Z" ${L3} stroke-width="1"/>${at(150, 156, 0.8, PERSON)}<path d="M144,138 L150,132 L156,138 Z" ${L3} stroke-width="1"/>`
	],
	// Malaysia: Orang-Utan im Regenwald – Skyline von Kuala Lumpur – Kinabalu mit Rafflesia
	MY: [
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[10, 20], [40, 0], [140, 10], [170, 30], [80, -6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" ${L2} stroke="none"/>`).join('')}<path d="M60,0 Q70,60 64,170 M126,0 Q120,70 130,170" stroke-width="5"/>${at(96, 120, 1.6, ORANGUTAN)}<path d="M0,150 Q90,140 180,152 V170 H0 Z" ${L3} stroke-width="1.6"/>`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(80, 30)}<path d="M10,110 L60,40 L74,30 L86,44 L96,34 L110,46 L160,110 Z" ${L2} stroke-width="1.8"/><path d="M60,40 L74,30 L86,44 L96,34 L110,46 L100,52 L88,50 L76,56 L66,50 Z" ${SNOW} stroke-width="1.1"/>
<path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${[[16, 116], [36, 120], [150, 118], [168, 122]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" ${L3} stroke="none"/>`).join('')}${at(90, 150, 1.6, RAFFLESIA)}`
	],
	// Singapur: Merlion – Skyline der Marina Bay – Gardens by the Bay bei Nacht
	SG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,134 H180" stroke-width="2"/>${at(70, 134, 1.8, MERLION)}<path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${[[140, 60], [156, 80], [172, 50]].map(([x, h], i) => `<path d="M${x - 7},134 V${134 - h} H${x + 7} V134" ${[L1, L2][i % 2]} stroke-width="1.1"/>`).join('')}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[100, 12], [150, 10], [170, 30, 1]], STAR)}${at(140, 112, 0.8, MBS.replace(/\$\{SNOW\}/g, ''))}
${[[30, 60], [56, 80], [84, 66], [110, 90], [150, 56]].map(([x, h]) => at(x, 140, 1, supertree(h, true))).join('')}<path d="M10,80 Q60,72 120,86" stroke="#7FE7E0" stroke-opacity=".5" stroke-width="1.4"/><path d="M0,140 H180 V170 H0 Z" ${SOLID}/>${[[40, 150], [96, 154], [140, 150]].map(([x, y]) => at(x, y + 10, 0.7, PERSON)).join('')}`
	],
	// Indonesien: Stupa von Borobudur – Reisterrassen auf Bali mit Tempel – Komodowaran vor dem Bromo im Morgenrot
	ID: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q40,90 90,100 Q140,90 180,104" ${L1} stroke-width="1.4"/><path d="M10,140 L30,120 H150 L170,140 Z M30,120 L46,104 H134 L150,120 Z" ${L2} stroke-width="1.3"/>${at(90, 104, 1.5, BOROSTUPA)}${[50, 70, 110, 130].map((x) => at(x, 120, 0.6, BOROSTUPA)).join('')}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>`,
		null,
		() => `${sun(90, 50, 14)}${rays(90, 50, 14, 16)}<path d="M10,106 L50,66 Q60,60 70,66 L80,74 L90,62 Q96,58 102,62 L150,106 Z" ${L2} stroke-width="1.8"/><path d="M56,62 q-4,-8 2,-12 q6,-4 2,-10" stroke-width="1.4"/><path d="M0,106 Q90,94 180,108 V170 H0 Z" ${L1} stroke-width="2"/>
<path d="M0,130 Q60,118 120,128 Q150,124 180,130 V170 H0 Z" ${L3} stroke-width="1.6"/>${at(84, 152, 1.6, KOMODO)}${grass(20, 150)}${grass(160, 150)}`
	],
	// Philippinen: Jeepney – Chocolate Hills auf Bohol – Koboldmaki vor dem Vulkan Mayon
	PH: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${[[20, 60], [40, 40], [140, 50], [160, 70]].map(([x, h], i) => `<path d="M${x - 9},146 V${146 - h} H${x + 9} V146" ${[L1, L2][i % 2]} stroke-width="1.1"/>`).join('')}${palm(70, 146, 50, 6)}<path d="M0,146 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,146 H180" stroke-width="2"/>${at(96, 146, 1.6, JEEPNEY)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(70, 30)}${MAYON(110, 90, 1)}<path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/><path d="M20,126 Q80,116 150,130" stroke-width="5"/>${at(76, 124, 1.6, TARSIER)}${[[20, 140], [160, 150], [140, 160]].map(([x, y]) => bush(x, y, 10, L3)).join('')}`
	],
	// Brunei: Wasserdorf Kampong Ayer – Moschee in der Lagune mit Königsbarke – Nasenaffe im Mangrovenwald
	BN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q90,100 180,112" stroke-width="1.4"/>${[[24, 120], [54, 118], [84, 122], [114, 118], [144, 120], [170, 124]].map(([x, y]) => at(x, y, 0.9, STILT)).join('')}<path d="M0,124 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,124 H180" stroke-width="2"/>${at(90, 146, 1.2, `<path d="M-16,0 Q0,5 16,0 L14,-3 H-14 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(90, 70, 18)}${rays(90, 70, 18, 16)}${birds(140, 26)}<path d="M0,0 Q16,60 10,120 M180,0 Q164,60 170,120" stroke-width="3"/>${[[14, 20], [8, 60], [166, 24], [174, 64], [30, 0], [150, 0]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18" ${L3} stroke="none"/>`).join('')}
<path d="M14,40 Q90,58 166,44" stroke-width="3"/>${at(96, 100, 1.6, PROBOSCIS)}<path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,120 H180" stroke-width="1.6"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${8 + i * 15},120 l-4,10 M${8 + i * 15},120 l4,10 M${8 + i * 15},120 v-10" stroke-width="1.2"/>`).join('')}`
	],
	// Nordkorea: Kumgang-Gebirge – Kuryong-Wasserfall im Diamantgebirge – (Legendary: bisheriges Bild)
	KP: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 L14,90 L22,100 L34,60 L44,80 L56,50 L68,84 L80,40 L92,76 L104,56 L116,90 L128,64 L140,96 L154,70 L166,100 L180,86 V170 H0 Z" ${L2} stroke-width="1.6"/><path d="M34,60 V110 M56,50 V110 M80,40 V110 M104,56 V110 M128,64 V110" stroke-width="1" stroke-dasharray="4 3"/>${at(40, 150, 1.5, STONEPINE)}${at(150, 154, 1.1, STONEPINE)}<path d="M0,150 Q90,140 180,152 V170 H0 Z" ${L1} stroke-width="1.6"/>`,
		null,
		SCENES.KP
	],
	// Myanmar: Shwedagon-Pagode – Einbeinruderer auf dem Inle-See – (Legendary: bisheriges Bild)
	MM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.25, SHWEDAGON)}${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		SCENES.MM
	],
	// Laos: Kuang-Si-Wasserfälle – Langboot auf dem Mekong vor Karstbergen – (Legendary: bisheriges Bild)
	LA: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,40 Q30,34 50,50 L60,120 H0 Z M180,40 Q150,34 130,50 L120,120 H180 Z" ${L3} stroke-width="1.6"/>${[[10, 50], [40, 36], [150, 40], [170, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L2} stroke="none"/>`).join('')}${cascades(54, 64, 72, 3)}${cascades(40, 100, 100, 4)}
<path d="M0,130 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,130 H180" stroke-width="1.6"/><path d="${waves(10, 150, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		SCENES.LA
	],
	// Osttimor: Heiliges Haus (Uma Lulik) – Küste mit Fischerbooten vor den Bergen – (Legendary: bisheriges Bild)
	TL: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 142, 1.5, UMALULIK)}${palm(24, 150, 40, 5)}${palm(156, 150, 34, -5)}`,
		null,
		SCENES.TL
	],
	// Papua-Neuguinea: Geisterhaus am Sepik – Regenwaldflüsse mit Einbaum – (Legendary: bisheriges Bild)
	PG: [
		() => `${sun(150, 26, 9)}${birds(100, 40)}<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${at(96, 142, 1.5, TAMBARAN)}${palm(20, 150, 40, 5)}${palm(166, 150, 34, -5)}`,
		null,
		SCENES.PG
	],
	// Marokko: blaue Gasse in Chefchaouen – Kasbah Aït-Ben-Haddou mit Karawane – Djemaa el-Fna bei Nacht mit Koutoubia und Laternen
	MA: [
		() => `${sun(150, 26, 9)}${birds(70, 40)}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/>${at(90, 150, 1.4, CHAOUEN)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[100, 12], [150, 10], [170, 30, 1], [70, 26, 1]], STAR)}<path d="M150,30 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${STAR} stroke="none"/>${at(130, 130, 1.2, KOUTOUBIA.replace(/\$\{L2\}/g, ''))}
<path d="M0,130 H180 V170 H0 Z" ${L4} stroke="none"/>${[[24, 140], [60, 136], [96, 142], [150, 140]].map(([x, y]) => `${at(x, y + 14, 1, `<path d="M-12,0 V-10 H12 V0" ${L3} stroke="none"/><path d="M-15,-10 L0,-18 L15,-10 Z" fill="#F4F7FA" fill-opacity=".8" stroke="none"/>`)}<path d="M${x - 2},${y - 10} q-2,-6 0,-12 q2,-6 0,-12" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="1.2"/>`).join('')}${[20, 50, 80, 110].map((x, i) => lantern(x, 96 + (i % 2) * 6, 0.9, 'fill="#F7E3A1" fill-opacity=".9" stroke="none"')).join('')}<path d="M0,90 Q60,100 120,92" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="1"/>`
	],
	// Algerien: Felsbogen im Tassili n’Ajjer – Kasbah von Algier über der Bucht – Hoggar-Gebirge bei Sonnenaufgang mit Tuareg
	DZ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(90, 136, 1.1, `<path d="M-60,0 Q-62,-60 -30,-74 Q0,-84 30,-74 Q62,-60 60,0 H38 Q40,-40 24,-50 Q0,-60 -24,-50 Q-40,-40 -38,0 Z" ${L3} stroke-width="1.8"/><path d="M-50,-20 Q-48,-50 -30,-62 M50,-20 Q48,-50 30,-62" stroke-width="1"/>`)}<path d="M0,136 Q90,126 180,138 V170 H0 Z" ${SNOW} stroke-width="2"/><path d="M0,150 Q60,140 120,150 T180,148" stroke-width="1" stroke-dasharray="3 3"/>`,
		null,
		() => `${sun(90, 96, 18)}${rays(90, 96, 18, 16)}${birds(140, 30)}<path d="M0,110 L14,70 L24,80 L34,50 L46,74 L60,40 L72,70 L84,56 L96,80 L110,44 L124,72 L138,52 L150,80 L164,60 L180,84 V120 H0 Z" ${L3} stroke-width="1.8"/><path d="M34,50 V100 M60,40 V100 M110,44 V100 M138,52 V100" stroke-width="1" stroke-dasharray="4 3"/>
<path d="M0,120 Q90,110 180,122 V170 H0 Z" ${SNOW} stroke-width="2"/><path d="M0,140 Q60,128 120,140 T180,136" stroke-width="1" stroke-dasharray="3 3"/>${at(60, 158, 1.2, CAMEL_RIDER)}`
	],
	// Tunesien: Amphitheater von El Djem – Sidi Bou Said über dem Meer – Salzsee Chott el Djerid mit Oase und Luftspiegelung
	TN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(90, 138, 1.2, ELDJEM)}<path d="M0,138 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,138 H180" stroke-width="2"/>${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		() => `${sun(140, 36, 14)}${rays(140, 36, 14, 16)}${birds(70, 30)}<path d="M0,96 H180" stroke-width="1.4"/><path d="M0,96 H180 V130 H0 Z" ${SNOW} stroke-width="1.2"/>${[[30, 92], [60, 90], [120, 94]].map(([x, y]) => `<path d="M${x - 14},${y} q4,-2 8,0 q4,-2 8,0 q4,-2 8,0" stroke-width="1" stroke-opacity=".5"/>`).join('')}<path d="M10,104 Q40,100 70,106 M100,110 Q140,104 170,112" ${L2} stroke-width="3"/>
${palm(30, 96, 30, 4)}${palm(46, 96, 22, -3)}${palm(150, 96, 26, -4)}<g opacity=".3" transform="translate(0,192) scale(1,-1)">${palm(30, 96, 30, 4)}${palm(150, 96, 26, -4)}</g><path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 154, 1, CAMEL)}`
	],
	// Westsahara: Lagune von Dakhla mit Kitesurfer – Dünen am Atlantik mit Fischerbooten – Wüstennacht mit Zelt und Kamel
	EH: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q40,96 90,104 Q140,96 180,108 V122 H0 Z" ${SNOW} stroke-width="1.6"/><path d="M0,122 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,122 H180" stroke-width="2"/>${at(96, 150, 1.4, KITE)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke-width="1.4"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 70], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1], [40, 50, 1], [110, 60, 1]], STAR)}<path d="M150,22 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${STAR} stroke="none"/><path d="M30,26 Q90,16 170,60" stroke="#F4F7FA" stroke-opacity=".2" stroke-width="12"/>
<path d="M0,120 Q60,104 120,116 Q150,110 180,118 V170 H0 Z" ${L3} stroke="none"/><path d="M0,140 Q50,128 100,138 Q140,130 180,140 V170 H0 Z" ${L4} stroke="none"/>${at(120, 140, 1.3, `<path d="M-30,0 L-22,-14 L-10,-18 L0,-24 L10,-18 L22,-14 L30,0 Z" ${SOLID}/><path d="M-6,0 L0,-12 L6,0 Z" fill="#F7E3A1" fill-opacity=".8" stroke="none"/>`)}${at(40, 150, 1, CAMEL)}`
	],
	// Senegal: Lac Rose mit Salzsammlern – Insel Gorée mit bunten Häusern – Baobab im Abendrot mit Pirogen und Pelikanen
	SN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q90,100 180,112" stroke-width="1.4"/><path d="M0,112 H180 V170 H0 Z" ${L2} stroke="none"/>${[[30, 112], [60, 110], [130, 112], [160, 110]].map(([x, y]) => `<path d="M${x - 10},${y} L${x},${y - 14} L${x + 10},${y} Z" ${SNOW} stroke-width="1.2"/>`).join('')}${at(90, 150, 1.4, `<path d="M-16,0 Q0,5 16,0 L14,-3 H-14 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(4,-2)"')}<path d="M-4,-2 V-10 h-6 v8" ${SNOW} stroke-width="1"/>`)}<path d="${waves(10, 162, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(120, 80, 22)}${rays(120, 80, 22, 18)}${birds(140, 30)}${at(60, 112, 1.8, BAOBAB)}<path d="M0,112 Q90,104 180,114 V124 H0 Z" ${L2} stroke-width="1.6"/><path d="M0,124 H180 V170 H0 Z" ${L1} stroke="none"/>
${[[30, 140, 1], [96, 150, 0.9], [150, 142, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-24,0 Q0,6 24,-4 L28,-10 L20,-4 H-20 L-26,-10 Z" ${SOLID}/><path d="M-20,-2 H18" stroke="var(--stp)" stroke-width="1.6" stroke-dasharray="4 3"/>`)).join('')}${at(140, 124, 0.9, PELICAN)}${at(160, 128, 0.8, PELICAN)}<path d="${waves(10, 162, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Côte d’Ivoire: Skyline von Abidjan an der Lagune – Kolonialhäuser von Grand-Bassam am Strand – Basilika von Yamoussoukro im Abendrot
	CI: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${[[30, 50], [50, 70], [70, 40], [96, 84], [116, 56], [140, 66], [160, 44]].map(([x, h], i) => `<path d="M${x - 8},120 V${120 - h} H${x + 8} V120" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}<path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,120 H180" stroke-width="2"/><g opacity=".3" transform="translate(0,240) scale(1,-1)"><path d="M22,120 V70 H38 V120 Z M88,120 V36 H104 V120 Z M132,120 V54 H148 V120 Z" ${L3} stroke="none"/></g><path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(130, 60, 16)}${rays(130, 60, 16, 16)}${birds(70, 30)}${at(90, 132, 1.5, `<path d="M-20,-14 Q-20,-46 0,-48 Q20,-46 20,-14 Z" ${L3} stroke-width="1.5"/><path d="M-10,-14 Q-10,-38 0,-47 M10,-14 Q10,-38 0,-47 M0,-47 V-14" stroke-width="1"/><path d="M-4,-48 V-56 H4 V-48 Z" ${SOLID}/><path d="M0,-56 V-62 M-2,-60 H2" stroke-width="1"/><path d="M-22,-14 H22 V0 H-22 Z" ${SNOW} stroke-width="1.2"/>`)}
<path d="M0,132 Q30,124 60,128 V170 H0 Z M180,132 Q150,124 120,128 V170 H180 Z" ${L2} stroke-width="1.6"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${6 + i * 9},132 V122 M${120 + i * 9},132 V122" stroke-width="1.4"/>`).join('')}<path d="M60,132 H120 V170 H60 Z" ${L1} stroke="none"/>${palm(10, 160, 30, 4)}${palm(170, 160, 26, -4)}`
	],
	// Ghana: Black Star Gate in Accra – Fischerboote vor Elmina – Hängebrücken im Regenwald von Kakum
	GH: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.6, BLACKSTAR)}${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${bigtree(20, 170, 120)}${bigtree(90, 170, 136)}${bigtree(160, 170, 110)}${canopy(20, 76, 90, 60)}${canopy(90, 60, 160, 86)}${at(56, 82, 0.6, PERSON)}${at(120, 82, 0.6, PERSON)}
${[[50, 120], [130, 130], [60, 150], [140, 160]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L3} stroke="none"/>`).join('')}${birds(120, 30, 0.8)}`
	],
	// Togo: Wasserfall bei Kpalimé – Togosee mit Pirogen – Batammariba-Land mit Takienta und Baobab im Abendlicht
	TG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,30 Q30,24 54,40 L60,130 H0 Z M180,40 Q150,30 126,44 L120,130 H180 Z" ${L3} stroke-width="1.6"/>${[[10, 40], [40, 30], [150, 40], [172, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L2} stroke="none"/>`).join('')}<path d="M70,40 H110 V130 H70 Z" ${PAPER}/><path d="M74,40 V128 M82,40 V130 M90,40 V130 M98,40 V130 M106,40 V128" stroke-width="1.2"/>
<path d="M0,130 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M60,130 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0" stroke="var(--stp)" stroke-width="1.8"/><path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(120, 70, 20)}${rays(120, 70, 20, 16)}${birds(70, 30)}<path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${at(150, 110, 1.4, BAOBAB)}
${[[30, 142], [70, 136]].map(([x, y]) => `<path d="M${x - 10},${y} V${y - 24} Q${x},${y - 28} ${x + 10},${y - 24} V${y} Z" ${L2} stroke-width="1.3"/><path d="M${x - 13},${y - 22} L${x},${y - 42} L${x + 13},${y - 22} Z" ${SOLID}/><path d="M${x - 3},${y} V${y - 8} Q${x},${y - 11} ${x + 3},${y - 8} V${y} Z" ${SOLID}/>`).join('')}<path d="M20,142 V132 H80 V142" ${L2} stroke-width="1.2"/>${at(110, 160, 0.9, PERSON)}${grass(140, 160)}`
	],
	// Benin: Tor ohne Wiederkehr in Ouidah – Pfahldorf Ganvié – Elefanten am Wasserloch im Pendjari-Park
	BJ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 H180 V170 H0 Z" ${SNOW} stroke-width="1.4"/><path d="M0,148 H180 V170 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 158, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(90, 132, 1.4, `<path d="M-40,0 V-56 H40 V0 H14 V-30 Q0,-44 -14,-30 V0 Z" ${L3} stroke-width="1.6"/><path d="M-40,-56 H40 V-62 H-40 Z" ${SOLID}/><path d="M-32,-20 v-8 M-26,-20 v-8 M26,-20 v-8 M32,-20 v-8 M-30,-44 v-6 M30,-44 v-6" stroke-width="1.4"/>`)}${palm(16, 132, 34, 4)}${palm(166, 132, 30, -4)}`,
		null,
		() => `${sun(120, 50, 16)}${rays(120, 50, 16, 16)}${birds(70, 30)}<path d="M0,104 Q90,96 180,106 V170 H0 Z" ${L1} stroke-width="2"/>${at(150, 104, 1, ACACIA)}<ellipse cx="90" cy="140" rx="70" ry="14" ${L2} stroke-width="1.4"/>
${at(50, 138, 1.2, ELEPHANT)}${at(110, 140, 1, ELEPHANT, true)}${at(140, 130, 0.6, ELEPHANT, true)}<g opacity=".3" transform="translate(0,276) scale(1,-1)">${at(50, 138, 1.2, ELEPHANT)}</g>${grass(20, 164)}${grass(170, 162)}`
	],
	// Nigeria: Skyline von Lagos an der Lagune – Obudu-Plateau mit Seilbahn – Durbar-Reiter in Kano
	NG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${[[26, 44], [44, 70], [62, 50], [84, 90], [104, 60], [124, 76], [146, 46], [164, 58]].map(([x, h], i) => `<path d="M${x - 8},120 V${120 - h} H${x + 8} V120" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}<path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,124 H180" stroke-width="3"/><path d="M0,128 H180" stroke-width="1" stroke-dasharray="3 3"/><path d="${waves(10, 152, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M0,100 Q40,90 90,98 Q130,90 180,100 V170 H0 Z" ${L1} stroke-width="2"/>${at(80, 150, 2, DURBAR)}${[[20, 120], [150, 122], [166, 126]].map(([x, y]) => at(x, y, 0.8, horse(RIDER))).join('')}<path d="M150,60 l6,-8 M154,64 l8,-6" stroke-width="1"/>`
	],
	// Kap Verde: grünes Tal auf Santo Antão – Hafen von Mindelo – Vulkan Fogo bei Nacht über den Weinreben
	CV: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V60 Q20,40 40,60 L70,130 Z M180,170 V50 Q160,34 140,56 L110,130 Z" ${L3} stroke-width="1.8"/>${riceterr(80, 8).replace(/stroke-width="1.6"/g, 'stroke-width="1.2"')}<path d="M70,130 Q90,120 110,130 V170 H70 Z" ${L1} stroke-width="1.4"/>${[[80, 150], [96, 146]].map(([x, y]) => `<path d="M${x - 5},${y} V${y - 8} L${x},${y - 12} L${x + 5},${y - 8} V${y} Z" ${SNOW} stroke-width="1"/>`).join('')}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1]], STAR)}<path d="M10,120 L70,50 Q80,44 90,50 L160,120 Z" ${L3} stroke="none"/><path d="M74,46 q-4,-8 2,-12 q6,-4 2,-10" stroke="#F4F7FA" stroke-opacity=".5" stroke-width="1.4"/><path d="M80,50 L76,80 L84,100" stroke="#F7E3A1" stroke-opacity=".6" stroke-width="1.6"/>
<path d="M0,120 Q90,110 180,122 V170 H0 Z" ${L4} stroke="none"/>${Array.from({ length: 5 }, (_, r) => Array.from({ length: 9 }, (_, i) => `<path d="M${10 + i * 20 + (r % 2) * 10},${132 + r * 8} q-3,-6 0,-8 q3,2 0,8" ${SOLID}/>`).join('')).join('')}`
	],
	// Botswana: Erdmännchen in der Kalahari – Okavango-Delta mit Elefanten und Mokoro – Salzpfanne von Makgadikgadi unter den Sternen
	BW: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${at(160, 130, 1, ACACIA)}${[[50, 146, 1.6], [76, 150, 1.4], [100, 146, 1.6], [124, 152, 1.2]].map(([x, y, s]) => at(x, y, s, MEERKAT)).join('')}<path d="M40,148 Q80,140 140,150" stroke-width="1" stroke-dasharray="3 3"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1], [40, 30, 1], [110, 60, 1], [20, 90, 1], [160, 80, 1]], STAR)}<path d="M20,20 Q90,0 170,70" stroke="#F4F7FA" stroke-opacity=".22" stroke-width="16"/>
<path d="M0,124 H180 V170 H0 Z" ${SNOW}/><path d="M0,124 H180" stroke-width="1.2"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${10 + i * 30},${134 + (i % 2) * 10} l12,8 l-10,10" stroke-width="1" stroke-opacity=".5"/>`).join('')}${at(60, 126, 1.4, BAOBAB)}${at(140, 126, 1, BAOBAB)}`
	],
	// DR Kongo: Lavasee des Nyiragongo – Flussschiff auf dem Kongo – Okapi im Regenwald mit Schmetterlingen
	CD: [
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${dots([[150, 20], [100, 14, 1], [170, 40, 1]], SOLID)}${NYIRA(130)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L2} stroke-width="2"/>${[[20, 150, 26], [36, 152, 20], [150, 150, 24], [166, 152, 30]].map(([x, y, h]) => palm(x, y + 10, h, 4)).join('')}`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[14, 20], [46, 0], [140, 10], [170, 34], [90, -10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="28" ${L2} stroke="none"/>`).join('')}<path d="M30,0 Q40,80 26,170 M156,0 Q146,80 160,170" stroke-width="6"/><path d="M40,60 Q60,70 70,96 M150,80 Q130,90 124,110" stroke-width="2"/>
${at(54, 152, 1.9, `<path d="M8,-30 Q12,-38 24,-38 Q38,-38 44,-34 Q48,-30 46,-22 L45,-20 H10 Q6,-24 8,-30 Z" ${SOLID}/><path d="M12,-20 V0 M17,-20 V0 M40,-20 V0 M44,-22 V0" stroke-width="2.6"/><path d="M38,-32 h8 M38,-27 h8 M39,-12 h4 M39,-6 h4 M11,-10 h4 M11,-5 h4 M16,-10 h4 M16,-5 h4" stroke="var(--paper)" stroke-width="1.4"/><path d="M10,-30 L4,-42 Q2,-46 -2,-44 L-8,-40 Q-10,-37 -6,-36 L-1,-37 L4,-26 Z" ${SOLID}/><path d="M2,-44 L4,-50 L5,-44 Z" ${SOLID}/>`)}
${[[120, 60], [140, 44], [100, 40]].map(([x, y]) => at(x, y, 0.9, BUTTERFLY)).join('')}<path d="M0,150 Q90,140 180,152 V170 H0 Z" ${L3} stroke-width="1.6"/>`
	],
	// Kamerun: Felsnadeln von Rhumsiki – Lobé-Fälle ins Meer – Kamerunberg bei Sonnenaufgang über Teefeldern und dem Barombi-See
	CM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q40,110 90,118 Q140,108 180,124 V170 H0 Z" ${L1} stroke-width="2"/>${at(70, 124, 1.6, RHUMSIKI)}${at(130, 120, 0.9, RHUMSIKI)}${[[30, 150], [46, 146], [150, 152], [162, 146]].map(([x, y]) => at(x, y, 1, RONDAVEL)).join('')}`,
		null,
		() => `${sun(130, 40, 12)}${rays(130, 40, 12, 16)}${birds(70, 30)}<path d="M0,110 L50,50 Q60,42 70,50 L90,70 L100,60 Q106,56 112,60 L180,110 Z" ${L2} stroke-width="1.8"/>
<path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${tea(0, 124, 180, 6)}<ellipse cx="140" cy="118" rx="26" ry="5" ${L3} stroke-width="1.2"/>${at(40, 160, 0.8, PERSON)}${at(60, 156, 0.7, PERSON)}`
	],
	// Lesotho: Maletsunyane-Fälle – Basotho-Reiter in den Bergen – Sani-Pass im Schnee mit Rundhütten
	LS: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,40 Q30,34 60,44 L66,170 H0 Z M180,40 Q150,34 120,44 L114,170 H180 Z" ${L3} stroke-width="1.8"/><path d="M84,40 H96 V150 H84 Z" ${PAPER}/><path d="M86,40 V150 M90,40 V152 M94,40 V150" stroke-width="1.2"/><path d="M66,150 Q90,130 114,150 V170 H66 Z" ${L2} stroke-width="1.4"/><path d="M74,150 q6,-6 12,0 q6,-6 12,0" stroke="var(--stp)" stroke-width="1.8"/>`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M0,170 V70 L40,40 L70,56 L100,30 L140,60 L180,40 V170 Z" ${SNOW} stroke-width="1.8"/><path d="M40,40 L46,70 M100,30 L96,64 M140,60 L146,90" stroke-width="1"/>
<path d="M20,170 L90,150 L40,130 L110,112 L60,96 L120,80" stroke-width="5"/><path d="M20,170 L90,150 L40,130 L110,112 L60,96 L120,80" stroke="var(--stp)" stroke-width="1.6" stroke-dasharray="3 3"/>${[[140, 120], [156, 124], [148, 136]].map(([x, y]) => at(x, y, 1, RONDAVEL)).join('')}${at(90, 150, 0.7, `<rect x="-10" y="-8" width="16" height="8" rx="2" ${SOLID}/><circle cx="-6" cy="0" r="2" ${SOLID}/><circle cx="2" cy="0" r="2" ${SOLID}/>`)}`
	],
	// Madagaskar: Katta – Allee der Baobabs im Abendrot – Tsingy mit Chamäleon
	MG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,40 Q30,50 50,40 M0,150 H180 V170 H0 Z" ${L1} stroke-width="1.4"/><path d="M0,104 Q90,96 180,108" stroke-width="4"/>${at(90, 102, 1.8, KATTA)}${[[20, 30], [160, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" ${L2} stroke="none"/>`).join('')}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(70, 36)}${tsingy(6, 140, 18, 10)}<path d="M0,140 H180 V170 H0 Z" ${L2} stroke="none"/>${at(90, 160, 1.6, CHAMELEON)}`
	],
	// Mauritius: Le Morne Brabant – Lagune mit Katamaran – Siebenfarbige Erde von Chamarel mit Wasserfall
	MU: [
		() => `${sun(150, 26, 9)}${birds(100, 40)}${LEMORNE(120, 70, 1.1)}${sea(120)}<path d="M100,124 Q130,118 160,126" stroke="var(--stp)" stroke-width="2"/>${palm(160, 120, 30, -4)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(70, 30)}<path d="M0,70 Q20,50 40,60 L46,170 H0 Z" ${L3} stroke-width="1.6"/><path d="M34,60 V140" stroke="var(--stp)" stroke-width="5"/><path d="M34,60 V140" stroke-width="1" stroke-dasharray="3 2"/>${[[16, 50], [6, 80], [40, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" ${L2} stroke="none"/>`).join('')}
${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${50 + i * 4},${170 - i * 2} Q${110},${100 + i * 8} ${180},${120 + i * 9} V170 Z" ${[L4, L3, L2, SNOW, L1, L3][i]} stroke="none"/>`).join('')}<path d="M50,170 Q110,100 180,120" stroke-width="1.6"/>${at(150, 108, 1, `<path d="M-10,0 Q-12,-8 -6,-12 Q0,-14 4,-10 L8,-12 L6,-8 Q8,-4 6,0 Z" ${SOLID}/><path d="M-4,0 V4 M2,0 V4" stroke-width="1.6"/>`)}`
	],
	// Namibia: Fish-River-Canyon – Dünen von Sossusvlei mit Oryx – Köcherbäume unter der Milchstraße
	NA: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,80 H70 L80,110 L60,130 L84,150 L76,170 H0 Z M180,80 H110 L104,110 L120,130 L100,150 L108,170 H180 Z" ${L3} stroke-width="1.8"/><path d="M10,90 V160 M30,90 V160 M50,96 V160 M170,90 V160 M150,90 V160 M130,96 V160" stroke-width="1" stroke-dasharray="6 3"/><path d="M76,170 L84,150 L60,130 L80,110 L70,80 H110 L104,110 L120,130 L100,150 L108,170 Z" ${L1} stroke="none"/><path d="M90,170 L94,150 L82,130 L94,110 L90,90" stroke="var(--stp)" stroke-width="2.4"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1], [40, 30, 1], [110, 60, 1], [20, 90, 1], [160, 80, 1]], STAR)}<path d="M10,110 Q80,20 170,10" stroke="#F4F7FA" stroke-opacity=".22" stroke-width="22"/><path d="M10,110 Q80,20 170,10" stroke="#F4F7FA" stroke-opacity=".18" stroke-width="8"/>
<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L4} stroke="none"/>${[[40, 136, 1.6], [96, 132, 1.2], [140, 138, 1.8], [70, 140, 0.9]].map(([x, y, s]) => at(x, y, s, QUIVER)).join('')}`
	],
	// Ruanda: Teehügel – singende Fischer auf dem Kivusee – Berggorilla im Bambus und Nebel
	RW: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${teahill(40, 110, 50, L1)}${teahill(130, 110, 56, L1)}${teahill(80, 150, 60)}${teahill(170, 160, 40)}${teahill(10, 160, 40)}<path d="M0,160 H180 V170 H0 Z" ${L2} stroke="none"/>`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${bamboo(16, 170, 150)}${bamboo(34, 170, 120)}${bamboo(150, 170, 140)}${bamboo(168, 170, 110)}<path d="M0,60 Q90,50 180,60 M0,90 Q90,80 180,94" stroke="var(--stp)" stroke-width="6" stroke-opacity=".6"/>
${at(90, 154, 1.8, GORILLA)}${at(140, 160, 0.8, GORILLA)}<path d="M0,154 Q90,146 180,156 V170 H0 Z" ${L3} stroke-width="1.6"/>`
	],
	// Seychellen: Seychellennuss – Anse Source d’Argent – Riesenschildkröte am Strand im Abendrot
	SC: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/>${palm(30, 150, 110, 10)}${at(110, 130, 2, COCODEMER)}<path d="M70,150 Q110,140 150,150" stroke-width="1" stroke-dasharray="3 3"/>`,
		null,
		() => `${sun(110, 80, 18)}${rays(110, 80, 18, 16)}${birds(140, 30)}<path d="M0,100 H180 V130 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/>${at(36, 120, 1.1, STACK)}${at(160, 120, 0.8, STACK)}
<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${at(100, 158, 1.6, TORTOISE)}${palm(10, 140, 40, 6)}`
	],
	// St. Helena: Riesenschildkröte vor dem Plantation House – Jamestown im Tal – Walhai im klaren Wasser mit Taucher
	SH: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M40,110 V80 H140 V110" ${SNOW} stroke-width="1.4"/><path d="M36,80 L90,64 L144,80 Z" ${L3} stroke-width="1.2"/>${[50, 66, 106, 122].map((x) => `<rect x="${x}" y="88" width="8" height="10" ${SOLID}/>`).join('')}<path d="M84,110 V94 H96 V110" ${SOLID}/><path d="M0,110 Q90,104 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 152, 1.6, TORTOISE)}${pine(20, 112, 26)}${pine(160, 112, 22)}`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/>
${at(80, 100, 1.4, `<path d="M-46,0 Q-30,-14 0,-14 Q22,-12 34,-4 L50,-16 Q46,-2 50,14 L34,4 Q22,12 0,12 Q-30,12 -46,0 Z" ${SOLID}/><path d="M-12,-14 Q-4,-26 6,-24 Q2,-18 2,-13 Z M-10,10 Q-16,20 -24,22 Q-12,22 -4,12 Z" ${SOLID}/>${dots([[-30, -4, 1.2], [-20, 2, 1.2], [-10, -6, 1.4], [0, 0, 1.2], [10, -6, 1.2], [20, 2, 1.2], [-16, -8, 1], [6, 6, 1]], PAPER)}<path d="M-44,2 Q-40,6 -34,5" stroke="var(--paper)" stroke-width="1.2"/>`)}${at(150, 60, 1, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M0,-3 L4,6 L10,12 M4,6 L-2,12 M-2,-2 L-8,-6" stroke-width="2"/><path d="M10,12 l6,2 M-2,12 l-4,4" stroke-width="2.4"/>`)}<path d="M150,40 v-6 M154,34 v-4" stroke="var(--stp)" stroke-width="1.6"/><path d="M0,154 Q40,144 80,150 Q130,140 180,150 V170 H0 Z" ${L3} stroke-width="1.6"/>`
	],
	// Eswatini: Sibebe-Felsen – Mlilwane mit Zebras und Bienenkorbhütten – Mantenga-Fälle und Dorf in der Abendsonne
	SZ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M10,130 Q20,80 70,66 Q120,60 150,90 Q166,110 170,130 Z" ${L3} stroke-width="1.8"/><path d="M40,100 Q60,80 90,76 M110,80 Q130,90 140,110" stroke-width="1.2"/><path d="M0,130 Q90,122 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${[[30, 150], [150, 152]].map(([x, y]) => at(x, y, 1, BEEHIVE)).join('')}${grass(90, 160)}`,
		null,
		() => `${sun(130, 50, 16)}${rays(130, 50, 16, 16)}${birds(70, 30)}<path d="M0,40 Q30,34 50,48 L56,130 H0 Z" ${L3} stroke-width="1.8"/><path d="M46,48 V128" stroke="var(--stp)" stroke-width="6"/><path d="M46,48 V128" stroke-width="1" stroke-dasharray="3 2"/>${[[10, 40], [34, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" ${L2} stroke="none"/>`).join('')}
<path d="M0,128 Q90,118 180,130 V170 H0 Z" ${L1} stroke-width="2"/>${[[80, 140], [104, 136], [128, 142], [150, 138]].map(([x, y]) => at(x, y, 1, BEEHIVE)).join('')}${at(116, 160, 0.8, PERSON)}${at(70, 160, 0.7, PERSON)}`
	],
	// Tansania: Dau vor Sansibar – Gnuwanderung in der Serengeti – Ngorongoro-Krater mit Flamingosee, Löwen und Nashorn
	TZ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(118)}${at(90, 140, 1.4, `<path d="M-30,-6 Q0,8 34,-10 L28,2 Q0,8 -24,2 Z" ${SOLID}/><path d="M0,-4 V-60" stroke-width="1.6"/><path d="M-24,-54 Q8,-70 24,-10 L0,-8 Z" ${SNOW} stroke-width="1.3"/>`)}<path d="M0,118 Q20,108 40,112 L46,118 Z" ${L3} stroke-width="1.2"/>${palm(16, 114, 30, 4)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(70, 30)}<path d="M0,110 Q20,50 90,46 Q160,50 180,110 Z" ${L2} stroke-width="1.8"/><path d="M14,104 Q90,92 166,104" stroke-width="1.2"/><path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>
<ellipse cx="120" cy="124" rx="40" ry="8" ${L3} stroke-width="1.2"/>${[[100, 124], [112, 122], [124, 124], [136, 121]].map(([x, y]) => at(x, y, 0.7, FLAMINGO)).join('')}${at(30, 154, 1, LION)}${at(140, 158, 1, `<path d="M-14,0 V-8 Q-16,-18 -2,-18 H10 Q16,-18 16,-10 L22,-8 L20,-4 L16,-4 V0 H12 V-4 H-8 V0 Z" ${SOLID}/><path d="M18,-10 L20,-16 L22,-10" ${SOLID}/>`)}`
	],
	// Uganda: Murchison-Fälle – Bunyonyi-See mit Terrassenhügeln – baumkletternde Löwen von Ishasha
	UG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,40 Q40,30 80,50 L84,170 H0 Z M180,40 Q140,30 100,50 L96,170 H180 Z" ${L3} stroke-width="1.8"/><path d="M84,50 H96 V140 H84 Z" ${PAPER}/><path d="M86,50 V140 M90,50 V142 M94,50 V140" stroke-width="1.2"/><path d="M60,150 q8,-8 16,0 q8,-8 16,0 q8,-8 16,0 q8,-8 16,0" stroke="var(--stp)" stroke-width="2"/><path d="M84,140 Q90,170 96,140" ${L1} stroke="none"/>`,
		null,
		() => `${sun(130, 40, 14)}${rays(130, 40, 14, 16)}${birds(70, 30)}<path d="M90,170 Q86,120 92,90 M92,104 Q60,90 40,80 M92,96 Q120,86 146,76" stroke-width="5"/><path d="M14,86 Q30,60 70,66 Q100,56 120,68 Q160,58 176,80 Q150,88 120,82 Q90,90 60,84 Q30,92 14,86 Z" ${L3} stroke-width="1.4"/>
${at(70, 82, 1.3, TREELION)}${at(132, 76, 1.1, TREELION)}<path d="M0,150 Q90,140 180,152 V170 H0 Z" ${L2} stroke-width="1.6"/>${grass(30, 166)}${grass(150, 164)}`
	],
	// Südafrika: Pinguine am Boulders Beach – Big Five in der Savanne – Tafelberg im Abendrot mit Kapstadt und Protea
	ZA: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V136 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${at(30, 132, 1.2, STACK)}${at(150, 130, 0.9, STACK)}<path d="M0,136 Q90,128 180,138 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${[[60, 158, 1.4], [84, 162, 1.2], [104, 156, 1.4], [126, 162, 1.1]].map(([x, y, s]) => at(x, y, s, AFPENG)).join('')}`,
		null,
		() => `${sun(36, 70, 14)}${rays(36, 70, 14, 16)}${birds(130, 26)}<path d="M0,110 L20,80 L40,70 H130 L150,82 L180,100 V120 H0 Z" ${L3} stroke-width="1.8"/><path d="M40,70 H130" stroke-width="2.6"/><path d="M44,70 Q80,66 126,70" stroke="var(--stp)" stroke-width="3" stroke-opacity=".7"/>
${[[30, 30], [46, 40], [62, 26], [80, 36], [100, 46], [118, 30], [136, 38], [152, 28]].map(([x, h], i) => `<path d="M${x - 6},120 V${120 - h} H${x + 6} V120" ${[SNOW, L1, L2][i % 3]} stroke-width="1"/>`).join('')}<path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,120 H180" stroke-width="1.8"/>${at(40, 156, 1.6, PROTEA)}${at(150, 160, 1.2, PROTEA)}<path d="${waves(70, 150, 4, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Sambia: Devil’s Pool an den Victoriafällen – Kanu auf dem Sambesi mit Flusspferden – Flughund-Wanderung von Kasanka in der Dämmerung
	ZM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,80 H180" stroke-width="1.6"/><path d="M0,80 H180 V90 H0 Z" ${L2} stroke="none"/><path d="M0,90 H180 V170 H0 Z" ${PAPER}/>${Array.from({ length: 18 }, (_, i) => `<path d="M${5 + i * 10},90 V${150 + (i % 3) * 6}" stroke-width="1.2"/>`).join('')}<path d="M0,150 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0" stroke="var(--stp)" stroke-width="4"/>
<path d="M60,80 Q60,70 70,70 H100 Q110,70 110,80" ${L3} stroke-width="1.2"/>${at(84, 82, 0.8, PERSON)}<path d="M20,40 A70,70 0 0 1 160,40" stroke-width="2" stroke-opacity=".4"/>`,
		null,
		() => `${sun(90, 90, 20)}${rays(90, 90, 20, 16)}<path d="M0,0 H180 V60 H0 Z" ${L1} stroke="none"/>${bats(20, 20, 40)}${bats(40, 60, 30)}<path d="M0,110 Q20,90 40,100 Q60,80 80,96 Q100,80 120,94 Q140,80 160,96 Q170,90 180,94 V120 H0 Z" ${SOLID}/>
<path d="M0,120 Q90,112 180,122 V170 H0 Z" ${L2} stroke-width="1.6"/>${[[20, 124, 40], [40, 120, 30], [150, 122, 36], [166, 126, 28]].map(([x, y, h]) => palm(x, y, h, 4)).join('')}`
	],
	// Simbabwe: Ruinen von Groß-Simbabwe – Victoriafälle mit Brücke und Regenbogen – Elefant auf den Hinterbeinen in Mana Pools
	ZW: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 Q90,126 180,136 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 136, 1.3, GREATZIM)}${at(20, 136, 0.7, BAOBAB)}${at(164, 136, 0.6, BAOBAB)}`,
		null,
		() => `${sun(130, 60, 18)}${rays(130, 60, 18, 16)}${birds(60, 30)}<path d="M0,120 Q90,110 180,122 V170 H0 Z" ${L2} stroke-width="2"/>${[[30, 120, 22], [160, 122, 18]].map(([x, y, r]) => bush(x, y, r, L3)).join('')}
${at(80, 154, 1.6, ELEUP)}${at(140, 156, 0.9, ELEPHANT, true)}<path d="M20,160 Q90,150 170,162" stroke-width="1" stroke-dasharray="3 3"/>`
	],
	// Réunion: Talkessel des Piton des Neiges – Ausbruch des Piton de la Fournaise – Cirque de Mafate mit Wolken, Wanderern und Tropikvogel
	RE: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,120 L30,60 L50,74 L80,30 L110,70 L130,56 L180,110 V170 H0 Z" ${L2} stroke-width="1.8"/><path d="M80,30 L72,44 L81,40 L86,46 Z" ${SNOW} stroke-width="1.1"/><path d="M30,60 V150 M80,30 V150 M130,56 V150" stroke-width="1" stroke-dasharray="6 3"/><path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${[[30, 142], [60, 146], [120, 144]].map(([x, y]) => `<path d="M${x - 4},${y} V${y - 8} L${x},${y - 12} L${x + 4},${y - 8} V${y} Z" ${SNOW} stroke-width="1"/>`).join('')}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M0,170 V50 Q20,40 30,60 L40,170 Z M180,170 V44 Q160,34 150,56 L140,170 Z" ${L3} stroke-width="1.8"/><path d="M40,170 Q60,90 90,86 Q120,90 140,170 Z" ${L2} stroke-width="1.6"/>${cloud(40, 100)}${cloud(100, 112)}${cloud(60, 130)}
${[[90, 150], [76, 160], [108, 158]].map(([x, y]) => `<path d="M${x - 5},${y} V${y - 8} L${x},${y - 12} L${x + 5},${y - 8} V${y} Z" ${SNOW} stroke-width="1"/>`).join('')}${at(24, 60, 0.8, PERSON)}${at(34, 62, 0.7, PERSON)}${at(110, 50, 1, `<path d="M-14,0 Q-6,-6 0,0 Q6,-6 14,0 Q6,-2 2,2 L0,22 L-2,2 Q-6,-2 -14,0 Z" ${SNOW} stroke-width="1"/>`)}`
	],
	// Mayotte: Ylang-Ylang-Blüten – Doppellagune mit Schildkröte – Buckelwal springt in der Lagune
	YT: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M20,170 Q30,120 60,90 Q90,70 130,60" stroke-width="3"/><path d="M60,90 Q40,80 30,90 M90,74 Q100,60 116,62" stroke-width="2"/>${[[70, 100], [100, 80], [130, 74], [50, 120], [140, 100]].map(([x, y]) => at(x, y, 1.5, YLANG)).join('')}${[[40, 100], [110, 96], [150, 66]].map(([x, y]) => `<path d="M${x},${y} q-10,-4 -16,4 q8,4 16,-4 Z" ${L3} stroke-width="1"/>`).join('')}`,
		null,
		() => `${sun(130, 40, 12)}${rays(130, 40, 12, 16)}${birds(70, 30)}<path d="M0,90 L40,60 L80,76 L120,56 L180,84 V100 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/>${at(100, 150, 1.6, HUMPBACK)}<path d="${waves(10, 120, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Angola: Miradouro da Lua – Bucht von Luanda – (Legendary: bisheriges Bild)
	AO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V80 L10,70 L18,88 L28,66 L36,90 L46,62 L56,92 L66,70 L74,96 L86,64 L96,94 L106,72 L116,98 L128,66 L138,92 L148,70 L160,96 L170,74 L180,90 V170 Z" ${L3} stroke-width="1.6"/>${Array.from({ length: 16 }, (_, i) => `<path d="M${8 + i * 11},${100 + (i % 3) * 6} V160" stroke-width="1" stroke-dasharray="4 3"/>`).join('')}${sea(150)}`,
		null,
		SCENES.AO
	],
	// Burkina Faso: Felsnadeln von Sindou – Große Moschee von Bobo-Dioulasso – (Legendary: bisheriges Bild)
	BF: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V110 ${Array.from({ length: 12 }, (_, i) => `L${8 + i * 15},${60 + ((i * 23) % 40)} L${15 + i * 15},${100 + ((i * 7) % 12)}`).join(' ')} L180,110 V170 Z" ${L3} stroke-width="1.6"/><path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${[[30, 160], [150, 162]].map(([x, y]) => at(x, y, 1, RONDAVEL)).join('')}`,
		null,
		SCENES.BF
	],
	// Burundi: Fischer mit Laternen auf dem Tanganjikasee – (Epic: Hügel mit Bananen und Ankole-Rindern) – (Legendary: bisheriges Bild)
	BI: [
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40, 1], [80, 40, 1]], STAR)}<path d="M152,22 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${STAR} stroke="none"/><path d="M0,90 Q40,76 90,84 Q140,74 180,88 V100 H0 Z" ${L3} stroke="none"/><path d="M0,100 H180 V170 H0 Z" ${L4} stroke="none"/>
${[[40, 130, 1], [100, 140, 1.1], [150, 124, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-30,0 Q0,6 30,0 L28,-3 H-28 Z M-30,6 H30" ${SOLID}/><path d="M-20,-3 L-30,-30 M20,-3 L30,-30 M-30,-30 H30" stroke-width="1.2"/>${candle(0, -4)}`)).join('')}<path d="M30,150 V164 M100,160 V170 M150,140 V150" stroke="#F7E3A1" stroke-opacity=".5" stroke-width="2"/>`,
		null,
		SCENES.BI
	],
	// Zentralafrikanische Republik: Wasserfälle von Boali – Pirogen auf dem Ubangi – (Legendary: bisheriges Bild)
	CF: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,60 Q40,50 70,64 L74,170 H0 Z M180,56 Q140,48 110,62 L106,170 H180 Z" ${L3} stroke-width="1.8"/>${[[10, 56], [40, 50], [150, 50], [170, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L2} stroke="none"/>`).join('')}${cascades(66, 64, 48, 3)}${cascades(60, 100, 60, 4)}<path d="M0,140 H180 V170 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		SCENES.CF
	],
	// Republik Kongo: Basilika Sainte-Anne in Brazzaville – Stromschnellen des Kongo mit Piroge – (Legendary: bisheriges Bild)
	CG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.4, `<path d="M-30,0 V-30 H30 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-34,-30 L0,-46 L34,-30 Z" ${L3} stroke-width="1.2"/><path d="M-6,-46 V-70 H6 V-46" ${SNOW} stroke-width="1.2"/><path d="M-7,-70 L0,-86 L7,-70 Z" ${L3} stroke-width="1"/>${[-22, -12, 12, 22].map((x) => `<path d="M${x - 2},-4 V-22 L${x},-26 L${x + 2},-22 V-4 Z" ${SOLID}/>`).join('')}`)}${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		SCENES.CG
	],
	// Dschibuti: Salzkristalle am Assalsee – Golf von Tadjoura mit Walhai und Dau – (Legendary: bisheriges Bild)
	DJ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,96 L30,70 L60,82 L100,56 L140,80 L180,66 V104 H0 Z" ${L2} stroke-width="1.6"/><path d="M0,104 H180 V124 H0 Z" ${L1} stroke="none"/><path d="M0,104 H180" stroke-width="1.4"/><path d="M0,124 H180 V170 H0 Z" ${SNOW} stroke-width="1.4"/>
${Array.from({ length: 14 }, (_, i) => `<path d="M${6 + i * 13},${150 + (i % 3) * 6} l4,-10 l4,10 M${10 + i * 13},${140 + (i % 3) * 6} l3,-6 l3,6" stroke-width="1.2"/>`).join('')}${at(140, 122, 0.6, CAMEL)}`,
		null,
		SCENES.DJ
	],
	// Eritrea: Arkadenhäuser von Massawa – Dampfzug auf der Bergstrecke Asmara–Massawa – (Legendary: bisheriges Bild)
	ER: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(90, 128, 1.6, ARCADES)}${sea(128)}${palm(14, 128, 34, 4)}${palm(166, 128, 30, -4)}`,
		null,
		SCENES.ER
	],
	// Äthiopien: Dschelada im Simien-Gebirge – Schwefelquellen von Dallol – (Legendary: bisheriges Bild)
	ET: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V90 L20,70 L30,96 L44,60 L56,90 L70,50 L84,170 Z" ${L3} stroke-width="1.8"/><path d="M84,170 L90,100 Q120,80 180,90 V170 Z" ${L1} stroke-width="1.4"/><path d="M90,110 L110,100 L130,110 L150,96 L180,104" stroke-width="1.2"/>${at(66, 62, 1.4, GELADA)}${at(120, 140, 1.2, GELADA)}${grass(150, 160)}`,
		null,
		SCENES.ET
	],
	// Gabun: Mandrill im Regenwald von Lopé – Kongou-Fälle am Ivindo – (Legendary: bisheriges Bild)
	GA: [
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[14, 20], [46, 0], [140, 10], [170, 34], [20, 140], [160, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" ${L2} stroke="none"/>`).join('')}${at(90, 140, 3, MANDRILL)}<path d="M0,150 Q90,140 180,152 V170 H0 Z" ${L3} stroke-width="1.6"/>`,
		null,
		SCENES.GA
	],
	// Gambia: Arch 22 in Banjul – Flussmündung mit Mangroven, Vögeln und Fischerbooten – (Legendary: bisheriges Bild)
	GM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.4, ARCH22)}${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		SCENES.GM
	],
	// Guinea: Strand der Îles de Los – Hochland Fouta Djallon mit Rindern und Hütten – (Legendary: bisheriges Bild)
	GN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,104 Q30,90 60,98 L70,104 Z M120,104 Q140,92 170,96 L180,104 Z" ${L3} stroke-width="1.4"/>${sea(104)}<path d="M0,140 Q90,128 180,142 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${palm(30, 146, 50, 8)}${palm(150, 146, 44, -8)}${at(90, 132, 0.9, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>`)}`,
		null,
		SCENES.GN
	],
	// Äquatorialguinea: Kathedrale von Malabo – Kratersee im Moka-Tal – (Legendary: bisheriges Bild)
	GQ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.5, TWINCH)}${palm(16, 150, 34, 4)}${palm(166, 150, 30, -4)}`,
		null,
		SCENES.GQ
	],
	// Guinea-Bissau: schlüpfende Meeresschildkröten auf Poilão – Mangrovenkanäle mit Piroge – (Legendary: bisheriges Bild)
	GW: [
		() => `${sun(130, 60, 14)}${rays(130, 60, 14, 16)}${birds(70, 30)}<path d="M0,100 H180 V120 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/><path d="M0,120 Q90,110 180,122 V170 H0 Z" ${SNOW} stroke-width="1.6"/>
${[[40, 140, 0.5, -20], [70, 150, 0.45, -10], [100, 136, 0.5, 10], [130, 156, 0.45, 20], [60, 130, 0.4, 0]].map(([x, y, s, a]) => `<g transform="translate(${x},${y}) rotate(${a}) scale(${s})">${TURTLE}</g>`).join('')}<path d="M40,150 q-4,6 -8,10 M100,146 q2,6 0,10" stroke-width="1" stroke-dasharray="1 2"/>`,
		null,
		SCENES.GW
	],
	// Komoren: Altstadt von Mutsamudu mit Minarett – Schildkrötenstrand auf Mohéli – (Legendary: bisheriges Bild)
	KM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,40 L40,30 L70,60 L80,110 H0 Z" ${L2} stroke-width="1.6"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${50 + (i % 5) * 18},${110 - ((i / 5) | 0) * 14} V${100 - ((i / 5) | 0) * 14} H${66 + (i % 5) * 18} V${110 - ((i / 5) | 0) * 14}" ${[SNOW, L1][i % 2]} stroke-width="1"/>`).join('')}${at(120, 82, 1, MINARET)}${sea(112)}${at(50, 140, 1, `<path d="M-30,-6 Q0,8 34,-10 L28,2 Q0,8 -24,2 Z" ${SOLID}/><path d="M0,-4 V-40" stroke-width="1.6"/><path d="M-20,-36 Q6,-46 20,-10 L0,-8 Z" ${SNOW} stroke-width="1.3"/>`)}`,
		null,
		SCENES.KM
	],
	// Liberia: Kautschukbaum mit Zapfschale – Fluss im Sapo-Nationalpark – (Legendary: bisheriges Bild)
	LR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${at(60, 144, 1.4, RUBBER)}${at(140, 144, 1, RUBBER)}${at(100, 160, 0.9, PERSON)}`,
		null,
		SCENES.LR
	],
	// Libyen: Gassen von Ghadames – Felsbögen und Felsbilder im Akakus – (Legendary: bisheriges Bild)
	LY: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/>${at(90, 150, 1.8, GHADAMES)}`,
		null,
		SCENES.LY
	],
	// Mali: Sankoré-Moschee in Timbuktu – Pirogen auf dem Niger vor den Bandiagara-Klippen – (Legendary: bisheriges Bild)
	ML: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,136 Q90,128 180,138 V170 H0 Z" ${SNOW} stroke-width="2"/>${at(90, 138, 1.5, SQMINARET)}${at(30, 160, 0.8, CAMEL)}`,
		null,
		SCENES.ML
	],
	// Mauretanien: Banc d’Arguin mit Flamingos und Lanche – Richat-Struktur, das Auge der Sahara – (Legendary: bisheriges Bild)
	MR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 Q40,88 90,96 Q140,86 180,98 V110 H0 Z" ${SNOW} stroke-width="1.6"/><path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${at(60, 140, 1.4, `<path d="M-24,0 Q0,6 24,-2 L20,-6 H-20 Z" ${SOLID}/><path d="M0,-6 V-40" stroke-width="1.4"/><path d="M0,-40 L-22,-8 H0 Z" ${SNOW} stroke-width="1.2"/>`)}${[[120, 130], [134, 128], [148, 132], [160, 128]].map(([x, y]) => at(x, y, 1, FLAMINGO)).join('')}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		SCENES.MR
	],
	// Malawi: Teefelder am Mulanje-Massiv – Elefanten am Shire in Liwonde – (Legendary: bisheriges Bild)
	MW: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 L30,60 L50,72 L80,30 L110,64 L140,50 L180,90 V110 H0 Z" ${L2} stroke-width="1.8"/><path d="M80,30 V100 M50,72 V104 M140,50 V100" stroke-width="1" stroke-dasharray="5 3"/><path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${tea(0, 124, 180, 6)}${at(60, 160, 0.8, PERSON)}`,
		null,
		SCENES.MW
	],
	// Mosambik: Festung auf der Ilha de Moçambique – Strand von Tofo mit Mantarochen – (Legendary: bisheriges Bild)
	MZ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(90, 118, 1.2, `<path d="M-60,0 V-26 H60 V0" ${L2} stroke-width="1.4"/>${[-56, 56].map((x) => `<path d="M${x - 10},0 V-34 L${x},-40 L${x + 10},-34 V0" ${L2} stroke-width="1.3"/>`).join('')}<path d="M-60,-26 l3,-4 l3,4 l3,-4 l3,4 l3,-4 l3,4 l3,-4 l3,4 M24,-26 l3,-4 l3,4 l3,-4 l3,4 l3,-4 l3,4 l3,-4 l3,4" stroke-width="1"/><path d="M-10,-26 V-44 H10 V-26" ${SNOW} stroke-width="1.2"/><path d="M-4,0 V-12 Q0,-16 4,-12 V0 Z" ${SOLID}/>`)}${sea(118)}${palm(16, 118, 30, 4)}${palm(166, 118, 26, -4)}`,
		null,
		SCENES.MZ
	],
	// Niger: Tuareg im Indigo-Turban mit Kamel – Giraffen von Kouré unter Akazien – (Legendary: bisheriges Bild)
	NE: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,120 Q40,104 90,112 Q140,104 180,116 V170 H0 Z" ${SNOW} stroke-width="2"/><path d="M0,140 Q60,128 120,140 T180,136" stroke-width="1" stroke-dasharray="3 3"/>${at(70, 158, 2, TUAREG)}`,
		null,
		SCENES.NE
	],
	// Sudan: Tempel am Jebel Barkal – Nil mit Feluke, Dattelpalmen und Wüste – (Legendary: bisheriges Bild)
	SD: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 Q90,126 180,136 V170 H0 Z" ${SNOW} stroke-width="2"/>${at(90, 134, 1.3, BARKAL)}${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		SCENES.SD
	],
	// Sierra Leone: Cotton Tree in Freetown – Strand von River No. 2 – (Legendary: bisheriges Bild)
	SL: [
		() => `${sun(150, 26, 9)}${birds(80, 40)}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,150 H180" stroke-width="2"/>${at(90, 150, 1.6, COTTONTREE)}${[[30, 30], [160, 40]].map(([x, h]) => `<path d="M${x - 10},150 V${150 - h} H${x + 10} V150" ${L2} stroke-width="1.1"/>`).join('')}`,
		null,
		SCENES.SL
	],
	// Somalia: Kamele am Brunnen – Küste von Berbera mit Dauen – (Legendary: bisheriges Bild)
	SO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,134 Q90,124 180,136 V170 H0 Z" ${SNOW} stroke-width="2"/>${at(90, 140, 1.4, CAMELWELL)}${at(30, 150, 1, CAMEL)}${at(130, 152, 1, CAMEL, true)}${at(160, 134, 0.7, ACACIA)}${at(60, 164, 0.7, PERSON)}`,
		null,
		SCENES.SO
	],
	// Südsudan: Einbaum zwischen Papyrus am Weißen Nil – Wanderung der Weißohr-Kobs – (Legendary: bisheriges Bild)
	SS: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${PAPYRUS(20, 110)}${PAPYRUS(30, 112)}${PAPYRUS(150, 112)}${PAPYRUS(162, 110)}${PAPYRUS(172, 114)}${at(90, 140, 1.4, `<path d="M-24,0 Q0,4 24,0 L22,-3 H-22 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}<path d="M4,-14 L16,6" stroke-width="1.2"/>`)}<path d="${waves(10, 158, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		SCENES.SS
	],
	// São Tomé und Príncipe: Kakaoplantage mit Pflanzerhaus – Äquatorlinie auf dem Ilhéu das Rolas – (Legendary: bisheriges Bild)
	ST: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 L40,60 L80,80 L120,50 L180,90 V120 H0 Z" ${L1} stroke-width="1.6"/>${at(90, 128, 1.3, ROCA)}<path d="M0,128 Q90,120 180,130 V170 H0 Z" ${L2} stroke-width="1.8"/>${[[30, 160, 0], [150, 158, 8]].map(([x, y, d]) => `<path d="M${x},${y} V${y - 22}" stroke-width="2.4"/><ellipse cx="${x - 6}" cy="${y - 10 - d}" rx="3" ry="6" ${SOLID}/><ellipse cx="${x + 6}" cy="${y - 14}" rx="3" ry="6" ${SOLID}/>`).join('')}`,
		null,
		SCENES.ST
	],
	// Tschad: Papyrusboote auf dem Tschadsee – Elefantenherde in Zakouma – (Legendary: bisheriges Bild)
	TD: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${PAPYRUS(16, 110)}${PAPYRUS(26, 112)}${PAPYRUS(166, 110)}${at(70, 140, 1.3, PAPYRUSBOAT)}${at(140, 132, 0.8, PAPYRUSBOAT)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		SCENES.TD
	],
	// Argentinien: Perito-Moreno-Gletscher – Iguazú-Fälle – Tango in La Boca bei Nacht
	AR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,80 L30,50 L60,66 L100,40 L140,64 L180,50 V100 H0 Z" ${L1} stroke-width="1.6"/>${GLACIER(118)}<path d="M0,118 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,118 H180" stroke-width="1.6"/>${at(60, 140, 0.4, ICEBERG)}${at(130, 150, 0.3, ICEBERG)}${at(110, 132, 0.8, `<path d="M-24,0 H24 L20,5 H-20 Z" ${SOLID}/><path d="M-16,0 V-6 H14 V0" ${SNOW} stroke-width="1.1"/>`)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[100, 12], [150, 10], [170, 30, 1]], STAR)}${nyhavn(0, 130, 3, 18).replace(/var\(--stp\)/g, '#F4F7FA')}${nyhavn(126, 130, 3, 18).replace(/var\(--stp\)/g, '#F4F7FA')}
<path d="M0,130 H180 V170 H0 Z" ${L4} stroke="none"/>${[20, 60, 100, 140, 170].map((x, i) => lantern(x, 46 + (i % 2) * 8, 0.8, 'fill="#F7E3A1" fill-opacity=".9" stroke="none"')).join('')}<path d="M0,40 Q90,56 180,40" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="1"/>${at(90, 160, 1.8, `<g style="color:#F4F7FA">${TANGO}</g>`)}<ellipse cx="90" cy="162" rx="40" ry="5" fill="#F7E3A1" fill-opacity=".2" stroke="none"/>`
	],
	// Bolivien: Schilfboot auf dem Titicacasee – Salar de Uyuni mit Spiegelung – Laguna Colorada mit Flamingos vor dem Vulkan
	BO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,96 L40,60 L70,74 L110,40 L150,70 L180,56 V110 H0 Z" ${L1} stroke-width="1.6"/><path d="M110,40 L102,52 L111,49 L116,54 Z" ${SNOW} stroke-width="1"/><path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${at(90, 146, 1.6, TOTORA)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(36, 70, 10)}${rays(36, 70, 10)}${birds(130, 26)}<path d="M40,100 L90,40 Q96,34 102,40 L160,100 Z" ${L2} stroke-width="1.8"/><path d="M90,40 L84,50 L92,47 L97,52 Z" ${SNOW} stroke-width="1"/><path d="M0,100 H180 V140 H0 Z" ${L3} stroke="none"/><path d="M0,100 H180" stroke-width="1.4"/>
<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${[[40, 124], [56, 120], [70, 126], [110, 118], [124, 124], [140, 120], [90, 130]].map(([x, y]) => at(x, y, 1, FLAMINGO)).join('')}<path d="M10,112 h30 M120,110 h40" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Brasilien: Tukan am Amazonas – Copacabana mit Zuckerhut – Karneval in Rio mit Christusstatue
	BR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 Q90,100 180,112" stroke-width="1.6"/>${[[16, 104, 14], [40, 100, 12], [150, 102, 16], [172, 100, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${L3} stroke="none"/>`).join('')}${at(90, 92, 1.6, TOUCAN)}<path d="${waves(10, 150, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${burst(40, 50, 3).replace(/currentColor/g, '#F7E3A1')}${burst(150, 40, 2).replace(/currentColor/g, '#F4F7FA')}${burst(110, 70, 2).replace(/currentColor/g, '#F7E3A1')}
<path d="M0,100 Q30,70 70,74 Q100,60 120,40 L132,60 Q150,80 180,90 V130 H0 Z" ${L3} stroke="none"/>${at(124, 40, 1.1, `<g style="color:#F4F7FA">${CRISTO}</g>`)}<path d="M0,130 H180 V170 H0 Z" ${L4} stroke="none"/>${at(70, 168, 1.4, SAMBA)}${at(140, 168, 0.9, SAMBA)}`
	],
	// Chile: Torres del Paine – Atacama mit ALMA-Teleskopen unter der Milchstraße – Moai von Ahu Tongariki bei Sonnenaufgang
	CL: [
		() => `${sun(150, 26, 9)}${birds(30, 50)}${PAINE(120)}<path d="M0,120 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,120 H180" stroke-width="1.6"/><g opacity=".3" transform="translate(0,240) scale(1,-1)">${PAINE(120)}</g>${at(150, 118, 1, LLAMA)}`,
		null,
		() => `${sun(90, 104, 22)}${rays(90, 104, 22, 18)}${birds(140, 30)}<path d="M0,110 H180" stroke-width="1.4"/><path d="M0,110 H180 V130 H0 Z" ${L2} stroke="none"/><path d="M0,124 H180 V140 H0 Z" ${L3} stroke-width="1.4"/>${[20, 40, 58, 76, 94, 112, 130, 150, 168].map((x, i) => at(x, 124, 1 - (i % 3) * 0.1, MOAI)).join('')}
<path d="M0,140 Q90,132 180,142 V170 H0 Z" ${L1} stroke-width="1.6"/>${grass(30, 160)}${grass(140, 164)}`
	],
	// Kolumbien: Kolonialbalkone in Cartagena – Caño Cristales, der Fluss der fünf Farben – Kaffeeregion mit Willys-Jeep, Wachspalmen und Kolibri
	CO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/>${cartagena(2, 150, 8)}${at(150, 40, 1, HUMMINGBIRD)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(70, 30)}<path d="M0,110 Q40,70 90,80 Q140,66 180,90 V170 H0 Z" ${L1} stroke-width="1.8"/>${tea(0, 110, 180, 5)}${[[20, 112, 80], [44, 108, 96], [160, 110, 88]].map(([x, y, h]) => `<path d="M${x},${y} V${y - h}" stroke-width="2"/><path d="M${x - 10},${y - h + 6} Q${x},${y - h - 6} ${x + 10},${y - h + 6} M${x},${y - h} q-12,4 -16,12 M${x},${y - h} q12,4 16,12" stroke-width="2"/>`).join('')}
<path d="M0,150 Q90,140 180,152 V170 H0 Z" ${L2} stroke-width="1.6"/>${at(100, 154, 1.6, WILLYS)}${at(120, 60, 1.4, HUMMINGBIRD)}`
	],
	// Ecuador: Cotopaxi – Galápagos mit Blaufußtölpeln und Seelöwen – Meerechse, Riesenschildkröte und Fregattvogel im Abendlicht
	EC: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M10,120 L76,46 Q90,40 104,46 L170,120 Z" ${L2} stroke-width="1.8"/><path d="M76,46 Q90,40 104,46 L112,58 L100,54 L92,64 L84,54 L70,58 Z" ${SNOW} stroke-width="1.2"/><path d="M0,120 Q90,110 180,122 V170 H0 Z" ${L1} stroke-width="2"/>${at(140, 150, 1, LLAMA)}${grass(40, 160)}`,
		null,
		() => `${sun(100, 80, 18)}${rays(100, 80, 18, 16)}${at(140, 40, 1.2, FRIGATE)}<path d="M0,104 H180 V130 H0 Z" ${L2} stroke="none"/><path d="M0,104 H180" stroke-width="1.6"/><path d="M0,130 Q30,118 60,124 Q100,112 140,122 Q160,118 180,124 V170 H0 Z" ${L4} stroke-width="1.6"/>
${at(60, 150, 1.6, IGUANA)}${at(140, 160, 0.9, TORTOISE)}`
	],
	// Falklandinseln: Walknochenbogen vor der Kathedrale von Stanley – Eselspinguin-Kolonie – Albatrosse an den Klippen
	FK: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(100, 140, 1.4, WHALEBONE)}${[[20, 128], [36, 132]].map(([x, y]) => `<path d="M${x - 8},140 V${y} L${x},${y - 8} L${x + 8},${y} V140" ${L2} stroke-width="1"/>`).join('')}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${at(110, 50, 1.3, ALBATROSS)}${at(60, 80, 0.8, ALBATROSS)}<path d="M0,70 Q30,64 70,80 L90,170 H0 Z" ${L3} stroke-width="1.8"/><path d="M0,70 Q30,64 70,80" stroke-width="3"/>${[[20, 72], [40, 74], [56, 78]].map(([x, y]) => at(x, y, 0.6, `<path d="M-6,0 Q-8,-6 -2,-8 Q6,-8 6,-2 Q6,0 2,0 Z" ${SNOW} stroke-width="1"/><path d="M2,-6 L8,-4" stroke-width="1"/>`)).join('')}
${sea(110).replace('M0,110 H180', 'M80,110 H180')}<path d="M80,110 H180 V170 H84 Z" ${L2} stroke="none"/><path d="${waves(90, 130, 6, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/><path d="M20,100 V160 M40,100 V160 M60,110 V160" stroke-width="1" stroke-dasharray="6 3"/>`
	],
	// Südgeorgien: Kirche und Walfangstation von Grytviken – Königspinguin-Kolonie in der St Andrews Bay – See-Elefanten vor dem Gletscher
	GS: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,96 L30,50 L60,70 L100,30 L140,66 L180,44 V110 H0 Z" ${SNOW} stroke-width="1.8"/><path d="M30,50 L36,80 M100,30 L94,70 M140,66 L146,90" stroke-width="1"/><path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${at(100, 140, 1.3, WOODCHURCH)}${[[30, 150], [150, 152]].map(([x, y]) => `<path d="M${x - 12},${y} V${y - 14} Q${x},${y - 20} ${x + 12},${y - 14} V${y}" ${L3} stroke-width="1.2"/>`).join('')}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(70, 30)}${GLACIER(110)}<path d="M0,110 H180 V130 H0 Z" ${L2} stroke="none"/><path d="M0,130 Q90,122 180,132 V170 H0 Z" ${L1} stroke-width="1.6"/>
${at(60, 160, 1.6, `<path d="M-26,0 Q-28,-10 -18,-14 Q-4,-18 10,-16 Q20,-14 24,-6 Q26,0 20,0 Z" ${SOLID}/><path d="M18,-14 Q26,-14 28,-8 Q28,-4 24,-4" ${SOLID}/><circle cx="20" cy="-12" r=".9" ${PAPER}/><path d="M-26,0 L-32,-4 M-26,0 L-32,4" stroke-width="2"/>`)}${at(140, 156, 1, `<path d="M-26,0 Q-28,-10 -18,-14 Q-4,-18 10,-16 Q20,-14 24,-6 Q26,0 20,0 Z" ${SOLID}/>`)}${[[110, 130], [122, 132], [134, 128]].map(([x, y]) => at(x, y, 0.6, GENTOO)).join('')}`
	],
	// Guyana: Holzkathedrale St. George in Georgetown – Kaieteur-Fälle – Riesenseerosen mit Hoatzin
	GY: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,146 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,146 H180" stroke-width="2"/>${at(90, 146, 1.6, WOODCHURCH)}${palm(16, 156, 34, 4)}${palm(166, 156, 30, -4)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M0,0 H40 Q50,40 30,80 M180,0 H140 Q130,40 150,80" stroke-width="2"/>${[[20, 20], [10, 60], [160, 24], [170, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L3} stroke="none"/>`).join('')}<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/>
${LILYPAD(50, 130, 34)}${LILYPAD(130, 120, 26)}${LILYPAD(120, 154, 30)}<path d="M80,120 Q86,108 92,120 Q86,126 80,120 Z" ${SNOW} stroke-width="1"/>${at(40, 84, 1.4, HOATZIN)}<path d="M20,90 Q40,86 70,92" stroke-width="2.4"/>`
	],
	// Paraguay: Jesuitenreduktion Trinidad – Chaco mit Jabirus – Ñandutí-Spitze mit paraguayischer Harfe
	PY: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 Q90,132 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 140, 1.3, REDUCCION)}${grass(20, 160)}${grass(164, 158)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<g transform="translate(78,82) scale(.82)">${Array.from({ length: 24 }, (_, i) => {
			const a = (i * Math.PI) / 12;
			return `<path d="M${f1(6 * Math.cos(a))},${f1(6 * Math.sin(a))} L${f1(48 * Math.cos(a))},${f1(48 * Math.sin(a))}" stroke-width="1"/>`;
		}).join('')}${Array.from({ length: 12 }, (_, i) => {
			const a = ((i + 0.5) * Math.PI) / 6;
			return `<ellipse cx="${f1(28 * Math.cos(a))}" cy="${f1(28 * Math.sin(a))}" rx="9" ry="3.6" transform="rotate(${f1((a * 180) / Math.PI)} ${f1(28 * Math.cos(a))} ${f1(28 * Math.sin(a))})" ${L3} stroke-width="1.1"/>`;
		}).join('')}<circle r="16" stroke-width="1.2" stroke-dasharray="2 2"/><circle r="42" stroke-width="1.2" stroke-dasharray="2 2"/><circle r="48" stroke-width="2"/><circle r="5" ${SOLID}/></g>
${at(140, 150, 1.4, HARP)}<path d="M0,150 Q90,142 180,152 V170 H0 Z" ${L2} stroke-width="1.6"/>`
	],
	// Suriname: Holzkathedrale von Paramaribo – Fluss im Regenwald mit Kanu – Pfeilgiftfrosch in der Bromelie, Aras im Regenwald
	SR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,146 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,146 H180" stroke-width="2"/>${at(90, 146, 1.5, `${WOODCHURCH}<path d="M-30,0 V-20 H-20 V0 M20,0 V-20 H30 V0" ${SNOW} stroke-width="1.1"/><path d="M-32,-20 L-25,-30 L-18,-20 Z M18,-20 L25,-30 L32,-20 Z" ${SOLID}/>`)}${palm(16, 156, 34, 4)}${palm(166, 156, 30, -4)}`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[14, 20], [46, 0], [140, 10], [170, 34], [90, -10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="28" ${L2} stroke="none"/>`).join('')}<path d="M30,0 Q40,80 26,170 M156,0 Q146,80 160,170" stroke-width="6"/>
${at(130, 60, 1, `<path d="M0,0 Q-6,-10 0,-20 Q8,-24 10,-14 Q12,-4 6,0 Z" ${SOLID}/><path d="M6,-2 Q4,20 -2,36" stroke-width="2.4"/><path d="M8,-18 l6,2" stroke-width="1.6"/>`)}<path d="M50,170 Q60,120 90,110 Q120,120 130,170 Z M70,140 Q80,110 90,104 Q100,110 110,140" ${L3} stroke-width="1.4"/>${at(90, 128, 1.4, `<ellipse cx="0" cy="-6" rx="9" ry="7" ${SOLID}/><circle cx="-5" cy="-12" r="3" ${SOLID}/><circle cx="5" cy="-12" r="3" ${SOLID}/><circle cx="-5" cy="-12" r="1.2" ${PAPER}/><circle cx="5" cy="-12" r="1.2" ${PAPER}/>${dots([[-3, -4, 1.2], [3, -6, 1.4], [0, -2, 1]], PAPER)}<path d="M-8,-4 l-6,4 M8,-4 l6,4" stroke-width="2"/>`)}`
	],
	// Uruguay: Skulptur „Los Dedos“ in Punta del Este – Leuchtturm von Colonia del Sacramento – Gaucho beim Asado im Abendrot
	UY: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V130 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/><path d="M0,130 Q90,122 180,132 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${at(90, 150, 1.5, DEDOS)}`,
		null,
		() => `${sun(120, 80, 20)}${rays(120, 80, 20, 16)}${birds(150, 30)}<path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${at(150, 110, 0.9, ACACIA)}${at(50, 160, 1.6, GAUCHO)}${at(130, 158, 1.4, ASADO)}<path d="M130,140 q-4,-8 0,-16 q4,-8 0,-16" stroke-width="1.2"/>${grass(100, 166)}`
	],
	// Venezuela: Strand von Los Roques mit Pelikan – Llanos mit Wasserschweinen und Scharlachsichlern – (Legendary: bisheriges Bild)
	VE: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V136 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/><path d="M60,110 Q90,100 130,110 Z" ${SNOW} stroke-width="1.2"/>${palm(100, 108, 20, 3)}<path d="M0,136 Q90,128 180,138 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${at(60, 156, 1.5, PELICAN)}${at(140, 150, 1, `<path d="M-14,0 H14 L10,4 H-10 Z" ${SOLID}/>`)}`,
		null,
		SCENES.VE
	],
	// USA: Freiheitsstatue – Grand Canyon – Golden Gate Bridge im Abendnebel
	US: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,130 H180" stroke-width="1.6"/>${at(90, 132, 1.2, LIBERTY)}${[[150, 40], [164, 56], [176, 30]].map(([x, h], i) => `<path d="M${x - 6},130 V${130 - h} H${x + 6} V130" ${[L1, L2][i % 2]} stroke-width="1"/>`).join('')}<path d="${waves(10, 154, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(130, 70, 18)}${rays(130, 70, 18, 16)}${birds(150, 30)}<path d="M0,96 L20,70 L40,80 L60,60 L80,80 L100,70 L120,84 L140,66 L160,78 L180,70" stroke-width="1.4"/><path d="M0,104 Q40,90 80,100 Q130,86 180,100" ${SNOW} stroke-width="2.2"/>${goldengate(-10, 112, 200)}
<path d="M0,112 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,112 H180" stroke-width="1.4"/><path d="${waves(10, 140, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(140, 156, 0.8, SAIL)}`
	],
	// Kanada: Moraine Lake mit Kanu – Niagarafälle – Herbstwald mit Elch und Kanu im Abendrot
	CA: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 L14,60 L28,74 L44,40 L60,70 L76,44 L92,70 L108,36 L124,66 L140,50 L156,74 L180,60 V120 H0 Z" ${L2} stroke-width="1.8"/><path d="M44,40 L40,50 L45,48 L48,52 Z M108,36 L103,46 L109,44 L112,48 Z M76,44 L72,52 L77,50 L80,54 Z" ${SNOW} stroke-width="1"/>${[[10, 120, 26], [24, 122, 20], [160, 120, 28], [172, 122, 20]].map(([x, y, h]) => pine(x, y, h)).join('')}
<path d="M0,120 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,120 H180" stroke-width="1.6"/>${at(90, 146, 1.3, CANOE)}<path d="${waves(10, 162, 11, 15, 2.4)}" stroke-width="1.4"/>`,
		null,
		() => `${sun(130, 70, 18)}${rays(130, 70, 18, 16)}${birds(150, 30)}<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/>
${[[10, 102, 40], [26, 104, 30], [44, 102, 44], [156, 102, 42], [172, 104, 32]].map(([x, y, h], i) => i % 2 ? pine(x, y, h) : `<path d="M${x},${y} V${y - h * 0.4}" stroke-width="2"/><circle cx="${x}" cy="${y - h * 0.6}" r="${h * 0.32}" ${L3} stroke-width="1.2"/>`).join('')}${at(80, 140, 1.4, CANOE)}${at(140, 118, 1, MOOSE2)}${[[30, 60], [60, 40], [100, 36], [150, 52]].map(([x, y]) => at(x, y, 0.8, MAPLE)).join('')}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Mexiko: Pyramide von Chichén Itzá – Cenote mit Schwimmer – Día de Muertos mit Calavera, Studentenblumen und Kerzen
	MX: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.25, CHICHEN)}${palm(14, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/><g transform="translate(54,0)">${picado(12, 5, 126).replace(/var\(--paper\)/g, '#0D2B3A')}</g>${at(90, 110, 2, CALAVERA.replace(/\$\{SNOW\}/, ''))}
<path d="M0,130 H180 V170 H0 Z" ${L4} stroke="none"/>${[[20, 136], [34, 140], [50, 134], [130, 136], [146, 140], [162, 134], [70, 146], [110, 146], [90, 150]].map(([x, y]) => MARIGOLD(x, y, 5)).join('')}${[[24, 160], [60, 162], [120, 162], [156, 160]].map(([x, y]) => candle(x, y)).join('')}`
	],
	// Costa Rica: Vulkan Arenal – Hängebrücke im Nebelwald von Monteverde – Rotaugenlaubfrosch
	CR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M10,120 L74,44 Q90,38 106,44 L170,120 Z" ${L2} stroke-width="1.8"/><path d="M84,40 q-4,-8 2,-12 q6,-4 2,-10" stroke-width="1.4"/><path d="M0,120 Q90,110 180,122 V170 H0 Z" ${L1} stroke-width="2"/>${[[20, 120], [50, 124], [130, 124], [160, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" ${L3} stroke="none"/>`).join('')}<path d="M0,150 H180" stroke-width="1" stroke-dasharray="4 4"/>`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[14, 20], [46, 0], [140, 10], [170, 34], [90, -10], [10, 120], [170, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" ${L2} stroke="none"/>`).join('')}<path d="M30,0 Q40,80 26,170 M156,0 Q146,80 160,170" stroke-width="5"/>${[[60, 50], [120, 40], [100, 100]].map(([x, y]) => `<path d="M${x},${y} q-14,4 -20,16 q14,-2 20,-16 Z" ${L3} stroke-width="1"/>`).join('')}
${at(90, 120, 2, TREEFROG)}`
	],
	// Kuba: Mogoten im Tal von Viñales mit Tabakbauer – Malecón in Havanna – (Legendary: bisheriges Bild)
	CU: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${mogote(36, 110, 40, 26)}${mogote(96, 110, 54, 30)}${mogote(152, 110, 36, 24)}<path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${Array.from({ length: 4 }, (_, r) => `<path d="M0,${126 + r * 10} Q90,${118 + r * 10} 180,${128 + r * 10}" stroke-width="1.6" stroke-dasharray="2 4"/>`).join('')}${at(100, 160, 1, OXCART)}${palm(20, 130, 34, 4)}`,
		null,
		SCENES.CU
	],
	// Guatemala: Atitlán-See mit Vulkanen – Arco de Santa Catalina in Antigua vor dem Vulkan Agua – Tikal über dem Regenwald im Morgenrot
	GT: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 L40,60 Q46,54 52,60 L80,96 L100,70 Q106,64 112,70 L150,110 Z" ${L2} stroke-width="1.8"/><path d="M110,110 L140,74 Q146,70 152,74 L180,100 V110 Z" ${L1} stroke-width="1.6"/><path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${at(90, 146, 1.1, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(130, 60, 18)}${rays(130, 60, 18, 16)}${birds(150, 30)}<path d="M50,110 L56,70 H64 L68,60 H92 L96,70 H104 L110,110 Z" ${L3} stroke-width="1.6"/><path d="M60,70 H100 M58,82 H102 M56,96 H104" stroke-width="1"/><path d="M70,60 V44 H90 V60" ${SNOW} stroke-width="1.3"/><path d="M68,44 H92 V36 H68 Z" ${SOLID}/><path d="M76,60 V52 H84 V60" ${SOLID}/>
<path d="M0,110 Q20,96 40,106 Q60,94 80,108 Q100,96 120,106 Q140,94 160,106 Q170,100 180,104 V170 H0 Z" ${SOLID}/><path d="M0,130 Q20,118 40,126 Q60,116 80,128 Q100,118 120,126 Q140,116 160,126 Q170,120 180,124" stroke="var(--paper)" stroke-width="1.4"/>${at(150, 130, 1, TOUCAN)}`
	],
	// Panama: Skyline von Panama-Stadt – San-Blas-Inseln – Brücke der Amerikas mit Schiff im Abendrot
	PA: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(100, 124, 1, TWIST)}${[[30, 50], [50, 70], [70, 40], [130, 60], [150, 80], [168, 46]].map(([x, h], i) => `<path d="M${x - 8},124 V${124 - h} H${x + 8} V124" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}<path d="M0,124 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,124 H180" stroke-width="2"/><path d="${waves(10, 150, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `${sun(90, 80, 18)}${rays(90, 80, 18, 16)}${birds(140, 30)}<path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/><path d="M0,90 L60,90 Q90,40 120,90 L180,90" stroke-width="2.4"/><path d="M60,90 Q90,60 120,90" stroke-width="1.4"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${66 + i * 8},90 V${90 - Math.round(28 * Math.sin(((i + 1) / 8) * Math.PI))}" stroke-width=".8"/>`).join('')}<path d="M40,90 V110 M140,90 V110" stroke-width="2"/>
${at(90, 140, 1.3, `<path d="M-40,0 H40 L34,8 H-34 Z" ${SOLID}/>${Array.from({ length: 6 }, (_, i) => `<rect x="${-34 + i * 11}" y="-10" width="10" height="10" ${[L3, SNOW, L2][i % 3]} stroke-width=".8"/>`).join('')}<path d="M24,-10 V-20 H34 V0" ${SNOW} stroke-width="1"/>`)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Belize: Maya-Tempel Xunantunich – Caye Caulker mit Palmen und Booten – Jaguar im Regenwald
	BZ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M30,140 L40,110 H50 L56,90 H124 L130,110 H140 L150,140 Z" ${L3} stroke-width="1.6"/><path d="M60,90 V70 H120 V90" ${L2} stroke-width="1.4"/><path d="M76,70 V58 H104 V70" ${SNOW} stroke-width="1.2"/><path d="M84,90 V78 H96 V90" ${SOLID}/>${Array.from({ length: 6 }, (_, i) => `<path d="M${70 + i * 8},100 h4" stroke-width="1.2"/>`).join('')}
<path d="M0,140 Q20,128 40,136 L150,140 Q160,128 180,134 V170 H0 Z" ${SOLID}/>`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[14, 20], [46, 0], [140, 10], [170, 34], [90, -10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="28" ${L2} stroke="none"/>`).join('')}<path d="M30,0 Q40,80 26,170 M156,0 Q146,80 160,170" stroke-width="6"/>${[[60, 60], [120, 50]].map(([x, y]) => `<path d="M${x},${y} q-14,4 -20,16 q14,-2 20,-16 Z" ${L3} stroke-width="1"/>`).join('')}
<path d="M10,130 Q90,120 170,132" stroke-width="5"/>${at(50, 128, 2, JAGUAR)}<path d="M0,150 Q90,140 180,152 V170 H0 Z" ${L3} stroke-width="1.6"/>`
	],
	// Antigua und Barbuda: Nelson’s Dockyard – Blick von Shirley Heights auf English Harbour – Regatta im Abendrot
	AG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(80, 120, 1.3, GEORGIAN)}${palm(160, 120, 40, -6)}${sea(120)}${regatta([[40, 150, 0.7], [130, 156, 0.6]])}`,
		null,
		() => `${sun(90, 92, 18)}${rays(90, 92, 18, 16)}${birds(140, 30)}${sea(104)}${regatta([[30, 130, 1], [70, 140, 1.2], [116, 132, 0.9], [150, 146, 1.1], [100, 158, 0.7]])}`
	],
	// Anguilla: Strandbar an der Shoal Bay – Sandy Island – Lagerfeuer am Strand unter Sternen
	AI: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(100)}${beach(126)}${at(90, 140, 1.4, BEACHBAR)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1], [110, 60, 1]], STAR)}<path d="M0,100 H180 V130 H0 Z" ${L4} stroke="none"/><path d="M0,130 Q90,122 180,132 V170 H0 Z" ${L3} stroke="none"/>
<path d="M80,150 L90,128 L100,150 Z" fill="#F7A35C" fill-opacity=".9" stroke="none"/><path d="M84,150 L90,136 L96,150 Z" fill="#F7E3A1" stroke="none"/><circle cx="90" cy="142" r="24" fill="#F7E3A1" fill-opacity=".14" stroke="none"/>${palm(150, 150, 50, -8)}${[[60, 160], [120, 160]].map(([x, y]) => at(x, y, 0.8, PERSON)).join('')}`
	],
	// Aruba: California Lighthouse – Eagle Beach mit Divi-Divi-Bäumen – Flamingo-Strand im Abendrot
	AW: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M20,130 Q60,110 120,114 Q160,116 180,130 V170 H0 V130 Z" ${L1} stroke-width="1.8"/>${at(80, 118, 1.6, LIGHTHOUSE)}${sea(140)}`,
		null,
		() => `${sun(90, 92, 18)}${rays(90, 92, 18, 16)}${birds(140, 30)}${sea(104)}<path d="M0,132 Q90,122 180,134 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${[[40, 140], [60, 136], [80, 142], [120, 138], [140, 144]].map(([x, y]) => at(x, y, 1.6, FLAMINGO)).join('')}${palm(160, 150, 40, -6)}`
	],
	// Barbados: Felsen von Bathsheba – Hafen von Bridgetown – Crop-Over-Tänzerin
	BB: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(110)}${at(60, 130, 1.3, STACK)}${at(120, 128, 0.9, STACK)}<path d="M0,140 Q90,132 180,142 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${palm(20, 150, 40, 6)}`,
		null,
		() => `${burst(30, 40, 3)}${burst(150, 50, 2)}${birds(100, 30)}<path d="M0,150 H180 V170 H0 Z" ${L2} stroke="none"/>${at(90, 160, 2, SAMBA)}${at(36, 166, 1, SAMBA)}${at(150, 166, 1, SAMBA)}`
	],
	// St. Barthélemy: Shell Beach – Jachthafen von Gustavia – Silvesterfeuerwerk über dem Hafen
	BL: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(100)}${beach(124)}${[[60, 140], [80, 146], [110, 142], [130, 148]].map(([x, y]) => at(x, y, 0.8, SHELL)).join('')}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${[[50, 40, 3], [130, 34, 3], [90, 60, 2], [160, 70, 2]].map(([x, y, r]) => burst(x, y, r).replace(/currentColor/g, x % 20 ? '#F7E3A1' : '#F4F7FA')).join('')}<path d="M0,110 Q40,90 90,96 Q140,88 180,104 V120 H0 Z" ${L3} stroke="none"/>${nyhavn(10, 120, 4, 14).replace(/var\(--stp\)/g, '#F4F7FA')}
<path d="M0,120 H180 V170 H0 Z" ${L4} stroke="none"/>${at(120, 146, 1, YACHT)}<path d="M20,140 V160 M60,136 V160 M150,140 V164" stroke="#F7E3A1" stroke-opacity=".5" stroke-width="2"/>`
	],
	// Bermuda: Leuchtturm Gibbs Hill – Horseshoe Bay mit rosa Sand – Crystal Caves mit Tropfsteinen
	BM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q30,96 80,100 Q120,104 140,130 Z" ${L2} stroke-width="1.8"/>${at(76, 102, 1.4, LIGHTHOUSE)}${sea(130)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/><path d="M0,0 H180 V40 Q150,60 120,44 Q90,70 60,46 Q30,60 0,40 Z" ${L4} stroke="none"/>${[[20, 50, 30], [40, 46, 20], [70, 50, 34], [100, 52, 22], [130, 48, 30], [160, 50, 24]].map(([x, y, h]) => `<path d="M${x - 4},${y - 10} L${x},${y + h - 10} L${x + 4},${y - 10} Z" fill="#F4F7FA" fill-opacity=".6" stroke="none"/>`).join('')}
<path d="M0,120 H180 V170 H0 Z" fill="#7FE7E0" fill-opacity=".45" stroke="none"/>${[[30, 120, 20], [90, 120, 30], [150, 120, 16]].map(([x, y, h]) => `<path d="M${x - 6},${y + 2} L${x},${y - h} L${x + 6},${y + 2} Z" fill="#F4F7FA" fill-opacity=".5" stroke="none"/>`).join('')}<path d="M10,140 H170" stroke="#F4F7FA" stroke-opacity=".6" stroke-width="3"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${14 + i * 16},140 v8" stroke="#F4F7FA" stroke-opacity=".5" stroke-width="1"/>`).join('')}`
	],
	// Bahamas: schwimmende Schweine – Sandbänke der Exumas – Flamingoschwarm im Abendrot
	BS: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,90 Q90,80 180,92" stroke-width="1.6"/><path d="M0,120 Q90,110 180,122 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${at(70, 110, 1.6, PIG)}${at(120, 104, 1.2, PIG, true)}<path d="M50,110 q10,-4 20,0 M100,106 q10,-4 20,0" stroke="var(--stp)" stroke-width="1.6"/>${palm(160, 128, 40, -6)}`,
		null,
		() => `${sun(90, 92, 18)}${rays(90, 92, 18, 16)}<path d="M0,104 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,104 H180" stroke-width="1.6"/>${Array.from({ length: 14 }, (_, i) => at(14 + (i * 41) % 160, 30 + ((i * 23) % 50), 0.9, `<path d="M-10,0 Q-4,-4 0,0 Q4,-4 10,0 Q4,-2 2,2 L0,6 L-2,2 Q-4,-2 -10,0 Z" ${SOLID}/>`)).join('')}${[[40, 140], [70, 146], [110, 140], [140, 148]].map(([x, y]) => at(x, y, 1.4, FLAMINGO)).join('')}`
	],
	// Curaçao: Königin-Emma-Pontonbrücke – Klein Curaçao mit Leuchtturm – Willemstad bei Nacht
	CW: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${nyhavn(0, 112, 12, 15)}<path d="M0,112 H180 V170 H0 Z" ${L2} stroke="none"/>${pontoon(0, 130, 180)}<path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[100, 12], [150, 10], [170, 30, 1], [60, 20, 1]], STAR)}${nyhavn(0, 112, 12, 15).replace(/var\(--stp\)/g, '#F4F7FA').replace(/fill="var\(--paper\)"/g, 'fill="#F7E3A1"')}<path d="M0,112 H180 V170 H0 Z" ${L4} stroke="none"/>
${pontoon(0, 128, 180)}${Array.from({ length: 12 }, (_, i) => `<circle cx="${7 + i * 15}" cy="128" r="1.6" fill="#F7E3A1" stroke="none"/>`).join('')}${[20, 50, 80, 110, 140, 170].map((x) => `<path d="M${x},134 V${150 + (x % 3) * 4}" stroke="#F7E3A1" stroke-opacity=".5" stroke-width="2"/>`).join('')}`
	],
	// Dominica: Boiling Lake – Champagne Reef vor Scotts Head – Sisserou-Papagei im Regenwald
	DM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V90 Q20,70 50,80 L60,120 H120 L130,80 Q160,70 180,90 V170 Z" ${L3} stroke-width="1.8"/><ellipse cx="90" cy="120" rx="34" ry="8" ${SNOW} stroke-width="1.4"/><path d="M70,110 q-4,-10 2,-18 q6,-8 0,-16 M90,108 q4,-12 -2,-20 q-6,-8 0,-18 M110,110 q-4,-10 2,-18" stroke-width="1.6"/>${[[20, 86], [160, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" ${L2} stroke="none"/>`).join('')}`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[14, 20], [46, 0], [140, 10], [170, 34], [90, -10], [10, 120], [170, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" ${L2} stroke="none"/>`).join('')}<path d="M30,0 Q40,80 26,170 M156,0 Q146,80 160,170" stroke-width="5"/><path d="M30,120 Q90,110 156,124" stroke-width="4"/>${at(96, 118, 2, PARROT)}`
	],
	// Dominikanische Republik: Alcázar de Colón in Santo Domingo – Palmenstrand von Punta Cana – Buckelwale vor Samaná
	DO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.4, ALCAZAR)}${palm(16, 150, 30, 4)}`,
		null,
		() => `${sun(130, 40, 12)}${rays(130, 40, 12, 16)}${birds(70, 30)}<path d="M0,90 Q30,70 60,80 L70,90 Z" ${L3} stroke-width="1.4"/>${palm(30, 86, 30, 4)}<path d="M0,96 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,96 H180" stroke-width="1.6"/>${at(90, 140, 1.6, HUMPBACK)}${at(150, 120, 0.8, FLUKE)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Grenada: Hafen Carenage in St. George’s – Grand Anse Beach – Unterwasser-Skulpturenpark
	GD: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q30,70 80,72 Q130,70 180,100 V120 H0 Z" ${L2} stroke-width="1.6"/>${nyhavn(10, 118, 10, 16)}<path d="M0,118 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,118 H180" stroke-width="1.6"/>${at(90, 146, 1, YACHT)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/>
${at(90, 130, 1.6, SCULPTURES)}<path d="M0,140 Q40,130 80,138 Q130,128 180,140 V170 H0 Z" ${L3} stroke-width="1.6"/>${at(140, 60, 1, `<path d="M-10,0 Q0,-8 10,0 Q0,4 -10,0 Z" ${SOLID}/><path d="M10,0 l6,-4 v8 Z" ${SOLID}/>`)}${at(40, 80, 0.7, `<path d="M-10,0 Q0,-8 10,0 Q0,4 -10,0 Z" ${SOLID}/><path d="M10,0 l6,-4 v8 Z" ${SOLID}/>`)}`
	],
	// Honduras: Maya-Stele in Copán – Riff vor Roatán mit Taucher – Aras über Copán
	HN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 142, 1.6, STELA)}${[[20, 130], [40, 136], [150, 132], [168, 128]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" ${L3} stroke="none"/>`).join('')}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M40,130 L50,100 H60 L66,80 H114 L120,100 H130 L140,130 Z" ${L3} stroke-width="1.6"/><path d="M70,80 V64 H110 V80" ${L2} stroke-width="1.4"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${66 + i * 9},110 h4" stroke-width="1.2"/>`).join('')}
${at(60, 50, 1.2, `<path d="M0,0 Q-14,-8 -30,-2 Q-14,-4 -4,4 Q0,8 6,6 Q20,8 30,-4 Q14,-6 0,0 Z" ${SOLID}/><path d="M0,6 L-4,30 L2,30 L4,8" ${SOLID}/><circle cx="8" cy="-2" r="3" ${SOLID}/><path d="M10,-3 L14,0 L10,0" ${L3}/>`)}${at(120, 60, 0.9, `<path d="M0,0 Q-14,-8 -30,-2 Q-14,-4 -4,4 Q0,8 6,6 Q20,8 30,-4 Q14,-6 0,0 Z" ${SOLID}/><path d="M0,6 L-4,30 L2,30 L4,8" ${SOLID}/>`)}<path d="M0,130 Q20,118 40,126 L140,130 Q160,118 180,124 V170 H0 Z" ${SOLID}/>`
	],
	// Haiti: Palastruine Sans-Souci – Küste von Labadee – bunter Tap-Tap-Bus vor der Zitadelle
	HT: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 140, 1.4, `<path d="M-50,0 V-30 H50 V0" ${L2} stroke-width="1.4"/><path d="M-50,-30 L-40,-36 H40 L50,-30" stroke-width="1.4"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${-44 + i * 12},0 V-16 Q${-40 + i * 12},-22 ${-36 + i * 12},-16 V0 Z" ${PAPER}/>`).join('')}<path d="M-14,-36 V-50 H14 V-36" ${L2} stroke-width="1.2"/><path d="M-18,-50 Q0,-62 18,-50" stroke-width="1.4"/>`)}${palm(16, 150, 34, 4)}${palm(166, 150, 30, -4)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M0,100 L24,60 L38,50 L54,46 L70,52 L100,90 V110 H0 Z" ${L2} stroke-width="1.6"/><path d="M28,56 L36,44 H70 L76,52 L58,62 H34 Z" ${SOLID}/><path d="M0,110 Q90,100 180,112 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 156, 2, TAPTAP)}${palm(160, 120, 40, -6)}`
	],
	// Jamaika: Dunn’s River Falls – Kaffeehänge der Blue Mountains – Klippenspringer von Negril im Sonnenuntergang
	JM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,40 Q30,34 54,48 L60,170 H0 Z M180,40 Q150,34 126,48 L120,170 H180 Z" ${L3} stroke-width="1.6"/>${[[16, 44], [40, 36], [150, 40], [170, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L2} stroke="none"/>`).join('')}${cascades(54, 60, 72, 3)}${cascades(50, 86, 80, 4)}${cascades(46, 112, 88, 4)}<path d="M0,140 H180 V170 H0 Z" ${L2} stroke="none"/>${at(80, 150, 0.7, PERSON)}${at(100, 150, 0.7, PERSON)}`,
		null,
		() => `${sun(110, 80, 22)}${rays(110, 80, 22, 18)}${birds(150, 30)}<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/>${at(40, 170, 1.6, CLIFFDIVE)}${at(60, 70, 1.2, `<circle cx="0" cy="-6" r="2.4" ${SOLID}/><path d="M0,-3 L-2,8 M-4,-8 L0,-4 L4,-8 M-2,8 L-4,16 M-2,8 L1,15" stroke-width="2"/>`)}${palm(30, 106, 30, 4)}<path d="M100,104 H160 M108,112 H152 M116,120 H144" stroke="var(--stp)" stroke-width="1.6"/><path d="${waves(70, 150, 7, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// St. Kitts und Nevis: Festung Brimstone Hill – Nevis Peak über dem Strand – grüne Meerkatze im Abendlicht über Nevis
	KN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M10,140 Q30,80 80,72 Q130,76 160,140 Z" ${L2} stroke-width="1.8"/>${at(84, 78, 1.1, `${wall(-40, 40, 0, 16, SNOW)}${rtower(-30, -16, 12, 10, SNOW)}<path d="M-10,-16 V-30 H14 V-16" ${SNOW} stroke-width="1.2"/>`)}<path d="M0,140 Q90,132 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${pine(20, 142, 22)}`,
		null,
		() => `${sun(110, 70, 18)}${rays(110, 70, 18, 16)}<path d="M60,100 L110,40 Q118,34 126,40 L180,96" ${L2} stroke-width="1.6"/>${cloud(100, 46)}<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/>${palm(30, 140, 70, 10)}<path d="M20,110 Q30,104 50,108" stroke-width="3"/>${at(40, 106, 1.6, MONKEY)}<path d="${waves(80, 150, 6, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Kaimaninseln: Seven Mile Beach – Stingray City mit Schnorchlern – Blauer Leguan
	KY: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(100)}${beach(124)}${at(90, 140, 0.8, BEACHBAR)}${[60, 120].map((x) => at(x, 150, 0.6, PERSON)).join('')}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="2"/>${at(40, 120, 1, `<path d="M-6,0 V-30 M-6,-20 L-16,-30 M-6,-24 L4,-36" stroke-width="2"/><path d="M-30,-30 Q-6,-48 18,-36 Q-6,-30 -30,-30 Z" ${SOLID}/>`)}${at(96, 150, 2, BLUEIGUANA)}${grass(150, 160)}`
	],
	// St. Martin: Orient Bay – Markt und Fort Louis in Marigot – Blick vom Pic Paradis im Abendrot
	MF: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 Q30,80 60,90 L70,100 Z M120,100 L130,86 Q160,76 180,90 V100 Z" ${L3} stroke-width="1.4"/>${sea(100)}${beach(126)}${[[60, 140], [90, 144], [120, 140]].map(([x, y]) => at(x, y, 0.9, `<path d="M-8,0 V-14 M-8,-14 Q-16,-14 -16,-8 Q-8,-10 -8,-14 Z" stroke-width="1.2"/><path d="M-14,-12 Q-8,-22 0,-12 Z" ${L3} stroke-width="1"/>`)).join('')}`,
		null,
		() => `${sun(90, 90, 18)}${rays(90, 90, 18, 16)}${birds(140, 30)}<path d="M0,170 V110 Q30,96 60,104 L80,120 Q100,110 130,116 Q160,104 180,112 V170 Z" ${L3} stroke-width="1.6"/><path d="M0,100 H180" stroke-width="1.4"/><path d="M0,100 H180 V110 H0 Z" ${L2} stroke="none"/><path d="M60,100 L80,88 L100,94 L120,86 L140,96" stroke-width="1"/>${[[20, 116, 22], [40, 120, 16], [150, 120, 20]].map(([x, y, h]) => palm(x, y + 10, h, 4)).join('')}`
	],
	// Montserrat: Rendezvous Bay – verschüttete Stadt Plymouth unter der Asche – Vulkanausbruch bei Nacht
	MS: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,40 Q30,34 50,60 L60,110 H0 Z M180,40 Q150,34 130,60 L120,110 H180 Z" ${L3} stroke-width="1.6"/>${sea(110)}<path d="M50,130 Q90,120 130,130 V170 H50 Z" ${SNOW} stroke-width="1.4"/>${palm(110, 136, 30, -4)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [150, 10], [170, 40, 1]], STAR)}<path d="M10,120 L76,44 Q90,38 104,44 L170,120 Z" ${SOLID}/><path d="M80,42 Q60,20 70,4 M90,40 Q90,14 100,2 M100,42 Q120,22 116,6" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="6"/>
<path d="M88,44 L82,70 L90,90 L84,120 M96,44 L104,74 L98,100 L108,120" stroke="#F7A35C" stroke-width="3"/>${dots([[70, 30, 2], [110, 24, 2], [84, 16, 1.6], [100, 34, 1.6]], 'fill="#F7A35C"')}<path d="M0,120 H180 V170 H0 Z" ${L4} stroke="none"/><path d="M60,140 Q90,130 120,140" stroke="#F7A35C" stroke-opacity=".4" stroke-width="3"/>`
	],
	// Nicaragua: gelbe Kathedrale von Granada – Doppelvulkan Ometepe – Lavasee des Masaya bei Nacht
	NI: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.5, GRANADA)}${palm(16, 150, 30, 4)}${palm(166, 150, 26, -4)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1]], STAR)}<path d="M152,22 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${STAR} stroke="none"/>${at(90, 140, 1.4, LAVALAKE)}<path d="M0,140 H180 V170 H0 Z" ${SOLID}/>${at(30, 140, 0.8, PERSON.replace(/currentColor/g, '#F4F7FA'))}`
	],
	// St. Pierre und Miquelon: Kirche auf der Île-aux-Marins – Hafen mit Fischerbooten – Eisberg und Wale im Abendlicht
	PM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 132, 1.3, WOODCHURCH)}${[[30, 140], [150, 142]].map(([x, y]) => at(x, y, 1, GRASSHUT)).join('')}<path d="M0,150 H180" stroke-width="1" stroke-dasharray="4 4"/>`,
		null,
		() => `${sun(120, 70, 18)}${rays(120, 70, 18, 16)}${birds(150, 30)}${sea(100)}${at(50, 104, 1.2, ICEBERG)}${at(130, 140, 1.2, FLUKE)}${at(100, 130, 0.6, FLUKE)}`
	],
	// Puerto Rico: bunte Gasse in Old San Juan – Wasserfall im Regenwald El Yunque – Biolumineszenz-Bucht mit Kajak bei Nacht
	PR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/>${cartagena(2, 150, 8)}<path d="M0,160 H180" stroke-width="1" stroke-dasharray="2 2"/>`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1], [130, 36, 1]], STAR)}<path d="M0,90 Q30,70 60,80 Q100,64 140,80 Q160,70 180,80 V100 H0 Z" ${SOLID}/><path d="M0,100 H180 V170 H0 Z" ${L4} stroke="none"/>
${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 47) % 180}" cy="${110 + ((i * 23) % 56)}" r="${1 + (i % 3) * 0.6}" fill="#7FE7E0" fill-opacity=".8" stroke="none"/>`).join('')}${at(90, 140, 1.4, KAYAK.replace(/currentColor/g, '#F4F7FA'))}<path d="M50,142 Q70,138 90,142 Q110,146 130,142" stroke="#7FE7E0" stroke-width="2"/>`
	],
	// St. Lucia: Fort auf Pigeon Island – Pitons über dem Sugar Beach – Pitons im Abendrot mit Jacht
	LC: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M20,120 Q40,80 80,74 Q120,78 140,120 Z" ${L2} stroke-width="1.8"/>${at(80, 80, 1, `${wall(-30, 30, 0, 14, SNOW)}${rtower(-24, -14, 10, 10, SNOW)}`)}${sea(120)}${palm(160, 120, 30, -4)}`,
		null,
		() => `${sun(90, 70, 16)}${rays(90, 70, 16, 16)}${birds(140, 30)}${PITONS(120)}${sea(120)}${at(120, 150, 1, YACHT)}`
	],
	// El Salvador: Kratersee des Santa Ana – Ruta de las Flores mit Kaffee und Blumen – Surfer bei El Tunco im Abendrot
	SV: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 L50,70 Q60,62 70,64 H110 Q120,62 130,70 L180,130 Z" ${L2} stroke-width="1.8"/><ellipse cx="90" cy="70" rx="22" ry="5" ${L3} stroke-width="1.2"/><path d="M84,66 q-2,-6 2,-10" stroke-width="1.2"/><path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${[[20, 150], [160, 152]].map(([x, y]) => bush(x, y, 10, L3)).join('')}`,
		null,
		() => `${sun(100, 80, 20)}${rays(100, 80, 20, 16)}${birds(150, 30)}<path d="M120,100 Q130,70 150,70 Q170,72 172,100 Z" ${SOLID}/><path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/><path d="M0,130 Q50,100 90,104 Q60,110 64,126 Q100,118 140,130 Q170,126 180,132 V170 H0 Z" ${L3} stroke-width="1.8"/>${at(80, 122, 1.6, `<path d="M-14,4 L16,-2" stroke-width="3"/><circle cx="2" cy="-18" r="2.6" ${SOLID}/><path d="M2,-15 L0,-6 L-6,0 M0,-6 L6,0 M2,-12 L-6,-14 M2,-12 L10,-10" stroke-width="2"/>`)}`
	],
	// Sint Maarten: Gerichtsgebäude in Philipsburg – Flugzeug über Maho Beach – Great Bay bei Nacht mit Kreuzfahrtschiffen
	SX: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,140 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(90, 140, 1.5, `<path d="M-30,0 V-26 H30 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-34,-26 L0,-40 L34,-26 Z" ${L3} stroke-width="1.2"/><path d="M-6,-36 V-52 H6 V-36" ${SNOW} stroke-width="1.2"/><path d="M-8,-52 L0,-60 L8,-52 Z" ${SOLID}/><path d="M0,-60 V-66" stroke-width="1.2"/>${[-22, -12, 12, 22].map((x) => `<rect x="${x - 3}" y="-20" width="6" height="12" ${SOLID}/>`).join('')}<path d="M-4,0 V-12 H4 V0" ${SOLID}/>`)}${palm(16, 150, 34, 4)}${palm(166, 150, 30, -4)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1]], STAR)}<path d="M0,100 Q40,80 90,86 Q140,78 180,94 V110 H0 Z" ${L3} stroke="none"/>${Array.from({ length: 16 }, (_, i) => `<circle cx="${8 + i * 11}" cy="${100 - (i % 4) * 3}" r="1.2" fill="#F7E3A1" stroke="none"/>`).join('')}
<path d="M0,110 H180 V170 H0 Z" ${L4} stroke="none"/>${[[60, 136, 1], [140, 130, 0.7]].map(([x, y, s]) => at(x, y, s, `<path d="M-40,0 H40 L34,8 H-34 Z" ${SNOW}/><path d="M-30,0 V-10 H30 V0 M-20,-10 V-18 H20 V-10" ${SNOW}/>${Array.from({ length: 10 }, (_, i) => `<circle cx="${-26 + i * 6}" cy="-5" r="1" fill="#F7E3A1" stroke="none"/>`).join('')}`)).join('')}<path d="M30,150 V166 M90,148 V166" stroke="#F7E3A1" stroke-opacity=".5" stroke-width="2"/>`
	],
	// Turks- und Caicosinseln: Grace Bay – Chalk Sound mit türkisen Inselchen – Turk’s-Head-Kaktus, Flamingo und Fechterschnecke im Abendrot
	TC: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(100)}${beach(124)}${at(90, 146, 1, CATAMARAN)}`,
		null,
		() => `${sun(110, 80, 20)}${rays(110, 80, 20, 16)}${birds(150, 30)}<path d="M0,110 H180 V130 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/><path d="M0,130 Q90,120 180,132 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${at(40, 160, 2, TURKCACTUS)}${at(140, 142, 1.6, FLAMINGO)}${at(96, 164, 1.2, `<path d="M-14,0 Q-16,-10 -6,-14 L4,-20 L2,-12 L12,-12 L6,-6 Q10,0 6,2 Q-4,6 -14,0 Z" ${L3} stroke-width="1.2"/>`)}`
	],
	// Trinidad und Tobago: Maracas Bay – Karnevalsumzug mit Steelband – Scharlachsichler im Caroni-Sumpf im Abendrot
	TT: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 Q30,60 70,70 L80,100 Z M110,100 L120,70 Q150,60 180,80 V100 Z" ${L3} stroke-width="1.6"/>${sea(100)}${beach(126)}`,
		null,
		() => `${sun(90, 80, 20)}${rays(90, 80, 20, 16)}<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${6 + i * 13},100 l-4,10 M${6 + i * 13},100 l4,10 M${6 + i * 13},100 v-12" stroke-width="1.2"/><circle cx="${6 + i * 13}" cy="86" r="8" ${L3} stroke="none"/>`).join('')}
${Array.from({ length: 12 }, (_, i) => at(20 + (i * 37) % 150, 30 + ((i * 19) % 40), 1, IBIS)).join('')}<path d="${waves(10, 140, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// St. Vincent und die Grenadinen: Meeresschildkröte in den Tobago Cays – Inselkette der Grenadinen mit Jachten – Kratersee der Soufrière
	VC: [
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/>${at(90, 100, 2.4, TURTLE)}<path d="M0,150 Q40,140 80,146 Q130,136 180,148 V170 H0 Z" ${L3} stroke-width="1.6"/>`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}${birds(70, 30)}<path d="M0,170 V80 Q30,50 90,48 Q150,50 180,80 V170 Z" ${L2} stroke-width="1.8"/><ellipse cx="90" cy="100" rx="56" ry="16" ${L3} stroke-width="1.4"/><ellipse cx="90" cy="100" rx="36" ry="8" ${L4} stroke="none"/><path d="M84,96 q-2,-6 2,-10" stroke-width="1.2"/>${cloud(20, 60)}${cloud(120, 54)}`
	],
	// Britische Jungferninseln: Ruine der Kupfermine auf Virgin Gorda – White Bay auf Jost Van Dyke – die Baths im Abendrot
	VG: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q30,80 80,78 Q120,80 140,110 Z" ${L2} stroke-width="1.8"/>${at(70, 84, 1.2, `<path d="M-6,0 V-40 H6 V0 Z" ${L3} stroke-width="1.3"/><path d="M-8,-40 H8" stroke-width="2"/><path d="M6,0 V-14 H30 V0" ${L3} stroke-width="1.2"/><path d="M14,0 V-8 Q18,-12 22,-8 V0 Z" ${PAPER}/><path d="M-20,0 V-10 H-6" ${L3} stroke-width="1.2"/>`)}${sea(110)}${palm(160, 112, 34, -4)}`,
		null,
		() => `${sun(130, 70, 18)}${rays(130, 70, 18, 16)}${birds(150, 30)}${sea(100)}${at(40, 130, 1.4, STACK)}${at(100, 128, 1.8, `<path d="M-30,0 Q-30,-30 0,-34 Q30,-30 30,0 Z" ${SOLID}/><path d="M-14,-22 Q-6,-30 6,-28" stroke="var(--paper)" stroke-width="1.4"/>`)}${at(150, 130, 1, STACK)}<path d="M0,140 Q90,132 180,142 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${palm(170, 148, 30, -4)}`
	],
	// Amerikanische Jungferninseln: Trunk Bay mit Inselchen – Hafen von Charlotte Amalie – Unterwasserpfad am Buck Island
	VI: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 H180" stroke-width="1.4"/>${sea(100)}<path d="M90,104 Q110,92 130,104 Z" ${L3} stroke-width="1.2"/>${palm(110, 100, 16, 3)}${beach(130)}`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/>
<path d="M0,140 Q30,124 60,134 Q100,120 140,132 Q160,126 180,132 V170 H0 Z" ${L3} stroke-width="1.6"/>${[[30, 132], [70, 126], [120, 124], [160, 128]].map(([x, y]) => `<path d="M${x},${y} Q${x - 6},${y - 20} ${x - 14},${y - 28} M${x},${y} Q${x + 4},${y - 22} ${x + 12},${y - 30} M${x},${y} V${y - 26}" stroke-width="2.4"/>`).join('')}${at(90, 70, 1.4, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M-12,0 H12" stroke-width="2"/><path d="M0,-12 v-8" stroke-width="1.6"/>`)}${at(50, 100, 0.8, `<path d="M-10,0 Q0,-8 10,0 Q0,4 -10,0 Z" ${SOLID}/><path d="M10,0 l6,-4 v8 Z" ${SOLID}/>`)}`
	],
	// Guadeloupe: Carbet-Wasserfälle – Vulkan Soufrière über Bananenfeldern – Bucht von Les Saintes im Abendrot
	GP: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,40 Q30,34 54,48 L60,170 H0 Z M180,40 Q150,34 126,48 L120,170 H180 Z" ${L3} stroke-width="1.6"/>${[[16, 44], [40, 36], [150, 40], [170, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L2} stroke="none"/>`).join('')}<path d="M84,40 H96 V150 H84 Z" ${PAPER}/><path d="M86,40 V150 M90,40 V152 M94,40 V150" stroke-width="1.2"/><path d="M60,150 Q90,140 120,150 V170 H60 Z" ${L2} stroke-width="1.4"/>`,
		null,
		() => `${sun(90, 80, 18)}${rays(90, 80, 18, 16)}${birds(150, 30)}<path d="M0,100 Q30,80 60,90 L70,100 Z M120,100 Q140,84 170,90 L180,100 Z" ${L3} stroke-width="1.4"/>${sea(100)}${regatta([[40, 134, 0.8], [100, 140, 1], [150, 130, 0.7]])}`
	],
	// Martinique: Montagne Pelée – Strand Les Salines – Rocher du Diamant im Abendrot mit Segelbooten
	MQ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M10,130 L70,56 Q80,48 90,50 Q100,48 110,56 L170,130 Z" ${L2} stroke-width="1.8"/>${cloud(70, 56)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${[[20, 150], [40, 154], [150, 152]].map(([x, y]) => `<path d="M${x},${y} V${y - 18}" stroke-width="2"/><path d="M${x},${y - 18} q-12,-4 -16,6 M${x},${y - 18} q12,-4 16,6 M${x},${y - 18} q-6,-10 -2,-16" stroke-width="2"/>`).join('')}`,
		null,
		() => `${sun(110, 70, 18)}${rays(110, 70, 18, 16)}${birds(150, 30)}${sea(104)}<path d="M50,104 Q54,74 66,60 Q74,56 80,64 Q90,82 92,104 Z" ${SOLID}/>${regatta([[130, 140, 1], [30, 144, 0.7], [160, 130, 0.6]])}`
	],
	// Bonaire: Flamingos in den Salinen – Riff vor Klein Bonaire – Salzberge im Abendrot mit Flamingos
	BQ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${[[30, 140], [50, 136], [70, 142], [100, 138], [120, 144], [146, 136]].map(([x, y]) => at(x, y, 1.4, FLAMINGO)).join('')}`,
		null,
		() => `${sun(90, 70, 18)}${rays(90, 70, 18, 16)}${birds(150, 30)}<path d="M10,110 L36,70 L62,110 Z M54,110 L86,60 L118,110 Z M110,110 L134,76 L158,110 Z" ${SNOW} stroke-width="1.6"/><path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${[[40, 140], [60, 146], [120, 142], [140, 148]].map(([x, y]) => at(x, y, 1.3, FLAMINGO)).join('')}`
	],
	// Französisch-Guayana: Lederschildkröte am Strand – Startplatz in Kourou – Raketenstart bei Nacht
	GF: [
		() => `${sun(130, 60, 14)}${rays(130, 60, 14, 16)}${birds(70, 30)}<path d="M0,100 H180 V120 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/><path d="M0,120 Q90,110 180,122 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${at(90, 150, 1.8, LEATHERBACK)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [140, 22], [170, 40], [30, 30, 1]], STAR)}<path d="M90,0 V40" stroke="#F4F7FA" stroke-opacity=".3" stroke-width="10"/>${at(90, 110, 1.4, `<path d="M0,-70 Q6,-60 6,-46 V-20 H-6 V-46 Q-6,-60 0,-70 Z" fill="#F4F7FA" stroke="none"/><path d="M-12,-40 Q-14,-40 -14,-34 V-18 H-8 V-34 Q-8,-40 -12,-40 Z M12,-40 Q14,-40 14,-34 V-18 H8 V-34 Q8,-40 12,-40 Z" fill="#F4F7FA" fill-opacity=".8" stroke="none"/><path d="M-8,-18 L-10,-4 L-4,-10 L0,8 L4,-10 L10,-4 L8,-18 Z" fill="#F7A35C" stroke="none"/><path d="M-4,-14 L0,0 L4,-14 Z" fill="#F7E3A1" stroke="none"/>`)}
<path d="M0,150 Q30,120 60,136 Q90,116 120,136 Q150,120 180,140 V170 H0 Z" fill="#F4F7FA" fill-opacity=".35" stroke="none"/><path d="M0,160 H180 V170 H0 Z" ${SOLID}/><path d="M140,160 V110 M134,116 H146 M140,116 L146,122" stroke="#F4F7FA" stroke-opacity=".6" stroke-width="1.6"/>`
	],
	// Australien: Opernhaus Sydney – Uluru – Great Barrier Reef mit Schildkröte und Clownfischen
	AU: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(90, 120, 1.3, OPERA)}${sea(120)}<path d="M120,100 Q150,70 180,100" stroke-width="2"/><path d="M130,100 V90 M150,100 V80 M170,100 V90" stroke-width="1"/>`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/>
${at(100, 96, 1.6, TURTLE)}${at(130, 110, 1, CLOWNFISH)}${at(146, 120, 0.8, CLOWNFISH)}${at(40, 120, 0.8, CLOWNFISH, true)}<path d="M0,150 Q40,136 80,146 Q130,132 180,146 V170 H0 Z" ${L3} stroke-width="1.6"/>${[[20, 150, 26], [60, 146, 20], [110, 146, 30], [160, 148, 22]].map(([x, y, h]) => coral(x, y, h)).join('')}`
	],
	// Neuseeland: Mitre Peak im Milford Sound – Aoraki/Mount Cook mit Lupinen – Kiwi in der Glühwürmchenhöhle
	NZ: [
		() => `${sun(150, 26, 9)}${birds(30, 50)}${MITRE(124)}<path d="M0,124 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,124 H180" stroke-width="1.6"/><g opacity=".3" transform="translate(0,248) scale(1,-1)">${MITRE(124)}</g>${at(130, 150, 0.8, YACHT)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/><path d="M0,0 H180 V60 Q150,80 120,64 Q90,90 60,66 Q30,80 0,60 Z" ${L4} stroke="none"/>${Array.from({ length: 50 }, (_, i) => `<circle cx="${(i * 37) % 180}" cy="${4 + ((i * 23) % 70)}" r="${0.8 + (i % 3) * 0.5}" fill="#7FE7E0" stroke="none"/>`).join('')}${Array.from({ length: 16 }, (_, i) => `<path d="M${6 + i * 11},${60 + (i % 3) * 8} v${8 + (i % 4) * 4}" stroke="#7FE7E0" stroke-opacity=".5" stroke-width=".8"/>`).join('')}
<path d="M0,130 H180 V170 H0 Z" ${L4} stroke="none"/>${at(80, 150, 2, KIWI.replace(/currentColor/g, '#F4F7FA'))}${[[30, 156], [140, 160]].map(([x, y]) => `<path d="M${x - 10},${y} q10,-14 20,0" fill="#F4F7FA" fill-opacity=".3" stroke="none"/>`).join('')}`
	],
	// Französisch-Polynesien: Auslegerkanu-Rennen – Lagune von Bora Bora – Schwarze Perle und Tiare-Blüte
	PF: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 Q40,60 90,70 L110,100 Z" ${L3} stroke-width="1.6"/>${sea(100)}${at(90, 140, 1.4, VAA)}`,
		null,
		() => `${sun(150, 26, 9)}${rays(150, 26, 9)}<path d="M0,100 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,100 H180" stroke-width="1.4"/><path d="${waves(10, 112, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(90, 150, 2.2, PEARL)}${[[30, 60, 1.6], [56, 40, 1.1], [150, 70, 1.3], [130, 44, 0.9]].map(([x, y, s]) => at(x, y, s, TIARE)).join('')}${[[40, 70], [150, 50]].map(([x, y]) => `<path d="M${x},${y} q-10,-4 -16,4 q8,4 16,-4 Z" ${L3} stroke-width="1"/>`).join('')}`
	],
	// Fidschi: Bure am Strand – Yasawa-Inseln – Feuerläufer von Beqa bei Nacht
	FJ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(100)}${beach(124)}${at(90, 140, 1.6, BURE)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1]], STAR)}<path d="M0,130 H180 V170 H0 Z" ${L4} stroke="none"/><ellipse cx="90" cy="146" rx="60" ry="12" fill="#F7A35C" fill-opacity=".6" stroke="none"/>${dots([[50, 144, 2], [70, 150, 2.4], [90, 142, 2], [110, 152, 2.4], [130, 146, 2], [80, 156, 1.6], [104, 140, 1.6]], 'fill="#F7E3A1"')}
${at(90, 140, 1.6, `<circle cx="0" cy="-34" r="3" fill="#F4F7FA" stroke="none"/><path d="M0,-31 V-16 L-6,0 M0,-16 L8,-2 M0,-28 L-8,-20 M0,-28 L8,-22" stroke="#F4F7FA" stroke-width="2.4"/>`)}${palm(20, 140, 50, 8)}${palm(160, 140, 44, -8)}${[[40, 100], [140, 100]].map(([x, y]) => `<path d="M${x},${y} q-3,-8 0,-16 q3,-8 0,-16" stroke="#F4F7FA" stroke-opacity=".3" stroke-width="1.4"/>`).join('')}`
	],
	// Samoa: offenes Fale – Strand von Lalomanu mit Fales – Feuermesser-Tänzer bei Nacht
	WS: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 136, 1.8, FALE)}${palm(20, 136, 50, 8)}${palm(160, 136, 44, -8)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1]], STAR)}<path d="M0,140 H180 V170 H0 Z" ${L4} stroke="none"/>${at(90, 140, 1.8, FIREKNIFE)}${palm(20, 150, 50, 8)}${palm(160, 150, 44, -8)}`
	],
	// Amerikanisch-Samoa: Flughund im Regenwald – Strand auf Ofu – Flughunde in der Dämmerung über der Bucht von Pago Pago
	AS: [
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[14, 20], [46, 0], [140, 10], [170, 34], [90, -10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="28" ${L2} stroke="none"/>`).join('')}<path d="M30,0 Q40,80 26,170 M156,0 Q146,80 160,170" stroke-width="6"/><path d="M30,60 Q90,70 156,58" stroke-width="3"/>${at(90, 68, 1, `<g transform="rotate(180)">${FLYINGFOX}</g>`)}<path d="M84,64 q6,10 12,0" stroke-width="2"/>${at(90, 120, 2, FLYINGFOX)}<path d="M0,150 Q90,140 180,152 V170 H0 Z" ${L3} stroke-width="1.6"/>`,
		null,
		() => `${sun(90, 80, 20)}${rays(90, 80, 20, 16)}<path d="M0,170 V60 Q20,40 40,60 L60,100 H0 Z M180,170 V50 Q160,30 140,54 L120,100 H180 Z" ${L3} stroke-width="1.6"/><path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M60,100 H120" stroke-width="1.6"/>
${Array.from({ length: 8 }, (_, i) => at(64 + (i * 29) % 100, 34 + ((i * 17) % 40), 0.7 + (i % 3) * 0.15, FLYINGFOX)).join('')}<path d="${waves(10, 140, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Cookinseln: One Foot Island in der Lagune von Aitutaki – Gipfel von Rarotonga über der Lagune – Riesenmuschel und Auslegerkanu im Abendrot
	CK: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><ellipse cx="90" cy="110" rx="70" ry="18" ${SNOW} stroke-width="1" stroke-dasharray="4 3"/><ellipse cx="90" cy="110" rx="40" ry="10" ${SNOW} stroke-width="1.4"/>${palm(80, 110, 40, 6)}${palm(100, 110, 30, -5)}${at(140, 150, 1, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>`)}`,
		null,
		() => `${sun(90, 70, 18)}${rays(90, 70, 18, 16)}${birds(150, 30)}<path d="M0,100 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,100 H180" stroke-width="1.6"/>${at(60, 150, 1.8, CLAM)}${at(130, 120, 1, VAA)}<path d="${waves(10, 160, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`
	],
	// Guam: Klippe der zwei Liebenden – Bucht von Tumon – Latte-Steine im Abendrot mit Flughund
	GU: [
		() => `${sun(150, 26, 9)}${birds(100, 40)}${at(90, 110, 1.4, TWOLOVERS)}${sea(110)}`,
		null,
		() => `${sun(90, 80, 20)}${rays(90, 80, 20, 16)}<path d="M0,120 Q90,110 180,122 V170 H0 Z" ${L2} stroke-width="2"/>${[[30, 32], [66, 40], [114, 40], [150, 32]].map(([x, h]) => `<path d="M${x - 5},122 V${122 - h} H${x + 5} V122 Z" ${L3} stroke-width="1.6"/><path d="M${x - 11},${122 - h} Q${x - 11},${112 - h - 8} ${x},${112 - h - 8} Q${x + 11},${112 - h - 8} ${x + 11},${122 - h} Z" ${SOLID}/>`).join('')}${at(130, 40, 0.9, FLYINGFOX)}${palm(170, 130, 40, -6)}`
	],
	// Nördliche Marianen: Bird Island – Insel Managaha – Grotte mit Taucher und Lichtstrahl
	MP: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${birds(110, 50, 0.7)}<path d="M0,170 V90 Q20,70 50,74 L60,110 Z" ${L3} stroke-width="1.6"/>${sea(110)}${at(110, 112, 1.4, STACK)}${pine(110, 80, 14)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/><path d="M0,0 H180 V40 Q130,30 120,0 H60 Q50,30 0,40 Z" ${SOLID}/><path d="M70,0 L50,170 H130 L110,0 Z" fill="#7FE7E0" fill-opacity=".25" stroke="none"/><path d="M0,140 Q40,126 80,134 Q130,122 180,136 V170 H0 Z" ${SOLID}/>${at(90, 96, 1.6, `<g style="color:#F4F7FA"><circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M0,-3 L4,6 L10,12 M4,6 L-2,12 M-2,-2 L-8,-6" stroke-width="2"/></g>`)}<circle cx="70" cy="70" r="2" fill="none" stroke="#F4F7FA" stroke-opacity=".6"/><circle cx="74" cy="60" r="1.4" fill="none" stroke="#F4F7FA" stroke-opacity=".6"/>`
	],
	// Neukaledonien: Kulturzentrum Tjibaou – Herz von Voh in der Lagune – Isle of Pines mit Araukarien und Auslegersegel
	NC: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 132, 1.4, TJIBAOU)}${[[16, 132, 40], [166, 132, 36]].map(([x, y, h]) => araucaria(x, y, h)).join('')}`,
		null,
		() => `${sun(110, 70, 18)}${rays(110, 70, 18, 16)}${birds(150, 30)}${sea(104)}<path d="M0,104 Q20,90 50,92 L60,104 Z" ${L3} stroke-width="1.4"/>${[[10, 100, 50], [24, 98, 60], [38, 100, 44], [52, 102, 36]].map(([x, y, h]) => araucaria(x, y, h)).join('')}${at(120, 140, 1.4, `<path d="M-24,0 Q0,6 24,0 L22,-3 H-22 Z" ${SOLID}/><path d="M-14,4 H14" stroke-width="1.2"/><path d="M0,-3 L-4,-40 Q14,-30 20,-4 Z" ${SNOW} stroke-width="1.2"/>`)}`
	],
	// Norfolkinsel: georgianische Gebäude in Kingston – Klippen mit Norfolk-Tannen – Maskentölpel bei Sonnenuntergang
	NF: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${at(90, 126, 1.3, GEORGIAN)}${[[16, 126, 50], [166, 126, 44]].map(([x, y, h]) => araucaria(x, y, h)).join('')}<path d="M0,126 Q90,118 180,128 V170 H0 Z" ${L1} stroke-width="2"/>`,
		null,
		() => `${sun(110, 80, 20)}${rays(110, 80, 20, 16)}${sea(110)}<path d="M0,60 Q30,56 60,70 L70,170 H0 Z" ${L3} stroke-width="1.8"/>${[[14, 62, 40], [30, 64, 30], [48, 70, 26]].map(([x, y, h]) => araucaria(x, y, h)).join('')}${[[100, 50], [130, 40], [150, 60]].map(([x, y]) => at(x, y, 1, `<path d="M-14,0 Q-6,-6 0,0 Q6,-6 14,0 Q6,-2 2,2 L0,6 L-2,2 Q-6,-2 -14,0 Z" ${SNOW} stroke-width="1"/>`)).join('')}${at(40, 70, 1, BOOBY)}`
	],
	// Niue: Buckelwal-Mutter mit Kalb – Matapa-Schlucht – Felsbogen im Abendrot mit Delfinen
	NU: [
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/>
${at(90, 90, 1.8, `<path d="M-40,0 Q-20,-14 10,-12 Q30,-10 40,-2 L52,-10 Q48,0 52,10 L40,2 Q30,10 10,12 Q-20,14 -40,0 Z" ${SOLID}/><path d="M-10,8 Q-20,22 -30,24 Q-16,22 -4,10 Z" ${SOLID}/><path d="M-30,2 Q-10,6 20,4" stroke="var(--paper)" stroke-width="1.2" stroke-dasharray="2 2"/>`)}${at(130, 130, 0.9, `<path d="M-40,0 Q-20,-14 10,-12 Q30,-10 40,-2 L52,-10 Q48,0 52,10 L40,2 Q30,10 10,12 Q-20,14 -40,0 Z" ${SOLID}/>`)}`,
		null,
		() => `${sun(120, 80, 20)}${rays(120, 80, 20, 16)}${birds(150, 30)}<path d="M0,40 H90 Q110,44 110,70 V110 H90 V80 Q86,64 70,64 Q54,64 50,80 V110 H0 Z" ${L3} stroke-width="1.8"/>${sea(110)}${[[110, 130], [140, 140], [160, 126]].map(([x, y]) => at(x, y, 1, DOLPHIN)).join('')}`
	],
	// Pitcairninseln: Bounty-Beiboot in der Bounty Bay – Adamstown am Hang – die Bounty unter Segeln im Abendrot
	PN: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 Q30,60 80,56 Q130,60 160,110 Z" ${L2} stroke-width="1.8"/>${sea(110)}${at(90, 140, 1.4, `<path d="M-24,0 Q0,6 24,0 L22,-4 H-22 Z" ${SOLID}/><path d="M-16,-4 L-22,-14 M-6,-4 L-12,-14 M6,-4 L12,-14 M16,-4 L22,-14" stroke-width="1.2"/>${[-14, -4, 6, 16].map((x) => `<circle cx="${x}" cy="-8" r="2" ${SOLID}/>`).join('')}`)}`,
		null,
		() => `${sun(110, 70, 20)}${rays(110, 70, 20, 16)}${birds(150, 30)}${sea(110)}${at(90, 130, 1.4, BOUNTY)}`
	],
	// Wallis und Futuna: Kratersee Lalolalo – Küste von Futuna – Festungsruine Talietumu im Abendrot
	WF: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V80 Q30,60 90,58 Q150,60 180,80 V170 Z" ${L2} stroke-width="1.8"/><ellipse cx="90" cy="100" rx="60" ry="18" ${L3} stroke-width="1.4"/><path d="M0,80 V100 M180,80 V100" stroke-width="1"/>${[[30, 84], [150, 84], [60, 76], [120, 76]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" ${L3} stroke="none"/>`).join('')}`,
		null,
		() => `${sun(110, 80, 20)}${rays(110, 80, 20, 16)}<path d="M0,120 Q90,110 180,122 V170 H0 Z" ${L2} stroke-width="2"/>${at(70, 124, 1.3, `<path d="M-50,0 V-16 H50 V0" ${L3} stroke-width="1.4"/><path d="M-50,-16 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4 M20,-16 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4" stroke-width="1"/><path d="M-10,-16 V-26 H10 V-16" ${L3} stroke-width="1.2"/>`)}${palm(160, 130, 40, -6)}`
	],
	// Mikronesien: Basaltruinen von Nan Madol – Wracktauchen in der Chuuk-Lagune – (Legendary: bisheriges Bild)
	FM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${at(90, 120, 1.3, NANMADOL)}${palm(20, 110, 40, 6)}${palm(160, 110, 34, -6)}<path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		SCENES.FM
	],
	// Kiribati: Versammlungshaus (Maneaba) auf Tarawa – Lagune von Tarawa mit Kanus – (Legendary: bisheriges Bild)
	KI: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${SNOW} stroke-width="2"/>${at(90, 132, 1.3, MANEABA)}${palm(16, 140, 40, 6)}${palm(166, 140, 36, -6)}`,
		null,
		SCENES.KI
	],
	// Marshallinseln: Atoll Majuro von oben – Kanurennen mit Krebsscherensegeln – (Legendary: bisheriges Bild)
	MH: [
		() => `${sun(150, 26, 9)}<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><ellipse cx="90" cy="100" rx="74" ry="50" ${SNOW} stroke-width="1" stroke-dasharray="4 3"/><ellipse cx="90" cy="100" rx="64" ry="40" ${L2} stroke-width="1.4"/>${Array.from({ length: 16 }, (_, i) => {
			const a = (i / 16) * Math.PI * 2;
			return `<ellipse cx="${f1(90 + 70 * Math.cos(a))}" cy="${f1(100 + 45 * Math.sin(a))}" rx="${i % 3 ? 6 : 10}" ry="3" transform="rotate(${f1((a * 180) / Math.PI + 90)} ${f1(90 + 70 * Math.cos(a))} ${f1(100 + 45 * Math.sin(a))})" ${SOLID}/>`;
		}).join('')}`,
		null,
		SCENES.MH
	],
	// Nauru: Buada-Lagune zwischen Palmen – Strand der Anibare-Bucht – (Legendary: bisheriges Bild)
	NR: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,120 Q90,110 180,122 V170 H0 Z" ${L1} stroke-width="2"/><ellipse cx="90" cy="130" rx="60" ry="14" ${L3} stroke-width="1.4"/>${[16, 36, 140, 164].map((x, i) => palm(x, 124, 50, i < 2 ? 8 : -8)).join('')}`,
		null,
		SCENES.NR
	],
	// Palau: Milky-Way-Lagune mit weißem Schlamm – Blue Corner mit Haien – (Legendary: bisheriges Bild)
	PW: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,90 Q20,60 50,64 L60,90 Z M120,90 L130,60 Q160,56 180,70 V90 Z" ${SOLID}/><path d="M0,90 H180 V170 H0 Z" ${SNOW}/><path d="M0,90 H180" stroke-width="1.6"/>${at(90, 140, 1, `<circle cx="0" cy="-10" r="3" ${SOLID}/><path d="M-12,0 Q0,-4 12,0" stroke-width="2"/>`)}<path d="${waves(10, 116, 11, 15, 2.4)}" stroke-width="1.2" stroke-opacity=".5"/>`,
		null,
		SCENES.PW
	],
	// Salomonen: Pfahlhaus in der Marovo-Lagune – Riffinseln mit Delfinen – (Legendary: bisheriges Bild)
	SB: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,110 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/>${at(80, 124, 1.6, STILT)}${palm(150, 110, 40, -6)}<path d="${waves(10, 156, 11, 15, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
		null,
		SCENES.SB
	],
	// Tonga: Blaslöcher von Houma – Inseln von Vava’u mit Jachten – (Legendary: bisheriges Bild)
	TO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V120 Q90,108 180,120 V170 Z" ${L3} stroke-width="1.8"/>${blowhole(40, 120, 40)}${blowhole(90, 116, 56)}${blowhole(140, 120, 34)}<path d="M0,104 H180" stroke-width="1.4"/>`,
		null,
		SCENES.TO
	],
	// Tuvalu: Pandanus und Kokospalmen mit Kanu – Lagune von Funafuti von oben – (Legendary: bisheriges Bild)
	TV: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(110)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${palm(30, 140, 70, 10)}${palm(150, 140, 60, -8)}${at(90, 140, 1.4, `<path d="M0,0 V-30 M0,-8 L-8,0 M0,-8 L8,0" stroke-width="1.6"/><path d="M-20,-30 Q0,-44 20,-30 Q0,-24 -20,-30 Z" ${L3} stroke-width="1.2"/>`)}${at(100, 116, 0.8, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/><path d="M-12,4 H12" stroke-width="1"/>`)}`,
		null,
		SCENES.TV
	],
	// Vanuatu: Unterwasser-Briefkasten – Blue Hole auf Espiritu Santo mit Seilschaukel – (Legendary: bisheriges Bild)
	VU: [
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/>${at(90, 140, 2, POSTBOX)}${at(50, 90, 1.2, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M0,-3 L4,6 L10,12 M4,6 L-2,12 M-2,-2 L-8,-6" stroke-width="2"/>`)}<path d="M0,150 Q40,140 80,146 Q130,136 180,148 V170 H0 Z" ${L3} stroke-width="1.6"/>${coral(30, 152, 20)}${coral(150, 150, 24)}`,
		null,
		SCENES.VU
	],
	// Antarktis: Tafeleisberg mit Wal – Kaiserpinguin-Kolonie – Polarlicht über Eisbergen und Pinguinen
	AQ: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M20,110 V80 H150 V110 Z" ${SNOW} stroke-width="1.6"/><path d="M20,80 H150" stroke-width="2"/><path d="M30,84 V108 M60,84 V108 M90,84 V108 M120,84 V108" stroke-width="1" stroke-opacity=".5"/>${sea(110)}${at(120, 140, 1.2, FLUKE)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40, 1], [80, 40, 1], [130, 36, 1]], STAR)}<path d="M0,66 Q50,24 100,50 Q140,70 180,34 V62 Q140,96 100,78 Q50,54 0,96 Z" ${STAR} fill-opacity=".22" stroke="none"/><path d="${Array.from({ length: 24 }, (_, i) => `M${4 + i * 7.4},${f1(56 - 18 * Math.sin((i / 23) * Math.PI * 1.4) + 4 * Math.sin(i * 1.3))} v${14 + (i % 4) * 5}`).join(' ')}" stroke="#F4F7FA" stroke-opacity=".5" stroke-width="2"/>
${at(140, 118, 1.2, ICEBERG)}${at(40, 116, 0.8, ICEBERG)}<path d="M0,118 H180 V170 H0 Z" ${SNOW}/><path d="M0,118 H180" stroke-width="1.4"/>${[[60, 160, 1.4], [84, 164, 1.2], [104, 160, 1.4], [70, 150, 0.8]].map(([x, y, s]) => at(x, y, s, GENTOO)).join('')}`
	],
	// Heard und McDonaldinseln: See-Elefanten am Strand – Gletscher und Vulkan – Ausbruch des Big Ben bei Nacht mit Polarlicht
	HM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 L60,40 Q70,34 80,40 L140,100 Z" ${SNOW} stroke-width="1.6"/>${sea(100)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${L1} stroke-width="1.6"/>${at(60, 156, 1.2, `<path d="M-26,0 Q-28,-10 -18,-14 Q-4,-18 10,-16 Q20,-14 24,-6 Q26,0 20,0 Z" ${SOLID}/><path d="M18,-14 Q26,-14 28,-8 Q28,-4 24,-4" ${SOLID}/>`)}${at(130, 160, 0.9, `<path d="M-26,0 Q-28,-10 -18,-14 Q-4,-18 10,-16 Q20,-14 24,-6 Q26,0 20,0 Z" ${SOLID}/>`)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [150, 10], [170, 40, 1], [40, 30, 1]], STAR)}<path d="M0,40 Q60,10 120,30 Q160,40 180,20 V40 Q160,60 120,50 Q60,32 0,62 Z" ${STAR} fill-opacity=".2" stroke="none"/><path d="M10,120 L76,44 Q90,38 104,44 L170,120 Z" ${SNOW}/><path d="M76,44 Q90,38 104,44 L112,60 L100,56 L92,66 L84,56 L70,60 Z" fill="#F7A35C" fill-opacity=".7" stroke="none"/>
<path d="M88,40 Q80,20 86,4 M96,40 Q104,22 98,6" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="5"/><path d="M90,46 L86,70 L94,90 M96,46 L104,76" stroke="#F7A35C" stroke-width="2.4"/><path d="M0,120 H180 V170 H0 Z" ${L4} stroke="none"/><path d="${waves(8, 140, 11, 15, 2.4)}" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="1.4"/>`
	],
	// Französische Süd- und Antarktisgebiete: Felsbogen von Kerguelen – Königspinguine auf den Crozetinseln – Albatros über den Klippen im Abendrot
	TF: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(110)}${at(90, 118, 1.2, `<path d="M-50,0 Q-52,-50 -24,-62 Q0,-70 24,-62 Q52,-50 50,0 H30 Q32,-32 18,-40 Q0,-48 -18,-40 Q-32,-32 -30,0 Z" ${L3} stroke-width="1.8"/>`)}`,
		null,
		() => `${sun(130, 80, 18)}${rays(130, 80, 18, 16)}<path d="M0,60 Q30,54 70,70 L80,170 H0 Z" ${L3} stroke-width="1.8"/><path d="M0,60 Q30,54 70,70" stroke-width="3"/><path d="M14,70 V160 M34,66 V160 M54,72 V160" stroke-width="1" stroke-dasharray="6 3"/>${sea(110).replace('M0,110 H180', 'M76,110 H180')}<path d="M76,110 H180 V170 H80 Z" ${L2} stroke="none"/><path d="${waves(84, 130, 6, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(120, 50, 1.4, ALBATROSS)}`
	],
	// Bouvetinsel: Robbenkolonie am Strand – vergletscherte Insel – Polarlicht über der Bouvetinsel
	BV: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,100 L40,70 L80,80 L130,60 L180,84 V110 H0 Z" ${SNOW} stroke-width="1.6"/>${sea(110)}<path d="M0,140 Q90,130 180,142 V170 H0 Z" ${L1} stroke-width="1.6"/>${[[40, 156], [90, 160], [140, 154]].map(([x, y]) => at(x, y, 1, SEALION)).join('')}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[60, 12], [100, 22], [150, 10], [170, 40, 1], [80, 40, 1]], STAR)}<path d="M0,66 Q50,24 100,50 Q140,70 180,34 V62 Q140,96 100,78 Q50,54 0,96 Z" ${STAR} fill-opacity=".22" stroke="none"/><path d="${Array.from({ length: 24 }, (_, i) => `M${4 + i * 7.4},${f1(56 - 18 * Math.sin((i / 23) * Math.PI * 1.4) + 4 * Math.sin(i * 1.3))} v${14 + (i % 4) * 5}`).join(' ')}" stroke="#F4F7FA" stroke-opacity=".5" stroke-width="2"/>
<path d="M20,130 Q30,110 50,100 L74,80 Q90,70 106,80 L130,100 Q150,110 160,130 Z" ${SNOW}/><path d="M0,130 H180 V170 H0 Z" ${L4} stroke="none"/><path d="${waves(8, 146, 11, 15, 2.4)}" stroke="#F4F7FA" stroke-opacity=".4" stroke-width="1.4"/>`
	],
	// Kokosinseln: Einsiedlerkrebs am Strand – Lagune mit Kitesurfern – Suppenschildkröte unter Wasser
	CC: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}${sea(100)}${beach(124)}${at(90, 150, 2, `<path d="M-10,0 Q-10,-14 0,-14 Q10,-14 10,0 Z" ${L3} stroke-width="1.2"/><path d="M-6,-6 Q0,-12 6,-6" stroke-width="1"/><path d="M-10,-2 L-16,-6 M-10,0 L-16,2 M10,0 L14,4" stroke-width="1.4"/><circle cx="-14" cy="-8" r="1.2" ${SOLID}/>`)}`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/>${at(90, 96, 2.2, TURTLE)}<path d="M0,150 Q40,140 80,146 Q130,136 180,148 V170 H0 Z" ${L3} stroke-width="1.6"/>${coral(30, 152, 20)}${coral(150, 150, 24)}`
	],
	// Weihnachtsinsel: Blaslöcher an der Küste – Wanderung der Roten Krabben über die Straße – Palmendieb und Goldener Tropikvogel
	CX: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,170 V120 Q90,108 180,120 V170 Z" ${L3} stroke-width="1.8"/>${blowhole(50, 120, 44)}${blowhole(120, 118, 30)}<path d="M0,104 H180" stroke-width="1.4"/>`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/>${[[14, 20], [46, 0], [140, 10], [170, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="28" ${L2} stroke="none"/>`).join('')}<path d="M130,170 Q134,100 126,40" stroke-width="5"/>${at(70, 150, 1.4, `<path d="M-16,0 Q-18,-14 -4,-16 Q10,-16 14,-4 Q14,0 8,0 Z" ${SOLID}/><path d="M12,-8 Q22,-14 26,-24 L32,-26 L28,-18 Q24,-8 14,-4 M-14,-6 Q-24,-12 -28,-22 L-34,-24 L-30,-16 Q-26,-6 -16,-2" ${SOLID}/><path d="M-12,0 L-18,10 M-4,0 L-6,10 M4,0 L6,10 M10,0 L16,10" stroke-width="2"/>`)}${at(110, 60, 1.4, `<path d="M-14,0 Q-6,-6 0,0 Q6,-6 14,0 Q6,-2 2,2 L0,24 L-2,2 Q-6,-2 -14,0 Z" ${L3} stroke-width="1"/>`)}`
	],
	// Tokelau: Atollhaus unter Palmen – Lagune des Atolls von oben – Fliegende-Fische-Fang mit Fackeln bei Nacht
	TK: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${SNOW} stroke-width="2"/>${at(90, 134, 1.6, FALE)}${palm(20, 140, 50, 8)}${palm(160, 140, 44, -8)}`,
		null,
		() => `<rect width="180" height="170" ${NIGHT} stroke="none"/>${dots([[16, 60], [60, 12], [100, 22], [150, 10], [170, 40], [80, 40, 1]], STAR)}<path d="M0,100 H180 V170 H0 Z" ${L4} stroke="none"/>${[[60, 130, 1.2], [130, 140, 1]].map(([x, y, s]) => at(x, y, s, `<path d="M-22,0 Q0,4 22,0 L20,-3 H-20 Z" fill="#F4F7FA" fill-opacity=".8" stroke="none"/><path d="M-6,-3 V-24" stroke="#F4F7FA" stroke-width="1.4"/><path d="M-6,-24 q-3,-4 0,-8 q3,4 0,8 Z" fill="#F7A35C" stroke="none"/><circle cx="-6" cy="-28" r="10" fill="#F7E3A1" fill-opacity=".18" stroke="none"/><path d="M6,-3 L14,-20 Q20,-24 24,-18 L18,-6" stroke="#F4F7FA" stroke-width="1.2"/>`)).join('')}${[[90, 110], [100, 116], [40, 112]].map(([x, y]) => `<path d="M${x - 6},${y} l6,-2 l6,2 l-6,2 Z M${x - 4},${y} l-4,-4 M${x + 4},${y} l4,-4" stroke="#F4F7FA" stroke-opacity=".6" stroke-width="1"/>`).join('')}`
	],
	// Amerikanische Überseeinseln: Albatros-Küken auf Midway – Lagune des Palmyra-Atolls – Mönchsrobbe am Strand im Abendrot
	UM: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${SNOW} stroke-width="2"/>${at(90, 150, 2, `<path d="M-14,0 Q-18,-16 -4,-20 Q10,-22 14,-10 Q14,0 8,0 Z" ${L3} stroke-width="1.3"/><circle cx="8" cy="-22" r="6" ${L3} stroke-width="1.2"/><path d="M13,-22 L20,-20 L13,-19" ${SOLID}/><circle cx="9" cy="-23" r=".9" ${SOLID}/>`)}${at(150, 120, 0.8, `<path d="M-6,0 Q-8,-8 -2,-12 Q6,-14 8,-8 Q10,-2 4,0 Z" ${SNOW} stroke-width="1"/>`)}${palm(30, 140, 40, 6)}`,
		null,
		() => `${sun(110, 80, 20)}${rays(110, 80, 20, 16)}${birds(150, 30)}<path d="M0,110 H180 V130 H0 Z" ${L2} stroke="none"/><path d="M0,110 H180" stroke-width="1.6"/><path d="M0,130 Q90,120 180,132 V170 H0 Z" ${SNOW} stroke-width="1.6"/>${at(90, 156, 1.6, `<path d="M-30,0 Q-32,-10 -20,-14 Q0,-18 16,-14 Q24,-10 26,-4 Q26,0 20,0 Z" ${L3} stroke-width="1.3"/><circle cx="20" cy="-10" r=".9" ${SOLID}/><path d="M-30,0 L-38,-4 M-30,0 L-38,4" stroke-width="2"/>`)}${palm(160, 140, 40, -6)}`
	],
	// Chagos-Inseln: Palmendieb unter Kokospalmen auf Diego Garcia – Atoll-Lagune – Mantarochen über dem Riff
	IO: [
		() => `${sun(150, 26, 9)}${birds(80, 30)}<path d="M0,130 Q90,120 180,132 V170 H0 Z" ${SNOW} stroke-width="2"/>${palm(40, 136, 80, 10)}${palm(140, 136, 70, -10)}${at(90, 156, 1.4, `<path d="M-16,0 Q-18,-14 -4,-16 Q10,-16 14,-4 Q14,0 8,0 Z" ${SOLID}/><path d="M12,-8 Q22,-14 26,-24 L32,-26 L28,-18 Q24,-8 14,-4" ${SOLID}/><path d="M-12,0 L-18,10 M-4,0 L-6,10 M4,0 L6,10 M10,0 L16,10" stroke-width="2"/>`)}`,
		null,
		() => `<path d="M0,0 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M30,0 L50,90 M90,0 L94,100 M150,0 L130,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14" stroke-width="1.6"/>${at(90, 80, 2.2, MANTA)}${at(140, 120, 1, MANTA)}<path d="M0,150 Q40,140 80,146 Q130,136 180,148 V170 H0 Z" ${L3} stroke-width="1.6"/>${coral(30, 152, 20)}${coral(110, 150, 24)}`
	]
};

/** Querformat (Epic): Szene in 270 × 130 */
export const WIDE: Record<string, () => string> = {
	EG: () => `${sun(232, 28, 12)}${birds(150, 26)}${birds(186, 42, 0.7)}<path d="M0,84 Q60,72 120,82 Q190,70 270,84 V98 H0 Z" ${L1} stroke-width="1.6"/>
${pyr(84, 96, 60, true)}${pyr(150, 96, 42, true)}${pyr(196, 96, 24)}<path d="M0,96 Q90,90 180,96 Q225,92 270,96 V132 H0 Z" ${L1} stroke-width="2"/>
${at(46, 122, 0.82, CAMEL)}${at(82, 121, 0.72, CAMEL)}${at(114, 120, 0.62, CAMEL)}<path d="M75,105 Q78,109 82,107 M107,106 Q110,109 114,108" stroke-width="1"/>${palm(240, 126, 42, -6)}${palm(258, 126, 28, -4)}${grass(160, 124)}${grass(10, 126)}${grass(206, 128)}`,
	JP: () => `<circle cx="92" cy="26" r="12" ${SOLID}/><path d="M20,58 H50 M100,50 H120 M196,58 H236" stroke-width="1.4" stroke-dasharray="6 4"/><g transform="translate(60,-28)">${fuji(true)}</g><g transform="translate(86,0)">${sakura()}</g>
<path d="M0,104 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M90,104 L130,120 Q150,126 170,120 L210,104" stroke-width="1.2" stroke-dasharray="3 4"/><path d="${waves(118, 126, 5, 15, 2.4)}" stroke-width="1.4"/>
<path d="M0,104 Q30,92 64,100 L72,110 Q30,114 0,112 Z" ${L3} stroke-width="1.8"/>${at(32, 104, 0.78, pagoda())}${pine(62, 104, 20)}${pine(250, 106, 18)}${pine(236, 106, 12, L4)}`,
	IS: () => `${dots([[30, 14], [70, 28], [110, 10], [170, 16], [200, 8], [250, 40], [20, 44]])}<path d="M228,14 a9,9 0 1 0 8,13 a7,7 0 1 1 -8,-13 Z" ${SOLID}/><path d="M10,50 Q80,16 140,36 Q200,56 270,24 V40 Q200,74 140,52 Q80,34 10,66 Z" ${L1} stroke="none"/><path d="M10,50 Q80,16 140,36 Q200,56 270,24" stroke-width="2.4" stroke-dasharray="3 4"/>
<g transform="translate(50,-22)"><path d="${KIRKJU}" ${L3} stroke-width="2.2"/><path d="M96,56 L92,64 L98,62 L102,70 L106,62 Z" ${SNOW} stroke-width="1.2"/><path d="M96,56 Q92,80 80,104 M110,70 Q110,92 118,110 M86,72 Q80,90 70,104" stroke-width="1.2"/></g>
<path d="M0,102 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,102 H270" stroke-width="2"/>${at(238, 106, 0.8, `<path d="M-10,0 V-12 H10 V0 Z" ${SOLID}/><path d="M-12,-11 L0,-20 L12,-11 Z" ${SOLID}/><path d="M-6,-14 V-28 M-9,-18 L-6,-28 L-3,-18" ${SOLID} stroke="currentColor" stroke-width="1.6"/><rect x="-2" y="-8" width="4" height="8" ${PAPER}/>`)}
<path d="M0,110 H58 Q66,110 66,116 V132 H0 Z" ${L3} stroke-width="2"/><path d="M14,110 V126 M24,110 V128 M34,110 V125 M44,110 V127" stroke="var(--stp)" stroke-width="2.2"/><path d="${waves(8, 129, 4, 12, 2.4)}" stroke="var(--stp)" stroke-width="1.6"/><path d="${waves(120, 118, 6, 16, 2.4)}" stroke-width="1.4"/>`,
	PE: () => `${sun(240, 24, 10)}${birds(16, 24)}<path d="M0,84 L30,50 L52,64 L80,36 L104,60 L180,46 L210,58 L236,42 L270,52 V110 H0 Z" ${L1} stroke-width="1.6"/><path d="M80,36 L74,46 L81,43 L86,48 Z M30,50 L25,58 L31,56 L35,58 Z M236,42 L231,50 L237,48 L241,50 Z" ${SNOW} stroke-width="1.2"/>
<g transform="translate(40,-14) scale(.9)">${picchu(true)}</g>${cloud(196, 104)}<path d="M0,104 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,104 H270" stroke-width="2"/>${at(240, 129, 0.9, LLAMA)}${grass(20, 126)}${grass(120, 128)}${grass(190, 126)}`,
	KE: () => `${sun(236, 28, 11)}${birds(150, 24)}<path d="M0,96 Q70,92 108,74 Q130,52 140,48 Q156,40 172,48 Q184,56 206,78 Q240,92 270,94 V132 H0 Z" ${L1} stroke-width="1.8"/><path d="M140,48 Q156,40 172,48 L167,53 L161,48 L155,55 L149,48 L144,53 Z" ${SNOW} stroke-width="1.4"/><path d="M0,100 Q135,92 270,100 V132 H0 Z" ${L2} stroke-width="2"/>
${at(46, 100, 1.4, ACACIA)}${at(206, 104, 0.95, GIRAFFE)}${at(108, 120, 0.72, ELEPHANT)}${at(136, 122, 0.52, ELEPHANT)}${grass(18, 124)}${grass(84, 128)}${grass(176, 126)}${grass(250, 120)}`,
	FR: () => `${sun(236, 24, 10)}${birds(150, 22)}<path d="M180,94 Q210,70 250,74 Q262,76 270,80 V94 Z" ${L1} stroke-width="1.6"/>${at(222, 76, 0.7, `<path d="M-14,0 V-10 H14 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-6,-10 Q-6,-20 0,-20 Q6,-20 6,-10 Z M-14,-10 Q-14,-15 -10,-15 Q-6,-15 -6,-10 M6,-10 Q6,-15 10,-15 Q14,-15 14,-10" ${SNOW} stroke-width="1.3"/>`)}
<path d="M0,94 H270 V104 H0 Z" ${L1} stroke-width="1.4"/>${at(76, 98, 1, EIFFEL(84, true))}${[130, 150, 170, 190, 250].map((x) => bush(x, 96, 6)).join('')}<path d="M0,104 H270 V132 H0 Z" ${L2} stroke="none"/>
<path d="M120,104 V112 Q135,98 150,112 Q165,98 180,112 Q195,98 210,112 V104" stroke-width="1.8"/><path d="M114,103 H216" stroke-width="2.6"/>${at(66, 120, 0.9, `<path d="M-20,0 H20 L16,5 H-16 Z" ${SOLID}/><path d="M-14,0 V-6 H12 V0" ${SNOW} stroke-width="1.3"/>`)}<path d="${waves(220, 120, 3, 14, 2.4)}" stroke-width="1.4"/>`,
	IT: () => `${sun(236, 26, 11)}${birds(160, 24)}<path d="M0,84 Q60,70 120,80 Q190,66 270,82 V100 H0 Z" ${L1} stroke-width="1.6"/>${[24, 40, 56].map((x) => cypress(x, 84, 18)).join('')}
<path d="M0,100 Q135,92 270,100 V132 H0 Z" ${L1} stroke-width="2"/>${at(150, 104, 0.95, COLOS)}${at(54, 108, 1.1, STONEPINE)}${at(240, 106, 1, STONEPINE)}${cypress(90, 106, 36)}${cypress(102, 106, 26)}${cypress(210, 106, 30)}
<path d="M0,118 Q135,110 270,118" stroke-width="1.2" stroke-dasharray="6 4"/>${grass(20, 126)}${grass(120, 128)}${grass(190, 126)}`,
	GR: () => `${sun(214, 70, 14)}${birds(150, 26)}${birds(186, 40, 0.7)}<path d="M150,96 Q200,88 270,94" stroke-width="1.2"/>
<path d="M0,52 H100 Q112,58 116,80 L122,104 H0 Z" ${L2} stroke-width="2"/>${at(86, 52, 0.9, windmill(25))}${cube(4, 70, 18, 14)}${cube(22, 72, 14, 18)}${at(56, 78, 1.05, CHAPEL)}${cube(74, 80, 18, 14)}${cube(4, 92, 20, 14)}${cube(26, 96, 16, 12)}${cube(84, 100, 14, 12)}
<path d="M0,104 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(8, 114, 18, 14, 3)}" stroke-width="1.8"/><path d="${waves(14, 126, 18, 14, 3)}" stroke-width="1.4"/>${at(190, 116, 0.9, SAIL)}`,
	ES: () => `${sun(236, 26, 11)}${birds(150, 34)}<path d="M0,100 Q60,60 140,70 Q200,76 270,70 V104 H0 Z" ${L2} stroke-width="2"/>${keep(196, 72, 24, 18)}${keep(222, 72, 14, 12)}
${at(40, 84, 0.95, windmill(10))}${at(78, 72, 0.95, windmill(35))}${at(116, 68, 0.95, windmill(60))}${at(154, 70, 0.95, windmill(80))}<path d="M0,104 H270 V132 H0 Z" ${L1} stroke-width="1.8"/>
${[16, 50, 84, 118, 152, 186, 220, 254].map((x, i) => at(x, 120 + (i % 2) * 6, 0.55, OLIVE)).join('')}`,
	PT: () => `${sun(236, 24, 10)}${birds(150, 26)}<path d="M120,96 H270 V132 H120 Z" ${L2} stroke="none"/>${bridge(140, 90, 130)}<path d="${waves(146, 116, 8, 14, 2.4)}" stroke-width="1.4"/>
${facades(0, 50, 6, 22, 3, 132)}<path d="M0,120 L132,92 V132 H0 Z" ${L3} stroke-width="2"/><path d="M0,126 L132,98" stroke-width="1.2" stroke-dasharray="4 3"/>${at(70, 108, 1.05, `<g transform="rotate(-12)">${TRAM}</g>`)}`,
	HR: () => `${sun(236, 26, 11)}${birds(170, 30)}<path d="M0,74 Q60,52 130,62 Q200,48 270,64 V90 H0 Z" ${L1} stroke-width="1.6"/>
<path d="M40,100 V68 Q100,62 160,68 V100 Z" ${L2} stroke-width="2"/>${keep(40, 100, 22, 42, L3)}${keep(140, 100, 24, 38, L3)}${[66, 84, 102, 120].map((x, i) => `<path d="M${x},${68 - (i % 2) * 5} L${x + 8},${58 - (i % 2) * 5} L${x + 16},${68 - (i % 2) * 5} Z" ${L3} stroke-width="1.2"/>`).join('')}<path d="M92,68 V44 M89,44 L92,38 L95,44" stroke-width="2"/>
<path d="M0,100 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(8, 112, 18, 14, 3)}" stroke-width="1.8"/><path d="M196,100 Q220,88 250,92 L262,100 Z" ${L3} stroke-width="1.4"/>${pine(226, 92, 12)}${at(206, 122, 0.8, SAIL)}`,
	MT: () => `${sun(236, 24, 10)}${birds(170, 40)}<path d="M0,84 H270 V96 H0 Z" ${L1} stroke-width="1.6"/>${at(130, 84, 1.05, VALLETTA)}${keep(60, 84, 30, 10, L2)}${keep(186, 84, 26, 12, L2)}
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(140, 110, 9, 14, 3)}" stroke-width="1.6"/>${at(56, 118, 1, LUZZU)}${at(124, 124, 0.9, LUZZU)}${at(206, 122, 1, LUZZU)}`,
	VA: () => `${sun(240, 24, 10)}${birds(40, 56, 0.7)}${birds(210, 50, 0.7)}<path d="M0,132 V86 H270 V132 Z" ${L1} stroke="none"/>${at(135, 84, 1, STPETER)}${colonnade(10, 100, 88, 0)}${colonnade(170, 260, 88, 0)}
<path d="M0,86 H270" stroke-width="1.6"/><path d="M60,114 Q135,100 210,114 Q135,128 60,114 Z" ${L2} stroke-width="1.2"/>${at(135, 120, 0.9, OBELISK)}${dots([[90, 112, 2], [180, 116, 2], [196, 112, 2]], SOLID)}`,
	CY: () => `<circle cx="190" cy="70" r="16" ${SOLID}/>${rays(190, 70, 16, 16)}${birds(80, 28)}<path d="M0,74 H270" stroke-width="1.6"/><path d="M0,74 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M170,80 H210 M176,86 H204" stroke="var(--stp)" stroke-width="1.6"/>
<path d="M0,132 V60 Q20,56 40,74 Q56,96 60,132 Z" ${L3} stroke-width="2"/>${at(110, 112, 1.3, STACK)}${at(152, 110, 0.6, STACK)}<path d="M76,110 q8,-8 16,0 q8,-8 16,0 M130,110 q6,-6 12,0" stroke="var(--stp)" stroke-width="2"/><path d="${waves(170, 120, 6, 16, 2.4)}" stroke-width="1.4"/>`,
	ME: () => `${sun(236, 22, 10)}<path d="M0,96 V30 L40,14 L80,50 L110,96 Z" ${L2} stroke-width="2"/><path d="M270,96 V36 L230,18 L190,52 L156,96 Z" ${L3} stroke-width="2"/><path d="M110,96 Q135,70 156,96" ${L1} stroke-width="1.4"/>
<path d="M0,96 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,96 H270" stroke-width="1.8"/>${at(126, 116, 1.05, ISLECHURCH)}<path d="${waves(20, 112, 4, 14, 2.4)} ${waves(190, 120, 4, 14, 2.4)}" stroke-width="1.4"/>${at(60, 124, 0.8, `<path d="M-14,0 H14 L10,5 H-10 Z" ${SOLID}/><path d="M-8,0 V-5 H6 V0" ${SNOW} stroke-width="1.2"/>`)}`,
	MC: () => `${sun(240, 22, 10)}<path d="M110,80 Q140,46 190,44 Q240,44 270,56 V84 H110 Z" ${L1} stroke-width="1.6"/>${at(200, 78, 0.9, CASINO)}${palm(140, 84, 26, 6)}${palm(250, 82, 24, -6)}
<path d="M0,96 Q10,50 50,46 Q90,46 104,70 L112,96 Z" ${L3} stroke-width="2"/>${at(52, 48, 0.85, PALAIS)}<path d="M110,84 H270" stroke-width="2"/><path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(8, 110, 18, 14, 3)}" stroke-width="1.6"/>
${at(70, 120, 1, YACHT)}${at(160, 112, 0.7, YACHT)}${at(220, 124, 0.9, YACHT)}`,
	SM: () => `${sun(240, 24, 10)}${birds(170, 40)}<path d="M0,132 L40,96 L80,58 L104,64 L134,40 L160,56 L190,36 L220,70 L270,108 V132 Z" ${L3} stroke-width="2"/><path d="M80,58 L104,64 L134,40 L160,56 L190,36" stroke-width="1.6" stroke-dasharray="3 2"/>
${at(80, 60, 0.75, GUAITA)}${at(134, 42, 0.9, GUAITA)}${at(190, 38, 0.7, GUAITA)}${cloud(10, 112)}${cloud(150, 124)}${cloud(220, 118)}`,
	AL: () => `${sun(240, 22, 10)}<path d="M0,60 L50,24 L90,46 L130,16 L180,44 L230,26 L270,40 V80 H0 Z" ${L1} stroke-width="1.6"/><path d="M130,16 L122,28 L130,24 L138,28 Z" ${SNOW} stroke-width="1.2"/>
<path d="M0,112 V60 Q70,52 140,66 Q200,80 270,100 V112 Z" ${L2} stroke-width="2"/>${berat(14, 104, 8, 16)}${at(124, 96, 1, MINARET)}${keep(30, 62, 12, 10, L3)}<path d="M40,60 H110" stroke-width="1.4"/>
<path d="M0,112 H270 V132 H0 Z" ${L3} stroke="none"/><path d="M150,112 Q180,92 210,112" stroke-width="3"/><path d="M158,112 Q180,98 202,112" ${PAPER}/><path d="${waves(4, 124, 19, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	AD: () => `${sun(240, 22, 10)}<path d="M0,80 L50,30 L90,56 L140,16 L190,50 L230,28 L270,52 V96 H0 Z" ${L1} stroke-width="1.8"/><path d="M140,16 L128,32 L140,26 L152,34 Z M50,30 L42,42 L51,38 L58,42 Z M230,28 L222,38 L230,34 L238,38 Z" ${SNOW} stroke-width="1.2"/>
<path d="M0,100 Q135,90 270,100 V132 H0 Z" ${L2} stroke-width="2"/>${at(70, 102, 1, ROMAN)}${pine(18, 104, 26)}${pine(250, 104, 28)}${pine(234, 104, 18, L4)}
<path d="M120,132 V118 Q160,112 200,118 V132 Z" ${L3} stroke="none"/><path d="M140,118 Q160,98 180,118" stroke-width="3"/><path d="M146,118 Q160,104 174,118" ${PAPER}/><path d="M132,118 H188" stroke-width="2"/>`,
	GI: () => `${sun(240, 22, 10)}${birds(170, 26)}<g transform="translate(40,0) scale(1.05,.85)">${ROCK(116)}</g><path d="M0,98 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(60, 108, 14, 14, 3)}" stroke-width="1.6"/>
${at(210, 112, 0.8, `<path d="M-26,0 H26 L20,6 H-22 Z" ${SOLID}/><path d="M-16,0 V-8 H12 V0 M-4,-8 V-14 H4 V-8" ${SNOW} stroke-width="1.3"/>`)}<path d="M0,132 V104 H56 V132 Z" ${L3} stroke-width="2"/><path d="M0,104 H56" stroke-width="2.6"/>${at(28, 104, 0.95, MACAQUE)}`,
	DE: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,112 V52 Q30,34 64,46 Q96,58 118,100 V112 Z" ${L2} stroke-width="1.8"/>${vines(6, 104, 44, 16, 6)}${keep(22, 50, 16, 18, SNOW)}${keep(40, 46, 10, 26, SNOW)}<path d="M38,44 l7,-8 l7,8 Z" ${SOLID}/>
<path d="M270,112 V44 Q240,30 210,46 Q180,62 160,104 V112 Z" ${L1} stroke-width="1.8"/>${vines(170, 104, 44, 15, 6)}<path d="M222,46 L232,30 L240,34 L246,46" ${L3} stroke-width="1.4"/>${at(196, 110, 0.55, SPIRE)}<path d="M206,110 V100 h8 V110 M216,110 V102 h8 V110" ${SNOW} stroke-width="1"/>
<path d="M0,110 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,110 H270" stroke-width="2"/>${at(130, 122, 1, RIVERBOAT)}<path d="${waves(10, 124, 5, 16, 2.4)}" stroke-width="1.4"/><path d="${waves(170, 126, 5, 16, 2.4)}" stroke-width="1.4"/>`,
	AT: () => `${birds(150, 20)}${sun(146, 40, 8)}<path d="M0,98 V18 Q22,10 42,30 L72,72 L96,98 Z" ${L2} stroke-width="1.8"/><path d="M270,98 V26 L242,12 L214,38 L186,62 L164,98 Z" ${L2} stroke-width="1.8"/><path d="M84,98 L122,52 L150,72 L180,98" ${L1} stroke-width="1.6"/>
<path d="M242,12 L234,22 L242,20 L248,26 Z M122,52 L116,62 L123,59 L128,64 Z" ${SNOW} stroke-width="1"/>${Array.from({ length: 9 }, (_, i) => {
		const x = 14 + i * 13 + (i > 3 ? 16 : 0),
			y = 98 - (i % 3) * 4;
		return `<path d="M${x},${y} V${y - 10} L${x + 5},${y - 15} L${x + 10},${y - 10} V${y} Z" ${[SNOW, L1, L3][i % 3]} stroke-width="1"/><rect x="${x + 3.5}" y="${y - 8}" width="3" height="3" ${SOLID}/>`;
	}).join('')}${at(70, 98, 0.85, SPIRE)}
<path d="M0,98 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,98 H270" stroke-width="2"/><g opacity=".3" transform="translate(0,196) scale(1,-1)"><path d="M0,98 V18 Q22,10 42,30 L72,72 L96,98 Z M270,98 V26 L242,12 L214,38 L186,62 L164,98 Z" ${L3} stroke="none"/></g>
${at(190, 116, 1, SWAN)}${at(214, 122, 0.8, SWAN)}<path d="M110,118 H140 L136,122 H114 Z" ${SOLID}/><path d="M124,118 V108" stroke-width="1.2"/>`,
	CH: () => `${sun(244, 20, 8)}${birds(160, 22)}${alps(64, 270, L1)}<path d="M0,84 Q50,66 92,82 V132 H0 Z" ${L2} stroke-width="1.8"/><path d="M270,84 Q228,64 188,82 V132 H270 Z" ${L2} stroke-width="1.8"/>
${viaduct(80, 66, 116, 22, 5)}${at(90, 66, 1, train(4))}<path d="M0,116 Q135,106 270,118 V132 H0 Z" ${L1} stroke-width="1.6"/><path d="${waves(90, 124, 6, 16, 2.4)}" stroke-width="1.4"/>
${[[14, 84, 26], [30, 86, 20], [46, 84, 24], [218, 84, 22], [236, 86, 28], [254, 86, 20], [62, 92, 16], [206, 92, 16]].map(([x, y, h]) => pine(x, y, h)).join('')}${[[20, 118, 18], [40, 120, 14], [230, 120, 18], [250, 118, 22]].map(([x, y, h]) => pine(x, y, h, L4)).join('')}`,
	NL: () => `${sun(236, 22, 9)}${birds(150, 18)}${cloud(90, 30)}${gables(6, 98, 16, 16)}<path d="M0,98 H270" stroke-width="2"/>
<path d="M0,98 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M96,98 Q135,80 174,98 Z" ${PAPER}/><path d="M90,98 Q135,76 180,98 M96,98 Q135,82 174,98" stroke-width="2"/>${at(120, 90, 0.8, BIKE)}${at(146, 90, 0.8, BIKE)}
<path d="${waves(8, 112, 5, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/><path d="M190,118 H244 L238,124 H196 Z" ${SOLID}/><path d="M198,118 V112 H232 V118" ${SNOW} stroke-width="1.2"/><path d="${waves(180, 128, 5, 16, 2)}" stroke-width="1.2"/>`,
	BE: () => `${sun(236, 22, 9)}${birds(110, 20)}${at(135, 98, 1, BELFRY)}${gables(4, 98, 6, 16)}${gables(170, 98, 6, 16)}<path d="M0,98 H270" stroke-width="2"/>
<path d="M0,98 H270 V132 H0 Z" ${L2} stroke="none"/><g opacity=".3" transform="translate(0,196) scale(1,-1)">${at(135, 98, 1, BELFRY)}</g>${at(60, 114, 1.1, SWAN)}${at(86, 120, 0.9, SWAN)}<path d="M180,116 H230 L224,122 H186 Z" ${SOLID}/><path d="${waves(150, 126, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	GB: () => `${cloud(80, 30)}${birds(100, 20)}<path d="M230,98 L244,20 L258,98 Z" ${L1} stroke-width="1.4"/><path d="M28,98 V60 Q28,40 38,36 Q48,40 48,60 V98" ${L1} stroke-width="1.4"/><path d="M30,56 L46,50 M29,70 L47,64 M29,84 L47,78" stroke-width="1"/>
${at(135, 100, 1.08, TOWERBR)}<path d="M0,100 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,100 H270" stroke-width="2"/><path d="${waves(10, 116, 7, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/><path d="${waves(170, 120, 6, 14, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>
<path d="M190,114 H232 L228,120 H194 Z" ${SOLID}/><path d="M198,114 V108 H222 V114" ${SNOW} stroke-width="1.2"/>`,
	IE: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,60 Q40,40 90,54 Q140,36 190,52 Q230,40 270,50 V132 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,86 Q60,66 130,80 Q200,62 270,78 V132 H0 Z" ${L2} stroke-width="1.8"/>
<path d="M20,58 Q60,62 90,74 M140,46 Q150,60 136,80 M190,54 Q210,66 250,64 M40,96 Q90,100 120,118 M170,90 Q190,104 230,104" stroke-width="1.2" stroke-dasharray="2 2"/>${at(214, 74, 1, ROUNDT)}<path d="M224,74 V64 H240 V74" ${L3} stroke-width="1.2"/><path d="M228,64 l4,-6 l4,6" stroke-width="1.2"/>
${at(40, 110, 0.9, SHEEP)}${at(70, 118, 0.75, SHEEP)}${at(150, 112, 0.85, SHEEP, true)}${at(110, 98, 0.6, SHEEP)}${grass(20, 126)}${grass(190, 124)}`,
	DK: () => `${sun(236, 22, 9)}${birds(130, 20)}${nyhavn(4, 96, 9)}${nyhavn(170, 96, 7)}<path d="M0,96 H270" stroke-width="2"/><path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/>
${[[40, 112, 1], [90, 116, 0.85], [196, 114, 1], [240, 118, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-16,0 H16 L12,5 H-12 Z" ${SOLID}/><path d="M0,0 V-30" stroke-width="1.6"/><path d="M-10,-26 L0,-30 L10,-26" stroke-width="1"/>`)).join('')}<path d="${waves(120, 124, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	NO: () => `${sun(150, 24, 8)}${birds(200, 22)}<path d="M0,100 L0,26 L30,30 L50,60 L70,100 Z" ${L2} stroke-width="1.8"/><path d="M110,100 L136,40 L150,54 L170,20 L196,60 L214,44 L236,70 L270,40 V100 Z" ${L2} stroke-width="1.8"/><path d="M170,20 L164,32 L171,28 L176,34 Z M136,40 L131,50 L137,47 L141,51 Z" ${SNOW} stroke-width="1"/>
${[[80, 100], [100, 102], [124, 100], [186, 100], [210, 102]].map(([x, y]) => at(x, y, 0.9, RORBU)).join('')}<path d="M0,102 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,102 H270" stroke-width="2"/>
${at(240, 118, 0.7, `<path d="M-14,0 H14 L10,5 H-10 Z" ${SOLID}/><path d="M0,0 V-24" stroke-width="1.4"/>`)}<path d="${waves(20, 118, 9, 16, 2.4)}" stroke-width="1.4"/><path d="M50,116 L70,116 M100,112 h20" stroke="var(--stp)" stroke-width="1.4"/>`,
	SE: () => `${sun(236, 22, 9)}${birds(60, 20)}${gables(30, 92, 12, 15)}<path d="M50,92 V40 L54,30 L58,20 L62,30 L66,40 V92" ${L2} stroke-width="1.4"/><path d="M196,92 V50 H208 V92" ${L3} stroke-width="1.3"/><path d="M194,50 L202,30 L210,50 Z" ${SOLID}/>
<path d="M0,92 H270" stroke-width="2"/><path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 108, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(180, 118, 1, YACHT)}${at(80, 116, 0.8, `<path d="M-20,0 H20 L16,5 H-16 Z" ${SOLID}/><path d="M-12,0 V-8 H10 V0" ${SNOW} stroke-width="1.2"/><path d="M0,-8 V-14" stroke-width="2"/>`)}`,
	FI: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,80 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,80 H270" stroke-width="1.6"/>
${[[20, 80, 90, 74], [120, 92, 60, 86], [190, 76, 70, 70], [40, 112, 70, 106], [170, 116, 80, 110]].map(([x, y, w, t]) => `<path d="M${x},${y} Q${x + w * 0.2},${t - 6} ${x + w / 2},${t - 8} Q${x + w * 0.8},${t - 6} ${x + w},${y} Z" ${L3} stroke-width="1.4"/>${Array.from({ length: Math.floor(w / 12) }, (_, i) => pine(x + 8 + i * 12, y - 1, 12 + ((i * 5) % 8))).join('')}`).join('')}
<path d="M100,108 H128 L124,112 H104 Z" ${SOLID}/><path d="${waves(120, 124, 3, 14, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	PL: () => `${sun(236, 22, 9)}${birds(110, 20)}<path d="M0,96 L30,44 L50,60 L84,14 L110,50 L140,30 L170,64 L196,36 L230,70 L270,48 V96 Z" ${L2} stroke-width="1.8"/><path d="M84,14 L76,28 L85,24 L90,30 Z M196,36 L190,46 L197,43 L202,48 Z M140,30 L135,40 L141,37 L146,41 Z" ${SNOW} stroke-width="1"/>
<path d="M50,96 H220 Q200,116 135,116 Q70,116 50,96 Z" ${L3} stroke-width="1.6"/><g opacity=".3" transform="translate(0,192) scale(1,-1)"><path d="M84,14 L110,50 L140,30 L170,64 L170,96 H84 Z" ${L3} stroke="none"/></g>
<path d="M0,96 H60 M210,96 H270" stroke-width="1.8"/><path d="M0,96 H270 V132 H0 Z" ${L1} stroke="none"/>${[[20, 96, 24], [36, 98, 18], [230, 96, 22], [250, 98, 26]].map(([x, y, h]) => pine(x, y, h)).join('')}${at(46, 124, 1, CHALET)}${pine(250, 126, 20, L4)}${grass(120, 124)}${grass(160, 126)}`,
	CZ: () => `${sun(236, 22, 9)}${birds(110, 22)}<path d="M0,96 Q60,64 130,72 Q200,64 270,90 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(96, 84, 1.1, KRUMLOV)}<path d="M104,84 V64 H150 V84" ${SNOW} stroke-width="1.3"/>${[110, 118, 126, 134, 142].map((x) => `<rect x="${x}" y="70" width="3" height="5" ${SOLID}/>`).join('')}
${Array.from({ length: 10 }, (_, i) => {
		const x = 20 + i * 22 + (i > 3 ? 70 : 0),
			y = 104 - (i % 2) * 4;
		return x > 250 ? '' : `<path d="M${x},${y} V${y - 12} L${x + 8},${y - 19} L${x + 16},${y - 12} V${y} Z" ${[SNOW, L2][i % 2]} stroke-width="1"/><path d="M${x - 1},${y - 12} L${x + 8},${y - 20} L${x + 17},${y - 12}" stroke-width="1.6"/>`;
	}).join('')}<path d="M0,106 Q60,96 130,112 Q200,128 270,110 V132 H0 Z" ${L2} stroke-width="1.8"/><path d="${waves(20, 120, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	LU: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,50 H100 Q110,52 112,62 L118,132 H0 Z" ${L3} stroke-width="2"/><path d="M14,58 V126 M34,56 V126 M54,58 V126 M74,56 V126 M94,60 V126" stroke-width="1" stroke-dasharray="6 3"/>${[16, 40, 64, 88].map((x) => `<path d="M${x},80 h6 v6 h-6 Z M${x},100 h6 v6 h-6 Z" ${SOLID}/>`).join('')}
${gables(68, 50, 3, 16)}<path d="M150,132 V90 Q190,70 270,76 V132 Z" ${L2} stroke-width="1.6"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${160 + i * 18},${92 - i * 2} V${80 - i * 2} L${168 + i * 18},${74 - i * 2} L${176 + i * 18},${80 - i * 2} V${92 - i * 2} Z" ${SNOW} stroke-width="1"/>`).join('')}
<path d="M118,132 Q130,118 150,132" ${L1} stroke-width="1.6"/>${bush(132, 124, 7)}${at(220, 126, 0.6, SPIRE)}`,
	LI: () => `${sun(236, 22, 9)}${birds(140, 20)}${alps(78, 270, L1)}<path d="M0,96 Q40,64 80,60 Q110,62 124,90 L270,104 V132 H0 Z" ${L2} stroke-width="1.8"/>
${at(80, 64, 0.85, `${keep(-30, 0, 20, 20, SNOW)}<path d="M-10,0 V-22 H24 V0" ${SNOW} stroke-width="1.3"/><path d="M-12,-22 L7,-32 L26,-22 Z" ${SOLID}/>${keep(24, 0, 12, 30, SNOW)}`)}${vines(10, 124, 40, 26, 9)}<path d="M120,110 Q190,104 270,116" stroke-width="2.4" stroke="var(--stp)"/><path d="M120,110 Q190,104 270,116" stroke-width="1"/>${at(210, 104, 0.55, SPIRE)}`,
	EE: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,72 H270" stroke-width="1.6"/><path d="M0,72 H270 V100 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 84, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>
${[[40, 76, 14], [90, 80, 10], [150, 74, 18], [200, 82, 8]].map(([x, y, r]) => `<path d="M${x - r},${y} Q${x - r},${y - r * 0.9} ${x},${y - r} Q${x + r},${y - r * 0.9} ${x + r},${y} Z" ${L3} stroke-width="1.4"/>`).join('')}
<path d="M0,100 Q135,92 270,102 V132 H0 Z" ${L1} stroke-width="1.6"/><path d="M40,124 L120,104 H200 L250,96" stroke-width="5"/><path d="M40,124 L120,104 H200 L250,96" stroke="var(--stp)" stroke-width="2.4" stroke-dasharray="1.4 3"/>${[[20, 110, 24], [36, 112, 18], [230, 112, 22], [254, 114, 28]].map(([x, y, h]) => pine(x, y, h)).join('')}${grass(150, 124)}${grass(100, 126)}`,
	LV: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,70 H270 V96 H0 Z" ${L2} stroke="none"/><path d="M0,70 H270" stroke-width="1.6"/><path d="${waves(10, 80, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>
<path d="M0,96 Q60,88 130,92 Q200,86 270,94 V132 H0 Z" ${SNOW} stroke-width="1.6"/><path d="M150,132 Q170,100 210,98 Q240,96 270,100 V132 Z" ${L1} stroke-width="1.4"/>${[[170, 108, 34], [190, 104, 40], [214, 104, 30], [240, 102, 38], [260, 104, 32]].map(([x, y, h]) => `<path d="M${x},${y} V${y - h + 10}" stroke-width="2"/><path d="M${x - 10},${y - h + 12} Q${x},${y - h} ${x + 10},${y - h + 12} Z" ${SOLID}/>`).join('')}
${at(110, 108, 0.9, STUGA)}${at(40, 112, 0.8, PERSON)}${at(60, 114, 0.6, PERSON)}${grass(140, 120)}`,
	LT: () => `${sun(236, 22, 9)}${birds(60, 20)}<path d="M0,90 Q40,40 100,46 Q150,52 180,80 Q220,60 270,70 V96 H0 Z" ${SNOW} stroke-width="1.8"/><path d="M30,80 Q60,60 96,62 M120,64 Q150,70 168,84" stroke-width="1" stroke-dasharray="3 3"/>
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="2"/><path d="${waves(30, 112, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(200, 94, 1.1, MOOSE)}${[[230, 92, 18], [246, 92, 24], [262, 92, 16]].map(([x, y, h]) => pine(x, y, h)).join('')}${grass(150, 92)}`,
	SK: () => `${sun(236, 22, 9)}${birds(60, 22)}<path d="M0,132 V96 Q60,64 135,60 Q210,64 270,96 V132 Z" ${L2} stroke-width="1.8"/>${at(135, 62, 1, SPIS)}<path d="M0,110 Q70,100 135,108 Q200,100 270,112 V132 H0 Z" ${L1} stroke-width="1.6"/>
${[[20, 112, 18], [36, 114, 14], [234, 114, 18], [250, 112, 22]].map(([x, y, h]) => pine(x, y, h)).join('')}${at(80, 124, 0.8, `<path d="M0,0 V-8" stroke-width="1"/>${SHEEP}`)}${at(190, 126, 0.7, SHEEP, true)}`,
	HU: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M150,90 V60 H262 V90" ${SNOW} stroke-width="1.3"/><path d="M196,60 Q206,36 216,60 Z" ${L3} stroke-width="1.3"/><path d="M206,40 V30" stroke-width="1.4"/>${[156, 170, 184, 228, 242, 256].map((x) => `<path d="M${x - 3},60 L${x},48 L${x + 3},60 Z" ${SOLID}/>`).join('')}${[158, 166, 174, 182, 190, 222, 230, 238, 246, 254].map((x) => `<rect x="${x}" y="70" width="3" height="10" ${SOLID}/>`).join('')}
<path d="M0,90 Q30,60 70,64 Q100,70 110,90 Z" ${L2} stroke-width="1.6"/>${at(56, 66, 0.6, BASTEI)}<path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/>${chainbr(0, 92, 270)}<path d="${waves(10, 120, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	SI: () => `${sun(236, 22, 9)}${birds(100, 22)}${alps(64, 270, L1)}<path d="M0,96 V50 Q20,40 40,46 L56,96 Z" ${L3} stroke-width="1.8"/>${at(24, 46, 0.7, `${keep(-14, 0, 14, 16, SNOW)}<path d="M0,0 V-12 H16 V0" ${SNOW} stroke-width="1.2"/>`)}
<path d="M0,96 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,96 H270" stroke-width="1.8"/>${at(150, 94, 1.1, ISLECHURCH)}<g opacity=".3" transform="translate(0,190) scale(1,-1)">${at(150, 94, 1.1, ISLECHURCH)}</g>
${at(80, 118, 1, `<path d="M-20,0 H20 L16,4 H-16 Z" ${SOLID}/><path d="M-14,0 V-8 Q0,-14 14,-8 V0" ${L2} stroke-width="1.2"/><path d="M16,0 L22,-10" stroke-width="1.4"/>`)}${[[230, 96, 18], [246, 98, 22], [262, 96, 16]].map(([x, y, h]) => pine(x, y, h)).join('')}<path d="${waves(190, 120, 4, 16, 2)}" stroke-width="1.2"/>`,
	RO: () => `${sun(236, 22, 9)}${birds(110, 22)}<path d="M0,132 V70 L40,30 L80,50 L120,16 L170,44 L210,24 L270,60 V132 Z" ${L2} stroke-width="1.8"/><path d="M120,16 L112,28 L121,25 L126,32 Z M210,24 L203,34 L211,31 L216,36 Z" ${SNOW} stroke-width="1"/>
<path d="M30,132 Q60,120 90,124 Q130,128 120,112 Q110,100 140,98 Q180,98 170,86 Q160,74 190,72 Q220,70 216,60" stroke="var(--stp)" stroke-width="5"/><path d="M30,132 Q60,120 90,124 Q130,128 120,112 Q110,100 140,98 Q180,98 170,86 Q160,74 190,72 Q220,70 216,60" stroke-width="1.2" stroke-dasharray="4 3"/>
${[[14, 120, 22], [30, 116, 18], [250, 116, 24], [238, 120, 18]].map(([x, y, h]) => pine(x, y, h)).join('')}${at(100, 126, 0.6, `<rect x="-8" y="-6" width="16" height="6" rx="2" ${SOLID}/><circle cx="-4" cy="0" r="2" ${SOLID}/><circle cx="4" cy="0" r="2" ${SOLID}/>`)}`,
	BG: () => `${sun(236, 22, 9)}${birds(140, 20)}${alps(70, 270, L1)}<path d="M30,110 V56 H240 V110" ${SNOW} stroke-width="1.4"/><path d="M26,56 L36,46 H234 L244,56 Z" ${SOLID}/>${arcade(36, 104, 17, 12, 3)}
<path d="M118,110 V40 H150 V110" ${L2} stroke-width="1.3"/><path d="M114,40 Q134,18 154,40 Z" ${SOLID}/>${[122, 128, 136, 142].map((x) => `<path d="M${x},50 V60" stroke="var(--stp)" stroke-width="2"/>`).join('')}<path d="M134,22 V14 M131,17 H137" stroke-width="1.2"/>
<path d="M0,110 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,110 H270" stroke-width="2"/>${[[12, 110, 22], [256, 110, 24]].map(([x, y, h]) => pine(x, y, h)).join('')}`,
	RS: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,96 L30,40 L60,58 L80,96 Z M190,96 L220,46 L250,60 L270,52 V96 Z" ${L2} stroke-width="1.8"/>${wall(40, 96, 72, 12, SNOW)}${rtower(46, 60, 10, 18, SNOW)}${rtower(70, 68, 9, 12, SNOW)}${rtower(90, 76, 8, 10, SNOW)}
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="2"/><path d="${waves(10, 112, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(180, 120, 0.9, RIVERBOAT)}`,
	BA: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,60 Q135,40 270,60 V68 H0 Z" ${L2} stroke-width="1.6"/>${[20, 50, 210, 240].map((x) => bush(x, 60, 10, L3)).join('')}${cascades(10, 66, 250, 7)}
<path d="M0,88 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,88 H270" stroke-width="2"/><path d="${waves(10, 104, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/><path d="${waves(20, 118, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	MK: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,0 H60 Q74,40 70,132 H0 Z M270,0 H200 Q188,50 196,132 H270 Z" ${L3} stroke-width="2"/><path d="M14,20 L18,120 M36,10 L40,120 M226,20 L222,120 M248,10 L246,120" stroke-width="1" stroke-dasharray="6 3"/>
<path d="M70,96 H196 V132 H70 Z" ${L2} stroke="none"/><path d="M70,96 H196" stroke-width="2"/>${at(130, 110, 1, ROWBOAT)}<path d="${waves(80, 122, 7, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>${at(40, 10, 0.6, GRACANICA)}`,
	MD: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,76 Q60,60 135,66 Q210,58 270,72 V132 H0 Z" ${L1} stroke-width="1.8"/>${[0, 1, 2, 3, 4].map((r) => `<path d="M0,${84 + r * 10} Q135,${74 + r * 12} 270,${86 + r * 10}" stroke-width="1.6" stroke-dasharray="1.6 4"/>`).join('')}
<path d="M110,132 V100 Q135,84 160,100 V132 Z" ${L3} stroke-width="1.6"/><path d="M122,132 V106 Q135,96 148,106 V132 Z" ${SOLID}/>${barrel(70, 118, 10)}${barrel(92, 122, 8)}${[[20, 72, 10], [240, 72, 12]].map(([x, y, r]) => bush(x, y, r)).join('')}`,
	UA: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,70 L30,40 L60,56 L100,28 L140,52 L180,34 L220,56 L270,40 V90 H0 Z" ${L1} stroke-width="1.6"/>${at(130, 92, 1, WOODCH)}${[[40, 90, 30], [60, 92, 22], [200, 90, 26], [220, 92, 34], [240, 90, 22]].map(([x, y, h]) => pine(x, y, h)).join('')}
${[0, 1, 2, 3].map((i) => `<path d="M${i * 70 - 10},132 L${100 + i * 20},92 H${116 + i * 20} L${i * 70 + 50},132 Z" ${[L3, SNOW, L2, L4][i]} stroke-width="1"/>`).join('')}<path d="M0,92 H270" stroke-width="1.6"/>`,
	BY: () => `${sun(236, 22, 9)}${birds(100, 20)}${[[10, 104, 60], [32, 100, 52], [54, 106, 62], [214, 104, 58], [238, 100, 66], [260, 106, 54], [80, 100, 40], [190, 100, 44]].map(([x, y, h]) => pine(x, y, h, x > 70 && x < 200 ? L4 : SOLID)).join('')}
<path d="M0,104 Q135,96 270,106 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(108, 110, 1.3, `<path d="M8,-20 Q10,-34 24,-34 Q36,-34 40,-26 Q48,-26 52,-20 Q56,-12 50,-6 V0 H46 V-6 H40 V0 H36 V-6 H20 V0 H16 V-6 H12 V0 H8 Z" ${SOLID}/><path d="M10,-22 Q2,-22 0,-14 Q0,-8 6,-8 L10,-12" ${SOLID}/>`)}${at(160, 116, 0.9, `<path d="M8,-20 Q10,-34 24,-34 Q36,-34 40,-26 Q48,-26 52,-20 Q56,-12 50,-6 V0 H46 V-6 H40 V0 H36 V-6 H20 V0 H16 V-6 H12 V0 H8 Z" ${SOLID}/><path d="M10,-22 Q2,-22 0,-14 Q0,-8 6,-8 L10,-12" ${SOLID}/>`, true)}`,
	RU: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,70 L40,40 L80,56 L130,30 L180,52 L220,36 L270,56 V90 H0 Z" ${L1} stroke-width="1.6"/><path d="M130,30 L124,40 L131,37 L136,42 Z M40,40 L35,48 L41,46 L44,50 Z" ${SNOW} stroke-width="1"/>
<path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,90 H270" stroke-width="1.6"/><path d="M0,104 Q100,96 270,108" stroke-width="2.4"/><path d="M0,107 Q100,99 270,111" stroke-width="1" stroke-dasharray="2 3"/>${at(80, 102, 1, train(5))}<path d="${waves(20, 124, 8, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	XK: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,0 H70 Q90,40 84,132 H0 Z M270,0 H190 Q172,50 180,132 H270 Z" ${L3} stroke-width="2"/><path d="M16,20 L22,120 M44,10 L50,120 M220,20 L216,120 M246,10 L244,120" stroke-width="1" stroke-dasharray="6 3"/>
<path d="M84,110 Q132,100 180,112 V132 H84 Z" ${L2} stroke-width="1.6"/><path d="${waves(90, 124, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>${[[100, 100, 22], [120, 96, 30], [150, 100, 24], [168, 104, 18]].map(([x, y, h]) => pine(x, y, h)).join('')}<path d="M86,78 Q132,60 180,74" stroke-width="1.6" stroke-dasharray="3 3"/>`,
	GL: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,80 L40,52 L80,66 L120,40 L170,62 L220,44 L270,60 V90 H0 Z" ${SNOW} stroke-width="1.6"/>${nyhavn(10, 96, 6, 14)}<path d="M0,96 Q50,90 100,96" stroke-width="2"/>
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M100,96 H270" stroke-width="2"/>${at(160, 114, 1, ICEBERG)}${at(230, 112, 0.6, ICEBERG)}${at(120, 120, 0.6, ICEBERG)}<path d="${waves(10, 120, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	FO: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,60 Q60,52 140,58 L170,62 V132 H0 Z" ${L3} stroke-width="2"/><path d="M20,70 Q80,62 140,68 L150,80 Q80,86 20,80 Z" ${L1} stroke-width="1.4"/><path d="M150,72 L162,80 V120" stroke="var(--stp)" stroke-width="3"/><path d="M152,72 L160,80 V122" stroke-width="1"/>
<path d="M170,62 H270 V132 H160 Z" ${L2} stroke="none"/><path d="M162,62 H270" stroke-width="1.6"/><path d="${waves(180, 90, 5, 16, 2.4)}" stroke-width="1.6"/>${at(230, 116, 0.8, STACKS)}<path d="M14,58 V132 M40,58 V132 M70,58 V132 M100,58 V132 M130,58 V132" stroke-width="1" stroke-dasharray="6 3" stroke-opacity=".6"/>`,
	AX: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/>
${[[30, 96, 60, 16], [120, 100, 46, 12], [200, 96, 70, 18], [70, 116, 40, 8]].map(([x, y, w, h]) => `<path d="M${x - w / 2},${y} Q${x - w / 4},${y - h} ${x},${y - h} Q${x + w / 4},${y - h} ${x + w / 2},${y} Z" ${L3} stroke-width="1.4"/>`).join('')}${at(20, 84, 0.8, BOATHOUSE)}${at(210, 80, 0.8, STUGA)}${pine(40, 86, 18)}${pine(230, 82, 16)}${pine(196, 84, 14, L4)}
${at(150, 120, 0.9, `<path d="M-14,0 H14 L10,5 H-10 Z" ${SOLID}/><path d="M0,0 V-30" stroke-width="1.4"/><path d="M1.5,-28 L14,-2 H1.5 Z" ${SNOW} stroke-width="1.2"/>`)}${at(250, 124, 0.7, `<path d="M-14,0 H14 L10,5 H-10 Z" ${SOLID}/><path d="M0,0 V-30" stroke-width="1.4"/><path d="M1.5,-28 L14,-2 H1.5 Z" ${SNOW} stroke-width="1.2"/>`)}`,
	GG: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,90 Q30,40 90,44 Q140,48 160,90 Z" ${L1} stroke-width="1.6"/>${gables(10, 90, 8, 16)}<path d="M0,90 H270" stroke-width="2"/><path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/>
<path d="M190,90 Q200,76 220,76 Q240,78 246,90 Z" ${L3} stroke-width="1.4"/>${keep(204, 78, 26, 16, SNOW)}<path d="M150,90 H200" stroke-width="3"/>${at(80, 112, 1, YACHT)}<path d="${waves(140, 118, 6, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	IM: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,96 Q40,64 90,70 Q120,74 130,96 Z" ${L2} stroke-width="1.6"/><path d="M40,72 V50 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 V72" ${SNOW} stroke-width="1.3"/>${rtower(84, 72, 10, 22, SNOW)}<path d="M20,80 V66 H30 V80" ${L3} stroke-width="1.1"/>
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="2"/><path d="M130,96 L270,92" stroke-width="1"/>${gables(160, 92, 6, 16)}<path d="${waves(20, 116, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	JE: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/><path d="M150,96 Q160,80 180,80 Q200,82 204,96 Z" ${SOLID}/>${at(178, 80, 1.1, LIGHTHOUSE)}
<path d="M30,132 Q90,110 150,98" stroke-width="5"/><path d="M30,132 Q90,110 150,98" stroke="var(--stp)" stroke-width="1.6" stroke-dasharray="2 3"/><path d="M0,96 Q20,80 50,84 Q70,88 76,96 Z" ${L3} stroke-width="1.4"/><path d="${waves(170, 116, 5, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(110, 118, 0.6, PERSON)}`,
	SJ: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,96 L0,40 L40,24 L70,50 L110,30 L160,56 L200,34 L240,52 L270,40 V96 Z" ${SNOW} stroke-width="1.8"/><path d="M40,24 L44,50 M110,30 L104,60 M200,34 L206,60" stroke-width="1"/>
${nyhavn(60, 100, 9, 14)}<path d="M0,100 H270 V132 H0 Z" ${SNOW}/><path d="M0,100 H270" stroke-width="1.6"/>${at(220, 124, 0.9, `<path d="M-14,0 H18 L20,-4 H-14 Z M-10,-4 V-10 H8 V-4" ${SOLID}/><path d="M-16,2 H20" stroke-width="1.4"/>`)}${at(30, 120, 0.6, PERSON)}`,
	TR: () => `${sun(236, 22, 9)}${birds(130, 20)}<path d="M0,50 Q60,38 135,44 Q210,36 270,48 V132 H0 Z" ${L1} stroke-width="1.6"/>${terraces(52, 5)}<path d="M0,120 Q135,112 270,122 V132 H0 Z" ${L2} stroke-width="1.6"/>${at(40, 64, 0.6, PERSON)}${at(230, 62, 0.6, PERSON)}`,
	GE: () => `${sun(236, 22, 9)}${birds(130, 20)}${alps(80, 270, L1)}<path d="M0,96 Q60,80 135,88 Q210,80 270,92 V132 H0 Z" ${L2} stroke-width="1.8"/>${[[40, 96], [70, 92], [100, 98], [150, 92], [180, 96], [210, 90]].map(([x, y], i) => at(x, y, 0.9 + (i % 2) * 0.15, SVAN)).join('')}
<path d="M0,112 Q135,104 270,114 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(240, 124, 0.7, horse())}${grass(30, 124)}${grass(130, 126)}`,
	AM: () => `${sun(236, 22, 9)}${birds(140, 20)}${ARARAT(96, 270)}<path d="M0,96 Q135,88 270,98 V132 H0 Z" ${L1} stroke-width="2"/>${at(120, 100, 1, `<path d="M-30,0 V-12 H30 V0 Z" ${L2} stroke-width="1.2"/>${ARMCH}<path d="M-30,-12 v-3 h4 v3 h4 v-3 h4 v3 M18,-12 v-3 h4 v3 h4 v-3 h4 v3" stroke-width="1"/>`)}
${[0, 1, 2, 3].map((r) => `<path d="M0,${108 + r * 6} Q135,${102 + r * 6} 270,${110 + r * 6}" stroke-width="1.4" stroke-dasharray="1.6 4"/>`).join('')}`,
	AZ: () => `${sun(236, 22, 9)}${birds(60, 20)}${at(130, 90, 1.1, flames(76))}${[[30, 40], [60, 54], [200, 50], [240, 36]].map(([x, h]) => `<path d="M${x - 6},90 V${90 - h} H${x + 6} V90" ${L1} stroke-width="1.2"/>`).join('')}${at(80, 90, 0.6, MAIDEN)}
<path d="M0,90 H270" stroke-width="2"/><path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke="var(--stp)" stroke-width="2"/><path d="${waves(10, 116, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${palm(20, 92, 22, 3)}${palm(250, 92, 24, -3)}`,
	IL: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[20, 40], [36, 56], [54, 34], [70, 48], [86, 62], [104, 44], [120, 52], [138, 38]].map(([x, h], i) => `<path d="M${x - 7},84 V${84 - h} H${x + 7} V84" ${[SNOW, L1, L2][i % 3]} stroke-width="1.2"/>${Array.from({ length: Math.floor(h / 8) }, (_, k) => `<path d="M${x - 4},${80 - k * 8} h8" stroke-width=".8"/>`).join('')}`).join('')}
<path d="M0,84 H270" stroke-width="1.6"/><path d="M0,84 Q135,92 270,86 V100 H0 Z" ${SNOW} stroke-width="1.4"/><path d="M0,100 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 114, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${palm(170, 92, 24, 3)}${palm(200, 92, 30, -3)}${at(230, 96, 0.6, PERSON)}`,
	JO: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V30 Q40,10 80,26 V132 Z M270,132 V20 Q230,6 190,24 V132 Z" ${L3} stroke-width="1.8"/>${at(135, 116, 1, `<path d="M-40,0 V-70 H40 V0 Z" ${L2} stroke="none"/><path d="M-30,0 V-36 H30 V0" ${SNOW} stroke-width="1.3"/>${[-22, -8, 8, 22].map((x) => `<path d="M${x},-2 V-34" stroke-width="2"/>`).join('')}<path d="M-32,-36 H32 M-14,-36 V-56 Q0,-66 14,-56 V-36" ${SNOW} stroke-width="1.3"/><path d="M-6,0 V-18 H6 V0" ${SOLID}/>`)}
<path d="M0,116 Q135,108 270,118 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(210, 128, 0.7, CAMEL)}${at(60, 128, 0.6, PERSON)}`,
	LB: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q40,52 90,60 Q120,64 130,84 Z" ${L2} stroke-width="1.6"/>${wall(30, 100, 70, 12, SNOW)}${rtower(70, 58, 18, 14, SNOW)}<path d="M100,84 H270" stroke-width="1.6"/>
<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M110,100 Q150,92 190,100 L200,84" stroke-width="3"/>${at(150, 108, 0.9, `<path d="M-16,0 H16 L12,5 H-12 Z" ${SOLID}/><path d="M0,0 V-20" stroke-width="1.4"/>`)}${at(210, 112, 0.7, `<path d="M-16,0 H16 L12,5 H-12 Z" ${SOLID}/><path d="M0,0 V-20" stroke-width="1.4"/>`)}<path d="${waves(10, 118, 5, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	SA: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V30 Q30,20 60,32 Q90,26 110,40 V132 Z M270,132 V30 Q240,20 200,34 Q180,30 160,40 V132 Z" ${L3} stroke-width="1.8"/><path d="M20,40 Q16,80 20,120 M50,36 Q54,80 50,120 M220,34 Q224,80 220,120 M250,30 Q246,80 250,120" stroke-width="1"/>
<path d="M110,100 V52 H160 V100 Z" fill="var(--stp)" stroke-width="1.6"/><path d="M110,52 L160,100 M120,52 L160,90" stroke="currentColor" stroke-opacity=".3" stroke-width="4"/><path d="M0,104 Q135,96 270,106 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(200, 120, 0.7, CAMEL)}`,
	AE: () => `${sun(236, 22, 9)}${birds(100, 20)}${at(70, 92, 1, khalifa(88))}${[[40, 36], [54, 50], [90, 44], [104, 58], [120, 40], [136, 30]].map(([x, h], i) => `<path d="M${x - 6},92 V${92 - h} H${x + 6} V92" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}
<path d="M0,92 H270" stroke-width="1.6"/><path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/>${at(210, 102, 1, BURJARAB)}<path d="M200,102 Q190,110 170,112" stroke-width="2"/><path d="${waves(10, 112, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	QA: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[110, 70], [126, 52], [142, 80], [160, 60], [176, 46], [192, 64]].map(([x, h], i) => `<path d="M${x - 7},92 V${92 - h + 8} Q${x},${92 - h} ${x + 7},${92 - h + 8} V92" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}<path d="M0,92 H270" stroke-width="1.6"/>
<path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/>${[[40, 112, 1], [80, 118, 0.8], [230, 114, 0.9]].map(([x, y, s]) => at(x, y, s, `<path d="M-20,-6 Q0,6 22,-8 L18,0 Q0,6 -16,0 Z" ${SOLID}/><path d="M0,-4 V-30" stroke-width="1.4"/><path d="M-16,-26 Q4,-34 16,-8 L0,-6 Z" ${SNOW} stroke-width="1.2"/>`)).join('')}<path d="${waves(120, 122, 6, 14, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	OM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H70 Q84,40 80,132 H0 Z M270,0 H190 Q178,50 186,132 H270 Z" ${L3} stroke-width="2"/><path d="M14,20 L18,120 M40,10 L44,120 M220,20 L216,120 M248,10 L246,120" stroke-width="1" stroke-dasharray="6 3"/>
<path d="M80,104 Q100,96 130,102 Q160,96 186,104 V132 H80 Z" ${L1} stroke-width="1.6"/><path d="M90,116 Q130,108 176,118" stroke="var(--stp)" stroke-width="3"/>${palm(100, 104, 34, 4)}${palm(120, 104, 26, -3)}${palm(170, 104, 30, -4)}${at(150, 102, 0.6, PERSON)}`,
	BH: () => `${sun(236, 22, 9)}${birds(60, 20)}${at(120, 92, 1, BWTC)}${[[40, 40], [60, 54], [80, 34], [170, 46], [190, 60], [210, 38]].map(([x, h], i) => `<path d="M${x - 7},92 V${92 - h} H${x + 7} V92" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}<path d="M0,92 H270" stroke-width="1.6"/>
<path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/>${at(220, 116, 0.9, `<path d="M-30,-6 Q0,8 34,-10 L28,2 Q0,8 -24,2 Z" ${SOLID}/><path d="M0,-4 V-34" stroke-width="1.6"/><path d="M-18,-30 Q6,-40 18,-10 L0,-8 Z" ${SNOW} stroke-width="1.3"/>`)}<path d="${waves(10, 116, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	KW: () => `${sun(236, 22, 9)}${birds(140, 20)}${at(100, 94, 0.9, `<path d="M0,0 V-92 M24,0 V-66 M44,0 V-36" stroke-width="3"/><circle cx="0" cy="-48" r="13" ${SOLID}/><circle cx="0" cy="-74" r="7" ${SOLID}/><circle cx="24" cy="-36" r="11" ${SOLID}/>`)}${at(200, 94, 0.6, LIBTOWER)}<path d="M0,94 H270" stroke-width="1.8"/>
<path d="M0,94 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,100 H270" stroke="var(--stp)" stroke-width="2"/><path d="${waves(10, 118, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${palm(20, 96, 24, 3)}${palm(250, 96, 22, -3)}`,
	PS: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q60,50 130,62 Q200,48 270,70 V132 H0 Z" ${L1} stroke-width="1.6"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${90 + i * 13},${66 - (i % 3) * 4} v-12 h12 v12" ${[SNOW, L2][i % 2]} stroke-width="1"/>`).join('')}${at(140, 50, 0.6, `<path d="M-8,0 Q-8,-14 0,-14 Q8,-14 8,0 Z" ${SNOW} stroke-width="1.2"/>`)}
<path d="M0,96 Q135,86 270,98 V132 H0 Z" ${L2} stroke-width="1.6"/>${[[20, 104], [50, 110], [80, 104], [190, 106], [220, 112], [250, 104], [120, 116], [160, 118]].map(([x, y]) => at(x, y, 0.5, OLIVETREE)).join('')}`,
	IQ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,90 H270" stroke-width="1.6"/>${Array.from({ length: 30 }, (_, i) => `<path d="M${4 + i * 9},${90 + (i % 3)} V${70 + (i * 7) % 12}" stroke-width="1.2"/>`).join('')}
${at(130, 92, 1.1, MUDHIF)}<path d="M60,112 Q90,118 120,112 L116,108 H64 Z" ${SOLID}/><path d="M90,112 L100,94" stroke-width="1.4"/>${at(84, 112, 0.6, PERSON)}<path d="${waves(150, 116, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>${palm(220, 92, 34, -4)}${palm(240, 92, 28, 3)}`,
	IR: () => `${sun(236, 22, 9)}${birds(60, 20)}<path d="M0,70 L40,40 L80,56 L130,30 L180,52 L220,36 L270,56 V90 H0 Z" ${L1} stroke-width="1.6"/>${siosepol(10, 84, 250, 16)}<path d="M0,110 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 122, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	SY: () => `${sun(236, 22, 9)}${birds(60, 20)}<path d="M0,132 V100 Q60,62 135,58 Q210,62 270,100 V132 Z" ${L2} stroke-width="1.8"/>${at(135, 62, 1, KRAK)}<path d="M0,116 Q135,106 270,118 V132 H0 Z" ${L1} stroke-width="1.6"/>${[[20, 116, 18], [40, 118, 14], [230, 118, 16], [250, 116, 20]].map(([x, y, h]) => cypress(x, y, h)).join('')}`,
	YE: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,74 Q60,50 130,58 Q200,46 270,70 V96 H0 Z" ${L2} stroke-width="1.6"/>${[[40, 100, 1.1], [90, 96, 0.8], [180, 100, 1.2], [230, 96, 0.9], [134, 92, 0.6]].map(([x, y, s]) => at(x, y, s, DRAGONTREE)).join('')}
<path d="M0,96 Q135,88 270,98 V132 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,116 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 124, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	KZ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 L40,40 L80,56 L130,26 L180,52 L220,36 L270,56 V90 H0 Z" ${L1} stroke-width="1.6"/><path d="M130,26 L124,36 L131,33 L136,38 Z M40,40 L35,48 L41,46 L44,50 Z" ${SNOW} stroke-width="1"/>
<path d="M0,90 Q135,82 270,92 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(200, 98, 1, YURT)}${at(234, 100, 0.8, YURT)}${at(80, 116, 1.2, EAGLEHUNTER)}${grass(30, 120)}${grass(150, 124)}`,
	UZ: () => `${sun(236, 22, 9)}${birds(140, 20)}${at(60, 106, 1, madrasa())}${at(135, 106, 1.2, madrasa())}${at(210, 106, 1, madrasa())}<path d="M0,106 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,106 H270" stroke-width="2"/>${at(30, 124, 0.5, PERSON)}${at(240, 126, 0.5, PERSON)}`,
	PK: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,90 L50,40 L80,56 L130,10 L170,50 L210,30 L270,64 V100 H0 Z" ${L1} stroke-width="1.6"/><path d="M130,10 L120,26 L131,22 L138,30 Z M210,30 L203,40 L211,37 L216,42 Z M50,40 L44,50 L51,47 L55,52 Z" ${SNOW} stroke-width="1"/>
<path d="M0,100 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,100 H270" stroke-width="1.6"/><g opacity=".3" transform="translate(0,200) scale(1,-1)"><path d="M0,90 L50,40 L80,56 L130,10 L170,50 L210,30 L270,64 V100 H0 Z" ${L3} stroke="none"/></g><path d="${waves(30, 120, 8, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	IN: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[20, 96, 60], [44, 96, 46], [220, 96, 56], [246, 96, 64], [70, 96, 38]].map(([x, y, h], i) => palm(x, y, h, i % 2 ? -8 : 8)).join('')}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.8"/>
${at(150, 112, 1.3, HOUSEBOAT)}<g opacity=".3" transform="translate(0,224) scale(1,-1)">${at(150, 112, 1.3, HOUSEBOAT)}</g><path d="${waves(20, 124, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>${at(90, 118, 0.7, `<path d="M-12,0 Q0,4 12,0 L10,-3 H-10 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)}`,
	NP: () => `${sun(236, 22, 9)}${alps(78, 270, L1)}<path d="M0,96 Q60,80 135,88 Q210,80 270,92 V132 H0 Z" ${L2} stroke-width="1.8"/><path d="M20,128 Q60,110 100,112 Q160,114 200,100 Q230,92 260,94" stroke="var(--stp)" stroke-width="3"/><path d="M20,128 Q60,110 100,112 Q160,114 200,100 Q230,92 260,94" stroke-width="1" stroke-dasharray="3 3"/>
${at(80, 116, 0.9, YAK)}${at(120, 116, 0.75, YAK)}${at(156, 112, 0.6, YAK)}${flags(0, 60, 60, 70)}${at(60, 112, 0.6, PERSON)}`,
	BD: () => `${sun(236, 22, 9)}${birds(60, 20)}<path d="M0,82 Q135,74 270,84" stroke-width="1.6"/>${[20, 50, 210, 250].map((x) => palm(x, 82, 30, x > 135 ? -5 : 5)).join('')}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/>
${[[80, 110, 1.1], [150, 104, 0.8], [210, 116, 1]].map(([x, y, s]) => at(x, y, s, `<path d="M-24,0 Q0,6 24,0 L20,-4 H-20 Z" ${SOLID}/><path d="M0,-4 V-40" stroke-width="1.4"/><path d="M-16,-36 H16 L18,-8 H-18 Z" ${SNOW} stroke-width="1.1"/><path d="M-16,-26 H17 M-17,-17 H18" stroke-width=".9"/>`)).join('')}<path d="${waves(10, 124, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	LK: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V60 Q40,40 80,56 Q100,62 110,80 V132 Z M270,132 V50 Q230,36 190,52 Q170,60 160,80 V132 Z" ${L2} stroke-width="1.8"/>${tea(4, 76, 100, 7)}${tea(170, 70, 100, 8)}
${ninearch(60, 80, 150)}${at(90, 80, 0.9, train(4))}<path d="M60,122 Q135,110 210,122" ${L1} stroke-width="1.4"/>`,
	MV: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/>${[[50, 84, 70, 22], [150, 96, 50, 16], [220, 80, 60, 20], [100, 112, 40, 12]].map(([x, y, w, h]) => `<ellipse cx="${x}" cy="${y}" rx="${w / 2 + 10}" ry="${h / 2 + 6}" ${SNOW} stroke-width="1" stroke-dasharray="3 2"/><ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" ${L3} stroke-width="1.2"/>${palm(x - 6, y, h * 1.4, 4)}${palm(x + 8, y, h * 1.1, -4)}`).join('')}
${at(150, 50, 1.2, SEAPLANE)}<path d="M120,46 h-20 M118,52 h-14" stroke-width="1" stroke-dasharray="3 3"/>`,
	TM: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[30, 60], [60, 44], [90, 70], [180, 56], [210, 76], [240, 50]].map(([x, h], i) => `<path d="M${x - 8},100 V${100 - h} H${x + 8} V100" ${SNOW} stroke-width="1.2"/><path d="M${x - 9},${100 - h} Q${x},${92 - h - 8} ${x + 9},${100 - h} Z" ${[L3, SOLID][i % 2]}/>${Array.from({ length: Math.floor(h / 10) }, (_, k) => `<path d="M${x - 5},${94 - k * 10} h10" stroke-width=".8"/>`).join('')}`).join('')}
<path d="M135,100 L131,24 H139 Z" ${SNOW} stroke-width="1.3"/><path d="M128,24 Q135,12 142,24 Z" ${L3} stroke-width="1.1"/><path d="M120,100 L135,70 L150,100" stroke-width="1.6"/><path d="M0,100 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,100 H270" stroke-width="2"/><path d="M20,116 H250" stroke-width="1" stroke-dasharray="4 4"/>`,
	AF: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 V40 L30,30 L70,34 L100,48 L110,96 Z M270,96 V36 L240,28 L200,34 L170,46 L160,96 Z" ${L3} stroke-width="1.8"/><path d="M20,40 V90 M50,34 V90 M80,40 V90 M250,36 V90 M220,32 V90 M190,40 V90" stroke-width="1" stroke-dasharray="6 3"/>
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M110,96 H160" stroke-width="1.6"/><path d="M30,106 Q100,98 160,106 Q220,98 260,108" stroke="var(--stp)" stroke-width="3"/><path d="${waves(20, 122, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	TJ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,66 L30,26 L60,46 L100,14 L140,40 L180,20 L220,44 L270,30 V90 H0 Z" ${L1} stroke-width="1.6"/><path d="M100,14 L92,26 L101,23 L106,29 Z M180,20 L173,30 L181,27 L186,32 Z" ${SNOW} stroke-width="1"/>
<path d="M0,90 Q135,80 270,92 V132 H0 Z" ${L2} stroke-width="1.6"/><path d="M0,104 Q100,94 270,112" stroke="var(--stp)" stroke-width="3"/><path d="M0,104 Q100,94 270,112" stroke-width="1"/><path d="M0,120 Q130,110 270,124" stroke-width="2" stroke-dasharray="6 4"/>${at(160, 120, 0.8, `<rect x="-14" y="-12" width="20" height="12" rx="2" ${SOLID}/><path d="M6,-8 H14 V0 H6 Z" ${L3} stroke-width="1"/><circle cx="-8" cy="0" r="2.4" ${SOLID}/><circle cx="8" cy="0" r="2.4" ${SOLID}/>`)}`,
	KG: () => `${sun(236, 22, 9)}${birds(140, 20)}${alps(80, 270, L1)}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,84 H270" stroke-width="1.6"/><g opacity=".3" transform="translate(0,168) scale(1,-1)">${alps(84, 270, L3)}</g>
<path d="M0,116 Q135,106 270,118 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(60, 118, 0.8, YURT)}${at(90, 120, 0.7, YURT)}${at(200, 124, 0.7, horse(RIDER))}<path d="${waves(120, 100, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	MN: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q40,50 90,62 Q140,40 190,58 Q230,46 270,60 V132 H0 Z" ${SNOW} stroke-width="1.6"/><path d="M0,100 Q60,80 120,94 Q180,78 270,96 V132 H0 Z" ${L1} stroke-width="1.6"/>
<path d="M90,62 Q110,76 100,100 M190,58 Q206,74 196,96" stroke-width="1" stroke-dasharray="3 3"/>${at(60, 118, 1.1, BACTRIAN)}${at(110, 116, 0.9, BACTRIAN)}${at(150, 114, 0.75, BACTRIAN)}${at(40, 118, 0.7, PERSON)}`,
	BT: () => `${sun(236, 22, 9)}${alps(70, 270, L1)}<path d="M0,90 Q135,70 270,94 V132 H0 Z" ${L2} stroke-width="1.8"/>${Array.from({ length: 9 }, (_, i) => at(60 + i * 18, 96 - Math.round(10 * Math.sin((i / 8) * Math.PI)), 0.9, CHORTEN)).join('')}${flags(20, 40, 100, 50, 10)}${flags(170, 46, 260, 38, 10)}
<path d="M0,112 Q135,104 270,114 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(40, 124, 0.9, TAKIN)}${[[230, 112, 22], [250, 114, 28]].map(([x, y, h]) => pine(x, y, h)).join('')}`,
	CN: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[20, 96, 60, 18], [56, 96, 44, 14], [90, 96, 70, 20], [130, 96, 50, 16], [170, 96, 64, 18], [210, 96, 46, 14], [246, 96, 58, 18]].map(([x, y, h, w], i) => karst(x, y, h, w, [L1, L2][i % 2])).join('')}
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/><g opacity=".3" transform="translate(0,192) scale(1,-1)">${[[20, 96, 60, 18], [90, 96, 70, 20], [170, 96, 64, 18], [246, 96, 58, 18]].map(([x, y, h, w]) => karst(x, y, h, w, L3)).join('')}</g>${at(110, 118, 1.1, RAFT)}<path d="${waves(150, 124, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	KR: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[110, 40], [126, 56], [142, 34], [158, 64], [174, 44], [190, 52], [206, 38]].map(([x, h], i) => `<path d="M${x - 7},92 V${92 - h} H${x + 7} V92" ${[L1, L2][i % 2]} stroke-width="1.1"/>`).join('')}<path d="M40,92 Q60,60 80,58 Q96,60 104,92" ${L2} stroke-width="1.4"/>${at(76, 60, 0.7, NSEOUL)}
${hanok(10, 120, 40)}${hanok(66, 124, 46)}${hanok(130, 120, 40)}${hanok(190, 126, 50)}<path d="M0,92 H270" stroke-width="1" stroke-dasharray="4 4"/>${pine(250, 128, 24)}`,
	TW: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V70 Q60,40 140,50 Q210,40 270,80 V132 Z" ${L2} stroke-width="1.8"/>${Array.from({ length: 12 }, (_, i) => {
		const x = 20 + i * 20,
			y = 110 - Math.round(30 * Math.sin((i / 11) * Math.PI));
		return `<path d="M${x - 8},${y} V${y - 12} H${x + 8} V${y}" ${[SNOW, L1][i % 2]} stroke-width="1"/><path d="M${x - 10},${y - 12} Q${x},${y - 18} ${x + 10},${y - 12} Z" ${SOLID}/>${lantern(x, y - 4, 0.5, L3)}`;
	}).join('')}<path d="M0,126 Q135,118 270,128 V132 H0 Z" ${L1} stroke-width="1.2"/>`,
	HK: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,74 Q50,40 120,52 Q190,40 270,70 V96 H0 Z" ${L1} stroke-width="1.6"/>${[[20, 40], [36, 60], [52, 34], [70, 70], [88, 48], [106, 82], [124, 54], [142, 66], [160, 42], [178, 58], [196, 36], [214, 50]].map(([x, h], i) => `<path d="M${x - 7},96 V${96 - h} H${x + 7} V96" ${[L2, SNOW, L3][i % 3]} stroke-width="1"/>`).join('')}
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/>${at(80, 116, 1, `<path d="M-24,0 H24 L20,5 H-20 Z" ${SOLID}/><path d="M-18,0 V-8 H18 V0" ${SNOW} stroke-width="1.2"/><path d="M-14,-8 V-12 H14 V-8" ${L3} stroke-width="1"/>`)}${at(200, 120, 0.9, JUNK)}<path d="${waves(120, 124, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	MO: () => `${sun(236, 22, 9)}${birds(140, 20)}${at(70, 96, 1, MACAUTW)}${at(160, 96, 1, `<path d="M-14,0 V-30 Q-14,-60 0,-74 Q14,-60 14,-30 V0 Z" ${L3} stroke-width="1.4"/><path d="M-10,-30 Q0,-36 10,-30 M-10,-44 Q0,-50 10,-44" stroke="var(--stp)" stroke-width="1.2"/><path d="M-24,0 V-14 Q0,-26 24,-14 V0 Z" ${SNOW} stroke-width="1.3"/>`)}${[[20, 40], [36, 30], [110, 44], [200, 36], [220, 50], [244, 34]].map(([x, h], i) => `<path d="M${x - 7},96 V${96 - h} H${x + 7} V96" ${[L1, L2][i % 2]} stroke-width="1.1"/>`).join('')}
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.8"/><path d="M0,104 H270" stroke="var(--stp)" stroke-width="2"/><path d="${waves(10, 120, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	TH: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[20, 80, 50], [50, 80, 40], [230, 80, 46], [256, 80, 56]].map(([x, y, h], i) => palm(x, y, h, i % 2 ? -6 : 6)).join('')}<path d="M0,80 H270" stroke-width="1.6"/><path d="M70,80 V60 H200 V80" ${L2} stroke-width="1.2"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${74 + i * 14},60 L${81 + i * 14},52 L${88 + i * 14},60" ${SOLID}/>`).join('')}
<path d="M0,80 H270 V132 H0 Z" ${L2} stroke="none"/>${[[50, 100, 1], [110, 108, 0.9], [170, 102, 1.1], [220, 116, 0.9], [80, 122, 0.8]].map(([x, y, s]) => at(x, y, s, MARKETBOAT)).join('')}`,
	KH: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 Q135,76 270,86" stroke-width="1.4"/>${[30, 60, 92, 124, 160, 196, 230].map((x, i) => at(x, 96 - (i % 2) * 2, 0.95, STILT)).join('')}
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/>${[[80, 116, 1], [200, 120, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-16,0 Q0,5 16,0 L14,-3 H-14 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)).join('')}<path d="${waves(120, 124, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	VN: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[20, 96, 50, 14], [54, 96, 70, 16], [90, 96, 40, 12], [190, 96, 60, 16], [226, 96, 74, 18], [256, 96, 44, 12], [140, 96, 30, 10]].map(([x, y, h, w], i) => karst(x, y, h, w, [L2, L1][i % 2])).join('')}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/>
${at(110, 120, 1, JUNK)}${at(170, 114, 0.7, JUNK)}<path d="${waves(10, 120, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	MY: () => `${sun(236, 22, 9)}${birds(60, 20)}${at(130, 100, 1, petronas(86))}${at(200, 100, 1, `<path d="M-2,0 V-60 H2 V0" ${L3} stroke-width="1"/><path d="M-7,-60 Q0,-70 7,-60 Z" ${SNOW} stroke-width="1.2"/><path d="M0,-66 V-84" stroke-width="1.4"/>`)}${[[30, 40], [50, 56], [70, 34], [90, 48], [170, 44], [230, 50], [250, 36]].map(([x, h], i) => `<path d="M${x - 7},100 V${100 - h} H${x + 7} V100" ${[L1, L2][i % 2]} stroke-width="1.1"/>`).join('')}
<path d="M0,100 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,100 H270" stroke-width="2"/>${[[20, 116, 18], [50, 120, 22], [220, 118, 20], [250, 122, 26]].map(([x, y, h]) => palm(x, y + 10, h, 4)).join('')}`,
	SG: () => `${sun(236, 22, 9)}${birds(140, 20)}${at(80, 96, 1.2, MBS)}${[[150, 70], [166, 54], [182, 80], [198, 62], [214, 46], [230, 66]].map(([x, h], i) => `<path d="M${x - 7},96 V${96 - h} H${x + 7} V96" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}${at(260, 96, 0.6, MERLION)}
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/><g opacity=".3" transform="translate(0,192) scale(1,-1)">${at(80, 96, 1.2, MBS)}</g><path d="${waves(140, 116, 7, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	ID: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,60 L40,30 L80,46 L130,20 L180,44 L220,30 L270,50 V80 H0 Z" ${L1} stroke-width="1.6"/>${riceterr(80, 6, 270)}<path d="M0,80 V132 H270 V80" stroke="none"/>${at(200, 82, 0.9, `<path d="M-14,0 V-10 H14 V0 Z" ${L3} stroke-width="1.1"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${-14 + i * 2},${-10 - i * 6} H${14 - i * 2} L${12 - i * 2},${-16 - i * 6} H${-12 + i * 2} Z" ${SOLID}/>`).join('')}`)}${palm(30, 90, 34, 5)}${palm(250, 92, 30, -5)}${at(120, 116, 0.8, PERSON)}`,
	PH: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,100 Q135,86 270,102 V132 H0 Z" ${L1} stroke-width="1.6"/>${chocohills(96)}<path d="M0,124 Q135,116 270,126 V132 H0 Z" ${L2} stroke-width="1.4"/>`,
	BN: () => `${sun(236, 22, 9)}${birds(140, 20)}${at(130, 92, 1.1, `<path d="M-40,0 V-16 H40 V0 Z" ${SNOW} stroke-width="1.3"/><path d="M-14,-16 Q-14,-40 0,-44 Q14,-40 14,-16 Z" ${L3} stroke-width="1.4"/><path d="M0,-44 V-50" stroke-width="1.2"/>${[-34, 34].map((x) => `<path d="M${x - 3},-16 V-50 H${x + 3} V-16" ${SNOW} stroke-width="1"/><path d="M${x - 4},-50 Q${x},-56 ${x + 4},-50 Z" ${L3}/>`).join('')}`)}<path d="M0,92 H270" stroke-width="1.6"/><path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/><g opacity=".3" transform="translate(0,184) scale(1,-1)"><path d="M90,92 V76 H170 V92 Z M116,76 Q130,48 144,76 Z" ${L4} stroke="none"/></g>
${at(200, 116, 1, `<path d="M-34,0 Q0,8 34,-6 L40,-14 L30,-6 H-30 L-38,-12 Z" ${SOLID}/><path d="M-14,-6 V-16 H14 V-6" ${L3} stroke-width="1.2"/><path d="M-18,-16 H18 L14,-22 H-14 Z" ${SOLID}/>`)}`,
	KP: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V40 L20,30 L30,50 L40,26 L56,46 L70,132 Z M270,132 V36 L250,24 L236,44 L224,30 L210,50 L196,132 Z" ${L3} stroke-width="1.8"/>${cascades(80, 40, 30, 1)}<path d="M70,132 Q120,60 196,132" ${L2} stroke-width="1.6"/><path d="M90,46 V112 M100,46 V114" stroke="var(--stp)" stroke-width="3"/>
<path d="M70,116 Q130,108 196,118 V132 H70 Z" ${L1} stroke-width="1.4"/>${at(150, 110, 1, STONEPINE)}${at(230, 50, 0.6, STONEPINE)}`,
	MM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,74 Q60,52 130,62 Q200,50 270,70 V90 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,90 H270" stroke-width="1.6"/>${[30, 50, 220, 244].map((x, i) => at(x, 92, 0.9, STILT)).join('')}
${at(110, 118, 1.3, INLE)}${at(180, 116, 0.9, INLE)}<path d="${waves(10, 124, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	LA: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[20, 96, 56, 14], [50, 96, 40, 12], [210, 96, 60, 16], [244, 96, 46, 14], [120, 96, 30, 10]].map(([x, y, h, w], i) => karst(x, y, h, w, [L2, L1][i % 2])).join('')}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/>
${at(130, 116, 1.3, LONGBOAT)}<path d="${waves(10, 120, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>${palm(80, 98, 30, 4)}${palm(180, 98, 26, -4)}`,
	TL: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 L40,40 L80,60 L130,30 L180,56 L220,40 L270,64 V96 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 Q135,86 270,98" ${SNOW} stroke-width="1.4"/>
${[[60, 112, 1], [130, 118, 0.85], [200, 114, 0.95]].map(([x, y, s]) => at(x, y, s, `<path d="M-18,0 Q0,5 18,0 L16,-3 H-16 Z" ${SOLID}/><path d="M-12,4 H12 M-8,0 V6 M8,0 V6" stroke-width="1.2"/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)).join('')}${palm(20, 98, 30, 4)}${palm(250, 98, 26, -4)}`,
	PG: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 Q30,40 70,52 Q110,30 150,48 Q200,30 270,56 V96 H0 Z" ${L2} stroke-width="1.6"/>${[[20, 70], [60, 56], [110, 48], [160, 52], [210, 46], [250, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L3} stroke="none"/>`).join('')}
<path d="M0,96 Q100,84 270,100 V132 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,110 Q90,100 160,112 Q220,122 270,108 V132 H0 Z" ${L2} stroke-width="1.4"/>${at(110, 118, 1, `<path d="M-26,0 Q0,4 26,-2 L22,-5 H-22 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(-8,-2)"')}`)}<path d="${waves(170, 124, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	MA: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 Q40,70 90,82 Q140,64 190,80 Q230,70 270,84 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${at(80, 86, 1, KASBAH)}<path d="M0,110 Q60,98 130,108 Q200,98 270,112 V132 H0 Z" ${L1} stroke-width="1.6"/>
${at(160, 124, 0.8, CAMEL_RIDER)}${at(194, 122, 0.7, CAMEL)}${at(224, 120, 0.6, CAMEL)}${palm(20, 96, 34, 4)}${palm(140, 96, 26, -3)}`,
	DZ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,100 Q40,40 120,40 Q160,42 180,70 L200,100 Z" ${L1} stroke-width="1.6"/>${Array.from({ length: 30 }, (_, i) => {
		const r = (i / 6) | 0,
			c = i % 6,
			x = 30 + c * 22 + r * 6,
			y = 96 - r * 12 - (c > 1 && c < 5 ? 4 : 0);
		return `<path d="M${x},${y} V${y - 10} H${x + 16} V${y}" ${SNOW} stroke-width="1"/><rect x="${x + 6}" y="${y - 7}" width="3" height="3" ${SOLID}/>`;
	}).join('')}<path d="M0,100 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,100 H270" stroke-width="1.6"/><path d="${waves(30, 118, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	TN: () => `${sun(236, 22, 9)}${birds(60, 20)}<path d="M0,86 Q30,50 80,46 Q130,44 160,76 L180,92 Z" ${L1} stroke-width="1.6"/>${[[6, 92, 24, 18], [32, 86, 22, 22], [56, 80, 26, 18], [84, 74, 22, 22], [108, 78, 24, 18], [134, 84, 22, 20], [26, 100, 22, 14], [70, 96, 26, 16], [120, 100, 24, 14]].map(([x, y, w, h]) => sidi(x, y, w, h)).join('')}<path d="M86,48 Q86,40 92,40 Q98,40 98,48 Z" ${SOLID}/>
<path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,92 H270" stroke-width="1.6"/><path d="${waves(10, 112, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(210, 120, 0.9, SAIL)}`,
	EH: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 Q30,60 80,68 Q120,54 150,96 Z" ${SNOW} stroke-width="1.6"/><path d="M0,96 Q20,78 50,82" stroke-width="1" stroke-dasharray="3 3"/><path d="M150,96 H270 V132 H140 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/><path d="${waves(160, 112, 6, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>
${[[60, 108, 1], [100, 112, 0.9]].map(([x, y, s]) => at(x, y, s, `<path d="M-24,0 Q0,6 24,-4 L28,-10 L20,-4 H-20 L-26,-10 Z" ${SOLID}/>`)).join('')}<path d="M0,96 V132 H140 L150,96" ${SNOW} stroke="none"/>`,
	SN: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M60,96 Q70,74 120,72 Q170,74 190,96 Z" ${L3} stroke-width="1.6"/>${nyhavn(74, 96, 7, 15)}${at(120, 72, 0.6, `<path d="M-10,0 V-14 H10 V0 Z" ${SNOW} stroke-width="1"/>`)}
<path d="M0,96 H60 M190,96 H270" stroke-width="1.6"/>${at(40, 116, 0.9, `<path d="M-24,0 Q0,6 24,-4 L28,-10 L20,-4 H-20 L-26,-10 Z" ${SOLID}/>`)}${at(230, 118, 0.8, `<path d="M-24,0 Q0,6 24,-4 L28,-10 L20,-4 H-20 L-26,-10 Z" ${SOLID}/>`)}<path d="${waves(70, 120, 7, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	CI: () => `${sun(236, 22, 9)}${birds(140, 20)}${palm(20, 90, 50, 6)}${palm(250, 90, 46, -6)}${[[60, 1], [100, 0], [140, 1], [180, 0]].map(([x, d]) => `<path d="M${x},90 V60 H${x + 34} V90" ${SNOW} stroke-width="1.2"/><path d="M${x - 2},60 H${x + 36} L${x + 30},52 H${x + 4} Z" ${d ? SOLID : L3}/><path d="M${x},74 H${x + 34}" stroke-width="1.4"/>${[4, 14, 24].map((d2) => `<path d="M${x + d2},88 V78 h6 V88 M${x + d2},70 V64 h6 V70" ${SOLID}/>`).join('')}`).join('')}
<path d="M0,90 H270" stroke-width="1.6"/><path d="M0,90 Q135,96 270,90 V104 H0 Z" ${SNOW} stroke-width="1.2"/><path d="M0,104 H270 V132 H0 Z" ${L2} stroke="none"/><path d="${waves(10, 118, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	GH: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M150,92 V56 H240 V92" ${SNOW} stroke-width="1.4"/>${rtower(160, 56, 14, 14, SNOW)}${rtower(230, 56, 14, 18, SNOW)}<path d="M180,56 V44 H210 V56" ${SNOW} stroke-width="1.2"/><path d="M150,56 l3,-4 l3,4 l3,-4 l3,4 M210,56 l3,-4 l3,4 l3,-4 l3,4" stroke-width="1"/>
<path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,92 H270" stroke-width="1.6"/>${[[30, 104, 1], [70, 110, 0.9], [110, 104, 1], [60, 124, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-24,0 Q0,6 24,-4 L28,-10 L20,-4 H-20 L-26,-10 Z" ${SOLID}/><path d="M-20,-2 H18" stroke="var(--stp)" stroke-width="1.6" stroke-dasharray="4 3"/><path d="M0,-4 V-14" stroke-width="1"/>`)).join('')}<path d="${waves(140, 116, 7, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	TG: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q60,70 135,76 Q210,70 270,82" stroke-width="1.4"/>${[20, 40, 210, 240, 260].map((x, i) => palm(x, 80, 26 + (i % 2) * 8, i % 2 ? -4 : 4)).join('')}<path d="M0,82 H270 V132 H0 Z" ${L2} stroke="none"/>
${[[70, 104, 1], [130, 112, 0.9], [190, 106, 1]].map(([x, y, s]) => at(x, y, s, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(6,-2)"')}<path d="M10,-6 L22,10" stroke-width="1.2"/>`)).join('')}<path d="${waves(10, 120, 9, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	BJ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,84 H270" stroke-width="1.4"/>${[[20, 1], [56, 0.9], [94, 1], [130, 0.85], [170, 1], [210, 0.9], [246, 1]].map(([x, s]) => `<g transform="translate(${x},${84}) scale(${s})"><path d="M-11,-22 L0,-32 L11,-22 Z" ${SOLID}/><path d="M-8,-22 V-10 H8 V-22" ${L3} stroke-width="1.2"/><path d="M-7,-10 V4 M0,-10 V4 M7,-10 V4" stroke-width="1.6"/></g>`).join('')}
${[[70, 112, 1], [150, 118, 0.9], [220, 110, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)).join('')}<path d="${waves(10, 124, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	NG: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V70 Q60,40 135,46 Q210,40 270,70 V132 Z" ${L1} stroke-width="1.8"/><path d="M0,90 Q135,60 270,90" stroke-width="1"/><path d="M20,100 L250,50" stroke-width="1.2"/>${[0.25, 0.55, 0.8].map((t) => at(f1(20 + 230 * t), f1(100 - 50 * t + 2), 1, GONDOLA)).join('')}
<path d="M0,110 Q135,96 270,112 V132 H0 Z" ${L2} stroke-width="1.6"/>${[[60, 116, 0.8], [90, 120, 0.7], [190, 118, 0.8]].map(([x, y, s]) => at(x, y, s, COW)).join('')}${[[30, 104, 16], [240, 104, 18]].map(([x, y, h]) => pine(x, y, h)).join('')}`,
	CV: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,90 Q40,40 100,46 Q140,50 150,90 Z" ${L2} stroke-width="1.6"/>${nyhavn(20, 92, 8, 14)}<path d="M0,92 H270" stroke-width="1.6"/><path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/>
${[[180, 114, 1], [230, 108, 0.8]].map(([x, y, s]) => at(x, y, s, SAIL)).join('')}<path d="M150,92 H190 L188,96 H152 Z" ${SOLID}/><path d="${waves(10, 116, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${at(160, 92, 0.7, LIGHTHOUSE)}`,
	BW: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q135,70 270,82" stroke-width="1.4"/>${[[20, 82, 30], [240, 82, 34]].map(([x, y, h]) => palm(x, y, h, 4)).join('')}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/>${[[40, 96], [90, 100], [180, 94], [230, 102]].map(([x, y]) => `<path d="M${x - 14},${y} q7,-6 14,0 q7,-6 14,0" stroke-width="1.2"/>`).join('')}
${at(70, 112, 1, ELEPHANT)}${at(110, 114, 0.9, ELEPHANT)}${at(150, 112, 0.7, ELEPHANT)}${at(210, 124, 1, MOKORO)}<path d="${waves(10, 126, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	CD: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,74 Q30,60 60,70 Q90,56 120,68 Q160,54 200,70 Q240,58 270,70 V90 H0 Z" ${L3} stroke-width="1.6"/>${[[20, 70], [60, 64], [110, 62], [160, 60], [210, 64], [250, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" ${L2} stroke="none"/>`).join('')}
<path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,90 H270" stroke-width="1.6"/>${at(130, 112, 1.3, BARGE)}<path d="${waves(10, 124, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>${at(230, 118, 0.8, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)}`,
	CM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,60 Q40,50 80,60 L90,96 H0 Z" ${L3} stroke-width="1.6"/>${[[20, 50], [50, 44], [76, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" ${L2} stroke="none"/>`).join('')}${cascades(64, 64, 60, 3)}${cascades(80, 84, 80, 4)}
<path d="M0,106 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M150,96 H270" stroke-width="1.4"/><path d="M150,96 H270 V106 H150 Z" ${L1} stroke="none"/><path d="${waves(160, 116, 6, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>${palm(240, 96, 30, -4)}`,
	LS: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 L40,40 L80,60 L130,24 L180,56 L220,36 L270,60 V100 H0 Z" ${L2} stroke-width="1.8"/><path d="M130,24 L122,36 L131,33 L136,38 Z M40,40 L34,50 L41,47 L45,52 Z" ${SNOW} stroke-width="1"/>
<path d="M0,100 Q135,90 270,102 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(70, 120, 1, BASOTHO)}${at(120, 122, 0.85, BASOTHO)}${at(166, 120, 0.7, BASOTHO)}${[[220, 108], [240, 112]].map(([x, y]) => at(x, y, 1, RONDAVEL)).join('')}`,
	MG: () => `${sun(135, 70, 22)}${rays(135, 70, 22, 18)}${birds(220, 20)}<path d="M0,104 Q135,96 270,106 V132 H0 Z" ${L2} stroke-width="1.6"/><path d="M100,132 L130,104 H140 L170,132 Z" ${L1} stroke="none"/>${[[40, 106, 1.2], [80, 104, 0.9], [110, 102, 0.6], [160, 102, 0.6], [190, 104, 0.9], [230, 106, 1.2]].map(([x, y, s]) => at(x, y, s, BAOBAB)).join('')}${at(140, 120, 0.5, `<rect x="-8" y="-8" width="16" height="8" ${SOLID}/><path d="M-6,0 h12" stroke-width="2"/>`)}`,
	MU: () => `${sun(236, 22, 9)}${birds(140, 20)}<g transform="translate(150,0)">${LEMORNE(96, 60, 1)}</g><path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/><path d="M20,106 Q100,100 180,108" stroke="var(--stp)" stroke-width="3"/>
${at(80, 120, 1.1, CATAMARAN)}<path d="M0,96 Q20,84 50,86 L60,96 Z" ${L3} stroke-width="1.2"/>${palm(20, 92, 30, 4)}${palm(40, 92, 22, -3)}<path d="${waves(140, 122, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	NA: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[50, 60, 60], [140, 80, 80], [230, 50, 60]].map(([x, h, w]) => `<path d="M${x - w},110 Q${x - w / 3},${110 - h * 0.45} ${x},${110 - h} Q${x + w * 0.35},${110 - h * 0.55} ${x + w},110 Z" ${L2} stroke-width="1.6"/><path d="M${x},${110 - h} Q${x + w * 0.1},${110 - h * 0.5} ${x - w * 0.15},110 H${x + w} Q${x + w * 0.35},${110 - h * 0.55} ${x},${110 - h} Z" ${L3} stroke="none"/>`).join('')}
<path d="M0,110 H270 V132 H0 Z" ${SNOW} stroke-width="1.2"/>${at(110, 128, 1.1, ORYX)}${at(150, 128, 0.8, ORYX, true)}${[[40, 124], [210, 124]].map(([x, y]) => `<path d="M${x},${y} V${y - 12} M${x},${y - 8} l-5,-6 M${x},${y - 6} l5,-5" stroke-width="1.4"/>`).join('')}`,
	RW: () => `${sun(236, 22, 9)}${birds(140, 20)}${teahill(30, 86, 40, L1)}${teahill(240, 86, 44, L1)}<path d="M0,86 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,86 H270" stroke-width="1.6"/>
${[[80, 108, 1], [140, 114, 0.9], [200, 106, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-30,0 Q0,6 30,0 L28,-3 H-28 Z M-30,6 H30" ${SOLID}/><path d="M-20,-3 L-30,-30 M20,-3 L30,-30 M-30,-30 H30" stroke-width="1.2"/>${PERSON.replace('<circle', '<circle transform="translate(-10,-3)"')}`)).join('')}<path d="${waves(10, 124, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	SC: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,90 H270 V110 H0 Z" ${L2} stroke="none"/><path d="M0,90 H270" stroke-width="1.6"/>${at(70, 112, 1.3, STACK)}${at(110, 110, 0.9, STACK)}${at(200, 112, 1.2, STACK)}
<path d="M0,110 Q135,100 270,112 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${palm(30, 112, 50, 8)}${palm(240, 112, 44, -8)}${palm(150, 112, 34, 5)}`,
	SH: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V40 Q30,30 60,40 L100,110 Z M270,132 V30 Q240,20 210,34 L170,110 Z" ${L3} stroke-width="1.8"/>${nyhavn(100, 110, 5, 14)}<path d="M150,110 V90 L156,84 L162,90 V110" ${SNOW} stroke-width="1.1"/><path d="M100,110 H170" stroke-width="1.6"/>
<path d="M60,112 L200,132 M66,104 L206,124" stroke-width="1.2" stroke="none"/><path d="M100,110 H170 V132 H100 Z" ${L2} stroke="none"/><path d="${waves(104, 122, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/><path d="M200,40 L230,110" stroke-width="2"/><path d="M204,40 L234,110" stroke-width="2"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${200 + i * 3},${40 + i * 7} h4" stroke-width="1"/>`).join('')}`,
	SZ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q60,56 135,66 Q210,56 270,80 V132 H0 Z" ${L1} stroke-width="1.6"/>${[[40, 96], [64, 92], [88, 98]].map(([x, y]) => at(x, y, 1, BEEHIVE)).join('')}${at(140, 120, 1.1, ZEBRA)}${at(186, 118, 0.9, ZEBRA)}${at(220, 116, 0.7, ZEBRA)}${at(250, 96, 1, ACACIA)}${grass(110, 124)}`,
	TZ: () => `${sun(236, 22, 9)}${birds(140, 20)}${kili(80).replace(/M0,/, 'M90,')}<path d="M0,84 Q135,76 270,86 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(230, 86, 0.9, ACACIA)}${Array.from({ length: 24 }, (_, i) => at(10 + (i * 37) % 250, 98 + ((i * 13) % 26), 0.55 + ((i * 7) % 4) * 0.08, GNU, i % 3 === 0)).join('')}`,
	UG: () => `${sun(236, 22, 9)}${birds(140, 20)}${teahill(40, 96, 46, L1)}${teahill(130, 92, 56, L1)}${teahill(230, 96, 50, L1)}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/>
${[[80, 108, 30, 8], [180, 112, 24, 6]].map(([x, y, w, h]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" ${L3} stroke-width="1.2"/>${pine(x - 6, y - 2, 14)}${pine(x + 8, y - 2, 12)}`).join('')}${at(130, 124, 0.9, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)}`,
	ZA: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,86 Q135,76 270,88 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(40, 96, 1, ACACIA)}${at(230, 96, 0.8, ACACIA)}${at(60, 122, 1, ELEPHANT)}${at(110, 120, 0.9, LION)}${at(150, 122, 0.8, COW)}${at(190, 120, 0.9, `<path d="M-14,0 V-8 Q-16,-18 -2,-18 H10 Q16,-18 16,-10 L22,-8 L20,-4 L16,-4 V0 H12 V-4 H-8 V0 Z" ${SOLID}/><path d="M18,-10 L20,-16 L22,-10" ${SOLID}/>`)}${at(240, 124, 0.7, `<path d="M8,-20 Q12,-28 22,-26 Q30,-24 30,-16 V0 H27 V-10 H13 V0 H10 Z" ${L3} stroke-width="1"/><circle cx="6" cy="-20" r="5" ${SOLID}/><circle cx="4" cy="-21" r=".8" ${PAPER}/>`)}`,
	ZM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q135,70 270,82" stroke-width="1.4"/>${[[20, 82], [50, 80], [220, 82], [250, 80]].map(([x, y]) => bush(x, y, 14, L3)).join('')}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/>
${[[60, 104], [96, 108], [200, 102]].map(([x, y]) => at(x, y, 1, HIPPO)).join('')}${at(150, 120, 1.1, `<path d="M-24,0 Q0,4 24,0 L22,-3 H-22 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(-8,-2)"')}${PERSON.replace('<circle', '<circle transform="translate(8,-2)"')}`)}<path d="${waves(10, 124, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	ZW: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M20,40 A120,90 0 0 1 250,40" stroke-width="3" stroke-opacity=".35"/><path d="M28,44 A112,84 0 0 1 242,44" stroke-width="2" stroke-opacity=".2"/><path d="M0,60 H270" stroke-width="1.6"/><path d="M0,60 H270 V70 H0 Z" ${L2} stroke="none"/>
<path d="M0,70 H270 V132 H0 Z" ${PAPER}/>${Array.from({ length: 27 }, (_, i) => `<path d="M${5 + i * 10},70 V${110 + (i % 3) * 6}" stroke-width="1.2"/>`).join('')}<path d="M0,112 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0 q15,-10 30,0" stroke="var(--stp)" stroke-width="4"/>
<path d="M190,60 Q220,40 250,60" stroke-width="2.4"/><path d="M190,60 H250" stroke-width="2"/>`,
	RE: () => `${sun(236, 22, 9)}<path d="M0,110 L60,50 Q70,40 80,46 L90,40 Q100,36 110,46 L200,110 Z" ${L3} stroke-width="1.8"/><path d="M84,44 q-6,-10 2,-16 q8,-6 4,-16 q-2,-6 4,-10" stroke-width="2"/><path d="M80,30 q-6,-6 0,-12 M96,26 q6,-4 2,-10" stroke-width="1.4"/>
<path d="M90,46 L84,70 L96,90 L88,110" stroke="#F7A35C" stroke-width="3"/><path d="M100,48 L110,74 L104,96 L116,110" stroke="#F7A35C" stroke-width="2.4"/><path d="M0,110 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,110 H270" stroke-width="1.6"/><path d="M200,110 H270 V132 H200 Z" ${L2} stroke="none"/><path d="${waves(206, 122, 4, 14, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	YT: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M40,70 Q40,40 135,36 Q230,40 230,70 Q230,100 135,104 Q40,100 40,70 Z" ${SNOW} stroke-width="1.2" stroke-dasharray="4 3"/><path d="M60,70 Q60,52 135,48 Q210,52 210,70 Q210,90 135,92 Q60,90 60,70 Z" ${L2} stroke-width="1.4"/>
<path d="M100,72 Q110,58 140,60 Q170,62 172,74 Q150,84 120,82 Q104,80 100,72 Z" ${L3} stroke-width="1.4"/>${palm(130, 66, 18, 3)}${palm(150, 68, 14, -3)}${at(80, 120, 1, TURTLE)}<path d="${waves(140, 120, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	AO: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[30, 50], [46, 70], [62, 40], [80, 56], [98, 80], [116, 48], [134, 60]].map(([x, h], i) => `<path d="M${x - 7},92 V${92 - h} H${x + 7} V92" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}<path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,92 Q60,94 150,92" stroke-width="1.6"/>
<path d="M150,96 Q200,90 270,100 V108 Q200,98 150,104 Z" ${SNOW} stroke-width="1.2"/>${[170, 200, 230, 255].map((x) => palm(x, 100, 22, -3)).join('')}<path d="${waves(10, 116, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	BF: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M40,104 V60 H230 V104" ${L2} stroke-width="1.4"/>${[60, 100, 135, 170, 210].map((x, i) => `<path d="M${x - 8},60 L${x - 6},${i === 2 ? 20 : 34} H${x + 6} L${x + 8},60 Z" ${L2} stroke-width="1.2"/><path d="M${x - 11},${i === 2 ? 30 : 42} h22 M${x - 11},${i === 2 ? 44 : 52} h22" stroke-width="1.4"/>`).join('')}${Array.from({ length: 18 }, (_, i) => `<path d="M${46 + i * 10},70 h4 M${46 + i * 10},84 h4" stroke-width="1.4"/>`).join('')}
<path d="M125,104 V84 Q135,76 145,84 V104 Z" ${SOLID}/><path d="M0,104 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,104 H270" stroke-width="2"/>`,
	BI: () => `${sun(236, 22, 9)}${birds(140, 20)}${teahill(40, 92, 50, L1)}${teahill(140, 90, 60, L1)}${teahill(240, 92, 46, L1)}<path d="M0,92 Q135,84 270,94 V132 H0 Z" ${L2} stroke-width="1.6"/>
${[[30, 100], [60, 104], [210, 102], [240, 98]].map(([x, y]) => `<path d="M${x},${y} V${y - 18}" stroke-width="2"/><path d="M${x},${y - 18} q-12,-4 -16,6 M${x},${y - 18} q12,-4 16,6 M${x},${y - 18} q-6,-10 -2,-16 M${x},${y - 18} q6,-10 2,-16" stroke-width="2"/>`).join('')}${at(110, 124, 0.9, COW)}${at(150, 122, 0.8, COW)}${at(180, 126, 0.7, COW)}`,
	CF: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 Q30,56 60,66 Q90,52 120,64 Q160,50 200,66 Q240,54 270,66 V90 H0 Z" ${L3} stroke-width="1.6"/>${[[20, 66], [60, 60], [110, 58], [160, 56], [210, 60], [250, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" ${L2} stroke="none"/>`).join('')}
<path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,90 H270" stroke-width="1.6"/>${[[70, 110, 1], [140, 116, 0.9], [210, 108, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-24,0 Q0,4 24,0 L22,-3 H-22 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}<path d="M4,-14 L16,6" stroke-width="1.2"/>`)).join('')}`,
	CG: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,74 Q30,60 60,70 Q90,56 120,68 Q160,54 200,70 Q240,58 270,70 V90 H0 Z" ${L3} stroke-width="1.6"/><path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/>
${Array.from({ length: 10 }, (_, i) => `<path d="M${10 + i * 26},${100 + (i % 3) * 8} q6,-8 12,0 q6,-8 12,0" stroke="var(--stp)" stroke-width="2.4"/>`).join('')}${[[60, 110], [180, 104], [220, 120]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="4" ${L4} stroke="none"/>`).join('')}${at(130, 120, 1, `<path d="M-24,0 Q0,4 24,0 L22,-3 H-22 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}<path d="M4,-14 L16,6" stroke-width="1.2"/>`)}`,
	DJ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,60 L40,36 L80,50 L120,30 L170,52 L210,40 L270,56 V70 H0 Z" ${L2} stroke-width="1.6"/><path d="M0,70 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,70 H270" stroke-width="1.6"/>
${at(110, 108, 1, `<path d="M-46,0 Q-30,-14 0,-14 Q22,-12 34,-4 L50,-16 Q46,-2 50,14 L34,4 Q22,12 0,12 Q-30,12 -46,0 Z" ${SOLID}/><path d="M-12,-14 Q-4,-26 6,-24 Q2,-18 2,-13 Z" ${SOLID}/>${dots([[-30, -4, 1.2], [-20, 2, 1.2], [-10, -6, 1.4], [0, 0, 1.2], [10, -6, 1.2], [20, 2, 1.2]], PAPER)}`)}${at(220, 96, 0.8, `<path d="M-30,-6 Q0,8 34,-10 L28,2 Q0,8 -24,2 Z" ${SOLID}/><path d="M0,-4 V-40" stroke-width="1.6"/><path d="M-20,-36 Q6,-46 20,-10 L0,-8 Z" ${SNOW} stroke-width="1.3"/>`)}`,
	ER: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V50 L30,30 L60,46 L90,26 L130,50 L170,30 L210,48 L240,30 L270,44 V132 Z" ${L2} stroke-width="1.8"/><path d="M0,96 Q40,86 70,96 Q100,106 130,92 Q170,76 210,90 Q240,100 270,88" stroke-width="2.4"/><path d="M0,99 Q40,89 70,99 Q100,109 130,95 Q170,79 210,93 Q240,103 270,91" stroke-width="1" stroke-dasharray="2 2"/>
${at(150, 90, 0.9, STEAM)}${viaduct(40, 96, 50, 10, 3)}${[[20, 120, 12], [250, 118, 14]].map(([x, y, r]) => bush(x, y, r, L3)).join('')}`,
	ET: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 Q135,60 270,72" stroke-width="1.4"/><path d="M0,72 H270 V132 H0 Z" ${L1} stroke="none"/>${dallol(10, 88, 10)}${dallol(-4, 112, 11)}${at(200, 70, 0.6, CAMEL)}${at(226, 70, 0.5, CAMEL)}`,
	GA: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,40 Q30,34 60,44 L70,132 H0 Z M270,40 Q240,34 210,44 L200,132 H270 Z" ${L3} stroke-width="1.8"/>${[[20, 40], [50, 34], [220, 36], [250, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L2} stroke="none"/>`).join('')}${cascades(66, 56, 140, 6)}${cascades(70, 86, 130, 5)}<path d="M70,112 H200 V132 H70 Z" ${L2} stroke="none"/><path d="${waves(76, 122, 8, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	GM: () => `${sun(236, 22, 9)}${birds(140, 20)}${birds(80, 34, 0.7)}<path d="M0,80 Q135,72 270,82" stroke-width="1.4"/>${Array.from({ length: 20 }, (_, i) => `<path d="M${6 + i * 13},82 l-4,8 M${6 + i * 13},82 l4,8 M${6 + i * 13},82 v-10" stroke-width="1.2"/><circle cx="${6 + i * 13}" cy="70" r="7" ${L3} stroke="none"/>`).join('')}
<path d="M0,90 H270 V132 H0 Z" ${L2} stroke="none"/>${at(70, 88, 0.8, PELICAN)}${at(92, 90, 0.7, PELICAN)}${[[150, 112, 1], [210, 118, 0.9]].map(([x, y, s]) => at(x, y, s, `<path d="M-24,0 Q0,6 24,-4 L28,-10 L20,-4 H-20 L-26,-10 Z" ${SOLID}/><path d="M-20,-2 H18" stroke="var(--stp)" stroke-width="1.6" stroke-dasharray="4 3"/>`)).join('')}<path d="${waves(10, 124, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	GN: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V70 Q60,50 135,56 Q210,50 270,70 V132 Z" ${L2} stroke-width="1.8"/><path d="M0,70 Q60,50 135,56 Q210,50 270,70" stroke-width="3"/><path d="M20,80 V120 M60,70 V120 M210,70 V120 M250,80 V120" stroke-width="1" stroke-dasharray="6 3"/>
<path d="M0,100 Q135,90 270,102 V132 H0 Z" ${L1} stroke-width="1.6"/>${[[60, 108], [84, 104], [200, 106]].map(([x, y]) => at(x, y, 1, RONDAVEL)).join('')}${at(130, 124, 0.8, COW)}${at(160, 122, 0.7, COW)}`,
	GQ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 V60 Q60,30 135,34 Q210,30 270,60 V132 Z" ${L2} stroke-width="1.8"/><path d="M40,90 Q135,60 230,90 Q135,110 40,90 Z" ${L3} stroke-width="1.6"/><g opacity=".4">${[[80, 88, 20], [190, 88, 22]].map(([x, y, h]) => pine(x, y, h)).join('')}</g>
<path d="M0,110 Q135,100 270,112 V132 H0 Z" ${L1} stroke-width="1.6"/>${[[30, 110, 26], [50, 112, 20], [220, 110, 24], [246, 112, 30]].map(([x, y, h]) => palm(x, y, h, 4)).join('')}`,
	GW: () => `${sun(236, 22, 9)}${birds(140, 20)}${Array.from({ length: 22 }, (_, i) => `<path d="M${4 + i * 12},${76 + (i % 3) * 3} l-4,8 M${4 + i * 12},${76 + (i % 3) * 3} l4,8 M${4 + i * 12},${76 + (i % 3) * 3} v-10" stroke-width="1.2"/><circle cx="${4 + i * 12}" cy="${64 + (i % 3) * 3}" r="7" ${L3} stroke="none"/>`).join('')}
<path d="M0,86 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,104 Q100,94 270,108" stroke="var(--stp)" stroke-width="3"/>${at(120, 116, 1.1, `<path d="M-24,0 Q0,4 24,0 L22,-3 H-22 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}<path d="M4,-14 L16,6" stroke-width="1.2"/>`)}`,
	KM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 Q60,50 135,56 Q210,48 270,66 V90 H0 Z" ${L3} stroke-width="1.6"/>${[[20, 66], [60, 58], [110, 56], [160, 54], [210, 56], [250, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" ${L2} stroke="none"/>`).join('')}<path d="M0,90 Q135,80 270,92 V108 H0 Z" ${SNOW} stroke-width="1.6"/><path d="M0,108 H270 V132 H0 Z" ${L2} stroke="none"/>
${[[60, 100, 0.6, 20], [110, 98, 0.5, -10], [170, 102, 0.55, 30]].map(([x, y, s, a]) => `<g transform="translate(${x},${y}) rotate(${a}) scale(${s})">${TURTLE}</g>`).join('')}<path d="${waves(10, 120, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	LR: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[10, 100, 80], [50, 100, 66], [220, 100, 84], [260, 100, 70]].map(([x, y, h]) => bigtree(x, y, h)).join('')}<path d="M0,100 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M60,100 Q135,90 210,100" stroke-width="1.6"/>
${at(130, 120, 1, `<path d="M-24,0 Q0,4 24,0 L22,-3 H-22 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}<path d="M4,-14 L16,6" stroke-width="1.2"/>`)}${at(180, 108, 0.8, HIPPO)}<path d="${waves(20, 120, 4, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	LY: () => `${sun(236, 22, 9)}${birds(140, 20)}${at(70, 110, 1, `<path d="M-50,0 Q-52,-50 -24,-62 Q0,-70 24,-62 Q52,-50 50,0 H30 Q32,-32 18,-40 Q0,-48 -18,-40 Q-32,-32 -30,0 Z" ${L3} stroke-width="1.8"/>`)}<path d="M140,110 V40 H250 V110 Z" ${L2} stroke-width="1.6"/>
${[[160, 70], [190, 64], [220, 74]].map(([x, y]) => `<g transform="translate(${x},${y}) scale(.7)"><path d="M-10,0 Q-10,-6 0,-6 Q10,-6 10,0 Q10,4 0,4 Q-10,4 -10,0 Z" ${SOLID}/><path d="M-7,3 v7 M-3,3 v7 M4,3 v7 M8,3 v7" stroke-width="1.6"/><path d="M-9,-3 L-15,-7" stroke-width="3"/></g>`).join('')}${at(200, 96, 0.8, PERSON)}<path d="M0,110 Q135,100 270,112 V132 H0 Z" ${SNOW} stroke-width="1.6"/>`,
	ML: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,40 H270 V80 Q200,70 135,74 Q60,70 0,80 Z" ${L3} stroke-width="1.8"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 26},${78} V${66 - (i % 2) * 4} H${30 + i * 26} V${78}" ${SNOW} stroke-width="1"/><path d="M${19 + i * 26},${66 - (i % 2) * 4} L${25 + i * 26},${58 - (i % 2) * 4} L${31 + i * 26},${66 - (i % 2) * 4} Z" ${SOLID}/>`).join('')}
<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,82 Q135,74 270,84 V96 H0 Z" ${L1} stroke-width="1.4"/>${[[70, 114, 1], [160, 118, 1.1], [230, 112, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-30,0 Q0,6 30,-4 L32,-8 L26,-4 H-26 L-32,-8 Z" ${SOLID}/><path d="M-14,-4 Q0,-16 14,-4" ${L3} stroke-width="1.2"/>`)).join('')}`,
	MR: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,132 H270 V0 H0 Z" ${L1} stroke="none"/>${at(135, 70, 1.3, RICHAT)}<path d="M0,120 Q135,110 270,122 V132 H0 Z" ${SNOW} stroke-width="1.4"/>`,
	MW: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q135,72 270,82" stroke-width="1.4"/>${[[20, 82, 14], [50, 80, 12], [220, 82, 16], [250, 80, 12]].map(([x, y, r]) => bush(x, y, r, L3)).join('')}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/>
${at(80, 104, 1, ELEPHANT)}${at(120, 106, 0.8, ELEPHANT)}<g opacity=".3" transform="translate(0,208) scale(1,-1)">${at(80, 104, 1, ELEPHANT)}</g>${at(200, 112, 0.9, HIPPO)}${PAPYRUS(170, 100)}${PAPYRUS(180, 102)}<path d="${waves(10, 124, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	MZ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,40 Q135,30 270,42" stroke-width="1.6"/><path d="M60,0 L80,90 M150,0 L150,100 M230,0 L210,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/>
${at(100, 84, 1.6, MANTA)}${at(200, 104, 1, MANTA)}<path d="M0,124 Q60,114 120,122 Q190,112 270,124 V132 H0 Z" ${L3} stroke-width="1.4"/>${dots([[160, 60, 1.6], [166, 52, 1.2]], 'fill="none" stroke="currentColor" stroke-width="1"')}`,
	NE: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 Q135,86 270,98 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(60, 100, 1, ACACIA)}${at(200, 98, 1.2, ACACIA)}${at(100, 124, 1.2, GIRAFFE2)}${at(150, 122, 1, GIRAFFE2, true)}${at(230, 126, 0.8, GIRAFFE2)}${grass(30, 124)}`,
	SD: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,76 Q60,64 135,70 Q210,62 270,74 V90 H0 Z" ${SNOW} stroke-width="1.6"/>${[20, 40, 60, 210, 236, 256].map((x, i) => palm(x, 92, 30 + (i % 2) * 8, i % 2 ? -5 : 5)).join('')}<path d="M0,92 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,92 H270" stroke-width="1.6"/>
${at(130, 116, 1.1, FELUCCA)}<path d="${waves(170, 122, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	SL: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 L30,50 L60,66 L100,40 L140,64 L170,52 L210,72 L270,60 V90 H0 Z" ${L2} stroke-width="1.6"/><path d="M0,90 H270 V100 H0 Z" ${L2} stroke="none"/><path d="M0,90 H270" stroke-width="1.6"/>
<path d="M0,100 Q135,92 270,102 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[30, 56, 210, 236, 258].map((x, i) => palm(x, 112, 34 + (i % 2) * 8, i % 2 ? -6 : 6)).join('')}${at(140, 96, 0.9, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>`)}`,
	SO: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,84 H270" stroke-width="1.6"/><path d="M0,84 Q30,70 70,74 Q90,76 96,84 Z" ${SNOW} stroke-width="1.4"/>${nyhavn(10, 82, 5, 12)}
${[[150, 108, 1], [210, 114, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-30,-6 Q0,8 34,-10 L28,2 Q0,8 -24,2 Z" ${SOLID}/><path d="M0,-4 V-40" stroke-width="1.6"/><path d="M-20,-36 Q6,-46 20,-10 L0,-8 Z" ${SNOW} stroke-width="1.3"/>`)).join('')}<path d="${waves(10, 120, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	SS: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 Q135,76 270,86 V132 H0 Z" ${L1} stroke-width="1.6"/>${Array.from({ length: 22 }, (_, i) => at(8 + (i * 41) % 250, 96 + ((i * 17) % 30), 0.6 + ((i * 7) % 4) * 0.08, KOB, i % 4 === 0)).join('')}${at(240, 88, 0.8, ACACIA)}`,
	ST: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/><path d="M60,96 Q80,70 135,66 Q190,70 210,96 Z" ${L3} stroke-width="1.6"/>${[90, 110, 160, 180].map((x) => palm(x, 80, 20, 3)).join('')}
<path d="M135,66 V40" stroke-width="2"/><circle cx="135" cy="40" r="6" ${SNOW} stroke-width="1.2"/><path d="M129,40 H141 M135,34 V46" stroke-width="1"/><path d="M0,104 H270" stroke="var(--stp)" stroke-width="2" stroke-dasharray="6 4"/><path d="${waves(10, 120, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	TD: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,86 Q135,76 270,88 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(40, 92, 0.8, ACACIA)}${at(240, 94, 1, ACACIA)}${[[70, 116, 1.1], [104, 118, 1], [136, 116, 0.9], [166, 120, 0.8], [196, 118, 0.7], [90, 126, 0.6], [150, 128, 0.55]].map(([x, y, s], i) => at(x, y, s, ELEPHANT, i % 3 === 0)).join('')}`,
	AR: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,40 H270 V56 H0 Z" ${L2} stroke="none"/><path d="M0,40 H270" stroke-width="1.6"/>${[20, 60, 100, 150, 200, 240].map((x, i) => `<circle cx="${x}" cy="40" r="14" ${L3} stroke="none"/>`).join('')}<path d="M0,56 H270 V132 H0 Z" ${PAPER}/>
${cascades(0, 56, 110, 5)}${cascades(150, 56, 120, 6)}<path d="M110,56 Q130,60 150,56 V132 H110 Z" ${L2} stroke="none"/><path d="M0,104 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,104 q15,-8 30,0 q15,-8 30,0 q15,-8 30,0 q15,-8 30,0 q15,-8 30,0 q15,-8 30,0 q15,-8 30,0 q15,-8 30,0 q15,-8 30,0" stroke="var(--stp)" stroke-width="3"/><path d="M40,40 A100,50 0 0 1 230,40" stroke-width="2" stroke-opacity=".35"/>`,
	BO: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 L40,40 L80,56 L130,30 L180,52 L220,36 L270,56 V80 H0 Z" ${L1} stroke-width="1.6"/><path d="M0,80 H270" stroke-width="1.4"/><path d="M0,80 H270 V132 H0 Z" ${SNOW}/><g opacity=".25" transform="translate(0,160) scale(1,-1)"><path d="M0,70 L40,40 L80,56 L130,30 L180,52 L220,36 L270,56 V80 H0 Z" ${L3} stroke="none"/></g>
${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 30},${100 + (i % 2) * 10} l14,-6 l14,6 l-14,6 Z" stroke-width=".8" stroke-opacity=".4"/>`).join('')}${at(120, 98, 1, JEEP)}<g opacity=".3" transform="translate(0,196) scale(1,-1)">${at(120, 98, 1, JEEP)}</g>${at(160, 96, 0.7, PERSON)}${at(172, 96, 0.7, PERSON)}`,
	BR: () => `${sun(236, 22, 9)}${birds(140, 20)}${SUGARLOAF(220, 92, 1.2)}<path d="M150,92 Q170,70 190,92" ${L3} stroke-width="1.2"/><path d="M30,92 Q50,60 80,50 L84,40 L88,50 Q110,62 120,92" ${L2} stroke-width="1.4"/>${at(84, 40, 0.8, CRISTO)}<path d="M180,40 L220,32" stroke-width=".8"/>
<path d="M0,92 H270 V108 H0 Z" ${L2} stroke="none"/><path d="M0,92 H270" stroke-width="1.6"/><path d="M0,108 Q135,100 270,110 V132 H0 Z" ${SNOW} stroke-width="1.6"/><path d="M0,120 Q20,114 40,120 T80,120 T120,120 T160,120 T200,120 T240,120 T280,120" stroke-width="2.4"/>${[40, 140, 200].map((x) => palm(x, 112, 30, 5)).join('')}`,
	CL: () => `<rect width="270" height="132" ${NIGHT} stroke="none"/>${dots([[20, 14], [60, 30], [100, 10], [150, 24], [200, 14], [240, 30], [40, 50, 1], [130, 44, 1], [180, 52, 1], [220, 56, 1]], STAR)}<path d="M0,80 Q120,0 270,20" stroke="#F4F7FA" stroke-opacity=".2" stroke-width="22"/><path d="M0,80 Q120,0 270,20" stroke="#F4F7FA" stroke-opacity=".18" stroke-width="8"/>
<path d="M0,100 L60,70 L110,84 L170,60 L220,80 L270,70 V132 H0 Z" ${L3} stroke="none"/><path d="M0,110 Q135,100 270,112 V132 H0 Z" ${L4} stroke="none"/>${[[60, 114], [100, 112], [140, 116], [180, 112], [220, 114]].map(([x, y]) => at(x, y, 1, `<g style="color:#F4F7FA">${DISH}</g>`)).join('')}`,
	CO: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,60 Q60,40 135,50 Q210,40 270,60 V80 H0 Z" ${L2} stroke-width="1.6"/><path d="M0,80 H270 V132 H0 Z" ${L1} stroke="none"/>
<path d="M0,96 Q60,84 120,98 Q180,112 270,92 V116 Q180,132 120,118 Q60,104 0,116 Z" ${L3} stroke-width="1.2"/>${Array.from({ length: 24 }, (_, i) => `<path d="M${6 + i * 11},${100 + Math.round(8 * Math.sin(i))} q2,-4 4,0 q2,-4 4,0" stroke-width="2.2" stroke="${['currentColor', 'var(--stp)'][i % 2]}"/>`).join('')}${[[20, 84, 18], [250, 82, 22]].map(([x, y, h]) => pine(x, y, h)).join('')}`,
	EC: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,84 H270" stroke-width="1.6"/><path d="M0,100 Q40,90 80,96 Q120,88 160,96 L170,132 H0 Z" ${L4} stroke-width="1.4"/>
${[[30, 98], [52, 96], [76, 98], [100, 94]].map(([x, y]) => at(x, y, 1, BOOBY)).join('')}${at(140, 112, 1, SEALION)}${at(220, 112, 0.9, SEALION, true)}<path d="${waves(170, 116, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	FK: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 H270 V96 H0 Z" ${L2} stroke="none"/><path d="M0,70 H270" stroke-width="1.6"/><path d="${waves(10, 82, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/><path d="M0,96 Q135,86 270,98 V132 H0 Z" ${SNOW} stroke-width="1.6"/>
${Array.from({ length: 18 }, (_, i) => at(10 + (i * 47) % 250, 110 + ((i * 13) % 20), 0.8 + ((i * 7) % 3) * 0.12, GENTOO, i % 2 === 0)).join('')}`,
	GS: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 L30,40 L60,56 L100,24 L140,50 L180,30 L220,52 L270,36 V80 H0 Z" ${SNOW} stroke-width="1.8"/><path d="M0,80 H270 V96 H0 Z" ${L2} stroke="none"/><path d="M0,96 Q135,88 270,98 V132 H0 Z" ${L1} stroke-width="1.6"/>
${Array.from({ length: 34 }, (_, i) => at(6 + (i * 37) % 260, 104 + ((i * 11) % 24), 0.5 + ((i * 7) % 4) * 0.06, `<path d="M-5,0 Q-8,-10 -6,-18 Q-4,-24 0,-24 Q4,-24 5,-18 Q8,-10 5,0 Z" ${SOLID}/><path d="M-3,-2 Q-5,-10 -3,-16 Q0,-17 3,-16 Q5,-10 3,-2 Z" ${PAPER}/><path d="M2,-20 l2,2" stroke-width="1.4" stroke="var(--stp)"/>`)).join('')}`,
	GY: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,24 H110 V132 H0 Z M160,24 H270 V132 H160 Z" ${L3} stroke-width="1.8"/><path d="M0,22 H270" stroke-width="2.6"/><path d="M110,24 H160 V112 H110 Z" ${PAPER}/>${[114, 122, 130, 138, 146, 154].map((x) => `<path d="M${x},24 V112" stroke-width="1.4"/>`).join('')}<path d="M100,112 q8,-8 16,0 q8,-8 16,0 q8,-8 16,0 q8,-8 16,0" stroke="var(--stp)" stroke-width="2.4"/>
${[20, 50, 80, 190, 220, 250].map((x) => `<path d="M${x},132 V${100 + (x % 3) * 4}" stroke-width="1"/>`).join('')}<path d="M0,112 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 M160,112 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 V132 H0 Z" ${SOLID}/>`,
	PY: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 Q135,76 270,86 V132 H0 Z" ${L1} stroke-width="1.6"/>${[[30, 86], [230, 86]].map(([x, y]) => palm(x, y, 34, 4)).join('')}<ellipse cx="135" cy="110" rx="80" ry="10" ${L2} stroke-width="1.4"/>${[[90, 110], [120, 106], [150, 112], [180, 108]].map(([x, y]) => at(x, y, 1.2, JABIRU)).join('')}${at(60, 122, 0.9, CAPYBARA)}`,
	SR: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[10, 96, 70], [44, 96, 56], [226, 96, 74], [260, 96, 60]].map(([x, y, h]) => bigtree(x, y, h)).join('')}<path d="M0,74 Q135,60 270,74 V96 H0 Z" ${L3} stroke-width="1.4"/><path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/>
${at(140, 116, 1.1, `<path d="M-26,0 Q0,4 26,-2 L22,-5 H-22 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(-8,-2)"')}${PERSON.replace('<circle', '<circle transform="translate(8,-2)"')}`)}<path d="${waves(10, 120, 5, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	UY: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,96 H270" stroke-width="1.6"/>${at(200, 96, 1.4, LIGHTHOUSE)}<path d="M0,96 V70 H140 V96" ${L1} stroke-width="1.2"/>${[10, 34, 58, 82, 106].map((x, i) => `<path d="M${x},96 V${76 + (i % 2) * 4} H${x + 20} V96" ${[SNOW, L3, L2][i % 3]} stroke-width="1"/><path d="M${x - 2},${76 + (i % 2) * 4} L${x + 10},${68 + (i % 2) * 4} L${x + 22},${76 + (i % 2) * 4} Z" ${SOLID}/>`).join('')}
<path d="M0,104 H140" stroke-width="2" stroke-dasharray="3 2"/>${at(60, 124, 0.8, `<rect x="-14" y="-12" width="24" height="10" rx="3" ${SOLID}/><circle cx="-8" cy="-2" r="2.6" ${SOLID}/><circle cx="6" cy="-2" r="2.6" ${SOLID}/>`)}<path d="${waves(150, 120, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	VE: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,86 Q135,76 270,88 V132 H0 Z" ${L1} stroke-width="1.6"/>${[[30, 88], [240, 86]].map(([x, y]) => palm(x, y, 34, 4)).join('')}<ellipse cx="135" cy="112" rx="90" ry="10" ${L2} stroke-width="1.4"/>${[[90, 100], [110, 96], [130, 102], [150, 98], [170, 102]].map(([x, y]) => at(x, y, 1, IBIS)).join('')}${at(80, 124, 1, CAPYBARA)}${at(180, 126, 0.9, CAPYBARA, true)}${at(210, 122, 0.8, CROC)}`,
	US: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,50 H270 V60 H0 Z" ${L1} stroke="none"/>${[0, 1, 2, 3, 4].map((r) => `<path d="M0,${60 + r * 14} ${Array.from({ length: 10 }, (_, i) => `L${i * 30 + 10},${60 + r * 14 + ((i * 7 + r * 5) % 9)} L${i * 30 + 20},${60 + r * 14 - 4 + ((i * 3 + r) % 6)}`).join(' ')} L270,${60 + r * 14} V132 H0 Z" ${[L1, L2, L3, L2, L4][r]} stroke-width="1.2"/>`).join('')}
<path d="M80,132 Q120,112 140,120 Q170,128 190,132" stroke="var(--stp)" stroke-width="3"/>${at(40, 58, 0.5, PERSON)}${birds(110, 40, 0.7)}`,
	CA: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,40 H270 V50 H0 Z" ${L2} stroke="none"/><path d="M0,40 H270" stroke-width="1.6"/><path d="M60,50 Q135,70 210,50 V132 H60 Z" ${PAPER}/>${Array.from({ length: 14 }, (_, i) => `<path d="M${64 + i * 11},${52 + Math.round(16 * Math.sin((i / 13) * Math.PI))} V110" stroke-width="1.2"/>`).join('')}<path d="M60,50 Q135,70 210,50" stroke-width="2"/>
<path d="M0,50 H60 V132 H0 Z M210,50 H270 V132 H210 Z" ${L3} stroke-width="1.4"/><path d="M60,110 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0 q10,-10 20,0" stroke="var(--stp)" stroke-width="3"/><path d="M60,116 H210 V132 H60 Z" ${L2} stroke="none"/>${at(120, 126, 0.8, `<path d="M-20,0 H20 L16,4 H-16 Z" ${SOLID}/><path d="M-14,0 V-6 H12 V0" ${SNOW} stroke-width="1"/>`)}`,
	MX: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M50,0 Q70,10 80,40 Q100,30 135,32 Q170,30 190,40 Q200,10 220,0 Z" ${PAPER}/>${[90, 110, 130, 150, 170, 190].map((x, i) => `<path d="M${x},${30 + (i % 3) * 4} Q${x + 4},60 ${x - 2},90" stroke-width="1.6"/>`).join('')}
<path d="M40,30 Q135,10 230,30 Q135,22 40,30" stroke="var(--stp)" stroke-width="10" stroke-opacity=".5"/><path d="M0,90 Q135,80 270,92 V132 H0 Z" ${L3} stroke-width="1.6"/><path d="M60,104 Q135,96 210,106" stroke="var(--stp)" stroke-width="2"/>${at(135, 110, 1, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M-12,-2 Q0,2 12,-2" stroke-width="2.4"/>`)}`,
	CR: () => `<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/>${[[20, 30], [60, 10], [110, 0], [160, 6], [210, 14], [250, 30], [30, 110], [240, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" ${L2} stroke="none"/>`).join('')}<path d="M40,0 Q50,70 36,132 M230,0 Q220,70 234,132" stroke-width="6"/>${cloud(80, 50)}${cloud(150, 40)}
${hangbridge(40, 80, 230, 72)}${at(110, 84, 0.6, PERSON)}${at(150, 84, 0.6, PERSON)}${at(200, 40, 1, HUMMINGBIRD)}`,
	CU: () => `${sun(236, 22, 9)}${birds(140, 20)}${[[10, 40], [34, 56], [58, 44], [82, 60], [106, 46], [130, 52], [154, 40], [178, 58], [202, 44], [226, 52], [250, 40]].map(([x, h], i) => `<path d="M${x},90 V${90 - h} H${x + 22} V90" ${[L2, SNOW, L1, L3][i % 4]} stroke-width="1.1"/>${[0, 1].map((r) => `<rect x="${x + 4}" y="${96 - h + r * 14}" width="5" height="8" ${SOLID}/><rect x="${x + 13}" y="${96 - h + r * 14}" width="5" height="8" ${SOLID}/>`).join('')}`).join('')}
<path d="M0,90 H270 V100 H0 Z" ${SNOW} stroke-width="1.4"/><path d="M0,100 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M60,100 Q70,80 80,96 Q90,74 100,100" ${SNOW} stroke="var(--stp)" stroke-width="1.4"/>${at(200, 92, 0.8, `<path d="M-20,0 V-6 Q-18,-12 -10,-12 L-4,-18 H10 L14,-12 Q20,-12 22,-6 V0 Z" ${SOLID}/><circle cx="-12" cy="0" r="3.4" ${L4} stroke-width="1"/><circle cx="14" cy="0" r="3.4" ${L4} stroke-width="1"/>`)}<path d="${waves(120, 118, 8, 16, 2.4)}" stroke="var(--stp)" stroke-width="1.4"/>`,
	GT: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M80,60 L130,14 Q136,10 142,14 L200,66" ${L1} stroke-width="1.6"/>${at(135, 104, 1.1, CATALINA)}${gables(0, 104, 4, 16)}${gables(206, 104, 4, 16)}<path d="M0,104 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,104 H270" stroke-width="2"/>${at(70, 124, 0.6, PERSON)}${at(200, 126, 0.6, PERSON)}`,
	PA: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/>${[[40, 84, 50, 14], [130, 96, 36, 10], [210, 80, 54, 16], [96, 112, 24, 8]].map(([x, y, w, h]) => `<ellipse cx="${x}" cy="${y}" rx="${w / 2 + 10}" ry="${h / 2 + 5}" ${SNOW} stroke-width="1" stroke-dasharray="3 2"/><ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" ${L3} stroke-width="1.2"/>${palm(x - 8, y, h * 1.8, 4)}${palm(x + 6, y, h * 1.4, -4)}`).join('')}${at(170, 116, 0.9, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)}`,
	BZ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,84 H270" stroke-width="1.6"/><path d="M40,84 Q60,74 120,74 Q180,74 200,84 Z" ${SNOW} stroke-width="1.2"/>${[60, 90, 120, 150, 180].map((x, i) => palm(x, 80, 30 + (i % 2) * 10, i % 2 ? -5 : 5)).join('')}
${[[50, 104], [120, 110], [210, 100]].map(([x, y]) => at(x, y, 0.9, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/><path d="M-10,-3 V-10 H10 V-3" ${L3} stroke-width="1"/>`)).join('')}<path d="M0,120 H270" stroke-width="1.2" stroke-dasharray="5 3"/>`,
	AG: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q40,40 90,46 L110,80 Z M170,80 L190,50 Q230,36 270,56 V80 Z" ${L2} stroke-width="1.6"/>${seaW(80)}<path d="M110,80 Q140,96 170,80" ${L3} stroke="none"/>${regatta([[120, 104, 0.8], [150, 110, 0.6], [90, 116, 0.7]])}${at(60, 50, 0.6, GEORGIAN)}`,
	AI: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><ellipse cx="135" cy="84" rx="70" ry="14" ${SNOW} stroke-width="1" stroke-dasharray="4 3"/><ellipse cx="135" cy="84" rx="40" ry="8" ${SNOW} stroke-width="1.4"/>${palm(126, 82, 34, 5)}${palm(144, 82, 26, -4)}${at(135, 82, 0.6, BEACHBAR)}${regatta([[60, 110, 0.6], [220, 104, 0.5]])}`,
	AW: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(80)}<path d="M0,98 Q135,90 270,100 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${at(60, 112, 1.1, DIVI)}${at(180, 116, 0.9, DIVI)}${at(130, 112, 0.8, BEACHBAR)}`,
	BB: () => `${sun(236, 22, 9)}${birds(140, 20)}${gables(10, 90, 6, 16)}<path d="M120,90 V54 H200 V90" ${SNOW} stroke-width="1.3"/><path d="M116,54 L160,40 L204,54 Z" ${L3} stroke-width="1.2"/><path d="M190,54 V30 H200 V54" ${SNOW} stroke-width="1.2"/>${[126, 140, 154, 168, 182].map((x) => `<path d="M${x},88 V72 Q${x + 4},68 ${x + 8},72 V88 Z" ${SOLID}/>`).join('')}${seaW(90)}${regatta([[60, 118, 0.6], [230, 116, 0.6]])}`,
	BL: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,90 Q40,40 120,44 Q200,40 270,80 V96 H0 Z" ${L2} stroke-width="1.6"/>${Array.from({ length: 14 }, (_, i) => {
		const x = 10 + i * 18,
			y = 90 - Math.round(36 * Math.sin((i / 13) * Math.PI)) + (i % 2) * 16;
		return `<path d="M${x},${y} V${y - 8} L${x + 6},${y - 13} L${x + 12},${y - 8} V${y}" ${SNOW} stroke-width="1"/><path d="M${x - 1},${y - 7} L${x + 6},${y - 14} L${x + 13},${y - 7} Z" ${SOLID}/>`;
	}).join('')}${[[40, 70], [120, 52], [200, 60], [240, 80]].map(([x, y]) => bush(x, y, 6, L3)).join('')}${seaW(96)}${at(80, 120, 0.9, YACHT)}${at(190, 116, 0.7, YACHT)}`,
	BM: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(84)}<path d="M0,104 Q135,94 270,106 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(60, 100, 1.2, STACK)}${at(210, 100, 1, STACK)}${at(140, 96, 0.6, STACK)}${dots([[80, 116, 1.4], [120, 120, 1.4], [160, 114, 1.4], [200, 122, 1.4]], L3)}`,
	BS: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L2} stroke="none"/>${[[60, 70, 80, 10], [150, 90, 100, 8], [230, 76, 60, 9], [100, 112, 70, 6]].map(([x, y, w, h]) => `<path d="M${x - w / 2},${y} Q${x},${y - h * 2} ${x + w / 2},${y} Q${x},${y + h} ${x - w / 2},${y} Z" ${SNOW} stroke-width="1.2"/>`).join('')}${palm(56, 68, 26, 4)}${palm(232, 74, 22, -4)}${at(170, 120, 0.9, YACHT)}`,
	CW: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M60,96 Q135,70 210,96 Q135,108 60,96 Z" ${SNOW} stroke-width="1.6"/>${at(150, 88, 1, LIGHTHOUSE)}<path d="M100,92 h12 v-6 h-12 Z" ${L3} stroke-width="1"/>${at(60, 120, 0.9, CATAMARAN)}<path d="${waves(150, 120, 6, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	DM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M150,70 Q180,30 220,34 Q250,40 260,70 Z" ${L3} stroke-width="1.6"/><path d="M0,70 H270" stroke-width="1.6"/><path d="M0,70 H270 V132 H0 Z" ${L2} stroke="none"/>
${Array.from({ length: 24 }, (_, i) => `<circle cx="${30 + (i * 37) % 200}" cy="${80 + ((i * 17) % 40)}" r="${1 + (i % 3)}" ${SNOW} stroke="var(--stp)" stroke-width=".8"/>`).join('')}${at(90, 118, 1, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M0,-3 L4,6 L10,12 M4,6 L-2,12 M-2,-2 L-8,-6" stroke-width="2"/>`)}<path d="M0,120 Q60,110 120,120 Q190,110 270,122 V132 H0 Z" ${L3} stroke-width="1.2"/>`,
	DO: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(80)}<path d="M0,98 Q135,90 270,100 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[20, 50, 80, 190, 220, 250].map((x, i) => palm(x, 106, 40 + (i % 2) * 10, i % 3 ? -8 : 8)).join('')}${at(135, 112, 0.8, `<path d="M-14,0 V-6 Q0,-12 14,-6 V0" ${L2} stroke-width="1"/><path d="M0,-10 V0" stroke-width="1"/>`)}`,
	GD: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,74 Q60,50 135,56 Q210,48 270,70 V80 H0 Z" ${L2} stroke-width="1.6"/>${seaW(80)}<path d="M0,98 Q135,88 270,100 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[30, 70, 200, 240].map((x, i) => palm(x, 106, 40, i % 2 ? -6 : 6)).join('')}${at(135, 110, 0.7, BEACHBAR)}`,
	HN: () => `<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M40,0 L60,80 M135,0 L135,90 M230,0 L210,80" stroke="var(--stp)" stroke-width="10" stroke-opacity=".35"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14 T240,14 T280,14" stroke-width="1.6"/>
<path d="M0,110 Q40,96 80,104 Q120,90 160,104 Q200,94 270,108 V132 H0 Z" ${L3} stroke-width="1.6"/>${[[30, 104], [70, 100], [190, 100], [240, 104]].map(([x, y]) => `<path d="M${x},${y} Q${x - 4},${y - 14} ${x - 10},${y - 20} M${x},${y} Q${x + 4},${y - 16} ${x + 10},${y - 22} M${x},${y} V${y - 18}" stroke-width="2"/>`).join('')}${at(130, 60, 1.4, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M0,-3 L4,6 L10,12 M4,6 L-2,12 M-2,-2 L-8,-6" stroke-width="2"/><path d="M10,12 l6,2 M-2,12 l-4,4" stroke-width="2.4"/>`)}`,
	HT: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q40,40 100,46 Q140,50 160,80 Z" ${L2} stroke-width="1.6"/>${seaW(80)}<path d="M100,96 Q135,88 170,96 Q135,104 100,96 Z" ${SNOW} stroke-width="1.2"/>${palm(120, 94, 22, 3)}${palm(150, 94, 18, -3)}${at(210, 112, 1, CATAMARAN)}`,
	JM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,90 L40,46 L80,64 L130,24 L180,56 L220,40 L270,60 V132 H0 Z" ${L2} stroke-width="1.8"/>${cloud(110, 30)}${tea(0, 96, 270, 5)}${at(200, 112, 0.7, PERSON)}${at(60, 116, 0.7, PERSON)}`,
	KN: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M100,84 L160,24 Q170,18 180,24 L250,84" ${L2} stroke-width="1.6"/>${cloud(150, 28)}${seaW(84)}<path d="M0,102 Q135,94 270,104 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[30, 60, 210, 240].map((x, i) => palm(x, 110, 34, i % 2 ? -6 : 6)).join('')}`,
	KY: () => `<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,40 H270" stroke-width="1.6"/>${[[60, 30], [120, 34], [200, 28]].map(([x, y]) => at(x, y, 1, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M-10,0 H10" stroke-width="2"/>`)).join('')}${at(140, 30, 0.8, CATAMARAN)}
${[[60, 90, 1.2], [140, 104, 1], [210, 84, 0.9], [100, 120, 0.7]].map(([x, y, s]) => at(x, y, s, `<path d="M0,-16 Q26,-14 40,4 Q20,8 8,20 Q4,22 0,22 Q-4,22 -8,20 Q-20,8 -40,4 Q-26,-14 0,-16 Z" ${SOLID}/><path d="M0,22 Q2,30 12,36" stroke-width="1.6"/>`)).join('')}`,
	MF: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M150,90 Q170,60 200,56 Q230,58 250,90 Z" ${L2} stroke-width="1.6"/>${keep(186, 62, 24, 14, SNOW)}<path d="M0,90 H270" stroke-width="1.6"/>${[[20, 90], [50, 90], [80, 90], [110, 90]].map(([x, y]) => at(x, y, 1, STALL.replace(/#F4F7FA/g, 'var(--stp)'))).join('')}${seaW(96)}${at(200, 120, 0.8, YACHT)}`,
	MS: () => `${sun(236, 22, 9)}${birds(60, 20)}<path d="M100,96 L170,30 Q180,24 190,30 L260,96" ${L2} stroke-width="1.6"/><path d="M180,24 Q170,10 180,0 M186,26 Q196,10 190,0" stroke-width="2"/><path d="M0,96 Q100,84 270,98 V132 H0 Z" ${SNOW} stroke-width="1.6"/>
${[[60, 104], [90, 100], [120, 106]].map(([x, y]) => `<path d="M${x - 10},${y} V${y - 10} L${x},${y - 16} L${x + 10},${y - 10} V${y}" ${L3} stroke-width="1"/>`).join('')}<path d="M40,96 V80 H48 V96" ${SOLID}/><path d="M38,80 L44,74 L50,80 Z" ${SOLID}/>${seaW(116)}`,
	NI: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 L60,30 Q66,24 72,30 L110,74 L130,54 Q136,48 142,54 L200,96 Z" ${L2} stroke-width="1.8"/><path d="M60,30 L66,40 L60,42 L54,38 Z" ${SNOW} stroke-width="1"/>${seaW(96)}${at(200, 120, 0.9, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)}`,
	PM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,90 Q40,60 90,64 L110,90 Z" ${L2} stroke-width="1.6"/>${nyhavn(10, 90, 6, 14)}${at(130, 88, 1, LIGHTHOUSE)}${seaW(90)}${[[150, 112, 1], [200, 118, 0.9], [240, 110, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-18,0 H18 L14,5 H-14 Z" ${SOLID}/><path d="M-8,0 V-8 H6 V0" ${SNOW} stroke-width="1"/><path d="M8,0 V-20 M8,-16 L16,-8" stroke-width="1.2"/>`)).join('')}`,
	PR: () => `<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/>${[[20, 30], [60, 10], [110, 0], [160, 6], [210, 14], [250, 30], [30, 110], [240, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" ${L2} stroke="none"/>`).join('')}<path d="M110,30 Q120,24 135,26 Q150,24 160,30 V112 H110 Z" ${L3} stroke-width="1.4"/>${cascades(118, 34, 34, 1)}<path d="M126,40 V110 M134,40 V112 M142,40 V110" stroke="var(--stp)" stroke-width="2"/>
<path d="M60,132 Q90,110 135,112 Q180,110 210,132 Z" ${L2} stroke-width="1.4"/><path d="M110,116 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0" stroke="var(--stp)" stroke-width="1.6"/>${at(60, 60, 1, PARROT)}`,
	LC: () => `${sun(236, 22, 9)}${birds(140, 20)}${PITONS(96, 135, 1.2)}${seaW(96)}<path d="M100,104 Q135,96 170,104 Q135,110 100,104 Z" ${SNOW} stroke-width="1.2"/>${palm(110, 100, 20, 3)}${palm(160, 100, 18, -3)}`,
	SV: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 L50,30 Q56,26 62,30 L100,60 L150,24 Q156,20 162,24 L220,70" ${L1} stroke-width="1.6"/><path d="M0,80 Q135,66 270,82 V132 H0 Z" ${L2} stroke-width="1.8"/>${tea(0, 90, 270, 5)}${Array.from({ length: 18 }, (_, i) => `<circle cx="${10 + i * 15}" cy="${120 + (i % 3) * 3}" r="2.6" ${[SOLID, L3, SNOW][i % 3]} stroke-width=".8"/>`).join('')}${at(140, 96, 0.7, PERSON)}`,
	SX: () => `${sun(236, 22, 9)}${birds(140, 20)}${at(120, 30, 1.4, `<path d="M-40,-4 Q-42,-10 -34,-10 H24 Q36,-10 42,-4 Q36,2 24,2 H-34 Q-42,2 -40,-4 Z" ${SOLID}/><path d="M-6,-4 L-20,-24 H-12 L6,-4 Z M-6,-2 L-14,14 H-6 L6,-2 Z M-34,-8 L-40,-18 H-34 L-26,-8 Z" ${SOLID}/><path d="M-30,-6 H30" stroke="var(--paper)" stroke-width="1.6" stroke-dasharray="2 2.4"/>`)}${seaW(84)}<path d="M0,104 Q135,94 270,106 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[40, 70, 100, 170, 200].map((x) => at(x, 114, 0.7, PERSON)).join('')}`,
	TC: () => `<path d="M0,0 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,0 H270 V40 H0 Z" ${L1} stroke="none"/>${sun(236, 22, 9)}${[[50, 70, 40, 14], [110, 90, 30, 10], [160, 64, 50, 16], [220, 96, 36, 12], [90, 116, 26, 8]].map(([x, y, w, h]) => `<ellipse cx="${x}" cy="${y}" rx="${w / 2 + 8}" ry="${h / 2 + 4}" ${SNOW} stroke-width="1" stroke-dasharray="3 2"/><ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" ${L3} stroke-width="1.2"/>${palm(x - 4, y, h * 1.6, 3)}`).join('')}`,
	TT: () => `${sun(236, 22, 9)}${birds(140, 20)}${picado(20, 9, 270)}<path d="M0,100 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,100 H270" stroke-width="1.6"/>${[[40, 110, 1], [80, 112, 0.9], [120, 110, 1], [160, 112, 0.9], [200, 110, 1], [240, 112, 0.9]].map(([x, y, s], i) => at(x, y, s, i % 2 ? PANMAN : SAMBA)).join('')}`,
	VC: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(80)}${[[30, 84, 40, 16], [90, 80, 60, 22], [160, 84, 36, 14], [220, 82, 50, 18]].map(([x, y, w, h]) => `<path d="M${x - w / 2},${y} Q${x - w / 4},${y - h} ${x},${y - h} Q${x + w / 4},${y - h} ${x + w / 2},${y} Z" ${L3} stroke-width="1.4"/>`).join('')}${[[60, 110, 0.8], [130, 116, 0.7], [200, 108, 0.9]].map(([x, y, s]) => at(x, y, s, YACHT)).join('')}`,
	VG: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 Q40,40 100,46 Q160,40 200,76 L220,86 Z" ${L2} stroke-width="1.6"/>${seaW(86)}<path d="M40,96 Q135,86 230,98 V108 Q135,100 40,108 Z" ${SNOW} stroke-width="1.4"/>${[60, 100, 170, 200].map((x) => palm(x, 100, 24, 3)).join('')}${[[80, 120, 0.8], [150, 124, 0.7]].map(([x, y, s]) => at(x, y, s, SAIL)).join('')}${at(130, 98, 0.6, BEACHBAR)}`,
	VI: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 Q40,40 120,40 Q200,40 270,80 V90 H0 Z" ${L2} stroke-width="1.6"/>${Array.from({ length: 16 }, (_, i) => {
		const x = 10 + i * 16,
			y = 86 - Math.round(36 * Math.sin((i / 15) * Math.PI)) + (i % 2) * 10;
		return `<path d="M${x},${y} V${y - 8} H${x + 12} V${y}" ${[SNOW, L1][i % 2]} stroke-width="1"/><path d="M${x - 1},${y - 8} L${x + 6},${y - 13} L${x + 13},${y - 8} Z" ${SOLID}/>`;
	}).join('')}${seaW(92)}${at(150, 120, 1.1, `<path d="M-40,0 H40 L34,8 H-34 Z" ${SNOW} stroke-width="1"/><path d="M-30,0 V-10 H30 V0 M-20,-10 V-18 H20 V-10" ${SNOW} stroke-width="1"/>`)}`,
	GP: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M40,80 L110,20 Q120,14 130,20 L200,80" ${L2} stroke-width="1.6"/><path d="M116,16 q-4,-8 2,-12" stroke-width="1.4"/><path d="M0,80 Q135,70 270,82 V132 H0 Z" ${L1} stroke-width="1.6"/>
${Array.from({ length: 14 }, (_, i) => {
		const x = 10 + i * 19,
			y = 108 + (i % 2) * 8;
		return `<path d="M${x},${y} V${y - 16}" stroke-width="2"/><path d="M${x},${y - 16} q-10,-4 -14,6 M${x},${y - 16} q10,-4 14,6 M${x},${y - 16} q-4,-10 0,-14" stroke-width="1.8"/>`;
	}).join('')}`,
	MQ: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(84)}<path d="M0,102 Q135,92 270,104 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[20, 50, 80, 200, 230, 255].map((x, i) => palm(x, 110, 40 + (i % 2) * 10, i < 3 ? 8 : -8)).join('')}${at(140, 114, 0.8, BEACHBAR)}`,
	BQ: () => `<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,40 H270" stroke-width="1.6"/>${at(200, 34, 0.8, CATAMARAN)}<path d="M180,40 Q210,30 250,40" ${L3} stroke-width="1.2"/><path d="M0,110 Q40,96 80,104 Q120,90 160,104 Q200,94 270,108 V132 H0 Z" ${L3} stroke-width="1.6"/>
${[[30, 104], [70, 100], [190, 100], [240, 104]].map(([x, y]) => `<path d="M${x},${y} Q${x - 4},${y - 14} ${x - 10},${y - 20} M${x},${y} Q${x + 4},${y - 16} ${x + 10},${y - 22} M${x},${y} V${y - 18}" stroke-width="2"/>`).join('')}${at(130, 70, 1.4, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M0,-3 L4,6 L10,12 M4,6 L-2,12 M-2,-2 L-8,-6" stroke-width="2"/>`)}${Array.from({ length: 6 }, (_, i) => at(60 + i * 26, 60 + (i % 2) * 14, 0.6, `<path d="M-10,0 Q0,-8 10,0 Q0,4 -10,0 Z" ${SOLID}/><path d="M10,0 l6,-4 v8 Z" ${SOLID}/>`)).join('')}`,
	GF: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 Q30,80 60,88 Q90,74 120,86 Q160,76 200,88 Q240,80 270,90 V132 H0 Z" ${L2} stroke-width="1.6"/>${at(140, 96, 1, `<path d="M-30,0 V-60 H-24 V0 M24,0 V-60 H30 V0 M-30,-20 H30 M-30,-40 H30" stroke-width="1.6"/><path d="M0,-80 Q6,-70 6,-56 V-20 H-6 V-56 Q-6,-70 0,-80 Z" ${SNOW} stroke-width="1.3"/><path d="M-12,-50 V-24 H-8 V-50 Z M12,-50 V-24 H8 V-50 Z" ${SNOW} stroke-width="1"/>`)}<path d="M0,110 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,110 H270" stroke-width="1.6"/>`,
	AU: () => `${sun(236, 22, 9)}${birds(140, 20)}${ULURU(100)}<path d="M0,100 Q135,92 270,102 V132 H0 Z" ${L1} stroke-width="1.6"/>${at(40, 124, 1, KANGAROO)}${at(220, 122, 0.8, KANGAROO)}${grass(100, 124)}${grass(170, 126)}`,
	NZ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M40,80 L120,10 Q128,4 136,10 L220,80" ${L2} stroke-width="1.8"/><path d="M120,10 Q128,4 136,10 L146,26 L134,22 L126,32 L118,22 L108,26 Z" ${SNOW} stroke-width="1.1"/><path d="M0,80 H270 V96 H0 Z" ${L1} stroke="none"/><path d="M0,80 H270" stroke-width="1.4"/>
<path d="M0,96 Q135,88 270,98 V132 H0 Z" ${L2} stroke-width="1.6"/>${Array.from({ length: 24 }, (_, i) => `<path d="M${6 + i * 11},${120 + (i % 3) * 3} V${104 + (i % 4) * 2}" stroke-width="1.2"/><path d="M${6 + i * 11},${104 + (i % 4) * 2} v-10" stroke="${i % 2 ? 'currentColor' : 'var(--stp)'}" stroke-width="3.4" stroke-linecap="round"/>`).join('')}`,
	PF: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M60,80 L100,30 L116,40 L130,20 L150,40 L190,80 Z" ${L3} stroke-width="1.8"/><path d="M0,80 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,80 H270" stroke-width="1.6"/>${[40, 70, 100, 170, 200, 230].map((x) => `<path d="M${x - 8},${100} V${92} H${x + 8} V100" ${L3} stroke-width="1"/><path d="M${x - 11},92 L${x},84 L${x + 11},92 Z" ${SOLID}/><path d="M${x - 6},100 V108 M${x + 6},100 V108" stroke-width="1.2"/>`).join('')}<path d="M30,108 H240" stroke-width="1.6"/><path d="${waves(20, 122, 9, 16, 2)}" stroke="var(--stp)" stroke-width="1.2"/>`,
	FJ: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(80)}${[[50, 84, 70, 20], [140, 82, 50, 26], [220, 86, 60, 18]].map(([x, y, w, h]) => `<path d="M${x - w / 2},${y} Q${x - w / 4},${y - h} ${x},${y - h} Q${x + w / 4},${y - h} ${x + w / 2},${y} Z" ${L3} stroke-width="1.4"/><path d="M${x - w / 2 - 6},${y + 2} H${x + w / 2 + 6}" ${SNOW} stroke-width="3"/>`).join('')}${at(100, 114, 0.9, VAA)}${at(200, 118, 0.7, SAIL)}`,
	WS: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(84)}<path d="M0,102 Q135,94 270,104 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[[60, 112], [110, 110], [160, 112], [210, 110]].map(([x, y]) => at(x, y, 0.9, FALE)).join('')}${palm(20, 116, 40, 6)}${palm(250, 116, 36, -6)}`,
	AS: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,84 Q40,50 90,54 Q130,58 150,84 Z" ${L3} stroke-width="1.6"/>${seaW(84)}<path d="M0,102 Q135,94 270,104 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[40, 80, 200, 240].map((x, i) => palm(x, 110, 36, i % 2 ? -6 : 6)).join('')}<path d="M140,98 Q170,92 200,98" stroke="var(--stp)" stroke-width="2"/>`,
	CK: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M60,84 L90,40 L104,52 L120,24 L140,50 L156,36 L180,60 L210,84 Z" ${L3} stroke-width="1.8"/>${[[80, 70], [130, 60], [180, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" ${L2} stroke="none"/>`).join('')}<path d="M0,84 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,84 H270" stroke-width="1.6"/><path d="M0,112 H270" stroke="var(--stp)" stroke-width="2.4" stroke-dasharray="6 4"/>${at(120, 104, 0.8, SAIL)}${palm(30, 90, 30, 4)}${palm(240, 90, 26, -4)}`,
	GU: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(84)}<path d="M0,100 Q135,90 270,102 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[[100, 50], [118, 66], [136, 40], [154, 58], [172, 46]].map(([x, h], i) => `<path d="M${x - 7},96 V${96 - h} H${x + 7} V96" ${[L1, L2, SNOW][i % 3]} stroke-width="1.1"/>`).join('')}${[30, 60, 210, 240].map((x, i) => palm(x, 110, 36, i % 2 ? -6 : 6)).join('')}`,
	MP: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><ellipse cx="135" cy="84" rx="80" ry="20" ${SNOW} stroke-width="1" stroke-dasharray="4 3"/><ellipse cx="135" cy="84" rx="54" ry="12" ${SNOW} stroke-width="1.4"/>${[110, 130, 150, 166].map((x, i) => palm(x, 84, 26 + (i % 2) * 8, i % 2 ? -4 : 4)).join('')}${at(60, 116, 0.8, CATAMARAN)}${at(220, 112, 0.7, SAIL)}`,
	NC: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,40 H270" stroke-width="1.6"/><path d="M135,104 Q100,80 100,64 Q100,52 116,52 Q130,52 135,64 Q140,52 154,52 Q170,52 170,64 Q170,80 135,104 Z" ${L3} stroke-width="1.6"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 37) % 270}" cy="${50 + ((i * 19) % 76)}" r="2.4" ${L2} stroke="none"/>`).join('')}`,
	NF: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(90)}<path d="M0,40 Q60,30 140,44 L160,132 H0 Z" ${L3} stroke-width="1.8"/><path d="M0,40 Q60,30 140,44" stroke-width="3"/>${Array.from({ length: 9 }, (_, i) => araucaria(10 + i * 15, 42 - Math.round(4 * Math.sin(i)), 30 + (i % 3) * 8)).join('')}<path d="M20,60 V120 M60,56 V124 M100,60 V122" stroke-width="1" stroke-dasharray="6 3"/>`,
	NU: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H110 V132 H0 Z M160,0 H270 V132 H160 Z" ${L3} stroke-width="1.8"/><path d="M20,20 V120 M50,10 V120 M80,20 V120 M190,20 V120 M220,10 V120 M250,20 V120" stroke-width="1" stroke-dasharray="6 3"/><path d="M110,0 H160 V132 H110 Z" ${L1} stroke="none"/>${[[24, 0], [60, 0], [200, 0], [240, 0]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" ${L2} stroke="none"/>`).join('')}
<path d="M110,90 H160 V132 H110 Z" ${L2} stroke="none"/>${at(134, 118, 0.7, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M-10,0 Q0,-4 10,0" stroke-width="2"/>`)}`,
	PN: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 Q30,30 110,26 Q190,30 240,96 Z" ${L2} stroke-width="1.8"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${50 + i * 15},${80 - (i % 3) * 12 - Math.round(20 * Math.sin((i / 9) * Math.PI))} v-8 h10 v8" ${SNOW} stroke-width="1"/>`).join('')}${seaW(96)}${at(200, 120, 0.7, `<path d="M-24,0 Q0,6 24,0 L22,-4 H-22 Z" ${SOLID}/>`)}`,
	WF: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,96 L40,50 L80,64 L120,30 L170,60 L200,46 L240,70 L270,60 V100 Z" ${L2} stroke-width="1.8"/>${seaW(96)}${[[60, 100], [100, 98], [200, 100]].map(([x, y]) => palm(x, y + 4, 26, 4)).join('')}${at(150, 118, 0.9, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>${PERSON.replace('<circle', '<circle transform="translate(0,-2)"')}`)}`,
	FM: () => `<path d="M0,0 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M60,0 L80,90 M150,0 L150,100 M230,0 L210,90" stroke="var(--stp)" stroke-width="10" stroke-opacity=".3"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14 T240,14 T280,14" stroke-width="1.6"/>
${at(130, 100, 1.4, `<path d="M-70,0 L-60,-14 H50 L70,-6 L60,4 H-60 Z" ${SOLID}/><path d="M-30,-14 V-34 M10,-14 V-28 M-40,-34 H-20 M0,-28 H20" stroke-width="2"/><path d="M-50,-8 h6 M-36,-8 h6 M-22,-8 h6 M-8,-8 h6 M6,-8 h6 M20,-8 h6" stroke="var(--paper)" stroke-width="2"/>`)}${coral(30, 132, 24)}${coral(240, 132, 20)}${at(200, 50, 1, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M0,-3 L4,6 L10,12 M4,6 L-2,12 M-2,-2 L-8,-6" stroke-width="2"/>`)}`,
	KI: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M0,60 Q135,40 270,60 V76 Q135,56 0,76 Z" ${SNOW} stroke-width="1.2"/>${[20, 60, 100, 140, 180, 220, 255].map((x, i) => palm(x, 70 - (i % 2) * 4, 22 + (i % 3) * 6, i % 2 ? -4 : 4)).join('')}${[[80, 104, 1], [160, 112, 0.9], [220, 100, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-22,0 Q0,4 22,0 L20,-3 H-20 Z" ${SOLID}/><path d="M-12,4 H12 M-8,0 V6 M8,0 V6" stroke-width="1.2"/><path d="M0,-3 L-4,-30 Q12,-22 16,-4 Z" ${SNOW} stroke-width="1"/>`)).join('')}`,
	MH: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(80)}${[[50, 110, 1], [110, 116, 1.1], [170, 108, 0.9], [230, 114, 0.8]].map(([x, y, s]) => at(x, y, s, `<path d="M-22,0 Q0,4 22,0 L20,-3 H-20 Z" ${SOLID}/><path d="M-12,4 H12 M-8,0 V6 M8,0 V6" stroke-width="1.2"/><path d="M0,-3 Q-18,-24 -6,-44 Q2,-30 14,-34 Q6,-16 0,-3 Z" ${L3} stroke-width="1.2"/>`)).join('')}`,
	NR: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(84)}<path d="M0,102 Q135,94 270,104 V132 H0 Z" ${SNOW} stroke-width="1.6"/>${[[40, 100, 20, 7], [100, 98, 26, 8], [210, 100, 18, 6]].map(([x, y, h, w]) => `<path d="M${x - w},${y} Q${x - w},${y - h * 0.6} ${x - w * 0.4},${y - h} Q${x},${y - h - 3} ${x + w * 0.4},${y - h} Q${x + w},${y - h * 0.6} ${x + w},${y} Z" ${L3} stroke-width="1.4"/>`).join('')}${[150, 180, 250].map((x, i) => palm(x, 108, 34, i % 2 ? -5 : 5)).join('')}`,
	PW: () => `<path d="M0,0 H270 V132 H0 Z" ${L2} stroke="none"/><path d="M0,14 Q20,6 40,14 T80,14 T120,14 T160,14 T200,14 T240,14 T280,14" stroke-width="1.6"/><path d="M0,110 Q30,80 60,90 Q80,70 100,96 V132 H0 Z" ${L4} stroke-width="1.4"/>${[[140, 60, 1.2], [200, 80, 0.9], [170, 100, 0.7]].map(([x, y, s]) => at(x, y, s, SHARK)).join('')}${at(80, 50, 1.1, MANTA)}`,
	SB: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(80)}${[[50, 84, 40, 12], [130, 82, 50, 16], [210, 86, 36, 10]].map(([x, y, w, h]) => `<path d="M${x - w / 2},${y} Q${x - w / 4},${y - h} ${x},${y - h} Q${x + w / 4},${y - h} ${x + w / 2},${y} Z" ${L3} stroke-width="1.4"/>${palm(x, y - 2, h * 2, 3)}`).join('')}${[[90, 112], [120, 118], [160, 110]].map(([x, y]) => at(x, y, 1, DOLPHIN)).join('')}`,
	TO: () => `${sun(236, 22, 9)}${birds(140, 20)}${seaW(84)}${[[30, 84, 50, 16], [100, 82, 60, 20], [180, 84, 40, 14], [240, 86, 44, 16]].map(([x, y, w, h]) => `<path d="M${x - w / 2},${y} Q${x - w / 4},${y - h} ${x},${y - h} Q${x + w / 4},${y - h} ${x + w / 2},${y} Z" ${L3} stroke-width="1.4"/>`).join('')}${[[70, 112, 0.8], [140, 118, 0.7], [210, 108, 0.9]].map(([x, y, s]) => at(x, y, s, YACHT)).join('')}`,
	TV: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M20,66 Q20,20 135,16 Q250,20 250,66 Q250,112 135,116 Q20,112 20,66 Z" ${L2} stroke-width="1.4"/>${Array.from({ length: 22 }, (_, i) => {
		const a = (i / 22) * Math.PI * 2 + 0.2,
			x = 135 + 118 * Math.cos(a),
			y = 66 + 52 * Math.sin(a);
		return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${i % 3 ? 7 : 12}" ry="3" transform="rotate(${f1((a * 180) / Math.PI + 90)} ${f1(x)} ${f1(y)})" ${SOLID}/>`;
	}).join('')}${at(135, 70, 0.9, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>`)}`,
	VU: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/>${[[20, 30], [60, 10], [110, 0], [160, 6], [210, 14], [250, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" ${L2} stroke="none"/>`).join('')}<path d="M40,0 Q50,60 36,132 M230,0 Q220,60 234,132" stroke-width="6"/>
<path d="M40,96 Q135,80 230,96 V132 H40 Z" fill="#7FE7E0" fill-opacity=".55" stroke-width="1.4"/><path d="M60,30 Q90,40 100,70" stroke-width="2"/><path d="M60,30 Q100,30 120,20" stroke-width="3"/>${at(100, 74, 1, `<circle cx="0" cy="-6" r="3" ${SOLID}/><path d="M0,-3 L-2,8 M-4,-6 L0,-14 M-2,8 L-6,14 M-2,8 L2,14" stroke-width="2"/>`)}<path d="M120,104 q6,-6 12,0" stroke="var(--stp)" stroke-width="1.6"/>`,
	AQ: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,70 L40,40 L80,56 L130,30 L180,52 L220,36 L270,56 V80 H0 Z" ${SNOW} stroke-width="1.6"/><path d="M0,80 H270 V132 H0 Z" ${SNOW}/><path d="M0,80 H270" stroke-width="1.4"/>${Array.from({ length: 30 }, (_, i) => at(8 + (i * 37) % 256, 96 + ((i * 13) % 30), 0.6 + ((i * 7) % 4) * 0.08, `<path d="M0,-40 Q-8,-40 -8,-30 Q-12,-14 -8,-2 L-10,0 H10 L8,-2 Q12,-14 8,-30 Q8,-40 0,-40 Z" ${SOLID}/><path d="M-3,-30 Q-8,-16 -5,-3 H4 Q8,-16 4,-30 Q0,-33 -3,-30 Z" ${PAPER}/>`.replace(/-40/g, '-20').replace(/-30/g, '-15').replace(/-16/g, '-8').replace(/-14/g, '-7').replace(/-33/g, '-16'))).join('')}`,
	HM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M60,90 L130,20 Q138,14 146,20 L220,90 Z" ${L2} stroke-width="1.8"/><path d="M130,20 Q138,14 146,20 L154,32 L142,28 L136,38 L128,28 L118,32 Z" ${SNOW} stroke-width="1.1"/><path d="M134,14 q-4,-8 2,-12" stroke-width="1.4"/>${GLACIER(96, 270).replace(/H0 Z/, 'H0 Z')}${seaW(96)}`,
	TF: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,80 L40,50 L80,64 L130,40 L180,60 L220,46 L270,66 V90 H0 Z" ${L2} stroke-width="1.6"/><path d="M0,90 Q135,82 270,92 V132 H0 Z" ${L1} stroke-width="1.6"/>${Array.from({ length: 30 }, (_, i) => at(8 + (i * 37) % 256, 100 + ((i * 13) % 26), 0.5 + ((i * 7) % 4) * 0.06, `<path d="M-5,0 Q-8,-10 -6,-18 Q-4,-24 0,-24 Q4,-24 5,-18 Q8,-10 5,0 Z" ${SOLID}/><path d="M-3,-2 Q-5,-10 -3,-16 Q0,-17 3,-16 Q5,-10 3,-2 Z" ${PAPER}/>`)).join('')}`,
	BV: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M40,96 Q60,70 100,60 L120,40 Q135,30 150,40 L170,60 Q210,70 230,96 Z" ${SNOW} stroke-width="1.8"/><path d="M100,60 L106,90 M150,40 L144,80 M170,60 L180,90" stroke-width="1"/>${seaW(96)}${at(60, 120, 0.4, ICEBERG)}${at(210, 118, 0.5, ICEBERG)}`,
	CC: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M20,70 Q20,30 135,26 Q250,30 250,70 Q250,110 135,114 Q20,110 20,70 Z" ${L2} stroke-width="1.4"/>${Array.from({ length: 16 }, (_, i) => {
		const a = (i / 16) * Math.PI * 2 + 0.3,
			x = 135 + 116 * Math.cos(a),
			y = 70 + 44 * Math.sin(a);
		return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${i % 3 ? 7 : 12}" ry="3" transform="rotate(${f1((a * 180) / Math.PI + 90)} ${f1(x)} ${f1(y)})" ${SOLID}/>`;
	}).join('')}${[[100, 70], [170, 80]].map(([x, y]) => at(x, y, 0.8, KITE)).join('')}`,
	CX: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V70 H0 Z" ${L1} stroke="none"/>${[[20, 50], [70, 40], [130, 46], [190, 40], [250, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24" ${L2} stroke="none"/>`).join('')}<path d="M0,80 H270 V112 H0 Z" ${L3} stroke="none"/><path d="M0,96 H270" stroke="var(--stp)" stroke-width="2" stroke-dasharray="10 8"/>
${Array.from({ length: 26 }, (_, i) => at(8 + (i * 41) % 256, 84 + ((i * 17) % 26), 0.5, `<ellipse cx="0" cy="0" rx="9" ry="6.4" ${SOLID}/><path d="M-6,4 L-12,10 M6,4 L12,10 M-7,-2 L-14,-2 M7,-2 L14,-2" stroke-width="2"/>`)).join('')}<path d="M0,112 Q135,104 270,114 V132 H0 Z" ${L1} stroke-width="1.4"/>`,
	TK: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M40,66 Q40,24 135,20 Q230,24 230,66 Q230,108 135,112 Q40,108 40,66 Z" ${L2} stroke-width="1.4"/>${Array.from({ length: 14 }, (_, i) => {
		const a = (i / 14) * Math.PI * 2 + 0.2,
			x = 135 + 96 * Math.cos(a),
			y = 66 + 46 * Math.sin(a);
		return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${i % 3 ? 7 : 12}" ry="3" transform="rotate(${f1((a * 180) / Math.PI + 90)} ${f1(x)} ${f1(y)})" ${SOLID}/>${i % 4 === 0 ? palm(f1(x), f1(y), 14, 3) : ''}`;
	}).join('')}${at(135, 70, 0.8, `<path d="M-20,0 Q0,4 20,0 L18,-3 H-18 Z" ${SOLID}/>`)}`,
	UM: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/>${[[60, 70, 70, 20], [150, 84, 60, 18], [220, 66, 50, 16]].map(([x, y, w, h]) => `<ellipse cx="${x}" cy="${y}" rx="${w / 2 + 10}" ry="${h / 2 + 6}" ${SNOW} stroke-width="1" stroke-dasharray="3 2"/><ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" ${L3} stroke-width="1.2"/>${palm(x - 8, y, h * 1.8, 4)}${palm(x + 8, y, h * 1.4, -4)}`).join('')}${at(110, 116, 1, ALBATROSS)}`,
	IO: () => `${sun(236, 22, 9)}${birds(140, 20)}<path d="M0,0 H270 V132 H0 Z" ${L1} stroke="none"/><path d="M20,70 Q20,28 135,24 Q250,28 250,70 Q250,112 135,116 Q20,112 20,70 Z" ${L2} stroke-width="1.4"/><path d="M30,70 Q30,40 135,36 Q160,36 200,44 Q240,52 240,70" ${SNOW} stroke-width="6"/>${[40, 80, 120, 160, 200].map((x, i) => palm(x, 46 - Math.round(4 * Math.sin(i)), 18, 3)).join('')}${at(140, 90, 0.9, YACHT)}`
};

/* ---------- Weltwunder (eigene Pass-Seite, Hologramm-Briefmarke): je Wunder ein Bild in 180 × 170 ---------- */
/** Wachturm der Chinesischen Mauer, Fuß (x, y) */
const wtower = (x: number, y: number) =>
	`<path d="M${x - 9},${y + 8} V${y - 14} H${x + 9} V${y + 8} Z" ${SNOW} stroke-width="1.5"/><path d="M${x - 9},${y - 14} v-3 h3 v3 h3 v-3 h3 v3 h3 v-3 h3 v3 h3 v-3" stroke-width="1.2"/><path d="M${x - 2},${y - 8} h4 v6 h-4 Z" ${SOLID}/>`;
export const WONDER: Record<string, () => string> = {
	chichen: () =>
		`${sun(150, 30, 10)}${birds(96, 34)}<path d="M0,130 Q90,122 180,130 V170 H0 Z" ${L1} stroke-width="1.6"/>${palm(10, 140, 40, 6)}${palm(170, 140, 36, -6)}${at(90, 140, 1.3, CHICHEN)}<path d="M0,140 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,140 H180" stroke-width="2"/>${at(150, 162, 0.7, PERSON)}${at(160, 162, 0.6, PERSON)}${grass(24, 160)}${grass(70, 164)}`,
	cristo: () =>
		`${sun(150, 34, 10)}${rays(150, 34, 10)}${birds(112, 50, 0.8)}${SUGARLOAF(152, 124, 1.1)}${sea(124)}<path d="M18,170 L38,112 Q60,72 84,66 L96,66 Q118,76 134,120 L152,170 Z" ${L3} stroke-width="2"/><path d="M60,100 Q70,120 64,150 M110,96 Q104,118 116,146" stroke-width="1.2"/>${at(90, 66, 1.5, CRISTO)}${cloud(4, 104)}`,
	machu: () =>
		`${sun(156, 24, 9)}${at(70, 44, 0.9, CONDOR)}<path d="M0,96 L24,70 L44,82 L70,58 L92,76 L180,64 V132 H0 Z" ${L1} stroke-width="1.6"/><path d="M70,58 L64,68 L71,65 L76,70 Z" ${SNOW} stroke-width="1.2"/>${picchu(true)}${cloud(120, 122)}<path d="M0,132 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M0,132 H180" stroke-width="2"/>${at(150, 166, 1, LLAMA, true)}${grass(30, 158)}${grass(90, 164)}`,
	kolosseum: () =>
		`${sun(150, 30, 10)}${birds(70, 42)}<path d="M0,134 Q90,126 180,134 V170 H0 Z" ${L1} stroke-width="2"/>${at(90, 138, 1.2, COLOS)}${cypress(10, 142, 42)}${cypress(172, 142, 36)}<path d="M0,150 H180 V170 H0 Z" ${L2} stroke="none"/><path d="M0,150 H180" stroke-width="1.6"/>${[20, 50, 80, 110, 140, 170].map((x, i) => `<path d="M${x - 8},${158 + (i % 2) * 6} H${x + 8}" stroke-width="1.2"/>`).join('')}`,
	petra: () =>
		`${birds(104, 26, 0.8)}<path d="M0,0 H30 Q50,70 40,170 H0 Z M180,0 H146 Q128,70 140,170 H180 Z" ${L3} stroke-width="1.8"/><path d="M6,40 Q20,46 34,42 M4,80 Q22,88 40,84 M144,50 Q160,56 176,52 M140,96 Q158,102 178,98" stroke-width="1.2"/>${at(90, 150, 1.2, PETRA())}<path d="M0,150 H180 V170 H0 Z" ${L1} stroke="none"/><path d="M36,150 H144" stroke-width="2"/>${at(118, 166, 0.9, CAMEL)}${at(56, 164, 0.6, PERSON)}`,
	mauer: () =>
		`${sun(150, 28, 10)}${birds(96, 36)}<path d="M0,110 L30,84 L56,96 L90,62 L120,84 L150,70 L180,86 V170 H0 Z" ${L1} stroke-width="1.6"/><path d="M30,84 L56,96 L90,62 L120,84" stroke-width="3" stroke-dasharray="2 2"/>${wtower(90, 60).replace(/1\.5/, '1')}
<path d="M0,170 V128 Q30,120 50,104 Q70,90 92,100 Q120,114 140,96 Q160,82 180,90 V170 Z" ${L2} stroke-width="1.8"/>
<path d="M0,128 Q30,120 50,104 Q70,90 92,100 Q120,114 140,96 Q160,82 180,90 V78 Q160,70 140,84 Q120,102 92,88 Q70,78 50,92 Q30,108 0,116 Z" ${SNOW} stroke-width="1.6"/>
<g transform="translate(0,-2)"><path d="M0,116 Q30,108 50,92 Q70,78 92,88 Q120,102 140,84 Q160,70 180,78" stroke-width="4" stroke-dasharray="3 3"/></g>
<path d="M0,122 Q30,114 50,98 Q70,84 92,94 Q120,108 140,90 Q160,76 180,84" stroke-width="1" stroke-dasharray="4 3"/>${wtower(50, 98)}${wtower(140, 90)}${pine(18, 168, 24)}${pine(164, 168, 28)}${pine(100, 168, 18)}`,
	taj: () =>
		`${sun(150, 34, 10)}${birds(70, 42)}<path d="M0,116 H180 V170 H0 Z" ${L1} stroke="none"/>${at(90, 116, 1.25, TAJ)}<path d="M0,116 H180" stroke-width="2"/><path d="M80,116 L66,170 H114 L100,116 Z" ${L3} stroke="none"/><path d="M80,116 L66,170 M100,116 L114,170" stroke-width="1.4"/><g opacity=".45"><path d="M86,124 Q90,118 94,124 V140 H86 Z" ${SNOW} stroke-width="1"/></g>${[[44, 128, 22], [28, 146, 28], [10, 166, 34], [136, 128, 22], [152, 146, 28], [170, 166, 34]].map(([x, y, h]) => cypress(x, y, h)).join('')}`
};
