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

## Offen

- Platzhalter `[ALT-TEXT TODO …]` steht noch in der DB (`_media`, 192 von 208 Einträgen) und in den Inhalten der Seiten `kuin`, `landing`, `social-proof` sowie im Archiv-Eintrag `3-spaziergang-2025`. Bereinigung per SQL auf der Live-DB, nach Rücksprache.
- Echte Alt-Texte für inhaltliche Bilder (Redaktion, siehe Anleitung Abschnitt 6).
- Erneuter Test mit JAWS durch den Blindenverband.
