# Campagne de financement participatif — Français

*Dossier prêt à copier-coller sur Ulule / KissKissBankBank. Les montants sont des
estimations de devis, à ajuster avant publication.*

---

## Titre

**Capter l'étincelle — un exosquelette open source né d'une lésion C6-C7**

Variantes :
- « Il me reste un signal. Je veux le rendre au mouvement. »
- « De l'Amazonie à la neuro-robotique : un exosquelette open source »

## Accroche (2 lignes, pour la vignette)

> Une lésion médullaire incomplète n'efface pas tout : quand je commande à mes
> jambes de bouger, je sens l'influx descendre. Ce projet capte ce signal résiduel
> et le rend au mouvement — en open source.

---

## Le récit

### Ce que je sens encore

En 2016, un accident de voiture. Lésion médullaire **C6-C7 incomplète**.
Le diagnostic décrit ce qui ne fonctionne plus. Il ne décrit pas ce que je sens
tous les jours : **l'ordre de bouger part encore**, et il descend. Il n'atteint
pas toujours le muscle. Mais il existe, et il est mesurable.

C'est là que tout commence. Pas dans une théorie, dans une sensation.

### Ce que la forêt m'a appris avant

Avant l'accident, j'ai été *garimpeiro* et guide, organisateur d'expéditions dans
la forêt amazonienne des trois Guyanes. On y apprend trois choses qui ne
s'apprennent pas ailleurs : **lire un terrain**, **décider avec des informations
incomplètes**, et **repartir le lendemain** même quand la journée a mal tourné.

La R&D ressemble beaucoup à ça. Sauf qu'ici, le terrain, c'est un système nerveux.

### Ce que je construis

Un **exosquelette d'assistance en boucle fermée**, en deux étages :

- **« Le P'tit Rapide »** — la boucle dure, **sous 20 ms**, portée par la personne :
  acquisition EMG isolée galvaniquement, détection d'intention, commande des
  moteurs par bus CAN, stimulation électrique fonctionnelle (FES) avec fenêtre de
  *blanking* pour ne pas aveugler la mesure, et arrêt réflexe matériel.
- **« Le Penseur »** — le haut niveau, hors de la personne : jumeau numérique 3D
  (MuJoCo, Isaac Sim selon le GPU), journalisation, rejeu de séance. Relié au
  poste de terrain par un tunnel privé **Tailscale**, sans ouvrir aucun port.

**Le Penseur ne commande jamais un moteur.** C'est la règle qui rend le système
sûr : si le réseau tombe, la personne reste dans un état maîtrisé.

### Ce que l'argent finance — et ce qu'il ne finance pas

**Aucun modèle d'IA dans cette phase.** Les interfaces sont posées — topics ROS 2,
structures de messages, emplacements de modules — pour que les modèles se
branchent plus tard sans réécrire l'architecture. On ne vend pas une promesse
d'intelligence : on finance un banc d'essai honnête.

---

## Justification technique : pourquoi entraîner en 3D avant d'usiner

Trois raisons concrètes, pas une préférence.

1. **Un exosquelette mal réglé blesse.** La cinématique d'une hanche et d'un genou
   assistés dépend de la morphologie : longueurs de segments, alignement des axes,
   débattement utile. Tester ces réglages sur une machine physique, c'est usiner
   une pièce par essai. Dans un simulateur, c'est changer un nombre.
2. **La boucle doit être réglée avant d'être dangereuse.** Le seuil de détection
   d'intention, la latence, la rampe de couple : tout cela se règle sur des
   trajectoires rejouées, avec des mesures reproductibles. Sur une personne, chaque
   essai coûte de la fatigue et du risque.
3. **Le jumeau numérique devient l'archive.** Chaque séance enregistrée est
   rejouable : si une assistance fonctionne, on peut dire pourquoi, et la
   reproduire. Sans cela, on a des impressions, pas des résultats.

L'usinage vient après, sur des cotes validées. C'est plus lent au départ et
beaucoup plus rapide ensuite.

---

## Répartition des 1 350 € — Phase 1 « labo nomade »

