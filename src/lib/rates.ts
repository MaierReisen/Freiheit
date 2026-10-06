/* Tagesaktuelle Wechselkurse (Basis Euro) von fawazahmed0/currency-api (CC0, täglich aktualisiert, ohne Schlüssel).
   Pro Tag einmal geladen und auf dem Gerät gespeichert – offline gilt der letzte Stand. */

export interface Rates {
	/** Stand der Kurse (JJJJ-MM-TT) */
	date: string;
	/** 1 € = rates[code] Einheiten (Codes klein geschrieben, wie in der Quelle) */
	rates: Record<string, number>;
	/** true: nur gespeicherter, älterer Stand (offline) */
	stale?: boolean;
}

const KEY = 'freiheit-rates';
const day = (d: Date) => d.toISOString().slice(0, 10);
const urls = (d: string) => [
	`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${d}/v1/currencies/eur.min.json`,
	`https://${d}.currency-api.pages.dev/v1/currencies/eur.min.json`
];

function readCache(): (Rates & { fetched: number }) | null {
	try {
		return JSON.parse(localStorage.getItem(KEY) || 'null');
	} catch {
		return null;
	}
}

let pending: Promise<Rates | null> | null = null;
export function getRates(): Promise<Rates | null> {
	const c = readCache();
	// heute schon geholt (oder vor weniger als 6 Stunden): gespeicherten Stand nehmen
	if (c && (c.date === day(new Date()) || Date.now() - c.fetched < 6 * 3600e3)) return Promise.resolve(c);
	pending ??= (async () => {
		const today = new Date(),
			yesterday = new Date(Date.now() - 864e5);
		// Kurse von heute sind früh am Tag evtl. noch nicht veröffentlicht: dann gestern, zuletzt „latest“
		for (const d of [day(today), day(yesterday), 'latest'])
			for (const u of urls(d)) {
				try {
					const r = await fetch(u, { cache: 'no-cache' });
					if (!r.ok) continue;
					const j = await r.json();
					if (!j?.eur || !j?.date) continue;
					const out = { date: j.date as string, rates: j.eur as Record<string, number>, fetched: Date.now() };
					try {
						localStorage.setItem(KEY, JSON.stringify(out));
					} catch {}
					return out;
				} catch {}
			}
		return c ? { ...c, stale: true } : null;
	})().finally(() => (pending = null));
	return pending;
}

/** Zahl für Beträge: große Werte ohne, kleine mit Nachkommastellen */
export function fmtMoney(v: number) {
	const a = Math.abs(v);
	const digits = a >= 1000 ? 0 : a >= 1 ? 2 : a >= 0.01 ? 4 : 6;
	return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: a >= 1 && a < 1000 ? 2 : 0 }).format(v);
}
export const fmtRateDate = (d: string) => {
	const [y, m, t] = d.split('-');
	return `${t}.${m}.${y}`;
};
