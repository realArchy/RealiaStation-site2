"""Les règles de sécurité se testent sans matériel, en une milliseconde.

C'est tout l'intérêt d'avoir isolé `safety_rules.py` : si un test de sécurité
demande un portique, une alimentation et un opérateur, il ne sera jamais lancé.
"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src" / "neuro_exo_nodes"))

from neuro_exo_nodes.safety_rules import (  # noqa: E402
    Mesures, Niveau, Seuils, doit_couper, evaluer,
)


def test_nominal_quand_tout_va_bien():
    d = evaluer(Mesures(inclinaison_deg=5.0, obstacle_m=1.2, presence=True,
                        age_derniere_presence_s=0.1, age_dernier_cycle_s=0.01))
    assert d.niveau == Niveau.NOMINAL
    assert d.motifs == []
    assert doit_couper(d) is False


def test_arret_materiel_prime_sur_tout():
    d = evaluer(Mesures(inclinaison_deg=2.0, obstacle_m=5.0, presence=True,
                        age_dernier_cycle_s=0.001, arret_materiel=True))
    assert d.niveau == Niveau.ARRETE
    assert d.motifs == ["arret_materiel"]
    assert doit_couper(d) is True


def test_watchdog_coupe_si_le_cycle_est_trop_long():
    d = evaluer(Mesures(age_dernier_cycle_s=0.120))
    assert d.niveau == Niveau.ARRETE
    assert doit_couper(d) is True


def test_chute_probable_coupe():
    d = evaluer(Mesures(inclinaison_deg=61.0, age_dernier_cycle_s=0.001))
    assert d.niveau == Niveau.ARRETE
    assert "chute" in d.motifs[0]


def test_obstacle_proche_coupe():
    d = evaluer(Mesures(obstacle_m=0.18, age_dernier_cycle_s=0.001))
    assert d.niveau == Niveau.ARRETE
    assert doit_couper(d) is True


def test_inclinaison_moyenne_degrade_sans_couper():
    d = evaluer(Mesures(inclinaison_deg=31.0, age_dernier_cycle_s=0.001))
    assert d.niveau == Niveau.DEGRADE
    assert doit_couper(d) is False


def test_absence_degrade_apres_delai():
    d = evaluer(Mesures(presence=False, age_derniere_presence_s=5.0, age_dernier_cycle_s=0.001))
    assert d.niveau == Niveau.DEGRADE
    assert any("absence" in m for m in d.motifs)


def test_absence_courte_ne_degrade_pas():
    d = evaluer(Mesures(presence=False, age_derniere_presence_s=0.5, age_dernier_cycle_s=0.001))
    assert d.niveau == Niveau.NOMINAL


def test_seuils_personnalises():
    s = Seuils(obstacle_min_m=0.10)
    d = evaluer(Mesures(obstacle_m=0.15, age_dernier_cycle_s=0.001), s)
    assert d.niveau == Niveau.NOMINAL
