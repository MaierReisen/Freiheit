#!/usr/bin/env python3
"""Erzeugt src/lib/data/climate.json: Klima je Land für „Beste Reisezeit“.

Quellen (beide gemeinfrei):
  TerraClimate v1.1, Klimanormale 1991–2020 (CC0), ~4 km Raster, Abfrage per OPeNDAP:
    http://thredds.northwestknowledge.net:8080/thredds/dodsC/TERRACLIMATE_ALL/climatology/TerraClimate_19912020_{tmax,tmin,ppt}.nc
    – mittlere Tageshöchst-/Tiefsttemperatur (°C) und Niederschlag (mm) je Monat. Auf Stationsnormalen (WorldClim) gestützt,
      daher auch in Küsten- und Gebirgslagen verlässlich (geprüft u. a. an Berlin, Lima, Quito, La Paz, Dubai, Singapur).
  NOAA OISST v2.1, Monatsmittel 1991–2020 der Meeresoberflächentemperatur (gemeinfrei), 0,25°-Raster:
    https://psl.noaa.gov/thredds/dodsC/Datasets/noaa.oisst.v2.highres/sst.mon.ltm.1991-2020.nc
    – Wassertemperatur für Orte am Meer (nächster Meerespunkt höchstens 28 km entfernt; die Großen Seen zählen nicht).
  Natural Earth 10m Populated Places (gemeinfrei) – weitere Orte großer Länder, deutsche Namen:
    https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places.geojson

Orte: die Hauptstadt (Lage aus facts.json, sonst Natural Earth bzw. FALLBACK); feste Reiseregionen (EXTRA, z. B. Antalya,
Cusco, Bali); dazu – nach Einwohnern absteigend – Städte, deren Klima
sich deutlich von allen bereits gewählten Orten unterscheidet (z. B. Antalya für die Türkei, Las Palmas für Spanien,
Miami für die USA): höchstens 3 Orte, bei Ländern ab 300.000 km² höchstens 4. Liegt ein Ort im Raster im Meer (kleine
Inseln, Küste), zählt der nächste Landpunkt im Umkreis von ~10 km (notfalls ~25 km).

Je Ort: [Name, [lon, lat], Tageshöchst °C ×12, Tiefst °C ×12, Niederschlag mm ×12, Wasser °C ×12 oder null,
          Zeitzone (für Sonnenauf-/-untergang) oder null, Wirbelsturmsaison [Bezeichnung, Monate 0–11] oder null]

Aufruf: python3 scripts/build-climate.py --cache VERZEICHNIS   (dauert ~20 Minuten, nur bei Bedarf neu erzeugen)
"""
import json, math, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FACTS = os.path.join(ROOT, 'src', 'lib', 'data', 'facts.json')
OUT = os.path.join(ROOT, 'src', 'lib', 'data', 'climate.json')
NE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places.geojson'
TC = 'http://thredds.northwestknowledge.net:8080/thredds/dodsC/TERRACLIMATE_ALL/climatology/TerraClimate_19912020_{v}.nc.ascii?{v}[0:1:11][{a}:1:{b}][{c}:1:{d}]'
UA = {'User-Agent': 'Freiheit-App-Datenaufbereitung/1.0'}
MIN_KM, MIN_POP, DIFF = 150, 100000, 3.5
# Orte ohne Hauptstadt-Lage in facts.json (Sonderverwaltungszonen, Gebiete)
FALLBACK = {'HK': ('Hongkong', [114.17, 22.31]), 'MO': ('Macau', [113.55, 22.20]), 'BQ': ('Kralendijk', [-68.27, 12.15]),
            'SJ': ('Longyearbyen', [15.63, 78.22]), 'EH': ('El Aaiún', [-13.20, 27.15])}
