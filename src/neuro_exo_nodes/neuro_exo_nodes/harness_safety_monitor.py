"""Moniteur de sécurité du harnais — Système 1.

Il consolide l'IMU, le LiDAR, le radar et l'arrêt matériel, applique les règles de
`safety_rules.py`, publie un état lisible, et **demande** la coupure.

Nuance importante : il ne coupe pas lui-même la puissance. La coupure passe par
le relais de sécurité dont la bobine est tenue par le circuit matériel. Ce nœud
ouvre un canal de commande *en plus*, jamais *à la place*.
"""
from __future__ import annotations

import time

try:
    import rclpy
    from rclpy.node import Node
    from sensor_msgs.msg import Imu, LaserScan
    from std_msgs.msg import Bool, String
    _ROS = True
except Exception:  # pragma: no cover
    _ROS = False

    class Node:
        def __init__(self, *_a, **_k):
            self._t0 = time.time()

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

        def get_parameter(self, _n):
            class _V:
                value = None

            return _V()

from .safety_rules import Decision, Mesures, Niveau, Seuils, evaluer


class HarnessSafetyMonitor(Node):
    def __init__(self):
        super().__init__("harness_safety_monitor")
        self.seuils = Seuils()
        self.mesures = Mesures()
        self.derniere_presence = time.time()
        self.dernier_cycle = time.time()
        self.dernier_niveau = Niveau.NOMINAL

        self.pub_etat = self.create_publisher(String, "/neuro_exo/safety/state", 5)
        self.pub_estop = self.create_publisher(Bool, "/neuro_exo/safety/estop", 5)

        self.create_subscription(Imu, "/neuro_exo/sense/imu_thorax", self._sur_imu, 10)
        self.create_subscription(LaserScan, "/neuro_exo/sense/lidar_ground", self._sur_lidar, 10)
        self.create_subscription(Bool, "/neuro_exo/sense/radar_presence", self._sur_presence, 10)
        self.create_subscription(Bool, "/neuro_exo/safety/estop_hardware", self._sur_estop, 10)
        self.create_timer(0.02, self._cycle)
        self.get_logger().info("harness_safety_monitor demarre (50 Hz)")

    # --- entrées -----------------------------------------------------------
    def _sur_imu(self, msg: Imu) -> None:
        # Inclinaison approchée : angle du vecteur pesanteur projeté.
        # Suffisant pour un seuil ; pas pour de l'analyse de marche fine.
        ax, ay, az = msg.linear_acceleration.x, msg.linear_acceleration.y, msg.linear_acceleration.z
        import math
        self.mesures.inclinaison_deg = math.degrees(math.atan2(math.hypot(ax, ay), abs(az) or 1e-9))

    def _sur_lidar(self, msg: LaserScan) -> None:
        valides = [r for r in msg.ranges if msg.range_min < r < msg.range_max]
        self.mesures.obstacle_m = min(valides) if valides else None

    def _sur_presence(self, msg: Bool) -> None:
        self.mesures.presence = bool(msg.data)
        if msg.data:
            self.derniere_presence = time.time()

    def _sur_estop(self, msg: Bool) -> None:
        # On ne fait que recopier l'état du contact matériel.
        self.mesures.arret_materiel = bool(msg.data)
        self.pub_estop.publish(msg)

    # --- cycle -------------------------------------------------------------
    def _cycle(self) -> None:
        maintenant = time.time()
        self.mesures.age_dernier_cycle_s = maintenant - self.dernier_cycle
        self.mesures.age_derniere_presence_s = maintenant - self.derniere_presence
        self.dernier_cycle = maintenant

        d: Decision = evaluer(self.mesures, self.seuils)
        msg = String()
        msg.data = f"{d.niveau.name}|{','.join(d.motifs)}|couper={d.couper}"
        self.pub_etat.publish(msg)

        if d.niveau != self.dernier_niveau:
            if d.niveau >= Niveau.ARRET_EN_COURS:
                self.get_logger().warn(f"SECURITE {msg.data}")
            else:
                self.get_logger().info(f"SECURITE {msg.data}")
            self.dernier_niveau = d.niveau


def main() -> None:
    if not _ROS:
        print("rclpy absent : nœud non démarré")
        return
    rclpy.init()
    n = HarnessSafetyMonitor()
    try:
        rclpy.spin(n)
    except KeyboardInterrupt:
        pass
    finally:
        n.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
