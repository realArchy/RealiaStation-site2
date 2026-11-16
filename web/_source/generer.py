"""Génère les dix pages du site et le dictionnaire i18n.

Une seule source (contenu_1.py + contenu_2.py), quatre langues :
  - le français est écrit en dur dans le HTML (lisible sans JavaScript, indexable) ;
  - l'anglais, le portugais et le chinois sont dans i18n.js, appliqués au chargement.

Chaque texte traduisible porte `data-t="cle"`. Les clés sont identiques partout.
"""
from __future__ import annotations

import json
import pathlib
import sys

RACINE = pathlib.Path("/home/realia/projects/neuro-exo-project/web")
sys.path.insert(0, str(RACINE / "_source"))

from contenu_1 import ACCUEIL, NAV, ORIENT  # noqa: E402
from contenu_2 import PAGES  # noqa: E402

FR = "fr"

# page -> (fichier, clé audio, position du motif, taille motif)
ORDRE = [
    ("index", "index.html", "luna-01-aventure", "bas-droite", 560),
    ("virtuel", "virtuel.html", "luna-02-virtuel", "haut-gauche", 340),
    ("neuroexo", "neuroexo-ai.html", "luna-03-neuroexo", "bas-gauche", 340),
    ("devkit", "devkit.html", "luna-04-devkit", "haut-droite", 320),
    ("realia", "realiastation.html", "luna-05-realiastation", "bas-droite", 340),
    ("luna", "lunagalaxie.html", "luna-06-ghostsheller", "bas-gauche", 300),
    ("social", "meta-projet-social.html", "luna-07-ilot-ong", "haut-gauche", 340),
    ("archi", "architecte.html", "luna-08-architecte", "bas-droite", 340),
    ("wish", "wishlist.html", "luna-09-wishlist", "haut-droite", 320),
    ("boutique", "boutique.html", "luna-10-noel", "bas-gauche", 340),
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
    """Texte français (langue écrite en dur)."""
    return TOUS[cle][FR]


def e(cle: str) -> str:
    return (TOUS[cle][FR]
            .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


NAV_HTML = """    <div class="nav-liens">
      <a href="index.html"{a0}>%s</a>
      <a href="virtuel.html"{a1}>%s</a>
      <a href="neuroexo-ai.html"{a2}>%s</a>
      <a href="devkit.html"{a3}>%s</a>
      <a href="realiastation.html"{a4}>%s</a>
      <a href="lunagalaxie.html"{a5}>%s</a>
      <a href="meta-projet-social.html"{a6}>%s</a>
      <a href="architecte.html"{a7}>%s</a>
      <a href="wishlist.html"{a8}>%s</a>
      <a href="boutique.html"{a9}>%s</a>
    </div>""" % tuple(t(f"nav.{k}") for k in
                     ("accueil", "virtuel", "neuroexo", "devkit", "realia",
                      "luna", "social", "archi", "wishlist", "boutique"))


def nav(page: str) -> str:
    idx = [p[0] for p in ORDRE].index(page)
    liens = NAV_HTML
    for i in range(10):
        liens = liens.replace("{a%d}" % i, ' aria-current="page"' if i == idx else "")
    return f"""<header class="entete">
  <nav class="nav">
    <div class="nav-haut">
      <a href="index.html" class="marque">
        <span class="marque-pastille">N</span>
        <span class="marque-texte">NEURO<span>EXO</span></span>
      </a>
      <div class="langues" role="group" aria-label="Langue">
        <button type="button" data-lang="fr" aria-pressed="true">FR</button>
        <button type="button" data-lang="en" aria-pressed="false">EN</button>
        <button type="button" data-lang="pt" aria-pressed="false">PT</button>
        <button type="button" data-lang="zh" aria-pressed="false">中文</button>
      </div>
      <a href="index.html#financer" class="bouton">{t('commun.soutenir')}</a>
    </div>
{liens}
  </nav>
</header>"""


def pied(extra: str = "") -> str:
    return f"""<footer class="pied">
  <div class="pied-corps">
    <p style="margin:0"><strong style="color:var(--texte)">NEUROEXO</strong> — <span data-t="commun.nonmed">{t('commun.nonmed')}</span></p>
    <div style="display:flex; gap:1.1rem; flex-wrap:wrap">
      <a href="affiliations.html" data-t="commun.pied_liens">{t('commun.pied_liens')}</a>
      <a href="wishlist.html" data-t="nav.wishlist">{t('nav.wishlist')}</a>
      <a href="boutique.html" data-t="nav.boutique">{t('nav.boutique')}</a>
      <a href="[LIEN_GITHUB]">GitHub</a>
    </div>
  </div>
  {extra}
</footer>"""


def scripts(page: str, audio: str, particules: bool = False) -> str:
    part = '\n<script src="particules.js" defer></script>' if particules else ""
    return f"""<script src="traductions.js" defer></script>
<script src="i18n.js" defer></script>
<script src="revele.js" defer></script>
<script src="tiroir.js" defer></script>
<script src="audio.js" defer></script>{part}
<script type="module" src="systeme.js"></script>"""


def tete(titre: str, description: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{titre} — Neuro-Exo</title>
<meta name="description" content="{description}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="style.css" />"""


def enveloppe(page: str, corps: str, audio: str, titre_page: str,
              description: str, particules: bool = False, extra_pied: str = "") -> str:
    idx, _, _, pos, taille = [p for p in ORDRE if p[0] == page][0]
    return f"""{tete(titre_page, description)}
</head>
<body data-page="{idx}" data-audio="assets/audio/{audio}.mp3">

<div class="ciel"></div>
<div class="systeme" data-position="{pos}" data-taille="{taille}" data-opacite="0.8"></div>

{nav(page)}

<main class="enveloppe">
{corps}
</main>

{pied(extra_pied)}

{scripts(page, audio, particules)}
</body>
</html>
"""


def badge(page: str) -> str:
    p = PAGES[page]
    return (f'    <span class="{p["classe"]}"><span class="point"></span>'
            f'<span data-t="{page}.badge">{t(page + ".badge")}</span></span>')


def cartes(page: str, items: list, colonnes: int = 3) -> str:
    blocs = []
    for i, (ct, cd) in enumerate(items, 1):
        blocs.append(f"""      <article class="verre carte reveler">
        <h3 data-t="{page}.c{i}t">{t(f'{page}.c{i}t')}</h3>
        <p data-t="{page}.c{i}d">{t(f'{page}.c{i}d')}</p>
      </article>""")
    classe = "trio" if colonnes == 3 else "duo"
    return f'    <div class="{classe}">\n' + "\n".join(blocs) + "\n    </div>"


def journal(page: str, n: int = 3) -> str:
    lignes = []
    for i in range(1, n + 1):
        cle = f"{page}.j{i}"
        if cle not in TOUS:
            continue
        texte = t(cle)
        date = texte.split(" — ")[0]
        reste = texte[len(date) + 3:] if " — " in texte else texte
        lignes.append(f"        <li><time>{date}</time><span class=\"txt\" data-t=\"{cle}\">{reste}</span></li>")
    return f"""    <div class="verre reveler" style="padding:1.8rem; margin-top:2rem">
      <p class="etiq">{t(page + '.journal_titre')}</p>
      <ul class="journal">
{chr(10).join(lignes)}
      </ul>
    </div>"""


# ===========================================================================
# Pages
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
  <section class="banniere">
    <canvas id="particules" aria-hidden="true"></canvas>
    <div class="banniere-corps">
      <span class="chantier beta"><span class="point"></span><span data-t="index.badge">{t('index.badge')}</span></span>
      <h1 style="margin:1.4rem 0 0"><span class="lueur-cyan" data-t="index.banniere">{t('index.banniere')}</span></h1>
      <p class="sous-titre" data-t="index.sous">{t('index.sous')}</p>
      <div class="banniere-actions">
        <button type="button" class="bouton" id="activer-experience" data-t="index.cta1">{t('index.cta1')}</button>
        <a href="#manifeste" class="bouton-fantome" data-t="index.cta2">{t('index.cta2')}</a>
      </div>
    </div>
  </section>

  <section class="section" id="manifeste">
    <div class="section-titre reveler">
      <p class="etiq">Manifeste</p>
      <h2 data-t="index.titre">{t('index.titre')}</h2>
      <p class="lead" style="margin-top:1.2rem" data-t="index.lead">{t('index.lead')}</p>
    </div>

    <div class="duo">
      <article class="verre carte reveler">
        <h3 data-t="index.histoire_titre">{t('index.histoire_titre')}</h3>
        <p data-t="index.histoire_1">{t('index.histoire_1')}</p>
      </article>
      <article class="verre carte reveler">
        <p data-t="index.histoire_2">{t('index.histoire_2')}</p>
      </article>
    </div>
  </section>

  <section class="section" id="chemin">
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
    <div class="verre-clair reveler" style="padding:2.6rem 1.6rem">
      <h2 data-t="commun.soutenir">{t('commun.soutenir')}</h2>
      <p class="lead" style="margin:1rem auto 0">
        Ko-fi · Tipeee · GitHub Sponsors — trois canaux ouverts, sans tout-ou-rien.
      </p>
      <div style="display:flex; flex-wrap:wrap; gap:.8rem; justify-content:center; margin-top:1.6rem">
        <a href="[LIEN_KOFI]" class="bouton">Ko-fi</a>
        <a href="[LIEN_TIPEEE]" class="bouton-fantome">Tipeee</a>
        <a href="[LIEN_GITHUB_SPONSORS]" class="bouton-fantome">GitHub Sponsors</a>
      </div>
    </div>
  </section>
"""
    return enveloppe("index", corps, "luna-01-aventure",
                     "Capter l'étincelle",
                     "Neuro-Exo : neuro-robotique open source, IA agentique et solidarité internationale. De l'impulsion à l'étincelle.",
                     particules=True)


def page_cartes(page: str, nb: int = 3, journal_n: int = 0, extra: str = "",
                images: str = "") -> str:
    p = PAGES[page]
    items = [(f"{page}.c{i}t", f"{page}.c{i}d") for i in range(1, nb + 1)]
    corps = f"""
  <section class="section" style="padding-bottom:1.6rem">
{badge(page)}
    <h1 style="margin:1.1rem 0 0; font-size:clamp(2.1rem,5vw,3.6rem)" data-t="{page}.titre">{t(page + '.titre')}</h1>
    <p class="lead" style="margin-top:1.2rem" data-t="{page}.lead">{t(page + '.lead')}</p>
  </section>

  <section class="section" style="padding-top:.5rem">
{cartes(page, items)}
  </section>
{images}
{extra}
"""
    if journal_n:
        corps += journaux(page, journal_n)
    corps += f"""
  <section class="section" style="text-align:center; padding-top:1rem">
    <a href="index.html#financer" class="bouton" data-t="commun.soutenir">{t('commun.soutenir')}</a>
  </section>
"""
    return enveloppe(page, corps, p["fichier"].replace(".html", "") and [o for o in ORDRE if o[0] == page][0][2],
                     t(page + ".titre")[:60], t(page + ".lead")[:150])


def journaux(page: str, n: int) -> str:
    return journal(page, n)


def page_virtuel() -> str:
    images = f"""
  <section class="section" style="padding-top:0">
    <div class="verre reveler" style="padding:1.2rem">
      <div style="display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:1rem" role="group" aria-label="Étapes du jumeau">
        <button class="onglet" data-etape="0" aria-pressed="true">1 · Flux de signaux</button>
        <button class="onglet" data-etape="1" aria-pressed="false">2 · Cinématique</button>
        <button class="onglet" data-etape="2" aria-pressed="false">3 · Harnais &amp; capteurs</button>
      </div>
      <div id="scene3d" style="border-radius:1rem; overflow:hidden; height:420px; background:radial-gradient(circle at 50% 35%, rgba(76,29,149,.55), rgba(18,6,31,.85))"></div>
      <p id="scene-legende" style="margin:.9rem 0 0; font-size:.84rem; color:var(--doux)">
        Étape 1 — Le flux : ondes EEG et sEMG, ce que les capteurs lisent avant toute décision.
      </p>
      <p style="margin:.25rem 0 0; font-size:.72rem; color:var(--faible)">
        Glisse à la souris ou au doigt pour tourner la vue. Aucune donnée réelle : c'est un modèle, pas une séance.
      </p>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="duo reveler">
      <figure style="margin:0">
        <div class="cadre-neon" style="padding:0">
          <img src="assets/exo-appareil.jpg" width="1600" height="900" loading="lazy"
               alt="Planche de l'exosquelette de rééducation assistée : vue d'ensemble et détails techniques" />
        </div>
        <figcaption class="mono faible" style="font-size:.66rem; margin-top:.7rem; line-height:1.6" data-t="virtuel.img1_leg">{t('virtuel.img1_leg')}</figcaption>
      </figure>
      <figure style="margin:0">
        <div class="cadre-neon" style="padding:0">
          <img src="assets/rampe-securite.jpg" width="1600" height="900" loading="lazy"
               alt="Rampe de rééducation à la marche assistée et son portique de sécurité" />
        </div>
        <figcaption class="mono faible" style="font-size:.66rem; margin-top:.7rem; line-height:1.6" data-t="virtuel.img2_leg">{t('virtuel.img2_leg')}</figcaption>
      </figure>
    </div>
  </section>
"""
    html = page_cartes("virtuel", 3, images=images)
    html = html.replace("</body>", """<script type="importmap">
{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }
</script>
<script type="module">
  import { demarrerScene } from './three-scene.js';
  const c = document.getElementById('scene3d');
  if (c) demarrerScene(c, { legendeId: 'scene-legende' });
</script>
</body>""")
    return html


def page_social() -> str:
    p = PAGES["social"]
    eco = []
    for i in range(1, 5):
        eco.append(f"""      <article class="verre carte reveler">
        <h3 data-t="social.eco_{i}">{t(f'social.eco_{i}')}</h3>
        <p data-t="social.eco_{i}d">{t(f'social.eco_{i}d')}</p>
      </article>""")
    extra = f"""
  <section class="section" style="padding-top:1rem">
    <div class="section-titre reveler">
      <p class="etiq" data-t="social.eco_titre">{t('social.eco_titre')}</p>
      <h2>Les quatre boucles</h2>
    </div>
    <div class="duo">
{chr(10).join(eco)}
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <figure class="reveler" style="margin:0">
      <div class="cadre-neon" style="padding:0">
        <img src="assets/ilot-integre.jpg" width="1600" height="900" loading="lazy"
             alt="Infographie de l'Îlot Intégré : modèle d'ONG réplicable, agriculture, coopérative, fablab, clinique de rééducation" />
      </div>
      <figcaption class="mono faible" style="font-size:.66rem; margin-top:.7rem; text-align:center" data-t="social.img_leg">{t('social.img_leg')}</figcaption>
    </figure>
  </section>

  <section class="section" style="text-align:center; padding-top:0">
    <a href="wishlist.html" class="bouton" data-t="social.cta">{t('social.cta')}</a>
  </section>
"""
    return page_cartes("social", 3, extra=extra)


def page_archi() -> str:
    p = PAGES["archi"]
    corps = f"""
  <section class="section" style="padding-bottom:1.2rem">
{badge('archi')}
    <h1 style="margin:1.1rem 0 0; font-size:clamp(1.9rem,4.4vw,3.1rem)" data-t="archi.titre">{t('archi.titre')}</h1>
  </section>

  <section class="section" style="padding-top:0; padding-bottom:2rem">
    <div class="duo" style="align-items:start">
      <figure class="reveler" style="margin:0">
        <div class="cadre-neon">
          <img src="assets/portrait.jpg" width="825" height="1100"
               alt="Portrait de l'Architecte, en fauteuil, devant un jardin" />
        </div>
        <figcaption class="mono faible" style="font-size:.64rem; margin-top:.8rem; letter-spacing:.1em" data-t="archi.photo_leg">{t('archi.photo_leg')}</figcaption>
      </figure>

      <div class="reveler">
        <p style="font-size:1rem; line-height:1.8; color:var(--doux); font-style:italic" data-t="archi.intro">{t('archi.intro')}</p>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="verre reveler" style="padding:1.8rem">
      <h2 style="font-size:1.35rem; margin-bottom:.9rem" data-t="archi.h1">{t('archi.h1')}</h2>
      <p class="doux" style="line-height:1.85" data-t="archi.p1">{t('archi.p1')}</p>
      <p class="doux" style="line-height:1.85; margin-bottom:0" data-t="archi.p2">{t('archi.p2')}</p>
    </div>

    <div class="verre reveler" style="padding:1.8rem; margin-top:1rem">
      <h2 style="font-size:1.35rem; margin-bottom:.9rem" data-t="archi.h2">{t('archi.h2')}</h2>
      <p class="doux" style="line-height:1.85" data-t="archi.p3">{t('archi.p3')}</p>
      <p class="doux" style="line-height:1.85" data-t="archi.p4">{t('archi.p4')}</p>
      <p class="doux" style="line-height:1.85; margin-bottom:0" data-t="archi.p5">{t('archi.p5')}</p>
    </div>

    <div class="verre reveler" style="padding:1.8rem; margin-top:1rem">
      <h2 style="font-size:1.35rem; margin-bottom:.9rem" data-t="archi.h3">{t('archi.h3')}</h2>
      <p class="doux" style="line-height:1.85" data-t="archi.p6">{t('archi.p6')}</p>
      <p class="doux" style="line-height:1.85" data-t="archi.p7">{t('archi.p7')}</p>
      <p class="doux" style="line-height:1.85; margin-bottom:0" data-t="archi.p8">{t('archi.p8')}</p>
    </div>
  </section>

  <section class="section" style="text-align:center; padding-top:0">
    <a href="meta-projet-social.html" class="bouton" data-t="archi.cta">{t('archi.cta')}</a>
  </section>
"""
    return enveloppe("archi", corps, "luna-08-architecte",
                     t("archi.titre")[:60], t("archi.intro")[:150])


def page_wishlist() -> str:
    p = PAGES["wish"]
    lignes = []
    prix = {"1": "≈ 2 000 €", "2": "≈ 185 €", "3": "≈ 45 €", "4": "≈ 120 €"}
    for i in range(1, 5):
        lignes.append(f"""      <div class="ligne-wish">
        <span class="n">{i:02d}</span>
        <div>
          <h3 data-t="wish.l{i}">{t(f'wish.l{i}')}</h3>
          <p data-t="wish.l{i}d">{t(f'wish.l{i}d')}</p>
        </div>
        <span class="prix">{prix[str(i)]}</span>
      </div>""")

    corps = f"""
  <section class="section" style="padding-bottom:1.4rem">
{badge('wish')}
    <h1 style="margin:1.1rem 0 0; font-size:clamp(2.1rem,5vw,3.6rem)" data-t="wish.titre">{t('wish.titre')}</h1>
    <p class="lead" style="margin-top:1.2rem" data-t="wish.lead">{t('wish.lead')}</p>
  </section>

  <section class="section" style="padding-top:0">
    <div class="verre reveler" style="padding:1.6rem">
{chr(10).join(lignes)}
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:.8rem; justify-content:center; margin-top:1.8rem">
      <a href="[LIEN_LISTE_AMAZON]" class="bouton" data-t="wish.bouton_amazon">{t('wish.bouton_amazon')}</a>
      <a href="[LIEN_KOFI]" class="bouton-fantome" data-t="wish.cagnottes">{t('wish.cagnottes')}</a>
    </div>

    <p class="mentions" style="margin-top:1.8rem; text-align:center" data-t="wish.note">{t('wish.note')}</p>
  </section>
"""
    return enveloppe("wish", corps, "luna-09-wishlist", t("wish.titre")[:60], t("wish.lead")[:150])


def page_boutique() -> str:
    p = PAGES["boutique"]
    ampoules = "".join('        <span class="ampoule"></span>\n' for _ in range(22))
    # flocons : positions et vitesses tirées une fois à la génération, figées
    # dans le HTML — pas de JavaScript pour une décoration.
    import random as _r
    _r.seed(7)
    flocons = "".join(
        f'    <span class="flocon" style="left:{_r.randint(2, 98)}%; '
        f'animation-duration:{_r.randint(11, 22)}s; animation-delay:-{_r.randint(0, 20)}s; '
        f'width:{_r.choice([3,4,5,6])}px; height:{_r.choice([3,4,5,6])}px"></span>\n'
        for _ in range(16))
    vitrines = []
    liens = {"1": "[LIEN_AFFILIE_AMAZON_TECH]", "2": "[LIEN_AFFILIE_MAKER]",
             "3": "[LIEN_AFFILIE_LIVRES]", "4": "[LIEN_AFFILIE_GENERAL]"}
    emojis = {"1": "🎧", "2": "🛠️", "3": "📚", "4": "🎁"}
    for i in range(1, 5):
        vitrines.append(f"""      <a class="verre vitrine" href="{liens[str(i)]}">
        <span class="emoji">{emojis[str(i)]}</span>
        <h3 data-t="boutique.v{i}">{t(f'boutique.v{i}')}</h3>
        <p data-t="boutique.v{i}d">{t(f'boutique.v{i}d')}</p>
        <span class="balise">{liens[str(i)]}</span>
      </a>""")

    enseignes = "".join(
        f'      <a href="[LIEN_AFFILIE_{n}]" class="bouton-fantome" style="opacity:.55">{lbl}</a>\n'
        for n, lbl in (("AMAZON", "Amazon"), ("FNAC", "Fnac"), ("CDISCOUNT", "Cdiscount"),
                       ("ALIEXPRESS", "AliExpress"), ("CULTURA", "Cultura")))

    corps = f"""
  <div class="guirlande" aria-hidden="true">
{ampoules}  </div>
  <div class="flocons" aria-hidden="true">
{flocons}  </div>

  <section class="section" style="padding-top:1rem; padding-bottom:1.4rem">
{badge('boutique')}
    <h1 style="margin:1.1rem 0 0; font-size:clamp(2.2rem,5.4vw,3.8rem)" data-t="boutique.titre">{t('boutique.titre')}</h1>
    <p class="lead" style="margin-top:1.2rem" data-t="boutique.lead">{t('boutique.lead')}</p>
  </section>

  <section class="section" style="padding-top:0">
    <div class="vitrines">
{chr(10).join(vitrines)}
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <p class="etiq" data-t="boutique.enseignes_titre">{t('boutique.enseignes_titre')}</p>
    <p class="doux" style="font-size:.86rem; margin:-.4rem 0 1.2rem" data-t="boutique.enseignes">{t('boutique.enseignes')}</p>
    <div style="display:flex; flex-wrap:wrap; gap:.6rem">
{enseignes}    </div>
  </section>

  <section class="section" style="text-align:center; padding-top:0">
    <p class="doux" style="margin-bottom:1.2rem" data-t="boutique.noel">{t('boutique.noel')}</p>
    <a href="index.html#financer" class="bouton" data-t="commun.soutenir">{t('commun.soutenir')}</a>
  </section>
"""
    extra = f'<p class="mentions" data-t="boutique.mention" style="padding:0 1.5rem 2rem; text-align:center">{t("boutique.mention")}</p>'
    return enveloppe("boutique", corps, "luna-10-noel", t("boutique.titre")[:60],
                     t("boutique.lead")[:150], extra_pied=extra)


def page_luna() -> str:
    p = PAGES["luna"]
    corps = f"""
  <section class="section" style="padding-bottom:1rem">
{badge('luna')}
    <h1 style="margin:1.1rem 0 0; font-size:clamp(2.4rem,7vw,4.4rem); letter-spacing:-.045em" data-t="luna.titre">{t('luna.titre')}</h1>
    <p class="mono" style="letter-spacing:.36em; color:var(--magenta); font-size:.8rem; margin:.7rem 0 0">A.K.A. GYPSIELUNA</p>
    <p class="lead" style="margin-top:1.4rem; max-width:34rem" data-t="luna.lead">{t('luna.lead')}</p>
  </section>

  <section class="section" style="padding-top:0">
    <figure class="reveler" style="margin:0">
      <div class="cadre-neon" style="padding:0; background:rgba(40,17,65,.9); box-shadow:none">
        <img src="assets/ghostsheller.jpg" width="1140" height="641"
             alt="Le GhostSheller, vaisseau quantique millénaire, en orbite au-dessus d'une planète bleue" />
      </div>
      <figcaption class="mono faible" style="font-size:.64rem; margin-top:.8rem; text-align:center; letter-spacing:.16em">
        GHOSTSHELLER — PROPULSION BLACK-HOLE
      </figcaption>
    </figure>
  </section>

  <section class="section" style="padding-top:0">
    <div class="verre reveler" style="padding:1.8rem">
      <h2 style="font-size:1.2rem; margin-bottom:.6rem" data-t="luna.prod_titre">{t('luna.prod_titre')}</h2>
      <p class="doux" style="line-height:1.8; margin-bottom:1.1rem" data-t="luna.prod_txt">{t('luna.prod_txt')}</p>
      <a href="realiastation.html" class="bouton-fantome" data-t="luna.prod_cta">{t('luna.prod_cta')}</a>
    </div>
  </section>
"""
    return enveloppe("luna", corps, "luna-06-ghostsheller", t("luna.titre"),
                     t("luna.lead")[:150])


def main() -> None:
    pages = {
        "index": page_index(),
        "virtuel": page_virtuel(),
        "neuroexo": page_cartes("neuroexo", 3, journal_n=3, extra="""
  <section class="section" style="padding-top:0">
    <figure class="reveler" style="margin:0">
      <div class="cadre-neon" style="padding:0">
        <img src="assets/simulation-biomecanique.jpg" width="1600" height="900" loading="lazy"
             alt="Simulation biomécanique en temps réel : squelette articulé et flux nerveux projetés" />
      </div>
      <figcaption class="mono faible" style="font-size:.66rem; margin-top:.7rem; text-align:center; line-height:1.6">
        Simulation biomécanique en temps réel — ce que le Système 2 observe
      </figcaption>
    </figure>
  </section>
"""),
        "devkit": page_cartes("devkit", 3, journal_n=2),
        "realia": page_cartes("realia", 3, extra=f"""
  <section class="section" style="padding-top:0">
    <div class="verre-clair reveler" style="padding:1.8rem">
      <h2 style="font-size:1.2rem; margin-bottom:.6rem" data-t="realia.lien_titre">{t('realia.lien_titre')}</h2>
      <p class="doux" style="line-height:1.8; margin-bottom:1.1rem" data-t="realia.lien_txt">{t('realia.lien_txt')}</p>
      <a href="lunagalaxie.html" class="bouton-fantome" data-t="realia.lien_cta">{t('realia.lien_cta')}</a>
    </div>
  </section>
"""),
        "luna": page_luna(),
        "social": page_social(),
        "archi": page_archi(),
        "wish": page_wishlist(),
        "boutique": page_boutique(),
    }

    for page, html in pages.items():
        fichier = [p for p in ORDRE if p[0] == page][0][1]
        (RACINE / fichier).write_text(html, encoding="utf-8")
        print(f"  {fichier:26s} {len(html):>7} o")

    # --- dictionnaire i18n : uniquement les trois autres langues ---
    trad = {}
    for cle, valeurs in TOUS.items():
        trad[cle] = {"en": valeurs["en"], "pt": valeurs["pt"], "zh": valeurs["zh"]}

    # libellés d'interface produit par le script
    trad["tiroir.suivant"] = {"en": "Next drawer", "pt": "Próxima gaveta", "zh": "下一个抽屉"}
    trad["tiroir.dernier"] = {"en": "Last drawer", "pt": "Última gaveta", "zh": "最后一个抽屉"}

    js = ("/* Généré par _source/generer.py — ne pas éditer à la main.\n"
          "   Traductions EN / PT / ZH. Le français est écrit dans le HTML. */\n"
          "window.TRADUCTIONS = ")
    js += json.dumps(trad, ensure_ascii=False, indent=0).replace("\n", "")
    js += ";\n"
    (RACINE / "traductions.js").write_text(js, encoding="utf-8")
    print(f"  traductions.js             {len(js):>7} o ({len(trad)} clés)")


if __name__ == "__main__":
    main()
