# Stempel – Übersicht

> Automatisch erzeugt aus dem Code (App-Version 1.28.9). Nicht von Hand ändern, sondern neu erzeugen: `node scripts/build-stempel-doc.mjs`.

## Inhalt

1. So funktioniert der Pass
2. Seltenheit der Stempel
3. Ränge
4. Weltwunder
5. Abzeichen
6. Alle 250 Länderstempel (nach Kontinent)
7. Stempel-Technik

## 1. So funktioniert der Pass

- Jedes bereiste Land bekommt im Reisepass einen **Stempel** mit Landesnamen, Einreisedatum (Monat.Jahr) und fortlaufender Nummer.
- Der Pass hat drei Reiter: **Stempel**, **Weltwunder**, **Abzeichen**. Er öffnet auf der Seite mit den neuesten Stempeln; neue Länder werden beim Öffnen nacheinander gestempelt.
- Jeder Stempel hat ein **eigenes Motiv** (Bauwerk, Tier oder Naturwunder), eine eigene Rahmenform und Stempelfarbe. Länder ohne feste Zuordnung bekommen Form und Farbe nach einem festen Zufall pro Länderkürzel (immer gleich).
- Stempel antippen öffnet die Länderseite. Das Teilen-Symbol erzeugt ein Bild (Pass-Umschlag oder Stempel-Collage) ohne Namen.

## 2. Seltenheit der Stempel

Jedes Land wird **einmal**, beim ersten Öffnen des Passes, ausgelost. Das Los gilt dauerhaft und auf allen Geräten (gespeichert im Konto, Spalte `special`; erstes Gerät gewinnt).

| Stufe | Chance | Aussehen | Bild |
|---|---|---|---|
| **Common** | 70 % | Normaler Stempel in Tinte, Rahmenform und Motiv des Landes | Motiv (Abschnitt 6, „Motiv“) |
| **Rare** | 20 % | Eingeklebte Briefmarke, gezähntes Papier, getöntes Bild, Länder-Nr. als Nennwert, Beschriftung RARE | Hochformat, eigenes Bild pro Land |
| **Epic** | 8 % | Breite Briefmarke (Querformat) mit metallischem **Silberrand**, schräg aufgeklebt mit Silberglanz, Beschriftung EPIC | Querbild, eigenes Bild pro Land |
| **Legendary** | 2 % | Prachtvolle Briefmarke mit **Goldrand**, schwebt beim Aufkleben, Goldschimmer und Funken, Beschriftung LEGENDARY | Hochformat, aufwendigste Szene pro Land |
| **Weltwunder** | Sondersammlung | Hologramm-Briefmarke mit Regenbogen-Schein, römische Ziffer I–VII, Beschriftung WELTWUNDER | siehe Abschnitt 4 |

Bei 250 Ländern ist im Schnitt etwa 50 Mal Rare, 20 Mal Epic und 5 Mal Legendary zu erwarten.
Alle Länder haben alle drei Sonderbilder (Rare, Epic, Legendary) – egal welche Stufe ausgelost wird, es gibt immer ein eigenes Bild.

**Weiteres:** Die Zeile über den Stempelseiten zeigt die Anzahl Rare / Epic / Legendary; antippen öffnet die Legende mit den vier Stufen (Beispiel Japan). Vorschau zum Ausprobieren: Adresse mit `?spezial` (alle Rare), `?spezial=epic`, `?spezial=legende`.

## 3. Ränge

Der Rang richtet sich nach der Zahl bereister Länder. Der letzte Rang braucht **alle** Länder der gewählten Länderliste (194–198, je nach Einstellung).

| ab Länder | Rang | Spruch |
|---:|---|---|
| 1 | 🌱 Fernweh | Der erste Stempel ist gesetzt – das Fernweh hat dich gepackt. |
| 3 | 🎟️ Grenzgänger | Drei Länder: Grenzen sind für dich nur Linien auf der Karte. |
| 5 | 🧭 Entdecker | Fünf Länder – jetzt beginnt das Entdecken erst richtig. |
| 10 | 🎒 Weltenbummler | Zweistellig! Dein Rucksack kennt schon einige Flughäfen. |
| 20 | ✈️ Vielflieger | Zwanzig Länder – du sammelst Bordkarten wie andere Briefmarken. |
| 30 | 🗺️ Kartograf | Deine Karte füllt sich: Du zeichnest deine eigene Welt. |
| 50 | 🌍 Globetrotter | Fünfzig Länder – ein Viertel der Welt trägt deinen Fußabdruck. |
| 75 | 🐪 Nomade | Zuhause ist für dich, wo der nächste Stempel wartet. |
| 100 | 💯 Club der 100 | Hundert Länder – willkommen in einem sehr kleinen Club. |
| 125 | ⛵ Weltumsegler | Du kennst mehr Länder als die meisten Menschen je sehen. |
| 150 | 🦅 Himmelsstürmer | Drei Viertel der Welt – der Rest wird knapp. |
| 175 | 🏆 Legende | Nur noch eine Handvoll Länder trennt dich vom Ziel. |
| alle | 👑 Weltmeister | Jedes Land der Erde. Du hast die ganze Welt gesehen. |

Der Pass-Umschlag ändert sein Aussehen in 8 Stufen (0 = noch kein Rang … 7 = Weltmeister; je zwei Ränge teilen sich eine Stufe). Rang-Aufstieg zeigt eine Feier-Karte.

## 4. Weltwunder

Eigene Seite im Pass mit den **neuen 7 Weltwundern** (Wahl von 2007). Ein „?“-Platz erscheint, sobald das Land bereist ist. Gesammelt wird per „Hier war ich“ – das Land allein reicht nicht. Sind alle 7 da, kommt eine Feier-Karte.

| Nr. | Weltwunder | Land | Ort |
|---|---|---|---|
| I | Chichén Itzá | Mexiko (MX) | Yucatán, Mexiko |
| II | Cristo Redentor | Brasilien (BR) | Rio de Janeiro, Brasilien |
| III | Machu Picchu | Peru (PE) | Anden, Peru |
| IV | Kolosseum | Italien (IT) | Rom, Italien |
| V | Petra | Jordanien (JO) | Wadi Musa, Jordanien |
| VI | Chinesische Mauer | China (CN) | Nordchina |
| VII | Taj Mahal | Indien (IN) | Agra, Indien |

## 5. Abzeichen

Sonderauszeichnungen auf der Visa-Seite im Pass, in bis zu drei Stufen **Bronze / Silber / Gold** (Abzeichen mit nur einer Stufe sind gleich Gold). Berechnet aus bereisten Ländern, Länderfakten und Einreisedaten. Eine neue Stufe löst eine Feier-Karte aus.

| Abzeichen | Gezählt wird | Stufen (Bronze / Silber / Gold) |
|---|---|---|
| 🌐 Sieben Kontinente | Kontinente | 3 / 5 / 7 |
| 🏝️ Inselhüpfer | Inselstaaten | 3 / 10 / 25 |
| 🏕️ Landratte | Länder ohne Meer | 3 / 10 / 25 |
| 🚗 Linksfahrer | Länder mit Linksverkehr | 3 / 10 / 25 |
| 💱 Devisenjongleur | Währungen | 5 / 15 / 40 |
| 🗣️ Sprachenbabel | Amtssprachen | 5 / 15 / 40 |
| 🏯 Zwergstaaten | Zwergstaaten Europas | 3 / 5 / 7 |
| 🐘 Giganten | der 10 größten Länder | 3 / 6 / 10 |
| 👥 Milliarden-Club | Menschen leben dort | 1 Mrd. / 3 Mrd. / 5 Mrd. |
| 📐 Landnahme | der Landfläche der Erde | 10 / 25 / 50 |
| 🌞 Äquatortaufe | Länder am Äquator | 1 / 3 / 6 |
| 🐧 Polarkreise | Länder an den Polarkreisen (mit Antarktis) | 1 / 4 / 8 |
| 🏔️ Dach der Welt | Länder mit Achttausender | 1 / 2 / 4 |
| 🧭 Vier Himmelsrichtungen | Erdviertel (Nord/Süd × Ost/West) | 2 / 3 / 4 |
| ⏰ Zeitreisender | Stunden Zeitunterschied | 6 / 12 / 18 |
| 🚀 Rekordjahr | neue Länder in einem Jahr | 3 / 5 / 10 |
| 📅 Jahr für Jahr | Jahre in Folge ein neues Land | 3 / 5 / 10 |
| 🏰 Alter Kontinent | Länder in Europa (¼ / ½ / alle) | ein Viertel / die Hälfte / alle Länder des Kontinents |
| 🐉 Seidenstraße | Länder in Asien (¼ / ½ / alle) | ein Viertel / die Hälfte / alle Länder des Kontinents |
| 🦁 Safari-Seele | Länder in Afrika (¼ / ½ / alle) | ein Viertel / die Hälfte / alle Länder des Kontinents |
| 🗽 Neue Welt | Länder in Nordamerika (¼ / ½ / alle) | ein Viertel / die Hälfte / alle Länder des Kontinents |
| 🦙 Kondorflug | Länder in Südamerika (¼ / ½ / alle) | ein Viertel / die Hälfte / alle Länder des Kontinents |
| 🌺 Südsee | Länder in Ozeanien (¼ / ½ / alle) | ein Viertel / die Hälfte / alle Länder des Kontinents |

