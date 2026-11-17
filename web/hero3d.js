/* ============================================================================
   HERO 3D — la Terre vue satellite, la Lune, le Soleil lointain, et une
   impulsion qui court sur le titre.

   La scène :
     · Terre NASA Blue Marble (texture locale 4096×2048), nuages, halo
       atmosphérique, côté jour / côté nuit avec les villes allumées ;
     · inclinaison 23,5°, rotation ouest → est, un tour en 30 s ;
     · Lune texturée en haut à droite, Soleil en bas à gauche, très loin ;
     · cinq balises aux coordonnées des sites du projet.

   L'impulsion du titre est indépendante des pays : une tête lumineuse avance
   de lettre en lettre, la lettre survolée grossit et passe en or métallique.

   Fluidité : 30 i/s, pause au défilement, hors écran et onglet caché, rien du
   tout si `prefers-reduced-motion`.
   ========================================================================== */

import * as THREE from './vendor/three.module.js';

const TOUR_SECONDES = 30;
const INCLINAISON = 23.5;
const RAYON = 2;
const LETTRES_PAR_SECONDE = 7.5;

const SOLEIL = new THREE.Vector3(-9, 5.5, 9).normalize();

/* lat/lon → point sur la sphère, repère Three.js (Y vers le haut) */
function surLaSphere(lat, lon, rayon) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -rayon * Math.sin(phi) * Math.cos(theta),
    rayon * Math.cos(phi),
    rayon * Math.sin(phi) * Math.sin(theta),
  );
}

const BALISES = [
  { nom: 'Natal', lat: -5.85, lon: -35.35, couleur: 0xff007f },
  { nom: 'Mahajanga', lat: -15.71, lon: 46.31, couleur: 0xd6a92a },
  { nom: 'Shanghai', lat: 31.23, lon: 121.47, couleur: 0x00f5ff },
  { nom: 'Paris', lat: 48.85, lon: 2.35, couleur: 0xfcf6ba },
  { nom: 'Cayenne', lat: 4.92, lon: -52.31, couleur: 0x20c997 },
];

