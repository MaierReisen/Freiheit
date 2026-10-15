#!/usr/bin/env python3
"""Erzeugt src/lib/data/capitals.json: Zusatzfakten je Hauptstadt für die Hauptstadt-Seite.

Grundlage ist die Hauptstadt aus facts.json (cap[0], Lage capLL, Einwohner capPop – von build-facts.py).
Quellen (Cache in .capital-cache/, ignoriert):
- Wikidata (CC0, über den Spiegel QLever der Uni Freiburg): Höhe, Fläche, Gründung, Name in Landessprache, deutscher Wikipedia-Artikel
- Wikipedia (CC BY-SA 4.0, mit Quellenangabe in der App): Kurzbeschreibung = die ersten ein, zwei Sätze der Zusammenfassung

Ausgabe: {Ländercode: {w: Wikipedia-Titel, e: Höhe m, a: Fläche km², f: Gründung (Jahr, negativ = v. Chr.), n: Name in Landessprache, x: Kurzbeschreibung}}
(nur bekannte Werte)

Aufruf: python3 scripts/build-capitals.py  (--fresh lädt die Quellen neu)
"""
import csv, io, json, math, os, re, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.capital-cache')
DATA = os.path.join(ROOT, 'src', 'lib', 'data')
UA = 'Freiheit-App-Datenaufbereitung/1.0'
FRESH = '--fresh' in sys.argv
MISSING = 0  # Wikipedia-Texte, die wegen Sperre fehlen

WD = 'https://qlever.dev/api/wikidata?'
QUERY = '''PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX p: <http://www.wikidata.org/prop/> PREFIX psn: <http://www.wikidata.org/prop/statement/value-normalized/>
PREFIX wikibase: <http://wikiba.se/ontology#> PREFIX schema: <http://schema.org/>
SELECT ?iso ?cap ?l ?elev ?area ?inc ?native ?pop ?w WHERE { ?c wdt:P297 ?iso . { ?c wdt:P36 ?cap } UNION { ?cap wdt:P1376 ?c } ?cap rdfs:label ?l FILTER(lang(?l)="de")
 OPTIONAL{?cap p:P2044/psn:P2044/wikibase:quantityAmount ?elev}
 OPTIONAL{?cap p:P2046/psn:P2046/wikibase:quantityAmount ?area}
 OPTIONAL{?cap wdt:P571 ?inc}
 OPTIONAL{?cap wdt:P1705 ?native}
 OPTIONAL{?cap wdt:P1082 ?pop}
 OPTIONAL{?w schema:about ?cap ; schema:isPartOf <https://de.wikipedia.org/>} }'''

# deutscher Anzeigename in facts.json weicht vom Wikidata-Namen ab (wie in build-facts.py)
CAP_WD = {'TM': 'Aşgabat', 'MN': 'Ulaanbaatar'}
# Hauptstädte, die im Wikidata-Spiegel ohne deutschen Namen stehen: nur der Wikipedia-Text
WIKI_ONLY = {'NO': 'Oslo', 'NG': 'Abuja'}


def fetch(url, accept='*/*'):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return b''
            # Wikipedia sperrt bei vielen Abrufen zeitweise (429): Rest beim nächsten Aufruf nachholen (Cache bleibt)
            if e.code == 429 and 'wikipedia.org' in url:
                return None
            if e.code != 429 or attempt == 5:
                raise
            time.sleep(int(e.headers.get('Retry-After') or 0) or 30)


def cached(name, url, accept='*/*'):
    path = os.path.join(CACHE, name)
    if FRESH or not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        body = fetch(url, accept)
        if body is None:
            global MISSING
            MISSING += 1
            return b''
        with open(path, 'wb') as f:
            f.write(body)
        time.sleep(0.2)
    with open(path, 'rb') as f:
        return f.read()


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def year(v):
    m = re.match(r'^(-?)0*(\d{1,4})-', v or '')
    return (-int(m[2]) if m[1] else int(m[2])) if m else None


# ab hier: Satzende, aber nicht nach Abkürzungen („u. a.“, „v. Chr.“, „St.“) oder Ordnungszahlen („19. Jahrhundert“)
ABBR = re.compile(r'(\b[A-Za-zÄÖÜäöü]{1,3}|\d+)\.$')


def short(text, limit=330):
    """erste Sätze der Zusammenfassung, höchstens etwa limit Zeichen"""
    text = re.sub(r'\s+', ' ', text or '').strip()
    out, start = '', 0
    for m in re.finditer(r'[.!?](?= [A-ZÄÖÜ„])', text):
        piece = text[: m.end()]
        if ABBR.search(piece):
            continue
        if out and len(piece) > limit:
            break
        out = piece
        if len(out) > limit * 0.55:
            break
    if not out:
        out = text if len(text) <= limit + 80 else ''
    return out


