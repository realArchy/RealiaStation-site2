# Crowdfunding campaign — English

*Ready for Kickstarter / Indiegogo. Figures are quote estimates to be confirmed
before publication.*

---

## Title

**Catching the Spark — an open-source exoskeleton born from a C6-C7 injury**

Alternatives:
- "There is still a signal. I want to give it back to movement."
- "From the Amazon to neuro-robotics: an open-source exoskeleton"

## One-line pitch

> An incomplete spinal cord injury doesn't erase everything: when I tell my legs
> to move, I feel the signal travel down. This project captures that residual
> command and gives it back to movement — in the open.

---

## The story

### What I still feel

In 2016, a car accident. **Incomplete C6-C7** spinal cord injury.
The report describes what no longer works. It does not describe what I feel every
day: **the command still leaves**, and it travels down. It doesn't always reach
the muscle. But it exists, and it can be measured.

That is where this starts. Not in a theory — in a sensation.

### What the forest taught me first

Before the accident I was a *garimpeiro* and a guide, running expeditions in the
Amazon rainforest of the three Guianas. You learn three things there that
nowhere else teaches: **read the terrain**, **decide on incomplete information**,
and **set out again the next day** even when the day went badly.

R&D is much the same. Except here, the terrain is a nervous system.

### What I'm building

A **closed-loop assistive exoskeleton**, in two tiers:

- **"The Quick One"** — the hard loop, **under 20 ms**, worn by the person:
  galvanically isolated EMG acquisition, intention detection, CAN bus motor
  control, functional electrical stimulation (FES) with a blanking window so the
  measurement isn't blinded, and hardware reflex stop.
- **"The Thinker"** — the high level, off-body: 3D digital twin (MuJoCo, Isaac Sim
  depending on the GPU), session logging and replay. Connected to the field laptop
  through a private **Tailscale** tunnel, with no open ports.

**The Thinker never commands a motor.** That is the rule that makes the system
safe: if the network drops, the person stays in a controlled state.

### What the money funds — and what it does not

**No AI model in this phase.** The interfaces are in place — ROS 2 topics, message
structures, module slots — so models can be plugged in later without rewriting the
architecture. This isn't selling a promise of intelligence; it's funding an honest
test bench.

### What I already own — and what you are not funding

The heavy infrastructure **already exists and runs every day**:

| Already in service | What it does |
|---|---|
| Linux AI workstation **i9 + RTX 4080** | digital twin simulation, heavy compute |
| **Field MacBook Pro** on Linux Mint | mobile workstation |
| **Acquisition MacBook Air** | recording, session log, field backup |
| **Tailscale** private mesh | encrypted field ↔ workstation link, no open ports |
| **8 TB** of sovereign storage | archive of measurements and drawings, off-cloud |

What's missing are the **four biometric links**: the EEG headset, the muscle
sensors, the isolated stimulation module, and the triple-screen extension for
working on the move. No servers, no GPUs.

### Continuous support — no all-or-nothing

The campaign is not cancelled if the goal isn't reached. Three channels stay open
permanently, and **every contribution stays with the project**:

| Channel | For whom | What it brings |
|---|---|---|
| **[LIEN_KOFI]** | international, one-off or monthly | 0 % platform fee, Apple Pay, €3 or €300 |
| **[LIEN_TIPEEE]** | French-speaking audience | monthly subscription, rewards, build log |
| **[LIEN_GITHUB_SPONSORS]** | open-source community | support shown next to the code it funds |

At 40 % of the goal, 40 % of the hardware gets bought — the EEG headset first, the
displays after. The purchase order is public and follows technical priority.

---

## Technical case: simulate in 3D before you machine metal

1. **A badly tuned exoskeleton injures people.** Assisted hip and knee kinematics
   depend on the body: segment lengths, axis alignment, usable range. Testing that
   on physical hardware means machining one part per attempt. In a simulator, it
   means changing a number.
2. **The loop must be tuned before it becomes dangerous.** Intention threshold,
   latency, torque ramp: all of it is tuned on replayed trajectories with
   reproducible measurements. On a person, every attempt costs fatigue and risk.
3. **The digital twin becomes the archive.** Every recorded session is replayable:
   if an assistance strategy works, you can say why, and reproduce it. Without
   that, you have impressions, not results.

Machining comes after, on validated dimensions. Slower at first, far faster after.

---

## Where the €1,350 goes — Phase 1, "nomad lab"

| Item | Detail | Estimate |
|---|---|---|
| Research acquisition board | OpenBCI Cyton, 8 channels, EEG/EMG | €620 |
| Electrodes and consumables | electrodes + gel + cables | €80 |
| Field EMG sensors | 2 × MyoWare 2.0 + wiring | €150 |
| Thunderbolt 3 dock | power + ports for the mobile workstation | €180 |
| Displays | 2 additional screens (triple screen) | €320 |
| **Total** | | **€1,350** |

*Estimates to be confirmed by quotes. Platform fees and reward shipping not
included.*

---

## Stretch goals

| Goal | What it unlocks |
|---|---|
| **€1,800** | Safety sensors: BNO085 IMU ×2, LD19 LiDAR, RD-03D mmWave radar |
| **€2,500** | Isolated power supply + measurement bench: first serious electrical validation |
| **€4,000** | First actuator: BLDC motor + gearbox + CAN driver, dry bench test |
| **€6,000** | FES module and blanking electronics — the step that changes what this project is |

Every goal reached is announced, documented and published — including failures.

---

## Rewards (all immaterial)

| Amount | Reward |
|---|---|
| **€5** | Named thanks in the repository credits and on the site |
| **€15** | Access to the weekly **build log**: what worked, what broke, which dimensions were wrong |
| **€30** | **Schematic pack** in high resolution, under an open licence, as soon as it exists |
| **€60** | Monthly 30-minute call: technical questions, no filter |
| **€120** | Your name on the **prototype plate** + a vote on next month's priorities |
| **€250** | One-hour workshop for your organisation (nonprofit, school, fablab) |
| **€500** | Your organisation on the partners page and in every phase report |

**What I don't promise:** no medical reward, no privileged access to a device, no
guarantee of clinical outcome. That would be dishonest and dangerous.

---

## Timeline

| When | What |
|---|---|
| Now | Design, risk analysis, component selection (public repo) |
| +1 month | Hardware arrives, first EMG acquisitions, raw measurements published |
| +3 months | System 1 loop on the bench: sensor → intention → simulated actuator, measured latency |
| +6 months | Passive harness and gantry, safety sensors installed |

---

## Transparency

- **Code and drawings are public** as soon as they exist, even imperfect.
- **Raw measurements are published**, including those that contradict my hypotheses.
- **Failures get told.** A health project that only shows its wins informs nobody.
- **No human trial** without a written risk analysis, electrical validation,
  clinical supervision and ethics approval.

---

## What I'm asking, and why now

The Phase 1 hardware is what separates an idea from a test bench. From there,
everything becomes measurable — and what is measurable can be fixed.

**Follow along now.** Even without contributing: an open-source neuro-rehabilitation
project only exists if people watch what it produces.
