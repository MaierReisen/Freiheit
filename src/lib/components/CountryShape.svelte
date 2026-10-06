<script lang="ts">
	import { geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo';
	import { shapeOf } from '$lib/map/geo';
	import { fmtHeight, loadWater, type Facts, type Water } from '$lib/facts';

	/* Kartenausschnitt des Landes im Stil des Globus: Land hervorgehoben (bereist türkis, sonst hell), Nachbarn gedämpft,
	   dazu Flüsse und Seen (Natural Earth), Hauptstadt und höchster Berg mit Beschriftung */

	let { code, been = false, facts = null }: { code: string; been?: boolean; facts?: Facts | null } = $props();

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

	type Label = { x: number; y: number; t: string; cls: string; rot?: number; anchor?: 'start' | 'middle' | 'end' };
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
		// Flüsse: sichtbare Länge im Ausschnitt bestimmt Strichstärke und welche beschriftet werden
		const rivers: { d: string; w: number }[] = [];
		const cand: { n: string; len: number; at: [number, number]; rot: number; r: number }[] = [];
		for (const rv of water.rivers) {
			const parts = rv.c.filter(near);
			if (!parts.length) continue;
			const d = path({ type: 'MultiLineString', coordinates: parts });
			if (!d) continue;
			rivers.push({ d, w: rv.r <= 4 ? 1.6 : rv.r <= 6 ? 1.15 : 0.8 });
			if (!rv.n) continue;
			let best = { len: 0, at: [0, 0] as [number, number], rot: 0 };
			for (const part of parts) {
				let run = 0,
					runPts: [number, number][] = [];
				const flush = () => {
					if (run > best.len && runPts.length > 1) {
						const m = runPts[Math.floor(runPts.length / 2)],
							a = runPts[Math.max(0, Math.floor(runPts.length / 2) - 1)],
							b = runPts[Math.min(runPts.length - 1, Math.floor(runPts.length / 2) + 1)];
						let rot = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
						if (rot > 90) rot -= 180;
						if (rot < -90) rot += 180;
						best = { len: run, at: m, rot };
					}
					run = 0;
					runPts = [];
				};
				let prev: [number, number] | null = null;
				for (const q of part) {
					const p = P(q) as [number, number] | null;
					if (inside(p)) {
						if (prev) run += Math.hypot(p![0] - prev[0], p![1] - prev[1]);
						runPts.push(p!);
						prev = p;
					} else {
						flush();
						prev = null;
					}
				}
				flush();
			}
			if (best.len > 40) {
				const old = cand.find((x) => x.n === rv.n);
				if (old) old.len += best.len;
				else cand.push({ n: rv.n, len: best.len, at: best.at, rot: best.rot, r: rv.r });
			}
		}
		// Seen
		const lakes: string[] = [];
		const lakeLabels: { n: string; at: [number, number]; area: number }[] = [];
		for (const lk of water.lakes) {
			const parts = lk.c.filter(near);
			if (!parts.length) continue;
			const g: GeoJSON.Polygon = { type: 'Polygon', coordinates: parts };
			const d = path(g);
			if (!d) continue;
			lakes.push(d);
			const area = path.area(g);
			const ctr = path.centroid(g) as [number, number];
			if (lk.n && area > 120 && inside(ctr)) lakeLabels.push({ n: lk.n, at: ctr, area });
		}

		// Beschriftungen: Hauptstadt und Berg zuerst, dann große Seen und Flüsse – ohne Überlappung
		const labels: Label[] = [];
		const boxes: [number, number, number, number][] = [];
		const fits = (b: [number, number, number, number]) =>
			b[0] >= 2 && b[2] <= W - 2 && b[1] >= 2 && b[3] <= H - 2 && !boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
		const tw = (t: string, px: number) => t.length * px * 0.56;
		const place = (x: number, y: number, t: string, cls: string, px: number, opts: { rot?: number; center?: boolean } = {}) => {
			const w = tw(t, px);
			const tries: [number, number, 'start' | 'middle' | 'end'][] = opts.center
				? [[x, y, 'middle']]
				: [
						[x + 7, y + px * 0.35, 'start'],
						[x - 7, y + px * 0.35, 'end'],
						[x, y - 8, 'middle'],
						[x, y + px + 6, 'middle']
					];
			for (const [tx, ty, anchor] of tries) {
				const x0 = anchor === 'start' ? tx : anchor === 'end' ? tx - w : tx - w / 2;
				const b: [number, number, number, number] = opts.rot ? [tx - w / 2 - 2, ty - w / 2, tx + w / 2 + 2, ty + w / 2] : [x0 - 2, ty - px, x0 + w + 2, ty + 3];
				if (opts.rot ? b[0] >= 2 && b[2] <= W - 2 && ty > px && ty < H - 4 && !boxes.some((o) => tx > o[0] - 4 && tx < o[2] + 4 && ty > o[1] - 4 && ty < o[3] + 4) : fits(b)) {
					boxes.push(opts.rot ? [tx - 14, ty - 8, tx + 14, ty + 8] : b);
					labels.push({ x: tx, y: ty, t, cls, rot: opts.rot, anchor });
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
				boxes.push([p![0] - 6, p![1] - 7, p![0] + 6, p![1] + 3]);
			}
		}
		if (cap && facts?.cap?.[0]) place(cap[0], cap[1], facts.cap[0], 'lb-cap', 11);
		if (peak && facts?.peak) place(peak[0], peak[1], `${facts.peak[0]} · ${fmtHeight(facts.peak[1])}`, 'lb-peak', 9.5);
		for (const l of lakeLabels.sort((a, b) => b.area - a.area).slice(0, 2)) place(l.at[0], l.at[1], l.n, 'lb-water', 9, { center: true });
		for (const r of cand.sort((a, b) => b.len * (10 - b.r) - a.len * (10 - a.r)).slice(0, 3)) place(r.at[0], r.at[1], r.n, 'lb-water', 9, { rot: r.rot, center: true });

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
			{#each layers.lakes as d, i (i)}<path {d} class="cs-lake" />{/each}
			{#each layers.rivers as r, i (i)}<path d={r.d} class="cs-river" stroke-width={r.w} />{/each}
			{#if layers.peak}
				<path class="cs-peak" d="M{layers.peak[0]} {layers.peak[1] - 6.5}l5.5 9h-11z" />
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
					dominant-baseline={l.rot ? 'middle' : undefined}>{l.t}</text
				>
			{/each}
		{/if}
	</svg>
{/if}