def main():
    with open(os.path.join(DATA, 'facts.json'), encoding='utf-8') as f:
        facts = json.load(f)
    with open(os.path.join(DATA, 'climate.json'), encoding='utf-8') as f:
        climate = json.load(f)
    # Lage: aus facts.json, sonst vom Klima-Ort gleichen Namens (dann auch in die Ausgabe, Feld ll)
    def lage(c):
        cap = (facts[c].get('cap') or [''])[0]
        return facts[c].get('capLL') or next((p[1] for p in climate.get(c, []) if p[0] == cap), None)
    rows = list(csv.DictReader(io.StringIO(cached('wd3.csv', WD + urllib.parse.urlencode({'query': QUERY}), 'text/csv').decode('utf-8'))))
    by = {}
    for r in rows:
        by.setdefault(r['iso'], []).append(r)

    # Nachzügler (Hauptstadt fehlt an der Länder-Angabe oder ist mehrdeutig): Orte gleichen deutschen Namens suchen
    # und den nehmen, der am nächsten an der Lage aus facts.json liegt (höchstens 25 km)
    want_of = {c: CAP_WD.get(c, (facts[c].get('cap') or [''])[0]) for c in facts if facts[c].get('cap')}
    late = sorted(c for c, w in want_of.items() if lage(c) and not any(r['l'] == w for r in by.get(c, [])))
    if late:
        names = ' '.join(json.dumps(want_of[c]) + '@de' for c in late)
        q2 = QUERY.replace('?c wdt:P297 ?iso . { ?c wdt:P36 ?cap } UNION { ?cap wdt:P1376 ?c } ?cap rdfs:label ?l FILTER(lang(?l)="de")',
                           f'VALUES ?l {{ {names} }} ?cap rdfs:label ?l ; wdt:P625 ?coord .').replace('SELECT ?iso ?cap', 'SELECT ?coord ?cap')
        rows2 = list(csv.DictReader(io.StringIO(cached('wd-late-' + '-'.join(late) + '.csv', WD + urllib.parse.urlencode({'query': q2}), 'text/csv').decode('utf-8'))))
        for c in late:
            lon, lat = lage(c)
            best = {}
            for r in rows2:
                m = re.match(r'point\(([-\d.e]+) ([-\d.e]+)\)', r['coord'], re.I)
                if not m or r['l'].split('@')[0].strip('"') != want_of[c]:
                    continue
                d = math.hypot((float(m[1]) - lon) * math.cos(math.radians(lat)), float(m[2]) - lat) * 111
                # Artikel genau unter dem Stadtnamen bevorzugen (nicht „Oslo (Tettsted)“)
                d += 0 if urllib.parse.unquote(r['w']).endswith('/' + want_of[c].replace(' ', '_')) else 20
                if d <= 45 and (not best or d < best['d']):
                    best = {'d': d, 'cap': r['cap']}
            if best:
                by[c] = [dict(r, iso=c, l=want_of[c]) for r in rows2 if r['cap'] == best['cap']]

    out = {}
    for code in sorted(facts):
        cap = (facts[code].get('cap') or [None])[0]
        if not cap:
            continue
        want = CAP_WD.get(code, cap)
        cand = by.get(code, [])
        hit = [r for r in cand if r['l'] == want]
        if not hit and code in WIKI_ONLY:
            hit = [{k: '' for k in ('cap', 'l', 'elev', 'area', 'inc', 'native', 'pop')} | {'w': 'https://de.wikipedia.org/wiki/' + WIKI_ONLY[code]}]
        if not hit:
            print(f'{code} {cap}: nicht in Wikidata gefunden', flush=True)
            continue
        e = {}
        elev = [num(r['elev']) for r in hit if num(r['elev']) is not None]
        area = [num(r['area']) for r in hit if num(r['area'])]
        inc = [year(r['inc']) for r in hit if year(r['inc']) is not None]
        native = sorted({r['native'] for r in hit if r['native'] and r['native'] != cap})
        wiki = next((r['w'] for r in hit if r['w']), '')
        if elev:
            e['e'] = round(sorted(elev)[len(elev) // 2])
        if area:
            km2 = max(area) / 1e6
            e['a'] = round(km2) if km2 >= 10 else round(km2, 1)
        if inc:
            e['f'] = min(inc)
        if native:
            e['n'] = native[0]
        if wiki:
            title = urllib.parse.unquote(wiki.rsplit('/wiki/', 1)[1]).replace('_', ' ')
            e['w'] = title
            body = cached(f'wp-{code}.json', 'https://de.wikipedia.org/api/rest_v1/page/summary/' + urllib.parse.quote(title.replace(' ', '_'), safe=''), 'application/json')
            if body:
                x = short(json.loads(body).get('extract', ''))
                if x:
                    e['x'] = x
        if not facts[code].get('capLL') and lage(code):
            e['ll'] = lage(code)
        pops = [num(r['pop']) for r in hit if num(r['pop'])]
        if not facts[code].get('capPop') and pops:
            e['p'] = round(max(pops))
        if e:
            out[code] = e

    with open(os.path.join(DATA, 'capitals.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(out)} Hauptstädte geschrieben' + (f', {MISSING} Wikipedia-Texte fehlen noch (später erneut aufrufen)' if MISSING else ''), flush=True)


main()
