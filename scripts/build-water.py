"""Erzeugt src/lib/data/water.json (Flüsse und Seen für die Länderseite).

Quellen (gemeinfrei, Natural Earth): ne_10m_rivers_lake_centerlines.geojson, ne_10m_lakes.geojson von
https://github.com/nvkelso/natural-earth-vector/tree/master/geojson – nur Rang <= 8, vereinfacht, deutsche Namen.
"""
import json, math
import math as _m
def dp(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dmax, idx = 0, 0
    ax, ay, bx, by = a[0], a[1], b[0], b[1]; L = _m.hypot(bx-ax, by-ay) or 1e-12
    for i in range(1, len(pts)-1):
        px, py = pts[i]; d = abs((bx-ax)*(ay-py)-(ax-px)*(by-ay))/L
        if d > dmax: dmax, idx = d, i
    if dmax > tol: return dp(pts[:idx+1], tol)[:-1] + dp(pts[idx:], tol)
    return [a, b]
def lines(g):
    t = g['type']
    if t == 'LineString': return [g['coordinates']]
    if t in ('MultiLineString', 'Polygon'): return g['coordinates']
    if t == 'MultiPolygon': return [r for p in g['coordinates'] for r in p]
    return []
def simp(line, tol, ring):
    pts = [c[:2] for c in line]
    if ring and len(pts) > 4:
        a = pts[0]; k = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0]-a[0], pts[i][1]-a[1]))
        out = dp(pts[:k+1], tol)[:-1] + dp(pts[k:], tol)
    else:
        out = dp(pts, tol)
    return [[round(x, 2), round(y, 2)] for x, y in out]
# deutsche Namen, wo sie vom Ortsnamen abweichen
DE = {'Danube': 'Donau', 'Soroksari Duna': 'Donau', 'Rhine': 'Rhein', 'Rhin': 'Rhein', 'Nile': 'Nil', 'Albert Nile': 'Albert-Nil', 'Victoria Nile': 'Victoria-Nil',
      'El Bahr el Abyad': 'Weißer Nil', 'Bahr el Jebel': 'Weißer Nil', 'El Bahr el Azraq': 'Blauer Nil', 'Abay': 'Blauer Nil', 'Chang Jiang': 'Jangtsekiang',
      'Yangtze': 'Jangtsekiang', 'Huang': 'Gelber Fluss', 'Volga': 'Wolga', 'Vistula': 'Weichsel', 'Dnipro': 'Dnepr', 'Dnepre': 'Dnepr', 'Dniester': 'Dnister',
      'Euphrates': 'Euphrat', 'Al Furat': 'Euphrat', 'Firat': 'Euphrat', 'Dicle': 'Tigris', 'Congo': 'Kongo', 'Zambezi': 'Sambesi', 'St. Lawrence': 'Sankt-Lorenz-Strom',
      'Thames': 'Themse', 'Tejo': 'Tajo', 'Rhône': 'Rhone', 'Tisa': 'Theiß', 'Tisza': 'Theiß', 'Drava': 'Drau', 'Daugava': 'Düna', 'Severnaya Dvina': 'Nördliche Dwina',
      'Yenisey': 'Jenissei', 'Malyy Yenisey': 'Kleiner Jenissei', 'Verkhniy Yenisey': 'Großer Jenissei', 'Irtysh': 'Irtysch', 'Ertis': 'Irtysch', 'Ertix': 'Irtysch',
      'Lancang': 'Mekong', 'Orange': 'Oranje', 'Ayeyarwady': 'Irrawaddy', 'Salween': 'Saluen', 'Nu': 'Saluen', 'Syr Darya': 'Syrdarja', 'Amu  Darya': 'Amudarja',
      'Neva': 'Newa', 'Pechora': 'Petschora', 'Sénégal': 'Senegal', 'Shatt al Arab': 'Schatt al-Arab', 'Suez Canal': 'Suezkanal', 'Panama Canal': 'Panamakanal',
      'Heilong Jiang': 'Amur', 'Argun’': 'Argun', 'Hong': 'Roter Fluss', 'Selenge (Selenga)': 'Selenga', 'Yarlung': 'Brahmaputra', 'Dihang': 'Brahmaputra',
      'Bratul Chillia': 'Donau (Kilia-Arm)', 'Bratul Sulina': 'Donau (Sulina-Arm)', 'Bratul Sfintu Gheorghe': 'Donau (St.-Georgs-Arm)', 'Lower Tunguska': 'Untere Tunguska',
      'Göta älv': 'Göta älv', 'Vuoksi': 'Vuoksi', 'Svir’': 'Swir', 'Tom’': 'Tom', 'Anadyr’': 'Anadyr', 'Olenëk': 'Olenjok', 'Vilyuy': 'Wiljui', 'Vychegda': 'Wytschegda',
      'Sukhona': 'Suchona', 'Kolyma': 'Kolyma', 'Indigirka': 'Indigirka', 'Khatanga': 'Chatanga', 'Mamberamo': 'Mamberamo', 'Kemijoki': 'Kemijoki',
      'Godävari': 'Godavari', 'Mahäna Nadï': 'Mahanadi', 'São  Francisco': 'São Francisco', 'Amazonas': 'Amazonas', 'Nederrijn': 'Nederrijn', 'R. des Outaouais': 'Ottawa'}
