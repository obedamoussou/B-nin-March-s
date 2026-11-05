# Fonctionnement détaillé

Même architecture que la cartographie des infrastructures culturelles : site statique React + Leaflet qui lit directement le classeur Google Sheets.

```
Google Sheet « Cartographie Anagem »  ──(CSV, lecture seule)──►  Application React  ──►  Carte Leaflet
   ├─ Général                                 │
   ├─ Statistiques                            ├─ limites des 77 communes (fichier local)
   └─ Villes et Poles                         └─ copie de secours (fichier local)
```

## 1. Condition indispensable : le partage

Le classeur doit être partagé en **« Tous les utilisateurs disposant du lien » → « Lecteur »**. Sinon l'application affiche « Hors ligne · copie locale » et utilise [src/lib/snapshot.js](../src/lib/snapshot.js).

Configuration : [src/lib/config.js](../src/lib/config.js) (`SHEET_ID` et `gid` de chaque onglet).

## 2. Les données

### 2.1 Onglet « Général » (une ligne = un marché)

La ligne d'en-tête est repérée automatiquement (celle qui contient « Marchés ») ; la colonne A vide est ignorée. Les colonnes sont reconnues par le **début de leur titre** (accents et majuscules indifférents) :

| Colonne | Reconnue par | Utilisation |
|---|---|---|
| Marchés | `marches`, `marche`, `nom` | Nom (obligatoire) |
| Villes | `ville`, `commune` | Position sur la carte, regroupement |
| Pole de développement | `pole`, `zone` | Pôle de rattachement |
| Activités | `activite` | Séparées par des virgules → filtres et étiquettes de la fiche |
| Taux d'occupation Trimestre en cours | `tauxdoccupation` | Cercle dans la fiche, moyenne par pôle |
| Taux de recouvrement des redevances Trimestre en cours | `tauxderecouvrement` | Cercle dans la fiche |
| Etat des infrastructures | `etat` | Couleur du marqueur, jauge, filtre |
| Date de la dernière / prochaine évaluation | `datedeladerniere`, `datedelaprochaine` | Fiche (+ alerte si dépassée) |
| Actions à entreprendre | `actions` | Fiche |
| *(facultatif)* Coordonnées GPS ou Latitude / Longitude | `coordonnees`, `gps`, `latitude`, `longitude` | Position exacte |

Toute autre colonne apparaît dans « Autres informations ».

**Taux** : `60,00%`, `60 %`, `60` ou `0,6` donnent tous 60 %.

**États** : Bon · Satisfaisant · Moyen · Mauvais · Critique · Non déterminé (case vide ou « A préciser »).

### 2.2 Onglet « Statistiques » (évolution mensuelle)

- Une ligne d'en-tête nomme les marchés, chacun sur **deux colonnes** : « Taux d'occupation » puis « Taux de recouvrement des redevances ».
- **« Marché N » désigne le N-ième marché de l'onglet « Général »** (dans l'ordre des lignes : Marché 1 = Agla Hlazounto, Marché 2 = Ahouangbo…). On peut aussi écrire directement le nom du marché à la place de « Marché N » : il est alors reconnu par son nom, quel que soit l'ordre.
- Une ligne par mois (Janvier → Décembre) ; la colonne « Trimestre » sert seulement de repère.
- Dans la fiche : graphique des deux taux sur l'année (un trait s'interrompt sur les mois non renseignés), survol mois par mois, et bouton « Voir les valeurs » pour le tableau.

### 2.3 Onglet « Villes et Poles »

Identique à l'autre projet : nom du pôle sur la première ville du groupe, puis une commune par ligne. Les pôles sont dessinés en fusionnant leurs communes.

## 3. Mise à jour de la copie de secours

[src/lib/snapshot.js](../src/lib/snapshot.js) contient les trois onglets sous forme de lignes. À rafraîchir de temps en temps (copier les lignes du classeur), puis `npm run build`.
