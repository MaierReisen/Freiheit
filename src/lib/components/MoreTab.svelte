<script lang="ts">
	import { atlas, exportJson, importJson } from '$lib/atlas.svelte';
	import { auth, signOut } from '$lib/auth.svelte';
	import { toast } from '$lib/app.svelte';

	let fileInput: HTMLInputElement;
	let busy = $state(false);

	const syncText = $derived(
		{ idle: 'Gespeichert', saving: 'Wird gespeichert …', offline: 'Offline – wird später gesendet', error: 'Nicht gespeichert – neuer Versuch folgt' }[atlas.sync]
	);

	async function onFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		if (!f) return;
		if (!confirm('Importieren? Deine Länder, Wunschliste und Meilensteine im Konto werden durch die Datei ersetzt.')) {
			input.value = '';
			return;
		}
		await importJson(f);
		input.value = '';
	}

	async function logout() {
		if (!confirm('Abmelden? Deine Daten bleiben in deinem Konto gespeichert und werden von diesem Gerät entfernt.')) return;
		busy = true;
		let ok = await signOut();
		if (!ok && confirm('Einige Änderungen konnten noch nicht gespeichert werden und gehen beim Abmelden verloren. Trotzdem abmelden?')) ok = await signOut(true);
		if (!ok) toast('Abmelden abgebrochen');
		busy = false;
	}
</script>

<h2>Konto</h2>
<div class="card" style="padding-top:8px;padding-bottom:8px">
	<div class="kv"><span>Angemeldet als</span><span id="accEmail" style="text-align:right;overflow-wrap:anywhere">{auth.user?.email ?? '–'}</span></div>
	<div class="kv"><span>Synchronisierung</span><span id="syncStatus" style="text-align:right" class:err-text={atlas.sync === 'error'}>{syncText}</span></div>
</div>
<div class="data-row" style="margin-top:14px">
	<button class="btn" id="logoutBtn" disabled={busy} onclick={logout}>Abmelden</button>
</div>

<h2>Daten</h2>
<div class="data-row">
	<button class="btn" id="exportBtn" onclick={exportJson}>Als JSON exportieren</button>
	<button class="btn" id="importBtn" onclick={() => fileInput.click()}>JSON importieren</button>
	<input type="file" id="importFile" accept="application/json,.json" hidden bind:this={fileInput} onchange={onFile} />
</div>
<p class="note">
	Deine Daten werden in deinem Konto gespeichert und auf all deinen Geräten synchronisiert. Ohne Internet arbeitet die App mit dem letzten Stand weiter und sendet Änderungen später. Der JSON-Export ist eine
	zusätzliche Sicherung.
</p>
