#!/usr/bin/env python3
"""Erzeugt src/lib/data/facts.json (Länder-Fakten für die Detailseite).

Quellen (vorher in dasselbe Verzeichnis laden):
  mledoze.json  https://raw.githubusercontent.com/mledoze/countries/master/countries.json   (ODbL 1.0)
  zone.tab      https://data.iana.org/time-zones/data/zone.tab                              (gemeinfrei)
  wd1.json/wd2.json  Wikidata-SPARQL (CC0), Abfragen q1.rq / q2.rq unten:
    q1: Hauptstadt (deutscher Name), Einwohner (mit Stichtag), Verkehrsseite je ISO-Code (P297, P36, P1082, P1622)
    q2: Amtssprachen mit ISO-639-1-Code (P37, P218)
    q3/q4: höchster Punkt mit Höhe (P610, P2044, bevorzugter Rang) und englischem Ersatznamen
  wd5, wd6, wd8.json  Hauptstädte (Lage P625, Einwohner P1082 mit Rang), Gipfel-Lage (Abfragen q5, q6, q8 unten)
  tzn.json      Anzahl unterschiedlicher Normalzeiten je Land: node scripts/tzcount.mjs (aus zone.tab)
Aufruf: python3 scripts/build-facts.py  (im Verzeichnis mit den Quelldateien), dann facts.json nach src/lib/data/ kopieren.
"""
import json, re, unicodedata, collections, math
m = json.load(open('mledoze.json'))
wd1 = json.load(open('wd1.json'))['results']['bindings']
wd2 = json.load(open('wd2.json'))['results']['bindings']
zones = collections.defaultdict(list)
for line in open('zone.tab'):
    if line.startswith('#') or not line.strip(): continue
    p = line.rstrip('\n').split('\t'); zones[p[0]].append(p[2])
by3 = {x['cca3']: x['cca2'] for x in m}
mm = {x['cca2']: x for x in m}
caps = collections.defaultdict(set); pops = collections.defaultdict(list); drive = {}
for b in wd1:
    iso = b['iso']['value']
    if 'capLabel' in b: caps[iso].add(b['capLabel']['value'])
    if 'pop' in b:
        try: pops[iso].append((b.get('popDate', {}).get('value', ''), float(b['pop']['value'])))
        except ValueError: pass
    if 'drive' in b: drive[iso] = 'l' if b['drive']['value'].endswith('Q11920728') else 'r'
langs = collections.defaultdict(list)
for b in wd2:
    iso, code = b['iso']['value'], b['code']['value']
    if code not in langs[iso]: langs[iso].append(code)
# Hauptzeitzone: Stadt der Hauptstadt, sonst bekannte Hauptzone, sonst die erste
OVR = {'US':'America/New_York','CA':'America/Toronto','AU':'Australia/Sydney','BR':'America/Sao_Paulo','RU':'Europe/Moscow','MX':'America/Mexico_City',
       'ID':'Asia/Jakarta','KZ':'Asia/Almaty','MN':'Asia/Ulaanbaatar','CD':'Africa/Kinshasa','CL':'America/Santiago','AR':'America/Argentina/Buenos_Aires',
       'ES':'Europe/Madrid','PT':'Europe/Lisbon','EC':'America/Guayaquil','NZ':'Pacific/Auckland','KI':'Pacific/Tarawa','FM':'Pacific/Pohnpei',
       'CN':'Asia/Shanghai','DE':'Europe/Berlin','MY':'Asia/Kuala_Lumpur','UZ':'Asia/Tashkent','UA':'Europe/Kyiv','PG':'Pacific/Port_Moresby','IN':'Asia/Kolkata','CY':'Asia/Nicosia'}
norm = lambda s: re.sub(r'[^a-z]', '', unicodedata.normalize('NFKD', s).encode('ascii','ignore').decode().lower())
# höchster Punkt: je Land der Gipfel mit der größten (bevorzugten) Höhe; Name deutsch, sonst englisch
wd3 = json.load(open('wd3.json'))['results']['bindings']
try:
    en = {b['hp']['value']: b['enLabel']['value'] for b in json.load(open('wd4.json'))['results']['bindings']}
except (OSError, ValueError, KeyError):
    en = {}
peaks = collections.defaultdict(dict)
for b in wd3:
    if 'elev' not in b: continue
    iso, hp = b['iso']['value'], b['hp']['value']
    pref = b.get('rank', {}).get('value', '').endswith('PreferredRank')
    cur = peaks[iso].get(hp)
    v = float(b['elev']['value'])
    if cur is None or (pref and not cur[1]) or (pref == cur[1] and v > cur[0]):
        peaks[iso][hp] = (v, pref, b.get('hpLabel', {}).get('value') or en.get(hp, ''), hp)
