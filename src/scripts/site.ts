import './gallery';
import './experiments';
import { animate, onScroll, svg, stagger } from 'animejs';
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.querySelector<HTMLElement>('#navigation');
function closeMenu() {
  menu?.setAttribute('aria-expanded', 'false');
  nav?.classList.remove('open');
}
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('open', open);
});
nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener('click', (e) => {
  if (e.target instanceof Node && !nav?.contains(e.target) && !menu?.contains(e.target))
    closeMenu();
});
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const small = matchMedia('(max-width: 600px)');
let stopMotion = () => {};
function setupMotion() {
  stopMotion();
  document.documentElement.classList.toggle('motion-reduced', reduced.matches);
  document.dispatchEvent(new Event('waylan:motion-change'));
  if (reduced.matches) return;
  const running: { revert: () => unknown }[] = [];
  const keep = <T extends { revert: () => unknown }>(animation: T) => {
    running.push(animation);
    return animation;
  };
  // Every piece of text is visible before JavaScript loads and after animation cleanup.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          keep(
            animate(entry.target, {
              y: [small.matches ? 18 : 30, 0],
              duration: 700,
              ease: 'outCubic',
            }),
          );
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08 },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const scroll = keep(
      onScroll({ target: el.parentElement!, enter: 'bottom top', leave: 'top bottom', sync: 0.7 }),
    );
    keep(
      animate(el, {
        y: [small.matches ? -10 : -24, small.matches ? 10 : 24],
        scale: 1.14,
        ease: 'linear',
        autoplay: scroll,
      }),
    );
  });
  // Scroll observers follow the real document flow; no pinned scroll distance is added.
  document.querySelectorAll<HTMLElement>('main > .resume-section').forEach((section) => {
    keep(
      animate(section, {
        '--section-progress': [0, 1],
        ease: 'linear',
        autoplay: keep(
          onScroll({ target: section, enter: 'bottom top', leave: 'top bottom', sync: true }),
        ),
      }),
    );
  });
  document.querySelectorAll<HTMLElement>('.product-story .gallery-item').forEach((item, index) => {
    keep(
      animate(item, {
        y: small.matches ? [18, -10] : index % 2 ? [-30, 48] : [65, -40],
        ease: 'linear',
        autoplay: keep(
          onScroll({
            target: item.closest('.product-story')!,
            enter: 'bottom top',
            leave: 'top bottom',
            sync: 0.6,
          }),
        ),
      }),
    );
  });
  document.querySelectorAll<HTMLElement>('.intro-photo img').forEach((photo) => {
    keep(
      animate(photo, {
        y: small.matches ? [-6, 12] : [-15, 35],
        scale: 1.1,
        ease: 'linear',
        autoplay: keep(
          onScroll({
            target: photo.closest('.intro-photo')!,
            enter: 'bottom bottom',
            leave: 'top top',
            sync: 0.7,
          }),
        ),
      }),
    );
  });
  document.querySelectorAll<HTMLElement>('.research-viewer').forEach((viewer) => {
    keep(
      animate(viewer, {
        '--research-progress': [0, 1],
        ease: 'linear',
        autoplay: keep(
          onScroll({ target: viewer, enter: 'bottom top', leave: 'center center', sync: true }),
        ),
      }),
    );
  });
  document.querySelectorAll<HTMLElement>('.job-list').forEach((list) => {
    keep(
      animate(list, {
        '--timeline-progress': [0, 1],
        ease: 'linear',
        autoplay: keep(
          onScroll({ target: list, enter: 'bottom top', leave: 'top bottom', sync: true }),
        ),
      }),
    );
  });
  document.querySelectorAll<HTMLElement>('.architecture').forEach((diagram) => {
    const scroll = keep(
      onScroll({ target: diagram, enter: 'bottom top', leave: 'center center', sync: true }),
    );
    keep(
      animate(svg.createDrawable(diagram.querySelectorAll('.connection')), {
        draw: ['0 0', '0 1'],
        ease: 'linear',
        autoplay: scroll,
      }),
    );
    keep(
      animate(diagram.querySelectorAll('.architecture-clients span'), {
        y: [small.matches ? 6 : 12, 0],
        delay: stagger(60),
        ease: 'outCubic',
        autoplay: keep(
          onScroll({ target: diagram, enter: 'bottom top', leave: 'center center', sync: true }),
        ),
      }),
    );
    keep(
      animate(diagram.querySelector('.connection-dot')!, {
        cy: [0, 100],
        ease: 'linear',
        autoplay: keep(
          onScroll({ target: diagram, enter: 'bottom top', leave: 'top bottom', sync: true }),
        ),
      }),
    );
    keep(
      animate(diagram.querySelectorAll('.architecture-layer'), {
        y: [10, 0],
        ease: 'linear',
        autoplay: keep(
          onScroll({ target: diagram, enter: 'bottom top', leave: 'center center', sync: true }),
        ),
      }),
    );
  });
  stopMotion = () => {
    observer.disconnect();
    for (const animation of running.reverse()) animation.revert();
    stopMotion = () => {};
  };
}
setupMotion();
reduced.addEventListener('change', setupMotion);
small.addEventListener('change', () => {
  closeMenu();
  setupMotion();
});
const progressElement = document.querySelector<HTMLElement>('.reading-progress');
let frame = false;
function progress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progressElement)
    progressElement.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
}
addEventListener(
  'scroll',
  () => {
    if (!frame) {
      frame = true;
      requestAnimationFrame(() => {
        progress();
        if (sections.length) activeSection();
        frame = false;
      });
    }
  },
  { passive: true },
);
addEventListener('resize', progress, { passive: true });
progress();
const sections = [...document.querySelectorAll<HTMLElement>('main>section[id]')];
function activeSection() {
  let current = 'intro';
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 160) current = section.id;
  }
  document.querySelectorAll('.site-header nav a').forEach((a) => {
    if (a.getAttribute('href') === `/#${current}`) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}
if (sections.length) {
  const observer = new IntersectionObserver(activeSection, { rootMargin: '-80px 0px -65% 0px' });
  sections.forEach((s) => observer.observe(s));
  activeSection();
}
async function recordVisit() {
  if (
    document.body.dataset.private === 'true' ||
    location.pathname === '/privacy/' ||
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  )
    return;
  try {
    if (localStorage.getItem('waylan-analytics') === 'off') return;
  } catch {}
  if (document.visibilityState !== 'visible') return;
  try {
    await fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname, referrer: document.referrer }),
      keepalive: true,
      credentials: 'same-origin',
    });
  } catch {
    /* Analytics never interrupt the page. */
  }
}
if (document.visibilityState === 'visible') void recordVisit();
else {
  const visible = () => {
    if (document.visibilityState === 'visible') {
      document.removeEventListener('visibilitychange', visible);
      void recordVisit();
    }
  };
  document.addEventListener('visibilitychange', visible);
}
