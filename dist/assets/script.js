(() => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Hamburger menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const siteMenu = document.getElementById('siteMenu');
  if (menuToggle && siteMenu) {
    if (!menuToggle.hasAttribute('aria-haspopup')) menuToggle.setAttribute('aria-haspopup', 'true');
    let previouslyFocused = null;
    let menuKeyHandler = null;

    function closeMenu() {
      menuToggle.setAttribute('aria-expanded', 'false');
      siteMenu.hidden = true;
      if (previouslyFocused) previouslyFocused.focus();
      if (menuKeyHandler) {
        siteMenu.removeEventListener('keydown', menuKeyHandler);
        menuKeyHandler = null;
      }
    }
    function openMenu() {
      previouslyFocused = document.activeElement;
      menuToggle.setAttribute('aria-expanded', 'true');
      siteMenu.hidden = false;
      const links = Array.from(siteMenu.querySelectorAll('a'));
      if (links.length) links[0].focus();

      menuKeyHandler = function (e) {
        const links = Array.from(siteMenu.querySelectorAll('a'));
        const currentIndex = links.indexOf(document.activeElement);
        if (e.key === 'Escape') {
          e.preventDefault();
          closeMenu();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = links[(currentIndex + 1) % links.length];
          next.focus();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = links[(currentIndex - 1 + links.length) % links.length];
          prev.focus();
          return;
        }
        if (e.key === 'Home') {
          e.preventDefault();
          links[0].focus();
          return;
        }
        if (e.key === 'End') {
          e.preventDefault();
          links[links.length - 1].focus();
          return;
        }
        if (e.key === 'Tab') {
          const first = links[0];
          const last = links[links.length - 1];
          if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        }
      };
      siteMenu.addEventListener('keydown', menuKeyHandler);
    }
    menuToggle.addEventListener('click', (e) => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu(); else openMenu();
    });
    document.addEventListener('click', (e) => {
      if (!siteMenu.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }


})();

// Map links: move page-specific map-link behavior here so it's available globally
(function () {
  function initMapLinks() {
    var links = document.querySelectorAll('.map-link');
    var iframe = document.getElementById('mapFrame');
    if (!links || links.length === 0 || !iframe) return;
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var q = this.getAttribute('data-q') || this.textContent;
        iframe.src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
        links.forEach(function (l) { l.style.fontWeight = ''; });
        this.style.fontWeight = '700';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapLinks);
  } else {
    initMapLinks();
  }
})();