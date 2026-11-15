"""Nœud d'acquisition sEMG — Système 1.

Ce nœud fait quatre choses, dans cet ordre, et rien d'autre :

 1. lit des trames brutes (simulateur aujourd'hui, MyoWare/ADS1299 demain),
 2. calcule une enveloppe simple (RMS sur fenêtre glissante),
 3. marque chaque échantillon `valid=False` pendant la fenêtre de blanking FES,
 4. publie en 100 Hz, sans jamais bloquer sur le réseau.

Ce qu'il ne fait PAS : filtrer finement, estimer une intention, décider quoi que
ce soit. Un capteur qui décide est un capteur qu'on ne peut plus déboguer.

Le blanking est primordial : pendant une impulsion FES, l'amplificateur sature.
Si l'on publiait ces échantillons comme valides, tout modèle en aval apprendrait
à partir du bruit de stimulation. Un trou déclaré vaut mieux qu'un zéro menteur.
"""
from __future__ import annotations

import math
import random

try:  # ROS 2 n'est pas nécessaire pour importer et tester le reste du module
    import rclpy
    from rclpy.node import Node
    from std_msgs.msg import Bool, Float32MultiArray, MultiArrayDimension
    _ROS = True
except Exception:  # pragma: no cover - environnement sans ROS
    _ROS = False

    class Node:  # substitut minimal, pour que le fichier reste lisible et testable
        def __init__(self, *_a, **_k):
            pass

        def get_logger(self):
            class _L:
                def info(self, *a):
                    print(*a)

                def warn(self, *a):
                    print("WARN", *a)

            return _L()

        def create_publisher(self, *_a, **_k):
            class _P:
                def publish(self, _m):
                    pass

            return _P()

        def create_subscription(self, *_a, **_k):
            return None

        def create_timer(self, *_a, **_k):
            return None

        def declare_parameter(self, *_a, **_k):
            return None

        def get_parameter(self, name):
            class _V:
                value = None

            return _V()


class Envelope:
    """Enveloppe RMS par canal, avec fenêtre glissante.

    Chaque canal garde ses propres échantillons : une électrode décollée ne doit
    pas contaminer le calcul des autres.
    """

    def __init__(self, canaux: int, fenetre: int = 100):
        self.canaux = canaux
        self.fenetre = fenetre
        self.tampons = [[] for _ in range(canaux)]

    def pousser(self, trame: list) -> list:
        for i, v in enumerate(trame[: self.canaux]):
            t = self.tampons[i]
            t.append(float(v))
            if len(t) > self.fenetre:
                del t[0]
        return self.valeur()

    def valeur(self) -> list:
        out = []
        for t in self.tampons:
            if not t:
                out.append(0.0)
                continue
            out.append(math.sqrt(sum(x * x for x in t) / len(t)))
        return out

    def qualite(self) -> list:
        """0..1 : une électrode qui ne bouge pas du tout est probablement décollée.

        Critère grossier assumé : une variance nulle sur une fenêtre pleine est
        plus souvent un défaut de contact qu'un muscle parfaitement au repos.
        """
        q = []
        for t in self.tampons:
            if len(t) < self.fenetre:
                q.append(1.0)  # pas encore assez de recul pour juger
                continue
            moyenne = sum(t) / len(t)
            var = sum((x - moyenne) ** 2 for x in t) / len(t)
            q.append(0.0 if var < 1e-9 else 1.0)
        return q


class SimulateurEmg:
    """Source de remplacement : bruit + bouffées périodiques.

    Sert à faire tourner la chaîne complète (topic → enregistrement → jumeau)
    sans matériel. Ce n'est pas un modèle physiologique et ça ne prétend pas
    l'être : c'est un générateur de signal plausible pour tester le transport.
    """

    def __init__(self, canaux: int = 4, graine: int = 0):
        self.canaux = canaux
        self.rng = random.Random(graine)
        self.t = 0

    def lire(self, n: int = 16) -> list:
        self.t += 1
        bouffee = 1.0 if (self.t % 300) < 40 else 0.05
        return [[self.rng.gauss(0.0, 20.0) * bouffee for _ in range(n)]
                for _ in range(self.canaux)]


class SemgReaderNode(Node):
    def __init__(self):
        super().__init__("semg_reader")
        self.declare_parameter("canaux", 4)
        self.declare_parameter("frequence_hz", 1000)
        self.declare_parameter("simulation", True)

        self.canaux = int(self.get_parameter("canaux").value or 4)
        self.simulation = bool(self.get_parameter("simulation").value)
        self.blanking = False
        self.enveloppe = Envelope(self.canaux)
        self.source = SimulateurEmg(self.canaux)

        self.pub = self.create_publisher(Float32MultiArray, "/neuro_exo/sense/emg_envelope", 3)
        self.create_subscription(Bool, "/neuro_exo/sense/emg_blanking", self._sur_blanking, 10)
        self.create_timer(0.01, self._cycle)
        self.get_logger().info(f"semg_reader demarre ({self.canaux} canaux, simulation={self.simulation})")

    def _sur_blanking(self, msg) -> None:
        self.blanking = bool(msg.data)

    def _cycle(self) -> None:
        trames = self.source.lire(16)
        plat = [v for trame in trames for v in trame]
        env = self.enveloppe.pousser(plat)
        msg = Float32MultiArray()
        msg.layout.dim = [MultiArrayDimension(label="canal", size=len(env), stride=len(env))]
        msg.data = [0.0 if self.blanking else v for v in env]
        self.pub.publish(msg)


def main() -> None:
    if not _ROS:
        print("rclpy absent : nœud non démarré (import et tests restent possibles)")
        return
    rclpy.init()
    noeud = SemgReaderNode()
    try:
        rclpy.spin(noeud)
    except KeyboardInterrupt:
        pass
    finally:
        noeud.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