# Natural Earth hat in den Flussnamen Sonderzeichen verloren („Rhne“, „Klarlven“) und einzelne Fehler – Korrektur nach
# Prüfung aller Namen (Zuordnung über die Lage); dazu die im Deutschen üblichen Namen (Tiber, Etsch, Memel …)
FIX = {'Rhne': 'Rhone', 'Syr  Darya': 'Syrdarja', 'Kiz?lirmak': 'Kızılırmak', 'Byk Menderes': 'Büyük Menderes',
       'Ro Grande de Matagalpa': 'Río Grande de Matagalpa', 'Ro Grande de Santiago': 'Río Grande de Santiago', 'Klarlven': 'Klarälven',
       'ngermanlven': 'Ångermanälven', 'Stora Lule lv': 'Luleälv', 'Lule lv': 'Luleälv', 'Gta lv': 'Göta älv', 'Skelleftelven': 'Skellefteälven',
       'Tornelven': 'Torneälven', 'Motala strm': 'Motala ström', 'Santa Mara': 'Santa María', 'Chirrip del Atlntico': 'Chirripó', 'Pnuco': 'Pánuco',
       'Zncara': 'Záncara', 'Grande Rivire de la Baleine': 'Grande Rivière de la Baleine', 'Bahr el  Zeraf': 'Bahr el Zeraf', 'Mlzes': 'Rivière aux Mélèzes',
       'Sane': 'Saône', 'Sapt': 'Koshi', 'Mamas': 'Manas', 'Bajang': 'Rajang', 'Mytinge': 'Myitnge', 'Pend Orielle': 'Pend Oreille', 'Thjórsá': 'Þjórsá',
       'Sio': 'Sió', 'Tevere': 'Tiber', 'Adige': 'Etsch', 'Ticino': 'Tessin', 'Neman': 'Memel', 'Sava': 'Save', 'Esil': 'Ischim', 'Ishim': 'Ischim', 'Ile': 'Ili',
       'Panj': 'Pandsch', 'Southern Bug': 'Südlicher Bug', 'Pripyat': 'Prypjat', 'Evros': 'Mariza', 'Haliacmon': 'Aliakmonas', 'Mures': 'Mureș',
       'Shabeelle': 'Shabelle', 'Shebele': 'Shabelle', 'Corantijn': 'Courantyne', 'Bénoué': 'Benue', 'Oued Sebou': 'Sebou', 'Orhon': 'Orchon', 'Ngun': 'Nam Ngum',
       'Donets': 'Donez', 'Oulu': 'Oulujoki', 'Ghäghara': 'Ghaghara', 'Da': 'Schwarzer Fluss', 'Ca': 'Cả'}
