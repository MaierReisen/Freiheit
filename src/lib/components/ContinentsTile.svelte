<script lang="ts">
	import { atlas, isCounted } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, type ContinentCode } from '$lib/countries';
	import { openContinents } from '$lib/app.svelte';

	/* Zeile „Deine Kontinente“ im Bereich „Deine Welt“: wie viele der 7 Kontinente bereist sind, hinter der Zahl je bereistem
	   Kontinent ein farbiger Punkt, je noch offenem ein leerer Kreis (Farben --ct-XX in app.css). Antippen öffnet die Seite „Deine Kontinente“. */

	const KEYS = Object.keys(CONT_NAMES) as ContinentCode[];
	const have = $derived.by(() => {
		const s = new Set<ContinentCode>();
		atlas.data.countries.forEach((x) => {
			const k = CONT[x.code];
			if (k && isCounted(x.code)) s.add(k);
		});
		return KEYS.filter((k) => s.has(k));
	});
	const n = $derived(have.length);
</script>

<button type="button" class="cat-row" aria-label="Deine Kontinente öffnen: {n} von {KEYS.length}" onclick={() => openContinents()}>
	<span class="cat-ico" aria-hidden="true">
		<!-- Goldprägung wie auf dem Reisepass: gefaltete Landkarte -->
		<svg viewBox="0 0 24 24"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20" /></svg>
	</span>
	<span class="cat-txt">
		<span class="cat-name">Deine Kontinente</span>
		<span class="cat-sub">{n} von {KEYS.length} Kontinenten<span class="cat-dots" aria-hidden="true">{#each have as k (k)}<i style="--cc:var(--ct-{k})" title={CONT_NAMES[k]}></i>{/each}{#each { length: KEYS.length - n } as _, i (i)}<i class="off"></i>{/each}</span></span>
		<span class="cat-bar"><i style="width:{(n / KEYS.length) * 100}%"></i></span>
	</span>
</button>
