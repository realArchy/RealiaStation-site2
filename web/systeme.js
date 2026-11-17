/* ============================================================================
   Le motif d'accueil : naissance d'une étoile et de son système.
   Un par page, petit, jamais au centre : c'est une présence, pas un décor.

   Dessiné en canvas 2D (pas de WebGL) pour rester léger et ne pas entrer en
   concurrence avec la scène Three.js du jumeau numérique.

   Usage :
     <div class="systeme" data-position="haut-droite" data-taille="360"></div>
   ========================================================================== */

const POSITIONS = {
  'haut-droite':  { top: '4%',  right: '2%' },
  'haut-gauche':  { top: '6%',  left: '1%' },
  'bas-gauche':   { bottom: '8%', left: '2%' },
  'bas-droite':   { bottom: '6%', right: '3%' }
};

class Systeme {
  constructor(hote) {
    this.hote = hote;
    this.taille = parseInt(hote.dataset.taille || '380', 10);
    this.reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // data-position facultatif : sans lui, on respecte le style inline.
    const pos = hote.dataset.position
      ? (POSITIONS[hote.dataset.position] || POSITIONS['haut-droite'])
      : {};
    Object.assign(hote.style, {
      position: 'fixed',
      zIndex: '1',
      pointerEvents: 'none',
      opacity: hote.dataset.opacite || '0.92',
      width: this.taille + 'px',
      height: this.taille + 'px',
      ...pos
    });

    this.canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = this.taille * dpr;
    this.canvas.height = this.taille * dpr;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    hote.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);