## 6. Alle 250 Länderstempel

Spalten: **Stempelname** = Text im Stempel · **Form/Farbe** = Rahmen und Stempelfarbe · **Common** = Motiv des normalen Stempels · **Rare / Epic / Legendary** = Bild der jeweiligen Briefmarke.

### Europa (50)

| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Ålandinseln (AX) | Åland | Briefmarkenrand / Marine | Viermastbark Pommern im Hafen von Mariehamn | rotes Bootshaus und Bockwindmühle | Schären mit Segelbooten | Viermastbark Pommern im Abendrot |
| Albanien (AL) | Albanien | Bogen / Rot | Berat, Stadt der tausend Fenster | Berat, Stadt der tausend Fenster | Berat, mit Fluss und Brücke | mit Burg, Minarett und Bergen |
| Andorra (AD) | Andorra | Wappen / Blau | romanischer Kirchturm vor den Pyrenäen | Kirchturm vor den Pyrenäen | Tal mit Steinbrücke | mit Gämse, Tannen und Schnee |
| Belarus (BY) | Belarus | Kreis / Grün | Wisent im Urwald von Białowieża | Burg Mir | Urwald von Białowieża mit Wisenten | Burg Mir am See mit Störchen |
| Belgien (BE) | Belgien | Sechseck / Gold | Atomium | Atomium | Belfried von Brügge am Kanal | Grand-Place mit Blumenteppich |
| Bosnien und Herzegowina (BA) | BOSNIEN | Kerbe / Türkis | Alte Brücke von Mostar | Sebilj-Brunnen mit Tauben | Kravica-Wasserfälle | Alte Brücke von Mostar mit Brückenspringer |
| Bulgarien (BG) | Bulgarien | Briefmarkenrand / Rot | Rose aus dem Rosental | Alexander-Newski-Kathedrale | Rila-Kloster in den Bergen | Rosenernte im Rosental |
| Dänemark (DK) | Dänemark | Achteck / Rot | bunte Giebelhäuser in Nyhavn | Kleine Meerjungfrau | Nyhavn mit Booten | Wikingerschiff vor den Kreidefelsen von Møn |
| Deutschland (DE) | Deutschland | Bogen / Marine | Brandenburger Tor | Brandenburger Tor | Burg am Rhein mit Weinbergen | Neuschwanstein in der Winternacht |
| Estland (EE) | Estland | Bogen / Blau | Türme der Tallinner Altstadt | Tallinner Altstadt mit Olaikirche | Küste von Lahemaa mit Findlingen und Moorpfad | Weihnachtsmarkt in der Winternacht |
| Färöer (FO) | Färöer | Sechseck / Türkis | Wasserfall Múlafossur und Grasdachhäuser | Kirche mit Grasdach | Sørvágsvatn über den Klippen | Felsnadeln, Papageitaucher und Schafe |
| Finnland (FI) | Finnland | Kreis / Marine | Rentier unter dem Mond | Saunahütte am See | Tausend Seen mit Wäldern | Lappland: Rentier, Polarlicht und Glas-Iglu |
| Frankreich (FR) | Frankreich | Oval / Blau | Eiffelturm mit Herz | Eiffelturm | Paris an der Seine | Feuerwerk am 14. Juli |
| Griechenland (GR) | Griechenland | Kreis / Türkis | Tempel mit Säulen am Meer | Kapelle mit blauer Kuppel | Santorini-Klippe mit Windmühle | Sonnenuntergang über der Caldera |
| Großbritannien (GB) | GROẞBRITANNIEN | Oval / Marine | Big Ben | Big Ben und Doppeldeckerbus | Tower Bridge an der Themse | Stonehenge bei Sonnenaufgang |
| Guernsey (GG) | Guernsey | Achteck / Blau | Castle Cornet auf dem Felsen vor St. Peter Port | Little Chapel | Hafen von St. Peter Port mit Castle Cornet | Kuh auf der Klippe über dem Meer |
| Irland (IE) | Irland | Zickzack / Grün | Klippen von Moher und Kleeblatt | Klippen von Moher | grüne Hügel mit Steinmauern, Schafen und Rundturm | Klippen mit Leuchtturm, Regenbogen und Papageitauchern |
| Island (IS) | Island | Sechseck / Marine | Vulkan und Polarlicht | Kirkjufell unter Polarlicht | Kirkjufell mit Wasserfall und Kirche | Nachthimmel, Polarlicht-Vorhang, Papageitaucher |
| Isle of Man (IM) | Isle of Man | Wappen / Rot | Laxey Wheel | TT-Rennfahrer | Peel Castle auf der Insel | Laxey Wheel mit Manx-Katze |
| Italien (IT) | Italien | Briefmarkenrand / Grün | Kolosseum | Kolosseum | Rom mit Pinien | Toskana-Hügel, Zypressen, Vespa |
| Jersey (JE) | Jersey | Zackenkreis / Braun | Jersey-Kuh auf der Weide | Mont Orgueil über Gorey | Leuchtturm La Corbière mit Damm | La Corbière im Sonnenuntergang mit Gezeitenpools |
| Kosovo (XK) | Kosovo | Sechseck / Pflaume | Steinbrücke und Moschee in Prizren, Festung auf dem Hügel | Kloster Gračanica | Rugova-Schlucht | Prizren bei Nacht mit Brücke und Festung |
| Kroatien (HR) | Kroatien | Kreis / Blau | Segelboot an der Adria | Stadtmauer von Dubrovnik | Altstadt auf der Halbinsel | mit Hügeln, Booten und Möwen |
| Lettland (LV) | Lettland | Bogen / Pflaume | Schwarzhäupterhaus in Riga | Riga mit Petrikirche an der Daugava | Strand von Jūrmala mit Kiefern | Freiheitsdenkmal mit Blumen |
| Liechtenstein (LI) | Liechtenstein | Wappen / Marine | Schloss Vaduz über den Weinbergen | Schloss Vaduz über dem Rheintal | Rheintal mit Weinbergen vor den Alpen | Schloss im Abendlicht vor verschneiten Gipfeln |
| Litauen (LT) | Litauen | Zackenkreis / Rot | Wasserburg Trakai mit Spiegelung | Gediminas-Turm über Vilnius | Kurische Nehrung mit Elch | Burg Trakai mit Ballons im Abendrot |
| Luxemburg (LU) | Luxemburg | Briefmarkenrand / Blau | Adolphe-Brücke mit den Türmen der Kathedrale | Adolphe-Brücke | Altstadt auf den Felsen über dem Alzettetal | Burg Vianden im Herbst |
| Malta (MT) | Malta | Achteck / Türkis | Fischerboot Luzzu mit Auge | Luzzu im Hafen | Hafen von Valletta | mit Felsbogen und Möwen |
| Monaco (MC) | Monaco | Raute / Rot | Jacht vor dem Felsen | Jacht vor dem Felsen | Hafen und Casino | Formel-1-Wagen und Feuerwerk |
| Montenegro (ME) | Montenegro | Banner / Marine | Bucht von Kotor mit Inselkirche | Inselkirche | Bucht von Kotor | mit Altstadt und Festungsmauer |
| Niederlande (NL) | Niederlande | Etikett / Koralle | Windmühle und Tulpen | Windmühle und Tulpen | Amsterdamer Grachtenhäuser | Mühlen von Kinderdijk über Tulpenfeldern |
| Nordmazedonien (MK) | NORD-MAZEDONIEN | Wappen / Gold | Kirche Kaneo über dem Ohridsee | Fischerboot vor der Festung von Ohrid | Matka-Schlucht | Kirche Kaneo im Abendrot über dem See |
| Norwegen (NO) | Norwegen | Achteck / Marine | Wikingerschiff auf Wellen | Fjord mit Schiff | Lofoten mit roten Rorbuer | Preikestolen in der Mitternachtssonne |
| Österreich (AT) | Österreich | Achteck / Rot | Berge und Seilbahn | Kirche vor dem Großglockner | Hallstatt am See | Wien mit Riesenrad und Stephansdom |
| Polen (PL) | Polen | Zickzack / Rot | Storch auf dem Nest | Marienkirche in Krakau | Tatra mit dem Meerauge | Störche, Mohnfeld und Holzkirche |
| Portugal (PT) | Portugal | Kerbe / Blau | Straßenbahn | Straßenbahn am Hang | Lissabon am Tejo | mit Torre de Belém und Möwen |
| Republik Moldau (MD) | Moldau | Raute / Pflaume | Weinfass, Trauben und ein Glas Rotwein | Höhlenkloster Orheiul Vechi | Weinberge mit Kellereingang | Weinkeller mit Fässern und Kerzen |
| Rumänien (RO) | Rumänien | Wappen / Pflaume | Schloss Bran auf dem Felsen | bemaltes Kloster Voroneț | Transfăgărășan-Serpentinen | Schloss Bran bei Vollmond mit Fledermäusen |
| Russland (RU) | Russland | Dreieck / Rot | Basilius-Kathedrale | Peter-und-Paul-Kathedrale an der Newa | Transsib am Baikalsee | Kreml und Basilius-Kathedrale in der Winternacht |
| San Marino (SM) | San Marino | Banner / Pflaume | die drei Türme auf dem Monte Titano | Turm Guaita | drei Türme auf dem Monte Titano | mit Mauern, Fahnen und Ebene |
| Schweden (SE) | Schweden | Zackenkreis / Blau | Dalapferd | rotes Holzhaus am See | Gamla Stan in Stockholm | Mittsommer mit Maibaum |
| Schweiz (CH) | Schweiz | Wappen / Rot | Matterhorn und Kreuz | Matterhorn mit Spiegelung | Glacier Express auf dem Landwasserviadukt | Alm mit Chalet, Kühen und Edelweiß |
| Serbien (RS) | Serbien | Kreis / Koralle | Ćevapi mit Zwiebeln und Ajvar | Pobednik über der Festung Belgrad | Festung Golubac an der Donau | Tempel des Hl. Sava im Abendlicht |
| Slowakei (SK) | Slowakei | Achteck / Blau | Burg Bratislava über der Donau | Gipfel der Hohen Tatra mit Gämse | Zipser Burg | Bergsee mit Hütte, Gämsen und Edelweiß |
| Slowenien (SI) | Slowenien | Kreis / Grün | Bleder See mit Inselkirche | Triglav | Bleder See mit Burg, Inselkirche und Pletna | Drachenbrücke in Ljubljana mit Burg |
| Spanien (ES) | Spanien | Zackenkreis / Rot | Fächer und Sonne | Windmühlen der Mancha | Windmühlen mit Burg und Olivenhainen | Sonnenblumenfeld |
| Tschechien (CZ) | Tschechien | Etikett / Marine | Altstädter Brückenturm und Karlsbrücke | Prager Burg über der Moldau | Český Krumlov an der Flussschleife | Karlsbrücke und Burg bei Nacht |
| Ukraine (UA) | Ukraine | Briefmarkenrand / Gold | Sonnenblume über dem Weizenfeld | Höhlenkloster in Kyjiw | Holzkirche in den Karpaten | Tunnel der Liebe bei Klewan |
| Ungarn (HU) | Ungarn | Etikett / Grün | Parlament an der Donau | Fischerbastei | Kettenbrücke und Parlament an der Donau | Puszta mit Ziehbrunnen, Pferden und Paprika |
| Vatikanstadt (VA) | VATIKAN | Kreis / Gold | Kuppel des Petersdoms | Kuppel des Petersdoms | Petersplatz mit Kolonnaden | mit Schweizergarde und Tauben |