# wichtige Reiseregionen mit eigenem Klima, die nach Einwohnern nicht vorne lägen – immer dabei (gleich nach der Hauptstadt)
EXTRA = {'US': [('Honolulu (Hawaii)', [-157.86, 21.31]), ('Miami', [-80.19, 25.77])], 'AU': [('Sydney', [151.21, -33.87]), ('Cairns', [145.77, -16.92]), ('Perth', [115.86, -31.95])],
         'TH': [('Phuket', [98.39, 7.89]), ('Chiang Mai', [98.99, 18.79])], 'ID': [('Bali', [115.22, -8.65])],
         'MX': [('Cancún', [-86.85, 21.16])], 'BR': [('Rio de Janeiro', [-43.20, -22.91])], 'IT': [('Palermo', [13.36, 38.12])],
         'GR': [('Heraklion (Kreta)', [25.14, 35.34])], 'EG': [('Hurghada', [33.81, 27.26])], 'ES': [('Palma (Mallorca)', [2.65, 39.57]), ('Las Palmas (Kanaren)', [-15.43, 28.12])],
         'PT': [('Funchal (Madeira)', [-16.91, 32.65]), ('Ponta Delgada (Azoren)', [-25.67, 37.74])], 'NZ': [('Queenstown', [168.66, -45.03])],
         'JP': [('Naha (Okinawa)', [127.68, 26.21])], 'MA': [('Marrakesch', [-7.99, 31.63])], 'TR': [('Istanbul', [28.98, 41.01]), ('Antalya', [30.71, 36.90])],
         'NO': [('Tromsø', [18.96, 69.65])], 'CL': [('Punta Arenas', [-70.91, -53.16])], 'AR': [('Ushuaia', [-68.30, -54.80])],
         'PE': [('Cusco', [-71.97, -13.53])], 'EC': [('Galápagos', [-90.31, -0.74])]}
RENAME = {'Manukau': 'Auckland'}  # Natural Earth führt Auckland unter dem Stadtteil Manukau
EXCLUDE = {('DZ', 'Arak')}
SST = 'https://psl.noaa.gov/thredds/dodsC/Datasets/noaa.oisst.v2.highres/sst.mon.ltm.1991-2020.nc.ascii?sst[0:1:11][{a}:1:{b}][{c}:1:{d}]'
SST_KM = 28
SEA_YES = {'Singapur'}  # Küstenstadt, deren Meerespunkte im Raster etwas weiter entfernt liegen
SEA_NO = {'Nikosia', 'San Marino', 'Vatikanstadt', 'Baguio City', 'Taipeh', 'Caracas'}  # Meer nah, aber nicht am Meer (Inland, Berge)
# Zeitzonen der Orte in Ländern mit mehreren Zeitzonen (sonst gilt die des Landes; unbekannt → keine Uhrzeiten)
TZ_PLACE = {'Honolulu (Hawaii)': 'Pacific/Honolulu', 'Miami': 'America/New_York', 'Los Angeles': 'America/Los_Angeles', 'Chicago': 'America/Chicago',
            'Sydney': 'Australia/Sydney', 'Cairns': 'Australia/Brisbane', 'Perth': 'Australia/Perth', 'Brisbane': 'Australia/Brisbane', 'Wollongong': 'Australia/Sydney',
            'Las Palmas (Kanaren)': 'Atlantic/Canary', 'Funchal (Madeira)': 'Atlantic/Madeira', 'Ponta Delgada (Azoren)': 'Atlantic/Azores',
            'Galápagos': 'Pacific/Galapagos', 'Guayaquil': 'America/Guayaquil', 'São Paulo': 'America/Sao_Paulo', 'Rio de Janeiro': 'America/Sao_Paulo', 'Belém': 'America/Belem', 'Recife': 'America/Recife',
            'Vancouver': 'America/Vancouver', 'Calgary': 'America/Edmonton', 'Winnipeg': 'America/Winnipeg',
            'Cancún': 'America/Cancun', 'Tijuana': 'America/Tijuana', 'Ciudad Juárez': 'America/Ciudad_Juarez', 'Torreón': 'America/Monterrey', 'Guadalajara': 'America/Mexico_City', 'Monterrey': 'America/Monterrey',
            'Nowosibirsk': 'Asia/Novosibirsk', 'Rostow am Don': 'Europe/Moscow', 'Jekaterinburg': 'Asia/Yekaterinburg',
            'Bali': 'Asia/Makassar', 'Punta Arenas': 'America/Punta_Arenas', 'Concepción': 'America/Santiago', 'Antofagasta': 'America/Santiago',
            'Palma (Mallorca)': 'Europe/Madrid', 'Sevilla': 'Europe/Madrid', 'Bilbao': 'Europe/Madrid', 'Queenstown': 'Pacific/Auckland', 'Auckland': 'Pacific/Auckland',
            'Lubumbashi': 'Africa/Lubumbashi', 'Bukavu': 'Africa/Lubumbashi', 'Beni': 'Africa/Lubumbashi'}
