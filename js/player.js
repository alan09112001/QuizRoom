// ============================================================
// PLAYER.JS — écran smartphone. Ne contient aucune question :
// tout le texte affiché vient de Firebase (session/currentQuestion).
// ============================================================

const OPTION_LABELS = ["A", "B", "C", "D"];
const STORAGE_KEY = "quizroom_player_id";

let myId = localStorage.getItem(STORAGE_KEY) || null;
let myName = null;
let currentQuestionKey = null;
let hasAnsweredThisQuestion = false;
let hidden5050Indices = [];
let allPlayers = {};

const screens = {
  login: document.getElementById("screen-login"),
  waiting: document.getElementById("screen-waiting"),
  question: document.getElementById("screen-question"),
  answered: document.getElementById("screen-answered"),
  reveal: document.getElementById("screen-reveal"),
  leaderboard: document.getElementById("screen-leaderboard"),
  finished: document.getElementById("screen-finished"),
};
function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => node.classList.toggle("active", key === name));
}

// ---------- Login ----------
function buildLoginButtons() {
  const wrap = document.getElementById("presetPlayers");
  wrap.innerHTML = PRESET_PLAYERS.map((n) => `<button class="preset-btn" data-name="${n}">${n}</button>`).join("");
  wrap.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => login(btn.dataset.name));
  });
}

document.getElementById("freeNameForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = document.getElementById("freeNameInput").value.trim();
  if (val) login(val);
});

async function login(name) {
  const id = slugify(name);
  myId = id;
  myName = name;
  localStorage.setItem(STORAGE_KEY, id);

  const ref = db.ref(`players/${id}`);
  const snap = await ref.get();
  if (!snap.exists()) {
    await ref.set({
      name,
      score: 0,
      connected: true,
      joker5050Used: false,
      jokerCopieurUsed: false,
    });
  } else {
    await ref.update({ connected: true });
  }
  document.getElementById("myNameLabel").textContent = name;
  showScreen("waiting");
}

// ---------- Rendering a question ----------
function renderQuestion(q) {
  hasAnsweredThisQuestion = false;
  hidden5050Indices = [];
  document.getElementById("pRoundTitle").textContent = q.roundTitle;
  document.getElementById("pPrompt").textContent =
    q.type === "estimation"
      ? "👀 Regarde l'écran pour la question, puis tape ton estimation"
      : "👀 Regarde l'écran pour la question et les réponses A / B / C / D";

  const qcmWrap = document.getElementById("pQcmOptions");
  const estimationWrap = document.getElementById("pEstimation");
  const jokerBar = document.getElementById("jokerBar");
  const copieurWrap = document.getElementById("copieurWrap");

  const me = allPlayers[myId] || {};

  if (q.type === "estimation") {
    qcmWrap.style.display = "none";
    estimationWrap.style.display = "block";
    document.getElementById("pUnit").textContent = q.unit ? `en ${q.unit}` : "";
    document.getElementById("estimationInput").value = "";
  } else {
    estimationWrap.style.display = "none";
    qcmWrap.style.display = "grid";
    qcmWrap.innerHTML = q.options
      .map(
        (opt, i) =>
          `<button class="answer-btn opt-${i} opt-c${i}" data-index="${i}">
            <span class="option-letter">${OPTION_LABELS[i]}</span>
          </button>`
      )
      .join("");
    qcmWrap.querySelectorAll(".answer-btn").forEach((btn) => {
      btn.addEventListener("click", () => submitAnswer({ value: Number(btn.dataset.index) }));
    });
  }

  // Joker 50/50
  const can5050 = q.allowJoker5050 && !me.joker5050Used && q.type !== "estimation";
  document.getElementById("btn5050").style.display = can5050 ? "inline-flex" : "none";

  // Joker Copieur
  const canCopieur = q.allowJokerCopieur && !me.jokerCopieurUsed;
  copieurWrap.style.display = canCopieur ? "flex" : "none";
  if (canCopieur) {
    const select = document.getElementById("copieurSelect");
    const others = Object.entries(allPlayers).filter(([id]) => id !== myId);
    select.innerHTML =
      `<option value="">Choisir un joueur à copier...</option>` +
      others.map(([id, p]) => `<option value="${id}">${p.name}</option>`).join("");
  }

  jokerBar.style.display = can5050 || canCopieur ? "flex" : "none";

  showScreen("question");
}