### Asien (52)

| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Afghanistan (AF) | Afghanistan | Bogen / Braun | Minarett von Dschām im Gebirgstal | Blaue Moschee von Masar-e Scharif | Seen von Band-e Amir | Felswand von Bamiyan mit Nischen, Pappeln im Tal (bisheriges Bild) |
| Armenien (AM) | Armenien | Bogen / Koralle | Kloster Chor Virap vor dem Ararat | Kloster Tatew am Felsen | Chor Virap vor dem Ararat | Tempel von Garni im Morgenlicht mit Granatäpfeln |
| Aserbaidschan (AZ) | Aserbaidschan | Banner / Türkis | Flame Towers in Baku | Jungfrauenturm in Baku | Flame Towers und Uferpromenade | Yanar Dağ und Flame Towers bei Nacht |
| Bahrain (BH) | Bahrain | Oval / Türkis | Perlmuschel mit Perle | Baum des Lebens in der Wüste | Skyline von Manama mit Dau | Perlentaucher zwischen Austern |
| Bangladesch (BD) | Bangladesch | Briefmarkenrand / Grün | Fahrradrikscha | Palast Ahsan Manzil | Segelboote auf dem Padma | Bengalischer Tiger in den Sundarbans |
| Bhutan (BT) | Bhutan | Briefmarkenrand / Pflaume | Kloster Tigernest an der Felswand | Punakha-Dzong am Zusammenfluss | Dochula-Pass mit Chörten und Takin | Tigernest über dem Paro-Tal, Gebetsfahnen, Himalaya-Gipfel (bisheriges Bild) |
| Britisches Territorium im Indischen Ozean (IO) | Chagos-Inseln | Kerbe / Blau | Meeresschildkröte über dem Riff | Palmendieb unter Kokospalmen auf Diego Garcia | Atoll-Lagune | Mantarochen über dem Riff |
| Brunei Darussalam (BN) | Brunei | Bogen / Gold | Omar-Ali-Saifuddien-Moschee in der Lagune mit Königsbarke | Wasserdorf Kampong Ayer | Moschee in der Lagune mit Königsbarke | Nasenaffe im Mangrovenwald |
| China (CN) | China | Etikett / Rot | Große Mauer | Himmelstempel | Karstberge am Li-Fluss mit Bambusfloß | Große Mauer im Morgenrot mit Panda im Bambus |
| Georgien (GE) | Georgien | Wappen / Rot | Gergeti-Kirche vor dem Kasbek | Festung Narikala über den Balkonen von Tiflis | Wehrtürme von Uschguli | Gergeti-Kirche unter dem Kasbek im Abendrot |
| Hongkong (HK) | Hongkong | Banner / Rot | Dschunke vor der Skyline | Doppelstock-Straßenbahn | Victoria Harbour mit Star Ferry | Skyline bei Nacht mit Dschunke |
| Indien (IN) | Indien | Rundrechteck / Pflaume | Taj Mahal | Hawa Mahal in Jaipur | Backwaters von Kerala mit Hausboot | Taj Mahal im Morgenlicht mit Pfau |
| Indonesien (ID) | Indonesien | Dreieck / Türkis | geteiltes Tempeltor (Bali) | Stupa von Borobudur | Reisterrassen auf Bali mit Tempel | Komodowaran vor dem Bromo im Morgenrot |
| Irak (IQ) | Irak | Dreieck / Gold | Spiralminarett von Samarra | Ischtar-Tor | Schilfhäuser in den Marschen | Zikkurat von Ur zwischen Dattelpalmen (bisheriges Bild) |
| Iran (IR) | Iran | Kreis / Rot | Granatäpfel | Asadi-Turm | Brücke Si-o-se-pol in Isfahan | Schah-Moschee in Isfahan, gespiegelt im Wasserbecken (bisheriges Bild) |
| Israel (IL) | Israel | Achteck / Blau | Zeitunglesen im Toten Meer | Masada am Toten Meer | Strand und Skyline von Tel Aviv | Ramon-Krater mit Steinböcken unter den Sternen |
| Japan (JP) | Japan | Zackenkreis / Koralle | Fuji mit Sonne | Fuji | Pagode, See und Kirschblüte | Torii im See, Kraniche, fallende Blüten |
| Jemen (YE) | Jemen | Achteck / Pflaume | Drachenblutbaum auf Sokotra | Bergdorf Al-Hadschara über Kaffeeterrassen | Sokotra mit Drachenblutbäumen | Lehmhochhäuser von Schibam vor der Wadi-Wand, Drachenblutbaum von Sokotra (bisheriges Bild) |
| Jordanien (JO) | Jordanien | Rundrechteck / Koralle | Schatzhaus von Petra | Wadi Rum mit Kamel | Kloster Ad-Deir in Petra | Schatzhaus von Petra bei Nacht mit Kerzen |
| Kambodscha (KH) | Kambodscha | Sechseck / Braun | Angkor Wat mit Spiegelung | Gesichterturm des Bayon | Pfahldorf am Tonle Sap | Angkor Wat bei Sonnenaufgang mit Mönchen und Lotus |
| Kasachstan (KZ) | Kasachstan | Raute / Gold | Bajterek-Turm in Astana | Tscharyn-Canyon | Steppe mit Adlerjäger und Jurten | Astana bei Nacht mit Bajterek und Khan Schatyr |
| Katar (QA) | Katar | Raute / Pflaume | Falke auf dem Sitzblock | Museum für Islamische Kunst | Skyline von Doha mit Dauen | Binnenmeer Khor al-Adaid mit Oryx und Falke |
| Kirgisistan (KG) | Kirgisistan | Achteck / Braun | Steinadler auf dem Arm des Jägers | Burana-Turm vor dem Tian Shan | Issyk-Kul mit Bergkette | Jurten am Bergsee Song-Köl, Reiter (bisheriges Bild) |
| Kuwait (KW) | Kuwait | Banner / Blau | Kuwait Towers am Golf | Befreiungsturm | Kuwait Towers am Golf | Kuwait Towers im Abendrot mit Dau und Möwen |
| Laos (LA) | Laos | Wappen / Gold | Goldene Stupa That Luang | Kuang-Si-Wasserfälle | Langboot auf dem Mekong vor Karstbergen | Mönche beim Almosengang vor dem Tempel Wat Xieng Thong in Luang Prabang (bisheriges Bild) |
| Libanon (LB) | Libanon | Raute / Grün | Zeder | Säulen von Baalbek | Hafen von Byblos | Zedern Gottes im Schnee |
| Macau (MO) | Macau | Sechseck / Gold | Pastéis de Nata | Ruine von São Paulo | Macau Tower und Lisboa an der Uferstraße | Senado-Platz mit Wellenpflaster und Laternen |
| Malaysia (MY) | Malaysia | Dreieck / Marine | Petronas Towers | Orang-Utan im Regenwald | Skyline von Kuala Lumpur | Kinabalu mit Rafflesia |
| Malediven (MV) | Malediven | Kreis / Türkis | Palmeninsel | Mantarochen unter Wasser | Atolle mit Wasserflugzeug | leuchtender Strand bei Nacht |
| Mongolei (MN) | Mongolei | Zickzack / Blau | Jurte und Pferd in der Steppe | Dschingis-Khan-Reiterstandbild | Gobi mit Trampeltieren | Adlerjäger zu Pferd, Jurte in der Steppe (bisheriges Bild) |
| Myanmar (MM) | Myanmar | Zackenkreis / Gold | Pagoden von Bagan | Shwedagon-Pagode | Einbeinruderer auf dem Inle-See | Tempel von Bagan mit Heißluftballons (bisheriges Bild) |
| Nepal (NP) | Nepal | Zackenkreis / Pflaume | Himalaya mit Gebetsfahnen | Stupa von Boudhanath | Everest mit Yaks auf dem Pfad | Annapurna im Morgenrot über dem Phewa-See |
| Nordkorea (KP) | Nordkorea | Rundrechteck / Marine | Kratersee auf dem Paektusan | Kumgang-Gebirge | Kuryong-Wasserfall im Diamantgebirge | Ryugyong-Hotel, Juche-Turm, Taedong-Fluss (bisheriges Bild) |
| Oman (OM) | Oman | Briefmarkenrand / Braun | Dau unter vollem Segel | Fort von Nizwa | Wadi Shab mit Palmen und Becken | Weihrauchbaum und Dau im Abendrot |
| Pakistan (PK) | Pakistan | Rundrechteck / Grün | bunt bemalter Lastwagen | Badshahi-Moschee in Lahore | K2 und Attabad-See | Hunza-Tal mit Aprikosenblüte vor dem Rakaposhi |
| Palästinensische Gebiete (PS) | Palästina | Kreis / Grün | Olivenzweig | Olivenernte | Hügel mit Olivenhainen und Steindorf | Olivenbaum, Tauben und Stickmuster |
| Philippinen (PH) | Philippinen | Zickzack / Türkis | Auslegerboot vor Karstfelsen | Jeepney | Chocolate Hills auf Bohol | Koboldmaki vor dem Vulkan Mayon |
| Saudi-Arabien (SA) | Saudi-Arabien | Bogen / Grün | Elefantenfelsen bei AlUla | Felsgrab von Hegra | AlUla mit dem Spiegelbau Maraya | Wüstennacht mit Karawane und Elefantenfelsen |
| Singapur (SG) | Singapur | Etikett / Türkis | Marina Bay Sands und Supertrees | Merlion | Skyline der Marina Bay | Gardens by the Bay bei Nacht |
| Sri Lanka (LK) | Sri Lanka | Kreis / Koralle | Stelzenfischer im Abendlicht | Löwenfelsen Sigiriya | Neun-Bögen-Brücke in den Teeplantagen | Kandy Perahera mit geschmücktem Elefanten |
| Südkorea (KR) | SÜDKOREA | Achteck / Blau | Palasttor Gwanghwamun | N Seoul Tower über der Stadt | Hanok-Dächer vor der Skyline | Seongsan Ilchulbong bei Sonnenaufgang mit Rapsblüte |
| Syrien (SY) | Syrien | Zickzack / Braun | Wasserräder (Norias) von Hama | Römisches Theater von Bosra | Krak des Chevaliers | Säulenstraße und Bogen von Palmyra in der Wüste (bisheriges Bild) |
| Tadschikistan (TJ) | Tadschikistan | Achteck / Türkis | Marco-Polo-Schaf im Pamir | Iskanderkul-See | Wachan-Tal am Pamir Highway | Pamir-Gebirge, Pamir Highway, Marco-Polo-Schaf (bisheriges Bild) |
| Taiwan (TW) | Taiwan | Dreieck / Koralle | Taipei 101 und Himmelslaternen | Pagode am Sonne-Mond-See | Teehäuser von Jiufen mit Laternen | Himmelslaternen über Pingxi |
| Thailand (TH) | Thailand | Dreieck / Gold | Tempeldächer | Wat Arun | schwimmender Markt | Yi-Peng-Laternen über dem Tempel mit Elefant |
| Timor-Leste (TL) | Timor-Leste | Briefmarkenrand / Koralle | Cristo Rei über der Bucht von Dili | Heiliges Haus (Uma Lulik) | Küste mit Fischerbooten vor den Bergen | Cristo-Rei-Statue auf der Landzunge vor Dili (bisheriges Bild) |
| Türkei (TR) | Türkei | Kreis / Koralle | Heißluftballons über Kappadokien | Hagia Sophia | Kalkterrassen von Pamukkale | Kappadokien bei Sonnenaufgang mit vielen Ballons |
| Turkmenistan (TM) | Turkmenistan | Raute / Rot | brennender Gaskrater von Darvaza | Achal-Tekkiner | Aschgabat in weißem Marmor | Gaskrater von Darvasa („Tor zur Hölle“) in der Wüstennacht (bisheriges Bild) |
| Usbekistan (UZ) | Usbekistan | Sechseck / Blau | Madrasa am Registan | Minarett Kalta Minor in Chiwa | Registan in Samarkand | Shah-i-Zinda mit Karawane und Granatäpfeln |
| Vereinigte Arabische Emirate (AE) | EMIRATE | Achteck / Gold | Burj Khalifa | Scheich-Zayid-Moschee | Skyline von Dubai mit Burj al Arab | Wüste mit Falke vor dem Burj Khalifa |
| Vietnam (VN) | Vietnam | Zackenkreis / Grün | Nón lá über Reisfeldern | Hội An mit Laternen | Halong-Bucht mit Dschunken | Reisterrassen bei Sa Pa mit Wasserbüffel |
| Zypern (CY) | Zypern | Raute / Koralle | Aphrodite-Felsen im Abendlicht | Aphrodite-Felsen | Küste im Abendlicht | Sonnenuntergang mit Gischt und Muschel |

