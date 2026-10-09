export {};
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const enabled = () => !reduce.matches && root.dataset.storyMotion !== 'paused';
const clamp = (value: number, max = 1) => Math.max(0, Math.min(max, value));
const header = document.querySelector<HTMLElement>('.site-header');
const hero = document.querySelector<HTMLElement>('.storybook-hero');
const doodles = [...document.querySelectorAll<HTMLElement>('.heading-doodle')];
const archives = [...document.querySelectorAll<HTMLElement>('[data-horizontal-scroll]')];
type Archive = {
  stage: HTMLElement;
  sticky: HTMLElement;
  viewport: HTMLElement;
  track: HTMLElement;
  cards: HTMLElement[];
  controls: HTMLElement;
  previous: HTMLButtonElement;
  next: HTMLButtonElement;
  count: HTMLElement;
  distance: number;
  pinned: boolean;
  current: number;
};
const rails: Archive[] = archives.map((stage) => ({
  stage,
  sticky: stage.querySelector<HTMLElement>('.archive-sticky')!,
  viewport: stage.querySelector<HTMLElement>('.archive-viewport')!,
  track: stage.querySelector<HTMLElement>('.story-archive')!,
  cards: [...stage.querySelectorAll<HTMLElement>('.archive-card')],
  controls: stage.querySelector<HTMLElement>('[data-archive-controls]')!,
  previous: stage.querySelector<HTMLButtonElement>('[data-archive-prev]')!,
  next: stage.querySelector<HTMLButtonElement>('[data-archive-next]')!,
  count: stage.querySelector<HTMLElement>('[data-archive-count]')!,
  distance: 0,
  pinned: false,
  current: -1,
}));
let frame = 0;
let stickyOffset = 96;

function mark(rail: Archive, progress: number) {
  const index = Math.round(progress * (rail.cards.length - 1));
  rail.stage.style.setProperty('--archive-progress', String(progress));
  rail.stage.dataset.scrollProgress = progress.toFixed(4);
  if (index === rail.current) return;
  rail.current = index;
  rail.count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(rail.cards.length).padStart(2, '0')}`;
  rail.previous.disabled = index === 0;
  rail.next.disabled = index === rail.cards.length - 1;
}

function update() {
  frame = 0;
  if (!enabled() || document.visibilityState !== 'visible') return;
  // Direct scroll-to-transform mapping: no easing loop continues after scrolling stops.
  if (hero) {
    const travel = clamp(stickyOffset - hero.getBoundingClientRect().top, 520);
    hero.style.setProperty('--sky-y', `${-(travel * 0.07).toFixed(2)}px`);
    hero.style.setProperty('--desk-y', `${-(travel * 0.16).toFixed(2)}px`);
    hero.style.setProperty('--sticker-turn', `${(6 - travel * 0.025).toFixed(2)}deg`);
  }
  for (const doodle of doodles) {
    const progress = clamp((innerHeight - doodle.getBoundingClientRect().top) / innerHeight);
    doodle.style.setProperty('--doodle-turn', `${(-20 + progress * 70).toFixed(2)}deg`);
  }
  for (const rail of rails) {
    if (!rail.distance) continue;
    const progress = rail.pinned
      ? clamp((stickyOffset - rail.stage.getBoundingClientRect().top) / rail.distance)
      : clamp(rail.viewport.scrollLeft / rail.distance);
    if (rail.pinned)
      rail.track.style.transform = `translate3d(${(-progress * rail.distance).toFixed(2)}px, 0, 0)`;
    mark(rail, progress);
  }
}
function schedule() {
  if (!frame && enabled() && document.visibilityState === 'visible')
    frame = requestAnimationFrame(update);
}

function configure() {
  if (document.visibilityState !== 'visible') return;
  stickyOffset = (header?.offsetHeight || 80) + 16;
  root.style.setProperty('--sticky-top', `${stickyOffset}px`);
  for (const rail of rails) {
    const active = enabled();
    rail.stage.classList.toggle('has-horizontal-scroll', active);
    rail.stage.classList.remove('is-pinned', 'is-native-rail');
    rail.stage.style.removeProperty('height');
    rail.track.style.removeProperty('transform');
    rail.controls.hidden = !active;
    rail.distance = active ? Math.max(0, rail.track.scrollWidth - rail.viewport.clientWidth) : 0;
    rail.pinned =
      active && rail.distance > 0 && rail.sticky.offsetHeight <= innerHeight - stickyOffset - 12;
    if (rail.pinned) {
      rail.stage.classList.add('is-pinned');
      rail.stage.style.height = `${rail.sticky.offsetHeight + rail.distance}px`;
      rail.viewport.scrollLeft = 0;
    } else if (active) rail.stage.classList.add('is-native-rail');
    rail.current = -1;
    mark(rail, 0);
  }
  if (!enabled()) {
    hero?.style.removeProperty('--sky-y');
    hero?.style.removeProperty('--desk-y');
    hero?.style.removeProperty('--sticker-turn');
    doodles.forEach((doodle) => doodle.style.removeProperty('--doodle-turn'));
  }
  schedule();
}

function navigate(rail: Archive, index: number, smooth = true) {
  const progress = clamp(index, rail.cards.length - 1) / Math.max(1, rail.cards.length - 1);
  const behavior = smooth && enabled() ? 'smooth' : 'instant';
  if (rail.pinned) {
    rail.viewport.scrollLeft = 0;
    window.scrollTo({
      top:
        scrollY + rail.stage.getBoundingClientRect().top - stickyOffset + progress * rail.distance,
      behavior,
    });
  } else rail.viewport.scrollTo({ left: progress * rail.distance, behavior });
}
for (const rail of rails) {
  rail.previous.addEventListener('click', () => navigate(rail, rail.current - 1));
  rail.next.addEventListener('click', () => navigate(rail, rail.current + 1));
  rail.viewport.addEventListener('scroll', schedule, { passive: true });
  rail.viewport.addEventListener('keydown', (event) => {
    if (
      event.target !== rail.viewport ||
      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
    )
      return;
    event.preventDefault();
    navigate(
      rail,
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? rail.cards.length - 1
          : rail.current + (event.key === 'ArrowRight' ? 1 : -1),
    );
  });
  rail.cards.forEach((card, index) =>
    card.addEventListener('focusin', () => {
      if (enabled() && rail.pinned) navigate(rail, index, false);
    }),
  );
}
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', configure, { passive: true });
addEventListener('pageshow', configure);
document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(frame);
  frame = 0;
  if (document.visibilityState === 'visible') schedule();
});
document.addEventListener('waylan:motion-change', configure);
// Images, font substitution and responsive copy can change the pinned stage height.
const observer = new ResizeObserver(configure);
rails.forEach((rail) => observer.observe(rail.sticky));
configure();
