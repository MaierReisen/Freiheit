<script lang="ts">
	import { exportJson, importJson } from '$lib/atlas.svelte';

	let fileInput: HTMLInputElement;

	async function onFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		if (!f) return;
		await importJson(f);
		input.value = '';
	}
</script>

<h2>Daten</h2>
<div class="data-row">
	<button class="btn" id="exportBtn" onclick={exportJson}>Als JSON exportieren</button>
	<button class="btn" id="importBtn" onclick={() => fileInput.click()}>JSON importieren</button>
	<input type="file" id="importFile" accept="application/json,.json" hidden bind:this={fileInput} onchange={onFile} />
</div>
<p class="note">
	Deine Daten liegen vorerst nur in diesem Browser auf diesem Gerät. Sichere sie regelmäßig als JSON. Die Länderliste ist so aufgebaut, dass später pro Land Besuche mit Jahr, Städten, Kosten und Notizen
	ergänzt werden können.
</p>
