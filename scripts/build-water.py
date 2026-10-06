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
def build(src, tol, poly):
    out = []
    for f in json.load(open(src))['features']:
        p, g = f['properties'], f['geometry']
        if not g: continue
        parts = [simp(l, tol, poly) for l in lines(g)]
        parts = [l for l in parts if len(l) >= (4 if poly else 2)]
        if not parts: continue
        n = (p.get('name_de') or '').strip() if poly else ''
        n = n or (p.get('name') or '').strip()
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
