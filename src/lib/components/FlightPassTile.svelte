<script lang="ts">
	import { openFlightPass } from '$lib/app.svelte';
	import { CARD_NAME, flightRankInfo } from '$lib/flightPass';

	/* Flugpass-Kachel: Vielflieger-Karte (Farbe steigt mit dem Status: Blau, Silber, Gold, Platin, Schwarz), Zahl der Flüge,
	   Status und Fortschritt bis zum nächsten. Im Tab „Flüge“ ein Knopf (öffnet den Flugpass), im Flugpass kompakt als Knopf zu den Stufen. */

	// cards: Zahl der Bordkarten (eine je Strecke) – groß auf der Kachel im Tab, im Flugpass selbst steht die Zahl der Flüge (Status)
	let { n, cards = 0, fresh = 0, inPass = false, onrank }: { n: number; cards?: number; fresh?: number; inPass?: boolean; onrank?: () => void } = $props();
	const info = $derived(flightRankInfo(n));
</script>

{#snippet body()}
	<span class="fp-card c{info.card}" aria-hidden="true">
		<i class="fp-chip"></i>
		<svg viewBox="0 0 24 24"><path d="M21 15.5v-1.6l-8-5V3.6a1.5 1.5 0 0 0-3 0v5.3l-8 5v1.6l8-2.4v5.1l-2 1.5V21l3.5-1 3.5 1v-1.3l-2-1.5v-5.1z" /></svg>
		<b>FLUGPASS</b>
		{#if info.card}<small>{CARD_NAME[info.card]}</small>{/if}
	</span>
	<span class="pp-tile-txt">
<span class="pp-tile-n">{inPass ? n : cards}<small>{inPass ? (n === 1 ? 'Flug' : 'Flüge') : cards === 1 ? 'Bordkarte' : 'Bordkarten'}</small>{#if fresh && !inPass}<em class="pp-new">✨ {fresh} neu</em>{/if}</span>
		{#if info.rank}<span class="pp-rank fp-rank c{info.card}">{info.rank.icon} {info.rank.name}</span>{/if}
		<span class="pp-bar fp-bar"><i style="width:{info.p * 100}%"></i></span>
		<span class="pp-bar-t"
			>{#if info.next}Noch {info.left} {info.left === 1 ? 'Flug' : 'Flüge'} bis <b>{info.next.name}</b>{:else}Höchster Status erreicht{/if}</span
		>
	</span>
{/snippet}

{#if inPass}
	<button type="button" class="pp-tile fp-tile in-pass" aria-label="{n} {n === 1 ? 'Flug' : 'Flüge'}{info.rank ? `, Status ${info.rank.name}` : ''} – alle Stufen zeigen" onclick={() => onrank?.()}
		>{@render body()}<span class="pp-chev" aria-hidden="true">›</span></button
	>
{:else}
<button type="button" class="pp-tile fp-tile" class:fresh={fresh > 0} aria-label="Flugpass öffnen: {cards} {cards === 1 ? 'Bordkarte' : 'Bordkarten'}{fresh ? `, ${fresh} neue Bordkarten` : ''}{info.rank ? `, Status ${info.rank.name}` : ''}" onclick={() => openFlightPass()}>{@render body()}</button>
{/if}
