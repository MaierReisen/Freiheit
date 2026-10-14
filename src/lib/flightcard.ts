import { geoPath } from 'd3-geo';
import { getLod } from './map/geo';
import { FIG, H, UNB, W, esc, fitU, miller, r1, tw, withFonts, xml } from './sharecard';

/* Teilen-Bild des Flugpasses (1080 × 1920, ohne Namen), zwei Motive wie beim Reisepass:
   „Flugpass“ – Nachtblau wie eine Vielflieger-Karte, Akzentfarbe nach Status (Blau, Silber, Gold, Platin, Schwarz), große Zahl
   der Flüge, Weltkarte mit allen Flugbögen, sechs Werte und die seltensten Bordkarten als Fächer;
   „Bordkarten-Collage“ – alle Bordkarten, seltenste zuerst, Rest als „+ N weitere“.
   Für alle Jahre oder ein einzelnes Jahr (wie der Flighty-Pass). Wird erst beim Teilen nachgeladen. */

/** Bordkarte wie im Flugpass (eine je Strecke) */
export interface ShareTicket {
	a: string;
	b: string;
	ca: string;
	cb: string;
	km: string;
	date: string;
	/** wie oft geflogen */
	n: number;
	nr: number;
	/** Seltenheit 0–3 */
	t: number;
	haul: 'kurz' | 'mittel' | 'lang';
	/** Airline oder Kurz-/Mittel-/Langstrecke */
	air: string;
	/** Farbe des Ziellands und Bilder (innerer SVG-Inhalt, leer bei Common) */
	color: string;
	bg: string;
	bgBox: string;
	stub: string;
}
export type FlightVariant = 'cover' | 'collage';

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
	/** Bordkarten des Zeitraums (in Reihenfolge des Flugpasses) */
	tickets: ShareTicket[];
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
	const m = flightMap(d, 992, 440, hi);
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
	// seltenste Bordkarten als Fächer unter den Werten (wie die seltensten Stempel im Reisepass), seltenste vorne in der Mitte
	const ty = sy + 312 + 22;
	const top = rarest(d.tickets).slice(0, 3);
	const fan: [number, number, number, number][] = [
		[207, ty + 96, 0.7, -1],
		[50, ty + 70, 0.6, -5],
		[459, ty + 80, 0.6, 5]
	];
	const tickets = top.length
		? `<text x="540" y="${ty + 12}" text-anchor="middle" font-family="${FIG}" font-weight="700" font-size="26" letter-spacing="7" fill="${mid}">${top.some((t) => t.t) ? 'SELTENSTE BORDKARTEN' : 'MEINE BORDKARTEN'}</text>` +
			top
				.map((t, i) => ({ t, f: fan[i] }))
				.reverse()
				.map(({ t, f: [x, y, k, r] }) => ticketAt(t, x, y, k, r))
				.join('')
		: '';
	return `<svg class="sc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<linearGradient id="fcBg" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${black ? '#22262B' : '#17305A'}"/><stop offset=".75" stop-color="${black ? '#07080A' : '#081428'}"/></linearGradient>
<radialGradient id="fcHi" cx=".85" cy="0" r=".8"><stop offset="0" stop-color="${mid}" stop-opacity=".22"/><stop offset="1" stop-color="${mid}" stop-opacity="0"/></radialGradient>
<linearGradient id="fcNum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
<linearGradient id="fcPill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lo}"/><stop offset=".45" stop-color="${hi}"/><stop offset=".7" stop-color="${mid}"/><stop offset="1" stop-color="${hi}"/></linearGradient>
<linearGradient id="fcArc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="${hi}"/></linearGradient>
<pattern id="fcDot" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="1.6" fill="#fff" fill-opacity=".07"/></pattern>
${TICKET_DEFS}
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
${tickets}
<text x="96" y="1862" font-family="${FIG}" font-weight="500" font-size="30" fill="#E8EEF5" fill-opacity=".75">${d.card ? `Karte ${['', 'Blau', 'Silber', 'Gold', 'Platin', 'Schwarz'][d.card]}` : ''}</text>
<text x="984" y="1822" text-anchor="end" font-family="${UNB}" font-weight="800" font-size="40" fill="${mid}">Freiheit</text>
<text x="984" y="1862" text-anchor="end" font-family="${FIG}" font-weight="500" font-size="26" fill="#E8EEF5" fill-opacity=".75">by Maier Reisen</text>
</svg>`;
}