### Afrika (56)

| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Ägypten (EG) | Ägypten | Dreieck / Gold | Pyramiden mit Sonne | Pyramiden von Gizeh | Karawane | Nil mit Feluken |
| Algerien (DZ) | Algerien | Bogen / Braun | Ghardaïa im M’zab-Tal | Felsbogen im Tassili n’Ajjer | Kasbah von Algier über der Bucht | Hoggar-Gebirge bei Sonnenaufgang mit Tuareg |
| Angola (AO) | Angola | Achteck / Rot | Riesen-Rappenantilope (Palanca Negra) | Miradouro da Lua | Bucht von Luanda | Wasserfälle von Kalandula (bisheriges Bild) |
| Äquatorialguinea (GQ) | Äquatorial-Guinea | Sechseck / Grün | Kapokbaum (Ceiba) | Kathedrale von Malabo | Kratersee im Moka-Tal | Pico Basilé auf Bioko, Meeresschildkröten am Strand von Ureca (bisheriges Bild) |
| Äthiopien (ET) | Äthiopien | Briefmarkenrand / Grün | Felsenkirche Bet Giyorgis in Lalibela | Dschelada im Simien-Gebirge | Schwefelquellen von Dallol | Felsenkirche Bete Giyorgis in Lalibela (in den Fels gehauen, kreuzförmig) (bisheriges Bild) |
| Benin (BJ) | Benin | Kerbe / Blau | Pfahlbauten von Ganvié auf dem Nokoué-See | Tor ohne Wiederkehr in Ouidah | Pfahldorf Ganvié | Elefanten am Wasserloch im Pendjari-Park |
| Botsuana (BW) | Botsuana | Raute / Braun | Mokoro im Okavango-Delta | Erdmännchen in der Kalahari | Okavango-Delta mit Elefanten und Mokoro | Salzpfanne von Makgadikgadi unter den Sternen |
| Burkina Faso (BF) | Burkina Faso | Zackenkreis / Braun | bemalte Lehmhäuser von Tiébélé | Felsnadeln von Sindou | Große Moschee von Bobo-Dioulasso | bemalte Lehmhäuser von Tiébélé (bisheriges Bild) |
| Burundi (BI) | Burundi | Kreis / Grün | königliche Trommler | Fischer mit Laternen auf dem Tanganjikasee | (Epic: Hügel mit Bananen und Ankole-Rindern) | königliche Trommler, Hügel und Bananenstauden (bisheriges Bild) |
| Cabo Verde (CV) | Cabo Verde | Zickzack / Blau | Vulkan Fogo mit Weinreben | grünes Tal auf Santo Antão | Hafen von Mindelo | Vulkan Fogo bei Nacht über den Weinreben |
| Côte d’Ivoire (CI) | Côte d’Ivoire | Bogen / Gold | Basilika von Yamoussoukro | Skyline von Abidjan an der Lagune | Kolonialhäuser von Grand-Bassam am Strand | Basilika von Yamoussoukro im Abendrot |
| Demokratische Republik Kongo (CD) | DR Kongo | Sechseck / Braun | Okapi im Regenwald | Lavasee des Nyiragongo | Flussschiff auf dem Kongo | Okapi im Regenwald mit Schmetterlingen |
| Dschibuti (DJ) | Dschibuti | Oval / Türkis | Kalkschlote am Lac Abbé mit Flamingo | Salzkristalle am Assalsee | Golf von Tadjoura mit Walhai und Dau | Kalkschlote am Lac Abbé, Flamingos (bisheriges Bild) |
| Eritrea (ER) | Eritrea | Etikett / Türkis | Fiat-Tagliero-Tankstelle in Asmara | Arkadenhäuser von Massawa | Dampfzug auf der Bergstrecke Asmara–Massawa | Fiat Tagliero in Asmara (Tankstelle mit Flugzeugflügeln) (bisheriges Bild) |
| Eswatini (SZ) | Eswatini | Kreis / Rot | Breitmaulnashorn im Hlane-Park | Sibebe-Felsen | Mlilwane mit Zebras und Bienenkorbhütten | Mantenga-Fälle und Dorf in der Abendsonne |
| Gabun (GA) | Gabun | Zickzack / Türkis | Surfende Flusspferde von Loango | Mandrill im Regenwald von Lopé | Kongou-Fälle am Ivindo | Waldelefant am Strand von Loango, Flusspferd in der Brandung (bisheriges Bild) |
| Gambia (GM) | Gambia | Banner / Grün | Krokodil am Flussufer | Arch 22 in Banjul | Flussmündung mit Mangroven, Vögeln und Fischerbooten | Gambia-Fluss mit Einbaum, Baobab, Krokodil (bisheriges Bild) |
| Ghana (GH) | Ghana | Zackenkreis / Gold | Kakaofrüchte am Stamm | Black Star Gate in Accra | Fischerboote vor Elmina | Hängebrücken im Regenwald von Kakum |
| Guinea (GN) | Guinea | Wappen / Koralle | Wasserfall „Brautschleier“ im Fouta Djallon | Strand der Îles de Los | Hochland Fouta Djallon mit Rindern und Hütten | Wasserfall „Brautschleier“ im Hochland Fouta Djallon (bisheriges Bild) |
| Guinea-Bissau (GW) | Guinea-Bissau | Briefmarkenrand / Rot | Cashewapfel mit Nuss | schlüpfende Meeresschildkröten auf Poilão | Mangrovenkanäle mit Piroge | Bijagós-Inseln – Mangroven, Flusspferd im Meer, Einbaum (bisheriges Bild) |
| Kamerun (CM) | Kamerun | Dreieck / Grün | Kamerunberg über Palmen und Meer | Felsnadeln von Rhumsiki | Lobé-Fälle ins Meer | Kamerunberg bei Sonnenaufgang über Teefeldern und dem Barombi-See |
| Kenia (KE) | Kenia | Zickzack / Braun | Giraffe unter der Schirmakazie | Giraffe und Akazie im Abendrot | Kilimandscharo und Elefanten | Ballon, Maasai, Flamingos |
| Komoren (KM) | Komoren | Zackenkreis / Türkis | Quastenflosser | Altstadt von Mutsamudu mit Minarett | Schildkrötenstrand auf Mohéli | Dau vor dem Vulkan Karthala, Halbmond (bisheriges Bild) |
| Lesotho (LS) | Lesotho | Banner / Blau | Basotho-Hut vor den Bergen | Maletsunyane-Fälle | Basotho-Reiter in den Bergen | Sani-Pass im Schnee mit Rundhütten |
| Liberia (LR) | Liberia | Kreis / Blau | Zwergflusspferd im Regenwald | Kautschukbaum mit Zapfschale | Fluss im Sapo-Nationalpark | Surfen bei Robertsport, Palmen am Strand (bisheriges Bild) |
| Libyen (LY) | Libyen | Bogen / Braun | Severusbogen in Leptis Magna | Gassen von Ghadames | Felsbögen und Felsbilder im Akakus | Oasensee von Ubari zwischen Sanddünen (bisheriges Bild) |
| Madagaskar (MG) | Madagaskar | Achteck / Braun | Allee der Baobabs | Katta | Allee der Baobabs im Abendrot | Tsingy mit Chamäleon |
| Malawi (MW) | Malawi | Kerbe / Blau | Buntbarsch im Malawisee | Teefelder am Mulanje-Massiv | Elefanten am Shire in Liwonde | Malawisee – Fischer im Einbaum, bunte Buntbarsche unter Wasser (bisheriges Bild) |
| Mali (ML) | Mali | Dreieck / Braun | Große Moschee von Djenné | Sankoré-Moschee in Timbuktu | Pirogen auf dem Niger vor den Bandiagara-Klippen | Große Moschee von Djenné aus Lehm (bisheriges Bild) |
| Marokko (MA) | Marokko | Achteck / Braun | Hufeisenbogen und Laterne | blaue Gasse in Chefchaouen | Kasbah Aït-Ben-Haddou mit Karawane | Djemaa el-Fna bei Nacht mit Koutoubia und Laternen |
| Mauretanien (MR) | Mauretanien | Rundrechteck / Rot | Erzzug durch die Sahara | Banc d’Arguin mit Flamingos und Lanche | Richat-Struktur, das Auge der Sahara | Erzzug durch die Sahara, einer der längsten Züge der Welt (bisheriges Bild) |
| Mauritius (MU) | Mauritius | Achteck / Pflaume | Dodo | Le Morne Brabant | Lagune mit Katamaran | Siebenfarbige Erde von Chamarel mit Wasserfall |
| Mosambik (MZ) | Mosambik | Oval / Blau | Walhai vor Tofo | Festung auf der Ilha de Moçambique | Strand von Tofo mit Mantarochen | Wanderdüne von Bazaruto, Dau, Walhai im klaren Wasser (bisheriges Bild) |
| Namibia (NA) | Namibia | Sechseck / Koralle | Deadvlei – tote Bäume vor roter Düne | Fish-River-Canyon | Dünen von Sossusvlei mit Oryx | Köcherbäume unter der Milchstraße |
| Niger (NE) | Niger | Sechseck / Gold | Lehmminarett der Großen Moschee von Agadez | Tuareg im Indigo-Turban mit Kamel | Giraffen von Kouré unter Akazien | Lehm-Minarett der Großen Moschee von Agadez, Tuareg mit Dromedar (bisheriges Bild) |
| Nigeria (NG) | Nigeria | Wappen / Grün | Zuma Rock | Skyline von Lagos an der Lagune | Obudu-Plateau mit Seilbahn | Durbar-Reiter in Kano |
| Republik Kongo (CG) | Kongo | Kreis / Pflaume | Graupapagei auf dem Ast | Basilika Sainte-Anne in Brazzaville | Stromschnellen des Kongo mit Piroge | Silberrücken-Gorilla im Regenwald von Odzala (bisheriges Bild) |
| Ruanda (RW) | Ruanda | Wappen / Grün | Berggorilla im Bambus | Teehügel | singende Fischer auf dem Kivusee | Berggorilla im Bambus und Nebel |
| Sambia (ZM) | Sambia | Achteck / Grün | Victoriafälle mit Regenbogen | Devil’s Pool an den Victoriafällen | Kanu auf dem Sambesi mit Flusspferden | Flughund-Wanderung von Kasanka in der Dämmerung |
| São Tomé und Príncipe (ST) | São Tomé | Dreieck / Grün | Pico Cão Grande über dem Regenwald | Kakaoplantage mit Pflanzerhaus | Äquatorlinie auf dem Ilhéu das Rolas | Felsnadel Pico Cão Grande über dem Regenwald (bisheriges Bild) |
| Senegal (SN) | Senegal | Etikett / Gold | bunte Pirogen am Strand | Lac Rose mit Salzsammlern | Insel Gorée mit bunten Häusern | Baobab im Abendrot mit Pirogen und Pelikanen |
| Seychellen (SC) | Seychellen | Banner / Türkis | Granitfelsen und Palme auf La Digue | Seychellennuss | Anse Source d’Argent | Riesenschildkröte am Strand im Abendrot |
| Sierra Leone (SL) | Sierra Leone | Zickzack / Grün | Schimpanse im Schutzgebiet Tacugama | Cotton Tree in Freetown | Strand von River No. 2 | Löwenberge über der Freetown-Halbinsel, Fischerboote am Strand (bisheriges Bild) |
| Simbabwe (ZW) | Simbabwe | Kerbe / Grün | Victoriafälle mit Regenbogen | Ruinen von Groß-Simbabwe | Victoriafälle mit Brücke und Regenbogen | Elefant auf den Hinterbeinen in Mana Pools |
| Somalia (SO) | Somalia | Achteck / Blau | Felsmalereien von Laas Geel | Kamele am Brunnen | Küste von Berbera mit Dauen | Felsbilder von Laas Geel, Dromedar und Akazie (bisheriges Bild) |
| St. Helena (SH) | St. Helena | Kerbe / Marine | Jacob’s Ladder über Jamestown | Riesenschildkröte vor dem Plantation House | Jamestown im Tal | Walhai im klaren Wasser mit Taucher |
| Südafrika (ZA) | Südafrika | Kerbe / Gold | Tafelberg | Pinguine am Boulders Beach | Big Five in der Savanne | Tafelberg im Abendrot mit Kapstadt und Protea |
| Sudan (SD) | Sudan | Briefmarkenrand / Gold | Pyramiden von Meroë | Tempel am Jebel Barkal | Nil mit Feluke, Dattelpalmen und Wüste | Pyramiden von Meroe in den Dünen (bisheriges Bild) |
| Südsudan (SS) | Südsudan | Etikett / Braun | Mundari-Rinder mit gewaltigen Hörnern | Einbaum zwischen Papyrus am Weißen Nil | Wanderung der Weißohr-Kobs | Rinderlager der Mundari mit Leierhörnern, Rauch im Abendlicht (bisheriges Bild) |
| Tansania (TZ) | Tansania | Achteck / Gold | Kilimandscharo und Elefant | Dau vor Sansibar | Gnuwanderung in der Serengeti | Ngorongoro-Krater mit Flamingosee, Löwen und Nashorn |
| Togo (TG) | Togo | Banner / Grün | Lehmburgen (Takienta) der Batammariba | Wasserfall bei Kpalimé | Togosee mit Pirogen | Batammariba-Land mit Takienta und Baobab im Abendlicht |
| Tschad (TD) | Tschad | Raute / Braun | Felsbogen von Aloba im Ennedi mit Karawane | Papyrusboote auf dem Tschadsee | Elefantenherde in Zakouma | Felsbogen von Aloba im Ennedi, Kamelkarawane (bisheriges Bild) |
| Tunesien (TN) | Tunesien | Rundrechteck / Blau | blaue Tür von Sidi Bou Said | Amphitheater von El Djem | Sidi Bou Said über dem Meer | Salzsee Chott el Djerid mit Oase und Luftspiegelung |
| Uganda (UG) | Uganda | Sechseck / Braun | Schuhschnabel im Papyrus | Murchison-Fälle | Bunyonyi-See mit Terrassenhügeln | baumkletternde Löwen von Ishasha |
| Westsahara (EH) | Westsahara | Rundrechteck / Gold | Nomadenzelt (Khaima) in den Dünen | Lagune von Dakhla mit Kitesurfer | Dünen am Atlantik mit Fischerbooten | Wüstennacht mit Zelt und Kamel |
| Zentralafrikanische Republik (CF) | Zentralafrika | Briefmarkenrand / Grün | Waldelefant auf der Lichtung Dzanga Bai | Wasserfälle von Boali | Pirogen auf dem Ubangi | Waldelefanten auf der Lichtung Dzanga Bai (bisheriges Bild) |

