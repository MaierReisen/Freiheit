<script lang="ts">
	import { entryDate, entryNow, loadEntry, type Entry } from '$lib/facts';
	import { nameOf } from '$lib/countries';

	/* Einreise für Deutsche: Reisewarnung, Visum (Art und Dauer), Personalausweis/Reisepass – Quelle Auswärtiges Amt.
	   Haben sich die Regeln seit der Prüfung geändert, steht statt der Einordnung der Satz des Amts. */

	let { code }: { code: string } = $props();

	// svelte-ignore state_referenced_locally
	let e = $state<Entry | null>(entryNow(code) ?? null);
	let date = $state(entryDate());
	$effect(() => {
		if (e) return;
		loadEntry().then((d) => {
			e = d.c[code] ?? null;
			date = d.date;
		});
	});

	const fmtDate = (d: string) => d.split('-').reverse().join('.');
	const today = new Date().toISOString().slice(0, 10);
	const expired = $derived(!!e?.u && e.u < today);

	const STATUS: Record<Entry['k'], { t: string; tone: 'ok' | 'mid' | 'hard' | 'info' }> = {
		eu: { t: 'Kein Visum nötig', tone: 'ok' },
		free: { t: 'Visumfrei', tone: 'ok' },
		auth: { t: 'Online-Genehmigung nötig', tone: 'mid' },
		arrival: { t: 'Visum bei Ankunft', tone: 'mid' },
		evisa: { t: 'E-Visum vorab', tone: 'mid' },
		visa: { t: 'Visum vorab nötig', tone: 'hard' },
		special: { t: 'Sonderregeln', tone: 'info' }
	};
	const st = $derived(e ? (e.chg ? { t: 'Regeln kürzlich geändert', tone: 'info' as const } : STATUS[e.k]) : null);
	const days = $derived(e && !e.chg && e.d ? `bis ${e.d} Tage` : '');
	const link = $derived(e?.link ?? (e?.id ? `https://www.auswaertiges-amt.de/de/${e.id}` : ''));
</script>

{#if e && st}
	<div class="cs-tile wide cs-entry">
		<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></svg>
		<span class="lbl">Einreise für Deutsche</span>

		{#if e.w === 2}
			<div class="en-warn hard"><b>Reisewarnung</b> – das Auswärtige Amt warnt vor Reisen in dieses Land.</div>
		{:else if e.w === 1}
			<div class="en-warn"><b>Teilreisewarnung</b> – für einzelne Landesteile wird gewarnt.</div>
		{/if}
		{#if e.wt}<div class="en-warn"><b>{e.wt}</b></div>{/if}

		<div class="en-status {st.tone}">
			<i aria-hidden="true"></i>
			<b>{st.t}</b>
			{#if days}<span class="en-days">{days}</span>{/if}
		</div>
		{#if e.chg}
			{#if e.s}<p class="en-quote">„{e.s}“</p>{/if}
		{:else if e.n}
			<span class="sub">{e.n}</span>
		{/if}
		{#if e.u && !e.chg}
			<span class="sub" class:warn={expired}>{expired ? `Regelung war bis ${fmtDate(e.u)} befristet – bitte aktuell prüfen` : `befristet bis ${fmtDate(e.u)}`}</span>
		{/if}

		{#if e.pa || e.rp}
			<div class="en-docs">
				{#each [['Personalausweis', e.pa, e.pat], ['Reisepass', e.rp, e.rpt]] as [label, v, note] (label)}
					{#if v}
						<span class="en-doc {v}">
							{#if v === 'n'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
							{:else}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{/if}
							{label}{#if v === 'r' && !note}<small>mit Einschränkungen</small>{/if}
						</span>
						{#if v === 'r' && note}<span class="sub en-docnote"><b>{label}:</b> {note}</span>{/if}
					{/if}
				{/each}
			</div>
		{/if}

		{#if link}
			<a class="en-link" href={link} target="_blank" rel="noopener noreferrer">
				{e.link ? 'Umweltbundesamt: Reisen in die Antarktis' : e.par ? `Reise- und Sicherheitshinweise ${nameOf(e.par)}` : 'Reise- und Sicherheitshinweise'}
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" /></svg>
			</a>
		{/if}
		<span class="sub en-src">{e.id ? `Auswärtiges Amt · Stand ${fmtDate(e.lm ?? date)}` : ''}{e.par ? ' (gilt mit für dieses Gebiet)' : ''}</span>
	</div>
{/if}
