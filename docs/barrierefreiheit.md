# Barrierefreiheit auf kuin.at

Stand: 2026-09-23. Anlass: Feedback des Blindenverbands (Test mit JAWS 2026, Windows 11).

## Was die Seite für welche Beeinträchtigung bietet

| Beeinträchtigung | Angebot |
|---|---|
| Sehbehinderung | Textgröße (3 Stufen), hoher Kontrast, Hell/Dunkel/System |
| Lernschwierigkeiten | „Leicht Lesen" (Header-Schalter) |
| Legasthenie, Konzentration, Low Vision | **Lesehilfe**: mehr Buchstaben-, Wort- und Zeilenabstand (WCAG 1.4.12) |
| Vestibuläre Störungen, Epilepsie | „Bewegung reduzieren" (zusätzlich zur System-Einstellung) |
| Blind / Screenreader | Skip-Link „Zum Hauptinhalt springen", Landmarks, Alt-Texte, Kontakt im Footer |
| Tastatur / Motorik | Volle Tastaturbedienung, Esc schließt das Menü, sichtbarer Fokus |

Die Einstellungen (Menü „Anzeige anpassen" im Header) werden per Cookie gespeichert
(`kuin-font-size`, `kuin-contrast`, `kuin-reading-aid`, `kuin-reduce-motion`, `kuin-theme`, `kuin-leicht-lesen`)
und serverseitig als `data-*`-Attribute auf `<html>` gesetzt.

## Feedback Blindenverband und Umsetzung

- **Fokus landet im Barrierefreiheits-Menü:** Button heißt jetzt „Anzeige anpassen: Textgröße, Kontrast, Lesehilfe, Bewegung", Panel hat Erklärtext.
- **Struktur/Themenbereiche:** Skip-Link und Kontakt im Footer vorhanden. „Über uns" bleibt bewusst auch auf der Startseite (eigene Seite `/der-verein` existiert zusätzlich).
- **„Alt+text todo: Bild manuell beschreiben":** Migrations-Platzhalter war live sichtbar. Templates geben ihn nicht mehr aus (Logos → Name der Organisation, Fotos → Name, Blog-Cover → Titel).

## Erklärung zur Barrierefreiheit

Öffentliche Seite `/barrierefreiheit` (`src/pages/barrierefreiheit.astro`, statisch im Code), verlinkt aus Footer, A11y-Menü, Suche und Sitemap. Stand „teilweise konform“ (WCAG 2.1 AA, kein unabhängiges Audit). Bei neuen Funktionen dort nachziehen.

## Bereinigung Alt-Text-Platzhalter (2026-09-23, Live-DB `api.kuin.at/content.pod`)

Backup davor: `content.pod.bak-pre-alt-2026-09-23` (auf dem Server).

- `_media`: Platzhalter bei 192 Einträgen entfernt (Alt = NULL); Logo bekam „KUIN – Kultur Inklusiv“.
- Seiten `kuin`, `landing`, `social-proof`: `alt="[ALT-TEXT TODO …]"` → `alt=""` (22 Stellen).
- Archiv `3-spaziergang-2025`: 136 Bilder → „Foto vom KUIN-Spaziergang am 12. Jänner 2025“.
- Achtung: Das Archiv-Schema verlangt `alt_text` nicht leer. Leerer Alt-Text machte die Seite zu 404. Bei künftigen Bereinigungen im Archiv nie leer lassen.

## Offen

- Echte Einzelbeschreibungen der Archivfotos (optional) und inhaltlicher Bilder in Beiträgen (Redaktion, siehe Anleitung Abschnitt 6).
- Leere `alt=""` auf `kuin`, `landing`, `social-proof` prüfen: dekorativ oder beschreibungsbedürftig?
- Erneuter Test mit JAWS durch den Blindenverband; Antwort an den Verband.
