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

const SEUIL_MOLETTE = 220;   // px cumulés en bas de page avant de tourner
const SEUIL_DOIGT = 90;      // px de glissement vers le haut sur tactile
const OUBLI = 900;           // ms sans geste : le cumul repart de zéro
const DUREE_SORTIE = 210;
//: si le navigateur gère les transitions inter-documents, on ne double pas l'effet
const TRANSITION_NATIVE = window.CSS && CSS.supports && CSS.supports('view-transition-name: none');

(function tiroirs() {
  const fichier = location.pathname.split('/').pop() || 'index.html';
  const i = ORDRE.findIndex(p => p.fichier === fichier);
  if (i < 0) return;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const suivant = i < ORDRE.length - 1 ? ORDRE[i + 1] : null;
  if (!suivant) return;                      // dernière page : plus rien après

  /* ---- entrée : la page arrive du haut ou du bas ------------------------ */
  const entree = sessionStorage.getItem('tiroir-entree');
  if (entree && !reduit) {
    document.body.classList.add('entree-' + entree);
    document.body.addEventListener('animationend', function fin() {
      document.body.classList.remove('entree-haut', 'entree-bas');
      document.body.removeEventListener('animationend', fin);
    });
  }
  sessionStorage.removeItem('tiroir-entree');

  let enCours = false;
  function aller(sens) {
    if (!suivant || enCours) return;
    enCours = true;
    if (TRANSITION_NATIVE || reduit) { location.href = suivant.fichier; return; }
    sessionStorage.setItem('tiroir-entree', sens);
    document.body.classList.add(sens === 'bas' ? 'sortie-bas' : 'sortie-haut');
    setTimeout(() => { location.href = suivant.fichier; }, DUREE_SORTIE);
  }

  function auBas() {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3;
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

  /* ---- molette ---------------------------------------------------------- */
  let cumul = 0;
  let dernierGeste = 0;

  window.addEventListener('wheel', function (e) {
    if (enCours || e.ctrlKey) return;
    if (dansUnChamp(e.target) || panneauOuvert()) return;
    if (!auBas() || e.deltaY <= 0) { cumul = 0; return; }
    const maintenant = Date.now();
    cumul = (maintenant - dernierGeste > OUBLI) ? e.deltaY : cumul + e.deltaY;
    dernierGeste = maintenant;
    if (cumul >= SEUIL_MOLETTE) aller('bas');
  }, { passive: true });

  /* ---- tactile ---------------------------------------------------------- */
  let departY = null;
  window.addEventListener('touchstart', function (e) {
    departY = e.touches.length === 1 ? e.touches[0].clientY : null;
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (enCours || departY === null || panneauOuvert()) return;
    if (dansUnChamp(e.target)) return;
    const y = e.touches[0].clientY;
    if (!auBas() || y > departY) return;           // on descend : geste normal
    if (departY - y >= SEUIL_DOIGT) aller('bas');
  }, { passive: true });

  window.addEventListener('touchend', function () { departY = null; }, { passive: true });

  /* ---- clavier ---------------------------------------------------------- */
  window.addEventListener('keydown', function (e) {
    if (enCours || panneauOuvert() || dansUnChamp(e.target)) return;
    if (!auBas()) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      aller('bas');
    }
  });

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
  }
  window.addEventListener('scroll', majJauge, { passive: true });
  window.addEventListener('resize', majJauge, { passive: true });
  majJauge();

  window.__tiroir = {
    index: i, suivant,
    aller: function () { aller('bas'); },
    auBas,
    enHaut: function () { return window.scrollY <= 2; }
  };
})();
