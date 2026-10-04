# Freiheit – by Maier Reisen

Persönliche Reise-App zum Sammeln von bereisten Ländern und Wunschzielen. Geplant: Reisen, Flüge, Flughäfen und Kostenübersicht.

SvelteKit · TypeScript · Tailwind CSS · PWA (vite-plugin-pwa) · statisch gebaut mit adapter-static, gehostet auf GitHub Pages unter `/Freiheit`.

## Entwicklung

Voraussetzung: Node.js 22 (siehe `.nvmrc`).

```bash
npm install
npm run dev       # http://localhost:5173 (ohne Base-Path)
npm run check     # Typprüfung
npm run build     # statischer Build nach build/ mit Base-Path /Freiheit
npm run preview   # Build ansehen unter http://localhost:4173/Freiheit/
npm run icons     # PWA-Icons aus static/icon.svg neu erzeugen
```

## Struktur

| Pfad | Inhalt |
| --- | --- |
| `src/lib/data/` | Weltkarte (TopoJSON 50m), ISO-Numerisch → Alpha-2, Kontinente |
| `src/lib/countries.ts` | Ländernamen (deutsch), Flaggen, Kontinente |
| `src/lib/atlas.svelte.ts` | Daten-Store (localStorage), Änderungen, JSON-Export/-Import |
| `src/lib/app.svelte.ts` | UI-Zustand: Tabs, Sheets, Vollbild-Karte, Hash-Navigation, Toast |
| `src/lib/map/` | Canvas-Weltkarte (Globus und flache Karte), Detailstufen |
| `src/lib/components/` | Svelte-Komponenten der Oberfläche |
| `src/app.css` | Design (Farben, Typografie, Komponenten-Styles) |

## Daten

Die Daten liegen vorerst nur im Browser (localStorage, Schlüssel `freiheit-state-v2`). Über „Mehr“ lassen sie sich als JSON exportieren und importieren.

## Deployment

`.github/workflows/deploy.yml` baut bei jedem Push auf `main` und veröffentlicht auf GitHub Pages. Dafür muss in den Repository-Einstellungen unter *Settings → Pages → Build and deployment* die Quelle **GitHub Actions** gewählt sein.