| Poste | Détail | Estimation |
|---|---|---|
| Carte d'acquisition recherche | OpenBCI Cyton, 8 canaux, EEG/EMG | 620 € |
| Électrodes et consommables | électrodes sèches + gel + câbles | 80 € |
| Capteurs EMG de terrain | 2 × MyoWare 2.0 + câblage | 150 € |
| Dock Thunderbolt 3 | alimentation + ports pour poste nomade | 180 € |
| Écrans | 2 écrans supplémentaires (triple écran) | 320 € |
| **Total** | | **1 350 €** |

*Estimations à confirmer par devis. Les frais de plateforme et l'expédition des
contreparties ne sont pas inclus.*

**Pourquoi ce matériel, et pas autre chose :** l'OpenBCI donne des signaux
exploitables et documentés, comparables à la littérature ; le MyoWare permet de
tester en déplacement sans risquer la carte de laboratoire ; le dock et les écrans
transforment un portable en poste de travail, ce qui est la condition même du
travail de terrain.

---

## Paliers (Stretch Goals)

| Palier | Ce que ça débloque |
|---|---|
| **1 800 €** | Capteurs de sécurité : IMU BNO085 ×2, LiDAR LD19, radar mmWave RD-03D — le portique devient surveillé |
| **2 500 €** | Alimentation isolée + banc de mesure : première validation électrique sérieuse |
| **4 000 €** | Premier actionneur : moteur BLDC + réducteur + driver CAN, banc d'assistance à vide |
| **6 000 €** | Module FES et électronique de blanking — l'étape qui change la nature du projet |

Chaque palier atteint est annoncé, documenté et publié — y compris s'il échoue.

---

## Contreparties

Toutes **immatérielles** : rien à fabriquer, rien à expédier, tout va au projet.

| Montant | Contrepartie |
|---|---|
| **5 €** | Merci nominatif dans les crédits du dépôt et sur le site |
| **15 €** | Accès au **carnet de bord** hebdomadaire : ce qui a marché, ce qui a cassé, les cotes fausses |
| **30 €** | Le **pack des schémas** en haute définition, sous licence ouverte, dès qu'ils existent |
| **60 €** | Visio mensuelle de 30 min : questions techniques sans filtre, y compris « pourquoi ça ne marche pas » |
| **120 €** | Votre nom sur la **plaque du prototype** + vote sur les priorités du mois suivant |
| **250 €** | Atelier d'une heure pour votre structure (association, école, fablab) sur la conception d'un exo low-cost |
| **500 €** | Le nom de votre structure sur la page « partenaires » et dans chaque rapport de phase |

**Ce que je ne promets pas :** aucune contrepartie médicale, aucun accès
privilégié à un dispositif, aucune garantie de résultat clinique. Ce serait
malhonnête et dangereux.

---

## Calendrier

| Quand | Quoi |
|---|---|
| Immédiat | Conception, analyse de risques, choix des composants (dépôt public) |
| +1 mois | Réception du matériel, premières acquisitions EMG, publication des mesures brutes |
| +3 mois | Boucle Système 1 sur banc : capteur → intention → actionneur simulé, latence mesurée |
| +6 mois | Harnais passif et portique, capteurs de sécurité en place |

---

## Transparence

- **Le code et les plans sont publics** dès qu'ils existent, même imparfaits.
- **Les mesures brutes sont publiées**, y compris celles qui contredisent mes hypothèses.
- **Les échecs sont racontés.** Un projet de santé qui ne montre que ses réussites
  n'informe personne.
- **Aucun essai sur une personne** sans analyse de risques écrite, validation
  électrique, supervision clinique et avis d'éthique.

---

## Ce que je demande, et pourquoi maintenant

Le matériel de la Phase 1 est ce qui sépare une idée d'un banc d'essai. À partir
de là, tout devient mesurable — et une fois que c'est mesurable, ça se corrige.

**Suivez-moi dès maintenant.** Même sans contribuer : un projet de rééducation
neuro-robotique open source n'existe que si des gens regardent ce qu'il produit.