# Wirbelsturmsaisons (offizielle Saisonzeiten): Land → (Bezeichnung, Monate 1–12, nur für diese Orte oder None = alle)
ATL = ('Hurrikansaison', list(range(6, 12)))   # Atlantik: 1. Juni – 30. November (NOAA)
SIO = ('Zyklonsaison', [11, 12, 1, 2, 3, 4])     # südlicher Indischer Ozean und Südpazifik: November – April
STORMS = {**{c: ATL + (None,) for c in 'AG AI BB BL BM BS BZ CU DM DO GD GP HT JM KN KY LC MF MQ MS PR SX TC VC VG VI'.split()},
          'US': ATL + (['Miami'],), 'MX': ATL + (['Cancún'],),
          **{c: SIO + (None,) for c in 'MG MU RE YT KM FJ VU NC TO WS SB CK NU WF AS'.split()},
          'MZ': SIO + (None,), 'AU': ('Zyklonsaison', [11, 12, 1, 2, 3, 4], ['Cairns']),
          'PH': ('Taifunsaison', [6, 7, 8, 9, 10, 11], None), 'JP': ('Taifunsaison', [7, 8, 9, 10], None),
          'TW': ('Taifunsaison', [7, 8, 9, 10], None), 'HK': ('Taifunsaison', [7, 8, 9], None), 'MO': ('Taifunsaison', [7, 8, 9], None),
          'CN': ('Taifunsaison', [7, 8, 9], ['Shanghai', 'Guangzhou']), 'VN': ('Taifunsaison', [9, 10, 11], ['Đà Nẵng']),
          'GU': ('Taifunsaison', [7, 8, 9, 10, 11], None), 'MP': ('Taifunsaison', [7, 8, 9, 10, 11], None),
          'BD': ('Zyklonsaison', [4, 5, 10, 11], None), 'IN': ('Zyklonsaison', [4, 5, 10, 11, 12], ['Chennai', 'Kalkutta'])}  # Fehler in Natural Earth: als Großstadt in der Sahara geführt (gemeint ist das iranische Arak)


def fetch(url, cache, name, binary=False):
    p = os.path.join(cache, name)
    if not os.path.exists(p):
        for t in range(5):
            try:
                data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
                break
            except Exception:
                if t == 4:
                    raise
                time.sleep(3 + 5 * t)
        open(p, 'wb').write(data)
        time.sleep(0.2)
    return open(p, 'rb').read() if binary else open(p, encoding='utf-8').read()


def dist(a, b):
    (lo1, la1), (lo2, la2) = a, b
    p1, p2 = math.radians(la1), math.radians(la2)
    return 6371 * math.acos(max(-1, min(1, math.sin(p1) * math.sin(p2) + math.cos(p1) * math.cos(p2) * math.cos(math.radians(lo2 - lo1)))))