def fix_river(n, lon):
    if n == 'Drau' and lon < -10: return 'Þjórsá'  # Oberlauf der Þjórsá, in Natural Earth fälschlich „Drau“
    if n == 'Ou' and lon < 110: return 'Nam Ou'  # Laos (der chinesische Ou bleibt)
    return FIX.get(n, n)
# Seen: deutscher Name, wo er nicht vollständig ist; sonst der Originalname, wenn der deutsche kein Wort für „See“ enthält
LAKE_DE = {'Comer': 'Comer See', 'Schweriner': 'Schweriner See', 'Pleskauer': 'Pleskauer See', 'Weißer': 'Weißer See', 'Oberer': 'Oberer See',
           'Telezker': 'Telezker See', 'Genezareth': 'See Genezareth', 'Beyşehir': 'Beyşehir-See', 'Bay': 'Laguna de Bay', 'Lago de  Erepecu': 'Lago de Erepecu',
           'Saksak Dağı': 'Karakaya-Stausee', 'Balaton': 'Plattensee', 'Shardara Bgeni': 'Schardara-Stausee', 'Bhumphol K. K. Nam': 'Bhumibol-Stausee'}
import re
LAKE_WORD = re.compile(r'(see\b|-see|stausee|talsperre|staudamm|damm|lake|lago|laguna|\blac\b|loch|lough|nuur|\bnur\b|\bhu\b|köli|järvi|jaure|vatten|vesi|sjön|\btso\b|\bco\b|yumco|reservoir|res\.|presa|embalse|meer|haff|bucht|ozero|osero|sagar|tsho)', re.I)
def lake_name(de, orig, lon, lat):
    """Seename: feste deutsche Korrekturen; in Nordamerika und Irland/Großbritannien fehlt dem deutschen Namen oft nur
    „Lake“/„Lough“ („Woods“ statt „Lake of the Woods“) – dort dann der Originalname"""
    if de in LAKE_DE: return LAKE_DE[de]
    english = (lon < -50 and lat > 15) or (-11 < lon < 2 and 49 < lat < 61)
    if english and de and not LAKE_WORD.search(de) and orig and re.search(r'\b(lake|lac|lough|loch)\b', orig, re.I): return orig
    return de or orig
def build(src, tol, poly):
    out = []
    for f in json.load(open(src))['features']:
        p, g = f['properties'], f['geometry']
        if not g: continue
        parts = [simp(l, tol, poly) for l in lines(g)]
        parts = [l for l in parts if len(l) >= (4 if poly else 2)]
        if not parts: continue
        if poly:
            n = lake_name((p.get('name_de') or '').strip(), (p.get('name') or '').strip(), parts[0][0][0], parts[0][0][1])
        else:
            n = (p.get('name') or '').strip()
            n = fix_river(DE.get(n, n), parts[0][0][0])
        out.append({'n': DE.get(n, n), 'r': p.get('scalerank', 9), 'c': parts})
    return out
def pack(items):
    """Linien als ganze Hundertstelgrad, ab dem 2. Punkt als Differenz: [x0,y0,dx1,dy1,…]"""
    out = []
    for it in items:
        parts = []
        for l in it['c']:
            px = py = 0; flat = []
            for i, (x, y) in enumerate(l):
                X, Y = round(x * 100), round(y * 100)
                if i == 0: flat += [X, Y]
                else: flat += [X - px, Y - py]
                px, py = X, Y
            parts.append(flat)
        out.append([it['n'], it['r'], parts])
    return out
if __name__ == '__main__':
    R = [x for x in build('ne_10m_rivers_lake_centerlines.geojson', 0.025, False) if x['r'] <= 8]
    L = [x for x in build('ne_10m_lakes.geojson', 0.019, True) if x['r'] <= 8]
    s = json.dumps({'v': 1, 'rivers': pack(R), 'lakes': pack(L)}, ensure_ascii=False, separators=(',', ':'))
    open('water.json', 'w').write(s)
    import gzip
    print('gepackt:', len(R), len(L), round(len(s.encode())/1024), 'KB', round(len(gzip.compress(s.encode()))/1024), 'KB gz')
