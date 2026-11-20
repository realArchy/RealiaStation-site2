"""Génère les dix pages — mise en page en split-screen.

Chaque section de contenu est une grille à deux colonnes : le texte d'un côté,
le visuel de l'autre, en alternance. Aucune section n'empile « tout le texte
puis toutes les images ».

Le français est écrit dans le HTML (lisible sans JavaScript, indexable) ;
l'anglais, le portugais et le chinois sont dans traductions.js.
"""
from __future__ import annotations

import json
import pathlib
import random
import re
import sys
import time

RACINE = pathlib.Path("/home/realia/projects/neuro-exo-project/web")
sys.path.insert(0, str(RACINE / "_source"))

from contenu_1 import ACCUEIL, NAV, ORIENT  # noqa: E402
from contenu_2 import PAGES  # noqa: E402
from contenu_3 import BLUEPRINT  # noqa: E402

PAGES["blueprint"] = BLUEPRINT

FR = "fr"

#: incrémenté à chaque génération — sert de cache-buster
VERSION = time.strftime("%Y%m%d%H%M")

ORDRE = [
    ("index", "index.html", "luna-01-aventure"),
    ("virtuel", "virtuel.html", "luna-02-virtuel"),
    ("neuroexo", "rexoia.html", "luna-03-neuroexo"),
    ("devkit", "devkit.html", "luna-04-devkit"),
    ("realia", "realiastation.html", "luna-05-realiastation"),
    ("luna", "lunagalaxie.html", "luna-06-ghostsheller"),
    ("app", "app.html", "luna-13-app"),
    ("social", "meta-projet-social.html", "luna-07-ilot-ong"),
    ("blueprint", "blueprint.html", "luna-11-blueprint"),
    ("archi", "architecte.html", "luna-08-architecte"),
    ("cabinet", "cabinet.html", "luna-12-cabinet"),
    ("wish", "wishlist.html", "luna-09-wishlist"),
    ("boutique", "boutique.html", "luna-10-noel"),
]

TOUS = {**NAV, **ACCUEIL}
for _p in PAGES.values():
    for _k, _v in _p.items():
        if isinstance(_v, dict) and "fr" in _v:
            TOUS[f"{_p['cle']}.{_k}"] = _v
for _f, _cle, _t, _d in ORIENT:
    TOUS[_cle] = _t
    TOUS[_cle.replace(".carte", ".descr")] = _d


def t(cle: str) -> str:
    return TOUS[cle][FR]