def grid(v, lat, lon, cache, r=2):
    """Werte im (2r+1)²-Umfeld des Gitterpunkts; Raster 1/24°, Breite absteigend ab 89,979°"""
    i, j = round((89.97916666666667 - lat) * 24), round((lon + 179.97916666666666) * 24) % 8640
    txt = fetch(TC.format(v=v, a=i - r, b=i + r, c=j - r, d=j + r), cache, f'tc_{v}_{i}_{j}_{r}.txt')
    body = txt.split('-' * 45)[1]
    g = {}
    for m, y, vals in re.findall(r'\[(\d+)\]\[(\d+)\], ([-\d, ]+)', body):
        for x, s in enumerate(vals.split(',')):
            g.setdefault((int(y) - r, x - r), [None] * 12)[int(m)] = int(s)
    return g


def climate(lat, lon, cache):
    """Monatsmittel am Ort bzw. am nächsten Landpunkt; None, wenn ringsum nur Meer"""
    res = {}
    for r in (2, 5):  # erst ~10 km, dann ~25 km Umkreis (sehr kleine Inseln)
        ok = True
        with ThreadPoolExecutor(3) as ex:  # die drei Größen gleichzeitig abfragen
            grids = dict(zip(('tmax', 'tmin', 'ppt'), ex.map(lambda v: grid(v, lat, lon, cache, r), ('tmax', 'tmin', 'ppt'))))
        for v in ('tmax', 'tmin', 'ppt'):
            g = grids[v]
            cells = sorted((k for k, vals in g.items() if all(s is not None and s > -30000 for s in vals)), key=lambda k: k[0] ** 2 + k[1] ** 2)
            if not cells:
                ok = False
                break
            vals = g[cells[0]]
            res[v] = [round(s * 0.1) for s in vals] if v == 'ppt' else [round(s * 0.1 - 73.0, 1) for s in vals]
        if ok:
            return res
    return None


def sea_temp(lat, lon, cache):
    """Wasser-Monatsmittel am nächsten Meerespunkt (≤ SST_KM), sonst None; Raster ab -89,875° bzw. 0,125° in 0,25°-Schritten"""
    r = 2
    i, j = round((lat + 89.875) * 4), round(((lon % 360) - 0.125) * 4) % 1440
    c0, c1 = max(0, j - r), min(1439, j + r)  # am Nullmeridian endet das Raster: Ausschnitt nicht über den Rand legen
    txt = fetch(SST.format(a=i - r, b=i + r, c=c0, d=c1), cache, f'sst_{i}_{j}.txt')
    best = None
    g = {}
    for m, y, vals in re.findall(r'\[(\d+)\]\[(\d+)\], ([-\deE.+, ]+)', txt.split('-' * 45)[1]):
        for x, sv in enumerate(vals.split(',')):
            v = float(sv)
            g.setdefault((int(y) - r, x + c0 - j), [None] * 12)[int(m)] = None if abs(v) > 100 else v
    for (dy, dx), vals in g.items():
        if any(v is None for v in vals):
            continue
        clat, clon = (i + dy) * 0.25 - 89.875, (j + dx) * 0.25 + 0.125
        if -93 < (clon if clon <= 180 else clon - 360) < -75 and 41 < clat < 49.5:
            continue  # Große Seen
        d = dist([lon, lat], [clon if clon <= 180 else clon - 360, clat])
        if best is None or d < best[0]:
            best = (d, vals)
    return best


def differs(a, b):
    """deutlich anderes Klima: Tagestemperatur im Mittel um mehrere Grad anders und/oder andere Regenzeiten"""
    dt = sum(abs(x - y) for x, y in zip(a['tmax'], b['tmax'])) / 12
    dp = sum(abs(math.log((x + 20) / (y + 20))) for x, y in zip(a['ppt'], b['ppt'])) / 12
    return dt + 2 * dp >= DIFF


