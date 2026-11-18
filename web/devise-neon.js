/* ============================================================================
   LA DEVISE — pulsation dédiée
   ----------------------------------------------------------------------------
   Une seule phrase sur le site a ce comportement, et c'est voulu : elle
   respire à son rythme, indépendamment du circuit d'impulsion des menus.

        rouge  →  balayage lettre par lettre qui vire au vert
               →  la phrase entière est verte
               →  trois clignotements
               →  retour au rouge, courte pause, on recommence

   Les lettres sont découpées ici, pas dans le HTML : le script de traduction
   réécrit le texte à la volée, il faut donc pouvoir redécouper. Tous les
   minuteurs sont annulés à chaque redécoupage, sinon le balayage continue de
   colorier des lettres qui n'existent plus.
   ========================================================================== */

(function () {
  var el = document.querySelector('.devise-neon');
  if (!el) return;

  var PAS = 55;            // ms entre deux lettres
  var PAUSE = 900;         // repos en rouge avant de repartir
  var BLINK_MS = 300;      // durée d'un clignotement (voir @keyframes)
  var BLINKS = 3;          // nombre de clignotements
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var lettres = [];
  var minuteurs = [];

  function planifier(fn, ms) {
    minuteurs.push(setTimeout(fn, ms));
  }

  function annuler() {
    minuteurs.forEach(clearTimeout);
    minuteurs = [];
  }

  function decouper() {
    var texte = el.textContent;
    if (!texte.trim()) return;
    el.textContent = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < texte.length; i++) {
      var s = document.createElement('span');
      s.className = 'l';
      s.textContent = texte[i] === ' ' ? '\u00a0' : texte[i];
      frag.appendChild(s);
    }
    el.appendChild(frag);
    lettres = [].slice.call(el.querySelectorAll('.l'));
  }

  function rouge() {
    el.classList.remove('clignote');
    lettres.forEach(function (l) { l.classList.remove('vert'); });
  }

  function cycle() {
    if (!lettres.length || reduit) return;
    annuler();
    rouge();

    var i = 0;
    function lettreSuivante() {
      if (i >= lettres.length) { clignoter(); return; }
      if (lettres[i]) lettres[i].classList.add('vert');
      i += 1;
      planifier(lettreSuivante, PAS);
    }

    function clignoter() {
      planifier(function () {
        el.classList.remove('clignote');
        void el.offsetWidth;          // force la reprise de l'animation
        el.classList.add('clignote');
        planifier(function () {
          el.classList.remove('clignote');
          planifier(cycle, 700);      // pause en vert, puis on repart au rouge
        }, BLINKS * BLINK_MS + 120);
      }, 250);
    }

    planifier(lettreSuivante, PAUSE);
  }

  decouper();
  cycle();

  // la langue change : le texte est réécrit, on redécoupe et on relance
  new MutationObserver(function () {
    if (el.querySelector('.l')) return;      // ce sont nos propres spans
    if (!el.textContent.trim()) return;
    decouper();
    cycle();
  }).observe(el, { childList: true, characterData: true, subtree: true });
})();
