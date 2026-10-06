#!/usr/bin/env python3
"""Erzeugt src/lib/data/entry.json: Einreise für Deutsche – Reisewarnungen, Dokumente, Visum.

Quelle: Auswärtiges Amt, OpenData-Schnittstelle (https://www.auswaertiges-amt.de/opendata/travelwarning).
Läuft täglich im Build (GitHub Actions), damit Reisewarnungen und Dokumente immer aktuell sind.

- Reisewarnung/Teilreisewarnung, Stand und Link kommen direkt aus der Schnittstelle.
- Personalausweis/Reisepass werden aus der festen Liste „Reisedokumente“ jeder Länderseite gelesen.
- Die Visum-Einordnung (visumfrei, ETA, bei Ankunft, E-Visum, Visum vorab …) ist von Hand geprüft
  (scripts/entry-curated.json) – zusammen mit einem Fingerabdruck der Abschnitte „Reisedokumente“ und „Visum“.
  Ändert das Auswärtige Amt diese Abschnitte, passt der Fingerabdruck nicht mehr: dann zeigt die App statt der
  Einordnung den ersten Satz des Amts zum Visum und den Hinweis, dass sich die Regeln geändert haben.
  Neu einordnen: Datei prüfen/anpassen, dann `python3 scripts/build-entry.py --accept` (übernimmt die Fingerabdrücke).

Aufruf: python3 scripts/build-entry.py [--accept] [--cache VERZEICHNIS]
Schlägt der Abruf fehl, bleibt die vorhandene entry.json unverändert (der Build läuft trotzdem durch).
"""
import hashlib, html, json, os, re, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CURATED = os.path.join(ROOT, 'scripts', 'entry-curated.json')
OUT = os.path.join(ROOT, 'src', 'lib', 'data', 'entry.json')
API = 'https://www.auswaertiges-amt.de/opendata/travelwarning'
UA = {'User-Agent': 'Freiheit-App-Datenaufbereitung/1.0'}


def get(url, cache=None):
    if cache:
        p = os.path.join(cache, re.sub(r'\W', '_', url) + '.json')
        if os.path.exists(p):
            return json.load(open(p))
    for t in range(4):
        try:
            d = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())
            if cache:
                json.dump(d, open(p, 'w'))
            return d
        except Exception:
            if t == 3:
                raise
            time.sleep(2 + 3 * t)


def text(h):
    h = re.sub(r'<br\s*/?>', ' ', h)
    h = re.sub(r'</(p|li|div|ul|ol)>', '\n', h)
    h = re.sub(r'<[^>]+>', '', h)
    return '\n'.join(re.sub(r'\s+', ' ', l).strip() for l in html.unescape(h).split('\n') if l.strip())


def blocks(content):
    """Seite in Abschnitte zerlegen: [(Überschrift, Text)] – Überschriften h2–h4, beliebig ausgezeichnet"""
    parts = re.split(r'(<h[2-4][^>]*>.*?</h[2-4]>)', content, flags=re.S)
    out, head = [], ''
    for p in parts:
        if re.match(r'<h[2-4]', p):
            head = text(p)
        elif head:
            out.append((head, text(p)))
    return out


def block(bs, prefix):
    for h, t in bs:
        if h.lower().startswith(prefix.lower()):
            return t
    return ''


def doc_note(t, name):
    """Einschränkung im Wortlaut des Amts, z. B. „mit ESTA oder Visum“ (bei „Ja, aber siehe Anmerkungen“ leer)"""
    m = re.search(r'^' + name + r'\s*:\s*ja[,.;:]?\s*(.*)$', t, re.M | re.I)
    v = (m.group(1).strip().rstrip('.') if m else '')
    v = re.sub(r'^(aber\s+)?(siehe|s\.)\s+.*$', '', v, flags=re.I).strip()
    return v[0].lower() + v[1:] if v else ''