### Nordamerika (38)

| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Amerikanische Jungferninseln (VI) | Amerik. Jungferninseln | Briefmarkenrand / Gold | Windmühlenruine der Annaberg-Plantage | Trunk Bay mit Inselchen | Hafen von Charlotte Amalie | Unterwasserpfad am Buck Island |
| Anguilla (AI) | Anguilla | Kreis / Rot | Langusten-Fang | Strandbar an der Shoal Bay | Sandy Island | Lagerfeuer am Strand unter Sternen |
| Antigua und Barbuda (AG) | Antigua & Barbuda | Briefmarkenrand / Koralle | Regatta der Sailing Week | Nelson’s Dockyard | Blick von Shirley Heights auf English Harbour | Regatta im Abendrot |
| Aruba (AW) | Aruba | Zackenkreis / Türkis | Divi-Divi-Baum am Strand | California Lighthouse | Eagle Beach mit Divi-Divi-Bäumen | Flamingo-Strand im Abendrot |
| Bahamas (BS) | Bahamas | Briefmarkenrand / Koralle | Flamingo im flachen Wasser | schwimmende Schweine | Sandbänke der Exumas | Flamingoschwarm im Abendrot |
| Barbados (BB) | Barbados | Zackenkreis / Blau | Fliegender Fisch | Felsen von Bathsheba | Hafen von Bridgetown | Crop-Over-Tänzerin |
| Belize (BZ) | Belize | Kreis / Türkis | Great Blue Hole im Riff | Maya-Tempel Xunantunich | Caye Caulker mit Palmen und Booten | Jaguar im Regenwald |
| Bermuda (BM) | Bermuda | Bogen / Türkis | Mondtor aus weißem Stein mit Blick aufs Meer und Longtail-Vogel | Leuchtturm Gibbs Hill | Horseshoe Bay mit rosa Sand | Crystal Caves mit Tropfsteinen |
| Britische Jungferninseln (VG) | Brit. Jungferninseln | Wappen / Türkis | Granitfelsen der Baths auf Virgin Gorda | Ruine der Kupfermine auf Virgin Gorda | White Bay auf Jost Van Dyke | die Baths im Abendrot |
| Costa Rica (CR) | Costa Rica | Achteck / Grün | Faultier am Ast | Vulkan Arenal | Hängebrücke im Nebelwald von Monteverde | Rotaugenlaubfrosch |
| Curaçao (CW) | Curaçao | Briefmarkenrand / Koralle | bunte Giebelhäuser in Willemstad | Königin-Emma-Pontonbrücke | Klein Curaçao mit Leuchtturm | Willemstad bei Nacht |
| Dominica (DM) | Dominica | Zickzack / Grün | Trafalgar-Zwillingsfälle im Regenwald | Boiling Lake | Champagne Reef vor Scotts Head | Sisserou-Papagei im Regenwald |
| Dominikanische Republik (DO) | Dominikanische Republik | Wappen / Blau | Buckelwal vor Samaná unter Palmen | Alcázar de Colón in Santo Domingo | Palmenstrand von Punta Cana | Buckelwale vor Samaná |
| El Salvador (SV) | El Salvador | Zickzack / Blau | Surfer vor dem Vulkan Izalco | Kratersee des Santa Ana | Ruta de las Flores mit Kaffee und Blumen | Surfer bei El Tunco im Abendrot |
| Grenada (GD) | Grenada | Sechseck / Rot | Muskatnuss mit rotem Samenmantel | Hafen Carenage in St. George’s | Grand Anse Beach | Unterwasser-Skulpturenpark |
| Grönland (GL) | Grönland | Zackenkreis / Türkis | Eisberg mit Kajak | Eisberge im Fjord mit Walflosse | bunte Häuser von Ilulissat | Hundeschlitten unter dem Polarlicht |
| Guatemala (GT) | Guatemala | Dreieck / Grün | Maya-Tempel von Tikal | Atitlán-See mit Vulkanen | Arco de Santa Catalina in Antigua vor dem Vulkan Agua | Tikal über dem Regenwald im Morgenrot |
| Haiti (HT) | Haiti | Achteck / Marine | Zitadelle Laferrière auf dem Berg | Palastruine Sans-Souci | Küste von Labadee | bunter Tap-Tap-Bus vor der Zitadelle |
| Honduras (HN) | Honduras | Wappen / Blau | Hellroter Ara vor den Stufen von Copán | Maya-Stele in Copán | Riff vor Roatán mit Taucher | Aras über Copán |
| Jamaika (JM) | Jamaika | Banner / Grün | Kolibri „Doctor Bird" an der Blüte | Dunn’s River Falls | Kaffeehänge der Blue Mountains | Klippenspringer von Negril im Sonnenuntergang |
| Kaimaninseln (KY) | Kaimaninseln | Briefmarkenrand / Türkis | Stachelrochen in Stingray City | Seven Mile Beach | Stingray City mit Schnorchlern | Blauer Leguan |
| Kanada (CA) | Kanada | Etikett / Rot | Ahornblatt | Moraine Lake mit Kanu | Niagarafälle | Herbstwald mit Elch und Kanu im Abendrot |
| Kuba (CU) | Kuba | Kerbe / Rot | Oldtimer unter Palmen | Mogoten im Tal von Viñales mit Tabakbauer | Malecón in Havanna | Oldtimer vor bunten Kolonialfassaden in Havanna (bisheriges Bild) |
| Mexiko (MX) | Mexiko | Zickzack / Grün | Kaktus und Sonne | Pyramide von Chichén Itzá | Cenote mit Schwimmer | Día de Muertos mit Calavera, Studentenblumen und Kerzen |
| Montserrat (MS) | Montserrat | Dreieck / Grün | Soufrière Hills und die verschüttete Stadt Plymouth | Rendezvous Bay | verschüttete Stadt Plymouth unter der Asche | Vulkanausbruch bei Nacht |
| Nicaragua (NI) | Nicaragua | Kreis / Blau | Doppelvulkan Ometepe im Nicaraguasee | gelbe Kathedrale von Granada | Doppelvulkan Ometepe | Lavasee des Masaya bei Nacht |
| Panama (PA) | Panama | Etikett / Blau | Frachter in der Kanalschleuse | Skyline von Panama-Stadt | San-Blas-Inseln | Brücke der Amerikas mit Schiff im Abendrot |
| Puerto Rico (PR) | Puerto Rico | Bogen / Marine | Wachhäuschen (Garita) von El Morro | bunte Gasse in Old San Juan | Wasserfall im Regenwald El Yunque | Biolumineszenz-Bucht mit Kajak bei Nacht |
| Sint Maarten (SX) | Sint Maarten | Oval / Koralle | Flugzeug im Tiefflug über Maho Beach | Gerichtsgebäude in Philipsburg | Flugzeug über Maho Beach | Great Bay bei Nacht mit Kreuzfahrtschiffen |
| St. Barthélemy (BL) | St. Barthélemy | Etikett / Koralle | rote Dächer über dem Hafen von Gustavia | Shell Beach | Jachthafen von Gustavia | Silvesterfeuerwerk über dem Hafen |
| St. Kitts und Nevis (KN) | St. Kitts & Nevis | Kerbe / Grün | Zuckerrohrbahn vor dem Mount Liamuiga | Festung Brimstone Hill | Nevis Peak über dem Strand | grüne Meerkatze im Abendlicht über Nevis |
| St. Lucia (LC) | St. Lucia | Banner / Grün | die Pitons im Abendlicht | Fort auf Pigeon Island | Pitons über dem Sugar Beach | Pitons im Abendrot mit Jacht |
| St. Martin (MF) | St. Martin | Banner / Blau | Fort Louis über der Bucht von Marigot | Orient Bay | Markt und Fort Louis in Marigot | Blick vom Pic Paradis im Abendrot |
| St. Pierre und Miquelon (PM) | St. Pierre | Etikett / Marine | bunte Holzhäuser und Leuchtturm | Kirche auf der Île-aux-Marins | Hafen mit Fischerbooten | Eisberg und Wale im Abendlicht |
| St. Vincent und die Grenadinen (VC) | St. Vincent | Bogen / Grün | Brotfrucht aus dem Botanischen Garten | Meeresschildkröte in den Tobago Cays | Inselkette der Grenadinen mit Jachten | Kratersee der Soufrière |
| Trinidad und Tobago (TT) | Trinidad & Tobago | Briefmarkenrand / Rot | Steeldrum | Maracas Bay | Karnevalsumzug mit Steelband | Scharlachsichler im Caroni-Sumpf im Abendrot |
| Turks- und Caicosinseln (TC) | Turks & Caicos | Sechseck / Koralle | Fechterschnecke (Queen Conch) | Grace Bay | Chalk Sound mit türkisen Inselchen | Turk’s-Head-Kaktus, Flamingo und Fechterschnecke im Abendrot |
| Vereinigte Staaten (US) | USA | Etikett / Blau | Skyline mit Empire State Building | Freiheitsstatue | Grand Canyon | Golden Gate Bridge im Abendnebel |

