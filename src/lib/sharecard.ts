import { geoMercator, geoPath } from 'd3-geo';
import { CONT, CONT_NAMES, type ContinentCode } from './countries';
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

/* ---------- Weltkarte (Mercator, ohne Antarktis, oben bei 80° N gekappt), bereiste Länder in Gold ---------- */
const mapCache = new Map<string, { h: number; y0: number; inner: string }>();
/** Karte in der Breite w; liefert die Höhe und das SVG an Position (x, y) */
function worldMap(visited: Set<string>, w: number, on: string, off: string) {
	const key = [...visited].sort().join(',') + `|${w}|${on}|${off}`;
	let m = mapCache.get(key);
	if (!m) {
		m = buildMap(visited, w, on, off);
		if (mapCache.size > 4) mapCache.clear();
		mapCache.set(key, m);
	}
	const { h, y0, inner } = m;
	return { h, at: (x: number, y: number) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 ${y0} ${w} ${h}">${inner}</svg>` };
}
function buildMap(visited: Set<string>, w: number, on: string, off: string) {
	const lod = getLod('v1')!;
	// Mercator eng an die Landmassen: höher als eine Weltkarte mit gebogenen Rändern, Karte wird größer
	const land = lod.feats.filter((f) => f.id !== 'AQ');
	const proj = geoMercator().fitWidth(w, { type: 'FeatureCollection', features: land } as never);
	const [[, b0], [, y1]] = geoPath(proj).bounds({ type: 'FeatureCollection', features: land } as never);
	// hohe Arktis (Nordgrönland, Inseln) kostet viel Höhe: bei 80° N abschneiden
	const y0 = Math.max(b0, proj([0, 80])![1]);
	proj.clipExtent([[-1, y0], [w + 1, y1 + 1]]);
	const path = geoPath(proj).digits(1);
	let v = '',
		o = '',
		dots = '';
	for (const f of land) {
		const d = path(f) ?? '';
		if (visited.has(f.id)) {
			v += d;
			// kleine Länder (Inseln, Zwergstaaten) sonst unsichtbar: Punkt dazu
			const inf = INFO[f.id];
			const p = inf && inf.area < 0.0004 ? proj(inf.c) : null;
			if (p) dots += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="7"/>`;
		} else o += d;
	}
	const h = Math.ceil(y1 - y0);
	return { h, y0: r1(y0), inner: `<path d="${o}" fill="${off}"/><path d="${v}" fill="${on}"/><g fill="${on}">${dots}</g>` };
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
	const nSize = num.length > 2 ? 280 : 330;
	// Rang rechts oben wie in der Stempel-Collage
	const rank = d.rank ? `${d.rank.icon} ${d.rank.name}` : '';
	const rw = tw(rank, 34) + 56;
	// Karte so breit wie möglich direkt unter der Zahl, Werte und Fächer folgen darunter
	// (Karte ist durch die Breite begrenzt: übrige Höhe gleichmäßig über, unter der Karte und unter dem Fächer verteilen)
	const wm = worldMap(visited, 992, G, 'rgba(244,235,211,.14)'),
		mh = wm.h;
	const free = Math.max(0, 1760 - (550 + mh + 44 + 240 + 254)) / 3;
	const my = Math.round(550 + free);
	const sy = Math.round(my + mh + 44 + free);
	// Fächer: seltenster Stempel vorne in der Mitte; alles unterhalb der Werte (nichts verdeckt Zahlen)
	const fy = sy + 240;
	const fan: [number, number, number, number][] = [
		[300, fy, 310, -3],
		[575, fy + 20, 285, 6],
		[66, fy + 36, 265, -8],
		[800, fy + 54, 225, 10]
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
${rank ? `<rect x="${r1(1016 - rw)}" y="96" width="${r1(rw)}" height="60" rx="30" fill="url(#scPill)"/><text x="${r1(1016 - rw / 2)}" y="137" text-anchor="middle" font-family="${FIG}" font-weight="800" font-size="34" fill="#2A1C04">${esc(rank)}</text>` : ''}
<text x="80" y="432" font-family="${UNB}" font-weight="800" font-size="${nSize}" letter-spacing="-14" fill="url(#scGd)">${num}</text>
<text x="92" y="506" font-family="${FIG}" font-weight="700" font-size="46" fill="#F4EBD3">${d.n === 1 ? 'Land' : 'Länder'}<tspan font-weight="500" fill-opacity=".75"> auf ${d.conts.length} ${d.conts.length === 1 ? 'Kontinent' : 'Kontinenten'}</tspan></text>
${wm.at(44, my)}
${stats
	.map(
		([v, l], i) =>
			`<g transform="translate(${96 + i * 304} ${sy})"><rect width="280" height="136" rx="26" fill="#fff" fill-opacity=".06" stroke="${G}" stroke-opacity=".3" stroke-width="2"/><text x="140" y="72" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${v.length > 4 ? 54 : 62}" fill="#F3DC96">${esc(v)}</text><text x="140" y="112" text-anchor="middle" font-family="${FIG}" font-weight="500" font-size="30" fill="#F4EBD3" fill-opacity=".8">${l}</text></g>`
	)
	.join('')}
${top.length ? `<text x="540" y="${sy + 200}" text-anchor="middle" font-family="${FIG}" font-weight="700" font-size="28" letter-spacing="7" fill="${G}">${top.some((s) => s.sp) ? 'SELTENSTE STEMPEL' : 'MEINE STEMPEL'}</text>` : ''}
${order.map(({ s, f: [x, y, w, r] }) => place(s.s, x, y, w, w * 0.82, r, true)).join('')}
<text x="96" y="1862" font-family="${FIG}" font-weight="500" font-size="30" fill="#F4EBD3" fill-opacity=".75">${d.since ? `unterwegs seit ${d.since}` : `${d.n} Stempel im Pass`}</text>
<text x="984" y="1822" text-anchor="end" font-family="${UNB}" font-weight="800" font-size="40" fill="${G}">Freiheit</text>
<text x="984" y="1862" text-anchor="end" font-family="${FIG}" font-weight="500" font-size="26" fill="#F4EBD3" fill-opacity=".75">by Maier Reisen</text>
</svg>`;
}

/* ---------- Variante „Stempel-Collage“: im Stil der App (Startseite + Passseite) ---------- */
const INK = '#0D2B3A',
	MUTED = '#7B6A58',
	LINE = '#E7D9C0',
	CHIP = '#F6E2B4',
	SUN = '#F4B400',
	PRIMARY = '#0E6E74';
function collage(d: ShareData) {
	const all = rarest(d.stamps);
	const n = all.length;
	// Kopf: Marke links, Rang rechts (wie die Rang-Plakette im Pass)
	const rank = d.rank ? `${d.rank.icon} ${d.rank.name}` : '';
	const rw = tw(rank, 34) + 56;
	// große Zahl über dem „Horizont“ wie auf der Startseite
	const num = String(n);
	const nSize = num.length > 2 ? 270 : 320;
	// Kontinente als Chips wie auf der Startseite: „12 Europa“ (nur bereiste, nach Anzahl)
	const per = new Map<ContinentCode, number>();
	for (const c of d.conts) per.set(c, d.stamps.filter((s) => CONT[s.code] === c).length);
	const chips: string[] = [];
	let x = 64,
		y = 746;
	for (const [c, k] of [...per].sort((p, q) => q[1] - p[1])) {
		const label = CONT_NAMES[c],
			kw = tw(String(k), 30, 0.6),
			w = kw + 10 + tw(label, 30) + 44;
		if (x + w > W - 64) {
			x = 64;
			y += 66;
		}
		chips.push(`<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="52" rx="26" fill="${CHIP}"/><text x="${r1(x + 22)}" y="${y + 36}" font-family="${FIG}" font-size="30" fill="${INK}"><tspan font-weight="800">${k}</tspan><tspan font-weight="500" dx="10">${esc(label)}</tspan></text>`);
		x += w + 12;
	}
	// unter dem Horizont: zwei Werte-Kacheln nebeneinander (Platz für jede Länderzahl)
	const tile = (tx: number, v: string, l: string) =>
		`<g transform="translate(${tx} 594)"><rect width="468" height="112" rx="30" fill="#fff" fill-opacity=".72" stroke="${LINE}" stroke-width="2"/><rect x="18" y="18" width="10" height="76" rx="5" fill="${SUN}"/><text x="50" y="74" font-family="${UNB}" font-weight="800" font-size="46" fill="${INK}">${esc(v)}<tspan font-family="${FIG}" font-weight="600" font-size="30" fill="${MUTED}" dx="16">${esc(l)}</tspan></text></g>`;
	const tiles = tile(64, `${d.wonders}/${d.wondersAll}`, 'Weltwunder') + tile(548, String(d.badges), 'Abzeichen');
	// Passseite mit den Stempeln bis fast an den unteren Rand
	const px = 48,
		py = y + 84,
		pw = W - 2 * px,
		ph = H - 44 - py;
	const [cols, rows] = n <= 4 ? [2, 2] : n <= 9 ? [3, 3] : n <= 12 ? [3, 4] : n <= 16 ? [4, 4] : [4, 5];
	const cap = cols * rows;
	const shown = n > cap ? all.slice(0, cap - 1) : all;
	const more = n - shown.length;
	const gx = px + 24,
		gy = py + 84,
		gw = pw - 48,
		gh = ph - 84 - 24;
	const cw = gw / cols,
		ch = gh / rows;
	const cells = shown.map((s, i) => {
		const cx = gx + (i % cols) * cw,
			cy = gy + Math.floor(i / cols) * ch;
		return place(s.s, cx + cw * 0.07, cy + ch * 0.07, cw * 0.86, ch * 0.86, s.s.rot, s.sp > 0);
	});
	if (more) {
		const i = shown.length,
			cx = gx + (i % cols) * cw + cw / 2,
			cy = gy + Math.floor(i / cols) * ch + ch / 2,
			rr = Math.min(cw, ch) * 0.45;
		// Zahl passt auch dreistellig („+235“) in den Kreis, „weitere“ darunter ebenfalls innen
		const label = `+${more}`,
			fs = Math.min(rr * 0.56, (rr * 1.5) / (label.length * 0.82)),
			ws = rr * 0.3;
		cells.push(
			`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rr)}" fill="#fff" fill-opacity=".6" stroke="${LINE}" stroke-width="5" stroke-dasharray="14 10"/><text x="${r1(cx)}" y="${r1(cy + fs * 0.22)}" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${r1(fs)}" fill="${PRIMARY}">${label}</text><text x="${r1(cx)}" y="${r1(cy + rr * 0.5)}" text-anchor="middle" font-family="${FIG}" font-weight="600" font-size="${r1(ws)}" fill="${MUTED}">weitere</text>`
		);
	}
	// Seite: links Bund (kleiner Radius + Schatten nach innen), rechts groß gerundet
	const rl = 20,
		rr2 = 48;
	const page = `M${px + rl} ${py}H${px + pw - rr2}A${rr2} ${rr2} 0 0 1 ${px + pw} ${py + rr2}V${py + ph - rr2}A${rr2} ${rr2} 0 0 1 ${px + pw - rr2} ${py + ph}H${px + rl}A${rl} ${rl} 0 0 1 ${px} ${py + ph - rl}V${py + rl}A${rl} ${rl} 0 0 1 ${px + rl} ${py}Z`;
	return `<svg class="sc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${INK_FILTERS}
<pattern id="scDot" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="2" fill="${LINE}"/></pattern>
<linearGradient id="scBund" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${INK}" stop-opacity=".2"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></linearGradient>
<clipPath id="scPg"><path d="${page}"/></clipPath>
<filter id="scSh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="${INK}" flood-opacity=".28"/></filter>
<filter id="scPgSh" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${INK}" flood-opacity=".18"/></filter>
<style>${STYLE}</style></defs>
<rect width="${W}" height="${H}" fill="#FAF1E1"/>
<text x="64" y="138" font-family="${UNB}" font-weight="800" font-size="54" fill="${INK}">Freiheit</text>
<text x="66" y="182" font-family="${FIG}" font-weight="500" font-size="28" fill="${MUTED}">by Maier Reisen</text>
${rank ? `<rect x="${r1(1016 - rw)}" y="96" width="${r1(rw)}" height="60" rx="30" fill="${SUN}"/><text x="${r1(1016 - rw / 2)}" y="137" text-anchor="middle" font-family="${FIG}" font-weight="700" font-size="34" fill="${INK}">${esc(rank)}</text>` : ''}
<text x="56" y="468" font-family="${UNB}" font-weight="800" font-size="${nSize}" letter-spacing="${-nSize * 0.05}" fill="${INK}">${num}</text>
<text x="64" y="532" font-family="${FIG}" font-weight="600" font-size="42" fill="${INK}">Stempel im Pass</text>
${d.since ? `<text x="1016" y="532" text-anchor="end" font-family="${FIG}" font-weight="500" font-size="32" fill="${MUTED}">unterwegs seit ${d.since}</text>` : ''}
<path d="M64 560H1016" stroke="${SUN}" stroke-width="6" stroke-linecap="round"/>
${tiles}
${chips.join('')}
<path d="${page}" fill="#FFFBF3" stroke="${LINE}" stroke-width="2" filter="url(#scPgSh)"/>
<g clip-path="url(#scPg)"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="url(#scDot)" opacity=".7"/><rect x="${px}" y="${py}" width="34" height="${ph}" fill="url(#scBund)"/></g>
<text x="${px + 48}" y="${py + 58}" font-family="${FIG}" font-weight="700" font-size="24" letter-spacing="4" fill="${MUTED}">STEMPEL</text>
<text x="${px + pw - 40}" y="${py + 58}" text-anchor="end" font-family="${FIG}" font-weight="700" font-size="24" letter-spacing="4" fill="${MUTED}">${more ? 'SELTENSTE ZUERST' : all.some((s) => s.sp) ? 'SELTENSTE ZUERST' : ''}</text>
${cells.join('')}
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
