import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { CONT_NAMES, type ContinentCode } from './countries';
import { getLod, INFO } from './map/geo';
import { INK_FILTERS, type Stamp } from './passport';

/* Teilen-Karte des Reisepasses: ein Bild im Hochformat (1080 × 1920, passend für Story/Status), ohne Namen.
   Zwei Varianten: „Pass-Umschlag“ (dunkel mit Gold, Weltkarte, seltenste Stempel) und „Stempel-Collage“ (Passpapier
   mit den Stempeln, seltenste zuerst, Rest als „+ N weitere“). Die Karte wird als ein SVG gebaut (Schriften eingebettet)
   und dann zu PNG gezeichnet – Vorschau und geteiltes Bild sind dasselbe Bild. Wird erst beim Teilen nachgeladen. */

export interface ShareStamp {
	code: string;
	nr: number;
	sp: number;
	s: Stamp;
}
export interface ShareData {
	n: number;
	rank: { icon: string; name: string } | null;
	conts: ContinentCode[];
	since: number;
	area: number | null;
	wonders: number;
	wondersAll: number;
	badges: number;
	stamps: ShareStamp[];
}
export type Variant = 'cover' | 'collage';

const W = 1080,
	H = 1920;
const UNB = `'Unbounded','Arial Black',system-ui,sans-serif`,
	FIG = `'Figtree',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (v: number) => Math.round(v * 10) / 10;
/** Stempel immer in den hellen Farben (unabhängig vom Dunkelmodus) */
const STYLE = `.sc{--paper:#FFFDF8;--st-teal:#0E6E74;--st-coral:#D9573B;--st-gold:#B07800;--st-blue:#2F6FB5;--st-plum:#7A3E8E;--st-green:#2E7D4F;--st-red:#C0392B;--st-navy:#1F3F6E;--st-brown:#9A4F1E;--stp:#FFFFFF;--stg:#D6A740;--stt:16%;--sv1:#7E8892;--sv2:#DCE3E9;--sv3:#FFFFFF}
.sc-st .d{font-family:${UNB};font-weight:800;fill:currentColor;stroke:none}
.sc-st .t{font-family:${FIG};font-weight:700;fill:currentColor;stroke:none}
.sc-st .k{font-family:${FIG};font-weight:700;fill:var(--paper);stroke:none}
.sc-st .pp{fill:var(--stp);stroke:none}
.sc-st .gd{fill:var(--stg);stroke:none}
.sc-st .pic{--paper:color-mix(in srgb,currentColor var(--stt),var(--stp))}
.sc-st .bg{fill:var(--paper);stroke:none}
.sc-st .v{font-family:${UNB};font-weight:800;fill:currentColor;stroke:var(--paper);stroke-width:6px;paint-order:stroke}`;

/** Als Bild gilt strenges XML: Stempel-SVG einmal über den HTML-Parser lesen und sauber ausgeben
   (z. B. doppelte Attribute in Szenen, die im Dokument nicht stören) */
const xmlCache = new Map<string, string>();
function xml(svg: string) {
	let out = xmlCache.get(svg);
	if (!out) {
		const t = document.createElement('template');
		t.innerHTML = svg;
		out = new XMLSerializer().serializeToString(t.content.firstElementChild!).replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, '');
		if (xmlCache.size > 300) xmlCache.clear();
		xmlCache.set(svg, out);
	}
	return out;
}

/** Stempel in ein Feld (x, y, w, h) setzen, gedreht um seine Mitte */
function place(s: Stamp, x: number, y: number, w: number, h: number, rot: number, shadow = false) {
	const svg = xml(s.svg).replace(/^<svg class="pp-stamp([^"]*)"/, `<svg x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" class="sc-st$1"`);
	return `<g transform="rotate(${rot} ${r1(x + w / 2)} ${r1(y + h / 2)})" style="color:${s.color}"${shadow ? ' filter="url(#scSh)"' : ''}>${svg}</g>`;
}
/** seltenste zuerst (Legendary, Epic, Rare), danach in Reihenfolge der Länder */
const rarest = (st: ShareStamp[]) => [...st].sort((a, b) => b.sp - a.sp || a.nr - b.nr);
/** grobe Textbreite (für Pillen und Umbrüche) */
const tw = (s: string, size: number, k = 0.56) => [...s].reduce((w, ch) => w + (/\p{Extended_Pictographic}/u.test(ch) ? 1.15 : /[A-ZÄÖÜ]/.test(ch) ? k * 1.18 : k), 0) * size;

