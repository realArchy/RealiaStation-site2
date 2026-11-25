/* ============================================================================
   PASSAGE DE PAGE AU DÉFILEMENT — une page = un tiroir de commode

   Aucun bouton, aucune poignée : on lit la page, et arrivé en bas, continuer à
   défiler fait glisser vers la page suivante. Remonter ne renvoie pas en
   arrière — c'est le geste du navigateur, on ne le vole pas.

   Trois gestes, tous au bord bas :
     · molette vers le bas, cumulée jusqu'à un seuil (un petit coup de molette
       en fin de lecture ne doit pas changer de page par accident) ;
     · doigt qui remonte sur un écran tactile ;
     · flèche bas / Page suivante / espace quand on est déjà en bas.

   Rien ne se déclenche si un panneau est ouvert, si le curseur est dans un
   champ de saisie, ou si la page est la dernière du parcours.
   ========================================================================== */

const ORDRE = [
  { fichier: 'index.html',              cle: 'nav.accueil',   nom: 'Accueil' },
  { fichier: 'virtuel.html',            cle: 'nav.virtuel',   nom: 'Labo virtuel' },
  { fichier: 'rexoia.html',             cle: 'nav.neuroexo',  nom: "R'ExoIA" },
  { fichier: 'devkit.html',             cle: 'nav.devkit',    nom: 'RealiaDevKit' },
  { fichier: 'realiastation.html',      cle: 'nav.realia',    nom: 'RealiaStation' },
  { fichier: 'lunagalaxie.html',        cle: 'nav.luna',      nom: 'LunaGalaxie' },
  { fichier: 'meta-projet-social.html', cle: 'nav.social',    nom: 'Projet social' },
  { fichier: 'blueprint.html',          cle: 'nav.blueprint', nom: 'Blueprint' },
  { fichier: 'architecte.html',         cle: 'nav.archi',     nom: "L'Architecte" },
  { fichier: 'cabinet.html',            cle: 'nav.cabinet',   nom: 'Cabinet & Services' },
  { fichier: 'setup-wishlist.html',     cle: 'nav.wishlist',  nom: 'My Setup & Wishlist' },
  { fichier: 'boutique.html',           cle: 'nav.boutique',  nom: 'Boutique du Collectif' }
];

const SEUIL_MOLETTE = 80;    // px cumulés : un trackpad envoie 2 à 10 px par événement
const SEUIL_DOIGT = 70;      // px de glissement sur tactile
const OUBLI = 1600;          // ms sans geste : le cumul repart de zéro
const DUREE_SORTIE = 150;
//: si le navigateur gère les transitions inter-documents, on ne double pas l'effet
const TRANSITION_NATIVE = window.CSS && CSS.supports && CSS.supports('view-transition-name: none');

