/* ============================================================================
   MENU MOBILE + BOUTON WHATSAPP

   Le rail vertical ne sert que le desktop ; sous 1024 px, la navigation passe
   par un tiroir latéral à trois groupes. Le bouton est un vrai bouton (pas un
   lien déguisé) : aria-expanded, fermeture au clic extérieur, sur un lien et
   sur Échap, focus rendu au bouton. Le bouton WhatsApp n'apparaît que si un
   numéro est renseigné dans data/contact.json — jamais un numéro inventé.
   ========================================================================= */
(() => {
  'use strict';

  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu-mobile');
  const voile = document.getElementById('menu-voile');
  const SEUIL = 1024;

  if (burger && menu) {
    const ouvrir = () => {
      menu.hidden = false;
      voile.hidden = false;
      requestAnimationFrame(() => menu.classList.add('ouvert'));
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', document.documentElement.lang === 'fr'
        ? 'Fermer le menu' : 'Close menu');
      document.body.style.overflow = 'hidden';
      const premier = menu.querySelector('a, button');
      if (premier) premier.focus({ preventScroll: true });
    };

    const fermer = (rendreFocus = false) => {
      menu.classList.remove('ouvert');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', document.documentElement.lang === 'fr'
        ? 'Ouvrir le menu' : 'Open menu');
      document.body.style.overflow = '';
      setTimeout(() => { menu.hidden = true; voile.hidden = true; }, 250);
      if (rendreFocus) burger.focus({ preventScroll: true });
    };

    burger.addEventListener('click', () => {
      if (burger.getAttribute('aria-expanded') === 'true') fermer(true);
      else ouvrir();
    });
    if (voile) voile.addEventListener('click', () => fermer(true));
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) fermer(false);      // on navigue : pas besoin de focus
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') fermer(true);
    });
    addEventListener('resize', () => {
      if (innerWidth >= SEUIL && burger.getAttribute('aria-expanded') === 'true') fermer(false);
    });
  }

  /* ---- bouton WhatsApp flottant ---------------------------------------- */
  async function boutonWhatsApp() {
    let infos;
    try {
      const r = await fetch('data/contact.json', { cache: 'no-cache' });
      if (!r.ok) return;
      infos = await r.json();
    } catch (e) {
      return;                                        // pas de config : pas de bouton
    }
    const numero = String(infos.whatsapp || '').replace(/[^0-9]/g, '');
    if (numero.length < 8) return;                   // numéro absent : on n'affiche rien

    const a = document.createElement('a');
    a.className = 'contact-flottant';
    a.href = `https://wa.me/${numero}`;
    a.target = '_blank';
    a.rel = 'noopener';
    const libelle = infos.libelle || 'WhatsApp';
    a.setAttribute('aria-label', libelle);
    a.title = libelle;
    a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z"/>
      </svg>`;
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boutonWhatsApp);
  } else {
    boutonWhatsApp();
  }
})();
