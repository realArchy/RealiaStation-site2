/* ============================================================================
   Les tiroirs — une page = un tiroir de commode.
   Dix tiroirs, dans l'ordre du cheminement du projet. Les libellés passent par
   i18n.js quand il est chargé ; sinon on garde le français.

   Molette (au-delà du bord, 140 px), clavier, doigt (70 px), poignée au clic.
   ========================================================================== */

const ORDRE = [
  { fichier: 'index.html',              cle: 'nav.accueil',  nom: 'Accueil' },
  { fichier: 'virtuel.html',            cle: 'nav.virtuel',  nom: 'Labo virtuel' },
  { fichier: 'neuroexo-ai.html',        cle: 'nav.neuroexo', nom: 'NeuroExoAI' },
  { fichier: 'devkit.html',             cle: 'nav.devkit',   nom: 'DevKit-Clean' },
  { fichier: 'realiastation.html',      cle: 'nav.realia',   nom: 'RealiaStation' },
  { fichier: 'lunagalaxie.html',        cle: 'nav.luna',     nom: 'LunaGalaxie' },
  { fichier: 'meta-projet-social.html', cle: 'nav.social',   nom: 'Projet social' },
  { fichier: 'blueprint.html',          cle: 'nav.blueprint', nom: 'Blueprint' },
  { fichier: 'architecte.html',         cle: 'nav.archi',    nom: "L'Architecte" },
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

  let cumul = 0;
  let minuterie = null;

  window.addEventListener('wheel', (e) => {
    const versLeBas = e.deltaY > 0;
    if (versLeBas && !auBas()) { cumul = 0; return; }
    if (!versLeBas && !enHaut()) { cumul = 0; return; }

    cumul += e.deltaY;
    clearTimeout(minuterie);
    minuterie = setTimeout(() => { cumul = 0; }, 260);

    if (cumul > SEUIL_MOLETTE) { cumul = 0; aller(suivant, 'bas'); }
    else if (cumul < -SEUIL_MOLETTE) { cumul = 0; aller(precedent, 'haut'); }
  }, { passive: true });

  let departY = null;
  window.addEventListener('touchstart', (e) => { departY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (departY === null) return;
    const delta = departY - e.changedTouches[0].clientY;
    departY = null;
    if (delta > SEUIL_DOIGT && auBas()) aller(suivant, 'bas');
    else if (delta < -SEUIL_DOIGT && enHaut()) aller(precedent, 'haut');
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const bas = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ';
    const haut = e.key === 'ArrowUp' || e.key === 'PageUp';
    if (bas && auBas()) { e.preventDefault(); aller(suivant, 'bas'); }
    else if (haut && enHaut()) { e.preventDefault(); aller(precedent, 'haut'); }
  });

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

  function etatPoignee() {
    p.style.borderColor = auBas() ? 'rgba(232,121,249,.55)' : '';
    p.style.color = auBas() ? 'rgba(243,236,255,.85)' : '';
  }
  window.addEventListener('scroll', etatPoignee, { passive: true });
  etatPoignee();

  window.__tiroir = { index: i, suivant, precedent, aller, auBas, enHaut };
})();
