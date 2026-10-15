import { INK_FILTERS } from './passport';
import { FIG, GLOW_FILTERS, H, STYLE, UNB, W, esc, fitU, place, twU, r1, rarest, toPng, withFonts, worldMap, type ShareStamp } from './sharecard';

/* Teilen-Bild „Mein Reisejahr“ (1080 × 1920, ohne Namen) im Stil des Pass-Umschlags: dunkel mit Gold, große Zahl,
   Weltkarte (neue Länder des Jahres in Gold, früher bereiste heller), drei Werte, seltenste neue Stempel als Fächer.
   Wird erst beim Teilen nachgeladen. */

export interface YearShare {
	year: number;
	/** neue Länder (zählende) – 0: dann steht die Zahl der Flüge groß */
	n: number;
	areas: number;
	/** neue Kontinente (Namen) */
	conts: string[];
	flights: number;
	/** bis zu drei Werte [Wert, Bezeichnung] */
	stats: [string, string][];
	stamps: ShareStamp[];
	fresh: Set<string>;
	prev: Set<string>;
	foot: string;
}

function yearSvg(d: YearShare) {
	const G = '#D9B866';
	const top = rarest(d.stamps).slice(0, 4);
	const big = d.n || !d.flights;
	const num = String(big ? d.n : d.flights);
	const nSize = fitU(num, num.length > 2 ? 280 : 330, 880);
	const what = big ? (d.n === 1 ? 'neues Land' : 'neue Länder') : d.flights === 1 ? 'Flug' : 'Flüge';
	const more = [d.areas ? `+ ${d.areas} ${d.areas === 1 ? 'Gebiet' : 'Gebiete'}` : '', d.conts.length === 1 ? `${d.conts[0]} neu` : d.conts.length ? `${d.conts.length} neue Kontinente` : ''].filter(Boolean).join(' · ');
	const year = String(d.year),
		yw = twU(year, 64) + 64;
	// gleiche Aufteilung wie der Pass-Umschlag; ohne Stempel verteilt sich der Platz auf Karte und Werte
	const wm = worldMap(d.fresh, 992, G, 'rgba(244,235,211,.14)', d.prev, 'rgba(244,235,211,.4)'),
		mh = wm.h;
	const fanH = top.length ? 254 : 0;
	const free = Math.max(0, 1760 - (550 + mh + 44 + (d.stats.length ? 136 : 0) + (top.length ? 104 : 0) + fanH)) / 3;
	const my = Math.round(550 + free);
	const sy = Math.round(my + mh + 44 + free);
	const fy = sy + 240;
	const fan: [number, number, number, number][] = [
		[300, fy, 310, -3],
		[575, fy + 20, 285, 6],
		[66, fy + 36, 265, -8],
		[800, fy + 54, 225, 10]
	];
	const order = top.map((s, i) => ({ s, f: fan[top.length === 1 ? 0 : i] })).reverse();
	// Werte-Kacheln mittig, Breite nach Anzahl
	const k = d.stats.length,
		tw0 = k === 3 ? 280 : 400,
		gap = 24,
		x0 = (W - (k * tw0 + (k - 1) * gap)) / 2;
	return `<svg class="sc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${INK_FILTERS}${GLOW_FILTERS}
<linearGradient id="scBg" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#1D4D55"/><stop offset=".72" stop-color="#0B242B"/></linearGradient>
<radialGradient id="scHi" cx=".2" cy="0" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="scGd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6E3A2"/><stop offset=".6" stop-color="${G}"/><stop offset="1" stop-color="#A9822E"/></linearGradient>
<linearGradient id="scPill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9C7418"/><stop offset=".4" stop-color="#F2D98A"/><stop offset=".7" stop-color="#B88A1E"/><stop offset="1" stop-color="#F7E3A1"/></linearGradient>
<filter id="scSh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".45"/></filter>
<style>${STYLE}</style></defs>
<rect width="${W}" height="${H}" fill="url(#scBg)"/><rect width="${W}" height="${H}" fill="url(#scHi)"/>
<rect x="38" y="38" width="${W - 76}" height="${H - 76}" rx="34" fill="none" stroke="${G}" stroke-opacity=".5" stroke-width="3"/>
<g fill="none" stroke="${G}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><rect x="96" y="106" width="52" height="48" rx="6"/><path d="M96 122h52M110 98v14M134 98v14"/></g>
<text x="170" y="141" font-family="${FIG}" font-weight="700" font-size="30" letter-spacing="9" fill="${G}">MEIN REISEJAHR</text>
<rect x="${r1(1016 - yw)}" y="78" width="${r1(yw)}" height="100" rx="50" fill="url(#scPill)"/><text x="${r1(1016 - yw / 2)}" y="149" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="64" fill="#2A1C04">${year}</text>
<text x="80" y="432" font-family="${UNB}" font-weight="800" font-size="${nSize}" letter-spacing="-14" fill="url(#scGd)">${num}</text>
<text x="92" y="506" font-family="${FIG}" font-weight="700" font-size="46" fill="#F4EBD3">${what}${more ? `<tspan font-weight="500" fill-opacity=".75"> · ${esc(more)}</tspan>` : ''}</text>
${wm.at(44, my)}
${d.stats
	.map(
		([v, l], i) =>
			`<g transform="translate(${r1(x0 + i * (tw0 + gap))} ${sy})"><rect width="${tw0}" height="136" rx="26" fill="#fff" fill-opacity=".06" stroke="${G}" stroke-opacity=".3" stroke-width="2"/><text x="${tw0 / 2}" y="72" text-anchor="middle" font-family="${UNB}" font-weight="800" font-size="${fitU(v, 62, tw0 - 28)}" fill="#F3DC96">${esc(v)}</text><text x="${tw0 / 2}" y="112" text-anchor="middle" font-family="${FIG}" font-weight="500" font-size="30" fill="#F4EBD3" fill-opacity=".8">${esc(l)}</text></g>`
	)
	.join('')}
${top.length ? `<text x="540" y="${sy + 200}" text-anchor="middle" font-family="${FIG}" font-weight="700" font-size="28" letter-spacing="7" fill="${G}">${top.some((s) => s.sp) ? 'SELTENSTE NEUE STEMPEL' : 'NEUE STEMPEL'}</text>` : ''}
${order.map(({ s, f: [x, y, w, r] }) => place(s.s, x, y, w, w * 0.82, r, true)).join('')}
<text x="96" y="1862" font-family="${FIG}" font-weight="500" font-size="30" fill="#F4EBD3" fill-opacity=".75">${esc(d.foot)}</text>
<text x="984" y="1822" text-anchor="end" font-family="${UNB}" font-weight="800" font-size="40" fill="${G}">Freiheit</text>
<text x="984" y="1862" text-anchor="end" font-family="${FIG}" font-weight="500" font-size="26" fill="#F4EBD3" fill-opacity=".75">by Maier Reisen</text>
</svg>`;
}

export async function yearPng(d: YearShare) {
	return toPng(await withFonts(yearSvg(d)));
}
