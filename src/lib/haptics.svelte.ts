/* Haptisches Feedback: Android per Vibration, iPhone (iOS 17.4+) per Schalter-Tick. Ein-/Ausschalter in den Einstellungen (nur dieses Gerät). */

const KEY = 'freiheit-haptics';

function load(): boolean {
	try {
		return localStorage.getItem(KEY) !== 'off';
	} catch {
		return true;
	}
}

export const haptics = $state({ on: typeof window === 'undefined' ? true : load() });

export function setHaptics(on: boolean) {
	haptics.on = on;
	try {
		localStorage.setItem(KEY, on ? 'on' : 'off');
	} catch {}
	if (on) haptic(12);
}

let tick: HTMLLabelElement | null = null;

function iosTick() {
	if (!tick) {
		const l = document.createElement('label');
		l.setAttribute('aria-hidden', 'true');
		l.style.cssText = 'position:fixed;left:-100px;top:-100px;width:1px;height:1px;opacity:0;pointer-events:none';
		const i = document.createElement('input');
		i.type = 'checkbox';
		i.setAttribute('switch', '');
		l.appendChild(i);
		document.body.appendChild(l);
		tick = l;
	}
	tick.click();
}

/** Kurzes Feedback; ms = Dauer bzw. Muster (nur Android, auf dem iPhone ein einzelner Tick). */
export function haptic(ms: number | number[] = 8) {
	if (!haptics.on || typeof navigator === 'undefined') return;
	if (typeof navigator.vibrate === 'function') navigator.vibrate(ms);
	else {
		try {
			iosTick();
		} catch {}
	}
}
