# 🎬 Quiz Room — Quiz familial en temps réel

Application "façon plateau TV" pour jouer en famille : un grand écran (TV/PC branché
au vidéoprojecteur), et une télécommande sur le smartphone de chaque joueur. Tout est
synchronisé en temps réel via **Firebase Realtime Database**. Aucun serveur à héberger,
aucune installation requise sur les téléphones — juste un navigateur.

⏱️ Durée prévue : 30 à 45 minutes, 27 questions réparties sur 7 manches (Football,
Voitures, Belle-Île-en-Mer, Musique française, Spéciale Miss, Culture générale, et une
manche "Le Juste Prix" en estimation).

## ⚠️ Important — anti-spoiler

Le fichier `js/questions.data.js` contient **toutes les questions et les bonnes
réponses**. Il est nécessaire au fonctionnement du jeu, mais :
- **Ne l'ouvre pas** avant la partie (ni dans un éditeur, ni sur GitHub).
- Le poste **régie** (`host.html`, piloté par la personne qui anime) n'affiche jamais
  ce texte à l'écran — il montre seulement la manche, le type de question et la
  progression. Évite simplement d'ouvrir la console développeur (F12) pendant la partie.
- Techniquement, comme il n'y a pas de serveur "backend" caché (tout tourne dans le
  navigateur), une personne très curieuse qui irait fouiller le code ou la console
  Firebase pourrait voir les réponses. Pour un après-midi en famille, on part du
  principe que personne ne va tricher — ce n'est pas conçu comme une sécurité
  inviolable.

---

## 1. Créer le projet Firebase (5 min)

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) et connecte-toi
   avec un compte Google.
2. Clique sur **Ajouter un projet**, donne-lui un nom (ex. `quiz-room-famille`), tu peux
   désactiver Google Analytics (pas nécessaire).
3. Une fois le projet créé, dans le menu de gauche : **Build > Realtime Database** →
   **Créer une base de données**.
   - Choisis une région proche (ex. `europe-west1`).
   - Sélectionne **Démarrer en mode test** (règles ouvertes pendant 30 jours — largement
     suffisant pour cet après-midi).
4. Toujours dans la console, clique sur l'icône ⚙️ **Paramètres du projet** (en haut à
   gauche) > onglet **Général** > descends jusqu'à **Vos applications** > clique sur
   l'icône **Web `</>`**.
