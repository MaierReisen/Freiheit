<script lang="ts">
	import { onMount } from 'svelte';
	import { atlas, countedCountries, isCounted, removeCountries, removeCountry, reorderCountries, type CountryEntry } from '$lib/atlas.svelte';
	import { CONT, CONT_NAMES, compareNames, flag } from '$lib/countries';
	import { SCOPES, isTerritory, placeLabel, scopeTotal } from '$lib/scope';
	import { closePlaces, openCountry, reduceMotion, ui } from '$lib/app.svelte';
	import { reorder } from '$lib/reorder';
	import SwipeRow from './SwipeRow.svelte';

	/* Seite „Deine Länder“ (öffnet über den Block auf der Startseite): Liste der bereisten Länder, sortierbar.
	   Gebiete, die nicht zählen, stehen darunter. Wischen nach links legt „Löschen“ frei (wie in iOS).
	   Bei Sortierung „Nr.“ lässt sich die Reihenfolge durch Halten und Ziehen ändern (gilt dann überall: Pass, Länderseite …).
	   „Auswählen“ markiert mehrere Länder, die zusammen gelöscht werden. */

	type Sort = 'nr' | 'az' | 'cont' | 'new';
	const SORTS: { id: Sort; label: string }[] = [
		{ id: 'nr', label: 'Nr.' },
		{ id: 'az', label: 'A–Z' },
		{ id: 'cont', label: 'Kontinent' },
		{ id: 'new', label: 'Neueste' }
	];
	const SORT_KEY = 'freiheit-list-sort';

	let filter = $state('');
	let sort = $state<Sort>('nr');
	let selecting = $state(false);
	let picked = $state<string[]>([]);

	const total = $derived(scopeTotal(atlas.settings.countryScope));
	const scopeLabel = $derived(SCOPES.find((s) => s.id === atlas.settings.countryScope)?.label ?? '');
	const match = (c: CountryEntry) => {
		const q = filter.trim().toLowerCase();
		return !q || (c.name || '').toLowerCase().includes(q);
	};
	const byName = (a: CountryEntry, b: CountryEntry) => compareNames(a.name || '', b.name || '');

	// Nummer = eigene Reihenfolge ("Land Nr. X"), unabhängig von der Sortierung der Anzeige
	const numbered = $derived(countedCountries().map((c, i) => ({ ...c, nr: i + 1 })));
	const items = $derived.by(() => {
		const list = numbered.filter(match);
		if (sort === 'az') return [...list].sort(byName);
		if (sort === 'new') return [...list].reverse();
		return list;
	});
	// Nach Kontinent: Gruppen nach Anzahl, innerhalb alphabetisch
	const groups = $derived.by(() => {
		const m = new Map<string, typeof items>();
		for (const c of items) {
			const k = CONT[c.code] || '';
			if (!m.has(k)) m.set(k, []);
			m.get(k)!.push(c);
		}
		return [...m.entries()]
			.map(([k, list]) => ({ name: CONT_NAMES[k as keyof typeof CONT_NAMES] || 'Sonstige', list: [...list].sort(byName) }))
			.sort((a, b) => b.list.length - a.list.length || compareNames(a.name, b.name));
	});
	const others = $derived(atlas.data.countries.filter((c) => !isCounted(c.code) && match(c)).sort(byName));
	// Umsortieren nur in der Nr.-Ansicht, ohne Suche und ohne Auswahlmodus
	const canDrag = $derived(ui.placesOpen && sort === 'nr' && !filter.trim() && !selecting && numbered.length > 1);
	// alles, was gerade auswählbar ist (nur sichtbare, vorhandene Länder)
	const visibleCodes = $derived([...items.map((c) => c.code), ...others.map((c) => c.code)]);
	const allPicked = $derived(visibleCodes.length > 0 && visibleCodes.every((c) => picked.includes(c)));

	function setSort(s: Sort) {
		sort = s;
		try {
			localStorage.setItem(SORT_KEY, s);
		} catch {}
	}
	function toggle(code: string) {
		picked = picked.includes(code) ? picked.filter((c) => c !== code) : [...picked, code];
	}
	function stopSelecting() {
		selecting = false;
		picked = [];
	}
	function deletePicked() {
		const n = picked.length;
		if (!n) return;
		if (!confirm(n === 1 ? 'Dieses Land aus deiner Liste löschen?' : `${n} Länder aus deiner Liste löschen?`)) return;
		removeCountries(picked);
		stopSelecting();
	}

	// beim Öffnen: Wisch-Zustand vom letzten Schließen sicher löschen
	$effect(() => {
		if (ui.placesOpen && view) {
			view.style.transform = '';
			view.style.transition = '';
			view.classList.remove('swiping', 'down');
		}
	});
	// nach dem Schließen alles zurücksetzen (Sortierung bleibt)
	$effect(() => {
		if (!ui.placesOpen) {
			stopSelecting();
			filter = '';
		}
	});
	// Länder, die woanders gelöscht wurden, nicht mehr als markiert führen
	$effect(() => {
		const have = new Set(atlas.data.countries.map((c) => c.code));
		if (picked.some((c) => !have.has(c))) picked = picked.filter((c) => have.has(c));
	});

	/* Nach rechts wischen = zurück (iOS-Vorbild; in der installierten App gibt es sonst keine Zurück-Geste).
	   Die Seite folgt dem Finger ohne Ruck (Position pro Bild gesetzt, Start ohne Sprung), beim Loslassen entscheiden
	   Weg und Tempo, das Ausgleiten dauert nach Restweg. Aus beim Umsortieren, im Auswählen-Modus, im Suchfeld und bei aufgewischter Zeile. */
	let view: HTMLElement;
	let back: { x: number; y: number; dir: 'h' | 'd' | 'v' | null; dx: number; dy: number; lx: number; lt: number; v: number; raf: number } | null = null;
	const dragging = () => !!view.querySelector('.list.dragging');
	function backStart(e: TouchEvent) {
		cancelAnimationFrame(back?.raf ?? 0);
		back = null;
		const t = e.target as Element;
		if (e.touches.length !== 1 || selecting || t.closest('input') || view.querySelector('.swipe-del') || dragging()) return;
		const p = e.touches[0];
		back = { x: p.clientX, y: p.clientY, dir: null, dx: 0, dy: 0, lx: p.clientX, lt: e.timeStamp, v: 0, raf: 0 };
	}
	function paint() {
		if (!back) return;
		back.raf = 0;
		view.style.transform = back.dir === 'd' ? `translate3d(0,${back.dy}px,0)` : `translate3d(${back.dx}px,0,0)`;
	}
	function backMove(e: TouchEvent) {
		if (!back) return;
		if (dragging()) {
			cancelAnimationFrame(back.raf);
			back = null;
			view.style.transform = '';
			return;
		}
		const p = e.touches[0],
			dx = p.clientX - back.x,
			dy = p.clientY - back.y;
		if (!back.dir) {
			if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
			// nur nach unten schließen; seitlich gehört der Zeile (Löschen)
			const atTop = (view.querySelector('.ov-body')?.scrollTop ?? 0) <= 0;
			back.dir = dy > 0 && dy > Math.abs(dx) && atTop ? 'd' : 'v';
			if (back.dir === 'd') {
				back.y += 6;
				view.classList.add('swiping', 'down');
				view.style.transition = 'none';
			}
			return;
		}
		if (back.dir === 'd') {
			e.preventDefault();
			const dt = e.timeStamp - back.lt;
			if (dt > 0) back.v = 0.6 * ((p.clientY - back.lx) / dt) + 0.4 * back.v;
			back.lx = p.clientY;
			back.lt = e.timeStamp;
			back.dy = Math.max(0, p.clientY - back.y);
			if (!back.raf) back.raf = requestAnimationFrame(paint);
			return;
		}
		if (back.dir !== 'h') return;
		const dt = e.timeStamp - back.lt;
		if (dt > 0) back.v = 0.6 * ((p.clientX - back.lx) / dt) + 0.4 * back.v; // px pro ms
		back.lx = p.clientX;
		back.lt = e.timeStamp;
		back.dx = Math.max(0, p.clientX - back.x);
		if (!back.raf) back.raf = requestAnimationFrame(paint);
	}
	function backEnd() {
		const b = back;
		back = null;
		if (!b) return;
		cancelAnimationFrame(b.raf);
		if (b.dir !== 'h' && b.dir !== 'd') return;
		const down = b.dir === 'd';
		const W = down ? window.innerHeight : window.innerWidth;
		const dist = down ? b.dy : b.dx;
		const go = down ? dist > 140 || (b.v > 0.6 && dist > 40) : dist > W * 0.3 || (b.v > 0.5 && dist > 24);
		const rest = go ? W - dist : dist;
		const ms = reduceMotion() ? 0 : Math.round(Math.max(130, Math.min(260, (rest / Math.max(b.v, 0.9)) * (go ? 1 : 0.7))));
		view.style.transition = ms ? `transform ${ms}ms cubic-bezier(.22,.8,.3,1)` : 'none';
		view.style.transform = go ? (down ? 'translate3d(0,100%,0)' : 'translate3d(100%,0,0)') : '';
		setTimeout(() => {
			if (go) closePlaces(false);
			view.classList.remove('swiping', 'down');
			// nach dem Schließen Ausgangszustand für das nächste Öffnen
			setTimeout(() => {
				view.style.transition = '';
				if (go) view.style.transform = '';
			}, 30);
		}, ms);
	}

	onMount(() => {
		// touchmove nicht passiv, damit Runterwischen die Liste nicht mitscrollt
		view.addEventListener('touchmove', backMove, { passive: false });
		try {
			const s = localStorage.getItem(SORT_KEY);
			if (SORTS.some((x) => x.id === s)) sort = s as Sort;
		} catch {}
	});
