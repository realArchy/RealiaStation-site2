# Neuro-Exo Project

**Rééducation neuro-robotique en boucle fermée, open source.**
*Closed-loop neuro-robotic rehabilitation, open source.*

> **Statut : conception et banc d'essai. Ce n'est pas un dispositif médical.**
> Aucun essai sur personne n'est prévu avant validation électronique, analyse de
> risques documentée et avis d'un comité d'éthique. Voir [Safety](#safety--sécurité).

---

## Français

### Le problème que l'on traite

Une lésion médullaire C6-C7 incomplète laisse parfois passer quelque chose : la
personne donne l'ordre de bouger, et **elle sent l'influx descendre** — même quand
le mouvement ne vient pas. Ce signal résiduel, ténu, est la matière première du
projet.

L'idée tient en une boucle : **capter cette intention motrice, l'assister au bon
moment, et répéter** — pour que le système nerveux réapprenne. La littérature
appelle cela la neuroplasticité guidée par l'effort ; nous l'appelons une
expédition de terrain.

### Deux systèmes, deux horloges

L'architecture sépare radicalement deux échelles de temps. Confondre les deux est
la faute de conception la plus répandue dans les exosquelettes de recherche.

```
┌──────────────────────────── SYSTÈME 1 — « Le P'tit Rapide » ─────────────────────────────┐
│  Boucle dure, < 20 ms, temps réel déterministe, sur la personne                          │
│                                                                                          │
│   sEMG (MyoWare 2.0 / ADS1299, isolé galvaniquement)                                     │
│        │  détection d'intention (enveloppe, seuil, latence)                              │
│        ▼                                                                                 │
│   Commande d'assistance  ──►  bus CAN (moteurs exosquelette)                             │
│        │                                                                                 │
│        ├──►  FES : fenêtre de blanking pendant la stimulation (l'EMG est aveugle sinon)   │
│        └──►  Arrêt réflexe matériel : couple max, vitesse max, butée, bouton d'arrêt      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                                   ▲ intentions, états, mesures
                                   │  ROS2 (topics, DDS sur le réseau local)
                                   ▼
┌──────────────────────────── SYSTÈME 2 — « Le Penseur » ──────────────────────────────────┐
│  Boucle lente, 10–100 Hz, non critique, hors de la personne                              │
│                                                                                          │
│   Jumeau numérique 3D (MuJoCo ; Isaac Sim si le GPU le permet)                          │
│   Rejeu, visualisation, réglage des paramètres d'assistance                              │
│   Journalisation, métriques de séance, export pour analyse                               │
│   Emplacements réservés aux futurs modèles — VIDES pour l'instant                        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Le Penseur ne commande jamais un moteur.** Il observe, il simule, il propose des
paramètres ; c'est le Système 1 qui agit, avec ses propres limites physiques. Une
coupure du réseau ou du PC haut niveau doit laisser le Système 1 dans un état sûr.

### L'infrastructure distribuée

Le poste nomade de terrain (MacBook sous Linux Mint, triple écran via dock
Thunderbolt 3) et la station fixe en Bretagne (i9, RTX 4080) sont reliés par un
**tunnel Tailscale** — réseau privé chiffré, aucun port ouvert. Le terrain filme,
mesure et teste ; la station calcule les simulations lourdes.

### Matériel — Phase 1

| Bloc | Composant | Rôle |
|---|---|---|
| Acquisition EMG | MyoWare 2.0 (nomade) puis **ADS1299** (banc) | 8 canaux, faible bruit, isolé galvaniquement |
| Centrale inertielle | **BNO085** | orientation du tronc et des segments, détection de chute |
| Télémétrie sol | **LD19** (LiDAR 2D) | seuil de sécurité : obstacle, marche, distance au sol |
| Proximité | **RD-03D** (radar mmWave 24 GHz) | présence et vitesse, insensible à la lumière |
| Actionnement | moteurs BLDC + réducteurs + drivers CAN | assistance articulaire hanche/genou |
| Stimulation | module FES courant constant, **blanking** synchronisé | assistance musculaire, à valider séparément |
| Sécurité | bouton d'arrêt matériel, relais de puissance, fusibles, watchdog | indépendant du logiciel |

Le détail du harnais, du portique et des protocoles de sécurité est dans
**[`docs/HARNESS_ARCHITECTURE.md`](docs/HARNESS_ARCHITECTURE.md)**.

### Ce qui n'est pas dans ce dépôt

**Aucun modèle d'IA, aucun algorithme d'apprentissage.** Les interfaces sont
posées — topics ROS2, structures de messages, emplacements de modules — pour que
les modèles se branchent plus tard sans réécrire l'architecture. Voir
[`docs/ROS2_INTERFACES.md`](docs/ROS2_INTERFACES.md).

### Structure du dépôt

```
docs/          architecture, sécurité, interfaces, décisions
src/           nœuds ROS2 (squelette exécutable, sans logique d'IA)
web/           site vitrine one-page
crowdfunding/  dossiers de campagne (FR / PT-BR / EN)
comms/         textes prêts à publier
```

### Feuille de route

| Phase | Objet | Budget |
|---|---|---|
| **0 — Conception** | architecture, analyse de risques, choix composants | — |
| **1 — Labo nomade** | OpenBCI, triple écran + dock TB3, MyoWare 2.0 | **1 350 €** |
| 2 — Banc Système 1 | acquisition EMG propre, boucle < 20 ms, sécurité | à chiffrer |
| 3 — Harnais passif | portique, délestage, capteurs de sécurité | à chiffrer |
| 4 — Assistance | actionnement, FES, boucle fermée | à chiffrer |

### Safety / Sécurité

Ce projet touche au corps humain. Trois règles, non négociables :

1. **Isolation galvanique** entre l'électronique de mesure, la stimulation et le
   secteur. Aucun chemin conducteur direct vers la personne.
2. **La sécurité ne dépend pas du logiciel.** Bouton d'arrêt matériel, relais de
   puissance, limitation de couple, butées mécaniques. Un programme qui plante
   doit laisser la machine inerte, pas emballée.
3. **Aucun essai sur une personne** sans analyse de risques écrite, validation
   électrique, supervision clinique et avis d'éthique.

### Licence

- Logiciel : **Apache-2.0**
- Matériel (plans, schémas, CAO) : **CERN-OHL-S-2.0**
- Textes et images : **CC BY-SA 4.0**

---

## English

### The problem

An incomplete C6-C7 spinal cord injury sometimes leaves a trace: the person gives
the order to move, and **feels the signal travel down** — even when the movement
never comes. That residual command is the raw material of this project.

The idea is one loop: **capture the motor intention, assist at the right moment,
repeat** — so the nervous system can relearn. The literature calls it
effort-driven neuroplasticity. We call it fieldwork.

### Two systems, two clocks

```
SYSTEM 1 — "The Quick One"   hard loop, < 20 ms, deterministic, worn by the person
                             sEMG → intention → CAN motors / FES (with blanking)
                             reflexive limits, hardware E-stop, never waits on a network

SYSTEM 2 — "The Thinker"     slow loop, 10–100 Hz, off-body
                             3D digital twin (MuJoCo / Isaac Sim), logging, tuning
                             reserved slots for future models — EMPTY for now
```

**System 2 never commands a motor.** It observes, simulates and proposes
parameters. System 1 acts within its own physical limits. Losing the network must
leave System 1 in a safe state.

### Distributed setup

Field laptop (Linux Mint, triple screen over a Thunderbolt 3 dock) and the home
workstation (i9, RTX 4080) are joined by a **Tailscale** tunnel — encrypted
private network, no open ports. The field records and measures; the workstation
runs the heavy simulation.

### Not in this repository

**No AI model, no learning algorithm.** Interfaces only — ROS2 topics, message
structures, module slots — so models can be plugged in later without rewriting
the architecture.

### Safety

This project touches the human body. Three non-negotiable rules: galvanic
isolation between measurement, stimulation and mains; safety that does not depend
on software (hardware E-stop, power relay, torque and speed limits, mechanical
stops); and **no human trial** without a written risk analysis, electrical
validation, clinical supervision and ethics approval.

---

*Suivez l'aventure — Follow the build.*