### Südamerika (14)

| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Argentinien (AR) | Argentinien | Achteck / Blau | Fitz Roy und Kondor | Perito-Moreno-Gletscher | Iguazú-Fälle | Tango in La Boca bei Nacht |
| Bolivien (BO) | Bolivien | Sechseck / Türkis | Salzsee von Uyuni mit Spiegelung | Schilfboot auf dem Titicacasee | Salar de Uyuni mit Spiegelung | Laguna Colorada mit Flamingos vor dem Vulkan |
| Brasilien (BR) | Brasilien | Oval / Grün | Christusstatue und Zuckerhut | Tukan am Amazonas | Copacabana mit Zuckerhut | Karneval in Rio mit Christusstatue |
| Chile (CL) | Chile | Zackenkreis / Marine | Moai der Osterinsel | Torres del Paine | Atacama mit ALMA-Teleskopen unter der Milchstraße | Moai von Ahu Tongariki bei Sonnenaufgang |
| Ecuador (EC) | Ecuador | Achteck / Grün | Galápagos-Riesenschildkröte | Cotopaxi | Galápagos mit Blaufußtölpeln und Seelöwen | Meerechse, Riesenschildkröte und Fregattvogel im Abendlicht |
| Falklandinseln (FK) | FALKLAND | Rundrechteck / Marine | Felsenpinguin | Walknochenbogen vor der Kathedrale von Stanley | Eselspinguin-Kolonie | Albatrosse an den Klippen |
| Guyana (GY) | Guyana | Etikett / Grün | Kaieteur-Fälle stürzen vom Tafelberg in die Schlucht | Holzkathedrale St. George in Georgetown | Kaieteur-Fälle | Riesenseerosen mit Hoatzin |
| Kolumbien (CO) | Kolumbien | Oval / Gold | Wachspalmen im Cocora-Tal | Kolonialbalkone in Cartagena | Caño Cristales, der Fluss der fünf Farben | Kaffeeregion mit Willys-Jeep, Wachspalmen und Kolibri |
| Paraguay (PY) | Paraguay | Zackenkreis / Rot | Ñandutí-Spitze | Jesuitenreduktion Trinidad | Chaco mit Jabirus | Ñandutí-Spitze mit paraguayischer Harfe |
| Peru (PE) | Peru | Sechseck / Pflaume | Lama vor Machu Picchu | Machu Picchu | Machu mit Anden, Ruinen und Lama | Inti-Sonne, Kondore, Wolken im Tal |
| Südgeorgien und die Südlichen Sandwichinseln (GS) | Südgeorgien | Sechseck / Marine | Königspinguine vor den Bergen | Kirche und Walfangstation von Grytviken | Königspinguin-Kolonie in der St Andrews Bay | See-Elefanten vor dem Gletscher |
| Suriname (SR) | Suriname | Oval / Blau | Blauer Pfeilgiftfrosch auf dem Blatt | Holzkathedrale von Paramaribo | Fluss im Regenwald mit Kanu | Pfeilgiftfrosch in der Bromelie, Aras im Regenwald |
| Uruguay (UY) | Uruguay | Banner / Blau | Mate-Becher mit Bombilla und Thermoskanne | Skulptur „Los Dedos“ in Punta del Este | Leuchtturm von Colonia del Sacramento | Gaucho beim Asado im Abendrot |
| Venezuela (VE) | Venezuela | Wappen / Türkis | Salto Ángel am Tafelberg | Strand von Los Roques mit Pelikan | Llanos mit Wasserschweinen und Scharlachsichlern | Salto Ángel, der höchste Wasserfall der Welt, vom Tafelberg (bisheriges Bild) |

