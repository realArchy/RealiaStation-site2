"""Règles de sécurité — logique pure, sans ROS, sans matériel.

Ce fichier existe séparément pour une raison précise : une règle de sécurité que
l'on ne peut pas tester en une milliseconde ne sera pas testée. Ici, point de
rclpy, point de réseau : des entrées, des seuils, une décision, un motif.

Aucune de ces règles ne remplace l'arrêt matériel. Elles le LISENT et le
relaient ; elles ne le produisent pas.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum


class Niveau(IntEnum):
    """Gravité consolidée. L'ordre compte : on ne redescend jamais sans raison."""

    NOMINAL = 0
    DEGRADE = 1
    ARRET_EN_COURS = 2
    ARRETE = 3


@dataclass(frozen=True)
class Seuils:
    """Valeurs par défaut, à ajuster par config — jamais dans le code du nœud."""

    inclinaison_max_deg: float = 25.0
    obstacle_min_m: float = 0.30
    absence_max_s: float = 3.0
    watchdog_max_s: float = 0.050
    #: au-delà, on considère la chute probable et on passe en arrêt
    chute_inclinaison_deg: float = 55.0


@dataclass
class Mesures:
    """Tout ce que la règle a le droit de regarder, et rien d'autre."""

    inclinaison_deg: float | None = None
    distance_sol_m: float | None = None
    obstacle_m: float | None = None
    presence: bool | None = None
    age_derniere_presence_s: float = 0.0
    age_dernier_cycle_s: float = 0.0
    arret_materiel: bool = False


@dataclass
class Decision:
    niveau: Niveau
    motifs: list = field(default_factory=list)
    #: vrai si la décision exige de couper la puissance (relais), pas seulement d'avertir
    couper: bool = False


def evaluer(m: Mesures, s: Seuils = None) -> Decision:
    """Consolide l'état de sécurité à partir des mesures.

    L'ordre d'évaluation va du plus grave au moins grave : peu importe combien de
    motifs s'accumulent, c'est le pire qui commande.
    """
    s = s or Seuils()
    motifs: list = []

    # 1. L'arrêt matériel prime sur tout. On le lit, on ne le décide pas.
    if m.arret_materiel:
        return Decision(Niveau.ARRETE, ["arret_materiel"], couper=True)

    # 2. Watchdog : un cycle trop long signifie que le nœud ne tient plus la cadence.
    if m.age_dernier_cycle_s > s.watchdog_max_s:
        return Decision(Niveau.ARRETE, [f"watchdog_{m.age_dernier_cycle_s*1000:.0f}ms"], couper=True)

    # 3. Chute probable.
    if m.inclinaison_deg is not None and abs(m.inclinaison_deg) >= s.chute_inclinaison_deg:
        return Decision(Niveau.ARRETE, [f"chute_inclinaison_{m.inclinaison_deg:.0f}deg"], couper=True)

    # 4. Obstacle dans la trajectoire.
    if m.obstacle_m is not None and m.obstacle_m < s.obstacle_min_m:
        return Decision(Niveau.ARRETE, [f"obstacle_{m.obstacle_m:.2f}m"], couper=True)

    # 5. Inclinaison excessive : on dégrade, on n'arrête pas — sauf répétition côté supervision.
    if m.inclinaison_deg is not None and abs(m.inclinaison_deg) > s.inclinaison_max_deg:
        motifs.append(f"inclinaison_{m.inclinaison_deg:.0f}deg")

    # 6. Plus personne devant le portique alors que la séance est active.
    if m.presence is False and m.age_derniere_presence_s > s.absence_max_s:
        motifs.append(f"absence_{m.age_derniere_presence_s:.0f}s")

    if motifs:
        return Decision(Niveau.DEGRADE, motifs, couper=False)
    return Decision(Niveau.NOMINAL, [], couper=False)


def doit_couper(decision: Decision) -> bool:
    """Point d'entrée unique pour l'actionneur : couper ou non.

    Séparé de `evaluer` pour qu'on puisse brancher un journal, un compteur ou une
    temporisation sans toucher à la règle.
    """
    return decision.couper