(function tiroirs() {
  /* Firefox peut refuser le stockage de session (cookies bloqués, mode strict).
     Un accès non protégé lève une exception et tue tout le script : la page ne
     répond plus à aucun geste, sans le moindre message. */
  function memoLire(cle) {
    try { return sessionStorage.getItem(cle); } catch (e) { return null; }
  }
  function memoEcrire(cle, valeur) {
    try { sessionStorage.setItem(cle, valeur); } catch (e) { /* tant pis */ }
  }
  function memoOublier(cle) {
    try { sessionStorage.removeItem(cle); } catch (e) { /* tant pis */ }
  }

  /* Cloudflare sert des URL propres (/virtuel) ; en local ce sont des fichiers
     (virtuel.html). Sans cette normalisation, seule la page d'accueil était
     reconnue — d'où un passage qui ne marchait que de 1 à 2. */
  function fichierCourant() {
    const chemin = location.pathname;
    if (chemin.endsWith('/')) return 'index.html';
    const nom = chemin.split('/').pop();
    if (!nom) return 'index.html';
    return nom.indexOf('.') === -1 ? nom + '.html' : nom;
  }

  const fichier = fichierCourant();
  const i = ORDRE.findIndex(p => p.fichier === fichier);
  if (i < 0) return;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const suivant = i < ORDRE.length - 1 ? ORDRE[i + 1] : null;
  const precedent = i > 0 ? ORDRE[i - 1] : null;
  if (!suivant && !precedent) return;

  /* ---- entrée : la page arrive du haut ou du bas ------------------------ */
  const entree = memoLire('tiroir-entree');
  if (entree) {
    /* Safari restaure parfois l'offset de la page précédente : on repart du
       haut, sinon la page suivante s'ouvre sur son pied de page. */
    window.scrollTo(0, 0);
  }
  if (entree && !reduit) {
    document.body.classList.add('entree-' + entree);
    document.body.addEventListener('animationend', function fin() {
      document.body.classList.remove('entree-haut', 'entree-bas');
      document.body.removeEventListener('animationend', fin);
    });
  }
  memoOublier('tiroir-entree');

  /* Après une bascule, l'inertie de la molette continuait d'arriver sur la
     page suivante, déjà en haut : elle repartait aussitôt en arrière (vécu :
     rexoia → virtuel → index d'un seul geste). On pose donc une échéance. */
  const CLE_VERROU = 'tiroir-verrou';
  /* relu à chaque geste : figé au chargement, il restait « verrouillé » sur une
     page restaurée depuis le cache mémoire du navigateur (bfcache). */
  function verrouille() {
    return Date.now() < Number(memoLire(CLE_VERROU) || 0);
  }

  let enCours = false;
  function aller(cible, sens) {
    if (!cible || enCours) return;
    enCours = true;
    memoEcrire(CLE_VERROU, String(Date.now() + 800));
    if (TRANSITION_NATIVE || reduit) { location.href = cible.fichier; return; }
    memoEcrire('tiroir-entree', sens);
    document.body.classList.add(sens === 'bas' ? 'sortie-bas' : 'sortie-haut');
    /* si la navigation échoue, le drapeau ne doit pas rester bloqué */
    setTimeout(function () { enCours = false; }, 3000);
    /* pas d'attente : la page suivante glisse à l'arrivée, c'est assez */
    location.href = cible.fichier;
  }

  /* Safari décale scrollY de quelques pixels pendant le rebond élastique :
     avec une tolérance de 3 px, « en haut » et « en bas » étaient faux une
     fois sur deux, et le geste ne partait pas. */
  function auBas() {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
  }
  function enHaut() { return window.scrollY <= 40; }

  /* deltaMode : 0 = pixels, 1 = lignes (×16), 2 = pages */
  function enPixels(e) {
    const mode = e.deltaMode || 0;
    if (mode === 1) return e.deltaY * 16;
    if (mode === 2) return e.deltaY * window.innerHeight;
    return e.deltaY;
  }

  /* ---- on ne tourne que si c'est voulu ---------------------------------- */
  function panneauOuvert() {
    if (document.body.classList.contains('tiroir-ouvert')) return true;
    const menu = document.getElementById('menu-mobile');
    if (menu && menu.classList.contains('ouvert')) return true;
    const offres = document.getElementById('tiroir-offres');
    if (offres && !offres.hidden) return true;
    const compare = document.getElementById('compare-modal');
    if (compare && !compare.hidden) return true;
    return false;
  }

  function dansUnChamp(cible) {
    if (!cible || !cible.tagName) return false;
    const t = cible.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || cible.isContentEditable;
  }

  /* ---- molette ----------------------------------------------------------
     Deux pièges, vus en vrai :
       · sur un trackpad, le défilement est lissé : les événements arrivent
         AVANT que la page ait fini de descendre, donc « suis-je en bas ? »
         répondait non au moment du geste et le compteur repartait à zéro ;
       · les deltas d'un trackpad sont minuscules (1 à 5 px).
     On ne regarde donc plus la position exacte : on mesure l'intention
     (direction et distance cumulées sur 400 ms) et on se contente d'être
     proche du bord. */
  const FENETRE = 400;          // ms : au-delà, le geste est considéré terminé
  const INTENTION = 120;        // px cumulés dans une même direction
  const IMPULSIONS = 4;         // ou quatre impulsions, même minuscules
  const MARGE = 200;            // px : « proche du bord » suffit

  let cumulBas = 0, cumulHaut = 0, nBas = 0, nHaut = 0, dernier = 0;

  function procheBas() {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - MARGE;
  }
  function procheHaut() { return window.scrollY <= MARGE; }

  window.addEventListener('wheel', function (e) {
    if (enCours || verrouille() || e.ctrlKey) return;
    if (dansUnChamp(e.target) || panneauOuvert()) return;

    const d = enPixels(e);
    if (!d) return;
    const t = performance.now();

    if (t - dernier > FENETRE) { cumulBas = 0; cumulHaut = 0; nBas = 0; nHaut = 0; }
    dernier = t;

    if (d > 0) {
      cumulBas += d; nBas += 1; cumulHaut = 0; nHaut = 0;
      if ((cumulBas >= INTENTION || nBas >= IMPULSIONS) && procheBas()) aller(suivant, 'bas');
      return;
    }

    cumulHaut += -d; nHaut += 1; cumulBas = 0; nBas = 0;
    if ((cumulHaut >= INTENTION || nHaut >= IMPULSIONS) && procheHaut()) aller(precedent, 'haut');
  }, { passive: true });

  /* ---- tactile ---------------------------------------------------------- */
  let departY = null;
  window.addEventListener('touchstart', function (e) {
    departY = e.touches.length === 1 ? e.touches[0].clientY : null;
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (enCours || verrouille() || departY === null || panneauOuvert()) return;
    if (dansUnChamp(e.target)) return;
    const y = e.touches[0].clientY;
    const ecart = departY - y;                     // positif : le doigt monte
    if (ecart >= SEUIL_DOIGT && auBas()) { aller(suivant, 'bas'); return; }
    if (-ecart >= SEUIL_DOIGT && enHaut()) { aller(precedent, 'haut'); }
  }, { passive: true });

  window.addEventListener('touchend', function () { departY = null; }, { passive: true });

  /* ---- clavier ---------------------------------------------------------- */
  window.addEventListener('keydown', function (e) {
    if (enCours || verrouille() || panneauOuvert() || dansUnChamp(e.target)) return;
    const versBas = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ';
    const versHaut = e.key === 'ArrowUp' || e.key === 'PageUp';
    if (versBas && auBas()) { e.preventDefault(); aller(suivant, 'bas'); }
    else if (versHaut && enHaut()) { e.preventDefault(); aller(precedent, 'haut'); }
  });

  /* ---- page restaurée depuis le cache : on remet tout à zéro ------------
     Le navigateur gèle l'état JS au moment où l'on quitte une page. Revenu
     dessus par le bouton retour, le drapeau « bascule en cours » y restait
     armé pour toujours : la page ne répondait plus à aucun geste. */
  function reinitialiser() {
    enCours = false;
    cumulBas = 0; cumulHaut = 0; nBas = 0; nHaut = 0; dernier = 0;
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) reinitialiser(); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) reinitialiser();
  });

  /* ---- préchargement : la page suivante arrive déjà dans le cache ------- */
  /* La bascule rechargeait tout le document à froid ; sur un portable, la
     page mettait une seconde à s'afficher. On va donc chercher le document
     voisin dès qu'on approche du bord, sans bloquer le rendu. */
  const precharges = new Set();
  function precharger(cible) {
    if (!cible || precharges.has(cible.fichier)) return;
    precharges.add(cible.fichier);
    try {
      fetch(cible.fichier, { credentials: 'same-origin', priority: 'low' }).catch(function () {});
    } catch (e) { /* réseau coupé : la bascule se fera normalement */ }
  }

  /* ---- repère de lecture : une barre fine en haut, pas un bouton -------- */
  const barre = document.createElement('div');
  barre.className = 'progression';
  barre.setAttribute('aria-hidden', 'true');
  barre.innerHTML = '<span></span>';
  document.body.appendChild(barre);
  const jauge = barre.firstChild;

  function majJauge() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const part = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    jauge.style.transform = 'scaleX(' + part.toFixed(4) + ')';
    if (part > 0.3) precharger(suivant);          // on approche du bas
    if (part > 0.15) precharger(precedent);        // on a quitté le haut
  }

  /* en bord de page, on prépare la suite avant même le déclenchement */
  window.addEventListener('wheel', function (e) {
    if (enPixels(e) > 0 && auBas()) precharger(suivant);
    else if (enPixels(e) < 0 && enHaut()) precharger(precedent);
  }, { passive: true });
  window.addEventListener('scroll', majJauge, { passive: true });
  window.addEventListener('resize', majJauge, { passive: true });
  majJauge();

  /* ---- diagnostic : ouvrir la page avec ?diag=1 pour voir les chiffres --- */
  if (new URLSearchParams(location.search).has('diag')) {
    const boite = document.createElement('pre');
    boite.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;margin:0;' +
      'padding:8px 10px;background:#000d;color:#0f0;font:11px/1.4 monospace;' +
      'border:1px solid #0f05;border-radius:6px;pointer-events:none;white-space:pre';
    document.body.appendChild(boite);
    let n = 0;
    window.addEventListener('wheel', function (e) {
      n += 1;
      boite.textContent = 'wheel #' + n +
        '\ndeltaY      ' + e.deltaY.toFixed(1) +
        '\ndeltaMode   ' + e.deltaMode +
        '\nscrollY     ' + Math.round(window.scrollY) +
        '\nhaut total  ' + Math.round(document.documentElement.scrollHeight - window.innerHeight) +
        '\nen bas ?    ' + auBas() +
        '\nen haut ?   ' + enHaut();
    }, { passive: true });
  }

  window.__tiroir = {
    index: i, suivant, precedent,
    suivantPage: function () { aller(suivant, 'bas'); },
    precedentPage: function () { aller(precedent, 'haut'); },
    auBas, enHaut
  };
})();
