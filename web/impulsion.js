/* ============================================================================
   MOTEUR D'IMPULSION — une seule timeline GSAP pour tout le site
   ----------------------------------------------------------------------------
   Le parcours ne change pas : les trois phrases du hero, le contenu visible,
   le menu de droite, les étiquettes de gauche, la barre du haut. Ce qui change,
   c'est le moteur : une timeline GSAP unique, en boucle, où CHAQUE élément
   démarre à intervalle fixe (CADENCE). Plus de délais calculés en pourcentage
   d'un cycle : une pulsation toutes les 85 ms, toujours.

   Ce qui est animé reste composé par le GPU : transform (scale) et
   filter: brightness. Aucune ombre, aucune couleur, donc aucune repeinte.

   Le script de traduction réécrit parfois le texte : le moteur redécoupe et
   relance. Le défilement reconstruit la timeline sur ce qui est visible.
   ========================================================================== */

(function () {
  if (window.__impulsion) return;
  window.__impulsion = true;
  if (!window.gsap) return;                       // sans GSAP, on ne casse rien
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const CADENCE = 0.085;   // une impulsion toutes les 85 ms : la cadence
  const MONTEE = 0.15;     // temps pour atteindre le pic
  const RETOUR = 0.30;     // temps pour revenir au repos
  const REPOS = 0.9;       // pause en fin de boucle

  const HERO = ['.hero .bienvenue', '.hero-titre h1', '.hero-soustitre'];
  const TEXTE = 'main h2, main h3, main .lead, main .etiq, main figcaption, main .chiffre,' +
                ' main .impulsion-texte';
  const MEDIA = 'main figure img, main .verre, main .carte, main .impulsion-media';

  document.documentElement.classList.add('gsap-impulsion');

  /* --------------------------------------------------------- découpages */
  function decouperLettres(el) {
    if (el.dataset.decoupe === 'lettres') {
      const existantes = [].slice.call(el.querySelectorAll('.lettre'));
      if (existantes.length) return existantes;
      delete el.dataset.decoupe;
    }
    const clair = el.classList.contains('bienvenue') || el.classList.contains('hero-soustitre');
    const texte = el.textContent;
    el.dataset.texteSource = texte;
    el.dataset.decoupe = 'lettres';
    el.textContent = '';
    const sortie = [];
    for (let i = 0; i < texte.length; i++) {
      const ch = texte[i];
      if (ch === ' ' || ch === '\u00a0') {
        el.appendChild(document.createTextNode('\u00a0'));
        continue;
      }
      const s = document.createElement('span');
      s.className = 'lettre' + (clair ? ' lettre-clair' : '');
      s.dataset.c = ch;
      s.textContent = ch;
      el.appendChild(s);
      sortie.push(s);
    }
    return sortie;
  }

  function decouperMots(el) {
    if (el.dataset.decoupe === 'mots') {
      const existants = [].slice.call(el.querySelectorAll('.impulsion-mot'));
      if (existants.length) return existants;
      delete el.dataset.decoupe;
    }
    if (el.querySelector('a, strong, em, br, code, img, svg')) return [];
    const texte = el.textContent;
    if (!texte.trim()) return [];
    el.dataset.decoupe = 'mots';
    el.textContent = '';
    const sortie = [];
    texte.split(/(\s+)/).forEach(function (morceau) {
      if (!morceau) return;
      if (/^\s+$/.test(morceau)) {
        el.appendChild(document.createTextNode(' '));
        return;
      }
      const s = document.createElement('span');
      s.className = 'impulsion-mot';
      s.textContent = morceau;
      el.appendChild(s);
      sortie.push(s);
    });
    return sortie;
  }

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    return r.bottom > 0 && r.top < (window.innerHeight || 0);
  }

  /* ------------------------------------------------------ la timeline */
  let tl = null;
  let touches = [];

  function construire() {
    const pas = [];

    // 1. les trois phrases du hero, lettre par lettre
    HERO.forEach(function (sel) {
      const el = document.querySelector(sel);
      if (!el || !visible(el)) return;
      const lettres = decouperLettres(el);
      lettres.forEach(function (l) { pas.push({ el: l, k: 1.20, f: 'brightness(2.6)' }); });
    });

    // 2. le contenu visible, de haut en bas
    const centre = [].slice.call(document.querySelectorAll(TEXTE + ', ' + MEDIA))
      .filter(visible)
      .sort(function (a, b) {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
      });

    centre.forEach(function (el) {
      if (el.matches(MEDIA)) {
        pas.push({ el: el, k: 1.035, f: 'brightness(1.45)' });
        return;
      }
      const mots = decouperMots(el);
      if (mots.length) {
        mots.forEach(function (m) { pas.push({ el: m, k: 1.06, f: 'brightness(2.3)' }); });
      } else {
        pas.push({ el: el, k: 1.03, f: 'brightness(1.8)' });
      }
    });

    // 3. le menu de droite, de haut en bas
    [].slice.call(document.querySelectorAll('.rail a')).filter(visible).forEach(function (el) {
      pas.push({ el: el, k: 1.25, f: 'brightness(2.5)' });
    });

    // 4. les étiquettes de gauche, de bas en haut
    ['.play-music', '.lien-gauche', '.badge-hero']
      .map(function (s) { return document.querySelector(s); })
      .filter(function (e) { return e && visible(e); })
      .forEach(function (el) { pas.push({ el: el, k: 1.25, f: 'brightness(2.5)' }); });

    // 5. la barre du haut — le bouton plein reste sobre
    [document.querySelector('.marque')]
      .concat([].slice.call(document.querySelectorAll('.langues button')))
      .concat([document.querySelector('.nav-haut .bouton')])
      .filter(function (e) { return e && visible(e); })
      .forEach(function (el) {
        const plein = el.classList.contains('bouton');
        pas.push({ el: el, k: plein ? 1.10 : 1.25, f: plein ? 'brightness(1.18)' : 'brightness(2.5)' });
      });

    if (!pas.length) return;

    // on remet tout au repos avant de reconstruire
    if (touches.length) gsap.set(touches, { scale: 1, filter: 'brightness(1)' });
    if (tl) tl.kill();

    touches = pas.map(function (p) { return p.el; });

    tl = gsap.timeline({ repeat: -1, repeatDelay: REPOS });
    pas.forEach(function (p, i) {
      const t = i * CADENCE;
      tl.to(p.el,
        { scale: p.k, filter: p.f, duration: MONTEE, ease: 'power2.out', overwrite: 'auto' }, t);
      tl.to(p.el,
        { scale: 1, filter: 'brightness(1)', duration: RETOUR, ease: 'power2.inOut', overwrite: 'auto' },
        t + MONTEE);
    });

    window.__impulsionTl = tl;
  }

  /* ------------------------------------------------------------- relances */
  let minuteur = null;
  function relancer() {
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { requestAnimationFrame(construire); }, 150);
  }

  window.addEventListener('scroll', relancer, { passive: true });
  window.addEventListener('resize', relancer);
  window.addEventListener('load', relancer);

  construire();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(construire);
  }
  setTimeout(construire, 700);

  /* le texte réécrit par la traduction : on redécoupe et on relance */
  const observateur = new MutationObserver(function () {
    if (document.querySelector('.lettre, .impulsion-mot')) return;
    relancer();
  });
  document.querySelectorAll('main').forEach(function (m) {
    observateur.observe(m, { childList: true, subtree: true });
  });
})();