/* ---------- Bordkarte als Bild (Grundgröße TW × TH, wird skaliert) ---------- */
const TW = 952,
	TH = 240,
	STUB = 782;
const HAUL_C = { kurz: '#22A39A', mittel: '#3E7BD6', lang: '#D9A13A' };
const TIER_NAME = ['', 'Rare', 'Epic', 'Legendary'];
const TIER_C = ['#A9B6C3', '#2F7FD8', '#7444D8', '#F2D98A'];
const PLANE = 'M21 15.5v-1.6l-8-5V3.6a1.5 1.5 0 0 0-3 0v5.3l-8 5v1.6l8-2.4v5.1l-2 1.5V21l3.5-1 3.5 1v-1.3l-2-1.5v-5.1z';
const STAR = 'M0-10C1-3 3-1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10Z';
/** gemeinsame Verläufe, Maske und Zuschnitt (gelten für alle Bordkarten, weil alle dieselben Grundmaße haben) */
const TICKET_DEFS = `<clipPath id="tkClip"><rect width="${TW}" height="${TH}" rx="26"/></clipPath>
<mask id="tkCut" maskUnits="userSpaceOnUse" x="-10" y="-10" width="${TW + 20}" height="${TH + 20}"><rect x="-10" y="-10" width="${TW + 20}" height="${TH + 20}" fill="#fff"/><circle cx="${STUB}" cy="0" r="18"/><circle cx="${STUB}" cy="${TH}" r="18"/></mask>
<linearGradient id="tkFadeG" x1="1" y1="0" x2="0" y2="0"><stop offset=".25" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="tkFade" maskUnits="userSpaceOnUse" x="0" y="0" width="${STUB}" height="${TH}"><rect width="${STUB}" height="${TH}" fill="url(#tkFadeG)"/></mask>
<linearGradient id="tkS2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A3CC8"/><stop offset=".3" stop-color="#C4B0FF"/><stop offset=".55" stop-color="#8B5CF6"/><stop offset=".75" stop-color="#E4DAFF"/><stop offset="1" stop-color="#7444D8"/></linearGradient>
<linearGradient id="tkS3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C7418"/><stop offset=".3" stop-color="#F2D98A"/><stop offset=".55" stop-color="#B88A1E"/><stop offset=".78" stop-color="#F7E3A1"/><stop offset="1" stop-color="#A57B16"/></linearGradient>
<linearGradient id="tkB2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6A3CC8"/><stop offset=".2" stop-color="#D9CCFF"/><stop offset=".4" stop-color="#8B5CF6"/><stop offset=".6" stop-color="#F1EBFF"/><stop offset=".8" stop-color="#7444D8"/><stop offset="1" stop-color="#C4B0FF"/></linearGradient>
<linearGradient id="tkB3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9C7418"/><stop offset=".35" stop-color="#F2D98A"/><stop offset=".6" stop-color="#B88A1E"/><stop offset=".85" stop-color="#F7E3A1"/><stop offset="1" stop-color="#A57B16"/></linearGradient>
<radialGradient id="tkNavy" cx=".85" cy="0" r="1.2"><stop offset="0" stop-color="#22386A"/><stop offset=".6" stop-color="#0F1E3D"/></radialGradient>
<linearGradient id="tkGoldT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0B8"/><stop offset="1" stop-color="#D6A740"/></linearGradient>
<linearGradient id="tkSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE18C" stop-opacity="0"/><stop offset=".5" stop-color="#FFE18C" stop-opacity=".3"/><stop offset="1" stop-color="#FFE18C" stop-opacity="0"/></linearGradient>
<filter id="tkSh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter>`;
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
/** seltenste zuerst (Legendary, Epic, Rare), danach in Reihenfolge des Flugpasses */
const rarest = (t: ShareTicket[]) => [...t].sort((a, b) => b.t - a.t || a.nr - b.nr);