</script>

{#snippet row(c: CountryEntry & { nr?: number })}
	{#if selecting}
		<li class="sel-li" class:on={picked.includes(c.code)}>
			<button type="button" data-code={c.code} aria-pressed={picked.includes(c.code)} onclick={() => toggle(c.code)}
				><span class="chk" aria-hidden="true"
					><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span
				><span class="nr">{c.nr ?? ''}</span><span class="flag">{flag(c.code)}</span><span class="nm">{c.name}</span><span class="ct">{placeLabel(c.code)}</span></button
			>
		</li>
	{:else}
		<SwipeRow ondelete={() => removeCountry(c.code)}>
			<button data-code={c.code} onclick={() => openCountry(c.code)}
				><span class="nr">{c.nr ?? ''}</span><span class="flag">{flag(c.code)}</span><span class="nm">{c.name}</span><span class="ct">{placeLabel(c.code)}</span></button
			>
		</SwipeRow>
	{/if}
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov set-view" id="placesView" role="dialog" aria-modal="true" aria-labelledby="placesTitle" hidden={!ui.placesOpen} bind:this={view} ontouchstart={backStart} ontouchend={backEnd} ontouchcancel={backEnd}>
	<div class="ov-head lv-head">
		<button type="button" class="ov-close" id="placesClose" aria-label="Deine Länder schließen" onclick={() => closePlaces(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<h1 class="set-title" id="placesTitle">Deine Länder <span class="ov-of">{numbered.length} von {total}</span></h1>
		{#if numbered.length || others.length}
			<button type="button" class="lv-sel" onclick={() => (selecting ? stopSelecting() : (selecting = true))}>{selecting ? 'Fertig' : 'Auswählen'}</button>
		{/if}
	</div>
	{#if ui.placesOpen}
		<div class="ov-body lv-body" class:withbar={selecting}>
			<div class="seg sort-seg" role="group" aria-label="Sortierung">
				{#each SORTS as s (s.id)}
					<button type="button" aria-pressed={sort === s.id} onclick={() => setSort(s.id)}>{s.label}</button>
				{/each}
			</div>
			<input class="search" id="filter" type="search" placeholder="Land suchen" autocomplete="off" bind:value={filter} />
			{#if canDrag}<p class="note lv-hint">Tipp: Zeile gedrückt halten und ziehen, um die Reihenfolge zu ändern.</p>{/if}

			{#if sort === 'cont'}
				{#each groups as g (g.name)}
					<h3 class="list-sub">{g.name} <span class="h-count">{g.list.length}</span></h3>
					<ul class="list">
						{#each g.list as c (c.code)}{@render row(c)}{/each}
					</ul>
				{/each}
			{:else}
				<ul class="list" id="list" use:reorder={{ enabled: canDrag, onreorder: reorderCountries }}>
					{#each items as c (c.code)}{@render row(c)}{/each}
				</ul>
			{/if}
			{#if !items.length}
				<p class="empty">{numbered.length ? 'Kein Treffer.' : 'Noch keine Länder. Tippe auf der Startseite oben auf „+ Land“, um dein erstes Land hinzuzufügen.'}</p>
			{/if}

			{#if others.length}
				{#if others.every((c) => isTerritory(c.code))}
					<h3 class="list-sub">Gebiete</h3>
					<p class="note">Haben einen Stempel im Pass, zählen aber nicht als Land.</p>
				{:else}
					<h3 class="list-sub">Gebiete und weitere Staaten</h3>
					<p class="note">Haben einen Stempel im Pass, zählen bei „{scopeLabel} ({total})“ aber nicht als Land. Die Länderliste stellst du in den Einstellungen ein.</p>
				{/if}
				<ul class="list" id="otherList">
					{#each others as c (c.code)}{@render row(c)}{/each}
				</ul>
			{/if}
		</div>
	{/if}
	{#if selecting}
		<div class="lv-bar" role="region" aria-label="Auswahl">
			<span class="lv-bar-n">{picked.length ? `${picked.length} ausgewählt` : 'Länder antippen'}</span>
			<button type="button" class="btn" onclick={() => (picked = allPicked ? [] : [...visibleCodes])}>{allPicked ? 'Keine' : 'Alle'}</button>
			<button type="button" class="btn danger" disabled={!picked.length} onclick={deletePicked}>Löschen</button>
		</div>
	{/if}
</section>
