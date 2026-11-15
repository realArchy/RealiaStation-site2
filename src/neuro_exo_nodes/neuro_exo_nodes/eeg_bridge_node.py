"""Pont EEG — emplacement branché plus tard, contrat défini aujourd'hui.

Pourquoi ce fichier existe alors qu'aucun EEG n'est acquis : le jour où la carte
OpenBCI arrive, on ne veut pas discuter du format des messages. Le contrat est
écrit, le nœud publie un flux *simulé* conforme, et le remplacement du simulateur
par la vraie source sera une ligne.

État honnête : la source matérielle n'est PAS implémentée. `source_materielle()`
lève NotImplementedError plutôt que de renvoyer du silence — un flux muet qui a
l'air de marcher est le pire des deux mondes.
"""
from __future__ import annotations

import math
import random

try:
    import rclpy
    from rclpy.node import Node
    from std_msgs.msg import Float32MultiArray
    _ROS = True
except Exception:  # pragma: no cover
    _ROS = False

    class Node:
        def __init__(self, *_a, **_k):
            pass

        def get_logger(self):
            class _L:
                def info(self, *a):
                    print(*a)

            return _L()

        def create_publisher(self, *_a, **_k):
            class _P:
                def publish(self, _m):
                    pass

            return _P()

        def create_timer(self, *_a, **_k):
            return None

        def declare_parameter(self, *_a, **_k):
            return None

        def get_parameter(self, _n):
            class _V:
                value = None

            return _V()


def source_materielle(carte: str):
    """Point d'entrée unique vers le matériel.

    OpenBCI : passer par BrainFlow (`brainflow.board_shim.BoardShim`) en mode
    `CYTON_BOARD` ou `GANGLION_BOARD`. Non implémenté ici, volontairement : le
    code d'acquisition matériel s'écrit avec la carte sous la main, pas avant.
    """
    raise NotImplementedError(
        f"acquisition EEG materielle non implementee (carte demandee : {carte}). "
        "Utiliser simulation:=true en attendant la carte."
    )


class SimulateurEeg:
    """Alpha 10 Hz + bruit : un signal reconnaissable à l'oscilloscope."""

    def __init__(self, canaux: int = 8, graine: int = 1):
        self.canaux = canaux
        self.rng = random.Random(graine)
        self.i = 0

    def lire(self) -> list:
        self.i += 1
        base = 10.0 * math.sin(2 * math.pi * 10.0 * self.i / 250.0)
        return [base + self.rng.gauss(0.0, 3.0) for _ in range(self.canaux)]


class EegBridgeNode(Node):
    def __init__(self):
        super().__init__("eeg_bridge")
        self.declare_parameter("canaux", 8)
        self.declare_parameter("simulation", True)
        self.declare_parameter("carte", "cyton")
        self.canaux = int(self.get_parameter("canaux").value or 8)
        self.simulation = bool(self.get_parameter("simulation").value)
        self.source = SimulateurEeg(self.canaux) if self.simulation else None
        self.pub = self.create_publisher(Float32MultiArray, "/neuro_exo/sense/eeg_raw", 5)
        self.create_timer(1.0 / 250.0, self._cycle)
        self.get_logger().info(f"eeg_bridge : {'simulation' if self.simulation else 'materiel'}")

    def _cycle(self) -> None:
        if not self.simulation:
            return  # le matériel n'est pas branché ; rien à publier, et on le sait
        msg = Float32MultiArray()
        msg.data = self.source.lire()
        self.pub.publish(msg)


def main() -> None:
    if not _ROS:
        print("rclpy absent : nœud non démarré")
        return
    rclpy.init()
    n = EegBridgeNode()
    try:
        rclpy.spin(n)
    except KeyboardInterrupt:
        pass
    finally:
        n.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
