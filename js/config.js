/**
 * ============================================================================
 * PERSONAL_CONFIG – ZENTRALE KONFIGURATION FÜR DEIN JUBILÄUMSSPIEL
 * ============================================================================
 */

const PERSONAL_CONFIG = {

    // ------------------------------------------------------------------------
    // WELT 1: DIE SCHWEBENDE WIESEN-OASE (Blumen-Schiebepuzzle & Hologramm)
    // ------------------------------------------------------------------------
    world1: {
        badge: "Etappe 1 von 3",
        title: "Welt 1: Die schwebende Wiesen-Oase",
        objective: "Untersuche den goldenen Blumen-Altar am Wasser [Taste E]",
        hologramObjective: "Bewundere euer Erinnerungs-Hologramm & reise am Altar weiter in Welt 2 [Taste E]",

        hologramImageUrl: "erinnerung1.jpg",
        customFlowerImageUrl: "",

        revealTitle: "✨ Das Blumen-Mosaik ist vollendet! ✨",
        revealCaption: "Über dem Altar in der Oase ist soeben ein schwebendes Hologramm unserer ersten großen Erinnerung erschienen!",

        tablets: [
            {
                title: "Steintafel des Gärtners",
                text: "„Achte beim Verschieben der Blumenkacheln auf den goldenen Außenrahmen: Die vier Eckblüten tragen goldene Eck-Ornamente, während die große Sonnen-Rose das Herz in der Mitte bildet.“"
            },
            {
                title: "Steintafel der Harmonie",
                text: "„Oben leuchten die warmen Abendblüten (Koralle, Gold & Violett), in der Mitte fließt das grüne Rankenband, und unten wurzeln die tiefblauen Nachtblumen.“"
            }
        ]
    },

    // ------------------------------------------------------------------------
    // WELT 2: DIE DÄMMERUNGS-SCHLUCHT (4 Säulen, 4 Stufen & Erinnerungs-Flagge)
    // ------------------------------------------------------------------------
    world2: {
        badge: "Etappe 2 von 3",
        title: "Welt 2: Die Dämmerungs-Schlucht",
        objective: "Lies die 4 Säulen (von links nach rechts) und überquere die 4 Stufen der Brücke",
        flagObjective: "Bewundere eure gehisste Erinnerungs-Flagge & reise am Flaggenmast weiter zum Gipfel [Taste E]",

        flagImageUrl: "erinnerung2.jpg",

        gridNumbers: [
            [5, 8, 11, 4],     // 1. Plattform (Lösung: 8 - August)
            [9, 6, 2, 10],     // 2. Plattform (Lösung: 2 - November 1+1=2)
            [3, 7, 12, 1],     // 3. Plattform (Lösung: 3 - Sport & Locken)
            [6, 9, 4, 7]       // 4. Plattform (Lösung: 7 - Don Giovanni)
        ],

        solutionPath: [8, 2, 3, 7],

        obelisks: [
            {
                title: "1. Säule (Ganz links – 1. Stufe)",
                text: "„Der Monat an dem die Katze langsamer war, als die Kraft des fliessenden Gewässers.“"
            },
            {
                title: "2. Säule (Mitte links – 2. Stufe)",
                text: "„Alleine sind sie nur Teil ihrer Anfangsbuchstaben, aber zu zweit bilden sie das Dreamteam und retten die Welt!“"
            },
            {
                title: "3. Säule (Mitte rechts – 3. Stufe)",
                text: "„Ein Sport, der nicht nur vereint, sondern die Locken auf dem Kopf in ganz neuen Farben glänzen lässt.“"
            },
            {
                title: "4. Säule (Ganz rechts – 4. Stufe)",
                text: "„Don Giovanni wäre stolz, wenn er wüsste, wie oft wir in den Genuss des kulturellen Geschehens gekommen sind! (sofern man komische rote Nasen dazu zählt)“"
            }
        ]
    },

    // ------------------------------------------------------------------------
    // WELT 3: DER STERNENHIMMEL-GIPFEL (Altar, Panorama & Himmels-Video)
    // ------------------------------------------------------------------------
    world3: {
        badge: "Etappe 3 von 3 – Das Finale",
        title: "Welt 3: Der Sternenhimmel-Gipfel",
        objective: "Löse das Rätsel am Altar der Erinnerungen [Taste E]",
        chestObjective: "Genieße euer Video am Sternenhimmel! [Taste E an der Truhe für Vollbild / Neustart]",

        // Dein Video, das nach dem Lösen groß im Himmel über dem Bergpanorama (mit Ton!) läuft:
        skyVideoUrl: "lamavideo1.mp4",

        questions: [
            {
                question: "1. Welche Erinnerung erschien nach dem Blumen-Mosaik als schwebendes Hologramm?",
                options: [
                    "Unser gemeinsames Foto vor der Swiss-Indoors-Blumenwand 🌸🎾",
                    "Ein Kompass aus Eis",
                    "Ein silberner Anker"
                ],
                correctIndex: 0
            },
            {
                question: "2. Welcher 4-stellige Zahlencode führte sicher über die Brücke zur Erinnerungs-Flagge?",
                options: [
                    "1 – 3 – 5 – 9",
                    "8 – 2 – 3 – 7",
                    "4 – 6 – 8 – 10"
                ],
                correctIndex: 1
            },
            {
                question: "3. Was feiern wir am Ziel dieser magischen Reise auf dem Gipfel?",
                options: [
                    "Einen gewöhnlichen Dienstag",
                    "Unser 1-jähriges Jubiläum voller gemeinsamer Abenteuer ❤️",
                    "Den Beginn der Regenzeit"
                ],
                correctIndex: 1
            }
        ]
    }
};
