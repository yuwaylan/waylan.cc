import { getCountdown } from '../lib/countdown';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const motionButton = document.querySelector<HTMLButtonElement>('[data-story-motion]');
let paused = false;
function syncMotion() {
  const previous = root.dataset.storyMotion;
  root.dataset.storyMotion =
    paused || reducedMotion.matches
      ? 'paused'
      : document.visibilityState === 'hidden'
        ? 'hidden'
        : 'running';
  if (!motionButton) return;
  motionButton.hidden = false;
  motionButton.disabled = reducedMotion.matches;
  motionButton.textContent = reducedMotion.matches
    ? '已減少動畫'
    : paused
      ? '播放動畫'
      : '暫停動畫';
  motionButton.setAttribute('aria-pressed', String(paused || reducedMotion.matches));
  if (root.dataset.storyMotion !== previous)
    document.dispatchEvent(new Event('waylan:motion-change'));
}
motionButton?.addEventListener('click', () => {
  paused = !paused;
  syncMotion();
});
reducedMotion.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
syncMotion();

for (const notebook of document.querySelectorAll<HTMLElement>('[data-project-tabs]')) {
  const controls = notebook.querySelector<HTMLElement>('[data-project-controls]')!;
  const tabs = [...controls.querySelectorAll<HTMLButtonElement>('button')];
  const panels = [...notebook.querySelectorAll<HTMLElement>('[data-project-panel]')];
  const reel = notebook.querySelector<HTMLElement>('.project-pages')!;
  const reelControls = notebook.querySelector<HTMLElement>('[data-reel-controls]')!;
  const previous = notebook.querySelector<HTMLButtonElement>('[data-reel-prev]')!;
  const next = notebook.querySelector<HTMLButtonElement>('[data-reel-next]')!;
  const count = notebook.querySelector<HTMLElement>('[data-reel-count]')!;
  let selected = 0;
  let snap = false;
  let scrollFrame = 0;
  controls.hidden = false;
  controls.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    panels[i].tabIndex = 0;
  });
  function mark(index: number, motion = true) {
    const changed = selected !== index;
    selected = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(index === i));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = !snap && index !== i;
      panels[i].inert = snap && index !== i;
      if (snap) panels[i].setAttribute('aria-hidden', String(index !== i));
      else panels[i].removeAttribute('aria-hidden');
      panels[i].classList.remove('story-bounce');
      panels[i].querySelector('.project-page-copy')?.classList.remove('story-bounce');
    });
    previous.disabled = index === 0;
    next.disabled = index === panels.length - 1;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
    if (changed && motion && !reducedMotion.matches && !paused) {
      const target = snap ? panels[index].querySelector('.project-page-copy')! : panels[index];
      void (target as HTMLElement).offsetWidth;
      target.classList.add('story-bounce');
    }
  }
  function select(index: number, motion = true) {
    index = Math.max(0, Math.min(panels.length - 1, index));
    mark(index, motion);
    if (snap)
      reel.scrollTo({
        top: panels[index].offsetTop - panels[0].offsetTop,
        behavior: motion && !reducedMotion.matches && !paused ? 'smooth' : 'instant',
      });
    if (snap && motion) {
      const headerHeight = document.querySelector<HTMLElement>('.site-header')?.offsetHeight || 80;
      window.scrollTo({
        top: scrollY + notebook.getBoundingClientRect().top - headerHeight - 8,
        behavior: !reducedMotion.matches && !paused ? 'smooth' : 'instant',
      });
    }
  }
  function configureReel() {
    // Short viewports retain the compact tabs, so long copy is never trapped.
    snap = innerHeight >= 760 && !reducedMotion.matches && !paused;
    notebook.classList.toggle('is-snap-reel', snap);
    reelControls.hidden = !snap;
    if (snap) {
      const headerHeight = document.querySelector<HTMLElement>('.site-header')?.offsetHeight || 80;
      const tabHeight = controls.offsetHeight + parseFloat(getComputedStyle(controls).marginBottom);
      notebook.style.setProperty(
        '--reel-height',
        `${Math.max(400, innerHeight - headerHeight - 8 - tabHeight - reelControls.offsetHeight - 12)}px`,
      );
    }
    select(selected, false);
  }
  configureReel();
  addEventListener('resize', configureReel, { passive: true });
  document.addEventListener('waylan:motion-change', configureReel);
  reel.addEventListener(
    'scroll',
    () => {
      if (!snap || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const origin = panels[0].offsetTop;
        const nearest = panels.reduce(
          (best, panel, i) =>
            Math.abs(panel.offsetTop - origin - reel.scrollTop) <
            Math.abs(panels[best].offsetTop - origin - reel.scrollTop)
              ? i
              : best,
          0,
        );
        if (nearest !== selected) mark(nearest);
      });
    },
    { passive: true },
  );
  previous.addEventListener('click', () => select(selected - 1));
  next.addEventListener('click', () => select(selected + 1));
  reel.addEventListener('keydown', (event) => {
    if (event.target !== reel || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
      return;
    event.preventDefault();
    select(
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? panels.length - 1
          : selected + (event.key === 'ArrowDown' ? 1 : -1),
    );
  });
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(next);
      tabs[next].focus();
    });
  });
}

const countdown = document.querySelector<HTMLElement>('[data-countdown]');
if (countdown) {
  const target = countdown.dataset.departureAt;
  const digits = countdown.querySelector<HTMLElement>('[data-countdown-digits]')!;
  const status = countdown.querySelector<HTMLElement>('[data-countdown-status]')!;
  const units = [...digits.querySelectorAll<HTMLElement>('[data-countdown-unit]')];
  let timer: number | undefined;
  function update() {
    const remaining = getCountdown(target);
    if (!remaining) return;
    digits.hidden = remaining.departed;
    status.textContent = remaining.departed ? '已經出發，旅程開始！' : '距離出發還有';
    [remaining.days, remaining.hours, remaining.minutes, remaining.seconds].forEach((value, i) => {
      units[i].textContent = String(value).padStart(2, '0');
    });
    if (!remaining.departed && document.visibilityState === 'visible')
      timer = window.setTimeout(update, 1000);
  }
  function resume() {
    clearTimeout(timer);
    update();
  }
  document.addEventListener('visibilitychange', resume);
  addEventListener('pagehide', () => clearTimeout(timer));
  addEventListener('pageshow', resume);
  update();
}