/** eine Bordkarte in Grundmaßen (Kerben am Abriss ausgeschnitten, Stapel scheint durch) */
function ticket(k: ShareTicket) {
	const gold = k.t === 3;
	const ink = gold ? '#F7E3A1' : '#0A1730',
		mut = gold ? '#C9A960' : '#61758A',
		perf = gold ? '#6B5A2E' : '#C3CEDA',
		paper = gold ? '#0F1E3D' : '#FFFFFF',
		hc = HAUL_C[k.haul],
		pc = gold ? '#E2BE5A' : k.color;
	// Stapel dahinter, wenn mehrfach geflogen
	const stack = [2, 1]
		.filter((i) => k.n > i)
		.map((i) => `<rect x="${i * 12}" y="${i * 11}" width="${TW - i * 24}" height="${TH}" rx="26" fill="${gold ? '#1A2C55' : '#E4EAF2'}" stroke="${gold ? '#9C7418' : k.t === 2 ? '#8B5CF6' : k.t === 1 ? '#2F7FD8' : '#fff'}" stroke-opacity="${k.t ? 1 : 0.4}" stroke-width="3"/>`)
		.join('');
	const bgW = STUB * [0, 0.75, 0.85, 0.9][k.t];
	const bg =
		k.t && k.bg
			? `<g mask="url(#tkFade)" opacity="${[0, 0.24, 0.32, 0.42][k.t]}" style="color:${pc}">${xml(`<svg x="${r1(STUB - bgW)}" y="0" width="${r1(bgW)}" height="${TH}" viewBox="${k.bgBox}" preserveAspectRatio="xMaxYMid slice">${k.bg}</svg>`)}</g>`
			: '';
	const stripe = `<rect width="14" height="${TH}" fill="${k.t === 2 ? 'url(#tkS2)' : gold ? 'url(#tkS3)' : TIER_C[k.t]}"/>`;
	const border =
		k.t === 1 ? `<rect x="3" y="3" width="${TW - 6}" height="${TH - 6}" rx="23" fill="none" stroke="#2F7FD8" stroke-width="6"/>` : k.t ? `<rect x="3" y="3" width="${TW - 6}" height="${TH - 6}" rx="23" fill="none" stroke="url(#tkB${k.t})" stroke-width="6"/>` : '';
	const sx = STUB + (TW - STUB) / 2;
	const stubPic =
		k.t && k.stub
			? `<rect x="${sx - 48}" y="34" width="96" height="84" rx="8" fill="${gold ? '#1A2C55' : paper}"/><rect x="${sx - 48}" y="34" width="96" height="84" rx="8" fill="${gold ? 'none' : pc}" fill-opacity=".16" stroke="${gold ? '#C9A03A' : pc}" stroke-opacity="${gold ? 1 : 0.5}" stroke-width="3"/><g style="color:${pc}">${xml(`<svg x="${sx - 48}" y="34" width="96" height="84" viewBox="10 0 160 170" preserveAspectRatio="xMidYMid slice">${k.stub}</svg>`)}</g>`
			: '';
	const code = k.t
		? ''
		: `<g fill="${ink}" fill-opacity=".75">${[0, 3, 6, 10, 12, 16, 19, 23, 25, 28, 32, 35, 38, 41, 44, 48, 51, 54, 58, 61, 64, 68, 71]
				.map((x, i) => `<rect x="${sx - 36 + x}" y="168" width="${i % 3 === 1 ? 2 : i % 4 === 0 ? 3.5 : 1.5}" height="34"/>`)
				.join('')}</g>`;
	const nrY = k.t ? 160 : 108;
	const meta = [
		['ERSTFLUG', k.date],
		['GEFLOGEN', `${k.n}×`],
		['STRECKE', `${k.km} km`]
	]
		.map(
			([l, v], i) =>
				`<text x="${38 + i * 250}" y="196" font-family="${FIG}" font-weight="700" font-size="16" letter-spacing="2.5" fill="${mut}">${l}</text><text x="${38 + i * 250}" y="224" font-family="${FIG}" font-weight="700" font-size="25" fill="${i === 1 && k.n > 1 ? TIER_C[k.t] === '#A9B6C3' ? ink : TIER_C[k.t] : ink}">${esc(v)}</text>`
		)
		.join('');
	const sparkle = gold
		? `<rect x="0" y="0" width="380" height="${TH}" fill="url(#tkSheen)" transform="translate(300 0) skewX(-12)"/>` +
			[[470, 36, 0.9], [300, 22, 0.6], [560, 138, 0.7], [180, 178, 0.5]].map(([x, y, s]) => `<path d="${STAR}" transform="translate(${x} ${y}) scale(${s})" fill="#FFE7A0"/>`).join('')
		: '';
	return `${stack}<g mask="url(#tkCut)"><g clip-path="url(#tkClip)"><rect width="${TW}" height="${TH}" fill="${gold ? 'url(#tkNavy)' : paper}"/>${bg}${stripe}${sparkle}</g>${border}
<text x="38" y="48" font-family="${FIG}" font-weight="700" font-size="20" letter-spacing="3" fill="${mut}">${esc(cut(k.air.toUpperCase(), 30))}</text>
${k.t ? `<text x="752" y="48" text-anchor="end" font-family="${FIG}" font-weight="800" font-size="20" letter-spacing="4" fill="${TIER_C[k.t]}">${TIER_NAME[k.t].toUpperCase()}</text>` : ''}
<text x="38" y="118" font-family="${UNB}" font-weight="800" font-size="54" fill="${gold ? 'url(#tkGoldT)' : ink}">${esc(k.a)}</text>
<text x="752" y="118" text-anchor="end" font-family="${UNB}" font-weight="800" font-size="54" fill="${gold ? 'url(#tkGoldT)' : ink}">${esc(k.b)}</text>
<path d="M228 98H562" stroke="${perf}" stroke-width="4" stroke-dasharray="1 9" stroke-linecap="round"/>
<g transform="translate(395 98) rotate(90) scale(1.9) translate(-12 -12)"><path d="${PLANE}" fill="${hc}" stroke="${paper}" stroke-width="3" paint-order="stroke"/></g>
<text x="38" y="154" font-family="${FIG}" font-weight="600" font-size="24" fill="${mut}">${esc(cut(k.ca, 22))}</text>
<text x="752" y="154" text-anchor="end" font-family="${FIG}" font-weight="600" font-size="24" fill="${mut}">${esc(cut(k.cb, 22))}</text>
<path d="M38 170H752" stroke="${perf}" stroke-opacity=".6" stroke-width="2"/>
${meta}
<path d="M${STUB} 30V${TH - 30}" stroke="${perf}" stroke-width="3" stroke-dasharray="8 8"/>
${stubPic}
<text x="${sx}" y="${nrY}" text-anchor="middle" font-family="${FIG}" font-weight="700" font-size="17" letter-spacing="2.5" fill="${mut}">NR.</text>
<text x="${sx}" y="${nrY + 44}" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${fitU(String(k.nr), 40, 140)}" fill="${ink}">${k.nr}</text>
${code}</g>`;
}
/** Bordkarte an (x, y) mit Maßstab k, gedreht um ihre Mitte */
const ticketAt = (t: ShareTicket, x: number, y: number, k: number, rot: number) =>
	`<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot} ${r1((TW * k) / 2)} ${r1((TH * k) / 2)}) scale(${k})" filter="url(#tkSh)">${ticket(t)}</g>`;