/* halo dessiné une fois dans un canvas : aucune texture à télécharger */
function textureHalo() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  d.addColorStop(0.00, 'rgba(255,255,245,1)');
  d.addColorStop(0.12, 'rgba(255,226,150,0.92)');
  d.addColorStop(0.32, 'rgba(255,170,60,0.38)');
  d.addColorStop(0.62, 'rgba(255,120,20,0.10)');
  d.addColorStop(1.00, 'rgba(255,90,0,0)');
  g.fillStyle = d;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function demarrerHero(canvas) {
  if (!canvas) return null;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rendu;
  try {
    rendu = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return null; // pas de WebGL : le décor CSS reste, rien ne casse
  }
  rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  rendu.setClearColor(0x000000, 0);
  rendu.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  camera.position.set(0, 0.25, 10.2);

  /* ---------------------------------------------------------- lumières */
  scene.add(new THREE.AmbientLight(0x1b2536, 0.42));
  // lumière chaude venue du bas-gauche, décalée d'un peu devant : sinon la Lune
  // nous montre sa face nuit et l'on ne voit aucun cratère
  const lumiereSoleil = new THREE.DirectionalLight(0xffe2b8, 3.4);
  lumiereSoleil.position.set(-20, -12, -6);
  scene.add(lumiereSoleil);

  /* ------------------------------------------------------------ Soleil */
  const soleil = new THREE.Sprite(new THREE.SpriteMaterial({
    map: textureHalo(), blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true,
  }));
  // bas à gauche, très loin : il paraît plus petit que la Lune
  soleil.position.set(-10.5, -6.8, -38);
  soleil.scale.setScalar(4.2);
  scene.add(soleil);

  /* ----------------------------------------------------- groupes Terre */
  const inclinaison = new THREE.Group();
  inclinaison.rotation.z = THREE.MathUtils.degToRad(INCLINAISON);
  scene.add(inclinaison);

  const terre = new THREE.Group();
  inclinaison.add(terre);

  const materiauTerre = new THREE.ShaderMaterial({
    uniforms: {
      jour: { value: null },
      nuit: { value: null },
      soleil: { value: SOLEIL.clone() },
      phare: { value: 0 },
      pasUv: { value: new THREE.Vector2(1 / 4096, 1 / 2048) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 monde = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - monde.xyz);
        gl_Position = projectionMatrix * viewMatrix * monde;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D jour;
      uniform sampler2D nuit;
      uniform vec3 soleil;
      uniform float phare;
      uniform vec2 pasUv;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        vec3 n = normalize(vNormalW);

        // relief léger : le gradient de luminance de la texture sert de bosse
        float hC = texture2D(jour, vUv).r;
        float hX = texture2D(jour, vUv + vec2(pasUv.x, 0.0)).r;
        float hY = texture2D(jour, vUv + vec2(0.0, pasUv.y)).r;
        vec3 tangente = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5));
        vec3 bitangente = normalize(cross(n, tangente));
        n = normalize(n + tangente * (hC - hX) * 9.0 + bitangente * (hC - hY) * 9.0);

        float d = dot(n, normalize(soleil));
        float lumiere = smoothstep(-0.28, 0.32, d);

        vec3 cJour = texture2D(jour, vUv).rgb;
        vec3 cNuit = texture2D(nuit, vUv).rgb;

        vec3 nuitCol = cNuit * 1.9 + vec3(0.010, 0.016, 0.038);
        // les océans d'une vraie texture satellite sont très sombres
        vec3 jourCol = cJour * (0.85 + 2.6 * max(d, 0.0));
        vec3 col = mix(nuitCol, jourCol, lumiere);

        float limbe = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 3.0);
        col += vec3(0.16, 0.48, 1.0) * limbe * (0.45 + 0.55 * lumiere);
        col += vec3(1.0, 0.88, 0.55) * phare * limbe * 0.22;

        gl_FragColor = vec4(col, 1.0);
      }`,
  });

  const globe = new THREE.Mesh(new THREE.SphereGeometry(RAYON, 96, 96), materiauTerre);
  terre.add(globe);

  const materiauNuages = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const nuages = new THREE.Mesh(new THREE.SphereGeometry(RAYON * 1.012, 72, 72), materiauNuages);
  terre.add(nuages);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(RAYON * 1.045, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`
        varying vec3 vN; varying vec3 vV;
        void main() {
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vN; varying vec3 vV;
        void main() {
          float i = pow(0.68 - dot(vN, vV), 3.2);
          gl_FragColor = vec4(0.24, 0.58, 1.0, 1.0) * clamp(i, 0.0, 1.0) * 0.75;
        }`,
    }),
  );
  inclinaison.add(atmosphere);

  /* ------------------------------------------------------------------ Lune
     Plan intermédiaire, en haut à droite : plus grosse que le Soleil lointain,
     éclairée sur son flanc gauche par la même lumière que la Terre. */
  const lune = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0xf2ece0, roughness: .95, metalness: 0,
      emissive: 0x0a0a12, emissiveIntensity: 1,
    }),
  );
  lune.position.set(4.9, 2.55, -2.2);
  lune.rotation.z = THREE.MathUtils.degToRad(-11);
  scene.add(lune);

  /* ----------------------------------------------------------- balises */
  const groupeBalises = new THREE.Group();
  terre.add(groupeBalises);

  const balises = BALISES.map((b) => {
    const pos = surLaSphere(b.lat, b.lon, RAYON);
    const normale = pos.clone().normalize();

    const point = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 12),
      new THREE.MeshBasicMaterial({ color: b.couleur }),
    );
    point.position.copy(normale.clone().multiplyScalar(RAYON * 1.005));
    groupeBalises.add(point);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: textureHalo(), color: b.couleur, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.2,
    }));
    halo.position.copy(normale.clone().multiplyScalar(RAYON * 1.01));
    halo.scale.setScalar(0.34);
    groupeBalises.add(halo);

    return { ...b, point, halo, phase: Math.random() * Math.PI * 2 };
  });

  /* ------------------------------------------------------------ cadrage */
  function dimensionner() {
    const l = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
  }
  dimensionner();
  if ('ResizeObserver' in window) new ResizeObserver(dimensionner).observe(canvas);
  else window.addEventListener('resize', dimensionner);

  /* ---------------------------------------------------------- textures */
  const chargeur = new THREE.TextureLoader();
  const charger = (url) => new Promise((ok) => chargeur.load(url, ok, undefined, () => ok(null)));

  Promise.all([
    charger('assets/img/earth-satellite.jpg'),      // NASA Blue Marble, 4096×2048
    charger('vendor/earth/earth_lights_2048.png'),
    charger('vendor/earth/earth_clouds_1024.png'),
    charger('assets/img/moon.jpg'),
  ]).then(([atmos, lumieres, nuageMap, luneMap]) => {
    if (atmos) {
      atmos.colorSpace = THREE.SRGBColorSpace;
      materiauTerre.uniforms.jour.value = atmos;
    }
    if (lumieres) {
      lumieres.colorSpace = THREE.SRGBColorSpace;
      materiauTerre.uniforms.nuit.value = lumieres;
    }
    if (!atmos || !lumieres) {
      const bleu = new THREE.DataTexture(new Uint8Array([18, 40, 78]), 1, 1);
      bleu.needsUpdate = true;
      if (!atmos) materiauTerre.uniforms.jour.value = bleu;
      if (!lumieres) materiauTerre.uniforms.nuit.value = bleu;
    }
    materiauTerre.needsUpdate = true;

    if (luneMap && lune) {
      luneMap.colorSpace = THREE.SRGBColorSpace;
      lune.material.map = luneMap;
      lune.material.needsUpdate = true;
    }

    if (nuageMap) {
      nuageMap.colorSpace = THREE.SRGBColorSpace;
      materiauNuages.map = nuageMap;
      materiauNuages.opacity = 0.42;
      materiauNuages.needsUpdate = true;
    }
  });

  /* ------------------------------------------------------------------------
     L'impulsion, lettre par lettre.
     Chaque lettre du titre devient un <span>. Une tête lumineuse avance de
     gauche à droite ; la lettre qu'elle survole grossit et passe en or
     métallique, puis elle rend sa place à la voisine. Aucun lien avec les
     pays : c'est un influx qui court sur la phrase, en boucle.
     ---------------------------------------------------------------------- */
  /* ------------------------------------------------------------------------
     L'impulsion, en un seul parcours : elle démarre sur le message de
     bienvenue, descend sur le titre, puis sur le sous-titre, et recommence.
     Aucun lien avec la rotation de la Terre : c'est une course à son propre
     rythme, qui relie les trois blocs comme un influx.
     ---------------------------------------------------------------------- */
  const VITESSE_LETTRES = 9;        // lettres par seconde
  const CIBLES = [
    { sel: '.hero .bienvenue', clair: true },
    { sel: '.hero-titre h1', clair: false },
    { sel: '.hero-soustitre', clair: true },
  ];

  let parcours = [];                // { boite, ou }

  function decouper(el, clair) {
    const texte = el.textContent;
    // on mémorise le texte d'origine : avec les espaces laissés en nœuds de
    // texte, comparer aux seules lettres provoquerait une reconstruction
    // infinie par l'observateur.
    el.dataset.texteSource = texte;
    el.textContent = '';
    const paquets = [];
    for (const ch of texte) {
      if (ch === ' ' || ch === '\u00a0') {   // le HTML écrit des espaces insécables
        // les espaces ne sont pas des étapes : sinon l'impulsion passe un
        // cinquième de son temps sur des lettres invisibles
        el.appendChild(document.createTextNode('\u00a0'));
        continue;
      }
      const c = ch;
      const boite = document.createElement('span');
      boite.className = 'lettre' + (clair ? ' lettre-clair' : '');
      // la version lumineuse est un pseudo-élément (content: attr(data-c)) :
      // elle n'entre pas dans textContent, sinon un second découpage relirait
      // un texte doublé.
      boite.dataset.c = c;
      boite.textContent = c;
      el.appendChild(boite);
      paquets.push(boite);
    }
    return paquets;
  }

  CIBLES.forEach((cible) => {
    const el = document.querySelector(cible.sel);
    if (!el) return;
    cible.el = el;
    cible.lettres = decouper(el, cible.clair);

    // i18n réécrit le textContent : on redécoupe. MutationObserver étant
    // asynchrone, on compare le texte et l'on vérifie que les spans sont là.
    new MutationObserver(() => {
      const intact = el.textContent === el.dataset.texteSource;
      if (intact || !el.textContent.trim()) return;
      cible.lettres = decouper(el, cible.clair);
      reconstruire();
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  function reconstruire() {
    parcours = [];
    CIBLES.forEach((c) => { if (c.lettres) parcours.push(...c.lettres); });
  }
  reconstruire();

  /* --------------------------------------------------------- animation */
  const horloge = new THREE.Clock();
  const racine = document.documentElement;
  const positionMonde = new THREE.Vector3();
  const avant = new THREE.Vector3(0, 0, 1);
  const vec = new THREE.Vector3();

  let phareLisse = 0;
  let derniere = 0;
  let enPause = false;
  let defile = false;
  let minuteur = null;
  let visible = true;

  window.addEventListener('scroll', () => {
    defile = true;
    clearTimeout(minuteur);
    minuteur = setTimeout(() => { defile = false; derniere = 0; }, 180);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => { enPause = document.hidden; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      es.forEach((e) => { visible = e.isIntersecting; });
    }, { threshold: 0.01 }).observe(canvas);
  }

  function boucle(t) {
    requestAnimationFrame(boucle);
    if (enPause || defile || !visible) return;
    if (t - derniere < 33) return;      // 30 i/s
    derniere = t;

    const temps = horloge.getElapsedTime();
    if (!reduit) {
      terre.rotation.y = temps * (Math.PI * 2 / TOUR_SECONDES);
      nuages.rotation.y = temps * (Math.PI * 2 / (TOUR_SECONDES * 1.28));
    }

    // halo des balises : il ne s'allume que côté face
    let max = 0;
    for (const b of balises) {
      b.point.getWorldPosition(positionMonde);
      vec.copy(positionMonde).normalize();
      const face = vec.dot(avant);
      const puissance = THREE.MathUtils.smoothstep(face, 0.02, 0.72);
      const pulsation = 0.72 + 0.28 * Math.sin(temps * 2.2 + b.phase);

      b.halo.material.opacity = 0.05 + puissance * 0.42 * pulsation;
      b.halo.scale.setScalar(0.14 + puissance * 0.28 * pulsation);
      b.point.scale.setScalar(0.75 + puissance * 0.55 * pulsation);
      if (puissance > max) max = puissance;
    }

    phareLisse += (max - phareLisse) * 0.035;
    racine.style.setProperty('--phare', phareLisse.toFixed(3));
    materiauTerre.uniforms.phare.value = phareLisse;

    // ---- la tête lumineuse parcourt bienvenue → titre → sous-titre
    const n = parcours.length;
    if (n) {
      const periode = n / VITESSE_LETTRES;
      const tete = (temps % periode) * VITESSE_LETTRES;
      for (let i = 0; i < n; i++) {
        const dist = Math.abs(i - tete);
        const f = Math.max(0, 1 - dist / 1.7);
        const douce = f * f * (3 - 2 * f);            // lissage
        const b = parcours[i];
        b.style.transform = `scale(${(1 + 0.28 * douce).toFixed(3)})`;
        b.style.setProperty('--or', douce.toFixed(3));
      }
    }

    rendu.render(scene, camera);
  }

  if (reduit) rendu.render(scene, camera);
  else requestAnimationFrame(boucle);

  window.__hero3d = {
    scene, camera, rendu,
    balises: balises.length,
    lettres: () => parcours.length,
    textures: () => ({
      jour: !!materiauTerre.uniforms.jour.value,
      nuit: !!materiauTerre.uniforms.nuit.value,
      nuages: !!materiauNuages.map,
    }),
  };
  return window.__hero3d;
}
