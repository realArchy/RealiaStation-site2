# Le récit du site — actes et phases

Note de travail, 20 novembre 2026. Appliqué au site au commit `5c993cc`.

## Le principe

Le récit personnel et la feuille de route ne se numérotent pas de la même façon.

- **Actes 0 → 3** : le chemin parcouru, raconté au passé.
- **2006 — le reboot** : l'accident. Ce n'est pas une étape, c'est la charnière entre deux vies.
- **Phases 1 → 3** : la feuille de route, au futur. L'acte 3 *est* la phase 1.

## La chronologie

| Repère | Titre | Contenu |
|---|---|---|
| 2006 | **Le reboot** | L'accident. Une vie s'arrête, une autre commence. Non numéroté : c'est la charnière |
| 2014 | **Acte 0 — L'étincelle** | 12 juin, Coupe du monde, São Paulo : le patient paraplégique qui donne le coup d'envoi avec l'exosquelette de Miguel Nicolelis |
| — | **Acte 1 — La vague** | L'avènement de l'IA, la prise de conscience, la RealiaStation pensée puis assemblée (machine de calcul d'abord) |
| — | **Acte 2 — L'autodidaxie** | La fin de l'étude en solitaire, la méthode, la mise en pratique |
| — | **Acte 3 — L'intelligence & le virtuel** | Reprise de l'ancienne phase 1 : le jumeau numérique, le banc d'essai ouvert |

## Les phases (inchangées)

1. L'intelligence & le virtuel
2. Le matériel & les fonds
3. L'Îlot Intégré à Madagascar

Le bloc « Phase 0 → 3 » de la page RealiaStation (fondations juridiques, token hôtel,
FabLab, réseau mondial) garde sa propre numérotation : c'est une feuille de route
économique, pas le récit.

## Ce qui a changé dans le code

| Fichier / clé | Avant | Après |
|---|---|---|
| `index.titre_1`, `index.titre`, `index.banniere` | « De l'impulsion à l'étincelle » | « De l'étincelle à l'impulsion » (4 langues) |
| `index.reboot_titre` / `_txt` | — | nouveau bloc « Origine » sur l'accueil, avant le déclic de 2014 |
| `contenu_2.py` `social.actes_t`, `rbtt`, `a0t`…`a3d` | — | 5 cartes « Le chemin parcouru — les actes », avant les trois phases |
| `generer.py` | — | deux sections insérées (accueil + page sociale) |

Vérifié par capture : titre inversé, bloc 2006 lisible, cinq cartes rendues en deux
colonnes, aucun débordement, traductions EN/PT/ZH présentes.
