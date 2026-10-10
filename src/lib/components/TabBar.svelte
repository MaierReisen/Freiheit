<script lang="ts">
	import { TABS, TAB_LABEL, goTab, ui } from '$lib/app.svelte';
</script>

<nav class="tabbar" id="tabbar" aria-label="Hauptnavigation">
	<div class="tabbar-in">
		<span class="ind" id="tabInd" aria-hidden="true" style="transform:translateX({TABS.indexOf(ui.tab) * 100}%);width:calc((100% - 12px)/{TABS.length})"></span>
		{#each TABS as t}
			<button type="button" data-tab={t} aria-current={ui.tab === t ? 'page' : undefined} onclick={() => goTab(t)}>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					{#if t === 'home'}
						<circle class="f" cx="12" cy="12" r="9" /><path class="d" d="M12 3c-2.6 2.5-4.1 5.5-4.1 9s1.5 6.5 4.1 9c2.6-2.5 4.1-5.5 4.1-9S14.6 5.5 12 3z" /><path
							class="d"
							d="M3.2 12h17.6M5 7.6c4.4 1.5 9.6 1.5 14 0M5 16.4c4.4-1.5 9.6-1.5 14 0"
						/>
					{/if}
				</svg><span>{TAB_LABEL[t]}</span></button
			>
		{/each}
	</div>
</nav>
