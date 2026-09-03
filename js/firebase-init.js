// Chargé après firebase-config.js et les SDK compat Firebase.
if (typeof firebase === "undefined") {
  console.error("Le SDK Firebase n'est pas chargé. Vérifie ta connexion internet et les balises <script>.");
}

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} catch (e) {
  console.error("Erreur d'initialisation Firebase :", e);
}

// Décalage entre horloge locale et horloge serveur Firebase,
// utilisé pour synchroniser les chronomètres entre tous les écrans.
let serverTimeOffset = 0;
if (db) {
  db.ref(".info/serverTimeOffset").on("value", (snap) => {
    serverTimeOffset = snap.val() || 0;
  });
}
function nowServer() {
  return Date.now() + serverTimeOffset;
}
