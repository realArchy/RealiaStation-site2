/* ============================================================================
   LUNAGALAXIE — galaxie procédurale en GLSL, avec un trou noir supermassif
   ----------------------------------------------------------------------------
   Même approche que la Terre de l'accueil : une géométrie simple, et c'est le
   fragment shader qui fait tout le travail.

     · disque galactique  : un plan, un shader FBM (bruit fractal) qui dessine
       des volutes en spirale logarithmique, du bleu profond au violet, avec
       des filaments de poussière sombre ;
     · trou noir          : sphère noire absolue au centre ;
     · anneau de photons  : tore fin, or brûlant, juste au bord du trou noir ;
     · disque d'accrétion : anneau chaud en contreplaqué, qui tourne plus vite
       près du centre ;
     · micro-étoiles      : 12 000 points de 1 à 2 px, dispersés au hasard,
       jamais alignés.

   Aucune interaction à la souris. Rotation propre, lente et régulière.
   ========================================================================== */

import * as THREE from './vendor/three.module.js';

const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Additif sans toucher à l'alpha : le canal alpha du canvas reste à 0, donc
   la page (étoiles CSS, dégradé) continue de se voir derrière. Sans ça, les
   zones sombres du disque rendaient le canvas opaque et masquaient le fond. */
function additifPropre() {
  return { blending: THREE.AdditiveBlending };
}

/* --------------------------------------------------------------- bruit FBM */
const BRUIT = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float bruit(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * bruit(p);
      p = p * 2.03 + 11.7;
      a *= 0.5;
    }
    return v;
  }
`;

/* ------------------------------------------------------- shader du disque */
const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_DISQUE = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTemps;
  uniform float uRayon;
  ${BRUIT}

  void main() {
    vec2 p = (vUv - 0.5) * 2.0 * uRayon;
    float r = length(p);
    if (r > uRayon) { discard; }

    float angle = atan(p.y, p.x);
    // spirale logarithmique : l'angle avance avec le log du rayon
    float spirale = angle * 2.0 + log(max(r, 0.04)) * 5.6 - uTemps * 0.16;

    float n1 = fbm(vec2(spirale * 1.35, r * 2.6));
    float n2 = fbm(vec2(spirale * 3.30 + 7.0, r * 7.5));
    float n3 = fbm(vec2(spirale * 6.10 + 19.0, r * 15.0));

    // voile de gaz : les grosses volutes, adoucies par le détail
    float voile = smoothstep(0.28, 0.86, n1 * 0.72 + n2 * 0.34);
    // veines de poussière : deux échelles de bruit soustraites, comme sur les
    // photos de Hubble — c'est ce qui découpe les bras lumineux
    float veine = smoothstep(0.35, 0.80, n3 * 0.65 + n2 * 0.45);
    voile *= 1.0 - veine * 0.86;
    voile *= 1.0 - smoothstep(0.55, 0.95, fbm(vec2(spirale * 8.5, r * 21.0))) * 0.45;

    // le disque s'éteint près du trou noir et s'effiloche vers les bords
    float anneau = smoothstep(0.08, 0.55, r) * (1.0 - smoothstep(0.45 * uRayon, uRayon, r));

    vec3 chaud = vec3(1.00, 0.80, 0.46);
    vec3 bleu  = vec3(0.26, 0.44, 1.00);
    vec3 violet = vec3(0.52, 0.15, 0.88);

    vec3 teinte = mix(chaud, bleu, smoothstep(0.12, 0.85, r));
    teinte = mix(teinte, violet, smoothstep(1.0, 2.8, r));
    // on approfondit la teinte : en additif, les couches claires virent au gris
    teinte = pow(teinte, vec3(1.35));

    float densite = voile * anneau;
    // un peu d'éclat doré tout près du trou noir
    densite += smoothstep(0.45, 0.10, r) * 0.45 * voile;

    vec3 couleur = teinte * densite * 0.42;
    // l'alpha porte la densité : sans gaz, le pixel reste transparent
    gl_FragColor = vec4(couleur, clamp(densite * 0.85, 0.0, 1.0));
  }
`;

