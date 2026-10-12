#!/usr/bin/env python3
"""Flughäfen und Airlines für den Tab „Flüge“.

Quellen (Cache in .airport-cache/, ignoriert):
- OurAirports (gemeinfrei): Lage, Land, Art, Linienverkehr
- mwgg/Airports (MIT): Zeitzone je Flughafen
- Wikidata (CC0, abgefragt über den Spiegel QLever der Uni Freiburg – schneller und ohne Sperren): deutsche Namen von Flughafen und Stadt, geschlossene Flughäfen (z. B. REP, TXL), Airlines nach ICAO-Code

Ausgabe:
- src/lib/data/airports.json  {IATA: [Stadt, Name ('' = wie Stadt), Land, Breite, Länge, Zeitzone]}
- src/lib/data/airlines.json  {ICAO: [Name, IATA]}

Aufruf: python3 scripts/build-airports.py  (--fresh lädt die Quellen neu)
"""
import csv, io, json, math, os, re, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.airport-cache')
OUT = os.path.join(ROOT, 'src', 'lib', 'data')
UA = 'Freiheit-App-Datenaufbereitung/1.0'
FRESH = '--fresh' in sys.argv

WD = 'https://qlever.dev/api/wikidata?'
PREFIX = 'PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> '
WD_AIRPORTS = PREFIX + '''SELECT ?iata ?aL ?cL ?coord ?cc ?end WHERE { ?a wdt:P238 ?iata .
 OPTIONAL{?a rdfs:label ?aL FILTER(lang(?aL)="de")}
 OPTIONAL{?a wdt:P931 ?c . ?c rdfs:label ?cL FILTER(lang(?cL)="de")}
 OPTIONAL{?a wdt:P625 ?coord} OPTIONAL{?a wdt:P17 ?k . ?k wdt:P297 ?cc} OPTIONAL{?a wdt:P576 ?end} }'''
WD_AIRLINES = PREFIX + '''SELECT ?icao ?iata ?l ?en ?end WHERE { ?a wdt:P230 ?icao . OPTIONAL{?a wdt:P229 ?iata}
 OPTIONAL{?a rdfs:label ?l FILTER(lang(?l)="de")} OPTIONAL{?a rdfs:label ?en FILTER(lang(?en)="en")} OPTIONAL{?a wdt:P576 ?end} }'''

SOURCES = {
    'airports.csv': 'https://davidmegginson.github.io/ourairports-data/airports.csv',
    'mwgg.json': 'https://raw.githubusercontent.com/mwgg/Airports/master/airports.json',
    'wd.csv': WD + urllib.parse.urlencode({'query': WD_AIRPORTS}),
    'wdair.csv': WD + urllib.parse.urlencode({'query': WD_AIRLINES}),
}

# Airlines, bei denen Wikidata mehrere Einträge zum selben Code hat und die Auswahl danebenliegt
AIRLINE_FIX = {}
# Teile von Airline-Namen, die auf eine Tochter/Sparte statt der eigentlichen Airline hindeuten
SUB = re.compile(r'\b(Cargo|Express|Commuter|Connect|Regional|Snowflake|Asia|Charter|Group|Holding)\b', re.I)
# Wörter in Stadtnamen, die eine Region statt einer Stadt meinen
REGION = re.compile(r'Metropolregion|Distrikt|Landkreis|Region|Provinz|Gemeinde|County|Bezirk|Kreis|Departamento|Gouvernement|Präfektur|Bundesstaat|Kanton|Insel', re.I)


def get(name):
    path = os.path.join(CACHE, name)
    if FRESH or not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        req = urllib.request.Request(SOURCES[name], headers={'User-Agent': UA, 'Accept': 'text/csv'})
        for attempt in range(8):
            try:
                with urllib.request.urlopen(req, timeout=300) as r:
                    body = r.read()
                break
            except urllib.error.HTTPError as e:
                # Wikidata begrenzt zeitweise auf eine Abfrage pro Minute: warten und erneut versuchen
                if e.code != 429 or attempt == 7:
                    raise
                wait = int(e.headers.get('Retry-After') or 0) or 75
                print(f'{name}: Wikidata bittet um Pause, warte {wait} s …', flush=True)
                time.sleep(wait)
        with open(path, 'wb') as f:
            f.write(body)
    with open(path, encoding='utf-8') as f:
        return f.read()


def short(name):
    """„Flughafen München“ → „München“ (die App zeigt „Flughafen“ nicht bei jedem Eintrag)"""
    n = re.sub(r'^(Internationaler |Regionaler )?Flughafen ', '', name or '').strip()
    return n


