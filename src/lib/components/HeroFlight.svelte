<script lang="ts">
	import { onMount } from 'svelte';
	import { REDUCE } from '$lib/app.svelte';

	/* Logo-Motiv als eigener Streifen unter der Länderzahl: Sonne auf dem Horizont, Flugkurve und Flugzeug
	   wie im App-Icon. Das Flugzeug steht so weit auf der Kurve, wie Länder der gewählten Liste bereist sind
	   (Spur durchgezogen, Rest gepunktet). Der Prozentwert steht rechts unten, wo die Kurve nicht verläuft. */

	let { progress, pct }: { progress: number; pct: number } = $props();

	const H = 132; // Höhe des Streifens
	const PLANE_DEG = 14; // Winkel des Flugzeugs im App-Icon
	const PLANE = 'M34 0c0-3-4-5-8-5H10L-6-28h-9l8 23H-18l-7-9h-7l4 14-4 14h7l7-9H-7l-8 23h9L10 5h16c4 0 8-2 8-5z';

	let w = $state(0);
	let pathEl = $state<SVGPathElement | null>(null);
	let len = $state(0);
	let shown = $state(0); // angezeigter Fortschritt (animiert)
	let anim = 0;
	let startT: ReturnType<typeof setTimeout> | undefined;

	// Geometrie aus dem Icon (512er-Raster, Horizont x 76–436, y 340), horizontal auf die Breite gestreckt,
	// vertikal einheitlich skaliert, damit die Sonne rund bleibt
	const v = 0.46;
	const X = (x: number) => ((x - 76) / 360) * w;
	const Y = (y: number) => H - 6 - (340 - y) * v;
	const d = $derived(w ? `M${X(96)} ${Y(300)} C${X(150)} ${Y(150)} ${X(290)} ${Y(98)} ${X(372)} ${Y(116)}` : '');
	const sun = $derived({ cx: X(256), r: 100 * v });

	const plane = $derived.by(() => {
		if (!pathEl || !len) return null;
		const p = pathEl.getPointAtLength(Math.max(0, Math.min(len, len * shown)));
		return { x: p.x, y: p.y };
	});

	$effect(() => {
		void d;
		if (pathEl) len = pathEl.getTotalLength();
	});

	/** Flug von `from` bis zum aktuellen Stand */
	function fly(from: number, delay = 0) {
		cancelAnimationFrame(anim);
		clearTimeout(startT);
		const to = Math.max(0, Math.min(1, progress));
		if (REDUCE) {
			shown = to;
			return;
		}
		shown = from;
		startT = setTimeout(() => {
			const t0 = performance.now(),
				ms = 1000 + Math.abs(to - from) * 1400;
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
		void progress;
		if (started) fly(shown);
	});

	onMount(() => {
		// Beim Start immer symbolisch von der Sonne bis zum erreichten Punkt fliegen
		started = true;
		fly(0, 350);
		// Nach längerer Pause (App wieder geöffnet) erneut abheben
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
			<path class="flight-sun" d="M{sun.cx - sun.r} {H} a{sun.r} {sun.r} 0 0 1 {sun.r * 2} 0z" />
			<path class="flight-rest" {d} />
			<path class="flight-done" {d} bind:this={pathEl} stroke-dasharray="{len * shown} {len + 10}" />
			{#if plane}
				<path class="flight-plane" transform="translate({plane.x} {plane.y}) rotate({PLANE_DEG}) scale(.56)" d={PLANE} />
			{/if}
		</svg>
		<div class="flight-pct"><b>{pct} %</b><span>der Welt</span></div>
	{/if}
</div>
