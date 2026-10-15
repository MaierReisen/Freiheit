#!/usr/bin/env python3
"""Flughäfen und Airlines für den Tab „Flüge“.

Quellen (Cache in .airport-cache/, ignoriert):
- OurAirports (gemeinfrei): Lage, Land, Art, Linienverkehr
- mwgg/Airports (MIT): Zeitzone je Flughafen
- OurAirports runways.csv: Landebahnen (Zahl, längste)
- Wikidata (CC0, abgefragt über den Spiegel QLever der Uni Freiburg – schneller und ohne Sperren): deutsche Namen von Flughafen und Stadt,
  Eröffnung/Schließung, Passagiere, deutscher Wikipedia-Artikel; Airlines nach ICAO-Code mit Gründung/Ende

Nur Flughäfen mit Linienverkehr (OurAirports „scheduled_service“). Geschlossene nur, wenn das Datum der Schließung bekannt ist
(für ältere Flüge; in der App nur für Flüge vor der Schließung wählbar).

Ausgabe:
- src/lib/data/airports.json  {IATA: [Stadt, Name ('' = wie Stadt), Land, Breite, Länge, Zeitzone, geschlossen am ('' = offen), eröffnet am (ab 1990)]}
  (die letzten beiden nur, wenn bekannt)
- src/lib/data/airlines.json  {ICAO: [Name, IATA, Gründungsjahr (0 = unbekannt), letztes Jahr (0 = fliegt noch)]} (die letzten beiden nur, wenn bekannt)
- src/lib/data/airportinfo.json  {IATA: [Größe L/M/S, Höhe m, Landebahnen, längste m, ICAO, Passagiere, Jahr, Wikipedia]} (für die Flughafen-Seite, nachgeladen)

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
WD_DATES = PREFIX + 'SELECT ?iata ?a ?open ?inc ?end ?close WHERE { ?a wdt:P238 ?iata . OPTIONAL{?a wdt:P1619 ?open} OPTIONAL{?a wdt:P571 ?inc} OPTIONAL{?a wdt:P576 ?end} OPTIONAL{?a wdt:P3999 ?close} }'
WD_PAX = ('PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX p: <http://www.wikidata.org/prop/> PREFIX ps: <http://www.wikidata.org/prop/statement/> '
          'PREFIX pq: <http://www.wikidata.org/prop/qualifier/> SELECT ?iata ?n ?t WHERE { ?a wdt:P238 ?iata . ?a p:P3872 ?s . ?s ps:P3872 ?n . ?s pq:P585 ?t }')
WD_WIKI = PREFIX + 'PREFIX schema: <http://schema.org/> SELECT ?iata ?w WHERE { ?a wdt:P238 ?iata . ?w schema:about ?a ; schema:isPartOf <https://de.wikipedia.org/> }'
WD_ALDATES = PREFIX + 'SELECT ?icao ?a ?inc ?end WHERE { ?a wdt:P230 ?icao . OPTIONAL{?a wdt:P571 ?inc} OPTIONAL{?a wdt:P576 ?end} }'
WD_AIRLINES = PREFIX + '''SELECT ?icao ?a ?iata ?l ?en ?end WHERE { ?a wdt:P230 ?icao . OPTIONAL{?a wdt:P229 ?iata}
 OPTIONAL{?a rdfs:label ?l FILTER(lang(?l)="de")} OPTIONAL{?a rdfs:label ?en FILTER(lang(?en)="en")} OPTIONAL{?a wdt:P576 ?end} }'''

SOURCES = {
    'airports.csv': 'https://davidmegginson.github.io/ourairports-data/airports.csv',
    'mwgg.json': 'https://raw.githubusercontent.com/mwgg/Airports/master/airports.json',
    'wd.csv': WD + urllib.parse.urlencode({'query': WD_AIRPORTS}),
    'wdair2.csv': WD + urllib.parse.urlencode({'query': WD_AIRLINES}),
    'runways.csv': 'https://davidmegginson.github.io/ourairports-data/runways.csv',
    'wddates.csv': WD + urllib.parse.urlencode({'query': WD_DATES}),
    'wdpax.csv': WD + urllib.parse.urlencode({'query': WD_PAX}),
    'wdwiki.csv': WD + urllib.parse.urlencode({'query': WD_WIKI}),
    'wdaldates2.csv': WD + urllib.parse.urlencode({'query': WD_ALDATES}),
}
# Schließung fehlt bei Wikidata (Datum des letzten Linienflugs)
CLOSED = {'TXL': '2020-11-08', 'SXF': '2020-10-25', 'THF': '2008-10-30', 'REP': '2023-10-16', 'ISL': '2019-04-06'}

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


def day(v):
    """Wikidata-Zeitpunkt → „JJJJ-MM-TT“ ('' bei unbekanntem Wert)"""
    return v[:10] if re.match(r'\d{4}-\d{2}-\d{2}', v or '') else ''


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
        t = r['type']
        # nur mit Linienverkehr (Militär, Flugplätze ohne Linienflüge, Heliports ohne Linie fallen weg)
        if r['scheduled_service'] != 'yes' or t == 'closed':
            continue
        rank = (t == 'large_airport', t == 'medium_airport')
        if code in oa and oa[code]['rank'] >= rank:
            continue
        elev = r['elevation_ft']
        oa[code] = {'rank': rank, 'id': r['id'], 'name': r['name'], 'city': r['municipality'], 'cc': r['iso_country'], 'lat': float(r['latitude_deg']), 'lon': float(r['longitude_deg']),
                    'size': 'L' if t == 'large_airport' else 'M' if t == 'medium_airport' else 'S', 'elev': round(float(elev) * 0.3048) if elev else None,
                    'icao': r['icao_code'] or r['gps_code'] or '', 'wiki': r['wikipedia_link']}

    # Wikidata: Eröffnung (nur wenn der Code zu genau einem Eintrag gehört – sonst teilen sich alter und neuer Flughafen den Code) und Schließung
    items, opened, closed = {}, {}, dict(CLOSED)
    for r in csv.DictReader(io.StringIO(get('wddates.csv'))):
        items.setdefault(r['iata'], set()).add(r['a'])
        if day(r['open']):
            opened.setdefault(r['iata'], day(r['open']))
        c = day(r['close']) or day(r['end'])
        if c and r['iata'] not in CLOSED:
            closed[r['iata']] = max(closed.get(r['iata'], ''), c)
    opened = {k: v for k, v in opened.items() if len(items.get(k, ())) == 1 and v >= '1990'}

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

    out, gone = {}, {}
    for code, a in oa.items():
        w = wd.get(code, {})
        name = (w.get('names') or [a['name']])[0]
        out[code] = [city_de(code, a['city'], name), short(name), a['cc'], a['lat'], a['lon'], tz.get(code)]
    # geschlossene Flughäfen (OurAirports führt sie nicht mehr mit Code), z. B. TXL oder REP: nur mit bekanntem Datum, für ältere Flüge
    for code, w in wd.items():
        if code in oa or code not in closed or not w['coord'] or not w['cc'] or not w['names']:
            continue
        name = w['names'][0]
        out[code] = [city_de(code, '', name) or short(name), short(name), w['cc'], *w['coord'], tz.get(code)]
        gone[code] = closed[code]

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
    for code, v in out.items():
        if code in gone or code in opened:
            v += [gone.get(code, ''), *([opened[code]] if code in opened else [])]

    # ---------- Fakten für die Flughafen-Seite ----------
    rwy = {}
    for r in csv.DictReader(io.StringIO(get('runways.csv'))):
        if r['closed'] == '1' or not r['length_ft']:
            continue
        x = rwy.setdefault(r['airport_ref'], [0, 0])
        x[0] += 1
        x[1] = max(x[1], round(float(r['length_ft']) * 0.3048))
    pax = {}
    for r in csv.DictReader(io.StringIO(get('wdpax.csv'))):
        if not day(r['t']):
            continue
        y, n = int(r['t'][:4]), round(float(r['n']))
        if r['iata'] in out and n > 0 and (y, n) > pax.get(r['iata'], (0, 0)):
            pax[r['iata']] = (y, n)
    wiki = {}
    for r in csv.DictReader(io.StringIO(get('wdwiki.csv'))):
        if r['iata'] in oa and r['iata'] not in wiki:
            wiki[r['iata']] = urllib.parse.unquote(r['w'].rsplit('/wiki/', 1)[1])
    info = {}
    for code, a in oa.items():
        rw = rwy.get(a['id'], [0, 0])
        en = urllib.parse.unquote(a['wiki'].rsplit('/wiki/', 1)[1]) if '/wiki/' in (a['wiki'] or '') and 'en.wikipedia' in a['wiki'] else ''
        y, n = pax.get(code, (0, 0))
        info[code] = [a['size'], a['elev'], rw[0], rw[1], a['icao'], n, y, wiki.get(code) or (f'en:{en}' if en else '')]

    # ---------- Airlines ----------
    # Gründung und Ende (Jahr) je Wikidata-Eintrag: ein Flug muss in diese Zeit fallen
    span = {}
    for r in csv.DictReader(io.StringIO(get('wdaldates2.csv'))):
        x = span.setdefault(r['a'], [0, 0])
        if day(r['inc']):
            x[0] = max(x[0], int(r['inc'][:4]))
        if day(r['end']):
            x[1] = max(x[1], int(r['end'][:4]))
    for x in span.values():
        if x[1] and x[0] > x[1]:
            x[0] = 0  # widersprüchlich: Gründung weglassen

    items = {}
    for r in csv.DictReader(io.StringIO(get('wdair2.csv'))):
        code = r['icao']
        name = r['en'] or r['l']
        if not re.fullmatch(r'[A-Z]{3}', code) or not name:
            continue
        iata = r['iata'] if re.fullmatch(r'[A-Z0-9]{2}', r['iata'] or '') else ''
        # beste Wahl: noch aktiv, mit IATA-Code, keine Sparte/Tochter, kürzerer Name
        key = (bool(r['end']), not iata, bool(SUB.search(name)), len(name))
        e = items.setdefault(code, {})
        if r['a'] not in e or key < e[r['a']][0]:
            e[r['a']] = (key, name, iata)
    airlines = {}
    for code in sorted(items):
        best = sorted(items[code].items(), key=lambda kv: kv[1][0])
        a, (key, name, iata) = best[0]
        airlines[code] = [name, iata] + (span[a] if span.get(a, [0, 0]) != [0, 0] else [])
        # frühere Airlines mit demselben Code (z. B. BER = Air Berlin bis 2017): eigener Eintrag „BER-2“, damit alte Flüge erkannt werden
        n = 2
        for a2, (k2, name2, iata2) in best[1:]:
            sp = span.get(a2, [0, 0])
            if iata2 and sp[1] and not SUB.search(name2) and (name2, iata2) != (name, iata):
                airlines[f'{code}-{n}'] = [name2, iata2] + sp
                n += 1
    airlines.update(AIRLINE_FIX)

    with open(os.path.join(OUT, 'airports.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(sorted(out.items())), f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT, 'airlines.json'), 'w', encoding='utf-8') as f:
        json.dump(airlines, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT, 'airportinfo.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(sorted(info.items())), f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(out)} Flughäfen ({len(gone)} geschlossen), {len(airlines)} Airlines')


if __name__ == '__main__':
    main()
