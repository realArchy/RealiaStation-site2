# Interfaces ROS 2 — les contrats, avant les modèles

*Tout ce qui suit existe pour une raison : brancher un modèle plus tard sans
toucher à l'architecture. Les topics sont nommés, typés et cadencés dès
maintenant. Aucun nœud de ce dépôt ne contient de logique d'apprentissage.*

---

## 1. Règle de nommage

`/neuro_exo/<domaine>/<grandeur>`

| Domaine | Contenu | Critique ? |
|---|---|---|
| `sense/` | acquisitions (EMG, EEG, IMU, LiDAR, radar) | oui pour la boucle dure |
| `intent/` | intentions estimées (ce que la personne veut faire) | oui |
| `act/` | commandes d'actionnement et de stimulation | oui |
| `safety/` | état de sécurité, arrêt, limites | **priorité maximale** |
| `think/` | tout ce que produit le Système 2 | jamais critique |

Le préfixe `think/` est **interdit** dans la boucle de commande : c'est la
frontière entre les deux horloges. Un nœud du Système 1 qui s'abonne à `think/`
est un défaut de conception, pas une optimisation.

---

## 2. Acquisitions

| Topic | Type | Fréquence | QoS | Notes |
|---|---|---|---|---|
| `/neuro_exo/sense/emg_raw` | `sensor_msgs/msg/Image` (réutilisé : matrice canaux × échantillons) **ou** `neuro_exo_msgs/EmgFrame` | 1 000–2 000 Hz | `BEST_EFFORT`, depth 5 | brut, non filtré, pour rejeu |
| `/neuro_exo/sense/emg_envelope` | `neuro_exo_msgs/EmgEnvelope` | 100 Hz | `RELIABLE`, depth 3 | enveloppe par canal, avec `valid` par échantillon |
| `/neuro_exo/sense/emg_blanking` | `std_msgs/msg/Bool` | sur événement | `RELIABLE` | vrai pendant la fenêtre aveugle FES |
| `/neuro_exo/sense/imu_thorax` | `sensor_msgs/msg/Imu` | 100 Hz | `BEST_EFFORT`, depth 5 | BNO085, T4 |
| `/neuro_exo/sense/imu_pelvis` | `sensor_msgs/msg/Imu` | 100 Hz | `BEST_EFFORT`, depth 5 | BNO085, sacrum |
| `/neuro_exo/sense/lidar_ground` | `sensor_msgs/msg/LaserScan` | 10 Hz | `BEST_EFFORT` | LD19, plan horizontal à 200 mm |
| `/neuro_exo/sense/radar_presence` | `neuro_exo_msgs/Presence` | 10 Hz | `RELIABLE` | RD-03D : présence, vitesse radiale |
| `/neuro_exo/sense/load_cell` | `std_msgs/msg/Float32` | 50 Hz | `RELIABLE` | force de délestage (N) |
| `/neuro_exo/sense/eeg_raw` | `neuro_exo_msgs/EegFrame` | 250–500 Hz | `BEST_EFFORT` | OpenBCI / ADS1299, **branché plus tard** |

### `EmgEnvelope` — structure proposée

```
std_msgs/Header header
float32[]       envelope        # amplitude par canal (µV ou unité normalisée)
string[]        channel_names   # ex. ["tib_ant_d", "tib_ant_g", ...]
float32[]       quality         # 0..1 par canal, 0 = électrode décollée
bool[]          valid           # faux pendant le blanking ou saturation
```

Le champ `valid` est le point important : **un trou n'est pas un zéro**. Un modèle
qui reçoit `0.0` sans le drapeau croira à un silence musculaire.

---

## 3. Intentions

| Topic | Type | Fréquence | QoS | Producteur |
|---|---|---|---|---|
| `/neuro_exo/intent/motor` | `neuro_exo_msgs/MotorIntent` | 100 Hz | `RELIABLE`, depth 1 | **emplacement vide** — détecteur à seuil aujourd'hui, modèle demain |
| `/neuro_exo/intent/confidence` | `std_msgs/msg/Float32` | 100 Hz | `RELIABLE` | idem |

```
# MotorIntent
std_msgs/Header header
string   joint              # "hip_r", "knee_l", ...
float32  flexion            # -1..1, intention normalisée
float32  extension          # -1..1
float32  confidence         # 0..1
string   source             # "threshold" | "model:<nom>:<version>"
```

Le champ `source` est là pour l'audit : on doit pouvoir dire, pour chaque séance,
si l'assistance venait d'un seuil ou d'un modèle, et lequel.

---

## 4. Actionnement et stimulation

| Topic | Type | Fréquence | Notes |
|---|---|---|---|
| `/neuro_exo/act/motor_cmd` | `neuro_exo_msgs/MotorCommand` | 200 Hz | couple, vitesse, rampe — **borné par le driver, pas par ce message** |
| `/neuro_exo/act/fes_cmd` | `neuro_exo_msgs/FesCommand` | sur événement | canaux, amplitude, largeur d'impulsion, fréquence |
| `/neuro_exo/act/fes_blanking` | `std_msgs/msg/Bool` | sur événement | impulsion consommée par l'acquisition |

**Le blanking part du générateur, pas du nœud.** C'est le seul moyen d'avoir une
fenêtre stable à la microseconde.

---

## 5. Sécurité

| Topic | Type | Fréquence | Notes |
|---|---|---|---|
| `/neuro_exo/safety/state` | `neuro_exo_msgs/SafetyState` | 50 Hz | état consolidé, lisible par tous |
| `/neuro_exo/safety/estop` | `std_msgs/msg/Bool` | sur événement | **image** de l'entrée matérielle, jamais une commande |
| `/neuro_exo/safety/limits` | `neuro_exo_msgs/SafetyLimits` | 1 Hz | limites actives (couple, vitesse, course) |

```
# SafetyState
std_msgs/Header header
uint8    level              # 0 = nominal, 1 = dégradé, 2 = arrêt en cours, 3 = arrêté
string[] reasons            # ["lidar_obstacle_0.31m", "imu_tilt_28deg"]
bool     hardware_estop     # lecture du contact, pas une décision
bool     software_watchdog_ok
```

---

## 6. Système 2 — le Penseur

| Topic | Type | Fréquence | Notes |
|---|---|---|---|
| `/neuro_exo/think/state` | `neuro_exo_msgs/DigitalTwinState` | 50 Hz | état du jumeau MuJoCo, pour la visualisation |
| `/neuro_exo/think/params` | `neuro_exo_msgs/AssistParams` | sur événement | paramètres proposés — **appliqués par un humain, ou par le Système 1 dans ses bornes** |
| `/neuro_exo/think/session_log` | `rosbag2` | continu | tout est enregistré pour rejeu |

---

## 7. Ce qui est laissé vide, volontairement

```
src/neuro_exo_nodes/neuro_exo_nodes/intent_detector.py      # seuil seulement
src/neuro_exo_nodes/neuro_exo_nodes/model_runner.py         # emplacement, lève NotImplementedError
src/neuro_exo_bringup/config/models.yaml                    # vide, commenté
```

Un emplacement vide **qui échoue franchement** vaut mieux qu'un faux nœud qui
renvoie des zéros : au moins, personne ne croit que ça marche.