PEAK_NOTE = {'NL': 'Mount Scenery (Saba, Karibik)', 'AU': 'Mawson Peak (Heard-Insel)', 'ES': 'Teide (Teneriffa)',
             'PT': 'Ponta do Pico (Azoren)', 'SH': 'Queen Mary’s Peak (Tristan da Cunha)'}  # Gipfel liegt fern vom Hauptgebiet
# Korrekturen nach Prüfung: Macau in Wikidata mit falscher Einheit (170,6 m); Senegal ohne Lage – laut Wikipedia
# 648 m auf dem Grenzkamm 2,7 km südöstlich von Nepen Diakha (Wikidata: „Népin Cliff“ 531 m ohne Koordinaten)
PEAK_OVR = {'MO': (None, 171, None), 'SN': ('Nepen Diakha', 648, [-12.527, 12.356])}
tzn = json.load(open('tzn.json'))
def pt(wkt):
    m_ = re.match(r'Point\(([-\d.]+) ([-\d.]+)\)', wkt or '')
    return [round(float(m_.group(1)), 3), round(float(m_.group(2)), 3)] if m_ else None
# Hauptstädte: Lage (wd5) und Einwohner mit Rang (wd8)
capLL = collections.defaultdict(dict)
for b in json.load(open('wd5.json'))['results']['bindings']:
    if 'coord' in b: capLL[b['iso']['value']].setdefault(b['capLabel']['value'], pt(b['coord']['value']))
capPops = collections.defaultdict(lambda: collections.defaultdict(list))
for b in json.load(open('wd8.json'))['results']['bindings']:
    try: v = float(b['pop']['value'])
    except ValueError: continue
    capPops[b['iso']['value']][b['capLabel']['value']].append((b.get('popDate', {}).get('value', '')[:4], v, b['rank']['value'].rsplit('#', 1)[1]))