def doc(t, name):
    """'y' ja, 'r' ja mit Einschränkungen, 'n' nein, None unbekannt"""
    m = re.search(r'^' + name + r'\s*:\s*(.+)$', t, re.M | re.I)
    if not m:
        return None
    v = m.group(1).strip().lower()
    if v.startswith('nein'):  # „Nein, Ausnahme: Gibraltar“ gilt für das Land selbst als Nein
        return 'n'
    if v.startswith('ja'):
        return 'y' if re.fullmatch(r'ja\.?', v) else 'r'
    return None


def sig(*ts):
    return hashlib.sha1('|'.join(re.sub(r'\s+', ' ', t).strip() for t in ts).encode()).hexdigest()[:10]


def first_sentence(t):
    """erster aussagekräftiger Satz zum Visum (ohne Verweise wie „Siehe Aktuelles“)"""
    for line in t.split('\n'):
        if re.match(r'(siehe|bitte beachten)', line, re.I) or len(line) < 25:
            continue
        s = re.split(r'(?<=[.!?])\s+(?=[A-ZÄÖÜ])', line)[0]
        return s if len(s) <= 260 else s[:257].rsplit(' ', 1)[0] + ' …'
    return ''


def main():
    accept = '--accept' in sys.argv
    cache = sys.argv[sys.argv.index('--cache') + 1] if '--cache' in sys.argv else None
    if cache:
        os.makedirs(cache, exist_ok=True)
    cur = json.load(open(CURATED))
    try:
        lst = get(API, cache)['response']
        pages = {}
        for cid, v in lst.items():
            if isinstance(v, dict) and v.get('countryCode'):
                pages[v['countryCode']] = (cid, v, get(f'{API}/{cid}', cache)['response'][cid]['content'])
                if not cache:
                    time.sleep(0.25)
    except Exception as e:
        print('Abruf fehlgeschlagen, entry.json bleibt unverändert:', e)
        return
    out, changed = {}, []
    for code, c in cur.items():
        e = {'k': c['k']}
        for f in ('d', 'n', 'u', 'wt', 'link'):
            if f in c:
                e[f] = c[f]
        src = pages.get(c.get('p', code))
        if src:
            cid, meta, content = src
            bs = blocks(content)
            e['id'] = int(cid)
            e['lm'] = time.strftime('%Y-%m-%d', time.gmtime(meta['lastModified']))
            e['w'] = 2 if meta.get('warning') else 1 if meta.get('partialWarning') else 0
            first = ''
            if 'p' in c:  # Gebiet: Dokumente fest hinterlegt, Fingerabdruck über die Abschnitte des Mutterlands
                if c.get('pa'):
                    e['pa'] = c['pa']
                    e['rp'] = 'y'
                s = sig(*(block(bs, h) for h in c['hb']))
                e['par'] = c['p']
            else:
                rd, vi = block(bs, 'Reisedokumente'), block(bs, 'Visum')
                pa, rp = doc(rd, 'Personalausweis'), doc(rd, 'Reisepass')
                if pa:
                    e['pa'] = pa
                if rp:
                    e['rp'] = rp
                for f, name, v in (('pat', 'Personalausweis', pa), ('rpt', 'Reisepass', rp)):
                    if v == 'r' and doc_note(rd, name):
                        e[f] = doc_note(rd, name)
                s = sig(rd, vi)
                if vi:
                    first = first_sentence(vi)
            if accept:
                c['sig'] = s
            elif c.get('sig') != s:
                e['chg'] = True  # Regeln geändert: App zeigt den Satz des Amts statt der (alten) Einordnung
                if first:
                    e['s'] = first
                changed.append(code)
        if c.get('pat') and e.get('pa') == 'r':  # von Hand formulierte Einschränkung (z. B. Ägypten: Passfotos)
            e['pat'] = c['pat']
        out[code] = e
    if accept:
        json.dump(cur, open(CURATED, 'w'), ensure_ascii=False, indent=0)
    json.dump({'date': time.strftime('%Y-%m-%d'), 'c': out}, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(out), 'Einträge,', round(os.path.getsize(OUT) / 1024, 1), 'KB; geänderte Regeln seit Prüfung:', ', '.join(changed) or 'keine')


if __name__ == '__main__':
    main()
