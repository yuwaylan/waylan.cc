import './gallery';
import './experiments';

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
nav?.querySelectorAll('a').forEach((anchor) => anchor.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener('click', (event) => {
  if (event.target instanceof Node && !nav?.contains(event.target) && !menu?.contains(event.target))
    closeMenu();
});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver: IntersectionObserver | undefined;

function setupReveals() {
  revealObserver?.disconnect();
  document.documentElement.classList.remove('motion-enabled');
  document
    .querySelectorAll('[data-reveal]')
    .forEach((element) => element.classList.remove('is-revealed'));
  document.dispatchEvent(new Event('waylan:motion-change'));
  if (reducedMotion.matches) return;
  document.documentElement.classList.add('motion-enabled');
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        revealObserver?.unobserve(entry.target);
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
  );
  document
    .querySelectorAll<HTMLElement>('[data-reveal]')
    .forEach((element) => revealObserver?.observe(element));
}

setupReveals();
reducedMotion.addEventListener('change', setupReveals);

const progressElement = document.querySelector<HTMLElement>('.reading-progress');
const sections = [...document.querySelectorAll<HTMLElement>('main section[id]')];
let pendingFrame = false;

function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (!progressElement) return;
  const value = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  progressElement.style.transform = `scaleX(${value})`;
}

function updateActiveSection() {
  let current = 'intro';
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 160)
      current = section.dataset.navAnchor || section.id;
  }
  document.querySelectorAll('.site-header nav a').forEach((anchor) => {
    if (anchor.getAttribute('href') === `/#${current}`)
      anchor.setAttribute('aria-current', 'location');
    else anchor.removeAttribute('aria-current');
  });
}

function onScroll() {
  if (pendingFrame) return;
  pendingFrame = true;
  requestAnimationFrame(() => {
    updateProgress();
    if (sections.length) updateActiveSection();
    pendingFrame = false;
  });
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', updateProgress, { passive: true });
updateProgress();
if (sections.length) {
  const observer = new IntersectionObserver(updateActiveSection, {
    rootMargin: '-80px 0px -65% 0px',
  });
  sections.forEach((section) => observer.observe(section));
  updateActiveSection();
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
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', onVisible);
    void recordVisit();
  };
  document.addEventListener('visibilitychange', onVisible);
}
