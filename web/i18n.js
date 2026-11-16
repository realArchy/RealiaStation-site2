/* ============================================================================
   i18n — quatre langues, sans dépendance ni build.

   Le français est écrit en dur dans le HTML : la page se lit, s'indexe et se
   partage même sans JavaScript. L'anglais, le portugais et le chinois vivent
   dans `traductions.js` et remplacent le texte au chargement.

   Choix tenu : on ne traduit QUE les nœuds marqués `data-t`. Le premier passage
   mémorise le français dans `data-fr`, ce qui permet d'y revenir exactement,
   sans recharger la page.
   ========================================================================== */

(function () {
  const CLE = 'langue';
  const LANGUES = ['fr', 'en', 'pt', 'zh'];
  let langue = localStorage.getItem(CLE) || 'fr';
  if (!LANGUES.includes(langue)) langue = 'fr';

  function t(cle) {
    if (langue === 'fr') return null;
    const table = window.TRADUCTIONS || {};
    const entree = table[cle];
    return entree ? entree[langue] || null : null;
  }

  function appliquer() {
    document.querySelectorAll('[data-t]').forEach(el => {
      const cle = el.getAttribute('data-t');
      if (!el.dataset.fr) el.dataset.fr = el.textContent;
      if (langue === 'fr') {
        el.textContent = el.dataset.fr;
        return;
      }
      const trad = window.TRADUCTIONS && window.TRADUCTIONS[cle];
      el.textContent = (trad && trad[langue]) || el.dataset.fr;
    });

    document.documentElement.lang = langue === 'zh' ? 'zh-Hans' : langue;
    document.querySelectorAll('[data-lang]').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.lang === langue ? 'true' : 'false');
    });
    document.dispatchEvent(new CustomEvent('langue-change', { detail: { langue } }));
  }

  function changer(nouvelle) {
    if (!LANGUES.includes(nouvelle)) return;
    langue = nouvelle;
    localStorage.setItem(CLE, nouvelle);
    appliquer();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-lang]').forEach(b => {
      b.addEventListener('click', () => changer(b.dataset.lang));
    });
    appliquer();
  });

  window.I18N = {
    t, changer, appliquer,
    get langue() { return langue; },
    get langues() { return LANGUES.slice(); }
  };
})();
