/* ============================================================================
   MOTEUR D'IMPULSION — un seul influx nerveux pour tout le site
   ----------------------------------------------------------------------------
   Au chargement, puis à chaque arrêt du défilement (anti-rebond 150 ms), le
   moteur regarde ce qui est réellement visible dans la fenêtre, le trie de
   haut en bas, et refait le parcours :

     1. le contenu central visible, de haut en bas
        (mots des titres et paragraphes, images et cartes)
     2. le menu de droite, de haut en bas
     3. les étiquettes de gauche, de bas en haut
     4. la barre du haut : logo, drapeaux, Soutenir
     puis retour au premier élément central visible.

   Tout repose sur animation-delay : aucune écriture de style par image.
   Les pourcentages des images clés sont recalculés à chaque cycle, sinon un
   parcours plus court accélérerait l'éclat.

   Utilisation : ce fichier est chargé par toutes les pages. Les sections qui
   veulent être traversées n'ont rien à faire ; celles qui veulent forcer un
   rôle mettent .impulsion-texte (découpé en mots) ou .impulsion-media.
   ========================================================================== */

(function () {
  if (window.__impulsion) return;   // un seul moteur par page
  window.__impulsion = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ------------------------------------------------------------ réglages */
  var HERO = ['.hero .bienvenue', '.hero-titre h1', '.hero-soustitre'];

  var TEXTE = 'main h2, main h3, main .lead, main .etiq, main figcaption, main .chiffre,' +
              ' main .impulsion-texte';
  var MEDIA = 'main figure img, main .verre, main .carte, main .impulsion-media';

  var DUREE = {
    phrase: 5.8,     // traversée d'une phrase du hero, lettre par lettre
    mot: 0.26,       // un mot de contenu
    media: 0.5,      // une image, une carte
    etiquette: 0.42  // un lien, un badge, un bouton
  };

  var ECLAT = {       // durée d'allumage, en secondes
    lettre: 1.05,
    mot: 0.62,
    media: 0.95,
    etiquette: 0.8
  };

  var cycle = 0;

  /* --------------------------------------------------------- découpages */
  function decouperLettres(el) {
    if (el.dataset.decoupe === 'lettres') {
      var existantes = [].slice.call(el.querySelectorAll('.lettre'));
      // un script de traduction peut réécrire le texte et effacer nos spans :
      // dans ce cas on redécoupe au lieu de rendre une liste vide.
      if (existantes.length) return existantes;
      delete el.dataset.decoupe;
    }
    var clair = el.classList.contains('bienvenue') ||
                el.classList.contains('hero-soustitre');
    el.dataset.texteSource = el.textContent;
    el.dataset.decoupe = 'lettres';
    var texte = el.textContent;
    el.textContent = '';
    var sortie = [];
    for (var i = 0; i < texte.length; i++) {
      var ch = texte[i];
      if (ch === ' ' || ch === '\u00a0') {
        el.appendChild(document.createTextNode('\u00a0'));
        continue;
      }
      var s = document.createElement('span');
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
      var existants = [].slice.call(el.querySelectorAll('.impulsion-mot'));
      if (existants.length) return existants;
      delete el.dataset.decoupe;
    }
    // on ne découpe pas un bloc qui contient du balisage : on casserait un lien
    if (el.querySelector('a, strong, em, br, code, img, svg')) return [];
    var texte = el.textContent;
    if (!texte.trim()) return [];
    el.dataset.decoupe = 'mots';
    el.textContent = '';
    var sortie = [];
    // On garde de vrais espaces : le texte reste copiable et lisible par un
    // lecteur d'écran. Un nœud texte suffit entre deux inline-block.
    texte.split(/(\s+)/).forEach(function (morceau) {
      if (!morceau) return;
      if (/^\s+$/.test(morceau)) {
        el.appendChild(document.createTextNode(' '));
        return;
      }
      var s = document.createElement('span');
      s.className = 'impulsion-mot';
      s.textContent = morceau;
      el.appendChild(s);
      sortie.push(s);
    });
    return sortie;
  }

  /* ------------------------------------------------------------ visibilité */
  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    return r.bottom > 0 && r.top < (window.innerHeight || 0);
  }

  function poser(el, type, delai) {
    if (type === 'lettre') {
      el.style.animationDelay = delai.toFixed(3) + 's';
      return;
    }
    if (type === 'mot') {
      if (el.classList) el.classList.add('impulsion-en-mot');
    } else if (type === 'media') {
      if (el.classList) el.classList.add('impulsion-en-bloc');
    } else {
      if (el.classList) el.classList.add('circuit-el');
    }
    el.style.setProperty('--d', delai.toFixed(3) + 's');
  }

  /* ---------------------------------------------------------- construction */
  function construire() {
    var t = 0;

    // 1. le hero : trois phrases, lettre par lettre
    HERO.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el || !visible(el)) return;
      var ls = decouperLettres(el);
      if (!ls.length) return;
      var largeur = ls.reduce(function (a, b) { return a + (b.offsetWidth || 20); }, 0) || 1;
      var cum = 0;
      ls.forEach(function (b) {
        poser(b, 'lettre', t + (cum / largeur) * DUREE.phrase);
        cum += b.offsetWidth || 20;
      });
      t += DUREE.phrase;
    });

    // 2. le contenu central visible, de haut en bas
    var centre = [].slice.call(document.querySelectorAll(TEXTE + ', ' + MEDIA))
      .filter(visible)
      .sort(function (a, b) {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
      });

    centre.forEach(function (el) {
      if (el.matches(MEDIA)) {
        poser(el, 'media', t);
        t += DUREE.media;
        return;
      }
      var ms = decouperMots(el);
      if (ms.length) {
        ms.forEach(function (m) { poser(m, 'mot', t); t += DUREE.mot; });
      } else {
        poser(el, 'mot', t);   // bloc non découpable : il pulse d'un seul tenant
        t += DUREE.mot * 2;
      }
    });

    // 3. le menu de droite, de haut en bas
    [].slice.call(document.querySelectorAll('.rail a')).filter(visible).forEach(function (el) {
      poser(el, 'etiquette', t);
      t += DUREE.etiquette;
    });

    // 4. les étiquettes de gauche, de bas en haut
    ['.play-music', '.lien-gauche', '.badge-hero']
      .map(function (s) { return document.querySelector(s); })
      .filter(function (e) { return e && visible(e); })
      .forEach(function (el) { poser(el, 'etiquette', t); t += DUREE.etiquette; });

    // 5. la barre du haut : logo, drapeaux, Soutenir
    [document.querySelector('.marque')]
      .concat([].slice.call(document.querySelectorAll('.langues button')))
      .concat([document.querySelector('.nav-haut .bouton')])
      .filter(function (e) { return e && visible(e); })
      .forEach(function (el) { poser(el, 'etiquette', t); t += DUREE.etiquette; });

    // respiration en fin de boucle : sans elle, un parcours court tourne trop vite
    cycle = Math.max(t * 1.12, 9);
    document.documentElement.style.setProperty('--cycle', cycle.toFixed(2) + 's');
    ecrireImagesCles(cycle);
  }

  /* ------------------------------------------------------ images clés */
  function ecrireImagesCles(cycle) {
    var pct = function (t) { return Math.min(100, (t / cycle) * 100).toFixed(3); };
    var feuille = document.getElementById('impulsion-images');
    if (!feuille) {
      feuille = document.createElement('style');
      feuille.id = 'impulsion-images';
      document.head.appendChild(feuille);
    }
    feuille.textContent =
      '@keyframes montee-lettre {' +
        '0%{transform:scale(1)}' +
        pct(0.12) + '%{transform:scale(1.25)}' +
        pct(0.12 + ECLAT.lettre * 0.5) + '%{transform:scale(1.25)}' +
        pct(0.12 + ECLAT.lettre) + '%{transform:scale(1)}' +
        '100%{transform:scale(1)}}' +

      '@keyframes lueur-lettre {' +
        '0%{opacity:0}' +
        pct(0.12) + '%{opacity:1}' +
        pct(0.12 + ECLAT.lettre * 0.45) + '%{opacity:1}' +
        pct(0.12 + ECLAT.lettre) + '%{opacity:0}' +
        '100%{opacity:0}}' +

      '@keyframes dock-circuit {' +
        '0%{transform:scale(1);filter:brightness(1);text-shadow:0 0 0 rgba(255,255,255,0)}' +
        pct(0.13) + '%{transform:scale(1.25);filter:brightness(2.5);' +
          'text-shadow:0 0 10px #fff,0 0 22px #fff,0 0 38px rgba(255,232,160,.95)}' +
        pct(0.13 + ECLAT.etiquette * 0.55) + '%{transform:scale(1.25);filter:brightness(2.5);' +
          'text-shadow:0 0 10px #fff,0 0 22px #fff,0 0 38px rgba(255,232,160,.95)}' +
        pct(0.13 + ECLAT.etiquette) + '%{transform:scale(1);filter:brightness(1);' +
          'text-shadow:0 0 0 rgba(255,255,255,0)}' +
        '100%{transform:scale(1);filter:brightness(1);text-shadow:0 0 0 rgba(255,255,255,0)}}' +

      '@keyframes dock-mot {' +
        '0%{transform:scale(1);filter:brightness(1)}' +
        pct(0.1) + '%{transform:scale(1.05);filter:brightness(2.3)}' +
        pct(0.1 + ECLAT.mot * 0.5) + '%{transform:scale(1.05);filter:brightness(2.3)}' +
        pct(0.1 + ECLAT.mot) + '%{transform:scale(1);filter:brightness(1)}' +
        '100%{transform:scale(1);filter:brightness(1)}}' +

      '@keyframes dock-bloc {' +
        '0%{transform:scale(1);filter:brightness(1)}' +
        pct(0.12) + '%{transform:scale(1.035);filter:brightness(1.45) drop-shadow(0 0 18px rgba(252,246,186,.6))}' +
        pct(0.12 + ECLAT.media * 0.5) + '%{transform:scale(1.035);filter:brightness(1.45) drop-shadow(0 0 18px rgba(252,246,186,.6))}' +
        pct(0.12 + ECLAT.media) + '%{transform:scale(1);filter:brightness(1)}' +
        '100%{transform:scale(1);filter:brightness(1)}}';
  }

  /* ------------------------------------------------------------ relances */
  var minuteur = null;
  function relancer() {
    clearTimeout(minuteur);
    minuteur = setTimeout(function () {
      requestAnimationFrame(construire);
    }, 150);
  }

  window.addEventListener('scroll', relancer, { passive: true });
  window.addEventListener('resize', relancer);
  window.addEventListener('load', relancer);

  // première construction : tout de suite, puis une fois les polices prêtes
  construire();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { construire(); });
  }
  setTimeout(construire, 600);
})();
