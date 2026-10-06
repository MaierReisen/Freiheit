<script lang="ts">
	import { atlas, exportJson, importJson, setCountryScope, setHomeContinent } from '$lib/atlas.svelte';
	import { SCOPES, scopeTotal, type CountryScope } from '$lib/scope';
	import { auth, signOut } from '$lib/auth.svelte';
	import { CONT_NAMES, CONT_VIEW, type ContinentCode } from '$lib/countries';
	import { closeSettings, hooks, prefs, setMotionPref, setThemePref, toast, ui, type MotionPref, type ThemePref } from '$lib/app.svelte';

	/* Einstellungen: Darstellung (Design, Animationen – nur dieses Gerät), Karte (Startregion), Statistik (Was zählt als Land?), Konto (E-Mail, Sync, Abmelden), Daten (Export/Import) */

	const continents = Object.keys(CONT_VIEW) as ContinentCode[];
	const THEMES: { id: ThemePref; label: string }[] = [
		{ id: 'system', label: 'System' },
		{ id: 'light', label: 'Hell' },
		{ id: 'dark', label: 'Dunkel' }
	];
	const MOTIONS: { id: MotionPref; label: string }[] = [
		{ id: 'system', label: 'System' },
		{ id: 'on', label: 'An' },
		{ id: 'off', label: 'Aus' }
	];
	let fileInput: HTMLInputElement;
	let busy = $state(false);

	const syncText = $derived(
		{ idle: 'Gespeichert', saving: 'Wird gespeichert …', offline: 'Offline – wird später gesendet', error: 'Nicht gespeichert – neuer Versuch folgt' }[atlas.sync]
	);

	function chooseContinent(k: ContinentCode) {
		if (k === atlas.settings.homeContinent) return;
		setHomeContinent(k);
		ui.focusContinent = k;
		hooks.map?.flyToContinent(k); // Karte steht beim Schließen schon auf der neuen Region
		toast(`Startregion: ${CONT_NAMES[k]}`);
	}

	const scopeDesc = $derived(SCOPES.find((s) => s.id === atlas.settings.countryScope)?.desc ?? '');
	function chooseScope(s: CountryScope) {
		if (s === atlas.settings.countryScope) return;
		setCountryScope(s);
		toast(`Es zählen jetzt ${scopeTotal(s)} Länder`);
	}

	async function onFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		if (!f) return;
		if (!confirm('Importieren? Deine Länder und Meilensteine im Konto werden durch die Datei ersetzt.')) {
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

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov set-view" id="settingsView" role="dialog" aria-modal="true" aria-labelledby="setTitle" hidden={!ui.settingsOpen}>
	<div class="ov-head">
		<button type="button" class="ov-close" id="setClose" aria-label="Einstellungen schließen" onclick={() => closeSettings(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="setTitle">Einstellungen</h1>
	</div>
	<div class="ov-body">
		<h2 style="margin-top:24px">Darstellung</h2>
		<div class="card">
			<div class="field">
				<span class="lbl" id="themeLbl">Design<small>„System“ folgt der Einstellung deines Geräts.</small></span>
				<div class="chips" role="group" aria-labelledby="themeLbl">
					{#each THEMES as o (o.id)}
						<button type="button" class="chip" aria-pressed={prefs.theme === o.id} onclick={() => setThemePref(o.id)}>{o.label}</button>
					{/each}
				</div>
			</div>
			<div class="field" style="margin-bottom:0">
				<span class="lbl" id="motionLbl"
					>Animationen<small>Zähler, Flugkurve und Globus beim Öffnen. Bei „Aus“ steht alles sofort am Ziel; „System“ folgt „Bewegung reduzieren“ deines Geräts.</small></span
				>
				<div class="chips" role="group" aria-labelledby="motionLbl">
					{#each MOTIONS as o (o.id)}
						<button type="button" class="chip" aria-pressed={prefs.motion === o.id} onclick={() => setMotionPref(o.id)}>{o.label}</button>
					{/each}
				</div>
			</div>
			<p class="note" style="margin-bottom:0">Gilt nur auf diesem Gerät.</p>
		</div>

		<h2>Karte</h2>
		<div class="card">
			<div class="field" style="margin-bottom:0">
				<span class="lbl" id="homeContLbl">Startregion<small>Darauf zoomt der Globus beim Öffnen der App.</small></span>
				<div class="chips" role="group" aria-labelledby="homeContLbl">
					{#each continents as k (k)}
						<button type="button" class="chip" aria-pressed={atlas.settings.homeContinent === k} onclick={() => chooseContinent(k)}>{CONT_NAMES[k]}</button>
					{/each}
				</div>
			</div>
		</div>

		<h2>Statistik</h2>
		<div class="card">
			<div class="field" style="margin-bottom:0">
				<span class="lbl" id="scopeLbl">Was zählt als Land?<small>Bestimmt deine Länderzahl und den Fortschritt. Gebiete wie Grönland kannst du trotzdem markieren, sie zählen dann nicht mit.</small></span>
				<div class="chips" role="group" aria-labelledby="scopeLbl">
					{#each SCOPES as s (s.id)}
						<button type="button" class="chip" aria-pressed={atlas.settings.countryScope === s.id} onclick={() => chooseScope(s.id)}>{s.label}<small>{scopeTotal(s.id)}</small></button>
					{/each}
				</div>
				<p class="note" style="margin-bottom:0">{scopeDesc}</p>
			</div>
		</div>

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
	</div>
</section>
