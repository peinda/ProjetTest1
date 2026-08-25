# Baba Robe & Diverss — Gestion Boutique

Application mobile (iPhone) de gestion de stock, ventes et caisse pour un commerce acceptant les paiements en **Espèces**, **Wave** et **Orange Money**.

Ce projet implémente le [Cahier des charges](./Cahier_des_charges_App_Gestion_Boutique.md) : Stock, Ventes, Caisse/Répartition, Dettes clients et Tableau de bord, en React Native (Expo) avec stockage local SQLite (fonctionnement 100% hors-ligne).

## Démarrage

```bash
npm install
npx expo start
```

Scannez le QR code avec l'app **Expo Go** sur iPhone, ou lancez sur un simulateur iOS avec `npm run ios` (nécessite un Mac).

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
