<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { atlas, countedCountries } from '$lib/atlas.svelte';
	import { closePass, openCountry, reduceMotion, ui } from '$lib/app.svelte';
	import { flag } from '$lib/countries';
	import { INK_FILTERS, rankIndex, ranks, stamp, yearOf } from '$lib/passport';
	import { badgeLevels, badges, tierName, type Badge } from '$lib/badges';
	import { loadFacts, type Facts } from '$lib/facts';
	import { scopeTotal } from '$lib/scope';
	import { markSeen, passSeen } from '$lib/passSeen.svelte';
	import PassTile from './PassTile.svelte';

	/* Reisepass (Vollbild): Seiten zum Blättern mit je 6 Stempeln in der Reihenfolge „Land Nr. X“, danach „?“-Plätze für
	   Wunschziele. Neue Länder seit dem letzten Öffnen werden beim Öffnen sichtbar gestempelt. */

	const PER_PAGE = 6;
	let body: HTMLDivElement;
	let lastScroll = 0; // Scrollposition beim Verlassen merken

	/* Nach unten ziehen schließt den Pass (nur wenn die Seite ganz oben steht) */
	let root: HTMLElement;
	let pg: { y0: number; x0: number; lt: number; ly: number; vy: number; dy: number; on: boolean | null } | null = null;
	function tStart(e: TouchEvent) {
		if (e.touches.length !== 1 || !ui.passOpen) return (pg = null);
		const t = e.touches[0];
		pg = { y0: t.clientY, x0: t.clientX, lt: e.timeStamp, ly: t.clientY, vy: 0, dy: 0, on: null };
	}
	function tMove(e: TouchEvent) {
		if (!pg) return;
		const t = e.touches[0],
			dy = t.clientY - pg.y0,
			dx = t.clientX - pg.x0;
		if (pg.on === null) {
			if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
			pg.on = dy > 0 && Math.abs(dy) > Math.abs(dx) && body.scrollTop <= 0;
			if (pg.on) { pg.ly = t.clientY; pg.lt = e.timeStamp; }
		}
		if (!pg.on) return;
		e.preventDefault();
		const dt = e.timeStamp - pg.lt;
		if (dt >= 12) {
			pg.vy = 0.6 * ((t.clientY - pg.ly) / dt) + 0.4 * pg.vy;
			pg.ly = t.clientY;
			pg.lt = e.timeStamp;
		}
		pg.dy = Math.max(0, dy);
		root.style.transition = 'none';
		root.style.transform = `translateY(${pg.dy}px)`;
	}
	function tEnd() {
		if (!pg) return;
		const d = pg;
		pg = null;
		if (!d.on) return;
		if (d.dy > 140 || (d.vy > 0.6 && d.dy > 40)) {
			root.style.transition = 'transform .18s cubic-bezier(.4,0,1,1)';
			root.style.transform = 'translateY(100%)';
			setTimeout(() => {
				closePass(false);
				root.style.transition = '';
				root.style.transform = '';
			}, 180);
		} else {
			root.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
			root.style.transform = '';
		}
	}
	$effect(() => {
		root.addEventListener('touchstart', tStart, { passive: true });
		root.addEventListener('touchmove', tMove, { passive: false });
		root.addEventListener('touchend', tEnd);
		root.addEventListener('touchcancel', tEnd);
		return () => {
			root.removeEventListener('touchstart', tStart);
			root.removeEventListener('touchmove', tMove);
			root.removeEventListener('touchend', tEnd);
			root.removeEventListener('touchcancel', tEnd);
		};
	});

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
	const total = $derived(scopeTotal(atlas.settings.countryScope));
	const allRanks = $derived(ranks(total));
	const ri = $derived(rankIndex(stamps.length, total));

	/* ---------- Blättern: Wischen oder Seitenleiste ---------- */
	let pager = $state.raw<HTMLDivElement>(undefined as unknown as HTMLDivElement);
	let strip = $state.raw<HTMLDivElement>(undefined as unknown as HTMLDivElement);
	let cur = $state(0);
	let raf = 0;
	function onPager() {
		const i = Math.round(pager.scrollLeft / Math.max(1, pager.clientWidth));
		if (i !== cur) cur = i;
		if (!raf && !reduceMotion()) raf = requestAnimationFrame(flip);
	}
	// Umblätter-Effekt: nur die Seiten direkt neben der aktuellen, nur transform/opacity
	function flip() {
		raf = 0;
		const kids = pager?.children;
		if (!kids || kids.length < 1) return;
		const stride = kids.length > 1 ? (kids[1] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft : pager.clientWidth;
		const x = pager.scrollLeft / Math.max(1, stride);
		const c = Math.round(x);
		for (let i = Math.max(0, c - 1); i <= Math.min(kids.length - 1, c + 1); i++) {
			const p = x - i; // >0: Seite wird nach links weggeblättert, <0: kommt von rechts
			const el = kids[i] as HTMLElement;
			if (Math.abs(p) < 0.005 || Math.abs(p) >= 0.995) el.style.cssText = '';
			else if (p > 0) el.style.cssText = `transform-origin:0 50%;transform:perspective(900px) rotateY(${-p * 55}deg);opacity:${1 - p * 0.35}`;
			else el.style.cssText = `transform-origin:100% 50%;transform:perspective(900px) rotateY(${-p * 14}deg) scale(${1 + p * 0.04});opacity:${1 + p * 0.3}`;
		}
	}
	function goPage(i: number) {
		i = Math.max(0, Math.min(pages.length - 1, i));
		const far = Math.abs(i - cur) > 2 || reduceMotion();
		pager.scrollTo({ left: i * pager.clientWidth, behavior: far ? 'auto' : 'smooth' });
		cur = i;
	}
	// aktive Seitenzahl in der Leiste mittig halten
	$effect(() => {
		const i = cur;
		const el = strip?.children[i + 1] as HTMLElement | undefined; // [0] = Zurück-Pfeil
		if (el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'auto' });
	});

	/* ---------- Abzeichen (Leiste unter der Seite) ---------- */
	let facts = $state.raw<Record<string, Facts> | null>(null);
	$effect(() => {
		if (ui.passOpen && !facts) loadFacts().then((f) => (facts = f));
	});
	const bs = $derived(
		facts ? badges({ codes: stamps.map((s) => s.code), facts, entered: Object.fromEntries(stamps.map((s) => [s.code, s.entered])) }, atlas.settings.countryScope) : []
	);
	let picked = $state<string | null>(null);
	async function choose(id: string | null) {
		picked = id;
		await tick();
		body?.querySelector('.pp-detail')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
	}
	const pick = $derived(bs.find((b) => b.id === picked) ?? null);
	const tierClass = (b: Badge) => (b.level ? ['t1', 't2', 't3'][b.level - 1 + 3 - b.tiers.length] : '');

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
			pager?.scrollTo(0, 0);
			cur = 0;
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
			slot.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
			await wait(600);
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
<section class="ov pp-view" id="passView" bind:this={root} role="dialog" aria-modal="true" aria-labelledby="passTitle" hidden={!ui.passOpen}>
	<svg class="pp-defs" aria-hidden="true" focusable="false"><defs>{@html INK_FILTERS}</defs></svg>
	<div class="ov-head">
		<button type="button" class="ov-close" id="passClose" aria-label="Reisepass schließen" onclick={() => closePass(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="passTitle">Reisepass</h1>
	</div>
	<div class="ov-body" bind:this={body} onscroll={() => { if (ui.passOpen) lastScroll = body.scrollTop; }}>
		{#if ui.passOpen}
			<div style="margin-top:20px"><PassTile inPass /></div>
			<ol class="pp-ranks" aria-label="Ränge">
				{#each allRanks as r, i (r.n)}
					<li class:on={i <= ri} class:cur={i === ri}><span aria-hidden="true">{r.icon}</span><b>{r.name}</b><small>{r.n}</small></li>
				{/each}
			</ol>
			{#if ri >= 0}<p class="pp-say">„{allRanks[ri].say}“</p>{/if}

			{#if !stamps.length}
				<p class="empty">Noch keine Stempel. Für jedes bereiste Land kommt hier ein Stempel in deinen Pass.</p>
			{/if}
			{#if pages.length}
				<div class="pp-pager" bind:this={pager} onscroll={onPager}>
					{#each pages as pg, pi (pi)}
						<div class="pp-page" aria-label="Seite {pi + 1} von {pages.length}">
							<div class="pp-page-h"><span>Stempel · Seite {pi + 1}</span><span>{pg.years}</span></div>
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
						</div>
					{/each}
				</div>
				{#if pages.length > 1}
					<div class="pp-strip" bind:this={strip} role="group" aria-label="Seite wählen">
						<button type="button" class="pp-arrow" aria-label="Vorherige Seite" disabled={cur <= 0} onclick={() => goPage(cur - 1)}>‹</button>
						{#each pages as _, pi (pi)}
							<button type="button" class:on={pi === cur} aria-label="Seite {pi + 1}" aria-current={pi === cur ? 'page' : undefined} onclick={() => goPage(pi)}>{pi + 1}</button>
						{/each}
						<button type="button" class="pp-arrow" aria-label="Nächste Seite" disabled={cur >= pages.length - 1} onclick={() => goPage(cur + 1)}>›</button>
					</div>
				{/if}
			{/if}
			{#if bs.length}
				<div class="pp-visa">
					<div class="pp-page-h"><span>Abzeichen</span><span>{badgeLevels(bs)} / {bs.reduce((s, b) => s + b.tiers.length, 0)}</span></div>
					<div class="pp-badges">
						{#each bs as b (b.id)}
							<button type="button" class="pp-badge {tierClass(b)}" class:sel={picked === b.id} aria-pressed={picked === b.id} onclick={() => choose(picked === b.id ? null : b.id)}>
								<span class="pp-medal" style="--p:{b.level < b.tiers.length ? b.p : 1}" aria-hidden="true"><span>{b.icon}</span></span>
								<b>{b.name}</b>
								<small>{b.level ? tierName(b, b.level) : b.prog}</small>
							</button>
						{/each}
					</div>
					{#if pick}
						<div class="pp-detail" role="status">
							<b>{pick.icon} {pick.name}</b>
							<span>{pick.fmt(pick.v)} {pick.what}</span>
							<span class="pp-tiers"
								>{#each pick.tiers as t, i (t)}<i class:on={pick.level > i} class={'t' + (i + 1 + 3 - pick.tiers.length)}>{tierName(pick, i + 1)}: {pick.fmt(t)}</i>{/each}</span
							>
						</div>
					{/if}
				</div>
			{/if}
			{#if stamps.length}
				<p class="note">Stempel antippen öffnet das Land. Dort kannst du auch das Datum der ersten Einreise eintragen – es erscheint dann auf dem Stempel.</p>
			{/if}
		{/if}
	</div>
</section>
