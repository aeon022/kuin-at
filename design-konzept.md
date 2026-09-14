# 🎨 Design-Konzept: KUIN – Kultur Inklusiv (kuin.at)

## 1. Visuelle Philosophie: Playful Minimalism
Inklusion wird hier nicht als medizinisches "Pflaster" verstanden, sondern als universelles, hochwertiges Design. Wir kombinieren die Strenge der Barrierefreiheit (WCAG 2.1 AAA) mit organischer Wärme und klassischer japanischer Reduktion.

*   **Ma (間) – Die Macht des leeren Raums:** Layouts atmen. Elemente werden nicht durch harte Linien oder unruhige Drop-Shadows getrennt, sondern durch großzügigen Whitespace.
*   **Organische Geometrie:** Keine aggressiven 90-Grad-Kanten, aber auch keine unruhigen "Blob"-Formen. Konsistente, weiche Rundungen (`rounded-2xl` in Tailwind) für Cards und Modals machen das UI greifbar und menschlich.
*   **Mikro-Interaktionen:** Buttons und Links reagieren beim Hover nicht stumpf, sondern mit einem weichen, federnden Lift (`hover:-translate-y-1 transition-transform`), was dem UI eine leise Verspieltheit verleiht.

## 2. Farbpalette (Das Kuin-Magenta System)
Die Farbwelt baut auf dem originalen Kuin-Magenta auf, adaptiert für kompromisslose Barrierefreiheit und kombiniert mit augenschonenden, natürlichen Tönen.

| Rolle | Tailwind-Variable | Hex-Code | Beschreibung / Einsatz |
| :--- | :--- | :--- | :--- |
| **Hintergrund** | `--color-washi` | `#faf9f5` | Warmes Off-White. Schont die Augen, lässt das Magenta extrem leuchten. |
| **Text** | `--color-sumi` | `#1c1c1c` | Tiefes Anthrazit. Bietet AAA-Kontrast, ist weicher und lesbarer als `#000000`. |
| **Primäre Marke** | `--color-kuin-magenta` | `[Original-Hex]` | Das energetische Magenta aus dem alten Design. Klares Erkennungsmerkmal. |
| **Interaktion** | `--color-magenta-dark` | `[Dunkleres Magenta]`| Abgedunkeltes Magenta für Hover-States, um strenge WCAG-Kontraste zu sichern. |
| **Leicht Lesen BG** | `--color-magenta-soft` | `[Zartes Rosa/Magenta]`| Extrem heller, sanfter Hintergrund für vereinfachte Textblöcke. |
| **Erfolg/Info** | `--color-matcha` | `#8a9a5b` | Ein erdiges Grün für Barrierefreiheits-Tags (z. B. "ÖGS", "Rollstuhlgerecht"). |

## 3. Der Typografie-Shift (Aktive Inklusion)
Das Design nutzt Typografie als dynamisches Inklusions-Werkzeug. Der Wechsel zwischen den Modi morpht fließend (Astro View Transitions).

### Standard-Modus (Kulturell & Elegant)
*   **Überschriften:** *Playfair Display* (oder vergleichbare Serif). Bringt eine literarische, anspruchsvolle Ästhetik.
*   **Fließtext:** *Inter*. Klar, neutral, perfekt lesbar.
*   **Layout:** Zeilenlänge max `65ch` (`max-w-prose`), um Augenermüdung zu verhindern.

### Leicht-Lesen-Modus (Maximal Utilitaristisch)
*   **Gesamte Typografie:** Wechselt auf *Atkinson Hyperlegible* (speziell entwickelt für Menschen mit Sehschwäche).
*   **Metriken:** Zeilenabstand (Leading) erhöht sich auf `1.75` bis `2.0`. Font-Size wird um mindestens 15% skaliert.
*   **Visuelle Anker:** Wichtige Textblöcke erhalten einen kräftigen Magenta-Balken am linken Rand (`border-l-8 border-kuin-magenta`), der das Auge sicher durch die Struktur führt.

## 4. Interaktionsdesign: Die "atmende" UI
Wenn User Inklusions-Features aktivieren, reduziert die Website aktiv den visuellen Lärm ("No Bloat").

*   **Der Fade-Out (Kanso):** Wird "Leicht Lesen" aktiviert, faden komplexe oder rein dekorative UI-Elemente (kleine Datums-Badges, Sekundärmenüs) weich aus (`duration-700`). Der Raum klärt sich und fokussiert 100% auf den vereinfachten Inhalt.
*   **Taktiles Fokus-Management:** Navigation per Tab-Taste fühlt sich sicher an. Jedes interaktive Element erhält einen massiven Fokus-Ring: 
    `focus-visible:ring-4 focus-visible:ring-kuin-magenta focus-visible:outline-none focus-visible:ring-offset-4 focus-visible:ring-offset-washi`.

## 5. Kernkomponenten

### A. Der Kuroko (Command Palette)
Anstatt die Hauptnavigation mit Dropdowns zu überladen, lagern wir komplexe Aktionen in die Command Palette aus (`/` oder `⌘K`). Inspiriert von den unsichtbaren Bühnenarbeitern (Kuroko) im Kabuki-Theater.
*   **Optik:** Starker Blur (`backdrop-blur-md`) überlagert die Seite. Das Magenta-Suchfeld fokussiert die Aufmerksamkeit.
*   **Typografie:** Riesiges Suchfeld (`text-4xl`), verzeiht Tippfehler durch Fuzzy-Search (Orbiter-Daten).
*   **Quick Actions:** Bietet Aktionen wie `> Leicht Lesen aktivieren` oder `> Nächster Walk -> Route planen` direkt an.

### B. Event-Cards (Der Walk)
*   Keine harten Container-Borders. Die Cards heben sich durch subtile Hintergrund-Shifts (z.B. von `washi` auf pures Weiß) und weiche Radien ab.
*   Barrierefreiheits-Features (ÖGS, Rollstuhl) sind immer als klare, pillenförmige Tags in der `--color-matcha` Farbe sofort sichtbar.

## 6. Technische Tailwind v4 Implementierung (Snippet)
Damit der AI-Agent sofort starten kann, hier das Grundgerüst für die `@theme`-Direktive im CSS:

```css
@import "tailwindcss";

@theme {
  --color-washi: #faf9f5;
  --color-sumi-900: #1c1c1c;
  --color-sumi-600: #4a4a4a;
  
  /* Kuin Magenta (Werte aus import-source extrahieren/anpassen) */
  --color-kuin-magenta: #e3006b; /* Beispiel-Wert, mit Original ersetzen */
  --color-magenta-dark: #b30054; /* Für Hover/AAA Kontrast auf Washi */
  --color-magenta-soft: #fde8f0; /* Für Leicht-Lesen Highlight BG */
  
  --color-matcha: #8a9a5b;

  --font-serif: "Playfair Display", serif;
  --font-sans: "Inter", sans-serif;
  --font-ll: "Atkinson Hyperlegible", sans-serif;
}
