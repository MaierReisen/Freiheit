/* Reisepass: welche Stempel auf diesem Gerät schon „gestempelt“ zu sehen waren.
   Neue Länder bekommen beim nächsten Öffnen des Passes die Stempel-Animation. null = Pass noch nie geöffnet. */

const KEY = 'freiheit-pass-seen';

function load(): string[] | null {
	try {
		const v = JSON.parse(localStorage.getItem(KEY) || 'null');
		return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : null;
	} catch {
		return null;
	}
}

export const passSeen = $state<{ codes: string[] | null }>({ codes: typeof window === 'undefined' ? null : load() });

export function markSeen(codes: string[]) {
	passSeen.codes = codes;
	try {
		localStorage.setItem(KEY, JSON.stringify(codes));
	} catch {}
}

/* Flugpass: welche Bordkarten (Strecken) schon zu sehen waren – neue bekommen beim nächsten Öffnen die Aufkleben-Animation */
const FP_KEY = 'freiheit-fp-seen';
function loadFp(): string[] | null {
	try {
		const v = JSON.parse(localStorage.getItem(FP_KEY) || 'null');
		return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : null;
	} catch {
		return null;
	}
}
export const fpSeen = $state<{ keys: string[] | null }>({ keys: typeof window === 'undefined' ? null : loadFp() });
export function markFpSeen(keys: string[]) {
	fpSeen.keys = keys;
	try {
		localStorage.setItem(FP_KEY, JSON.stringify(keys));
	} catch {}
}

/** Zurück auf „Pass noch nie geöffnet“ (Konto zurücksetzen) */
export function resetSeen() {
	passSeen.codes = null;
	fpSeen.keys = null;
	try {
		localStorage.removeItem(KEY);
		localStorage.removeItem(FP_KEY);
	} catch {}
}