### Ozeanien (24)

| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Amerikanisch-Samoa (AS) | Amerikanisch-Samoa | Achteck / Türkis | Felsinsel Pola vor Vatia | Flughund im Regenwald | Strand auf Ofu | Flughunde in der Dämmerung über der Bucht von Pago Pago |
| Australien (AU) | Australien | Kerbe / Türkis | Opernhaus Sydney mit Sternen | Opernhaus Sydney | Uluru | Great Barrier Reef mit Schildkröte und Clownfischen |
| Cookinseln (CK) | Cookinseln | Wappen / Grün | geschnitzter Gott Tangaroa | One Foot Island in der Lagune von Aitutaki | Gipfel von Rarotonga über der Lagune | Riesenmuschel und Auslegerkanu im Abendrot |
| Fidschi (FJ) | Fidschi | Kreis / Pflaume | Hibiskusblüte | Bure am Strand | Yasawa-Inseln | Feuerläufer von Beqa bei Nacht |
| Französisch-Polynesien (PF) | POLYNESIEN | Etikett / Türkis | Wasserbungalows vor dem Otemanu | Auslegerkanu-Rennen | Lagune von Bora Bora | Schwarze Perle und Tiare-Blüte |
| Guam (GU) | Guam | Banner / Koralle | Latte-Steine | Klippe der zwei Liebenden | Bucht von Tumon | Latte-Steine im Abendrot mit Flughund |
| Kiribati (KI) | Kiribati | Zackenkreis / Rot | Fregattvogel über der Sonne im Meer | Versammlungshaus (Maneaba) auf Tarawa | Lagune von Tarawa mit Kanus | erste Sonne der Welt über dem Pazifik, Fregattvogel (wie auf der Flagge) (bisheriges Bild) |
| Marshallinseln (MH) | Marshallinseln | Sechseck / Marine | Stabkarte der Seefahrer | Atoll Majuro von oben | Kanurennen mit Krebsscherensegeln | Auslegerkanu mit Krebsscherensegel, Riffinseln (bisheriges Bild) |
| Mikronesien (FM) | Mikronesien | Kreis / Braun | Steingeld (Rai) auf Yap | Basaltruinen von Nan Madol | Wracktauchen in der Chuuk-Lagune | Steingeld (Rai) auf Yap unter Palmen (bisheriges Bild) |
| Nauru (NR) | Nauru | Zickzack / Blau | Kalksteinzinnen an der Küste | Buada-Lagune zwischen Palmen | Strand der Anibare-Bucht | Kalkstein-Zinnen am Anibare-Strand, Fregattvogel (bisheriges Bild) |
| Neukaledonien (NC) | Neukaledonien | Bogen / Rot | Kanak-Hütte mit Firstspitze | Kulturzentrum Tjibaou | Herz von Voh in der Lagune | Isle of Pines mit Araukarien und Auslegersegel |
| Neuseeland (NZ) | NEUSEELAND | Sechseck / Grün | Silberfarn | Mitre Peak im Milford Sound | Aoraki/Mount Cook mit Lupinen | Kiwi in der Glühwürmchenhöhle |
| Niue (NU) | Niue | Oval / Türkis | Felsbögen von Talava | Buckelwal-Mutter mit Kalb | Matapa-Schlucht | Felsbogen im Abendrot mit Delfinen |
| Nördliche Marianen (MP) | Nördl. Marianen | Etikett / Braun | Palmendieb (Kokosnusskrabbe) | Bird Island | Insel Managaha | Grotte mit Taucher und Lichtstrahl |
| Norfolkinsel (NF) | Norfolkinsel | Dreieck / Grün | Norfolk-Tanne | georgianische Gebäude in Kingston | Klippen mit Norfolk-Tannen | Maskentölpel bei Sonnenuntergang |
| Palau (PW) | Palau | Kreis / Türkis | Quallensee zwischen den Felseninseln | Milky-Way-Lagune mit weißem Schlamm | Blue Corner mit Haien | Pilzförmige Felseninseln im türkisen Wasser, Kajak (bisheriges Bild) |
| Papua-Neuguinea (PG) | PAPUA-NEUGUINEA | Bogen / Gold | Paradiesvogel | Geisterhaus am Sepik | Regenwaldflüsse mit Einbaum | Paradiesvogel mit Schmuckfedern im Regenwald (bisheriges Bild) |
| Pitcairninseln (PN) | Pitcairninseln | Kerbe / Marine | Anker der Bounty vor der Insel | Bounty-Beiboot in der Bounty Bay | Adamstown am Hang | die Bounty unter Segeln im Abendrot |
| Salomonen (SB) | Salomonen | Briefmarkenrand / Braun | Kriegskanu (Tomoko) mit hohem Bug | Pfahlhaus in der Marovo-Lagune | Riffinseln mit Delfinen | Kriegskanu (Tomoko) mit hohem Bug und Heck (bisheriges Bild) |
| Samoa (WS) | Samoa | Achteck / Grün | To Sua Ocean Trench mit Holzleiter | offenes Fale | Strand von Lalomanu mit Fales | Feuermesser-Tänzer bei Nacht |
| Tonga (TO) | Tonga | Sechseck / Rot | Trilithon Haʻamonga ʻa Maui | Blaslöcher von Houma | Inseln von Vava’u mit Jachten | Buckelwal springt, Trilithon Ha'amonga am Ufer (bisheriges Bild) |
| Tuvalu (TV) | Tuvalu | Kreis / Blau | Atoll Funafuti von oben | Pandanus und Kokospalmen mit Kanu | Lagune von Funafuti von oben | Atoll – Palmenstrand, Lagune mit Auslegerkanu, Riffinsel am Horizont (bisheriges Bild) |
| Vanuatu (VU) | Vanuatu | Zickzack / Grün | Lianenspringer auf Pentecost | Unterwasser-Briefkasten | Blue Hole auf Espiritu Santo mit Seilschaukel | Vulkan Yasur und Turmspringer von Pentecost (bisheriges Bild) |
| Wallis und Futuna (WF) | Wallis und Futuna | Wappen / Rot | Kathedrale von Mata-Utu | Kratersee Lalolalo | Küste von Futuna | Festungsruine Talietumu im Abendrot |

