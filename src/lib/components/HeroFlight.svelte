<script lang="ts" module>
	// gemessene Reiseflughöhe je Szene; beide Kurven nutzen das Maximum, damit sie sich beim Wischen genau treffen
	// (auch wenn die Unterzeile nur in einem Tab zweizeilig ist). Unsichtbare Köpfe behalten ihren letzten Wert.
	const cruise = $state({ takeoff: 0, landing: 0 });
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { reduceMotion, easeOutCubic, introProgress, ui } from '$lib/app.svelte';
	import { atlas } from '$lib/atlas.svelte';

	/* Logo-Motiv als Streifen unter der Länderzahl: Horizont, große Sonne, Flugkurve.
	   Das Flugzeug steht so weit auf der Kurve, wie Länder bereist sind (ab dem ersten Land in der Luft),
	   und ist vor der Sonne eine dunkle Silhouette.
	   - App-Start (und nach längerer Pause): Rollen, Abheben, Flug bis zum erreichten Punkt –
	     auf der gemeinsamen Zeitachse (ui.intro), endet gleichzeitig mit Globus und Zählern
	   - eigenes neues Land (Flüge: eigener neuer Flug): Anschub nur nach vorn, Nachbrenner-Leuchten, Flügelwackeln, Welle, Funken, „+x %“
	   - alle anderen Änderungen (Laden aus dem Konto, Entfernen, Länderliste, Import): ruhig an die neue Stelle
	   Szene „landing“ (Tab Flüge, Fortsetzung der Geschichte): kommt links in derselben Reiseflughöhe herein, in der die
	   Kurve der Welt rechts endet (beide Kurven reichen bis in den Seitenrand, beim Wischen gehen sie ineinander über);
	   Sinkflug, flacher Endanflug, Abfangen mit leicht angehobener Nase, Ausrollen zum Flughafen. Prozentwert rechts oben.
	   Wischen Welt → Flüge: das Flugzeug der Welt fliegt ans Ende seiner Kurve (im Seitenrand, genau dort beginnt die Kurve
	   der Flüge) und übergibt dort an das Flugzeug der Flüge (ui.planeHandoff); das fliegt weiter, sobald der Tab offen ist. */

	/** label: Text unter dem Prozentwert (Startseite „der Welt“, Flüge „zum Mond“); scene: Start (Welt) oder Landung (Flüge) */
	let { progress, label = 'der Welt', scene = 'takeoff' }: { progress: number; label?: string; scene?: 'takeoff' | 'landing' } = $props();
	const landing = $derived(scene === 'landing');

	const H = 150; // Höhe des Streifens
	const PLANE = 'M34 0c0-3-4-5-8-5H10L-6-28h-9l8 23H-18l-7-9h-7l4 14-4 14h7l7-9H-7l-8 23h9L10 5h16c4 0 8-2 8-5z';
	const uid = Math.random().toString(36).slice(2, 8);
	const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

	const fmt2 = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	let w = $state(0);
	let host: HTMLDivElement;
	let pctEl = $state<HTMLDivElement | null>(null);
	// Hindernisse im Streifen (relativ zu ihm): Unterkante des „+ Land“-Buttons, Prozentwert rechts unten
	let btnBottom = $state(-Infinity);
	let pctBox = $state({ left: Infinity, top: Infinity });
	let textBottom = $state(0); // Unterkante der großen Zahl samt Unterzeile (Reiseflughöhe liegt darunter)
	let gut = $state(20); // Seitenrand: so weit reichen die Kurven über den Streifen hinaus
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
	let boostGone: ReturnType<typeof setTimeout> | undefined;
	let settleT: ReturnType<typeof setTimeout> | undefined;

	// Geometrie: Räder auf dem Horizont, Sonne mittig-links (rechts unten bleibt Platz für den Prozentwert)
	const yG = H - 9;
	const sun = $derived({ cx: w * 0.46, r: Math.min(76, Math.max(54, w * 0.21)) });
	// gemeinsame Reiseflughöhe beider Tabs (Köpfe sind gleich aufgebaut): unter Button und Unterzeile
	$effect(() => {
		cruise[scene] = Math.max(btnBottom + CLEAR, textBottom + 16);
	});
	const yCruise = $derived(Math.max(20, cruise.takeoff, cruise.landing));
	// Landung: Aufsetzen rechts neben der Sonne, Ausrollen bis vor das Terminal
	const xTouch = $derived(w * 0.69),
		xStop = $derived(w * 0.8);
	const LIFT = 0.07; // Anteil der Kurve bis zum Abheben (kurze Startbahn)
	const dLanding = $derived.by(() => {
		const y0 = yCruise,
			// Endanflug: gerade, flach (≈ 10°), endet kurz vor dem Aufsetzen im Abfangbogen
			fx = xTouch - 26,
			fy = yG - 4,
			gx = fx - 70,
			gy = fy - 13,
			s = (fy - gy) / (fx - gx);
		// Sinkflug aus dem Reiseflug (waagerecht hereinkommend), tangential in den Endanflug
		return (
			`M${-gut + 2} ${y0} L4 ${y0} C${gx * 0.45} ${y0} ${gx - 34} ${gy - 34 * s} ${gx} ${gy}` +
			` L${fx} ${fy} C${fx + 12} ${fy + 12 * s} ${xTouch - 8} ${yG} ${xTouch} ${yG} L${xStop} ${yG}`
		);
	});
	const d = $derived.by(() => {
		if (landing) return dLanding;
		const x0 = w * 0.03,
			xr = w * 0.12, // Abheben
			ex = w - 6,
			ey = yCruise; // Reiseflughöhe, unterhalb des „+ Land“-Buttons
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
		// danach waagerecht bis in den Seitenrand (Anschluss an die Kurve der Flüge beim Wischen)
		// (endet knapp vor dem Bildschirmrand, die runde Linienkappe ragt sonst hinaus)
		return `M${x0} ${yG} L${xr} ${yG} C${xr + w * 0.09} ${yG} ${c2.x} ${c2.y} ${p1.x} ${p1.y} C${c3.x} ${c3.y} ${c4.x} ${c4.y} ${ex} ${ey} L${w + gut - 2} ${ey}`;
	});

	// Anteil der Kurve: 0 Länder = Anfang der Startbahn; ab dem ersten Land in der Luft, danach Wurzel
	// (legt den Fortschritt nach vorn, damit auch wenige Länder sichtbar weit tragen)
	const p = $derived(Math.max(0, Math.min(1, progress)));
	// Stück im Seitenrand (Welt: am Ende, Flüge: am Anfang) gehört nicht zum Fortschritt
	const edge = $derived(len ? Math.min(0.3, (gut + (landing ? 2 : 4)) / len) : 0);
	// Landung: gleichmäßig (bei der Hälfte noch im Anflug, Aufsetzen erst kurz vor dem Ziel)
	const target = $derived(
		landing ? edge + (1 - edge) * p : (1 - edge) * (p > 0 ? LIFT + 0.05 + (1 - LIFT - 0.05) * Math.sqrt(p) : 0)
	);

	// Flughafen am Horizont (Landung), Fuß auf der Bodenlinie: Terminal mit geschwungenem Dach und Fensterband,
	// Fluggastbrücke, Leitwerk eines geparkten Flugzeugs, schlanker Tower mit Kanzel und Antenne (Blinklicht)
	const port = $derived.by(() => {
		const b = H,
			t0 = w * 0.75,
			t1 = Math.min(w * 0.93, w - 30),
			tw = t1 - t0,
			tx = w - 9,
			tl = t0 + tw * 0.62;
		const terminal =
			`M${t0} ${b}V${b - 13}C${t0 + tw * 0.3} ${b - 21} ${t0 + tw * 0.62} ${b - 21} ${t1 + 4} ${b - 15}L${t1} ${b - 12}V${b}z` +
			`M${t0 + 4} ${b - 8}h${tw - 8}v2.4h${-(tw - 8)}z`; // Fensterband (ausgespart)
		const bridge = `M${t0 - 17} ${b - 9}h17v3.6h-17zM${t0 - 15} ${b - 5.4}h2.4V${b}h-2.4z`;
		const tail = `M${tl} ${b - 17}l5-15h6l-2 15z`;
		const tower =
			`M${tx - 4.5} ${b}L${tx - 3} ${b - 40}h6L${tx + 4.5} ${b}z` + // Schaft, nach oben schlanker
			`M${tx - 6} ${b - 40}L${tx - 10} ${b - 51}h20L${tx + 6} ${b - 40}z` + // Kanzel, oben breiter
			`M${tx - 7.4} ${b - 48}h14.8l-0.8 -2.2h-13.2z` + // Fensterband der Kanzel (ausgespart)
			`M${tx - 9} ${b - 51}h18l-3 -3h-12z` + // Dach
			`M${tx - 0.6} ${b - 54}v-9h1.2v9z`; // Antenne
		const lights = Array.from({ length: 6 }, (_, k) => xTouch - 14 + k * ((xStop - xTouch + 14) / 5)); // Befeuerung der Landebahn
		return { d: terminal + bridge + tail + tower, lights, beacon: { x: tx, y: b - 63.5 } };
	});

	// Neigung beim Landen: Nase flacher als die Kurve, beim Abfangen leicht angehoben, nach dem Aufsetzen waagerecht
	const smooth = (a: number, b: number, x: number) => {
		const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
		return k * k * (3 - 2 * k);
	};
	function attitude(x: number, slope: number) {
		const desc = Math.min(9, slope * 0.3);
		const up = -5 * smooth(xTouch - 36, xTouch - 8, x) * (1 - smooth(xTouch + 2, xTouch + 22, x));
		return desc * (1 - smooth(xTouch - 40, xTouch - 14, x)) + up;
	}

	const plane = $derived.by(() => {
		if (!pathEl || !len) return null;
		const at = Math.max(0, Math.min(len, len * shown));
		const a = pathEl.getPointAtLength(at),
			q = pathEl.getPointAtLength(Math.min(len, at + 3)),
			r = pathEl.getPointAtLength(Math.max(0, at - 3));
		// Landung: Nase flacher als die Kurve (Flugzeug schwebt an, statt hinunterzustürzen)
		const deg = (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI;
		return { x: a.x, y: a.y, deg: (landing ? attitude(a.x, deg) : deg) + wiggle };
	});

	$effect(() => {
		void d;
		if (pathEl) len = pathEl.getTotalLength();
	});

	const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
	const easeOutQuart = (k: number) => 1 - Math.pow(1 - k, 4); // kräftiger Anschub, weiches Ausgleiten

	/** Flug von `from` zum aktuellen Stand. Mit `boost` (eigenes neues Land): nur vorwärts, mit Flügelwackeln */
	function fly(from: number, fromPct: number, opts: { delay?: number; ms?: number; boost?: boolean; intro?: boolean; to?: number; ease?: (k: number) => number } = {}) {
		cancelAnimationFrame(anim);
		clearTimeout(settleT);
		wiggle = 0;
		const to = opts.to ?? target,
			toPct = opts.to === undefined ? p * 100 : shownPct;
		const settle = () => {
			cancelAnimationFrame(anim);
			shown = to;
			shownPct = toPct;
			wiggle = 0;
		};
		if (reduceMotion()) return settle();
		shown = from;
		shownPct = fromPct;
		const ms = opts.ms ?? (opts.boost ? 1000 : 1100 + Math.abs(to - from) * 1500);
		// Absicherung: läuft keine Animation (App im Hintergrund, Browser drosselt), steht das Flugzeug
		// spätestens nach der geplanten Flugdauer trotzdem an der richtigen Stelle
		settleT = setTimeout(settle, (opts.delay ?? 0) + ms + 400);
		// fester Startzeitpunkt statt Zeitgeber: endet exakt gleichzeitig mit Globus und Zählern
		const t0 = performance.now() + (opts.delay ?? 0),
			ease = opts.ease ?? (opts.boost ? easeOutQuart : opts.intro ? easeOutCubic : easeInOut);
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
			// Flüge im Hintergrund: Flugzeug wartet am Anfang, fliegt beim Öffnen des Tabs herein.
			// Welt im Hintergrund: ohne Animation an die neue Stelle; beim Hinausfliegen (Wischen) erst danach
			if (!active) return landing ? undefined : jump();
			if (exited) return;
			const ownAdd = now > prev && Date.now() - (landing ? atlas.lastFlightAddedAt : atlas.lastAddedAt) < 2000;
			const introLeft = introProgress() < 1 ? ui.intro.end - performance.now() : 0;
			if (introLeft > 0 && !ownAdd) {
				// während der Start-Animation nachgeladen: Ziel anpassen, aber gleichzeitig mit allem anderen ankommen
				fly(shown, shownPct, { ms: introLeft, intro: true });
			} else if (ownAdd && !reduceMotion()) {
				clearTimeout(boostT);
				clearTimeout(boostGone);
				// Nachbrenner: auch ein Stück der Spur hinter dem Flugzeug leuchtet mit
				boost = { from: Math.max(0, shown - 0.06), key: (boost?.key ?? 0) + 1, label: `+${landing ? fmt2((now - prev) * 100) : fmt((now - prev) * 100)} %` };
				boostAlpha = 1;
				fly(shown, shownPct, { boost: true });
				boostT = setTimeout(() => (boostAlpha = 0), 1100); // Leuchten geht in die normale Spur über
				boostGone = setTimeout(() => (boost = null), 2300); // „+x %“ und Spur weg, damit sie beim Tabwechsel nicht neu starten
			} else fly(shown, shownPct);
		});
	});

	/** ohne Animation an den aktuellen Stand */
	function jump() {
		cancelAnimationFrame(anim);
		clearTimeout(settleT);
		shown = target;
		shownPct = p * 100;
		wiggle = 0;
	}

	function measure() {
		const box = host?.getBoundingClientRect();
		if (!box?.width) return; // unsichtbar (anderer Tab): letzte Werte behalten
		const btn = host.parentElement?.querySelector('.hero-add')?.getBoundingClientRect();
		btnBottom = btn && btn.right > box.left + box.width * 0.5 ? btn.bottom - box.top : -Infinity;
		const pr = pctEl?.getBoundingClientRect();
		pctBox = pr ? { left: pr.left - box.left, top: pr.top - box.top } : { left: Infinity, top: Infinity };
		const cnt = host.parentElement?.querySelector('.count-btn, .count')?.getBoundingClientRect();
		textBottom = cnt ? cnt.bottom - box.top : 0;
		gut = Math.min(24, Math.max(0, (window.innerWidth - box.width) / 2));
	}

	/* Fortsetzung beim Tabwechsel. Welt: beim Wischen zu den Flügen fliegt das Flugzeug ans Ende seiner Kurve und übergibt
	   dort (Wischen abgebrochen → zurück an seine Stelle). Flüge: wartet unsichtbar am Anfang (= Ende der Welt-Kurve),
	   erscheint mit der Übergabe und fliegt weiter, sobald der Tab offen ist. */
	const active = $derived(ui.tab === (landing ? 'flights' : 'home'));
	let wasActive = untrack(() => active);
	let exited = false;
	let handT: ReturnType<typeof setTimeout> | undefined;
	// sichtbar: im eigenen Tab; Flüge im Hintergrund erst nach der Übergabe, Welt bis zur Übergabe
	const planeVisible = $derived(landing ? active || ui.planeHandoff : !(ui.planeHandoff && ui.swipeTo === 'flights'));
	$effect(() => {
		const a = active,
			sw = ui.swipeTo;
		untrack(() => {
			if (landing) {
				if (a && !wasActive) fly(0, p * 100, { ms: 1700, ease: easeOutCubic });
				else if (!a) {
					cancelAnimationFrame(anim);
					clearTimeout(settleT);
					shown = 0;
					shownPct = p * 100;
				}
			} else if (a && sw === 'flights' && !exited) {
				exited = true;
				const k = Math.max(0.25, 1 - shown);
				fly(shown, shownPct, { to: 1, ms: 350 + 700 * k, ease: (t) => t * t });
				clearTimeout(handT);
				handT = setTimeout(() => exited && (ui.planeHandoff = true), 350 + 700 * k);
			} else if (exited && (!a || sw !== 'flights')) {
				exited = false;
				clearTimeout(handT);
				ui.planeHandoff = false;
				if (a) fly(shown, shownPct, { ms: 700 });
				else jump();
			}
			wasActive = a;
		});
	});

	// Prozentwert wird erst nach der ersten Breitenmessung gezeichnet: dann neu vermessen
	$effect(() => {
		if (pctEl && w) untrack(measure);
	});

	// Start-Animation: vom Anfang der Startbahn bis zum Stand, gleichzeitig mit Globus und Zählern
	$effect(() => {
		const it = ui.intro;
		if (!it.key) return;
		untrack(() => {
			if (!active) return landing ? undefined : jump(); // Welt im Hintergrund (Start im Tab Flüge): gleich an ihre Stelle
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
			clearTimeout(boostGone);
			clearTimeout(settleT);
			clearTimeout(handT);
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
			{#if landing}
				<!-- Flughafen: Befeuerung der Landebahn, Terminal, Tower mit Blinklicht; vor der Sonne als dunkle Silhouette -->
				{#each port.lights as x, i (i)}<circle class="flight-light" cx={x} cy={H - 2} r="1.5" />{/each}
				<path class="flight-port" d={port.d} fill-rule="evenodd" />
				<path class="flight-plane-sil" d={port.d} fill-rule="evenodd" clip-path="url(#sun-{uid})" />
				<circle class="flight-beacon" cx={port.beacon.x} cy={port.beacon.y} r="1.8" />
			{/if}
			<path class="flight-rest" {d} />
			<path class="flight-done" {d} bind:this={pathEl} stroke-dasharray="{len * Math.max(0, Math.min(1, shown))} {len + 10}" />
			{#if boost && len}
				<!-- Nachbrenner: Spur hinter dem Flugzeug und das neue Stück leuchten kurz sonnengelb -->
				<path
					class="flight-boost"
					{d}
					style="opacity:{boostAlpha}"
					stroke-dasharray="0 {len * boost.from} {Math.max(0, len * (shown - boost.from))} {len * 2}"
				/>
			{/if}
			{#if plane && planeVisible}
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
		<div class="flight-pct" class:top={landing} style={landing ? `top:${Math.max(4, btnBottom + 12)}px` : ''} bind:this={pctEl}><b>{fmt(shownPct)} %</b><span>{label}</span></div>
	{/if}
</div>
