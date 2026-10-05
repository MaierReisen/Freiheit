<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { atlas } from '$lib/atlas.svelte';
	import { contOf, flag } from '$lib/countries';
	import { REDUCE, closeSettings, closeSheet, dom, hooks, openCountry, openPicker, setFull, ui } from '$lib/app.svelte';
	import Timeline from './Timeline.svelte';

	/* Länder-Übersicht (Vollbild), geöffnet über den Zähler auf der Startseite */

	let ov: HTMLElement;
	let ovBody: HTMLDivElement;
	let ovClose: HTMLButtonElement;
	let wave: HTMLDivElement;
	let fx: HTMLDivElement;

	let visible = $state(false);
	let entering = $state(false);
	let filter = $state('');
	let ovNum = $state(0);
	let countAnim: number | null = null;
	let pushedPlaces = false;
	let lastFocus: Element | null = null;

	const n = $derived(atlas.data.countries.length);
	$effect(() => {
		if (countAnim === null) ovNum = n;
	});

	const items = $derived.by(() => {
		const q = filter.trim().toLowerCase();
		return atlas.data.countries.map((c, i) => ({ ...c, nr: i + 1 })).filter((c) => !q || (c.name || '').toLowerCase().includes(q));
	});

	function countCenter() {
		const r = (dom.count ?? document.body).getBoundingClientRect();
		const w = window.innerWidth || 390,
			h = window.innerHeight || 800;
		let x = r.left + r.width / 2,
			y = r.top + r.height / 2;
		if (!(x > 0 && y > 0)) {
			x = w / 2;
			y = h / 3;
		}
		return { x, y, R: Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 20 };
	}
	function flagBurst(x: number, y: number) {
		const codes = atlas.data.countries.map((c) => c.code).filter((c) => /^[A-Z]{2}$/.test(c));
		if (!codes.length || !document.body.animate) return;
		const count = Math.min(11, codes.length);
		for (let i = 0; i < count; i++) {
			const el = document.createElement('span');
			el.className = 'fx-flag';
			el.textContent = flag(codes[Math.floor(Math.random() * codes.length)]);
			fx.appendChild(el);
			const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5,
				dist = 90 + Math.random() * 130,
				rot = (Math.random() - 0.5) * 160;
			const dx = Math.cos(ang) * dist,
				dy = Math.sin(ang) * dist - 30;
			el.style.left = x + 'px';
			el.style.top = y + 'px';
			const a = el.animate(
				[
					{ transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 0 },
					{ transform: `translate(calc(-50% + ${dx * 0.7}px),calc(-50% + ${dy * 0.7}px)) scale(1.25) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.45 },
					{ transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy + 46}px)) scale(.9) rotate(${rot}deg)`, opacity: 0 }
				],
				{ duration: 950 + Math.random() * 450, easing: 'cubic-bezier(.2,.8,.3,1)', delay: Math.random() * 90, fill: 'forwards' }
			);
			a.onfinish = () => el.remove();
		}
	}
	function countUp(to: number, ms: number) {
		if (countAnim !== null) cancelAnimationFrame(countAnim);
		if (REDUCE || to <= 0) {
			ovNum = to;
			countAnim = null;
			return;
		}
		const t0 = performance.now();
		const step = (t: number) => {
			const p = Math.min(1, (t - t0) / ms),
				e = 1 - Math.pow(1 - p, 3);
			ovNum = Math.round(to * e);
			if (p < 1) countAnim = requestAnimationFrame(step);
			else countAnim = null;
		};
		countAnim = requestAnimationFrame(step);
	}

	async function open(fromHash: boolean) {
		if (ui.placesOpen) return;
		if (ui.full) setFull(false, true);
		if (ui.sheetOpen) closeSheet();
		if (ui.settingsOpen) closeSettings(true);
		ui.placesOpen = true;
		lastFocus = document.activeElement;
		try {
			localStorage.setItem('freiheit-count-seen', '1');
		} catch {}
		ui.countHint = false;
		document.body.classList.add('noscroll');
		visible = true;
		if (!fromHash) {
			pushedPlaces = true;
			location.hash = 'laender';
		}
		if (REDUCE || !ov.animate) {
			await tick();
			ovBody.scrollTop = 0;
			ovNum = n;
			ovClose.focus();
			return;
		}
		const { x, y, R } = countCenter();
		entering = true;
		ovNum = 0;
		await tick();
		ovBody.scrollTop = 0;
		// 1) Zahl springt, 2) gelbe Welle, 3) Übersicht öffnet sich kreisförmig, 4) Flaggen fliegen, 5) Zähler zählt hoch
		dom.count?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22) rotate(-4deg)' }, { transform: 'scale(1)' }], {
			duration: 420,
			easing: 'cubic-bezier(.3,1.7,.5,1)'
		});
		wave.style.cssText = `left:${x}px;top:${y}px;width:${R * 2}px;height:${R * 2}px`;
		wave.hidden = false;
		wave.animate(
			[
				{ transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
				{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.75 },
				{ transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }
			],
			{ duration: 640, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'forwards' }
		).onfinish = () => {
			wave.hidden = true;
		};
		ov.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }], {
			duration: 640,
			delay: 110,
			easing: 'cubic-bezier(.22,.9,.24,1)',
			fill: 'backwards'
		});
		setTimeout(() => (entering = false), 1900);
		flagBurst(x, y);
		countUp(n, 900);
		setTimeout(() => {
			if (ui.placesOpen) ovClose.focus({ preventScroll: true });
		}, 200);
	}

	function close(fromHash: boolean) {
		if (!ui.placesOpen) return;
		ui.placesOpen = false;
		if (!fromHash) {
			if (pushedPlaces && location.hash === '#laender') {
				pushedPlaces = false;
				history.back();
			} else if (location.hash === '#laender') {
				location.hash = 'home';
			}
		} else pushedPlaces = false;
		if (countAnim !== null) cancelAnimationFrame(countAnim);
		countAnim = null;
		const done = () => {
			visible = false;
			document.body.classList.remove('noscroll');
			entering = false;
			try {
				if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
			} catch {}
		};
		if (REDUCE || !ov.animate || !visible) {
			done();
			return;
		}
		const { x, y, R } = countCenter();
		ov.animate([{ clipPath: `circle(${R}px at ${x}px ${y}px)` }, { clipPath: `circle(0px at ${x}px ${y}px)` }], {
			duration: 460,
			easing: 'cubic-bezier(.5,0,.3,1)',
			fill: 'forwards'
		}).onfinish = done;
		dom.count?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: 0.7 }, { transform: 'scale(1)' }], {
			duration: 520,
			delay: 380,
			easing: 'ease-out'
		});
	}

	onMount(() => {
		hooks.places = { open, close };
		return () => (hooks.places = null);
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section class="ov" class:ov-enter={entering} id="placesView" role="dialog" aria-modal="true" aria-labelledby="ovTitle" hidden={!visible} bind:this={ov}>
	<div class="ov-head">
		<button type="button" class="ov-close" id="ovClose" aria-label="Übersicht schließen" bind:this={ovClose} onclick={() => close(false)}
			><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button
		>
		<div class="ov-count"><span class="ov-num" id="ovNum">{ovNum}</span><span class="ov-lab" id="ovTitle">Länder bereist</span></div>
		<button type="button" class="ov-add" id="ovAdd" onclick={() => openPicker(ui.seg === 'wish' ? 'wish' : 'visited')}>{ui.seg === 'wish' ? '+ Wunschziel' : '+ Land'}</button>
	</div>
	<div class="ov-body" id="ovBody" bind:this={ovBody}>
		<div class="seg" role="group" aria-label="Ansicht wählen">
			<button type="button" data-seg="visited" aria-pressed={ui.seg === 'visited'} onclick={() => (ui.seg = 'visited')}>Bereist<b id="segV">{atlas.data.countries.length}</b></button>
			<button type="button" data-seg="wish" aria-pressed={ui.seg === 'wish'} onclick={() => (ui.seg = 'wish')}>Wunschliste<b id="segW">{atlas.data.wishlist.length}</b></button>
		</div>
		<div id="paneVisited" hidden={ui.seg !== 'visited'}>
			<Timeline />
			<input class="search" id="filter" type="search" placeholder="Land suchen" autocomplete="off" style="margin-top:18px" bind:value={filter} />
			<ul class="list" id="list">
				{#each items as c, i (c.code)}
					<li style={i < 14 ? `--i:${i}` : undefined}>
						<button data-code={c.code} onclick={() => openCountry(c.code)}
							><span class="nr">{c.nr}</span><span class="flag">{flag(c.code)}</span><span class="nm">{c.name}</span><span class="ct">{contOf(c.code)}</span></button
						>
					</li>
				{:else}
					<li class="empty">{atlas.data.countries.length ? 'Kein Treffer.' : 'Noch keine Länder. Tippe oben auf Land, um dein erstes Land hinzuzufügen.'}</li>
				{/each}
			</ul>
		</div>
		<div id="paneWish" hidden={ui.seg !== 'wish'}>
			<ul class="list" id="wishList">
				{#each atlas.data.wishlist as c (c.code)}
					<li>
						<button data-code={c.code} onclick={() => openCountry(c.code)}
							><span class="flag">{flag(c.code)}</span><span class="nm">{c.name}</span><span class="ct">{contOf(c.code)}</span></button
						>
					</li>
				{:else}
					<li class="empty">Noch keine Wunschziele. Tippe auf ein Land in der Karte oder auf den Button unten.</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
<div class="wave" id="wave" hidden bind:this={wave}></div>
<div id="fx" aria-hidden="true" bind:this={fx}></div>