### Antarktis (3)

| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Antarktis (AQ) | Antarktis | Zickzack / Marine | Kaiserpinguine auf dem Eis | Tafeleisberg mit Wal | Kaiserpinguin-Kolonie | Polarlicht über Eisbergen und Pinguinen |
| Französische Süd- und Antarktisgebiete (TF) | Franz. Süd-Gebiete | Briefmarkenrand / Blau | See-Elefant auf Kerguelen | Felsbogen von Kerguelen | Königspinguine auf den Crozetinseln | Albatros über den Klippen im Abendrot |
| Heard und McDonaldinseln (HM) | Heard-Insel | Sechseck / Türkis | Vulkan Mawson Peak über den Gletschern | See-Elefanten am Strand | Gletscher und Vulkan | Ausbruch des Big Ben bei Nacht mit Polarlicht |

### Ohne Kontinent (13)

| Land | Stempelname | Form / Farbe | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Amerikanische Überseeinseln (UM) | US-Überseeinseln | Briefmarkenrand / Marine | Laysan-Albatros auf Midway | Albatros-Küken auf Midway | Lagune des Palmyra-Atolls | Mönchsrobbe am Strand im Abendrot |
| Bonaire, Sint Eustatius und Saba (BQ) | Bonaire | Briefmarkenrand / Pflaume | Salzberge an den rosa Salinen | Flamingos in den Salinen | Riff vor Klein Bonaire | Salzberge im Abendrot mit Flamingos |
| Bouvetinsel (BV) | Bouvetinsel | Sechseck / Marine | vergletscherte Vulkaninsel im Südpolarmeer | Robbenkolonie am Strand | vergletscherte Insel | Polarlicht über der Bouvetinsel |
| Französisch-Guayana (GF) | Franz.-Guayana | Etikett / Grün | Raketenstart in Kourou | Lederschildkröte am Strand | Startplatz in Kourou | Raketenstart bei Nacht |
| Gibraltar (GI) | Gibraltar | Kerbe / Braun | Berberaffe vor dem Felsen | der Felsen | der mit Schiff und Berberaffe | mit Leuchtturm und Delfinen |
| Guadeloupe (GP) | Guadeloupe | Kreis / Rot | Pointe des Châteaux mit dem Kreuz | Carbet-Wasserfälle | Vulkan Soufrière über Bananenfeldern | Bucht von Les Saintes im Abendrot |
| Kokosinseln (CC) | Kokosinseln | Zackenkreis / Türkis | Palme über der Lagune mit Einsiedlerkrebs | Einsiedlerkrebs am Strand | Lagune mit Kitesurfern | Suppenschildkröte unter Wasser |
| Martinique (MQ) | Martinique | Dreieck / Türkis | Rocher du Diamant vor der Küste, dahinter die Montagne Pelée | Montagne Pelée | Strand Les Salines | Rocher du Diamant im Abendrot mit Segelbooten |
| Mayotte (YT) | Mayotte | Oval / Pflaume | Maki in der Lagune | Ylang-Ylang-Blüten | Doppellagune mit Schildkröte | Buckelwal springt in der Lagune |
| Réunion (RE) | Réunion | Dreieck / Koralle | Lava des Piton de la Fournaise und Tropikvogel | Talkessel des Piton des Neiges | Ausbruch des Piton de la Fournaise | Cirque de Mafate mit Wolken, Wanderern und Tropikvogel |
| Spitzbergen und Jan Mayen (SJ) | Spitzbergen | Achteck / Marine | Eisbär auf der Scholle | Walross auf der Scholle | bunte Häuser von Longyearbyen | Eisbärin mit Jungem unter dem Polarlicht |
| Tokelau (TK) | Tokelau | Zickzack / Blau | Auslegerkanu im Sonnenuntergang | Atollhaus unter Palmen | Lagune des Atolls von oben | Fliegende-Fische-Fang mit Fackeln bei Nacht |
| Weihnachtsinsel (CX) | Weihnachtsinsel | Kreis / Rot | Wanderung der Roten Krabben | Blaslöcher an der Küste | Wanderung der Roten Krabben über die Straße | Palmendieb und Goldener Tropikvogel |

## 7. Stempel-Technik (Kurzfassung)

- `src/lib/passport.ts`: Ränge, Stempel-Rahmen (15 Formen), Motive (`MOTIFS`), Farben/Formen je Land (`DEFS`), Kurznamen (`SHORT`), Weltwunder-Briefmarke.
- `src/lib/scenes.ts` (groß, wird nachgeladen): Bilder `TIERED` (Rare + Legendary, Hochformat 180 × 170), `WIDE` (Epic, Querformat 270 × 130), `WONDER` (Weltwunder), `SCENES` (53 ältere Bilder, die als Legendary dienen).
- `src/lib/special.svelte.ts`: Auslosung und Chancen. `src/lib/wonders.ts`: Weltwunder. `src/lib/badges.ts`: Abzeichen.
- Bildecke oben links (x < 48, y < 34) bleibt frei für die Länder-Nr.
- Aufkleb-Animation je Stufe in `src/lib/markfx.ts`.
