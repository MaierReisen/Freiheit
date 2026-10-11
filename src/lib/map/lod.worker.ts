/// <reference lib="webworker" />
import {
	FINE_URL,
	FINE_W,
	SIMP_W,
	fixFine,
	makeLod,
	packBuffers,
	packLod,
	prepFineTopo,
	presimplify,
	simpLod,
	unpackTopo,
	type Lod,
	type PackedTopo,
	type Src,
	type Topology
} from './lodcore';

/* Hintergrund-Rechner für die Detailstufen: Vorbereiten (presimplify) und Bauen der Stufen kosten auf dem Handy
   bis zu mehrere Sekunden am Stück. Hier laufen sie neben der App, die solange flüssig weiterzeichnet. */

let W50: Topology | null = null,
	PRE50: Topology | null = null,
	FULL50: Lod | null = null,
	FINE: Topology | null = null,
	PREF: Topology | null = null,
	finePromise: Promise<Topology> | null = null;
let ok: (id: string) => boolean = () => true,
	micro: (id: string) => boolean = () => false;
const src: Src = new WeakMap();

const full50 = () => (FULL50 ??= makeLod(W50, ok, src));
function loadFine() {
	finePromise ??= (async () => {
		const r = await fetch(FINE_URL);
		if (!r.ok) throw new Error('http');
		const t = await r.json();
		prepFineTopo(t);
		return (FINE = t);
	})().catch((e) => {
		finePromise = null; // später erneut versuchen
		throw e;
	});
	return finePromise;
}

async function build(name: string): Promise<Lod | null> {
	if (/^v\d$/.test(name)) {
		PRE50 ??= presimplify(W50);
		return simpLod(PRE50, SIMP_W[Number(name[1])], ok, full50(), src);
	}
	if (name === 'fine') {
		const lod = makeLod(await loadFine(), ok, src);
		fixFine(lod, full50(), micro, src);
		return lod;
	}
	if (/^w\d$/.test(name)) {
		PREF ??= presimplify(FINE ?? (await loadFine()));
		return simpLod(PREF, FINE_W[Number(name[1])], ok, undefined, src);
	}
	return null;
}

// Aufträge nacheinander abarbeiten (es rechnet ohnehin nur ein Kern)
let queue = Promise.resolve();
self.onmessage = (e: MessageEvent) => {
	const m = e.data;
	if (m.t === 'init') {
		W50 = unpackTopo(m.topo as PackedTopo);
		const ids = new Set<string>(m.ids),
			mi = new Set<string>(m.micro);
		ok = (id) => ids.has(id);
		micro = (id) => mi.has(id);
		return;
	}
	if (m.t !== 'lod') return;
	queue = queue.then(async () => {
		try {
			const lod = await build(m.name);
			if (!lod) throw new Error('unknown');
			const p = packLod(lod, src);
			(self as unknown as DedicatedWorkerGlobalScope).postMessage({ t: 'lod', name: m.name, p }, packBuffers(p));
		} catch (err) {
			self.postMessage({ t: 'err', name: m.name, net: m.name === 'fine' || m.name[0] === 'w', msg: String(err) });
		}
	});
};
