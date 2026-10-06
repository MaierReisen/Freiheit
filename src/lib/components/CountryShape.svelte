<script lang="ts">
	import { geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo';
	import { shapeOf } from '$lib/map/geo';
	import { fmtHeight, loadWater, type Facts, type Water } from '$lib/facts';

	/* Kartenausschnitt des Landes im Stil des Globus: Land hervorgehoben (bereist türkis, sonst hell), Nachbarn gedämpft,
	   dazu die wichtigsten Flüsse und Seen (Natural Earth), Hauptstadt und höchster Berg mit Beschriftung */

	let { code, been = false, facts = null }: { code: string; been?: boolean; facts?: Facts | null } = $props();

	const uid = 'cs' + Math.random().toString(36).slice(2, 8); // eigene ID für den Zuschnitt aufs Land

	const W = 340,
		H = 210;

	let water = $state<Water | null>(null);
	$effect(() => {
		loadWater().then((w) => (water = w));
	});

	const base = $derived.by(() => {
		const s = shapeOf(code);
		if (!s) return null;
		const P = geoOrthographic()
			.rotate([-s.c[0], -s.c[1]])
			.clipAngle(90)
			.fitExtent(
				[
					[26, 20],
					[W - 26, H - 20]
				],
				s.shape
			);
		const path = geoPath(P);
		// Sichtweite in Bogenmaß (für das Vorsortieren der Gewässer)
		const reach = Math.hypot(W, H) / 2 / P.scale() + 0.02;
		return { P, path, s, reach, land: path(s.shape) ?? '', around: path(s.around) ?? '', grat: path(geoGraticule10()) ?? '' };
	});

	/** Linienzug weich zeichnen (Catmull-Rom als Bézier) – Flüsse und Seeufer wirken so natürlicher */
	function smooth(p: [number, number][], closed = false) {
		const n = p.length;
		const at = (i: number) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
		const f = (v: number) => v.toFixed(1);
		let d = `M${f(p[0][0])} ${f(p[0][1])}`;
		for (let i = 0; i < (closed ? n : n - 1); i++) {
			const p0 = at(i - 1),
				p1 = at(i),
				p2 = at(i + 1),
				p3 = at(i + 2);
			d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
		}
		return closed ? d + 'Z' : d;
	}

	type Label = { x: number; y: number; t: string; cls: string; rot?: number; anchor?: 'start' | 'middle' | 'end'; split?: number };
	const inside = (p: [number, number] | null) => !!p && p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H;

	const layers = $derived.by(() => {
		if (!base || !water) return null;
		const { P, path, s, reach } = base;
		const c = s.c;
		const near = (pts: [number, number][]) => {
			const step = Math.max(1, Math.floor(pts.length / 6));
			for (let i = 0; i < pts.length; i += step) if (geoDistance(pts[i], c) < reach) return true;
			return geoDistance(pts[pts.length - 1], c) < reach;
		};
		// Nur die großen, wichtigen Gewässer: Rang-Grenze nach Maßstab (große Länder nur die Hauptströme),
		// dann je Name die sichtbare Länge im Ausschnitt – die längsten fünf Flüsse, die größten vier Seen
		const ppd = (P.scale() * Math.PI) / 180;
		const rankMax = ppd < 4 ? 4 : ppd < 10 ? 5 : ppd < 25 ? 6 : 8;
		const runsOf = (line: [number, number][]) => {
			const out: [number, number][][] = [];
			let cur: [number, number][] = [];
			for (const q of line) {
				const p = geoDistance(q, c) < reach * 1.4 ? (P(q) as [number, number] | null) : null;
				if (!p) {
					if (cur.length > 1) out.push(cur);
					cur = [];
					continue;
				}
				const last = cur[cur.length - 1];
				if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.5) cur.push(p);
			}
			if (cur.length > 1) out.push(cur);
			return out;
		};
		// Länge im Land selbst zählt (Stichproben), Flüsse nur im Nachbarland fallen weg
		const inLand = (q: [number, number]) => geoContains(s.shape, q);
		const byName = new Map<string, { n: string; r: number; runs: [number, number][][]; len: number }>();
		for (const rv of water.rivers) {
			if (!rv.n) continue;
			const parts = rv.c.filter(near);
			if (!parts.length) continue;
			let len = 0;
			for (const part of parts) {
				const step = Math.max(1, Math.floor(part.length / 40));
				for (let i = step; i < part.length; i += step) {
					const a = P(part[i - step]) as [number, number] | null,
						b = P(part[i]) as [number, number] | null;
					if (a && b && inLand(part[i])) len += Math.hypot(b[0] - a[0], b[1] - a[1]);
				}
			}
			const o = byName.get(rv.n) ?? { n: rv.n, r: rv.r, runs: [], len: 0 };
			o.runs.push(...parts.flatMap(runsOf));
			o.len += len;
			o.r = Math.min(o.r, rv.r);
			byName.set(rv.n, o);
		}
		// große Länder nur Hauptströme; gibt es davon kaum welche (z. B. Japan), auch kleinere
		const ranked = [...byName.values()].filter((x) => x.len > 18).sort((a, b) => b.len * (10 - b.r) ** 2 - a.len * (10 - a.r) ** 2);
		const major = ranked.filter((x) => x.r <= rankMax);
		const top = (major.length >= 2 ? major : ranked).slice(0, 5);
		const rivers = top.map((x) => ({ d: x.runs.map((r) => smooth(r)).join(''), w: x.r <= 3 ? 2.1 : x.r <= 5 ? 1.6 : 1.2 }));
		// Beschriftung: längster zusammenhängender Abschnitt im Bild, Text entlang der Richtung dort
		const cand: { n: string; len: number; at: [number, number]; rot: number; r: number }[] = [];
		for (const x of top.slice(0, 3)) {
			let best = { len: 0, at: [0, 0] as [number, number], rot: 0 };
			for (const run of x.runs) {
				let i0 = 0;
				for (let i = 0; i <= run.length; i++) {
					if (i < run.length && inside(run[i])) continue;
					const seg = run.slice(i0, i);
					i0 = i + 1;
					if (seg.length < 3) continue;
					let len = 0;
					for (let k = 1; k < seg.length; k++) len += Math.hypot(seg[k][0] - seg[k - 1][0], seg[k][1] - seg[k - 1][1]);
					if (len <= best.len) continue;
					const mid = Math.floor(seg.length / 2),
						a = seg[Math.max(0, mid - 2)],
						b = seg[Math.min(seg.length - 1, mid + 2)];
					let rot = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
					if (rot > 90) rot -= 180;
					if (rot < -90) rot += 180;
					best = { len, at: seg[mid], rot };
				}
			}
			if (best.len > 40) cand.push({ n: x.n, len: best.len, at: best.at, rot: best.rot, r: x.r });
		}
		// Seen
		const lakeList: { d: string; n: string; at: [number, number]; area: number }[] = [];
		for (const lk of water.lakes) {
			if (lk.r > rankMax + 2) continue;
			const parts = lk.c.filter(near);
			if (!parts.length) continue;
			const g: GeoJSON.Polygon = { type: 'Polygon', coordinates: parts };
			const area = path.area(g);
			if (area < 10) continue;
			// nur Seen im Land oder an seiner Grenze (Bodensee): Uferpunkte und ihr nahes Umfeld prüfen
			const o = 0.08;
			if (!parts.some((ring) => ring.some((q, i) => i % 3 === 0 && [[0, 0], [o, 0], [-o, 0], [0, o], [0, -o]].some(([dx, dy]) => inLand([q[0] + dx, q[1] + dy]))))) continue;
			const rings = parts.flatMap(runsOf).filter((r) => r.length > 2);
			if (!rings.length) continue;
			lakeList.push({ d: rings.map((r) => smooth(r, true)).join(''), n: lk.n, at: path.centroid(g) as [number, number], area });
		}
		lakeList.sort((a, b) => b.area - a.area);
		const lakesTop = lakeList.slice(0, 4);
		const lakes = lakesTop.map((l) => l.d);
		const lakeLabels = lakesTop.filter((l) => l.n && l.area > 120 && inside(l.at));

		// Beschriftungen: Hauptstadt und Berg zuerst, dann große Seen und Flüsse – ohne Überlappung
		const labels: Label[] = [];
		const boxes: [number, number, number, number][] = [];
		const fits = (b: [number, number, number, number]) =>
			b[0] >= 2 && b[2] <= W - 2 && b[1] >= 2 && b[3] <= H - 2 && !boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
		const tw = (t: string, px: number) => t.length * px * 0.56;
		const place = (x: number, y: number, t: string, cls: string, px: number, opts: { rot?: number; center?: boolean; split?: number } = {}) => {
			const w = tw(t, px);
			const gap = cls === 'lb-peak' ? 11 : 7;
			const tries: [number, number, 'start' | 'middle' | 'end'][] = opts.center
				? [[x, y, 'middle']]
				: [
						[x + gap, y + px * 0.35, 'start'],
						[x - gap, y + px * 0.35, 'end'],
						[x, y - gap - 1, 'middle'],
						[x, y + px + gap - 1, 'middle']
					];
			for (const [tx, ty, anchor] of tries) {
				const x0 = anchor === 'start' ? tx : anchor === 'end' ? tx - w : tx - w / 2;
				const b: [number, number, number, number] = opts.rot ? [tx - w / 2 - 2, ty - w / 2, tx + w / 2 + 2, ty + w / 2] : [x0 - 2, ty - px, x0 + w + 2, ty + 3];
				if (opts.rot ? b[0] >= 2 && b[2] <= W - 2 && ty > px && ty < H - 4 && !boxes.some((o) => tx > o[0] - 4 && tx < o[2] + 4 && ty > o[1] - 4 && ty < o[3] + 4) : fits(b)) {
					boxes.push(opts.rot ? [tx - 14, ty - 8, tx + 14, ty + 8] : b);
					labels.push({ x: tx, y: ty, t, cls, rot: opts.rot, anchor, split: opts.split });
					return true;
				}
			}
			return false;
		};
		let cap: [number, number] | null = null,
			peak: [number, number] | null = null;
		if (facts?.capLL) {
			const p = P(facts.capLL) as [number, number] | null;
			if (inside(p)) {
				cap = p;
				boxes.push([p![0] - 5, p![1] - 5, p![0] + 5, p![1] + 5]);
			}
		}
		if (facts?.peakLL && facts.peak) {
			const p = P(facts.peakLL) as [number, number] | null;
			if (inside(p) && (!cap || Math.hypot(p![0] - cap[0], p![1] - cap[1]) > 6)) {
				peak = p;
				boxes.push([p![0] - 8, p![1] - 8, p![0] + 8, p![1] + 8]);
			}
		}
		if (cap && facts?.cap?.[0]) place(cap[0], cap[1], facts.cap[0], 'lb-cap', 11);
		if (peak && facts?.peak) place(peak[0], peak[1] - 1, `${facts.peak[0]} ${fmtHeight(facts.peak[1])}`, 'lb-peak', 9.5, { split: facts.peak[0].length });
		for (const l of lakeLabels.sort((a, b) => b.area - a.area).slice(0, 2)) place(l.at[0], l.at[1], l.n, 'lb-water', 9, { center: true });
		for (const r of cand) place(r.at[0], r.at[1], r.n, 'lb-water', 9, { rot: r.rot, center: true });

		return { rivers, lakes, labels, cap, peak };
	});
