<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { REDUCE, easeOutCubic, introProgress, ui } from '$lib/app.svelte';
	import { atlas } from '$lib/atlas.svelte';

	/* Logo-Motiv als Streifen unter der Länderzahl: Horizont, große Sonne, Flugkurve.
	   Das Flugzeug steht so weit auf der Kurve, wie Länder bereist sind (ab dem ersten Land in der Luft),
	   und ist vor der Sonne eine dunkle Silhouette.
	   - App-Start (und nach längerer Pause): Rollen, Abheben, Flug bis zum erreichten Punkt –
	     auf der gemeinsamen Zeitachse (ui.intro), endet gleichzeitig mit Globus und Zählern
	   - eigenes neues Land: Anschub nur nach vorn, Nachbrenner-Leuchten, Flügelwackeln, Welle, Funken, „+x %“
	   - alle anderen Änderungen (Laden aus dem Konto, Entfernen, Länderliste, Import): ruhig an die neue Stelle */

	let { progress }: { progress: number } = $props();

	const H = 150; // Höhe des Streifens
	const PLANE = 'M34 0c0-3-4-5-8-5H10L-6-28h-9l8 23H-18l-7-9h-7l4 14-4 14h7l7-9H-7l-8 23h9L10 5h16c4 0 8-2 8-5z';
	const uid = Math.random().toString(36).slice(2, 8);
	const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

	let w = $state(0);
	let host: HTMLDivElement;
	let pctEl = $state<HTMLDivElement | null>(null);
	// Hindernisse im Streifen (relativ zu ihm): Unterkante des „+ Land“-Buttons, Prozentwert rechts unten
	let btnBottom = $state(-Infinity);
	let pctBox = $state({ left: Infinity, top: Infinity });
	const CLEAR = 26; // Abstand der Kurve zu Button und Prozentwert (halbe Flugzeuggröße plus Luft)
	let pathEl = $state<SVGPathElement | null>(null);
	let len = $state(0);
	let shown = $state(0); // angezeigter Anteil der Kurve (animiert)
	let shownPct = $state(0); // angezeigter Prozentwert (animiert)
	let wiggle = $state(0); // zusätzliche Neigung beim Flügelwackeln (Grad)
	let boost = $state<{ from: number; key: number; label: string } | null>(null);
	let boostAlpha = $state(0);
	let anim = 0;
	let boostT: ReturnType<typeof setTimeout> | undefined;
	let settleT: ReturnType<typeof setTimeout> | undefined;

	// Geometrie: Räder auf dem Horizont, Sonne mittig-links (rechts unten bleibt Platz für den Prozentwert)
	const yG = H - 9;
	const sun = $derived({ cx: w * 0.46, r: Math.min(76, Math.max(54, w * 0.21)) });
	const LIFT = 0.07; // Anteil der Kurve bis zum Abheben (kurze Startbahn)
	const d = $derived.by(() => {
		const x0 = w * 0.03,
			xr = w * 0.12, // Abheben
			ex = w - 6,
			ey = Math.max(20, btnBottom + CLEAR); // Reiseflughöhe, unterhalb des „+ Land“-Buttons
		// Scheitel des Steigflugs: rechts neben der Sonnenmitte, aber links vom Prozentwert und hoch genug darüber
		const p1 = {
			x: Math.min(w * 0.6, pctBox.left - CLEAR),
			y: Math.min(H - sun.r * 0.84, pctBox.top - CLEAR)
		};
		// zweiter Teil gleichmäßig in die Reiseflughöhe, ohne Überschwingen nach oben
		const c3 = { x: p1.x + (ex - p1.x) * 0.4, y: ey + (p1.y - ey) * 0.3 },
			c4 = { x: ex - (ex - p1.x) * 0.25, y: ey };
		// erster Teil tangential anschließend (keine Knicke)
		const c2 = { x: p1.x - (c3.x - p1.x) * 0.8, y: p1.y - (c3.y - p1.y) * 0.8 };
		return `M${x0} ${yG} L${xr} ${yG} C${xr + w * 0.09} ${yG} ${c2.x} ${c2.y} ${p1.x} ${p1.y} C${c3.x} ${c3.y} ${c4.x} ${c4.y} ${ex} ${ey}`;
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
		return { x: a.x, y: a.y, deg: (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI + wiggle };
	});

	$effect(() => {
		void d;
		if (pathEl) len = pathEl.getTotalLength();
	});

	const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
	const easeOutQuart = (k: number) => 1 - Math.pow(1 - k, 4); // kräftiger Anschub, weiches Ausgleiten

	/** Flug von `from` zum aktuellen Stand. Mit `boost` (eigenes neues Land): nur vorwärts, mit Flügelwackeln */
	function fly(from: number, fromPct: number, opts: { delay?: number; ms?: number; boost?: boolean; intro?: boolean } = {}) {
		cancelAnimationFrame(anim);
		clearTimeout(settleT);
		wiggle = 0;
		const to = target,
			toPct = p * 100;
		const settle = () => {
			cancelAnimationFrame(anim);
			shown = to;
			shownPct = toPct;
			wiggle = 0;
		};
		if (REDUCE) return settle();
		shown = from;
		shownPct = fromPct;
		const ms = opts.ms ?? (opts.boost ? 1000 : 1100 + Math.abs(to - from) * 1500);
		// Absicherung: läuft keine Animation (App im Hintergrund, Browser drosselt), steht das Flugzeug
		// spätestens nach der geplanten Flugdauer trotzdem an der richtigen Stelle
		settleT = setTimeout(settle, (opts.delay ?? 0) + ms + 400);
		// fester Startzeitpunkt statt Zeitgeber: endet exakt gleichzeitig mit Globus und Zählern
		const t0 = performance.now() + (opts.delay ?? 0),
			ease = opts.boost ? easeOutQuart : opts.intro ? easeOutCubic : easeInOut;
		const step = (t: number) => {
			const k = Math.max(0, Math.min(1, (t - t0) / ms));
			shown = from + (to - from) * ease(k);
			shownPct = fromPct + (toPct - fromPct) * (opts.intro ? easeOutCubic(k) : easeInOut(k));
			wiggle = opts.boost ? 9 * Math.sin(k * Math.PI * 4) * (1 - k) : 0;
			if (k < 1) anim = requestAnimationFrame(step);
		};
		anim = requestAnimationFrame(step);
	}

	// Stand geändert. Feier nur, wenn gerade selbst ein Land hinzugefügt wurde (nicht beim Laden aus dem Konto)
	let started = false;
	let lastP = 0;
	$effect(() => {
		const now = p;
		// nur auf den Stand reagieren, nicht auf die laufende Animation
		untrack(() => {
			if (!started || now === lastP) return;
			const prev = lastP;
			lastP = now;
			const ownAdd = now > prev && Date.now() - atlas.lastAddedAt < 2000;
			const introLeft = introProgress() < 1 ? ui.intro.end - performance.now() : 0;
			if (introLeft > 0 && !ownAdd) {
				// während der Start-Animation nachgeladen: Ziel anpassen, aber gleichzeitig mit allem anderen ankommen
				fly(shown, shownPct, { ms: introLeft, intro: true });
			} else if (ownAdd && !REDUCE) {
				clearTimeout(boostT);
				// Nachbrenner: auch ein Stück der Spur hinter dem Flugzeug leuchtet mit
				boost = { from: Math.max(0, shown - 0.06), key: (boost?.key ?? 0) + 1, label: `+${fmt((now - prev) * 100)} %` };
				boostAlpha = 1;
				fly(shown, shownPct, { boost: true });
				boostT = setTimeout(() => (boostAlpha = 0), 1100); // Leuchten geht in die normale Spur über
			} else fly(shown, shownPct);
		});
	});

	function measure() {
		const box = host?.getBoundingClientRect();
		if (!box) return;
		const btn = host.parentElement?.querySelector('.hero-add')?.getBoundingClientRect();
		btnBottom = btn && btn.right > box.left + box.width * 0.5 ? btn.bottom - box.top : -Infinity;
		const pr = pctEl?.getBoundingClientRect();
		pctBox = pr ? { left: pr.left - box.left, top: pr.top - box.top } : { left: Infinity, top: Infinity };
	}

	// Prozentwert wird erst nach der ersten Breitenmessung gezeichnet: dann neu vermessen
	$effect(() => {
		if (pctEl && w) untrack(measure);
	});

	// Start-Animation: vom Anfang der Startbahn bis zum Stand, gleichzeitig mit Globus und Zählern
	$effect(() => {
		const it = ui.intro;
		if (!it.key) return;
		untrack(() => {
			const now = performance.now();
			fly(0, 0, { delay: Math.max(0, it.start - now), ms: Math.max(200, it.end - Math.max(now, it.start)), intro: true });
		});
	});

	onMount(() => {
		started = true;
		lastP = p;
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(host);
		host.parentElement?.querySelectorAll('.hero-add, .count').forEach((el) => ro.observe(el));
		return () => {
			ro.disconnect();
			cancelAnimationFrame(anim);
				clearTimeout(boostT);
			clearTimeout(settleT);
		};
	});
</script>

<div class="flight" bind:clientWidth={w} bind:this={host} aria-hidden="true">
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
			<path class="flight-rest" {d} />
			<path class="flight-done" {d} bind:this={pathEl} stroke-dasharray="{len * shown} {len + 10}" />
			{#if boost && len}
				<!-- Nachbrenner: Spur hinter dem Flugzeug und das neue Stück leuchten kurz sonnengelb -->
				<path
					class="flight-boost"
					{d}
					style="opacity:{boostAlpha}"
					stroke-dasharray="0 {len * boost.from} {Math.max(0, len * (shown - boost.from))} {len * 2}"
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
		<div class="flight-pct" bind:this={pctEl}><b>{fmt(shownPct)} %</b><span>der Welt</span></div>
	{/if}
</div>