def cap_pop(rows):
    # Wikidata führt je Stadt oft Zeitreihen, Teilwerte (nach Alter/Geschlecht) und den Großraum. Daher: veraltete
    # Angaben weg, je Jahr der größte Wert, nur die letzten 15 Jahre; dann der bevorzugte bzw. neueste Wert – außer
    # er ist mehr als doppelt so hoch wie der (untere) Median dieser Jahre (Großraum, z. B. Kuala Lumpur 9 Mio.)
    rows = [r for r in rows if r[1] > 0 and r[2] != 'DeprecatedRank']
    dated = [r for r in rows if r[0]]
    if dated: rows = dated
    if not rows: return None
    by_year = {}  # Jahr → (Wert, bevorzugt): bevorzugter Wert des Jahres, sonst der größte
    for y, v, rank in rows:
        o, pref = by_year.get(y), rank == 'PreferredRank'
        if not o or (pref and not o[1]) or (pref == o[1] and v > o[0]): by_year[y] = (v, pref)
    years = sorted(by_year)
    if years[-1]: years = [y for y in years if int(y) >= int(years[-1]) - 15]
    vals = sorted(by_year[y][0] for y in years); med = vals[(len(vals) - 1) // 2]
    for y in [y for y in reversed(years) if by_year[y][1]] + list(reversed(years)):
        if len(years) < 2 or by_year[y][0] <= 2 * med: return [int(by_year[y][0]), int(y) if y else None]
    return [int(by_year[years[-1]][0]), int(years[-1]) if years[-1] else None]
peakLL = {}
for b in json.load(open('wd6.json'))['results']['bindings']:
    peakLL.setdefault(b['hp']['value'], pt(b['coord']['value']))
# Nachbarländer = gemeinsame Landgrenze (mledoze). Seegrenzen zählen nicht. Sonderfälle:
# feste Verbindung über das Wasser (Brücke, Damm, Tunnel) zählt wie eine Landgrenze – man kann hinüberfahren
FIXED = {('SG', 'MY'): 'Damm', ('DK', 'SE'): 'Brücke', ('GB', 'FR'): 'Tunnel', ('BH', 'SA'): 'Damm', ('HK', 'MO'): 'Brücke'}
AREA_OVR = {'SJ': 61399}  # Spitzbergen 61.022 km² + Jan Mayen 377 km² (Quelle: -1)
CAP_WD = {'TM': 'Aşgabat', 'MN': 'Ulaanbaatar'}  # deutscher Anzeigename weicht vom Wikidata-Namen ab
CAP_EXTRA = {'GQ': {'ll': [8.774, 3.752], 'pop': [137000, 2011]}}  # Malabo (Wikidata führt die Planstadt Ciudad de la Paz)
out = {}
for x in m:
    c = x['cca2']
    capEn = (x.get('capital') or [''])[0]
    zs = zones.get(c, [])
    tz = OVR.get(c) or next((z for z in zs if capEn and norm(z.rsplit('/',1)[1]) == norm(capEn)), None) or (zs[0] if zs else None)
    if tz and zs and tz not in zs and c not in OVR: tz = zs[0]
    p = sorted(pops.get(c, []))
    pop = int(p[-1][1]) if p else None
    cur = [{'c': k, 's': v.get('symbol', '')} for k, v in (x.get('currencies') or {}).items()]
    idd = x.get('idd') or {}
    sfx = idd.get('suffixes') or []
    root = idd.get('root', '')
    # mehrere Endungen: +1 (Nordamerika) und +7 (Russland/Kasachstan) bleiben kurz, sonst die kürzeste (Vatikan +379)
    call = (root if root in ('+1', '+7') or not sfx else root + (sfx[0] if len(sfx) == 1 else min(sfx, key=len))) or None
    cap = sorted(caps.get(c, [])) or ([capEn] if capEn else [])
    # Korrekturen nach Prüfung: fehlende Sprachen (Filipino/Chinesisch ohne Zweibuchstaben-Code) und Hauptsprache zuerst
    LANG_OVR = {'US': ['en'], 'CN': ['zh'], 'PH': ['fil', 'en'], 'SG': ['en', 'ms', 'zh', 'ta'], 'CH': ['de', 'fr', 'it', 'rm'],
                'BE': ['nl', 'fr', 'de'], 'LU': ['lb', 'fr', 'de'], 'CY': ['el', 'tr'], 'CA': ['en', 'fr'], 'RW': ['rw', 'en', 'fr', 'sw'],
                'BO': ['es', 'qu', 'ay', 'gn'], 'ZA': ['zu', 'xh', 'af', 'en', 'nso', 'tn', 'st', 'ts', 'ss', 've', 'nr'], 'IN': ['hi', 'en'],
                'PY': ['es', 'gn'], 'PE': ['es', 'qu', 'ay'], 'KZ': ['kk', 'ru'], 'KG': ['ky', 'ru'], 'BY': ['be', 'ru'], 'IQ': ['ar', 'ku'],
                'PK': ['ur', 'en'], 'TZ': ['sw', 'en'], 'CM': ['fr', 'en'], 'HT': ['fr', 'ht'], 'FI': ['fi', 'sv'], 'IE': ['ga', 'en'], 'NZ': ['en', 'mi'],
                'NO': ['no'], 'AF': ['ps', 'prs'], 'LK': ['si', 'ta'], 'GQ': ['es', 'fr', 'pt']}
    CAP_OVR = {'PK': ['Islamabad'], 'GQ': ['Malabo'], 'TM': ['Aschgabat'], 'MN': ['Ulan Bator'], 'ZA': ['Pretoria', 'Kapstadt', 'Bloemfontein']}
    DRIVE_OVR = {'AR': 'r'}  # Wikidata enthält auch den historischen Linksverkehr (bis 1945)
    CUR_OVR = {'FM': [{'c': 'USD', 's': '$'}], 'ZW': [{'c': 'ZWG', 's': 'ZiG'}, {'c': 'USD', 's': '$'}]}
    TZ_OVR = {'XK': 'Europe/Belgrade'}
    tz = tz or TZ_OVR.get(c)
    cap = CAP_OVR.get(c, cap)
    cur = CUR_OVR.get(c, cur)
    area = AREA_OVR.get(c, x.get('area'))
    area = area if area and area > 0 else None  # mledoze nutzt -1 für „unbekannt“
    e = {'cap': cap[:3], 'pop': pop, 'area': area, 'lang': LANG_OVR.get(c) or langs.get(c) or list((x.get('languages') or {}).keys()),
         'cur': cur, 'call': call, 'drive': DRIVE_OVR.get(c, drive.get(c)), 'tz': tz, 'tzn': tzn.get(c, 1 if tz else 0), 'nb': [by3[b] for b in x.get('borders', []) if b in by3 and (c, by3[b]) not in (('LK', 'IN'),)],  # Sri Lanka–Indien: keine Landgrenze (Palkstraße)
         'll': [round(v, 2) for v in x.get('latlng', [])], 'land': bool(x.get('landlocked'))}
    if peaks.get(c):
        v, _, n, hp = max(peaks[c].values())
        if n:
            e['peak'] = [PEAK_NOTE.get(c, n), round(v)]
            if peakLL.get(hp): e['peakLL'] = peakLL[hp]
    if c in PEAK_OVR and e.get('peak'):
        n_, h_, ll_ = PEAK_OVR[c]
        e['peak'] = [n_ or e['peak'][0], h_]
        if ll_: e['peakLL'] = ll_
    if cap:
        key = CAP_WD.get(c, cap[0])
        ex = CAP_EXTRA.get(c, {})
        ll = ex.get('ll') or capLL[c].get(key)
        cp = ex.get('pop') or cap_pop(capPops[c].get(key, []))
        if ll: e['capLL'] = ll
        if cp: e['capPop'] = cp
    fix = {z: v for (x, y), v in FIXED.items() for z in ((y,) if x == c else (x,) if y == c else ())}
    if fix:
        e['nb'] = sorted(set(e['nb']) | set(fix))
        e['fix'] = fix
    if c == 'FR':  # Datensatz führt nur das europäische Frankreich; Gesamtfläche mit Überseegebieten laut Wikidata
        e['areaNote'] = f"davon {e['area']:,.0f} km² in Europa".replace(',', '.')
        e['area'] = 643801
    out[c] = {k: v for k, v in e.items() if v not in (None, [], '')}
json.dump(out, open('facts.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), round(len(json.dumps(out, ensure_ascii=False, separators=(',', ':')).encode())/1024, 1), 'KB')
for c in ('AT', 'ZA', 'US', 'JP', 'VA', 'XK', 'TV', 'GB', 'CH'): print(c, out.get(c))

# --- SPARQL-Abfragen ---
# q1.rq:
# SELECT ?iso ?capLabel ?pop ?popDate ?drive WHERE {
#   ?c wdt:P297 ?iso .
#   OPTIONAL { ?c wdt:P36 ?cap . ?cap rdfs:label ?capLabel FILTER(lang(?capLabel)='de') }
#   OPTIONAL { ?c p:P1082 ?ps . ?ps ps:P1082 ?pop . OPTIONAL { ?ps pq:P585 ?popDate } }
#   OPTIONAL { ?c wdt:P1622 ?drive }
# }
# q2.rq:
# SELECT ?iso ?code WHERE { ?c wdt:P297 ?iso ; wdt:P37 ?lang . ?lang wdt:P218 ?code . }
# q3.rq:
# SELECT ?iso ?hp ?hpLabel ?elev ?rank WHERE {
#   ?c wdt:P297 ?iso ; wdt:P610 ?hp .
#   OPTIONAL { ?hp p:P2044 ?es . ?es wikibase:rank ?rank . ?es psv:P2044 ?ev . ?ev wikibase:quantityAmount ?elev ; wikibase:quantityUnit wd:Q11573 . }
#   OPTIONAL { ?hp rdfs:label ?hpLabel FILTER(lang(?hpLabel)='de') }
# }
# q4.rq:
# SELECT ?hp ?enLabel WHERE { ?c wdt:P297 ?iso ; wdt:P610 ?hp . ?hp rdfs:label ?enLabel FILTER(lang(?enLabel)='en') }
# q5.rq: SELECT ?iso ?capLabel ?coord ?pop ?popDate WHERE { ?c wdt:P297 ?iso ; wdt:P36 ?cap . ?cap rdfs:label ?capLabel FILTER(lang(?capLabel)='de')
#        OPTIONAL { ?cap wdt:P625 ?coord } OPTIONAL { ?cap p:P1082 ?ps . ?ps ps:P1082 ?pop . OPTIONAL { ?ps pq:P585 ?popDate } } }
# q6.rq: SELECT ?iso ?hp ?coord WHERE { ?c wdt:P297 ?iso ; wdt:P610 ?hp . ?hp wdt:P625 ?coord . }
# q8.rq: SELECT ?iso ?capLabel ?pop ?popDate ?rank WHERE { ?c wdt:P297 ?iso ; wdt:P36 ?cap . ?cap rdfs:label ?capLabel FILTER(lang(?capLabel)='de')
#        ?cap p:P1082 ?ps . ?ps ps:P1082 ?pop ; wikibase:rank ?rank . OPTIONAL { ?ps pq:P585 ?popDate } }
