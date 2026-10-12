---
name: release
description: Fertig machen und veröffentlichen – prüfen, Version hochzählen, Übersichten neu erzeugen, nur eigene Dateien committen, pushen, Deployment abwarten und Patrick melden, wann er am Handy testen kann. Nur auf Wunsch (/release).
---

Veröffentlicht die fertigen Änderungen dieser Sitzung auf `main`. Antworten auf Deutsch, kurz.

1. `git status` ansehen. Nur Dateien, die DIESE Sitzung geändert hat, kommen in den Commit (fremde Änderungen paralleler Sitzungen nie anfassen, nie `git add -A`/`commit -a`). Unklar, wem eine Datei gehört → Patrick kurz fragen.
2. `npm run check` (0 Fehler nötig) und `npm run build` – beides muss laufen, sonst stoppen und Fehler melden.
3. Version in `package.json` hochzählen: PATCH = Fehlerkorrektur/Daten/Texte, MINOR = neue Funktion (PATCH 0), MAJOR = Umbau. Letzte Version aus `git log` beachten.
4. Wurden Stempel, Bilder, Chancen, Ränge oder Abzeichen geändert: `node scripts/build-stempel-doc.mjs` und `node scripts/build-stempel-galerie.mjs`, Ergebnis (`docs/`) mit committen.
5. Wurde `scripts/build-entry.py` geändert: nach dem Push zusätzlich `gh workflow run deploy.yml`.
6. Commit-Nachricht im Stil der bisherigen: `Version X.Y.Z (kurze deutsche Beschreibung, was sich für Patrick ändert)`; Dateien einzeln mit Namen hinzufügen.
7. `git push`, dann einmal `gh run watch <id> --exit-status` (nicht pollen; id per `gh run list --limit 1`).
8. Melden: „Jetzt live (Version X.Y.Z), du kannst am Handy testen“ – oder bei Fehler Ursache nennen. Zusätzlich eine Handy-Meldung per Werkzeug `PushNotification` (status `proactive`, eine Zeile, z. B. „Freiheit 1.41.0 ist live – am Handy testen“ bzw. „Deployment fehlgeschlagen: <Ursache>“); ist Patrick gerade im Fenster, wird sie automatisch übersprungen. Scheitert nur der deploy-Job mit Timeout/„Deployment cancelled“: `gh workflow run deploy.yml --ref main`.
