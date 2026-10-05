<script lang="ts">
	import { sendLoginLink, verifyCode } from '$lib/auth.svelte';

	let step = $state<'email' | 'sent'>('email');
	let email = $state('');
	let code = $state('');
	let busy = $state(false);
	let err = $state('');
	let info = $state('');

	function errText(e: unknown) {
		const x = e as { status?: number; code?: string; message?: string };
		if (x?.status === 429 || /rate/i.test(x?.code ?? '')) return 'Zu viele Versuche. Warte ein paar Minuten und versuche es dann erneut.';
		if (x?.code === 'otp_expired' || /expired|invalid/i.test(x?.message ?? '')) return 'Der Code ist falsch oder abgelaufen. Fordere einen neuen Link an.';
		if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'Keine Internetverbindung.';
		return 'Das hat nicht geklappt. Bitte versuche es noch einmal.';
	}

	async function send(e?: SubmitEvent) {
		e?.preventDefault();
		const m = email.trim();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) {
			err = 'Bitte eine gültige E-Mail-Adresse eingeben.';
			return;
		}
		busy = true;
		err = '';
		info = '';
		try {
			await sendLoginLink(m);
			email = m;
			step = 'sent';
			code = '';
			info = 'E-Mail ist unterwegs.';
		} catch (x) {
			err = errText(x);
		}
		busy = false;
	}

	async function verify(e: SubmitEvent) {
		e.preventDefault();
		const t = code.replace(/\s/g, '');
		if (!/^\d{6,10}$/.test(t)) {
			err = 'Bitte den Code aus der E-Mail eingeben.';
			return;
		}
		busy = true;
		err = '';
		try {
			await verifyCode(email, t);
		} catch (x) {
			err = errText(x);
		}
		busy = false;
	}
</script>

<section id="loginBox">
	<h2>Anmelden</h2>
	<div class="card">
		{#if step === 'email'}
			<p class="note" style="margin-top:0">
				Deine Länder werden in deinem Konto gespeichert und sind auf all deinen Geräten gleich. Du bekommst einen Anmeldelink per E-Mail, ein Passwort brauchst du nicht.
			</p>
			<form onsubmit={send} novalidate>
				<div class="field">
					<label class="lbl" for="loginEmail">E-Mail-Adresse</label>
					<input class="input" id="loginEmail" type="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="name@beispiel.de" bind:value={email} />
				</div>
				<button class="btn primary" type="submit" disabled={busy}>{busy ? 'Wird gesendet …' : 'Anmeldelink senden'}</button>
			</form>
		{:else}
			<p class="note" style="margin-top:0">
				Wir haben dir eine E-Mail an <b>{email}</b> geschickt. Tippe auf den Link darin. Nutzt du die App vom Home-Bildschirm, gib stattdessen hier den Code aus der E-Mail ein.
			</p>
			<form onsubmit={verify} novalidate>
				<div class="field">
					<label class="lbl" for="loginCode">Code aus der E-Mail</label>
					<input class="input short" id="loginCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="12" placeholder="123456" bind:value={code} />
				</div>
				<div class="data-row">
					<button class="btn primary" type="submit" disabled={busy}>Anmelden</button>
					<button class="btn" type="button" disabled={busy} onclick={() => send()}>Erneut senden</button>
					<button class="btn" type="button" onclick={() => ((step = 'email'), (err = ''), (info = ''))}>Andere E-Mail</button>
				</div>
			</form>
		{/if}
		{#if info && !err}<p class="note">{info}</p>{/if}
		<p class="err" role="alert">{err}</p>
	</div>
</section>
