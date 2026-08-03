/* Zahra Hasanaat — shared site behavior */
(function () {
  'use strict';

  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  var overlay = document.getElementById('navOverlay');

  function isMobile() { return window.innerWidth < 1024; }

  /* ---------- mobile drawer ---------- */
  function openNav() {
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    nav.classList.add('open');
    overlay.classList.add('visible');
    document.body.classList.add('nav-open');
  }

  function closeNav() {
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.classList.remove('nav-open');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      nav.classList.contains('open') ? closeNav() : openNav();
    });
  }
  if (overlay) overlay.addEventListener('click', closeNav);

  /* ---------- dropdowns ---------- */
  var submenus = Array.prototype.slice.call(document.querySelectorAll('.has-submenu'));
  var hoverTimers = new WeakMap();

  /* Keep dropdown panels / flyouts inside the viewport on desktop */
  function positionFlyout(li) {
    if (isMobile()) return;
    requestAnimationFrame(function () {
      var panel = li.querySelector(':scope > .submenu, :scope > .subsubmenu');
      if (!panel) return;
      var isFlyout = panel.classList.contains('subsubmenu');
      li.classList.remove(isFlyout ? 'flip-left' : 'align-right');
      var r = panel.getBoundingClientRect();
      if (r.right > window.innerWidth - 8) {
        li.classList.add(isFlyout ? 'flip-left' : 'align-right');
      }
    });
  }

  function closeAllDropdowns(except) {
    submenus.forEach(function (li) {
      if (!except) { li.classList.remove('expanded'); return; }
      if (li === except) return;
      if (li.contains(except)) return;   // ancestor of target — keep open
      if (except.contains(li)) return;   // descendant of target — leave as-is
      li.classList.remove('expanded');
    });
  }

  submenus.forEach(function (li) {
    var link = li.querySelector(':scope > a');
    var caret = link;

    /* Click on the parent label toggles the dropdown (both mobile + desktop).
       The parent link is treated as a toggle, not a navigation target. */
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var willOpen = !li.classList.contains('expanded');
      closeAllDropdowns(li);
      li.classList.toggle('expanded', willOpen);
      if (willOpen) positionFlyout(li);
    });

    /* Desktop hover-intent: open on hover, close after a short grace delay
       so the menu doesn't vanish before you can reach it. */
    li.addEventListener('mouseenter', function () {
      if (isMobile()) return;
      clearTimeout(hoverTimers.get(li));
      closeAllDropdowns(li);
      li.classList.add('expanded');
      positionFlyout(li);
    });
    li.addEventListener('mouseleave', function () {
      if (isMobile()) return;
      var t = setTimeout(function () { li.classList.remove('expanded'); }, 320);
      hoverTimers.set(li, t);
    });
  });

  /* Close dropdowns when clicking outside the nav */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-submenu')) closeAllDropdowns(null);
  });

  /* Escape closes everything */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllDropdowns(null);
      if (nav && nav.classList.contains('open')) closeNav();
    }
  });

  /* Submenu LEAF links close the mobile drawer; parent toggles do not */
  if (nav) {
    nav.querySelectorAll('.submenu a, .subsubmenu a').forEach(function (link) {
      link.addEventListener('click', function () {
        var li = link.parentElement;
        if (li && li.querySelector(':scope > ul')) return; // it's an expand toggle, not a destination
        if (isMobile()) closeNav();
      });
    });
  }

  /* Reset on resize to desktop */
  window.addEventListener('resize', function () {
    if (!isMobile()) { closeNav(); closeAllDropdowns(null); }
  });

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- impact counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var counted = false;
    var section = counters[0].closest('section') || document.body;
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !counted) {
          counted = true;
          counters.forEach(function (el) {
            var target = parseInt(el.getAttribute('data-count'), 10) || 0;
            var suffix = el.getAttribute('data-suffix') || '';
            var startTime = null;
            function step(ts) {
              if (!startTime) startTime = ts;
              var p = Math.min((ts - startTime) / 1800, 1);
              var eased = 1 - Math.pow(1 - p, 3);
              el.textContent = Math.floor(eased * target) + suffix;
              if (p < 1) requestAnimationFrame(step);
              else el.textContent = target + suffix;
            }
            requestAnimationFrame(step);
          });
          co.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    co.observe(section);
  }

  /* ---------- back to top ---------- */
  var backBtn = document.getElementById('backToTop');
  if (backBtn) {
    window.addEventListener('scroll', function () {
      backBtn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    backBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress bar ---------- */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  function updateBar() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (window.scrollY || h.scrollTop) / max : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  window.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);
  updateBar();

  /* ---------- story category filter ---------- */
  var filterWrap = document.getElementById('storyFilter');
  if (filterWrap) {
    var grid = document.getElementById('storyGrid');
    var emptyMsg = document.getElementById('storiesEmpty');
    var storyCards = [].slice.call(grid.querySelectorAll('.story-card'));
    filterWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-chip');
      if (!btn) return;
      filterWrap.querySelectorAll('.filter-chip').forEach(function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.getAttribute('data-filter');
      var shown = 0;
      storyCards.forEach(function (card) {
        var cats = (card.getAttribute('data-cats') || '').split('|');
        var match = (f === 'all') || cats.indexOf(f) > -1;
        card.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      if (emptyMsg) emptyMsg.hidden = shown > 0;
    });
  }

  /* ---------- image lightbox ---------- */
  var lbImgs = [].slice.call(document.querySelectorAll('.page-content img, .feature-media img'))
    .filter(function (img) { return !img.closest('a'); });
  if (lbImgs.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML = '<button class="lightbox-close" aria-label="Close image">&times;</button><figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('figcaption');
    function openLb(src, alt) {
      lbImg.src = src; lbImg.alt = alt || '';
      lbCap.textContent = alt || ''; lbCap.style.display = alt ? '' : 'none';
      lb.classList.add('open'); document.body.classList.add('nav-open');
    }
    function closeLb() { lb.classList.remove('open'); document.body.classList.remove('nav-open'); }
    lbImgs.forEach(function (img) {
      img.classList.add('zoomable');
      img.addEventListener('click', function () { openLb(img.currentSrc || img.src, img.alt); });
    });
    lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }

  /* ---------- subtle hero parallax ---------- */
  var heroBg = document.querySelector('.hero--photo .hero-bg');
  if (heroBg && !reduceMotion) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var y = Math.min(window.scrollY, 700) * 0.28;
          heroBg.style.transform = 'scale(1.06) translateY(' + y.toFixed(1) + 'px)';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
})();
