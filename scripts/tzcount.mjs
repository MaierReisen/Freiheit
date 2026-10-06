// Anzahl unterschiedlicher Normalzeiten je Land (nicht Zonennamen: Büsingen hat dieselbe Uhrzeit wie Berlin)
import fs from 'node:fs';
const zones = {};
for (const line of fs.readFileSync('zone.tab', 'utf8').split('\n')) {
	if (!line || line.startsWith('#')) continue;
	const [cc, , tz] = line.split('\t');
	(zones[cc] ??= []).push(tz);
}
const off = (tz, d) => {
	const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(d).find((x) => x.type === 'timeZoneName').value;
	const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(p);
	return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +(m[3] || 0)) : 0;
};
const out = {};
for (const [cc, list] of Object.entries(zones)) {
	const std = new Set(list.map((z) => Math.min(off(z, new Date('2025-01-15T12:00Z')), off(z, new Date('2025-07-15T12:00Z')))));
	out[cc] = std.size;
}
// China: offiziell eine Zeitzone (Ürümqi-Zeit ist nur inoffiziell gebräuchlich)
out.CN = 1;
out.UA = 1; // Krim in zone.tab mit Moskauer Zeit; offiziell eine Zeitzone
fs.writeFileSync('tzn.json', JSON.stringify(out));
console.log(['DE', 'ES', 'US', 'RU', 'AU', 'BR', 'PT', 'CN', 'ID', 'MX', 'CA', 'KZ', 'CL', 'EC', 'NZ', 'KI', 'CD', 'MN', 'UA', 'NL', 'FR'].map((c) => c + '=' + out[c]).join(' '));
