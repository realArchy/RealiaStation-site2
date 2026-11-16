/* ============================================================================
   Luna — lecteur audio flottant, un morceau de 30 s par page.

   Règles respectées :
   - aucun autoplay : Chrome et Safari bloquent la lecture sans geste, et forcer
     un contournement est à la fois fragile et irrespectueux ;
   - la préférence sonore est mémorisée (localStorage) et se transmet d'une page
     à l'autre : on ne redemande pas à chaque tiroir ;
   - si le fichier n'existe pas encore (dossier en préparation), le lecteur
     l'affiche franchement au lieu de faire semblant.

   Bannière d'accueil : le bouton « Activer l'expérience & écouter Luna » appelle
   window.LUNA.jouer() puis fait défiler vers le manifeste.
   ========================================================================== */

(function () {
  const CLE = 'luna-son';
  const source = document.body.dataset.audio;
  if (!source) return;

  const morceau = source.split('/').pop().replace('.mp3', '');
  const titres = {
    'luna-01-aventure': "L'Étincelle & Le Départ",
    'luna-02-virtuel': 'Le Corps avant le Métal',
    'luna-03-neuroexo': 'Synapses & Temps Réel',
    'luna-04-devkit': "L'Usine du Code",
    'luna-05-realiastation': "Le Cabinet de l'Architecte",
    'luna-06-ghostsheller': 'En Orbite sur le GhostSheller',
    'luna-07-ilot-ong': "L'Îlot de l'Espoir",
    'luna-08-architecte': 'Renaissance',
    'luna-09-wishlist': 'Les Capteurs du Futur',
    'luna-10-noel': 'Féerie Cyberpunk de Noël'
  };

  const audio = document.createElement('audio');
  audio.src = source;
  audio.loop = true;
  audio.preload = 'none';

  const boite = document.createElement('div');
  boite.className = 'lecteur';
  boite.innerHTML = `
    <button type="button" aria-label="Lecture / pause">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
    </button>
    <span class="titre-morceau"></span>
    <span class="egaliseur" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;

  const bouton = boite.querySelector('button');
  const titre = boite.querySelector('.titre-morceau');
  const egaliseur = boite.querySelector('.egaliseur');

  titre.textContent = titres[morceau] || morceau;

  function etat(lecture) {
    egaliseur.classList.toggle('joue', lecture);
    bouton.innerHTML = lecture
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    bouton.setAttribute('aria-label', lecture ? 'Mettre en pause' : 'Écouter Luna');
  }

  audio.addEventListener('play', () => { etat(true); localStorage.setItem(CLE, '1'); });
  audio.addEventListener('pause', () => { etat(false); localStorage.setItem(CLE, '0'); });
  audio.addEventListener('error', () => {
    etat(false);
    titre.textContent = (window.I18N && window.I18N.t('commun.bientot')) || 'Bientôt';
    boite.style.opacity = '.6';
    boite.title = 'Morceau pas encore déposé : ' + source;
  });

  bouton.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {
        titre.textContent = (window.I18N && window.I18N.t('commun.bientot')) || 'Bientôt';
      });
    } else {
      audio.pause();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(audio);
    document.body.appendChild(boite);
    etat(false);
  });

  window.LUNA = {
    jouer: () => audio.play().catch(() => {}),
    pause: () => audio.pause(),
    get actif() { return !audio.paused; }
  };
})();