/* ---------- Weltkarte (Natural Earth, ohne Antarktis), bereiste Länder in Gold ---------- */
const mapCache = new Map<string, string>();
function worldMap(visited: Set<string>, x: number, y: number, w: number, on: string, off: string) {
	const key = [...visited].sort().join(',') + `|${x}|${y}|${w}|${on}`;
	const hit = mapCache.get(key);
	if (hit) return hit;
	const lod = getLod('v1')!;
	const proj = geoNaturalEarth1().fitWidth(w, { type: 'Sphere' });
	const path = geoPath(proj).digits(1);
	let v = '',
		o = '',
		dots = '';
	for (const f of lod.feats) {
		if (f.id === 'AQ') continue;
		const d = path(f) ?? '';
		if (visited.has(f.id)) {
			v += d;
			// kleine Länder (Inseln, Zwergstaaten) sonst unsichtbar: Punkt dazu
			const inf = INFO[f.id];
			const p = inf && inf.area < 0.0004 ? proj(inf.c) : null;
			if (p) dots += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="7"/>`;
		} else o += d;
	}
	const h = Math.round((w / 1.95) * 0.86); // Natural Earth ≈ 1,95 : 1, unten ohne Antarktis
	const out = `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${o}" fill="${off}"/><path d="${v}" fill="${on}"/><g fill="${on}">${dots}</g></svg>`;
	if (mapCache.size > 4) mapCache.clear();
	mapCache.set(key, out);
	return out;
}

/* ---------- Variante „Pass-Umschlag“ ---------- */
function cover(d: ShareData, visited: Set<string>) {
	const G = '#D9B866';
	const top = rarest(d.stamps).slice(0, 4);
	const stats = [
		[d.area !== null ? `${d.area} %` : String(d.conts.length), d.area !== null ? 'der Landfläche' : 'Kontinente'],
		[`${d.wonders}/${d.wondersAll}`, 'Weltwunder'],
		[String(d.badges), 'Abzeichen']
	];
	const num = String(d.n);
	const nSize = num.length > 2 ? 300 : 360;
	const rank = d.rank ? `${d.rank.icon} ${d.rank.name}` : '';
	const rw = tw(rank, 40) + 72;
	// Fächer: seltenster Stempel vorne in der Mitte; alles unterhalb der Werte (nichts verdeckt Zahlen)
	const fan: [number, number, number, number][] = [
		[300, 1468, 310, -3],
		[575, 1488, 285, 6],
		[66, 1504, 265, -8],
		[800, 1522, 225, 10]
	];
	const order = top.map((s, i) => ({ s, f: fan[top.length === 1 ? 0 : i] })).reverse();
	return `<svg class="sc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${INK_FILTERS}
<linearGradient id="scBg" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#1D4D55"/><stop offset=".72" stop-color="#0B242B"/></linearGradient>
<radialGradient id="scHi" cx=".2" cy="0" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="scGd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6E3A2"/><stop offset=".6" stop-color="${G}"/><stop offset="1" stop-color="#A9822E"/></linearGradient>
<linearGradient id="scPill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9C7418"/><stop offset=".4" stop-color="#F2D98A"/><stop offset=".7" stop-color="#B88A1E"/><stop offset="1" stop-color="#F7E3A1"/></linearGradient>
<filter id="scSh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".45"/></filter>
<style>${STYLE}</style></defs>
<rect width="${W}" height="${H}" fill="url(#scBg)"/><rect width="${W}" height="${H}" fill="url(#scHi)"/>
<rect x="38" y="38" width="${W - 76}" height="${H - 76}" rx="34" fill="none" stroke="${G}" stroke-opacity=".5" stroke-width="3"/>
<g fill="none" stroke="${G}" stroke-width="5"><circle cx="122" cy="130" r="26"/><ellipse cx="122" cy="130" rx="11" ry="26"/><path d="M96 130h52"/></g>
<text x="170" y="141" font-family="${FIG}" font-weight="700" font-size="30" letter-spacing="9" fill="${G}">REISEPASS</text>
<text x="984" y="141" text-anchor="end" font-family="${FIG}" font-weight="700" font-size="30" letter-spacing="9" fill="${G}">FREIHEIT</text>
${rank ? `<rect x="88" y="206" width="${r1(rw)}" height="68" rx="34" fill="url(#scPill)"/><text x="${r1(88 + rw / 2)}" y="253" text-anchor="middle" font-family="${FIG}" font-weight="800" font-size="40" fill="#2A1C04">${esc(rank)}</text>` : ''}
<text x="80" y="${rank ? 590 : 540}" font-family="${UNB}" font-weight="800" font-size="${nSize}" letter-spacing="-14" fill="url(#scGd)">${num}</text>
<text x="92" y="${rank ? 668 : 618}" font-family="${FIG}" font-weight="700" font-size="46" fill="#F4EBD3">${d.n === 1 ? 'Land' : 'Länder'}<tspan font-weight="500" fill-opacity=".75"> auf ${d.conts.length} ${d.conts.length === 1 ? 'Kontinent' : 'Kontinenten'}</tspan></text>
${worldMap(visited, 40, 720, 1000, G, 'rgba(244,235,211,.14)')}
${stats
	.map(
		([v, l], i) =>
			`<g transform="translate(${96 + i * 304} 1180)"><rect width="280" height="150" rx="26" fill="#fff" fill-opacity=".06" stroke="${G}" stroke-opacity=".3" stroke-width="2"/><text x="140" y="80" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${v.length > 4 ? 54 : 62}" fill="#F3DC96">${esc(v)}</text><text x="140" y="122" text-anchor="middle" font-family="${FIG}" font-weight="500" font-size="30" fill="#F4EBD3" fill-opacity=".8">${l}</text></g>`
	)
	.join('')}
${top.length ? `<text x="540" y="1420" text-anchor="middle" font-family="${FIG}" font-weight="700" font-size="28" letter-spacing="7" fill="${G}">${top.some((s) => s.sp) ? 'SELTENSTE STEMPEL' : 'MEINE STEMPEL'}</text>` : ''}
${order.map(({ s, f: [x, y, w, r] }) => place(s.s, x, y, w, w * 0.82, r, true)).join('')}
<text x="96" y="1838" font-family="${FIG}" font-weight="500" font-size="30" fill="#F4EBD3" fill-opacity=".75">${d.since ? `unterwegs seit ${d.since}` : `${d.n} Stempel im Pass`}</text>
<text x="984" y="1840" text-anchor="end" font-family="${UNB}" font-weight="800" font-size="40" fill="${G}">Freiheit</text>
</svg>`;
}

/* ---------- Variante „Stempel-Collage“ ---------- */
function collage(d: ShareData) {
	const all = rarest(d.stamps);
	const n = all.length;
	const [cols, rows] = n <= 4 ? [2, 2] : n <= 9 ? [3, 3] : n <= 12 ? [3, 4] : [4, 5];
	const cap = cols * rows;
	const shown = n > cap ? all.slice(0, cap - 1) : all;
	const more = n - shown.length;
	// Kontinente als Chips, umbrechend
	const chips: string[] = [];
	let x = 72,
		y = 392;
	for (const c of ['EU', 'AS', 'AF', 'NA', 'SA', 'OC', 'AN'] as ContinentCode[]) {
		const label = CONT_NAMES[c],
			on = d.conts.includes(c),
			w = tw(label, 30) + 44;
		if (x + w > W - 72) {
			x = 72;
			y += 64;
		}
		chips.push(`<g opacity="${on ? 1 : 0.4}"><rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="50" rx="25" fill="#E1ECEE"/><text x="${r1(x + w / 2)}" y="${y + 35}" text-anchor="middle" font-family="${FIG}" font-weight="${on ? 700 : 500}" font-size="30" fill="#0D2B3A">${esc(label)}</text></g>`);
		x += w + 12;
	}
	const gx = 56,
		gy = y + 84,
		gw = W - 2 * gx,
		gh = 1740 - gy;
	const cw = gw / cols,
		ch = gh / rows;
	const cells = shown.map((s, i) => {
		const cx = gx + (i % cols) * cw,
			cy = gy + Math.floor(i / cols) * ch;
		return place(s.s, cx + cw * 0.06, cy + ch * 0.06, cw * 0.88, ch * 0.88, s.s.rot, s.sp > 0);
	});
	if (more) {
		const i = shown.length,
			cx = gx + (i % cols) * cw + cw / 2,
			cy = gy + Math.floor(i / cols) * ch + ch / 2,
			rr = Math.min(cw, ch) * 0.38;
		cells.push(
			`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rr)}" fill="none" stroke="#0E6E74" stroke-width="4" stroke-dasharray="12 10"/><text x="${r1(cx)}" y="${r1(cy + 6)}" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${more > 99 ? 46 : 54}" fill="#0E6E74">+${more}</text><text x="${r1(cx)}" y="${r1(cy + 48)}" text-anchor="middle" font-family="${FIG}" font-weight="700" font-size="28" fill="#587080">weitere</text>`
		);
	}
	const num = String(d.n);
	const nSize = num.length > 2 ? 200 : 250;
	const rank = d.rank ? `${d.rank.icon} ${d.rank.name}` : '';
	const rw = tw(rank, 34) + 56;
	return `<svg class="sc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${INK_FILTERS}
<pattern id="scDot" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="24" cy="24" r="2.6" fill="#D5DFE4"/></pattern>
<filter id="scSh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0D2B3A" flood-opacity=".28"/></filter>
<style>${STYLE}</style></defs>
<rect width="${W}" height="${H}" fill="#FFFDF8"/><rect width="${W}" height="${H}" fill="url(#scDot)"/>
<text x="64" y="${num.length > 2 ? 300 : 320}" font-family="${UNB}" font-weight="800" font-size="${nSize}" letter-spacing="-10" fill="#0E6E74">${num}</text>
<text x="1008" y="150" text-anchor="end" font-family="${FIG}" font-weight="700" font-size="44" fill="#0D2B3A">${d.n === 1 ? 'Land bereist' : 'Länder bereist'}</text>
${d.since ? `<text x="1008" y="200" text-anchor="end" font-family="${FIG}" font-weight="500" font-size="34" fill="#587080">seit ${d.since}</text>` : ''}
${rank ? `<rect x="${r1(1008 - rw)}" y="232" width="${r1(rw)}" height="60" rx="30" fill="#F4B400"/><text x="${r1(1008 - rw / 2)}" y="273" text-anchor="middle" font-family="${FIG}" font-weight="800" font-size="34" fill="#0D2B3A">${esc(rank)}</text>` : ''}
${chips.join('')}
${cells.join('')}
<path d="M64 1786H1016" stroke="#0D2B3A" stroke-width="3"/>
<text x="64" y="1852" font-family="${FIG}" font-weight="600" font-size="32" fill="#587080">${d.wonders}/${d.wondersAll} Weltwunder · ${d.badges} Abzeichen</text>
<text x="1016" y="1854" text-anchor="end" font-family="${UNB}" font-weight="800" font-size="44" fill="#0D2B3A">Freiheit</text>
</svg>`;
}

