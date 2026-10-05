import { tick } from 'svelte';

/* App-weiter Zustand der Oberfläche: Tabs, Bottom-Sheet, Vollbild-Karte, Länder-Übersicht, Toast.
   Die Komponenten mit DOM-Animationen (Karte, Übersicht) melden ihre Steuerfunktionen in `hooks` an. */

// Weitere Tabs (z. B. Reisen) hier ergänzen; mit nur einem Tab wird die Tab-Leiste ausgeblendet
export const TABS = ['home'] as const;
export type Tab = (typeof TABS)[number];
export type PickerMode = 'visited' | 'wish' | 'fly';
export type SheetView = { kind: 'country'; code: string } | { kind: 'picker'; mode: PickerMode };

export const REDUCE =
	typeof window !== 'undefined' && !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export const ui = $state({
	tab: 'home' as Tab,
	selected: null as string | null,
	sheetOpen: false,
	sheetView: null as SheetView | null,
	/** zählt jedes Öffnen hoch, damit das Sheet frisch aufgebaut wird (wie vorher per innerHTML) */
	sheetKey: 0,
	placesOpen: false,
	seg: 'visited' as 'visited' | 'wish',
	full: false,
	settingsOpen: false,
	/** Hinweis-Puls am Zähler, bis die Übersicht einmal geöffnet wurde */
	countHint: false,
	toastMsg: '',
	toastShow: false
});

export interface MapHooks {
	resize(): void;
	flyToCountry(code: string, opts?: { keepK?: boolean; ms?: number }): void;
	flyToContinent(code: string): void;
	scrollIntoView(): void;
}
export interface PlacesHooks {
	open(fromHash: boolean): void;
	close(fromHash: boolean): void;
}
export const hooks: { map: MapHooks | null; places: PlacesHooks | null } = { map: null, places: null };
/** Zähler auf der Startseite: Ausgangspunkt der Öffnen-/Schließen-Animation der Übersicht */
export const dom: { count: HTMLElement | null } = { count: null };

/* ---------- Toast ---------- */
let tt: ReturnType<typeof setTimeout> | undefined;
export function toast(m: string) {
	ui.toastMsg = m;
	ui.toastShow = true;
	clearTimeout(tt);
	tt = setTimeout(() => (ui.toastShow = false), 3200);
}

/* ---------- Sheet ---------- */
function openSheet(view: SheetView) {
	ui.sheetView = view;
	ui.sheetKey++;
	ui.sheetOpen = true;
}
export function closeSheet() {
	ui.sheetOpen = false;
	ui.selected = null;
}
export function openCountry(code: string) {
	ui.selected = code;
	openSheet({ kind: 'country', code });
}
export function openPicker(mode: PickerMode) {
	openSheet({ kind: 'picker', mode });
}

/* ---------- Vollbild-Karte ---------- */
let pushedMap = false;
export function setFull(on: boolean, fromHash = false) {
	if (on === ui.full) return;
	ui.full = on;
	document.body.classList.toggle('noscroll', on);
	if (!fromHash) {
		if (on) {
			pushedMap = true;
			location.hash = 'map';
		} else if (pushedMap && location.hash === '#map') {
			pushedMap = false;
			history.back();
		} else if (location.hash === '#map') {
			location.hash = 'home';
		}
	} else if (!on) pushedMap = false;
}

/* ---------- Einstellungen (Vollbild, über den Button oben rechts) ---------- */
let pushedSettings = false;
let settingsReturnFocus: Element | null = null;
export function openSettings(fromHash = false) {
	if (ui.settingsOpen) return;
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.placesOpen) hooks.places?.close(true);
	settingsReturnFocus = document.activeElement;
	ui.settingsOpen = true;
	document.body.classList.add('noscroll');
	if (!fromHash) {
		pushedSettings = true;
		location.hash = 'einstellungen';
	}
	tick().then(() => document.getElementById('setClose')?.focus({ preventScroll: true }));
}
export function closeSettings(fromHash = false) {
	if (!ui.settingsOpen) return;
	ui.settingsOpen = false;
	document.body.classList.remove('noscroll');
	if (!fromHash) {
		if (pushedSettings && location.hash === '#einstellungen') {
			pushedSettings = false;
			history.back();
		} else if (location.hash === '#einstellungen') location.hash = 'home';
	} else pushedSettings = false;
	if (settingsReturnFocus instanceof HTMLElement) settingsReturnFocus.focus({ preventScroll: true });
}
const isSettingsHash = (h: string) => h === 'einstellungen' || h === 'more';

/* ---------- Tabs ---------- */
function showTab(t: Tab, dir: number) {
	ui.tab = t;
	tick().then(() => {
		const el = document.getElementById('tab-' + t);
		if (!el) return;
		el.classList.remove('in-r', 'in-l');
		if (dir && !REDUCE) {
			void el.offsetWidth;
			el.classList.add(dir > 0 ? 'in-r' : 'in-l');
		}
		if (t === 'home') requestAnimationFrame(() => hooks.map?.resize());
	});
}
export function goTab(tab: string, push = true, dir?: number) {
	const t: Tab = (TABS as readonly string[]).includes(tab) ? (tab as Tab) : 'home';
	if (ui.sheetOpen) closeSheet();
	if (ui.full) setFull(false, true);
	if (ui.placesOpen) hooks.places?.close(true);
	if (ui.settingsOpen) closeSettings(true);
	if (dir === undefined) dir = Math.sign(TABS.indexOf(t) - TABS.indexOf(ui.tab));
	showTab(t, dir);
	if (push && location.hash !== '#' + t) location.hash = t;
	window.scrollTo(0, 0);
}

/** Startzustand aus der Adresse (#map, #laender, #more …) */
export function initFromHash() {
	const h = location.hash.slice(1);
	if (h === 'map') {
		showTab('home', 0);
		setFull(true, true);
	} else if (h === 'laender' || h === 'places') {
		showTab('home', 0);
		hooks.places?.open(true);
	} else if (isSettingsHash(h)) {
		showTab('home', 0);
		openSettings(true);
	} else goTab(h || 'home', false, 0);
	requestAnimationFrame(() => hooks.map?.resize());
}

export function onHashChange() {
	const h = location.hash.slice(1);
	if (h === 'map') {
		if (ui.placesOpen) hooks.places?.close(true);
		if (ui.settingsOpen) closeSettings(true);
		if (ui.tab !== 'home') showTab('home', 0);
		setFull(true, true);
	} else if (isSettingsHash(h)) {
		openSettings(true);
	} else if (h === 'laender' || h === 'places') {
		if (ui.settingsOpen) closeSettings(true);
		if (ui.full) setFull(false, true);
		if (ui.tab !== 'home') showTab('home', 0);
		hooks.places?.open(true);
	} else {
		if (ui.full) setFull(false, true);
		if (ui.placesOpen) hooks.places?.close(true);
		if (ui.settingsOpen) closeSettings(true);
		if (h !== ui.tab) goTab(h, false);
	}
}
