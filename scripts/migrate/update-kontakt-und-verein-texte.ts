// One-off: replace the raw, un-cleaned WP dumps on /kontakt and /der-verein
// with the client-provided rewrite (2026-09) — de-duplicated (the Oxygen
// export left literal "READ MORE" / repeated "Netzwerk KUIN" placeholder
// text in content_standard), Du-form throughout, plus real
// content_leicht_lesen (neither page had one before). Facts unchanged from
// the verified real source (founding dates, Projektkonzept wording); the
// real phone number from the WP export (missing in the client's draft) is
// kept rather than dropped.
import { openPod } from '@a83/orbiter-core';

const db = openPod('./content.pod');

const kontakt = db.getEntry('pages', 'kontakt');
if (kontakt) {
  db.updateEntry('pages', 'kontakt', {
    data: {
      ...kontakt.data,
      content_standard:
        '<p>Du hast Fragen oder möchtest uns unterstützen? Schreib uns gerne eine E-Mail an: ' +
        '<a href="mailto:office@kuin.at">office@kuin.at</a></p>' +
        '<h2>Telefon</h2><p>Tel.: +43 676 84 52 78 80 7</p>' +
        '<h2>Adresse</h2><p>Conrad-von-Hötzendorf-Straße 37a<br>8010 Graz</p>' +
        '<h2>Bürozeiten</h2><p>Nach Vereinbarung.</p>',
      content_leicht_lesen:
        '<p>Hast du eine Frage? Willst du uns schreiben?<br>' +
        'Unsere E-Mail ist: <a href="mailto:office@kuin.at">office@kuin.at</a></p>' +
        '<p><strong>Telefon:</strong> +43 676 84 52 78 80 7</p>' +
        '<p><strong>Unsere Adresse ist:</strong><br>Conrad-von-Hötzendorf-Straße 37a<br>8010 Graz</p>' +
        '<p>Du musst vorher einen Termin mit uns ausmachen.</p>',
    },
  });
  console.log('updated pages/kontakt');
} else {
  console.log('pages/kontakt not found, skipped');
}

const verein = db.getEntry('pages', 'der-verein');
if (verein) {
  db.updateEntry('pages', 'der-verein', {
    data: {
      ...verein.data,
      content_standard:
        '<h2>Das Netzwerk KUIN</h2>' +
        '<p>Kultur Inklusiv ist ein Netzwerk von Kultur- und Sozialeinrichtungen sowie Menschen mit Beeinträchtigung in Graz. ' +
        'Das Projekt startete im Grazer Kulturjahr 2020 durch die Akademie Graz, das InTaKT-Festival und die Kunstuniversität Graz. ' +
        'Im Dezember 2023 haben wir unsere Arbeit offiziell als Verein formiert.</p>' +
        '<p>Wir haben uns zum Ziel gesetzt, Kulturerlebnisse für alle zugänglich zu machen, Barrieren abzubauen und Menschen zusammenzubringen. ' +
        'Dabei öffnen wir Kulturinstitutionen gezielt für Menschen mit Beeinträchtigungen.</p>' +
        '<h2>Unser Projektkonzept &amp; Kernziele</h2>' +
        '<p>„Kultur Inklusiv" basiert auf der Überzeugung, dass Kultur durch die Begegnung und den Austausch von Menschen entsteht. ' +
        'Wir verstehen Inklusion als soziale Selbstverständlichkeit: Menschen mit und ohne Behinderungen sollen gemeinsam und gleichberechtigt ' +
        'an Kulturveranstaltungen teilnehmen und diese gestalten. Dieses wechselseitige Lernen fördert das kulturelle Schaffen und bereichert die Gesellschaft.</p>' +
        '<p>Inklusion ist für uns kein Sonderprojekt, sondern zentraler Bestandteil jedes kulturellen Angebots. Dafür fördern wir Kunstschaffende, ' +
        'entwickeln barrierefreie Formate und schulen Kulturvermittler:innen, damit Inhalte verständlich und zugänglich gestaltet werden.</p>',
      content_leicht_lesen:
        '<p>Wir sind ein Verein in Graz. Bei uns arbeiten Einrichtungen für Kultur und Soziales zusammen. ' +
        'Auch Menschen mit Behinderungen sind dabei. Den Verein gibt es seit dem Jahr 2023.</p>' +
        '<p>Wir wollen, dass alle Menschen Kultur erleben können. Hindernisse sollen weg. Wir bringen Menschen zusammen. ' +
        'Museen und Theater sollen für alle offen sein.</p>' +
        '<p>Kultur entsteht, wenn Menschen sich treffen. Wir finden: Menschen mit und ohne Behinderungen sollen zusammen Kultur machen. ' +
        'Das ist ganz normal. Wir lernen voneinander. Das macht das Leben für alle reicher.</p>' +
        '<p>Inklusion ist keine Ausnahme. Sie muss immer und überall dabei sein. Wir helfen dabei, dass Kunst für alle gut zu verstehen ist.</p>',
    },
  });
  console.log('updated pages/der-verein');
} else {
  console.log('pages/der-verein not found, skipped');
}

db.close();
