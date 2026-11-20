/* ============================================================================
   ÉTOILE À NEUTRONS — page de l'application (thème : la communication)

   Ce que dit la littérature, et que ce dessin respecte :

   · diamètre réel ~20 km, surface à ~1 million de kelvins : elle paraît
     bleu-blanc, mais l'essentiel de son rayonnement part en X-rays ;
   · le faisceau radio n'est PAS un projecteur : c'est un cône ÉTROIT et CREUX,
     de 1 à 10° d'ouverture selon la période (Lorimer & Kramer, ρ ≈ 1,24° · P^-1/2) ;
   · l'émission ne part pas de la surface : elle naît loin de l'étoile, dans la
     magnétosphère (r_em >> rayon) ;
   · le pulse est BREF : quelques pour cent de la période, pas un halo permanent.

   D'où le dessin : une petite sphère bleu-blanc, un réseau de lignes de champ
   qui tourne avec elle, deux pinceaux étroits et creux, et un éclat court
   chaque fois qu'un faisceau balaie notre direction. Aucun phare.
   ========================================================================= */
(() => {
  const canvas = document.getElementById('etoile-neutron');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const alea = mulberry32(20261120);

  /* ---- granulation de surface -------------------------------------------- */
  const GRAINS = [];
  for (let i = 0; i < 130; i++) {
    const u = alea() * 2 - 1;
    const th = alea() * Math.PI * 2;
    const r = Math.sqrt(Math.max(0, 1 - u * u));
    GRAINS.push({ x: Math.cos(th) * r, y: u, z: Math.sin(th) * r,
                  taille: 0.12 + alea() * 0.26, phase: alea() * Math.PI * 2 });
  }

  let L = 0, H = 0, cx = 0, cy = 0, echelle = 1, dpr = 1;

  function jauger() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    L = rect.width; H = rect.height;
    canvas.width = Math.round(L * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = L * 0.56;
    cy = H * 0.32;
    echelle = Math.max(1, L / 460);
  }

  /* ---- constantes physiques du dessin ------------------------------------ */
  let angle = 0, phase = 0, dernier = 0;
  const anneaux = [];

  const VITESSE = 2.4;                  // rad/s
  const PERIODE = (Math.PI * 2) / VITESSE;

  const R_COEUR = 14;                   // rayon de l'étoile, en px avant échelle
  const LONGUEUR = 150;                 // portée des faisceaux
  const DEMI_ANGLE = 0.048;             // ~2,7° : un vrai cône étroit
  const HAUTEUR_EM = 1.7;               // l'émission naît loin de la surface
  const TILT = 0.62;                    // axe magnétique incliné
  const DUTY = 0.055;                   // 5,5 % de la période : l'éclat est bref

  function halo(x, y, r, couleurs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    for (const [pos, col] of couleurs) g.addColorStop(pos, col);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- un faisceau : cône étroit, creux, qui s'éteint en s'éloignant ------ */
  function faisceau(a, coeur) {
    const cosA = Math.cos(a), sinA = Math.sin(a);
    const perpX = -sinA, perpY = cosA;

    const depart = coeur * HAUTEUR_EM;
    const fin = depart + LONGUEUR * echelle;
    const sx = cx + cosA * depart, sy = cy + sinA * depart;
    const ex = cx + cosA * fin, ey = cy + sinA * fin;

    const w0 = depart * Math.tan(DEMI_ANGLE);
    const w1 = fin * Math.tan(DEMI_ANGLE);

    /* le corps du cône, très peu lumineux : c'est du vide, pas un projecteur */
    const g = ctx.createLinearGradient(sx, sy, ex, ey);
    g.addColorStop(0, 'rgba(150, 196, 255, 0)');
    g.addColorStop(0.18, 'rgba(176, 214, 255, 0.10)');
    g.addColorStop(0.55, 'rgba(150, 196, 255, 0.05)');
    g.addColorStop(1, 'rgba(120, 160, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx + perpX * w0, sy + perpY * w0);
    ctx.lineTo(ex + perpX * w1, ey + perpY * w1);
    ctx.lineTo(ex - perpX * w1, ey - perpY * w1);
    ctx.lineTo(sx - perpX * w0, sy - perpY * w0);
    ctx.closePath();
    ctx.fill();

    /* les deux bords : c'est eux qu'on voit sur un cône creux */
    ctx.strokeStyle = 'rgba(206, 232, 255, 0.20)';
    ctx.lineWidth = Math.max(0.5, 0.7 * echelle);
    for (const s of [1, -1]) {
      const gb = ctx.createLinearGradient(sx + perpX * w0 * s, sy + perpY * w0 * s, ex + perpX * w1 * s, ey + perpY * w1 * s);
      gb.addColorStop(0, 'rgba(206, 232, 255, 0)');
      gb.addColorStop(0.25, 'rgba(220, 240, 255, 0.28)');
      gb.addColorStop(1, 'rgba(150, 190, 255, 0)');
      ctx.strokeStyle = gb;
      ctx.beginPath();
      ctx.moveTo(sx + perpX * w0 * s, sy + perpY * w0 * s);
      ctx.lineTo(ex + perpX * w1 * s, ey + perpY * w1 * s);
      ctx.stroke();
    }

    /* le cœur du faisceau, fin et vif, au ras de l'axe */
    const gc = ctx.createLinearGradient(sx, sy, ex, ey);
    gc.addColorStop(0, 'rgba(240, 250, 255, 0)');
    gc.addColorStop(0.14, 'rgba(246, 252, 255, 0.68)');
    gc.addColorStop(0.45, 'rgba(200, 228, 255, 0.20)');
    gc.addColorStop(1, 'rgba(150, 190, 255, 0)');
    ctx.strokeStyle = gc;
    ctx.lineWidth = Math.max(0.6, 1.1 * echelle);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  /* ---- lignes de champ magnétique : ce qui fait « étoile à neutrons » ----- */
  function champ(coeur, angleRotation) {
    ctx.save();
    /* on ne garde que l'anneau extérieur au corps de l'étoile */
    ctx.beginPath();
    ctx.arc(cx, cy, coeur * 4.6, 0, Math.PI * 2);
    ctx.arc(cx, cy, coeur * 1.02, 0, Math.PI * 2, true);
    ctx.clip();

    ctx.lineWidth = Math.max(0.4, 0.6 * echelle);
    for (let k = 1; k <= 3; k++) {
      const rx = coeur * (1.55 + k * 0.95);
      const ry = coeur * (0.95 + k * 0.72);
      ctx.strokeStyle = `rgba(150, 190, 255, ${0.16 / k})`;
      for (const demi of [0, Math.PI]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, angleRotation, demi, demi + Math.PI);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function dessiner(dt) {
    ctx.clearRect(0, 0, L, H);
    ctx.globalCompositeOperation = 'lighter';

    const coeur = R_COEUR * echelle;

    /* l'éclat n'existe que pendant 5 % de la période : un pulse, pas un halo */
    const frac = (phase % PERIODE) / PERIODE;
    const proche = Math.pow(Math.max(0, Math.cos(angle - TILT)), 26);
    const enPulse = frac < DUTY ? Math.sin((frac / DUTY) * Math.PI) : 0;
    const impulsion = Math.max(proche * 0.55, enPulse);

    /* 1. brume très discrète : la profondeur, sans halo de phare */
    halo(cx, cy, coeur * 6.5, [
      [0, `rgba(120, 170, 255, ${0.030 + impulsion * 0.05})`],
      [0.5, 'rgba(70, 110, 220, 0.014)'],
      [1, 'rgba(30, 45, 110, 0)'],
    ]);

    /* 2. les deux faisceaux étroits */
    for (const sens of [1, -1]) {
      const a = angle + (sens > 0 ? 0 : Math.PI);
      ctx.globalAlpha = 0.55 + impulsion * 0.45;
      faisceau(a, coeur);
      ctx.globalAlpha = 1;
    }

    /* 3. anneaux d'impulsion : brefs, discrets */
    for (let i = anneaux.length - 1; i >= 0; i--) {
      const an = anneaux[i];
      an.t += dt;
      const k = an.t / 1.1;
      if (k >= 1) { anneaux.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(198, 228, 255, ${0.20 * (1 - k)})`;
      ctx.lineWidth = Math.max(0.5, 1.0 * (1 - k) * echelle);
      ctx.beginPath();
      ctx.arc(cx, cy, coeur * (1.15 + k * 3.2), 0, Math.PI * 2);
      ctx.stroke();
    }

    /* 4. les lignes de champ, derrière le corps */
    champ(coeur, angle * 0.5);

    /* 5. le corps : bleu-blanc, bord assombri */
    halo(cx, cy, coeur * 1.15, [
      [0, 'rgba(214, 236, 255, 0.95)'],
      [0.65, 'rgba(150, 190, 250, 0.80)'],
      [1, 'rgba(80, 120, 210, 0)'],
    ]);

    halo(cx, cy, coeur, [
      [0, 'rgba(255, 255, 255, 0.98)'],
      [0.30, 'rgba(232, 244, 255, 0.96)'],
      [0.62, 'rgba(186, 214, 252, 0.92)'],
      [0.86, 'rgba(132, 172, 236, 0.80)'],
      [0.97, 'rgba(86, 124, 200, 0.42)'],
      [1, 'rgba(50, 80, 160, 0)'],
    ]);

    /* granulation */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, coeur * 0.97, 0, Math.PI * 2);
    ctx.clip();
    const ca = Math.cos(angle), sa = Math.sin(angle);
    for (const gr of GRAINS) {
      const rx = gr.x * ca - gr.z * sa;
      const rz = gr.x * sa + gr.z * ca;
      if (rz < -0.2) continue;
      const f = 0.5 + 0.5 * rz;
      const px = cx + rx * coeur * 0.9;
      const py = cy + gr.y * coeur * 0.9;
      const rr = Math.max(0.45, coeur * gr.taille * f * 0.26);
      const scint = 0.6 + 0.4 * Math.sin(phase * 2.0 + gr.phase);
      ctx.fillStyle = `rgba(172, 208, 255, ${0.24 * f * scint})`;
      ctx.beginPath();
      ctx.arc(px, py, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* 6. l'éclat du pulse : court, blanc, centré sur l'étoile */
    if (impulsion > 0.02) {
      halo(cx, cy, coeur * (1.1 + impulsion * 1.5), [
        [0, `rgba(255, 255, 255, ${0.45 * impulsion})`],
        [0.5, `rgba(225, 242, 255, ${0.16 * impulsion})`],
        [1, 'rgba(170, 205, 255, 0)'],
      ]);
    }

    /* 7. voile d'éloignement */
    ctx.globalCompositeOperation = 'source-over';
    const brume = ctx.createRadialGradient(cx, cy, coeur * 1.6, cx, cy, coeur * 8);
    brume.addColorStop(0, 'rgba(5, 2, 10, 0)');
    brume.addColorStop(0.5, 'rgba(5, 2, 10, 0.06)');
    brume.addColorStop(1, 'rgba(5, 2, 10, 0.22)');
    ctx.fillStyle = brume;
    ctx.beginPath();
    ctx.arc(cx, cy, coeur * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  let prochaine = 0;
  function boucle(t) {
    const dt = dernier ? Math.min((t - dernier) / 1000, 0.05) : 0.016;
    dernier = t;
    phase += dt;
    angle += VITESSE * dt;

    const tours = phase / PERIODE;
    if (tours > prochaine) {
      prochaine = tours + 1;
      anneaux.push({ t: 0 });
      if (anneaux.length > 4) anneaux.shift();
    }

    dessiner(dt);
    requestAnimationFrame(boucle);
  }

  jauger();
  if (calme) {
    angle = 0.4; phase = 0.0;
    dessiner(0);
  } else {
    let attente = false;
    addEventListener('resize', () => {
      if (attente) return;
      attente = true;
      requestAnimationFrame(() => { jauger(); attente = false; });
    });
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { dernier = 0; requestAnimationFrame(boucle); }
    }, { threshold: 0 });
    io.observe(canvas);
    requestAnimationFrame(boucle);
  }
})();
