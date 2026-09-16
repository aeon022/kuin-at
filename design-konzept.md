# 🎨 Design-Konzept: KUIN – Kultur Inklusiv (kuin.at)

## 1. STRICT AGENT INSTRUCTIONS (ANTI-HALLUZINATION)
- **Design-Vorlagen (Mockup first):** Du darfst KEIN EIGENES DESIGN und KEINE EIGENEN LAYOUTS erfinden. Richte dich zu 100% nach dem übergebenen HTML-Mockup. Jede Abweichung ist ein Fehler.
- **Tailwind v4 Zwang:** Die Nutzung einer `tailwind.config.js` ist strikt verboten. Alle Theme-Erweiterungen müssen über die `@theme` Direktive in der CSS-Datei erfolgen.
- **Komponenten-Treue:** Keine HTML-Tags ändern, keine Tailwind-Klassen weglassen, keine künstlichen Wrapper-`<div>`s hinzufügen.

## 2. Visuelle Philosophie: Playful Minimalism
Inklusion wird hier nicht als medizinisches "Pflaster" verstanden, sondern als universelles, hochwertiges Design.
*   **Ma (間):** Layouts atmen. Elemente werden durch großzügigen Whitespace getrennt, nicht durch harte Linien.
*   **Organische Geometrie:** Konsistente, weiche Rundungen (`rounded-[3rem]`) für Cards und Modals machen das UI greifbar.
*   **Mikro-Interaktionen:** Buttons und Links reagieren mit einem weichen, federnden Lift (`hover:-translate-y-1 transition-transform`).

## 3. Farbpalette (Das Kuin-Magenta System)

| Rolle | Tailwind-Variable | Hex-Code | Beschreibung |
| :--- | :--- | :--- | :--- |
| **Hintergrund** | `--color-washi` | `#faf9f5` | Warmes Off-White. Schont die Augen. |
| **Text** | `--color-sumi-900` | `#1c1c1c` | Tiefes Anthrazit für AAA-Kontrast. |
| **Primäre Marke** | `--color-kuin-magenta` | `#e3006b` | Das energetische Original-Magenta. |
| **Interaktion** | `--color-kuin-dark` | `#b30054`| Abgedunkeltes Magenta für Hover-States. |
| **Leicht Lesen BG** | `--color-kuin-soft` | `#fde8f0`| Sanfter Hintergrund für vereinfachte Texte. |
| **Erfolg/Info** | `--color-matcha-900` | `#4a542e` | Erdiges Grün für Barrierefreiheits-Tags. |

## 4. Der Typografie-Shift (Aktive Inklusion)
Der Wechsel zwischen den Modi morpht fließend via Astro View Transitions.

*   **Standard-Modus:** Überschriften in *Playfair Display* (literarisch, elegant). Fließtext in *Inter* (neutral, lesbar). Zeilenlänge max `65ch`.
*   **Leicht-Lesen-Modus:** Gesamte Typografie wechselt auf *Atkinson Hyperlegible*. Zeilenabstand erhöht sich (`leading-[1.8]`), Text wird visuell mit einem Magenta-Balken (`border-l-8 border-kuin-magenta`) geankert.

## 5. Technische Tailwind v4 Implementierung

```css
@import "tailwindcss";

@theme {
  --color-washi: #faf9f5;
  --color-sumi-900: #1c1c1c;
  --color-sumi-600: #4a4a4a;
  --color-sumi-400: #858585;
  --color-sumi-200: #cccccc;
  --color-sumi-100: #e6e6e6;
  
  --color-kuin-magenta: #e3006b;
  --color-kuin-dark: #b30054;
  --color-kuin-soft: #fde8f0;
  
  --color-matcha-900: #4a542e;
  --color-matcha-700: #6b7a43;
  --color-matcha-100: #eef1e6;

  --font-serif: "Playfair Display", serif;
  --font-sans: "Inter", sans-serif;
  --font-ll: "Atkinson Hyperlegible", sans-serif;
}
