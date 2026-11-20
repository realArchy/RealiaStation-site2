/* ============================================================================
   Les tiroirs — une page = un tiroir de commode.
   Dix tiroirs, dans l'ordre du cheminement du projet. Les libellés passent par
   i18n.js quand il est chargé ; sinon on garde le français.

   Molette (au-delà du bord, 140 px), clavier, doigt (70 px), poignée au clic.
   ========================================================================== */

const ORDRE = [
  { fichier: 'index.html',              cle: 'nav.accueil',  nom: 'Accueil' },
  { fichier: 'virtuel.html',            cle: 'nav.virtuel',  nom: 'Labo virtuel' },
  { fichier: 'rexoia.html',        cle: 'nav.neuroexo', nom: "R'ExoIA" },
  { fichier: 'devkit.html',             cle: 'nav.devkit',   nom: 'RealiDevKit' },
  { fichier: 'realiastation.html',      cle: 'nav.realia',   nom: 'RealiaStation' },
  { fichier: 'lunagalaxie.html',        cle: 'nav.luna',     nom: 'LunaGalaxie' },
  { fichier: 'meta-projet-social.html', cle: 'nav.social',   nom: 'Projet social' },
  { fichier: 'blueprint.html',          cle: 'nav.blueprint', nom: 'Blueprint' },
  { fichier: 'architecte.html',         cle: 'nav.archi',    nom: "L'Architecte" },
  { fichier: 'cabinet.html',            cle: 'nav.cabinet',  nom: 'Cabinet & Services' },
  { fichier: 'wishlist.html',           cle: 'nav.wishlist', nom: 'Wishlist' },
  { fichier: 'boutique.html',           cle: 'nav.boutique', nom: 'Boutique' }
];

const SEUIL_MOLETTE = 140;
const SEUIL_DOIGT = 70;
const DUREE_SORTIE = 210;
//: si le navigateur gère les transitions inter-documents, on ne double pas l'effet
const TRANSITION_NATIVE = window.CSS && CSS.supports && CSS.supports('view-transition-name: none');

function libelle(entree) {
  if (window.I18N && typeof window.I18N.t === 'function') {
    const v = window.I18N.t(entree.cle);
    if (v) return v;
  }
  return entree.nom;
}

(function tiroirs() {
  const fichier = location.pathname.split('/').pop() || 'index.html';
  const i = ORDRE.findIndex(p => p.fichier === fichier);
  if (i < 0) return;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const precedent = i > 0 ? ORDRE[i - 1] : null;
  const suivant = i < ORDRE.length - 1 ? ORDRE[i + 1] : null;

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
  function aller(cible, sens) {
    if (!cible || enCours) return;
    enCours = true;
    if (TRANSITION_NATIVE || reduit) {
      location.href = cible.fichier;       // le compositeur s'occupe de l'animation
      return;
    }
    if (!reduit) {
      sessionStorage.setItem('tiroir-entree', sens);
      document.body.classList.add(sens === 'bas' ? 'sortie-bas' : 'sortie-haut');
      setTimeout(() => { location.href = cible.fichier; }, DUREE_SORTIE);
    }
  }

  function auBas() {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
  }
  function enHaut() {
    return window.scrollY <= 2;
  }

  /* Plus AUCUNE capture de la molette, du clavier ni du balayage.
     C'était l'erreur : la page sautait de tiroir en tiroir au moment où l'on
     atteignait le bas, ce qui donnait exactement l'impression de « mélanger le
     scroll et les tiroirs ». On lit tranquillement ; on change de page en
     cliquant la poignée, ou par le menu. */

  /* Repère de position : une barre fine en haut, remplie selon la lecture.
     Elle répond à « on est où ? » sans rien voler au défilement : une seule
     lecture de scrollY par image, aucune lecture de géométrie. */
  const barre = document.createElement('div');
  barre.className = 'progression';
  barre.setAttribute('aria-hidden', 'true');
  barre.innerHTML = '<span></span>';
  document.body.appendChild(barre);
  const jauge = barre.firstChild;

  /* Calcul direct : une division et un transform, sans lecture de géométrie.
     Passer par requestAnimationFrame semblait plus prudent, mais dans un onglet
     throttlé la jauge ne bougeait jamais. */
  function majJauge() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const part = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    jauge.style.transform = 'scaleX(' + part.toFixed(4) + ')';
  }
  window.addEventListener('scroll', majJauge, { passive: true });
  window.addEventListener('resize', majJauge, { passive: true });
  majJauge();

  const p = document.createElement('div');
  p.className = 'poignee';
  p.setAttribute('role', 'group');

  const btnPrec = document.createElement('button');
  btnPrec.type = 'button';
  btnPrec.textContent = '↑';
  btnPrec.disabled = !precedent;
  btnPrec.addEventListener('click', () => aller(precedent, 'haut'));

  const milieu = document.createElement('span');
  milieu.className = 'suite';

  const btnSuiv = document.createElement('button');
  btnSuiv.type = 'button';
  btnSuiv.className = 'fleche';
  btnSuiv.textContent = '↓';
  btnSuiv.disabled = !suivant;
  btnSuiv.addEventListener('click', () => aller(suivant, 'bas'));

  const compte = document.createElement('span');
  compte.className = 'compte';
  compte.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(ORDRE.length).padStart(2, '0');

  function rafraichirLibelles() {
    const prefixe = (window.I18N && window.I18N.t('tiroir.suivant')) || 'Tiroir suivant';
    milieu.textContent = suivant
      ? prefixe + ' · ' + libelle(suivant)
      : ((window.I18N && window.I18N.t('tiroir.dernier')) || 'Dernier tiroir');
    milieu.style.cursor = suivant ? 'pointer' : 'default';
  }
  milieu.addEventListener('click', () => { if (suivant) aller(suivant, 'bas'); });
  rafraichirLibelles();
  document.addEventListener('langue-change', rafraichirLibelles);

  p.append(btnPrec, milieu, btnSuiv, compte);
  document.body.appendChild(p);

  /* Hauteur de page mémorisée : la relire à chaque défilement obligerait le
     navigateur à recalculer la mise en page pendant le scroll. */
  let hauteurPage = document.documentElement.scrollHeight;
  window.addEventListener('resize', function () {
    hauteurPage = document.documentElement.scrollHeight;
  }, { passive: true });

  function etatPoignee() {
    const enBas = window.scrollY + window.innerHeight >= hauteurPage - 4;
    p.style.borderColor = enBas ? 'rgba(212,175,55,.55)' : '';
    p.style.color = enBas ? 'rgba(255,255,255,.9)' : '';
  }
  window.addEventListener('scroll', etatPoignee, { passive: true });
  etatPoignee();

  window.__tiroir = { index: i, suivant, precedent, aller, auBas, enHaut };
})();
