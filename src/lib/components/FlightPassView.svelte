<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { atlas } from '$lib/atlas.svelte';
	import { closeFlightPass, openAddFlight, openCountry, openRoute, reduceMotion, ui } from '$lib/app.svelte';
	import { badgeLevels, tierCls } from '$lib/badges';
	import { flightBadges } from '$lib/flightBadges';
	import { fd } from '$lib/flightData.svelte';
	import { CARD_NAME, FLIGHT_RANKS, HAUL_NAME, dateDe, flightRankInfo, flightRecords, haul } from '$lib/flightPass';
	import { EARTH_KM, flightNo, flightStats, fmtDuration, fmtInt, routeKey, type Leg } from '$lib/flights';
	import { swipeClose } from '$lib/swipeClose';
	import FlightPassTile from './FlightPassTile.svelte';
	import BadgeTile from './BadgeTile.svelte';
	import BadgeSheet from './BadgeSheet.svelte';

	/* Flugpass (Vollbild, aus dem Tab „Flüge“): Gegenstück zum Reisepass, aber als Vielflieger-Mappe. Oben die Status-Karte,
	   darunter drei Reiter: Bordkarten (jeder Flug eine Bordkarte, 4 je Seite, waagerecht blättern; geplante am Ende),
	   Rekorde und Abzeichen. Teilen ↗ = Bild wie der Flighty-Pass, für alle Jahre oder ein Jahr. */

	const PER_PAGE = 4;
	const GAP = 16; // Abstand zwischen den Seiten (wie .fp-book gap)
	let body = $state<HTMLDivElement>();

	$effect(() => {
		if (ui.fpOpen) untrack(() => {
			fd.load();
			fd.tick();
		});
	});
	const st = $derived(fd.st);
	const ap = $derived(fd.ap);
	const al = $derived(fd.al);
	const city = (c: string) => ap?.[c]?.[0] || c;
	const info = $derived(flightRankInfo(st?.n ?? 0));

	/* ---------- Bordkarten ---------- */
	type Ticket = { l: Leg; nr: number; plan: boolean };
	const tickets = $derived.by((): Ticket[] => {
		if (!st) return [];
		const flown = st.legs.filter((l) => l.done).reverse(); // älteste zuerst
		const plan = st.legs.filter((l) => !l.done && !l.f.d.cx).reverse(); // nächster zuerst
		return [...flown.map((l, i) => ({ l, nr: i + 1, plan: false })), ...plan.map((l) => ({ l, nr: 0, plan: true }))];
	});
	const pages = $derived.by(() => {
		const out: { t: Ticket[]; years: string; y0: number }[] = [];
		for (let i = 0; i < tickets.length; i += PER_PAGE) {
			const t = tickets.slice(i, i + PER_PAGE);
			const ys = t.map((x) => +x.l.f.date.slice(0, 4));
			const lo = Math.min(...ys),
				hi = Math.max(...ys);
			out.push({ t, years: lo === hi ? String(lo) : `${lo} – ${hi}`, y0: lo });
		}
		return out;
	});
	// Sprungmarken: erste Seite je Jahr
	const jumps = $derived.by(() => {
		const m = new Map<number, number>();
		pages.forEach((p, i) => p.t.forEach((x) => { const y = +x.l.f.date.slice(0, 4); if (!m.has(y)) m.set(y, i); }));
		return [...m];
	});
	let book = $state<HTMLDivElement>();
	let cur = $state(0);
	// alle Seiten erst kurz nach dem Öffnen füllen (Öffnen bleibt schnell), sofort nur die aktuelle ± 1
	let all = $state(false);
	const live = (i: number) => all || Math.abs(i - cur) <= 1;
	let raf = 0;
	function onBook() {
		if (raf) return;
		raf = requestAnimationFrame(() => {
			raf = 0;
			if (!book) return;
			const i = Math.round(book.scrollLeft / (book.clientWidth + GAP));
			if (i !== cur) {
				cur = i;
				navigator.vibrate?.(4);
			}
		});
	}
	function goPage(i: number, smooth = true) {
		if (!book) return;
		i = Math.max(0, Math.min(pages.length - 1, i));
		book.scrollTo({ left: i * (book.clientWidth + GAP), behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' });
		if (!smooth) cur = i;
	}
	const curYear = $derived(pages[cur]?.y0 ?? 0);
	let chips = $state<HTMLDivElement>();
	// gewähltes Jahr in der Leiste sichtbar halten
	$effect(() => {
		const y = curYear;
		const el = chips?.querySelector<HTMLElement>(`[data-y="${y}"]`);
		if (el && chips) chips.scrollTo({ left: el.offsetLeft - chips.clientWidth / 2 + el.offsetWidth / 2, behavior: reduceMotion() ? 'auto' : 'smooth' });
	});

	/* ---------- Rekorde ---------- */
	const recs = $derived(st && ap ? flightRecords(st, ap, al) : []);

	/* ---------- Abzeichen ---------- */
	const bs = $derived(st && ap ? flightBadges({ st, ap, al }) : []);
	const bSorted = $derived(bs.map((b) => ({ b, t: +(tierCls(b, b.level).slice(1) || 0) })).sort((x, y) => y.t - x.t || y.b.p - x.b.p).map((x) => x.b));
	const medals = $derived([3, 2, 1].map((t) => bs.filter((b) => tierCls(b, b.level) === 't' + t).length));
	let picked = $state<string | null>(null);
	const pick = $derived(bs.find((b) => b.id === picked) ?? null);
	let sheet = $state<HTMLDivElement>();
	let sheetH = $state(0);
	async function choose(id: string | null) {
		picked = id;
		if (!id) return;
		await tick();
		if (!sheet) return;
		sheetH = sheet.offsetHeight;
		await tick();
		const btn = body?.querySelector<HTMLElement>(`[data-badge="${id}"]`);
		if (!btn || !sheet || !body) return;
		const over = btn.getBoundingClientRect().bottom + 12 - (window.innerHeight - sheet.offsetHeight);
		if (over > 0) body.scrollBy({ top: over, behavior: reduceMotion() ? 'auto' : 'smooth' });
	}

	/* ---------- Reiter ---------- */
	let tab = $state<'bk' | 'rk' | 'ab'>('bk');
	function pickTab(t: typeof tab) {
		if (t === tab) return;
		choose(null);
		tab = t;
		body?.scrollTo(0, 0);
	}
	// Öffnen: Seite mit den neuesten Bordkarten aufschlagen
	let opened = false;
	let allT: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (!ui.fpOpen) {
			opened = false;
			picked = null;
			leaf = null;
			clearTimeout(allT);
			all = false;
			return;
		}
		if (opened || !pages.length) return;
		opened = true;
		untrack(() => {
			tab = 'bk';
			body?.scrollTo(0, 0);
			const last = Math.max(0, Math.floor((tickets.filter((t) => !t.plan).length - 1) / PER_PAGE));
			tick().then(() => goPage(last, false));
			allT = setTimeout(() => (all = true), 450);
		});
	});
	// Tipp auf die Feier-Karte eines Flug-Abzeichens: Flugpass öffnet direkt dort
	$effect(() => {
		const id = ui.fpBadge;
		if (!id || !ui.fpOpen || !bs.some((b) => b.id === id)) return;
		untrack(() => {
			ui.fpBadge = '';
			pickTab('ab');
			tick().then(() => choose(id).then(() => body?.querySelector<HTMLElement>(`[data-badge="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'auto' })));
		});
	});

	/* ---------- Blatt von unten: Status-Stufen und Teilen (Runterwischen oder Tippen daneben schließt) ---------- */
	let leaf = $state<null | 'ranks' | 'share'>(null);
	let leafEl = $state<HTMLDivElement>();
	let leafList = $state<HTMLDivElement>();
	let lOff = 0;
	function openLeaf(l: 'ranks' | 'share') {
		choose(null);
		lOff = 0;
		leaf = l;
	}
	function slideUp(node: HTMLElement, _p?: unknown, opt?: { direction?: string }) {
		const h = node.offsetHeight + 24,
			o = opt?.direction === 'in' ? 0 : lOff;
		lOff = 0;
		return { duration: reduceMotion() ? 0 : o ? 160 : 240, css: (t: number) => `transform:translateY(${o + (1 - t) * (h - o)}px)`, easing: (t: number) => 1 - (1 - t) ** 3 };
	}
	$effect(() => {
		const el = leafEl;
		if (!el) return;
		let d: { x0: number; y0: number; ly: number; lt: number; vy: number; dy: number; mode: 0 | 1 | 2 } | null = null;
		const ts = (e: TouchEvent) => {
			e.stopPropagation();
			if (e.touches.length !== 1) return (d = null);
			const y = e.touches[0].clientY;
			d = { x0: e.touches[0].clientX, y0: y, ly: y, lt: e.timeStamp, vy: 0, dy: 0, mode: 0 };
		};
		const tm = (e: TouchEvent) => {
			e.stopPropagation();
			if (!d) return;
			const y = e.touches[0].clientY,
				raw = y - d.y0;
			if (!d.mode) {
				const dx = Math.abs(e.touches[0].clientX - d.x0);
				if (dx < 6 && Math.abs(raw) < 6) return;
				d.mode = dx > Math.abs(raw) || (leafList?.contains(e.target as Node) && (leafList.scrollTop > 0 || raw < 0)) ? 2 : 1;
			}
			if (d.mode === 2) return;
			e.preventDefault();
			const dt = e.timeStamp - d.lt;
			if (dt >= 12) {
				d.vy = 0.6 * ((y - d.ly) / dt) + 0.4 * d.vy;
				d.ly = y;
				d.lt = e.timeStamp;
			}
			d.dy = raw;
			el.style.transition = 'none';
			el.style.transform = `translateY(${Math.max(0, raw)}px)`;
		};
		const te = (e: TouchEvent) => {
			e.stopPropagation();
			if (!d) return;
			const { dy, vy, mode } = d;
			d = null;
			if (mode !== 1) return;
			if (dy > 70 || (vy > 0.5 && dy > 20)) {
				lOff = dy;
				leaf = null;
			} else {
				el.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
				el.style.transform = '';
			}
		};
		el.addEventListener('touchstart', ts, { passive: true });
		el.addEventListener('touchmove', tm, { passive: false });
		el.addEventListener('touchend', te);
		el.addEventListener('touchcancel', te);
		return () => {
			el.removeEventListener('touchstart', ts);
			el.removeEventListener('touchmove', tm);
			el.removeEventListener('touchend', te);
			el.removeEventListener('touchcancel', te);
		};
	});

	/* ---------- Teilen: Bild für alle Jahre oder ein Jahr ---------- */
	type Card = { url: string; png: Blob };
	let share = $state<{ y: number | null; cards: Record<string, Card>; busy: boolean; msg: string } | null>(null);
	let fcMod: typeof import('$lib/flightcard') | null = null;
	let scMod: typeof import('$lib/sharecard') | null = null;
	const yKey = (y: number | null) => (y === null ? 'all' : String(y));
	async function makeCard(y: number | null) {
		if (!share || share.cards[yKey(y)] || !ap || !st) return;
		[fcMod, scMod] = await Promise.all([fcMod ?? import('$lib/flightcard'), scMod ?? import('$lib/sharecard')]);
		const s = y === null ? st : flightStats(atlas.flights.filter((f) => f.date.startsWith(String(y))), ap, fd.now);
		const arcs = new Map<string, { a: [number, number]; b: [number, number]; n: number }>();
		for (const l of s.legs) {
			const A = ap[l.f.from],
				B = ap[l.to];
			if (!l.done || !A || !B) continue;
			const k = routeKey(l.f.from, l.to),
				x = arcs.get(k);
			if (x) x.n++;
			else arcs.set(k, { a: [A[4], A[3]], b: [B[4], B[3]], n: 1 });
		}
		const L = s.longest;
		const years = fd.years.map(([yy]) => yy);
		const svg = await fcMod.flightCardSvg({
			year: y,
			since: years.length ? Math.min(...years) : 0,
			n: s.n,
			km: s.km,
			min: s.min,
			airports: s.airports.length,
			countries: s.countries.length,
			airlines: s.airlines.length,
			earth: (s.km / EARTH_KM).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + '×',
			dur: fmtDuration(s.min),
			rank: info.rank ? { icon: info.rank.icon, name: info.rank.name } : null,
			card: info.card,
			longest: L ? { a: L.f.from, b: L.to, ca: city(L.f.from), cb: city(L.to), km: fmtInt(L.km), date: dateDe(L.f.date) } : null,
			arcs: [...arcs.values()],
			pts: s.airports.flatMap((a) => (ap[a.code] ? [[ap[a.code][4], ap[a.code][3]] as [number, number]] : []))
		});
		const png = await scMod.toPng(svg);
		if (!share) return;
		share.cards[yKey(y)] = { url: URL.createObjectURL(png), png };
	}
	const shareYears = $derived<(number | null)[]>([null, ...fd.years.map(([y]) => y)]);
	function showYear(y: number | null) {
		if (!share) return;
		share.y = y;
		share.msg = '';
		makeCard(y).catch((e) => { console.error(e); if (share) share.msg = 'Das Bild konnte nicht erstellt werden.'; });
	}
	function openShare() {
		openLeaf('share');
		share = { y: null, cards: {}, busy: false, msg: '' };
		showYear(null);
	}
	async function doShare() {
		const c = share?.cards[yKey(share.y)];
		if (!share || !c || share.busy || !scMod) return;
		share.busy = true;
		share.msg = '';
		// sofort aufrufen (ohne vorheriges Warten), sonst öffnet Safari das Teilen-Menü nicht
		const r = await scMod.shareImage(c.png, 'freiheit-flugpass.png');
		if (share) {
			share.busy = false;
			share.msg = r === 'saved' ? 'Bild gespeichert.' : '';
		}
	}
	$effect(() => {
		if (leaf === 'share' || !share) return;
		for (const c of Object.values(share.cards)) URL.revokeObjectURL(c.url);
		share = null;
	});
	const shareCard = $derived(share ? share.cards[yKey(share.y)] : undefined);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov pp-view fp-view" id="flightPassView" role="dialog" aria-modal="true" aria-labelledby="fpTitle" hidden={!ui.fpOpen} use:swipeClose={{ onclose: () => closeFlightPass(false) }}>
	<div class="ov-head">
		<button type="button" class="ov-close" id="fpClose" aria-label="Flugpass schließen" onclick={() => closeFlightPass(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="fpTitle">Flugpass</h1>
		{#if st?.n}
			<button type="button" class="ov-close pp-share" aria-label="Flugpass als Bild teilen" onclick={openShare}
				><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg></button
			>
		{/if}
	</div>
	<div class="ov-body" bind:this={body} style:padding-bottom={pick ? sheetH + 16 + 'px' : null}>
		{#if ui.fpOpen && st && ap}
			<div class="pp-top"><FlightPassTile n={st.n} inPass onrank={() => openLeaf('ranks')} /></div>
			<div class="pp-tabs" role="tablist" aria-label="Bereiche des Flugpasses">
				<button type="button" role="tab" aria-selected={tab === 'bk'} onclick={() => pickTab('bk')}>Bordkarten<small>{st.n}{st.upcoming ? ` + ${st.upcoming}` : ''}</small></button>
				<button type="button" role="tab" aria-selected={tab === 'rk'} onclick={() => pickTab('rk')}>Rekorde<small>{recs.length}</small></button>
				<button type="button" role="tab" aria-selected={tab === 'ab'} onclick={() => pickTab('ab')}>Abzeichen<small>{badgeLevels(bs)} / {bs.reduce((s, b) => s + b.tiers.length, 0)}</small></button>
			</div>

			<div role="tabpanel" aria-label="Bordkarten" hidden={tab !== 'bk'}>
				{#if !tickets.length}
					<p class="empty">Noch keine Flüge. Für jeden Flug kommt hier eine Bordkarte in deinen Flugpass – oben im Tab „Flüge“ auf <b>+ Flug</b> tippen oder aus Flighty importieren.</p>
				{:else}
					{#if jumps.length > 1}
						<div class="pp-groups fp-years" bind:this={chips} role="group" aria-label="Jahr wählen">
							{#each jumps as [y, pi] (y)}<button type="button" data-y={y} aria-pressed={curYear === y} onclick={() => goPage(pi)}>{y}</button>{/each}
						</div>
					{/if}
					<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
					<div class="fp-book" bind:this={book} onscroll={onBook} role="region" aria-label="Bordkarten, wischen zum Blättern" tabindex="0"
						onkeydown={(e) => { if (e.key === 'ArrowRight') goPage(cur + 1); else if (e.key === 'ArrowLeft') goPage(cur - 1); }}>
						{#each pages as pg, pi (pi)}
							<div class="fp-page" aria-hidden={pi !== cur} inert={pi !== cur} aria-label="Seite {pi + 1} von {pages.length}">
								<div class="pp-page-h"><span>Bordkarten · Seite {pi + 1}</span><span>{pg.years}</span></div>
								{#if live(pi)}
									{#each pg.t as t (t.l.f.id)}
										{@const l = t.l}
										{@const h = haul(l.km)}
										{@const no = flightNo(l.f, al)}
										<button type="button" class="fp-tk {h}" class:plan={t.plan} onclick={() => openRoute(routeKey(l.f.from, l.to), { id: l.f.id })}
											aria-label="{t.plan ? 'Geplant: ' : `Flug ${t.nr}: `}{city(l.f.from)} nach {city(l.to)}, {dateDe(l.f.date)}{no ? `, ${no}` : ''}, {fmtInt(l.km)} km">
											<span class="fp-tk-main">
												<span class="fp-tk-top"><span>{(l.f.airline && al?.[l.f.airline]?.[0]) || HAUL_NAME[h]}</span><span>{no}</span></span>
												<span class="fp-tk-rt">
													<b>{l.f.from}</b>
													<i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 15.5v-1.6l-8-5V3.6a1.5 1.5 0 0 0-3 0v5.3l-8 5v1.6l8-2.4v5.1l-2 1.5V21l3.5-1 3.5 1v-1.3l-2-1.5v-5.1z" /></svg></i>
													<b>{l.to}</b>
												</span>
												<span class="fp-tk-city"><span>{city(l.f.from)}</span><span>{city(l.to)}</span></span>
												<span class="fp-tk-meta">
													<span><small>Datum</small>{dateDe(l.f.date)}</span>
													<span><small>Dauer</small>{fmtDuration(l.min)}</span>
													<span><small>Strecke</small>{fmtInt(l.km)} km</span>
												</span>
											</span>
											<span class="fp-tk-stub" aria-hidden="true">
												{#if t.plan}<small>Geplant</small><b>?</b>{:else}<small>Flug</small><b>{t.nr}</b>{/if}
												<i class="fp-code"></i>
											</span>
										</button>
									{/each}
									<!-- letzte Seite: freie Plätze für die nächsten Flüge (wie die „?“ im Reisepass) -->
									{#if pi === pages.length - 1}
										{#each Array(PER_PAGE - pg.t.length) as _, k (k)}
											<button type="button" class="fp-tk fp-free" class:first={k === 0} tabindex={k ? -1 : 0} aria-label="Nächsten Flug eintragen" onclick={() => openAddFlight()}>
												<span class="fp-tk-main"><b>{k === 0 ? 'Dein nächster Flug' : ''}</b>{#if k === 0}<em>+ Flug eintragen</em>{/if}</span>
												<span class="fp-tk-stub" aria-hidden="true"><b>?</b></span>
											</button>
										{/each}
									{/if}
								{/if}
							</div>
						{/each}
					</div>
					{#if pages.length > 1}
						<div class="pp-nav fp-nav">
							<button type="button" class="pp-arrow" aria-label="Vorherige Seite" disabled={cur <= 0} onclick={() => goPage(cur - 1)}>‹</button>
							<p class="pp-pnum">Seite {cur + 1} von {pages.length}</p>
							<button type="button" class="pp-arrow" aria-label="Nächste Seite" disabled={cur >= pages.length - 1} onclick={() => goPage(cur + 1)}>›</button>
						</div>
					{/if}
					<p class="note">Bordkarte antippen öffnet die Strecke. Farbe des Streifens: <span class="fp-key kurz">Kurz</span> <span class="fp-key mittel">Mittel</span> <span class="fp-key lang">Langstrecke</span></p>
				{/if}
			</div>

			<div role="tabpanel" aria-label="Rekorde" hidden={tab !== 'rk'}>
				{#if recs.length}
					<ul class="fp-recs">
						{#each recs as r (r.k)}
							<li>
								<button type="button" class="fp-rec" disabled={!r.route && !r.country} onclick={() => (r.route ? openRoute(r.route, { id: r.id }) : r.country && openCountry(r.country))}>
									<span class="fp-rec-i" aria-hidden="true">{r.icon}</span>
									<span class="fp-rec-t"><small>{r.k}</small><b>{r.v}</b><span>{r.d}</span></span>
								</button>
							</li>
						{/each}
					</ul>
					{#if st.unknown.length}<p class="note">Ohne Strecke (Flughafen unbekannt): {st.unknown.join(', ')}</p>{/if}
				{:else}
					<p class="empty">Rekorde erscheinen mit deinem ersten Flug.</p>
				{/if}
			</div>

			<div role="tabpanel" aria-label="Abzeichen" hidden={tab !== 'ab'}>
				<div class="pp-mcount" aria-label="{medals[0]} Gold, {medals[1]} Silber, {medals[2]} Bronze">
					<span><i class="t3"></i>{medals[0]} Gold</span><span><i class="t2"></i>{medals[1]} Silber</span><span><i class="t1"></i>{medals[2]} Bronze</span>
				</div>
				<div class="pp-visa fp-visa">
					<div class="pp-page-h"><span>✈️ Flug-Abzeichen</span><span>{badgeLevels(bs)} / {bs.reduce((s, b) => s + b.tiers.length, 0)}</span></div>
					<div class="pp-badges">{#each bSorted as b (b.id)}<BadgeTile {b} sel={picked === b.id} onpick={() => choose(picked === b.id ? null : b.id)} />{/each}</div>
				</div>
			</div>
		{:else if ui.fpOpen && !atlas.flights.length}
			<p class="empty">Noch keine Flüge. Im Tab „Flüge“ auf <b>+ Flug</b> tippen oder aus Flighty importieren (Einstellungen → Flüge).</p>
		{/if}
	</div>
	<BadgeSheet {pick} onclose={() => choose(null)} bind:el={sheet} />
	{#if leaf}
		<button type="button" class="pp-scrim" aria-label="Schließen" onclick={() => (leaf = null)} transition:fade={{ duration: reduceMotion() ? 0 : 200 }}></button>
		<div class="pp-sheet pp-leg" class:pp-shr={leaf === 'share'} bind:this={leafEl} transition:slideUp role="dialog" aria-labelledby="fpLegT">
			<button type="button" class="pp-grab" aria-label="Schließen" onclick={() => (leaf = null)}><i></i></button>
			<div class="pp-leg-list" bind:this={leafList}>
				{#if leaf === 'ranks'}
					<h2 id="fpLegT">Status</h2>
					{#if info.rank}<p class="pp-rsay">„{info.rank.say}“</p>{:else}<p>Mit dem ersten Flug bekommst du deinen ersten Status.</p>{/if}
					<p>Die Farbe deiner Karte steigt mit: Blau, Silber, Gold, Platin und Schwarz.</p>
					<ol class="pp-rlist">
						{#each FLIGHT_RANKS as r, i (r.n)}
							{@const c = flightRankInfo(r.n).card}
							<li class:on={i <= info.i} class:cur={i === info.i}>
								<span aria-hidden="true">{r.icon}</span><b>{r.name}</b><em class="fp-dot c{c}" title="Karte {CARD_NAME[c]}"></em><small>{r.n} {r.n === 1 ? 'Flug' : 'Flüge'}</small>
							</li>
						{/each}
					</ol>
				{:else if share}
					<h2 id="fpLegT">Flugpass teilen</h2>
					<p>Als Bild – ohne deinen Namen. Für alle Jahre oder ein einzelnes Jahr.</p>
					<div class="pp-groups fp-syears" role="group" aria-label="Zeitraum">
						{#each shareYears as y (yKey(y))}<button type="button" aria-pressed={share.y === y} onclick={() => showYear(y)}>{y ?? 'Alle Jahre'}</button>{/each}
					</div>
					<div class="pp-cardslot fp-cardslot">
						<div class="pp-card">
							{#if shareCard}<img src={shareCard.url} alt="Flugpass {share.y ?? 'alle Jahre'}" width="1080" height="1920" draggable="false" />{:else}<span class="pp-card-wait" aria-label="Bild wird erstellt"></span>{/if}
						</div>
					</div>
					<button type="button" class="pp-sharebtn" disabled={!shareCard || share.busy} onclick={doShare}
						><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>Bild teilen</button
					>
					{#if share.msg}<p class="pp-sharemsg" role="status">{share.msg}</p>{/if}
				{/if}
			</div>
		</div>
	{/if}
</section>