def main():
    # ---------- Flughäfen ----------
    oa, oa_all = {}, set()
    for r in csv.DictReader(io.StringIO(get('airports.csv'))):
        code = r['iata_code']
        if not re.fullmatch(r'[A-Z]{3}', code or ''):
            continue
        oa_all.add(code)
        t, s = r['type'], r['scheduled_service'] == 'yes'
        # große und mittlere Flughäfen immer, kleine/Wasserflugplätze/Heliports nur mit Linienverkehr
        if not (t in ('large_airport', 'medium_airport') or (s and t in ('small_airport', 'seaplane_base', 'heliport'))):
            continue
        rank = (t == 'large_airport', s, t == 'medium_airport')
        if code in oa and oa[code]['rank'] >= rank:
            continue
        oa[code] = {'rank': rank, 'name': r['name'], 'city': r['municipality'], 'cc': r['iso_country'], 'lat': float(r['latitude_deg']), 'lon': float(r['longitude_deg'])}

    tz = {}
    for v in json.loads(get('mwgg.json')).values():
        if v.get('iata') and v.get('tz'):
            tz.setdefault(v['iata'], v['tz'])

    wd = {}
    for r in csv.DictReader(io.StringIO(get('wd.csv'))):
        code = r['iata']
        if not re.fullmatch(r'[A-Z]{3}', code):
            continue
        e = wd.setdefault(code, {'names': [], 'cities': [], 'coord': None, 'cc': None, 'end': False})
        if r['aL'] and r['aL'] not in e['names']:
            e['names'].append(r['aL'])
        if r['cL'] and r['cL'] not in e['cities']:
            e['cities'].append(r['cL'])
        m = re.match(r'Point\(([-\d.]+) ([-\d.]+)\)', r['coord'] or '', re.I)
        if m and not e['coord']:
            e['coord'] = (float(m.group(2)), float(m.group(1)))
        if r['cc'] and not e['cc']:
            e['cc'] = r['cc']
        e['end'] = e['end'] or bool(r['end'])

    def city_de(code, fallback, name):
        cs = wd.get(code, {}).get('cities', [])
        good = [c for c in cs if not REGION.search(c)]
        for c in good:
            if c in name:  # Stadt steckt im Namen des Flughafens: sicher die richtige
                return c
        return (good or [fallback or ''])[0] or (cs[0] if cs else '')

    out = {}
    for code, a in oa.items():
        w = wd.get(code, {})
        name = (w.get('names') or [a['name']])[0]
        out[code] = [city_de(code, a['city'], name), short(name), a['cc'], a['lat'], a['lon'], tz.get(code)]
    # Flughäfen, die OurAirports gar nicht (mehr) mit Code führt, z. B. geschlossene wie REP oder TXL (für ältere Flüge)
    for code, w in wd.items():
        if code in oa_all or not w['coord'] or not w['cc'] or not w['names']:
            continue
        name = w['names'][0]
        out[code] = [city_de(code, '', name) or short(name), short(name), w['cc'], *w['coord'], tz.get(code)]

    # fehlende Zeitzone: vom nächsten Flughafen im selben Land
    known = [(v[3], v[4], v[2], v[5]) for v in out.values() if v[5]]
    for v in out.values():
        if v[5]:
            continue
        near = min(known, key=lambda k: (k[2] != v[2], (k[0] - v[3]) ** 2 + ((k[1] - v[4]) * math.cos(math.radians(v[3]))) ** 2))
        v[5] = near[3]
    for v in out.values():
        v[3], v[4] = round(v[3], 3), round(v[4], 3)
        if v[1] == v[0]:
            v[1] = ''  # Name = Stadt („München“): nur einmal speichern, die App zeigt dann die Stadt

    # ---------- Airlines ----------
    al = {}
    for r in csv.DictReader(io.StringIO(get('wdair.csv'))):
        code = r['icao']
        name = r['en'] or r['l']
        if not re.fullmatch(r'[A-Z]{3}', code) or not name:
            continue
        # beste Wahl: noch aktiv, mit IATA-Code, keine Sparte/Tochter, kürzerer Name
        key = (bool(r['end']), not r['iata'], bool(SUB.search(name)), len(name))
        if code not in al or key < al[code][0]:
            al[code] = (key, [name, r['iata'] if re.fullmatch(r'[A-Z0-9]{2}', r['iata'] or '') else ''])
    airlines = {k: v[1] for k, v in sorted(al.items())}
    airlines.update(AIRLINE_FIX)

    with open(os.path.join(OUT, 'airports.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(sorted(out.items())), f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT, 'airlines.json'), 'w', encoding='utf-8') as f:
        json.dump(airlines, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(out)} Flughäfen, {len(airlines)} Airlines')


if __name__ == '__main__':
    main()
