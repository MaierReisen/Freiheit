// Namensplätze der Länder für Globus/Karte → src/lib/data/labels.json
// Je Land der Punkt, der am tiefsten im größten Teilgebiet liegt (Mittelpunkt des größten Innenkreises),
// damit Namen nicht im Meer oder im Nachbarland landen (Kroatien, Chile …), und der Radius dieses Kreises in Grad
// (die App zeigt einen Namen erst, wenn er auf dem Bildschirm in diesen Kreis passt).
// Aufruf: node scripts/build-labels.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';

const topo = JSON.parse(readFileSync('src/lib/data/world-50m.topo.json', 'utf8'));
const feats = feature(topo, topo.objects.countries).features.filter((f) => f.id);

// von Hand: Polargebiete und Formen, bei denen der rechnerische Punkt ungünstig liegt
const MANUAL = { AQ: [[40, -80], 12], IT: [[12.6, 42.7], 1] }; // Italien: Stiefelmitte statt Poebene

const ringArea = (r) => {
	let a = 0;
	for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
	return Math.abs(a / 2);
};
// Längengrade über die Datumsgrenze hinweg zusammenhängend machen (Russland, Fidschi …)
const unwrap = (ring) => {
	const o = [ring[0].slice()];
	for (let i = 1; i < ring.length; i++) {
		let x = ring[i][0];
		const px = o[i - 1][0];
		while (x - px > 180) x -= 360;
		while (x - px < -180) x += 360;
		o.push([x, ring[i][1]]);
	}
	return o;
};

function segDist2(px, py, a, b) {
	let x = a[0],
		y = a[1],
		dx = b[0] - x,
		dy = b[1] - y;
	if (dx || dy) {
		const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
		if (t > 1) (x = b[0]), (y = b[1]);
		else if (t > 0) (x += dx * t), (y += dy * t);
	}
	dx = px - x;
	dy = py - y;
	return dx * dx + dy * dy;
}
// Abstand zum Rand, negativ außerhalb
function dist(x, y, rings) {
	let inside = false,
		m = Infinity;
	for (const r of rings)
		for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
			const a = r[i],
				b = r[j];
			if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
			m = Math.min(m, segDist2(x, y, a, b));
		}
	return (inside ? 1 : -1) * Math.sqrt(m);
}
// „polylabel“ (Mapbox): Raster immer feiner unterteilen, nur Zellen weiterverfolgen, die besser sein können
function polylabel(rings, prec) {
	let x0 = Infinity,
		y0 = Infinity,
		x1 = -Infinity,
		y1 = -Infinity;
	for (const [x, y] of rings[0]) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
	const size = Math.min(x1 - x0, y1 - y0);
	const cell = (x, y, h) => {
		const d = dist(x, y, rings);
		return { x, y, h, d, max: d + h * Math.SQRT2 };
	};
	if (!size) return cell(x0, y0, 0);
	const q = [];
	for (let x = x0; x < x1; x += size) for (let y = y0; y < y1; y += size) q.push(cell(x + size / 2, y + size / 2, size / 2));
	let best = cell((x0 + x1) / 2, (y0 + y1) / 2, 0);
	while (q.length) {
		q.sort((a, b) => b.max - a.max);
		const c = q.shift();
		if (c.d > best.d) best = c;
		if (c.max - best.d <= prec) continue;
		const h = c.h / 2;
		q.push(cell(c.x - h, c.y - h, h), cell(c.x + h, c.y - h, h), cell(c.x - h, c.y + h, h), cell(c.x + h, c.y + h, h));
	}
	return best;
}

const out = {};
// Teile mit derselben ID zusammenfassen (Australien steht zweimal in den Daten)
const polys = new Map();
for (const f of feats) {
	const g = f.geometry;
	if (!g) continue;
	const list = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
	polys.set(f.id, [...(polys.get(f.id) ?? []), ...list]);
}
for (const [id, list] of polys) {
	if (MANUAL[id]) {
		out[id] = MANUAL[id];
		continue;
	}
	// größtes Teilgebiet; Ost-West-Abstände mit cos(Breite) stauchen, damit hohe Breiten nicht verzerrt sind
	const main = list.map((p) => p.map(unwrap)).sort((a, b) => ringArea(b[0]) - ringArea(a[0]))[0];
	const lat0 = main[0].reduce((s, p) => s + p[1], 0) / main[0].length;
	const k = Math.cos((lat0 * Math.PI) / 180);
	const rings = main.map((r) => r.map(([x, y]) => [x * k, y]));
	const b = polylabel(rings, 0.02);
	let lon = b.x / k;
	lon = ((lon + 540) % 360) - 180;
	out[id] = [[+lon.toFixed(2), +b.y.toFixed(2)], +Math.max(0, b.d).toFixed(3)];
}
writeFileSync('src/lib/data/labels.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'Länder');
for (const id of ['RU', 'US', 'CA', 'HR', 'CL', 'NO', 'IT', 'VN', 'FR', 'GB', 'JP', 'NZ', 'GR', 'DE', 'ID', 'FJ', 'AQ']) console.log(id, JSON.stringify(out[id]));
