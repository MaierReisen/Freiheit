import { geoArea, geoBounds, geoCentroid, geoDistance } from 'd3-geo';
import { patch, toFeatures, type CountryFeature, type CountryGeometry, type Topology } from './lodcore';

/* Länderflächen der Weltkarte und daraus Lage/Größe je Land. Das Ausrechnen (computeInfo) läuft nicht beim Start der
   App, sondern einmalig per `node scripts/build-geoinfo.mjs` → data/geoinfo.json. */

export const wrapLon = (l: number) => ((l + 540) % 360) - 180;

// Tuvalu fehlt in den 50m-Kartendaten: als winzige Fläche um Funafuti ergänzen (wird wie andere Kleinstaaten als Punkt gezeichnet)
export const TUVALU: CountryFeature = {
	type: 'Feature',
	id: 'TV',
	properties: { name: 'Tuvalu' },
	geometry: { type: 'Polygon', coordinates: [[[179.17, -8.56], [179.17, -8.48], [179.23, -8.48], [179.23, -8.56], [179.17, -8.56]]] }
};

export const baseFeatures = (world: Topology) => [...toFeatures(world).filter((f) => f.id).map(patch), TUVALU];

// Lage und Größe jedes Landes (größtes Teilgebiet, damit z. B. Frankreich nicht in Südamerika zentriert wird)
function mainPoly(f: CountryFeature): GeoJSON.Feature | CountryFeature {
	const g = f.geometry;
	if (!g || g.type !== 'MultiPolygon') return f;
	let best: GeoJSON.Polygon | null = null,
		ba = -1;
	for (const c of g.coordinates) {
		const p: GeoJSON.Polygon = { type: 'Polygon', coordinates: c };
		const a = geoArea(p);
		if (a > ba) {
			ba = a;
			best = p;
		}
	}
	return { type: 'Feature', properties: {}, geometry: best! };
}

export type Info = Record<string, { c: [number, number]; size: number; area: number }>;
export type Fc = Record<string, { c: [number, number]; r: number; wLon: number; wLat: number; cLat: number }>;
/** INFO: Mittelpunkt/Größe für Tippen und Hinfliegen, FC: Begrenzungskreis zum Weglassen unsichtbarer Länder */
export function computeInfo(features: CountryFeature[]) {
	const info: Info = {},
		fc: Fc = {};
	// Teile mit derselben ID zusammenfassen (Australien steht zweimal in den Daten: Festland und Ashmore-/Cartierinseln),
	// sonst überschreibt das kleine Teil Mittelpunkt, Größe und Sichtbarkeitsprüfung des Festlands
	const merged = new Map<string, CountryFeature>();
	for (const f of features) {
		const prev = merged.get(f.id);
		if (!prev) {
			merged.set(f.id, f);
			continue;
		}
		const parts = (g: CountryGeometry) => (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]);
		merged.set(f.id, { ...prev, geometry: { type: 'MultiPolygon', coordinates: [...parts(prev.geometry), ...parts(f.geometry)] } });
	}
	merged.forEach((f) => {
		const m = mainPoly(f),
			b = geoBounds(m);
		let dl = b[1][0] - b[0][0];
		if (dl < 0) dl += 360;
		info[f.id] = { c: geoCentroid(m), size: Math.max(dl, b[1][1] - b[0][1]), area: geoArea(f) };
		const B = geoBounds(f);
		let w = B[1][0] - B[0][0];
		if (w < 0) w += 360;
		const c: [number, number] = [wrapLon(B[0][0] + w / 2), (B[0][1] + B[1][1]) / 2];
		let r = 0;
		for (const q of [
			[B[0][0], B[0][1]],
			[B[1][0], B[0][1]],
			[B[0][0], B[1][1]],
			[B[1][0], B[1][1]]
		] as [number, number][])
			r = Math.max(r, geoDistance(c, q));
		fc[f.id] = { c, r, wLon: w / 2, wLat: (B[1][1] - B[0][1]) / 2, cLat: c[1] };
	});
	return { info, fc };
}
