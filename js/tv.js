// ============================================================
// TV.JS — grand écran, lu par tous. Toutes les données affichées
// proviennent de Firebase (aucune question n'est codée ici).
// ============================================================

const OPTION_LABELS = ["A", "B", "C", "D"];

const screens = {
  lobby: document.getElementById("screen-lobby"),
  question: document.getElementById("screen-question"),
  reveal: document.getElementById("screen-reveal"),
  leaderboard: document.getElementById("screen-leaderboard"),
  finished: document.getElementById("screen-finished"),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => {
    node.classList.toggle("active", key === name);
  });
}

// ---------- Lobby ----------
function renderLobby(players) {
  const list = document.getElementById("lobbyPlayers");
  const ids = Object.keys(players || {});
  document.getElementById("lobbyCount").textContent = ids.length;
  list.innerHTML = ids
    .map((id) => `<span class="lobby-chip">${players[id].name}</span>`)
    .join("") || `<p class="dim">En attente des joueurs...</p>`;
}

// ---------- Question ----------
let timerInterval = null;

function renderQuestion(q, answers, players) {
  document.getElementById("qRoundTitle").textContent = q.roundTitle;
  document.getElementById("qPrompt").textContent = q.prompt;

  const optionsWrap = document.getElementById("qOptions");
  const estimationWrap = document.getElementById("qEstimation");

  if (q.type === "estimation") {
    optionsWrap.style.display = "none";
    estimationWrap.style.display = "block";
    document.getElementById("qUnit").textContent = q.unit ? `(en ${q.unit})` : "";
  } else {
    estimationWrap.style.display = "none";
    optionsWrap.style.display = "grid";
    optionsWrap.innerHTML = q.options
      .map(
        (opt, i) =>
          `<div class="option-tile opt-c${i}"><span class="option-letter">${OPTION_LABELS[i]}</span>${opt}</div>`
      )
      .join("");
  }

  const answeredCount = Object.keys(answers || {}).filter((k) => k !== "__scored").length;
  const totalPlayers = Object.keys(players || {}).length;
  document.getElementById("qAnsweredCount").textContent = `${answeredCount} / ${totalPlayers} ont répondu`;

  startTimer(q.startedAt, q.durationS);
}

function startTimer(startedAt, durationS) {
  clearInterval(timerInterval);
  const ring = document.getElementById("timerRing");
  const label = document.getElementById("timerLabel");

  function tick() {
    const elapsedMs = nowServer() - startedAt;
    const remaining = Math.max(0, durationS - elapsedMs / 1000);
    const pct = Math.max(0, remaining / durationS);
    ring.style.setProperty("--pct", pct);
    ring.classList.toggle("low", remaining <= 5);
    label.textContent = Math.ceil(remaining);
    if (remaining <= 0) clearInterval(timerInterval);
  }
  tick();
  timerInterval = setInterval(tick, 200);
}

// ---------- Reveal ----------
function renderReveal(q, reveal, players) {
  clearInterval(timerInterval);
  document.getElementById("revealRoundTitle").textContent = q ? q.roundTitle : "";
  document.getElementById("revealPrompt").textContent = q ? q.prompt : "";

  const answerWrap = document.getElementById("revealAnswer");
  if (q && q.type === "estimation") {
    answerWrap.textContent = `Bonne réponse : ${reveal.correctValue} ${q.unit || ""}`.trim();
  } else if (q) {
    answerWrap.textContent = `Bonne réponse : ${OPTION_LABELS[reveal.correctIndex]} — ${q.options[reveal.correctIndex]}`;
  }

  const list = document.getElementById("revealScores");
  const scored = reveal.scored || {};
  const rows = Object.keys(scored)
    .map((pid) => ({ pid, name: (players[pid] || {}).name || "?", ...scored[pid] }))
    .sort((a, b) => b.points - a.points);

  list.innerHTML = rows
    .map(
      (r) => `<div class="reveal-row ${r.points > 0 ? "win" : "lose"}">
        <span>${r.name}</span>
        <span>+${r.points} pts</span>
      </div>`
    )
    .join("");
}

// ---------- Leaderboard ----------
function renderLeaderboard(players) {
  const sorted = Object.values(players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  const list = document.getElementById("leaderboardList");
  list.innerHTML = sorted
    .map(
      (p, i) => `<div class="lb-row rank-${i + 1}">
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${p.name}</span>
        <span class="lb-score">${p.score || 0} pts</span>
      </div>`
    )
    .join("");
}

// ---------- Finished / Podium ----------
function renderFinished(players) {
  const sorted = Object.values(players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  const podium = document.getElementById("podium");
  const [first, second, third] = sorted;
  const step = (p, place) =>
    p
      ? `<div class="podium-step step-${place}">
          <div class="podium-name">${p.name}</div>
          <div class="podium-score">${p.score || 0} pts</div>
          <div class="podium-block">${place}</div>
        </div>`
      : "";
  podium.innerHTML = step(second, 2) + step(first, 1) + step(third, 3);

  const rest = document.getElementById("podiumRest");
  rest.innerHTML = sorted
    .slice(3)
    .map((p, i) => `<div class="lb-row"><span class="lb-rank">${i + 4}</span><span class="lb-name">${p.name}</span><span class="lb-score">${p.score || 0} pts</span></div>`)
    .join("");
}

// ---------- Main listener ----------
let latestPlayers = {};
let latestAnswers = {};

db.ref("players").on("value", (snap) => {
  latestPlayers = snap.exists() ? snap.val() : {};
  if (screens.lobby.classList.contains("active")) renderLobby(latestPlayers);
});

db.ref("session").on("value", (snap) => {
  const session = snap.exists() ? snap.val() : { phase: "lobby" };
  const phase = session.phase || "lobby";

  if (phase === "lobby") {
    showScreen("lobby");
    renderLobby(latestPlayers);
  } else if (phase === "question" && session.currentQuestion) {
    showScreen("question");
    const key = session.currentQuestion.key;
    db.ref(`answers/${key}`).on("value", (aSnap) => {
      latestAnswers = aSnap.exists() ? aSnap.val() : {};
      renderQuestion(session.currentQuestion, latestAnswers, latestPlayers);
    });
  } else if (phase === "reveal" && session.reveal) {
    showScreen("reveal");
    renderReveal(session.currentQuestion, session.reveal, latestPlayers);
  } else if (phase === "leaderboard") {
    showScreen("leaderboard");
    renderLeaderboard(latestPlayers);
  } else if (phase === "finished") {
    showScreen("finished");
    renderFinished(latestPlayers);
  }
});

const joinUrl = window.location.href.replace(/index\.html.*/, "player.html");
document.getElementById("joinLink").textContent = joinUrl;
document.getElementById("joinQr").src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(joinUrl)}`;
