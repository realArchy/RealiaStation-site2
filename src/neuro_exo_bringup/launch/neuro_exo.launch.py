"""Lancement Système 1 en simulation, sans matériel.

Aucun nœud du Système 2 ici : à ses débuts, le Système 1 doit pouvoir tourner
seul, sur un banc, sans réseau et sans GPU.
"""
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package="neuro_exo_nodes",
            executable="semg_reader",
            name="semg_reader",
            parameters=[{"canaux": 4, "simulation": True}],
        ),
        Node(
            package="neuro_exo_nodes",
            executable="eeg_bridge",
            name="eeg_bridge",
            parameters=[{"canaux": 8, "simulation": True}],
        ),
        Node(
            package="neuro_exo_nodes",
            executable="harness_safety_monitor",
            name="harness_safety_monitor",
        ),
    ])
