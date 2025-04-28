const quizData = {
    "iti21": {
        title: "Grundlagen moderner Computernetze",
        chapters: [
            {
                title: "Kapitel 1: Einführung",
                questions: [
                    {
                        type: "multiple",
                        question: "Was bedeutet der Begriff 'Informationsgesellschaft'?",
                        options: [
                            "Eine Gesellschaft, die ausschließlich digital kommuniziert",
                            "Eine Gesellschaft, in der Informationstechnologien eine zentrale Rolle spielen",
                            "Eine Gesellschaft ohne analoge Medien",
                            "Eine Gesellschaft, die nur aus IT-Experten besteht"
                        ],
                        correct: 1,
                        explanation: "Die Informationsgesellschaft ist geprägt durch den umfassenden Einsatz von Informations- und Kommunikationstechnologien in allen Lebensbereichen."
                    },
                    {
                        type: "multiple",
                        question: "Welcher Begriff ist korrekt: Netz oder Netzwerk?",
                        options: [
                            "Nur 'Netzwerk' ist korrekt",
                            "'Netz' ist korrekt, 'Netzwerk' ist ein Übersetzungsfehler",
                            "Beide Begriffe sind falsch",
                            "'Netzwerk' ist nur für soziale Netzwerke korrekt"
                        ],
                        correct: 1,
                        explanation: "Laut Bastian Sick ist 'Netzwerk' ein Anglizismus bzw. Übersetzungsfehler. 'Network' bedeutet eigentlich Netz oder Geflecht."
                    },
                    {
                        type: "multiple",
                        question: "Was kritisierte Joseph Weizenbaum an der Informationsgesellschaft?",
                        options: [
                            "Die zu langsame Entwicklung der Technologie",
                            "Die Illusion, dass Computer alle Informationen liefern können",
                            "Den Mangel an Internetanschlüssen",
                            "Die hohen Kosten für Computer"
                        ],
                        correct: 1,
                        explanation: "Weizenbaum kritisierte, dass wir nur die Illusion haben, in einer Informationsgesellschaft zu leben. Computer können nicht die eigentliche Information liefern - das geschieht durch Interpretation im Kopf."
                    },
                    {
                        type: "multiple",
                        question: "Was gehört zu den IuK-Technologien?",
                        options: [
                            "Nur Telefone und Computer",
                            "Verarbeitung, Speicherung und Übertragung von Informationen",
                            "Ausschließlich das Internet",
                            "Nur Hardware-Komponenten"
                        ],
                        correct: 1,
                        explanation: "IuK-Technologien (Informations- und Kommunikationstechnologien) umfassen die Verarbeitung, Speicherung und Übertragung von Informationen."
                    },
                    {
                        type: "multiple",
                        question: "Was passiert bei einem Ausfall der IuK-Technologien?",
                        options: [
                            "Nichts Gravierendes",
                            "Nur E-Mails funktionieren nicht",
                            "Es kann zu katastrophalen Folgen kommen",
                            "Nur Social Media ist betroffen"
                        ],
                        correct: 2,
                        explanation: "Bei einem Ausfall können katastrophale Folgen eintreten, wie das Beispiel des Blackouts in Lübeck 2018 zeigt, wo das öffentliche Leben teilweise stillstand."
                    }
                ]
            },
            {
                title: "Kapitel 2: Internet – das Netz der Netze",
                questions: [
                    {
                        type: "multiple",
                        question: "Was ist das Internet laut FNC-Definition?",
                        options: [
                            "Ein lokales Netzwerk",
                            "Ein globales Informationssystem basierend auf IP",
                            "Nur das World Wide Web",
                            "Ein soziales Netzwerk"
                        ],
                        correct: 1,
                        explanation: "Das Internet ist ein globales Informationssystem, das auf dem Internet Protocol (IP) basiert und TCP/IP oder kompatible Protokolle verwendet."
                    },
                    {
                        type: "multiple",
                        question: "Was ist ein Host?",
                        options: [
                            "Nur ein Server",
                            "Ein Computer oder Gerät, das mit einem Netzwerk verbunden ist",
                            "Ein Webserver",
                            "Ein Programm zum Surfen im Internet"
                        ],
                        correct: 1,
                        explanation: "Ein Host ist ein Computer oder ein anderes Gerät, das mit einem Computernetz verbunden ist."
                    },
                    {
                        type: "multiple",
                        question: "Welche Organisation ist für die Internet-Standards verantwortlich?",
                        options: [
                            "Microsoft",
                            "Google",
                            "IETF (Internet Engineering Task Force)",
                            "Apple"
                        ],
                        correct: 2,
                        explanation: "Die IETF entwickelt die herstellerunabhängigen Standards des Internets und veröffentlicht sie als RFCs (Request for Comments)."
                    },
                    {
                        type: "multiple",
                        question: "Was bedeutet Netzneutralität?",
                        options: [
                            "Alle Netzwerkkabel müssen gleich lang sein",
                            "Gleichberechtigte Übertragung von Daten unabhängig von Inhalt und Sender",
                            "Jeder muss das gleiche Internet-Abo haben",
                            "Alle Router müssen gleich schnell sein"
                        ],
                        correct: 1,
                        explanation: "Netzneutralität bedeutet die neutrale, gleichberechtigte Übertragung von Daten im Internet unabhängig von Sender, Empfänger und Inhalt."
                    },
                    {
                        type: "multiple",
                        question: "Welches war der Vorläufer des Internets?",
                        options: [
                            "CompuServe",
                            "ARPAnet",
                            "AOL",
                            "MSN"
                        ],
                        correct: 1,
                        explanation: "Das ARPAnet wurde 1969 in den USA in Betrieb genommen und gilt als Vorläufer des Internets."
                    }
                ]
            },
            {
                title: "Kapitel 3: Einordnung, Ziele und Anforderungen",
                questions: [
                    {
                        type: "multiple",
                        question: "Was ist ein Computernetz?",
                        options: [
                            "Ein einzelner Computer",
                            "Ein Verbund von zwei oder mehr autonomen Computern",
                            "Nur das Internet",
                            "Ein Multiprozessorsystem"
                        ],
                        correct: 1,
                        explanation: "Ein Computernetz ist ein Verbund von zwei oder mehr autonomen Computern und anderen Systemen, der die Kommunikation und den gemeinsamen Zugriff auf Ressourcen ermöglicht."
                    },
                    {
                        type: "multiple",
                        question: "Was ist der Hauptunterschied zwischen einem Computernetz und einem verteilten System?",
                        options: [
                            "Es gibt keinen Unterschied",
                            "Ein verteiltes System erscheint dem Nutzer wie ein einziges System",
                            "Computernetze sind schneller",
                            "Verteilte Systeme haben keine Kabel"
                        ],
                        correct: 1,
                        explanation: "Ein verteiltes System erscheint für den Nutzer wie ein einziges autonomes System, während bei einem Computernetz die einzelnen Systeme sichtbar bleiben."
                    },
                    {
                        type: "multiple",
                        question: "Was ist ein Ressourcenverbund?",
                        options: [
                            "Die Nutzung nichtlokaler Ressourcen wie Speicher oder Peripheriegeräte",
                            "Eine Gruppe von IT-Mitarbeitern",
                            "Ein soziales Netzwerk für IT-Profis",
                            "Ein Verbund von Stromkabeln"
                        ],
                        correct: 0,
                        explanation: "Ein Ressourcenverbund ermöglicht die Nutzung nichtlokaler gerätetechnischer Ressourcen und nichtlokaler Software."
                    },
                    {
                        type: "multiple",
                        question: "Welche Anforderung haben Nutzer an ein Computernetz?",
                        options: [
                            "Möglichst komplizierte Bedienung",
                            "Hohe Übertragungsgeschwindigkeit und Zuverlässigkeit",
                            "Viele Kabel",
                            "Hoher Stromverbrauch"
                        ],
                        correct: 1,
                        explanation: "Nutzer erwarten hohe Übertragungsgeschwindigkeit, Zuverlässigkeit, gute Qualität der Übertragung und Sicherheit der übertragenen Informationen."
                    },
                    {
                        type: "multiple",
                        question: "Was ist ein Intranet?",
                        options: [
                            "Das Internet innerhalb eines Landes",
                            "Ein unternehmensinternes Netz basierend auf Internet-Technologien",
                            "Ein soziales Netzwerk",
                            "Ein langsames Internet"
                        ],
                        correct: 1,
                        explanation: "Ein Intranet ist ein unternehmensinternes Computernetz, das auf der TCP/IP-Protokollfamilie basiert und zur Unterstützung unternehmensinterner Prozesse genutzt wird."
                    }
                ]
            },
            {
                title: "Kapitel 4: Grundlegende Bausteine und Klassifikationen",
                questions: [
                    {
                        type: "multiple",
                        question: "Was sind die elementaren Bausteine eines Computernetzes?",
                        options: [
                            "Nur Computer und Kabel",
                            "Computer mit Netzinterface, Verbindungen und Protokolle",
                            "Nur Protokolle",
                            "Nur Router und Switches"
                        ],
                        correct: 1,
                        explanation: "Die elementaren Bausteine sind Computer mit Netzinterface, Verbindungen zwischen den Knoten und Protokolle zur Regelung der Datenkommunikation."
                    },
                    {
                        type: "multiple",
                        question: "Was ist der Hauptunterschied zwischen P2P und Client-Server?",
                        options: [
                            "P2P ist schneller",
                            "Bei P2P sind alle Hosts gleichberechtigt, bei Client-Server gibt es dedizierte Server",
                            "Client-Server ist kostenfrei",
                            "P2P funktioniert nur im Internet"
                        ],
                        correct: 1,
                        explanation: "In einem P2P-Netz sind alle Hosts gleichberechtigt, während bei Client-Server dedizierte Server Dienste für Clients bereitstellen."
                    },
                    {
                        type: "multiple",
                        question: "Was ist Paketvermittlung?",
                        options: [
                            "Das Versenden von Paketen per Post",
                            "Das Zerlegen von Nachrichten in Pakete, die einzeln durch das Netz vermittelt werden",
                            "Eine spezielle Versandart",
                            "Das Sortieren von E-Mails"
                        ],
                        correct: 1,
                        explanation: "Bei der Paketvermittlung wird eine Nachricht in Pakete zerlegt, die einzeln mit Adressen versehen und durch das Netz zum Empfänger vermittelt werden."
                    },
                    {
                        type: "multiple",
                        question: "Welche Topologie hat den geringsten Verkabelungsaufwand?",
                        options: [
                            "Vermaschte Topologie",
                            "Sterntopologie",
                            "Bustopologie",
                            "Ringtopologie"
                        ],
                        correct: 2,
                        explanation: "Die Bustopologie hat den geringsten Verkabelungsaufwand, da alle Hosts über eine gemeinsame Leitung verbunden sind."
                    },
                    {
                        type: "multiple",
                        question: "Was bedeutet 'vollduplex'?",
                        options: [
                            "Nur in eine Richtung senden",
                            "Abwechselnd senden und empfangen",
                            "Gleichzeitig senden und empfangen",
                            "Doppelte Geschwindigkeit"
                        ],
                        correct: 2,
                        explanation: "Vollduplex bedeutet, dass gleichzeitig Informationsflüsse in beiden Richtungen möglich sind."
                    }
                ]
            },
            {
                title: "Kapitel 5: Kenngrößen in Netzen",
                questions: [
                    {
                        type: "multiple",
                        question: "Was ist die Übertragungsrate?",
                        options: [
                            "Die Geschwindigkeit eines Autos",
                            "Die Anzahl der übertragenen Bits pro Sekunde",
                            "Die Anzahl der Computer im Netzwerk",
                            "Die Länge eines Kabels"
                        ],
                        correct: 1,
                        explanation: "Die Übertragungsrate gibt die Anzahl der übertragenen Bits pro Sekunde (bit/s) an."
                    },
                    {
                        type: "multiple",
                        question: "Was ist Latenz?",
                        options: [
                            "Die Anzahl der Nutzer",
                            "Die Zeit zwischen Absenden und Empfang einer Übertragungseinheit",
                            "Die Geschwindigkeit des Internets",
                            "Die Größe einer Datei"
                        ],
                        correct: 1,
                        explanation: "Die Latenz bezeichnet die Zeit zwischen dem Absenden und dem Empfang einer Übertragungseinheit."
                    },
                    {
                        type: "multiple",
                        question: "Was bedeutet Jitter?",
                        options: [
                            "Fehlerhafte Pakete",
                            "Schwankungen in der Latenz",
                            "Vibrationen im Kabel",
                            "Übertragungsgeschwindigkeit"
                        ],
                        correct: 1,
                        explanation: "Jitter bezeichnet Latenzschwankungen bzw. die Variabilität der Antwortzeit."
                    },
                    {
                        type: "multiple",
                        question: "Wie berechnet man die Übertragungsrate?",
                        options: [
                            "Datenmenge mal Zeit",
                            "Datenmenge durch Zeit",
                            "Zeit durch Datenmenge",
                            "Datenmenge plus Zeit"
                        ],
                        correct: 1,
                        explanation: "Die Übertragungsrate berechnet sich als Datenmenge geteilt durch die zur Übertragung benötigte Zeit: b = D/t"
                    },
                    {
                        type: "multiple",
                        question: "Was ist der Durchsatz?",
                        options: [
                            "Die maximale Übertragungsrate",
                            "Die Rate der Nutzdaten zwischen Sender und Empfänger",
                            "Die Anzahl der Fehler",
                            "Die Anzahl der Nutzer"
                        ],
                        correct: 1,
                        explanation: "Der Durchsatz bezeichnet die Rate (Bit/Zeiteinheit), mit der Nutzdaten zwischen Sender und Empfänger ausgetauscht werden."
                    }
                ]
            },
            {
                title: "Kapitel 6: Schichtenmodelle und Protokolle",
                questions: [
                    {
                        type: "multiple",
                        question: "Wie viele Schichten hat das OSI-Modell?",
                        options: [
                            "4",
                            "5",
                            "7",
                            "10"
                        ],
                        correct: 2,
                        explanation: "Das OSI-Modell umfasst 7 Schichten: Bitübertragung, Sicherung, Vermittlung, Transport, Sitzung, Darstellung und Anwendung."
                    },
                    {
                        type: "multiple",
                        question: "Was ist ein Protokoll?",
                        options: [
                            "Ein Kabel",
                            "Eine Menge von Regeln für die Kommunikation",
                            "Ein Computer",
                            "Eine Software"
                        ],
                        correct: 1,
                        explanation: "Ein Protokoll ist eine Menge von Regeln, nach denen Kommunikationspartner Verbindungen auf- und abbauen und Nachrichten austauschen."
                    },
                    {
                        type: "multiple",
                        question: "In welcher Schicht arbeitet IP?",
                        options: [
                            "Schicht 1 (Physical)",
                            "Schicht 2 (Data Link)",
                            "Schicht 3 (Network)",
                            "Schicht 4 (Transport)"
                        ],
                        correct: 2,
                        explanation: "Das Internet Protocol (IP) arbeitet in der Netzwerkschicht (Schicht 3) des OSI-Modells."
                    },
                    {
                        type: "multiple",
                        question: "Was ist der Vorteil von Schichtenmodellen?",
                        options: [
                            "Sie sind komplizierter",
                            "Sie ermöglichen Modularisierung und vereinfachen die Implementierung",
                            "Sie verlangsamen die Übertragung",
                            "Sie benötigen mehr Hardware"
                        ],
                        correct: 1,
                        explanation: "Schichtenmodelle ermöglichen eine Modularisierung der Funktionalität, erleichtern die Implementierung und ermöglichen Flexibilität."
                    },
                    {
                        type: "multiple",
                        question: "Wie viele Schichten hat das TCP/IP-Modell?",
                        options: [
                            "3",
                            "4",
                            "5",
                            "7"
                        ],
                        correct: 1,
                        explanation: "Das TCP/IP-Modell umfasst 4 Schichten: Network Access, Internet, Transport und Application."
                    }
                ]
            }
        ]
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = quizData;
}