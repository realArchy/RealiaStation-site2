# Harnais & portique — spécifications

*Document de conception, révision 0.1. Rien ici n'a été usiné ni testé sur une
personne. Les cotes sont des points de départ à valider par un mécanicien et un
kinésithérapeute avant toute fabrication.*

---

## 1. Ce que le harnais doit faire — et ne pas faire

Il doit :

1. **Tenir le bassin et le thorax** dans une posture reproductible, pour que deux
   séances se comparent.
2. **Reprendre une partie du poids du corps** (délestage), pour que les muscles
   disponibles travaillent sans porter tout.
3. **Ne pas masquer l'intention** : un harnais trop rigide empêche le buste de
   bouger, et le signal postural que l'on veut mesurer disparaît.
4. **Rester confortable 30 minutes**, sans point de pression sur une peau qui n'a
   plus toujours d'alerte sensitive (zone à risque d'escarre chez une lésion
   médullaire).

Il ne doit pas :

- créer un chemin conducteur vers la personne (voir §6),
- permettre une chute libre si un élément casse (§5.4),
- dépendre d'un logiciel pour s'arrêter (§5.3).

---

## 2. Architecture mécanique

### 2.1 Harnais pelvien

- **Ceinture sous-abdominale** rigide à l'arrière, souple sur les côtés, appui sur
  les crêtes iliaques et le sacrum. Largeur d'appui ≥ 80 mm pour répartir.
- **Sangle sous-fessière** en Y, réglable, qui empêche la remontée du bassin quand
  le délestage tire vers le haut.
- Fermetures : **deux boucles à cliquet** indépendantes (pas une seule sangle
  centrale : si elle lâche, tout lâche).
- Interfaces peau : textile respirant, coutures plates, aucune couture sous le
  sacrum.

### 2.2 Harnais thoracique

- **Deux appuis scapulaires** (pas un carcan circulaire : la cage thoracique doit
  pouvoir se déformer pour respirer).
- Sangle de rappel réglable entre les deux, pour ajuster l'extension sans
  comprimer l'abdomen.
- **Zone libre sous les aisselles** : aucune pression sur le creux axillaire
  (paquet vasculo-nerveux).

### 2.3 Liaison harnais → portique

- **Deux points de tirage** (un par côté), pas un point unique : un point unique
  laisse le bassin basculer latéralement.
- Mousquetons à doigt, verrouillage visuel, ouverts d'une seule main.
- Longueur de sangle réglable à la sangle, pas au nœud.

---

## 3. Portique d'entraînement

### 3.1 Géométrie

```
        ┌──────────────────── rail supérieur (acier, 60 × 60 mm) ───────────────────┐
        │                     ▲ délestage (ressorts / contrepoids)                  │
        │                     │                                                     │
        │            ┌────────┴────────┐                                            │
        │            │  chariot + poulie                                            │
        │            └────────┬────────┘                                            │
        │                     │  sangle → harnais                                   │
        │                                                                           │
        │   barres parallèles (2 × 2 m)                              barres        │
        │   hauteur réglable 700–1100 mm                             parallèles    │
        └───────────────────────────────────────────────────────────────────────────┘
                        emprise au sol conseillée : 2,2 × 1,4 m
```

- **Barres parallèles latérales** : tube acier 42 mm, hauteur réglable
  700–1100 mm, écartement réglable 500–700 mm. Ce sont à la fois le repère
  gestuel et la protection latérale.
- **Rail supérieur** au-dessus de la ligne de marche, longueur ≥ 2 m, pour que le
  chariot suive sans contraindre la trajectoire.
