<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { REDUCE } from '$lib/app.svelte';

	/* Logo-Motiv als Streifen unter der Länderzahl: kurze Startbahn auf dem Horizont, große Sonne, Flugkurve.
	   Das Flugzeug steht so weit auf der Kurve, wie Länder bereist sind (ab dem ersten Land in der Luft),
	   und ist vor der Sonne eine dunkle Silhouette. Beim neuen Land: Schub nach vorn, das neue Stück der Spur
	   leuchtet auf, „+0,5 %“ steigt auf, der Prozentwert (mit Nachkommastelle) zählt hoch. */

	let { progress }: { progress: number } = $props();

	const H = 150; // Höhe des Streifens
	const PLANE = 'M34 0c0-3-4-5-8-5H10L-6-28h-9l8 23H-18l-7-9h-7l4 14-4 14h7l7-9H-7l-8 23h9L10 5h16c4 0 8-2 8-5z';
	const uid = Math.random().toString(36).slice(2, 8);
	const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

	let w = $state(0);
	let pathEl = $state<SVGPathElement | null>(null);
	let len = $state(0);
	let shown = $state(0); // angezeigter Anteil der Kurve (animiert)
	let shownPct = $state(0); // angezeigter Prozentwert (animiert)
	let boost = $state<{ from: number; to: number; key: number; label: string } | null>(null);
	let boostAlpha = $state(0);
	let boostReach = $state(0); // weitester Punkt des Vorstoßes (für den Leuchtstreifen)
	let anim = 0;
	let startT: ReturnType<typeof setTimeout> | undefined;
	let boostT: ReturnType<typeof setTimeout> | undefined;

	// Geometrie: Räder auf dem Horizont, Sonne mittig-links (rechts unten bleibt Platz für den Prozentwert)
	const yG = H - 9;
	const sun = $derived({ cx: w * 0.46, r: Math.min(76, Math.max(54, w * 0.21)) });
	const LIFT = 0.07; // Anteil der Kurve bis zum Abheben (kurze Startbahn)
	const geo = $derived.by(() => {
		const x0 = w * 0.03,
			xr = w * 0.12, // Abheben
			p1 = { x: w * 0.44, y: H - sun.r * 0.84 }, // vor der Sonne
			ex = w - 6,
			ey = 20; // Reiseflughöhe
		const c2 = { x: w * 0.32, y: H - sun.r * 0.42 };
		const k = 1.25,
			c3 = { x: p1.x + (p1.x - c2.x) * k, y: p1.y + (p1.y - c2.y) * k };
		return {
			x0,
			xr,
			d: `M${x0} ${yG} L${xr} ${yG} C${xr + w * 0.09} ${yG} ${c2.x} ${c2.y} ${p1.x} ${p1.y} C${c3.x} ${c3.y} ${w * 0.8} ${ey} ${ex} ${ey}`
		};
	});

	// Anteil der Kurve: 0 Länder = Anfang der Startbahn; ab dem ersten Land in der Luft, danach Wurzel
	// (legt den Fortschritt nach vorn, damit auch wenige Länder sichtbar weit tragen)
	const p = $derived(Math.max(0, Math.min(1, progress)));
	const target = $derived(p > 0 ? LIFT + 0.05 + (1 - LIFT - 0.05) * Math.sqrt(p) : 0);

	const plane = $derived.by(() => {
		if (!pathEl || !len) return null;
		const at = Math.max(0, Math.min(len, len * shown));
		const a = pathEl.getPointAtLength(at),
			q = pathEl.getPointAtLength(Math.min(len, at + 3)),
			r = pathEl.getPointAtLength(Math.max(0, at - 3));
		return { x: a.x, y: a.y, deg: (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI };
	});

	$effect(() => {
		void geo.d;
		if (pathEl) len = pathEl.getTotalLength();
	});

	const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
	const SURGE = 0.07; // Vorstoß beim neuen Land (Anteil der Kurve), unabhängig davon, wie klein der Fortschritt ist

	/** Flug von `from` zum aktuellen Stand; mit Schub (neues Land) schießt das Flugzeug sichtbar vor und gleitet zurück */
	function fly(from: number, fromPct: number, opts: { delay?: number; boost?: boolean } = {}) {
		cancelAnimationFrame(anim);
		clearTimeout(startT);
		const to = target,
			toPct = p * 100;
		if (REDUCE) {
			shown = to;
			shownPct = toPct;
			return;
		}
		shown = from;
		shownPct = fromPct;
		startT = setTimeout(() => {
			const t0 = performance.now(),
				ms = opts.boost ? 1300 : 1100 + Math.abs(to - from) * 1500,
				surge = opts.boost ? Math.min(SURGE, 1 - to) : 0;
			const step = (t: number) => {
				const k = Math.min(1, (t - t0) / ms);
				// Schub: schnell nach vorn (Spitze bei ~30 %), dann weich zurück auf den neuen Platz
				const bump = surge ? surge * Math.pow(Math.sin(Math.PI * Math.pow(k, 0.6)), 2) : 0;
				shown = from + (to - from) * easeInOut(k) + bump;
				if (boost) boostReach = Math.max(boostReach, shown);
				shownPct = fromPct + (toPct - fromPct) * easeInOut(k);
				if (k < 1) anim = requestAnimationFrame(step);
			};
			anim = requestAnimationFrame(step);
		}, opts.delay ?? 0);
	}

	// Stand geändert: bei mehr Ländern Schub mit leuchtender Spur und „+x %“, sonst einfach hinfliegen
	let started = false;
	let lastP = 0;
	$effect(() => {
		const now = p;
		void target;
		// nur auf den Stand reagieren, nicht auf die laufende Animation
		untrack(() => {
			if (!started) return;
			const prev = lastP;
			lastP = now;
			if (now > prev && !REDUCE) {
				const from = shown;
				clearTimeout(boostT);
				boost = { from, to: target, key: (boost?.key ?? 0) + 1, label: `+${fmt((now - prev) * 100)} %` };
				boostReach = from;
				boostAlpha = 1;
				fly(from, shownPct, { boost: true });
				boostT = setTimeout(() => (boostAlpha = 0), 1000); // Leuchten geht in die normale Spur über
			} else if (now !== prev) fly(shown, shownPct);
		});
	});

	onMount(() => {
		// Beim Start immer: Rollen auf der Startbahn, Abheben und Flug bis zum erreichten Punkt
		started = true;
		lastP = p;
		fly(0, 0, { delay: 350 });
		// Nach längerer Pause (App wieder geöffnet) erneut starten
		let hiddenAt = 0;
		const onVis = () => {
			if (document.hidden) hiddenAt = Date.now();
			else if (hiddenAt && Date.now() - hiddenAt > 60000) fly(0, 0, { delay: 350 });
		};
		document.addEventListener('visibilitychange', onVis);
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			cancelAnimationFrame(anim);
			clearTimeout(startT);
			clearTimeout(boostT);
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
			<!-- Sonne als Halbkreis über dem Horizont, mit weichem Lichtschein -->
			<path d="M{sun.cx - sun.r - 26} {H} a{sun.r + 26} {sun.r + 26} 0 0 1 {2 * (sun.r + 26)} 0z" fill="url(#glow-{uid})" />
			<path class="flight-sun" d="M{sun.cx - sun.r} {H} a{sun.r} {sun.r} 0 0 1 {2 * sun.r} 0z" />
			<!-- Startbahn: Mittellinie auf dem Horizont -->
			<line class="flight-runway" x1={geo.x0 - 4} y1={H - 3} x2={geo.xr + w * 0.04} y2={H - 3} />
			<path class="flight-rest" d={geo.d} />
			<path class="flight-done" d={geo.d} bind:this={pathEl} stroke-dasharray="{len * shown} {len + 10}" />
			{#if boost && len}
				<!-- neues Stück der Spur leuchtet kurz sonnengelb auf -->
				<path
					class="flight-boost"
					d={geo.d}
					style="opacity:{boostAlpha}"
					stroke-dasharray="0 {len * boost.from} {Math.max(0, len * (boostReach - boost.from))} {len * 2}"
				/>
			{/if}
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
		{#if boost && plane}
			{#key boost.key}
				<span class="flight-plus" style="left:{plane.x}px;top:{plane.y}px">{boost.label}</span>
				<!-- Welle und Funken am Flugzeug -->
				<span class="flight-burst" style="left:{plane.x}px;top:{plane.y}px">
					<i class="ring"></i>
					{#each Array(8) as _, i (i)}<i class="spark" style="--a:{i * 45 + 22}deg"></i>{/each}
				</span>
			{/key}
		{/if}
		<div class="flight-pct"><b>{fmt(shownPct)} %</b><span>der Welt</span></div>
	{/if}
</div>
