#!/usr/bin/env python3
"""Erzeugt src/lib/data/facts.json (Länder-Fakten für die Detailseite).

Quellen (vorher in dasselbe Verzeichnis laden):
  mledoze.json  https://raw.githubusercontent.com/mledoze/countries/master/countries.json   (ODbL 1.0)
  zone.tab      https://data.iana.org/time-zones/data/zone.tab                              (gemeinfrei)
  wd1.json/wd2.json  Wikidata-SPARQL (CC0), Abfragen q1.rq / q2.rq unten:
    q1: Hauptstadt (deutscher Name), Einwohner (mit Stichtag), Verkehrsseite je ISO-Code (P297, P36, P1082, P1622)
    q2: Amtssprachen mit ISO-639-1-Code (P37, P218)
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
    LANG_OVR = {'US': ['en'], 'CN': ['zh']}  # Wikidata führt hier nur Sprachen von Außengebieten bzw. keinen Zweibuchstaben-Code
    TZ_OVR = {'XK': 'Europe/Belgrade'}
    tz = tz or TZ_OVR.get(c)
    e = {'cap': cap[:3], 'pop': pop, 'area': x.get('area'), 'lang': LANG_OVR.get(c) or langs.get(c) or list((x.get('languages') or {}).keys()),
         'cur': cur, 'call': call, 'drive': drive.get(c), 'tz': tz, 'tzn': len(zs), 'nb': [by3[b] for b in x.get('borders', []) if b in by3],
         'll': [round(v, 2) for v in x.get('latlng', [])], 'land': bool(x.get('landlocked'))}
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
