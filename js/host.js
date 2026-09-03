// ============================================================
// HOST.JS — panneau de contrôle de l'animateur.
// Important : ce script a accès au contenu des questions (il doit
// les pousser dans Firebase) MAIS host.html ne les affiche JAMAIS
// à l'écran ni dans un console.log. Ne pas ouvrir la console
// pendant la partie si tu veux garder la surprise à 100%.
// ============================================================

const QUESTION_DURATION_S = 20;

// Aplatit les manches en une liste unique de questions, avec métadonnées de manche.
const FLAT_QUESTIONS = [];
QUIZ_ROUNDS.forEach((round, roundIndex) => {
  round.questions.forEach((q, qIndexInRound) => {
    FLAT_QUESTIONS.push({
      ...q,
      roundIndex,
      roundTitle: round.title,
      roundTheme: round.theme,
      qIndexInRound,
      questionKey: `${roundIndex}_${qIndexInRound}`,
      isLastOfRound: qIndexInRound === round.questions.length - 1,
      allowJokerCopieur: !!round.allowJokerCopieur
    });
  });
});

let pointer = -1; // index dans FLAT_QUESTIONS
let players = {};

const el = {
  status: document.getElementById("status"),
  progress: document.getElementById("progress"),
  roundTitle: document.getElementById("roundTitle"),
  typeBadge: document.getElementById("typeBadge"),
  playersList: document.getElementById("playersList"),
  btnNewGame: document.getElementById("btnNewGame"),
  btnStart: document.getElementById("btnStart"),
  btnReveal: document.getElementById("btnReveal"),
  btnNext: document.getElementById("btnNext"),
  btnLeaderboard: document.getElementById("btnLeaderboard"),
  btnFinish: document.getElementById("btnFinish"),
  joinUrl: document.getElementById("joinUrl"),
};

function setStatus(text) {
  el.status.textContent = text;
}

function renderPlayers() {
  const ids = Object.keys(players);
  if (ids.length === 0) {
    el.playersList.innerHTML = `<p class="dim">Aucun joueur connecté pour l'instant.</p>`;
    return;
  }
  el.playersList.innerHTML = ids
    .map((id) => {
      const p = players[id];
      const jokers = [
        p.joker5050Used ? "🕶️ utilisé" : "🕶️ dispo",
        p.jokerCopieurUsed ? "🎭 utilisé" : "🎭 dispo",
      ].join(" · ");
      return `<div class="player-row">
        <span class="player-name">${p.name}</span>
        <span class="player-score">${p.score || 0} pts</span>
        <span class="player-jokers dim">${jokers}</span>
      </div>`;
    })
    .join("");
}

async function resetGame() {
  if (!confirm("Démarrer une nouvelle partie ? Cela efface les scores et les joueurs connectés.")) return;
  await db.ref("session").set({
    phase: "lobby",
    currentQuestion: null,
    reveal: null,
  });
  await db.ref("players").remove();
  await db.ref("answers").remove();
  pointer = -1;
  setStatus("Nouvelle partie prête. En attente des joueurs...");
  updateProgressUI(null);
}

function currentFlatQuestion() {
  return FLAT_QUESTIONS[pointer] || null;
}

function updateProgressUI(q) {
  if (!q) {
    el.progress.textContent = `— / ${FLAT_QUESTIONS.length}`;
    el.roundTitle.textContent = "—";
    el.typeBadge.textContent = "—";
    return;
  }
  el.progress.textContent = `Question ${pointer + 1} / ${FLAT_QUESTIONS.length}`;
  el.roundTitle.textContent = q.roundTitle;
  const typeLabels = { qcm: "QCM", intrus: "Intrus", estimation: "Estimation" };
  el.typeBadge.textContent = typeLabels[q.type] || q.type;
}

async function launchNextQuestion() {
  pointer += 1;
  const q = currentFlatQuestion();
  if (!q) {
    setStatus("Toutes les questions ont été jouées !");
    return;
  }
  updateProgressUI(q);

  // Réinitialise les jokers "50/50" actifs question par question (le 50/50
  // reste "used" définitivement au niveau joueur une fois consommé).
  await db.ref(`answers/${q.questionKey}`).remove();

  const payload = {
    id: q.id,
    key: q.questionKey,
    type: q.type,
    prompt: q.prompt,
    roundTitle: q.roundTitle,
    unit: q.unit || null,
    allowJoker5050: q.type !== "estimation",
    allowJokerCopieur: q.allowJokerCopieur,
    durationS: QUESTION_DURATION_S,
    startedAt: firebase.database.ServerValue.TIMESTAMP,
  };
  if (q.type === "qcm" || q.type === "intrus") {
    payload.options = q.options;
    payload.correctIndex = q.correctIndex;
  } else {
    payload.correctValue = q.correctValue;
  }

  await db.ref("session").update({
    phase: "question",
    currentQuestion: payload,
    reveal: null,
  });

  setStatus(`Question ${pointer + 1} lancée — ${QUESTION_DURATION_S}s`);
}

async function revealAnswer() {
  const q = currentFlatQuestion();
  if (!q) return;

  const snap = await db.ref(`answers/${q.questionKey}`).get();
  const rawAnswers = snap.exists() ? snap.val() : {};

  const correctAnswer = q.type === "estimation" ? q.correctValue : q.correctIndex;
  const scored = scoreQuestion(q.type, rawAnswers, correctAnswer);

  // Met à jour les scores cumulés des joueurs + marque les jokers utilisés.
  const updates = {};
  for (const [playerId, res] of Object.entries(scored)) {
    const p = players[playerId];
    if (!p) continue;
    const newScore = (p.score || 0) + res.points;
    updates[`players/${playerId}/score`] = newScore;

    const entry = rawAnswers[playerId] || {};
    if (entry.usedJoker5050) updates[`players/${playerId}/joker5050Used`] = true;
    if (entry.copyTargetId) updates[`players/${playerId}/jokerCopieurUsed`] = true;
  }
  updates["answers/" + q.questionKey + "/__scored"] = scored;
  updates["session/reveal"] = {
    forKey: q.questionKey,
    correctIndex: q.type !== "estimation" ? q.correctIndex : null,
    correctValue: q.type === "estimation" ? q.correctValue : null,
    scored,
  };
  updates["session/phase"] = "reveal";

  await db.ref().update(updates);
  setStatus(`Réponse révélée pour la question ${pointer + 1}.`);
}

async function showLeaderboard() {
  await db.ref("session/phase").set("leaderboard");
  setStatus("Classement affiché sur l'écran TV.");
}

async function finishGame() {
  if (!confirm("Terminer la partie et afficher le podium final ?")) return;
  await db.ref("session/phase").set("finished");
  setStatus("Partie terminée — podium affiché !");
}

// --- Listeners Firebase ---
db.ref("players").on("value", (snap) => {
  players = snap.exists() ? snap.val() : {};
  renderPlayers();
});

// --- UI wiring ---
el.btnNewGame.addEventListener("click", resetGame);
el.btnStart.addEventListener("click", launchNextQuestion);
el.btnReveal.addEventListener("click", revealAnswer);
el.btnNext.addEventListener("click", launchNextQuestion);
el.btnLeaderboard.addEventListener("click", showLeaderboard);
el.btnFinish.addEventListener("click", finishGame);

el.joinUrl.textContent = window.location.href.replace(/host\.html.*/, "player.html");
updateProgressUI(null);
setStatus("Prêt. Clique sur \"Nouvelle partie\" pour commencer.");
