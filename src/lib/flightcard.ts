import { geoPath } from 'd3-geo';
import { getLod } from './map/geo';
import { FIG, H, UNB, W, esc, fitU, miller, r1, tw, withFonts } from './sharecard';

/* Teilen-Bild des Flugpasses (1080 × 1920, ohne Namen): Nachtblau wie eine Vielflieger-Karte, Akzentfarbe nach Status
   (Blau, Silber, Gold, Platin, Schwarz), große Zahl der Flüge, Weltkarte mit allen Flugbögen, sechs Werte und der
   längste Flug als Bordkarte. Für alle Jahre oder ein einzelnes Jahr (wie der Flighty-Pass). Wird erst beim Teilen nachgeladen. */

export interface FlightShare {
	/** null = alle Jahre */
	year: number | null;
	since: number;
	n: number;
	km: number;
	min: number;
	airports: number;
	countries: number;
	airlines: number;
	earth: string;
	dur: string;
	rank: { icon: string; name: string } | null;
	/** Kartenfarbe 0–5 */
	card: number;
	longest: { a: string; b: string; ca: string; cb: string; km: string; date: string } | null;
	/** Strecken [Länge, Breite] und Anzahl */
	arcs: { a: [number, number]; b: [number, number]; n: number }[];
	/** Flughäfen [Länge, Breite] */
	pts: [number, number][];
}

// Akzent je Kartenfarbe: [hell, mittel, dunkel]
const ACC: [string, string, string][] = [
	['#BFD3EA', '#8FA9C7', '#5E7896'],
	['#B9D6FF', '#6FA2F0', '#3E6FC2'],
	['#F4F8FB', '#C6D1DB', '#8A97A4'],
	['#F6E3A2', '#D9B866', '#A9822E'],
	['#FFFFFF', '#DCE6EE', '#A6B6C4'],
	['#F6E3A2', '#D9B866', '#A9822E']
];
const fmt = (n: number) => Math.round(n).toLocaleString('de-DE');