def e(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------------------------------------------------------------------------
# Fragments communs
# ---------------------------------------------------------------------------
def nav(page: str) -> str:
    idx = [p[0] for p in ORDRE].index(page)
    cles = ("accueil", "virtuel", "neuroexo", "devkit", "realia",
            "luna", "app", "social", "blueprint", "archi", "cabinet", "wishlist", "boutique")
    liens = []
    for i, (cle, (pid, f, _a)) in enumerate(zip(cles, ORDRE)):
        courant = ' aria-current="page"' if i == idx else ""
        liens.append(f'      <a href="{f}"{courant}>{t("nav." + cle)}</a>')
    return f"""<header class="entete">
    <nav class="nav">
    <div class="nav-haut">
      <a href="index.html" class="marque">
        <span class="marque-pastille">R</span>
        <span class="marque-texte">R'Exo<span>IA</span></span>
      </a>
      <div class="nav-centre">
        <div class="langues" role="group" aria-label="Langue">
          <button type="button" data-lang="fr" aria-pressed="true" aria-label="Français" title="Français"><span class="drapeau">🇫🇷</span></button>
          <button type="button" data-lang="pt" aria-pressed="false" aria-label="Português (Brasil)" title="Português (Brasil)"><span class="drapeau">🇧🇷</span></button>
        </div>
        <p class="marque-station">RealiaStation</p>
        <div class="langues" role="group" aria-label="Language">
          <button type="button" data-lang="en" aria-pressed="false" aria-label="English" title="English"><span class="drapeau">🇬🇧</span></button>
          <button type="button" data-lang="zh" aria-pressed="false" aria-label="中文" title="中文"><span class="drapeau">🇨🇳</span></button>
        </div>
      </div>
      <a href="index.html#financer" class="bouton">{t('commun.soutenir')}</a>
    </div>
    </nav>
    </header>

<nav class="rail" aria-label="Pages">
{chr(10).join(liens)}
</nav>"""


def pied(extra: str = "") -> str:
    return f"""<footer class="pied">
  <div class="pied-corps">
    <p style="margin:0"><strong style="color:#fff">R'EXOIA</strong> — <span data-t="commun.nonmed">{t('commun.nonmed')}</span></p>
    <div style="display:flex; gap:1.1rem; flex-wrap:wrap">
      <a href="wishlist.html" data-t="nav.wishlist">{t('nav.wishlist')}</a>
      <a href="boutique.html" data-t="nav.boutique">{t('nav.boutique')}</a>
      <a href="[LIEN_GITHUB]">GitHub</a>
    </div>
  </div>
  {extra}
</footer>"""


def scripts(particules: bool = False) -> str:
    return f"""<script src="traductions.js?v={VERSION}" defer></script>
<script src="i18n.js?v={VERSION}" defer></script>
<script src="revele.js?v={VERSION}" defer></script>
<script src="tiroir.js?v={VERSION}" defer></script>
<script src="audio.js?v={VERSION}" defer></script>
<script type="module" src="systeme.js?v={VERSION}"></script>
  <script src="vendor/gsap.min.js?v={VERSION}"></script>
  <script src="ambiance.js?v={VERSION}" defer></script>
  <script src="impulsion.js?v={VERSION}" defer></script>
  <script src="devise-neon.js?v={VERSION}" defer></script>
  <script src="lumiere-scroll.js?v={VERSION}" defer></script>
  <script src="vendor/lenis.min.js?v={VERSION}" defer></script>
  <script src="defilement-doux.js?v={VERSION}" defer></script>"""


def tete(titre: str, description: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{titre} — R'ExoIA</title>
<meta name="description" content="{description}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Bricolage+Grotesque:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Caveat:wght@600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="style.css?v={VERSION}" />
  <!-- banque de couleurs et typographies : chargée après style.css pour
       que ses variables gagnent -->
  <link rel="stylesheet" href="assets/css/design-tokens.css?v={VERSION}" />"""


def enveloppe(page: str, corps: str, titre_page: str, description: str,
              interne: bool = True, extra_pied: str = "") -> str:
    audio = [p for p in ORDRE if p[0] == page][0][2]
    classe = "enveloppe interne" if interne else "enveloppe"
    return f"""{tete(titre_page, description)}
</head>
<body data-page="{page}" data-audio="assets/audio/{audio}.mp3">

<div class="ciel"></div>
<div class="systeme" data-position="bas-gauche" data-taille="280" data-opacite="0.4"></div>

{nav(page)}

<main class="{classe}">
{corps}
</main>

{pied(extra_pied)}

{scripts()}
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Blocs
# ---------------------------------------------------------------------------
def bloc(texte: str, visuel: str, inverse: bool = False) -> str:
    sens = " inverse" if inverse else ""
    return f"""  <section class="split{sens}">
    <div class="split-texte reveler">
{texte}
    </div>
    <div class="split-visuel reveler">
{visuel}
    </div>
  </section>"""


def img(nom: str, alt: str, legende: str = "", largeur: int = None, hauteur: int = None) -> str:
    """Image avec largeur et hauteur explicites.

    Sans elles, le navigateur ne connaît pas la place à réserver : le texte
    saute de la hauteur de l'image au moment du chargement. C'était l'une des
    causes des secousses signalées.
    """
    cap = (f'\n      <figcaption class="mono faible" style="font-size:.66rem; margin-top:.7rem; line-height:1.6">{legende}</figcaption>'
           if legende else "")
    portrait = " portrait" if "portrait" in nom else ""
    # rapports réels des visuels 4:3 de l'Îlot Intégré
    RATIOS = {"cooperative-agricole.jpg": (1152, 864),
              "rehabilitation-center.jpg": (1152, 864),
              "formation-emancipation.jpg": (1152, 864),
              "digital-twin-neuroexo.jpg": (1152, 864),
              "fablab-pmr.jpg": (1152, 864),
              "solar-fruit-processing.jpg": (1152, 864),
              "realia-virtual-economy.jpg": (1152, 864)}
    if largeur is None or hauteur is None:
        largeur, hauteur = RATIOS.get(nom, (825, 1100) if portrait else (1600, 900))
    return f"""      <figure class="profondeur" style="margin:0">
        <div class="cadre-neon">
          <picture>
              <source srcset="assets/{nom.rsplit('.', 1)[0]}.webp" type="image/webp" />
              <img src="assets/{nom}" alt="{alt}" width="{largeur}" height="{hauteur}"
               class="cadre{portrait}" loading="lazy" decoding="async" />
            </picture>
        </div>{cap}
      </figure>"""


def img_large(nom: str, alt: str, legende: str = "", largeur: int = 1600, hauteur: int = 900) -> str:
    """Image en bandeau pleine largeur : les grands visuels ne sont pas écrasés
    dans une colonne de split."""
    cap = (f'\n    <figcaption class="mono faible">{legende}</figcaption>' if legende else "")
    return f"""    <figure class="bandeau reveler">
      <picture>
        <source srcset="assets/{nom.rsplit('.', 1)[0]}.webp" type="image/webp" />
        <img src="assets/{nom}" alt="{alt}" width="{largeur}" height="{hauteur}"
             loading="lazy" decoding="async" />
      </picture>{cap}
    </figure>"""


def panneau(titre: str, lignes: list, accent: str = "cyan") -> str:
    """Visuel de remplacement : une console stylisée, sans image."""
    couleur = "var(--cyan)" if accent == "cyan" else "var(--magenta)"
    corps = "\n".join(
        f'          <div style="display:flex; gap:.6rem; font-family:\'JetBrains Mono\',monospace; font-size:.78rem; color:var(--doux)">'
        f'<span style="color:{couleur}">›</span><span>{e(l)}</span></div>'
        for l in lignes)
    return f"""      <div class="profondeur cadre-neon">
        <div style="padding:1.5rem; background:#08030f; border-radius:calc(var(--rayon) - 2px); min-height:260px">
          <p class="mono" style="font-size:.66rem; letter-spacing:.22em; text-transform:uppercase; color:{couleur}; margin-bottom:1rem">{e(titre)}</p>
{corps}
        </div>
      </div>"""


def badge(page: str) -> str:
    p = PAGES.get(page)
    if not p:
        return ""
    return (f'      <span class="{p["classe"]}"><span class="point"></span>'
            f'<span data-t="{page}.badge">{t(page + ".badge")}</span></span>')


def titre_h1(page: str, taille: str = "clamp(2.2rem,4.4vw,3.4rem)") -> str:
    return f'      <h1 style="font-size:{taille}; margin:1.1rem 0 0" data-t="{page}.titre">{t(page + ".titre")}</h1>'


def chap(page: str, n: int, inverse: bool = False, visuel: str = "") -> str:
    texte = f"""      <h2 data-t="{page}.c{n}t">{t(f'{page}.c{n}t')}</h2>
      <p data-t="{page}.c{n}d">{t(f'{page}.c{n}d')}</p>"""
    return bloc(texte, visuel or panneau(t(f"{page}.c{n}t"), [t(f"{page}.c{n}d")[:80] + "…"]), inverse)


# ===========================================================================
# 1. Accueil
# ===========================================================================
def page_index() -> str:
    orient = []
    for i, (fichier, cle, titre, descr) in enumerate(ORIENT, 1):
        orient.append(f"""      <a href="{fichier}">
        <span class="rang">{i:02d}</span>
        <strong data-t="{cle}">{titre[FR]}</strong>
        <span class="d" data-t="{cle.replace('.carte', '.descr')}">{descr[FR]}</span>
      </a>""")

    corps = f"""
  <section class="hero">
    <canvas id="hero3d" aria-hidden="true"></canvas>
    <aside class="barre-gauche" aria-label="Statut et actions">
      <span class="chantier badge-hero"><span class="point"></span><span data-t="index.badge">{t('index.badge')}</span></span>
      <a href="#manifeste" class="lien-gauche" data-t="index.cta2">{t('index.cta2')}</a>
      <button type="button" class="play-music" id="play-music" data-t="index.cta_music">{t('index.cta_music')}</button>
    </aside>
    <p class="bienvenue" data-t="index.bienvenue">{t('index.bienvenue')}</p>
    <div class="hero-titre">
      <h1 data-t="index.titre_1">{t('index.titre_1')}</h1>
    </div>
    <p class="hero-soustitre" data-t="index.titre_2">{t('index.titre_2')}</p>
    <div class="hero-indice">Scroll<span></span></div>
    </section>

  <div id="manifeste"></div>
"""
    corps += bloc(
        f"""      <p class="etiq">Manifeste</p>
        <h2 data-t="index.titre">{t('index.titre')}</h2>
        <p class="slogan" data-t="index.slogan1">{t('index.slogan1')}</p>
        <p class="lead" data-t="index.lead">{t('index.lead')}</p>
        <p class="slogan-final" data-t="index.slogan2">{t('index.slogan2')}</p>""",
        img("index-declic.jpg",
            "Silhouette dans un exosquelette face à un stade illuminé",
            "Le déclic — 12 juin 2014"))

    corps += f"""
  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Origine</p>
      <h2 data-t="index.reboot_titre">{t('index.reboot_titre')}</h2>
      <p class="lead" data-t="index.reboot_txt">{t('index.reboot_txt')}</p>
    </div>
  </section>"""

    corps += bloc(
        f"""      <h2 data-t="index.histoire_titre">{t('index.histoire_titre')}</h2>
      <p data-t="index.histoire_1">{t('index.histoire_1')}</p>
      <p data-t="index.histoire_2">{t('index.histoire_2')}</p>""",
        img("index-etincelle.jpg",
            "Deux électrodes posées sur une peau, une étincelle cyan entre elles",
            "L'étincelle résiduelle"),
        inverse=True)

    corps += f"""
  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Orientation</p>
      <h2 data-t="index.orient_titre">{t('index.orient_titre')}</h2>
      <p class="lead" style="margin-top:1rem" data-t="index.orient_lead">{t('index.orient_lead')}</p>
    </div>
    <div class="orient reveler">
{chr(10).join(orient)}
    </div>
  </section>

  <section class="section" id="financer" style="text-align:center">
    <div class="verre-clair reveler" style="padding:2.8rem 1.6rem">
      <h2 data-t="commun.soutenir">{t('commun.soutenir')}</h2>
      <p class="lead" style="margin:1rem auto 0">Ko-fi · Tipeee · GitHub Sponsors — trois canaux ouverts, sans tout-ou-rien.</p>
      <div style="display:flex; flex-wrap:wrap; gap:.8rem; justify-content:center; margin-top:1.8rem">
        <a href="[LIEN_KOFI]" class="bouton">Ko-fi</a>
        <a href="[LIEN_TIPTEEE]" class="bouton-fantome">Tipeee</a>
        <a href="[LIEN_GITHUB_SPONSORS]" class="bouton-fantome">GitHub Sponsors</a>
      </div>
    </div>
  </section>
"""
    html = enveloppe("index", corps, "Capter l'étincelle",
                     "R'ExoIA : neuro-robotique open source, IA agentique et solidarité internationale.",
                     interne=False)
    return html.replace("</body>", """<script type="module">
  import { demarrerHero } from './hero3d.js?v={VERSION}';
  demarrerHero(document.getElementById('hero3d'));
</script>
<script>
  (function () {
    const b = document.getElementById('play-music');
    if (b) b.addEventListener('click', () => {
      if (window.LUNA) window.LUNA.jouer();
      const c = document.getElementById('manifeste');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  })();
</script>
</body>""")


# ===========================================================================
# Pages de contenu
# ===========================================================================
def page_virtuel() -> str:
    scene = """      <div class="profondeur verre" style="padding:1rem">
        <div style="display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:.9rem" role="group">
          <button type="button" class="onglet" data-etape="0" aria-pressed="true">1 · Flux</button>
          <button type="button" class="onglet" data-etape="1" aria-pressed="false">2 · Cinématique</button>
          <button type="button" class="onglet" data-etape="2" aria-pressed="false">3 · Harnais</button>
        </div>
        <div id="scene3d" style="border-radius:.7rem; overflow:hidden; height:340px; background:radial-gradient(circle at 50% 35%, rgba(40,10,60,.8), #08030f)"></div>
        <p id="scene-legende" style="margin:.8rem 0 0; font-size:.82rem; color:var(--doux)">Étape 1 — le flux de signaux.</p>
      </div>"""

    corps = bloc(
        f"""{badge('virtuel')}
      <h1 style="margin:1.1rem 0 0" data-t="virtuel.titre">{t('virtuel.titre')}</h1>
      <p class="lead" style="margin-top:1.2rem" data-t="virtuel.lead">{t('virtuel.lead')}</p>""",
        img("simulation-biomecanique.jpg",
            "Simulation biomécanique en temps réel", "Le jumeau numérique en mouvement"))

    corps += bloc(
        f"""      <h2 data-t="virtuel.c1t">{t('virtuel.c1t')}</h2>
      <p data-t="virtuel.c1d">{t('virtuel.c1d')}</p>""",
        img("virtuel-cinematique.jpg",
            "Squelette filaire articulé, hanche et genou en surbrillance",
            "La cinématique, avant l'usinage"),
        inverse=True)

    corps += bloc(
        f"""      <h2 data-t="virtuel.c2t">{t('virtuel.c2t')}</h2>
      <p data-t="virtuel.c2d">{t('virtuel.c2d')}</p>""",
        scene)

    corps += bloc(
        f"""      <h2 data-t="virtuel.c3t">{t('virtuel.c3t')}</h2>
      <p data-t="virtuel.c3d">{t('virtuel.c3d')}</p>""",
        img("virtuel-latence.jpg",
            "Courbe de latence sous son seuil sur un écran technique",
            "La latence, mesurée et publiée"),
        inverse=True)

    html = enveloppe("virtuel", corps, t("virtuel.titre"), t("virtuel.lead")[:150])
    return html.replace("</body>", """<script type="module">
  import { demarrerScene } from './three-scene.js?v={VERSION}';
  const c = document.getElementById('scene3d');
  if (c) demarrerScene(c, { legendeId: 'scene-legende' });
</script>
</body>""")


REALIDEVKIT_CHIFFRES = """
  <section class="section">
    <p class="etiq">RealiDevKit en chiffres</p>
    <div class="chiffres">
      <div class="chiffre"><strong>66</strong><span>outils branchés</span></div>
      <div class="chiffre"><strong>16</strong><span>fiches de rôle</span></div>
      <div class="chiffre"><strong>2</strong><span>modèles qui se relaient</span></div>
      <div class="chiffre"><strong>16 Go</strong><span>de VRAM, une seule carte</span></div>
      <div class="chiffre"><strong>0</strong><span>appel sortant nécessaire</span></div>
      <div class="chiffre"><strong>0</strong><span>secret dans les fichiers servis</span></div>
    </div>
  </section>
  <section class="section">
    <div class="verre reveler" style="padding:1.8rem">
      <p class="etiq" style="margin-bottom:.8rem">Ce que ça change, concrètement</p>
      <p style="margin:0 0 .9rem">Un projet de trois semaines se mène sans jamais sortir un fichier du disque : le brief reste sur la station, les modèles aussi, les résultats aussi. Le jour où la machine s'éteint, il ne reste rien à révoquer chez un prestataire.</p>
      <p style="margin:0">Et parce que le swarm écrit la preuve de ce qu'il avance — un test, une mesure, un journal — on peut relire six mois plus tard <em>pourquoi</em> une décision a été prise, pas seulement laquelle.</p>
    </div>
  </section>
"""


def page_simple(page: str, visuel1: str, visuel2: str, journal_n: int = 0, extra: str = "") -> str:
    p = PAGES[page]
    corps = bloc(
        f"""{badge(page)}
      <h1 style="margin:1.1rem 0 0" data-t="{page}.titre">{t(page + '.titre')}</h1>
      <p class="lead" style="margin-top:1.2rem" data-t="{page}.lead">{t(page + '.lead')}</p>""",
        visuel1)

    corps += bloc(
        f"""      <h2 data-t="{page}.c1t">{t(page + '.c1t')}</h2>
      <p data-t="{page}.c1d">{t(page + '.c1d')}</p>
      <h2 style="margin-top:2rem; font-size:1.5rem" data-t="{page}.c2t">{t(page + '.c2t')}</h2>
      <p data-t="{page}.c2d">{t(page + '.c2d')}</p>""",
        visuel2, inverse=True)

    corps += bloc(
        f"""      <h2 data-t="{page}.c3t">{t(page + '.c3t')}</h2>
      <p data-t="{page}.c3d">{t(page + '.c3d')}</p>""",
        panneau(t(f"{page}.c3t"), [t(f"{page}.c3t"), "—", t(f"{page}.c3d")[:90]]),
    )

    if journal_n:
        lignes = []
        for i in range(1, journal_n + 1):
            cle = f"{page}.j{i}"
            if cle not in TOUS:
                continue
            txt = t(cle)
            date, reste = (txt.split(" — ", 1) + [""])[:2] if " — " in txt else (txt, "")
            lignes.append(f'        <li><time>{date}</time><span class="txt" data-t="{cle}">{reste}</span></li>')
        corps += f"""
  <section class="section">
    <p class="etiq" data-t="{page}.journal_titre">{t(page + '.journal_titre')}</p>
    <div class="verre reveler" style="padding:1.6rem">
      <ul class="journal">
{chr(10).join(lignes)}
      </ul>
    </div>
  </section>"""

    corps += extra
    corps += f"""
  <section class="section" style="text-align:center">
    <a href="index.html#financer" class="bouton" data-t="commun.soutenir">{t('commun.soutenir')}</a>
  </section>
"""
    return enveloppe(page, corps, t(page + ".titre")[:60], t(page + ".lead")[:150])


def page_luna() -> str:
    p = PAGES["luna"]
    visuel = img("ghostsheller.jpg",
                 "Le GhostSheller, vaisseau quantique millénaire en orbite",
                 "GhostSheller — propulsion black-hole")
    corps = bloc(
        f"""{badge('luna')}
      <h1 style="margin:1.1rem 0 0; font-size:clamp(2.6rem,6vw,4.4rem); letter-spacing:-.045em" data-t="luna.titre">{t('luna.titre')}</h1>
      <p class="mono" style="letter-spacing:.36em; color:var(--magenta); font-size:.8rem; margin:.7rem 0 0">A.K.A. GYPSIELUNA</p>
      <p class="lead" style="margin-top:1.4rem" data-t="luna.lead">{t('luna.lead')}</p>""",
        visuel)

    corps += bloc(
        f"""      <h2 data-t="luna.prod_titre">{t('luna.prod_titre')}</h2>
      <p data-t="luna.prod_txt">{t('luna.prod_txt')}</p>
      <a href="realiastation.html" class="bouton-fantome" data-t="luna.prod_cta">{t('luna.prod_cta')}</a>""",
        img("luna-equipage.jpg", "L'équipage de LunaGalaxie, portraits cartoon cyberpunk",
            "L'équipage du GhostSheller"),
        inverse=True)
    corps += f"""
  <script type="module" src="galaxie3d.js?v={VERSION}"></script>
"""
    return enveloppe("luna", corps, t("luna.titre"), t("luna.lead")[:150])


def page_social() -> str:
    p = PAGES["social"]
    corps = f"""
  <section class="section hero-social">
    {badge('social')}
    <h1 style="margin:1.1rem 0 0" data-t="social.titre">{t('social.titre')}</h1>
    <p class="lead" style="margin-top:1.2rem; max-width:64ch" data-t="social.lead">{t('social.lead')}</p>
    <p class="chapo" style="max-width:66ch" data-t="social.chapo">{t('social.chapo')}</p>
  </section>
"""
    corps += img_large("ilot-hero.jpg",
            "Vue panoramique d'un campus intégré à Madagascar : bâtiments accessibles, "
            "serres solaires, ateliers, habitants et soignants sur les chemins",
            "Visualisation — l'Îlot Intégré tel qu'il est projeté, pas un bâtiment existant")

    corps += f"""
  <section class="section section-devise">
    <p class="devise-neon" data-t="social.devise">{t('social.devise')}</p>
  </section>"""

    corps += bloc(
        f"""      <p class="etiq">Le modèle</p>
      <h2 data-t="social.m1t">{t('social.m1t')}</h2>
      <p data-t="social.m1d">{t('social.m1d')}</p>
      <p data-t="social.m1d2">{t('social.m1d2')}</p>""",
        img("ilot-masterplan.jpg",
            "Plan-masse axonométrique de l'Îlot Intégré : huit bâtiments à toit solaire, "
            "voirie, serre, parcelles cultivées, château d'eau et bassin",
            "Plan-masse — géométrie à l'échelle, rendue dans Blender"),
        inverse=True)

    corps += bloc(
        f"""      <h2 data-t="social.m2t">{t('social.m2t')}</h2>
      <p data-t="social.m2d">{t('social.m2d')}</p>""",
        img("cooperative-agricole.jpg",
            "Producteurs malgaches triant mangues, bananes et ananas sous un abri ventilé",
            "Premier pilote : le terrain, pas la théorie"))

    corps += bloc(
        f"""      <h2 data-t="social.m3t">{t('social.m3t')}</h2>
      <p data-t="social.m3d">{t('social.m3d')}</p>""",
        img("rehabilitation-center.jpg",
            "Séance de rééducation dans un centre accessible : kinésithérapeute, "
            "patient en fauteuil, appareil d'aide à la marche",
            "Rééducation et accompagnement humain"),
        inverse=True)

    corps += f"""
  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Impact</p>
      <h2 data-t="social.dm_t">{t('social.dm_t')}</h2>
      <p class="lead" style="margin-top:1rem; max-width:64ch" data-t="social.eco_sys">{t('social.eco_sys')}</p>
    </div>
    <div class="duo" style="margin-top:1.5rem">
      <article class="verre carte reveler">
        <h3 data-t="social.dm1t">{t('social.dm1t')}</h3>
        <p data-t="social.dm1d">{t('social.dm1d')}</p>
      </article>
      <article class="verre carte reveler">
        <h3 data-t="social.dm2t">{t('social.dm2t')}</h3>
        <p data-t="social.dm2d">{t('social.dm2d')}</p>
      </article>
    </div>
    <div class="verre-clair reveler" style="margin-top:1.4rem; padding:1.7rem">
      <h3 data-t="social.rep_t">{t('social.rep_t')}</h3>
      <p style="color:var(--doux); margin-top:.6rem" data-t="social.rep_d">{t('social.rep_d')}</p>
    </div>
  </section>
"""

    actes = "".join(f"""      <article class="verre carte reveler">
        <h3 data-t="social.{cle}t">{t(f'social.{cle}t')}</h3>
        <p data-t="social.{cle}d">{t(f'social.{cle}d')}</p>
      </article>""" for cle in ("rbt", "a0", "a1", "a2", "a3"))

    corps += f"""
  <section class="section">
    <p class="etiq" data-t="social.actes_t">{t('social.actes_t')}</p>
    <div class="duo" style="margin-top:1.4rem">
{actes}
    </div>
  </section>
"""

    phases = "".join(f"""      <article class="verre carte reveler">
        <h3 data-t="social.ph{i}t">{t(f'social.ph{i}t')}</h3>
        <p data-t="social.ph{i}d">{t(f'social.ph{i}d')}</p>
        {f'<p class="carte-note" data-t="social.ph{i}l">{t(f"social.ph{i}l")}</p>' if i == 2 else ''}
      </article>""" for i in (1, 2, 3))

    corps += f"""
  <section class="section">
    <p class="etiq" data-t="social.phases_t">{t('social.phases_t')}</p>
    <div class="trio" style="margin-top:1.4rem">
{phases}
    </div>
  </section>
"""

    corps += bloc(
        f"""      <p class="etiq">Recherche</p>
      <h2>R'EXOIA</h2>
      <p data-t="social.ph1d">{t('social.ph1d')}</p>""",
        img("neuroexo-research.jpg",
            "Laboratoire de neuro-réhabilitation : patient en exosquelette, "
            "équipe pluridisciplinaire, écrans de signaux neuronaux",
            "La recherche, l'IA et la rééducation"),
        inverse=True)

    finances = "".join(f"""      <article class="verre carte carte-img reveler">
        <img src="assets/{nom}" alt="{alt}" width="1152" height="864" loading="lazy" decoding="async" />
        <h3 data-t="social.{cle}t">{t(f'social.{cle}t')}</h3>
        <p data-t="social.{cle}d">{t(f'social.{cle}d')}</p>
      </article>""" for cle, nom, alt in (
        ("f2", "cooperative-agricole.jpg",
         "Coopérative : tri des fruits et séchoir solaire en arrière-plan"),
        ("f3", "fablab-pmr.jpg",
         "FabLab : technicien et utilisateur de fauteuil roulant ajustant une pièce imprimée"),
        ("f4", "realia-virtual-economy.jpg",
         "Poste de travail IA : écrans de réseaux de neurones et de production de contenus"),
        ("f1", "logistique-import-export.jpg",
         "Port de l'océan Indien : grues, conteneurs et entrepôt logistique"),
    ))

    corps += f"""
  <section class="section">
    <p class="etiq" data-t="social.fin_t">{t('social.fin_t')}</p>
    <p class="lead" style="margin:.9rem 0 0; max-width:60ch" data-t="social.fin_lead">{t('social.fin_lead')}</p>
    <div class="duo" style="margin-top:1.6rem">
{finances}
    </div>
  </section>
"""

    corps += bloc(
        f"""      <p class="etiq">Sur place</p>
      <h2 data-t="social.sol_t">{t('social.sol_t')}</h2>
      <p data-t="social.sol_d">{t('social.sol_d')}</p>
      <h3 style="margin-top:1.6rem" data-t="social.sol_c1t">{t('social.sol_c1t')}</h3>
      <p data-t="social.sol_c1d">{t('social.sol_c1d')}</p>
      <h3 style="margin-top:1.2rem" data-t="social.sol_c2t">{t('social.sol_c2t')}</h3>
      <p data-t="social.sol_c2d">{t('social.sol_c2d')}</p>""",
        img("formation-emancipation.jpg",
            "Salle de formation inclusive : jeunes femmes et hommes, dont un utilisateur "
            "de fauteuil roulant, apprenant avec un formateur local",
            "Formation et émancipation"))

    corps += bloc(
        f"""      <p class="etiq">Ambition</p>
      <h2 data-t="social.amb_t">{t('social.amb_t')}</h2>
      <p data-t="social.amb_d">{t('social.amb_d')}</p>
      <h3 style="margin-top:1.6rem" data-t="social.close_t">{t('social.close_t')}</h3>
      <p data-t="social.close_d">{t('social.close_d')}</p>""",
        img("digital-twin-neuroexo.jpg",
            "Jumeau numérique biomécanique : modèle des membres inférieurs, signaux "
            "cérébraux et ondes musculaires projetés sur un grand écran",
            "Le jumeau numérique, phase 1"),
        inverse=True)

    corps += f"""
  <section class="section" style="text-align:center">
    <a href="wishlist.html" class="bouton" data-t="social.cta">{t('social.cta')}</a>
    <p class="mono faible" style="margin-top:1.2rem; font-size:.8rem">
      <a href="wishlist.html">Wishlist</a> ·
      <a href="boutique.html">Boutique</a> ·
      <a href="[LIEN_GITHUB]" rel="noopener">GitHub</a>
    </p>
  </section>
"""
    return enveloppe("social", corps, t("social.titre"), t("social.lead")[:150])


def page_archi() -> str:
    p = PAGES["archi"]
    visuel = """      <figure class="profondeur" style="margin:0">
        <div class="cadre-neon">
          <img src="assets/portrait.jpg" alt="Portrait de l'Architecte, en fauteuil" loading="lazy" />
        </div>
        <figcaption class="mono faible" style="font-size:.64rem; margin-top:.8rem; letter-spacing:.1em" data-t="archi.photo_leg">{t('archi.photo_leg')}</figcaption>
      </figure>""".replace("{t('archi.photo_leg')}", t("archi.photo_leg"))

    corps = bloc(
        f"""{badge('archi')}
      <h1 style="margin:1.1rem 0 0" data-t="archi.titre">{t('archi.titre')}</h1>
      <p style="margin-top:1.4rem; font-style:italic; color:var(--doux)" data-t="archi.intro">{t('archi.intro')}</p>""",
        visuel)

    # Premier chapitre : en split, avec le fleuve — les racines se montrent.
    paras1 = "\n".join(f'      <p data-t="archi.{k}">{t("archi." + k)}</p>' for k in ("p1", "p2"))
    corps += f"""
  <section class="split">
    <div class="split-texte reveler">
      <h2 style="font-size:1.5rem; margin-bottom:1rem" data-t="archi.h1">{t('archi.h1')}</h2>
{paras1}
    </div>
    <div class="split-visuel reveler">
      <figure class="profondeur" style="margin:0">
        <div class="cadre-neon">
          <img src="assets/archi-guyane.jpg" width="1344" height="768" class="cadre" loading="lazy"
               alt="Fleuve de Guyane à l'aube, pirogue, brume sur l'eau noire" />
        </div>
        <figcaption class="mono faible" style="font-size:.64rem; margin-top:.7rem">Le fleuve, la forêt</figcaption>
      </figure>
    </div>
  </section>"""

    for h, ps in (("h2", ("p3", "p4", "p5")), ("h3", ("p6", "p7", "p8"))):
        paras = "\n".join(f'      <p data-t="archi.{k}">{t("archi." + k)}</p>' for k in ps)
        corps += f"""
  <section class="section">
    <div class="verre reveler" style="padding:2rem">
      <h2 style="font-size:1.5rem; margin-bottom:1rem" data-t="archi.{h}">{t('archi.' + h)}</h2>
{paras}
    </div>
  </section>"""

    corps += f"""
  <section class="section" style="text-align:center">
    <a href="meta-projet-social.html" class="bouton" data-t="archi.cta">{t('archi.cta')}</a>
  </section>
"""
    return enveloppe("archi", corps, t("archi.titre")[:60], t("archi.intro")[:150])


def page_app() -> str:
    p = PAGES["app"]
    # maquette dessinée en CSS : un rendu d'IA pour une interface n'aurait
    # aucun sens, et une capture d'écran d'une app qui n'existe pas serait un mensonge
    maquette = """      <div class="mockup-app reveler">
        <div class="phone">
          <span class="ph-encoche"></span>
          <p class="ph-titre" data-t="app.s1t">{0}</p>
          <div class="ph-ligne"></div><div class="ph-ligne courte"></div>
          <span class="ph-puce" data-t="app.s1a">{1}</span>
        </div>
        <div class="phone">
          <span class="ph-encoche"></span>
          <p class="ph-titre" data-t="app.s2t">{2}</p>
          <div class="ph-ligne"></div><div class="ph-ligne"></div><div class="ph-ligne courte"></div>
          <span class="ph-puce" data-t="app.s2d">{3}</span>
        </div>
        <div class="phone">
          <span class="ph-encoche"></span>
          <p class="ph-titre" data-t="app.s3t">{4}</p>
          <div class="ph-ligne"></div><div class="ph-ligne courte"></div>
          <span class="ph-puce" data-t="app.s3d">{5}</span>
        </div>
      </div>""".format(
        t('app.s1t'), t('app.s1a'),
        t('app.s2t'), t('app.s2d'),
        t('app.s3t'), t('app.s3d'))

    corps = f"""
  <section class="section hero-app">
    {badge('app')}
    <h1 style="margin:1.1rem 0 0" data-t="app.titre">{t('app.titre')}</h1>
    <p class="lead" style="margin-top:1.2rem; max-width:62ch" data-t="app.lead">{t('app.lead')}</p>
    <p class="chapo" style="max-width:64ch" data-t="app.why">{t('app.why')}</p>
    {maquette}
  </section>
"""

    cartes = "".join(f"""      <article class="verre carte reveler">
        <h3 data-t="app.s{i}t">{t(f'app.s{i}t')}</h3>
        <p data-t="app.s{i}d">{t(f'app.s{i}d')}</p>
        <p class="carte-note" data-t="app.s{i}a">{t(f'app.s{i}a')}</p>
        {f'<p class="carte-note" data-t="app.s{i}b">{t(f"app.s{i}b")}</p>' if i == 1 else ''}
      </article>""" for i in (1, 2, 3))

    corps += f"""
  <section class="section">
    <div class="trio" style="margin-top:1rem">
{cartes}
    </div>
  </section>

  <section class="section">
    <div class="verre-clair reveler" style="padding:1.8rem">
      <p class="etiq" data-t="app.v2t">{t('app.v2t')}</p>
      <p style="color:var(--doux); max-width:60rem" data-t="app.v2d">{t('app.v2d')}</p>
    </div>
  </section>

  <section class="section" style="text-align:center">
    <h2 data-t="app.date_t">{t('app.date_t')}</h2>
    <p class="lead" style="margin-top:.8rem" data-t="app.date_d">{t('app.date_d')}</p>
    <a href="blueprint.html" class="bouton" style="margin-top:1.6rem" data-t="app.cta">{t('app.cta')}</a>
  </section>
"""
    return enveloppe("app", corps, t("app.titre"), t("app.lead")[:150])


def page_cabinet() -> str:
    p = PAGES["cabinet"]

    icones = {
        1: '<path d="M11 4a7 7 0 1 0 4.9 12L21 21"/><path d="M8 11h6M11 8v6"/>',
        2: '<path d="M4 5h11a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M8 11h4"/>',
        3: '<path d="M12 20v-5"/><path d="M8.5 12.5a5 5 0 0 1 7 0"/><path d="M5.5 9.5a9 9 0 0 1 13 0"/><circle cx="12" cy="17" r="1.4" fill="#d4af37" stroke="none"/>',
        4: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 13l1.8 1.8 3.2-3.6"/>',
    }

    def svg(i: int) -> str:
        return (f'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d4af37" '
                f'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" '
                f'aria-hidden="true">{icones[i]}</svg>')

    visuel = f"""      <figure class="profondeur" style="margin:0">
        <div class="cadre-neon">
{img("cabinet-services.jpg", "Bureau de travail réel : plans dépliés, ordinateur portable, tasse et plante",
     "")}
        </div>
        <figcaption class="mono faible" style="font-size:.64rem; margin-top:.8rem; letter-spacing:.1em" data-t="cabinet.figure_leg">{t('cabinet.figure_leg')}</figcaption>
      </figure>"""

    corps = bloc(
        f"""<p class="etiq" data-t="cabinet.etiq">{t('cabinet.etiq')}</p>
      <h1 style="margin:.6rem 0 0" data-t="cabinet.titre">{t('cabinet.titre')}</h1>
      <p class="lead" style="margin-top:1.4rem" data-t="cabinet.intro">{t('cabinet.intro')}</p>""",
        visuel)

    # Le bloc éthique : encart distinct, bordé d'or.
    corps += f"""
  <section class="section">
    <div class="encart-ethique reveler" style="padding:1.9rem">
      <p class="etiq" style="color:#f2c65a" data-t="cabinet.ethique_t">{t('cabinet.ethique_t')}</p>
      <p style="margin:0" data-t="cabinet.ethique">{t('cabinet.ethique')}</p>
    </div>
  </section>
"""

    # Les quatre domaines, sur deux colonnes.
    cartes = "\n".join(f"""      <article class="carte-pro reveler">
        <div class="carte-tete">{svg(i)}<span class="carte-num">0{i}</span></div>
        <h3 data-t="cabinet.c{i}t">{t(f'cabinet.c{i}t')}</h3>
        <p class="carte-sous" data-t="cabinet.c{i}s">{t(f'cabinet.c{i}s')}</p>
        <p data-t="cabinet.c{i}d">{t(f'cabinet.c{i}d')}</p>
      </article>""" for i in (1, 2, 3, 4))

    corps += f"""
  <section class="section">
    <p class="etiq" data-t="cabinet.domaine_t">{t('cabinet.domaine_t')}</p>
    <div class="quatuor" style="margin-top:1.4rem">
{cartes}
    </div>
  </section>
"""

    # Études de terrain et accessibilité PMR, avec le visuel mesuré.
    puces = "".join(f'<li>{x}</li>' for x in t("cabinet.pmr_puces").split("|"))
    corps += f"""
  <section class="split inverse">
    <div class="split-texte reveler">
      <p class="etiq" data-t="cabinet.pmr_t">{t('cabinet.pmr_t')}</p>
      <p data-t="cabinet.pmr_d" style="margin-top:1rem">{t('cabinet.pmr_d')}</p>
      <ul class="puces">{puces}</ul>
    </div>
    <div class="split-visuel reveler">
      <figure class="profondeur" style="margin:0">
        <div class="cadre-neon">
{img("cabinet-pmr.jpg", "Personne en fauteuil roulant franchissant un seuil plat, large ouverture en bois", "")}
        </div>
        <figcaption class="mono faible" style="font-size:.64rem; margin-top:.8rem; letter-spacing:.1em" data-t="cabinet.pmr_leg">{t('cabinet.pmr_leg')}</figcaption>
      </figure>
    </div>
  </section>
"""

    # L'offre : équipe d'assistants spécialisés (aucun jargon technique).
    corps += f"""
  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Offre</p>
      <h2 style="max-width:30ch" data-t="cabinet.offre_t">{t('cabinet.offre_t')}</h2>
      <p class="lead" style="margin-top:1rem; max-width:64ch" data-t="cabinet.offre_d">{t('cabinet.offre_d')}</p>
    </div>
  </section>

  <section class="section">
    <p class="etiq" data-t="cabinet.met_t">{t('cabinet.met_t')}</p>
    <p style="margin-top:.9rem; max-width:64ch; color:var(--doux)" data-t="cabinet.met_d">{t('cabinet.met_d')}</p>
    <div class="trio" style="margin-top:1.6rem">
      <article class="verre carte reveler">
        <span class="etat encours" data-t="cabinet.m1t">{t('cabinet.m1t')}</span>
        <p data-t="cabinet.m1d">{t('cabinet.m1d')}</p>
      </article>
      <article class="verre carte reveler">
        <span class="etat next" data-t="cabinet.m2t">{t('cabinet.m2t')}</span>
        <p data-t="cabinet.m2d">{t('cabinet.m2d')}</p>
      </article>
      <article class="verre carte reveler">
        <span class="etat avenir" data-t="cabinet.m3t">{t('cabinet.m3t')}</span>
        <p data-t="cabinet.m3d">{t('cabinet.m3d')}</p>
      </article>
    </div>
  </section>

  <section class="section">
    <p class="etiq" data-t="cabinet.ben_t">{t('cabinet.ben_t')}</p>
    <div class="trio" style="margin-top:1.4rem">
      <article class="verre carte reveler">
        <h3 data-t="cabinet.b1t">{t('cabinet.b1t')}</h3>
        <p data-t="cabinet.b1d">{t('cabinet.b1d')}</p>
      </article>
      <article class="verre carte reveler">
        <h3 data-t="cabinet.b2t">{t('cabinet.b2t')}</h3>
        <p data-t="cabinet.b2d">{t('cabinet.b2d')}</p>
      </article>
      <article class="verre carte reveler">
        <h3 data-t="cabinet.b3t">{t('cabinet.b3t')}</h3>
        <p data-t="cabinet.b3d">{t('cabinet.b3d')}</p>
      </article>
    </div>
  </section>

  <section class="section" style="text-align:center">
    <a href="mailto:[EMAIL_PRO]" class="bouton" data-t="cabinet.cta_audit">{t('cabinet.cta_audit')}</a>
  </section>
"""

    # Prise de contact.
    corps += f"""
  <section class="section" id="contact">
    <div class="encart-contact reveler" style="padding:1.9rem; text-align:center">
      <h2 style="font-size:1.4rem; margin-bottom:.7rem" data-t="cabinet.contact_t">{t('cabinet.contact_t')}</h2>
      <p style="margin:0 auto 1.5rem; max-width:52ch" data-t="cabinet.contact">{t('cabinet.contact')}</p>
      <a href="mailto:[EMAIL_PRO]" class="bouton" data-t="cabinet.cta">{t('cabinet.cta')}</a>
      <p class="mono faible" style="font-size:.68rem; margin-top:1rem; letter-spacing:.1em">[EMAIL_PRO] · [WHATSAPP_PRO]</p>
    </div>
  </section>
"""
    return enveloppe("cabinet", corps, t("cabinet.titre")[:60], t("cabinet.intro")[:150])


def page_wishlist() -> str:
    prix = {"1": "≈ 2 000 €", "2": "≈ 185 €", "3": "≈ 45 €", "4": "≈ 120 €"}
    lignes = "\n".join(f"""      <div class="ligne-wish">
        <span class="n">{i:02d}</span>
        <div>
          <h2 data-t="wish.l{i}">{t(f'wish.l{i}')}</h2>
          <p data-t="wish.l{i}d">{t(f'wish.l{i}d')}</p>
        </div>
        <span class="prix">{prix[str(i)]}</span>
      </div>""" for i in range(1, 5))

    visuel = img("wish-materiel.jpg",
                 "Les quatre composants de la wishlist alignés sur fond noir",
                 "Les quatre maillons manquants")

    corps = bloc(
        f"""{badge('wish')}
      <h1 style="margin:1.1rem 0 0" data-t="wish.titre">{t('wish.titre')}</h1>
      <p class="lead" style="margin-top:1.2rem" data-t="wish.lead">{t('wish.lead')}</p>
      <div style="display:flex; flex-wrap:wrap; gap:.8rem; margin-top:1.8rem">
        <a href="[LIEN_LISTE_AMAZON]" class="bouton" data-t="wish.bouton_amazon">{t('wish.bouton_amazon')}</a>
        <a href="[LIEN_KOFI]" class="bouton-fantome" data-t="wish.cagnottes">{t('wish.cagnottes')}</a>
      </div>
      <p class="mentions" style="margin-top:1.6rem" data-t="wish.note">{t('wish.note')}</p>""",
        visuel)

    corps += f"""
  <section class="section">
    <div class="verre reveler" style="padding:1.6rem">
{lignes}
    </div>
  </section>
"""
    return enveloppe("wish", corps, t("wish.titre"), t("wish.lead")[:150])


def page_boutique() -> str:
    ampoules = "".join('        <span class="ampoule"></span>\n' for _ in range(22))
    random.seed(7)
    flocons = "".join(
        f'    <span class="flocon" style="left:{random.randint(2, 98)}%; '
        f'animation-duration:{random.randint(11, 22)}s; animation-delay:-{random.randint(0, 20)}s; '
        f'width:{random.choice([3,4,5,6])}px; height:{random.choice([3,4,5,6])}px"></span>\n'
        for _ in range(16))

    liens = {"1": "[LIEN_AFFILIE_AMAZON_TECH]", "2": "[LIEN_AFFILIE_MAKER]",
             "3": "[LIEN_AFFILIE_LIVRES]", "4": "[LIEN_AFFILIE_GENERAL]"}
    emojis = {"1": "🎧", "2": "🛠️", "3": "📚", "4": "🎁"}
    vitrines = "\n".join(f"""        <a class="verre vitrine" href="{liens[str(i)]}">
          <span class="emoji">{emojis[str(i)]}</span>
          <h2 data-t="boutique.v{i}">{t(f'boutique.v{i}')}</h2>
          <p data-t="boutique.v{i}d">{t(f'boutique.v{i}d')}</p>
          <span class="balise">{liens[str(i)]}</span>
        </a>""" for i in range(1, 5))

    enseignes = "".join(
        f'        <a href="[LIEN_AFFILIE_{n}]" class="bouton-fantome">{lbl}</a>\n'
        for n, lbl in (("AMAZON", "Amazon"), ("FNAC", "Fnac"), ("CDISCOUNT", "Cdiscount"),
                       ("ALIEXPRESS", "AliExpress"), ("CULTURA", "Cultura")))

    corps = f"""
  <div class="guirlande" aria-hidden="true">
{ampoules}  </div>
  <div class="flocons" aria-hidden="true">
{flocons}  </div>
"""
    corps += bloc(
        f"""{badge('boutique')}
      <h1 style="margin:1.1rem 0 0" data-t="boutique.titre">{t('boutique.titre')}</h1>
      <p class="lead" style="margin-top:1.2rem" data-t="boutique.lead">{t('boutique.lead')}</p>
      <p class="etiq" style="margin-top:2rem" data-t="boutique.enseignes_titre">{t('boutique.enseignes_titre')}</p>
      <p style="font-size:.95rem" data-t="boutique.enseignes">{t('boutique.enseignes')}</p>
      <div style="display:flex; flex-wrap:wrap; gap:.6rem">
{enseignes}      </div>""",
        img("boutique-cadeaux.jpg",
            "Cadeaux de Noël sous une lumière néon magenta et cyan",
            "Noël cyberpunk"))

    corps += f"""
  <section class="section">
    <p class="etiq">Vitrines</p>
    <div class="vitrines" style="margin-top:1.4rem">
{vitrines}
    </div>
  </section>

  <section class="section" style="text-align:center">
    <p style="margin-bottom:1.2rem" data-t="boutique.noel">{t('boutique.noel')}</p>
    <a href="index.html#financer" class="bouton" data-t="commun.soutenir">{t('commun.soutenir')}</a>
    <p class="mentions" style="margin-top:2rem" data-t="boutique.mention">{t('boutique.mention')}</p>
  </section>
"""
    return enveloppe("boutique", corps, t("boutique.titre")[:60], t("boutique.lead")[:150])



def page_blueprint() -> str:
    p = PAGES["blueprint"]

    donut = (
        '      <div class="profondeur" style="display:grid; place-items:center; gap:1.4rem">\n'
        '        <div class="donut" role="img" aria-label="40 % trésorerie, 30 % rendement, 20 % R&D, 10 % mécénat"></div>\n'
        '        <div class="legende-donut">\n'
        f'          <span><i style="background:#8b5cf6"></i>40 % <em data-t="blueprint.w40">{t("blueprint.w40")}</em></span>\n'
        f'          <span><i style="background:#d4af37"></i>30 % <em data-t="blueprint.w30">{t("blueprint.w30")}</em></span>\n'
        f'          <span><i style="background:#a855f7"></i>20 % <em data-t="blueprint.w20">{t("blueprint.w20")}</em></span>\n'
        f'          <span><i style="background:#ffd166"></i>10 % <em data-t="blueprint.w10">{t("blueprint.w10")}</em></span>\n'
        '        </div>\n'
        '      </div>')

    corps = bloc(
        f"""{badge('blueprint')}
      <h1 style="margin:1.1rem 0 0" data-t="blueprint.titre">{t('blueprint.titre')}</h1>
      <p class="lead" style="margin-top:1.2rem" data-t="blueprint.sous">{t('blueprint.sous')}</p>""",
        donut)

    corps += f"""
  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Trajectoire</p>
      <h2 style="max-width:26ch" data-t="blueprint.accroche">{t('blueprint.accroche')}</h2>
    </div>
    <div class="trio" style="margin-top:1.6rem">
      <article class="verre carte reveler">
        <span class="etat encours" data-t="blueprint.e1s">{t('blueprint.e1s')}</span>
        <h3 data-t="blueprint.e1t">{t('blueprint.e1t')}</h3>
        <p data-t="blueprint.e1d">{t('blueprint.e1d')}</p>
      </article>
      <article class="verre carte reveler">
        <span class="etat next" data-t="blueprint.e2s">{t('blueprint.e2s')}</span>
        <h3 data-t="blueprint.e2t">{t('blueprint.e2t')}</h3>
        <p data-t="blueprint.e2d">{t('blueprint.e2d')}</p>
      </article>
      <article class="verre carte reveler">
        <span class="etat avenir" data-t="blueprint.e3s">{t('blueprint.e3s')}</span>
        <h3 data-t="blueprint.e3t">{t('blueprint.e3t')}</h3>
        <p data-t="blueprint.e3d">{t('blueprint.e3d')}</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Géographie</p>
      <h2 data-t="blueprint.axe_t">{t('blueprint.axe_t')}</h2>
      <p class="lead" style="margin-top:1rem; max-width:64ch" data-t="blueprint.axe_d">{t('blueprint.axe_d')}</p>
      <p style="margin-top:.9rem; max-width:64ch; color:var(--doux)" data-t="blueprint.axe_d2">{t('blueprint.axe_d2')}</p>
    </div>
  </section>
"""

    corps += f"""
    <section class="section">
      <div class="verre-clair reveler" style="padding:2rem">
      <p class="etiq" data-t="blueprint.tr_titre">{t('blueprint.tr_titre')}</p>
      <p style="color:var(--doux); max-width:52rem" data-t="blueprint.tr_txt">{t('blueprint.tr_txt')}</p>
      <ul class="points">
        <li data-t="blueprint.tr_1">{t('blueprint.tr_1')}</li>
        <li data-t="blueprint.tr_2">{t('blueprint.tr_2')}</li>
        <li data-t="blueprint.tr_3">{t('blueprint.tr_3')}</li>
      </ul>
      <p class="mentions" style="margin-top:1.4rem; text-align:left" data-t="blueprint.tr_note">{t('blueprint.tr_note')}</p>
    </div>
  </section>

  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Architecture</p>
      <h2 data-t="blueprint.archi_titre">{t('blueprint.archi_titre')}</h2>
      <p class="lead" style="margin-top:1rem" data-t="blueprint.archi_lead">{t('blueprint.archi_lead')}</p>
    </div>
    <div class="duo">
      <article class="verre carte reveler">
        <h3 data-t="blueprint.r1t">{t('blueprint.r1t')}</h3>
        <p data-t="blueprint.r1d">{t('blueprint.r1d')}</p>
      </article>
      <article class="verre carte reveler">
        <h3 data-t="blueprint.r2t">{t('blueprint.r2t')}</h3>
        <p data-t="blueprint.r2d">{t('blueprint.r2d')}</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Structure juridique</p>
      <h2 data-t="blueprint.jur_titre">{t('blueprint.jur_titre')}</h2>
      <p class="lead" style="margin-top:1rem" data-t="blueprint.jur_lead">{t('blueprint.jur_lead')}</p>
    </div>
    <div class="juridique reveler">
      <article class="verre carte">
        <span class="rang">01</span>
        <h3 data-t="blueprint.ong_t">{t('blueprint.ong_t')}</h3>
        <p data-t="blueprint.ong_d">{t('blueprint.ong_d')}</p>
      </article>
      <div class="lien-juridique">
        <span class="trait"></span>
        <span class="mono" data-t="blueprint.flux">{t('blueprint.flux')}</span>
        <span class="trait"></span>
      </div>
      <article class="verre carte">
        <span class="rang">02</span>
        <h3 data-t="blueprint.holding_t">{t('blueprint.holding_t')}</h3>
        <p data-t="blueprint.holding_d">{t('blueprint.holding_d')}</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Waterfall</p>
      <h2 data-t="blueprint.wf_titre">{t('blueprint.wf_titre')}</h2>
      <p class="lead" style="margin-top:1rem" data-t="blueprint.wf_lead">{t('blueprint.wf_lead')}</p>
    </div>
    <div class="waterfall reveler">
      <div class="part w40"><strong>40 %</strong><span data-t="blueprint.w40">{t('blueprint.w40')}</span><p data-t="blueprint.w40d">{t('blueprint.w40d')}</p></div>
      <div class="part w30"><strong>30 %</strong><span data-t="blueprint.w30">{t('blueprint.w30')}</span><p data-t="blueprint.w30d">{t('blueprint.w30d')}</p></div>
      <div class="part w20"><strong>20 %</strong><span data-t="blueprint.w20">{t('blueprint.w20')}</span><p data-t="blueprint.w20d">{t('blueprint.w20d')}</p></div>
      <div class="part w10"><strong>10 %</strong><span data-t="blueprint.w10">{t('blueprint.w10')}</span><p data-t="blueprint.w10d">{t('blueprint.w10d')}</p></div>
    </div>
  </section>

  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Tech-for-equity</p>
      <h2 data-t="blueprint.tech_titre">{t('blueprint.tech_titre')}</h2>
      <p class="lead" style="margin-top:1rem" data-t="blueprint.tech_lead">{t('blueprint.tech_lead')}</p>
    </div>
    <div class="trio">
      <article class="verre carte palier reveler">
        <h3 data-t="blueprint.tier1">{t('blueprint.tier1')}</h3>
        <p data-t="blueprint.tier1d">{t('blueprint.tier1d')}</p>
      </article>
      <article class="verre carte palier reveler">
        <h3 data-t="blueprint.tier2">{t('blueprint.tier2')}</h3>
        <p data-t="blueprint.tier2d">{t('blueprint.tier2d')}</p>
      </article>
      <article class="verre carte palier reveler">
        <h3 data-t="blueprint.tier3">{t('blueprint.tier3')}</h3>
        <p data-t="blueprint.tier3d">{t('blueprint.tier3d')}</p>
      </article>
    </div>
  </section>

  <section class="split inverse">
    <div class="split-texte reveler">
      <p class="etiq">Réseau</p>
      <h2 data-t="blueprint.archi_titre">{t('blueprint.archi_titre')}</h2>
      <p data-t="blueprint.archi_lead">{t('blueprint.archi_lead')}</p>
    </div>
    <div class="split-visuel reveler">
      <figure class="profondeur" style="margin:0">
        <div class="cadre-neon">
          <img src="assets/blueprint-reseau.jpg" alt="Réseau de R'Station reliées par des arcs lumineux" loading="lazy" />
        </div>
        <figcaption class="mono faible" style="font-size:.66rem; margin-top:.7rem">R'Station Network — modèle réticulaire</figcaption>
      </figure>
    </div>
  </section>

  <section class="section">
    <div class="section-titre reveler">
      <p class="etiq">Roadmap</p>
      <h2 data-t="blueprint.road_titre">{t('blueprint.road_titre')}</h2>
    </div>
    <ol class="roadmap reveler">
      <li><span class="rangee">P0</span><div><h3 data-t="blueprint.p0t">{t('blueprint.p0t')}</h3><p data-t="blueprint.p0d">{t('blueprint.p0d')}</p></div></li>
      <li><span class="rangee">P1</span><div><h3 data-t="blueprint.p1t">{t('blueprint.p1t')}</h3><p data-t="blueprint.p1d">{t('blueprint.p1d')}</p></div></li>
      <li><span class="rangee">P2</span><div><h3 data-t="blueprint.p2t">{t('blueprint.p2t')}</h3><p data-t="blueprint.p2d">{t('blueprint.p2d')}</p></div></li>
      <li><span class="rangee">P3</span><div><h3 data-t="blueprint.p3t">{t('blueprint.p3t')}</h3><p data-t="blueprint.p3d">{t('blueprint.p3d')}</p></div></li>
    </ol>
    <p class="mentions" style="margin-top:2rem; text-align:left" data-t="blueprint.legal">{t('blueprint.legal')}</p>
  </section>

  <section class="section" style="text-align:center">
    <a href="meta-projet-social.html" class="bouton" data-t="blueprint.cta">{t('blueprint.cta')}</a>
  </section>
"""
    return enveloppe("blueprint", corps, t("blueprint.titre")[:60], t("blueprint.sous")[:150])


# ===========================================================================
def nettoyer_html(html: str) -> str:
    """Deux corrections que html-validate signalait sur les douze pages.

    1. `<meta />`, `<link />`, `<img />` : la barre oblique finale est une
       syntaxe XHTML. En HTML5 on ferme sans, et le navigateur n'a rien à
       deviner.
    2. `&` nu dans le texte doit s'écrire `&amp;`, sinon il est lu comme le
       début d'une entité.
    """
    html = re.sub(r"<(meta|link|img|br|source|input)((?:[^>])*?)\s*/>", r"<\1\2>", html)
    html = re.sub(r"&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,10}|#\d{1,6}|#x[0-9a-fA-F]{1,6});)", "&amp;", html)
    # Les deux imports de modules vivent dans des blocs qui ne sont pas des
    # f-strings : le numéro de version y restait écrit « {VERSION} », donc le
    # navigateur demandait « hero3d.js?v={VERSION} » et récoltait un 404.
    html = html.replace("{VERSION}", VERSION)
    # espaces en fin de ligne : invisibles à l'écran, signalés par le validateur
    html = "\n".join(ligne.rstrip() for ligne in html.split("\n"))
    return html


def main() -> None:
    pages = {
        "index": page_index(),
        "virtuel": page_virtuel(),
        "neuroexo": page_simple(
            "neuroexo",
            img("neuroexo-harnais.jpg", "Ceinture et baudrier techniques posés sur un fond noir",
                "Le harnais, avant montage"),
            img("neuroexo-blanking.jpg", "Chronogramme de stimulation et de signal EMG",
                "Stimulation et fenêtre de blanking"),
            journal_n=3),
        "devkit": page_simple(
            "devkit",
            img("devkit-usine.jpg",
                "Couloir de serveurs aux lignes de lumière violette et dorée",
                "L'usine logicielle"),
            img("devkit-coffre.jpg",
                "Coffre ouvert et vide sous une lumière dorée",
                "Ce qu'on retire avant de publier"),
            journal_n=2, extra=REALIDEVKIT_CHIFFRES),
        "realia": page_simple(
            "realia",
            img("realia-station.jpg",
                "Poste de travail nocturne à trois écrans",
                "La station de production"),
            img("realia-production.jpg",
                "Chaîne de production holographique : écrans, storyboards et onde audio",
                "Ce que la station produit"),
            extra="""  <section class="section">
    <div class="verre-clair reveler" style="padding:1.8rem">
      <h2 style="font-size:1.3rem; margin-bottom:.6rem" data-t="realia.lien_titre">%s</h2>
      <p data-t="realia.lien_txt">%s</p>
      <a href="lunagalaxie.html" class="bouton-fantome" data-t="realia.lien_cta">%s</a>
    </div>
  </section>
""" % (t("realia.lien_titre"), t("realia.lien_txt"), t("realia.lien_cta"))),
        "luna": page_luna(),
        "social": page_social(),
        "blueprint": page_blueprint(),
        "archi": page_archi(),
        "app": page_app(),
        "cabinet": page_cabinet(),
        "wish": page_wishlist(),
        "boutique": page_boutique(),
    }

    for page, html in pages.items():
        fichier = [p for p in ORDRE if p[0] == page][0][1]
        (RACINE / fichier).write_text(nettoyer_html(html), encoding="utf-8")
        print(f"  {fichier:26s} {len(html):>7} o")

    trad = {}
    for cle, valeurs in TOUS.items():
        trad[cle] = {"en": valeurs["en"], "pt": valeurs["pt"], "zh": valeurs["zh"]}
    trad["tiroir.suivant"] = {"en": "Next drawer", "pt": "Próxima gaveta", "zh": "下一个抽屉"}
    trad["tiroir.dernier"] = {"en": "Last drawer", "pt": "Última gaveta", "zh": "最后一个抽屉"}

    js = ("/* Généré par _source/generer.py — ne pas éditer à la main. */\n"
          "window.TRADUCTIONS = ")
    js += json.dumps(trad, ensure_ascii=False, indent=0).replace("\n", "")
    js += ";\n"
    (RACINE / "traductions.js").write_text(js, encoding="utf-8")

    # Balayage final : les pages écrites à la main (affiliations.html) passent
    # par le même nettoyage, sinon elles gardent la syntaxe XHTML.
    for f in RACINE.glob("*.html"):
        f.write_text(nettoyer_html(f.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"  traductions.js             {len(js):>7} o ({len(trad)} clés)")


if __name__ == "__main__":
    main()
