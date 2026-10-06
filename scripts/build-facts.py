#!/usr/bin/env python3
"""Erzeugt src/lib/data/facts.json (Länder-Fakten für die Detailseite).

Quellen (vorher in dasselbe Verzeichnis laden):
  mledoze.json  https://raw.githubusercontent.com/mledoze/countries/master/countries.json   (ODbL 1.0)
  zone.tab      https://data.iana.org/time-zones/data/zone.tab                              (gemeinfrei)
  wd1.json/wd2.json  Wikidata-SPARQL (CC0), Abfragen q1.rq / q2.rq unten:
    q1: Hauptstadt (deutscher Name), Einwohner (mit Stichtag), Verkehrsseite je ISO-Code (P297, P36, P1082, P1622)
    q2: Amtssprachen mit ISO-639-1-Code (P37, P218)
    q3/q4: höchster Punkt mit Höhe (P610, P2044, bevorzugter Rang) und englischem Ersatznamen
  tzn.json      Anzahl unterschiedlicher Normalzeiten je Land: node scripts/tzcount.mjs (aus zone.tab)
Aufruf: python3 scripts/build-facts.py  (im Verzeichnis mit den Quelldateien), dann facts.json nach src/lib/data/ kopieren.
"""
import json, re, unicodedata, collections
m = json.load(open('mledoze.json'))
wd1 = json.load(open('wd1.json'))['results']['bindings']
wd2 = json.load(open('wd2.json'))['results']['bindings']
zones = collections.defaultdict(list)
for line in open('zone.tab'):
    if line.startswith('#') or not line.strip(): continue
    p = line.rstrip('\n').split('\t'); zones[p[0]].append(p[2])
by3 = {x['cca3']: x['cca2'] for x in m}
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
        peaks[iso][hp] = (v, pref, b.get('hpLabel', {}).get('value') or en.get(hp, ''))
PEAK_NOTE = {'NL': 'Mount Scenery (Saba, Karibik)'}  # Gipfel liegt nicht im europäischen Teil
tzn = json.load(open('tzn.json'))
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
    CAP_OVR = {'PK': ['Islamabad'], 'GQ': ['Malabo'], 'TM': ['Aschgabat'], 'MN': ['Ulan Bator']}
    DRIVE_OVR = {'AR': 'r'}  # Wikidata enthält auch den historischen Linksverkehr (bis 1945)
    CUR_OVR = {'FM': [{'c': 'USD', 's': '$'}], 'ZW': [{'c': 'ZWG', 's': 'ZiG'}, {'c': 'USD', 's': '$'}]}
    TZ_OVR = {'XK': 'Europe/Belgrade'}
    tz = tz or TZ_OVR.get(c)
    cap = CAP_OVR.get(c, cap)
    cur = CUR_OVR.get(c, cur)
    e = {'cap': cap[:3], 'pop': pop, 'area': x.get('area'), 'lang': LANG_OVR.get(c) or langs.get(c) or list((x.get('languages') or {}).keys()),
         'cur': cur, 'call': call, 'drive': DRIVE_OVR.get(c, drive.get(c)), 'tz': tz, 'tzn': tzn.get(c, 1 if tz else 0), 'nb': [by3[b] for b in x.get('borders', []) if b in by3],
         'll': [round(v, 2) for v in x.get('latlng', [])], 'land': bool(x.get('landlocked'))}
    if peaks.get(c):
        v, _, n = max(peaks[c].values())
        if n: e['peak'] = [PEAK_NOTE.get(c, n), round(v)]
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