/** Weltkarte (Miller wie beim Reisepass) mit Flugbögen als Großkreise */
function flightMap(d: FlightShare, w: number, hTarget: number, acc: string) {
	const lod = getLod('v1');
	if (!lod) return { h: 0, svg: (_x: number, _y: number) => '' };
	const fc = { type: 'FeatureCollection', features: lod.feats } as never;
	const SOUTH = -60; // Antarktis weglassen: Bögen brauchen den Platz nicht
	let proj = miller().fitWidth(w, fc);
	const h1 = proj([0, SOUTH])![1] - geoPath(proj).bounds(fc)[0][1];
	proj = miller(hTarget / h1).fitWidth(w, fc);
	const y0 = geoPath(proj).bounds(fc)[0][1],
		y1 = proj([0, SOUTH])![1];
	proj.clipExtent([[-1, y0 - 1], [w + 1, y1]]);
	const path = geoPath(proj).digits(1);
	let land = '';
	for (const f of lod.feats) land += path(f) ?? '';
	const max = Math.max(1, ...d.arcs.map((a) => a.n));
	const arcs = d.arcs
		.map((a) => {
			const p = path({ type: 'LineString', coordinates: [a.a, a.b] } as never);
			return p ? `<path d="${p}" stroke-width="${r1(3 + 5 * Math.sqrt(a.n / max))}"/>` : '';
		})
		.join('');
	const dots = d.pts
		.map((c) => proj(c))
		.filter((p): p is [number, number] => !!p && p[1] >= y0 && p[1] <= y1)
		.map(([x, y]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="7"/>`)
		.join('');
	const h = Math.ceil(y1 - y0);
	return {
		h,
		svg: (x: number, y: number) =>
			`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 ${r1(y0)} ${w} ${h}"><path d="${land}" fill="#fff" fill-opacity=".11"/><g fill="none" stroke="url(#fcArc)" stroke-linecap="round" stroke-opacity=".9">${arcs}</g><g fill="${acc}" stroke="#0A1730" stroke-width="3">${dots}</g></svg>`
	};
}

function card(d: FlightShare) {
	const [hi, mid, lo] = ACC[d.card] ?? ACC[0];
	const black = d.card === 5;
	const rank = d.rank ? `${d.rank.icon} ${d.rank.name}` : '';
	const rw = tw(rank, 34) + 56;
	const num = String(d.n);
	const nSize = fitU(num, num.length > 3 ? 240 : num.length > 2 ? 290 : 330, 880);
	const sub = d.year ? `MEIN FLUGJAHR ${d.year}` : d.since ? `ALLE FLÜGE SEIT ${d.since}` : 'ALLE FLÜGE';
	const m = flightMap(d, 992, 470, hi);
	const my = 660,
		sy = my + m.h + 44;
	const stats: [string, string][] = [
		[`${fmt(d.km)}`, 'Kilometer'],
		[d.dur, 'in der Luft'],
		[d.earth, 'um die Erde'],
		[String(d.airports), d.airports === 1 ? 'Flughafen' : 'Flughäfen'],
		[String(d.countries), d.countries === 1 ? 'Land' : 'Länder'],
		[String(d.airlines), d.airlines === 1 ? 'Airline' : 'Airlines']
	];
	const tiles = stats
		.map(([v, l], i) => {
			const x = 64 + (i % 3) * 324,
				y = sy + Math.floor(i / 3) * 156,
				fs = fitU(v, 58, 264);
			return `<g transform="translate(${x} ${y})"><rect width="304" height="138" rx="24" fill="#fff" fill-opacity=".06" stroke="${mid}" stroke-opacity=".35" stroke-width="2"/><text x="152" y="${r1(66 + fs * 0.12)}" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${fs}" fill="${hi}">${esc(v)}</text><text x="152" y="112" text-anchor="middle" font-family="${FIG}" font-weight="500" font-size="28" fill="#E8EEF5" fill-opacity=".78">${l}</text></g>`;
		})
		.join('');
	// längster Flug als Bordkarte mit Abriss rechts
	const ty = sy + 312 + 24;
	const L = d.longest;
	const ticket = L
		? `<g transform="translate(64 ${ty})">
<path d="M0 22a22 22 0 0 1 22-22H708a18 18 0 0 0 36 0H930a22 22 0 0 1 22 22V156a22 22 0 0 1-22 22H744a18 18 0 0 0-36 0H22a22 22 0 0 1-22-22Z" fill="#F7F9FC"/>
<path d="M726 26V152" stroke="#B8C4D0" stroke-width="3" stroke-dasharray="8 9"/>
<text x="36" y="46" font-family="${FIG}" font-weight="700" font-size="22" letter-spacing="5" fill="#6A7C8E">LÄNGSTER FLUG</text>
<text x="690" y="46" text-anchor="end" font-family="${FIG}" font-weight="600" font-size="24" fill="#6A7C8E">${esc(L.date)}</text>
<text x="36" y="118" font-family="${UNB}" font-weight="800" font-size="62" fill="#0A1730">${esc(L.a)}</text>
<text x="690" y="118" text-anchor="end" font-family="${UNB}" font-weight="800" font-size="62" fill="#0A1730">${esc(L.b)}</text>
<path d="M253 96H473" stroke="${lo}" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"/><g transform="translate(363 96) rotate(90) scale(2.6) translate(-12 -12)"><path d="M21 15.5v-1.6l-8-5V3.6a1.5 1.5 0 0 0-3 0v5.3l-8 5v1.6l8-2.4v5.1l-2 1.5V21l3.5-1 3.5 1v-1.3l-2-1.5v-5.1z" fill="#0A1730" stroke="#F7F9FC" stroke-width="2.5" paint-order="stroke"/></g>
<text x="36" y="156" font-family="${FIG}" font-weight="600" font-size="26" fill="#3C4F63">${esc(L.ca)}</text>
<text x="690" y="156" text-anchor="end" font-family="${FIG}" font-weight="600" font-size="26" fill="#3C4F63">${esc(L.cb)}</text>
<text x="840" y="84" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${fitU(L.km, 40, 184)}" fill="#0A1730">${esc(L.km)}</text>
<text x="840" y="122" text-anchor="middle" font-family="${FIG}" font-weight="600" font-size="24" fill="#6A7C8E">Kilometer</text>
</g>`
		: '';
	return `<svg class="sc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<linearGradient id="fcBg" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${black ? '#22262B' : '#17305A'}"/><stop offset=".75" stop-color="${black ? '#07080A' : '#081428'}"/></linearGradient>
<radialGradient id="fcHi" cx=".85" cy="0" r=".8"><stop offset="0" stop-color="${mid}" stop-opacity=".22"/><stop offset="1" stop-color="${mid}" stop-opacity="0"/></radialGradient>
<linearGradient id="fcNum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
<linearGradient id="fcPill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lo}"/><stop offset=".45" stop-color="${hi}"/><stop offset=".7" stop-color="${mid}"/><stop offset="1" stop-color="${hi}"/></linearGradient>
<linearGradient id="fcArc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="${hi}"/></linearGradient>
<pattern id="fcDot" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="1.6" fill="#fff" fill-opacity=".07"/></pattern>
<style></style></defs>
<rect width="${W}" height="${H}" fill="url(#fcBg)"/><rect width="${W}" height="${H}" fill="url(#fcDot)"/><rect width="${W}" height="${H}" fill="url(#fcHi)"/>
<rect x="38" y="38" width="${W - 76}" height="${H - 76}" rx="34" fill="none" stroke="${mid}" stroke-opacity=".45" stroke-width="3"/>
<path transform="translate(92 100) scale(2.2)" d="M21 15.5v-1.6l-8-5V3.6a1.5 1.5 0 0 0-3 0v5.3l-8 5v1.6l8-2.4v5.1l-2 1.5V21l3.5-1 3.5 1v-1.3l-2-1.5v-5.1z" fill="${mid}"/>
<text x="160" y="141" font-family="${FIG}" font-weight="700" font-size="30" letter-spacing="9" fill="${mid}">FLUGPASS</text>
${rank ? `<rect x="${r1(1016 - rw)}" y="96" width="${r1(rw)}" height="60" rx="30" fill="url(#fcPill)"/><text x="${r1(1016 - rw / 2)}" y="137" text-anchor="middle" font-family="${FIG}" font-weight="800" font-size="34" fill="#0A1730">${esc(rank)}</text>` : ''}
<text x="96" y="262" font-family="${FIG}" font-weight="700" font-size="30" letter-spacing="7" fill="#E8EEF5" fill-opacity=".8">${esc(sub)}</text>
<text x="80" y="540" font-family="${UNB}" font-weight="800" font-size="${nSize}" letter-spacing="-12" fill="url(#fcNum)">${num}</text>
<text x="92" y="612" font-family="${FIG}" font-weight="700" font-size="46" fill="#F2F5F9">${d.n === 1 ? 'Flug' : 'Flüge'}</text>
${m.svg(44, my)}
${tiles}
${ticket}
<text x="96" y="1862" font-family="${FIG}" font-weight="500" font-size="30" fill="#E8EEF5" fill-opacity=".75">${d.card ? `Karte ${['', 'Blau', 'Silber', 'Gold', 'Platin', 'Schwarz'][d.card]}` : ''}</text>
<text x="984" y="1822" text-anchor="end" font-family="${UNB}" font-weight="800" font-size="40" fill="${mid}">Freiheit</text>
<text x="984" y="1862" text-anchor="end" font-family="${FIG}" font-weight="500" font-size="26" fill="#E8EEF5" fill-opacity=".75">by Maier Reisen</text>
</svg>`;
}

/** fertiges SVG (mit eingebetteten Schriften) */
export const flightCardSvg = (d: FlightShare) => withFonts(card(d));
