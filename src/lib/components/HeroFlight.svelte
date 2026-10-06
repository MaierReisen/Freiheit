<script lang="ts">
	import { onMount } from 'svelte';
	import { REDUCE } from '$lib/app.svelte';

	/* Logo-Motiv als Streifen unter der Länderzahl: Startbahn auf dem Horizont, große Sonne, Flugkurve.
	   Das Flugzeug rollt, hebt ab, steigt vor der Sonne vorbei (dort als dunkle Silhouette) und geht in den Reiseflug.
	   Der Fortschritt ist nach vorn gelegt (Wurzel), damit sich schon bei wenigen Ländern sichtbar etwas tut. */

	let { progress, pct }: { progress: number; pct: number } = $props();

	const H = 150; // Höhe des Streifens
	const PLANE = 'M34 0c0-3-4-5-8-5H10L-6-28h-9l8 23H-18l-7-9h-7l4 14-4 14h7l7-9H-7l-8 23h9L10 5h16c4 0 8-2 8-5z';
	const uid = Math.random().toString(36).slice(2, 8);

	let w = $state(0);
	let pathEl = $state<SVGPathElement | null>(null);
	let len = $state(0);
	let shown = $state(0); // angezeigter Anteil der Kurve (animiert)
	let anim = 0;
	let startT: ReturnType<typeof setTimeout> | undefined;

	// Geometrie: Bodenhöhe der Räder, Sonne mittig-rechts, Abhebepunkt am Ende der Startbahn
	const yG = H - 9;
	const sun = $derived({ cx: w * 0.62, r: Math.min(80, Math.max(56, w * 0.22)) });
	const geo = $derived.by(() => {
		const x0 = w * 0.04,
			xr = w * 0.22, // Abheben
			p1 = { x: w * 0.6, y: H - sun.r * 0.8 }, // Kreuzungspunkt vor der Sonne
			ex = w - 6,
			ey = 22; // Reiseflughöhe
		const c2 = { x: w * 0.48, y: H - sun.r * 0.5 };
		const k = 1.3,
			c3 = { x: p1.x + (p1.x - c2.x) * k, y: p1.y + (p1.y - c2.y) * k };
		return {
			x0,
			xr,
			d: `M${x0} ${yG} L${xr} ${yG} C${xr + w * 0.14} ${yG} ${c2.x} ${c2.y} ${p1.x} ${p1.y} C${c3.x} ${c3.y} ${w * 0.84} ${ey} ${ex} ${ey}`
		};
	});

	// Anteil der Kurve aus dem Fortschritt: Wurzel legt Start und Steigflug nach vorn
	const target = $derived(Math.sqrt(Math.max(0, Math.min(1, progress))));

	const plane = $derived.by(() => {
		if (!pathEl || !len) return null;
		const at = Math.max(0, Math.min(len, len * shown));
		const p = pathEl.getPointAtLength(at),
			q = pathEl.getPointAtLength(Math.min(len, at + 3)),
			r = pathEl.getPointAtLength(Math.max(0, at - 3));
		return { x: p.x, y: p.y, deg: (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI };
	});

	$effect(() => {
		void geo.d;
		if (pathEl) len = pathEl.getTotalLength();
	});

	/** Flug von `from` bis zum aktuellen Stand */
	function fly(from: number, delay = 0) {
		cancelAnimationFrame(anim);
		clearTimeout(startT);
		const to = target;
		if (REDUCE) {
			shown = to;
			return;
		}
		shown = from;
		startT = setTimeout(() => {
			const t0 = performance.now(),
				ms = 1100 + Math.abs(to - from) * 1500;
			const step = (t: number) => {
				const k = Math.min(1, (t - t0) / ms),
					e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
				shown = from + (to - from) * e;
				if (k < 1) anim = requestAnimationFrame(step);
			};
			anim = requestAnimationFrame(step);
		}, delay);
	}

	// Stand geändert (Land hinzugefügt, Liste gewechselt, Daten geladen): vom aktuellen Punkt weiterfliegen
	let started = false;
	$effect(() => {
		void target;
		if (started) fly(shown);
	});

	onMount(() => {
		// Beim Start immer symbolisch vom Anfang der Startbahn bis zum erreichten Punkt
		started = true;
		fly(0, 350);
		// Nach längerer Pause (App wieder geöffnet) erneut starten
		let hiddenAt = 0;
		const onVis = () => {
			if (document.hidden) hiddenAt = Date.now();
			else if (hiddenAt && Date.now() - hiddenAt > 60000) fly(0, 350);
		};
		document.addEventListener('visibilitychange', onVis);
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			cancelAnimationFrame(anim);
			clearTimeout(startT);
		};
	});
</script>

<div class="flight" bind:clientWidth={w} aria-hidden="true">
	{#if w}
		<svg width={w} height={H} viewBox="0 0 {w} {H}">
			<defs>
				<clipPath id="sun-{uid}"><circle cx={sun.cx} cy={H} r={sun.r} /></clipPath>
				<radialGradient id="glow-{uid}" gradientUnits="userSpaceOnUse" cx={sun.cx} cy={H} r={sun.r + 26}>
					<stop offset={sun.r / (sun.r + 26)} class="flight-glow-in" />
					<stop offset="1" class="flight-glow-out" />
				</radialGradient>
			</defs>
			<!-- Sonne als Halbkreis über dem Horizont, mit leichtem Lichtschein -->
			<path d="M{sun.cx - sun.r - 26} {H} a{sun.r + 26} {sun.r + 26} 0 0 1 {2 * (sun.r + 26)} 0z" fill="url(#glow-{uid})" />
			<path class="flight-sun" d="M{sun.cx - sun.r} {H} a{sun.r} {sun.r} 0 0 1 {2 * sun.r} 0z" />
			<!-- Startbahn: Mittellinie auf dem Horizont -->
			<line class="flight-runway" x1={geo.x0 - 4} y1={H - 3} x2={geo.xr + w * 0.06} y2={H - 3} />
			<path class="flight-rest" d={geo.d} />
			<path class="flight-done" d={geo.d} bind:this={pathEl} stroke-dasharray="{len * shown} {len + 10}" />
			{#if plane}
				<g transform="translate({plane.x} {plane.y}) rotate({plane.deg}) scale(.52)">
					<path class="flight-plane" d={PLANE} />
				</g>
				<!-- vor der Sonne: dieselbe Form als dunkle Silhouette, auf die Sonnenscheibe beschnitten -->
				<g clip-path="url(#sun-{uid})">
					<g transform="translate({plane.x} {plane.y}) rotate({plane.deg}) scale(.52)">
						<path class="flight-plane-sil" d={PLANE} />
					</g>
				</g>
			{/if}
		</svg>
		<div class="flight-pct"><b>{pct} %</b><span>der Welt</span></div>
	{/if}
</div>