- **Chariot** sur galets, frein à manque de courant (le chariot se bloque si
  l'alimentation tombe).

### 3.2 Délestage

Deux familles, à trancher selon l'usage :

| Solution | Avantage | Limite |
|---|---|---|
| **Ressorts** (élastiques ou à gaz) | simple, pas de masse mobile, peu coûteux | force croissante avec l'allongement, non linéaire |
| **Contrepoids** | force constante sur la course | masse à déplacer, encombrement, inertie |

Pour une première version : **ressorts à gaz avec réglage de précharge**, avec un
**dynamomètre en ligne** pour connaître la force réellement appliquée. Sans
mesure, le délestage est une impression, pas un paramètre.

### 3.3 Réglages à prévoir dès la conception

- hauteur du rail (pour un sujet assis, debout, ou en suspension partielle),
- longueur des sangles de tirage,
- position du chariot au repos,
- précharge du délestage.

Chaque réglage doit avoir **un repère chiffré** (graduation, index, butée), sinon
il n'est pas reproductible d'une séance à l'autre.

---

## 4. Capteurs — ce qu'ils apportent et où ils se montent

| Capteur | Position | Grandeur | Usage | Débit |
|---|---|---|---|---|
| **BNO085** | thorax (T4) et bassin (sacrum) | orientation absolue (quaternion), accélération | inclinaison du tronc, détection de chute, symétrie | 100 Hz |
| **LD19** (LiDAR 2D) | pied du portique, à 200 mm du sol, axe horizontal | distances 0,02–12 m, 360° | seuil de sécurité : obstacle sur la trajectoire, distance au sol, détection de chute du segment | 10 Hz |
| **RD-03D** (radar mmWave) | montant latéral, hauteur poitrine | présence, vitesse radiale | détection de présence et d'immobilité anormale, insensible à la lumière et au port de vêtements | 10 Hz |
| **Fin de course** | rail, butées basses | tout ou rien | empêche la course hors limites | événementiel |
| **Dynamomètre en ligne** | sangle de délestage | force (N) | mesure du délestage réel | 50 Hz |

**Règle d'implantation** : aucun capteur ne doit être monté sur une pièce qui
vibre avec les moteurs sans amortisseur. Un IMU collé sur un châssis qui résonne
mesure la résonance, pas le corps.

---

## 5. Sécurité

### 5.1 Chaîne d'arrêt

```
  bouton coup-de-poing (paume, sur les barres)
        │  contact à ouverture, câblé en série dans la bobine du relais
        ▼
  relais de sécurité (bobine à manque de courant)
        │
        ├──► coupe la puissance moteurs (contacteur)
        ├──► coupe la stimulation FES
        └──► signale l'état au Système 1 (entrée de sécurité, pas un topic)
```

Le logiciel **lit** l'état d'arrêt ; il ne le **produit** jamais.

### 5.2 Limites réflexes côté variateur

- couple maximum réglé dans le driver, pas dans le nœud ROS,
- vitesse maximum idem,
- rampe d'accélération bornée,
- surveillance de l'écart de position (si le moteur décroche, on arrête).

### 5.3 Séparation des domaines

| Domaine | Alimentation | Isolation |
|---|---|---|
| Mesure EMG | batterie, DC-DC isolé | ≥ 2 MOPP vers la personne |
| Commande moteurs | 48 V batterie | optocoupleur / isolateur numérique sur le CAN |
| Stimulation FES | courant constant, limite réglée matériellement | transformateur d'impulsion, condensateur de couplage, jamais de référence commune avec la mesure |
| PC et réseau | secteur | Ethernet magnétique ou fibre, jamais de masse commune |

### 5.4 Analyse de défaillance — les quatre cas à traiter

1. **Perte d'alimentation** : le relais retombe, les freins serrent, le chariot se
   bloque. La personne reste suspendue au harnais (prévoir une redescente
   manuelle).
2. **Rupture d'une sangle** : deux points de tirage, deux sangles indépendantes ;
   une rupture ne doit pas provoquer de chute libre (mousqueton de secours sur le
   rail).
3. **Emballement logiciel** : watchdog matériel qui coupe si le nœud n'a pas
   répondu en 50 ms.
4. **Stimulation pendant la mesure** : fenêtre de blanking ; sans elle l'EMG ne
   mesure que l'artefact de stimulation.

---

## 6. Le blanking FES — pourquoi c'est structurant

Un amplificateur EMG placé près d'un muscle stimulé sature pendant l'impulsion.
La parade classique : **aveugler l'acquisition** pendant la stimulation et un
court temps de récupération (quelques ms), puis reprendre.

Conséquences de conception, à intégrer dès le premier circuit :

- le **signal de blanking** doit venir du générateur de stimulation, pas du
  logiciel — un retard logiciel rend la fenêtre imprévisible ;
- la **fréquence de stimulation** doit être connue du Système 1 (topic dédié) ;
- l'estimation d'intention doit tolérer des **trous d'échantillons** : la fenêtre
  glissante ne peut pas supposer une acquisition continue.

---

## 7. Ce qui reste à décider

| Question | Pourquoi elle bloque la suite |
|---|---|
| Ressorts ou contrepoids ? | détermine la structure du rail et le budget |
| Sujet debout délesté, ou assis ? | détermine la hauteur des barres et la géométrie du harnais |
| FES dans la Phase 2 ou plus tard ? | la FES impose l'isolation et le blanking dès le premier circuit |
| 4 ou 8 canaux EMG ? | détermine le boîtier, le câblage et le coût |
