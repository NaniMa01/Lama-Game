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

        // Das Bild für das schwebende 3D-Hologramm über dem Altar nach dem Lösen:
        hologramImageUrl: "erinnerung1.jpg",

        // Optional: Eigenes Bild für die 9 Schiebekacheln selbst (leer = Blumen-Mandala):
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
    // WELT 2: DIE DÄMMERUNGS-SCHLUCHT (Der Pfad der leuchtenden Trittsteine)
    // ------------------------------------------------------------------------
    world2: {
        badge: "Etappe 2 von 3",
        title: "Welt 2: Die Dämmerungs-Schlucht",
        objective: "Überquere die Schlucht über die 5 Reihen der leuchtenden Trittsteine",

        gridNumbers: [
            [2, 5, 8, 3],      // Reihe 1 (Start)
            [9, 4, 7, 1],      // Reihe 2
            [6, 12, 7, 10],    // Reihe 3
            [14, 8, 11, 15],   // Reihe 4
            [20, 16, 13, 18]   // Reihe 5 (Ziel)
        ],

        solutionPath: [2, 4, 7, 11, 16],

        obelisks: [
            {
                title: "Obelisk der Zahlenfolge",
                text: "„Der sichere Pfad über den Abgrund beginnt in der ersten Reihe bei der Zahl 2. Mit jedem Schritt nach vorn wächst der Abstand um eins: +2, +3, +4, +5.“"
            },
            {
                title: "Obelisk des Reisenden",
                text: "„Reihe 1: 2  ➔  Reihe 2: 4  ➔  Reihe 3: 7  ➔  Reihe 4: 11  ➔  Reihe 5: 16. Betrittst du einen falschen Stein, trägt dich der Wind sanft an den Anfang zurück.“"
            }
        ]
    },

    // ------------------------------------------------------------------------
    // WELT 3: DER STERNENHIMMEL-GIPFEL (Altar der Erinnerungen & Schatztruhe)
    // ------------------------------------------------------------------------
    world3: {
        badge: "Etappe 3 von 3",
        title: "Welt 3: Der Sternenhimmel-Gipfel",
        objective: "Löse das Rätsel am Altar der Erinnerungen [Taste E]",
        chestObjective: "Öffne die goldene Schatztruhe in der Mitte des Gipfels [Taste E]",

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
                question: "2. Welche Zahlenfolge öffnete den sicheren Pfad über die Dämmerungs-Schlucht?",
                options: [
                    "1 – 3 – 5 – 7 – 9",
                    "2 – 4 – 7 – 11 – 16",
                    "3 – 6 – 9 – 12 – 15"
                ],
                correctIndex: 1
            },
            {
                question: "3. Was feiern wir am Ziel dieser magischen Reise?",
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
