<script lang="ts">
	import { factsNow, loadWater, type Facts } from '$lib/facts';
	import { visitedSet } from '$lib/atlas.svelte';
	import { H, W, miniMap, miniMapCached, prefetchMiniMaps, type MiniMap } from '$lib/map/minimap';

	/* Kartenausschnitt des Landes im Stil des Globus: Land hervorgehoben (bereist türkis, sonst Landfarbe mit hellem
	   Umriss), Nachbarn gedämpft, dazu die wichtigsten Flüsse und Seen, Hauptstadt und höchster Berg (Berechnung in
	   map/minimap.ts). Schon berechnete Karten (z. B. vorab berechnete Nachbarn) erscheinen sofort. */

	let { code, been = false, facts = null }: { code: string; been?: boolean; facts?: Facts | null } = $props();

	const uid = 'cs' + Math.random().toString(36).slice(2, 8); // eigene ID für den Zuschnitt aufs Land

	// svelte-ignore state_referenced_locally
	let map = $state<MiniMap | null | undefined>(miniMapCached(code));
	// svelte-ignore state_referenced_locally
	const fade = map === undefined; // nur sanft einblenden, wenn erst gerechnet werden musste
	$effect(() => {
		if (map !== undefined || !facts) return;
		// erst rechnen, wenn die Länderkarte aufgeglitten ist – sonst ruckelt das Öffnen
		let alive = true;
		const t = setTimeout(
			() =>
				loadWater().then((w) => {
					if (alive) map = miniMap(code, facts, w);
				}),
			380
		);
		return () => {
			alive = false;
			clearTimeout(t);
		};
	});
	// danach die Nachbarn im Leerlauf vorberechnen: der Wechsel zu einem Nachbarland zeigt die Karte dann sofort
	$effect(() => {
		if (!map || !facts?.nb?.length) return;
		const nb = facts.nb;
		loadWater().then((w) => prefetchMiniMaps(nb.map((c) => ({ code: c, facts: factsNow(c) })), w));
	});

	const visited = $derived(visitedSet());
	// Nachbarschaft getrennt nach bereist (türkis) und nicht bereist (Landfarbe) – wie auf dem Globus
	const around = $derived.by(() => {
		const parts = map?.around ?? [];
		return { been: parts.filter((p) => visited.has(p.id)).map((p) => p.d).join(''), rest: parts.filter((p) => !visited.has(p.id)).map((p) => p.d).join('') };
	});
</script>

{#if map}
	<svg class="cshape" class:fade viewBox="0 0 {W} {H}" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
		<defs>
			<radialGradient id="cs-sea" cx="35%" cy="25%" r="90%">
				<stop offset="0" stop-color="#1D5A7A" />
				<stop offset="1" stop-color="#0C2E45" />
			</radialGradient>
			<clipPath id="{uid}-clip"><path d={map.land} /></clipPath>
			<filter id="cs-glow" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="6" />
			</filter>
		</defs>
		<rect width={W} height={H} fill="url(#cs-sea)" />
		<path d={map.grat} fill="none" stroke="rgba(255,255,255,.07)" stroke-width=".6" />
		<!-- Farben wie auf dem Globus: Länder in Landfarbe, bereist türkis; das Land selbst hell umrandet (wie ausgewählt),
		     die Nachbarn etwas zurückgenommen -->
		<g opacity=".62" stroke="#0D2A3D" stroke-width=".7" stroke-linejoin="round">
			<path d={around.rest} fill="#4B6F82" />
			<path d={around.been} fill="#34D1BF" />
		</g>
		<path d={map.land} fill={been ? '#34D1BF' : '#9ED3E6'} opacity={been ? 0.5 : 0.28} filter="url(#cs-glow)" />
		<path d={map.land} fill={been ? '#34D1BF' : '#4B6F82'} stroke={been ? '#A0F5E8' : '#FFFFFF'} stroke-width="1.4" stroke-linejoin="round" />
		<!-- Gewässer außerhalb des Landes gedämpft, im Land kräftig -->
		{#each [false, true] as inLand (inLand)}
			<g class="cs-water" class:dim={!inLand} clip-path={inLand ? `url(#${uid}-clip)` : undefined}>
				{#each map.lakes as d, i (i)}<path {d} class="cs-lake" />{/each}
				{#each map.rivers as r, i (i)}<path d={r.d} class="cs-river" stroke-width={r.w} />{/each}
			</g>
		{/each}
		{#if map.peak}
			<g class="cs-peak" transform="translate({map.peak[0].toFixed(1)} {map.peak[1].toFixed(1)})">
				{#if map.peakDir !== null}<path class="cs-peak-dir" transform="rotate({map.peakDir.toFixed(0)})" d="M6.2 -2.6L9.6 0L6.2 2.6" />{/if}
				<circle r="5.6" />
				<path d="M-3.4 1.9l2.2-3.7 1.4 2.2.8-1.1 2.4 2.6z" />
			</g>
		{/if}
		{#if map.cap}
			<rect class="cs-cap" x={map.cap[0] - 3.5} y={map.cap[1] - 3.5} width="7" height="7" rx="1.6" />
		{/if}
		{#each map.labels as l, i (i)}
			<text
				class="cs-lb {l.cls}"
				x={l.x}
				y={l.y}
				text-anchor={l.anchor ?? 'start'}
				transform={l.rot !== undefined ? `rotate(${l.rot.toFixed(1)} ${l.x} ${l.y})` : undefined}
				dominant-baseline={l.rot !== undefined ? 'middle' : undefined}
				>{#if l.split}{l.t.slice(0, l.split)}<tspan class="lb-sub">{l.t.slice(l.split)}</tspan>{:else}{l.t}{/if}</text
			>
		{/each}
	</svg>
{/if}
