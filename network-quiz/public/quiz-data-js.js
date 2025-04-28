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
                            "Ein verteil