document.getElementById("btn5050").addEventListener("click", async () => {
  const optionButtons = document.querySelectorAll("#pQcmOptions .answer-btn");
  if (optionButtons.length !== 4) return; // pas de 50/50 en estimation
  const correctIndex = window.__lastQuestion.correctIndex;
  const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex);
  // Masque 2 mauvaises réponses au hasard
  const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
  hidden5050Indices = shuffled.slice(0, 2);
  hidden5050Indices.forEach((i) => {
    const btn = document.querySelector(`#pQcmOptions .opt-${i}`);
    if (btn) {
      btn.disabled = true;
      btn.classList.add("hidden-option");
    }
  });
  document.getElementById("btn5050").disabled = true;
  await db.ref(`answers/${currentQuestionKey}/${myId}`).update({ usedJoker5050: true }).catch(() => {});
});

document.getElementById("btnCopier").addEventListener("click", async () => {
  const targetId = document.getElementById("copieurSelect").value;
  if (!targetId) return;
  await submitAnswer({ copyTargetId: targetId });
});

document.getElementById("btnEstimationSubmit").addEventListener("click", async () => {
  const val = parseFloat(document.getElementById("estimationInput").value);
  if (Number.isNaN(val)) return;
  await submitAnswer({ value: val });
});

async function submitAnswer(payload) {
  if (hasAnsweredThisQuestion || !currentQuestionKey) return;
  hasAnsweredThisQuestion = true;
  await db.ref(`answers/${currentQuestionKey}/${myId}`).update({
    ...payload,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  });
  showScreen("answered");
}

// ---------- Reveal ----------
function renderReveal(reveal) {
  const mine = (reveal.scored || {})[myId];
  const box = document.getElementById("pRevealResult");
  if (!mine) {
    box.textContent = "Pas de réponse enregistrée pour cette question.";
  } else if (mine.points > 0) {
    box.textContent = `Bien joué ! +${mine.points} points 🎉`;
    box.className = "reveal-box win";
  } else {
    box.textContent = "Pas de points cette fois-ci.";
    box.className = "reveal-box lose";
  }
  showScreen("reveal");
}

// ---------- Leaderboard / Finished ----------
function renderLeaderboard(players) {
  const sorted = Object.values(players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  document.getElementById("pLeaderboardList").innerHTML = sorted
    .map((p, i) => `<div class="lb-row"><span class="lb-rank">${i + 1}</span><span class="lb-name">${p.name}</span><span class="lb-score">${p.score || 0} pts</span></div>`)
    .join("");
  showScreen("leaderboard");
}

function renderFinished(players) {
  const sorted = Object.values(players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  const mine = players[myId];
  const rank = sorted.findIndex((p) => p.name === (mine || {}).name) + 1;
  document.getElementById("pFinalRank").textContent = rank ? `Tu termines ${rank}${rank === 1 ? "er" : "ème"} !` : "";
  document.getElementById("pFinalScore").textContent = mine ? `${mine.score || 0} points` : "";
  showScreen("finished");
}

// ---------- Main listeners ----------
db.ref("players").on("value", (snap) => {
  allPlayers = snap.exists() ? snap.val() : {};
});

db.ref("session").on("value", (snap) => {
  if (!myId) return; // pas encore connecté
  const session = snap.exists() ? snap.val() : { phase: "lobby" };
  const phase = session.phase || "lobby";

  if (phase === "lobby") {
    showScreen("waiting");
  } else if (phase === "question" && session.currentQuestion) {
    currentQuestionKey = session.currentQuestion.key;
    window.__lastQuestion = session.currentQuestion;
    renderQuestion(session.currentQuestion);
  } else if (phase === "reveal" && session.reveal) {
    renderReveal(session.reveal);
  } else if (phase === "leaderboard") {
    renderLeaderboard(allPlayers);
  } else if (phase === "finished") {
    renderFinished(allPlayers);
  }
});

buildLoginButtons();

// Reconnexion automatique si on a déjà un identifiant en mémoire locale
// (utile si le téléphone se met en veille ou si la page est rechargée).
(async function tryAutoReconnect() {
  if (!myId) return;
  const snap = await db.ref(`players/${myId}`).get();
  if (snap.exists()) {
    myName = snap.val().name;
    document.getElementById("myNameLabel").textContent = myName;
    await db.ref(`players/${myId}/connected`).set(true);
    showScreen("waiting");
  } else {
    myId = null;
    localStorage.removeItem(STORAGE_KEY);
  }
})();
