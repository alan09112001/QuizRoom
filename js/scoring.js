// ============================================================
// SCORING — aucune question ni réponse n'est stockée ici.
// ============================================================

const POINTS_QCM_CORRECT = 100;
const POINTS_ESTIMATION_TIERS = [100, 75, 50, 30]; // puis 10 pour les suivants
const POINTS_ESTIMATION_DEFAULT = 10;

/**
 * Résout la valeur finale d'un joueur pour une question, en tenant compte
 * du joker "Copieur" (qui pointe vers la réponse d'un autre joueur).
 * Protégé contre les chaînes de copie et les cycles.
 */
function resolveFinalAnswer(playerId, rawAnswers, visited = new Set()) {
  if (visited.has(playerId)) return undefined; // cycle -> pas de réponse valide
  visited.add(playerId);
  const entry = rawAnswers[playerId];
  if (!entry) return undefined;
  if (entry.copyTargetId) {
    return resolveFinalAnswer(entry.copyTargetId, rawAnswers, visited);
  }
  return entry.value;
}

/**
 * Calcule les points pour une question de type QCM ou Intrus.
 * rawAnswers: { playerId: { value: number, copyTargetId?: string } }
 * Retourne { playerId: { points, finalValue, correct } }
 */
function scoreQcmOrIntrus(rawAnswers, correctIndex) {
  const result = {};
  for (const playerId of Object.keys(rawAnswers)) {
    const finalValue = resolveFinalAnswer(playerId, rawAnswers);
    const correct = finalValue === correctIndex;
    result[playerId] = {
      points: correct ? POINTS_QCM_CORRECT : 0,
      finalValue,
      correct
    };
  }
  return result;
}

/**
 * Calcule les points pour une question de type Estimation ("Juste Prix").
 * Classement par proximité à la valeur correcte ; les ex-aequo partagent
 * le même rang (et donc les mêmes points).
 */
function scoreEstimation(rawAnswers, correctValue) {
  const resolved = Object.keys(rawAnswers).map((playerId) => {
    const finalValue = resolveFinalAnswer(playerId, rawAnswers);
    const numeric = typeof finalValue === "number" ? finalValue : null;
    const diff = numeric === null ? Infinity : Math.abs(numeric - correctValue);
    return { playerId, finalValue: numeric, diff };
  });

  resolved.sort((a, b) => a.diff - b.diff);

  const result = {};
  let rank = 0;
  let lastDiff = null;
  resolved.forEach((entry, idx) => {
    if (entry.diff === Infinity) {
      result[entry.playerId] = { points: 0, finalValue: entry.finalValue, diff: null };
      return;
    }
    if (lastDiff === null || entry.diff !== lastDiff) {
      rank = idx; // rang 0-based, gère les ex-aequo
      lastDiff = entry.diff;
    }
    const points = POINTS_ESTIMATION_TIERS[rank] ?? POINTS_ESTIMATION_DEFAULT;
    result[entry.playerId] = { points, finalValue: entry.finalValue, diff: entry.diff };
  });
  return result;
}

/**
 * Point d'entrée unique utilisé par host.js
 */
function scoreQuestion(type, rawAnswers, correctAnswer) {
  if (type === "estimation") {
    return scoreEstimation(rawAnswers, correctAnswer);
  }
  return scoreQcmOrIntrus(rawAnswers, correctAnswer);
}
