<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { closePass, openCountry, reduceMotion, ui } from '$lib/app.svelte';
	import { flag } from '$lib/countries';
	import { INK_FILTERS, RANKS, rankIndex, stamp, yearOf } from '$lib/passport';
	import { markSeen, passSeen } from '$lib/passSeen.svelte';
	import PassTile from './PassTile.svelte';

	/* Reisepass (Vollbild): Seiten mit je 6 Stempeln in der Reihenfolge „Land Nr. X“, danach „?“-Plätze für
	   Wunschziele. Neue Länder seit dem letzten Öffnen werden beim Öffnen sichtbar gestempelt. */

	const PER_PAGE = 6;
	let body: HTMLDivElement;

	const stamps = $derived(countedCountries().map((c, i) => ({ code: c.code, name: c.name, nr: i + 1, entered: c.entered, s: stamp(c.code, i + 1, c.entered) })));
	const wishes = $derived(atlas.data.wishlist.slice(0, 4));
	const pages = $derived.by(() => {
		const slots: ({ kind: 'stamp'; st: (typeof stamps)[number] } | { kind: 'wish'; code: string; name: string })[] = [
			...stamps.map((st) => ({ kind: 'stamp' as const, st })),
			...wishes.map((w) => ({ kind: 'wish' as const, code: w.code, name: w.name }))
		];
		const out: { slots: typeof slots; years: string }[] = [];
		for (let i = 0; i < slots.length; i += PER_PAGE) {
			const part = slots.slice(i, i + PER_PAGE);
			const ys = part.flatMap((x) => (x.kind === 'stamp' && x.st.entered ? [yearOf(x.st.entered)] : []));
			const lo = Math.min(...ys),
				hi = Math.max(...ys);
			out.push({ slots: part, years: ys.length ? (lo === hi ? String(lo) : `${lo} – ${hi}`) : '' });
		}
		return out;
	});
	const ri = $derived(rankIndex(stamps.length));

	/* ---------- Stempel-Animation beim Öffnen ---------- */
	// Stempel, die gerade noch auf ihren Auftritt warten (unsichtbar)
	let pending = $state<string[]>([]);
	let opened = false;
	$effect(() => {
		if (!ui.passOpen) {
			opened = false;
			return;
		}
		if (opened) return;
		opened = true;
		untrack(() => {
			const codes = stamps.map((s) => s.code);
			const seen = passSeen.codes;
			const fresh = seen ? codes.filter((c) => !seen.includes(c)).slice(-3) : [];
			markSeen(codes);
			body?.scrollTo(0, 0);
			if (!fresh.length || reduceMotion()) return;
			pending = fresh;
			play(fresh);
		});
	});

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

	async function play(codes: string[]) {
		await tick();
		await wait(350); // Ansicht gleitet erst herein
		for (const code of codes) {
			const slot = body?.querySelector<HTMLElement>(`[data-stamp="${code}"]`);
			if (!slot || !ui.passOpen) break;
			slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
			await wait(500);
			pending = pending.filter((c) => c !== code);
			await tick();
			const el = slot.querySelector<HTMLElement>('.pp-stamp');
			if (!el) continue;
			// Stempel fällt mit Schwung herunter, quetscht und federt nach
			await el.animate(
				[
					{ transform: 'translateY(-180px) scale(2.2) rotate(-22deg)', opacity: 0 },
					{ transform: 'translateY(-30px) scale(1.4) rotate(-6deg)', opacity: 0.6, offset: 0.6 },
					{ transform: 'translateY(0) scale(.86,.8) rotate(0)', opacity: 1 }
				],
				{ duration: 420, easing: 'cubic-bezier(.6,0,.9,.5)' }
			).finished;
			el.animate([{ transform: 'scale(.86,.8)' }, { transform: 'scale(1.08,1.05)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
			slot.closest('.pp-page')?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(-1px)' }, { transform: 'translateY(0)' }], { duration: 260 });
			navigator.vibrate?.(20);
			burst(slot);
			await wait(700);
		}
		pending = [];
	}

	/** Tintenspritzer, Konfetti und „+1 Stempel“ über dem Stempel */
	function burst(slot: HTMLElement) {
		const r = slot.getBoundingClientRect(),
			cx = r.left + r.width / 2,
			cy = r.top + r.height / 2;
		const ink = css('--primary'),
			cols = [css('--sun'), css('--primary'), css('--st-coral'), css('--st-teal'), css('--sun')];
		for (let i = 0; i < 26; i++) {
			const e = document.createElement('i'),
				sz = 5 + Math.random() * 5,
				splash = i < 8;
			e.className = 'pp-fx';
			Object.assign(e.style, {
				left: cx + 'px',
				top: cy + 'px',
				width: sz + 'px',
				height: (splash ? sz : sz * 1.6) + 'px',
				background: splash ? ink : cols[i % 5],
				borderRadius: splash ? '50%' : '2px'
			});
			document.body.appendChild(e);
			const a = Math.random() * Math.PI * 2,
				d = (splash ? 70 : 90) + Math.random() * 90;
			e.animate(
				[
					{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
					{ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.8 - 30}px) rotate(${Math.random() * 600 - 300}deg)`, opacity: 1, offset: 0.7 },
					{ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.8 + 20}px)`, opacity: 0 }
				],
				{ duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }
			).finished.then(() => e.remove());
		}
		const p = document.createElement('div');
		p.className = 'pp-fx pp-plus';
		p.textContent = '+1 Stempel';
		Object.assign(p.style, { left: cx + 'px', top: r.top + 10 + 'px' });
		document.body.appendChild(p);
		p.animate(
			[
				{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 },
				{ transform: 'translate(-50%,-26px) scale(1.1)', opacity: 1, offset: 0.3 },
				{ transform: 'translate(-50%,-60px)', opacity: 0 }
			],
			{ duration: 1300, easing: 'ease-out' }
		).finished.then(() => p.remove());
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov pp-view" id="passView" role="dialog" aria-modal="true" aria-labelledby="passTitle" hidden={!ui.passOpen}>
	<svg class="pp-defs" aria-hidden="true" focusable="false"><defs>{@html INK_FILTERS}</defs></svg>
	<div class="ov-head">
		<button type="button" class="ov-close" id="passClose" aria-label="Reisepass schließen" onclick={() => closePass(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="passTitle">Reisepass</h1>
	</div>
	<div class="ov-body" bind:this={body}>
		{#if ui.passOpen}
			<div style="margin-top:20px"><PassTile inPass /></div>
			<ol class="pp-ranks" aria-label="Ränge">
				{#each RANKS as r, i (r.n)}
					<li class:on={i <= ri} class:cur={i === ri}><span aria-hidden="true">{r.icon}</span><b>{r.name}</b><small>{r.n}</small></li>
				{/each}
			</ol>

			{#if !stamps.length}
				<p class="empty">Noch keine Stempel. Für jedes bereiste Land kommt hier ein Stempel in deinen Pass.</p>
			{/if}
			{#each pages as pg, pi (pi)}
				<div class="pp-page">
					<div class="pp-page-h"><span>Stempel</span><span>{pg.years}</span></div>
					<div class="pp-grid">
						{#each pg.slots as sl (sl.kind + (sl.kind === 'stamp' ? sl.st.code : sl.code))}
							{#if sl.kind === 'stamp'}
								<button
									type="button"
									class="pp-slot"
									data-stamp={sl.st.code}
									class:wait={pending.includes(sl.st.code)}
									style="transform:translateY({sl.st.s.dy}px) rotate({sl.st.s.rot}deg);--c:{sl.st.s.color};--w:{sl.st.s.w}%"
									aria-label="{sl.st.name}, Land Nr. {sl.st.nr}"
									onclick={() => openCountry(sl.st.code)}>{@html sl.st.s.svg}</button
								>
							{:else}
								<button type="button" class="pp-slot" aria-label="Wunschziel {sl.name}" onclick={() => openCountry(sl.code)}
									><span class="pp-empty"><b>?</b>Wunschziel<br />{flag(sl.code)} {sl.name}</span></button
								>
							{/if}
						{/each}
					</div>
					<div class="pp-page-n">{pi + 1}</div>
				</div>
			{/each}
			{#if stamps.length}
				<p class="note">Stempel antippen öffnet das Land. Dort kannst du auch das Datum der ersten Einreise eintragen – es erscheint dann auf dem Stempel.</p>
			{/if}
		{/if}
	</div>
</section>
