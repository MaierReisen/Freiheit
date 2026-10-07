<script lang="ts">
	import { countedCountries } from '$lib/atlas.svelte';
	import { openPass } from '$lib/app.svelte';
	import { rankInfo } from '$lib/passport';
	import { passSeen } from '$lib/passSeen.svelte';

	/* Reisepass-Kachel: Zähler, Rang-Abzeichen und Fortschritt bis zum nächsten Rang.
	   In der Länderliste ein Knopf (öffnet den Pass), im Pass selbst nur die Anzeige. */

	let { inPass = false }: { inPass?: boolean } = $props();

	const codes = $derived(countedCountries().map((c) => c.code));
	const n = $derived(codes.length);
	const info = $derived(rankInfo(n));
	// neue Stempel seit dem letzten Blick in den Pass
	const fresh = $derived(passSeen.codes ? codes.filter((c) => !passSeen.codes!.includes(c)).length : 0);
</script>

{#snippet body()}
	<span class="pp-cover" aria-hidden="true"
		><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" /><ellipse cx="20" cy="20" rx="7" ry="16" /><path d="M4 20h32" /></svg><b>REISEPASS</b></span
	>
	<span class="pp-tile-txt">
		<span class="pp-tile-n">{n}<small>Stempel</small>{#if fresh && !inPass}<em class="pp-fresh">+{fresh} neu</em>{/if}</span>
		{#if info.rank}<span class="pp-rank">{info.rank.icon} {info.rank.name}</span>{/if}
		<span class="pp-bar"><i style="width:{info.p * 100}%"></i></span>
		<span class="pp-bar-t"
			>{#if info.next}Noch {info.left} Stempel bis <b>{info.next.name}</b>{:else}Höchster Rang erreicht{/if}</span
		>
	</span>
{/snippet}

{#if inPass}
	<div class="pp-tile">{@render body()}</div>
{:else}
	<button type="button" class="pp-tile" aria-label="Reisepass öffnen: {n} Stempel{info.rank ? `, Rang ${info.rank.name}` : ''}" onclick={() => openPass()}>{@render body()}</button>
{/if}
