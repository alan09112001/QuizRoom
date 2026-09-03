// ============================================================
// QUESTIONS DE TEST — 100% factices, aucun rapport avec la vraie
// partie. Sert uniquement à vérifier que tout fonctionne
// (jokers, chrono, scores, classement, podium) sans se spoiler.
// ============================================================

const QUIZ_ROUNDS = [
  {
    id: "t1",
    title: "TEST — Manche 1",
    theme: "test",
    allowJokerCopieur: true,
    questions: [
      { id:"t1q1", type:"qcm", prompt:"Combien font 2 + 2 ?", options:["3","4","5","6"], correctIndex:1 },
      { id:"t1q2", type:"qcm", prompt:"Quelle est la couleur du ciel par temps clair ?", options:["Vert","Bleu","Rouge","Jaune"], correctIndex:1 },
      { id:"t1q3", type:"intrus", prompt:"Trouvez l'intrus", options:["Pomme","Banane","Carotte","Orange"], correctIndex:2 }
    ]
  },
  {
    id: "t2",
    title: "TEST — Manche 2 (Estimation)",
    theme: "test",
    allowJokerCopieur: false,
    questions: [
      { id:"t2q1", type:"estimation", prompt:"Combien y a-t-il de jours dans une année (hors bissextile) ?", unit:"", correctValue:365 },
      { id:"t2q2", type:"estimation", prompt:"Quelle température fait-il en moyenne dans un salon chauffé ?", unit:"°C", correctValue:20 }
    ]
  }
];