/* --------------------------------------------- shader du disque d'accrétion */
const FRAG_ACCRETION = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTemps;
  uniform float uInterne;
  uniform float uExterne;
  ${BRUIT}

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p) * uExterne;
    if (r < uInterne || r > uExterne) { discard; }

    float angle = atan(p.y, p.x);
    // la matière tourne d'autant plus vite qu'elle est proche du centre
    float vitesse = 1.6 / pow(max(r, 0.2), 0.85);
    float filament = fbm(vec2(angle * 3.4 + uTemps * vitesse, r * 9.0));
    float chaleur = 1.0 - smoothstep(uInterne, uExterne, r);

    vec3 blanc = vec3(1.0, 0.98, 0.92);
    vec3 or    = vec3(1.0, 0.72, 0.30);
    vec3 teinte = mix(or * 1.2, blanc, chaleur * chaleur * 0.45);

    float densite = chaleur * (0.55 + filament * 0.75);
    gl_FragColor = vec4(teinte * densite * 0.95, clamp(densite * 0.8, 0.0, 1.0));
  }
`;

/* -------------------------------------------------------------- micro-étoiles */
function etoiles() {
  const N = 12000;
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const c = new THREE.Color();

  for (let i = 0; i < N; i++) {
    // dispersion aléatoire, sans aucun alignement sur les bras
    const r = Math.pow(Math.random(), 0.55) * 6.2;
    const a = Math.random() * Math.PI * 2;
    const epaisseur = 0.06 + 0.55 * Math.exp(-r * 0.8);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * epaisseur;
    pos[i * 3 + 2] = Math.sin(a) * r;

    const teinte = Math.random();
    if (teinte < 0.55) c.setRGB(1, 0.95, 0.85);
    else if (teinte < 0.85) c.setRGB(0.72, 0.82, 1);
    else c.setRGB(0.85, 0.72, 1);
    const v = 0.45 + Math.random() * 0.55;
    col[i * 3] = c.r * v;
    col[i * 3 + 1] = c.g * v;
    col[i * 3 + 2] = c.b * v;
  }

  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function textureDouce() {
  const t = 64;
  const c = document.createElement('canvas');
  c.width = c.height = t;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
  d.addColorStop(0, 'rgba(255,255,255,1)');
  d.addColorStop(0.4, 'rgba(255,255,255,.35)');
  d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d;
  g.fillRect(0, 0, t, t);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* -------------------------------------------------------------------- scène */
function demarrer() {
  const hote = document.querySelector('.ciel');
  if (!hote) return null;

  const canvas = document.createElement('canvas');
  canvas.className = 'galaxie-fond';
  canvas.setAttribute('aria-hidden', 'true');
  hote.appendChild(canvas);

  const rendu = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: true, powerPreference: 'high-performance',
    // sans ça, le disque additif assombrit le fond au lieu de l'éclairer
    premultipliedAlpha: false,
  });
  rendu.setClearColor(0x000000, 0);
  rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  camera.position.set(0, 2.6, 13.0);
  camera.lookAt(0, 0, 0);

  const galaxie = new THREE.Group();
  galaxie.rotation.x = -0.78;      // vue de trois quarts, ~45°
  galaxie.rotation.z = -0.62;      // diagonale haut-gauche → bas-droite
  galaxie.scale.setScalar(2.5);    // ×3 : elle traverse l'écran
  galaxie.position.set(0.5, -0.7, 0);
  scene.add(galaxie);

  /* ---- disque de gaz, un seul plan, tout en shader */
  const RAYON = 4.6;
  const disque = new THREE.Mesh(
    new THREE.PlaneGeometry(RAYON * 2, RAYON * 2, 1, 1),
    new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_DISQUE,
      uniforms: { uTemps: { value: 0 }, uRayon: { value: RAYON } },
      transparent: true,
      ...additifPropre(),
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    }),
  );
  disque.rotation.x = -Math.PI / 2;   // le plan devient un disque horizontal
  disque.renderOrder = 2;
  galaxie.add(disque);

  /* ---- micro-étoiles */
  const nuage = new THREE.Points(etoiles(), new THREE.PointsMaterial({
    size: 0.022,
    map: textureDouce(),
    vertexColors: true,
    transparent: true,
    ...additifPropre(),
    depthWrite: false,
    sizeAttenuation: true,
    opacity: 0.9,
  }));
  nuage.renderOrder = 3;
  galaxie.add(nuage);

  /* ---- trou noir : sphère noire absolue */
  const RB = 0.3;
  const trou = new THREE.Mesh(
    new THREE.SphereGeometry(RB, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  trou.renderOrder = 4;
  galaxie.add(trou);

  /* ---- anneau de photons : le liseré de lumière au bord du trou noir */
  const anneau = new THREE.Mesh(
    new THREE.RingGeometry(RB * 1.03, RB * 1.3, 128),
    new THREE.MeshBasicMaterial({
      color: 0xfffbf0, transparent: true, opacity: 1,
      ...additifPropre(), depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  anneau.rotation.x = -Math.PI / 2;
  anneau.renderOrder = 5;
  galaxie.add(anneau);

  /* ---- disque d'accrétion chaud, autour du trou noir */
  const acc = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 6.4, 1, 1),
    new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_ACCRETION,
      uniforms: {
        uTemps: { value: 0 },
        uInterne: { value: RB * 1.06 },
        uExterne: { value: 1.5 },
      },
      transparent: true,
      ...additifPropre(),
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  acc.rotation.x = -Math.PI / 2;
  acc.scale.setScalar(0.55);
  acc.renderOrder = 6;
  galaxie.add(acc);

  /* ---- halo chaud autour du trou noir : il adoucit le bord de la sphère */
  const lueur = new THREE.Sprite(new THREE.SpriteMaterial({
    map: textureDouce(), color: 0xff9a3c, transparent: true,
    ...additifPropre(), depthWrite: false, opacity: 0.34,
  }));
  lueur.scale.setScalar(2.2);
  lueur.renderOrder = 4;
  galaxie.add(lueur);

  const lueur2 = new THREE.Sprite(new THREE.SpriteMaterial({
    map: textureDouce(), color: 0xffd9a0, transparent: true,
    ...additifPropre(), depthWrite: false, opacity: 0.22,
  }));
  lueur2.scale.setScalar(4.2);
  lueur2.renderOrder = 3;
  galaxie.add(lueur2);

  /* ---- halo diffus du bulbe */
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: textureDouce(), color: 0xffd9a0, transparent: true,
    ...additifPropre(), depthWrite: false, opacity: 0.18,
  }));
  halo.scale.setScalar(2.2);
  halo.renderOrder = 1;
  galaxie.add(halo);

  /* ------------------------------------------------------------ dimension */
  function dimensionner() {
    const l = window.innerWidth;
    const h = window.innerHeight;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
  }
  dimensionner();
  window.addEventListener('resize', dimensionner, { passive: true });

  /* ---------------------------------------------------------------- boucle */
  let enPause = false;
  document.addEventListener('visibilitychange', () => { enPause = document.hidden; });

  let derniere = 0;
  const horloge = new THREE.Clock();

  function boucle(t) {
    requestAnimationFrame(boucle);
    if (enPause) return;
    const dt = derniere ? Math.min((t - derniere) / 1000, 0.05) : 0.016;
    derniere = t;

    // rotation propre, sans aucune interaction : un tour en ~100 s
    galaxie.rotation.y += dt * 0.063;

    const temps = horloge.getElapsedTime();
    disque.material.uniforms.uTemps.value = temps;
    acc.material.uniforms.uTemps.value = temps;

    rendu.render(scene, camera);
  }

  if (reduit) rendu.render(scene, camera);
  else requestAnimationFrame(boucle);

  window.__galaxie = {
    mode: 'shader-fbm',
    trouNoir: RB,
    etoiles: 12000,
    scene, camera, rendu,
  };
  return window.__galaxie;
}

demarrer();