/* ---------- Motiv „Bordkarten-Collage“: alle Bordkarten wie auf den Seiten des Flugpasses, seltenste zuerst ---------- */
function collage(d: FlightShare) {
	const [hi, mid] = ACC[d.card] ?? ACC[0];
	const PAGE = '#10244A';
	const all = rarest(d.tickets),
		n = all.length;
	const rank = d.rank ? `${d.rank.icon} ${d.rank.name}` : '';
	const rw = tw(rank, 34) + 56;
	const num = String(n);
	const nSize = fitU(num, num.length > 2 ? 270 : 320, 940);
	const cnt = [1, 2, 3].map((t) => all.filter((x) => x.t === t).length);
	const chips = [1, 2, 3]
		.map(
			(t, i) =>
				`<g transform="translate(${64 + i * 324} 600)"><rect width="304" height="96" rx="26" fill="#fff" fill-opacity=".06" stroke="${TIER_C[t]}" stroke-opacity=".7" stroke-width="3"/><rect x="18" y="18" width="10" height="60" rx="5" fill="${t === 2 ? 'url(#tkS2)' : t === 3 ? 'url(#tkS3)' : TIER_C[t]}"/><text x="50" y="64" font-family="${UNB}" font-weight="800" font-size="${fitU(String(cnt[i]), 40, 90)}" fill="#F2F5F9">${cnt[i]}<tspan font-family="${FIG}" font-weight="700" font-size="28" fill="${TIER_C[t]}" dx="14">${TIER_NAME[t]}</tspan></text></g>`
		)
		.join('');
	// Raster: eine Spalte, solange die Karten groß genug bleiben, sonst zwei; was nicht passt, als „+ N weitere“
	const gy = 760,
		avail = H - 60 - gy,
		gap = 18;
	let cols = 1,
		k = Math.min(0.95, (avail - (n - 1) * gap) / Math.max(1, n) / (TH + 11 * 2));
	if (k < 0.6) {
		cols = 2;
		k = (W - 2 * 56 - 24) / 2 / TW;
	}
	const ch = TH * k + 22 * k + gap,
		rows = Math.max(1, Math.floor((avail + gap) / ch)),
		cap = rows * cols;
	const shown = n > cap ? all.slice(0, cap - 1) : all,
		more = n - shown.length;
	const cw = TW * k,
		x0 = (W - cols * cw - (cols - 1) * 24) / 2;
	const cells = shown.map((t, i) => ticketAt(t, x0 + (i % cols) * (cw + 24), gy + Math.floor(i / cols) * ch, k, 0));
	if (more) {
		const i = shown.length,
			x = x0 + (i % cols) * (cw + 24),
			y = gy + Math.floor(i / cols) * ch,
			h = TH * k,
			label = `+${more}`;
		cells.push(
			`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(cw)}" height="${r1(h)}" rx="${r1(26 * k)}" fill="none" stroke="#E6EEF8" stroke-opacity=".3" stroke-width="4" stroke-dasharray="14 10"/><text x="${r1(x + cw / 2)}" y="${r1(y + h / 2 + 4)}" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${r1(fitU(label, h * 0.42, cw * 0.6))}" fill="${hi}">${label}</text><text x="${r1(x + cw / 2)}" y="${r1(y + h / 2 + h * 0.3)}" text-anchor="middle" font-family="${FIG}" font-weight="600" font-size="${r1(h * 0.17)}" fill="#E8EEF5" fill-opacity=".75">weitere</text>`
		);
	}
	const sub = d.year ? `aus ${d.year}` : d.since ? `seit ${d.since}` : '';
	return `<svg class="sc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${TICKET_DEFS}
<linearGradient id="fcBg" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#17305A"/><stop offset=".6" stop-color="${PAGE}"/></linearGradient>
<linearGradient id="fcNum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${hi}"/></linearGradient>
<linearGradient id="fcPill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ACC[d.card]?.[2] ?? '#5E7896'}"/><stop offset=".45" stop-color="${hi}"/><stop offset=".7" stop-color="${mid}"/><stop offset="1" stop-color="${hi}"/></linearGradient>
<pattern id="fcDot" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="1.6" fill="#fff" fill-opacity=".07"/></pattern>
<style></style></defs>
<rect width="${W}" height="${H}" fill="url(#fcBg)"/><rect width="${W}" height="${H}" fill="url(#fcDot)"/>
<text x="64" y="138" font-family="${UNB}" font-weight="800" font-size="54" fill="${mid}">Freiheit</text>
<text x="66" y="182" font-family="${FIG}" font-weight="500" font-size="28" fill="#E8EEF5" fill-opacity=".75">by Maier Reisen</text>
${rank ? `<rect x="${r1(1016 - rw)}" y="96" width="${r1(rw)}" height="60" rx="30" fill="url(#fcPill)"/><text x="${r1(1016 - rw / 2)}" y="137" text-anchor="middle" font-family="${FIG}" font-weight="800" font-size="34" fill="#0A1730">${esc(rank)}</text>` : ''}
<text x="56" y="468" font-family="${UNB}" font-weight="800" font-size="${nSize}" letter-spacing="${-nSize * 0.05}" fill="url(#fcNum)">${num}</text>
<text x="64" y="532" font-family="${FIG}" font-weight="600" font-size="42" fill="#F2F5F9">${n === 1 ? 'Bordkarte' : 'Bordkarten'} im Flugpass</text>
${sub ? `<text x="1016" y="532" text-anchor="end" font-family="${FIG}" font-weight="500" font-size="32" fill="#E8EEF5" fill-opacity=".75">${sub}</text>` : ''}
<path d="M64 560H1016" stroke="${mid}" stroke-width="6" stroke-linecap="round"/>
${chips}
<text x="64" y="740" font-family="${FIG}" font-weight="700" font-size="24" letter-spacing="4" fill="#E8EEF5" fill-opacity=".7">BORDKARTEN</text>
<text x="1016" y="740" text-anchor="end" font-family="${FIG}" font-weight="700" font-size="24" letter-spacing="4" fill="#E8EEF5" fill-opacity=".7">${all.some((t) => t.t) ? 'SELTENSTE ZUERST' : ''}</text>
${cells.join('')}
</svg>`;
}

/** fertiges SVG (mit eingebetteten Schriften) */
export const flightCardSvg = (d: FlightShare, v: FlightVariant = 'cover') => withFonts(v === 'cover' ? card(d) : collage(d));
