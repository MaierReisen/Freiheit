<script lang="ts">
	import { closeSheet, ui } from '$lib/app.svelte';
	import CountryPicker from './CountryPicker.svelte';
	import CountrySheet from './CountrySheet.svelte';
</script>

<div class="scrim" class:open={ui.sheetOpen} id="scrim" onclick={closeSheet} role="presentation"></div>
<div class="sheet" class:open={ui.sheetOpen} id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
	{#if ui.sheetView}
		{#key ui.sheetKey}
			<div class="grab"></div>
			{#if ui.sheetView.kind === 'country'}
				<CountrySheet code={ui.sheetView.code} />
			{:else}
				<CountryPicker mode={ui.sheetView.mode} />
			{/if}
		{/key}
	{/if}
</div>
