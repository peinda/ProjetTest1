# Baba Robe & Diverss — Gestion Boutique

Application mobile (iPhone) de gestion de stock, ventes et caisse pour un commerce acceptant les paiements en **Espèces**, **Wave** et **Orange Money**.

Ce projet implémente le [Cahier des charges](./Cahier_des_charges_App_Gestion_Boutique.md) : Stock, Ventes, Caisse/Répartition, Dettes clients et Tableau de bord, en React Native (Expo) avec stockage local SQLite (fonctionnement 100% hors-ligne).

## Démarrage rapide sur iPhone (Expo Go — gratuit, immédiat)

1. Sur l'iPhone 13 : installer l'app **Expo Go** depuis l'App Store.
2. Sur l'ordinateur (même réseau Wi-Fi que l'iPhone) :
   ```bash
   npm install
   npx expo start
   ```
3. Un QR code s'affiche dans le terminal. Le scanner avec l'appareil photo de
   l'iPhone (ou directement dans Expo Go) — l'app se lance.

Chaque redémarrage de `npx expo start` doit être fait dans un vrai terminal
interactif (pas en tâche de fond) : Windows peut demander une autorisation
pare-feu pour l'accès réseau au premier lancement, à accepter pour que le
téléphone puisse joindre le serveur.

Limite d'Expo Go : pas d'icône propre sur l'écran d'accueil, et certains
modules natifs très spécifiques ne fonctionneraient pas (tous ceux utilisés
ici — SQLite, Face ID, PDF — sont compatibles).

Pour un aperçu rapide dans un navigateur (utile pour le développement, pas pour tester sur le téléphone) : `npx expo start --web`.

## Build iPhone réel installable (EAS Build)

Pour obtenir une vraie app avec sa propre icône, installable sans Expo Go
(TestFlight ou lien direct). Le profil `eas.json` est déjà prêt
(development / preview / production), ainsi que l'icône, le splash screen et
le `buildNumber` dans `app.json`.

**Prérequis** (comptes à créer/posséder vous-même — étape que je ne peux pas
faire à votre place) :
- Un compte Expo (gratuit) sur [expo.dev](https://expo.dev)
- Un compte **Apple Developer Program** (99 $/an) — obligatoire dès qu'on
  installe une app hors Expo Go sur un iPhone physique, même en test interne

**Étapes**, dans un terminal interactif :

```bash
npm install -g eas-cli
eas login                              # connexion à votre compte Expo
eas build:configure                    # relie le projet à votre compte (1re fois)
eas build --platform ios --profile preview   # build installable (TestFlight / lien interne)
```

`eas build` demande ensuite vos identifiants Apple Developer (ou les laisse
gérer automatiquement les certificats). Une fois le build terminé, EAS donne
un lien pour l'installer via TestFlight, ou un lien direct pour un profil
`preview`/`development` (distribution interne).

Pour publier sur l'App Store plus tard : `eas build --profile production`
puis `eas submit --platform ios`.

## Architecture

```
App.tsx                     Point d'entrée : init DB, verrouillage PIN/Face ID, navigation
src/
  db/                        Couche de persistance SQLite (expo-sqlite)
    database.ts              Schéma + initialisation
    types.ts                 Types des entités
    products.ts, sales.ts,
    cash.ts, debts.ts         Fonctions CRUD par module
  context/AuthContext.tsx     Verrouillage par code PIN (SecureStore) + Face ID
  navigation/                 Bottom tabs + stacks par module
  screens/
    stock/                    Liste produits, formulaire, réappro, historique
    sales/                    Vente rapide, historique des ventes
    cash/                     Caisse du jour, avances, clôture, export PDF
    debts/                    Dettes clients, remboursements, historique
    dashboard/                Tableau de bord (jour / semaine / mois)
    LockScreen.tsx             Écran de code PIN / Face ID
  components/                 Button, Card, Field (UI réutilisable, gros boutons)
  theme/                      Couleurs, espacements, typographie
  utils/                      Dates, formatage FCFA, export PDF (fiche de caisse)
```

## Logique de répartition de caisse

Chaque soir, l'app calcule automatiquement la répartition théorique à partir de :
- **Ventes du jour** par mode de paiement (espèces / Wave / Orange Money)
- **Avances** enregistrées dans la journée (argent sorti du commerce pour créditer un client en Wave ou Orange Money)

Formules (voir `src/db/cash.ts`) :
- `Part Commerce = Ventes espèces − Avances Wave − Avances OM`
- `Part Wave = Ventes Wave + Avances Wave`
- `Part Orange Money = Ventes OM + Avances OM`

L'écran **Clôture du jour** permet de saisir les montants réellement comptés et affiche l'écart avec le calcul théorique.

## Hors périmètre (v1)

Conformément au cahier des charges : multi-utilisateurs, facturation NINEA/RC, synchronisation cloud automatique, version Android (le code reste toutefois portable vers Android si besoin).

## Prochaines étapes

1. Tester l'app avec le commerçant pour valider le déroulé exact de sa "caisse du soir"
2. Ajuster les seuils de stock faible et les libellés selon son usage réel
3. Envisager une sauvegarde cloud (Laravel + PostgreSQL/MySQL) en v2 si besoin
