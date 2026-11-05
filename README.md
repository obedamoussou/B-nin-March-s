# Bénin · Marchés modernes — Cartographie

Carte interactive des marchés modernes du Bénin, organisée par **pôle de développement**.

> Le fonctionnement détaillé (source des données, règles de lecture, mise à jour) est décrit dans [docs/FONCTIONNEMENT.md](docs/FONCTIONNEMENT.md).

## Démarrer

```bash
npm install      # une seule fois
npm run dev      # développement → http://localhost:5173
npm run build    # version de production dans dist/
```

## Fonctionnalités

- **Carte** du Bénin découpée en pôles colorés ; les noms des pôles sont à côté du pays, reliés par une flèche.
- Chaque marché est un **marqueur** dont la couleur indique l'état des infrastructures.
- **Panneau des pôles** : nombre de marchés, taux d'occupation moyen, répartition par état ; clic → liste des marchés du pôle, regroupés par ville.
- **Filtres** : par activité (boucherie, poissonnerie…) et par état des infrastructures.
- **Recherche** : marché, activité, pôle ou ville.
- **Fiche d'un marché** :
  - taux d'occupation et taux de recouvrement des redevances du trimestre en cours (cercles) ;
  - évolution mensuelle des deux taux (graphique, avec les valeurs en tableau) ;
  - état des infrastructures, dates de dernière et prochaine évaluation ;
  - activités, actions à entreprendre, et toute colonne ajoutée plus tard.
- Actualisation automatique toutes les 5 minutes ; copie de secours si le classeur est injoignable.
- Adapté au mobile.