def main():
    cache = sys.argv[sys.argv.index('--cache') + 1] if '--cache' in sys.argv else os.path.join(ROOT, '.climate-cache')
    os.makedirs(cache, exist_ok=True)
    facts = json.load(open(FACTS))
    ne = json.loads(fetch(NE_URL, cache, 'ne_places.geojson'))
    places, caps = {}, {}
    for f in ne['features']:
        p = f['properties']
        iso = p.get('ISO_A2')
        if not iso or iso == '-99' or iso not in facts:
            continue
        if (iso, p['NAME']) in EXCLUDE:
            continue
        name = RENAME.get(p['NAME'], p.get('NAME_DE') or p['NAME'])
        item = (p.get('POP_MAX') or 0, name, [round(p['LONGITUDE'], 3), round(p['LATITUDE'], 3)])
        if p.get('ADM0CAP') == 1 and iso not in caps:
            caps[iso] = item
        if item[0] >= MIN_POP:
            places.setdefault(iso, []).append(item)
    out, missing, near_sea = {}, [], []
    for code, e in sorted(facts.items()):
        if e.get('capLL') and e.get('cap'):
            first = (e['cap'][0], e['capLL'])
        elif code in caps:
            first = ((e.get('cap') or [caps[code][1]])[0], caps[code][2])
        elif code in FALLBACK:
            first = FALLBACK[code]
        else:
            continue
        c0 = climate(first[1][1], first[1][0], cache)
        if not c0:
            missing.append(f'{code}:{first[0]}')
            continue
        sel = [(first[0], first[1], c0)]
        for name, ll in EXTRA.get(code, []):
            c = climate(ll[1], ll[0], cache)
            if c:
                sel.append((name, ll, c))
            else:
                missing.append(f'{code}:{name}')
        limit = min(5, (4 if (e.get('area') or 0) >= 300000 else 3) + len(EXTRA.get(code, [])))
        for pop, name, ll in sorted(places.get(code, []), key=lambda x: -x[0])[:12]:
            if len(sel) >= limit:
                break
            if any(dist(ll, s[1]) < MIN_KM for s in sel):
                continue
            c = climate(ll[1], ll[0], cache)
            if c and all(differs(c, s[2]) for s in sel):
                sel.append((name, ll, c))
        rows = []
        for k, (n, ll, c) in enumerate(sel):
            sea = sea_temp(ll[1], ll[0], cache)
            water = [round(v) for v in sea[1]] if sea and n not in SEA_NO and (sea[0] <= SST_KM or n in SEA_YES) else None
            tz = e.get('tz') if k == 0 or e.get('tzn', 1) == 1 else TZ_PLACE.get(n)
            st = STORMS.get(code)
            storm = [st[0], [m - 1 for m in st[1]]] if st and (st[2] is None or n in st[2]) else None
            rows.append([n, [round(ll[0], 2), round(ll[1], 2)], [round(x) for x in c['tmax']], [round(x) for x in c['tmin']], c['ppt'], water, tz, storm])
            if sea and SST_KM < sea[0] < 45 and n not in SEA_YES:
                near_sea.append(f'{code}:{n} {round(sea[0])} km')
        out[code] = rows
        print(code, [l[0] for l in out[code]], flush=True)
    # Antarktis: kein Rasterpunkt/Ort vorhanden, daher von Hand (Antarktische Halbinsel, Richtwerte der Station Esperanza)
    out['AQ'] = [['Antarktische Halbinsel', [-57.0, -63.4], [2, 2, 0, -3, -5, -7, -8, -7, -6, -3, 0, 1], [-1, -1, -3, -7, -10, -12, -13, -12, -10, -7, -3, -1],
                  [40, 45, 50, 45, 45, 40, 40, 35, 35, 35, 35, 40], [1, 1, 1, 0, 0, -1, -1, -1, -1, -1, 0, 0], 'Antarctica/Palmer', None]]
    json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(out), 'Länder,', round(os.path.getsize(OUT) / 1024, 1), 'KB; ohne Landpunkt:', missing)


if __name__ == '__main__':
    main()