</script>

{#if base}
	<svg class="cshape" viewBox="0 0 {W} {H}" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
		<defs>
			<radialGradient id="cs-sea" cx="35%" cy="25%" r="90%">
				<stop offset="0" stop-color="#1D5A7A" />
				<stop offset="1" stop-color="#0C2E45" />
			</radialGradient>
			<clipPath id="{uid}-clip"><path d={base.land} /></clipPath>
			<filter id="cs-glow" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="6" />
			</filter>
		</defs>
		<rect width={W} height={H} fill="url(#cs-sea)" />
		<path d={base.grat} fill="none" stroke="rgba(255,255,255,.07)" stroke-width=".6" />
		<path d={base.around} fill="#4B6F82" stroke="#0D2A3D" stroke-width=".7" stroke-linejoin="round" />
		<path d={base.land} fill={been ? '#34D1BF' : '#F6C445'} opacity=".5" filter="url(#cs-glow)" />
		<path d={base.land} fill={been ? '#34D1BF' : '#DCE9EE'} stroke={been ? '#A0F5E8' : '#FFFFFF'} stroke-width="1.2" stroke-linejoin="round" />
		{#if layers}
			<!-- Gewässer außerhalb des Landes gedämpft, im Land kräftig -->
			{#each [false, true] as inLand (inLand)}
				<g class="cs-water" class:dim={!inLand} clip-path={inLand ? `url(#${uid}-clip)` : undefined}>
					{#each layers.lakes as d, i (i)}<path {d} class="cs-lake" />{/each}
					{#each layers.rivers as r, i (i)}<path d={r.d} class="cs-river" stroke-width={r.w} />{/each}
				</g>
			{/each}
			{#if layers.peak}
				<g class="cs-peak" transform="translate({layers.peak[0].toFixed(1)} {layers.peak[1].toFixed(1)})">
					<circle r="7.5" />
					<path d="M-4.6 2.6l3-5 1.9 3 1.1-1.5 3.2 3.5z" />
				</g>
			{/if}
			{#if layers.cap}
				<circle class="cs-cap" cx={layers.cap[0]} cy={layers.cap[1]} r="4.2" />
				<circle cx={layers.cap[0]} cy={layers.cap[1]} r="1.6" fill="#0A2030" />
			{/if}
			{#each layers.labels as l, i (i)}
				<text
					class="cs-lb {l.cls}"
					x={l.x}
					y={l.y}
					text-anchor={l.anchor ?? 'start'}
					transform={l.rot ? `rotate(${l.rot.toFixed(1)} ${l.x} ${l.y})` : undefined}
					dominant-baseline={l.rot ? 'middle' : undefined}
					>{#if l.split}{l.t.slice(0, l.split)}<tspan class="lb-sub">{l.t.slice(l.split)}</tspan>{:else}{l.t}{/if}</text
				>
			{/each}
		{/if}
	</svg>
{/if}