    // poussière du disque protoplanétaire : positions tirées une seule fois,
    // sinon le disque « grouille » au lieu de tourner.
    this.poussiere = Array.from({ length: 90 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.22 + Math.random() * 0.72,
      v: 0.25 + Math.random() * 0.5,
      t: 0.6 + Math.random() * 1.6
    }));

    this.planetes = [
      { rayon: 0.30, taille: 3.4, vitesse: 0.42, teinte: '#f9a8d4', inclinaison: -0.22 },
      { rayon: 0.48, taille: 4.6, vitesse: 0.27, teinte: '#c4b5fd', inclinaison: 0.16 },
      { rayon: 0.70, taille: 3.0, vitesse: 0.17, teinte: '#7dd3fc', inclinaison: -0.10 }
    ];

    this.t0 = performance.now();
    this.defile = false;
    this.visible = true;
    this.dessiner = this.dessiner.bind(this);

    // Deux économies simples : ne rien peindre pendant un défilement, et rien
    // du tout quand le motif est sorti de l'écran.
    let minuteur = null;
    window.addEventListener('scroll', () => {
      this.defile = true;
      clearTimeout(minuteur);
      minuteur = setTimeout(() => { this.defile = false; }, 180);
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        es.forEach(e => { this.visible = e.isIntersecting; });
      }).observe(hote);
    }

    if (this.reduit) this.dessiner(0);
    else requestAnimationFrame(this.dessiner);
  }

  /** Une nappe de gaz : dégradé radial doux, jamais de bord visible. */
  gaz(cx, cy, r, couleur, alpha) {
    const g = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, couleur.replace('A', alpha));
    g.addColorStop(0.55, couleur.replace('A', alpha * 0.42));
    g.addColorStop(1, couleur.replace('A', 0));
    this.ctx.fillStyle = g;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  dessiner(t) {
    const c = this.ctx;
    const S = this.taille;
    const cx = S * 0.62;          // l'étoile n'est pas au centre du cadre
    const cy = S * 0.44;
    const sec = (t - this.t0) / 1000;

    c.clearRect(0, 0, S, S);

    // 1. nuages gazeux, dérive très lente
    const d1 = Math.sin(sec * 0.08) * S * 0.02;
    const d2 = Math.cos(sec * 0.06) * S * 0.018;
    this.gaz(cx - S * 0.16 + d1, cy - S * 0.10 + d2, S * 0.52, 'rgba(139,92,246,A)', 0.30);
    this.gaz(cx + S * 0.20 - d1, cy + S * 0.12 - d2, S * 0.40, 'rgba(232,121,249,A)', 0.20);
    this.gaz(cx - S * 0.02, cy + S * 0.26 + d1, S * 0.34, 'rgba(103,232,249,A)', 0.10);

    // 2. disque protoplanétaire : deux anneaux vus de biais
    c.save();
    c.translate(cx, cy);
    [[0.74, 0.30, -0.32], [0.52, 0.21, -0.18]].forEach(([a, b, rot], i) => {
      c.save();
      c.rotate(rot);
      c.beginPath();
      c.ellipse(0, 0, S * a * 0.62, S * b * 0.62, 0, 0, Math.PI * 2);
      c.strokeStyle = i === 0 ? 'rgba(196,181,253,.22)' : 'rgba(232,121,249,.18)';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    });

    // 3. poussière en orbite
    this.poussiere.forEach(p => {
      const ang = p.a + sec * p.v * 0.12;
      const a = S * 0.62 * 0.74 * p.r;
      const b = S * 0.62 * 0.30 * p.r;
      const x = Math.cos(ang) * a;
      const y = Math.sin(ang) * b * 0.9;
      c.globalAlpha = 0.20 + 0.28 * Math.abs(Math.sin(ang * 2 + p.t));
      c.fillStyle = '#ddd6fe';
      c.fillRect(x, y, p.t * 0.7, p.t * 0.7);
    });
    c.globalAlpha = 1;
    c.restore();

    // 4. l'étoile naissante : cœur, halo, aigrettes
    const pulsation = 1 + Math.sin(sec * 1.1) * 0.03;
    const halo = c.createRadialGradient(cx, cy, 0, cx, cy, S * 0.20 * pulsation);
    halo.addColorStop(0, 'rgba(255,255,255,.95)');
    halo.addColorStop(0.22, 'rgba(233,213,255,.55)');
    halo.addColorStop(0.55, 'rgba(232,121,249,.18)');
    halo.addColorStop(1, 'rgba(139,92,246,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(cx, cy, S * 0.20 * pulsation, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx, cy, S * 0.028 * pulsation, 0, Math.PI * 2);
    c.fill();

    // aigrettes : deux longues, deux courtes
    c.save();
    c.translate(cx, cy);
    c.strokeStyle = 'rgba(255,255,255,.35)';
    c.lineWidth = 1;
    [[S * 0.20, 0], [S * 0.20, Math.PI / 2], [S * 0.09, Math.PI / 4], [S * 0.09, -Math.PI / 4]]
      .forEach(([l, rot]) => {
        c.save();
        c.rotate(rot);
        c.beginPath();
        c.moveTo(-l, 0); c.lineTo(l, 0);
        c.stroke();
        c.restore();
      });
    c.restore();

    // 5. planètes en révolution
    this.planetes.forEach((p, i) => {
      const ang = sec * p.vitesse + i * 1.9;
      const a = S * 0.62 * p.rayon;
      const b = S * 0.62 * p.rayon * 0.42;
      const x = cx + Math.cos(ang) * a * Math.cos(p.inclinaison) - Math.sin(ang) * b * Math.sin(p.inclinaison);
      const y = cy + Math.cos(ang) * a * Math.sin(p.inclinaison) + Math.sin(ang) * b * Math.cos(p.inclinaison);

      // traînée lumineuse discrète
      const trail = c.createRadialGradient(x, y, 0, x, y, p.taille * 4);
      trail.addColorStop(0, p.teinte + 'aa');
      trail.addColorStop(1, p.teinte + '00');
      c.fillStyle = trail;
      c.beginPath();
      c.arc(x, y, p.taille * 4, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = p.teinte;
      c.beginPath();
      c.arc(x, y, p.taille, 0, Math.PI * 2);
      c.fill();

      // ombre portée : la planète est éclairée par l'étoile
      const ombre = c.createRadialGradient(x, y, p.taille * 0.2, x, y, p.taille * 1.6);
      ombre.addColorStop(0, 'rgba(18,6,31,0)');
      ombre.addColorStop(1, 'rgba(18,6,31,.85)');
      c.fillStyle = ombre;
      c.beginPath();
      c.arc(x, y, p.taille * 1.6, 0, Math.PI * 2);
      c.fill();
    });

    // 30 images par seconde : au-delà, l'œil ne voit pas la différence sur des
    // orbites aussi lentes, et le processeur graphique le paie.
    if (this.reduit) return;
    if (this.defile || !this.visible) {
      setTimeout(() => requestAnimationFrame(this.dessiner), 200);
      return;
    }
    // 8 i/s : une orbite aussi lente ne justifie pas plus, et un canvas
    // fixe qui se redessine 30 fois par seconde coûte cher au défilement.
    setTimeout(() => requestAnimationFrame(this.dessiner), 125);
  }
}

export function demarrerSystemes() {
  document.querySelectorAll('.systeme').forEach(h => new Systeme(h));
}

// Auto-démarrage : le module est importé par les pages, sans appel supplémentaire.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrerSystemes);
} else {
  demarrerSystemes();
}