/* ---------- Schriften einbetten (ein Bild darf keine Schriften nachladen) ---------- */
const FONTS: [string, number][] = [
	['Unbounded', 800],
	['Figtree', 500],
	['Figtree', 600],
	['Figtree', 700],
	['Figtree', 800]
];
const fontCache = new Map<string, Promise<string>>();
const b64 = (buf: ArrayBuffer) => {
	let s = '';
	const u = new Uint8Array(buf);
	for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
	return btoa(s);
};
/** Nur die benötigten Zeichen laden (Google Fonts „text=“): klein und schnell; ohne Netz bleibt die Systemschrift */
function fontCss(text: string) {
	const chars = [...new Set(text + '0123456789 %/+·')].filter((c) => !/\p{Extended_Pictographic}/u.test(c)).sort().join('');
	let p = fontCache.get(chars);
	if (!p) {
		const one = async ([fam, w]: [string, number]) => {
			const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${fam}:wght@${w}&text=${encodeURIComponent(chars)}`)).text();
			const m = css.match(/url\((https:[^)]+)\)\s*format\('([^']+)'\)/);
			if (!m) return '';
			const buf = await (await fetch(m[1])).arrayBuffer();
			const mime = m[2] === 'woff2' ? 'font/woff2' : m[2] === 'woff' ? 'font/woff' : 'font/ttf';
			return `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:${mime};base64,${b64(buf)}) format('${m[2]}')}`;
		};
		p = Promise.race([
			Promise.all(FONTS.map((f) => one(f).catch(() => ''))).then((a) => a.join('')),
			new Promise<string>((r) => setTimeout(() => r(''), 5000))
		]);
		p.then((css) => { if (!css) fontCache.delete(chars); });
		fontCache.set(chars, p);
	}
	return p;
}
const textOf = (svg: string) =>
	svg
		.replace(/<style>[\s\S]*?<\/style>/g, '')
		.match(/>([^<]+)</g)
		?.join('')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>') ?? '';

/** fertiges SVG der Karte (mit eingebetteten Schriften) */
export async function cardSvg(d: ShareData, v: Variant) {
	const svg = v === 'cover' ? cover(d, new Set(d.stamps.map((s) => s.code))) : collage(d);
	const css = await fontCss(textOf(svg));
	return css ? svg.replace('<style>', `<style>${css}`) : svg;
}

/** SVG → PNG (1080 × 1920) */
export async function toPng(svg: string): Promise<Blob> {
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
	try {
		const img = new Image();
		img.src = url;
		await img.decode();
		const c = document.createElement('canvas');
		c.width = W;
		c.height = H;
		const g = c.getContext('2d')!;
		g.drawImage(img, 0, 0, W, H);
		// Safari zeichnet eingebettete Schriften manchmal erst beim zweiten Mal
		await new Promise((r) => setTimeout(r, 60));
		g.clearRect(0, 0, W, H);
		g.drawImage(img, 0, 0, W, H);
		return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('PNG'))), 'image/png'));
	} finally {
		URL.revokeObjectURL(url);
	}
}

/** Teilen-Menü des Handys; wo das nicht geht: Bild speichern */
export async function shareImage(png: Blob): Promise<'shared' | 'saved' | 'cancel'> {
	const file = new File([png], 'freiheit-reisepass.png', { type: 'image/png' });
	if (navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file] });
			return 'shared';
		} catch (e) {
			if ((e as Error).name === 'AbortError') return 'cancel';
		}
	}
	const a = document.createElement('a');
	a.href = URL.createObjectURL(png);
	a.download = file.name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(a.href), 4000);
	return 'saved';
}