5. Donne un surnom à l'app (ex. `quiz-room-web`) puis clique sur **Enregistrer l'application**
   (pas besoin de configurer l'hébergement Firebase).
6. Copie l'objet `firebaseConfig` qui s'affiche (il ressemble à ceci) :
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "quiz-room-famille.firebaseapp.com",
     databaseURL: "https://quiz-room-famille-default-rtdb.europe-west1.firebasedatabase.app",
     projectId: "quiz-room-famille",
     storageBucket: "quiz-room-famille.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
7. Colle ces valeurs dans le fichier **`js/firebase-config.js`** du projet, à la place
   des `"REMPLACE_MOI"`.

> Vérifie que `databaseURL` est bien présent — c'est le champ le plus souvent oublié,
> et sans lui rien ne se synchronise.

---

## 2. Mettre le code sur GitHub

Dans un terminal, à la racine du dossier `quiz-room` :

```bash
git init
git add .
git commit -m "Quiz Room - premiere version"
```

Crée un nouveau dépôt (de préférence **privé**, pour ne pas exposer les questions
publiquement) sur [github.com/new](https://github.com/new), puis :

```bash
git remote add origin https://github.com/<ton-utilisateur>/<ton-repo>.git
git branch -M main
git push -u origin main
```

### Activer GitHub Pages (pour que les téléphones puissent se connecter par internet)

1. Sur GitHub, va dans **Settings > Pages** de ton dépôt.
2. Dans **Build and deployment**, choisis **Deploy from a branch**, branche `main`,
   dossier `/ (root)`, puis **Save**.
3. Après 1-2 minutes, GitHub te donne une URL du type :
   `https://<ton-utilisateur>.github.io/<ton-repo>/`
4. Tes 3 pages sont alors accessibles à :
   - Écran TV : `https://<ton-utilisateur>.github.io/<ton-repo>/index.html`
   - Téléphones : `https://<ton-utilisateur>.github.io/<ton-repo>/player.html`
   - Régie (animateur) : `https://<ton-utilisateur>.github.io/<ton-repo>/host.html`

Avec un dépôt **privé**, GitHub Pages nécessite un compte GitHub Pro (ou une
organisation) pour être publié ; si ton compte est gratuit, deux solutions :
- Rendre le dépôt public juste le temps de jouer (les questions restent quand même
  dans `questions.data.js`, visibles si quelqu'un va chercher — acceptable pour une
  partie entre proches, mais à savoir), puis le repasser en privé après ;
- Ou utiliser un hébergement statique alternatif gratuit qui supporte le privé côté
  déploiement, comme **Netlify** ou **Vercel** (glisser-déposer le dossier `quiz-room`
  sur [app.netlify.com/drop](https://app.netlify.com/drop) donne une URL en quelques
  secondes, sans rien installer).

---

## 3. Tester en local (sans rien installer de lourd)

Le site est 100% statique (HTML/CSS/JS), donc n'importe quel petit serveur local
suffit. Deux options, au choix :

**Avec Python (déjà installé sur Mac/Linux, souvent aussi sur Windows) :**
```bash
cd quiz-room
python3 -m http.server 8000
```
Puis ouvre `http://localhost:8000/index.html` (écran TV) et
`http://localhost:8000/player.html` (téléphone, si le téléphone est sur le même Wi-Fi
que l'ordinateur — remplace `localhost` par l'adresse IP locale de l'ordinateur, ex.
`http://192.168.1.23:8000/player.html`).

**Avec Node.js (si déjà installé) :**
```bash
npx serve quiz-room
```

Pour jouer réellement en famille avec des téléphones potentiellement hors du même
Wi-Fi (4G/5G), la solution GitHub Pages / Netlify de l'étape 2 est la plus simple :
tout le monde ouvre juste un lien, où qu'il soit.

---

## 4. Est-ce que Claude peut tester le code lui-même ?

Partiellement, et voici pourquoi :

- Claude peut exécuter le code dans un environnement bac à sable (vérification de
  syntaxe JavaScript, structure HTML, présence des fichiers, lancement d'un mini
  serveur local) — **ce qui a déjà été fait** pour ce projet : tous les fichiers
  `.js` ont été validés syntaxiquement et toutes les pages se chargent correctement
  en local (code HTTP 200).
- En revanche, l'environnement d'exécution de Claude n'a **pas accès au réseau vers
  Firebase** (`googleapis.com`, `firebaseio.com`, `gstatic.com` ne sont pas autorisés
  dans son bac à sable réseau) : Claude ne peut donc pas se connecter à une vraie base
  Firebase, ni vérifier en direct la synchronisation temps réel entre plusieurs
  "joueurs" simulés.
- Claude n'a pas non plus accès à ton compte GitHub pour pousser du code à ta place —
  il te fournit les fichiers et les commandes exactes à exécuter toi-même.
- **Un dépôt GitHub public/privé ne change rien à cette limite réseau** : ce n'est pas
  un problème d'accès au repo, mais un problème d'accès sortant vers les domaines
  Firebase depuis le bac à sable de Claude.

En pratique : le code a été vérifié aussi loin que possible sans base Firebase réelle.
Le test grandeur nature (est-ce que les téléphones voient bien la question s'afficher,
etc.) se fera lors de ta première partie test — prévois 5 minutes avant que tout le
monde arrive pour vérifier que l'écran TV et un téléphone se répondent bien une fois
ta config Firebase collée.

---

## 5. Déroulé d'une partie

1. Ouvre `host.html` sur ton ordinateur (c'est ton poste de régie, garde-le pour toi).
2. Ouvre `index.html` sur l'écran/vidéoprojecteur du salon.
3. Clique sur **🔄 Nouvelle partie** dans la régie.
4. Donne le lien affiché sur l'écran TV (ou fais scanner le QR code) à chaque joueur,
   qui ouvre `player.html` sur son téléphone et choisit son prénom dans la liste
   (Louanne, Alan, Mewen, Tiphaine, Garance, Maryline), ou tape un autre prénom en
   mode libre.
5. Une fois tout le monde connecté (visible sur l'écran TV et dans la régie), clique
   sur **▶️ Lancer / Question suivante**.
6. Chaque joueur répond depuis son téléphone (20 secondes, chrono synchronisé affiché
   sur la TV). Deux jokers disponibles selon les manches :
   - 🕶️ **50/50** (une seule fois dans la partie) : masque deux mauvaises réponses.
   - 🎭 **Copieur** (une seule fois, manches 1 et 2 uniquement) : copie secrètement la
     réponse d'un autre joueur.
7. Quand tout le monde a répondu (ou que le temps est écoulé), clique sur
   **💡 Révéler la réponse** : la bonne réponse et les points gagnés s'affichent sur
   la TV et sur chaque téléphone.
8. Reclique sur **▶️ Question suivante** pour continuer. Le bouton **📊 Classement**
   permet d'afficher un classement intermédiaire entre deux manches si tu veux faire
   une pause.
9. À la fin, clique sur **🏁 Terminer la partie** : le podium final s'affiche sur
   la TV.

---

## 6. Barème des points

- **QCM / Intrus** : 100 points si la bonne réponse est choisie, 0 sinon.
- **Estimation ("Le Juste Prix")** : classement par proximité avec la vraie valeur —
  100 / 75 / 50 / 30 points pour les 4 plus proches, 10 points pour les suivants ; les
  ex-aequo partagent le même rang.
- Le joker **Copieur** fait hériter le joueur du résultat final de sa cible (donc des
  mêmes points qu'elle).

---

## 7. Ajouter, modifier ou raccourcir les questions

Tout se passe dans `js/questions.data.js`, avec ce format (exemple factice, à ne pas
utiliser tel quel) :

```js
{ id:"exXX", type:"qcm", prompt:"Exemple de question ?", options:["A","B","C","D"], correctIndex:0 }
{ id:"exYY", type:"intrus", prompt:"Trouvez l'intrus...", options:["A","B","C","D"], correctIndex:2 }
{ id:"exZZ", type:"estimation", prompt:"Exemple d'estimation ?", unit:"€", correctValue:42 }
```

Pour raccourcir la partie (viser plus proche de 30 min), retire simplement une ou deux
questions par manche dans le tableau `QUIZ_ROUNDS`. Pour l'allonger, ajoute des
questions sur le même modèle.

---

## 8. Après la partie

Pense à repasser le dépôt GitHub en privé si tu l'avais rendu public temporairement,
et éventuellement à supprimer le projet Firebase (Paramètres du projet > Général > tout
en bas > Supprimer le projet) si tu ne comptes pas rejouer — la base Realtime Database
en mode test n'est de toute façon ouverte que 30 jours.

Bonne partie ! 🎉
