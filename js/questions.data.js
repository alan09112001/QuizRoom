// ============================================================
// ⚠️  NE PAS OUVRIR CE FICHIER AVANT LA PARTIE  ⚠️
// Il contient toutes les questions ET les bonnes réponses.
// Seuls index.html (TV), player.html (joueurs) et host.html
// (animateur, qui n'affiche jamais ce contenu à l'écran) le lisent.
// ============================================================
// Schéma d'une question :
//   { id, type: 'qcm' | 'intrus' | 'estimation',
//     prompt: string,
//     options?: string[4]        // pour qcm / intrus
//     correctIndex?: number      // index 0-3 dans options
//     unit?: string              // pour estimation (ex: "€", "km²", "")
//     correctValue?: number      // pour estimation
//   }
// ============================================================

const QUIZ_ROUNDS = [
  {
    id: "r1",
    title: "Manche 1 — Football ⚽",
    theme: "football",
    allowJokerCopieur: true,
    questions: [
      { id:"r1q1", type:"qcm", prompt:"Combien de fois l'équipe de France a-t-elle été championne du monde ?", options:["1 fois","2 fois","3 fois","4 fois"], correctIndex:1 },
      { id:"r1q2", type:"qcm", prompt:"Qui est le meilleur buteur de l'histoire de l'équipe de France ?", options:["Thierry Henry","Michel Platini","Olivier Giroud","Kylian Mbappé"], correctIndex:2 },
      { id:"r1q3", type:"intrus", prompt:"Trouvez l'intrus : lequel de ces joueurs n'a jamais évolué au Real Madrid ?", options:["Zinédine Zidane","Karim Benzema","Kylian Mbappé","Thierry Henry"], correctIndex:3 },
      { id:"r1q4", type:"qcm", prompt:"Dans quelle ville se trouve le Stade de France ?", options:["Paris","Saint-Denis","Marseille","Lyon"], correctIndex:1 }
    ]
  },
  {
    id: "r2",
    title: "Manche 2 — Voitures 🚗",
    theme: "voitures",
    allowJokerCopieur: true,
    questions: [
      { id:"r2q1", type:"qcm", prompt:"Quel constructeur fabrique la Twingo ?", options:["Peugeot","Citroën","Renault","Volkswagen"], correctIndex:2 },
      { id:"r2q2", type:"intrus", prompt:"Trouvez l'intrus : laquelle de ces voitures n'est pas un modèle Peugeot ?", options:["Clio","208","308","508"], correctIndex:0 },
      { id:"r2q3", type:"qcm", prompt:"Quelle couleur a un feu arrière de marche arrière ?", options:["Rouge","Blanc","Orange","Bleu"], correctIndex:1 },
      { id:"r2q4", type:"qcm", prompt:"Quel est l'âge minimum légal pour obtenir le permis B en France ?", options:["16 ans","17 ans","18 ans","21 ans"], correctIndex:2 }
    ]
  },
  {
    id: "r3",
    title: "Manche 3 — Belle-Île-en-Mer 🌊",
    theme: "belle-ile",
    allowJokerCopieur: false,
    questions: [
      { id:"r3q1", type:"qcm", prompt:"Belle-Île-en-Mer est la plus grande île de...", options:["Bretagne","Normandie","Corse","Vendée"], correctIndex:0 },
      { id:"r3q2", type:"qcm", prompt:"Depuis quel port breton part le bateau classique pour Belle-Île-en-Mer ?", options:["Quiberon","Saint-Malo","Brest","Lorient"], correctIndex:0 },
      { id:"r3q3", type:"intrus", prompt:"Trouvez l'intrus : lequel n'est pas associé à Belle-Île-en-Mer ?", options:["Le Palais","Les aiguilles de Port-Coton","La chanson de Laurent Voulzy","La Tour Eiffel"], correctIndex:3 }
    ]
  },
  {
    id: "r4",
    title: "Manche 4 — Musique française 🎵",
    theme: "musique",
    allowJokerCopieur: false,
    questions: [
      { id:"r4q1", type:"qcm", prompt:"Qui chante 'La Vie en rose' ?", options:["Édith Piaf","France Gall","Dalida","Mireille Mathieu"], correctIndex:0 },
      { id:"r4q2", type:"qcm", prompt:"Qui chante 'Ça plane pour moi' ?", options:["Plastic Bertrand","Étienne Daho","Indochine","Téléphone"], correctIndex:0 },
      { id:"r4q3", type:"intrus", prompt:"Trouvez l'intrus : lequel n'est pas un rappeur français ?", options:["Booba","Nekfeu","Orelsan","Johnny Hallyday"], correctIndex:3 },
      { id:"r4q4", type:"qcm", prompt:"Dans quelle ville est né Johnny Hallyday ?", options:["Paris","Lyon","Marseille","Nice"], correctIndex:0 }
    ]
  },
  {
    id: "r5",
    title: "Manche 5 — Spéciale Miss 👑",
    theme: "miss",
    allowJokerCopieur: false,
    questions: [
      { id:"r5q1", type:"qcm", prompt:"Quel est le nom de la société qui organise le concours Miss France ?", options:["Miss France SAS","France Télévisions","Ministère de la Culture","Fédération Française de Beauté"], correctIndex:0 },
      { id:"r5q2", type:"qcm", prompt:"Quelle ancienne Miss France en est devenue la directrice générale pendant de nombreuses années ?", options:["Sylvie Tellier","Sonia Rolland","Laetitia Bléger","Iris Mittenaere"], correctIndex:0 }
    ]
  },
  {
    id: "r6",
    title: "Manche 6 — Culture générale 🧠",
    theme: "culture-generale",
    allowJokerCopieur: false,
    questions: [
      { id:"r6q1", type:"qcm", prompt:"Quelle est la capitale de l'Australie ?", options:["Sydney","Melbourne","Canberra","Perth"], correctIndex:2 },
      { id:"r6q2", type:"intrus", prompt:"Trouvez l'intrus : lequel n'est pas (ou plus) une planète du système solaire ?", options:["Mars","Vénus","Pluton","Saturne"], correctIndex:2 },
      { id:"r6q3", type:"qcm", prompt:"Combien d'os compte le squelette d'un adulte ?", options:["106","156","206","306"], correctIndex:2 },
      { id:"r6q4", type:"qcm", prompt:"Quel est le plus long fleuve de France ?", options:["La Seine","La Loire","Le Rhône","La Garonne"], correctIndex:1 }
    ]
  },
  {
    id: "r7",
    title: "Manche 7 — Le Juste Prix 💶",
    theme: "juste-prix",
    allowJokerCopieur: false,
    questions: [
      { id:"r7q1", type:"estimation", prompt:"Quel est le prix moyen d'une baguette tradition en France aujourd'hui ?", unit:"€", correctValue:1.40 },
      { id:"r7q2", type:"estimation", prompt:"Quel est le prix moyen d'un plein d'essence de 50 litres (SP95) en France ?", unit:"€", correctValue:90 },
      { id:"r7q3", type:"estimation", prompt:"En quelle année la Peugeot 205 a-t-elle été lancée ?", unit:"", correctValue:1983 },
      { id:"r7q4", type:"estimation", prompt:"En quelle année la première Renault Clio est-elle sortie ?", unit:"", correctValue:1990 },
      { id:"r7q5", type:"estimation", prompt:"Quelle est la superficie de Belle-Île-en-Mer, en km² ?", unit:"km²", correctValue:84 },
      { id:"r7q6", type:"estimation", prompt:"Combien d'habitants compte environ Belle-Île-en-Mer à l'année ?", unit:"habitants", correctValue:5300 }
    ]
  }
];
