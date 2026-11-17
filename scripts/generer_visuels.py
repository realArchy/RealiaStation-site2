#!/usr/bin/env python3
"""Génère les visuels manquants du site via le ComfyUI de Stack 3 (Kaggle).

Le service ComfyUI tourne sur le GPU Kaggle derrière un tunnel zrok et ne connaît
aucun workflow : c'est ce script qui envoie le sien (SDXL base + LoRA Lightning
4 pas, déjà présent dans le notebook).

Chaque image est écrite dans web/assets/ sous le nom attendu par le site.
Le script est idempotent : une image déjà présente est sautée, sauf --force.

    python generer_visuels.py --url https://xxx.share.zrok.io
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request
import uuid

ASSETS = pathlib.Path("/home/realia/projects/neuro-exo-project/web/assets")

#: style commun — le site entier est en noir abyssal avec deux néons
STYLE = ("cinematic lighting, near-black background, electric magenta and cyan neon rim light, "
         "volumetric haze, ultra detailed, photorealistic, 8k, no text, no watermark, no logo")

VISUELS = [
    # (fichier, largeur, hauteur, prompt)
    ("devkit-usine.jpg", 1344, 768,
     "abstract software factory: glowing lines of code assembling into arches of cyan light in deep darkness, "
     "perspective vanishing point, magenta accents, futuristic engineering, " + STYLE),

    ("devkit-coffre.jpg", 1024, 1024,
     "an open empty black steel safe with a glowing magenta lock, standing in darkness, cyan rim light on the door, "
     "symbol of secrets removed, minimalist product photography, " + STYLE),

    ("realia-station.jpg", 1344, 768,
     "a dark night workstation: three curved monitors glowing with violet and cyan interface, black tower PC with GPU, "
     "cables, warm desk lamp, cyberpunk workshop, " + STYLE),

    ("virtuel-cinematique.jpg", 1344, 768,
     "a humanoid skeleton as a glowing wireframe, hip and knee joints highlighted in magenta with thin technical "
     "dimension lines, floating in dark space, engineering simulation, " + STYLE),

    ("virtuel-latence.jpg", 1344, 768,
     "a minimalist dark technical chart on a screen: thin cyan grid, a single flat magenta line running low under a "
     "dashed cyan threshold, glowing, engineering plot, no numbers, " + STYLE),

    ("neuroexo-harnais.jpg", 1344, 768,
     "product photograph, top view, of a black orthopaedic back brace laid flat on a dark surface: wide waist belt, "
     "two shoulder straps with velcro, rigid plastic shell, a small control module with a coiled cable and three round "
     "sensors beside it, nothing worn, nobody, cyan rim light, " + STYLE),

    ("neuroexo-blanking.jpg", 1344, 768,
     "an oscilloscope style timing diagram: magenta stimulation pulses, a grey blanking window, a cyan EMG signal "
     "aligned below, dark grid background, technical, " + STYLE),

    ("social-cooperative.jpg", 1024, 1024,
     "a fruit cooperative in Madagascar: wooden crates of mangoes and bananas, hands sorting, simple shaded shed, "
     "warm late afternoon light, documentary photography, " + STYLE),

    ("social-fablab.jpg", 1024, 1024,
     "an accessible fablab workshop: a 3D printer running, a prosthetic hand prototype on the bench, tools, "
     "cyan task light, documentary photography, " + STYLE),

    ("archi-guyane.jpg", 1344, 768,
     "a dark river in the Guiana rainforest at dawn, a wooden pirogue, mist over black water, dense canopy, "
     "cinematic documentary, " + STYLE),

    ("luna-equipage.jpg", 1344, 768,
     "four stylised cartoon cyberpunk characters, bust portraits side by side, holographic visors, magenta and cyan "
     "hair lights, space background, character design sheet, " + STYLE),

    ("social-madagascar.jpg", 1344, 768,
     "aerial drone view of a small compound in Madagascar with red roofs, fruit trees, blue water tanks and a sandy "
     "road, warm daylight, documentary photography, " + STYLE),
]


def workflow(prompt: str, largeur: int, hauteur: int, graine: int) -> dict:
    return {
        "1": {"class_type": "CheckpointLoaderSimple",
              "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "2": {"class_type": "LoraLoaderModelOnly",
              "inputs": {"model": ["1", 0], "lora_name": "sdxl_lightning_4step_lora.safetensors",
                         "strength_model": 1.0}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["1", 1]}},
        "4": {"class_type": "CLIPTextEncode",
              "inputs": {"text": "text, letters, watermark, logo, blurry, low resolution, deformed",
                         "clip": ["1", 1]}},
        "5": {"class_type": "EmptyLatentImage",
              "inputs": {"width": largeur, "height": hauteur, "batch_size": 1}},
        "6": {"class_type": "KSampler",
              "inputs": {"seed": graine, "steps": 4, "cfg": 1.5, "sampler_name": "dpmpp_sde",
                         "scheduler": "karras", "denoise": 1.0, "model": ["2", 0],
                         "positive": ["3", 0], "negative": ["4", 0], "latent_image": ["5", 0]}},
        "7": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["1", 2]}},
        "8": {"class_type": "SaveImage",
              "inputs": {"images": ["7", 0], "filename_prefix": "neuroexo"}},
    }


def poster(base: str, charge: dict) -> str:
    corps = json.dumps({"prompt": charge, "client_id": uuid.uuid4().hex}).encode()
    req = urllib.request.Request(base + "/prompt", data=corps,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())["prompt_id"]


def attendre(base: str, pid: str, limite_s: int = 300) -> dict | None:
    fin = time.time() + limite_s
    while time.time() < fin:
        time.sleep(3)
        try:
            with urllib.request.urlopen(f"{base}/history/{pid}", timeout=30) as r:
                hist = json.loads(r.read())
        except Exception:
            continue
        if pid in hist:
            return hist[pid]
    return None


def telecharger(base: str, image: dict, dest: pathlib.Path) -> bool:
    q = urllib.parse.urlencode({"filename": image["filename"],
                                "subfolder": image.get("subfolder", ""),
                                "type": image.get("type", "output")})
    try:
        with urllib.request.urlopen(f"{base}/view?{q}", timeout=120) as r:
            dest.write_bytes(r.read())
        return True
    except Exception as e:
        print(f"    echec telechargement : {e}", flush=True)
        return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--seulement", default="")
    args = ap.parse_args()
    base = args.url.rstrip("/")

    try:
        with urllib.request.urlopen(base + "/system_stats", timeout=30) as r:
            stats = json.loads(r.read())
        print(f"  comfyui joignable — {stats.get('system', {}).get('comfyui_version', '?')}", flush=True)
    except Exception as e:
        print(f"  comfyui injoignable : {e}", flush=True)
        return 1

    ASSETS.mkdir(parents=True, exist_ok=True)
    faits, rates = 0, 0

    for i, (nom, l, h, prompt) in enumerate(VISUELS, 1):
        if args.seulement and args.seulement not in nom:
            continue
        dest = ASSETS / nom
        if dest.exists() and not args.force:
            print(f"  [{i:02d}/{len(VISUELS)}] {nom} — deja present, saute", flush=True)
            faits += 1
            continue
        print(f"  [{i:02d}/{len(VISUELS)}] {nom} ({l}x{h})", flush=True)
        try:
            pid = poster(base, workflow(prompt, l, h, 1000 + i))
            res = attendre(base, pid)
            if not res:
                print("    pas de resultat (delai)", flush=True)
                rates += 1
                continue
            images = res.get("outputs", {}).get("8", {}).get("images", [])
            if not images:
                print("    aucune image dans la reponse", flush=True)
                rates += 1
                continue
            if telecharger(base, images[0], dest):
                print(f"    ecrit : {dest.name} ({dest.stat().st_size // 1024} Ko)", flush=True)
                faits += 1
            else:
                rates += 1
        except Exception as e:
            print(f"    erreur : {e}", flush=True)
            rates += 1

    print(f"  termine — {faits} faits, {rates} echecs", flush=True)
    return 0 if rates == 0 else 2


if __name__ == "__main__":
    import urllib.parse  # noqa: E402
    sys.exit(main())
