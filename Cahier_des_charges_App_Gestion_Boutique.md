# Cahier des charges
## Application mobile de gestion de stock, ventes et caisse (Wave / Orange Money / Espèces)
### Baba Robe & Diverss

---

## 1. Contexte et objectifs

Le client (commerçant) gère une activité commerciale où il :
- Vend des produits en boutique
- Accepte des paiements en espèces, via **Wave** et via **Orange Money**
- Utilise parfois l'argent du commerce comme fonds de caisse pour effectuer des transactions Wave/Orange Money quand il n'a plus de solde sur ces comptes
- Fait chaque soir **"la caisse"** : il sépare manuellement l'argent qui appartient au commerce de celui qui appartient aux comptes Wave et Orange Money

**Objectif de l'application** : lui donner un outil simple et rapide sur iPhone pour suivre son stock, enregistrer ses ventes, et faire automatiquement la répartition de l'argent entre commerce / Wave / Orange Money chaque soir, afin de fiabiliser et accélérer ce qu'il fait aujourd'hui à la main.

---

## 2. Utilisateurs

- **Utilisateur unique** : le commerçant (pas de multi-compte prévu dans une v1)
- Usage prévu : sur iPhone, en boutique, plusieurs fois par jour

---

## 3. Périmètre fonctionnel

### 3.1 Module Stock

- Ajouter un produit (nom, catégorie optionnelle, prix d'achat, prix de vente, quantité initiale)
- Modifier / supprimer un produit
- Voir la liste des produits avec quantité restante en temps réel
- Alerte visuelle simple quand un produit atteint un seuil bas (ex. "stock faible")
- Historique des entrées de stock (réapprovisionnements)

### 3.2 Module Ventes

- Enregistrer une vente rapidement : sélection du produit, quantité vendue, prix (modifiable si négociation)
- Choix du mode de paiement à l'enregistrement : **Espèces / Wave / Orange Money**
- Décrément automatique du stock à chaque vente
- Historique des ventes du jour et des jours précédents (par date)
- Total vendu par jour, par produit, par mode de paiement

### 3.3 Module Caisse / Répartition Espèces – Wave – Orange Money

C'est le cœur de la demande : reproduire numériquement le travail que le commerçant fait chaque soir.

**Principe** : quand il n'a plus de fonds sur Wave ou Orange Money, il utilise l'argent des ventes en espèces pour "recharger" virtuellement ces comptes (il encaisse pour un client en Wave/OM avec l'argent physique du commerce). Chaque soir, il doit donc reconstituer :
- Combien d'argent physique appartient réellement au commerce
- Combien a été "avancé" pour Wave
- Combien a été "avancé" pour Orange Money

**Fonctionnalités proposées :**
- Enregistrer une transaction de type "avance" : ex. *"J'ai sorti 5000 F du commerce pour créditer un client en Wave"* → l'app enregistre que 5000 F est dû au commerce par le compte Wave
- Fiche de caisse journalière (semi-automatique) qui calcule :
  - Total des ventes en espèces
  - Total des ventes Wave
  - Total des ventes Orange Money
  - Total des avances faites (commerce → Wave, commerce → Orange Money)
  - Montant final à séparer : **part du commerce / part Wave / part Orange Money**
- Un écran "Clôture du jour" où il saisit/valide les montants réels comptés physiquement, et l'app compare avec le calcul théorique (permet de détecter un écart)
- Historique des clôtures journalières consultable

### 3.4 Module Dettes clients (crédit)

Pour les clients qui achètent sans payer immédiatement (vente à crédit).

- Enregistrer une dette : nom du client, numéro de téléphone (optionnel), montant dû, date, produit concerné (optionnel), note
- Marquer une dette comme partiellement ou totalement remboursée (avec date de remboursement)
- Liste des dettes en cours, triable par client ou par ancienneté
- Historique des dettes soldées
- Total des sommes dues à un instant donné (visible sur le tableau de bord)
- Rappel visuel pour les dettes anciennes (ex. non remboursées depuis X jours)

### 3.5 Tableau de bord

- Vue résumé du jour : ventes du jour, stock global restant, alerte stock faible
- Vue résumé par période (semaine / mois) : chiffre d'affaires par mode de paiement
- Total des dettes clients en cours

---

## 4. Exigences non-fonctionnelles

- **Plateforme** : application mobile légère pour **iPhone** uniquement dans un premier temps
- **Simplicité d'usage** : saisie rapide (le commerçant l'utilisera en boutique, parfois avec un client en face), peu d'étapes, gros boutons, peu de texte à taper
- **Fonctionnement hors-ligne** : les ventes doivent pouvoir être enregistrées même sans connexion internet (synchronisation plus tard si besoin d'une sauvegarde en ligne)
- **Sécurité d'accès** : verrouillage par code PIN ou Face ID à l'ouverture (données financières sensibles)
- **Langue** : français

---

## 5. Technologies recommandées

Vu que tu développes déjà en **React Native**, c'est le choix le plus cohérent avec ta stack actuelle plutôt qu'une app 100% native Swift — tu réutilises tes compétences et le code reste portable vers Android plus tard si besoin.

| Besoin | Techno recommandée | Pourquoi |
|---|---|---|
| Framework mobile | **React Native** (avec Expo si possible) | Cohérent avec ta stack, développement rapide, un seul code pour build iOS |
| Stockage local hors-ligne | **SQLite** (via `expo-sqlite` ou `react-native-sqlite-storage`) | Léger, fiable, adapté à un usage mono-utilisateur, fonctionne sans connexion |
| Verrouillage app | `expo-local-authentication` (Face ID / code PIN) | Intégration Face ID native simple depuis React Native |
| Export de la fiche de caisse | Génération PDF (ex. `react-native-html-to-pdf` ou équivalent) | Cohérent avec ton usage habituel des outils de génération de documents |
| Build & déploiement iPhone | **Expo (EAS Build)** ou Xcode en direct | Expo simplifie le build/signature pour tester sur son iPhone sans compte développeur payant au départ (via TestFlight ensuite) |
| Backend | Aucun au départ (v1 100% locale) | Pas besoin de Laravel/API tant que les données restent sur le téléphone ; à envisager plus tard uniquement si sauvegarde cloud demandée |

*Si une sauvegarde/synchronisation cloud est ajoutée dans une v2, ton stack Laravel + PostgreSQL/MySQL habituel conviendrait parfaitement comme backend, avec une API REST simple consommée par l'app React Native.*

---

## 6. Hors périmètre (v1)

- Multi-utilisateurs / multi-boutiques
- Facturation avec NINEA/RC (sauf besoin exprimé ultérieurement)
- Synchronisation cloud automatique
- Version Android

---

## 7. Prochaines étapes suggérées

1. Valider avec le commerçant le déroulé exact de sa "caisse du soir" (quels chiffres il compte, dans quel ordre) pour coller au plus près à son habitude
2. Prioriser les écrans : Vente rapide → Stock → Caisse/Clôture → Dettes clients → Tableau de bord
3. Définir une v1 minimale (MVP) : Stock + Ventes + Clôture de caisse simple + Dettes clients
