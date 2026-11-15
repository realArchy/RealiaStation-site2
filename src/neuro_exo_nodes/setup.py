from setuptools import setup

setup(
    name="neuro_exo_nodes",
    version="0.1.0",
    packages=["neuro_exo_nodes"],
    install_requires=["setuptools"],
    zip_safe=True,
    entry_points={
        "console_scripts": [
            "semg_reader = neuro_exo_nodes.semg_reader_node:main",
            "eeg_bridge = neuro_exo_nodes.eeg_bridge_node:main",
            "harness_safety_monitor = neuro_exo_nodes.harness_safety_monitor:main",
        ],
    },
)
