/* ============================================================================
   AMBIANCE DES FONDS — parallaxe 2.5D et impulsions lumineuses
   ----------------------------------------------------------------------------
   Deux effets, un seul requestAnimationFrame, et rien qui touche au texte,
   aux menus ou au moteur d'impulsion des lettres.

   1. Parallaxe : la souris déplace le ciel de 18 px au plus, avec une légère
      inclinaison, et une inertie (lerp). On n'écrit que deux variables CSS,
      lues par .ciel en transform → composé par le GPU.

   2. Impulsions : un canvas fin, à 30 images par seconde, posé sous les
      étoiles. Sur NeuroExoAI, des ondes partent du centre du neurone vers
      l'extérieur. Sur LunaGalaxie, les étoiles scintillent et le cœur pulse.
   ========================================================================== */

(function () {
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var racine = document.documentElement;
  var page = document.body ? document.body.dataset.page : '';
  var ciel = document.querySelector('.ciel');
  if (!ciel || reduit) return;

  /* ------------------------------------------------------------ parallaxe */
  var cibleX = 0, cibleY = 0, courantX = 0, courantY = 0;
  var AMPLITUDE_X = 18;   // px
  var AMPLITUDE_Y = 14;   // px
  var INCLINAISON = 1.2;  // degrés

  window.addEventListener('mousemove', function (e) {
    cibleX = (e.clientX / window.innerWidth) * 2 - 1;
    cibleY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ------------------------------------------------- impulsions (canvas) */
  var canvas = null, ctx = null, L = 0, H = 0, dpr = 1;
  var ondes = [], etoiles = [], particules = [];
  var dernier = 0, temps = 0;

  function installerCanvas() {
    if (page !== 'neuroexo' && page !== 'luna') return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'impulsions-fond';
    ciel.appendChild(canvas);
    ctx = canvas.getContext('2d', { alpha: true });
    dimensionner();
  }

  function dimensionner() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    L = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(L * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = L + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    preparer();
  }

  function preparer() {
    ondes = [];
    etoiles = [];
    particules = [];
    if (page === 'neuroexo') {
      // trois ondes décalées, comme un influx qui part du corps du neurone
      for (var i = 0; i < 3; i++) ondes.push({ age: i * 1.15, duree: 3.4 });
      // poussière dorée qui dérive lentement
      for (var j = 0; j < 46; j++) {
        particules.push({
          x: Math.random() * L,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.12,
          r: 0.6 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
        });
      }
    } else if (page === 'luna') {
      for (var k = 0; k < 90; k++) {
        etoiles.push({
          x: Math.random() * L,
          y: Math.random() * H,
          r: 0.5 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
          vitesse: 0.6 + Math.random() * 1.4,
        });
      }
    }
  }

  function dessinerNeuroexo(dt) {
    var cx = L * 0.5, cy = H * 0.42;
    var portee = Math.max(L, H) * 0.62;

    for (var i = 0; i < ondes.length; i++) {
      var o = ondes[i];
      o.age += dt;
      if (o.age > o.duree) o.age -= o.duree;
      var p = o.age / o.duree;
      var rayon = portee * p;
      var alpha = (1 - p) * 0.30 * (p < 0.15 ? p / 0.15 : 1);
      if (alpha <= 0.004) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, rayon, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 208, 128,' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 2.2 * (1 - p) + 0.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, rayon * 0.985, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(150, 190, 255,' + (alpha * 0.45).toFixed(3) + ')';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    for (var k = 0; k < particules.length; k++) {
      var q = particules[k];
      q.x += q.vx;
      q.y += q.vy;
      if (q.x < -10) q.x = L + 10;
      if (q.x > L + 10) q.x = -10;
      if (q.y < -10) q.y = H + 10;
      if (q.y > H + 10) q.y = -10;
      var a = 0.22 + 0.22 * Math.sin(temps * 1.3 + q.phase);
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 214, 150,' + a.toFixed(3) + ')';
      ctx.fill();
    }
  }

  function dessinerLuna(dt) {
    // scintillement : chaque étoile respire à son rythme
    for (var i = 0; i < etoiles.length; i++) {
      var e = etoiles[i];
      var a = 0.18 + 0.5 * (0.5 + 0.5 * Math.sin(temps * e.vitesse + e.phase));
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(235, 240, 255,' + a.toFixed(3) + ')';
      ctx.fill();
    }
    // le cœur de la galaxie pulse doucement
    var cx = L * 0.5, cy = H * 0.5;
    var battement = 0.5 + 0.5 * Math.sin(temps * 0.9);
    var rayon = Math.min(L, H) * (0.16 + 0.03 * battement);
    var halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, rayon);
    halo.addColorStop(0, 'rgba(255, 226, 160,' + (0.13 + 0.07 * battement).toFixed(3) + ')');
    halo.addColorStop(0.45, 'rgba(210, 170, 255,' + (0.05 + 0.03 * battement).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, rayon, 0, Math.PI * 2);
    ctx.fill();
  }

  /* --------------------------------------------------------------- boucle */
  var INTERVALLE = 1000 / 30;   // le canvas tourne à 30 i/s, le reste à 60

  function boucle(t) {
    requestAnimationFrame(boucle);
    if (!dernier) dernier = t;
    var delta = Math.min(t - dernier, 60);
    dernier = t;
    temps += delta / 1000;

    // parallaxe : on lisse vers la cible (inertie)
    courantX += (cibleX * AMPLITUDE_X - courantX) * 0.055;
    courantY += (cibleY * AMPLITUDE_Y - courantY) * 0.055;
    racine.style.setProperty('--px', courantX.toFixed(2) + 'px');
    racine.style.setProperty('--py', courantY.toFixed(2) + 'px');
    racine.style.setProperty('--rx', (-cibleY * INCLINAISON).toFixed(3) + 'deg');
    racine.style.setProperty('--ry', (cibleX * INCLINAISON).toFixed(3) + 'deg');
    // respiration : 40 s pour un aller-retour, amplitude de 3,5 %
    racine.style.setProperty('--echelle', (1.03 + 0.035 * Math.sin(temps * 0.157)).toFixed(4));

    if (!ctx) return;
    if (t - (canvas._dernier || 0) < INTERVALLE) return;
    canvas._dernier = t;
    ctx.clearRect(0, 0, L, H);
    if (page === 'neuroexo') dessinerNeuroexo(delta / 1000);
    else dessinerLuna(delta / 1000);
  }

  window.addEventListener('resize', dimensionner);
  installerCanvas();
  requestAnimationFrame(boucle);
})();
