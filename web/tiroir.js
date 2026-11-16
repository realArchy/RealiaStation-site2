/* ============================================================================
   Les tiroirs — une page = un tiroir de commode.

   On lit la page normalement. Arrivé en bas, si l'on continue de tirer vers le
   bas, la page glisse hors du meuble et la suivante entre par le haut. En haut,
   même chose vers le haut : le tiroir précédent revient.

   Trois façons de tirer : la molette (au-delà du bord, seuil de 140 px), le
   clavier (flèches, Page↑/↓, espace), le doigt (balayage de 70 px au bord).
   La poignée en bas fait la même chose au clic.

   Aucune dépendance, aucun historique détourné : on change de page pour de bon,
   et le bouton « retour » du navigateur fait ce qu'il doit faire.
   ========================================================================== */

const ORDRE = [
  { fichier: 'index.html',              nom: 'Accueil' },
  { fichier: 'meta-projet-social.html', nom: 'Projet social' },
  { fichier: 'affiliations.html',       nom: 'Équipements' },
  { fichier: 'shopping.html',           nom: 'Boutique' },
  { fichier: 'lunagalaxie.html',        nom: 'LunaGalaxie' }
];

const SEUIL_MOLETTE = 140;   // px cumulés au-delà du bord
const SEUIL_DOIGT = 70;      // px de balayage au bord
const DUREE_SORTIE = 430;    // ms — doit rester cohérent avec style.css (.46s)

(function tiroirs() {
  const fichier = location.pathname.split('/').pop() || 'index.html';
  const i = ORDRE.findIndex(p => p.fichier === fichier);
  if (i < 0) return;                                  // page hors commode

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const precedent = i > 0 ? ORDRE[i - 1] : null;
  const suivant = i < ORDRE.length - 1 ? ORDRE[i + 1] : null;

  // --- animation d'entrée, si l'on vient d'un tiroir -----------------------
  const entree = sessionStorage.getItem('tiroir-entree');
  if (entree && !reduit) {
    document.body.classList.add('entree-' + entree);
    document.body.addEventListener('animationend', function fin() {
      document.body.classList.remove('entree-haut', 'entree-bas');
      document.body.removeEventListener('animationend', fin);
    });
  }
  sessionStorage.removeItem('tiroir-entree');

  // --- sortie --------------------------------------------------------------
  let enCours = false;
  function aller(cible, sens) {
    if (!cible || enCours) return;
    enCours = true;
    if (!reduit) {
      sessionStorage.setItem('tiroir-entree', sens);
      document.body.classList.add(sens === 'bas' ? 'sortie-bas' : 'sortie-haut');
      setTimeout(() => { location.href = cible.fichier; }, DUREE_SORTIE);
    } else {
      location.href = cible.fichier;
    }
  }

  // --- position : au bord ou non -------------------------------------------
  function auBas() {
    const marge = 4;
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - marge;
  }
  function enHaut() {
    return window.scrollY <= 2;
  }

  // --- molette -------------------------------------------------------------
  let cumul = 0;
  let minuterie = null;

  window.addEventListener('wheel', (e) => {
    // On ne s'active qu'au bord : au milieu de la page, la molette fait son travail.
    const versLeBas = e.deltaY > 0;
    if (versLeBas && !auBas()) { cumul = 0; return; }
    if (!versLeBas && !enHaut()) { cumul = 0; return; }

    cumul += e.deltaY;
    clearTimeout(minuterie);
    minuterie = setTimeout(() => { cumul = 0; }, 260);

    if (cumul > SEUIL_MOLETTE) {
      cumul = 0;
      aller(suivant, 'bas');
    } else if (cumul < -SEUIL_MOLETTE) {
      cumul = 0;
      aller(precedent, 'haut');
    }
  }, { passive: true });

  // --- doigt ---------------------------------------------------------------
  let departY = null;
  window.addEventListener('touchstart', (e) => {
    departY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (departY === null) return;
    const fin = e.changedTouches[0].clientY;
    const delta = departY - fin;                 // positif = doigt vers le haut
    departY = null;
    if (delta > SEUIL_DOIGT && auBas()) aller(suivant, 'bas');
    else if (delta < -SEUIL_DOIGT && enHaut()) aller(precedent, 'haut');
  }, { passive: true });

  // --- clavier -------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const bas = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ';
    const haut = e.key === 'ArrowUp' || e.key === 'PageUp';
    if (bas && auBas()) { e.preventDefault(); aller(suivant, 'bas'); }
    else if (haut && enHaut()) { e.preventDefault(); aller(precedent, 'haut'); }
  });

  // --- poignée -------------------------------------------------------------
  const p = document.createElement('div');
  p.className = 'poignee';
  p.setAttribute('role', 'group');
  p.setAttribute('aria-label', 'Passer au tiroir suivant ou précédent');

  const btnPrec = document.createElement('button');
  btnPrec.type = 'button';
  btnPrec.textContent = '↑';
  btnPrec.title = precedent ? 'Tiroir précédent : ' + precedent.nom : 'Aucun tiroir au-dessus';
  btnPrec.disabled = !precedent;
  btnPrec.addEventListener('click', () => aller(precedent, 'haut'));

  const milieu = document.createElement('span');
  milieu.className = 'suite';
  milieu.textContent = suivant ? 'Tiroir suivant · ' + suivant.nom : 'Dernier tiroir';
  if (suivant) milieu.addEventListener('click', () => aller(suivant, 'bas'));

  const btnSuiv = document.createElement('button');
  btnSuiv.type = 'button';
  btnSuiv.className = 'fleche';
  btnSuiv.textContent = '↓';
  btnSuiv.title = suivant ? 'Tiroir suivant : ' + suivant.nom : 'Aucun tiroir en dessous';
  btnSuiv.disabled = !suivant;
  btnSuiv.addEventListener('click', () => aller(suivant, 'bas'));

  const compte = document.createElement('span');
  compte.className = 'compte';
  compte.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(ORDRE.length).padStart(2, '0');

  p.append(btnPrec, milieu, btnSuiv, compte);
  document.body.appendChild(p);

  // La poignée s'allume quand on arrive au bord : elle signale « ça va glisser ».
  function etatPoignee() {
    p.style.borderColor = auBas() ? 'rgba(232,121,249,.55)' : '';
    p.style.color = auBas() ? 'rgba(243,236,255,.85)' : '';
  }
  window.addEventListener('scroll', etatPoignee, { passive: true });
  etatPoignee();

  // Exposé pour la vérification automatique.
  window.__tiroir = { index: i, suivant, precedent, aller, auBas, enHaut };
})();
